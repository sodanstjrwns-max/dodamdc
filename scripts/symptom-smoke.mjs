// Read-only browser tests, including live mode. Never submit reservations or access patients.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { chromium, webkit, expect } from '@playwright/test'
const base = process.env.BASE_URL || 'http://localhost:3000'
const live = base.startsWith('https://dodamdc.kr')
await build({ entryPoints: ['src/data/symptom-check.ts', 'src/data/treatments/index.ts'], outdir: '.artifacts/symptom-data', bundle: true, platform: 'node', format: 'esm', outExtension: { '.js': '.mjs' } })
const { symptomAreas, symptomGuides } = await import('../.artifacts/symptom-data/symptom-check.mjs')
const { getTreatment } = await import('../.artifacts/symptom-data/treatments/index.mjs')
const ids = symptomAreas.flatMap(a => a.symptoms.map(s => s.id))
assert.equal(new Set(ids).size, ids.length)
assert.equal(symptomAreas.length, 7)
for (const a of symptomAreas) for (const s of a.symptoms) {
  assert(s.guides.length)
  for (const id of s.guides) { assert(symptomGuides[id]); for (const slug of symptomGuides[id].treatments) assert(getTreatment(slug)) }
}
const js = await readFile('public/static/symptom-check.js', 'utf8')
assert(!/fetch\s*\(|sendBeacon|localStorage|sessionStorage|document\.cookie|pushState|replaceState/.test(js))
const audit = { base, areas: symptomAreas.length, symptoms: ids.length, mappings: 'valid', views: [], errors: [] }
const response = await fetch(base + '/symptom-check')
assert.equal(response.status, 200)
assert.equal(response.headers.get('referrer-policy'), 'no-referrer')
assert.match(response.headers.get('cache-control'), /no-store.*no-transform/)
assert.match(response.headers.get('content-security-policy'), /connect-src 'none'/)
const markup = await response.text()
assert(!/conversion-ticket|clarity\.ms|googletagmanager|pf-dashboard-2nt|beacon\.js/.test(markup))
assert.match(markup, /href="https:\/\/dodamdc.kr\/symptom-check"/)
assert.equal((markup.match(/<h1[\s>]/g) || []).length, 1)
assert.equal((await fetch(base + '/symptom-check/', {redirect:'manual'})).status,301)
const sitemap = await (await fetch(base + '/sitemap.xml')).text()
assert(sitemap.includes('/symptom-check</loc>'))
for (const [engineName, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ args: engineName === 'chromium' ? ['--no-sandbox'] : [] })
  try {
    for (const width of [320, 390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      const external = [], sent = []
      page.on('pageerror', e => audit.errors.push(e.message))
      page.on('request', r => {
        if (!r.url().startsWith(base) && /^https?:/.test(r.url())) external.push(r.url())
        if (r.method() !== 'GET' || /\/api\//.test(r.url())) sent.push(r.url())
      })
      await page.goto(base + '/symptom-check', { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const checkWidth = async () => assert((await page.evaluate(() => document.documentElement.scrollWidth)) <= width + 1)
      await checkWidth()
      await expect(page.locator('#symptom-results')).toBeHidden()
      await page.locator('#symptom-next').click()
      await expect(page.locator('#symptom-area-error')).toContainText('부위를 하나')
      // Keyboard-native radio group and next-step focus.
      await page.locator('[name="area"]').first().focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('[name="area"][value="molar"]')).toBeChecked()
      await page.locator('#symptom-next').click()
      await expect(page.locator('#symptom-choice-title')).toBeFocused()
      await page.locator('#symptom-result-button').click()
      await expect(page.locator('#symptom-choice-error')).toContainText('한 가지 이상')
      await page.locator('#symptom-back').click()
      // Exhaustively exercise each mapping on both engines at mobile width; all-select on other sizes.
      for (const area of symptomAreas) {
        await page.locator('[name="area"][value="' + area.id + '"]').check()
        await page.locator('#symptom-next').click()
        const combinations = width === 390 ? area.symptoms.map(s => [s]).concat([area.symptoms]) : [area.symptoms]
        for (const symptoms of combinations) {
          for (const input of await page.locator('[name="symptom"]:checked').all()) await input.uncheck()
          for (const s of symptoms) await page.locator('[value="' + s.id + '"]').check()
          await page.locator('#symptom-result-button').click()
          await expect(page.locator('#symptom-results-title')).toBeFocused()
          const visible = await page.locator('[data-guide]:visible').evaluateAll(xs => xs.map(x => x.dataset.guide).sort())
          assert.deepEqual(visible, [...new Set(symptoms.flatMap(s => s.guides))].sort())
          const urgent = symptoms.some(s => s.urgent)
          assert.equal(await page.locator('#symptom-urgent-result').isVisible(), urgent)
          assert.equal(await page.locator('#symptom-routine-booking').isVisible(), !urgent)
          assert.equal(await page.locator('#symptom-selected-list li').count(), symptoms.length)
          assert.equal(page.url(), base + '/symptom-check')
          await checkWidth()
          if (area.id === 'front' && symptoms.length === area.symptoms.length) await page.locator('#symptom-results').screenshot({ path: '.artifacts/symptom-' + (live ? 'live-' : '') + engineName + '-' + width + '-result.png' })
          await page.locator('#symptom-edit').click()
        }
        await page.locator('#symptom-back').click()
      }
      // Switching areas must clear previous checked symptoms and stale results.
      await page.locator('[name="area"][value="front"]').check()
      assert.equal(await page.locator('[name="symptom"]:checked').count(), 0)
      await page.locator('#symptom-next').click()
      await page.locator('[value="front-broken"]').check()
      await page.locator('#symptom-result-button').click()
      const booking = page.locator('#symptom-routine-booking [data-booking-provider="naver"]')
      const bookingUrl = new URL(await booking.getAttribute('href'))
      assert.equal(bookingUrl.pathname, '/booking/13/bizes/1258951')
      assert.equal(await booking.getAttribute('href'), await page.locator('.header-cta[data-booking-provider="naver"]').getAttribute('href'), 'Selection must not alter the official booking URL')
      await expect(booking).toHaveAttribute('rel', /noreferrer/)
      const links = await page.locator('#symptom-results a').evaluateAll(xs => xs.map(x => x.getAttribute('href')))
      assert(links.every(x => !x.includes('boston') && (!x.startsWith('/') || !x.includes('?'))))
      assert([...bookingUrl.searchParams.keys()].every(key => ['theme', 'lang', 'area'].includes(key)), 'Only existing Naver display parameters, no health data')
      await page.locator('#symptom-reset').click()
      assert.equal(await page.locator('input:checked').count(), 0)
      // Emergency overrides the whole guide immediately, including an existing result.
      await page.locator('#symptom-safety-details summary').click()
      for (const id of ['safety-breath', 'safety-bleeding', 'safety-trauma']) {
        await page.locator('#' + id).check()
        await expect(page.locator('#symptom-interactive')).toBeHidden()
        await expect(page.locator(id === 'safety-trauma' ? '#symptom-trauma' : '#symptom-emergency')).toBeVisible()
        await page.locator('#' + id).uncheck()
        await expect(page.locator('#symptom-interactive')).toBeVisible()
      }
      await page.locator('#symptom-safety-details summary').click()
      await page.screenshot({ path: '.artifacts/symptom-' + (live ? 'live-' : '') + engineName + '-' + width + '.png', fullPage: true })
      await page.locator('[name="area"][value="gum"]').check()
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await page.locator('input:checked').count(), 0)
      const stored = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))
      assert.deepEqual(stored, { local: 0, session: 0 })
      assert.deepEqual(external, [], 'No third-party resources on the health UI')
      assert.deepEqual(sent, [], 'No analytics or selected health data requests')
      if (width < 760) {
        await page.locator('#menu-toggle').click()
        await expect(page.locator('#mobile-nav')).toBeVisible()
      }
      audit.views.push({ engine: engineName, width, states: 'area/symptoms/results/emergency/reset', noExternalRequests: true })
      await context.close()
    }
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: {width:390,height:844} })
    const page = await nojs.newPage()
    await page.goto(base + '/symptom-check')
    await expect(page.locator('#symptom-interactive')).toBeHidden()
    await expect(page.locator('noscript h2')).toHaveText('선택형 안내에는 JavaScript가 필요합니다.')
    await expect(page.locator('noscript h2')).toBeVisible()
    await expect(page.locator('.symptom-safety')).toBeVisible()
    await nojs.close()
  } finally { await browser.close() }
}
assert.deepEqual(audit.errors, [])
// All mapped treatment links must really resolve; never submit any form.
for (const slug of new Set(Object.values(symptomGuides).flatMap(g => g.treatments))) assert.equal((await fetch(base + '/treatments/' + slug)).status,200,slug)
const home = await (await fetch(base)).text()
assert(home.includes('href="/symptom-check"'))
const mission = await (await fetch(base + '/mission')).text()
for (const marker of ['mission-statement-description','treatment-explanation-v2.webp','building-front-v2.webp','kinetic.css?v=18']) assert(mission.includes(marker))
await writeFile('.artifacts/symptom-' + (live ? 'live-' : '') + 'audit.json', JSON.stringify(audit,null,2))
console.log(JSON.stringify(audit,null,2))
