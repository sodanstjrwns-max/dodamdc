import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env } from '../lib/types'
import { shell } from '../lib/admin-ui'
import { formData, fmtDate } from '../lib/util'
import { hashPassword, verifyPassword, clearAdminSession } from '../lib/auth'
import { auditStatement, loginBudget } from '../lib/security'
import { alertBox } from '../lib/ui'
const staffRoutes = new Hono<Env>()
const roles = { owner: '관리책임자', reception: '예약 담당', editor: '콘텐츠 담당' }
export async function reauthenticate(c: any, password: string) {
  const actor = c.get('staff')
  if (!actor?.id || !(await loginBudget(c, 'reauth', String(actor.id)))) return false
  const row = await c.env.DB.prepare('SELECT password_hash FROM staff WHERE id=? AND active=1').bind(actor.id).first()
  return !!row && verifyPassword(password, row.password_hash)
}
staffRoutes.get('/staff', async c => {
  const actor = c.get('staff')!
  const rows = (await c.env.DB.prepare('SELECT id,login,name,role,active,created_at FROM staff ORDER BY id').all<any>()).results || []
  const logs = actor.bootstrap ? [] : (await c.env.DB.prepare('SELECT a.action,a.target_id,a.created_at,s.name actor FROM staff_audit a LEFT JOIN staff s ON s.id=a.actor_id ORDER BY a.id DESC LIMIT 30').all<any>()).results || []
  return shell(c, actor.bootstrap ? '최초 관리책임자 계정 만들기' : '직원 계정·권한', html`
    ${c.req.query('error') ? alertBox('처리할 수 없습니다. 입력·현재 비밀번호를 확인하세요. 마지막 관리책임자는 비활성화하거나 권한을 낮출 수 없습니다.') : ''}
    ${c.req.query('saved') ? alertBox('계정 설정을 저장했습니다. 변경된 계정의 기존 세션은 해제됩니다.', 'ok') : ''}
    <p class="workspace-note">${actor.bootstrap ? '기존 관리자 비밀번호는 최초 계정 생성에만 사용합니다. 생성 후에는 개인 계정으로 다시 로그인하세요.' : '계정은 직원별로 발급하세요. 예약 담당은 예약 업무만, 콘텐츠 담당은 게시물·이미지만 접근합니다. 관리책임자는 전체 관리가 가능합니다.'}</p>
    <section class="ops-panel"><h2 class="h3">${actor.bootstrap ? '책임자 계정' : '직원 추가'}</h2><form method="post" action="/admin/staff" class="form ops-form"><div class="field"><label for="staff-login">로그인 ID</label><input id="staff-login" name="login" required pattern="[a-zA-Z0-9._-]{3,40}" maxlength="40" autocomplete="off"><p class="hint">영문·숫자·마침표·밑줄·하이픈 3~40자</p></div><div class="field"><label for="staff-name">직원 이름</label><input id="staff-name" name="name" required maxlength="40"></div><div class="field"><label for="staff-password">새 계정 비밀번호</label><input id="staff-password" name="password" type="password" minlength="12" maxlength="128" required autocomplete="new-password"><p class="hint">12~128자. 다른 서비스에서 사용하지 않는 비밀번호를 권합니다.</p></div>${actor.bootstrap ? '' : html`<div class="field"><label for="staff-role">역할</label><select id="staff-role" name="role">${Object.entries(roles).map(([v,l]) => html`<option value="${v}">${l}</option>`)}</select></div><div class="field"><label for="owner-password">현재 내 비밀번호</label><input id="owner-password" name="current_password" type="password" required autocomplete="current-password"></div>`}<button type="submit" class="btn btn-primary">계정 만들기</button></form></section>
    ${rows.map(r => html`<details class="ops-panel"><summary>${r.name} · ${r.login} · ${roles[r.role as keyof typeof roles]} · ${r.active ? '활성' : '비활성'}</summary><form method="post" action="/admin/staff/${r.id}" class="form ops-form"><label>표시 이름<input name="name" value="${r.name}" maxlength="40" required></label><label>역할<select name="role">${Object.entries(roles).map(([v,l]) => html`<option value="${v}" ${r.role === v ? 'selected' : ''}>${l}</option>`)}</select></label><label>계정 상태<select name="active"><option value="1" ${r.active ? 'selected' : ''}>활성</option><option value="0" ${!r.active ? 'selected' : ''}>비활성</option></select></label><label>비밀번호 재설정 (선택)<input name="password" type="password" minlength="12" maxlength="128" autocomplete="new-password"></label><label>현재 내 비밀번호<input name="current_password" type="password" required autocomplete="current-password"></label><button type="submit" class="btn btn-outline">변경·기존 세션 해제</button></form></details>`)}
    ${logs.length ? html`<section class="ops-panel"><h2 class="h3">최근 관리 작업</h2><ul class="audit-list">${logs.map(r => html`<li><time>${fmtDate(r.created_at)}</time> · ${r.actor || '최초 설정'} · ${r.action}${r.target_id ? ` #${r.target_id}` : ''}</li>`)}</ul><p class="hint">환자 이름·전화·증상·비밀번호는 이 기록에 남기지 않습니다. 원본 접수 기록과는 별개입니다.</p></section>` : ''}`, 'staff')
})
staffRoutes.post('/staff', async c => {
  const actor = c.get('staff')!, f = await formData(c)
  const login = String(f.login || '').trim().toLowerCase(), name = String(f.name || '').trim(), password = String(f.password || '')
  const role = actor.bootstrap ? 'owner' : String(f.role)
  if (!/^[a-z0-9._-]{3,40}$/.test(login) || !name || name.length > 40 || password.length < 12 || password.length > 128 || !Object.hasOwn(roles, role)) return c.redirect('/admin/staff?error=1')
  if (!actor.bootstrap && !(await reauthenticate(c, String(f.current_password || '')))) return c.redirect('/admin/staff?error=1')
  const hash = await hashPassword(password)
  try {
    const results = await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO staff (login,name,password_hash,role) SELECT ?,?,?,? ${actor.bootstrap ? 'WHERE NOT EXISTS(SELECT 1 FROM staff)' : ''}`).bind(login,name,hash,role),
      c.env.DB.prepare("INSERT INTO staff_audit (actor_id,action,target_id,detail) SELECT ?, 'staff.create', last_insert_rowid(), ? WHERE changes()=1").bind(actor.id, JSON.stringify({ role })),
    ])
    if (!results[0].meta.changes) return c.redirect('/admin/staff?error=1')
  } catch { return c.redirect('/admin/staff?error=1') }
  if (actor.bootstrap) { clearAdminSession(c); return c.redirect('/admin/login?created=1') }
  return c.redirect('/admin/staff?saved=1')
})
staffRoutes.post('/staff/:id', async c => {
  const actor = c.get('staff')!, f = await formData(c), id = Number(c.req.param('id'))
  if (actor.bootstrap || !(await reauthenticate(c, String(f.current_password || '')))) return c.redirect('/admin/staff?error=1')
  const role = String(f.role), name = String(f.name || '').trim(), active = f.active === '1' ? 1 : 0, password = String(f.password || '')
  if (!Number.isSafeInteger(id) || !name || name.length > 40 || !Object.hasOwn(roles, role) || (password && (password.length < 12 || password.length > 128))) return c.redirect('/admin/staff?error=1')
  const results = await c.env.DB.batch([
    c.env.DB.prepare("UPDATE staff SET name=?,role=?,active=?,password_hash=COALESCE(?,password_hash),session_version=session_version+1 WHERE id=? AND (NOT(role='owner' AND active=1) OR (?='owner' AND ?=1) OR (SELECT COUNT(*) FROM staff WHERE role='owner' AND active=1)>1)").bind(name,role,active,password ? await hashPassword(password) : null,id,role,active),
    c.env.DB.prepare("INSERT INTO staff_audit (actor_id,action,target_id,detail) SELECT ?, 'staff.update', ?, ? WHERE changes()=1").bind(actor.id,id,JSON.stringify({ role, active, passwordReset: !!password })),
  ])
  if (!results[0].meta.changes) return c.redirect('/admin/staff?error=1')
  if (id === actor.id) { clearAdminSession(c); return c.redirect('/admin/login') }
  return c.redirect('/admin/staff?saved=1')
})
export default staffRoutes
