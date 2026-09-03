import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { articleLd, truncate, webpageSpeakableLd } from '../lib/seo'
import { treatments, getTreatment } from '../data/treatments'
import { doctors, getDoctor } from '../data/doctors'
import { autoLink } from '../data/encyclopedia'
import { pageHero, ctaStrip, safeHtml, alertBox, paginate } from '../lib/ui'
import { trackView, fmtDate, stripTags, esc, formData, isEmail, normPhone } from '../lib/util'

const content = new Hono<Env>()
const PER = 12

// ── 파일 서빙 (R2) — after 사진은 회원 전용 ─────────────
content.get('/files/*', async (c) => {
  const key = c.req.path.replace(/^\/files\//, '')
  if (!key || key.includes('..')) return c.notFound()
  // cases/<id>/(pano|intra)_after.* → 로그인 필수
  if (/^cases\/[^/]+\/(pano|intra)_after/.test(key) && !c.get('user') && !c.get('admin')) return c.text('로그인이 필요합니다', 401)
  const obj = await c.env.R2.get(key)
  if (!obj) return c.notFound()
  const h = new Headers()
  h.set('content-type', obj.httpMetadata?.contentType || 'application/octet-stream')
  h.set('etag', obj.httpEtag)
  h.set('cache-control', key.includes('_after') ? 'private, max-age=600' : 'public, max-age=31536000, immutable')
  return new Response(obj.body, { headers: h })
})

// ── 지역 자동완성 API ────────────────────────────────────
const REGIONS = [
  ...['화서동', '화서1동', '화서2동', '인계동', '매교동', '매산동', '고등동', '지동', '우만동', '행궁동', '매탄동'].map((d) => `수원시 팔달구 ${d}`),
  ...['정자동', '율전동', '천천동', '조원동', '송죽동', '영화동', '연무동', '파장동', '이목동', '율천동'].map((d) => `수원시 장안구 ${d}`),
  ...['서둔동', '구운동', '탑동', '세류동', '권선동', '곡선동', '금곡동', '호매실동', '입북동', '평동', '오목천동', '고색동'].map((d) => `수원시 권선구 ${d}`),
  ...['영통동', '망포동', '매탄동', '원천동', '광교동', '이의동', '하동', '태장동'].map((d) => `수원시 영통구 ${d}`),
  ...['초지동', '본오동', '사동', '월피동', '부곡동', '성포동', '이동', '팔곡동'].map((d) => `안산시 상록구 ${d}`),
  ...['고잔동', '선부동', '원곡동', '와동', '신길동', '대부동'].map((d) => `안산시 단원구 ${d}`),
  ...['보라동', '기흥동', '구갈동', '신갈동', '영덕동', '상갈동', '동백동', '중동', '마북동', '언남동'].map((d) => `용인시 기흥구 ${d}`),
  ...['상현동', '풍덕천동', '죽전동', '동천동', '성복동', '신봉동'].map((d) => `용인시 수지구 ${d}`),
  ...['봉담읍', '병점동', '진안동', '반월동', '기안동', '향남읍', '동탄'].map((d) => `화성시 ${d}`),
  ...['오산동', '원동', '궐동', '세교동', '부산동'].map((d) => `오산시 ${d}`),
  ...['의왕시 내손동', '의왕시 오전동', '의왕시 고천동', '군포시 산본동', '군포시 금정동', '안양시 만안구 안양동', '안양시 동안구 평촌동', '안양시 동안구 호계동', '성남시 분당구 정자동', '평택시 비전동', '평택시 서정동', '서울시', '서울시 강남구', '서울시 서초구', '서울시 관악구', '서울시 금천구', '인천시', '천안시'],
]
content.get('/api/regions', (c) => {
  const q = (c.req.query('q') || '').trim().toLowerCase()
  if (!q) return c.json({ results: [] })
  const results = REGIONS.filter((r) => r.toLowerCase().includes(q)).sort((a, b) => a.indexOf(q) - b.indexOf(q) || a.length - b.length).slice(0, 8)
  return c.json({ results })
})

// ── 치료 전후 (Cases) ────────────────────────────────────
function caseCard(k: any) {
  const thumb = k.intra_before || k.pano_before
  return html`<a href="/cases/gallery/${k.slug}" class="case-card">
    <div class="case-thumb">${thumb ? html`<img src="/files/${thumb}" alt="${k.title} 치료 전" width="480" height="320" loading="lazy" decoding="async">` : html`<span class="lock">사진 준비 중</span>`}${k.pano_after || k.intra_after ? html`<span class="lock">치료 후: 회원 공개</span>` : ''}</div>
    <div class="case-body"><span class="tag green">${k.treatment_name}</span><h3>${k.title}</h3><p class="case-meta">${[k.age_group, k.gender, k.region, k.duration].filter(Boolean).join(' · ')}</p></div>
  </a>`
}

content.get('/cases/gallery', async (c) => {
  const clinic = c.get('clinic') as any
  const tx = c.req.query('treatment'), dr = c.req.query('doctor'), page = Math.max(1, Number(c.req.query('page') || 1))
  const where = ['published=1'], binds: any[] = []
  if (tx) { where.push('treatment_slug=?'); binds.push(tx) }
  if (dr) { where.push('doctor_slug=?'); binds.push(dr) }
  const total = (await c.env.DB.prepare(`SELECT COUNT(*) n FROM cases WHERE ${where.join(' AND ')}`).bind(...binds).first<any>())?.n || 0
  const rows = (await c.env.DB.prepare(`SELECT * FROM cases WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, PER, (page - 1) * PER).all<any>()).results || []
  rows.forEach((k) => (k.treatment_name = getTreatment(k.treatment_slug)?.name || k.treatment_slug))
  const base = `/cases/gallery${tx ? `?treatment=${tx}` : dr ? `?doctor=${dr}` : ''}`
  const user = c.get('user')
  const body = html`${pageHero({ eyebrow: '치료 전후', title: html`사진으로 보는<br>치료 과정과 결과`, lead: '환자분 동의 하에 게시한 실제 치료 사례입니다. 의료법에 따라 치료 후 사진은 회원에게만 공개됩니다. 모든 결과는 개인 상태에 따라 다를 수 있습니다.', crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }], actions: user ? '' : html`<a href="/auth/register?next=/cases/gallery" class="btn btn-primary">회원가입하고 전체 보기</a><a href="/auth/login?next=/cases/gallery" class="btn btn-outline">로그인</a>` })}
<section class="section">
  <div class="container">
    <nav class="faq-filter reveal in" aria-label="진료별 보기"><a href="/cases/gallery" class="${!tx ? 'active' : ''}">전체</a>${treatments.filter((t) => t.areaKey || t.core).map((t) => html`<a href="/cases/gallery?treatment=${t.slug}" class="${tx === t.slug ? 'active' : ''}">${t.name}</a>`)}</nav>
    ${rows.length ? html`<div class="case-grid stagger">${rows.map(caseCard)}</div>${paginate(base, page, total, PER)}` : html`<p class="faq-empty">아직 게시된 사례가 없습니다. 곧 업데이트됩니다.</p>`}
  </div>
</section>
${ctaStrip(clinic, { title: '내 경우는 어떤 치료가 필요할까요?', sub: '사진은 참고일 뿐, 정확한 판단은 진단 후에 가능합니다.' })}`
  return c.html(Layout(c, { title: `치료 전후 사례${tx ? ` — ${getTreatment(tx)?.name || ''}` : ''}`, description: '서울도담치과 치료 전후 사진. 생활치수치료·잇몸치료·임플란트·신경치료 실제 사례. 치료 후 사진은 회원 공개.', path: '/cases/gallery', crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }] }, body))
})

content.get('/cases/gallery/:slug', async (c) => {
  const clinic = c.get('clinic') as any
  const k = await c.env.DB.prepare('SELECT * FROM cases WHERE slug=? AND published=1').bind(c.req.param('slug')).first<any>()
  if (!k) return c.notFound()
  await trackView(c, 'case', k.id, 'cases')
  const t = getTreatment(k.treatment_slug), d = getDoctor(k.doctor_slug) || doctors[0]
  const canSee = !!(c.get('user') || c.get('admin'))
  const path = `/cases/gallery/${k.slug}`
  const pair = (label: string, before?: string, after?: string) => {
    if (!before && !after) return ''
    return html`<section class="reveal"><h2 class="h3">${label}</h2>
      ${before && after ? (canSee
        ? html`<div class="ba" aria-label="${label} 치료 전후 비교 슬라이더"><img src="/files/${before}" alt="${k.title} ${label} 치료 전" width="960" height="640"><img src="/files/${after}" alt="${k.title} ${label} 치료 후" class="after" width="960" height="640"><span class="ba-label l">치료 전</span><span class="ba-label r">치료 후</span><span class="ba-handle" aria-hidden="true"></span><input type="range" min="0" max="100" value="50" aria-label="비교 위치"></div>`
        : html`<div class="case-detail-grid"><figure><img src="/files/${before}" alt="${k.title} ${label} 치료 전" width="960" height="640" loading="lazy"><figcaption>치료 전</figcaption></figure><div class="locked-box"><p><strong>치료 후 사진은 회원에게만 공개됩니다</strong></p><p>의료법에 따라 치료 결과 사진은 로그인 후 열람할 수 있습니다.</p><a href="/auth/register?next=${path}" class="btn btn-primary">회원가입</a> <a href="/auth/login?next=${path}" class="btn btn-outline">로그인</a></div></div>`)
        : html`<div class="case-detail-grid">${before ? html`<figure><img src="/files/${before}" alt="${k.title} ${label} 치료 전" width="960" height="640" loading="lazy"><figcaption>치료 전</figcaption></figure>` : ''}${after ? (canSee ? html`<figure><img src="/files/${after}" alt="${k.title} ${label} 치료 후" width="960" height="640" loading="lazy"><figcaption>치료 후</figcaption></figure>` : html`<div class="locked-box"><p><strong>치료 후 사진은 회원 공개</strong></p><a href="/auth/login?next=${path}" class="btn btn-primary btn-sm">로그인</a></div>`) : ''}</div>`}
    </section>`
  }
  const body = html`${pageHero({ eyebrow: `치료 전후 · ${t?.name || k.treatment_slug}`, title: k.title, crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }, { name: k.title, href: path }] })}
<div class="container tx-layout">
  <article class="tx-body">
    ${pair('구내 사진', k.intra_before, k.intra_after)}
    ${pair('파노라마 방사선', k.pano_before, k.pano_after)}
    ${k.description ? html`<section class="prose reveal"><h2>치료 이야기</h2>${safeHtml(k.description.includes('<') ? k.description : `<p>${esc(k.description).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`)}</section>` : ''}
    <p class="reviewed">본 사례는 해당 환자의 치료 결과이며 개인의 구강 상태에 따라 결과는 다를 수 있습니다. 부작용 및 주의사항은 <a href="/treatments/${k.treatment_slug}#side-effects">${t?.name || '진료'} 안내</a>를 확인해 주세요. 환자 동의 하에 게시되었으며 개인 식별 정보는 제거되었습니다.</p>
  </article>
  <aside class="tx-side">
    <div class="side-card"><p class="side-title">사례 정보</p><table class="meta-table"><tbody>
      <tr><th>진료</th><td><a href="/treatments/${k.treatment_slug}">${t?.name || k.treatment_slug}</a></td></tr>
      ${k.age_group ? html`<tr><th>연령</th><td>${k.age_group}</td></tr>` : ''}
      ${k.gender ? html`<tr><th>성별</th><td>${k.gender}</td></tr>` : ''}
      ${k.region ? html`<tr><th>지역</th><td>${k.region}</td></tr>` : ''}
      ${k.duration ? html`<tr><th>치료 기간</th><td>${k.duration}</td></tr>` : ''}
      <tr><th>담당</th><td><a href="/doctors/${d.slug}">${d.name} ${d.title}</a></td></tr>
      <tr><th>게시일</th><td>${fmtDate(k.created_at)}</td></tr>
    </tbody></table></div>
    <div class="side-card side-doctor"><img src="${d.photo}" alt="${d.photoAlt}" width="96" height="96" loading="lazy"><p class="side-title">담당 의료진</p><p><strong>${d.name} ${d.title}</strong><br><small>${d.specialty}</small></p><a href="/doctors/${d.slug}" class="link-arrow">소개 보기</a></div>
    <div class="side-card side-cta"><p class="side-title">같은 고민이라면</p><p class="side-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><a href="/reservation?treatment=${k.treatment_slug}" class="btn btn-primary btn-block">진료 예약</a></div>
  </aside>
</div>`
  return c.html(Layout(c, { title: `${k.title} — 치료 전후`, description: truncate(`${t?.name || ''} 치료 전후 사례. ${[k.age_group, k.gender, k.region, k.duration].filter(Boolean).join(', ')}. ${stripTags(k.description || '')}`), path, image: k.intra_before ? `/files/${k.intra_before}` : undefined, type: 'article', crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }, { name: k.title, href: path }] }, body))
})

// ── 원장 칼럼 ────────────────────────────────────────────
content.get('/column', async (c) => {
  const clinic = c.get('clinic') as any
  const page = Math.max(1, Number(c.req.query('page') || 1)), tx = c.req.query('treatment')
  const where = ['published=1'], binds: any[] = []
  if (tx) { where.push('treatment_slug=?'); binds.push(tx) }
  const total = (await c.env.DB.prepare(`SELECT COUNT(*) n FROM columns WHERE ${where.join(' AND ')}`).bind(...binds).first<any>())?.n || 0
  const rows = (await c.env.DB.prepare(`SELECT slug, title, excerpt, thumbnail, author_slug, treatment_slug, published_at, views FROM columns WHERE ${where.join(' AND ')} ORDER BY published_at DESC LIMIT ? OFFSET ?`).bind(...binds, PER, (page - 1) * PER).all<any>()).results || []
  const [first, ...rest] = page === 1 ? rows : [null, ...rows]
  const card = (p: any) => html`<a href="/column/${p.slug}" class="post-card">${p.thumbnail ? html`<div class="post-thumb"><img src="/files/${p.thumbnail}" alt="" width="640" height="400" loading="lazy" decoding="async"></div>` : ''}<div class="post-body"><p class="post-meta">${fmtDate(p.published_at)}${p.treatment_slug ? ` · ${getTreatment(p.treatment_slug)?.name || ''}` : ''}</p><h3>${p.title}</h3><p>${p.excerpt || ''}</p></div></a>`
  const body = html`${pageHero({ eyebrow: '원장 칼럼', title: html`진료실에서<br>못 다한 이야기`, lead: '상담 시간에 다 설명하지 못한 것, 자주 받는 질문의 긴 답, 치료를 결정하기 전에 알아두면 좋은 것들을 한휘림 원장이 직접 씁니다.', crumbs: [{ name: '홈', href: '/' }, { name: '원장 칼럼', href: '/column' }] })}
<section class="section"><div class="container">
  <nav class="faq-filter reveal in" aria-label="진료별 보기"><a href="/column" class="${!tx ? 'active' : ''}">전체</a>${treatments.map((t) => html`<a href="/column?treatment=${t.slug}" class="${tx === t.slug ? 'active' : ''}">${t.name}</a>`)}</nav>
  ${!rows.length ? html`<p class="faq-empty">첫 칼럼을 준비하고 있습니다.</p>` : ''}
  ${first ? html`<a href="/column/${first.slug}" class="post-featured reveal in">${first.thumbnail ? html`<div class="post-thumb"><img src="/files/${first.thumbnail}" alt="" width="960" height="600" fetchpriority="high"></div>` : ''}<div class="post-body"><p class="post-meta">${fmtDate(first.published_at)} · ${getDoctor(first.author_slug)?.name || ''} 원장</p><h2 class="h3">${first.title}</h2><p>${first.excerpt || ''}</p><span class="link-arrow">읽기</span></div></a>` : ''}
  <div class="post-grid stagger">${rest.filter(Boolean).map(card)}</div>
  ${paginate(`/column${tx ? `?treatment=${tx}` : ''}`, page, total, PER)}
</div></section>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: '원장 칼럼', description: '서울도담치과 한휘림 원장의 칼럼. 신경치료·생활치수치료·잇몸·임플란트·사랑니, 치료 결정 전 알아둘 이야기.', path: '/column', crumbs: [{ name: '홈', href: '/' }, { name: '원장 칼럼', href: '/column' }] }, body))
})

content.get('/column/rss.xml', async (c) => {
  const clinic = c.get('clinic') as any, site = c.get('siteUrl')
  const rows = (await c.env.DB.prepare('SELECT slug, title, excerpt, published_at FROM columns WHERE published=1 ORDER BY published_at DESC LIMIT 30').all<any>()).results || []
  const x = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(clinic.shortName)} 원장 칼럼</title><link>${site}/column</link><description>${x(clinic.mission)}</description><language>ko</language>${rows.map((r) => `<item><title>${x(r.title)}</title><link>${site}/column/${r.slug}</link><guid>${site}/column/${r.slug}</guid><description>${x(r.excerpt)}</description><pubDate>${new Date(r.published_at.replace(' ', 'T') + 'Z').toUTCString()}</pubDate></item>`).join('')}</channel></rss>`
  return c.body(xml, 200, { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=1800' })
})

content.get('/column/:slug', async (c) => {
  const clinic = c.get('clinic') as any, site = c.get('siteUrl')
  const p = await c.env.DB.prepare('SELECT * FROM columns WHERE slug=? AND published=1').bind(c.req.param('slug')).first<any>()
  if (!p) return c.notFound()
  await trackView(c, 'column', p.id, 'columns')
  const d = getDoctor(p.author_slug) || doctors[0], t = p.treatment_slug ? getTreatment(p.treatment_slug) : undefined
  const path = `/column/${p.slug}`
  const more = (await c.env.DB.prepare('SELECT slug, title, published_at FROM columns WHERE published=1 AND id<>? ORDER BY published_at DESC LIMIT 4').bind(p.id).all<any>()).results || []
  const contentHtml = autoLink(String(p.content_html || ''), { max: 10, exclude: t ? [t.slug] : [] })
  const tags = String(p.tags || '').split(',').map((s) => s.trim()).filter(Boolean)
  const body = html`
<article class="container container-narrow article">
  <header class="article-head">
    <nav class="crumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/column">원장 칼럼</a></li><li aria-current="page">${p.title}</li></ol></nav>
    ${t ? html`<a href="/treatments/${t.slug}" class="tag green">${t.name}</a>` : ''}
    <h1 class="h1">${p.title}</h1>
    ${p.excerpt ? html`<p class="lead">${p.excerpt}</p>` : ''}
    <div class="article-author"><img src="${d.photo}" alt="${d.photoAlt}" width="48" height="48"><div><a href="/doctors/${d.slug}"><strong>${d.name} ${d.title}</strong></a><br><small>${d.specialty} · ${fmtDate(p.published_at)}${p.updated_at && p.updated_at.slice(0, 10) !== p.published_at.slice(0, 10) ? ` (수정 ${fmtDate(p.updated_at)})` : ''}</small></div><button type="button" class="btn btn-outline btn-sm" data-share style="margin-left:auto">공유</button></div>
  </header>
  ${p.thumbnail ? html`<figure class="article-hero-img"><img src="/files/${p.thumbnail}" alt="${p.title}" width="1200" height="720" fetchpriority="high"></figure>` : ''}
  <div class="article-body prose">${safeHtml(contentHtml)}</div>
  <footer class="article-foot">
    ${tags.length ? html`<ul class="pill-list">${tags.map((s) => html`<li>#${s}</li>`)}</ul>` : ''}
    <p class="reviewed">이 글은 일반적인 정보 제공을 위한 것으로 개별 진단을 대신하지 않습니다. 개인의 구강 상태에 따라 치료 방법과 결과는 다를 수 있습니다. 글쓴이: ${d.name} ${d.title}(${d.specialty}).</p>
    ${t ? html`<div class="cta-strip"><div><h2 class="h3">${t.name} 안내 보기</h2><p>${t.short}</p></div><div class="cta-strip-actions"><a href="/treatments/${t.slug}" class="btn btn-primary">진료 안내</a><a href="/reservation?treatment=${t.slug}" class="btn btn-outline">예약</a></div></div>` : ''}
  </footer>
</article>
${more.length ? html`<section class="section section-bg"><div class="container container-narrow"><h2 class="h3">다른 칼럼</h2><ul class="notice-list">${more.map((m: any) => html`<li class="notice-row"><a href="/column/${m.slug}">${m.title}</a><span class="date">${fmtDate(m.published_at)}</span></li>`)}</ul></div></section>` : ''}`
  return c.html(Layout(c, {
    title: p.meta_title || p.title,
    description: p.meta_description || truncate(p.excerpt || stripTags(p.content_html)),
    path, type: 'article', image: p.thumbnail ? `/files/${p.thumbnail}` : undefined,
    jsonld: [articleLd({ title: p.title, description: p.meta_description || p.excerpt || '', path, image: p.thumbnail ? `/files/${p.thumbnail}` : undefined, author: d.name, authorPath: `/doctors/${d.slug}`, publishedAt: p.published_at, modifiedAt: p.updated_at }, clinic, site), webpageSpeakableLd(path, site, p.title)],
    crumbs: [{ name: '홈', href: '/' }, { name: '원장 칼럼', href: '/column' }, { name: p.title, href: path }],
    bodyClass: 'article-page',
  }, body))
})

// ── 공지사항 ─────────────────────────────────────────────
content.get('/notice', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1))
  const total = (await c.env.DB.prepare('SELECT COUNT(*) n FROM notices WHERE published=1').first<any>())?.n || 0
  const rows = (await c.env.DB.prepare('SELECT id, title, pinned, created_at, views FROM notices WHERE published=1 ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?').bind(20, (page - 1) * 20).all<any>()).results || []
  const body = html`${pageHero({ eyebrow: '공지사항', title: '병원 소식', lead: '진료 일정 변경, 휴진 안내, 새로운 장비 소식을 알려드립니다.', crumbs: [{ name: '홈', href: '/' }, { name: '공지사항', href: '/notice' }] })}
<section class="section"><div class="container container-narrow">
  ${rows.length ? html`<ul class="notice-list reveal in">${rows.map((n: any) => html`<li class="notice-row ${n.pinned ? 'pinned' : ''}">${n.pinned ? html`<span class="tag">공지</span>` : ''}<a href="/notice/${n.id}">${n.title}</a><span class="date">${fmtDate(n.created_at)}</span></li>`)}</ul>${paginate('/notice', page, total, 20)}` : html`<p class="faq-empty">등록된 공지가 없습니다.</p>`}
</div></section>`
  return c.html(Layout(c, { title: '공지사항', description: '서울도담치과 공지사항. 진료 일정, 휴진 안내, 병원 소식.', path: '/notice', crumbs: [{ name: '홈', href: '/' }, { name: '공지사항', href: '/notice' }] }, body))
})

content.get('/notice/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const n = await c.env.DB.prepare('SELECT * FROM notices WHERE id=? AND published=1').bind(id).first<any>()
  if (!n) return c.notFound()
  await trackView(c, 'notice', n.id, 'notices')
  const body = html`<article class="container container-narrow article">
  <header class="article-head"><nav class="crumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/notice">공지사항</a></li><li aria-current="page">${n.title}</li></ol></nav>${n.pinned ? html`<span class="tag">공지</span>` : ''}<h1 class="h1">${n.title}</h1><p class="post-meta">${fmtDate(n.created_at)}</p></header>
  ${n.image ? html`<figure class="article-hero-img"><img src="/files/${n.image}" alt="${n.title}" width="1200" height="720"></figure>` : ''}
  <div class="article-body prose">${safeHtml(n.content_html)}</div>
  <footer class="article-foot"><a href="/notice" class="link-arrow">목록으로</a></footer>
</article>`
  return c.html(Layout(c, { title: n.title, description: truncate(stripTags(n.content_html)), path: `/notice/${n.id}`, type: 'article', image: n.image ? `/files/${n.image}` : undefined, crumbs: [{ name: '홈', href: '/' }, { name: '공지사항', href: '/notice' }, { name: n.title, href: `/notice/${n.id}` }] }, body))
})

// ── 예약 ─────────────────────────────────────────────────
const TIMES = ['오전 (09:00–12:00)', '점심 이후 (14:00–16:00)', '오후 늦게 (16:00–18:00)', '화요일 야간 (18:00–20:30)', '토요일 오전', '상관없음']
function reservationForm(c: any, o: { error?: string; v?: Record<string, any>; ok?: boolean }) {
  const clinic = c.get('clinic') as any, user = c.get('user'), v = o.v || {}
  const body = html`${pageHero({ eyebrow: '진료 예약', title: html`먼저 확인하고<br>연락드리겠습니다`, lead: '온라인 예약은 접수 단계입니다. 내용을 확인한 뒤 진료시간 내에 전화 또는 문자로 확정 안내를 드립니다. 급하신 경우 전화가 가장 빠릅니다.', crumbs: [{ name: '홈', href: '/' }, { name: '진료 예약', href: '/reservation' }] })}
<section class="section-sm"><div class="container">
  <div class="grid-2 res-grid">
    <div class="form-card">
      ${o.ok ? html`<div class="alert-ok" role="status"><strong>예약 신청이 접수되었습니다.</strong><br>진료시간 내에 확인 연락을 드립니다. 감사합니다.</div><div class="hero-actions"><a href="/" class="btn btn-primary">홈으로</a><a href="/treatments" class="btn btn-outline">진료 안내 보기</a></div>` : html`
      ${alertBox(o.error)}
      <form method="post" action="/reservation" class="form" data-once>
        <div class="form-row">
          <div class="field"><label for="name">이름 <span class="req">*</span></label><input id="name" name="name" required maxlength="40" value="${v.name || user?.name || ''}" autocomplete="name"></div>
          <div class="field"><label for="phone">연락처 <span class="req">*</span></label><input id="phone" name="phone" type="tel" required inputmode="numeric" placeholder="010-0000-0000" value="${v.phone || ''}" autocomplete="tel"></div>
        </div>
        <div class="field"><label for="email">이메일 <small>(선택 · 접수 확인 메일)</small></label><input id="email" name="email" type="email" value="${v.email || user?.email || ''}" autocomplete="email"></div>
        <div class="form-row">
          <div class="field"><label for="treatment">희망 진료</label><select id="treatment" name="treatment"><option value="">잘 모르겠어요 / 검진</option>${treatments.map((t) => html`<option value="${t.name}" ${v.treatment === t.slug || v.treatment === t.name ? 'selected' : ''}>${t.name}</option>`)}<option value="통증·응급" ${v.treatment === '통증·응급' ? 'selected' : ''}>통증·응급</option></select></div>
          <div class="field"><label for="preferred_date">희망 날짜</label><input id="preferred_date" name="preferred_date" type="date" value="${v.preferred_date || ''}" min="${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}"></div>
        </div>
        <div class="field"><label for="preferred_time">희망 시간대</label><select id="preferred_time" name="preferred_time">${TIMES.map((t) => html`<option ${v.preferred_time === t ? 'selected' : ''}>${t}</option>`)}</select></div>
        <div class="field"><label for="message">증상·문의 내용</label><textarea id="message" name="message" rows="4" maxlength="1000" placeholder="예: 오른쪽 아래 어금니가 찬물에 시립니다. 다른 치과에서 신경치료를 권했는데 살릴 수 있는지 궁금합니다.">${v.message || ''}</textarea></div>
        <label class="check"><input type="checkbox" name="agree" value="1" required> <span>예약 확인을 위한 <a href="/privacy" target="_blank">개인정보 수집·이용</a>에 동의합니다 (이름·연락처·이메일·문의 내용, 1년 보관)</span></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="sr-only" aria-hidden="true">
        <button type="submit" class="btn btn-primary btn-lg btn-block" data-loading="접수 중…">예약 신청</button>
      </form>`}
    </div>
    <aside class="res-side">
      <div class="info-card info-card-cta"><h3>전화 예약</h3><p class="info-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><p>진료시간 내 전화 예약이 가장 빠릅니다.</p><a href="${clinic.channels.kakao}" class="btn btn-outline" target="_blank" rel="noopener">카카오톡 채널</a></div>
      <div class="info-card"><h3>진료시간</h3><table class="hours-table"><tbody>${clinic.hours.map((h: any) => html`<tr data-day="${h.day}"><th>${h.day}</th><td>${h.open ? `${h.open} – ${h.close}` : html`<span class="closed">휴진</span>`}</td><td class="note">${h.note || ''}</td></tr>`)}</tbody></table><p class="hint">${clinic.hoursNote}</p></div>
      <div class="info-card"><h3>첫 방문 준비</h3><ul class="info-list"><li>신분증 (건강보험 확인)</li><li>복용 중인 약 이름</li><li>다른 병원 방사선 사진(있다면)</li><li>10분 정도 일찍 도착</li></ul></div>
    </aside>
  </div>
</div></section>`
  return c.html(Layout(c, { title: '진료 예약', description: `서울도담치과 온라인 진료 예약. 접수 후 확인 연락. 전화 ${clinic.phone}. 화요일 야간진료 20:30.`, path: '/reservation', crumbs: [{ name: '홈', href: '/' }, { name: '진료 예약', href: '/reservation' }] }, body))
}

content.get('/reservation', (c) => reservationForm(c, { v: { treatment: c.req.query('treatment') }, ok: c.req.query('ok') === '1' }))

content.post('/reservation', async (c) => {
  const f = await formData(c)
  if (f.website) return c.redirect('/reservation?ok=1') // honeypot
  const name = String(f.name || '').trim(), phone = normPhone(String(f.phone || '')), email = String(f.email || '').trim().toLowerCase()
  if (!name || phone.replace(/\D/g, '').length < 9) return reservationForm(c, { error: '이름과 연락처를 확인해 주세요.', v: f })
  if (email && !isEmail(email)) return reservationForm(c, { error: '이메일 형식을 확인해 주세요.', v: f })
  if (!f.agree) return reservationForm(c, { error: '개인정보 수집·이용 동의가 필요합니다.', v: f })
  const user = c.get('user')
  await c.env.DB.prepare('INSERT INTO reservations (name, phone, email, treatment, preferred_date, preferred_time, message, user_id) VALUES (?,?,?,?,?,?,?,?)').bind(name, phone, email || null, String(f.treatment || ''), String(f.preferred_date || ''), String(f.preferred_time || ''), String(f.message || '').slice(0, 1000), user?.id || null).run()
  // 이메일 알림 (Resend) — 키 없으면 건너뜀
  if (c.env.RESEND_API_KEY) {
    const clinic = c.get('clinic') as any
    const to = c.env.NOTIFICATION_EMAIL || clinic.email
    const send = (payload: any) => fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {})
    const from = `${clinic.shortName} <noreply@${new URL(c.get('siteUrl')).hostname.replace(/^www\./, '')}>`
    const tasks = [send({ from, to, subject: `[예약신청] ${name} · ${f.treatment || '검진'} · ${f.preferred_date || '날짜 미정'}`, html: `<h2>새 예약 신청</h2><table><tr><td>이름</td><td>${esc(name)}</td></tr><tr><td>연락처</td><td>${esc(phone)}</td></tr><tr><td>이메일</td><td>${esc(email)}</td></tr><tr><td>진료</td><td>${esc(f.treatment)}</td></tr><tr><td>희망</td><td>${esc(f.preferred_date)} ${esc(f.preferred_time)}</td></tr><tr><td>내용</td><td>${esc(f.message).replace(/\n/g, '<br>')}</td></tr></table><p><a href="${c.get('siteUrl')}/admin/reservations">관리자에서 보기</a></p>` })]
    if (email) tasks.push(send({ from, to: email, subject: `[${clinic.shortName}] 예약 신청이 접수되었습니다`, html: `<p>${esc(name)}님, 예약 신청이 접수되었습니다.</p><p>희망 진료: ${esc(f.treatment || '검진')}<br>희망 일시: ${esc(f.preferred_date)} ${esc(f.preferred_time)}</p><p>진료시간 내에 확인 연락을 드립니다. 급하신 경우 ${clinic.phone}로 전화해 주세요.</p><p>${clinic.name}<br>${clinic.address}</p>` }))
    c.executionCtx?.waitUntil?.(Promise.all(tasks))
  }
  return c.redirect('/reservation?ok=1')
})

export default content
