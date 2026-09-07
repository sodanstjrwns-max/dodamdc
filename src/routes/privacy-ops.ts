import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env } from '../lib/types'
import { shell } from '../lib/admin-ui'
import { formData } from '../lib/util'
import { signToken, verifyToken } from '../lib/auth'
import { keyedHash } from '../lib/security'
import { reauthenticate } from './staff'
const privacy = new Hono<Env>()
// Conservative proposal: terminal, not on hold, and >=1 year after the later of
// valid preferred date / submission date. Pending/confirmed are never purged here.
const eligible = `r.status IN ('done','cancelled') AND r.retention_hold=0
 AND date(r.created_at) IS NOT NULL
 AND max(date(r.created_at),COALESCE(date(r.preferred_date),date(r.created_at))) <= date('now','-1 year')`
privacy.get('/privacy', async c => {
  const count = (await c.env.DB.prepare(`SELECT COUNT(*) n FROM reservations r WHERE ${eligible}`).first<any>())?.n || 0
  return shell(c,'보유기간 확인·승인 파기',html`<section class="ops-panel"><h2 class="h3">홈페이지 예약 ${count}건 검토 대상</h2><p>자동 삭제하지 않습니다. 처리 완료·취소 상태이고, 별도 보존 검토 표시가 없으며, 접수일과 유효한 희망 진료일 중 늦은 날로부터 1년 이상 지난 예약만 후보로 제시합니다.</p><p>확인 대기·일정 확정·날짜 확인 불가·보존 검토 중인 예약은 제외합니다. 법적 보존 의무나 분쟁 관련 자료는 먼저 별도로 검토해 주세요.</p><form method="post" action="/admin/privacy/preview"><button type="submit" class="btn btn-primary">최대 50건 미리보기</button></form></section><section class="ops-panel"><h2 class="h3">삭제 범위와 한계</h2><ul><li>선택된 홈페이지 예약과 해당 응대 이력을 삭제합니다.</li><li>의무기록·회원 계정·사례 사진·네이버 예약·이메일·백업은 이 작업으로 삭제되지 않습니다.</li><li>파기 실행 기록에는 직원 ID·건수·범위만 남기며 환자 정보와 삭제된 예약 ID 목록은 남기지 않습니다.</li><li>외부 이메일과 백업의 보존·파기는 별도의 운영 절차가 필요합니다.</li></ul></section>`,'privacy')
})
privacy.post('/privacy/preview', async c => {
  const rows = (await c.env.DB.prepare(`SELECT r.id,r.version,r.name,r.phone,r.status,r.created_at,r.preferred_date FROM reservations r WHERE ${eligible} ORDER BY r.created_at LIMIT 50`).all<any>()).results || []
  const actor = c.get('staff')!
  const token = await signToken(c.env.SESSION_SECRET, { kind:'reservation-purge', actor:actor.id, version:actor.version, origin:new URL(c.req.url).origin, nonce:crypto.randomUUID(), rows:rows.map(r=>({id:r.id,version:r.version})) },600)
  return shell(c,'파기 대상 최종 확인',html`<section class="ops-panel"><h2 class="h3">이번에 삭제할 ${rows.length}건</h2><p>승인 화면은 10분간 유효합니다. 다른 직원이 수정한 예약이 있으면 전체 작업을 중단하고 다시 확인합니다. 되돌릴 수 없으니 별도 보존이 필요한 접수가 없는지 확인하세요.</p><div class="table-wrap"><table class="admin-table"><thead><tr><th>접수</th><th>이름</th><th>연락처 끝자리</th><th>상태</th><th>희망일</th></tr></thead><tbody>${rows.map(r=>html`<tr><td>#${r.id} · ${r.created_at}</td><td>${r.name}</td><td>${r.phone.replace(/\D/g,'').slice(-4)}</td><td>${r.status}</td><td>${r.preferred_date || '미기재'}</td></tr>`)}</tbody></table></div>${rows.length?html`<form method="post" action="/admin/privacy/purge" class="form ops-form"><input type="hidden" name="ticket" value="${token}"><label>현재 내 비밀번호<input type="password" name="current_password" required autocomplete="current-password"></label><label>아래에 ‘만료 예약 삭제’를 입력하세요<input name="confirm" autocomplete="off" required></label><button type="submit" class="btn btn-danger">확인한 예약·응대 이력 영구 삭제</button></form>`:html`<p>대상이 없습니다.</p>`}<a class="btn btn-outline" href="/admin/privacy">취소·돌아가기</a></section>`,'privacy')
})
privacy.post('/privacy/purge', async c => {
  const actor=c.get('staff')!, f=await formData(c)
  if(f.confirm!=='만료 예약 삭제' || !(await reauthenticate(c,String(f.current_password || '')))) return c.text('승인 문구와 현재 비밀번호를 확인하세요.',403)
  const ticket=await verifyToken(c.env.SESSION_SECRET,String(f.ticket || ''))
  if(!ticket || ticket.kind!=='reservation-purge' || ticket.actor!==actor.id || ticket.version!==actor.version || ticket.origin!==new URL(c.req.url).origin || !Array.isArray(ticket.rows) || !ticket.rows.length || ticket.rows.length>50) return c.text('승인 정보가 유효하지 않습니다. 다시 미리보기해 주세요.',403)
  if(!ticket.rows.every((r:any)=>Number.isSafeInteger(r.id)&&Number.isSafeInteger(r.version))) return c.text('잘못된 승인 정보입니다.',400)
  const snapshot=JSON.stringify(ticket.rows),receipt=await keyedHash(c.env.SESSION_SECRET,ticket.nonce)
  const match=`SELECT r.id FROM reservations r JOIN json_each(?) j ON r.id=json_extract(j.value,'$.id') AND r.version=json_extract(j.value,'$.version') WHERE ${eligible}`
  await c.env.DB.prepare('DELETE FROM purge_receipts WHERE expires_at<=unixepoch()').run()
  // Guard insertion and deletion in one transaction. The receipt is single-use;
  // changes() links each operation. FK cascade removes reservation_events.
  const result=await c.env.DB.batch([
    c.env.DB.prepare(`INSERT OR IGNORE INTO purge_receipts(receipt,expires_at) SELECT ?,? WHERE (SELECT COUNT(*) FROM (${match}))=?`).bind(receipt,ticket.exp,snapshot,ticket.rows.length),
    c.env.DB.prepare(`DELETE FROM reservations WHERE changes()=1 AND id IN (${match}) RETURNING id`).bind(snapshot),
    c.env.DB.prepare("INSERT INTO staff_audit(actor_id,action,detail) SELECT ?,'reservation.purge',json_object('count',changes(),'scope','terminal-reservations-and-events') WHERE changes()>0").bind(actor.id),
  ])
  // D1 meta.changes includes cascading history deletes; RETURNING counts reservations only.
  const deleted=result[1].results.length
  if(deleted!==ticket.rows.length) { c.status(409); return shell(c,'파기를 실행하지 않았습니다',html`<p>대상이 바뀌었거나 이미 사용한 승인입니다. 새로 확인해 주세요.</p><a href="/admin/privacy" class="btn btn-outline">돌아가기</a>`,'privacy') }
  return shell(c,'승인한 파기 완료',html`<p>${deleted}건의 홈페이지 예약과 연결된 응대 이력을 삭제했습니다. 외부 이메일·백업에는 별도 파기가 필요합니다.</p><a class="btn btn-primary" href="/admin/privacy">보유기간 화면으로</a>`,'privacy')
})
export default privacy
