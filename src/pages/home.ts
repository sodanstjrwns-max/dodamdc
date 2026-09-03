import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { dentistLd, webpageSpeakableLd } from '../lib/seo'
import { coreTreatments, otherTreatments } from '../data/treatments'
import { doctors } from '../data/doctors'
import { reviewLine } from '../lib/ui'
import { fmtDate } from '../lib/util'

type Post = { slug: string; title: string; excerpt: string; thumbnail: string | null; published_at: string }
type Notice = { id: number; title: string; created_at: string }

export async function homePage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const dr = doctors[0]
  let posts: Post[] = []
  let notice: Notice | null = null
  try {
    const r = await c.env.DB.prepare('SELECT slug, title, excerpt, thumbnail, published_at FROM columns WHERE published=1 ORDER BY published_at DESC LIMIT 3').all<Post>()
    posts = r.results || []
    notice = await c.env.DB.prepare('SELECT id, title, created_at FROM notices WHERE published=1 ORDER BY pinned DESC, created_at DESC LIMIT 1').first<Notice>()
  } catch { /* 마이그레이션 전 */ }

  const coreImgs = ['/static/img/one-fil-putty-mta.webp', '/static/img/warm-water-scaling-system.webp', '/static/img/vatech-green16-low-dose-ct.webp']
  const coreLabels = ['One-Fil Putty MTA · 큐레이 · 러버댐', '미온수 스케일링 · 30대 치주관리', 'Vatech Green16 저선량 CT · 가이드 수술']

  const pillars = [
    { n: '01', t: '이해될 때까지 설명합니다', d: '지금 무엇을 왜 하는지 모르면 치료는 두렵습니다. 방사선·큐레이 사진을 함께 보며, 이해되실 때까지 설명한 뒤에 시작합니다.' },
    { n: '02', t: '필요한 만큼만 치료합니다', d: '치아는 재생되지 않습니다. 살릴 방법이 하나라도 남아 있으면 그것부터 합니다. 처음부터 발치를 말씀드리는 경우는 거의 없습니다.' },
    { n: '03', t: '아픈 지점을 하나씩 없앱니다', d: '마취크림, 마취액 워머, 무통마취기, 미온수 스케일링. 통증에 예민한 원장이 자신이 받기 싫은 순간을 하나씩 찾아 제거해 왔습니다.' },
    { n: '04', t: '겉은 소박해도 안은 다릅니다', d: '상가 2층의 작은 치과지만 저선량 CT, Class B 고압멸균기, 플라즈마 소독기, 기구별 밀봉 포장까지 대학병원 기준으로 갖췄습니다.' },
  ]

  const marquee = ['MTA 생활치수치료', '러버댐 신경치료', '큐레이 충치 진단', '미온수 스케일링', '무통 마취 시스템', '저선량 CT', 'Class B 멸균', '화요일 야간진료', '통합치의학과 전문의', '사랑니는 필요할 때만']

  const body = html`
<section class="hero" id="hero-section">
  <div class="hero-media"><img src="/static/img/suwon-dodam-dental-operatory.webp" alt="서울도담치과 진료실" width="1600" height="1000" fetchpriority="high" decoding="async"></div>
  <div class="hero-grid" aria-hidden="true"></div>
  <div class="container hero-inner">
    <p class="eyebrow light reveal in">수원 화서동 · 통합치의학과 전문의 진료</p>
    <h1 class="hero-title">
      <span class="line"><span>이해될 때까지 설명하고,</span></span>
      <span class="line"><span>필요한 만큼만 <em>치료합니다.</em></span></span>
    </h1>
    <p class="hero-lead reveal in">치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 시작하는 치과, 서울도담치과입니다.</p>
    <div class="hero-actions reveal in">
      <a href="/reservation" class="btn btn-accent btn-lg">진료 예약하기</a>
      <a href="/treatments" class="btn btn-ghost-light btn-lg">진료 안내 보기</a>
    </div>
  </div>
  <div class="hero-meta">
    <div class="container hero-meta-inner">
      <div class="hero-meta-item"><strong>화요일 야간진료</strong><span>14:00 – 20:30</span></div>
      <div class="hero-meta-item"><strong>수요일 점심시간 없이</strong><span>09:00 – 18:00</span></div>
      <div class="hero-meta-item"><strong>${clinic.reviews.count.toLocaleString('ko-KR')}개</strong><span>${clinic.reviews.source} (${clinic.reviews.asOf} 기준)</span></div>
      <div class="hero-meta-item"><strong>1호선 화서역</strong><span>도보 약 10분 · 신우상가 2층</span></div>
    </div>
  </div>
  <a href="#pillars" class="hero-scroll" aria-label="아래로 스크롤"><span></span></a>
</section>

${notice ? html`<a href="/notice/${notice.id}" class="notice-bar"><span class="tag">공지</span><span class="notice-bar-title">${notice.title}</span><span class="notice-bar-date">${fmtDate(notice.created_at)}</span></a>` : ''}

<section class="section" id="pillars">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">병원 미션</p>
      <h2 class="h2">${clinic.mission}</h2>
    </div>
    <div class="pillars stagger">
      ${pillars.map((p) => html`<article class="pillar"><span class="pillar-num">${p.n}</span><h3>${p.t}</h3><p>${p.d}</p></article>`)}
    </div>
    <p class="section-more reveal"><a href="/mission" class="link-arrow">병원 미션 자세히 보기</a></p>
  </div>
</section>

<section class="section section-bg" id="core-treatments">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">도담이 가장 잘하는 진료</p>
      <h2 class="h2">발치까지 가지 않기 위한<br>세 가지 순서</h2>
      <p class="lead">신경을 살리고, 잇몸을 지키고, 그래도 어려울 때 임플란트. 순서를 지키는 것이 치아 수명을 늘립니다.</p>
    </div>
    <div class="core-seq">
      <div class="core-sticky">
        <div class="core-sticky-img">
          ${coreImgs.map((s, i) => html`<img src="${s}" alt="${coreTreatments[i].name}" width="800" height="600" class="${i === 0 ? 'active' : ''}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">`)}
        </div>
        <p class="core-sticky-label">${coreLabels[0]}</p>
      </div>
      <div class="core-steps">
        ${coreTreatments.map(
          (t, i) => html`<a class="core-step ${i === 0 ? 'active' : ''}" data-index="${i}" data-label="${coreLabels[i]}" href="/treatments/${t.slug}">
            <span class="num">0${i + 1}</span>
            <h3>${t.name}</h3>
            <p class="core-step-title">${t.heroTitle}</p>
            <p>${t.short}</p>
            <span class="link-arrow">자세히 보기</span>
          </a>`,
        )}
      </div>
    </div>
  </div>
</section>

<section class="section" id="doctor-band">
  <div class="container doctor-band">
    <div class="doctor-band-img reveal-left">
      <img src="${dr.photoCutout}" alt="${dr.photoAlt}" width="720" height="900" loading="lazy" decoding="async">
      <p class="doctor-band-caption">${dr.name} ${dr.title} · ${dr.specialty}</p>
    </div>
    <div class="doctor-band-text reveal-right">
      <p class="eyebrow">의료진</p>
      <blockquote class="quote">“${dr.quote}”</blockquote>
      <p>${dr.story[2].body}</p>
      <ul class="cred-list">
        ${dr.license.map((l) => html`<li>${l}</li>`)}
        ${dr.education.slice(1).map((l) => html`<li>${l}</li>`)}
        <li>${dr.societies[0]}</li>
      </ul>
      <a href="/doctors/${dr.slug}" class="btn btn-primary">한휘림 원장 소개</a>
    </div>
  </div>
</section>

<section class="stats" id="stats">
  <div class="container">
    <div class="grid-4 stagger">
      <div class="stat"><div class="stat-num"><span class="count" data-to="${clinic.reviews.count}">0</span><small>개</small></div><p class="stat-label">${clinic.reviews.source}</p><p class="stat-note">${clinic.reviews.asOf} 기준</p></div>
      <div class="stat"><div class="stat-num"><span class="count" data-to="20" data-dec="0">0</span><small>:30</small></div><p class="stat-label">화요일 야간진료</p><p class="stat-note">직장인·학생 방문 가능</p></div>
      <div class="stat"><div class="stat-num"><span class="count" data-to="6">0</span><small>개월</small></div><p class="stat-label">정기 큐레이 검진 주기</p><p class="stat-note">소아는 3개월</p></div>
      <div class="stat"><div class="stat-num"><span class="count" data-to="134">0</span><small>°C</small></div><p class="stat-label">Class B 고압멸균</p><p class="stat-note">기구별 밀봉 포장</p></div>
    </div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee-track">${[...marquee, ...marquee].map((m) => html`<span class="marquee-item">${m}</span>`)}</div></div>

<section class="section" id="all-treatments">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">진료 과목</p>
      <h2 class="h2">한 곳에서, 순서대로</h2>
      <p class="lead">교정·수면진료·보톡스는 시행하지 않습니다. 대신 하는 진료는 끝까지 책임지고 봅니다.</p>
    </div>
    <div class="tx-grid stagger">
      ${otherTreatments.map((t) => html`<a href="/treatments/${t.slug}" class="tx-item"><span class="tag ${t.category === '자연치아 보존' ? 'green' : 'gray'}">${t.category}</span><h3>${t.name}</h3><p>${t.short}</p><span class="link-arrow">자세히</span></a>`)}
    </div>
  </div>
</section>

<section class="section section-warm" id="equipment-teaser">
  <div class="container split">
    <div class="split-img reveal-left"><img src="/static/img/sterilized-handpiece-cassettes.webp" alt="기구별 밀봉 포장된 멸균 핸드피스 카세트" width="960" height="720" loading="lazy" decoding="async"></div>
    <div class="reveal-right">
      <p class="eyebrow">장비 · 감염관리</p>
      <h2 class="h2">겉은 소박해도,<br>안은 다릅니다</h2>
      <p class="lead">Vatech Green16 저선량 CT, Morita 근관장 측정기, 초음파 근관세정, Class B 진공 고압멸균기, 플라즈마 소독기. 환자마다 기구를 새로 개봉합니다.</p>
      <a href="/floor-guide" class="btn btn-outline">장비·감염관리 둘러보기</a>
    </div>
  </div>
</section>

<section class="review-band" id="reviews">
  <div class="container">
    <div class="section-head center reveal">
      <p class="eyebrow">환자분들의 이야기</p>
      <h2 class="h2">${reviewLine(clinic)}</h2>
      <p class="lead">후기는 광고가 아니라 저희가 다음 환자분께 지켜야 할 약속입니다. 원장이 직접 읽고 기억하는 몇 가지를 남깁니다.</p>
    </div>
    <div class="review-cards stagger">
      <blockquote class="review-card"><p>“치료 전 사진을 보여주며 설명해주셔서 처음으로 왜 이 치료가 필요한지 이해했다는 말씀을 들었습니다. 저희가 가장 듣고 싶은 말입니다.”</p><cite>— 한휘림 원장이 기억하는 후기</cite></blockquote>
      <blockquote class="review-card"><p>“다른 곳에서 신경치료를 권했는데 여기서는 살려보자고 했다는 이야기. 모든 치아에 가능한 건 아니지만, 가능하면 저희는 그 길을 먼저 봅니다.”</p><cite>— 한휘림 원장이 기억하는 후기</cite></blockquote>
      <blockquote class="review-card"><p>“마취가 아프지 않았다는 말씀은 통증에 예민한 저에게 가장 큰 보람입니다. 워머와 무통마취기, 그리고 기다림의 결과입니다.”</p><cite>— 한휘림 원장이 기억하는 후기</cite></blockquote>
    </div>
    <p class="center reveal"><a href="${clinic.channels.naverPlace}" target="_blank" rel="noopener" class="link-arrow">네이버 플레이스에서 리뷰 보기</a></p>
  </div>
</section>

${posts.length ? html`<section class="section" id="latest-columns">
  <div class="container">
    <div class="section-head reveal">
      <p class="eyebrow">원장 칼럼</p>
      <h2 class="h2">진료실에서 못 다한 이야기</h2>
    </div>
    <div class="post-grid stagger">
      ${posts.map((p) => html`<a href="/column/${p.slug}" class="post-card">${p.thumbnail ? html`<div class="post-thumb"><img src="/files/${p.thumbnail}" alt="" width="640" height="400" loading="lazy"></div>` : ''}<div class="post-body"><p class="post-meta">${fmtDate(p.published_at)}</p><h3>${p.title}</h3><p>${p.excerpt || ''}</p></div></a>`)}
    </div>
    <p class="section-more reveal"><a href="/column" class="link-arrow">칼럼 전체 보기</a></p>
  </div>
</section>` : ''}

<section class="section section-bg" id="visit-info">
  <div class="container info-grid stagger">
    <div class="info-card">
      <h3>진료시간</h3>
      <table class="hours-table"><tbody>
        ${clinic.hours.map((h: any) => html`<tr data-day="${h.day}"><th>${h.day}</th><td>${h.open ? `${h.open} – ${h.close}` : html`<span class="closed">휴진</span>`}</td><td class="note">${h.note || (h.lunch ? `점심 ${h.lunch}` : '')}</td></tr>`)}
      </tbody></table>
      <p class="hint">${clinic.hoursNote}</p>
    </div>
    <div class="info-card">
      <h3>오시는 길</h3>
      <p>${clinic.address}</p>
      <ul class="info-list">
        <li><strong>지하철</strong> ${clinic.directions.subway}</li>
        <li><strong>버스</strong> ${clinic.directions.bus}</li>
        <li><strong>주차</strong> ${clinic.directions.parking}</li>
      </ul>
      <a href="/directions" class="link-arrow">지도와 상세 안내</a>
    </div>
    <div class="info-card info-card-cta">
      <h3>예약·문의</h3>
      <p class="info-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p>
      <p>전화가 어려우시면 카카오톡 채널이나 온라인 예약을 이용해 주세요. 확인 후 연락드립니다.</p>
      <div class="hero-actions"><a href="/reservation" class="btn btn-primary">온라인 예약</a><a href="${clinic.channels.kakao}" class="btn btn-outline" target="_blank" rel="noopener">카카오톡</a></div>
    </div>
  </div>
</section>`

  return c.html(
    Layout(c, {
      title: `${clinic.shortName} | 수원 화서동 통합치의학과 전문의 치과`,
      description: `수원시 팔달구 화서동 서울도담치과의원. 통합치의학과 전문의 한휘림 대표원장. MTA 생활치수치료·잇몸치료·임플란트. 화요일 야간진료 20:30. ${clinic.phone}`,
      path: '/',
      jsonld: [dentistLd(clinic, siteUrl), webpageSpeakableLd('/', siteUrl, clinic.name)],
      bodyClass: 'home',
    }, body),
  )
}
