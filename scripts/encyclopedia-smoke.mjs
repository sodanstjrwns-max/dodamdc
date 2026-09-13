// Offline content + rendered-route audit. No production DB, forms or analytics.
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

async function bundled(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node' })
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))
}
const [{ default: app }, { terms, getTerm, CATEGORIES }, { editorial, EDITORIAL_UPDATED }, { references, categoryGuides, readingPaths }, { detailedSections, comparisons }] = await Promise.all([
  bundled('src/index.tsx'), bundled('src/data/encyclopedia/index.ts'), bundled('src/data/encyclopedia/editorial.ts'), bundled('src/data/encyclopedia/guides.ts'), bundled('src/data/encyclopedia/details.ts'),
])
const report = { terms: terms.length, categories: CATEGORIES.length, references: Object.keys(references).length, detailedEntries: Object.keys(detailedSections).length, comparisons: Object.keys(comparisons).length, pages: [], browser: [], checks: [] }
assert.equal(terms.length, 512, 'Preserve all existing term URLs')
assert.deepEqual(Object.keys(editorial).sort(), terms.map(t => t.slug).sort(), 'Every term needs its own editorial, no extras')
assert.equal(new Set(terms.map(t => t.slug)).size, 512, 'No duplicate slug')
for (const field of ['context', 'distinction', 'question']) assert.equal(new Set(Object.values(editorial).map(e => e[field])).size, 512, `Do not substitute duplicate ${field} text`)
const paths = new Set(terms.map(t => '/encyclopedia/' + t.slug))
for (const t of terms) {
  const e = editorial[t.slug]
  assert(e.context.length > 55 && e.distinction.length > 45 && e.question.endsWith('?'), `${t.slug}: substantive original explanation and question`)
  assert(categoryGuides[t.category], `${t.slug}: missing category guide`)
  assert.equal(new Set(e.related).size, e.related.length, `${t.slug}: duplicated relationship`)
  for (const slug of e.related) assert(slug !== t.slug && getTerm(slug), `${t.slug}: bad relationship ${slug}`)
  for (const text of [t.def, e.context, e.distinction, e.question]) assert(!/[<>|]/.test(text), `${t.slug}: raw markup in editorial`)
}
for (const p of readingPaths) for (const slug of p.slugs) assert(getTerm(slug), `Reading path: ${slug}`)
for (const key of [...Object.keys(comparisons), ...Object.keys(detailedSections)]) assert(getTerm(key), `Orphan detail: ${key}`)
for (const category of CATEGORIES) for (const key of categoryGuides[category].references) assert(references[key], `Invalid reference ${key}`)
for (const reference of Object.values(references)) assert.equal(new URL(reference.url).protocol, 'https:')
const db = { prepare() { return { bind() { return this }, all: async () => ({ results: [] }), first: async () => null, run: async () => ({ success: true }) } } }
const env = { DB: db, SITE_URL: 'https://dodamdc.kr' }
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-webgl'] })
const parser = await browser.newPage()
async function inspect(source) {
  return parser.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'text/html')
    return {
      h1: doc.querySelectorAll('main h1').length,
      ids: [...doc.querySelectorAll('[id]')].map(el => el.id),
      canonical: doc.querySelector('link[rel="canonical"]')?.href,
      title: doc.querySelector('title')?.textContent,
      description: doc.querySelector('meta[name="description"]')?.content,
      schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(el => JSON.parse(el.textContent)),
      links: [...doc.querySelectorAll('main a[href]')].map(el => el.getAttribute('href')),
      context: doc.querySelector('#clinical-context p')?.textContent,
      question: doc.querySelector('#ency-question-text')?.textContent,
      definition: doc.querySelector('#definition>p:last-child')?.textContent,
      reviewClaims: /한휘림.*검토/.test(doc.querySelector('main')?.textContent || ''),
      terms: doc.querySelectorAll('[data-ency-entry]').length,
    }
  }, source)
}
let server
try {
  await mkdir('.artifacts/encyclopedia', { recursive: true })
  for (const path of ['/encyclopedia', ...paths]) {
    const response = await app.request('https://dodamdc.kr' + path, { headers: { 'User-Agent': 'DodamEncyclopediaAuditBot/1.0', DNT: '1' } }, env)
    assert.equal(response.status, 200, path)
    assert(response.headers.get('x-robots-tag')?.startsWith('index,'), `${path}: retain production indexing`)
    const html = await response.text(), info = await inspect(html)
    assert.equal(info.h1, 1, path + ': one H1')
    assert.equal(info.ids.length, new Set(info.ids).size, path + ': duplicate ID')
    assert.equal(info.canonical, 'https://dodamdc.kr' + path, path + ': canonical')
    assert(!info.reviewClaims, path + ': invented physician review')
    assert(info.title && info.description, path + ': metadata')
    const pageSchema = info.schemas.find(s => s['@type'] === 'MedicalWebPage' || s['@type'] === 'WebPage')
    assert.equal(pageSchema.dateModified, EDITORIAL_UPDATED)
    assert(!pageSchema.reviewedBy && !pageSchema.lastReviewed && !pageSchema.author, path + ': no fabricated authorship/review')
    const t = getTerm(path.split('/')[2])
    if (t) {
      assert.equal(info.definition, t.def, path + ': definition schema/body source')
      assert.equal(info.question, editorial[t.slug].question)
      assert(info.context?.length > 10, path + ': missing explanatory body')
      assert.equal(info.schemas.find(s => s['@type'] === 'DefinedTerm').description, t.def)
      assert(pageSchema.citation?.length, path + ': related references')
    } else assert.equal(info.terms, 512, 'All terms in server HTML')
    for (const href of info.links) {
      if (href.startsWith('/encyclopedia/')) assert(paths.has(href), path + ': unknown term URL ' + href)
      if (href.startsWith('#')) assert(info.ids.includes(href.slice(1)) || info.ids.includes(decodeURIComponent(href.slice(1))), path + ': broken anchor ' + href)
    }
    report.pages.push({ path, title: info.title, description: info.description, bytes: Buffer.byteLength(html) })
  }
  assert.equal(new Set(report.pages.map(p => p.title)).size, 513, 'Unique page titles')
  assert.equal(new Set(report.pages.map(p => p.description)).size, 513, 'Unique page descriptions')
  const missing = await app.request('https://dodamdc.kr/encyclopedia/unknown-term-audit', {}, env)
  assert.equal(missing.status, 404)
  const sitemap = await (await app.request('https://dodamdc.kr/sitemap.xml', {}, env)).text()
  assert.equal((sitemap.match(/<lastmod>2026-09-14<\/lastmod>/g) || []).length, 512, 'Real fixed edit date, glossary only')
  for (const path of ['/', '/faq', '/pricing', '/reservation', '/treatments/endodontics']) {
    const response = await app.request('https://dodamdc.kr' + path, { headers: { 'User-Agent': 'DodamEncyclopediaAuditBot/1.0', DNT: '1' } }, env)
    assert.equal(response.status, 200, path + ': existing route')
    const source = await response.text()
    assert(!source.includes('/static/encyclopedia.'), path + ': no glossary assets outside glossary')
  }
  const publicRoot = resolve('public')
  server = createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return }
      const url = new URL(req.url, 'http://localhost')
      if (url.pathname.startsWith('/static/') || /\.(png|ico|webmanifest)$/.test(url.pathname)) {
        const path = resolve(publicRoot, '.' + decodeURIComponent(url.pathname))
        if (!path.startsWith(publicRoot + '/')) { res.writeHead(403); res.end(); return }
        try {
          const body = await readFile(path)
          const mime = { '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' }[extname(path)] || 'application/octet-stream'
          res.writeHead(200, { 'content-type': mime }); res.end(req.method === 'HEAD' ? undefined : body)
        } catch { res.writeHead(404); res.end() }
      } else {
        const response = await app.request('http://localhost:' + server.address().port + req.url, { method: req.method, headers: { 'User-Agent': 'DodamEncyclopediaAuditBot/1.0', DNT: '1' } }, env)
        res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer()))
      }
    } catch (error) { res.writeHead(500); res.end(String(error)) }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = 'http://127.0.0.1:' + server.address().port
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', extraHTTPHeaders: { DNT: '1' } })
  await ctx.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort())
  const page = await ctx.newPage(), errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(origin + '/encyclopedia', { waitUntil: 'networkidle' })
  assert(await page.locator('[data-ency-controls]').isVisible())
  const visibleCount = () => page.locator('[data-ency-entry]:not([hidden])').count()
  assert.equal(await visibleCount(), 512)
  for (const [search, expected] of [['신경 치료', '신경치료(근관치료)'], ['MTA', 'MTA'], ['ㅊㅅ', '치수'], ['잇몸 피', '잇몸 출혈']]) {
    await page.locator('#ency-query').fill(search)
    assert(await page.locator('[data-ency-entry]:not([hidden])').filter({ has: page.locator('.ency-term-name', { hasText: expected }) }).count(), search + ': expected result')
  }
  await page.locator('#ency-query').fill('없는용어확인123456')
  assert.equal(await visibleCount(), 0); assert(await page.locator('#ency-empty').isVisible())
  await page.locator('#ency-empty [data-ency-reset]').click(); assert.equal(await visibleCount(), 512)
  await page.locator('#ency-category').selectOption('implant')
  assert.equal(await visibleCount(), 45)
  await page.locator('[data-initial="ㅇ"]').click(); assert(await visibleCount() > 0 && await visibleCount() < 45)
  await page.locator('[data-ency-category-link="anatomy"]').click(); assert.equal(await visibleCount(), 47)
  await page.locator('.ency-reset').click(); assert.equal(await visibleCount(), 512)
  for (const width of [320, 393, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    for (const path of ['/encyclopedia', '/encyclopedia/enamel', '/encyclopedia/vpt', '/encyclopedia/vpt-vs-rct', '/encyclopedia/emergency-dental', '/encyclopedia/anticoagulant', '/encyclopedia/implant-insurance']) {
      await page.goto(origin + path, { waitUntil: 'networkidle' })
      const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, h1Visible: !!document.querySelector('main h1')?.getBoundingClientRect().height }))
      assert(metrics.scrollWidth <= metrics.width + 1, `${path} at ${width}px: overflow ${metrics.scrollWidth}`)
      assert(metrics.h1Visible)
      report.browser.push({ path, width, ...metrics })
      if ([393, 1440].includes(width) && ['/encyclopedia', '/encyclopedia/vpt-vs-rct', '/encyclopedia/vpt'].includes(path)) await page.screenshot({ path: `.artifacts/encyclopedia/${path.split('/').pop()}-${width}.png`, fullPage: path !== '/encyclopedia' })
      if ([393, 1440].includes(width) && ['/encyclopedia', '/encyclopedia/vpt'].includes(path)) {
        await page.locator(path === '/encyclopedia' ? '#dictionary' : '#clinical-context').evaluate(el => el.scrollIntoView({ block: 'start' }))
        await page.screenshot({ path: `.artifacts/encyclopedia/${path.split('/').pop()}-reading-${width}.png` })
      }
    }
  }
  assert.deepEqual(errors, [], 'Browser errors')
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 393, height: 900 } })
  await nojs.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort())
  const plain = await nojs.newPage()
  await plain.goto(origin + '/encyclopedia'); assert.equal(await plain.locator('[data-ency-entry]').count(), 512)
  assert(!await plain.locator('[data-ency-controls]').isVisible())
  await plain.goto(origin + '/encyclopedia/vpt'); assert(await plain.locator('#clinical-context').isVisible()); assert(await plain.locator('#ency-question-text').isVisible())
  await nojs.close(); await ctx.close()
  report.checks.push('512 unique term editorials and valid curated relationships', '513 SSR pages, unique metadata, canonical, fixed modification dates and no false reviewer', '512 term sitemap URLs and 404 for unknown term', '5 existing routes render without glossary assets', 'Korean/English/initial/alias search, category + initial intersection, reset and category navigation', '28 responsive page/width checks and JavaScript-disabled content')
  await writeFile('.artifacts/encyclopedia-audit.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ...report, pages: report.pages.length, browser: report.browser.length }, null, 2))
} finally {
  await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
}
