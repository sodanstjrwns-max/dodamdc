import type { Context } from 'hono'
import type { Env } from './types'
import { clinicDefaults, type Clinic } from '../data/clinic'

// ---- site_settings: 기본정보 한 곳 수정 → 전체 반영 ----
export const SETTING_KEYS: { key: string; label: string; path: string; type?: 'text' | 'textarea' }[] = [
  { key: 'name', label: '병원명', path: 'name' },
  { key: 'shortName', label: '병원 약칭', path: 'shortName' },
  { key: 'slogan', label: '슬로건', path: 'slogan' },
  { key: 'mission', label: '미션 문장', path: 'mission', type: 'textarea' },
  { key: 'phone', label: '대표 전화', path: 'phone' },
  { key: 'address', label: '주소', path: 'address' },
  { key: 'addressShort', label: '짧은 주소', path: 'addressShort' },
  { key: 'hoursNote', label: '진료시간 비고', path: 'hoursNote' },
  { key: 'directions.subway', label: '지하철 안내', path: 'directions.subway' },
  { key: 'directions.bus', label: '버스 안내', path: 'directions.bus' },
  { key: 'directions.parking', label: '주차 안내', path: 'directions.parking', type: 'textarea' },
  { key: 'channels.naverPlace', label: '네이버 플레이스 URL', path: 'channels.naverPlace' },
  { key: 'channels.naverBlog', label: '네이버 블로그 URL', path: 'channels.naverBlog' },
  { key: 'channels.instagram', label: '인스타그램 URL', path: 'channels.instagram' },
  { key: 'channels.kakao', label: '카카오톡 채널 URL', path: 'channels.kakao' },
  { key: 'reviews.count', label: '네이버 리뷰 개수', path: 'reviews.count' },
  { key: 'reviews.asOf', label: '리뷰 기준 시점', path: 'reviews.asOf' },
  { key: 'email', label: '대표 이메일', path: 'email' },
  { key: 'ga4', label: 'GA4 측정 ID (G-XXXX)', path: 'ga4' },
  { key: 'gsc', label: 'Google Search Console 인증 메타', path: 'gsc' },
  { key: 'naverVerify', label: '네이버 서치어드바이저 인증 메타', path: 'naverVerify' },
]

function setPath(obj: any, path: string, value: string) {
  const parts = path.split('.')
  let o = obj
  for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]] ??= {}
  const last = parts[parts.length - 1]
  o[last] = typeof o[last] === 'number' ? Number(value) || 0 : value
}

export async function loadClinic(db: D1Database | undefined): Promise<Clinic & { ga4?: string; gsc?: string; naverVerify?: string }> {
  const base: any = JSON.parse(JSON.stringify(clinicDefaults))
  if (!db) return base
  try {
    const { results } = await db.prepare('SELECT key, value FROM site_settings').all<{ key: string; value: string }>()
    for (const r of results || []) {
      const def = SETTING_KEYS.find((k) => k.key === r.key)
      if (def && r.value != null && r.value !== '') setPath(base, def.path, r.value)
    }
  } catch {
    /* 테이블 없을 때(마이그레이션 전) 기본값 */
  }
  return base
}

export async function saveSettings(db: D1Database, data: Record<string, string>) {
  const stmts = Object.entries(data)
    .filter(([k]) => SETTING_KEYS.some((s) => s.key === k))
    .map(([k, v]) => db.prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP').bind(k, v))
  if (stmts.length) await db.batch(stmts)
}

// ---- 조회수 (봇 제외) ----
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse|headless|curl|wget|python-requests|gptbot|claude|anthropic|perplexity|bingpreview|yeti|daum|naverbot|semrush|ahrefs/i
export const isBotUA = (ua: string | undefined) => !ua || BOT_RE.test(ua)

export async function trackView(c: Context<Env>, entityType: 'case' | 'column' | 'notice' | 'page', entityId: number | null, table?: 'cases' | 'columns' | 'notices') {
  const ua = c.req.header('user-agent') || ''
  const bot = isBotUA(ua)
  const db = c.env.DB
  if (!db) return
  try {
    const stmts = [db.prepare('INSERT INTO page_views (path, entity_type, entity_id, is_bot, ua) VALUES (?, ?, ?, ?, ?)').bind(new URL(c.req.url).pathname, entityType, entityId, bot ? 1 : 0, ua.slice(0, 200))]
    if (!bot && table && entityId) stmts.push(db.prepare(`UPDATE ${table} SET views = views + 1 WHERE id = ?`).bind(entityId))
    c.executionCtx?.waitUntil ? c.executionCtx.waitUntil(db.batch(stmts)) : await db.batch(stmts)
  } catch {
    /* ignore */
  }
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || String(Date.now())

export const nowKST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')
export const fmtDate = (s?: string | null) => (s ? s.slice(0, 10).replace(/-/g, '.') : '')
