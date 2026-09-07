import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env } from '../lib/types'
import { shell } from '../lib/admin-ui'
import { formData, normPhone } from '../lib/util'
import { alertBox } from '../lib/ui'
const desk = new Hono<Env>()
const statuses: Record<string,string> = { pending:'확인 대기', confirmed:'일정 확정', done:'처리 완료', cancelled:'취소' }
const contacts: Record<string,string> = { uncontacted:'연락 기록 없음', attempted:'연락 시도', reached:'통화 확인' }
const outcomes: Record<string,string> = { none:'연락 기록 없음 · 상태/담당만 변경', call_noanswer:'전화 시도 · 부재', call_reached:'전화 연결 · 내용 확인', kakao_sent:'카카오 안내 발송 기록' }
const mask = (value: string) => `끝자리 ${String(value).replace(/\D/g,'').slice(-4)}`
const stamp = (value?: string | null) => value ? new Date(value.replace(' ', 'T') + (/[Z+]$|\+\d\d:\d\d$/.test(value) ? '' : 'Z')).toLocaleString('ko-KR', { timeZone:'Asia/Seoul', hour12:false }) : '—'

desk.get('/reservations', async c => {
  const state = c.req.query('status') || '', contact = c.req.query('contact') || '', assignee = c.req.query('assignee') || ''
  const page = Math.min(10000,Math.max(1,Math.floor(Number(c.req.query('page')) || 1)))
  const where = ['1=1'], args: (string | number)[] = []
  if (Object.hasOwn(statuses,state)) { where.push('r.status=?'); args.push(state) }
  if (Object.hasOwn(contacts,contact)) { where.push('r.contact_state=?'); args.push(contact) }
  if (assignee === 'none') where.push('r.assignee_id IS NULL')
  else if (/^\d+$/.test(assignee)) { where.push('r.assignee_id=?'); args.push(Number(assignee)) }
  const filter = where.join(' AND ')
  const total = (await c.env.DB.prepare(`SELECT COUNT(*) n FROM reservations r WHERE ${filter}`).bind(...args).first<any>())?.n || 0
  const rows = (await c.env.DB.prepare(`SELECT r.id,r.name,r.phone,r.status,r.contact_state,r.created_at,r.followup_at,r.last_contacted_at,s.name assignee FROM reservations r LEFT JOIN staff s ON s.id=r.assignee_id WHERE ${filter} ORDER BY CASE WHEN r.followup_at IS NOT NULL AND r.followup_at <= CURRENT_TIMESTAMP AND r.status='pending' THEN 0 WHEN r.status='pending' AND r.contact_state='uncontacted' THEN 1 ELSE 2 END,r.created_at DESC LIMIT 50 OFFSET ?`).bind(...args,(page-1)*50).all<any>()).results || []
  const staff = (await c.env.DB.prepare("SELECT id,name FROM staff WHERE active=1 AND role IN ('owner','reception') ORDER BY name").all<any>()).results || []
  const counts = await c.env.DB.prepare("SELECT COUNT(*) total, SUM(status='pending' AND contact_state='uncontacted') waiting, SUM(status='pending' AND contact_state='attempted') attempts, SUM(status='pending' AND followup_at<=CURRENT_TIMESTAMP) due, SUM(status='confirmed') confirmed FROM reservations").first<any>()
  const pager = (n:number) => '/admin/reservations?' + new URLSearchParams({status:state,contact,assignee,page:String(n)})
  return shell(c,'예약 응대 업무판',html`
    <p class="workspace-note">홈페이지 접수 전용입니다. 네이버 예약·전화·카카오 내역을 자동으로 가져오는 화면이 아닙니다. 연락 결과는 담당자가 실제 응대 후 기록해 주세요. 도입 이전 접수의 실제 연락 여부는 추정하지 않으며 ‘연락 기록 없음’으로 표시합니다.</p>
    <div class="desk-counts">${[['waiting','연락 기록 없는 접수'],['attempts','연락 시도 중'],['due','재연락 예정 시각 경과'],['confirmed','일정 확정']].map(([key,label])=>html`<div class="ops-panel"><strong>${counts?.[key] || 0}</strong><span>${label}</span></div>`)}</div><p class="hint">위 요약은 전체 접수 기준입니다. 시간은 한국시간(KST)으로 표시합니다.</p>
    <form method="get" class="desk-filters"><label>예약 상태<select name="status"><option value="">전체</option>${Object.entries(statuses).map(([v,l])=>html`<option value="${v}" ${state===v?'selected':''}>${l}</option>`)}</select></label><label>연락 상태<select name="contact"><option value="">전체</option>${Object.entries(contacts).map(([v,l])=>html`<option value="${v}" ${contact===v?'selected':''}>${l}</option>`)}</select></label><label>담당자<select name="assignee"><option value="">전체</option><option value="none" ${assignee==='none'?'selected':''}>미지정</option>${staff.map(s=>html`<option value="${s.id}" ${assignee===String(s.id)?'selected':''}>${s.name}</option>`)}</select></label><button class="btn btn-primary" type="submit">필터 적용</button><a href="/admin/reservations" class="btn btn-outline">초기화</a></form>
    <p class="hint">조건에 맞는 ${total}건 · ${page}페이지 · 페이지당 최대 50건. 민감한 문의 내용은 상세 화면에서만 표시합니다.</p>
    <div class="reservation-board">${Object.entries(statuses).filter(([key])=>!state || !Object.hasOwn(statuses,state) || state===key).map(([key,label])=>html`<section class="desk-column"><h2>${label}<span>${rows.filter(r=>r.status===key).length}</span></h2>${rows.filter(r=>r.status===key).map(r=>html`<article class="reservation-card" id="r${r.id}"><p class="contact-badge ${r.contact_state}">${contacts[r.contact_state]}</p><h3><a href="/admin/reservations/${r.id}">${r.name} <span>#${r.id} ↗</span></a></h3><p>${mask(r.phone)}</p><dl><div><dt>담당</dt><dd>${r.assignee || '미지정'}</dd></div><div><dt>접수</dt><dd>${stamp(r.created_at)}</dd></div>${r.last_contacted_at?html`<div><dt>마지막 연락</dt><dd>${stamp(r.last_contacted_at)}</dd></div>`:''}${r.followup_at?html`<div><dt>재연락 예정</dt><dd>${stamp(r.followup_at)}</dd></div>`:''}</dl></article>`)}${!rows.some(r=>r.status===key)?html`<p class="desk-empty">이 페이지에 해당 접수가 없습니다.</p>`:''}</section>`)}</div>
    <nav class="desk-pagination" aria-label="예약 목록 페이지">${page>1?html`<a class="btn btn-outline" href="${pager(page-1)}">이전</a>`:''}${page*50<total?html`<a class="btn btn-outline" href="${pager(page+1)}">다음</a>`:''}</nav>`, 'reservations')
})
desk.get('/reservations/:id', async c => {
  const r = await c.env.DB.prepare('SELECT * FROM reservations WHERE id=?').bind(c.req.param('id')).first<any>()
  if (!r) return c.notFound()
  const staff = (await c.env.DB.prepare("SELECT id,name,active FROM staff WHERE role IN ('owner','reception') OR id=? ORDER BY name").bind(r.assignee_id || 0).all<any>()).results || []
  const events = (await c.env.DB.prepare('SELECT e.*,s.name actor FROM reservation_events e JOIN staff s ON s.id=e.actor_id WHERE reservation_id=? ORDER BY e.id DESC LIMIT 100').bind(r.id).all<any>()).results || []
  const duplicate = (await c.env.DB.prepare("SELECT id,created_at,status FROM reservations WHERE id!=? AND replace(replace(phone,'-',''),' ','')=? AND created_at>=datetime('now','-30 days') ORDER BY created_at DESC LIMIT 5").bind(r.id,normPhone(r.phone).replace(/\D/g,'')).all<any>()).results || []
  const localFollowup = r.followup_at ? new Date(new Date(r.followup_at.replace(' ','T')+'Z').getTime()+9*3600e3).toISOString().slice(0,16) : ''
  return shell(c,`예약 #${r.id} 응대`,html`<a class="btn btn-outline btn-sm" href="/admin/reservations">← 업무판</a>${c.req.query('saved')?alertBox('응대 내용을 기록했습니다.','ok'):''}${c.req.query('error')?alertBox('입력값을 확인해 주세요. 변경이 저장되지 않았습니다.'):''}
    ${duplicate.length?html`<aside class="ops-panel"><h2 class="h3">같은 연락처의 최근 접수</h2><p>중복 가능성이 있습니다. 같은 사람이라고 단정하거나 자동 병합하지 않습니다.</p><ul>${duplicate.map(d=>html`<li><a href="/admin/reservations/${d.id}">#${d.id} · ${stamp(d.created_at)} · ${statuses[d.status]}</a></li>`)}</ul></aside>`:''}
    <div class="desk-detail"><section class="ops-panel"><h2 class="h3">접수 내용</h2><dl class="reservation-info"><dt>이름</dt><dd>${r.name}</dd><dt>연락처</dt><dd><a href="tel:${r.phone}">${r.phone}</a></dd><dt>이메일</dt><dd>${r.email || '—'}</dd><dt>희망 진료</dt><dd>${r.treatment || '상담 먼저'}</dd><dt>희망 일시</dt><dd>${r.preferred_date || '미정'} ${r.preferred_time || ''}</dd><dt>접수 시각</dt><dd>${stamp(r.created_at)}</dd></dl><h3>환자가 남긴 문의</h3><p class="patient-message">${r.message || '남긴 내용이 없습니다.'}</p><p class="hint">의무기록이 아닌 홈페이지 접수 정보입니다. 불필요한 복사·외부 전달을 피하세요.</p></section>
    <section class="ops-panel"><h2 class="h3">담당·연락 기록</h2><form method="post" class="form ops-form"><input type="hidden" name="version" value="${r.version}"><label>담당자<select name="assignee_id"><option value="">미지정</option>${staff.map(s=>html`<option value="${s.id}" ${r.assignee_id===s.id?'selected':''} ${!s.active && r.assignee_id!==s.id?'disabled':''}>${s.name}${s.active?'':' (비활성)'}</option>`)}</select></label><label>예약 상태<select name="status">${Object.entries(statuses).map(([v,l])=>html`<option value="${v}" ${r.status===v?'selected':''}>${l}</option>`)}</select></label><label>이번 연락 결과<select name="outcome">${Object.entries(outcomes).map(([v,l])=>html`<option value="${v}">${l}</option>`)}</select></label><label>다음 연락 예정 (한국시간)<input name="followup_at" type="datetime-local" value="${localFollowup}"></label>${c.get('staff')?.role==='owner'?html`<label class="check"><input type="checkbox" name="retention_hold" value="1" ${r.retention_hold?'checked':''}> 별도 보존 검토 중 · 일괄 파기 제외</label>`:''}<p class="hint">자유 메모에 진료·건강 정보를 중복 저장하지 않도록, 정해진 처리 항목만 기록합니다. 연락 버튼 클릭 자체로 상태가 바뀌지 않습니다.</p><button class="btn btn-primary" type="submit">응대 기록 저장</button></form></section></div>
    <section class="ops-panel"><h2 class="h3">처리 이력</h2><p class="hint">현재 담당자와 실제 수정한 직원은 별도로 기록됩니다. 최근 100개까지 표시합니다.</p><ol class="audit-list">${events.map(e=>{const before=JSON.parse(e.before_state),after=JSON.parse(e.after_state);return html`<li><strong>${e.actor}</strong> · ${stamp(e.created_at)}<p>${outcomes[e.outcome] || '상태 변경'} · ${statuses[before.status]} → ${statuses[after.status]}</p><p>연락: ${contacts[before.contact_state]} → ${contacts[after.contact_state]} · 담당 계정: ${before.assignee_id || '미지정'} → ${after.assignee_id || '미지정'}</p><p>다음 연락: ${stamp(after.followup_at)} · 파기 제외: ${after.retention_hold?'예':'아니요'}</p></li>`})}</ol>${!events.length?html`<p class="hint">아직 기록된 응대가 없습니다. 기존 데이터의 과거 연락 이력은 추정해 만들지 않습니다.</p>`:''}</section>`, 'reservations')
})
desk.post('/reservations/:id', async c => {
  const actor=c.get('staff')!, id=Number(c.req.param('id')), f=await formData(c)
  if(!Number.isSafeInteger(id)||id<1) return c.notFound()
  const r=await c.env.DB.prepare('SELECT * FROM reservations WHERE id=?').bind(id).first<any>()
  if(!r) return c.notFound()
  const status=String(f.status),outcome=String(f.outcome || 'none'),version=Number(f.version)
  if(!Object.hasOwn(statuses,status)||!Object.hasOwn(outcomes,outcome)||!Number.isSafeInteger(version)) return c.redirect(`/admin/reservations/${id}?error=1`)
  const assignee=f.assignee_id?Number(f.assignee_id):null
  if(assignee!==null && (!Number.isSafeInteger(assignee)||assignee<1)) return c.redirect(`/admin/reservations/${id}?error=1`)
  if(assignee!==null){const s=await c.env.DB.prepare("SELECT id FROM staff WHERE id=? AND active=1 AND role IN ('owner','reception')").bind(assignee).first();if(!s) return c.redirect(`/admin/reservations/${id}?error=1`)}
  let followup:string|null=null
  if(f.followup_at){const value=String(f.followup_at);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return c.redirect(`/admin/reservations/${id}?error=1`);const parsed=new Date(value+'+09:00');if(!Number.isFinite(parsed.getTime()) || new Date(parsed.getTime()+9*3600e3).toISOString().slice(0,16)!==value)return c.redirect(`/admin/reservations/${id}?error=1`);followup=parsed.toISOString().slice(0,19).replace('T',' ')}
  const contact=outcome==='none'?r.contact_state:outcome==='call_reached'?'reached':'attempted'
  const contacted=outcome==='none'?r.last_contacted_at:new Date().toISOString().slice(0,19).replace('T',' ')
  const hold=actor.role==='owner'?(f.retention_hold==='1'?1:0):r.retention_hold
  const snapshot=(x:any)=>JSON.stringify({status:x.status,assignee_id:x.assignee_id,contact_state:x.contact_state,followup_at:x.followup_at,last_contacted_at:x.last_contacted_at,retention_hold:x.retention_hold})
  const after={status,assignee_id:assignee,contact_state:contact,followup_at:followup,last_contacted_at:contacted,retention_hold:hold}
  const results=await c.env.DB.batch([
    c.env.DB.prepare('UPDATE reservations SET status=?,assignee_id=?,contact_state=?,followup_at=?,last_contacted_at=?,retention_hold=?,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?').bind(status,assignee,contact,followup,contacted,hold,id,version),
    c.env.DB.prepare('INSERT INTO reservation_events (reservation_id,actor_id,outcome,before_state,after_state) SELECT ?,?,?,?,? WHERE changes()=1').bind(id,actor.id,outcome,snapshot(r),snapshot(after)),
  ])
  if(!results[0].meta.changes){c.status(409);return shell(c,'다른 직원이 먼저 수정했습니다',html`<p>이전 화면의 내용으로 덮어쓰지 않았습니다. 최신 내용을 다시 확인해 주세요.</p><a class="btn btn-primary" href="/admin/reservations/${id}">최신 내용 보기</a>`,'reservations')}
  return c.redirect(`/admin/reservations/${id}?saved=1`)
})
export default desk
