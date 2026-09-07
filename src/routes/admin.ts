import { Hono } from 'hono'
import { eventLabels, locationLabels, cleanupConversions } from '../lib/conversions'
import type { Context } from 'hono'
import { html, raw } from 'hono/html'
import type { Env } from '../lib/types'
import { setAdminSession, clearAdminSession, verifyPassword } from '../lib/auth'
import { shell } from '../lib/admin-ui'
import { canAccessStaff, loginBudget, auditStatement } from '../lib/security'
import { sanitizeArticle, checkedImage } from '../lib/content-safety'
import staffRoutes from './staff'
import reservationDesk from './reservation-desk'
import privacyOps from './privacy-ops'
import { EDITABLE_KEYS, getPath, saveSettings, invalidateClinicCache, validSetting } from '../lib/settings'
import { treatments, getTreatment } from '../data/treatments'
import { doctors } from '../data/doctors'
import { formData, slugify, fmtDate, stripTags, esc } from '../lib/util'
import { alertBox } from '../lib/ui'

const admin = new Hono<Env>()

// ── 로그인 ───────────────────────────────────────────────
admin.get('/login', async (c) => {
  const bootstrap = (await c.env.DB.prepare('SELECT COUNT(*) n FROM staff').first<any>())?.n === 0
  if (c.get('admin')) return c.redirect('/admin')
  const clinic = c.get('clinic') as any
  return c.html(html`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>관리자 로그인 · ${clinic.shortName}</title><link rel="stylesheet" href="/static/style.css?v=4"></head>
<body class="admin-login"><div class="form-card"><img src="/static/img/logo-wide.png" alt="${clinic.name}" width="176" height="44" style="margin-bottom:20px">
${c.req.query('e') ? alertBox('로그인 정보를 확인해 주세요.') : ''}${c.req.query('created') ? alertBox('계정을 만들었습니다. 개인 ID로 로그인하세요.', 'ok') : ''}<p>${bootstrap ? '최초 계정 설정용 로그인입니다. 기존 관리자 비밀번호로 책임자 계정을 먼저 만들어 주세요.' : '직원별로 발급된 ID와 비밀번호로 로그인해 주세요.'}</p>
<form method="post" action="/admin/login" class="form">${bootstrap ? '' : html`<div class="field"><label for="login">로그인 ID</label><input id="login" name="login" required autocomplete="username" maxlength="40"></div>`}<div class="field"><label for="pw">관리자 비밀번호</label><input id="pw" name="password" type="password" required autofocus autocomplete="current-password"></div><button type="submit" class="btn btn-primary btn-block">로그인</button></form>
<p class="form-foot"><a href="/">← 사이트로</a></p></div></body></html>`)
})
admin.post('/login', async (c) => {
  const f = await formData(c)
  const login = String(f.login || '').trim().toLowerCase(), password = String(f.password || '')
  if (!(await loginBudget(c, 'staff-login', login || 'bootstrap'))) return c.text('로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.', 429)
  const count = (await c.env.DB.prepare('SELECT COUNT(*) n FROM staff').first<any>())?.n
  if (count === 0) {
    if (!c.env.ADMIN_PASSWORD || password !== c.env.ADMIN_PASSWORD) return c.redirect('/admin/login?e=1')
    await setAdminSession(c, { id:null, login:'bootstrap', name:'최초 설정', role:'owner', version:0, bootstrap:true })
    return c.redirect('/admin/staff')
  }
  const row = await c.env.DB.prepare('SELECT * FROM staff WHERE login=? AND active=1').bind(login).first<any>()
  if (!row || !(await verifyPassword(password, row.password_hash))) return c.redirect('/admin/login?e=1')
  await setAdminSession(c, { id:row.id, login:row.login, name:row.name, role:row.role, version:row.session_version })
  await auditStatement(c.env.DB,row.id,'staff.login',row.id).run()
  return c.redirect(row.role === 'reception' ? '/admin/reservations' : row.role === 'editor' ? '/admin/columns' : '/admin')
})
admin.post('/logout', async (c) => {
  const actor=c.get('staff')
  if(actor?.id) await c.env.DB.batch([c.env.DB.prepare('UPDATE staff SET session_version=session_version+1 WHERE id=?').bind(actor.id),auditStatement(c.env.DB,actor.id,'staff.logout',actor.id)])
  clearAdminSession(c); return c.redirect('/admin/login')
})

// 인증 가드
admin.use('/*', async (c, next) => {
  if (c.req.path === '/admin/login') return next()
  if (!c.get('admin')) return c.req.method === 'GET' ? c.redirect('/admin/login') : c.text('Unauthorized', 401)
  if (!canAccessStaff(c.get('staff'), c.req.path)) return c.text('이 작업에 접근할 권한이 없습니다.', 403)
  await next()
  if (c.req.method === 'POST' && ([302,303].includes(c.res.status) || (c.req.path === '/admin/api/upload' && c.res.status === 200)) && !/^\/admin\/(staff|reservations|privacy)/.test(c.req.path)) {
    await auditStatement(c.env.DB,c.get('staff')?.id || null,'admin.change',null,{route:c.req.path}).run()
  }
})
admin.route('/', staffRoutes)
admin.route('/', reservationDesk)
admin.route('/', privacyOps)

// ── 대시보드 ─────────────────────────────────────────────
admin.get('/', async (c) => {
  const principal=c.get('staff')!
  if(principal.bootstrap) return c.redirect('/admin/staff')
  if(principal.role==='reception') return c.redirect('/admin/reservations')
  if(principal.role==='editor') return c.redirect('/admin/columns')
  const db = c.env.DB
  const q = async (sql: string) => (await db.prepare(sql).first<any>())?.n ?? 0
  const [members, cases, columns, notices, pending, views7] = await Promise.all([
    q('SELECT COUNT(*) n FROM users'), q('SELECT COUNT(*) n FROM cases'), q('SELECT COUNT(*) n FROM columns'), q('SELECT COUNT(*) n FROM notices'),
    q("SELECT COUNT(*) n FROM reservations WHERE status='pending'"), q("SELECT COUNT(*) n FROM page_views WHERE is_bot=0 AND created_at > datetime('now','-7 days')"),
  ])
  const recent = (await db.prepare('SELECT id,name,phone,treatment,preferred_date,status,created_at FROM reservations ORDER BY created_at DESC LIMIT 8').all<any>()).results || []
  const top = (await db.prepare("SELECT path, COUNT(*) n FROM page_views WHERE is_bot=0 AND created_at > datetime('now','-30 days') GROUP BY path ORDER BY n DESC LIMIT 10").all<any>()).results || []
  const body = html`<div class="admin-cards">
    <a href="/admin/reservations?status=pending" class="admin-card"><span class="n">${pending}</span><span class="l">대기 예약</span></a>
    <a href="/admin/members" class="admin-card"><span class="n">${members}</span><span class="l">회원</span></a>
    <a href="/admin/cases" class="admin-card"><span class="n">${cases}</span><span class="l">치료 전후</span></a>
    <a href="/admin/columns" class="admin-card"><span class="n">${columns}</span><span class="l">칼럼</span></a>
    <a href="/admin/notices" class="admin-card"><span class="n">${notices}</span><span class="l">공지</span></a>
    <a href="/admin/stats" class="admin-card"><span class="n">${views7}</span><span class="l">7일 조회 (봇 제외)</span></a>
  </div>
  <div class="grid-2" style="margin-top:28px">
    <section><h2 class="h3">최근 예약</h2><table class="admin-table"><thead><tr><th>이름</th><th>연락처</th><th>진료</th><th>희망일</th><th>상태</th></tr></thead><tbody>${recent.map((r: any) => html`<tr><td><a href="/admin/reservations/${r.id}">${r.name}</a></td><td>${r.phone}</td><td>${r.treatment || '-'}</td><td>${r.preferred_date || '-'}</td><td><span class="badge-${r.status === 'pending' ? 'new' : r.status === 'cancelled' ? 'off' : 'on'}">${r.status}</span></td></tr>`)}</tbody></table></section>
    <section><h2 class="h3">30일 인기 페이지</h2><table class="admin-table"><thead><tr><th>경로</th><th>조회</th></tr></thead><tbody>${top.map((r: any) => html`<tr><td><a href="${r.path}" target="_blank">${r.path}</a></td><td>${r.n}</td></tr>`)}</tbody></table></section>
  </div>`
  return shell(c, '대시보드', body, 'dash')
})

// ── 업로드 (R2) ──────────────────────────────────────────
async function putFile(c: Context<Env>, file: File, prefix: string) {
  if (!['cases/before','cases/after','columns','notices','uploads'].includes(prefix)) throw new Error('허용하지 않는 업로드 위치입니다.')
  const { bytes, type, ext } = await checkedImage(file)
  const key = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${ext}`
  await c.env.R2.put(key, bytes, { httpMetadata: { contentType:type } })
  try { await c.env.DB.prepare('INSERT INTO uploads (key,filename,content_type,size) VALUES (?,?,?,?)').bind(key, key.split('/').pop(), type, file.size).run() }
  catch (error) { await c.env.R2.delete(key); throw error }
  return key
}
admin.post('/api/upload', async (c) => {
  try {
    const fd = await c.req.formData()
    const file = fd.get('file')
    if (!(file instanceof File)) return c.json({ error: '파일이 없습니다' }, 400)
    const key = await putFile(c, file, String(fd.get('prefix') || 'uploads'))
    return c.json({ key, url: `/files/${key}` })
  } catch (e: any) { return c.json({ error: e.message }, 400) }
})

// ── 치료 전후 ────────────────────────────────────────────
const AGES = ['10대', '20대', '30대', '40대', '50대', '60대', '70대 이상']
function caseForm(c: any, k: any = {}, err?: string) {
  const slot = (name: string, label: string) => html`<div class="upload-slot ${k[name] ? 'has' : ''}" data-slot="${name}">
    <label>${label}</label>
    ${k[name] ? html`<img src="/files/${k[name]}" alt="" width="240" height="160">` : html`<span class="upload-empty">클릭 또는 드래그하여 업로드</span>`}
    <input type="file" name="${name}_file" accept="image/*">
    <input type="hidden" name="${name}" value="${k[name] || ''}">
    <label class="check small"><input type="checkbox" name="${name}_clear" value="1"> 삭제</label>
  </div>`
  const body = html`${alertBox(err)}<form method="post" enctype="multipart/form-data" class="admin-form" data-once>
  <div class="form-row"><div class="field"><label>제목 *</label><input name="title" required value="${k.title || ''}" placeholder="예: 깊은 충치, 신경 살려 크라운으로 마무리"></div><div class="field"><label>슬러그 (URL)</label><input name="slug" value="${k.slug || ''}" placeholder="비우면 자동 생성"></div></div>
  <div class="form-row">
    <div class="field"><label>진료 *</label><select name="treatment_slug" required>${treatments.map((t) => html`<option value="${t.slug}" ${k.treatment_slug === t.slug ? 'selected' : ''}>${t.name}</option>`)}</select></div>
    <div class="field"><label>담당 의료진</label><select name="doctor_slug">${doctors.map((d) => html`<option value="${d.slug}" ${(k.doctor_slug || 'han-hwirim') === d.slug ? 'selected' : ''}>${d.name} ${d.title}</option>`)}</select></div>
  </div>
  <div class="form-row">
    <div class="field"><label>연령대</label><select name="age_group"><option value="">선택</option>${AGES.map((a) => html`<option ${k.age_group === a ? 'selected' : ''}>${a}</option>`)}</select></div>
    <div class="field"><label>성별</label><select name="gender"><option value="">선택</option><option ${k.gender === '여성' ? 'selected' : ''}>여성</option><option ${k.gender === '남성' ? 'selected' : ''}>남성</option></select></div>
    <div class="field autocomplete"><label>거주 지역</label><input name="region" value="${k.region || ''}" placeholder="예: 초지 → 안산시 상록구 초지동"><div class="autocomplete-list"></div></div>
    <div class="field"><label>치료 기간</label><input name="duration" value="${k.duration || ''}" placeholder="예: 3주 (2회 내원)"></div>
  </div>
  <div class="field"><label>치료 설명</label><textarea name="description" rows="6" placeholder="어떤 상태였고, 왜 이 치료를 선택했고, 어떻게 진행했는지. 효과 보장·비교·과장 표현 금지.">${k.description || ''}</textarea></div>
  <h3 class="h3">사진 (없는 항목은 비워두면 표시되지 않습니다)</h3>
  <div class="grid-2">${slot('intra_before', '구내 사진 · 치료 전 (공개)')}${slot('intra_after', '구내 사진 · 치료 후 (회원 전용)')}${slot('pano_before', '파노라마 · 치료 전 (공개)')}${slot('pano_after', '파노라마 · 치료 후 (회원 전용)')}</div>
  <label class="check"><input type="checkbox" name="published" value="1" ${k.published === 0 ? '' : 'checked'}> 공개</label>
  <div class="admin-toolbar"><button type="submit" class="btn btn-primary" data-loading="저장 중…">저장</button><a href="/admin/cases" class="btn btn-outline">목록</a>${k.id ? html`<button type="submit" form="del" class="btn btn-danger" onclick="return confirm('삭제할까요?')">삭제</button>` : ''}</div>
</form>${k.id ? html`<form id="del" method="post" action="/admin/cases/${k.id}/delete"></form>` : ''}`
  return shell(c, k.id ? '치료 전후 수정' : '치료 전후 등록', body, 'cases')
}
admin.get('/cases', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id,slug,title,treatment_slug,published,views,created_at,intra_before,pano_before FROM cases ORDER BY created_at DESC').all<any>()).results || []
  return shell(c, '치료 전후', html`<div class="admin-toolbar"><a href="/admin/cases/new" class="btn btn-primary">+ 새 사례</a></div>
  <table class="admin-table"><thead><tr><th></th><th>제목</th><th>진료</th><th>공개</th><th>조회</th><th>등록</th></tr></thead><tbody>${rows.map((r: any) => html`<tr><td>${r.intra_before || r.pano_before ? html`<img src="/files/${r.intra_before || r.pano_before}" width="56" height="40" alt="" style="object-fit:cover;border-radius:6px">` : ''}</td><td><a href="/admin/cases/${r.id}">${r.title}</a> <a href="/cases/gallery/${r.slug}" target="_blank" class="hint">↗</a></td><td>${getTreatment(r.treatment_slug)?.name || r.treatment_slug}</td><td>${r.published ? html`<span class="badge-on">공개</span>` : html`<span class="badge-off">비공개</span>`}</td><td>${r.views}</td><td>${fmtDate(r.created_at)}</td></tr>`)}</tbody></table>${!rows.length ? html`<p class="hint">등록된 사례가 없습니다.</p>` : ''}`, 'cases')
})
admin.get('/cases/new', (c) => caseForm(c))
admin.get('/cases/:id', async (c) => { const k = await c.env.DB.prepare('SELECT * FROM cases WHERE id=?').bind(c.req.param('id')).first(); return k ? caseForm(c, k) : c.notFound() })
async function saveCase(c: Context<Env>, id?: number) {
  const fd = await c.req.formData()
  const g = (k: string) => String(fd.get(k) || '').trim()
  const cur = id ? await c.env.DB.prepare('SELECT * FROM cases WHERE id=?').bind(id).first<any>() : {}
  const photos: Record<string, string | null> = {}
  for (const s of ['intra_before', 'intra_after', 'pano_before', 'pano_after']) {
    const f = fd.get(`${s}_file`)
    if (f instanceof File && f.size) photos[s] = await putFile(c, f, s.endsWith('after') ? 'cases/after' : 'cases/before')
    else if (fd.get(`${s}_clear`)) photos[s] = null
    else photos[s] = cur?.[s] || null
  }
  const title = g('title'); if (!title) throw new Error('제목을 입력해 주세요.')
  const slug = g('slug') ? slugify(g('slug')) : (id && cur?.slug) ? cur.slug : `${g('treatment_slug') || 'case'}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 4)}`
  const vals = [slug, title, g('description') || null, g('treatment_slug'), g('doctor_slug') || 'han-hwirim', g('age_group') || null, g('gender') || null, g('region') || null, g('duration') || null, photos.pano_before, photos.pano_after, photos.intra_before, photos.intra_after, fd.get('published') ? 1 : 0]
  if (id) await c.env.DB.prepare('UPDATE cases SET slug=?,title=?,description=?,treatment_slug=?,doctor_slug=?,age_group=?,gender=?,region=?,duration=?,pano_before=?,pano_after=?,intra_before=?,intra_after=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals, id).run()
  else await c.env.DB.prepare('INSERT INTO cases (slug,title,description,treatment_slug,doctor_slug,age_group,gender,region,duration,pano_before,pano_after,intra_before,intra_after,published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...vals).run()
}
admin.post('/cases/new', async (c) => { try { await saveCase(c); return c.redirect('/admin/cases') } catch (e: any) { return caseForm(c, {}, e.message) } })
admin.post('/cases/:id', async (c) => { const id = Number(c.req.param('id')); try { await saveCase(c, id); return c.redirect('/admin/cases') } catch (e: any) { return caseForm(c, { ...(await c.env.DB.prepare('SELECT * FROM cases WHERE id=?').bind(id).first<any>()) }, e.message) } })
admin.post('/cases/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM cases WHERE id=?').bind(c.req.param('id')).run(); return c.redirect('/admin/cases') })

// ── 원장 칼럼 (SEO 에디터) ───────────────────────────────
const editorialImageNotice = html`<aside class="ops-panel" aria-label="이미지 공개 안내"><h2 class="h3">게시 전에 이미지 공개 범위를 확인하세요</h2><p>공개 칼럼·공지에 연결한 일반 이미지는 누구나 볼 수 있고, 운영 사이트에서는 검색 대상이 될 수 있습니다. 업로드만 했거나 비공개 글에만 연결된 이미지는 담당 직원만 확인할 수 있습니다.</p><p>치료 후 사진을 칼럼·공지용으로 다시 업로드하지 마세요. 동일 사진을 새 파일로 올린 경우 자동으로 식별하지 못합니다. 환자 동의·비식별화·촬영 메타데이터는 게시자가 확인해야 합니다.</p><p class="hint">다른 공개 글에서도 쓰는 이미지는 한 글만 비공개로 바꿔도 계속 공개됩니다. 검색 결과·외부 복제본의 즉시 삭제를 보장하지 않습니다.</p></aside>`
function columnForm(c: any, p: any = {}, err?: string) {
  const body = html`${alertBox(err)}${editorialImageNotice}<form method="post" enctype="multipart/form-data" class="admin-form" data-once id="column-form">
  <div class="field"><label>제목 (H1) *</label><input name="title" required value="${p.title || ''}" maxlength="80" data-count></div>
  <div class="form-row"><div class="field"><label>슬러그 (URL)</label><input name="slug" value="${p.slug || ''}" placeholder="비우면 제목에서 자동 생성"></div><div class="field"><label>작성자</label><select name="author_slug">${doctors.map((d) => html`<option value="${d.slug}" ${(p.author_slug || 'han-hwirim') === d.slug ? 'selected' : ''}>${d.name} ${d.title}</option>`)}</select></div><div class="field"><label>관련 진료 (인링크)</label><select name="treatment_slug"><option value="">없음</option>${treatments.map((t) => html`<option value="${t.slug}" ${p.treatment_slug === t.slug ? 'selected' : ''}>${t.name}</option>`)}</select></div></div>
  <div class="field"><label>요약 (excerpt · 목록·OG에 사용)</label><textarea name="excerpt" rows="2" maxlength="200" data-count>${p.excerpt || ''}</textarea></div>
  <div class="field"><label>본문 *</label>
    <div class="editor-toolbar" role="toolbar" aria-label="서식">
      ${[['h2', 'H2'], ['h3', 'H3'], ['p', '본문'], ['bold', 'B'], ['italic', 'I'], ['ul', '• 목록'], ['ol', '1. 목록'], ['quote', '인용'], ['link', '링크'], ['image', '이미지'], ['hr', '구분선'], ['clear', '서식 지우기']].map(([k, l]) => html`<button type="button" data-cmd="${k}">${l}</button>`)}
      <span class="editor-hint">이미지는 드래그하거나 붙여넣기(Ctrl+V)로도 넣을 수 있습니다</span>
    </div>
    <div class="editor" id="editor" contenteditable="true" data-upload="/admin/api/upload" data-prefix="columns">${raw(sanitizeArticle(p.content_html || '<p></p>'))}</div>
    <textarea name="content_html" id="content_html" hidden>${p.content_html || ''}</textarea>
  </div>
  <div class="form-row">
    <div class="field"><label>대표 이미지 (썸네일·OG)</label><div class="upload-slot ${p.thumbnail ? 'has' : ''}">${p.thumbnail ? html`<img src="/files/${p.thumbnail}" alt="" width="240" height="160">` : html`<span class="upload-empty">클릭 또는 드래그</span>`}<input type="file" name="thumbnail_file" accept="image/*"><input type="hidden" name="thumbnail" value="${p.thumbnail || ''}"><label class="check small"><input type="checkbox" name="thumbnail_clear" value="1"> 삭제</label></div></div>
    <div>
      <div class="field"><label>SEO 제목 <small>(비우면 제목 사용, 60자 이내 권장)</small></label><input name="meta_title" value="${p.meta_title || ''}" maxlength="70" data-count></div>
      <div class="field"><label>SEO 설명 <small>(155자 이내 권장)</small></label><textarea name="meta_description" rows="2" maxlength="160" data-count>${p.meta_description || ''}</textarea></div>
      <div class="field"><label>태그 (쉼표 구분)</label><input name="tags" value="${p.tags || ''}" placeholder="신경치료, MTA, 자연치아"></div>
      <div class="field"><label>게시일</label><input type="datetime-local" name="published_at" value="${p.published_at ? String(p.published_at).replace(' ', 'T').slice(0, 16) : ''}"></div>
    </div>
  </div>
  <label class="check"><input type="checkbox" name="published" value="1" ${p.published === 0 ? '' : 'checked'}> 공개</label>
  <div class="admin-toolbar"><button type="submit" class="btn btn-primary" data-loading="저장 중…">저장</button><a href="/admin/columns" class="btn btn-outline">목록</a>${p.id ? html`<a href="/column/${p.slug}" target="_blank" class="btn btn-outline">미리보기 ↗</a><button type="submit" form="del" class="btn btn-danger" onclick="return confirm('삭제할까요?')">삭제</button>` : ''}</div>
</form>${p.id ? html`<form id="del" method="post" action="/admin/columns/${p.id}/delete"></form>` : ''}`
  return shell(c, p.id ? '칼럼 수정' : '칼럼 작성', body, 'columns')
}
admin.get('/columns', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id,slug,title,author_slug,treatment_slug,published,views,published_at FROM columns ORDER BY published_at DESC').all<any>()).results || []
  return shell(c, '원장 칼럼', html`<div class="admin-toolbar"><a href="/admin/columns/new" class="btn btn-primary">+ 새 칼럼</a></div>
  <table class="admin-table"><thead><tr><th>제목</th><th>진료</th><th>공개</th><th>조회</th><th>게시일</th></tr></thead><tbody>${rows.map((r: any) => html`<tr><td><a href="/admin/columns/${r.id}">${r.title}</a> <a href="/column/${r.slug}" target="_blank" class="hint">↗</a></td><td>${r.treatment_slug ? getTreatment(r.treatment_slug)?.name : '-'}</td><td>${r.published ? html`<span class="badge-on">공개</span>` : html`<span class="badge-off">비공개</span>`}</td><td>${r.views}</td><td>${fmtDate(r.published_at)}</td></tr>`)}</tbody></table>`, 'columns')
})
admin.get('/columns/new', (c) => columnForm(c))
admin.get('/columns/:id', async (c) => { const p = await c.env.DB.prepare('SELECT * FROM columns WHERE id=?').bind(c.req.param('id')).first(); return p ? columnForm(c, p) : c.notFound() })
async function saveColumn(c: Context<Env>, id?: number) {
  const fd = await c.req.formData(); const g = (k: string) => String(fd.get(k) || '').trim()
  const cur = id ? await c.env.DB.prepare('SELECT * FROM columns WHERE id=?').bind(id).first<any>() : {}
  if (g('content_html').length > 200000) throw new Error('본문이 너무 깁니다.')
  const title = g('title'); const content = sanitizeArticle(g('content_html'))
  if (!title || stripTags(content).length < 20) throw new Error('제목과 본문(20자 이상)을 입력해 주세요.')
  let thumb = cur?.thumbnail || null
  const tf = fd.get('thumbnail_file'); if (tf instanceof File && tf.size) thumb = await putFile(c, tf, 'columns'); else if (fd.get('thumbnail_clear')) thumb = null
  const slug = g('slug') ? slugify(g('slug')) : (id && cur?.slug) ? cur.slug : (/^[\x00-\x7F]+$/.test(title) ? slugify(title) : `column-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 4)}`)
  const pub = g('published_at') ? g('published_at').replace('T', ' ') + ':00' : cur?.published_at || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ')
  const excerpt = g('excerpt') || stripTags(content).slice(0, 150)
  const vals = [slug, title, excerpt, content, thumb, g('author_slug') || 'han-hwirim', g('treatment_slug') || null, g('meta_title') || null, g('meta_description') || null, g('tags') || null, fd.get('published') ? 1 : 0, pub]
  if (id) await c.env.DB.prepare('UPDATE columns SET slug=?,title=?,excerpt=?,content_html=?,thumbnail=?,author_slug=?,treatment_slug=?,meta_title=?,meta_description=?,tags=?,published=?,published_at=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals, id).run()
  else await c.env.DB.prepare('INSERT INTO columns (slug,title,excerpt,content_html,thumbnail,author_slug,treatment_slug,meta_title,meta_description,tags,published,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(...vals).run()
}
admin.post('/columns/new', async (c) => { try { await saveColumn(c); return c.redirect('/admin/columns') } catch (e: any) { return columnForm(c, {}, e.message) } })
admin.post('/columns/:id', async (c) => { const id = Number(c.req.param('id')); try { await saveColumn(c, id); return c.redirect('/admin/columns') } catch (e: any) { return columnForm(c, await c.env.DB.prepare('SELECT * FROM columns WHERE id=?').bind(id).first(), e.message) } })
admin.post('/columns/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM columns WHERE id=?').bind(c.req.param('id')).run(); return c.redirect('/admin/columns') })

// ── 공지사항 ─────────────────────────────────────────────
function noticeForm(c: any, n: any = {}, err?: string) {
  const body = html`${alertBox(err)}${editorialImageNotice}<form method="post" enctype="multipart/form-data" class="admin-form" data-once>
  <div class="field"><label>제목 *</label><input name="title" required value="${n.title || ''}"></div>
  <div class="field"><label>내용 *</label><div class="editor-toolbar">${[['h3', 'H3'], ['p', '본문'], ['bold', 'B'], ['ul', '• 목록'], ['link', '링크'], ['image', '이미지']].map(([k, l]) => html`<button type="button" data-cmd="${k}">${l}</button>`)}</div><div class="editor" id="editor" contenteditable="true" data-upload="/admin/api/upload" data-prefix="notices">${raw(sanitizeArticle(n.content_html || '<p></p>'))}</div><textarea name="content_html" id="content_html" hidden>${n.content_html || ''}</textarea></div>
  <div class="field"><label>이미지 (선택)</label><div class="upload-slot ${n.image ? 'has' : ''}">${n.image ? html`<img src="/files/${n.image}" alt="" width="240" height="160">` : html`<span class="upload-empty">클릭 또는 드래그</span>`}<input type="file" name="image_file" accept="image/*"><input type="hidden" name="image" value="${n.image || ''}"><label class="check small"><input type="checkbox" name="image_clear" value="1"> 삭제</label></div></div>
  <label class="check"><input type="checkbox" name="pinned" value="1" ${n.pinned ? 'checked' : ''}> 대표 공지 (홈 상단 노출)</label>
  <label class="check"><input type="checkbox" name="published" value="1" ${n.published === 0 ? '' : 'checked'}> 공개</label>
  <div class="admin-toolbar"><button type="submit" class="btn btn-primary">저장</button><a href="/admin/notices" class="btn btn-outline">목록</a>${n.id ? html`<button type="submit" form="del" class="btn btn-danger" onclick="return confirm('삭제할까요?')">삭제</button>` : ''}</div>
</form>${n.id ? html`<form id="del" method="post" action="/admin/notices/${n.id}/delete"></form>` : ''}`
  return shell(c, n.id ? '공지 수정' : '공지 작성', body, 'notices')
}
admin.get('/notices', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id,title,pinned,published,views,created_at FROM notices ORDER BY pinned DESC, created_at DESC').all<any>()).results || []
  return shell(c, '공지사항', html`<div class="admin-toolbar"><a href="/admin/notices/new" class="btn btn-primary">+ 새 공지</a></div><table class="admin-table"><thead><tr><th>제목</th><th>대표</th><th>공개</th><th>조회</th><th>등록</th></tr></thead><tbody>${rows.map((r: any) => html`<tr><td><a href="/admin/notices/${r.id}">${r.title}</a></td><td>${r.pinned ? '📌' : ''}</td><td>${r.published ? html`<span class="badge-on">공개</span>` : html`<span class="badge-off">비공개</span>`}</td><td>${r.views}</td><td>${fmtDate(r.created_at)}</td></tr>`)}</tbody></table>`, 'notices')
})
admin.get('/notices/new', (c) => noticeForm(c))
admin.get('/notices/:id', async (c) => { const n = await c.env.DB.prepare('SELECT * FROM notices WHERE id=?').bind(c.req.param('id')).first(); return n ? noticeForm(c, n) : c.notFound() })
async function saveNotice(c: Context<Env>, id?: number) {
  const fd = await c.req.formData(); const g = (k: string) => String(fd.get(k) || '').trim()
  const cur = id ? await c.env.DB.prepare('SELECT * FROM notices WHERE id=?').bind(id).first<any>() : {}
  if (!g('title') || !stripTags(g('content_html'))) throw new Error('제목과 내용을 입력해 주세요.')
  let img = cur?.image || null
  const f = fd.get('image_file'); if (f instanceof File && f.size) img = await putFile(c, f, 'notices'); else if (fd.get('image_clear')) img = null
  const pinned = fd.get('pinned') ? 1 : 0
  if (pinned) await c.env.DB.prepare('UPDATE notices SET pinned=0').run()
  if (g('content_html').length > 200000) throw new Error('본문이 너무 깁니다.')
  const vals = [g('title'), sanitizeArticle(g('content_html')), img, pinned, fd.get('published') ? 1 : 0]
  if (id) await c.env.DB.prepare('UPDATE notices SET title=?,content_html=?,image=?,pinned=?,published=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals, id).run()
  else await c.env.DB.prepare('INSERT INTO notices (title,content_html,image,pinned,published) VALUES (?,?,?,?,?)').bind(...vals).run()
}
admin.post('/notices/new', async (c) => { try { await saveNotice(c); return c.redirect('/admin/notices') } catch (e: any) { return noticeForm(c, {}, e.message) } })
admin.post('/notices/:id', async (c) => { const id = Number(c.req.param('id')); try { await saveNotice(c, id); return c.redirect('/admin/notices') } catch (e: any) { return noticeForm(c, await c.env.DB.prepare('SELECT * FROM notices WHERE id=?').bind(id).first(), e.message) } })
admin.post('/notices/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM notices WHERE id=?').bind(c.req.param('id')).run(); return c.redirect('/admin/notices') })

// ── 회원 ─────────────────────────────────────────────────
admin.get('/members', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const rows = (await c.env.DB.prepare(`SELECT id,email,name,phone,provider,agree_marketing,role,last_login_at,created_at FROM users ${q ? 'WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?' : ''} ORDER BY created_at DESC LIMIT 300`).bind(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])).all<any>()).results || []
  return shell(c, '회원 관리', html`<form class="admin-toolbar" method="get"><input name="q" value="${q}" placeholder="이름·이메일·전화 검색"><button class="btn btn-outline btn-sm">검색</button><span class="hint">${rows.length}명</span></form>
  <table class="admin-table"><thead><tr><th>가입</th><th>이름</th><th>이메일</th><th>전화</th><th>가입 경로</th><th>마케팅</th><th>최근 로그인</th><th></th></tr></thead><tbody>${rows.map((u: any) => html`<tr><td>${fmtDate(u.created_at)}</td><td>${u.name}${u.role === 'admin' ? ' 👑' : ''}</td><td>${u.email}</td><td>${u.phone || '-'}</td><td>${u.provider}</td><td>${u.agree_marketing ? html`<span class="badge-on">동의</span>` : html`<span class="badge-off">-</span>`}</td><td>${fmtDate(u.last_login_at)}</td><td><form method="post" action="/admin/members/${u.id}/delete" class="inline" onsubmit="return confirm('이 회원 계정을 삭제할까요?')"><button class="btn btn-danger btn-sm">삭제</button></form></td></tr>`)}</tbody></table>`, 'members')
})
admin.post('/members/:id/delete', async (c) => { await c.env.DB.batch([c.env.DB.prepare('UPDATE reservations SET user_id=NULL WHERE user_id=?').bind(c.req.param('id')),c.env.DB.prepare('DELETE FROM users WHERE id=?').bind(c.req.param('id'))]); return c.redirect('/admin/members') })

// ── 기본정보 (한 곳 수정 → 전체 반영) ────────────────────
admin.get('/settings', async (c) => {
  const clinic = c.get('clinic') as any
  const saved = c.req.query('saved')
  return shell(c, '기본정보', html`${saved ? alertBox('저장되었습니다. 전체 페이지에 즉시 반영됩니다.', 'ok') : ''}<p class="hint">여기서 수정한 값은 헤더·푸터·오시는 길·JSON-LD 등 사이트 전체에 반영됩니다. 비워두면 기본값을 사용합니다.</p>
  <form method="post" class="admin-form" data-once>${EDITABLE_KEYS.map((k) => { const v = getPath(clinic, k.key) ?? ''; return html`<div class="field"><label>${k.label} <small class="hint">${k.key}</small></label>${k.type === 'textarea' ? html`<textarea name="${k.key}" rows="3">${v}</textarea>` : html`<input name="${k.key}" value="${v}">`}</div>` })}
  <div class="admin-toolbar"><button type="submit" class="btn btn-primary">저장</button></div></form>`, 'settings')
})
admin.post('/settings', async (c) => {
  const f = await formData(c)
  const entries: Record<string, string> = {}
  for (const k of EDITABLE_KEYS) if (k.key in f) entries[k.key] = String(f[k.key] ?? '')
  if (Object.entries(entries).some(([key,value]) => !validSetting(key,value))) return c.text('설정값 형식을 확인해 주세요. 주소는 http/https, 분석 ID는 정식 ID만 허용합니다.',400)
  await saveSettings(c.env.DB, entries)
  invalidateClinicCache()
  return c.redirect('/admin/settings?saved=1')
})

// ── 조회 통계 ────────────────────────────────────────────
admin.get('/stats', async (c) => {
  const db = c.env.DB
  const daily = (await db.prepare("SELECT date(created_at) d, SUM(CASE WHEN is_bot=0 THEN 1 ELSE 0 END) human, SUM(is_bot) bot FROM page_views WHERE created_at > datetime('now','-30 days') GROUP BY d ORDER BY d DESC").all<any>()).results || []
  const top = (await db.prepare("SELECT path, COUNT(*) n FROM page_views WHERE is_bot=0 AND created_at > datetime('now','-30 days') GROUP BY path ORDER BY n DESC LIMIT 30").all<any>()).results || []
  const ents = (await db.prepare("SELECT entity_type, COUNT(*) n FROM page_views WHERE is_bot=0 AND created_at > datetime('now','-30 days') GROUP BY entity_type").all<any>()).results || []
  const scope = c.req.query('scope') === 'preview' ? 'preview' : 'production'
  await cleanupConversions(db)
  const conversions = (await db.prepare("SELECT event, page, location, SUM(count) n FROM conversion_daily WHERE scope=? AND day >= date('now','+9 hours','-29 days') GROUP BY event,page,location ORDER BY n DESC").bind(scope).all<any>()).results || []
  const totals = (await db.prepare("SELECT event, SUM(count) n FROM conversion_daily WHERE scope=? AND day >= date('now','+9 hours','-29 days') GROUP BY event").bind(scope).all<any>()).results || []
  const conversionDays = (await db.prepare("SELECT day, SUM(CASE WHEN event='form_completed' THEN count ELSE 0 END) completed, SUM(CASE WHEN event!='form_completed' THEN count ELSE 0 END) clicks FROM conversion_daily WHERE scope=? AND day >= date('now','+9 hours','-29 days') GROUP BY day ORDER BY day DESC").bind(scope).all<any>()).results || []
  return shell(c, '조회·예약 동선 통계 (최근 30일)', html`<section id="conversion-stats"><h2 class="h3">예약·문의 동선</h2><form method="get" class="admin-toolbar"><label for="conversion-scope">집계 환경</label><select id="conversion-scope" name="scope"><option value="production" ${scope === 'production' ? 'selected' : ''}>운영</option><option value="preview" ${scope === 'preview' ? 'selected' : ''}>미리보기·로컬</option></select><button class="btn btn-primary btn-sm" type="submit">보기</button></form>
  <p class="hint">한국시간 기준 최근 30일 · 현재 ${scope === 'production' ? '운영' : '미리보기·로컬'} 집계. 네이버·전화·카카오는 클릭이며 실제 예약 완료·통화·상담 완료가 아닙니다. 홈페이지 접수 완료도 병원의 예약 확정과 다릅니다. 집계 시작 이전 데이터는 소급하지 않습니다.</p>
  <div class="admin-cards">${Object.entries(eventLabels).map(([key, label]) => html`<div class="admin-card"><span class="n">${totals.find(x => x.event === key)?.n || 0}</span><span class="l">${label}</span></div>`)}</div>
  <p class="hint">동일 화면의 같은 종류·위치 클릭은 1회만 반영(서명 유효기간 30분). 재방문·새로고침은 별도이며 고유 환자 수나 전환율이 아닙니다. 봇 추정·관리자·DNT/GPC 요청은 제외합니다. 스크립트 차단·전송 실패·30분 경과 시 누락될 수 있으며, 자동화 조작을 완전히 차단하는 통계는 아닙니다.</p>
  ${conversions.length ? html`<div class="table-wrap"><table class="admin-table"><caption>페이지·버튼 위치별 행동 집계</caption><thead><tr><th>페이지</th><th>행동</th><th>위치</th><th>건수</th></tr></thead><tbody>${conversions.map(r => html`<tr><td>${r.page}</td><td>${eventLabels[r.event]}</td><td>${locationLabels[r.location]}</td><td>${r.n}</td></tr>`)}</tbody></table></div><details><summary>일별 클릭·접수 보기</summary><table class="admin-table"><thead><tr><th>날짜 (KST)</th><th>클릭</th><th>신청 접수</th></tr></thead><tbody>${conversionDays.map(r => html`<tr><td>${r.day}</td><td>${r.clicks}</td><td>${r.completed}</td></tr>`)}</tbody></table></details>` : html`<p class="alert-ok">이 환경에 집계된 이벤트가 아직 없습니다. 운영과 미리보기 수치는 섞이지 않습니다.</p>`}
  <p class="hint">개별 이벤트 원문 대신 날짜·페이지 분류·위치·종류별 합계만 저장합니다. 이름·전화·증상·폼 선택값·IP·UA·유입 주소·쿼리·사용자 ID는 이 집계에 저장하지 않습니다. 합계는 최근 90일, 중복 방지용 무작위 해시는 최대 30분 유효하며 다음 집계 요청 또는 통계 조회 시 만료분을 정리합니다.</p></section>
  <hr><h2 class="h3">기존 페이지 조회 통계</h2><p class="hint">아래는 기존 조회 통계이며 위의 환경별 전환 집계와 별개입니다. User-Agent로 추정한 봇을 제외한 조회수로, 실제 사람 수를 보장하지 않습니다.</p>
  <div class="admin-cards">${ents.map((e: any) => html`<div class="admin-card"><span class="n">${e.n}</span><span class="l">${e.entity_type || 'page'}</span></div>`)}</div>
  <div class="grid-2" style="margin-top:24px"><section><h2 class="h3">일별</h2><table class="admin-table"><thead><tr><th>날짜</th><th>방문</th><th>봇</th></tr></thead><tbody>${daily.map((d: any) => html`<tr><td>${d.d}</td><td>${d.human}</td><td class="hint">${d.bot}</td></tr>`)}</tbody></table></section>
  <section><h2 class="h3">인기 페이지</h2><table class="admin-table"><thead><tr><th>경로</th><th>조회</th></tr></thead><tbody>${top.map((r: any) => html`<tr><td><a href="${r.path}" target="_blank">${r.path}</a></td><td>${r.n}</td></tr>`)}</tbody></table></section></div>`, 'stats')
})

export default admin
