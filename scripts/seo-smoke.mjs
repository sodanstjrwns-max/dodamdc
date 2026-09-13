// Read-only SSR audit. SEO_BASE_URL explicitly opts into live verification.
// Never submits forms or loads analytics; audit requests use a bot user-agent.
import { chromium } from '@playwright/test'
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const base = process.env.SEO_BASE_URL || 'http://localhost:3000'
const live = base === 'https://dodamdc.kr'
if (!live && base !== 'http://localhost:3000') throw new Error('Unsupported audit origin')
const request = (url, options = {}) => fetch(url, { ...options, headers: { 'User-Agent': 'DodamDeliveryAuditBot/1.0', DNT: '1', ...options.headers }, signal: AbortSignal.timeout(30000) })
const reportPath = `.artifacts/seo-${live ? 'production' : 'audit'}.json`
await mkdir('.artifacts', { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-webgl'] })
const parser = await browser.newPage()
const report = { pages: [], errors: [], warnings: [], checks: [] }
const check = (ok, message) => { if (!ok) report.errors.push(message) }
async function inspect(html) {
  return parser.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'text/html')
    const metas = name => [...doc.querySelectorAll(`meta[name="${name}"]`)].map(e => e.content)
    const property = name => doc.querySelector(`meta[property="${name}"]`)?.content
    return {
      titles: [...doc.querySelectorAll('title')].map(e => e.textContent), descriptions: metas('description'), robots: metas('robots'),
      lang: doc.documentElement.lang, viewport: metas('viewport'),
      canonicals: [...doc.querySelectorAll('head link[rel=canonical]')].map(e => e.getAttribute('href')),
      ogUrl: property('og:url'), ogTitle: property('og:title'), ogDescription: property('og:description'), ogImage: property('og:image'),
      headings: [...doc.querySelectorAll('main h1, main h2, main h3, main h4, main h5, main h6')].map(e => ({ level: Number(e.tagName[1]), text: e.textContent.trim() })),
      schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(e => JSON.parse(e.textContent)),
      faqs: [...doc.querySelectorAll('.faq-item')].map(e => ({ q: e.querySelector('.q')?.textContent.trim(), a: e.querySelector('.faq-a')?.textContent.trim() })),
      images: [...doc.querySelectorAll('main img')].map(e => ({ src: e.getAttribute('src'), alt: e.getAttribute('alt'), width: e.getAttribute('width'), height: e.getAttribute('height'), srcset: e.getAttribute('srcset') })),
      links: [...doc.querySelectorAll('a[href]')].map(e => e.getAttribute('href')),
      ids: [...doc.querySelectorAll('[id]')].map(e => e.id),
      verification: !!doc.querySelector('meta[name="google-site-verification"]'),
      naverVerification: !!doc.querySelector('meta[name="naver-site-verification"]'),
    }
  }, html)
}
try {
  const sitemapText = await (await request(base + '/sitemap.xml')).text()
  const locs = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&'))
  const site = new URL(locs[0]).origin
  check(site === 'https://dodamdc.kr', 'Production canonical origin must not be localhost/sandbox')
  check(locs.length === new Set(locs).size, 'Duplicate sitemap URLs')
  const rootEntry = sitemapText.match(/<url><loc>[^<]+\/<\/loc>(.*?)<\/url>/)?.[1] || ''
  check(!rootEntry.includes('<lastmod>'), 'Static sitemap must not fabricate daily modification dates')
  const paths = [...new Set([...locs.map(url => new URL(url).pathname), '/privacy', '/terms', '/sitemap', '/area', ...(process.env.SEO_BASELINE ? [] : ['/handover'])])]
  const seenTitles = new Map(), seenDescriptions = new Map()
  const images = new Set(), documents = new Map()
  for (const path of paths) {
    const response = await request(base + path)
    const data = await inspect(await response.text())
    check(response.status === 200, `${path}: HTTP ${response.status}`)
    check(data.lang === 'ko', `${path}: document language`)
    check(data.ids.length === new Set(data.ids).size, `${path}: duplicate HTML IDs`)
    documents.set(path, data)
    for (const src of [...data.images.map(image => image.src), data.ogImage]) if (src) images.add(new URL(src, site).href)
    check(data.titles.length === 1 && !!data.titles[0], `${path}: unique title tag`)
    check(data.descriptions.length === 1 && !!data.descriptions[0], `${path}: unique meta description`)
    check(data.headings.filter(h => h.level === 1).length === 1, `${path}: one H1 in main`)
    check(data.headings.every(h => h.text), `${path}: empty heading`)
    check(data.canonicals.length === 1 && data.canonicals[0] === site + path, `${path}: canonical mismatch`)
    if (path === '/handover') {
      check(data.schemas.length === 0 && !data.ogUrl && !data.ogTitle, 'Credential-bearing handover has no structured data or social preview metadata')
      check(response.headers.get('cache-control')?.includes('no-store') && response.headers.get('referrer-policy') === 'no-referrer', 'Handover cache/referrer policy')
    } else check(data.ogUrl === data.canonicals[0] && data.ogTitle === data.titles[0] && data.ogDescription === data.descriptions[0], `${path}: OG metadata mismatch`)
    const indexed = live && !['/area', '/handover'].includes(path) // Intentional non-search directories/guides.
    check(data.robots[0]?.startsWith(indexed ? 'index,' : 'noindex,') && response.headers.get('x-robots-tag')?.startsWith(indexed ? 'index,' : 'noindex,'), `${path}: indexing policy`)
    const head = await request(base + path, { method: 'HEAD' })
    check(head.status === response.status && head.headers.get('x-robots-tag') === response.headers.get('x-robots-tag'), `${path}: GET/HEAD status or indexing mismatch`)
    check(data.viewport[0]?.includes('width=device-width') && !data.viewport[0]?.includes('user-scalable=no'), `${path}: scalable mobile viewport`)
    const schemaTypes = data.schemas.map(s => s['@type'])
    if (path !== '/handover') {
    check(schemaTypes.filter(t => t === 'Dentist').length === 1, `${path}: one clinic entity`)
    check(schemaTypes.filter(t => ['WebPage', 'MedicalWebPage', 'ProfilePage'].includes(t)).length === 1, `${path}: one primary page entity`)
    check(schemaTypes.includes('WebSite'), `${path}: website entity missing`)
    const ids = data.schemas.map(s => s['@id']).filter(Boolean)
    check(ids.length === new Set(ids).size, `${path}: conflicting schema IDs`)
    const serialized = JSON.stringify(data.schemas)
    check(!serialized.includes('NoninvasiveProcedure') && !serialized.includes('speakable') && !serialized.includes('aggregateRating'), `${path}: inaccurate schema claim`)
    const pageNode = data.schemas.find(s => ['WebPage', 'MedicalWebPage', 'ProfilePage'].includes(s['@type']))
    check(pageNode?.url === data.canonicals[0] && pageNode?.inLanguage === 'ko-KR', `${path}: page schema URL/language`)
    if (pageNode?.mainEntity) check(ids.includes(pageNode.mainEntity['@id']), `${path}: unresolved main entity`)
    if (pageNode?.reviewedBy) check(ids.includes(pageNode.reviewedBy['@id']), `${path}: unresolved reviewer`)
    }
    for (const faq of data.schemas.filter(s => s['@type'] === 'FAQPage')) {
      for (const question of faq.mainEntity) check(data.faqs.some(f => f.q === question.name && f.a === question.acceptedAnswer.text), `${path}: FAQ differs from visible HTML`)
    }
    for (const image of data.images) {
      check(image.alt !== null && Number(image.width) > 0 && Number(image.height) > 0, `${path}: missing image alt/dimensions: ${image.src}`)
      if (image.src?.endsWith('-v2.webp')) check(!!image.srcset, `${path}: curated image missing responsive sources`)
    }
    let level = 0
    for (const h of data.headings) { if (h.level > level + 1) report.warnings.push(`${path}: H${level} → H${h.level}: ${h.text}`); level = h.level }
    for (const [value, seen, kind] of [[data.titles[0], seenTitles, 'title'], [data.descriptions[0], seenDescriptions, 'description']]) {
      if (seen.has(value)) report.warnings.push(`${path}: duplicate ${kind} with ${seen.get(value)}`)
      seen.set(value, path)
    }
    report.pages.push({ path, title: data.titles[0], descriptionLength: data.descriptions[0]?.length, canonical: data.canonicals[0], headings: data.headings, schemaTypes })
  }
  for (const src of images) {
    const url = new URL(src)
    if (url.origin !== site) { report.warnings.push('External image not fetched: ' + src); continue }
    const response = await request(base + url.pathname + url.search)
    check(response.status === 200 && response.headers.get('content-type')?.startsWith('image/'), 'Public image unavailable: ' + url.pathname)
    await response.body?.cancel()
  }
  for (const [path, data] of documents) {
    for (const href of data.links) {
      const url = new URL(href, site + path)
      if (url.origin !== site || !documents.has(url.pathname)) continue
      if (url.hash) {
        // Browsers resolve the literal fragment first, then its percent-decoded form.
        const ids = documents.get(url.pathname).ids
        check(ids.includes(url.hash.slice(1)) || ids.includes(decodeURIComponent(url.hash.slice(1))), `${path}: broken section link ${href}`)
      }
    }
  }
  report.assets = { publicImages: images.size }
  report.registration = { googleMetaPresent: documents.get('/')?.verification, naverMetaPresent: documents.get('/')?.naverVerification, note: 'Tag presence is not verified search-service ownership or submission.' }
  const robots = await (await request(base + '/robots.txt')).text()
  check((robots.match(/^User-agent:/gm) || []).length === 1, 'Bot-specific groups must not bypass common exclusions')
  for (const path of ['/admin', '/auth', '/api', '/files/cases/']) check(robots.includes('Disallow: ' + path), 'Missing crawl exclusion: ' + path)
  check(!robots.includes('Disallow: /files/\n'), 'Public article images should remain crawlable')
  const llms = await (await request(base + '/llms.txt')).text()
  check(llms.indexOf('MTA 생활치수치료') < llms.indexOf('임플란트'), 'AI reference index should follow preservation-first care')
  check(!llms.includes('리뷰:'), 'Do not treat historical review counts as current AI facts')
  const redirect = await request(base + '/treatments/implant/?utm_source=test', { redirect: 'manual' })
  check(redirect.status === 301 && redirect.headers.get('location') === '/treatments/implant?utm_source=test', 'Trailing slash redirect')
  const missing = await request(base + '/treatments/does-not-exist')
  check(missing.status === 404, 'Missing pages must not be soft 404s')

  // Exercise production indexing logic in-process, never against the live site.
  const compiled = await build({ entryPoints: ['src/index.tsx'], bundle: true, write: false, format: 'esm', platform: 'node' })
  const { default: app } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
  const db = { prepare() { return { bind() { return this }, all: async () => ({ results: [] }), first: async () => null, run: async () => ({ success: true }) } } }
  const env = { DB: db, SITE_URL: site }
  for (const [path, expectedPath, indexed] of [
    ['/?utm_source=test', '/', true], ['/treatments/implant?v=11', '/treatments/implant', true],
    ['/column?treatment=implant&page=2&utm_source=test', '/column?treatment=implant&page=2', false],
    ['/reservation?ok=1', '/reservation', false], ['/auth/login', '/auth/login', false],
    ['/handover', '/handover', false], ['/column?doctor=han-hwirim', '/column', true],
  ]) {
    const response = await app.request(site + path, {}, env)
    const data = await inspect(await response.text())
    check(data.canonicals[0] === site + expectedPath, path + ': production canonical')
    check(data.robots[0]?.startsWith(indexed ? 'index,' : 'noindex,'), path + ': production robots policy')
  }
  // Isolated CMS fixture: never saved to D1 or exposed on the preview.
  const article = { id: 1, slug: 'qa-only', title: '검증용 칼럼 & 안내', excerpt: '테스트 전용 설명', content_html: '<h1>본문 소제목</h1><p>검증을 위한 문장</p>', author_slug: 'han-hwirim', published_at: '2026-09-01 09:00:00', updated_at: '2026-09-03 10:00:00' }
  const fixtureDB = { prepare(sql) { return { bind() { return this }, all: async () => ({ results: sql.includes('FROM columns') ? [article] : [] }), first: async () => sql.includes('SELECT * FROM columns') ? article : { n: 25 }, run: async () => ({ success: true }) } } }
  const articleResponse = await app.request(site + '/column/qa-only', {}, { ...env, DB: fixtureDB })
  const articlePage = await inspect(await articleResponse.text())
  check(articlePage.headings.filter(h => h.level === 1).length === 1, 'CMS body must not introduce a second H1')
  const articleNode = articlePage.schemas.find(s => s['@type'] === 'Article')
  check(articleNode?.datePublished === '2026-09-01T09:00:00.000Z' && articleNode?.dateModified === '2026-09-03T10:00:00.000Z', 'CMS Article timestamps must be valid ISO dates')
  check(articleNode?.author?.['@id'] === site + '/doctors/han-hwirim#person', 'CMS article author identity')
  const notice = { id: 1, title: '병원 일정 안내', content_html: '<h1>일정 안내</h1><p>진료 일정을 확인해 주세요.</p>', created_at: '2026-09-01 09:00:00', updated_at: '2026-09-03 10:00:00' }
  const noticeDB = { prepare(sql) { return { bind() { return this }, all: async () => ({ results: [] }), first: async () => sql.includes('SELECT * FROM notices') ? notice : null, run: async () => ({ success: true }) } } }
  const noticePage = await inspect(await (await app.request(site + '/notice/1', {}, { ...env, DB: noticeDB })).text())
  const noticeNode = noticePage.schemas.find(s => s['@type'] === 'Article')
  check(noticeNode?.author?.['@id'] === site + '/#clinic' && noticeNode?.datePublished === '2026-09-01T09:00:00.000Z', 'Notice organization authorship and real publication date')
  check(noticePage.headings.filter(h => h.level === 1).length === 1, 'Notice body must not add H1')
  let headWrites = 0
  await app.request(site + '/column/qa-only', { method: 'HEAD' }, { ...env, DB: { ...fixtureDB, batch: async () => { headWrites++; return [] } } })
  check(headWrites === 0, 'HEAD must not increment article views or page views')
  const pageTwo = await inspect(await (await app.request(site + '/column?page=2', {}, { ...env, DB: fixtureDB })).text())
  check(pageTwo.canonicals[0] === site + '/column?page=2' && pageTwo.robots[0]?.startsWith('index,'), 'Populated pagination stays self-canonical and indexable')
  for (const [input, normalized] of [['02', '2'], ['2.9', '2'], ['10001', '10000'], ['Infinity', null], ['-1', null], ['bad', null]]) {
    const response = await app.request(site + '/column?page=' + input, {}, { ...env, DB: fixtureDB })
    const data = await inspect(await response.text())
    check(data.canonicals[0] === site + '/column' + (normalized ? '?page=' + normalized : ''), 'Normalized pagination canonical: ' + input)
    check(normalized ? data.titles[0].endsWith(` · ${normalized}페이지`) : !data.titles[0].includes('페이지'), 'Normalized pagination title: ' + input)
  }
  for (const alias of ['https://www.dodamdc.kr', 'https://seoul-dodam-dental.pages.dev']) {
    const redirect = await app.request(alias + '/treatments/implant?utm_source=fixture', {}, env)
    check(redirect.status === 301 && redirect.headers.get('location') === site + '/treatments/implant?utm_source=fixture', 'Verified alias redirects to custom canonical domain: ' + alias)
    const login = await app.request(alias + '/auth/login', {}, env)
    check(login.status === 200, 'Do not migrate origin-bound auth sessions by redirect: ' + alias)
  }
  const get = await app.request(site + '/', {}, env)
  const head = await app.request(site + '/', { method: 'HEAD' }, env)
  check(head.headers.get('x-robots-tag') === get.headers.get('x-robots-tag'), 'Production GET/HEAD indexing parity')
  const visitorHeaders = { 'user-agent': 'Mozilla/5.0 DeliveryFixture' }
  const publicHome = await (await app.request(site + '/', { headers: visitorHeaders }, env)).text()
  check(publicHome.includes('clarity.ms/tag/') && publicHome.includes('/beacon.js'), 'Preserve approved public analytics integration')
  for (const path of ['/reservation', '/auth/login', '/handover', '/cases/gallery']) {
    const source = await (await app.request(site + path, { headers: visitorHeaders }, env)).text()
    check(!source.includes('clarity.ms/tag/') && !source.includes('/beacon.js'), 'Sensitive page excludes third-party behavior tracking: ' + path)
  }
  const dntHome = await (await app.request(site + '/', { headers: { ...visitorHeaders, DNT: '1' } }, env)).text()
  check(!dntHome.includes('/beacon.js'), 'Behavior analytics respects DNT')
  const helpers = await build({ entryPoints: ['src/lib/seo.ts'], bundle: true, write: false, format: 'esm', platform: 'node' })
  const { isoDate } = await import('data:text/javascript;base64,' + Buffer.from(helpers.outputFiles[0].text).toString('base64'))
  for (const invalid of ['2026-02-30', '2026-02-30 09:00:00', '09/12/2026', '2026-13-01', 'not a date']) check(isoDate(invalid) === undefined, 'Reject invalid or ambiguous date: ' + invalid)
  check(isoDate('2024-02-29') === '2024-02-29' && isoDate('2026-09-12 09:00:00') === '2026-09-12T09:00:00.000Z', 'Valid dates and D1 UTC dates preserved')
  const unavailableDB = { prepare() { throw new Error('isolated unavailable DB') } }
  const unavailable = await app.request(site + '/sitemap.xml', {}, { ...env, DB: unavailableDB })
  check(unavailable.status === 503 && unavailable.headers.get('cache-control') === 'no-store', 'DB outage must not publish a partial sitemap')
  check(!locs.some(url => /\/(handover|admin|auth)(\/|$)/.test(new URL(url).pathname)), 'Private/utility routes excluded from sitemap')
  check(articlePage.schemas.find(s => s['@type'] === 'WebPage')?.reviewedBy === undefined, 'Authorship must not invent a medical review')
  check(articlePage.schemas.find(s => s['@type'] === 'WebPage')?.mainEntity?.['@id'] === articleNode?.['@id'], 'Article main entity relation')
  report.checks.push('SSR metadata, H1, canonical, OG, schema IDs, FAQ parity, images, preview noindex, robots, sitemap, production policy, isolated CMS fixture')
} catch (error) { report.errors.push(error.stack || String(error)) }
finally { await browser.close(); await writeFile(reportPath, JSON.stringify(report, null, 2)) }
console.log(JSON.stringify({ pages: report.pages.length, assets: report.assets, registration: report.registration, errors: report.errors, warnings: report.warnings }, null, 2))
assert.equal(report.errors.length, 0, 'SEO audit failed; inspect .artifacts/seo-audit.json')
