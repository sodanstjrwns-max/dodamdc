// Local mobile lab; TEST_WEBKIT=1 additionally runs desktop WebKit with mobile emulation.
// This does not reproduce Kakao's native iOS browser chrome or replace real-device QA.
import { chromium, webkit, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir, writeFile, stat } from 'node:fs/promises'
await mkdir('.artifacts', { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox', '--enable-unsafe-swiftshader'] })
const base = 'http://localhost:3000'
let webkitBrowser
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
  assert.ok(fonts.some(url => url.includes('Core-v2')))
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
  // Check new static text too, not just the homepage; a single missing glyph loads Extended.
  await page.close()
  for (const path of ['/first-visit', '/treatments/vpt-crown', '/treatments/periodontal', '/treatments/implant', '/pricing']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const sample = await context.newPage(), fontRequests = []
    sample.on('request', request => { if (request.url().endsWith('.woff2')) fontRequests.push(request.url()) })
    await sample.goto(base + path, { waitUntil: 'networkidle' })
    await sample.evaluate(() => document.fonts.ready)
    assert.ok(fontRequests.some(url => url.includes('Core-v2')), `${path}: current core font`)
    assert.equal(fontRequests.some(url => url.includes('Extended')), false, `${path}: static guide must not require the large extended font`)
    result.resourceSamples.push({ page: path, fontRequests })
    await context.close()
  }
  result.checks.push('First-visit, core treatments and pricing use only the refreshed core subset')
  // Regression for the supplied iOS screenshots: model/controls overlap, selected
  // arrow glyphs, cramped captions, sticky-bar clearance and long philosophy section.
  const engines=[{name:'chromium',instance:browser}]
  if(process.env.TEST_WEBKIT==='1') {webkitBrowser=await webkit.launch();engines.push({name:'webkit',instance:webkitBrowser})}
  for(const engine of engines){
    for(const [width,height] of [[320,640],[390,844],[430,740]]){
      const context=await engine.instance.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'})
      const mobile=await context.newPage();mobile.on('pageerror',error=>result.errors.push(`${engine.name}: ${error.message}`))
      await mobile.goto(base,{waitUntil:'networkidle'})
      await expect(mobile.locator('#tooth-render')).toHaveAttribute('data-render',/webgl|fallback/,{timeout:20000})
      const render=await mobile.locator('#tooth-render').getAttribute('data-render')
      assert.equal(await mobile.locator('.sculpture-caption').isVisible(),false)
      const button=mobile.locator('#model-rotate-right')
      assert.equal(await button.locator('svg').count(),1)
      assert.equal((await button.textContent()).trim(),'','No selectable arrow character remains')
      const selectionStyle=await button.evaluate(el=>getComputedStyle(el).userSelect||getComputedStyle(el).webkitUserSelect)
      assert.equal(selectionStyle,'none')
      // Linux WebKit does not implement the iOS-only callout property. Check it
      // when the engine supports it, and report the limitation rather than fake a pass.
      const touchCalloutSupported=await mobile.evaluate(()=>CSS.supports('-webkit-touch-callout','none'))
      if(touchCalloutSupported)assert.equal(await button.evaluate(el=>getComputedStyle(el).getPropertyValue('-webkit-touch-callout')),'none')
      if(render==='webgl'){
        await button.scrollIntoViewIfNeeded()
        const model=await mobile.locator('#tooth-render').boundingBox(),controls=await mobile.locator('.model-controls').boundingBox(),target=await button.boundingBox()
        assert.ok(controls.y>=model.y+model.height-1,'Controls must be outside the rendered model')
        assert.ok(target.width>=48&&target.height>=48)
        await button.tap();assert.ok(Number(await mobile.locator('#tooth-render').getAttribute('data-rotation'))>0)
        await mobile.locator('#model-rotate-left').tap()
        assert.equal(Number(await mobile.locator('#tooth-render').getAttribute('data-rotation')),0)
        assert.equal(await mobile.evaluate(()=>getSelection()?.toString()||''),'')
      } else await expect(mobile.locator('.tooth-fallback')).toBeVisible()
      assert.ok(await mobile.locator('#dodam-philosophy').evaluate(el=>el.getBoundingClientRect().height)<680,'Philosophy remains compact without removing its three principles')
      assert.equal(await mobile.locator('.manifesto-principles li').count(),3)
      for(const viewportHeight of [height,500,height]){
        await mobile.setViewportSize({width,height:viewportHeight})
        await mobile.locator('#patient-situations').scrollIntoViewIfNeeded()
        const bar=await mobile.locator('.mobile-action-bar').boundingBox()
        assert.ok(Math.abs(bar.y+bar.height-viewportHeight)<2,'Fixed booking bar follows viewport resize')
        assert.ok(await mobile.locator('.site-footer').evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom))>=bar.height)
        assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
      }
      await mobile.locator('#menu-toggle').tap();await expect(mobile.locator('#mobile-nav')).toBeVisible();await expect(mobile.locator('.mobile-action-bar')).toBeHidden();await mobile.locator('#menu-toggle').tap()
      if(width===390){await mobile.evaluate(()=>scrollTo(0,0));await mobile.screenshot({path:`.artifacts/mobile-fix-${engine.name}-hero.png`});await mobile.locator('#dodam-philosophy').screenshot({path:`.artifacts/mobile-fix-${engine.name}-philosophy.png`})}
      result.resourceSamples.push({engine:engine.name,viewport:`${width}x${height}`,render,controlsSeparated:render==='webgl',selectionDisabled:true,touchCalloutSupported,stickyBarVerified:true})
      await context.close()
    }
    result.checks.push(`${engine.name}: mobile model/controls separation, nonselectable SVG buttons, compact philosophy, dynamic viewport and booking bar`)
  }
  result.fontBytes = { original: (await stat('public/static/fonts/WantedSansVariable.woff2')).size, initialCore: (await stat('public/static/fonts/WantedSansCore-v2.woff2')).size }
  assert.ok(result.fontBytes.initialCore < result.fontBytes.original * 0.2)
} catch (error) { result.errors.push(error.stack || String(error)) }
finally { await webkitBrowser?.close(); await browser.close(); await writeFile('.artifacts/mobile-audit.json', JSON.stringify(result, null, 2)) }
console.log(JSON.stringify(result, null, 2))
assert.equal(result.errors.length, 0, 'Mobile optimization checks failed')
