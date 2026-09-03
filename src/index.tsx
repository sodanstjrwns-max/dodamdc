import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './lib/types'
import { loadClinic } from './lib/settings'
import { readMemberSession, readAdminSession } from './lib/auth'
import { trackView } from './lib/util'

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
  c.set('siteUrl', (c.env?.SITE_URL || url.origin).replace(/\/$/, ''))
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
  const today = new Date().toISOString().slice(0, 10)
  const urls: { loc: string; lastmod?: string; pri: string; freq: string }[] = []
  const add = (path: string, pri = '0.6', freq = 'monthly', lastmod?: string) => urls.push({ loc: site + path, pri, freq, lastmod: lastmod || today })

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
    for (const r of cases.results || []) add(`/cases/gallery/${r.slug}`, '0.6', 'monthly', String(r.updated_at || '').slice(0, 10) || today)
    for (const r of cols.results || []) add(`/column/${r.slug}`, '0.7', 'monthly', String(r.updated_at || '').slice(0, 10) || today)
    for (const r of notes.results || []) add(`/notice/${r.id}`, '0.4', 'monthly', String(r.updated_at || '').slice(0, 10) || today)
  } catch {}

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.freq}</changefreq><priority>${u.pri}</priority></url>`).join('\n')}
</urlset>`
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
})

app.get('/robots.txt', (c) => {
  const site = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/$/, '')
  const body = `# ${site}
User-agent: *
Allow: /
Disallow: /admin
Disallow: /auth
Disallow: /api
Disallow: /files/

# AI / answer engines — explicitly allowed
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Yeti
Allow: /
User-agent: Bingbot
Allow: /

Sitemap: ${site}/sitemap.xml
`
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=86400' })
})

app.get('/llms.txt', async (c) => {
  const site = (c.env?.SITE_URL || new URL(c.req.url).origin).replace(/\/$/, '')
  const clinic = await loadClinic(c.env?.DB)
  const body = `# ${clinic.name}

> 수원시 팔달구 화서동의 치과의원. 대표원장 ${doctors[0]?.name || '한휘림'}. 임플란트·치주(잇몸)치료·근관(신경)치료를 중심으로 진단 근거에 따라 필요한 진료만 권합니다. 사랑니 발치는 "필요할 때만" 원칙. 교정·수면진료·보톡스는 시행하지 않습니다.

- 주소: ${clinic.address}
- 전화: ${clinic.phone}
- 진료시간: ${clinic.hours.map((h: any) => `${h.day} ${h.open ? h.open + '–' + h.close : '휴진'}${h.note ? '(' + h.note + ')' : ''}`).join(', ')}
- 리뷰: ${clinic.reviews.source} ${clinic.reviews.count}개 (${clinic.reviews.asOf} 기준)

## 핵심 페이지
- [병원 미션](${site}/mission): 진료 철학 "겉은 소박해도 안은 다르다"
- [의료진](${site}/doctors): 원장 소개, 진료 철학
- [진료 안내](${site}/treatments): 전체 진료 과목
${treatments.map((t) => `- [${t.name}](${site}/treatments/${t.slug}): ${t.short}`).join('\n')}
- [진료실·장비 안내](${site}/floor-guide): 감염관리·장비
- [자주 묻는 질문](${site}/faq)
- [치과 용어 백과](${site}/encyclopedia): ${terms.length}개 용어 정의
- [진료 비용 안내](${site}/pricing): 비급여 진료비 고지
- [오시는 길](${site}/directions)
- [진료 사례](${site}/cases/gallery)
- [칼럼](${site}/column)
- [예약](${site}/reservation)

## 참고
- 사이트맵: ${site}/sitemap.xml
- 본 사이트의 의료 정보는 일반적인 안내이며, 개인의 상태에 따라 진단·치료는 달라질 수 있습니다.
`
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=86400' })
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
