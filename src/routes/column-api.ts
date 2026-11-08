// 칼럼 자동 등록 API (2026-11-08, 한휘림 원장 요청)
// 원장님 쪽 프로그램이 관리자 화면 로그인 없이 칼럼을 올리기 위한 전용 통로.
//   인증: Authorization: Bearer <COLUMN_API_KEY>  (Pages 시크릿, 쿠키·세션 없음 → CSRF 검사 대상 아님)
//   POST /api/v1/images          multipart 'file' 1장 → { url } (본문 <img src> 또는 thumbnail 에 그대로 사용)
//   POST /api/v1/columns         JSON → 칼럼 생성 (즉시 공개 / 예약 발행 / 임시 저장)
//   GET  /api/v1/columns         최근 칼럼 상태 목록
//   GET  /api/v1/columns/:id     칼럼 1편 상태
// 본문은 관리자 에디터와 같은 sanitizeArticle 을 거친다. 외부 이미지 주소는 지워지므로 먼저 /api/v1/images 로 올린다.
// 작성자는 관리자와 같은 원칙: 지정하지 않으면 병원 발행('clinic'). 원장 이름으로 올리려면 author_slug 를 명시한다.
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { sanitizeArticle, checkedImage, safeFileKey } from '../lib/content-safety'
import { slugify, stripTags } from '../lib/util'
import { isoDate } from '../lib/seo'
import { pingLater } from '../lib/indexnow'
import { getDoctor } from '../data/doctors'
import { getTreatment } from '../data/treatments'
import { CLINIC_AUTHOR_SLUG } from '../lib/authorship'
import { auditStatement } from '../lib/security'

const api = new Hono<Env>()
const DAILY_CREATE_LIMIT = 20
const enc = new TextEncoder()

const fail = (c: Context<Env>, status: 400 | 401 | 404 | 409 | 413 | 429 | 503, code: string, message: string) =>
  c.json({ ok: false, error: { code, message } }, status)

async function sameSecret(a: string, b: string) {
  const [x, y] = await Promise.all([a, b].map(v => crypto.subtle.digest('SHA-256', enc.encode(v))))
  const ax = new Uint8Array(x), by = new Uint8Array(y)
  let diff = 0
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ by[i]
  return diff === 0
}

api.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store')
  c.header('X-Robots-Tag', 'noindex, nofollow')
  const key = c.env.COLUMN_API_KEY
  if (!key || key.length < 32) return fail(c, 503, 'api_disabled', '칼럼 API 키가 설정되지 않았습니다.')
  const given = (c.req.header('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!given || !(await sameSecret(given, key))) return fail(c, 401, 'unauthorized', '인증키가 올바르지 않습니다.')
  await next()
})

// UTC 'YYYY-MM-DD HH:MM:SS' (D1 CURRENT_TIMESTAMP 와 같은 형식)
const toDb = (iso: string) => iso.slice(0, 19).replace('T', ' ')
const toKst = (db?: string | null) => {
  const iso = isoDate(db)
  if (!iso || iso.length <= 10) return iso || null
  return new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 19) + '+09:00'
}
/** 시간대 없는 값은 한국시간으로 본다. 'YYYY-MM-DD HH:MM' / ISO 8601 모두 허용. */
function parsePublishAt(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  let text = String(value).trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(text)) text += '+09:00'
  const iso = /T/.test(text) ? isoDate(text) : undefined
  if (!iso) throw new Error('publish_at 형식을 확인해 주세요. 예: 2026-11-10T09:00:00+09:00')
  return iso
}
const statusOf = (r: any) => r.published ? 'published' : r.scheduled_at ? 'scheduled' : 'draft'
const view = (c: Context<Env>, r: any) => ({
  id: r.id, slug: r.slug, title: r.title, status: statusOf(r),
  url: `${c.get('siteUrl')}/column/${r.slug}`,
  published_at: toKst(r.published_at), scheduled_at: toKst(r.scheduled_at),
  author_slug: r.author_slug, treatment_slug: r.treatment_slug,
})
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim()).slice(0, max)
const imageKeyFromUrl = (v: string) => v.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/files\//, '')

api.post('/images', async (c) => {
  let file: unknown
  try { file = (await c.req.formData()).get('file') } catch { return fail(c, 400, 'bad_request', "multipart/form-data 의 'file' 필드로 이미지를 보내 주세요.") }
  if (!(file instanceof File) || !file.size) return fail(c, 400, 'bad_request', "multipart/form-data 의 'file' 필드로 이미지를 보내 주세요.")
  try {
    const { bytes, type, ext } = await checkedImage(file)
    const key = `columns/${Date.now()}-${crypto.randomUUID()}.${ext}`
    await c.env.R2.put(key, bytes, { httpMetadata: { contentType: type } })
    try { await c.env.DB.prepare('INSERT INTO uploads (key,filename,content_type,size) VALUES (?,?,?,?)').bind(key, key.split('/').pop(), type, file.size).run() }
    catch (error) { await c.env.R2.delete(key); throw error }
    return c.json({ ok: true, url: `/files/${key}`, key }, 201)
  } catch (e: any) { return fail(c, 400, 'invalid_image', e?.message || '이미지를 확인해 주세요.') }
})

api.post('/columns', async (c) => {
  let b: any
  try { b = await c.req.json() } catch { return fail(c, 400, 'bad_request', 'JSON 본문(Content-Type: application/json)으로 보내 주세요.') }
  if (!b || typeof b !== 'object') return fail(c, 400, 'bad_request', 'JSON 객체로 보내 주세요.')
  const title = str(b.title, 200)
  const rawContent = typeof b.content_html === 'string' ? b.content_html : ''
  if (rawContent.length > 200000) return fail(c, 413, 'too_large', '본문이 너무 깁니다(20만 자 이하).')
  // 허용되지 않은 주소의 이미지는 정화 단계에서 src 만 지워지므로 빈 <img> 태그째 뺀다.
  const content = sanitizeArticle(rawContent).replace(/<img\b(?![^>]*\bsrc=)[^>]*>/gi, '')
  if (!title || title.length > 80) return fail(c, 400, 'invalid_title', '제목은 1~80자로 입력해 주세요.')
  if (stripTags(content).length < 20) return fail(c, 400, 'invalid_content', '본문(content_html)은 글자 20자 이상이어야 합니다.')
  const droppedImages = (rawContent.match(/<img\b/gi) || []).length - (content.match(/<img\b/gi) || []).length

  const author = str(b.author_slug, 40) || CLINIC_AUTHOR_SLUG
  if (author !== CLINIC_AUTHOR_SLUG && !getDoctor(author)) return fail(c, 400, 'invalid_author', `author_slug 는 '${CLINIC_AUTHOR_SLUG}' 또는 의료진 slug(예: han-hwirim) 여야 합니다.`)
  const treatment = str(b.treatment_slug, 60) || null
  if (treatment && !getTreatment(treatment)) return fail(c, 400, 'invalid_treatment', '알 수 없는 treatment_slug 입니다.')

  let thumb: string | null = null
  if (b.thumbnail) {
    const k = imageKeyFromUrl(str(b.thumbnail, 300))
    if (!safeFileKey(k) || !k.startsWith('columns/')) return fail(c, 400, 'invalid_thumbnail', 'thumbnail 은 /api/v1/images 로 올린 이미지 url 이어야 합니다.')
    const known = await c.env.DB.prepare('SELECT key FROM uploads WHERE key=?').bind(k).first()
    if (!known) return fail(c, 400, 'invalid_thumbnail', '올라간 적 없는 thumbnail 이미지입니다.')
    thumb = k
  }

  let publishAt: string | undefined
  try { publishAt = parsePublishAt(b.publish_at) } catch (e: any) { return fail(c, 400, 'invalid_publish_at', e.message) }
  const wantDraft = b.status === 'draft' || b.published === false
  const now = Date.now()
  const future = publishAt && new Date(publishAt).getTime() > now + 60e3
  const published = wantDraft || future ? 0 : 1
  const scheduledAt = !wantDraft && future ? toDb(publishAt!) : null
  const publishedAt = toDb(publishAt || new Date(now).toISOString())

  // 재전송으로 같은 글이 두 번 올라가는 것 방지 (최근 7일 같은 제목)
  const dup = await c.env.DB.prepare("SELECT id,slug FROM columns WHERE title=? AND COALESCE(scheduled_at,published_at) >= datetime('now','-7 days') LIMIT 1").bind(title).first<any>()
  if (dup) return c.json({ ok: false, error: { code: 'duplicate', message: '최근 7일 안에 같은 제목의 칼럼이 있습니다.' }, id: dup.id, slug: dup.slug }, 409)
  const today = await c.env.DB.prepare("SELECT COUNT(*) n FROM staff_audit WHERE action='api.column-create' AND created_at >= datetime('now','-1 day')").first<any>()
  if ((today?.n || 0) >= DAILY_CREATE_LIMIT) return fail(c, 429, 'rate_limited', `하루 ${DAILY_CREATE_LIMIT}편까지 등록할 수 있습니다.`)

  let slug = str(b.slug, 120) ? slugify(str(b.slug, 120)) : (/^[\x00-\x7F]+$/.test(title) ? slugify(title) : '')
  if (!slug) slug = `column-${new Date(now + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 4)}`
  if (await c.env.DB.prepare('SELECT id FROM columns WHERE slug=?').bind(slug).first()) slug = `${slug}-${crypto.randomUUID().slice(0, 4)}`

  const tags = Array.isArray(b.tags) ? b.tags.map((t: unknown) => str(t, 30)).filter(Boolean).join(',') : str(b.tags, 300)
  const excerpt = str(b.excerpt, 300) || stripTags(content).slice(0, 150)
  const res = await c.env.DB.prepare('INSERT INTO columns (slug,title,excerpt,content_html,thumbnail,author_slug,treatment_slug,meta_title,meta_description,tags,published,published_at,scheduled_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *')
    .bind(slug, title, excerpt, content, thumb, author, treatment, str(b.meta_title, 120) || null, str(b.meta_description, 300) || null, tags || null, published, scheduledAt ? scheduledAt : publishedAt, scheduledAt).first<any>()
  try { await auditStatement(c.env.DB, null, 'api.column-create', res.id, { slug, status: statusOf(res) }).run() } catch { /* 감사 기록 실패는 등록을 막지 않음 */ }
  if (published) pingLater(c, [`/column/${slug}`, '/column', treatment ? `/treatments/${treatment}` : '', '/sitemap.xml'])
  return c.json({ ok: true, column: view(c, res), ...(droppedImages > 0 ? { warnings: [`허용되지 않는 이미지 ${droppedImages}개가 본문에서 제거되었습니다. 이미지는 /api/v1/images 로 먼저 올려 주세요.`] } : {}) }, 201)
})

api.get('/columns', async (c) => {
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit')) || 20))
  const rows = (await c.env.DB.prepare('SELECT id,slug,title,published,published_at,scheduled_at,author_slug,treatment_slug FROM columns ORDER BY COALESCE(scheduled_at,published_at) DESC LIMIT ?').bind(limit).all<any>()).results || []
  return c.json({ ok: true, columns: rows.map(r => view(c, r)) })
})
api.get('/columns/:id{[0-9]+}', async (c) => {
  const r = await c.env.DB.prepare('SELECT id,slug,title,published,published_at,scheduled_at,author_slug,treatment_slug FROM columns WHERE id=?').bind(c.req.param('id')).first<any>()
  return r ? c.json({ ok: true, column: view(c, r) }) : fail(c, 404, 'not_found', '칼럼을 찾을 수 없습니다.')
})
api.all('*', (c) => fail(c, 404, 'not_found', '없는 API 경로입니다.'))

// ── 예약 발행: 공개 요청이 들어올 때 시각이 지난 예약 칼럼을 공개로 바꾼다 (isolate 당 1분에 1번) ──
let lastPublishCheck = 0
export async function publishDueColumns(c: Context<Env>) {
  if (Date.now() - lastPublishCheck < 60e3 || !c.env?.DB) return
  lastPublishCheck = Date.now()
  try {
    const due = (await c.env.DB.prepare("UPDATE columns SET published=1, published_at=scheduled_at, scheduled_at=NULL, updated_at=CURRENT_TIMESTAMP WHERE published=0 AND scheduled_at IS NOT NULL AND scheduled_at <= datetime('now') RETURNING slug, treatment_slug").all<any>()).results || []
    if (due.length) pingLater(c, [...due.flatMap(r => [`/column/${r.slug}`, r.treatment_slug ? `/treatments/${r.treatment_slug}` : '']), '/column', '/sitemap.xml'])
  } catch { /* 마이그레이션 전 미리보기 등 */ }
}

export default api
