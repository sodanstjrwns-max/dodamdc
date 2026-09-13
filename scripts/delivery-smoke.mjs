import { chromium, webkit } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const base = process.env.DELIVERY_BASE_URL || 'http://localhost:3000'
assert(['http://localhost:3000', 'https://dodamdc.kr'].includes(base))
const live = base.startsWith('https:')
const report = { base, checkedAt: new Date().toISOString(), checks: [], errors: [] }
await mkdir('.artifacts', { recursive: true })
for (const [name, engine] of [['chromium', chromium], ...(process.env.TEST_WEBKIT ? [['webkit', webkit]] : [])]) {
  const browser = await engine.launch({ ...(name === 'chromium' ? { args: ['--no-sandbox'] } : {}) })
  try {
    for (const width of [320, 390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, userAgent: 'DodamDeliveryAuditBot/1.0', extraHTTPHeaders: { DNT: '1' }, reducedMotion: 'reduce' })
      await context.route('**/*', route => {
        const request = route.request(), url = new URL(request.url())
        if (!['GET', 'HEAD'].includes(request.method()) || /google-analytics|googletagmanager|clarity\.ms|pf-dashboard-2nt/.test(url.hostname)) return route.abort()
        return route.continue()
      })
      const page = await context.newPage(), errors = []
      page.on('pageerror', error => errors.push(String(error)))
      const response = await page.goto(base + '/handover', { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200)
      assert.match(response.headers()['x-robots-tag'], /noindex/)
      assert.equal(await page.locator('main h1').count(), 1)
      assert.equal(await page.locator('meta[name="conversion-ticket"]').count(), 0)
      assert.equal(await page.locator('script[src*="googletagmanager"]').count(), 0)
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://dodamdc.kr/handover')
      assert(await page.locator('h1').isVisible())
      assert.match(await page.locator('h1').textContent(), /하얗게 불태웠습니다/)
      assert.match(await page.locator('#delivery-payment').textContent(), /15,000,000/)
      assert.equal(await page.locator('#payment-account-number').textContent(), '1085-02-007634')
      assert.match(await page.locator('#delivery-payment').textContent(), /문석준/)
      assert.match(await page.locator('#delivery-payment').textContent(), /2주 이내/)
      assert.match(await page.locator('.handover-promise').textContent(), /영원히입니다/)
      await page.evaluate(() => { window.__copied = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text } } }) })
      await page.locator('[data-copy-target="payment-account-number"]').click()
      assert.equal(await page.evaluate(() => window.__copied), '1085-02-007634')
      await page.locator('.handover-message summary').click()
      await page.locator('[data-copy-target="delivery-message"]').click()
      assert.match(await page.evaluate(() => window.__copied), /농협 1085-02-007634 \/ 예금주 문석준/)
      assert.match(await page.locator('#delivery-message').inputValue(), /1,500만 원/)
      await page.locator('.handover-message summary').click()
      const box = await page.locator('#handover-print').boundingBox()
      assert(box.height >= 44 && box.width >= 44)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow')
      await page.evaluate(() => { window.__printCount = 0; window.print = () => window.__printCount++ })
      await page.locator('#handover-print').click()
      assert.equal(await page.evaluate(() => window.__printCount), 1)
      for (const anchor of await page.locator('.handover-toc a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')))) {
        assert.equal(await page.locator(anchor).count(), 1)
      }
      if (width === 390 || width === 1440) await page.screenshot({ path: `.artifacts/delivery-${live ? 'live' : 'local'}-${name}-${width}.png`, fullPage: true })
      if (name === 'chromium' && width === 1440) {
        await page.emulateMedia({ media: 'print' })
        assert.equal(await page.locator('.site-header').isVisible(), false)
        assert.equal(await page.locator('#handover-print').isVisible(), false)
        await page.pdf({ path: '.artifacts/delivery-print-check.pdf', format: 'A4', printBackground: true })
      }
      assert.deepEqual(errors, [])
      report.checks.push(`${name} ${width}px: noindex, heading, canonical, no analytics ticket, no overflow, print button, section links, no JS errors`)
      await context.close()
    }
  } catch (error) { report.errors.push(String(error.stack || error)) }
  finally { await browser.close() }
}
await writeFile(`.artifacts/delivery-${live ? 'live' : 'local'}-audit.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
assert.equal(report.errors.length, 0)
