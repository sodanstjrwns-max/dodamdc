// Local verification: raw SSR HTML, metadata, headings, schema relationships and crawl policy.
// Does not submit forms, publish content, or contact production.
import { chromium } from '@playwright/test'
import { build } from 'esbuild'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const base = 'http://localhost:3000'
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
      links: [...doc.querySelectorAll('main a[href]')].map(e => e.getAttribute('href')),
    }
  }, html)
}
try {
  const sitemapText = await (await fetch(base + '/sitemap.xml')).text()
  const locs = [...sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].replaceAll('&amp;', '&'))
  const site = new URL(locs[0]).origin
  check(site === 'https://seoul-dodam-dental.pages.dev', 'Production canonical origin must not be localhost/sandbox')
  check(locs.length === new Set(locs).size, 'Duplicate sitemap URLs')
  const rootEntry = sitemapText.match(/<url><loc>[^<]+\/<\/loc>(.*?)<\/url>/)?.[1] || ''
  check(!rootEntry.includes('<lastmod>'), 'Static sitemap must not fabricate daily modification dates')
  const paths = [...new Set([...locs.map(url => new URL(url).pathname), '/privacy', '/terms', '/sitemap', '/area'])]
  const seenTitles = new Map(), seenDescriptions = new Map()
  for (const path of paths) {
    const response = await fetch(base + path)
    const data = await inspect(await response.text())
    check(response.status === 200, `${path}: HTTP ${response.status}`)
    check(data.lang === 'ko', `${path}: document language`)
    check(data.titles.length === 1 && !!data.titles[0], `${path}: unique title tag`)
    check(data.descriptions.length === 1 && !!data.descriptions[0], `${path}: unique meta description`)
    check(data.headings.filter(h => h.level === 1).length === 1, `${path}: one H1 in main`)
    check(data.headings.every(h => h.text), `${path}: empty heading`)
    check(data.canonicals.length === 1 && data.canonicals[0] === site + path, `${path}: canonical mismatch`)
    check(data.ogUrl === data.canonicals[0] && data.ogTitle === data.titles[0] && data.ogDescription === data.descriptions[0], `${path}: OG metadata mismatch`)
    check(data.robots[0]?.includes('noindex') && response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: preview index protection`)
    check(data.viewport[0]?.includes('width=device-width') && !data.viewport[0]?.includes('user-scalable=no'), `${path}: scalable mobile viewport`)
    const schemaTypes = data.schemas.map(s => s['@type'])
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
  const robots = await (await fetch(base + '/robots.txt')).text()
  check((robots.match(/^User-agent:/gm) || []).length === 1, 'Bot-specific groups must not bypass common exclusions')
  for (const path of ['/admin', '/auth', '/api', '/files/cases/']) check(robots.includes('Disallow: ' + path), 'Missing crawl exclusion: ' + path)
  check(!robots.includes('Disallow: /files/\n'), 'Public article images should remain crawlable')
  const llms = await (await fetch(base + '/llms.txt')).text()
  check(llms.indexOf('MTA 생활치수치료') < llms.indexOf('임플란트'), 'AI reference index should follow preservation-first care')
  check(!llms.includes('리뷰:'), 'Do not treat historical review counts as current AI facts')
  const redirect = await fetch(base + '/treatments/implant/?utm_source=test', { redirect: 'manual' })
  check(redirect.status === 301 && redirect.headers.get('location') === '/treatments/implant?utm_source=test', 'Trailing slash redirect')
  const missing = await fetch(base + '/treatments/does-not-exist')
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
  const pageTwo = await inspect(await (await app.request(site + '/column?page=2', {}, { ...env, DB: fixtureDB })).text())
  check(pageTwo.canonicals[0] === site + '/column?page=2' && pageTwo.robots[0]?.startsWith('index,'), 'Populated pagination stays self-canonical and indexable')
  report.checks.push('SSR metadata, H1, canonical, OG, schema IDs, FAQ parity, images, preview noindex, robots, sitemap, production policy, isolated CMS fixture')
} catch (error) { report.errors.push(error.stack || String(error)) }
finally { await browser.close(); await writeFile('.artifacts/seo-audit.json', JSON.stringify(report, null, 2)) }
console.log(JSON.stringify({ pages: report.pages.length, errors: report.errors, warnings: report.warnings }, null, 2))
assert.equal(report.errors.length, 0, 'SEO audit failed; inspect .artifacts/seo-audit.json')
