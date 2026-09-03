import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env, SessionUser } from '../lib/types'
import { Layout } from '../lib/layout'
import { hashPassword, verifyPassword, setMemberSession, clearMemberSession, makeState, readState } from '../lib/auth'
import { pageHero, alertBox } from '../lib/ui'
import { formData, isEmail, normPhone, fmtDate } from '../lib/util'

const auth = new Hono<Env>()

const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/')

function googleBtn(c: any, next: string) {
  if (!c.env.GOOGLE_CLIENT_ID) return ''
  return html`<div class="divider"><span>또는</span></div>
  <a href="/auth/google?next=${encodeURIComponent(next)}" class="btn btn-google"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4H24v8.1h12.7c-.3 2.2-1.7 5.4-4.8 7.6l7.4 5.7c4.4-4.1 7.2-10.1 7.2-17.4z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2 1.4-4.7 2.4-8.5 2.4-6.3 0-11.7-4.2-13.6-10.2l-7.8 6C6.5 42.6 14.6 48 24 48z"/></svg>Google로 계속하기</a>`
}

// ── 회원가입 ─────────────────────────────────────────────
function registerForm(c: any, o: { error?: string; v?: Record<string, string>; next: string }) {
  const v = o.v || {}
  const body = html`${pageHero({ eyebrow: '회원가입', title: '치료 전후 사진을 보려면 가입이 필요합니다', lead: '의료법에 따라 치료 후 사진은 회원에게만 공개됩니다. 가입은 1분이면 됩니다.' })}
<section class="section-sm"><div class="container form-card">
  ${alertBox(o.error)}
  <form method="post" action="/auth/register" class="form" data-once>
    <input type="hidden" name="next" value="${o.next}">
    <div class="field"><label for="name">이름 <span class="req">*</span></label><input id="name" name="name" required maxlength="40" value="${v.name || ''}" autocomplete="name"></div>
    <div class="field"><label for="email">이메일 <span class="req">*</span></label><input id="email" name="email" type="email" required value="${v.email || ''}" autocomplete="email"></div>
    <div class="field"><label for="phone">휴대전화 <span class="req">*</span></label><input id="phone" name="phone" type="tel" required inputmode="numeric" placeholder="010-0000-0000" value="${v.phone || ''}" autocomplete="tel"></div>
    <div class="field"><label for="password">비밀번호 <span class="req">*</span></label><input id="password" name="password" type="password" required minlength="8" autocomplete="new-password"><p class="hint">8자 이상</p></div>
    <label class="check"><input type="checkbox" name="agree_privacy" value="1" required> <span>[필수] <a href="/privacy" target="_blank">개인정보 수집·이용</a>에 동의합니다</span></label>
    <label class="check"><input type="checkbox" name="agree_marketing" value="1" ${v.agree_marketing ? 'checked' : ''}> <span>[선택] 병원 소식·안내 수신에 동의합니다</span></label>
    <button type="submit" class="btn btn-primary btn-block btn-lg" data-loading="가입 중…">가입하기</button>
  </form>
  ${googleBtn(c, o.next)}
  <p class="form-foot">이미 회원이신가요? <a href="/auth/login?next=${encodeURIComponent(o.next)}">로그인</a></p>
</div></section>`
  return c.html(Layout(c, { title: '회원가입', description: '서울도담치과 회원가입. 치료 전후 사진 열람과 예약 확인.', path: '/auth/register', noindex: true }, body))
}

auth.get('/register', (c) => (c.get('user') ? c.redirect('/auth/mypage') : registerForm(c, { next: safeNext(c.req.query('next')) })))

auth.post('/register', async (c) => {
  const f = await formData(c)
  const next = safeNext(f.next)
  const name = String(f.name || '').trim(), email = String(f.email || '').trim().toLowerCase(), phone = normPhone(String(f.phone || '')), pw = String(f.password || '')
  const v = { name, email, phone, agree_marketing: f.agree_marketing }
  if (!name || !isEmail(email) || phone.replace(/\D/g, '').length < 10 || pw.length < 8) return registerForm(c, { error: '입력 내용을 확인해 주세요. (이름·이메일·휴대전화·8자 이상 비밀번호)', v, next })
  if (!f.agree_privacy) return registerForm(c, { error: '개인정보 수집·이용 동의는 필수입니다.', v, next })
  const dup = await c.env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first()
  if (dup) return registerForm(c, { error: '이미 가입된 이메일입니다. 로그인해 주세요.', v, next })
  const hash = await hashPassword(pw)
  const r = await c.env.DB.prepare('INSERT INTO users (email, phone, name, password_hash, provider, agree_privacy, agree_marketing, last_login_at) VALUES (?,?,?,?,?,1,?,CURRENT_TIMESTAMP)').bind(email, phone, name, hash, 'local', f.agree_marketing ? 1 : 0).run()
  await setMemberSession(c, { id: Number(r.meta.last_row_id), email, name, role: 'member' })
  return c.redirect(next)
})

// ── 로그인 ───────────────────────────────────────────────
function loginForm(c: any, o: { error?: string; email?: string; next: string; msg?: string }) {
  const body = html`${pageHero({ eyebrow: '로그인', title: '다시 오셨네요', lead: '회원은 치료 전후 사진 전체와 예약 내역을 확인할 수 있습니다.' })}
<section class="section-sm"><div class="container form-card">
  ${alertBox(o.msg, 'ok')}${alertBox(o.error)}
  <form method="post" action="/auth/login" class="form" data-once>
    <input type="hidden" name="next" value="${o.next}">
    <div class="field"><label for="email">이메일</label><input id="email" name="email" type="email" required value="${o.email || ''}" autocomplete="email"></div>
    <div class="field"><label for="password">비밀번호</label><input id="password" name="password" type="password" required autocomplete="current-password"></div>
    <button type="submit" class="btn btn-primary btn-block btn-lg" data-loading="확인 중…">로그인</button>
  </form>
  ${googleBtn(c, o.next)}
  <p class="form-foot">아직 회원이 아니신가요? <a href="/auth/register?next=${encodeURIComponent(o.next)}">회원가입</a></p>
</div></section>`
  return c.html(Layout(c, { title: '로그인', description: '서울도담치과 회원 로그인.', path: '/auth/login', noindex: true }, body))
}

auth.get('/login', (c) => (c.get('user') ? c.redirect('/auth/mypage') : loginForm(c, { next: safeNext(c.req.query('next')), msg: c.req.query('msg') === 'out' ? '로그아웃되었습니다.' : undefined })))

auth.post('/login', async (c) => {
  const f = await formData(c)
  const next = safeNext(f.next)
  const email = String(f.email || '').trim().toLowerCase()
  const u = await c.env.DB.prepare('SELECT id, email, name, password_hash, role FROM users WHERE email=?').bind(email).first<any>()
  if (!u || !(await verifyPassword(String(f.password || ''), u.password_hash))) return loginForm(c, { error: '이메일 또는 비밀번호가 올바르지 않습니다.', email, next })
  await c.env.DB.prepare('UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?').bind(u.id).run()
  await setMemberSession(c, { id: u.id, email: u.email, name: u.name, role: u.role === 'admin' ? 'admin' : 'member' })
  return c.redirect(next)
})

auth.post('/logout', (c) => { clearMemberSession(c); return c.redirect('/auth/login?msg=out') })
auth.get('/logout', (c) => { clearMemberSession(c); return c.redirect('/auth/login?msg=out') })

// ── Google OAuth ─────────────────────────────────────────
auth.get('/google', async (c) => {
  if (!c.env.GOOGLE_CLIENT_ID) return c.redirect('/auth/login')
  const state = await makeState(c.env.SESSION_SECRET, safeNext(c.req.query('next')))
  const redirect = `${c.get('siteUrl')}/auth/google/callback`
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  u.search = new URLSearchParams({ client_id: c.env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account' }).toString()
  return c.redirect(u.toString())
})

auth.get('/google/callback', async (c) => {
  const code = c.req.query('code'), st = await readState(c.env.SESSION_SECRET, c.req.query('state'))
  if (!code || !st || !c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) return c.redirect('/auth/login')
  const redirect = `${c.get('siteUrl')}/auth/google/callback`
  const tokRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: c.env.GOOGLE_CLIENT_ID, client_secret: c.env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code' }) })
  if (!tokRes.ok) return loginForm(c, { error: 'Google 인증에 실패했습니다. 다시 시도해 주세요.', next: st.n })
  const tok = await tokRes.json<any>()
  const info = await (await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${tok.access_token}` } })).json<any>()
  if (!info?.email) return loginForm(c, { error: 'Google 계정 정보를 가져올 수 없습니다.', next: st.n })
  const email = String(info.email).toLowerCase()
  let u = await c.env.DB.prepare('SELECT id, email, name, role FROM users WHERE email=?').bind(email).first<any>()
  if (!u) {
    const r = await c.env.DB.prepare('INSERT INTO users (email, name, provider, provider_id, agree_privacy, agree_marketing, last_login_at) VALUES (?,?,?,?,1,0,CURRENT_TIMESTAMP)').bind(email, info.name || email.split('@')[0], 'google', String(info.sub || '')).run()
    u = { id: Number(r.meta.last_row_id), email, name: info.name || email.split('@')[0], role: 'member' }
  } else {
    await c.env.DB.prepare("UPDATE users SET last_login_at=CURRENT_TIMESTAMP, provider_id=COALESCE(provider_id, ?) WHERE id=?").bind(String(info.sub || ''), u.id).run()
  }
  await setMemberSession(c, { id: u.id, email: u.email, name: u.name, role: u.role === 'admin' ? 'admin' : 'member' })
  // 전화번호 미등록(구글 가입) 시 마이페이지에서 보완 안내
  return c.redirect(st.n === '/' ? '/auth/mypage' : st.n)
})

// ── 마이페이지 ───────────────────────────────────────────
auth.get('/mypage', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/login?next=/auth/mypage')
  const u = await c.env.DB.prepare('SELECT id, email, name, phone, provider, agree_marketing, created_at FROM users WHERE id=?').bind(user.id).first<any>()
  if (!u) { clearMemberSession(c); return c.redirect('/auth/login') }
  const res = (await c.env.DB.prepare('SELECT id, treatment, preferred_date, preferred_time, status, created_at FROM reservations WHERE user_id=? OR (email=? AND email<>"") ORDER BY created_at DESC LIMIT 20').bind(u.id, u.email).all<any>()).results || []
  const statusKo: Record<string, string> = { pending: '확인 대기', confirmed: '예약 확정', done: '진료 완료', cancelled: '취소' }
  const msg = c.req.query('msg')
  const body = html`${pageHero({ eyebrow: '마이페이지', title: `${u.name}님, 안녕하세요`, lead: '회원 정보와 예약 내역을 확인하세요.' })}
<section class="section-sm"><div class="container container-narrow">
  ${alertBox(msg === 'saved' ? '저장되었습니다.' : undefined, 'ok')}
  ${!u.phone ? alertBox('예약 확인 연락을 위해 휴대전화 번호를 등록해 주세요.') : ''}
  <div class="grid-2">
    <form method="post" action="/auth/mypage" class="form card card-body" data-once>
      <h2 class="h3">회원 정보</h2>
      <div class="field"><label>이메일</label><input value="${u.email}" disabled></div>
      <div class="field"><label for="name">이름</label><input id="name" name="name" value="${u.name}" required maxlength="40"></div>
      <div class="field"><label for="phone">휴대전화</label><input id="phone" name="phone" type="tel" value="${u.phone || ''}" inputmode="numeric" placeholder="010-0000-0000"></div>
      ${u.provider === 'local' ? html`<div class="field"><label for="password">새 비밀번호 <small>(변경 시에만)</small></label><input id="password" name="password" type="password" minlength="8" autocomplete="new-password"></div>` : html`<p class="hint">Google 계정으로 가입하셨습니다.</p>`}
      <label class="check"><input type="checkbox" name="agree_marketing" value="1" ${u.agree_marketing ? 'checked' : ''}> <span>병원 소식·안내 수신 동의</span></label>
      <button type="submit" class="btn btn-primary">저장</button>
      <p class="hint">가입일 ${fmtDate(u.created_at)}</p>
    </form>
    <div class="card card-body">
      <h2 class="h3">예약 내역</h2>
      ${res.length ? html`<table class="meta-table"><thead><tr><th>진료</th><th>희망 일시</th><th>상태</th></tr></thead><tbody>${res.map((r: any) => html`<tr><td>${r.treatment || '-'}</td><td>${r.preferred_date || ''} ${r.preferred_time || ''}</td><td><span class="badge-${r.status === 'confirmed' || r.status === 'done' ? 'on' : r.status === 'cancelled' ? 'off' : 'new'}">${statusKo[r.status] || r.status}</span></td></tr>`)}</tbody></table>` : html`<p class="hint">예약 내역이 없습니다.</p>`}
      <a href="/reservation" class="btn btn-outline" style="margin-top:14px">새 예약 신청</a>
      <hr class="divider-line">
      <form method="post" action="/auth/logout"><button type="submit" class="btn btn-ghost">로그아웃</button></form>
      <form method="post" action="/auth/delete" onsubmit="return confirm('탈퇴하면 회원 정보가 삭제됩니다. 계속할까요?')" style="margin-top:8px"><button type="submit" class="btn btn-ghost btn-danger-text">회원 탈퇴</button></form>
    </div>
  </div>
</div></section>`
  return c.html(Layout(c, { title: '마이페이지', description: '회원 정보와 예약 내역.', path: '/auth/mypage', noindex: true }, body))
})

auth.post('/mypage', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/login')
  const f = await formData(c)
  const name = String(f.name || '').trim() || user.name, phone = f.phone ? normPhone(String(f.phone)) : null
  await c.env.DB.prepare('UPDATE users SET name=?, phone=COALESCE(?, phone), agree_marketing=? WHERE id=?').bind(name, phone, f.agree_marketing ? 1 : 0, user.id).run()
  if (f.password && String(f.password).length >= 8) await c.env.DB.prepare('UPDATE users SET password_hash=? WHERE id=?').bind(await hashPassword(String(f.password)), user.id).run()
  await setMemberSession(c, { ...user, name } as SessionUser)
  return c.redirect('/auth/mypage?msg=saved')
})

auth.post('/delete', async (c) => {
  const user = c.get('user')
  if (!user) return c.redirect('/auth/login')
  await c.env.DB.prepare('DELETE FROM users WHERE id=?').bind(user.id).run()
  clearMemberSession(c)
  return c.redirect('/?bye=1')
})

export default auth
