import { Hono } from 'hono'
import { html, raw } from 'hono/html'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { articleLd, truncate, physicianLd, isoDate } from '../lib/seo'
import { treatments, getTreatment } from '../data/treatments'
import { doctors, getDoctor } from '../data/doctors'
import { autoLink } from '../data/encyclopedia'
import { pageHero, ctaStrip, articleHtml, imageAttrs, paginate, alertBox } from '../lib/ui'
import { fmtDate, trackView, stripTags, formData, isEmail, normPhone } from '../lib/util'

const content = new Hono<Env>()
const PER = 12

// ── 파일 서빙 (R2) — 치료 후 사진은 로그인 필요 ──────────
content.get('/files/:key{.+}', async (c) => {
  const key = c.req.param('key')
  const isAfter = key.startsWith('cases/after/') || /_after\.[a-z0-9]+$/i.test(key)
  if (isAfter && !c.get('user') && !c.get('admin')) return c.text('로그인이 필요합니다', 401)
  const obj = await c.env.R2.get(key)
  if (!obj) return c.notFound()
  const h = new Headers()
  obj.writeHttpMetadata(h)
  h.set('etag', obj.httpEtag)
  h.set('cache-control', isAfter ? 'private, max-age=600' : 'public, max-age=31536000, immutable')
  if (isAfter) h.set('x-robots-tag', 'noindex, noimageindex')
  return new Response(obj.body, { headers: h })
})

// ── 지역 자동완성 API ────────────────────────────────────
const REGIONS = [
  ...['화서동', '화서1동', '화서2동', '매교동', '매산동', '고등동', '지동', '우만동', '인계동', '행궁동', '매탄동', '원천동', '영통동', '망포동', '광교동', '정자동', '정자1동', '정자2동', '정자3동', '율전동', '천천동', '조원동', '송죽동', '파장동', '영화동', '연무동', '서둔동', '구운동', '탑동', '평동', '세류동', '권선동', '곡선동', '금곡동', '호매실동', '입북동', '당수동', '오목천동', '고색동'].map((d) => {
    const gu = ['화서동', '화서1동', '화서2동', '매교동', '매산동', '고등동', '지동', '우만동', '인계동', '행궁동'].includes(d) ? '팔달구' : ['매탄동', '원천동', '영통동', '망포동', '광교동'].includes(d) ? '영통구' : ['정자동', '정자1동', '정자2동', '정자3동', '율전동', '천천동', '조원동', '송죽동', '파장동', '영화동', '연무동'].includes(d) ? '장안구' : '권선구'
    return `수원시 ${gu} ${d}`
  }),
  '안산시 상록구 초지동', '안산시 단원구 고잔동', '안산시 상록구 사동', '화성시 봉담읍', '화성시 병점동', '화성시 향남읍', '화성시 동탄', '오산시 오산동', '용인시 수지구', '용인시 기흥구', '의왕시 내손동', '군포시 산본동', '안양시 만안구', '안양시 동안구 평촌동', '성남시 분당구', '서울시 관악구', '서울시 금천구',
]
content.get('/api/regions', (c) => {
  const q = (c.req.query('q') || '').trim()
  if (!q) return c.json({ results: [] })
  const results = REGIONS.filter((r) => r.includes(q)).slice(0, 8)
  return c.json({ results })
})

// ── 치료 전후 ────────────────────────────────────────────
const caseCard = (k: any) => html`<a href="/cases/gallery/${k.slug}" class="case-card reveal">
  <div class="case-thumb">${k.intra_before || k.pano_before ? html`<img src="/files/${k.intra_before || k.pano_before}" alt="${k.title} 치료 전" width="480" height="320" loading="lazy" decoding="async">` : html`<span class="lock">사진 준비 중</span>`}<span class="tag">${getTreatment(k.treatment_slug)?.name || k.treatment_slug}</span></div>
  <div class="case-body"><h3>${k.title}</h3><p class="case-meta">${[k.age_group, k.gender, k.region, k.duration].filter(Boolean).join(' · ')}</p></div>
</a>`

content.get('/cases/gallery', async (c) => {
  const clinic = c.get('clinic') as any
  const tx = c.req.query('treatment') || '', dr = c.req.query('doctor') || ''
  const page = Math.min(10000, Math.max(1, Math.floor(Number(c.req.query('page')) || 1)))
  const where = ['published=1']; const args: any[] = []
  if (tx) { where.push('treatment_slug=?'); args.push(tx) }
  if (dr) { where.push('doctor_slug=?'); args.push(dr) }
  const w = where.join(' AND ')
  const total = (await c.env.DB.prepare(`SELECT COUNT(*) n FROM cases WHERE ${w}`).bind(...args).first<any>())?.n || 0
  const rows = (await c.env.DB.prepare(`SELECT slug,title,treatment_slug,age_group,gender,region,duration,intra_before,pano_before FROM cases WHERE ${w} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...args, PER, (page - 1) * PER).all<any>()).results || []
  const base = `/cases/gallery${tx ? `?treatment=${tx}` : dr ? `?doctor=${dr}` : ''}`
  const body = html`${pageHero({ eyebrow: '치료 전후', title: html`사진으로 보는<br>치료 과정`, lead: '치료 전 사진은 누구나, 치료 후 사진은 회원만 볼 수 있습니다(의료법). 모든 사례는 환자분 동의를 받아 개인정보를 제외하고 게시합니다.', crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }] })}
<section class="section"><div class="container">
  <h2 class="sr-only">진료별 게시물 목록</h2>
  <nav class="faq-filter reveal in" aria-label="진료별 보기"><a href="/cases/gallery" class="${!tx ? 'active' : ''}">전체</a>${treatments.map((t) => html`<a href="/cases/gallery?treatment=${t.slug}" class="${tx === t.slug ? 'active' : ''}">${t.name}</a>`)}</nav>
  ${rows.length && !c.get('user') ? html`<div class="locked-box reveal in"><p><strong>치료 후 사진은 회원에게만 공개됩니다.</strong> 회원가입 후 로그인하면 전후 비교 슬라이더를 볼 수 있습니다.</p><div class="hero-actions"><a href="/auth/login?next=${encodeURIComponent(c.req.path + (tx ? '?treatment=' + tx : ''))}" class="btn btn-primary btn-sm">로그인</a><a href="/auth/register?next=${encodeURIComponent(c.req.path)}" class="btn btn-outline btn-sm">회원가입</a></div></div>` : ''}
  ${rows.length ? html`<div class="case-grid">${rows.map(caseCard)}</div>${paginate(base, page, total, PER)}` : html`<section class="empty-content"><p class="edition-label">CARE, WITH YOUR CONSENT</p><h2>공개된 치료 사례를 준비하고 있습니다.</h2><p>환자분의 동의를 받은 사례만 게시합니다.<br>궁금한 치료의 과정과 주의사항은 진료 안내에서 먼저 확인하실 수 있습니다.</p><a href="/treatments" class="editorial-link">진료 안내 살펴보기 <span aria-hidden="true">↗</span></a></section>`}
</div></section>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: tx ? `${getTreatment(tx)?.name || ''} 치료 전후` : '치료 전후 사진', description: '서울도담치과 치료 전후 사진. 생활치수치료·잇몸치료·임플란트·충치치료 사례. 치료 후 사진은 의료법에 따라 회원에게만 공개됩니다.', path: '/cases/gallery', noindex: !!tx || !!dr || (page > 1 && !rows.length), crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }] }, body))
})

content.get('/cases/gallery/:slug', async (c) => {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const k = await c.env.DB.prepare('SELECT * FROM cases WHERE slug=? AND published=1').bind(c.req.param('slug')).first<any>()
  if (!k) return c.notFound()
  await trackView(c, 'case', k.id, 'cases')
  const user = c.get('user')
  const t = getTreatment(k.treatment_slug), d = getDoctor(k.doctor_slug) || doctors[0]
  const pair = (label: string, before?: string, after?: string) => {
    if (!before && !after) return ''
    if (!user) return html`<figure class="reveal"><figcaption class="h3">${label}</figcaption>${before ? html`<img src="/files/${before}" alt="${k.title} ${label} 치료 전" width="960" height="640" class="case-single" loading="lazy">` : ''}<div class="locked-box"><p><strong>치료 후 사진은 회원 로그인 후 볼 수 있습니다.</strong> 의료법에 따라 치료 결과 사진은 비회원에게 공개하지 않습니다.</p><div class="hero-actions"><a href="/auth/login?next=${encodeURIComponent(c.req.path)}" class="btn btn-primary btn-sm">로그인</a><a href="/auth/register?next=${encodeURIComponent(c.req.path)}" class="btn btn-outline btn-sm">회원가입</a></div></div></figure>`
    if (before && after) return html`<figure class="reveal"><figcaption class="h3">${label} <small class="hint">슬라이더를 좌우로 움직여 비교하세요</small></figcaption><div class="ba"><img src="/files/${before}" alt="${k.title} ${label} 치료 전" width="960" height="640"><img src="/files/${after}" alt="${k.title} ${label} 치료 후" width="960" height="640" class="after"><span class="ba-label l">BEFORE</span><span class="ba-label r">AFTER</span><span class="ba-handle" aria-hidden="true"></span><input type="range" min="0" max="100" value="50" aria-label="${label} 전후 비교"></div></figure>`
    return html`<figure class="reveal"><figcaption class="h3">${label} (${before ? '치료 전' : '치료 후'})</figcaption><img src="/files/${before || after}" alt="${k.title} ${label}" width="960" height="640" class="case-single" loading="lazy"></figure>`
  }
  const body = html`${pageHero({ eyebrow: `치료 전후 · ${t?.name || k.treatment_slug}`, title: k.title, crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }, { name: k.title, href: `/cases/gallery/${k.slug}` }] })}
<div class="container tx-layout">
  <article class="tx-body case-detail-grid">
    ${pair('구내 사진', k.intra_before, k.intra_after)}
    ${pair('파노라마 방사선', k.pano_before, k.pano_after)}
    <section class="prose reveal"><h2>치료 설명</h2>${k.description ? raw(autoLink(String(k.description).split(/\n{2,}|\n/).map((p: string) => `<p>${p.replace(/</g, '&lt;')}</p>`).join(''), { max: 5 })) : ''}</section>
    <p class="reviewed">본 사례는 해당 환자의 치료 결과이며 개인의 구강 상태에 따라 결과는 다를 수 있습니다. 환자 동의 하에 개인정보를 제외하고 게시하였으며, 무단 복제를 금합니다. 담당: ${d.name} ${d.title}.</p>
  </article>
  <aside class="tx-side">
    <div class="side-card"><p class="side-title">사례 정보</p><table class="meta-table"><tbody>
      <tr><th>진료</th><td>${t ? html`<a href="/treatments/${t.slug}">${t.name}</a>` : k.treatment_slug}</td></tr>
      ${k.age_group ? html`<tr><th>연령</th><td>${k.age_group}</td></tr>` : ''}${k.gender ? html`<tr><th>성별</th><td>${k.gender}</td></tr>` : ''}${k.region ? html`<tr><th>거주 지역</th><td>${k.region}</td></tr>` : ''}${k.duration ? html`<tr><th>치료 기간</th><td>${k.duration}</td></tr>` : ''}
      <tr><th>담당</th><td><a href="/doctors/${d.slug}">${d.name} ${d.title}</a></td></tr>
    </tbody></table></div>
    ${t ? html`<div class="side-card"><p class="side-title">이 진료 알아보기</p><p>${t.short}</p><a href="/treatments/${t.slug}" class="link-arrow">${t.name} 안내</a></div>` : ''}
    <div class="side-card side-cta"><p class="side-title">상담 예약</p><p class="side-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><a href="/reservation?treatment=${k.treatment_slug}" class="btn btn-primary btn-block">온라인 예약</a></div>
  </aside>
</div>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: `${k.title} — 치료 전후`, description: truncate(`${t?.name || ''} 치료 전후 사례. ${[k.age_group, k.gender, k.region, k.duration].filter(Boolean).join(' · ')}. ${k.description || ''}`), path: `/cases/gallery/${k.slug}`, image: k.intra_before ? `/files/${k.intra_before}` : undefined, type: 'article', crumbs: [{ name: '홈', href: '/' }, { name: '치료 전후', href: '/cases/gallery' }, { name: k.title, href: `/cases/gallery/${k.slug}` }] }, body))
})

// ── 원장 칼럼 ────────────────────────────────────────────
content.get('/column', async (c) => {
  const clinic = c.get('clinic') as any
  const tx = c.req.query('treatment') || ''
  const page = Math.min(10000, Math.max(1, Math.floor(Number(c.req.query('page')) || 1)))
  const w = tx ? 'published=1 AND treatment_slug=?' : 'published=1'; const args = tx ? [tx] : []
  const total = (await c.env.DB.prepare(`SELECT COUNT(*) n FROM columns WHERE ${w}`).bind(...args).first<any>())?.n || 0
  const rows = (await c.env.DB.prepare(`SELECT slug,title,excerpt,thumbnail,author_slug,treatment_slug,published_at,views FROM columns WHERE ${w} ORDER BY published_at DESC LIMIT ? OFFSET ?`).bind(...args, PER, (page - 1) * PER).all<any>()).results || []
  const [first, ...rest] = page === 1 ? rows : [null, ...rows]
  const card = (p: any) => html`<a href="/column/${p.slug}" class="post-card reveal">${p.thumbnail ? html`<div class="post-thumb"><img src="/files/${p.thumbnail}" alt="" width="640" height="400" loading="lazy" decoding="async"></div>` : ''}<div class="post-body"><p class="post-meta">${fmtDate(p.published_at)} · ${getDoctor(p.author_slug)?.name || ''} 원장${p.treatment_slug ? ` · ${getTreatment(p.treatment_slug)?.name || ''}` : ''}</p><h3>${p.title}</h3><p>${p.excerpt || ''}</p></div></a>`
  const body = html`${pageHero({ eyebrow: '원장 칼럼', title: html`진료실에서<br>못 다한 이야기`, lead: '상담 시간에 다 설명하지 못한 것들을 글로 남깁니다. 광고가 아니라 설명입니다.', crumbs: [{ name: '홈', href: '/' }, { name: '원장 칼럼', href: '/column' }] })}
<section class="section"><div class="container">
  <h2 class="sr-only">진료별 게시물 목록</h2>
  <nav class="faq-filter reveal in" aria-label="진료별 보기"><a href="/column" class="${!tx ? 'active' : ''}">전체</a>${treatments.map((t) => html`<a href="/column?treatment=${t.slug}" class="${tx === t.slug ? 'active' : ''}">${t.name}</a>`)}</nav>
  ${first ? html`<a href="/column/${first.slug}" class="post-featured reveal">${first.thumbnail ? html`<div class="post-thumb"><img src="/files/${first.thumbnail}" alt="" width="960" height="600" decoding="async"></div>` : ''}<div class="post-body"><p class="post-meta">${fmtDate(first.published_at)} · ${getDoctor(first.author_slug)?.name || ''} 원장</p><h2 class="h2">${first.title}</h2><p class="lead">${first.excerpt || ''}</p><span class="link-arrow">읽기</span></div></a>` : ''}
  ${rest.length ? html`<div class="post-grid">${rest.map(card)}</div>` : ''}
  ${!rows.length ? html`<section class="empty-content"><p class="edition-label">DODAM JOURNAL</p><h2>차근차근, 진료 이야기를 채워갑니다.</h2><p>이 분류에 아직 게시된 칼럼이 없습니다.<br>먼저 진료 안내에서 치아 건강에 필요한 정보를 살펴보세요.</p><a href="/treatments" class="editorial-link">진료 이야기 읽기 <span aria-hidden="true">↗</span></a></section>` : ''}
  ${paginate(`/column${tx ? `?treatment=${tx}` : ''}`, page, total, PER)}
</div></section>`
  return c.html(Layout(c, { title: '원장 칼럼', description: '서울도담치과 한휘림 원장이 진료실에서 못 다한 이야기를 씁니다. 생활치수치료, 신경치료, 잇몸관리, 임플란트, 사랑니에 대한 솔직한 설명.', path: '/column', noindex: !!tx || (page > 1 && !rows.length), crumbs: [{ name: '홈', href: '/' }, { name: '원장 칼럼', href: '/column' }] }, body))
})

content.get('/column/rss.xml', async (c) => {
  const clinic = c.get('clinic') as any, siteUrl = c.get('siteUrl')
  const rows = (await c.env.DB.prepare('SELECT slug,title,excerpt,published_at FROM columns WHERE published=1 ORDER BY published_at DESC LIMIT 30').all<any>()).results || []
  const x = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${x(clinic.shortName)} 원장 칼럼</title><link>${siteUrl}/column</link><description>${x(clinic.mission)}</description><language>ko</language>${rows.map((r: any) => `<item><title>${x(r.title)}</title><link>${siteUrl}/column/${r.slug}</link><guid>${siteUrl}/column/${r.slug}</guid><pubDate>${new Date(isoDate(r.published_at) || r.published_at).toUTCString()}</pubDate><description>${x(r.excerpt)}</description></item>`).join('')}</channel></rss>`
  return c.body(xml, 200, { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' })
})

content.get('/column/:slug', async (c) => {
  const clinic = c.get('clinic') as any, siteUrl = c.get('siteUrl')
  const p = await c.env.DB.prepare('SELECT * FROM columns WHERE slug=? AND published=1').bind(c.req.param('slug')).first<any>()
  if (!p) return c.notFound()
  await trackView(c, 'column', p.id, 'columns')
  const d = getDoctor(p.author_slug) || doctors[0], t = p.treatment_slug ? getTreatment(p.treatment_slug) : undefined
  const more = (await c.env.DB.prepare('SELECT slug,title,published_at FROM columns WHERE published=1 AND id<>? ORDER BY published_at DESC LIMIT 4').bind(p.id).all<any>()).results || []
  const tags = String(p.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  const body = html`<article class="container container-narrow article">
  <header class="article-head">
    <nav class="crumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/column">원장 칼럼</a></li><li aria-current="page">${p.title}</li></ol></nav>
    ${t ? html`<a href="/treatments/${t.slug}" class="tag green">${t.name}</a>` : ''}
    <h1 class="h1">${p.title}</h1>
    ${p.excerpt ? html`<p class="lead">${p.excerpt}</p>` : ''}
    <div class="article-author"><img src="${d.photoAvatar}" alt="${d.photoAlt}" ${imageAttrs(d.photoAvatar, '48px', 48, 48)}><div><strong><a href="/doctors/${d.slug}">${d.name} ${d.title}</a></strong><br><small>${d.specialty} · <time datetime="${isoDate(p.published_at)}">${fmtDate(p.published_at)}</time>${p.updated_at && p.updated_at.slice(0, 10) !== p.published_at.slice(0, 10) ? ` (수정 ${fmtDate(p.updated_at)})` : ''}</small></div><button type="button" class="btn btn-outline btn-sm" data-share>공유</button></div>
  </header>
  ${p.thumbnail ? html`<figure class="article-hero-img"><img src="/files/${p.thumbnail}" alt="" width="1200" height="700" fetchpriority="high" decoding="async"></figure>` : ''}
  <div class="article-body prose">${raw(autoLink(String(articleHtml(p.content_html)), { exclude: t ? [t.slug] : [], max: 10 }))}</div>
  <footer class="article-foot">
    ${tags.length ? html`<ul class="pill-list">${tags.map((s: string) => html`<li>#${s}</li>`)}</ul>` : ''}
    ${t ? html`<div class="summary-box"><h3>이 글과 관련된 진료</h3><p>${t.short}</p><a href="/treatments/${t.slug}" class="link-arrow">${t.name} 안내 보기</a></div>` : ''}
    <p class="reviewed">이 글은 일반적인 정보 제공을 위한 것으로 개인의 상태에 따라 다를 수 있습니다. 치료 효과를 보장하거나 다른 의료기관과 비교하는 내용은 포함하지 않습니다.</p>
    ${more.length ? html`<h2 class="h3">다른 글</h2><ul class="notice-list">${more.map((m: any) => html`<li class="notice-row"><a href="/column/${m.slug}">${m.title}</a><span class="date">${fmtDate(m.published_at)}</span></li>`)}</ul>` : ''}
  </footer>
</article>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: p.meta_title || p.title, description: p.meta_description || truncate(p.excerpt || stripTags(p.content_html)), path: `/column/${p.slug}`, image: p.thumbnail ? `/files/${p.thumbnail}` : undefined, type: 'article', reviewer: d, publishedAt: p.published_at, modifiedAt: p.updated_at, jsonld: [physicianLd(d, clinic, siteUrl), articleLd({ title: p.title, description: p.meta_description || p.excerpt || '', path: `/column/${p.slug}`, image: p.thumbnail ? `/files/${p.thumbnail}` : undefined, author: `${d.name}`, authorPath: `/doctors/${d.slug}`, publishedAt: p.published_at, modifiedAt: p.updated_at }, clinic, siteUrl)], crumbs: [{ name: '홈', href: '/' }, { name: '원장 칼럼', href: '/column' }, { name: p.title, href: `/column/${p.slug}` }] }, body))
})

// ── 공지사항 ─────────────────────────────────────────────
content.get('/notice', async (c) => {
  const page = Math.min(10000, Math.max(1, Math.floor(Number(c.req.query('page')) || 1)))
  const total = (await c.env.DB.prepare('SELECT COUNT(*) n FROM notices WHERE published=1').first<any>())?.n || 0
  const rows = (await c.env.DB.prepare('SELECT id,title,pinned,image,created_at FROM notices WHERE published=1 ORDER BY pinned DESC, created_at DESC LIMIT ? OFFSET ?').bind(20, (page - 1) * 20).all<any>()).results || []
  const body = html`${pageHero({ eyebrow: '공지사항', title: '병원 소식', lead: '휴진 안내, 진료시간 변경 등 병원 소식을 알려드립니다.', crumbs: [{ name: '홈', href: '/' }, { name: '공지사항', href: '/notice' }] })}
<section class="section"><div class="container container-narrow">
  ${rows.length ? html`<ul class="notice-list reveal in">${rows.map((n: any) => html`<li class="notice-row ${n.pinned ? 'pinned' : ''}">${n.pinned ? html`<span class="tag">공지</span>` : ''}<a href="/notice/${n.id}">${n.title}</a><span class="date">${fmtDate(n.created_at)}</span></li>`)}</ul>${paginate('/notice', page, total, 20)}` : html`<section class="empty-content"><p class="edition-label">CLINIC NEWS</p><h2>현재 등록된 공지가 없습니다.</h2><p>진료시간과 내원 안내는 아래에서 확인해 주세요.<br>방문 전 궁금한 점은 전화로 문의하실 수 있습니다.</p><a href="/hours" class="editorial-link">진료시간 확인하기 <span aria-hidden="true">↗</span></a></section>`}
</div></section>`
  return c.html(Layout(c, { title: '공지사항', description: '서울도담치과 공지사항. 휴진 안내, 진료시간 변경, 병원 소식.', path: '/notice', noindex: page > 1 && !rows.length, crumbs: [{ name: '홈', href: '/' }, { name: '공지사항', href: '/notice' }] }, body))
})

content.get('/notice/:id', async (c) => {
  const n = await c.env.DB.prepare('SELECT * FROM notices WHERE id=? AND published=1').bind(Number(c.req.param('id')) || 0).first<any>()
  if (!n) return c.notFound()
  await trackView(c, 'notice', n.id, 'notices')
  const body = html`<article class="container container-narrow article">
  <header class="article-head"><nav class="crumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/notice">공지사항</a></li><li aria-current="page">${n.title}</li></ol></nav>${n.pinned ? html`<span class="tag">대표 공지</span>` : ''}<h1 class="h1">${n.title}</h1><p class="post-meta"><time datetime="${isoDate(n.created_at)}">${fmtDate(n.created_at)}</time></p></header>
  ${n.image ? html`<figure class="article-hero-img"><img src="/files/${n.image}" alt="" width="1200" height="700" decoding="async"></figure>` : ''}
  <div class="article-body prose">${articleHtml(n.content_html)}</div>
  <footer class="article-foot"><a href="/notice" class="link-arrow">목록으로</a></footer>
</article>`
  return c.html(Layout(c, { title: n.title, description: truncate(stripTags(n.content_html)), path: `/notice/${n.id}`, image: n.image ? `/files/${n.image}` : undefined, type: 'article', crumbs: [{ name: '홈', href: '/' }, { name: '공지사항', href: '/notice' }, { name: n.title, href: `/notice/${n.id}` }] }, body))
})

// ── 예약 ─────────────────────────────────────────────────
function reservationForm(c: any, o: { error?: string; v?: Record<string, any>; ok?: boolean }) {
  const clinic = c.get('clinic') as any, user = c.get('user')
  const v = o.v || {}
  const tx = v.treatment || c.req.query('treatment') || ''
  const body = html`${pageHero({ eyebrow: '진료 예약', title: html`첫 만남의 시작은,<br>편안한 대화부터.`, lead: '어떤 치료가 필요한지 아직 모르셔도 괜찮습니다. 불편한 점과 편한 시간을 남겨주시면 확인 후 연락드리겠습니다.', crumbs: [{ name: '홈', href: '/' }, { name: '진료 예약', href: '/reservation' }], actions: html`<div class="reservation-progress" aria-label="예약 진행 순서"><span><b>01</b> 예약 신청</span><span><b>02</b> 병원 확인 연락</span><span><b>03</b> 일정 확정 · 내원</span></div>` })}
<section class="section-sm"><div class="container grid-2 reservation-grid res-grid">
  <div>
    ${o.ok ? html`<div class="form-card reservation-success center" role="status"><span class="success-mark" aria-hidden="true">✓</span><p class="edition-label">THANK YOU FOR REACHING OUT</p><h2>예약 신청이 접수되었습니다.</h2><p class="lead" style="margin-top:18px">진료시간 내에 확인 연락을 드리겠습니다.<br>병원과 통화하신 후 예약이 최종 확정됩니다.</p><div class="hero-actions" style="justify-content:center"><a href="/" class="btn btn-primary">홈으로 돌아가기</a>${user ? html`<a href="/auth/mypage" class="btn btn-outline">내 예약 보기</a>` : ''}</div></div>` : html`
    ${alertBox(o.error)}
    <form method="post" action="/reservation" id="reservation-form" class="form form-card" data-once>
      <div class="reservation-intro"><h2>예약 정보를 남겨주세요</h2><p>* 표시는 필수 항목입니다. 신청만으로 예약이 확정되지는 않습니다.</p></div>
      <div class="form-row">
        <div class="field"><label for="name">이름 <span class="req">*</span></label><input id="name" name="name" required maxlength="40" value="${v.name || user?.name || ''}" autocomplete="name"></div>
        <div class="field"><label for="phone">연락처 <span class="req">*</span></label><input id="phone" name="phone" type="tel" required inputmode="numeric" placeholder="010-0000-0000" value="${v.phone || ''}" autocomplete="tel"></div>
      </div>
      <div class="field"><label for="email">이메일 <small>(선택)</small></label><input id="email" name="email" type="email" value="${v.email || user?.email || ''}" autocomplete="email"></div>
      <div class="field"><label for="treatment">희망 진료</label><select id="treatment" name="treatment"><option value="">잘 모르겠어요 / 상담 먼저</option>${treatments.map((t) => html`<option value="${t.name}" ${tx === t.slug || tx === t.name ? 'selected' : ''}>${t.name}</option>`)}<option value="정기검진·스케일링" ${tx === '정기검진·스케일링' ? 'selected' : ''}>정기검진·스케일링</option></select></div>
      <div class="form-row">
        <div class="field"><label for="preferred_date">희망 날짜</label><input id="preferred_date" name="preferred_date" type="date" value="${v.preferred_date || ''}" min="${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)}"></div>
        <div class="field"><label for="preferred_time">희망 시간</label><select id="preferred_time" name="preferred_time">${['상관없음', '오전 (09:00–12:00)', '오후 (14:00–18:00)', '화요일 야간 (18:00–20:30)', '토요일 오전'].map((s) => html`<option ${v.preferred_time === s ? 'selected' : ''}>${s}</option>`)}</select></div>
      </div>
      <div class="field"><label for="message">증상·문의 내용</label><textarea id="message" name="message" rows="4" maxlength="1000" placeholder="예: 오른쪽 아래 어금니가 찬물에 시립니다. 다른 치과에서 신경치료를 권했는데 상담받고 싶습니다.">${v.message || ''}</textarea></div>
      <label class="check"><input type="checkbox" name="agree" value="1" required> <span>예약 확인 연락을 위한 <a href="/privacy" target="_blank">개인정보 수집·이용</a>에 동의합니다 (보유 1년)</span></label>
      <button type="submit" class="btn btn-primary btn-lg btn-block" data-loading="접수 중…">예약 신청하기 <span aria-hidden="true">↗</span></button>
    </form>`}
  </div>
  <aside class="res-side" aria-label="예약 및 첫 방문 안내">
    <div class="info-card info-card-cta"><h3>빠른 문의는 전화로</h3><p class="info-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><p>진료 시간 내 전화가 가장 빠릅니다. 통증이 심하시면 전화로 먼저 말씀해 주세요.</p><a href="${clinic.channels.kakao}" target="_blank" rel="noopener" class="btn btn-light btn-sm">카카오톡 채널 상담</a></div>
    <div class="info-card" style="margin-top:16px"><h3>진료시간</h3><table class="hours-table"><tbody>${clinic.hours.map((h: any) => html`<tr data-day="${h.day}"><th>${h.day}</th><td>${h.open ? `${h.open} – ${h.close}` : html`<span class="closed">휴진</span>`}</td><td class="note">${h.note || (h.lunch ? `점심 ${h.lunch}` : '')}</td></tr>`)}</tbody></table><p class="hint">${clinic.hoursNote}</p></div>
    <div class="info-card" style="margin-top:16px"><h3>첫 방문 준비</h3><ul class="info-list"><li>신분증 (건강보험 확인)</li><li>복용 중인 약 이름</li><li>다른 병원 방사선 사진 (있다면)</li></ul></div>
  </aside>
</div></section>`
  return c.html(Layout(c, { title: '진료 예약', description: `서울도담치과 온라인 진료 예약. 이름·연락처·희망 일시를 남기시면 확인 후 연락드립니다. 전화 ${clinic.phone}. 화요일 야간진료.`, path: '/reservation', crumbs: [{ name: '홈', href: '/' }, { name: '진료 예약', href: '/reservation' }] }, body))
}
content.get('/reservation', (c) => reservationForm(c, { ok: c.req.query('ok') === '1' }))
content.post('/reservation', async (c) => {
  const f = await formData(c)
  const name = String(f.name || '').trim(), phone = normPhone(String(f.phone || '')), email = String(f.email || '').trim().toLowerCase()
  if (!name || phone.replace(/\D/g, '').length < 9) return reservationForm(c, { error: '이름과 연락처를 확인해 주세요.', v: f })
  if (email && !isEmail(email)) return reservationForm(c, { error: '이메일 형식을 확인해 주세요.', v: f })
  if (!f.agree) return reservationForm(c, { error: '개인정보 수집·이용 동의가 필요합니다.', v: f })
  // 간단 스팸 방지: 동일 번호 10분 내 3회 이상
  const recent = await c.env.DB.prepare("SELECT COUNT(*) n FROM reservations WHERE phone=? AND created_at > datetime('now','-10 minutes')").bind(phone).first<any>()
  if ((recent?.n || 0) >= 3) return reservationForm(c, { error: '잠시 후 다시 시도해 주세요.', v: f })
  const user = c.get('user')
  await c.env.DB.prepare('INSERT INTO reservations (name, phone, email, treatment, preferred_date, preferred_time, message, user_id) VALUES (?,?,?,?,?,?,?,?)').bind(name, phone, email || null, f.treatment || null, f.preferred_date || null, f.preferred_time || null, String(f.message || '').slice(0, 1000) || null, user?.id || null).run()
  // 이메일 알림 (Resend)
  if (c.env.RESEND_API_KEY && c.env.NOTIFICATION_EMAIL) {
    const clinic = c.get('clinic') as any
    const esc = (s: any) => String(s ?? '').replace(/</g, '&lt;')
    const send = fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: `${clinic.shortName} 예약 <onboarding@resend.dev>`, to: [c.env.NOTIFICATION_EMAIL], subject: `[예약 신청] ${name} · ${f.treatment || '상담'} · ${f.preferred_date || '날짜 미정'}`, html: `<h2>새 예약 신청</h2><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>이름</th><td>${esc(name)}</td></tr><tr><th>연락처</th><td>${esc(phone)}</td></tr><tr><th>이메일</th><td>${esc(email)}</td></tr><tr><th>희망 진료</th><td>${esc(f.treatment)}</td></tr><tr><th>희망 일시</th><td>${esc(f.preferred_date)} ${esc(f.preferred_time)}</td></tr><tr><th>내용</th><td>${esc(f.message).replace(/\n/g, '<br>')}</td></tr></table><p><a href="${c.get('siteUrl')}/admin/reservations">관리자에서 보기</a></p>` }) }).catch(() => {})
    c.executionCtx?.waitUntil?.(send)
  }
  return c.redirect('/reservation?ok=1')
})

export default content
