// Local SQLite + admin route fixtures only. No production writes or credentials.
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { build } from 'esbuild'
import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { Hono } from 'hono'

const compiled = await build({ stdin: { resolveDir: process.cwd(), contents: `
export { default as app } from './src/index.tsx';
export { default as admin } from './src/routes/admin.ts';
export { clinicDefaults } from './src/data/clinic';
export { treatments } from './src/data/treatments';
export { areaPages } from './src/data/areas';
export { loadClinic, invalidateClinicCache, validSetting } from './src/lib/settings';
export { parseClinicHours } from './src/lib/clinic-hours';
` }, bundle: true, write: false, format: 'esm', platform: 'node' })
const { app, admin, clinicDefaults, treatments, areaPages, loadClinic, invalidateClinicCache, parseClinicHours } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const sqlite = new DatabaseSync(':memory:')
sqlite.exec('CREATE TABLE site_settings(key TEXT PRIMARY KEY,value TEXT,updated_at TEXT); CREATE TABLE staff_audit(actor_id INTEGER,action TEXT,target_id INTEGER,detail TEXT);')
const db = {
  prepare(sql) {
    let args = []
    const supported = /site_settings|INSERT INTO staff_audit/.test(sql)
    const statement = () => sqlite.prepare(sql)
    return { bind(...values) { args = values; return this }, all: async () => ({ results: supported ? statement().all(...args) : [] }), first: async () => supported ? statement().get(...args) || null : null, run: async () => { if (supported) statement().run(...args); return { success: true } } }
  },
  batch: async statements => Promise.all(statements.map(s => s.run())),
}
const env = { DB: db, SITE_URL: 'https://dodamdc.kr' }
const fixture = new Hono()
fixture.use('*', async (c, next) => {
  const role = c.req.header('x-fixture-role') || 'owner'
  c.set('clinic', await loadClinic(db)); c.set('siteUrl', env.SITE_URL)
  c.set('admin', role !== 'anonymous'); c.set('staff', role === 'anonymous' ? null : { id: 1, name: 'Local fixture', role })
  await next()
})
fixture.route('/admin', admin)
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-webgl'] })
const parser = await browser.newPage()
const inspect = source => parser.evaluate(source => {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  return { description: doc.querySelector('meta[name="description"]')?.content, og: doc.querySelector('meta[property="og:description"]')?.content, twitter: doc.querySelector('meta[name="twitter:description"]')?.content, schemas: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)), wednesday: [...doc.querySelectorAll('tr[data-day="수"]')].map(tr => tr.textContent), footer: doc.querySelector('.footer-hours')?.textContent, main: doc.querySelector('main')?.textContent }
}, source)
const get = path => app.request(env.SITE_URL + path, { headers: { 'User-Agent': 'DodamHoursMetaAuditBot', DNT: '1' } }, env)
const post = (fields, role = 'owner') => fixture.request(env.SITE_URL + '/admin/settings', { method: 'POST', headers: { 'x-fixture-role': role }, body: new URLSearchParams(fields) }, env)
const form = hours => Object.assign({ hoursIncluded: '1', hoursException: clinicDefaults.hoursException, hoursNote: clinicDefaults.hoursNote }, ...hours.map((h, i) => {
  const lunch = h.lunch?.split('–') || []
  return { [`hours.${i}.status`]: h.open ? 'open' : 'closed', [`hours.${i}.open`]: h.open || '09:00', [`hours.${i}.close`]: h.close || '18:00', [`hours.${i}.lunchStart`]: lunch[0] || '', [`hours.${i}.lunchEnd`]: lunch[1] || '', [`hours.${i}.note`]: h.note || '' }
}))
let server
const report = { metadata: [], hours: [], browser: [], checks: [] }
try {
  await mkdir('.artifacts/hours-meta', { recursive: true })
  assert.equal(clinicDefaults.hours[2].open, null)
  assert(parseClinicHours(JSON.stringify(clinicDefaults.hours)))
  for (const value of ['[]', '{}', 'null', 'invalid', JSON.stringify(clinicDefaults.hours.slice(1))]) assert.equal(parseClinicHours(value), null)
  const known = new Set()
  for (const t of treatments) {
    const info = await inspect(await (await get('/treatments/' + t.slug)).text())
    assert(info.description.length >= 110 && info.description.length <= 150, t.slug)
    assert(!/[….]{2,}|…/.test(info.description) && /[.!?]$/.test(info.description), t.slug)
    assert.equal(info.description, t.metaDescription); assert.equal(info.og, info.description); assert.equal(info.twitter, info.description)
    assert.equal(info.schemas.find(s => s['@type'] === 'MedicalWebPage').description, info.description)
    assert(!known.has(info.description)); known.add(info.description)
    report.metadata.push({ slug: t.slug, length: info.description.length, description: info.description })
  }
  for (const path of ['/', '/hours', '/directions', '/reservation', '/faq', '/encyclopedia', '/area/' + areaPages[0].slug]) {
    const response = await get(path); assert.equal(response.status, 200, path)
    const source = await response.text(), info = await inspect(source)
    assert(source.includes(clinicDefaults.hoursException), path)
    assert(!/수요일은 점심|수 09:00.*점심시간 없이/.test(source), path)
    assert(info.footer.includes('수휴진'), path)
    for (const row of info.wednesday) assert(row.includes('휴진') && !row.includes('09:00'), path)
    assert(!info.schemas.find(s => s['@type'] === 'Dentist').openingHoursSpecification.some(h => h.dayOfWeek.endsWith('Wednesday')), path)
    report.hours.push(path)
  }
  const llms = await (await get('/llms.txt')).text(); assert(llms.includes('수 휴진') && llms.includes(clinicDefaults.hoursException))
  assert.equal((await post(form(clinicDefaults.hours), 'anonymous')).status, 401)
  assert.equal((await post(form(clinicDefaults.hours), 'reception')).status, 403)
  const values = form(clinicDefaults.hours)
  values['hours.2.status'] = 'open'; values['hours.2.open'] = '10:00'; values['hours.2.close'] = '17:00'
  values['hours.2.lunchStart'] = '12:00'; values['hours.2.lunchEnd'] = '13:00'
  let response = await post(values); assert.equal(response.status, 302); assert(response.headers.get('location').endsWith('#hours'))
  let updated = await loadClinic(db); assert.equal(updated.hours[2].open, '10:00'); assert.equal(updated.hours[2].lunch, '12:00–13:00')
  let hoursPage = await inspect(await (await get('/hours')).text())
  assert(hoursPage.wednesday[0].includes('10:00') && hoursPage.wednesday[0].includes('17:00'))
  assert(hoursPage.schemas.find(s => s['@type'] === 'Dentist').openingHoursSpecification.some(h => h.dayOfWeek.endsWith('Wednesday') && h.opens === '10:00' && h.closes === '12:00'))
  const persisted = sqlite.prepare("SELECT value FROM site_settings WHERE key='hours'").get().value
  for (const overrides of [{ 'hours.2.close': '09:00' }, { 'hours.2.lunchEnd': '' }, { 'hours.2.lunchStart': '08:00' }, { 'hours.2.status': 'anything' }, { 'hours.2.open': '25:00' }, { 'hours.6.status': '' }]) {
    assert.equal((await post({ ...values, ...overrides, hoursException: 'Must not save' })).status, 400)
    assert.equal(sqlite.prepare("SELECT value FROM site_settings WHERE key='hours'").get().value, persisted)
    assert.equal((await loadClinic(db)).hoursException, clinicDefaults.hoursException)
  }
  assert.equal((await post({ slogan: 'Local fixture only' })).status, 302)
  assert.equal(sqlite.prepare("SELECT value FROM site_settings WHERE key='hours'").get().value, persisted)
  assert.equal((await post({ hoursException: '', hoursNote: '' })).status, 302)
  assert.equal((await loadClinic(db)).hoursException, ''); assert.equal((await loadClinic(db)).hoursNote, '')
  await post(form(clinicDefaults.hours))
  const publicRoot = resolve('public')
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      if (url.pathname.startsWith('/static/') || url.pathname === '/favicon.png') {
        const path = resolve(publicRoot, '.' + decodeURIComponent(url.pathname))
        if (!path.startsWith(publicRoot + '/')) { res.writeHead(403); res.end(); return }
        try { const data = await readFile(path); res.writeHead(200, { 'content-type': { '.css': 'text/css', '.js': 'application/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png' }[extname(path)] || 'application/octet-stream' }); res.end(data) } catch { res.writeHead(404); res.end() }
      } else {
        const chunks = []; for await (const chunk of req) chunks.push(chunk)
        const opts = { method: req.method, headers: { ...req.headers, 'user-agent': 'DodamHoursMetaAuditBot', DNT: '1' } }
        if (!['GET', 'HEAD'].includes(req.method)) opts.body = Buffer.concat(chunks)
        const response = await (url.pathname.startsWith('/admin') ? fixture : app).request('http://127.0.0.1:' + server.address().port + req.url, opts, env)
        res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer()))
      }
    } catch (error) { res.writeHead(500); res.end(String(error)) }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = 'http://127.0.0.1:' + server.address().port
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  await ctx.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort())
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message))
  for (const width of [320, 393, 1440]) {
    await page.setViewportSize({ width, height: 960 })
    for (const path of ['/hours', '/admin/settings#hours']) {
      await page.goto(origin + path, { waitUntil: 'networkidle' })
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path + ' overflow at ' + width)
      report.browser.push({ width, path })
      if (width === 393 || width === 1440) await page.screenshot({ path: `.artifacts/hours-meta/${path.startsWith('/admin') ? 'admin' : 'hours'}-${width}.png` })
    }
  }
  await page.setViewportSize({ width: 393, height: 960 })
  await page.goto(origin + '/admin/settings#hours', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.admin-hours-day').count(), 7)
  await page.locator('.admin-hours-jump a[href="#hours-day-2"]').click()
  assert.equal(await page.locator('#hours-2-status').inputValue(), 'closed')
  await page.locator('#hours-2-status').selectOption('open'); await page.locator('#hours-2-open').fill('10:00'); await page.locator('#hours-2-close').fill('17:00')
  await page.getByRole('button', { name: '진료시간 저장', exact: true }).click(); await page.waitForURL('**/admin/settings?saved=1#hours')
  assert.equal(await page.locator('#hours-2-status').inputValue(), 'open'); assert.equal(await page.locator('#hours-2-open').inputValue(), '10:00')
  await page.goto(origin + '/hours'); assert((await page.locator('tr[data-day="수"]').innerText()).includes('10:00'))
  assert.deepEqual(errors, []); await ctx.close()
  report.checks.push('12 complete and unique 110-150 character meta/OG/Twitter/schema descriptions', 'Wednesday closed in tables, footer, FAQ, area and llms; no regular Wednesday opening schema', 'SQLite admin save/load, public rendering, lunch intervals, validation, roles and partial settings preservation', 'Mobile admin select/edit/submit/reload with public schedule update', '6 responsive renders at 320/393/1440px without overflow or JavaScript errors')
  await writeFile('.artifacts/hours-meta-audit.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ metadata: report.metadata.length, hours: report.hours.length, browser: report.browser.length, checks: report.checks }, null, 2))
} finally { await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); sqlite.close() }
