import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { dentistLd, webpageSpeakableLd, faqLd } from '../lib/seo'
import { coreTreatments, otherTreatments } from '../data/treatments'
import { doctors } from '../data/doctors'
import { faqList } from '../lib/ui'
import { fmtDate } from '../lib/util'

type Post = { slug: string; title: string; excerpt: string; thumbnail: string | null; published_at: string }
type Notice = { id: number; title: string; created_at: string }
const arrow = html`<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>`

export async function homePage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const dr = doctors[0]
  let posts: Post[] = [], notice: Notice | null = null
  try {
    posts = (await c.env.DB.prepare('SELECT slug, title, excerpt, thumbnail, published_at FROM columns WHERE published=1 ORDER BY published_at DESC LIMIT 3').all<Post>()).results || []
    notice = await c.env.DB.prepare('SELECT id, title, created_at FROM notices WHERE published=1 ORDER BY pinned DESC, created_at DESC LIMIT 1').first<Notice>()
  } catch { /* Preview also works before database migrations. */ }
  const care = [
    { en: 'PRESERVE', title: html`살릴 수 있다면,<br>한 번 더 살펴봅니다.`, text: '신경치료를 결정하기 전에, 치아 속 살아 있는 신경을 보존할 수 있는지 먼저 확인합니다.', image: 'one-fil-putty-mta', caption: '자연치아 보존을 위한 One-Fil Putty MTA', chips: ['MTA 생활치수치료', '러버댐 격리', '큐레이 진단'] },
    { en: 'PROTECT', title: html`치아를 지탱하는 힘,<br>잇몸부터 지킵니다.`, text: '치아를 오래 쓰려면 그 아래 잇몸이 건강해야 합니다. 잇몸 상태에 맞는 치료와 꾸준한 관리를 함께 계획합니다.', image: 'warm-water-scaling-system', caption: '시린 느낌을 줄이기 위한 미온수 스케일링 시스템', chips: ['잇몸치료', '미온수 스케일링', '정기검진'] },
    { en: 'RESTORE', title: html`꼭 필요한 자리에는,<br>신중한 임플란트.`, text: '보존이 어려운 치아라면, 뼈와 신경의 위치부터 확인합니다. 구강 상태에 맞는 치료 방법을 충분히 설명드립니다.', image: 'vatech-green16-low-dose-ct', caption: '입체적인 진단을 위한 Vatech Green16 저선량 CT', chips: ['3차원 CT 진단', '치료 계획', '사후관리'] },
  ]
  const faqs = [
    { q: '어떤 치료가 필요한지 몰라도 예약할 수 있나요?', a: '네. 불편한 부분이나 궁금한 점을 알려주세요. 검진 후 현재 상태와 가능한 치료 방법을 설명드립니다. 온라인 예약은 병원에서 확인하고 연락드린 후 확정됩니다.' },
    { q: '신경치료 대신 치아 신경을 살릴 수도 있나요?', a: '치수의 상태에 따라 MTA 생활치수치료를 고려할 수 있습니다. 모든 치아에 가능한 것은 아니며, 검사와 진단을 통해 보존 가능성을 먼저 확인합니다.' },
    { q: '치과 치료가 무서워요. 미리 말씀드려도 될까요?', a: '물론입니다. 불안한 부분을 먼저 말씀해 주세요. 치료 과정을 충분히 설명하고 마취크림, 마취액 워머, 전동 마취기 등을 상황에 맞게 사용합니다. 통증의 정도는 개인마다 다를 수 있습니다.' },
    { q: '퇴근 후에도 진료받을 수 있나요?', a: '화요일은 오후 2시부터 오후 8시 30분까지 진료합니다. 공휴일이나 임시 휴진 여부는 공지사항 또는 전화로 확인해 주세요.' },
  ]
  const body = html`
<section class="editorial-hero" id="hero-section" aria-labelledby="hero-title">
  <div class="container hero-editorial-grid">
    <div class="hero-editorial-copy">
      <p class="edition-label"><span class="status-dot"></span> SEOUL DODAM DENTAL CLINIC</p>
      <h1 id="hero-title">오래도록,<br><em>내 치아로</em><br>살아가도록<span class="title-period">.</span></h1>
      <p class="hero-description">이해될 때까지 설명하고,<br>필요한 만큼만 치료합니다.</p>
      <div class="hero-links"><a href="/mission" class="editorial-link">도담의 진료 철학 <span>${arrow}</span></a><a href="/reservation" class="hero-reserve">첫 방문 예약</a></div>
      <p class="hero-location">수원 화서동 <span>·</span> 통합치의학과 전문의 직접 진료</p>
    </div>
    <figure class="hero-editorial-photo">
      <img src="${dr.photo}" alt="차분한 미소로 맞이하는 서울도담치과 한휘림 대표원장" width="2000" height="1333" fetchpriority="high" decoding="async">
      <div class="photo-corner" aria-hidden="true">A little more care.<br>A lifetime of smiles.</div>
      <figcaption><div><span>당신의 치아를 함께 고민하는 사람</span><strong>한휘림 <small>대표원장</small></strong></div><a href="/doctors/${dr.slug}" aria-label="한휘림 원장 소개 보기">${arrow}</a></figcaption>
      <span class="photo-index" aria-hidden="true">01 — THE DENTIST</span>
    </figure>
  </div>
  <div class="container hero-bottom"><a href="#dodam-philosophy" class="scroll-cue"><span>SCROLL TO DISCOVER</span><svg width="12" height="28" viewBox="0 0 12 28" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 0v25M1 20l5 6 5-6"/></svg></a><p>자연치아의 가치를 아는 치과, <strong>서울도담치과</strong></p><span class="hero-coordinate" aria-hidden="true">SUWON · HWASEO</span></div>
</section>

<nav class="quick-visit" aria-label="빠른 내원 안내"><div class="container quick-visit-grid">
  <a href="/hours"><span class="quick-number">01</span><div><small>퇴근 후에도 여유 있게</small><strong>화요일 야간진료 <b>20:30</b></strong></div>${arrow}</a>
  <a href="/directions"><span class="quick-number">02</span><div><small>수원 화서동 신우상가 2층</small><strong>오시는 길 · 주차 안내</strong></div>${arrow}</a>
  <a href="tel:${clinic.phoneTel}"><span class="quick-number">03</span><div><small>궁금한 점은 편하게 물어보세요</small><strong>${clinic.phone}</strong></div>${arrow}</a>
</div></nav>

<section class="philosophy-editorial" id="dodam-philosophy" aria-labelledby="philosophy-title">
  <div class="container">
    <div class="section-kicker"><span>01 / OUR PHILOSOPHY</span><span>도담이 진료하는 방식</span></div>
    <div class="philosophy-intro"><h2 id="philosophy-title" class="reveal">더하는 치료보다,<br><span>남기는 진료를</span><br>먼저 생각합니다.</h2><div class="philosophy-aside reveal"><p>한 번 손대기 전에, 한 번 더 생각하는 것.<br>치아는 재생되지 않기에<br>도담의 진료는 그 신중함에서 시작됩니다.</p><a href="/mission" class="editorial-link light">우리가 지키는 기준 <span>${arrow}</span></a></div></div>
    <div class="principle-lines stagger">
      <article><span class="principle-index">01</span><h3>충분히 설명하고</h3><p>사진을 함께 보며 지금 어떤 상태인지,<br>왜 치료가 필요한지 설명합니다.</p></article>
      <article><span class="principle-index">02</span><h3>가능성을 살피고</h3><p>치아와 신경을 보존할 수 있는 방법을<br>먼저 검토합니다.</p></article>
      <article><span class="principle-index">03</span><h3>필요한 만큼만</h3><p>진단을 바탕으로 필요한 치료와<br>지켜볼 수 있는 부분을 구분합니다.</p></article>
    </div>
    <div class="philosophy-wordmark" aria-hidden="true">Less, but <i>better.</i></div>
  </div>
</section>

<section class="section care-editorial" id="core-treatments" aria-labelledby="care-title">
  <div class="container">
    <div class="section-kicker"><span>02 / OUR TREATMENTS</span><span>자연치아에서 시작하는 진료</span></div>
    <div class="section-heading-row reveal"><h2 id="care-title" class="display-heading">지키고, 살리고.<br>그다음을 생각합니다.</h2><p>치료의 이름보다 중요한 건 순서입니다.<br>내 치아를 오래 쓰기 위한 선택을 함께합니다.</p></div>
    <div class="care-tabs" aria-label="핵심 진료 선택">
      ${coreTreatments.map((t, i) => html`<button type="button" id="care-tab-${i}" class="care-tab ${i === 0 ? 'active' : ''}" data-care-index="${i}" aria-controls="care-panel-${i}"><span>0${i + 1}</span>${t.name}<span class="care-tab-arrow">↗</span></button>`)}
    </div>
    ${coreTreatments.map((t, i) => html`<article class="care-panel" id="care-panel-${i}" aria-labelledby="care-tab-${i}">
      <div class="care-panel-copy"><p class="care-english">${care[i].en}</p><h3>${care[i].title}</h3><p class="care-description">${care[i].text}</p><ul class="care-chips">${care[i].chips.map(x => html`<li>${x}</li>`)}</ul><a href="/treatments/${t.slug}" class="editorial-link">${t.name} 알아보기 <span>${arrow}</span></a><p class="care-disclaimer">개인의 구강 상태에 따라 적합한 치료 방법과 결과는 달라질 수 있습니다.</p></div>
      <figure class="care-panel-photo"><img src="/static/img/${care[i].image}.webp" alt="${care[i].caption}" width="800" height="600" loading="lazy" decoding="async"><figcaption><span>IN OUR CLINIC</span>${care[i].caption}</figcaption><span class="care-photo-number" aria-hidden="true">0${i + 1}</span></figure>
    </article>`)}
    <div class="treatment-directory"><p>일상의 작은 불편까지,<br><strong>도담에서 함께.</strong></p><div>${otherTreatments.map(t => html`<a href="/treatments/${t.slug}">${t.name}<span aria-hidden="true">↗</span></a>`)}</div></div>
  </div>
</section>

<section class="doctor-editorial" id="doctor-story" aria-labelledby="doctor-title">
  <div class="container doctor-editorial-grid">
    <figure class="doctor-editorial-photo reveal"><img src="/static/img/dr-han-hwirim-standing.webp" alt="흰 가운을 입은 한휘림 대표원장" width="1600" height="2400" loading="lazy" decoding="async"><figcaption><span>HAN HWI-RIM</span>통합치의학과 전문의</figcaption></figure>
    <div class="doctor-editorial-copy reveal"><p class="edition-label">03 / MEET YOUR DENTIST</p><p class="doctor-pretitle">통증에 예민한 치과의사라서</p><h2 id="doctor-title">치료의 두려움도,<br>먼저 이해합니다.</h2><p class="doctor-story-copy">“제가 받기 싫은 치료는<br>환자분께도 하지 않습니다.”</p><p class="doctor-story-description">치료가 무서운 마음을 알기에, 작은 불편도 그냥 넘기지 않습니다. 충분한 설명과 세심한 배려로 진료의 처음부터 끝까지 함께하겠습니다.</p><div class="doctor-signoff"><strong>${dr.name}</strong><span>${dr.title} / ${dr.specialty}</span></div><ul class="doctor-credentials">${dr.license.map(x=>html`<li>${x}</li>`)}<li>단국대학교 치과대학 졸업</li></ul><a href="/doctors/${dr.slug}" class="editorial-link">한휘림 원장의 이야기 <span>${arrow}</span></a></div>
  </div>
</section>

<section class="section space-editorial" id="clinic-space" aria-labelledby="space-title">
  <div class="container">
    <div class="section-kicker"><span>04 / THE SPACE & CARE</span><span>보이지 않는 곳까지 세심하게</span></div>
    <div class="section-heading-row reveal"><h2 id="space-title" class="display-heading">편안한 공간,<br>흔들림 없는 기본.</h2><div><p>들어서는 순간의 편안함부터<br>진료 직전 새로 개봉하는 기구까지.<br>작은 부분에도 진료의 마음을 담습니다.</p><a href="/floor-guide" class="text-link">공간과 감염관리 살펴보기 ${arrow}</a></div></div>
    <div class="space-composition"><figure class="space-main reveal"><img src="/static/img/suwon-dodam-dental-reception-desk.webp" alt="서울도담치과 접수 데스크와 대기 공간" width="1619" height="971" loading="lazy" decoding="async"><figcaption><span>01 / RECEPTION</span>편안하게 맞이하는 공간</figcaption></figure><figure class="space-secondary reveal"><img src="/static/img/suwon-dodam-dental-treatment-room.webp" alt="서울도담치과의 자연광이 들어오는 진료실" width="713" height="541" loading="lazy" decoding="async"><figcaption><span>02 / TREATMENT ROOM</span>당신의 진료에 집중하는 공간</figcaption></figure></div>
    <div class="care-standards stagger"><a href="/floor-guide#equip-진단"><span>01</span><h3>진단부터 차근차근</h3><p>저선량 CT · 큐레이 진단</p>${arrow}</a><a href="/floor-guide#equip-무통"><span>02</span><h3>작은 통증도 세심하게</h3><p>마취액 워머 · 전동 마취기</p>${arrow}</a><a href="/floor-guide#sterilization"><span>03</span><h3>보이지 않는 기본까지</h3><p>Class B 멸균 · 기구별 밀봉</p>${arrow}</a></div>
  </div>
</section>

<section class="section home-questions" id="home-faq"><div class="container questions-grid"><div class="reveal"><p class="edition-label">05 / BEFORE YOUR VISIT</p><h2 class="display-heading">처음 오시는 날,<br>마음이 놓이도록.</h2><p class="questions-intro">진료실 문을 열기 전에 궁금했던 이야기.</p><a href="/faq" class="editorial-link">자주 묻는 질문 전체 보기 <span>${arrow}</span></a></div><div class="reveal">${faqList(faqs)}</div></div></section>

<section class="section journal-editorial" id="latest-columns"><div class="container"><div class="section-kicker"><span>${posts.length ? 'DODAM JOURNAL' : 'DODAM GUIDE'}</span><span>알수록 편안해지는 치과 이야기</span></div><div class="section-heading-row reveal"><h2 class="display-heading">${posts.length ? html`진료실에서<br>못다 한 이야기.` : html`알아두면 좋은,<br>내 치아 이야기.`}</h2><a href="${posts.length ? '/column' : '/treatments'}" class="editorial-link">${posts.length ? '칼럼 전체 보기' : '진료 안내 전체 보기'} <span>${arrow}</span></a></div><div class="journal-list stagger">${(posts.length ? posts.map(p => ({ href: `/column/${p.slug}`, meta: `DENTAL JOURNAL · ${fmtDate(p.published_at)}`, title: p.title, excerpt: p.excerpt })) : coreTreatments.map(t => ({ href: `/treatments/${t.slug}`, meta: `TREATMENT GUIDE · ${t.name}`, title: t.heroTitle, excerpt: t.short }))).map((p,i)=>html`<a href="${p.href}" class="journal-row"><span class="journal-index">0${i+1}</span><div><p class="journal-date">${p.meta}</p><h3>${p.title}</h3><p>${p.excerpt || '자연치아를 오래 지키기 위한 이야기를 전합니다.'}</p></div><span class="journal-arrow">${arrow}</span></a>`)}</div></div></section>

<section class="section visit-editorial" id="visit-info" aria-labelledby="visit-title"><div class="container">
  <div class="section-kicker"><span>YOUR FIRST VISIT</span><span>만나 뵙겠습니다</span></div>
  <div class="visit-grid"><div class="visit-address reveal"><h2 id="visit-title" class="display-heading">가까이에서,<br>오래 함께.</h2><p>${clinic.address}</p><a href="tel:${clinic.phoneTel}" class="visit-phone">${clinic.phone}</a><div class="hero-links"><a href="/directions" class="editorial-link">오시는 길 · 주차 안내 <span>${arrow}</span></a></div><div class="visit-note"><span>온라인 예약 안내</span><p>예약 신청 후 병원에서 확인 연락을 드립니다.<br>내원 일정은 연락 후 확정됩니다.</p></div></div><div class="visit-hours reveal"><h3>진료시간 <span>OPENING HOURS</span></h3><table class="hours-table"><caption class="sr-only">서울도담치과 요일별 진료시간</caption><tbody>${clinic.hours.map((h:any)=>html`<tr data-day="${h.day}"><th scope="row">${h.day}요일</th><td>${h.open ? `${h.open} — ${h.close}` : html`<span class="closed">휴진</span>`}</td><td class="note">${h.note || (h.lunch ? `점심 ${h.lunch}` : '')}</td></tr>`)}</tbody></table><p class="hint">${clinic.hoursNote}</p><a href="/reservation" class="btn btn-primary btn-block visit-reserve">첫 방문 예약하기 ${arrow}</a></div></div>
  ${notice ? html`<a href="/notice/${notice.id}" class="editorial-notice"><span>NOTICE</span><strong>${notice.title}</strong><time>${fmtDate(notice.created_at)}</time>${arrow}</a>` : ''}
</div></section>`
  return c.html(Layout(c, {
    title: `${clinic.shortName} | 오래도록, 내 치아로 살아가도록`,
    description: `수원 화서동 서울도담치과. 통합치의학과 전문의 한휘림 대표원장이 충분히 설명하고 필요한 만큼 치료합니다. MTA 생활치수치료·잇몸치료·임플란트. 화요일 야간진료 20:30. ${clinic.phone}`,
    path: '/', bodyClass: 'home-page', image: dr.photo,
    jsonld: [dentistLd(clinic, siteUrl), webpageSpeakableLd('/', siteUrl, clinic.name), faqLd(faqs)],
  }, body))
}
