// Browser-operated CMS transactions against disposable D1/R2 only.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { chromium, webkit } from '@playwright/test'
await build({entryPoints:['src/index.tsx'],outfile:'.artifacts/cms-app.mjs',bundle:true,platform:'node',format:'esm'})
await build({entryPoints:['src/lib/auth.ts'],outfile:'.artifacts/cms-auth.mjs',bundle:true,platform:'node',format:'esm'})
const { default: app } = await import('../.artifacts/cms-app.mjs?'+Date.now())
const { signToken } = await import('../.artifacts/cms-auth.mjs')
const secret='isolated-cms-test-not-production'
const mf = new Miniflare(convertV4MiniflareOptions({name:'cms-only-fixture',modules:true,script:await readFile('.artifacts/cms-app.mjs','utf8'),compatibilityDate:'2026-09-01',bindings:{SESSION_SECRET:secret,SITE_URL:'https://dodamdc.kr'},d1Databases:['DB'],r2Buckets:['R2']}))
const DB = await mf.getD1Database('DB'), R2 = await mf.getR2Bucket('R2')
const origin = (await mf.ready).origin // Ephemeral test fixture, not the application's preview service.
const env={DB,R2,SESSION_SECRET:secret,SITE_URL:'https://dodamdc.kr'}
const checks=[], errors=[]
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZxkAAAAASUVORK5CYII=','base64')
async function invoke(url,options={}) {const jobs=[];const r=await app.fetch(new Request(url,options),env,{waitUntil(p){jobs.push(p)},passThroughOnException(){}});await Promise.all(jobs);return r}
try {
  for (const file of ['0001_initial_schema.sql','0002_conversion_aggregates.sql','0003_staff_reservation_security.sql','0004_fees_table.sql','0005_fees_seed.sql']) {
    const sql=(await readFile('migrations/'+file,'utf8')).replace(/--[^\n]*/g,'')
    await DB.batch(sql.split(';').map(s=>s.trim()).filter(Boolean).map(s=>DB.prepare(s)))
  }
  await DB.prepare("INSERT INTO staff(login,name,password_hash,role) VALUES ('cms-owner','CMS TEST ONLY','unused','owner')").run()
  const token=await signToken(secret,{kind:'staff',sid:1,version:1,bootstrap:false},3600)
  for(const [engineName,engine] of [['chromium',chromium],...(process.env.TEST_WEBKIT?[['webkit',webkit]]:[])].filter(([name])=>!process.env.CMS_BROWSER || process.env.CMS_BROWSER===name)) {
    const browser=await engine.launch(engineName==='chromium'?{args:['--no-sandbox']}:{}), context=await browser.newContext({viewport:{width:390,height:844}})
    try {
      await context.addCookies([{name:'dd_admin',value:token,url:origin,httpOnly:true,sameSite:'Strict'}])
      await context.route('**/*',async route=>{
        const request=route.request(),url=new URL(request.url())
        if(url.origin!==origin)return route.abort()
        if(url.pathname.startsWith('/static/')||url.pathname.startsWith('/favicon')){
          const r=await fetch('http://localhost:3000'+url.pathname);return route.fulfill({status:r.status,headers:{'content-type':r.headers.get('content-type')||''},body:Buffer.from(await r.arrayBuffer())})
        }
        return route.continue() // Real multipart transport; WebKit interception omits file bytes.

      })
      const page=await context.newPage();page.on('pageerror',e=>errors.push(engineName+': '+e.message));page.on('dialog',async d=>{if(d.type()==='prompt')await d.accept('테스트 이미지 설명');else await d.accept()})
      const save=async()=>{await page.locator('.cms-form > .admin-toolbar button[type=submit]').first().click();await page.waitForURL(/\/admin\/(columns|notices|cases)\?saved=1/);assert(await page.getByRole('status').filter({hasText:'저장되었습니다'}).count())}
      const fillBody=async text=>{await page.locator('#editor').fill(text)}
      for(const width of [320,390,768,1440])for(const path of ['/admin/cases/new','/admin/columns/new','/admin/notices/new']){
        await page.setViewportSize({width,height:844});await page.goto(origin+path,{waitUntil:'networkidle'})
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path} overflow ${width}`)
        assert.equal(await page.locator('[name=published]').isChecked(),false)
        assert.equal(await page.locator('.cms-form').count(),1)
        assert((await page.locator('[data-cms-preview]').boundingBox()).height>=44)
      }
      await page.setViewportSize({width:390,height:844})
      for(const kind of ['columns','notices']){
        const title='CMS TEST '+engineName+' '+kind, slug='cms-'+engineName+'-'+kind
        await page.goto(origin+'/admin/'+kind+'/new',{waitUntil:'networkidle'})
        await page.locator('[name=title]').fill(title)
        if(kind==='columns'){await page.locator('[name=slug]').fill(slug);await page.locator('[name=published_at]').fill('2026-09-12T14:30')}
        await fillBody('테스트 게시물 본문입니다. 실제 환자 정보가 아닌 에디터 검증용 안내를 작성합니다.')
        // Selected text survives a toolbar click; both engines execute the formatting command.
        await page.locator('#editor').evaluate(el=>{el.focus();const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)})
        await page.locator('[data-cmd=h2]').click()
        assert(await page.locator('#editor h2').count())
        await page.locator('#editor').press('ArrowRight');await page.locator('#editor').press('End')
        const chooser=page.waitForEvent('filechooser');await page.locator('[data-cmd=image]').click();await (await chooser).setFiles({name:'fixture.png',mimeType:'image/png',buffer:png})
        await page.waitForFunction(()=>document.querySelector('#editor img')).catch(async error=>{ console.error('Fixture upload diagnostics', await page.locator('#admin-toast').textContent().catch(()=>''), await page.locator('#editor').innerHTML(), errors); throw error })
        await page.locator('#editor img').click()
        await page.getByRole('textbox',{name:'선택 이미지 설명'}).fill('수정한 테스트 이미지 설명')
        await page.getByRole('button',{name:'설명 적용',exact:true}).click()
        assert.equal(await page.locator('#editor img').getAttribute('alt'),'수정한 테스트 이미지 설명')
        await page.locator('[data-cms-preview]').click()
        assert(await page.getByRole('dialog').isVisible())
        await page.getByRole('button',{name:'모바일 폭',exact:true}).click()
        assert(await page.locator('.mobile-preview').count())
        await page.screenshot({path:`.artifacts/cms-${engineName}-${kind}-preview.png`,fullPage:true})
        await page.getByRole('button',{name:'닫기',exact:true}).click()
        await page.locator('#editor').evaluate(el=>{ const p=document.createElement('p');p.textContent='W'.repeat(220);el.appendChild(p);const table=document.createElement('table'),row=table.insertRow();row.insertCell().textContent='긴표내용'.repeat(60);el.appendChild(table);el.dispatchEvent(new Event('input',{bubbles:true})) })
        const originalText=await page.locator('#editor').textContent()
        // Server rejection must preserve entered text rather than replace the form.
        if(kind==='columns'){
          await DB.prepare('INSERT INTO columns(slug,title,content_html,author_slug,published) VALUES (?,?,?,?,0)').bind(slug,'EXISTING TEST','existing fixture','han-hwirim').run()
          await page.locator('.cms-form > .admin-toolbar button[type=submit]').first().click()
          await page.waitForFunction(()=>document.querySelector('.cms-save-status.error'))
          assert.equal(await page.locator('#editor').textContent(),originalText)
          await page.locator('[name=slug]').fill(slug+'-saved')
        }
        await save()
        let record=await DB.prepare(`SELECT * FROM ${kind} WHERE title=? ORDER BY id DESC LIMIT 1`).bind(title).first()
        assert.equal(record.published,0);assert(record.content_html.includes('수정한 테스트 이미지 설명'))
        if(kind==='columns')assert.equal(record.published_at,'2026-09-12 05:30:00')
        const publicPath=kind==='columns'?'/column/'+record.slug:'/notice/'+record.id
        assert.equal((await invoke(origin+publicPath)).status,404)
        await page.goto(origin+'/admin/'+kind+'/'+record.id,{waitUntil:'networkidle'})
        if(kind==='columns')assert.equal(await page.locator('[name=published_at]').inputValue(),'2026-09-12T14:30')
        await page.locator('[name=published]').check();await save()
        let publicPage=await invoke(origin+publicPath);assert.equal(publicPage.status,200)
        const publicHtml=await publicPage.text();assert(publicHtml.includes(title));assert(publicHtml.includes('수정한 테스트 이미지 설명'))
        for (const width of [320,390,430]) {
          await page.setViewportSize({width,height:844});await page.goto(origin+publicPath,{waitUntil:'networkidle'})
          assert.equal(await page.locator('main h1').count(),1)
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${engineName} ${kind} public long-content overflow ${width}`)
        }
        const imagePath=record.content_html.match(/src="([^"]+)"/)[1]
        assert.equal((await invoke(origin+imagePath)).status,200)
        await page.goto(origin+'/admin/'+kind+'/'+record.id,{waitUntil:'networkidle'})
        await page.locator('[name=published]').uncheck();await save()
        assert.equal((await invoke(origin+publicPath)).status,404);assert.equal((await invoke(origin+imagePath)).status,404)
        checks.push(`${engineName} ${kind}: toolbar, upload/alt, mobile preview, save/reload, publish/unpublish, private image revocation${kind==='columns'?', failed-save preservation and KST round-trip':''}`)
      }
      await page.goto(origin+'/admin/cases/new',{waitUntil:'networkidle'})
      const caseTitle='CASE TEST '+engineName
      await page.locator('[name=title]').fill(caseTitle);await page.locator('[name=description]').fill('실제 환자가 아닌 전후 이미지 검증용 안내입니다.')
      for(const slot of ['intra_before','intra_after'])await page.locator(`[name=${slot}_file]`).setInputFiles({name:slot+'.png',mimeType:'image/png',buffer:png})
      await page.locator('[data-cms-preview]').click();assert.equal(await page.locator('.cms-preview-article img').count(),2);await page.getByRole('button',{name:'닫기',exact:true}).click();await save()
      let record=await DB.prepare('SELECT * FROM cases WHERE title=?').bind(caseTitle).first();assert(record.intra_before.startsWith('cases/before/'));assert(record.intra_after.startsWith('cases/after/'))
      assert.equal((await invoke(origin+'/files/'+record.intra_before)).status,404)
      await page.goto(origin+'/admin/cases/'+record.id,{waitUntil:'networkidle'});await page.locator('[name=published]').check();await save()
      assert.equal((await invoke(origin+'/files/'+record.intra_before)).status,200);assert.equal((await invoke(origin+'/files/'+record.intra_after)).status,401)
      await page.goto(origin+'/admin/cases/'+record.id,{waitUntil:'networkidle'});await page.locator('[name=intra_before_file]').setInputFiles({name:'replacement.png',mimeType:'image/png',buffer:png});await page.locator('[name=intra_after_clear]').check();await save()
      const replaced=await DB.prepare('SELECT * FROM cases WHERE id=?').bind(record.id).first();assert.notEqual(replaced.intra_before,record.intra_before);assert.equal(replaced.intra_after,null)
      assert.equal((await invoke(origin+'/files/'+record.intra_before)).status,404)
      checks.push(`${engineName} cases: separate before/after upload, staff preview, draft save, publish visibility, replacement and removal`)
      checks.push(`${engineName}: 12 form layouts and 6 public long-text/table views; 44px controls, draft defaults, no horizontal overflow`)
      await context.close()
    } finally {await browser.close()}
  }
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({checks,errors},null,2))
  await writeFile('.artifacts/cms-audit.json',JSON.stringify({checks,errors},null,2))
} finally {await mf.dispose()}
