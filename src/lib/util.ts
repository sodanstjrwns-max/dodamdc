import type { Context } from 'hono'
import type { Env } from './types'
import { isBot } from './auth'

export const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80) || String(Date.now())

export const fmtDate = (s?: string | null) => (s ? String(s).slice(0, 10).replace(/-/g, '.') : '')
export const nowKST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ')
export const stripTags = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

// 조회수 기록 (봇 제외) — page_views 로그 + 엔티티 views 증가
export async function trackView(c: Context<Env>, entityType: 'case' | 'column' | 'notice' | 'page', entityId: number | null, table?: 'cases' | 'columns' | 'notices') {
  const db = c.env.DB
  if (!db) return
  const ua = c.req.header('user-agent') || ''
  const bot = isBot(ua) || !ua
  try {
    const stmts = [db.prepare('INSERT INTO page_views (path, entity_type, entity_id, is_bot, ua) VALUES (?, ?, ?, ?, ?)').bind(new URL(c.req.url).pathname, entityType, entityId, bot ? 1 : 0, ua.slice(0, 200))]
    if (!bot && table && entityId) stmts.push(db.prepare(`UPDATE ${table} SET views = views + 1 WHERE id = ?`).bind(entityId))
    const p = db.batch(stmts)
    if (c.executionCtx && typeof c.executionCtx.waitUntil === 'function') c.executionCtx.waitUntil(p)
    else await p
  } catch { /* ignore */ }
}

// 간단 폼 파서
export async function formData(c: Context<Env>) {
  const ct = c.req.header('content-type') || ''
  if (ct.includes('application/json')) return (await c.req.json()) as Record<string, any>
  const fd = await c.req.formData()
  const o: Record<string, any> = {}
  fd.forEach((v, k) => { if (typeof v === 'string') o[k] = v.trim(); else o[k] = v })
  return o
}
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
export const normPhone = (s: string) => s.replace(/[^\d]/g, '').replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, '$1-$2-$3')
