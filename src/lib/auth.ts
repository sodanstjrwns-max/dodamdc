import type { Context } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Env, SessionUser, StaffPrincipal } from './types'

const enc = new TextEncoder()

function b64url(buf: ArrayBuffer | Uint8Array) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function unb64url(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  const bin = atob(s)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
}

export async function signToken(secret: string, payload: Record<string, unknown>, ttlSec: number) {
  const body = b64url(enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSec })))
  const sig = await hmac(secret, body)
  return `${body}.${sig}`
}

export async function verifyToken<T = any>(secret: string, token?: string): Promise<T | null> {
  if (!token || token.length > 4096 || token.split('.').length !== 2) return null
  const [body, sig] = token.split('.')
  const expect = await hmac(secret, body)
  if (sig.length !== expect.length) return null
  // constant-time compare
  let diff = 0
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expect.charCodeAt(i)
  if (diff) return null
  try {
    const data = JSON.parse(new TextDecoder().decode(unb64url(body)))
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null
    return data as T
  } catch {
    return null
  }
}

// ── 비밀번호 (PBKDF2-SHA256) ─────────────────────────────
export async function hashPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256)
  return `pbkdf2$100000$${b64url(salt)}$${b64url(bits)}`
}

export async function verifyPassword(pw: string, stored?: string | null) {
  if (!stored || !/^pbkdf2\$100000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(stored) || pw.length > 128) return false
  const [, iter, saltB, hashB] = stored.split('$')
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64url(saltB), iterations: Number(iter) }, key, 256)
  return b64url(bits) === hashB
}

// ── 세션 쿠키 ────────────────────────────────────────────
const MEMBER_COOKIE = 'dd_session'
const ADMIN_COOKIE = 'dd_admin'
const MEMBER_TTL = 60 * 60 * 24 * 30 // 30일
const ADMIN_TTL = 60 * 60 * 24 // 24시간

function secure(c: Context<Env>) {
  return new URL(c.req.url).protocol === 'https:'
}

export async function setMemberSession(c: Context<Env>, user: SessionUser) {
  const row = await c.env.DB.prepare('SELECT session_version FROM users WHERE id=?').bind(user.id).first<{ session_version: number }>()
  if (!row) throw new Error('Member no longer exists')
  const token = await signToken(c.env.SESSION_SECRET, { kind: 'member', uid: user.id, version: row.session_version }, MEMBER_TTL)
  setCookie(c, MEMBER_COOKIE, token, { httpOnly: true, sameSite: 'Lax', secure: secure(c), path: '/', maxAge: MEMBER_TTL })
}
export function clearMemberSession(c: Context<Env>) {
  deleteCookie(c, MEMBER_COOKIE, { path: '/' })
}
export async function readMemberSession(c: Context<Env>): Promise<SessionUser | null> {
  const token = getCookie(c, MEMBER_COOKIE)
  if (!token) return null
  const data = await verifyToken(c.env.SESSION_SECRET, token)
  if (data?.kind !== 'member' || !Number.isSafeInteger(data.uid)) return null
  const row = await c.env.DB.prepare('SELECT id,email,name,role,session_version FROM users WHERE id=?').bind(data.uid).first<any>()
  if (!row || row.session_version !== data.version) return null
  return { id: row.id, email: row.email, name: row.name, role: row.role === 'admin' ? 'admin' : 'member' }
}

export async function setAdminSession(c: Context<Env>, staff: StaffPrincipal) {
  const token = await signToken(c.env.SESSION_SECRET, { kind: 'staff', sid: staff.id, version: staff.version, bootstrap: !!staff.bootstrap }, staff.bootstrap ? 900 : ADMIN_TTL)
  setCookie(c, ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'Strict', secure: secure(c), path: '/', maxAge: ADMIN_TTL })
}
export function clearAdminSession(c: Context<Env>) {
  deleteCookie(c, ADMIN_COOKIE, { path: '/' })
}
export async function readAdminSession(c: Context<Env>): Promise<StaffPrincipal | null> {
  const token = getCookie(c, ADMIN_COOKIE)
  if (!token) return null
  const data = await verifyToken(c.env.SESSION_SECRET, token)
  if (data?.kind !== 'staff') return null
  if (data.bootstrap && data.sid === null) {
    const row = await c.env.DB.prepare('SELECT COUNT(*) n FROM staff').first<{ n: number }>()
    return row?.n === 0 ? { id: null, login: 'bootstrap', name: '최초 설정', role: 'owner', version: 0, bootstrap: true } : null
  }
  if (!Number.isSafeInteger(data.sid)) return null
  const row = await c.env.DB.prepare('SELECT id,login,name,role,active,session_version FROM staff WHERE id=?').bind(data.sid).first<any>()
  return row?.active && row.session_version === data.version ? { id: row.id, login: row.login, name: row.name, role: row.role, version: row.session_version } : null
}

// ── OAuth state (짧은 수명) ───────────────────────────────
export async function makeState(secret: string, next: string) {
  return signToken(secret, { n: next, r: b64url(crypto.getRandomValues(new Uint8Array(8))) }, 600)
}
export async function readState(secret: string, state?: string) {
  return verifyToken<{ n: string }>(secret, state)
}

export const isBot = (ua = '') =>
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|gtmetrix|yeti|daum|bingpreview|curl|wget|python-requests/i.test(ua)
