// Local-only checks for the source-aligned WebGL and scroll experience.
import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

await mkdir('.artifacts', { recursive: true })
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const base = 'http://localhost:3000'
const checks = [], errors = []
const check = name => { checks.push(name); console.log('PASS', name) }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base, { waitUntil: 'networkidle' })
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'ready')
  await expect(page.locator('#tooth-render')).toHaveAttribute('data-render', 'webgl', { timeout: 20000 })
  await page.waitForTimeout(1800)
  assert.match(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily), /Wanted Sans/)
  await expect(page.locator('.hero-slogan')).toHaveText('이해될 때까지 설명하고, 필요한 만큼만 치료합니다.')
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--nature').trim()), '#b9e7a6')
  check('Original slogan, approved blue/green direction, and self-hosted Wanted Sans')
  await page.locator('#model-rotate-right').click()
  assert.ok(Number(await page.locator('#tooth-render').getAttribute('data-rotation')) > 0.5)
  await page.locator('#model-rotate-left').click()
  assert.equal(Number(await page.locator('#tooth-render').getAttribute('data-rotation')), 0)
  check('WebGL loads and both keyboard-accessible rotation buttons work')
  await page.locator('#motion-toggle').click()
  await expect(page.locator('body')).toHaveClass(/motion-paused/)
  assert.equal(await page.locator('.brand-ticker-track').evaluate(el => getComputedStyle(el).animationPlayState), 'paused')
  assert.equal(await page.locator('.is-scroll-gallery').count(), 0)
  await page.locator('#model-rotate-right').click()
  assert.ok(Number(await page.locator('#tooth-render').getAttribute('data-rotation')) > 0.5)
  await page.screenshot({ path: '.artifacts/kinetic-final-desktop.png' })
  await page.locator('#motion-toggle').click()
  await expect(page.locator('body')).toHaveClass(/motion-enabled/)
  await page.waitForTimeout(1300)
  check('Motion toggle stops automatic motion and removes scroll pinning')

  const range = await page.locator('#space-experience').evaluate(el => {
    const view = document.getElementById('space-viewport')
    const track = document.querySelector('.space-track')
    return { start: el.getBoundingClientRect().top + scrollY - 115, distance: (track.scrollWidth - view.clientWidth) * Number(el.dataset.scrollRatio), ratio: Number(el.dataset.scrollRatio) }
  })
  assert.ok(range.ratio > 0 && range.ratio <= 0.65, 'Gallery pin distance is deliberately shorter than the previous 1.05 ratio')
  await page.evaluate(({ start, distance }) => scrollTo({ top: start + distance * 0.57, behavior: 'instant' }), range)
  await page.waitForTimeout(1300)
  await expect(page.locator('#space-current')).toHaveText('02')
  assert.notEqual(await page.locator('.space-track').evaluate(el => getComputedStyle(el).transform), 'none')
  await page.screenshot({ path: '.artifacts/kinetic-gallery-desktop.png' })
  await page.locator('#space-next').click()
  await expect(page.locator('#space-current')).toHaveText('03', { timeout: 8000 })
  check('Desktop scroll gallery, progress, and next button')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(1000)
  assert.equal(await page.locator('.is-scroll-gallery').count(), 0)
  const viewport = page.locator('#space-viewport')
  await viewport.evaluate(el => el.scrollTo({ left: 0, behavior: 'instant' }))
  await expect(page.locator('#space-current')).toHaveText('01')
  await page.locator('#space-next').click()
  await expect(page.locator('#space-current')).toHaveText('02')
  await page.locator('#space-next').click()
  await expect(page.locator('#space-current')).toHaveText('03')
  check('Resize cleanly removes pinning; mobile native gallery remains usable')
  await page.goto(base, { waitUntil: 'networkidle' })
  await expect(page.locator('#tooth-render')).toHaveAttribute('data-render', 'webgl', { timeout: 20000 })
  await page.waitForTimeout(1800)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390)
  for (const selector of ['#model-rotate-left', '#model-rotate-right']) {
    const target = await page.locator(selector).boundingBox()
    assert.ok(target && target.width >= 44 && target.height >= 44, 'WebGL rotation controls have 44px touch targets')
  }
  await page.screenshot({ path: '.artifacts/kinetic-final-mobile.png' })
  await page.locator('#menu-toggle').click()
  await expect(page.locator('#mobile-nav')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#mobile-nav')).toBeHidden()
  check('Mobile WebGL, no horizontal page overflow, and menu interaction')
  await page.close()

  const reduced = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } })
  const calm = await reduced.newPage()
  await calm.goto(base, { waitUntil: 'networkidle' })
  await expect(calm.locator('body')).toHaveClass(/motion-paused/)
  assert.equal(await calm.locator('.brand-ticker-track').evaluate(el => getComputedStyle(el).animationName), 'none')
  assert.equal(await calm.locator('.is-scroll-gallery').count(), 0)
  check('System reduced-motion preference respected')
  await reduced.close()

  const fallback = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (String(type).includes('webgl')) return null
      return original.call(this, type, ...args)
    }
  })
  const plain = await fallback.newPage()
  plain.on('pageerror', error => errors.push(error.message))
  await plain.goto(base, { waitUntil: 'networkidle' })
  await expect(plain.locator('#tooth-render')).toHaveAttribute('data-render', 'fallback', { timeout: 15000 })
  await expect(plain.locator('.tooth-fallback')).toBeVisible()
  await expect(plain.locator('.model-controls')).toBeHidden()
  await plain.screenshot({ path: '.artifacts/kinetic-fallback-mobile.png' })
  check('WebGL-disabled devices retain original SVG branding and usable content')
  await fallback.close()

  const noJS = await browser.newContext({ javaScriptEnabled: false })
  const readable = await noJS.newPage()
  await readable.goto(base)
  await expect(readable.locator('.tooth-fallback')).toBeVisible()
  await expect(readable.locator('#care-panel-2')).toBeVisible()
  await expect(readable.locator('.nojs-navigation')).toBeVisible()
  await expect(readable.locator('.space-controls')).toBeHidden()
  check('No-JavaScript content, image fallback, and navigation remain accessible')
  await noJS.close()
  assert.equal(errors.length, 0)
} finally {
  await browser.close()
  await writeFile('.artifacts/kinetic-smoke-results.json', JSON.stringify({ checks, errors }, null, 2))
}
console.log(JSON.stringify({ checks: checks.length, errors }, null, 2))
