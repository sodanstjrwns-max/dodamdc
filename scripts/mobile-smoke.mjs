// Mobile resource/interaction checks in a local Chromium lab, not field Core Web Vitals.
import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, stat } from 'node:fs/promises'
await mkdir('.artifacts', { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const base = 'http://localhost:3000'
const result = { checks: [], fontBytes: {}, resourceSamples: [], errors: [] }
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true })
  page.on('pageerror', error => result.errors.push(error.message))
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.addInitScript(() => { Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '2g' } }) })
  await page.goto(base, { waitUntil: 'networkidle' })
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'ready')
  await page.waitForTimeout(1600)
  await expect(page.locator('#model-enable')).toBeVisible()
  assert.equal(requests.some(url => url.includes('tooth-scene-')), false, 'Save-data mode must not download Three.js before opt-in')
  await page.evaluate(() => document.fonts.ready)
  const fonts = requests.filter(url => url.endsWith('.woff2'))
  assert.equal(fonts.some(url => url.includes('WantedSansVariable')), false)
  assert.equal(fonts.some(url => url.includes('Extended')), false, 'Home should only need the core subset')
  assert.ok(fonts.some(url => url.includes('Core-v1')))
  result.resourceSamples.push({ page: '/', saveData: true, fontRequests: fonts, sceneRequested: false })
  result.checks.push('Save-data/2G keeps SVG without downloading the 3D bundle; core font only')
  await page.locator('#model-enable').click()
  await expect(page.locator('#tooth-render')).toHaveAttribute('data-render', 'webgl', { timeout: 25000 })
  await expect(page.locator('#model-enable')).toBeHidden()
  const controls = await page.locator('#model-rotate-left').boundingBox()
  assert.ok(controls.width >= 44 && controls.height >= 44)
  result.checks.push('Explicit opt-in loads working WebGL with 44px rotation controls')
  await page.goto(base + '/treatments/implant', { waitUntil: 'networkidle' })
  const photo = page.locator('.page-hero-img img')
  await expect(photo).toHaveJSProperty('complete', true)
  const selection = await photo.evaluate(img => ({ src: img.currentSrc, width: img.naturalWidth }))
  assert.ok(selection.src.endsWith('-sm.webp'), 'Mobile DPR1 should choose the small image')
  result.resourceSamples.push({ page: '/treatments/implant', image: selection })
  const medicalText = await page.locator('.treatment-answer').textContent()
  assert.ok(medicalText.length > 15)
  result.checks.push('Responsive clinical image chooses small source; direct-answer text visible')
  await page.goto(base + '/pricing', { waitUntil: 'networkidle' })
  const note = page.locator('.price-table td.note').first()
  assert.equal(await note.evaluate(el => getComputedStyle(el).display), 'table-cell')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390)
  result.checks.push('Mobile pricing keeps qualifications/notes inside accessible horizontal table')
  // Zoom and short landscape viewport: no locked scaling or document overflow.
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 500 })
    await page.goto(base + '/reservation', { waitUntil: 'networkidle' })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    await page.locator('#menu-toggle').click()
    await expect(page.locator('#mobile-nav')).toBeVisible()
    await page.keyboard.press('Escape')
  }
  result.checks.push('Small phone and short tablet viewport retain menu and form access')
  await page.close()
  result.fontBytes = { original: (await stat('public/static/fonts/WantedSansVariable.woff2')).size, initialCore: (await stat('public/static/fonts/WantedSansCore-v1.woff2')).size }
  assert.ok(result.fontBytes.initialCore < result.fontBytes.original * 0.2)
} catch (error) { result.errors.push(error.stack || String(error)) }
finally { await browser.close(); await writeFile('.artifacts/mobile-audit.json', JSON.stringify(result, null, 2)) }
console.log(JSON.stringify(result, null, 2))
assert.equal(result.errors.length, 0, 'Mobile optimization checks failed')
