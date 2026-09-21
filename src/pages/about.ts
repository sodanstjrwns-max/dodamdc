import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { physicianLd } from '../lib/seo'
import { doctors, getDoctor, type Doctor } from '../data/doctors'
import { getTreatment } from '../data/treatments'
import { imageAttrs, pageHero, ctaStrip, reviewLine } from '../lib/ui'

// ── 의료진 ───────────────────────────────────────────────
export function doctorsIndex(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`
${pageHero({ eyebrow: '의료진', title: html`한 명의 원장이<br>처음부터 끝까지 봅니다`, lead: '진단한 사람이 치료하고, 치료한 사람이 경과를 봅니다. 서울도담치과는 통합치의학과 전문의 한휘림 대표원장이 모든 진료를 직접 담당합니다.', crumbs: [{ name: '홈', href: '/' }, { name: '의료진', href: '/doctors' }] })}
<section class="section">
  <div class="container">
    ${doctors.map((d) => html`<article class="doctor-band reveal">
      <div class="doctor-band-img"><img src="/static/img/dr-han-hwirim-standing-v2.webp" alt="${d.photoAlt}" ${imageAttrs(`/static/img/dr-han-hwirim-standing-v2.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 720, 900)} loading="lazy" decoding="async"><p class="doctor-band-caption">${d.name} ${d.title} · ${d.specialty}</p></div>
      <div class="doctor-band-text">
        <p class="eyebrow">${d.title}</p>
        <h2 class="h2">${d.name} <small class="specialty">${d.nameEn}</small></h2>
        <blockquote class="quote">${d.quote}</blockquote>
        <ul class="cred-list">${[...d.license, ...d.education].map((l) => html`<li>${l}</li>`)}</ul>
        <a href="/doctors/${d.slug}" class="btn btn-primary">자세한 소개</a>
      </div>
    </article>`)}
  </div>
</section>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: '의료진 소개', description: `서울도담치과 의료진. 통합치의학과 전문의 한휘림 대표원장이 진단부터 치료, 경과 관찰까지 직접 담당합니다. 수원 화서동.`, path: '/doctors', crumbs: [{ name: '홈', href: '/' }, { name: '의료진', href: '/doctors' }] }, body))
}

export async function doctorDetail(c: Context<Env>, d: Doctor) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const txs = d.treatments.map(getTreatment).filter(Boolean) as NonNullable<ReturnType<typeof getTreatment>>[]
  let cases: any[] = [], columns: any[] = []
  try {
    cases = (await c.env.DB.prepare('SELECT slug, title, treatment_slug, age_group, gender, intra_before, pano_before FROM cases WHERE published=1 AND doctor_slug=? ORDER BY created_at DESC LIMIT 3').bind(d.slug).all()).results || []
    columns = (await c.env.DB.prepare('SELECT slug, title, excerpt FROM columns WHERE published=1 AND author_slug=? ORDER BY published_at DESC LIMIT 3').bind(d.slug).all()).results || []
  } catch { /* */ }

  const body = html`
<section class="doctor-hero">
  <div class="container doctor-hero-grid">
    <div class="doctor-hero-text">
      <nav class="crumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li><a href="/doctors">의료진</a></li><li aria-current="page">${d.name} ${d.title}</li></ol></nav>
      <p class="eyebrow reveal in">${d.title} · ${d.specialty}</p>
      <h1 class="h1 reveal in">${d.name} <span class="specialty">${d.nameEn}</span></h1>
      <blockquote class="quote reveal in">${d.quote}</blockquote>
      <div class="hero-actions reveal in"><a href="/reservation" class="btn btn-primary">진료 예약</a><a href="#philosophy" class="btn btn-outline">진료 철학</a></div>
    </div>
    <div class="doctor-hero-img reveal-scale in"><img src="/static/img/dr-han-hwirim-standing-v2.webp" alt="${d.photoAlt}" ${imageAttrs(`/static/img/dr-han-hwirim-standing-v2.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 720, 900)} fetchpriority="high" decoding="async"></div>
  </div>
</section>

<section class="section" id="philosophy">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">진료 철학</p><h2 class="h2">한 번 손대기 전에<br>한 번 더 생각합니다</h2></div>
    <ol class="philosophy-list stagger">${d.philosophy.map((p, i) => html`<li class="philosophy-item"><span class="num">0${i + 1}</span><p>${p}</p></li>`)}</ol>
  </div>
</section>

<section class="section section-bg" id="story">
  <div class="container split">
    <div class="split-img reveal-left"><img src="/static/img/dr-han-hwirim-standing-v2.webp" alt="진료실에 서 있는 한휘림 원장" ${imageAttrs(`/static/img/dr-han-hwirim-standing-v2.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 960, 720)} loading="lazy" decoding="async"></div>
    <div class="story reveal-right">
      <p class="eyebrow">원장 이야기</p>
      ${d.story.map((s) => html`<div class="story-item"><h3>${s.heading}</h3><p>${s.body}</p></div>`)}
    </div>
  </div>
</section>

<section class="section" id="credentials">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">약력</p><h2 class="h2">학력 · 자격 · 경력</h2></div>
    <div class="cred-grid stagger">
      <div class="cred-block"><h3>학력</h3><ul>${d.education.map((x) => html`<li>${x}</li>`)}</ul></div>
      <div class="cred-block"><h3>전문의 자격</h3><ul>${d.license.map((x) => html`<li>${x}</li>`)}</ul></div>
      <div class="cred-block"><h3>경력</h3><ul>${d.career.map((x) => html`<li>${x}</li>`)}</ul></div>
      <div class="cred-block"><h3>연수</h3><ul>${d.training.map((x) => html`<li>${x}</li>`)}</ul></div>
      <div class="cred-block"><h3>학회</h3><ul>${d.societies.map((x) => html`<li>${x}</li>`)}</ul></div>
    </div>
  </div>
</section>

<section class="section section-bg" id="doctor-treatments">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">담당 진료</p><h2 class="h2">${d.name} 원장이 직접 진료합니다</h2></div>
    <div class="tx-grid stagger">${txs.map((t) => html`<a href="/treatments/${t.slug}" class="tx-item"><span class="tag ${t.core ? 'green' : 'gray'}">${t.core ? '핵심 진료' : t.category}</span><h3>${t.name}</h3><p>${t.short}</p></a>`)}</div>
  </div>
</section>

${cases.length || columns.length ? html`<section class="section" id="doctor-content">
  <div class="container grid-2">
    ${cases.length ? html`<div class="reveal"><h2 class="h3">치료 전후</h2><div class="case-grid">${cases.map((k) => html`<a href="/cases/gallery/${k.slug}" class="case-card"><div class="case-thumb">${k.intra_before || k.pano_before ? html`<img src="/files/${k.intra_before || k.pano_before}" alt="${k.title} 치료 전" ${imageAttrs(`/files/${k.intra_before || k.pano_before}`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 480, 320)} loading="lazy">` : ''}</div><div class="case-body"><h3>${k.title}</h3><p class="case-meta">${[k.age_group, k.gender].filter(Boolean).join(' · ')}</p></div></a>`)}</div><p><a href="/cases/gallery?doctor=${d.slug}" class="link-arrow">전체 보기</a></p></div>` : ''}
    ${columns.length ? html`<div class="reveal"><h2 class="h3">원장 칼럼</h2><ul class="notice-list">${columns.map((p) => html`<li class="notice-row"><a href="/column/${p.slug}">${p.title}</a></li>`)}</ul><p><a href="/column" class="link-arrow">칼럼 전체</a></p></div>` : ''}
  </div>
</section>` : ''}
${ctaStrip(clinic, { title: `${d.name} 원장에게 직접 진료받기`, sub: `${reviewLine(clinic)} · ${clinic.phone}` })}`

  return c.html(Layout(c, {
    title: `${d.name} ${d.title} — ${d.specialty}`,
    description: `서울도담치과 ${d.name} ${d.title}. ${d.specialty}. ${d.education.join(', ')}. ${d.quote}`,
    path: `/doctors/${d.slug}`,
    image: d.photo,
    type: 'profile',
    jsonld: [physicianLd(d, clinic, siteUrl)],
    crumbs: [{ name: '홈', href: '/' }, { name: '의료진', href: '/doctors' }, { name: `${d.name} ${d.title}`, href: `/doctors/${d.slug}` }],
  }, body))
}

// ── 병원 미션 ────────────────────────────────────────────
export function missionPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const values = [
    { icon: '01', t: '설명', d: '지금 무엇을 왜 하는지 이해되실 때까지 설명합니다. 눈을 가린 채 무슨 일이 벌어지는지 모르는 진료는 하지 않습니다.' },
    { icon: '02', t: '보존', d: '치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다. 신경치료는 발치 바로 전 단계라고 생각합니다.' },
    { icon: '03', t: '배려', d: '통증에 예민한 원장이 작은 불편도 세심하게 살핍니다. 마취크림, 마취액 워머, 전동 마취기, 미온수 스케일링을 상황에 맞게 사용합니다.' },
    { icon: '04', t: '정직', d: '필요하지 않은 치료는 권하지 않습니다. 비급여 항목은 진료 전 고지된 금액대로, 이벤트나 할인 없이 동일하게 안내합니다.' },
    { icon: '05', t: '기준', d: '세척부터 포장, 멸균, 보관까지. Class B 고압멸균기와 기구별 밀봉 포장으로 감염관리의 기본을 지킵니다. 기구는 환자마다 새로 개봉합니다.' },
    { icon: '06', t: '지속', d: '치료가 끝나면 관계가 시작됩니다. 성인 6개월, 소아 3개월 주기의 큐레이 검진으로 문제를 조기에 찾습니다.' },
  ]
  const body = html`
<section class="mission-poster" aria-labelledby="mission-title"><div class="container">
  <nav class="crumbs" aria-label="현재 위치"><ol><li><a href="/">홈</a></li><li aria-current="page">도담의 철학</li></ol></nav>
  <p class="edition-label">THE DODAM PHILOSOPHY</p>
  <div class="mission-poster-grid"><h1 id="mission-title">한 번 손대기 전에,<br><em>한 번 더</em><br>생각합니다.</h1><div class="mission-poster-aside"><p>치료의 크기보다 중요한 건<br>당신에게 꼭 필요한 치료인지.<br>그 질문을 잊지 않는 치과가 되겠습니다.</p><img src="/static/img/suwon-dodam-dental-treatment-explanation-v2.webp" alt="서울도담치과 진료실에서 모니터를 보며 환자에게 설명하는 한휘림 원장" ${imageAttrs(`/static/img/suwon-dodam-dental-treatment-explanation-v2.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1400px) 38vw, 500px', 1024, 683)} fetchpriority="high" decoding="async"></div></div>
  <p class="mission-poster-bottom">Less intervention. More consideration.</p>
</div></section>
<section class="section">
  <div class="container container-narrow">
    <div class="mission-statement reveal" id="mission-reading-statement">
      <p class="mission-statement-title">“${clinic.slogan}”</p>
      <div class="mission-statement-description">
        <p>이 문장은 광고 문구가 아니라,<br>저희가 매일 진료실에서 스스로에게 확인하는 기준입니다.</p>
        <p>설명이 부족했다면 다시 설명하고,<br>치료가 과했다면 다음엔 덜 합니다.</p>
      </div>
    </div>
  </div>
</section>
<section class="section section-bg" id="values">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">여섯 가지 약속</p><h2 class="h2">서울도담치과가 지키는 것</h2></div>
    <div class="value-grid stagger">${values.map((v) => html`<div class="value"><span class="icon">${v.icon}</span><h3>${v.t}</h3><p>${v.d}</p></div>`)}</div>
  </div>
</section>
<section class="section" id="history">
  <div class="container split rev">
    <div class="split-img mission-history-photo reveal-right"><img src="/static/img/suwon-dodam-dental-building-front-v2.webp" alt="신우상가 2층 서울도담치과 간판과 1층 입구가 보이는 건물 정면" ${imageAttrs(`/static/img/suwon-dodam-dental-building-front-v2.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1400px) 45vw, 640px', 1024, 768)} loading="lazy" decoding="async"></div>
    <div class="reveal-left">
      <p class="eyebrow">병원 연혁</p>
      <h2 class="h2">화서동에서 이어온 시간</h2>
      <ol class="timeline">
        <li class="timeline-item"><span class="year">2002</span><h3>반석치과 개원</h3><p>화서동 신우상가 2층, 지금 자리에 치과가 처음 문을 열었습니다.</p></li>
        <li class="timeline-item"><span class="year">2020</span><h3>서울도담치과로 새 이름</h3><p>같은 자리에서 서울도담치과의원으로 이름을 바꾸어 진료를 이어갔습니다.</p></li>
        <li class="timeline-item"><span class="year">2022. 5</span><h3>한휘림 원장 인수</h3><p>통합치의학과 전문의 한휘림 원장이 병원을 인수하며 장비와 감염관리 체계를 새로 정비했습니다.</p></li>
        <li class="timeline-item"><span class="year">현재</span><h3>${reviewLine(clinic)}</h3><p>화서동 이웃분들과 함께 자연치아를 지키는 치과로 진료를 이어가고 있습니다.</p></li>
      </ol>
    </div>
  </div>
</section>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: '병원 미션 — 이해될 때까지 설명하고, 필요한 만큼만 치료합니다', description: `서울도담치과의 미션. ${clinic.mission} 설명·보존·무통·정직·기준·지속, 여섯 가지 약속.`, path: '/mission', bodyClass: 'mission-page', image: '/static/img/suwon-dodam-dental-treatment-explanation-v2.webp', imageAlt: '진료실에서 환자에게 설명하는 한휘림 원장', crumbs: [{ name: '홈', href: '/' }, { name: '병원 미션', href: '/mission' }] }, body))
}

// ── 장비·감염관리 (floor-guide) ─────────────────────────
export const equipment = [
  { img: 'dodam-pano-ct-v2', name: 'Vatech Green16 저선량 CT', cat: '진단', d: '임플란트·사랑니 수술 전 신경관과 뼈 두께를 3차원으로 확인합니다. 저선량 설계로 촬영 시 노출을 줄인 장비입니다.' },
  { img: 'dodam-qray-v2', name: 'Q-ray 형광 충치 진단기', cat: '진단', d: '형광 촬영으로 진행 중인 충치와 세균 활성을 확인해, 지켜봐도 되는 충치와 지금 치료할 충치를 구분합니다. 정기검진 때 이전 사진과 비교합니다.' },
  { img: 'dodam-pa-sensor-v2', name: '디지털 구내 센서', cat: '진단', d: '치아 사이 충치, 신경치료 진행 상황을 세부 촬영합니다. 촬영 즉시 모니터로 함께 봅니다.' },
  { img: 'dodam-portable-xray-v2', name: '포터블 X-ray', cat: '진단', d: '진료 도중 자리 이동 없이 촬영해 신경치료 길이 확인 등 단계별 점검이 빠릅니다.' },
  { img: 'dodam-trios6-scanner-v2', name: 'TRIOS 6 구강스캐너', cat: '진단', d: '치아와 잇몸을 3차원으로 스캔해 인상재 없이 본을 뜹니다. 크라운·임플란트 보철 제작과 치료 전후 비교에 사용합니다.' },
  { img: 'dodam-intraosseous-quicksleeper-v2', name: 'Quick Sleeper5 골내마취기', cat: '무통', d: '치아 바로 옆 뼈로 마취액을 소량 주입해 해당 치아만 마취합니다. 입술·혀가 오래 얼얼한 느낌이 적습니다. 골내마취기는 Quick Sleeper5와 DENOPS-i 2대를 보유하고 있습니다.' },
  { img: 'dodam-intraosseous-denops-v2', name: 'DENOPS-i 골내마취기', cat: '무통', d: '컴퓨터가 마취액 주입 속도를 일정하게 조절하는 휴대형 골내마취기입니다. 주입 압력으로 인한 통증을 줄이도록 돕습니다.' },
  { img: 'dodam-iject-warmer-v2', name: 'I-JECT 컴퓨터 제어 마취기와 마취액 워머', cat: '무통', d: '컴퓨터 제어로 마취액을 천천히 일정하게 주입하고, 마취액은 체온에 가깝게 데워서 사용합니다. 마취 주사 시의 통증과 불편감을 줄이도록 돕는 장비입니다.' },
  { img: 'dodam-warm-water-scaling-v2', name: '미온수 스케일링 시스템', cat: '무통', d: '스케일링 물을 미온수로 공급해 시린 느낌을 줄입니다. 마취 가글과 함께 사용합니다.' },
  { img: 'dodam-root-zx-v2', name: 'Morita Dentaport ZX 근관장 측정기', cat: '신경치료', d: '신경관 길이를 전기적으로 측정해 신경치료 시 과·소충전을 줄입니다.' },
  { img: 'dodam-endo-ultrasonic-v2', name: '초음파 근관세정기', cat: '신경치료', d: '초음파 진동으로 신경관 안쪽 세균과 잔사를 씻어냅니다. 러버댐과 함께 사용합니다.' },
  { img: 'dodam-rubber-dam-v2', name: '러버댐 격리', cat: '신경치료', d: '치료 치아만 노출하고 침과 세균을 차단합니다. 신경치료·레진·MTA 치료의 기본입니다.' },
  { img: 'dodam-mta-v2', name: 'One-Fil Putty MTA', cat: '보존', d: '생활치수치료(VPT)에서 살아있는 신경을 덮어 보호하는 생체친화 재료입니다.' },
  { img: 'dodam-strip-v2', name: 'Bioclear 매트릭스', cat: '보존', d: '치아 사이 레진을 자연스러운 곡면으로 만들어 음식물이 끼는 공간을 줄입니다.' },
  { img: 'dodam-band-v2', name: 'Garrison DME 키트', cat: '보존', d: '잇몸 아래 깊은 충치 경계를 끌어올려 크라운·인레이 접착 경계를 정확히 만듭니다.' },
  { img: 'dodam-space-handpiece-v2', name: 'KaVo MASTERtorque 핸드피스', cat: '진료', d: '진동과 소음이 적은 고속 핸드피스로 치아 삭제량을 세밀하게 조절합니다.' },
  { img: 'dodam-tmj-physio-v2', name: '턱관절 물리치료 장비', cat: '진료', d: '턱관절 주변 근육과 관절의 통증·긴장을 완화하도록 돕는 물리치료 장비입니다. 턱관절 치료와 함께 사용합니다.' },
  { img: 'dodam-glucometer-v2', name: '혈당측정기', cat: '진료', d: '당뇨가 있는 환자분은 발치·임플란트 등 시술 전에 혈당을 확인한 뒤 진행합니다.' },
  { img: 'dodam-autoclave-v2', name: 'Class B 진공 고압멸균기 (48L)', cat: '감염관리', d: '134°C 진공 고압 증기로 기구 내부까지 멸균합니다. 유럽 Class B 기준 장비입니다.' },
  { img: 'dodam-plasma-sterilizer-v2', name: '플라즈마 소독기', cat: '감염관리', d: '열에 약한 장비와 핸드피스를 저온 플라즈마로 소독합니다.' },
  { img: 'dodam-sterilization-room-v2', name: '기구 준비·소독 공간', cat: '감염관리', d: '기구의 세척, 멸균과 보관을 위한 실제 독립 소독 공간입니다.' },
]
const gallery = [
  ['dodam-space-corridor-v2', '서울도담치과 입구 복도', 8, 2],
  ['dodam-space-information-desk-v2', '접수 데스크', 4, 2],
  ['dodam-space-waiting-lounge-v2', '대기 공간', 4, 1],
  ['dodam-space-consult-room-v2', '상담실', 4, 1],
  ['dodam-space-treatment-room-v2', '진료실', 4, 1],
  ['dodam-space-individual-operatory-v2', '개별 진료실', 8, 2],
  ['suwon-dodam-dental-waiting-area', '대기실', 4, 1],
  ['dodam-space-entrance-exterior-v2', '건물 입구 외관', 4, 1],
  ['dodam-space-xray-room-v2', '엑스레이실', 4, 1],
  ['dodam-space-drink-corner-v2', '대기공간 음료 코너', 4, 1],
  ['dodam-space-makeup-room-v2', '메이크업룸·양치 공간', 4, 1],
] as const

export function floorGuidePage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const cats = [...new Set(equipment.map((e) => e.cat))]
  const body = html`
${pageHero({ eyebrow: '장비 · 감염관리 · 둘러보기', title: html`눈에 보이지 않는 곳에도,<br>진료의 마음을 담습니다.`, lead: '정확한 진단을 위한 장비부터 환자마다 새로 개봉하는 기구까지. 서울도담치과가 지키는 감염관리 과정과 실제 진료 공간을 확인해 보세요.', crumbs: [{ name: '홈', href: '/' }, { name: '장비·감염관리', href: '/floor-guide' }], image: '/static/img/dodam-sterilization-v2.webp', imageAlt: '멸균 포장된 기구를 확인하는 모습' })}
<section class="section" id="sterilization">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">감염관리 원칙</p><h2 class="h2">눈에 보이지 않는 곳에<br>기준을 둡니다</h2></div>
    <div class="pillars stagger">
      <article class="pillar"><span class="pillar-num">01</span><h3>세척 → 포장 → 멸균 → 보관</h3><p>사용한 기구는 초음파 세척 후 개별 포장하고, Class B 고압멸균기에서 134°C로 멸균한 뒤 밀봉 상태로 보관합니다.</p></article>
      <article class="pillar"><span class="pillar-num">02</span><h3>환자 앞에서 개봉</h3><p>기본 기구 세트와 핸드피스는 환자분 앞에서 개봉합니다. 확인하시고 싶으면 언제든 말씀해 주세요.</p></article>
      <article class="pillar"><span class="pillar-num">03</span><h3>일회용은 일회만</h3><p>주사침·석션팁·러버댐·장갑 등 일회용품은 환자마다 새것을 사용하고 즉시 폐기합니다.</p></article>
      <article class="pillar"><span class="pillar-num">04</span><h3>표면 소독과 환기</h3><p>체어와 접촉 표면은 환자마다 소독하고, 진료실은 정기적으로 환기합니다.</p></article>
    </div>
  </div>
</section>
${cats.map((cat) => html`<section class="section ${cat === '무통' || cat === '감염관리' ? 'section-bg' : ''}" id="equip-${cat}">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">${cat}</p><h2 class="h2">${{ 진단: '보이는 만큼 정확해집니다', 무통: '아픈 지점을 하나씩 없앱니다', 신경치료: '신경치료를 제대로 하기 위한 장비', 보존: '자연치아를 남기는 재료', 진료: '진료 장비', 감염관리: '기본을 지키는 감염관리' }[cat] || cat}</h2></div>
    <div class="equip-grid stagger">${equipment.filter((e) => e.cat === cat).map((e) => html`<article class="equip"><div class="equip-img"><img src="/static/img/${e.img}.webp" alt="${e.name}" ${imageAttrs(`/static/img/${e.img}.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 640, 480)} loading="lazy" decoding="async"></div><div class="equip-body"><span class="tag gray">${e.cat}</span><h3>${e.name}</h3><p>${e.d}</p></div></article>`)}</div>
  </div>
</section>`)}
<section class="section" id="gallery">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">둘러보기</p><h2 class="h2">병원 공간</h2></div>
    <div class="gallery-grid stagger">${gallery.map(([img, alt, col, row]) => html`<figure style="grid-column:span ${col};grid-row:span ${row}"><img src="/static/img/${img}.webp" alt="${alt} — 서울도담치과" ${imageAttrs(`/static/img/${img}.webp`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 960, 640)} loading="lazy" decoding="async"><figcaption>${alt}</figcaption></figure>`)}</div>
  </div>
</section>
${ctaStrip(clinic, { title: '직접 보시면 더 잘 아실 수 있습니다' })}`
  return c.html(Layout(c, { title: '장비·감염관리 — 겉은 소박해도 안은 다릅니다', description: '서울도담치과의 진단·무통·신경치료·감염관리 장비. Vatech 저선량 CT, 큐레이, 무통마취기, Class B 고압멸균기, 플라즈마 소독기, 기구별 밀봉 포장. 병원 공간 둘러보기.', path: '/floor-guide', image: '/static/img/dodam-sterilization-v2.webp', crumbs: [{ name: '홈', href: '/' }, { name: '장비·감염관리', href: '/floor-guide' }] }, body))
}
