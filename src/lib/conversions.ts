import { Hono } from 'hono'
import { html } from 'hono/html'
import { bodyLimit } from 'hono/body-limit'
import type { Context } from 'hono'
import type { Env } from './types'
import { isBot, signToken, verifyToken } from './auth'
import { treatments } from '../data/treatments'

export const eventLabels: Record<string, string> = {
  naver_click: '네이버 예약 클릭', phone_click: '전화 클릭', kakao_click: '카카오 상담 클릭',
  reservation_click: '홈페이지 신청 화면 이동', form_completed: '홈페이지 신청 접수 완료',
}
export const locationLabels: Record<string, string> = {
  header: '상단', mobile_menu: '모바일 메뉴', mobile_bar: '모바일 하단', floating: '플로팅',
  footer: '푸터', hero: '진료 상단', reading_nav: '진료 목차', sidebar: '진료 사이드',
  consultation: '상담 질문', cta_strip: '공통 안내', home: '메인 본문', reservation: '예약 본문',
  content: '본문', form: '신청 저장',
}
const pages = new Set(['/', '/first-visit', '/mission', '/doctors', '/floor-guide', '/directions', '/hours', '/pricing', '/faq', '/treatments', '/reservation', '/column', '/notice', '/encyclopedia', '/area', '/cases/gallery', '/privacy', '/terms', '/sitemap', '/doctors/han-hwirim', ...treatments.map(t => `/treatments/${t.slug}`)])
export function conversionPage(path: string) {
  if (pages.has(path)) return path
  for (const root of ['/area', '/column', '/notice', '/encyclopedia', '/cases/gallery']) {
    if (path.startsWith(root + '/')) return root // Never store arbitrary CMS slugs or geographic combinations.
  }
  return ''
}
export function conversionScope(c: Context<Env>): 'production' | 'preview' | null {
  const ua = c.req.header('user-agent') || ''
  if (!ua || isBot(ua) || c.get('admin') || c.req.header('dnt') === '1' || c.req.header('sec-gpc') === '1') return null
  return new URL(c.req.url).origin === c.get('siteUrl') ? 'production' : 'preview'
}
export async function conversionMeta(c: Context<Env>, path: string) {
  const page = conversionPage(path), scope = conversionScope(c)
  if (!page || !scope || !c.env?.SESSION_SECRET || c.req.method !== 'GET' || c.res.status >= 400) return ''
  // Per-render random ticket: no visitor/session/patient identifier, no cookies.
  const ticket = await signToken(c.env.SESSION_SECRET, { kind: 'conversion', page, origin: new URL(c.req.url).origin, scope, nonce: crypto.randomUUID() }, 1800)
  return html`<meta name="conversion-ticket" content="${ticket}">`
}
export function conversionStatement(db: D1Database, scope: string, page: string, event: string, location: string, deduplicate = false) {
  return db.prepare(`INSERT INTO conversion_daily (day, scope, page, event, location, count)
    SELECT date('now','+9 hours'), ?, ?, ?, ?, 1 ${deduplicate ? 'WHERE changes() = 1' : ''}
    ON CONFLICT(day, scope, page, event, location) DO UPDATE SET count=count+1`).bind(scope, page, event, location)
}
export async function cleanupConversions(db: D1Database) {
  await db.batch([
    db.prepare("DELETE FROM conversion_receipts WHERE expires_at <= unixepoch()"),
    db.prepare("DELETE FROM conversion_daily WHERE day < date('now','+9 hours','-89 days')"),
  ])
}

const conversions = new Hono<Env>()
conversions.use('/api/conversions', bodyLimit({ maxSize: 2048, onError: c => c.json({ error: 'payload too large' }, 413) }))
conversions.post('/api/conversions', async c => {
  c.header('Cache-Control', 'no-store')
  const origin = new URL(c.req.url).origin
  if (c.req.header('origin') !== origin || !['same-origin', undefined].includes(c.req.header('sec-fetch-site'))) return c.json({ error: 'origin' }, 403)
  if (!(c.req.header('content-type') || '').startsWith('application/json')) return c.json({ error: 'content type' }, 415)
  let input: any
  try { input = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }
  if (!input || Array.isArray(input) || Object.keys(input).sort().join(',') !== 'event,location,ticket' ||
    typeof input.event !== 'string' || typeof input.location !== 'string' ||
    !Object.hasOwn(eventLabels, input.event) || input.event === 'form_completed' ||
    !Object.hasOwn(locationLabels, input.location) || input.location === 'form' ||
    typeof input.ticket !== 'string' || input.ticket.length > 1400) return c.json({ error: 'invalid event' }, 400)
  const scope = conversionScope(c)
  if (!scope) return c.body(null, 204)
  if (!c.env?.SESSION_SECRET) return c.json({ error: 'unavailable' }, 503)
  const ticket = await verifyToken(c.env.SESSION_SECRET, input.ticket)
  if (!ticket || ticket.kind !== 'conversion' || !pages.has(ticket.page) || ticket.origin !== origin || ticket.scope !== scope || typeof ticket.nonce !== 'string') return c.json({ error: 'invalid ticket' }, 403)
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ticket.nonce}:${input.event}:${input.location}`))
  const receipt = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('')
  try {
    await cleanupConversions(c.env.DB)
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT OR IGNORE INTO conversion_receipts (receipt, expires_at) VALUES (?, ?)').bind(receipt, ticket.exp),
      conversionStatement(c.env.DB, scope, ticket.page, input.event, input.location, true),
    ])
  } catch { return c.json({ error: 'unavailable' }, 503) } // No payload or request headers in logs.
  return c.body(null, 204)
})
export default conversions
