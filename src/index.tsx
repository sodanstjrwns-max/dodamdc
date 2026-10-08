import { hoursNotices } from './lib/clinic-hours'
import { INDEXNOW_KEY } from './lib/indexnow'
import { upcomingSpecialDays, specialDaysText } from './lib/clinic-status'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import type { Env } from './lib/types'
import { loadClinic } from './lib/settings'
import { readMemberSession, readAdminSession } from './lib/auth'
import { trackView } from './lib/util'
import { requestSecurity, requestLimit } from './lib/security'
import { resolveSiteUrl, isoDate, xmlEscape } from './lib/seo'
import { getNaverBookingUrl } from './data/clinic'

import auth from './routes/auth'
import admin from './routes/admin'
import content from './routes/content'
import aiChat from './routes/ai-chat'
import conversions from './lib/conversions'

import { firstVisitPage } from './pages/journey'
import { symptomCheckPage } from './pages/symptom-check'
import { homePage } from './pages/home'
import { handoverPage } from './pages/handover'
import { treatmentsIndex, treatmentDetail } from './pages/treatments'
import { doctorsIndex, doctorDetail, missionPage, floorGuidePage } from './pages/about'
import {
  faqPage, encyclopediaIndex, encyclopediaTerm, directionsPage, hoursPage, pricingPage,
  areaPage, areaIndex, hwaseoStationHub, privacyPage, termsPage, sitemapHtml, notFoundPage, generalFaqsFor
} from './pages/info'
import { loadPricingGroups } from './lib/fees'
import { pricing, pricingUpdatedAt, won } from './data/pricing'

import { treatments, getTreatment } from './data/treatments'
import { doctors, getDoctor } from './data/doctors'
import { terms, getTerm, termAliases } from './data/encyclopedia'
import { termUpdated } from './pages/encyclopedia'
import { PAGE_LASTMOD, DOCTOR_LASTMOD, TREATMENT_LASTMOD, AREA_LASTMOD } from './data/lastmod'
import { areaPages, getAreaPage } from './data/areas'

const app = new Hono<Env>()

// ---------- Global middleware ----------
// Preserve the delivery document's no-referrer policy after the shared security headers run.
app.use('/handover', async (c, next) => {
  await next()
  c.header('Referrer-Policy', 'no-referrer')
})
// The health-choice UI is deliberately isolated from automatic analytics injection.
app.use('/symptom-check', async (c, next) => {
  await next()
  c.header('Cache-Control', 'private, no-store, max-age=0, no-transform')
  c.header('Referrer-Policy', 'no-referrer')
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
})
app.use('*', secureHeaders({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  xFrameOptions: 'SAMEORIGIN',
  referrerPolicy: 'strict-origin-when-cross-origin'
}))

app.use('*', requestLimit)
app.use('*', requestSecurity)
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
  // Only known public aliases redirect. Preserve origin-bound sessions, APIs and R2 permissions.
  if (['GET', 'HEAD'].includes(c.req.method) && siteUrl === 'https://dodamdc.kr' && ['www.dodamdc.kr', 'seoul-dodam-dental.pages.dev'].includes(url.hostname) && !/^\/(admin|auth|api|files|health)(\/|$)/.test(url.pathname)) {
    const target = new URL(siteUrl)
    target.pathname = url.pathname
    target.search = url.search
    return c.redirect(target.href, 301)
  }
  if (url.origin !== siteUrl || /^\/(admin|auth|api|health)(\/|$)/.test(url.pathname)) c.header('X-Robots-Tag', 'noindex, follow')
  // Normalize public trailing-slash duplicates, without redirecting POSTs or R2 keys.
  if ((c.req.method === 'GET' || c.req.method === 'HEAD') && url.pathname.length > 1 && url.pathname.endsWith('/') && !/^\/(files|api|auth|admin)(\/|$)/.test(url.pathname)) {
    return c.redirect(url.pathname.replace(/\/+$/, '') + url.search, 301)
  }
  c.set('nonce', crypto.randomUUID().replace(/-/g, ''))
  c.set('user', c.env?.SESSION_SECRET ? await readMemberSession(c) : null)
  const staff = c.env?.SESSION_SECRET ? await readAdminSession(c) : null
  c.set('staff', staff)
  c.set('admin', !!staff)
  await next()
  // page view tracking for public HTML GET responses
  if (c.req.method === 'GET' && c.res.status === 200 && (c.res.headers.get('content-type') || '').includes('text/html')
    && !url.pathname.startsWith('/admin') && !url.pathname.startsWith('/auth') && url.pathname !== '/handover' && url.pathname !== '/symptom-check') {
    try { await trackView(c, 'page', null) } catch {}
  }
})

// ---------- Sub apps ----------
app.route('/auth', auth)
app.route('/admin', admin)
app.route('/', conversions)
app.route('/', content)
app.route('/', aiChat)

// ---------- Public pages ----------
app.get('/', (c) => homePage(c))
app.get('/first-visit', (c) => firstVisitPage(c))
app.get('/symptom-check', (c) => symptomCheckPage(c))
app.get('/handover', (c) => handoverPage(c))
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
  const alias = termAliases[c.req.param('slug')]
  if (alias) return c.redirect(`/encyclopedia/${alias}`, 301)
  const t = getTerm(c.req.param('slug'))
  return t ? encyclopediaTerm(c, t) : notFoundPage(c)
})

app.get('/directions', (c) => directionsPage(c))
app.get('/hours', (c) => hoursPage(c))
app.get('/pricing', (c) => pricingPage(c))

app.get('/area', (c) => areaIndex(c))
app.get('/area/hwaseo-station', (c) => hwaseoStationHub(c))
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

  add('/', '1.0', 'weekly', PAGE_LASTMOD['/'])
  for (const p of ['/first-visit', '/symptom-check', '/mission', '/doctors', '/treatments', '/floor-guide', '/directions', '/hours', '/pricing', '/faq', '/reservation']) add(p, '0.8', 'weekly', PAGE_LASTMOD[p])
  for (const d of doctors) add(`/doctors/${d.slug}`, '0.8', 'monthly', DOCTOR_LASTMOD)
  for (const t of treatments) add(`/treatments/${t.slug}`, '0.9', 'monthly', TREATMENT_LASTMOD[t.slug])
  add('/area', '0.7', 'monthly', PAGE_LASTMOD['/area'])
  add('/area/hwaseo-station', '0.9', 'monthly', PAGE_LASTMOD['/area/hwaseo-station'])
  for (const a of areaPages) add(`/area/${a.slug}`, '0.6', 'monthly', AREA_LASTMOD)
  add('/encyclopedia', '0.8', 'weekly', terms.map(t => termUpdated(t.slug)).sort().at(-1))
  for (const t of terms) add(`/encyclopedia/${t.slug}`, '0.4', 'monthly', termUpdated(t.slug))
  try {
    const db = c.env.DB
    const [cases, cols, notes, press] = await Promise.all([
      db.prepare('SELECT slug, updated_at FROM cases WHERE published=1').all<any>(),
      db.prepare('SELECT slug, updated_at FROM columns WHERE published=1').all<any>(),
      db.prepare('SELECT id, updated_at FROM notices WHERE published=1').all<any>(),
      db.prepare('SELECT MAX(updated_at) AS updated_at FROM press WHERE published=1').first<any>()
    ])
    // 목록 페이지는 그 안의 가장 최근 수정일
    const newest = (rows: any[]) => rows.map(r => String(r.updated_at || '')).filter(Boolean).sort().at(-1)
    add('/cases/gallery', '0.8', 'weekly', newest(cases.results || []))
    add('/column', '0.8', 'weekly', newest(cols.results || []))
    add('/notice', '0.8', 'weekly', newest(notes.results || []))
    add('/press', '0.8', 'weekly', press?.updated_at ? String(press.updated_at) : undefined)
    for (const r of cases.results || []) add(`/cases/gallery/${r.slug}`, '0.6', 'monthly', String(r.updated_at || ''))
    for (const r of cols.results || []) add(`/column/${r.slug}`, '0.7', 'monthly', String(r.updated_at || ''))
    for (const r of notes.results || []) add(`/notice/${r.id}`, '0.4', 'monthly', String(r.updated_at || ''))
  } catch {
    // A transient DB failure must not publish/cache an incomplete sitemap.
    c.header('X-Robots-Tag', 'noindex')
    return c.text('Sitemap temporarily unavailable', 503, { 'Cache-Control': 'no-store', 'Retry-After': '60' })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`
  return c.body(xml, 200, { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' })
})

const ROBOTS_AI_AGENTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Googlebot', 'Bingbot', 'Applebot', 'Applebot-Extended',
  'Yeti', 'Daum', 'Daumoa',
  'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'MistralAI-User', 'cohere-ai', 'CCBot', 'Bytespider',
]

// IndexNow 키 검증 파일
app.get(`/${INDEXNOW_KEY}.txt`, (c) => c.text(INDEXNOW_KEY, 200, { 'Content-Type': 'text/plain; charset=utf-8' }))

app.get('/robots.txt', (c) => {
  const site = c.get('siteUrl')
  // AI 답변엔진·검색 크롤러 명시 허용 그룹(PFWE-SPEC §10, 2026-09-29 감사 수정).
  // 전용 그룹은 * 규칙을 상속하지 않으므로 같은 제외 경로를 그대로 반복한다.
  const rules = `Allow: /
Disallow: /admin
Disallow: /auth
Disallow: /api
Disallow: /files/cases/
Disallow: /health`
  const body = `# Crawl guidance, not authentication or an access-control mechanism.
User-agent: *
${rules}

# AI 답변엔진·검색 크롤러 명시적 허용 (AEO)
${ROBOTS_AI_AGENTS.map((ua) => `User-agent: ${ua}`).join('\n')}
${rules}

Sitemap: ${site}/sitemap.xml
`
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=3600' })
})

// llms(-full).txt 끝에 붙이는 공개 칼럼·사례 목록 — DB 실패 시 생략
async function llmsContentList(c: any, full: boolean) {
  const site = c.get('siteUrl')
  try {
    const [cols, cases] = await Promise.all([
      c.env.DB.prepare('SELECT slug,title,excerpt,meta_description FROM columns WHERE published=1 ORDER BY published_at DESC').all(),
      c.env.DB.prepare('SELECT slug,title,treatment_slug,duration FROM cases WHERE published=1 ORDER BY created_at DESC').all(),
    ])
    const one = (v: any) => String(v || '').replace(/\s+/g, ' ').trim()
    const colLines = (cols.results || []).map((r: any) => `- [${one(r.title)}](${site}/column/${r.slug})${full && one(r.meta_description || r.excerpt) ? `: ${one(r.meta_description || r.excerpt).slice(0, 200)}` : ''}`)
    const caseLines = (cases.results || []).map((r: any) => `- [${one(r.title)}](${site}/cases/gallery/${r.slug})${r.treatment_slug ? ` — ${treatments.find(t => t.slug === r.treatment_slug)?.name || ''}` : ''}${one(r.duration) ? `, ${one(r.duration)}` : ''}`)
    return `\n## 원장 칼럼 (${colLines.length}편)\n${colLines.join('\n')}\n${caseLines.length ? `\n## 치료 전후 사례 (${caseLines.length}건, 치료 후 사진은 회원 전용)\n${caseLines.join('\n')}\n` : ''}`
  } catch { return '' }
}

app.get('/llms.txt', async (c) => {
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
- 참고: ${hoursNotices(clinic)}
${(() => { const t = specialDaysText(upcomingSpecialDays(clinic, new Date(), 60)); return t ? `- 기본 시간표와 다른 날(향후 60일): ${t}\n` : '' })()}- 주차: ${clinic.directions.parking}
- 홈페이지 예약 신청은 병원의 확인 연락 후 확정됩니다. 네이버 예약의 가능 일정과 확정 조건은 네이버 예약 페이지에서 확인하세요.

## 공식 안내와 근거 페이지
- [진료 철학](${site}/mission): ${clinic.slogan}
- [${doctors[0].name} 대표원장](${site}/doctors/${doctors[0].slug}): 자격·경력·진료 철학
${treatments.map(t => `- [${t.name}](${site}/treatments/${t.slug}): ${t.short}`).join('\n')}
- [질문과 답변](${site}/faq): 병원 이용 및 진료별 FAQ
- [치과 백과사전](${site}/encyclopedia): 용어 정의와 관련 진료
- [진료실·장비·감염관리](${site}/floor-guide)
- [비급여 진료비](${site}/pricing): 금액·조건·기준일은 해당 페이지 확인
- [첫 방문 안내](${site}/first-visit): 준비물·접수·검사·상담 순서
- [오시는 길](${site}/directions)
- [진료시간](${site}/hours)
- [공지사항](${site}/notice): 임시 휴진 등 최신 변경 확인
- [원장 칼럼](${site}/column)
- [언론보도](${site}/press): 원장 인터뷰·기고 기사 요약과 원문 링크
- [진료 예약 방법](${site}/reservation): 네이버 예약과 홈페이지 신청 안내
${getNaverBookingUrl(clinic) ? `- [공식 네이버 예약](${getNaverBookingUrl(clinic)}): 외부 예약 페이지` : ''}

## 이용 시 주의
- 이 파일은 참고용 목차이며 검색 순위나 AI 답변 인용을 보장하는 표준이 아닙니다. Google 검색에는 llms.txt가 필요하지 않습니다.
- 구체적인 치료 정보·주의사항·검토일은 연결된 공개 본문을 확인하세요.
- 의료 정보는 일반 안내이며 개인의 진단·치료를 대신하지 않습니다.
- 회원 정보·예약 정보·회원 전용 치료 후 사진은 공개 답변의 근거로 사용하지 마세요.
- 사이트맵: ${site}/sitemap.xml
- 상세본: ${site}/llms-full.txt (진료별 요약·주의사항·FAQ, 의료진, 비급여 진료비)
` + await llmsContentList(c, false)
  return c.text(body, 200, { 'Cache-Control': 'public, max-age=3600' })
})

// llms.txt 상세본 — 사이트에 이미 공개된 데이터(병원 정보·의료진·진료 본문 요약·FAQ·비급여 진료비)만 평문으로 모은다.
app.get('/llms-full.txt', async (c) => {
  const site = c.get('siteUrl')
  const clinic = c.get('clinic') as any
  const dr = doctors[0]
  let feeText = ''
  try {
    const stored = await loadPricingGroups(c.env?.DB, true)
    const groups = stored === null ? pricing : stored
    const basis = stored === null ? `기준일 ${pricingUpdatedAt}` : '병원에서 게시한 현재 공개 항목'
    feeText = groups.length
      ? `(${basis}. 개인 상태·치료 범위에 따라 항목이 추가될 수 있으며 총비용은 치료 전에 안내합니다. 최신 금액은 ${site}/pricing 확인)\n\n` +
        groups.map((g) => `### ${g.group}\n${g.desc ? g.desc + '\n' : ''}${g.items.map((i) => `- ${i.name}: ${i.price != null ? won(i.price) : '상담 후 안내'}${i.unit ? ' / ' + i.unit : ''}${i.note ? ' (' + i.note + ')' : ''}`).join('\n')}`).join('\n\n')
      : `공개된 비급여 항목이 없습니다. ${site}/pricing 을 확인하세요.`
  } catch {
    feeText = `진료비 정보를 일시적으로 불러오지 못했습니다. ${site}/pricing 을 확인하세요.`
  }
  const txText = treatments.map((t) => [
    `## ${t.name} (${t.nameEn})`,
    `URL: ${site}/treatments/${t.slug}`,
    '',
    t.short,
    '',
    '### 핵심 요약',
    ...t.summary.map((x) => `- ${x}`),
    '',
    ...t.sections.flatMap((sec) => [`### ${sec.h}`, sec.lead, '']),
    ...(t.steps ? ['### 치료 과정', ...t.steps.map((st, i) => `${i + 1}. ${st.title} — ${st.desc}`), ''] : []),
    '### 치료 전 알아두셔야 할 점',
    ...t.sideEffects.map((x) => `- ${x}`),
    '',
    `### ${t.name} 자주 묻는 질문`,
    ...t.faqs.flatMap((f) => [`Q. ${f.q}`, `A. ${f.a}`, '']),
  ].join('\n')).join('\n---\n\n')
  const body = `# ${clinic.name} — 상세 안내 (llms-full.txt)

> ${clinic.region}의 치과의원. ${dr.name} ${dr.title}(${dr.specialty}). ${clinic.slogan}
> 목차: ${site}/llms.txt

## 병원 정보
- 주소: ${clinic.address}
- 전화: ${clinic.phone}
- 진료시간: ${clinic.hours.map((h: any) => `${h.day} ${h.open ? h.open + '–' + h.close : '휴진'}${h.lunch ? ' (점심 ' + h.lunch + ')' : ''}${h.note ? ' (' + h.note + ')' : ''}`).join(', ')}
- 참고: ${hoursNotices(clinic)}
${(() => { const t = specialDaysText(upcomingSpecialDays(clinic, new Date(), 60)); return t ? `- 기본 시간표와 다른 날(향후 60일): ${t}\n` : '' })()}- 주차: ${clinic.directions.parking}
- 시행하지 않는 진료: 치아교정, 수면(진정) 진료, 보톡스·필러
- 예약: 홈페이지 예약 신청은 병원 확인 연락 후 확정됩니다. ${site}/reservation

## 의료진
### ${dr.name} ${dr.title} (${site}/doctors/${dr.slug})
- 자격: ${dr.license.join(', ')}
- 학력: ${dr.education.join(', ')}
- 경력: ${dr.career.join(', ')}
- 학회: ${dr.societies.join(', ')}

## 병원 이용 자주 묻는 질문
${generalFaqsFor(clinic).map((f) => `Q. ${f.q}\nA. ${f.a}`).join('\n\n')}

# 진료별 안내

${txText}

# 비급여 진료비
${feeText}

## 이용 시 주의
- 의료 정보는 일반 안내이며 개인의 진단·치료를 대신하지 않습니다. 치료 방법·기간·결과는 개인에 따라 다릅니다.
- 회원 정보·예약 정보·회원 전용 치료 후 사진은 공개 답변의 근거로 사용하지 마세요.
` + await llmsContentList(c, true)
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
