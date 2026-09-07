// Local-only isolated D1 tests. No email credentials, real bookings or production calls.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { chromium } from '@playwright/test'

await build({ entryPoints: ['src/index.tsx'], outfile: '.artifacts/journey-app.mjs', bundle: true, platform: 'node', format: 'esm', jsx: 'automatic', jsxImportSource: 'hono/jsx' })
const { default: app } = await import('../.artifacts/journey-app.mjs?test=' + Date.now())
const mf = new Miniflare(convertV4MiniflareOptions({ name: 'fixture', compatibilityDate: '2026-09-01', modules: true, script: 'export default {fetch(){return new Response("test")}}', d1Databases: ['DB'] }))
const db = await mf.getD1Database('DB')
const secret = 'isolated-test-secret-not-a-production-credential'
const env = { DB: db, SESSION_SECRET: secret, ADMIN_PASSWORD: 'test-only-password', SITE_URL: 'https://clinic.example' }
const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36'
const origin = 'https://preview.example'
const checks = []
async function request(path, init = {}, host = origin) {
  const jobs = []
  const response = await app.fetch(new Request(host + path, { ...init, headers: { 'user-agent': ua, ...init.headers } }), env, { waitUntil(p) { jobs.push(p) }, passThroughOnException() {} })
  await Promise.all(jobs)
  return response
}
async function ticket(path = '/treatments/implant?name=PRIVATE&phone=PRIVATE', host = origin) {
  const source = await (await request(path, {}, host)).text()
  return source.match(/name="conversion-ticket" content="([^"]+)"/)?.[1]
}
async function post(payload, headers = {}, host = origin) {
  return request('/api/conversions', { method: 'POST', headers: { origin: host, 'content-type': 'application/json', ...headers }, body: typeof payload === 'string' ? payload : JSON.stringify(payload) }, host)
}
const total = async event => (await db.prepare('SELECT COALESCE(SUM(count),0) n FROM conversion_daily WHERE event=?').bind(event).first()).n
let browser
try {
  for (const file of ['migrations/0001_initial_schema.sql', 'migrations/0002_conversion_aggregates.sql']) {
    const sql = (await readFile(file, 'utf8')).replace(/--[^\n]*/g, '')
    await db.batch(sql.split(';').map(s => s.trim()).filter(Boolean).map(s => db.prepare(s)))
  }
  const t = await ticket()
  assert.ok(t)
  const decoded = JSON.parse(Buffer.from(t.split('.')[0], 'base64url').toString())
  assert.equal(decoded.page, '/treatments/implant')
  assert.equal(JSON.stringify(decoded).includes('PRIVATE'), false)
  const payload = { event: 'naver_click', location: 'header', ticket: t }
  assert.equal((await post(payload)).status, 204)
  assert.equal((await post(payload)).status, 204)
  assert.equal(await total('naver_click'), 1, 'Replay must not count twice')
  const concurrent = { ...payload, location: 'mobile_bar' }
  const repeated = await Promise.all(Array.from({ length: 8 }, () => post(concurrent)))
  assert.ok(repeated.every(r => r.status === 204))
  assert.equal(await total('naver_click'), 2, 'Concurrent duplicate must remain one action')
  checks.push('Signed per-render ticket, atomic replay/concurrent deduplication, query exclusion')

  for (const invalid of [{ ...payload, name: 'PRIVATE' }, { ...payload, event: 'form_completed' }, { ...payload, location: 'arbitrary' }, { ...payload, page: '/private' }, { ...payload, event: '__proto__' }, { ...payload, event: ['naver_click'] }, { ...payload, location: ['header'] }, [], null]) assert.equal((await post(invalid)).status, 400)
  assert.equal((await post('{')).status, 400)
  assert.equal((await post(payload, { origin: 'https://evil.example' })).status, 403)
  assert.equal((await post(payload, { 'sec-fetch-site': 'cross-site' })).status, 403)
  assert.equal((await post(payload, { 'content-type': 'text/plain' })).status, 415)
  assert.equal((await post('x'.repeat(2500))).status, 413)
  assert.equal((await request('/api/conversions')).status, 404)
  assert.equal((await post({ ...payload, ticket: t + 'tampered' })).status, 403)
  // Validly signed but expired ticket, generated only within this isolated test.
  const expiredBody = Buffer.from(JSON.stringify({ ...decoded, exp: 1 })).toString('base64url')
  const { createHmac } = await import('node:crypto')
  const expired = expiredBody + '.' + createHmac('sha256', secret).update(expiredBody).digest('base64url')
  assert.equal((await post({ ...payload, ticket: expired })).status, 403)
  for (const headers of [{ 'user-agent': 'Googlebot' }, { dnt: '1' }, { 'sec-gpc': '1' }]) {
    assert.equal((await post({ ...payload, location: 'footer' }, headers)).status, 204)
    assert.equal((await (await request('/', { headers })).text()).includes('name="conversion-ticket"'), false)
  }
  assert.equal(await total('naver_click'), 2)
  checks.push('Reject extra fields, fabricated completion, oversized payload, foreign origin, tampering; honor bot/DNT/GPC exclusions')

  const prod = await ticket('/treatments/implant', env.SITE_URL)
  assert.equal((await post({ ...payload, ticket: prod }, {}, env.SITE_URL)).status, 204)
  assert.equal((await post({ ...payload, ticket: prod })).status, 403)
  assert.equal((await db.prepare("SELECT SUM(count) n FROM conversion_daily WHERE scope='production'").first()).n, 1)
  assert.equal((await db.prepare("SELECT SUM(count) n FROM conversion_daily WHERE scope='preview'").first()).n, 2)
  checks.push('Production/preview isolation and origin-bound ticket')

  const form = new URLSearchParams({ name: 'ISOLATED_FIXTURE', phone: '01000000000', treatment: 'PRIVATE_CHOICE', message: 'PRIVATE_MESSAGE', agree: '1' })
  const submit = async body => request('/reservation', { method: 'POST', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' }, body: body.toString() })
  assert.equal((await submit(new URLSearchParams({ name: 'invalid' }))).status, 200)
  assert.equal(await total('form_completed'), 0)
  assert.equal((await submit(form)).status, 302)
  assert.equal(await total('form_completed'), 1)
  await request('/reservation?ok=1'); await request('/reservation?ok=1')
  assert.equal(await total('form_completed'), 1)
  // Force only the aggregate to fail: reservation insertion must roll back too.
  await db.prepare("CREATE TRIGGER fail_completion BEFORE INSERT ON conversion_daily WHEN NEW.event='form_completed' BEGIN SELECT RAISE(ABORT,'fixture failure'); END").run()
  const oldError = console.error; console.error = () => {}
  try { assert.equal((await submit(form)).status, 500) } finally { console.error = oldError }
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM reservations').first()).n, 1)
  assert.equal(await total('form_completed'), 1)
  await db.prepare('DROP TRIGGER fail_completion').run()
  const aggregates = JSON.stringify((await db.prepare('SELECT * FROM conversion_daily').all()).results)
  assert.equal(/PRIVATE|ISOLATED_FIXTURE|01000000000/.test(aggregates), false)
  const columns = (await db.prepare('PRAGMA table_info(conversion_daily)').all()).results.map(r => r.name)
  assert.deepEqual(columns, ['day', 'scope', 'page', 'event', 'location', 'count'])
  checks.push('Completion only on successful reservation transaction; invalid forms, refresh, rollback and PII isolation verified')

  await db.prepare("INSERT INTO conversion_daily VALUES ('2000-01-01','preview','/','phone_click','header',1)").run()
  await db.prepare("INSERT INTO conversion_receipts VALUES ('expired', 1)").run()
  await post({ ...payload, event: 'phone_click' })
  assert.equal(await db.prepare("SELECT * FROM conversion_daily WHERE day='2000-01-01'").first(), null)
  assert.equal(await db.prepare("SELECT * FROM conversion_receipts WHERE receipt='expired'").first(), null)
  assert.equal((await request('/admin/stats')).status, 302)
  const login = await request('/admin/login', { method: 'POST', headers: { origin, 'content-type': 'application/x-www-form-urlencoded' }, body: 'password=test-only-password' })
  const cookie = login.headers.get('set-cookie')?.split(';')[0]
  assert.ok(cookie)
  const stats = await request('/admin/stats?scope=preview', { headers: { cookie } })
  assert.equal(stats.status, 200)
  assert.ok((await stats.text()).includes('id="conversion-stats"'))
  assert.equal((await (await request('/', { headers: { cookie } })).text()).includes('name="conversion-ticket"'), false)
  checks.push('Retention cleanup and authenticated administrator summaries')

  browser = await chromium.launch({ args: ['--no-sandbox', '--disable-webgl'] })
  const context = await browser.newContext({ userAgent: ua, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const sent = [], errors = []
  page.on('pageerror', e => errors.push(e.message))
  // Intercept analytics: tests must not pollute even the sandbox's preview DB.
  await page.route('**/api/conversions', async route => { sent.push(route.request().postDataJSON()); await route.fulfill({ status: 204 }) })
  await context.route('https://m.booking.naver.com/**', route => route.fulfill({ status: 200, body: 'External booking was not contacted.' }))
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/first-visit', '/treatments', '/treatments/vpt-crown', '/treatments/periodontal', '/treatments/implant']) {
      await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' })
      assert.equal(await page.locator('main h1').count(), 1)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} overflow ${width}`)
      if (path.startsWith('/treatments/')) {
        await page.locator('.reading-nav a[href="#consultation-guide"]').click()
        const anchor = await page.locator('#consultation-guide').boundingBox()
        assert.ok(anchor.y >= 70 && anchor.y < 400, `${path} anchor position ${anchor.y}`)
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  assert.equal(await page.locator('#patient-situations .situation-card').count(), 5)
  await page.locator('#patient-situations .situation-card').first().click()
  assert.ok(page.url().endsWith('/treatments/vpt-crown#consultation-guide'))
  await page.locator('.mobile-action-bar [data-booking-provider="naver"]').click()
  await page.waitForTimeout(200)
  await page.locator('.mobile-action-bar [data-booking-provider="naver"]').click()
  await page.waitForTimeout(200)
  assert.equal(sent.filter(x => x.event === 'naver_click').length, 1)
  assert.equal(sent.at(-1).location, 'mobile_bar')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('http://localhost:3000/treatments/implant', { waitUntil: 'networkidle' })
  // Keep native trusted clicks but suppress tel/external/navigation side effects.
  await page.evaluate(() => document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault() }, true))
  for (const [selector, event, location] of [
    ['.header-cta', 'naver_click', 'header'],
    ['.reading-reserve', 'reservation_click', 'reading_nav'],
    ['.consultation-guide .btn', 'reservation_click', 'consultation'],
    ['.side-cta a[href^="tel:"]', 'phone_click', 'sidebar'],
    ['.footer-cta-actions a[href*="pf.kakao.com"]', 'kakao_click', 'footer'],
    ['.cta-strip [data-booking-provider="naver"]', 'naver_click', 'cta_strip'],
  ]) {
    await page.locator(selector).click()
    await page.waitForTimeout(100)
    assert.equal(sent.at(-1).event, event)
    assert.equal(sent.at(-1).location, location)
  }
  await page.locator('#consultation-guide').screenshot({ path: '.artifacts/journey-treatment-desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  for (const payload of sent) assert.deepEqual(Object.keys(payload).sort(), ['event', 'location', 'ticket'])
  await page.goto('http://localhost:3000/first-visit', { waitUntil: 'networkidle' })
  await page.screenshot({ path: '.artifacts/journey-first-visit-mobile.png', fullPage: true })
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.locator('#patient-situations').screenshot({ path: '.artifacts/journey-situations-mobile.png' })
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const fallback = await nojs.newPage()
  await fallback.goto('http://localhost:3000/first-visit')
  assert.equal(await fallback.locator('.visit-steps>li').count(), 6)
  await fallback.locator('#first-visit-faq summary').first().click()
  assert.equal(await fallback.locator('#first-visit-faq details').first().getAttribute('open'), '')
  assert.deepEqual(errors, [])
  checks.push('24 new-page viewport combinations; anchors, real click payload/dedup, no-JS steps and FAQ')
  console.log(JSON.stringify({ checks, errors: [] }, null, 2))
  await writeFile('.artifacts/journey-audit.json', JSON.stringify({ checks, errors: [] }, null, 2))
} finally {
  await browser?.close()
  await mf.dispose()
}
