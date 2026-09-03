import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { setAdminSession, clearAdminSession } from '../lib/auth'
import { EDITABLE_KEYS, getPath, saveSettings, invalidateClinicCache } from '../lib/settings'
import { treatments, getTreatment } from '../data/treatments'
import { doctors } from '../data/doctors'
import { alertBox } from '../lib/ui'
import { formData, slugify, fmtDate, stripTags, esc } from '../lib/util'

const admin = new Hono<Env>()

// ── 인증 ─────────────────────────────────────────────────
function loginPage(c: any, error?: string) {
  const body = html`<section class="section" style="padding-top:calc(var(--header-h) + 60px)"><div class="container form-card">
    <h1 class="h2">관리자 로그인</h1>${alertBox(error)}
    <form method="post" action="/admin/login" class="form" data-once><div class="field"><label for="pw">비밀번호</label><input id="pw" name="password" type="password" required autofocus autocomplete="current-password"></div><button class="btn btn-primary btn-block">로그인</button></form>
  </div></section>`
  return c.html(Layout(c, { title: '관리자', description: '관리자 로그인', path: '/admin/login', noindex: true }, body))
}
admin.get('/login', (c) => (c.get('admin') ? c.redirect('/admin') : loginPage(c)))
admin.post('/login', async (c) => {
  const f = await formData(c)
  if (!c.env.ADMIN_PASSWORD || String(f.password) !== c.env.ADMIN_PASSWORD) return loginPage(c, '비밀번호가 올바르지 않습니다.')
  await setAdminSession(c)
  return c.redirect('/admin')
})
admin.get('/logout', (c) => { clearAdminSession(c); return c.redirect('/admin/login') })
admin.use('*', async (c, next) => {
  if (c.req.path === '/admin/login') return next()
  if (!c.get('admin')) return c.req.path.startsWith('/admin/api') ? c.json({ error: 'unauthorized' }, 401) : c.redirect('/admin/login')
  await next()
})

// ── 공통 레이아웃 ────────────────────────────────────────
const NAV = [['/admin', '대시보드'], ['/admin/settings', '기본정보'], ['/admin/cases', '치료 전후'], ['/admin/columns', '원장 칼럼'], ['/admin/notices', '공지사항'], ['/admin/reservations', '예약 관리'], ['/admin/members', '회원'], ['/admin/stats', '조회 통계']]
function shell(c: any, title: string, body: any, msg?: string) {
  const path = c.req.path
  const m = c.req.query('msg')
  const msgs: Record<string, string> = { saved: '저장되었습니다.', deleted: '삭제되었습니다.', created: '등록되었습니다.' }
  const inner = html`<div class="admin">
    <aside class="admin-side"><p class="side-title">관리자</p><nav><ul>${NAV.map(([h, n]) => html`<li><a href="${h}" class="${path === h || (h !== '/admin' && path.startsWith(h)) ? 'active' : ''}">${n}</a></li>`)}</ul></nav><a href="/" class="link-arrow" target="_blank">사이트 보기</a><a href="/admin/logout" class="btn btn-ghost btn-sm">로그아웃</a></aside>
    <main class="admin-main"><h1 class="h2">${title}</h1>${alertBox(msg || (m ? msgs[m] : undefined), 'ok')}${body}</main>
  </div>`
  return c.html(Layout(c, { title: `${title} — 관리자`, description: '관리자', path, noindex: true, bodyClass: 'admin-page' }, inner))
}
const yn = (v: any) => (v ? html`<span class="badge-on">공개</span>` : html`<span class="badge-off">비공개</span>`)

// ── 대시보드 ─────────────────────────────────────────────
admin.get('/', async (c) => {
  const db = c.env.DB
  const q = async (sql: string) => (await db.prepare(sql).first<any>())?.n ?? 0
  const [members, cases, columns, notices, pending, views7] = await Promise.all([
    q('SELECT COUNT(*) n FROM users'), q('SELECT COUNT(*) n FROM cases'), q('SELECT COUNT(*) n FROM columns'), q('SELECT COUNT(*) n FROM notices'),
    q("SELECT COUNT(*) n FROM reservations WHERE status='pending'"), q("SELECT COUNT(*) n FROM page_views WHERE is_bot=0 AND created_at > datetime('now','-7 days')"),
  ])
  const recent = (await db.prepare('SELECT id, name, phone, treatment, preferred_date, status, created_at FROM reservations ORDER BY created_at DESC LIMIT 5').all<any>()).results || []
  const body = html`<div class="admin-cards">
    ${[['회원', members, '/admin/members'], ['치료 전후', cases, '/admin/cases'], ['칼럼', columns, '/admin/columns'], ['공지', notices, '/admin/notices'], ['대기 예약', pending, '/admin/reservations'], ['7일 조회(봇 제외)', views7, '/admin/stats']].map(([l, n, h]) => html`<a href="${h}" class="admin-card"><span class="n">${n}</span><span class="l">${l}</span></a>`)}
  </div>
  <h2 class="h3">최근 예약 신청</h2>
  <table class="admin-table"><thead><tr><th>이름</th><th>연락처</th><th>진료</th><th>희망일</th><th>상태</th><th>접수</th></tr></thead><tbody>${recent.map((r: any) => html`<tr><td><a href="/admin/reservations#r${r.id}">${r.name}</a></td><td>${r.phone}</td><td>${r.treatment || '-'}</td><td>${r.preferred_date || '-'}</td><td>${r.status}</td><td>${fmtDate(r.created_at)}</td></tr>`)}</tbody></table>
  <div class="admin-toolbar" style="margin-top:28px"><a href="/admin/cases/new" class="btn btn-primary btn-sm">+ 치료 전후</a><a href="/admin/columns/new" class="btn btn-primary btn-sm">+ 칼럼</a><a href="/admin/notices/new" class="btn btn-primary btn-sm">+ 공지</a></div>`
  return shell(c, '대시보드', body)
})

// ── 기본정보 ─────────────────────────────────────────────
admin.get('/settings', async (c) => {
  const clinic = c.get('clinic') as any
  const body = html`<p class="hint">여기서 수정한 값은 헤더·푸터·오시는 길·JSON-LD 등 사이트 전체에 즉시 반영됩니다. 비워두면 기본값을 사용합니다.</p>
  <form method="post" action="/admin/settings" class="admin-form form" data-once>
    ${EDITABLE_KEYS.map((k) => html`<div class="field"><label for="s-${k.key}">${k.label} <small>(${k.key})</small></label>${k.type === 'textarea' ? html`<textarea id="s-${k.key}" name="${k.key}" rows="3">${getPath(clinic, k.key) ?? ''}</textarea>` : html`<input id="s-${k.key}" name="${k.key}" value="${getPath(clinic, k.key) ?? ''}">`}</div>`)}
    <button class="btn btn-primary">저장</button>
  </form>`
  return shell(c, '기본정보', body)
})
admin.post('/settings', async (c) => {
  const f = await formData(c)
  const entries: Record<string, string> = {}
  for (const k of EDITABLE_KEYS) if (k.key in f) entries[k.key] = String(f[k.key] ?? '')
  await saveSettings(c.env.DB, entries)
  invalidateClinicCache()
  return c.redirect('/admin/settings?msg=saved')
})

// ── 업로드 API (R2) ──────────────────────────────────────
admin.post('/api/upload', async (c) => {
  const fd = await c.req.formData()
  const file = fd.get('file') as File | null
  const folder = String(fd.get('folder') || 'uploads').replace(/[^a-z0-9/_-]/gi, '')
  const name = String(fd.get('name') || '').replace(/[^a-z0-9_.-]/gi, '')
  if (!file || !file.size) return c.json({ error: 'no file' }, 400)
  const EXT_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' }
  const fileExt = (file.name.split('.').pop() || '').toLowerCase()
  const type = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.type) ? file.type : (EXT_MIME[fileExt] || '')
  if (!type) return c.json({ error: '이미지 파일만 업로드할 수 있습니다 (jpg/png/webp/gif/avif)' }, 400)
  if (file.size > 8 * 1024 * 1024) return c.json({ error: '8MB 이하만 가능합니다' }, 400)
  const ext = type.split('/')[1].replace('jpeg', 'jpg')
  const key = `${folder}/${name || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}.${ext}`
  await c.env.R2.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: type } })
  try { await c.env.DB.prepare('INSERT OR REPLACE INTO uploads (key, filename, content_type, size) VALUES (?,?,?,?)').bind(key, file.name, type, file.size).run() } catch { /* */ }
  return c.json({ key, url: `/files/${key}` })
})

// ── 치료 전후 ────────────────────────────────────────────
const SLOTS = [['pano_before', '파노라마 · 치료 전'], ['pano_after', '파노라마 · 치료 후 (회원 공개)'], ['intra_before', '구내 사진 · 치료 전'], ['intra_after', '구내 사진 · 치료 후 (회원 공개)']] as const
admin.get('/cases', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id, slug, title, treatment_slug, published, views, created_at FROM cases ORDER BY created_at DESC').all<any>()).results || []
  const body = html`<div class="admin-toolbar"><a href="/admin/cases/new" class="btn btn-primary btn-sm">+ 새 사례</a></div>
  <table class="admin-table"><thead><tr><th>제목</th><th>진료</th><th>공개</th><th>조회</th><th>등록</th><th></th></tr></thead><tbody>${rows.map((r: any) => html`<tr><td><a href="/admin/cases/${r.id}">${r.title}</a></td><td>${getTreatment(r.treatment_slug)?.name || r.treatment_slug}</td><td>${yn(r.published)}</td><td>${r.views}</td><td>${fmtDate(r.created_at)}</td><td><a href="/cases/gallery/${r.slug}" target="_blank" class="link-arrow small">보기</a></td></tr>`)}</tbody></table>`
  return shell(c, '치료 전후', body)
})
function caseForm(c: any, k: any) {
  const isNew = !k.id
  return html`<form method="post" action="${isNew ? '/admin/cases' : `/admin/cases/${k.id}`}" class="admin-form form" data-once id="case-form">
    <div class="form-row"><div class="field"><label>제목 *</label><input name="title" required value="${k.title || ''}" placeholder="예: 깊은 충치, 신경치료 대신 MTA 생활치수치료"></div><div class="field"><label>URL 슬러그</label><input name="slug" value="${k.slug || ''}" placeholder="비우면 자동 생성"></div></div>
    <div class="form-row"><div class="field"><label>진료 *</label><select name="treatment_slug">${treatments.map((t) => html`<option value="${t.slug}" ${k.treatment_slug === t.slug ? 'selected' : ''}>${t.name}</option>`)}</select></div><div class="field"><label>담당 의료진</label><select name="doctor_slug">${doctors.map((d) => html`<option value="${d.slug}" ${(k.doctor_slug || 'han-hwirim') === d.slug ? 'selected' : ''}>${d.name} ${d.title}</option>`)}</select></div></div>
    <div class="form-row form-row-4">
      <div class="field"><label>연령대</label><select name="age_group">${['', '10대', '20대', '30대', '40대', '50대', '60대', '70대 이상'].map((a) => html`<option value="${a}" ${k.age_group === a ? 'selected' : ''}>${a || '선택'}</option>`)}</select></div>
      <div class="field"><label>성별</label><select name="gender">${['', '여성', '남성'].map((a) => html`<option value="${a}" ${k.gender === a ? 'selected' : ''}>${a || '선택'}</option>`)}</select></div>
      <div class="field autocomplete"><label>지역</label><input name="region" value="${k.region || ''}" placeholder="초지 → 안산시 상록구 초지동"><div class="autocomplete-list"></div></div>
      <div class="field"><label>치료 기간</label><input name="duration" value="${k.duration || ''}" placeholder="예: 3주 (2회 내원)"></div>
    </div>
    <div class="field"><label>설명 (환자 식별 정보 제외, 치료 과정과 결과를 사실대로)</label><textarea name="description" rows="6">${k.description || ''}</textarea></div>
    <h3 class="h3">사진 (없는 항목은 자동으로 숨겨집니다)</h3>
    <div class="grid-2">${SLOTS.map(([f, label]) => html`<div class="upload-slot ${k[f] ? 'has' : ''}" data-field="${f}"><label>${label}</label><input type="hidden" name="${f}" value="${k[f] || ''}"><div class="upload-preview">${k[f] ? html`<img src="/files/${k[f]}" alt="">` : html`<span>이미지를 드래그하거나 클릭</span>`}</div><input type="file" accept="image/*" class="upload-input"><button type="button" class="btn btn-ghost btn-sm upload-clear">제거</button></div>`)}</div>
    <label class="check"><input type="checkbox" name="published" value="1" ${k.published !== 0 ? 'checked' : ''}> <span>공개</span></label>
    <div class="admin-toolbar"><button class="btn btn-primary">${isNew ? '등록' : '저장'}</button>${!isNew ? html`<button type="submit" form="del-form" class="btn btn-danger" onclick="return confirm('삭제할까요?')">삭제</button>` : ''}</div>
  </form>${!isNew ? html`<form id="del-form" method="post" action="/admin/cases/${k.id}/delete"></form>` : ''}
  ${uploadScript('cases')}`
}
const uploadScript = (folder: string) => raw(`<script>
(function(){
  var folder=${JSON.stringify(folder)};
  function up(file,cb){var fd=new FormData();fd.append('file',file);fd.append('folder',folder+'/'+(document.querySelector('input[name=slug]')?.value||Date.now()));var nm=arguments[2];if(nm)fd.append('name',nm);
    fetch('/admin/api/upload',{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(j){if(j.error)alert(j.error);else cb(j)}).catch(function(){alert('업로드 실패')})}
  document.querySelectorAll('.upload-slot').forEach(function(slot){
    var input=slot.querySelector('.upload-input'),hidden=slot.querySelector('input[type=hidden]'),prev=slot.querySelector('.upload-preview'),field=slot.dataset.field;
    function set(j){hidden.value=j.key;prev.innerHTML='<img src="'+j.url+'" alt="">';slot.classList.add('has')}
    prev.addEventListener('click',function(){input.click()});
    input.addEventListener('change',function(){if(input.files[0])up(input.files[0],set,field+'-'+Date.now())});
    slot.addEventListener('dragover',function(e){e.preventDefault();slot.classList.add('dragover')});
    slot.addEventListener('dragleave',function(){slot.classList.remove('dragover')});
    slot.addEventListener('drop',function(e){e.preventDefault();slot.classList.remove('dragover');var f=e.dataTransfer.files[0];if(f)up(f,set,field+'-'+Date.now())});
    slot.querySelector('.upload-clear').addEventListener('click',function(){hidden.value='';prev.innerHTML='<span>이미지를 드래그하거나 클릭</span>';slot.classList.remove('has')});
  });
  window.__upload=up;
})();
</script>`)
admin.get('/cases/new', (c) => shell(c, '새 치료 전후 사례', caseForm(c, {})))
admin.get('/cases/:id', async (c) => {
  const k = await c.env.DB.prepare('SELECT * FROM cases WHERE id=?').bind(Number(c.req.param('id'))).first<any>()
  if (!k) return c.notFound()
  return shell(c, `사례 수정: ${k.title}`, caseForm(c, k))
})
async function caseSave(c: any, id?: number) {
  const f = await formData(c)
  const slug = slugify(String(f.slug || f.title || '')) + (id ? '' : `-${Date.now().toString(36).slice(-4)}`)
  const vals = [String(f.title || '').trim(), String(f.description || ''), String(f.treatment_slug || treatments[0].slug), String(f.doctor_slug || 'han-hwirim'), f.age_group || null, f.gender || null, f.region || null, f.duration || null, f.pano_before || null, f.pano_after || null, f.intra_before || null, f.intra_after || null, f.published ? 1 : 0]
  if (!vals[0]) return c.redirect(id ? `/admin/cases/${id}` : '/admin/cases/new')
  if (id) {
    await c.env.DB.prepare('UPDATE cases SET title=?, description=?, treatment_slug=?, doctor_slug=?, age_group=?, gender=?, region=?, duration=?, pano_before=?, pano_after=?, intra_before=?, intra_after=?, published=?, slug=COALESCE(NULLIF(?,""), slug), updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals, f.slug ? slugify(String(f.slug)) : '', id).run()
    return c.redirect(`/admin/cases/${id}?msg=saved`)
  }
  const r = await c.env.DB.prepare('INSERT INTO cases (slug, title, description, treatment_slug, doctor_slug, age_group, gender, region, duration, pano_before, pano_after, intra_before, intra_after, published) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(slug, ...vals).run()
  return c.redirect(`/admin/cases/${r.meta.last_row_id}?msg=created`)
}
admin.post('/cases', (c) => caseSave(c))
admin.post('/cases/:id', (c) => caseSave(c, Number(c.req.param('id'))))
admin.post('/cases/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM cases WHERE id=?').bind(Number(c.req.param('id'))).run(); return c.redirect('/admin/cases?msg=deleted') })

// ── 칼럼 (SEO 에디터) ────────────────────────────────────
admin.get('/columns', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id, slug, title, treatment_slug, published, views, published_at FROM columns ORDER BY published_at DESC').all<any>()).results || []
  const body = html`<div class="admin-toolbar"><a href="/admin/columns/new" class="btn btn-primary btn-sm">+ 새 칼럼</a></div>
  <table class="admin-table"><thead><tr><th>제목</th><th>진료</th><th>공개</th><th>조회</th><th>발행</th><th></th></tr></thead><tbody>${rows.map((r: any) => html`<tr><td><a href="/admin/columns/${r.id}">${r.title}</a></td><td>${r.treatment_slug ? getTreatment(r.treatment_slug)?.name : '-'}</td><td>${yn(r.published)}</td><td>${r.views}</td><td>${fmtDate(r.published_at)}</td><td><a href="/column/${r.slug}" target="_blank" class="link-arrow small">보기</a></td></tr>`)}</tbody></table>`
  return shell(c, '원장 칼럼', body)
})
function editor(name: string, value: string, folder: string) {
  return html`<div class="editor-wrap">
    <div class="editor-toolbar" role="toolbar" aria-label="서식">
      ${[['formatBlock:H2', 'H2'], ['formatBlock:H3', 'H3'], ['formatBlock:P', '본문'], ['bold', 'B'], ['italic', 'I'], ['insertUnorderedList', '• 목록'], ['insertOrderedList', '1. 목록'], ['formatBlock:BLOCKQUOTE', '인용'], ['link', '링크'], ['image', '이미지'], ['removeFormat', '서식 지우기'], ['html', 'HTML']].map(([cmd, label]) => html`<button type="button" data-cmd="${cmd}">${label}</button>`)}
    </div>
    <div class="editor" contenteditable="true" id="editor" data-folder="${folder}">${raw(value || '<p></p>')}</div>
    <textarea name="${name}" id="editor-src" class="editor-src" hidden>${value || ''}</textarea>
    <p class="hint">이미지는 에디터에 드래그&드롭하거나 붙여넣기(Ctrl+V)하면 R2에 업로드됩니다. H2/H3로 소제목을 구분하면 SEO에 유리합니다. 백과사전 용어는 발행 시 자동으로 링크됩니다.</p>
  </div>
  ${raw(`<script>
(function(){
  var ed=document.getElementById('editor'),src=document.getElementById('editor-src'),form=ed.closest('form'),htmlMode=false;
  function sync(){if(!htmlMode)src.value=ed.innerHTML}
  form.addEventListener('submit',function(){if(htmlMode){ed.innerHTML=src.value}sync()});
  document.querySelectorAll('.editor-toolbar [data-cmd]').forEach(function(b){b.addEventListener('click',function(){
    var c=b.dataset.cmd;ed.focus();
    if(c==='html'){htmlMode=!htmlMode;if(htmlMode){src.value=ed.innerHTML;src.hidden=false;ed.hidden=true}else{ed.innerHTML=src.value;src.hidden=true;ed.hidden=false}b.classList.toggle('active',htmlMode);return}
    if(c==='link'){var u=prompt('링크 주소 (예: /treatments/implant)');if(u)document.execCommand('createLink',false,u);return}
    if(c==='image'){var i=document.createElement('input');i.type='file';i.accept='image/*';i.multiple=true;i.onchange=function(){Array.from(i.files).forEach(upload)};i.click();return}
    if(c.indexOf('formatBlock:')===0){document.execCommand('formatBlock',false,c.split(':')[1]);return}
    document.execCommand(c,false,null);
  })});
  function upload(file){var fd=new FormData();fd.append('file',file);fd.append('folder',ed.dataset.folder);
    fetch('/admin/api/upload',{method:'POST',body:fd}).then(function(r){return r.json()}).then(function(j){if(j.error)return alert(j.error);
      var fig='<figure><img src="'+j.url+'" alt="" loading="lazy"><figcaption></figcaption></figure><p></p>';document.execCommand('insertHTML',false,fig);sync();
      var th=document.querySelector('input[name=thumbnail]');if(th&&!th.value){th.value=j.key;var tp=document.getElementById('thumb-preview');if(tp)tp.innerHTML='<img src="'+j.url+'" alt="">'}
    })}
  ed.addEventListener('dragover',function(e){e.preventDefault();ed.classList.add('dragover')});
  ed.addEventListener('dragleave',function(){ed.classList.remove('dragover')});
  ed.addEventListener('drop',function(e){e.preventDefault();ed.classList.remove('dragover');Array.from(e.dataTransfer.files).filter(function(f){return /^image\\//.test(f.type)}).forEach(upload)});
  ed.addEventListener('paste',function(e){var items=e.clipboardData&&e.clipboardData.items;if(!items)return;for(var k=0;k<items.length;k++){if(items[k].type.indexOf('image')===0){e.preventDefault();upload(items[k].getAsFile())}}});
  ed.addEventListener('input',sync);
  // 글자수/H태그 안내
  var meta=document.getElementById('editor-meta');if(meta){function m(){var t=ed.innerText||'';meta.textContent='본문 '+t.replace(/\\s/g,'').length+'자 · H2 '+ed.querySelectorAll('h2').length+'개 · H3 '+ed.querySelectorAll('h3').length+'개 · 이미지 '+ed.querySelectorAll('img').length+'개'}ed.addEventListener('input',m);m()}
})();
</script>`)}`
}
function columnForm(c: any, p: any) {
  const isNew = !p.id
  return html`<form method="post" action="${isNew ? '/admin/columns' : `/admin/columns/${p.id}`}" class="admin-form form" data-once>
    <div class="field"><label>제목 * <small>(검색 결과 제목, 30자 내외 권장)</small></label><input name="title" required value="${p.title || ''}" maxlength="120"></div>
    <div class="form-row"><div class="field"><label>URL 슬러그</label><input name="slug" value="${p.slug || ''}" placeholder="비우면 제목으로 생성 (영문 권장)"></div><div class="field"><label>작성자</label><select name="author_slug">${doctors.map((d) => html`<option value="${d.slug}" ${(p.author_slug || 'han-hwirim') === d.slug ? 'selected' : ''}>${d.name} ${d.title}</option>`)}</select></div></div>
    <div class="form-row"><div class="field"><label>관련 진료 (인링크·CTA)</label><select name="treatment_slug"><option value="">없음</option>${treatments.map((t) => html`<option value="${t.slug}" ${p.treatment_slug === t.slug ? 'selected' : ''}>${t.name}</option>`)}</select></div><div class="field"><label>태그 <small>(쉼표 구분)</small></label><input name="tags" value="${p.tags || ''}"></div></div>
    <div class="field"><label>요약 (excerpt) <small>— 목록·OG 설명</small></label><textarea name="excerpt" rows="2" maxlength="300">${p.excerpt || ''}</textarea></div>
    <div class="field"><label>본문 *</label>${editor('content_html', p.content_html || '', 'columns')}<p class="hint" id="editor-meta"></p></div>
    <div class="form-row"><div class="field"><label>대표 이미지 (R2 key)</label><input name="thumbnail" value="${p.thumbnail || ''}" placeholder="본문 첫 이미지가 자동 지정됩니다"><div id="thumb-preview" class="upload-preview small">${p.thumbnail ? html`<img src="/files/${p.thumbnail}" alt="">` : ''}</div></div><div class="field"><label>발행일</label><input name="published_at" type="datetime-local" value="${p.published_at ? String(p.published_at).replace(' ', 'T').slice(0, 16) : ''}"></div></div>
    <details class="admin-details"><summary>SEO 고급 설정</summary><div class="form-row"><div class="field"><label>메타 제목 <small>(비우면 제목 사용)</small></label><input name="meta_title" value="${p.meta_title || ''}" maxlength="70"></div><div class="field"><label>메타 설명 <small>(비우면 요약 사용, 155자)</small></label><input name="meta_description" value="${p.meta_description || ''}" maxlength="160"></div></div></details>
    <label class="check"><input type="checkbox" name="published" value="1" ${p.published !== 0 ? 'checked' : ''}> <span>공개</span></label>
    <div class="admin-toolbar"><button class="btn btn-primary">${isNew ? '발행' : '저장'}</button>${!isNew ? html`<a href="/column/${p.slug}" target="_blank" class="btn btn-outline">미리보기</a><button type="submit" form="del-col" class="btn btn-danger" onclick="return confirm('삭제할까요?')">삭제</button>` : ''}</div>
  </form>${!isNew ? html`<form id="del-col" method="post" action="/admin/columns/${p.id}/delete"></form>` : ''}`
}
admin.get('/columns/new', (c) => shell(c, '새 칼럼', columnForm(c, {})))
admin.get('/columns/:id', async (c) => {
  const p = await c.env.DB.prepare('SELECT * FROM columns WHERE id=?').bind(Number(c.req.param('id'))).first<any>()
  if (!p) return c.notFound()
  return shell(c, `칼럼 수정`, columnForm(c, p))
})
async function columnSave(c: any, id?: number) {
  const f = await formData(c)
  const title = String(f.title || '').trim()
  if (!title) return c.redirect(id ? `/admin/columns/${id}` : '/admin/columns/new')
  const content = String(f.content_html || '')
  const excerpt = String(f.excerpt || '').trim() || stripTags(content).slice(0, 150)
  const thumb = String(f.thumbnail || '') || (content.match(/src="\/files\/([^"]+)"/)?.[1] ?? null)
  const pub = f.published_at ? String(f.published_at).replace('T', ' ').slice(0, 16) + ':00' : null
  const vals = [title, excerpt, content, thumb, String(f.author_slug || 'han-hwirim'), f.treatment_slug || null, f.meta_title || null, f.meta_description || null, f.tags || null, f.published ? 1 : 0]
  if (id) {
    await c.env.DB.prepare('UPDATE columns SET title=?, excerpt=?, content_html=?, thumbnail=?, author_slug=?, treatment_slug=?, meta_title=?, meta_description=?, tags=?, published=?, slug=COALESCE(NULLIF(?,""), slug), published_at=COALESCE(?, published_at), updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals, f.slug ? slugify(String(f.slug)) : '', pub, id).run()
    return c.redirect(`/admin/columns/${id}?msg=saved`)
  }
  let slug = slugify(String(f.slug || title))
  if (await c.env.DB.prepare('SELECT 1 FROM columns WHERE slug=?').bind(slug).first()) slug += `-${Date.now().toString(36).slice(-4)}`
  const r = await c.env.DB.prepare('INSERT INTO columns (slug, title, excerpt, content_html, thumbnail, author_slug, treatment_slug, meta_title, meta_description, tags, published, published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,COALESCE(?, CURRENT_TIMESTAMP))').bind(slug, ...vals, pub).run()
  return c.redirect(`/admin/columns/${r.meta.last_row_id}?msg=created`)
}
admin.post('/columns', (c) => columnSave(c))
admin.post('/columns/:id', (c) => columnSave(c, Number(c.req.param('id'))))
admin.post('/columns/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM columns WHERE id=?').bind(Number(c.req.param('id'))).run(); return c.redirect('/admin/columns?msg=deleted') })

// ── 공지 ─────────────────────────────────────────────────
admin.get('/notices', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT id, title, pinned, published, views, created_at FROM notices ORDER BY pinned DESC, created_at DESC').all<any>()).results || []
  const body = html`<div class="admin-toolbar"><a href="/admin/notices/new" class="btn btn-primary btn-sm">+ 새 공지</a></div>
  <table class="admin-table"><thead><tr><th>제목</th><th>대표</th><th>공개</th><th>조회</th><th>등록</th></tr></thead><tbody>${rows.map((r: any) => html`<tr><td><a href="/admin/notices/${r.id}">${r.title}</a></td><td>${r.pinned ? '📌' : ''}</td><td>${yn(r.published)}</td><td>${r.views}</td><td>${fmtDate(r.created_at)}</td></tr>`)}</tbody></table>`
  return shell(c, '공지사항', body)
})
function noticeForm(c: any, n: any) {
  const isNew = !n.id
  return html`<form method="post" action="${isNew ? '/admin/notices' : `/admin/notices/${n.id}`}" class="admin-form form" data-once>
    <div class="field"><label>제목 *</label><input name="title" required value="${n.title || ''}"></div>
    <div class="field"><label>내용 *</label>${editor('content_html', n.content_html || '', 'notices')}</div>
    <div class="upload-slot ${n.image ? 'has' : ''}" data-field="image"><label>대표 이미지 (선택)</label><input type="hidden" name="image" value="${n.image || ''}"><div class="upload-preview">${n.image ? html`<img src="/files/${n.image}" alt="">` : html`<span>이미지를 드래그하거나 클릭</span>`}</div><input type="file" accept="image/*" class="upload-input"><button type="button" class="btn btn-ghost btn-sm upload-clear">제거</button></div>
    <label class="check"><input type="checkbox" name="pinned" value="1" ${n.pinned ? 'checked' : ''}> <span>대표 공지 (홈 상단 노출)</span></label>
    <label class="check"><input type="checkbox" name="published" value="1" ${n.published !== 0 ? 'checked' : ''}> <span>공개</span></label>
    <div class="admin-toolbar"><button class="btn btn-primary">${isNew ? '등록' : '저장'}</button>${!isNew ? html`<button type="submit" form="del-n" class="btn btn-danger" onclick="return confirm('삭제할까요?')">삭제</button>` : ''}</div>
  </form>${!isNew ? html`<form id="del-n" method="post" action="/admin/notices/${n.id}/delete"></form>` : ''}${uploadScript('notices')}`
}
admin.get('/notices/new', (c) => shell(c, '새 공지', noticeForm(c, {})))
admin.get('/notices/:id', async (c) => {
  const n = await c.env.DB.prepare('SELECT * FROM notices WHERE id=?').bind(Number(c.req.param('id'))).first<any>()
  if (!n) return c.notFound()
  return shell(c, '공지 수정', noticeForm(c, n))
})
async function noticeSave(c: any, id?: number) {
  const f = await formData(c)
  const title = String(f.title || '').trim()
  if (!title) return c.redirect('/admin/notices')
  const vals = [title, String(f.content_html || ''), f.image || null, f.pinned ? 1 : 0, f.published ? 1 : 0]
  if (f.pinned) await c.env.DB.prepare('UPDATE notices SET pinned=0').run()
  if (id) { await c.env.DB.prepare('UPDATE notices SET title=?, content_html=?, image=?, pinned=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...vals, id).run(); return c.redirect(`/admin/notices/${id}?msg=saved`) }
  const r = await c.env.DB.prepare('INSERT INTO notices (title, content_html, image, pinned, published) VALUES (?,?,?,?,?)').bind(...vals).run()
  return c.redirect(`/admin/notices/${r.meta.last_row_id}?msg=created`)
}
admin.post('/notices', (c) => noticeSave(c))
admin.post('/notices/:id', (c) => noticeSave(c, Number(c.req.param('id'))))
admin.post('/notices/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM notices WHERE id=?').bind(Number(c.req.param('id'))).run(); return c.redirect('/admin/notices?msg=deleted') })

// ── 예약 ─────────────────────────────────────────────────
admin.get('/reservations', async (c) => {
  const st = c.req.query('status') || ''
  const rows = (await c.env.DB.prepare(`SELECT * FROM reservations ${st ? 'WHERE status=?' : ''} ORDER BY created_at DESC LIMIT 200`).bind(...(st ? [st] : [])).all<any>()).results || []
  const S = [['', '전체'], ['pending', '대기'], ['confirmed', '확정'], ['done', '완료'], ['cancelled', '취소']]
  const body = html`<nav class="faq-filter">${S.map(([v, l]) => html`<a href="/admin/reservations${v ? `?status=${v}` : ''}" class="${st === v ? 'active' : ''}">${l}</a>`)}</nav>
  <table class="admin-table"><thead><tr><th>접수</th><th>이름</th><th>연락처</th><th>진료</th><th>희망</th><th>내용</th><th>상태</th></tr></thead><tbody>${rows.map((r: any) => html`<tr id="r${r.id}"><td>${fmtDate(r.created_at)}</td><td>${r.name}${r.user_id ? ' 👤' : ''}</td><td><a href="tel:${r.phone}">${r.phone}</a>${r.email ? html`<br><small>${r.email}</small>` : ''}</td><td>${r.treatment || '-'}</td><td>${r.preferred_date || ''}<br><small>${r.preferred_time || ''}</small></td><td class="msg">${r.message || ''}</td><td><form method="post" action="/admin/reservations/${r.id}"><select name="status" onchange="this.form.submit()">${S.slice(1).map(([v, l]) => html`<option value="${v}" ${r.status === v ? 'selected' : ''}>${l}</option>`)}</select></form></td></tr>`)}</tbody></table>`
  return shell(c, '예약 관리', body)
})
admin.post('/reservations/:id', async (c) => {
  const f = await formData(c)
  if (['pending', 'confirmed', 'done', 'cancelled'].includes(String(f.status))) await c.env.DB.prepare('UPDATE reservations SET status=? WHERE id=?').bind(String(f.status), Number(c.req.param('id'))).run()
  return c.redirect('/admin/reservations?msg=saved')
})

// ── 회원 ─────────────────────────────────────────────────
admin.get('/members', async (c) => {
  const q = c.req.query('q') || ''
  const rows = (await c.env.DB.prepare(`SELECT id, email, name, phone, provider, agree_marketing, role, last_login_at, created_at FROM users ${q ? 'WHERE email LIKE ? OR name LIKE ? OR phone LIKE ?' : ''} ORDER BY created_at DESC LIMIT 300`).bind(...(q ? [`%${q}%`, `%${q}%`, `%${q}%`] : [])).all<any>()).results || []
  const body = html`<form class="admin-toolbar" method="get"><input name="q" value="${q}" placeholder="이름·이메일·전화 검색"><button class="btn btn-outline btn-sm">검색</button><span class="hint">${rows.length}명</span></form>
  <table class="admin-table"><thead><tr><th>이름</th><th>이메일</th><th>전화</th><th>가입</th><th>마케팅</th><th>최근 로그인</th><th>가입일</th><th></th></tr></thead><tbody>${rows.map((u: any) => html`<tr><td>${u.name}${u.role === 'admin' ? ' ★' : ''}</td><td>${u.email}</td><td>${u.phone || '-'}</td><td>${u.provider}</td><td>${u.agree_marketing ? '동의' : '-'}</td><td>${fmtDate(u.last_login_at)}</td><td>${fmtDate(u.created_at)}</td><td><form method="post" action="/admin/members/${u.id}/delete" onsubmit="return confirm('회원을 삭제할까요?')"><button class="btn btn-ghost btn-sm btn-danger-text">삭제</button></form></td></tr>`)}</tbody></table>`
  return shell(c, '회원', body)
})
admin.post('/members/:id/delete', async (c) => { await c.env.DB.prepare('DELETE FROM users WHERE id=?').bind(Number(c.req.param('id'))).run(); return c.redirect('/admin/members?msg=deleted') })

// ── 통계 ─────────────────────────────────────────────────
admin.get('/stats', async (c) => {
  const db = c.env.DB
  const top = (await db.prepare("SELECT path, COUNT(*) n FROM page_views WHERE is_bot=0 AND created_at > datetime('now','-30 days') GROUP BY path ORDER BY n DESC LIMIT 30").all<any>()).results || []
  const daily = (await db.prepare("SELECT date(created_at) d, SUM(CASE WHEN is_bot=0 THEN 1 ELSE 0 END) h, SUM(is_bot) b FROM page_views WHERE created_at > datetime('now','-14 days') GROUP BY d ORDER BY d DESC").all<any>()).results || []
  const body = html`<p class="hint">조회수는 User-Agent 기준으로 검색엔진·AI 크롤러·모니터링 봇을 제외한 실제 방문만 집계합니다. 사례·칼럼·공지 상세 페이지 기준.</p>
  <div class="grid-2"><div><h2 class="h3">최근 30일 인기 페이지</h2><table class="admin-table"><thead><tr><th>경로</th><th>조회</th></tr></thead><tbody>${top.map((r: any) => html`<tr><td><a href="${r.path}" target="_blank">${r.path}</a></td><td>${r.n}</td></tr>`)}</tbody></table></div>
  <div><h2 class="h3">최근 14일 일별</h2><table class="admin-table"><thead><tr><th>날짜</th><th>사람</th><th>봇</th></tr></thead><tbody>${daily.map((r: any) => html`<tr><td>${r.d}</td><td>${r.h}</td><td class="hint">${r.b}</td></tr>`)}</tbody></table></div></div>`
  return shell(c, '조회 통계', body)
})

export default admin
