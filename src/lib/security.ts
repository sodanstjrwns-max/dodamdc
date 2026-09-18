import type { Context, MiddlewareHandler } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { getCookie, setCookie } from 'hono/cookie'
import { signToken, verifyToken } from './auth'
import type { Env, StaffPrincipal } from './types'

const enc = new TextEncoder()
export async function keyedHash(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value))), x => x.toString(16).padStart(2, '0')).join('')
}
export const requestLimit: MiddlewareHandler<Env> = async (c, next) => {
  const upload = /^\/admin\/(api\/upload|cases|columns|notices)(\/|$)/.test(c.req.path)
  return bodyLimit({ maxSize: upload ? 34 * 1024 * 1024 : 64 * 1024, onError: ctx => ctx.text('요청 크기가 너무 큽니다.', 413) })(c, next)
}
export const requestSecurity: MiddlewareHandler<Env> = async (c, next) => {
  const path = c.req.path
  const protectedPage = /^\/(admin|auth)(\/|$)/.test(path) || path === '/reservation' || path.startsWith('/files/')
  if (protectedPage) {
    c.header('Cache-Control', 'private, no-store')
    c.header('Referrer-Policy', 'no-referrer')
    c.header('X-Robots-Tag', 'noindex, nofollow')
  }
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)
  const origin = new URL(c.req.url).origin
  // Conversion API has its own origin-bound signed ticket and 2 KB limit.
  // AI chat API is stateless (no session/cookie effect), checks same-origin itself and is IP rate-limited.
  if (unsafe && path !== '/api/conversions' && path !== '/api/ai-chat') {
    if (c.req.header('origin') !== origin || (c.req.header('sec-fetch-site') && c.req.header('sec-fetch-site') !== 'same-origin')) return c.text('요청 출처를 확인할 수 없습니다. 같은 사이트에서 다시 시도해 주세요.', 403)
    if (!c.env?.SESSION_SECRET) return c.text('보안 설정을 확인해 주세요.', 503)
    let token = c.req.header('x-csrf-token') || ''
    if (!token && /^(application\/x-www-form-urlencoded|multipart\/form-data)/i.test(c.req.header('content-type') || '')) {
      try { token = String((await c.req.formData()).get('_csrf') || '') } catch { return c.text('잘못된 요청입니다.', 400) }
    }
    const csrf = await verifyToken(c.env.SESSION_SECRET, token)
    if (!csrf || csrf.kind !== 'csrf' || csrf.origin !== origin || csrf.seed !== getCookie(c, 'dd_csrf')) return c.text('보안 확인 시간이 지났습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.', 403)
  }
  await next()
  if (c.res.headers.get('content-type')?.includes('text/html') && c.env?.SESSION_SECRET) {
    // Operates only on our server-rendered forms; untrusted CMS forms are stripped.
    const source = await c.res.clone().text()
    if (!/<form\b[^>]*\bmethod=["']post["']/i.test(source)) { c.res = new Response(source, c.res); return }
    let seed = getCookie(c, 'dd_csrf')
    if (!seed || !/^[a-f0-9-]{36}$/.test(seed)) {
      seed = crypto.randomUUID()
      setCookie(c, 'dd_csrf', seed, { httpOnly: true, secure: origin.startsWith('https:'), sameSite: 'Strict', path: '/', maxAge: 28800 })
    }
    const token = await signToken(c.env.SESSION_SECRET, { kind: 'csrf', seed, origin }, 28800)
    const output = source.replace(/<form\b[^>]*>/gi, tag => /\bmethod=["']post["']/i.test(tag) ? `${tag}<input type="hidden" name="_csrf" value="${token}">` : tag)
      .replace('</head>', `<meta name="csrf-token" content="${token}"></head>`)
    const headers = new Headers(c.res.headers)
    headers.delete('Content-Length')
    headers.set('Cache-Control', 'private, no-store')
    c.res = new Response(output, { status: c.res.status, headers })
  }
}

// Atomic fixed-window budget. Only HMAC keys, count and expiry; no plaintext IP/login.
// Uses platform-controlled CF-Connecting-IP, never X-Forwarded-For.
export async function loginBudget(c: Context<Env>, area: string, login: string) {
  const db = c.env.DB, secret = c.env.SESSION_SECRET
  const bucket = Math.floor(Date.now() / 900000), expires = (bucket + 1) * 900
  const ip = c.req.header('cf-connecting-ip') || 'local-shared'
  const specs = [[`account:${login.slice(0, 254)}`, 10], [`address:${ip}`, 40]] as const
  await db.prepare('DELETE FROM security_rate_limits WHERE expires_at <= unixepoch()').run()
  for (const [subject, limit] of specs) {
    const key = await keyedHash(secret, `${area}:${bucket}:${subject}`)
    const row = await db.prepare('INSERT INTO security_rate_limits (key_hash,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key_hash) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(key, expires).first<{ attempts: number }>()
    if (!row || row.attempts > limit) { c.header('Retry-After', String(Math.max(1, expires - Math.floor(Date.now() / 1000)))); return false }
  }
  return true
}
export function canAccessStaff(staff: StaffPrincipal | null | undefined, path: string) {
  if (!staff) return false
  if (staff.bootstrap) return path === '/admin/staff' || path === '/admin/logout' || path === '/admin'
  if (staff.role === 'owner') return true
  if (path === '/admin' || path === '/admin/logout') return true
  if (staff.role === 'reception') return /^\/admin\/reservations(?:\/\d+)?$/.test(path) || /^\/admin\/(notifications$|api\/push\/)/.test(path)
  return /^\/admin\/(cases|columns|notices)(\/|$)/.test(path) || path === '/admin/api/upload'
}
export const auditStatement = (db: D1Database, actor: number | null, action: string, target: number | null, detail: object = {}) =>
  db.prepare('INSERT INTO staff_audit (actor_id,action,target_id,detail) VALUES (?,?,?,?)').bind(actor, action, target, JSON.stringify(detail))
