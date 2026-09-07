import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './lib/types'
import { loadClinic } from './lib/settings'
import { readMemberSession, readAdminSession } from './lib/auth'
import { trackView } from './lib/util'
import { resolveSiteUrl, isoDate, xmlEscape } from './lib/seo'

import auth from './routes/auth'
import admin from './routes/admin'
import content from './routes/content'

import { homePage } from './pages/home'
import { treatmentsIndex, treatmentDetail } from './pages/treatments'
import { doctorsIndex, doctorDetail, missionPage, floorGuidePage } from './pages/about'
import {
  faqPage, encyclopediaIndex, encyclopediaTerm, directionsPage, hoursPage, pricingPage,
  areaPage, areaIndex, privacyPage, termsPage, sitemapHtml, notFoundPage
} from './pages/info'

import { treatments, getTreatment } from './data/treatments'
import { doctors, getDoctor } from './data/doctors'
import { terms, getTerm } from './data/encyclopedia'
import { areaPages, getAreaPage } from './data/areas'

const app = new Hono<Env>()

// ---------- Global middleware ----------
app.use('*', secureHeaders({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  xFrameOptions: 'SAMEORIGIN',
  referrerPolicy: 'strict-origin-when-cross-origin'
}))

app.use('*', async (c, next) => {
  const url = new URL(c.req.url)
  // static assets skip DB work
  if (url.pathname.startsWith('/static/') || /^\/(favicon|apple-touch)[^/]*\.png$/.test(url.pathname)) {
    return next()
  }
  const clinic = await loadClinic(c.env?.DB)
  c.set('clinic', clinic)
  const siteUrl = resolveSiteUrl(c.env?.SITE_URL)
  c.set('siteUrl', siteUrl)
  if (url.origin !== siteUrl || /^\/(admin|auth|api|health)(\/|$)/.test(url.pathname)) c.header('X-Robots-Tag', 'noindex, follow')
  // Normalize public trailing-slash duplicates, without redirecting POSTs or R2 keys.
  if ((c.req.method === 'GET' || c.req.method === 'HEAD') && url.pathname.length > 1 && url.pathname.endsWith('/') && !/^\/(files|api|auth|admin)(\/|$)/.test(url.pathname)) {
    return c.redirect(url.pathname.replace(/\/+$/, '') + url.search, 301)
  }
  c.set('nonce', crypto.randomUUID().replace(/-/g, ''))
  c.set('user', c.env?.SESSION_SECRET ? await readMemberSession(c) : null)
  c.set('admin', c.env?.SESSION_SECRET ? await readAdminSession(c) : false)
  await next()
  // page view tracking for public HTML GET responses
  if (c.req.method === 'GET' && c.res.status === 200 && (c.res.headers.get('content-type') || '').includes('text/html')
    && !url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth')) {
    try { await trackView(c, 'page', null) } catch {}
  }
})

// ---------- Sub apps ----------
app.route('/auth', auth)
app.route('/admin', admin)
app.route('/', content)

// ---------- Public pages ----------
app.get('/', (c) => homePage(c))
app.get('/mission', (c) => missionPage(c))
app.get('/floor-guide', (c) => floorGuidePage(c))

app.get('/doctors', (c) => doctorsIndex(c))
app.get('/doctors/:slug', (c) => {
  const d = getDoctor(c.req.param('slug'))
  return d ? doctorDetail(c, d) : notFoundPage(c)
})

app.get('/treatments', (c) => treatmentsIndex(c))
app.get('/treatments/:slug', (c) => {
  const t = getTreatment(c.req.param('slug'))
  return t ? treatmentDetail(c, t) : notFoundPage(c)
})

app.get('/faq', (c) => faqPage(c))
app.get('/encyclopedia', (c) => encyclopediaIndex(c))
app.get('/encyclopedia/:slug', (c) => {
  const t = getTerm(c.req.param('slug'))
  return t ? encyclopediaTerm(c, t) : notFoundPage(c)
})

app.get('/directions', (c) => directionsPage(c))
app.get('/hours', (c) => hoursPage(c))
app.get('/pricing', (c) => pricingPage(c))

app.get('/area', (c) => areaIndex(c))
app.get('/area/:slug', (c) => {
  const p = getAreaPage(c.req.param('slug'))
  return p ? areaPage(c, p) : notFoundPage(c)
})

app.get('/privacy', (c) => privacyPage(c))
app.get('/terms', (c) => termsPage(c))
app.get('/sitemap', (c) => sitemapHtml(c))

// legacy / convenience redirects
app.get('/about', (c) => c.redirect('/mission', 301))
app.get('/login', (c) => c.redirect('/auth/login', 301))
app.get('/register', (c) => c.redirect('/auth/register', 301))
app.get('/mypage', (c) => c.redirect('/auth/mypage', 301))
app.get('/cases', (c) => c.redirect('/cases/gallery', 301))

// ---------- SEO files ----------
app.get('/sitemap.xml', async (c) => {
  const site = c.get('siteUrl')
  const urls: { loc: string; lastmod?: string; pri: string; freq: string }[] = []
  const add = (path: string, pri = '0.6', freq = 'monthly', lastmod?: string) => urls.push({ loc: site + path, pri, freq, lastmod: isoDate(lastmod) })

  add('/', '1.0', 'weekly')
  for (const p of ['/mission', '/doctors', '/treatments', '/floor-guide', '/directions', '/hours', '/pricing', '/faq', '/encyclopedia', '/cases/gallery', '/column', '/notice', '/reservation']) add(p, '0.8', 'weekly')
  for (const d of doctors) add(`/doctors/${d.slug}`, '0.8')
  for (const t of treatments) add(`/treatments/${t.slug}`, '0.9', 'monthly')
  for (const a of areaPages) add(`/area/${a.slug}`, '0.6')
  for (const t of terms) add(`/encyclopedia/${t.slug}`, '0.4', 'yearly')
  try {
    const db = c.env.DB
    const [cases, cols, notes] = await Promise.all([
      db.prepare('SELECT slug, updated_at FROM cases WHERE published=1').all<any>(),
      db.prepare('SELECT slug, updated_at FROM columns WHERE published=1').all<any>(),
      db.prepare('SELECT id, updated_at FROM notices WHERE published=1').all<any>()
    ])
    for (const r of cases.results || []) add(`/cases/gallery/${r.slug}`, '0.6', 'monthly', String(r.updated_at || ''))
    for (const r of cols.results || []) add(`/column/${r.slug}`, '0.7', 'monthly', String(r.updated_at || ''))
    for (const r of notes.results || []) add(`/notice/${r.id}`, '0.4', 'monthly', String(r.updated_at || ''))
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
})

app.get('/robots.txt', (c) => {
  const site = c.get('siteUrl')
  // One shared group: specific bot groups would override (not inherit) these rules.
  // Search crawling and AI model training are different; no special AEO whitelist.
  const body = `# Crawl guidance, not authentication or an access-control mechanism.
User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth
Disallow: /api
Disallow: /files/cases/
Disallow: /health

Sitemap: ${site}/sitemap.xml
`
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=3600' })
})

app.get('/llms.txt', (c) => {
  const site = c.get('siteUrl')
  const clinic = c.get('clinic')
  const body = `# ${clinic.name}

> ${clinic.region}의 치과의원. ${doctors[0].name} 대표원장(${doctors[0].specialty})이 직접 진료합니다. ${clinic.slogan}

## 진료 원칙
- MTA 생활치수치료(VPT)·크라운으로 자연치아 보존 가능성을 먼저 살핍니다.
- 치주(잇몸)치료로 치아를 지탱하는 조직을 관리합니다.
- 보존이 어려운 경우 임플란트를 검토합니다. 모든 치아에 같은 치료가 가능한 것은 아닙니다.
- 치아교정·수면(진정) 진료·보톡스·필러는 시행하지 않습니다.

## 병원 정보
- 주소: ${clinic.address}
- 전화: ${clinic.phone}
- 진료시간: ${clinic.hours.map(h => `${h.day} ${h.open ? h.open + '–' + h.close : '휴진'}${h.lunch ? ' (점심 ' + h.lunch + ')' : ''}${h.note ? ' (' + h.note + ')' : ''}`).join(', ')}
- 참고: ${clinic.hoursNote}
- 주차: ${clinic.directions.parking}
- 예약은 신청 후 병원의 확인 연락을 거쳐 확정됩니다.

## 공식 안내와 근거 페이지
- [진료 철학](${site}/mission): ${clinic.slogan}
- [${doctors[0].name} 대표원장](${site}/doctors/${doctors[0].slug}): 자격·경력·진료 철학
${treatments.map(t => `- [${t.name}](${site}/treatments/${t.slug}): ${t.short}`).join('\n')}
- [질문과 답변](${site}/faq): 병원 이용 및 진료별 FAQ
- [치과 백과사전](${site}/encyclopedia): 용어 정의와 관련 진료
- [진료실·장비·감염관리](${site}/floor-guide)
- [비급여 진료비](${site}/pricing): 금액·조건·기준일은 해당 페이지 확인
- [오시는 길](${site}/directions)
- [진료시간](${site}/hours)
- [공지사항](${site}/notice): 임시 휴진 등 최신 변경 확인
- [원장 칼럼](${site}/column)
- [진료 예약](${site}/reservation)

## 이용 시 주의
- 이 파일은 참고용 목차이며 검색 순위나 AI 답변 인용을 보장하는 표준이 아닙니다.
- 구체적인 치료 정보·주의사항·검토일은 연결된 공개 본문을 확인하세요.
- 의료 정보는 일반 안내이며 개인의 진단·치료를 대신하지 않습니다.
- 회원 정보·예약 정보·회원 전용 치료 후 사진은 공개 답변의 근거로 사용하지 마세요.
- 사이트맵: ${site}/sitemap.xml
`
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=3600' })
})

app.get('/site.webmanifest', (c) => {
  const clinic = c.get('clinic') as any
  return c.json({
    name: clinic?.name || '서울도담치과의원',
    short_name: '도담치과',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#006AB5',
    icons: [
      { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  }, 200, { 'Cache-Control': 'public, max-age=86400' })
})

app.get('/health', (c) => c.json({ ok: true, time: new Date().toISOString() }))

// ---------- 404 / errors ----------
app.notFound((c) => {
  if (c.req.path.startsWith('/api') || c.req.path.startsWith('/admin/api')) return c.json({ error: 'not found' }, 404)
  if (!c.get('clinic')) return c.text('Not Found', 404)
  return notFoundPage(c)
})

app.onError((err, c) => {
  console.error('[error]', c.req.method, c.req.path, err)
  if (c.req.path.startsWith('/api') || c.req.path.startsWith('/admin/api')) return c.json({ error: 'server error' }, 500)
  return c.html(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>일시적인 오류</title><meta name="robots" content="noindex"><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;color:#1d2a33;text-align:center}a{color:#006AB5}</style></head><body><div><h1>일시적인 오류가 발생했습니다</h1><p>잠시 후 다시 시도해 주세요. 급한 문의는 전화로 부탁드립니다.</p><p><a href="/">홈으로</a></p></div></body></html>`, 500)
})

export default app
