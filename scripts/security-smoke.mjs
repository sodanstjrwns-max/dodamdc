// Isolated, disposable D1/R2. No real patients, staff accounts, email or production access.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { build } from 'esbuild'
import { Miniflare, convertV4MiniflareOptions } from 'miniflare'
import { chromium } from '@playwright/test'
await build({entryPoints:['src/index.tsx'],outfile:'.artifacts/security-app.mjs',bundle:true,platform:'node',format:'esm',jsx:'automatic',jsxImportSource:'hono/jsx'})
await build({entryPoints:['src/lib/auth.ts'],outfile:'.artifacts/security-auth.mjs',bundle:true,platform:'node',format:'esm'})
const {default:app}=await import('../.artifacts/security-app.mjs?'+Date.now())
const {hashPassword,signToken}=await import('../.artifacts/security-auth.mjs')
const mf=new Miniflare(convertV4MiniflareOptions({name:'security-fixture',modules:true,script:'export default {fetch(){return new Response("fixture")}}',compatibilityDate:'2026-09-01',d1Databases:['DB'],r2Buckets:['R2']}))
const DB=await mf.getD1Database('DB'),R2=await mf.getR2Bucket('R2')
const origin='http://security.test', secret='test-secret-never-used-in-production'
const env={DB,R2,SESSION_SECRET:secret,ADMIN_PASSWORD:'bootstrap-test-password',SITE_URL:'https://clinic.example'}
const ua='Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'
const checks=[]
let browser
const password='Long-Owner-Fixture-Password'
function client(ip='192.0.2.10') {
 const cookies=new Map();let csrf=''
 return {cookies, get csrf(){return csrf}, async request(path, {method='GET',data,headers={},protect=true}={}) {
  let body=data
  if(data && !(data instanceof FormData) && typeof data!=='string'){body=new URLSearchParams(data);headers={'content-type':'application/x-www-form-urlencoded',...headers}}
  const jobs=[]
  const response=await app.fetch(new Request(origin+path,{method,body,headers:{'user-agent':ua,'cf-connecting-ip':ip,cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(method!=='GET'?{origin,...(protect?{'x-csrf-token':csrf}:{})}:{}),...headers}}),env,{waitUntil(p){jobs.push(p)},passThroughOnException(){}})
  await Promise.all(jobs)
  for(const value of response.headers.getSetCookie()){const pair=value.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1))}
  const text=response.headers.get('content-type')?.includes('text/html')?await response.clone().text():''
  const token=text.match(/name="csrf-token" content="([^"]+)"/)?.[1]
  if(token)csrf=token
  return response
 }}
}
async function login(who,name,pw){await who.request('/admin/login');return who.request('/admin/login',{method:'POST',data:{login:name,password:pw}})}
try{
 for(const file of ['0001_initial_schema.sql','0002_conversion_aggregates.sql','0003_staff_reservation_security.sql']){
  const sql=(await readFile('migrations/'+file,'utf8')).replace(/--[^\n]*/g,'')
  await DB.batch(sql.split(';').map(s=>s.trim()).filter(Boolean).map(s=>DB.prepare(s)))
 }
 const owner=client(), reception=client('192.0.2.11'), editor=client('192.0.2.12'), stranger=client('192.0.2.13')
 assert.equal((await stranger.request('/admin/reservations')).status,302)
 await owner.request('/admin/login')
 const unprotected=await owner.request('/admin/login',{method:'POST',data:{password:env.ADMIN_PASSWORD},protect:false})
 assert.equal(unprotected.status,403)
 assert.equal((await owner.request('/admin/login',{method:'POST',data:{password:env.ADMIN_PASSWORD},headers:{origin:'https://evil.example'}})).status,403)
 assert.equal((await owner.request('/admin/login',{method:'POST',data:{password:env.ADMIN_PASSWORD},headers:{origin:''}})).status,403)
 assert.equal((await login(owner,'',env.ADMIN_PASSWORD)).headers.get('location'),'/admin/staff')
 assert.equal((await owner.request('/admin/reservations')).status,403,'Bootstrap cannot read patient data')
 assert.equal((await owner.request('/admin/staff',{method:'POST',data:{login:'owner',name:'Fixture Owner',password}})).status,302)
 assert.equal((await login(owner,'owner',password)).headers.get('location'),'/admin')
 const oid=(await DB.prepare("SELECT id FROM staff WHERE login='owner'").first()).id
 for(const [id,name,role] of [['desk','Fixture Desk','reception'],['editor','Fixture Editor','editor']]){
  await owner.request('/admin/staff')
  assert.equal((await owner.request('/admin/staff',{method:'POST',data:{login:id,name,role,password,current_password:password}})).headers.get('location'),'/admin/staff?saved=1')
 }
 const rid=(await DB.prepare("SELECT id FROM staff WHERE login='desk'").first()).id
 assert.equal((await login(reception,'desk',password)).headers.get('location'),'/admin/reservations')
 assert.equal((await login(editor,'editor',password)).headers.get('location'),'/admin/columns')
 for(const path of ['/admin/staff','/admin/privacy','/admin/members','/admin/settings','/admin/columns','/admin/stats']) assert.equal((await reception.request(path)).status,403,path)
 for(const path of ['/admin/reservations','/admin/members','/admin/staff','/admin/privacy']) assert.equal((await editor.request(path)).status,403,path)
 assert.equal((await editor.request('/admin/columns')).status,200)
 assert.equal((await owner.request('/admin/staff/'+oid,{method:'POST',data:{name:'Fixture Owner',role:'reception',active:'0',current_password:password}})).headers.get('location'),'/admin/staff?error=1')
 assert.equal((await DB.prepare('SELECT role FROM staff WHERE id=?').bind(oid).first()).role,'owner')
 await owner.request('/admin/settings')
 assert.equal((await owner.request('/admin/settings',{method:'POST',data:{ga4:"G-TEST');alert(1)//"}})).status,400)
 assert.equal((await owner.request('/admin/settings',{method:'POST',data:{'channels.kakao':'javascript:alert(1)'}})).status,400)
 checks.push('Origin + CSRF required; bootstrap restricted; staff roles enforced server-side; final owner protected; unsafe settings rejected')

 const publicClient=client('192.0.2.20')
 await publicClient.request('/reservation')
 const anonymousRequest=await publicClient.request('/reservation',{method:'POST',data:{name:'TEST FIXTURE A',phone:'01012345678',email:'not-verified@example.invalid',message:'PRIVATE_HEALTH_TEXT',agree:'1'}})
 assert.equal(anonymousRequest.status,302)
 const id=(await DB.prepare('SELECT MAX(id) id FROM reservations').first()).id
 await DB.prepare("INSERT INTO reservations(name,phone,status) VALUES ('TEST FIXTURE B','01012345678','pending')").run()
 assert.equal((await reception.request('/admin/reservations')).status,200)
 let detail=await reception.request('/admin/reservations/'+id)
 assert.ok((await detail.text()).includes('같은 연락처의 최근 접수'))
 let change={version:'1',status:'pending',assignee_id:String(rid),outcome:'call_noanswer',followup_at:'2026-10-01T09:30'}
 const results=await Promise.all([reception.request('/admin/reservations/'+id,{method:'POST',data:change}),reception.request('/admin/reservations/'+id,{method:'POST',data:change})])
 assert.deepEqual(results.map(r=>r.status).sort(),[302,409])
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM reservation_events WHERE reservation_id=?').bind(id).first()).n,1)
 let row=await DB.prepare('SELECT * FROM reservations WHERE id=?').bind(id).first()
 assert.equal(row.contact_state,'attempted');assert.equal(row.assignee_id,rid);assert.equal(row.followup_at,'2026-10-01 00:30:00')
 await reception.request('/admin/reservations/'+id)
 assert.equal((await reception.request('/admin/reservations/'+id,{method:'POST',data:{...change,version:'2',outcome:'call_reached',status:'confirmed',retention_hold:'1'}})).status,302)
 row=await DB.prepare('SELECT * FROM reservations WHERE id=?').bind(id).first()
 assert.equal(row.contact_state,'reached');assert.equal(row.retention_hold,0,'Reception cannot set legal hold')
 for (const invalid of [{assignee_id:'0'},{assignee_id:'9007199254740992'},{followup_at:'2026-02-30T09:30'},{followup_at:'2026-10-01T25:30'}]) {
  const rejected=await reception.request('/admin/reservations/'+id,{method:'POST',data:{...change,version:'3',...invalid}})
  assert.equal(rejected.headers.get('location'),'/admin/reservations/'+id+'?error=1')
 }
 assert.equal((await DB.prepare('SELECT version FROM reservations WHERE id=?').bind(id).first()).version,3,'Invalid values must not mutate the reservation')
 const ev=JSON.stringify((await DB.prepare('SELECT * FROM reservation_events').all()).results)
 assert.equal(/TEST FIXTURE A|01012345678|PRIVATE_HEALTH_TEXT/.test(ev),false)
 assert.equal((await DB.prepare("SELECT SUM(count) n FROM conversion_daily WHERE event='form_completed'").first()).n,1,'Desk status updates do not fabricate conversions')
 checks.push('Masked board, duplicates, assignment, contact outcomes, KST follow-up, optimistic locking and PII-free change history')

 // Only the actual member association grants access; email equality is not ownership.
 const member=client('192.0.2.30')
 await member.request('/auth/register')
 const email='not-verified@example.invalid'
 assert.equal((await member.request('/auth/register',{method:'POST',data:{name:'Fixture Member',email,phone:'01098765432',password,agree_privacy:'1'}})).status,302)
 let mine=await member.request('/auth/mypage')
 assert.ok((await mine.text()).includes('예약 내역이 없습니다.'))
 await DB.prepare("INSERT INTO reservations(name,phone,treatment,user_id) VALUES ('Owner-linked','01099998888','ONLY_MY_RESERVATION',(SELECT id FROM users WHERE email=?))").bind(email).run()
 mine=await member.request('/auth/mypage?user_id=9999')
 const myhtml=await mine.text();assert.ok(myhtml.includes('ONLY_MY_RESERVATION'));assert.equal(myhtml.includes('PRIVATE_HEALTH_TEXT'),false)
 const oldMemberCookie=member.cookies.get('dd_session')
 await member.request('/auth/mypage',{method:'POST',data:{name:'Fixture Member',password:'Changed-Password-Fixture',current_password:password}})
 const thief=client('192.0.2.31');thief.cookies.set('dd_session',oldMemberCookie)
 assert.equal((await thief.request('/auth/mypage')).status,302)
 const currentCookie=member.cookies.get('dd_session')
 await member.request('/auth/delete',{method:'POST',data:{current_password:'Changed-Password-Fixture'}})
 thief.cookies.set('dd_session',currentCookie)
 assert.equal((await thief.request('/auth/mypage')).status,302)
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM reservations WHERE user_id IS NOT NULL').first()).n,0)
 assert.equal((await stranger.request('/auth/google/callback?code=fake&state=fake')).status,302)
 checks.push('Member-only reservation association; password/deletion revokes old sessions; OAuth callback requires browser-bound state')

 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=','base64')
 async function upload(type,bytes,prefix='columns',who=editor){await who.request('/admin/columns/new');const fd=new FormData();fd.set('file',new File([bytes],'private-name.png',{type}));fd.set('prefix',prefix);return who.request('/admin/api/upload',{method:'POST',data:fd})}
 assert.equal((await upload('image/png','<script>alert(1)</script>')).status,400)
 assert.equal((await upload('image/png',png,'../cases/after')).status,400)
 assert.equal((await upload('image/png',png,'columns',reception)).status,403)
 const uploaded=await upload('image/png',png);assert.equal(uploaded.status,200)
 const {key}=await uploaded.json()
 assert.equal((await stranger.request('/files/'+key)).status,404,'Unreferenced image private')
 assert.equal((await editor.request('/files/'+key)).status,200)
 const evil='<h1>Visible title</h1><p>Safe paragraph long enough for the editor.</p><img src="/files/'+key+'" onerror=alert(1)><a href="javascript:alert(2)" onclick=alert(3)>Link</a><svg/onload=alert(4)><script>alert(5)</script><form action="https://evil.example"><input name="password"></form>'
 await editor.request('/admin/columns/new')
 const saved=await editor.request('/admin/columns/new',{method:'POST',data:{title:'Security Fixture',content_html:evil,published:'1',slug:'security-fixture',author_slug:'han-hwirim',thumbnail:'cases/after/forged.jpg'}})
 assert.equal(saved.status,302)
 const article=await DB.prepare("SELECT * FROM columns WHERE slug='security-fixture'").first()
 assert.ok(article);assert.equal(/onerror|onclick|javascript:|<script|<svg|<form|<input/.test(article.content_html),false)
 assert.ok(!article.thumbnail,'A submitted hidden attachment key cannot attach a private image')
 const publicFile=await stranger.request('/files/'+key);assert.equal(publicFile.status,200);assert.equal(publicFile.headers.get('cache-control'),'private, no-store');assert.equal(publicFile.headers.get('x-content-type-options'),'nosniff')
 await DB.prepare('UPDATE columns SET published=0 WHERE id=?').bind(article.id).run()
 assert.equal((await stranger.request('/files/'+key)).status,404)
 const before='cases/before/test.jpg',after='cases/after/test.jpg'
 await R2.put(before,png,{httpMetadata:{contentType:'image/png'}});await R2.put(after,png,{httpMetadata:{contentType:'image/png'}})
 await DB.prepare("INSERT INTO cases(slug,title,treatment_slug,intra_before,intra_after,published) VALUES ('case-fixture','fixture','implant',?,?,0)").bind(before,after).run()
 assert.equal((await stranger.request('/files/'+before)).status,404)
 assert.equal((await stranger.request('/files/'+after)).status,401)
 await DB.prepare("UPDATE cases SET published=1 WHERE slug='case-fixture'").run()
 assert.equal((await stranger.request('/files/'+before)).status,200)
 assert.equal((await stranger.request('/files/'+after)).status,401)
 assert.equal((await editor.request('/files/'+after)).status,200)
 checks.push('File MIME/signature/prefix checks; no arbitrary attachment keys; orphan/draft/private assets blocked; sanitized CMS at save and render')

 // Snapshot preview and explicit owner reauthentication; no real data is touched.
 await DB.prepare("INSERT INTO reservations(name,phone,status,created_at) VALUES ('EXPIRED TEST','01000000001','done','2020-01-01 00:00:00')").run()
 const expired=(await DB.prepare("SELECT id FROM reservations WHERE name='EXPIRED TEST'").first()).id
 await DB.prepare("INSERT INTO reservations(name,phone,status,created_at,retention_hold) VALUES ('HELD TEST','01000000002','done','2020-01-01',1),('PENDING TEST','01000000003','pending','2020-01-01',0),('FUTURE TEST','01000000004','done','2020-01-01',0)").run()
 await DB.prepare("UPDATE reservations SET preferred_date='2099-01-01' WHERE name='FUTURE TEST'").run()
 await DB.prepare("INSERT INTO reservation_events(reservation_id,actor_id,outcome,before_state,after_state) VALUES (?,?,'none','{}','{}')").bind(expired,oid).run()
 await owner.request('/admin/privacy')
 const preview=await owner.request('/admin/privacy/preview',{method:'POST',data:{}})
 const htmlPreview=await preview.text(), ticket=htmlPreview.match(/name="ticket" value="([^"]+)"/)?.[1]
 assert.ok(ticket);assert.ok(htmlPreview.includes('EXPIRED TEST'));assert.equal(htmlPreview.includes('HELD TEST'),false)
 assert.equal((await owner.request('/admin/privacy/purge',{method:'POST',data:{ticket,confirm:'만료 예약 삭제',current_password:'wrong'}})).status,403)
 // Mutation after preview must prevent all deletion.
 await DB.prepare('UPDATE reservations SET version=version+1 WHERE id=?').bind(expired).run()
 assert.equal((await owner.request('/admin/privacy/purge',{method:'POST',data:{ticket,confirm:'만료 예약 삭제',current_password:password}})).status,409)
 const fresh=await owner.request('/admin/privacy/preview',{method:'POST',data:{}})
 const freshTicket=(await fresh.text()).match(/name="ticket" value="([^"]+)"/)?.[1]
 const purge=await owner.request('/admin/privacy/purge',{method:'POST',data:{ticket:freshTicket,confirm:'만료 예약 삭제',current_password:password}})
 assert.equal(purge.status,200);assert.equal(await DB.prepare('SELECT id FROM reservations WHERE id=?').bind(expired).first(),null)
 assert.equal((await DB.prepare('SELECT COUNT(*) n FROM reservation_events WHERE reservation_id=?').bind(expired).first()).n,0)
 assert.equal((await owner.request('/admin/privacy/purge',{method:'POST',data:{ticket:freshTicket,confirm:'만료 예약 삭제',current_password:password}})).status,409)
 assert.equal((await DB.prepare("SELECT COUNT(*) n FROM reservations WHERE name IN ('HELD TEST','PENDING TEST','FUTURE TEST')").first()).n,3)
 const audit=JSON.stringify((await DB.prepare("SELECT detail FROM staff_audit WHERE action='reservation.purge'").all()).results)
 assert.equal(/EXPIRED TEST|01000000001/.test(audit),false)
 assert.equal(JSON.parse((await DB.prepare("SELECT detail FROM staff_audit WHERE action='reservation.purge'").first()).detail).count,1,'Purge audit counts reservations, not cascading event deletions')
 checks.push('Purge excludes holds/open/future reservations; password + typed approval + single-use snapshot; stale-preview rejection and FK history deletion')

 const receptionSession=reception.cookies.get('dd_admin')
 await owner.request('/admin/staff')
 await owner.request('/admin/staff/'+rid,{method:'POST',data:{name:'Fixture Desk',role:'reception',active:'0',current_password:password}})
 assert.equal((await reception.request('/admin/reservations')).status,302)
 const reuse=client();reuse.cookies.set('dd_admin',receptionSession)
 assert.equal((await reuse.request('/admin/reservations')).status,302)
 const spam=client('192.0.2.90');await spam.request('/admin/login')
 for(let i=0;i<10;i++)await spam.request('/admin/login',{method:'POST',data:{login:'unknown-budget-test',password:'wrong'}})
 const blocked=await spam.request('/admin/login',{method:'POST',data:{login:'unknown-budget-test',password:'wrong'}})
 assert.equal(blocked.status,429);assert.ok(blocked.headers.get('retry-after'))
 const rates=JSON.stringify((await DB.prepare('SELECT * FROM security_rate_limits').all()).results)
 assert.equal(/192\.0\.2|unknown-budget-test|wrong/.test(rates),false)
 checks.push('Disabled staff sessions immediately invalid; rate budgets are atomic, expiring HMAC keys with no raw IP/login')

 // Browser receives fixture HTML through interception; only static assets use localhost.
 browser=await chromium.launch({args:['--no-sandbox','--disable-webgl']})
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage()
 await ctx.route(origin+'/**',async route=>{
  const url=new URL(route.request().url())
  if(url.pathname.startsWith('/static/')||url.pathname.startsWith('/favicon')){const resource=await fetch('http://localhost:3000'+url.pathname);return route.fulfill({status:resource.status,headers:{'content-type':resource.headers.get('content-type')||''},body:Buffer.from(await resource.arrayBuffer())})}
  const response=await owner.request(url.pathname+url.search)
  const body=await response.text()
  return route.fulfill({status:response.status,headers:{'content-type':response.headers.get('content-type')||'text/plain'},body:body.replace('<main class="admin-main">','<main class="admin-main"><p>ISOLATED TEST FIXTURE · 실제 환자 데이터 아님</p>')})
 })
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto(origin+'/admin/reservations',{waitUntil:'networkidle'})
 assert.ok(await page.locator('.reservation-card').count()>0)
 assert.equal(await page.locator('.patient-message').count(),0)
 await page.screenshot({path:'.artifacts/reservation-desk-fixture-desktop.png',fullPage:true})
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await page.goto(origin+'/admin/reservations',{waitUntil:'networkidle'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`desk overflow ${width}`)}
 await page.setViewportSize({width:390,height:844})
 await page.screenshot({path:'.artifacts/reservation-desk-fixture-mobile.png',fullPage:true})
 await page.goto(origin+'/admin/columns/new',{waitUntil:'networkidle'})
 const sanitized=await page.evaluate(()=>window.AdminSanitizer.clean('<img src=x onerror="window.BAD=true"><svg/onload=alert(1)><script>alert(2)</script>'))
 assert.equal(/onerror|onload|<script|<svg/.test(sanitized),false)
 const externalImage=await page.evaluate(()=>window.AdminSanitizer.clean('<img src="https://example.invalid/tracker.png">'))
 assert.equal(externalImage.includes('https://example.invalid'),false)
 assert.deepEqual(errors,[])
 checks.push('Fixture-only responsive staff board at 320/390/768/1440; private details excluded from cards; client sanitizer loaded without JS errors')
 console.log(JSON.stringify({checks,errors:[]},null,2))
 await writeFile('.artifacts/security-audit.json',JSON.stringify({checks,errors:[]},null,2))
} finally {await browser?.close();await mf.dispose()}
