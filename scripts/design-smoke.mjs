// Local-only design regression suite. Does not modify production or submit forms.
// Run: npm run test:design (preview must be running on port 3000).
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const base = 'http://localhost:3000'
await mkdir('.artifacts', { recursive: true })
// Layout matrix uses the supported SVG fallback to avoid repeated software-GPU
// shader compilation. Real WebGL is exercised by test:kinetic separately.
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-webgl'] })
const results = [], problems = []
const routes = ['/', '/mission', '/doctors', '/doctors/han-hwirim', '/treatments', '/floor-guide', '/faq', '/pricing', '/directions', '/hours', '/reservation', '/auth/login', '/auth/register', '/column', '/notice', '/cases/gallery', '/encyclopedia', '/area', '/privacy', '/terms']
const discovery = await browser.newPage()
await discovery.goto(base)
const treatments = await discovery.locator('.treatment-directory a, .care-panel .editorial-link').evaluateAll(as => as.map(a => new URL(a.href).pathname))
routes.push(...new Set(treatments))
await discovery.close()

try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 1440 ? 1000 : 844 } })
    const page = await context.newPage()
    page.on('pageerror', e => problems.push({ width, url: page.url(), error: e.message }))
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' })
      await page.waitForTimeout(120)
      const info = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        h1: document.querySelectorAll('h1').length,
        title: document.title,
        horizontalOverflow: [...document.querySelectorAll('main *')].filter(el => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el)
          return s.position !== 'absolute' && s.position !== 'fixed' && r.width && r.right > innerWidth + 2 && !el.closest('.table-wrap, .reading-nav, .philosophy-wordmark, .admin-table')
        }).slice(0, 5).map(el => el.tagName + '.' + el.className),
      }))
      const result = { width, route, status: response.status(), ...info }
      results.push(result)
      console.log(`${width}px ${route}: ${result.status}, overflow=${info.scrollWidth - width}`)
      if (result.status !== 200 || info.h1 !== 1 || info.scrollWidth > width + 1) problems.push(result)
    }
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.getByRole('tab').nth(1).click()
    assert.equal(await page.locator('#care-panel-1').isVisible(), true)
    assert.equal(await page.locator('#care-panel-0').isVisible(), false)
    await page.getByRole('tab').nth(1).press('ArrowRight')
    assert.equal(await page.getByRole('tab').nth(2).getAttribute('aria-selected'), 'true')
    await page.getByRole('tab').nth(2).press('Home')
    assert.equal(await page.locator('#care-panel-0').isVisible(), true)
    await page.locator('#home-faq summary').first().click()
    assert.equal(await page.locator('#home-faq details').first().getAttribute('open'), '')
    if (width === 390) {
      await page.evaluate(() => scrollTo(0, 0))
      await page.locator('#menu-toggle').click()
      assert.equal(await page.locator('#mobile-nav').isVisible(), true)
      assert.equal(await page.locator('#main').evaluate(el => el.inert), true)
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('#mobile-nav').isVisible(), false)
      assert.equal(await page.locator('#main').evaluate(el => el.inert), false)
    }
    // Load lazy media and reveal all sections before full-page screenshots.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 100))
      }
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await page.waitForTimeout(1000)
    const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src))
    if (broken.length) problems.push({ width, brokenImages: broken })
    await page.screenshot({ path: `.artifacts/home-${width}-full.png`, fullPage: true })
    await page.screenshot({ path: `.artifacts/home-${width}-hero.png` })
    for (const [path, name] of [['/mission', 'mission'], ['/treatments/implant', 'treatment'], ['/doctors/han-hwirim', 'doctor'], ['/reservation', 'reservation']]) {
      await page.goto(base + path, { waitUntil: 'networkidle' })
      await page.waitForTimeout(500)
      await page.screenshot({ path: `.artifacts/${name}-${width}.png` })
    }
    await page.goto(base + '/faq', { waitUntil: 'networkidle' })
    await page.locator('.faq-search input').fill('존재하지않는검색어XYZ')
    assert.equal(await page.locator('.faq-empty').isVisible(), true)
    await page.locator('.faq-search input').fill('')
    await page.goto(base + '/reservation?treatment=implant', { waitUntil: 'networkidle' })
    assert.equal(await page.locator('#treatment').inputValue(), '임플란트')
    await page.locator('#reservation-form button[type=submit]').click()
    assert.equal(await page.locator('#name').evaluate(el => el.validity.valueMissing), true)
    const afterImage = await context.request.get(base + '/files/cases/after/design-test.webp')
    assert.equal(afterImage.status(), 401)
    await context.close()
  }
  // Small-phone / tablet layout boundaries.
  for (const width of [320, 768, 1024, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    for (const route of ['/', '/treatments', '/reservation', '/mission']) {
      await page.goto(base + route, { waitUntil: 'networkidle' })
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      results.push({ width, route, scrollWidth })
      if (scrollWidth > width + 1) problems.push({ width, route, scrollWidth })
    }
    await page.close()
  }
  // Finishing pass: touch controls, Q/A gutters and sticky reading navigation.
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await page.goto(base, { waitUntil: 'networkidle' })
    // Rotation buttons intentionally stay hidden in SVG fallback; test them with WebGL.
    await page.locator('.motion-toggle').waitFor({ state: 'visible' })
    for (const selector of ['.motion-toggle', ...(width < 1000 ? ['#menu-toggle', '.header-cta'] : [])]) {
      const rect = await page.locator(selector).first().boundingBox()
      assert.ok(rect && rect.height >= 44, `${selector}: minimum 44px target at ${width}px`)
    }
    await page.locator('#home-faq summary').first().click()
    const answer = page.locator('#home-faq .faq-a').first()
    assert.ok(await answer.evaluate(el => {
      const s = getComputedStyle(el), marker = getComputedStyle(el, '::before')
      return parseFloat(s.paddingLeft) - parseFloat(marker.left) >= 24
    }), 'FAQ answer marker must have a separate gutter')
    await page.goto(base + '/treatments/implant', { waitUntil: 'networkidle' })
    assert.equal(await page.locator('.gnb-list>li.is-current-section>a').getAttribute('href'), '/treatments')
    assert.equal(await page.locator('.reading-nav [aria-current="location"]').getAttribute('href'), '#summary')
    await page.locator('.reading-nav a[href="#faq"]').click()
    await page.waitForTimeout(300)
    assert.equal(await page.locator('.reading-nav [aria-current="location"]').getAttribute('href'), '#faq')
    const faqTop = await page.locator('#faq').evaluate(el => el.getBoundingClientRect().top)
    const toolbarBottom = await page.locator('.reading-nav').evaluate(el => el.getBoundingClientRect().bottom)
    assert.ok(faqTop >= toolbarBottom - 1 && faqTop <= toolbarBottom + 65, 'Anchor remains visible below both sticky bars')
    if (width < 1000) {
      await page.locator('#menu-toggle').click()
      assert.equal(await page.locator('#mobile-nav a[href="/treatments/implant"]').getAttribute('aria-current'), 'page')
      assert.equal(await page.locator('#mobile-nav a[href="/treatments/implant"]').isVisible(), true)
      await page.keyboard.press('Escape')
    }
    await page.close()
  }
  const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
  const plain = await noJS.newPage()
  await plain.goto(base)
  assert.equal(await plain.locator('#care-panel-2').isVisible(), true)
  assert.equal(await plain.locator('#dodam-philosophy h2').isVisible(), true)
  await noJS.close()
  const reduced = await browser.newContext({ reducedMotion: 'reduce' })
  const calm = await reduced.newPage()
  await calm.goto(base)
  assert.equal(await calm.locator('#hero-title').evaluate(el => getComputedStyle(el).animationName), 'none')
  await reduced.close()
} finally {
  await browser.close()
  await writeFile('.artifacts/design-smoke-results.json', JSON.stringify({ results, problems }, null, 2))
}
console.log(JSON.stringify({ viewsChecked: results.length, problems }, null, 2))
assert.equal(problems.length, 0, 'Design regressions found; see .artifacts/design-smoke-results.json')
