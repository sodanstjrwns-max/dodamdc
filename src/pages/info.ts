import { html, raw } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { faqLd, definedTermLd, physicianLd, truncate } from '../lib/seo'
import { doctors } from '../data/doctors'
import { treatments, getTreatment } from '../data/treatments'
import { terms, termsByCategory, CATEGORIES, getTerm, initial, autoLink, type Term } from '../data/encyclopedia'
import { pricing, insuredItems, pricingUpdatedAt, won } from '../data/pricing'
import { loadPricingGroups } from '../lib/fees'
import { areaPages, areaAccess, type AreaPage } from '../data/areas'
import { nearbyAreas } from '../data/clinic'
import { pageHero, faqList, ctaStrip, reviewLine } from '../lib/ui'
import { esc } from '../lib/util'

// ── 통합 FAQ ─────────────────────────────────────────────
const generalFaqs = [
  { q: '예약 없이 방문해도 진료를 받을 수 있나요?', a: '가능합니다. 다만 예약 환자분이 우선이므로 대기 시간이 길어질 수 있습니다. 전화나 온라인 예약 후 방문하시면 기다림을 줄일 수 있습니다.' },
  { q: '야간진료는 언제 하나요?', a: '매주 화요일 14:00부터 20:30까지 야간진료를 합니다. 마감 30분 전(20:00)까지 접수해 주세요. 수요일은 점심시간 없이 09:00–18:00 진료합니다.' },
  { q: '주차는 가능한가요?', a: '건물 사정상 주차가 어렵습니다. 인근 공영주차장 또는 대중교통(1호선 화서역 도보 약 10분, 블루밍푸른숲아파트 정류장 하차) 이용을 권장드립니다.' },
  { q: '첫 방문 때 무엇을 준비해야 하나요?', a: '신분증(건강보험 확인용)을 가져오세요. 복용 중인 약이 있으면 약 이름을 메모해 오시고, 다른 병원 방사선 사진이 있으면 함께 보여주시면 진단에 도움이 됩니다.' },
  { q: '비급여 진료비는 어디서 확인하나요?', a: '홈페이지 비급여 진료비 페이지와 원내 게시물에 고지되어 있습니다. 치료 전 상담에서 예상 비용을 먼저 안내드리고, 고지된 금액대로 동일하게 적용합니다.' },
  { q: '교정이나 수면진료도 하나요?', a: '치아교정, 수면(진정) 진료, 보톡스는 시행하지 않습니다. 필요하신 경우 적절한 의료기관을 안내드립니다.' },
  { q: '어린이도 진료받을 수 있나요?', a: '가능합니다. 큐레이 형광 촬영으로 아이가 무서워하지 않게 충치를 확인하고, 실란트·불소도포·레진 등 예방과 치료를 합니다. 협조가 어려운 경우 무리하게 진행하지 않습니다.' },
  { q: '치료 후 문제가 생기면 어떻게 하나요?', a: '전화(031-256-2872)로 먼저 연락 주세요. 치료한 원장이 직접 상태를 확인하고 필요한 처치를 안내드립니다.' },
]

export function faqPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const groups = [{ key: 'general', name: '병원 이용 안내', faqs: generalFaqs }, ...treatments.map((t) => ({ key: t.slug, name: t.name, faqs: t.faqs }))]
  const all = groups.flatMap((g) => g.faqs)
  const body = html`
${pageHero({ eyebrow: '자주 묻는 질문', title: html`궁금한 점,<br>먼저 답해드립니다`, lead: `병원 이용부터 각 진료까지 ${all.length}개의 질문에 한휘림 원장이 직접 답했습니다. 검색하거나 진료별로 골라 보세요.`, crumbs: [{ name: '홈', href: '/' }, { name: 'FAQ', href: '/faq' }] })}
<section class="section">
  <div class="container container-narrow">
    <div class="faq-search reveal in"><label for="faq-q" class="sr-only">질문 검색</label><input id="faq-q" type="search" placeholder="예: 신경치료 아픈가요, 임플란트 기간" autocomplete="off"></div>
    <div class="faq-filter reveal in" role="group" aria-label="진료 분류">
      <button type="button" class="active" data-cat="all" aria-pressed="true">전체</button>
      ${groups.map((g) => html`<button type="button" data-cat="${g.key}" aria-pressed="false">${g.name}</button>`)}
    </div>
    ${groups.map((g) => html`<div class="faq-group" id="faq-${g.key}"><h2 class="faq-group-title">${g.name} ${g.key !== 'general' ? html`<a href="/treatments/${g.key}" class="link-arrow small">진료 안내</a>` : ''}</h2>${faqList(g.faqs, { cat: g.key })}</div>`)}
    <p class="faq-empty" hidden>일치하는 질문이 없습니다. 전화 ${clinic.phone}로 문의해 주세요.</p>
  </div>
</section>
${ctaStrip(clinic, { title: '답을 못 찾으셨나요?', sub: `전화 ${clinic.phone} 또는 카카오톡 채널로 물어보세요. 진료 중에는 회신이 늦을 수 있습니다.` })}`
  return c.html(Layout(c, { title: '자주 묻는 질문 (FAQ)', description: `서울도담치과 FAQ ${all.length}문항. 진료시간·주차·비용부터 신경치료·임플란트·잇몸치료·사랑니까지 한휘림 원장이 직접 답합니다.`, path: '/faq', jsonld: [faqLd(generalFaqs, `${c.get('siteUrl')}/faq`)], crumbs: [{ name: '홈', href: '/' }, { name: 'FAQ', href: '/faq' }] }, body))
}

// ── 백과사전 ─────────────────────────────────────────────
export function encyclopediaIndex(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`
${pageHero({ eyebrow: '치과 백과사전', title: html`진료실 용어,<br>${terms.length}개를 쉽게`, lead: '상담에서 들은 말이 무슨 뜻인지 다시 찾아볼 수 있도록 정리했습니다. 각 용어는 관련 진료 안내와 연결되어 있습니다.', crumbs: [{ name: '홈', href: '/' }, { name: '치과 백과사전', href: '/encyclopedia' }] })}
<section class="section">
  <div class="container">
    <div class="faq-search reveal in"><label for="ency-search" class="sr-only">용어 검색</label><input id="ency-search" type="search" placeholder="용어 검색 (예: 치수, MTA, 러버댐)" autocomplete="off"></div>
    <nav class="ency-index reveal in" aria-label="분류 바로가기">${CATEGORIES.filter((k) => termsByCategory[k]?.length).map((k) => html`<a href="#cat-${encodeURIComponent(k)}">${k} <small>${termsByCategory[k].length}</small></a>`)}</nav>
    ${CATEGORIES.filter((k) => termsByCategory[k]?.length).map((k) => html`<section class="ency-group" id="cat-${encodeURIComponent(k)}">
      <h2 class="ency-cat-title">${k}</h2>
      <div class="ency-grid">${termsByCategory[k].map((t) => html`<a href="/encyclopedia/${t.slug}" class="ency-item"><strong>${t.term}</strong> <small>${t.en}</small><p class="ency-def">${truncate(t.def, 72)}</p></a>`)}</div>
    </section>`)}
  </div>
</section>`
  return c.html(Layout(c, { title: `치과 백과사전 — ${terms.length}개 용어 해설`, description: `충치·신경치료·잇몸·임플란트·사랑니·감염관리 등 치과 용어 ${terms.length}개를 쉬운 말로 풀었습니다. 수원 서울도담치과 한휘림 원장 검토.`, path: '/encyclopedia', crumbs: [{ name: '홈', href: '/' }, { name: '치과 백과사전', href: '/encyclopedia' }] }, body))
}

export function encyclopediaTerm(c: Context<Env>, t: Term) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const related = t.treatments.map(getTreatment).filter(Boolean) as NonNullable<ReturnType<typeof getTreatment>>[]
  const siblings = (termsByCategory[t.category] || []).filter((x) => x.slug !== t.slug).slice(0, 10)
  const body = html`
${pageHero({ eyebrow: `치과 백과사전 · ${t.category}`, title: html`${t.term} <small class="specialty">${t.en}</small>`, crumbs: [{ name: '홈', href: '/' }, { name: '치과 백과사전', href: '/encyclopedia' }, { name: t.term, href: `/encyclopedia/${t.slug}` }] })}
<div class="container tx-layout">
  <article class="tx-body">
    <div class="prose reveal in">
      <p class="lead" id="definition">${raw(autoLink(esc(t.def), { exclude: [t.slug], max: 6 }))}</p>
      ${related.length ? html`<h2>관련 진료</h2><ul>${related.map((r) => html`<li><a href="/treatments/${r.slug}">${r.name}</a> — ${r.short}</li>`)}</ul>` : ''}
      <p class="reviewed">이 설명은 일반적인 정보 제공을 위한 것으로, 개인의 상태에 따라 다를 수 있습니다. 정확한 진단은 진료를 통해 확인해 주세요. 한휘림 원장(통합치의학과 전문의) 검토.</p>
    </div>
  </article>
  <aside class="tx-side">
    ${siblings.length ? html`<div class="side-card"><p class="side-title">${t.category} 관련 용어</p><ul class="side-links">${siblings.map((s) => html`<li><a href="/encyclopedia/${s.slug}">${s.term}</a></li>`)}</ul></div>` : ''}
    <div class="side-card"><p class="side-title">백과사전</p><a href="/encyclopedia" class="link-arrow">전체 용어 보기</a></div>
    <div class="side-card side-cta"><p class="side-title">상담</p><p class="side-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><a href="/reservation" class="btn btn-primary btn-block">진료 예약</a></div>
  </aside>
</div>`
  return c.html(Layout(c, { title: `${t.term}(${t.en}) 뜻 — 치과 백과사전`, description: truncate(`${t.term}(${t.en}): ${t.def}`), path: `/encyclopedia/${t.slug}`, type: 'article', reviewer: doctors[0], jsonld: [definedTermLd(t, siteUrl), physicianLd(doctors[0], clinic, siteUrl)], crumbs: [{ name: '홈', href: '/' }, { name: '치과 백과사전', href: '/encyclopedia' }, { name: t.term, href: `/encyclopedia/${t.slug}` }] }, body))
}

// ── 오시는 길 / 진료시간 ────────────────────────────────
const hoursTable = (clinic: any) => html`<table class="hours-table"><thead><tr><th>요일</th><th>진료</th><th>비고</th></tr></thead><tbody>
  ${clinic.hours.map((h: any) => html`<tr data-day="${h.day}"><th>${h.day}</th><td>${h.open ? `${h.open} – ${h.close}` : html`<span class="closed">휴진</span>`}</td><td class="note">${h.note || (h.lunch ? `점심 ${h.lunch}` : '')}</td></tr>`)}
</tbody></table>`

export function directionsPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const q = encodeURIComponent(clinic.name + ' ' + clinic.address)
  const body = html`
${pageHero({ eyebrow: '오시는 길', title: html`화서역에서 걸어서,<br>신우상가 2층`, lead: `${clinic.address}. 1층 입구의 파란 간판을 찾아 2층으로 올라오세요.`, crumbs: [{ name: '홈', href: '/' }, { name: '오시는 길', href: '/directions' }] })}
<section class="section">
  <div class="container">
    <div class="map-wrap reveal in">
      <iframe title="서울도담치과 위치 지도" src="https://www.google.com/maps?q=${clinic.geo.lat},${clinic.geo.lng}&z=17&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>
    <div class="hero-actions reveal in" style="margin-top:16px">
      <a href="${clinic.channels.naverPlace}" target="_blank" rel="noopener" class="btn btn-primary">네이버 지도로 열기</a>
      <a href="https://map.kakao.com/link/search/${q}" target="_blank" rel="noopener" class="btn btn-outline">카카오맵으로 열기</a>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${clinic.geo.lat},${clinic.geo.lng}" target="_blank" rel="noopener" class="btn btn-outline">구글 길찾기</a>
    </div>
    <h2 class="sr-only">오시는 길과 내원 정보</h2>
    <div class="info-grid stagger" style="margin-top:40px">
      <div class="info-card"><h3>주소</h3><p>${clinic.address}</p><p class="hint">우편번호 ${clinic.postalCode} · ${clinic.directions.landmark}</p></div>
      <div class="info-card"><h3>지하철</h3><p>${clinic.directions.subway}</p><p class="hint">화서역 출구에서 화양로 방향으로 걸어오시면 신우상가가 보입니다.</p></div>
      <div class="info-card"><h3>버스</h3><p>${clinic.directions.bus}</p></div>
      <div class="info-card"><h3>주차</h3><p>${clinic.directions.parking}</p></div>
      <div class="info-card"><h3>진료시간</h3>${hoursTable(clinic)}<p class="hint">${clinic.hoursNote}</p></div>
      <div class="info-card info-card-cta"><h3>전화</h3><p class="info-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><p>찾기 어려우시면 전화 주세요. 안내드립니다.</p></div>
    </div>
  </div>
</section>
<section class="section section-bg">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">인근 지역에서</p><h2 class="h2">이런 곳에서 오십니다</h2></div>
    <ul class="area-list stagger">${nearbyAreas.map((a) => html`<li><a href="/area/${a.slug}-implant">${a.full}</a> ${a.note ? html`<small>${a.note}</small>` : ''}</li>`)}</ul>
  </div>
</section>`
  return c.html(Layout(c, { title: '오시는 길 — 수원 화서동 신우상가 2층', description: `서울도담치과 위치: ${clinic.address}. ${clinic.directions.subway}. ${clinic.directions.bus}. 주차 안내와 지도.`, path: '/directions', crumbs: [{ name: '홈', href: '/' }, { name: '오시는 길', href: '/directions' }] }, body))
}

export function hoursPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`
${pageHero({ eyebrow: '진료시간', title: html`화요일은 밤 8시 반까지,<br>수요일은 점심 없이`, lead: '직장인과 학생분들이 시간을 맞추기 어렵다는 말씀을 듣고 정한 시간표입니다. 공휴일은 휴진합니다.', crumbs: [{ name: '홈', href: '/' }, { name: '진료시간', href: '/hours' }] })}
<section class="section">
  <div class="container container-narrow">
    <h2 class="sr-only">요일별 진료시간과 방문 안내</h2>
    <div class="info-card reveal in">${hoursTable(clinic)}<p class="hint">${clinic.hoursNote} 마지막 접수는 마감 30분 전입니다.</p></div>
    <div class="grid-2 stagger" style="margin-top:28px">
      <div class="card card-body"><h3>야간진료 이용 안내</h3><p>화요일 20:00까지 접수하시면 진료가 가능합니다. 예약 환자분 우선이므로 미리 전화나 온라인 예약을 권장드립니다.</p></div>
      <div class="card card-body"><h3>점심시간</h3><p>월·목·금 13:00–14:00은 점심시간입니다. 화요일은 오후 진료만, 수요일은 점심시간 없이 진료합니다.</p></div>
    </div>
  </div>
</section>
${ctaStrip(clinic)}`
  return c.html(Layout(c, { title: '진료시간 — 화요일 야간진료 20:30', description: `서울도담치과 진료시간. 월·목·금 09:00–18:00, 화 14:00–20:30 야간진료, 수 09:00–18:00 점심시간 없이, 토 09:00–14:00, 일·공휴일 휴진. ${clinic.phone}`, path: '/hours', crumbs: [{ name: '홈', href: '/' }, { name: '진료시간', href: '/hours' }] }, body))
}

// ── 비급여 진료비 ────────────────────────────────────────
export async function pricingPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  // An intentionally empty published schedule must not reveal legacy prices.
  const storedGroups = await loadPricingGroups(c.env?.DB, true)
  const groups = storedGroups ?? pricing
  const legacyDate = storedGroups === null ? pricingUpdatedAt : ''
  const body = html`
${pageHero({ eyebrow: '비급여 진료비 고지', title: html`치료 전에 먼저 알려드리는<br>비용`, lead: '의료법에 따라 비급여 항목의 진료비를 고지합니다. 이벤트·할인 없이 고지된 금액을 동일하게 적용하며, 상담에서 예상 비용을 먼저 안내드립니다.', crumbs: [{ name: '홈', href: '/' }, { name: '비급여 진료비', href: '/pricing' }] })}
<section class="section">
  <div class="container container-narrow">
    <div class="price-notice reveal in"><p><strong>${legacyDate ? '기준일 ' + legacyDate.replace(/-/g, '.') : '병원에서 게시한 비급여 진료비'}</strong> · 금액과 적용 단위는 각 행을 확인해 주세요. 개인의 상태·치료 범위에 따라 항목이 추가될 수 있으며, 포함 범위와 총비용은 치료 전에 안내드립니다. 과세 여부는 해당 항목의 표기를 확인해 주세요.</p></div>
    <nav class="reveal in" aria-label="항목 바로가기"><ul class="pill-list price-navigation">${groups.map((g) => html`<li><a href="#${g.id}">${g.group}</a></li>`)}<li><a href="#insured">건강보험 적용 항목</a></li></ul></nav>
    ${!groups.length ? html`<p class="price-notice">현재 공개된 비급여 항목이 없습니다. 진료비는 병원으로 문의해 주세요.</p>` : ''}
    ${groups.map((g) => html`<section class="reveal" id="${g.id}">
      <span class="fragment-alias" id="${encodeURIComponent(g.group)}" aria-hidden="true"></span><span class="fragment-alias" id="${g.group}" aria-hidden="true"></span>
      <h2 class="h3">${g.group}</h2>
      ${g.desc ? html`<p class="hint" style="margin:0 0 12px">${g.desc}</p>` : ''}
      <div class="table-wrap" role="region" aria-label="${g.group} 진료비 표, 작은 화면에서는 좌우로 이동할 수 있습니다" tabindex="0"><table class="price-table"><thead><tr><th>항목</th><th>단위</th><th>금액</th><th>비고</th></tr></thead><tbody>
        ${g.items.map((it) => html`<tr><td>${it.name}</td><td>${it.unit || ''}</td><td class="price">${it.price == null ? '상담 후 안내' : won(it.price)}</td><td class="note">${it.note || ''}</td></tr>`)}
      </tbody></table></div>
    </section>`)}
    <section class="reveal" id="insured">
      <h2 class="h3">건강보험 적용 항목</h2>
      <p class="hint" style="margin:0 0 12px">아래 진료는 건강보험이 적용되어 본인부담금만 부담합니다. 연령·조건에 따라 적용 범위가 다릅니다.</p>
      <ul class="pill-list">${insuredItems.map((s) => html`<li>${s}</li>`)}</ul>
    </section>
    <p class="reviewed">비급여 진료비는 「의료법」 제45조 및 「비급여 진료비용 등의 고지 지침」에 따라 고지합니다. 금액은 변경될 수 있으며 변경 시 본 페이지와 원내 게시물을 갱신합니다.</p>
  </div>
</section>
${ctaStrip(clinic, { title: '정확한 비용은 진단 후 안내드립니다', sub: '방사선 사진과 구강 상태를 보고 필요한 항목만 말씀드립니다.' })}`
  return c.html(Layout(c, { title: '비급여 진료비 안내', description: `서울도담치과 비급여 진료비 고지. 임플란트·크라운·레진·인레이·스케일링·미백 등 항목별 금액. ${legacyDate ? '기준일 ' + legacyDate + '. ' : ''}이벤트·할인 없이 동일 적용.`, path: '/pricing', crumbs: [{ name: '홈', href: '/' }, { name: '비급여 진료비', href: '/pricing' }] }, body))
}

// ── 지역 SEO 페이지 ─────────────────────────────────────
export function areaPage(c: Context<Env>, p: AreaPage) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const t = getTreatment(p.treatmentSlug)!
  const access = areaAccess[p.areaSlug] || `${p.areaFull}에서 화서동 신우상가까지 대중교통으로 접근하실 수 있습니다.`
  const others = areaPages.filter((x) => x.areaSlug === p.areaSlug && x.slug !== p.slug)
  const sameTx = areaPages.filter((x) => x.treatmentSlug === p.treatmentSlug && x.slug !== p.slug).slice(0, 8)
  const body = html`
${pageHero({ eyebrow: `${p.areaFull} · ${t.category}`, title: html`${p.areaName}에서 ${t.name},<br>서울도담치과`, lead: `${p.areaFull}에서 ${t.name}을(를) 알아보고 계신다면, 수원 화서동 서울도담치과의 진료 원칙을 먼저 확인해 보세요. ${t.short}`, image: t.heroImage, imageAlt: t.name, crumbs: [{ name: '홈', href: '/' }, { name: '진료 안내', href: '/treatments' }, { name: t.name, href: `/treatments/${t.slug}` }, { name: p.areaName, href: `/area/${p.slug}` }], actions: html`<a href="/reservation?treatment=${t.slug}" class="btn btn-primary">진료 예약</a><a href="/treatments/${t.slug}" class="btn btn-outline">${t.name} 자세히</a>` })}
<div class="container tx-layout">
  <article class="tx-body">
    <section class="summary-box reveal"><h2>${p.areaName} 분들께 먼저 드리는 말씀</h2><ul>${t.summary.slice(0, 3).map((s) => html`<li>${s}</li>`)}</ul></section>
    <div class="prose">
      <section class="reveal"><h2>${p.areaFull}에서 오시는 길</h2><p>${access}</p><p>${clinic.address}. ${clinic.directions.subway}, ${clinic.directions.bus}. ${clinic.directions.parking}</p><p>화요일은 20:30까지 야간진료, 수요일은 점심시간 없이 진료해 ${p.areaName}에서 퇴근 후나 점심시간에 방문하시는 분들이 계십니다.</p></section>
      <section class="reveal"><h2>서울도담치과의 ${t.name}</h2><p class="lead">${t.heroLead}</p>${t.sections.slice(0, 2).map((s) => html`<h3>${s.h}</h3><p>${s.lead}</p><p>${s.body[0]}</p>`)}<p><a href="/treatments/${t.slug}" class="link-arrow">${t.name} 전체 안내 읽기</a></p></section>
      <section class="reveal"><h2>진료 전 알아두실 점</h2><ul>${t.sideEffects.slice(0, 3).map((s) => html`<li>${s}</li>`)}</ul><p class="hint">개인의 구강 상태에 따라 치료 방법과 결과는 다를 수 있습니다.</p></section>
    </div>
    <section class="reveal" id="faq"><h2 class="h3">${p.areaName} 분들이 자주 묻는 ${t.name} 질문</h2>${faqList(t.faqs.slice(0, 6), { cat: t.slug, open: 1 })}</section>
    <p class="reviewed">${reviewLine(clinic)}. 이 페이지는 ${p.areaFull} 거주·근무 분들을 위한 안내입니다. ${t.core ? '연결된 핵심 진료 자료의 추가·수정 표현은 의료진 재검토 전입니다.' : '기존 진료 자료는 한휘림 원장(통합치의학과 전문의)이 검토했습니다.'}</p>
  </article>
  <aside class="tx-side">
    <div class="side-card side-cta"><p class="side-title">${p.areaName}에서 예약</p><p class="side-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p><a href="/reservation?treatment=${t.slug}" class="btn btn-primary btn-block">온라인 예약</a><a href="/directions" class="link-arrow">오시는 길</a></div>
    ${others.length ? html`<div class="side-card"><p class="side-title">${p.areaName} 다른 진료</p><ul class="side-links">${others.map((o) => html`<li><a href="/area/${o.slug}">${p.areaName} ${o.treatmentName}</a></li>`)}</ul></div>` : ''}
    ${sameTx.length ? html`<div class="side-card"><p class="side-title">인근 지역 ${t.name}</p><ul class="side-links">${sameTx.map((o) => html`<li><a href="/area/${o.slug}">${o.areaName} ${t.name}</a></li>`)}</ul></div>` : ''}
  </aside>
</div>
${ctaStrip(clinic, { title: `${p.areaName}에서 가까운 ${t.name} 상담` })}`
  return c.html(Layout(c, { title: `${p.areaName} ${t.name} — ${p.areaFull} 인근 치과`, description: truncate(`${p.areaFull}에서 ${t.name}을 찾으신다면 수원 화서동 서울도담치과. ${t.short} 통합치의학과 전문의 진료, 화요일 야간진료. ${clinic.phone}`), path: `/area/${p.slug}`, image: t.heroImage, jsonld: [], crumbs: [{ name: '홈', href: '/' }, { name: t.name, href: `/treatments/${t.slug}` }, { name: p.areaName, href: `/area/${p.slug}` }] }, body))
}

export function areaIndex(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`
${pageHero({ eyebrow: '지역 안내', title: html`수원 어디에서 오시든<br>같은 기준으로 진료합니다`, crumbs: [{ name: '홈', href: '/' }, { name: '지역 안내', href: '/area' }] })}
<section class="section"><div class="container">
  ${nearbyAreas.map((a) => html`<div class="reveal" style="margin-bottom:32px"><h2 class="h3">${a.full}</h2><ul class="pill-list">${areaPages.filter((p) => p.areaSlug === a.slug).map((p) => html`<li><a href="/area/${p.slug}">${p.treatmentName}</a></li>`)}</ul></div>`)}
</div></section>`
  return c.html(Layout(c, { title: '지역별 진료 안내', description: `화서동·화서역·정자동·율전동·천천동·서둔동·수원역 등 수원 인근 지역에서 서울도담치과로 오시는 길과 진료 안내.`, path: '/area', noindex: true }, body))
}

// ── 법적 고지 / 404 / HTML 사이트맵 ─────────────────────
export function privacyPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`${pageHero({ eyebrow: '법적 고지', title: '개인정보 처리방침', crumbs: [{ name: '홈', href: '/' }, { name: '개인정보 처리방침', href: '/privacy' }] })}
<section class="section"><div class="container container-narrow prose reveal in">
<p>${clinic.name}(이하 "병원")은 「개인정보 보호법」 및 관계 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하게 처리하기 위해 다음과 같이 개인정보 처리방침을 수립·공개합니다.</p>
<h2>1. 수집하는 개인정보 항목과 수집 방법</h2>
<ul><li><strong>회원가입</strong>: 이름, 이메일, 휴대전화번호, 비밀번호(단방향 해시 저장). Google 계정으로 가입 시 Google이 제공하는 이름·이메일·프로필 식별자.</li><li><strong>진료 예약</strong>: 이름, 연락처, 이메일(선택), 희망 진료·일시, 문의 내용.</li><li><strong>자동 수집</strong>: 접속 경로(페이지 주소), 브라우저 종류(User-Agent), 접속 일시. 병원 애플리케이션의 자체 조회 로그에는 원문 IP 주소를 저장하지 않습니다. 호스팅·외부 분석 서비스의 접속 처리는 아래 안내와 해당 서비스 정책을 따릅니다.</li></ul>
<h2>2. 개인정보의 수집·이용 목적</h2>
<ul><li>회원 식별, 로그인 유지, 치료 전후 사진 열람 권한 관리</li><li>진료 예약 접수 및 확인 연락</li><li>동의한 회원에 한하여 병원 소식·안내 발송(마케팅 정보 수신 동의)</li><li>서비스 개선을 위한 통계(봇 트래픽 제외 조회수)</li></ul>
<h2>3. 보유 및 이용 기간</h2>
<p>회원 정보는 회원 탈퇴 시까지, 예약 정보는 원칙적으로 접수일과 유효한 희망 진료일 중 늦은 날로부터 1년을 기준으로 보유기간을 검토합니다. 처리 완료·취소 건 중 별도 보존 사유가 없는 정보는 관리책임자가 대상 확인과 재인증을 거쳐 파기합니다. 처리 중인 건이나 별도 보존이 필요한 건은 개별 검토합니다. 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
<h2>4. 제3자 제공 및 처리 위탁</h2>
<p>병원은 이용자의 개인정보를 제3자에게 제공하지 않습니다. 서비스 운영을 위해 다음 업체에 처리를 위탁합니다: Cloudflare, Inc.(웹 호스팅·데이터 저장), Google LLC(설정 시 소셜 로그인·웹 분석), Resend(설정 시 예약 알림 이메일 발송). 현재 소셜 로그인·자동 이메일 발송의 실제 사용 여부는 병원에 확인하실 수 있습니다.</p>
<h2>5. 이용자의 권리</h2>
<p>이용자는 언제든지 마이페이지 또는 병원 연락처를 통해 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 회원 탈퇴 시 관련 정보는 지체 없이 파기됩니다.</p>
<h2>6. 쿠키</h2>
<p>로그인 유지와 요청 위조 방지를 위한 필수 쿠키(HttpOnly)를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나, 이 경우 로그인 기능을 이용할 수 없습니다. GA4가 설정된 경우 방문 분석이 추가될 수 있습니다. 공개 안내 페이지에는 Microsoft Clarity와 페이션트 퍼널 방문 분석 스크립트가 적용되어 방문·스크롤·클릭 등 이용 행태를 분석할 수 있으며 분석용 쿠키와 기기 정보가 사용될 수 있습니다. 예약·회원·관리 화면, 치료 사례, 납품 안내 및 로그인한 이용자에게는 이 두 행동 분석 스크립트를 불러오지 않고 DNT·GPC 설정도 반영합니다. 이 외부 분석은 아래의 자체 예약·문의 합계와 별개입니다.</p><p>외부 분석 서비스의 수집 항목·쿠키 및 권리 행사에 관한 사항은 <a href="https://privacy.microsoft.com/ko-kr/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft 개인정보처리방침</a>과 병원 개인정보 보호책임자를 통해 확인하실 수 있습니다.</p>
<h2>7. 예약·문의 동선 집계</h2>
<p>홈페이지 개선을 위해 네이버 예약·전화·카카오 상담 클릭, 홈페이지 신청 화면 이동과 신청 접수 건수를 자체 집계합니다. 네이버 클릭은 실제 예약 완료를 뜻하지 않습니다. 한국시간 날짜·공개 페이지 분류·버튼 위치·행동 종류·운영/미리보기 구분별 합계를 저장하며, 이름·연락처·증상·입력값·IP·User-Agent·유입 주소·쿼리·사용자 ID를 이 집계에 저장하거나 GA4로 전송하지 않습니다.</p>
<p>별도 추적 쿠키나 로컬 저장소 없이 화면마다 발급한 무작위 서명 값으로 같은 화면·종류·위치의 중복 클릭을 제한합니다. 중복 방지용 단방향 해시는 최대 30분 동안 유효하며 집계 합계나 회원·예약 기록과 연결하지 않습니다. 합계는 최근 90일 범위로 유지합니다. 만료 데이터는 다음 집계 요청 또는 관리자 통계 조회 시 정리하므로, 요청이 없는 동안에는 만료 데이터가 남아 있을 수 있습니다. DNT 또는 GPC 설정을 보낸 요청과 관리자·봇으로 추정되는 요청은 제외합니다. 기존 접속 조회 통계 및 별도로 설정된 외부 분석 서비스와는 구분됩니다.</p>
<h2>8. 보안 및 예약 응대 기록</h2>
<p>예약 응대를 위해 담당 직원, 연락 시도·확인 상태, 연락 시각, 재연락 예정과 처리 이력을 관리합니다. 관리자 비밀번호 인증과 접근 권한 검증으로 관리 화면을 보호합니다. 공용 관리자 로그인으로 수행한 작업은 공용 관리자 식별자로 기록되어 실제 작업자 개인을 구분하지 못합니다. 기존 직원별 계정을 사용하는 경우에는 역할별 접근 제한을 적용하고 해당 계정의 비밀번호는 소금값을 적용한 단방향 해시로 저장합니다. 회원 예약 내역은 해당 회원 ID에 연결된 접수만 표시하며 이메일 주소가 같다는 이유만으로 연결하지 않습니다.</p>
<p>요청 위조 방지를 위한 필수 보안 쿠키(dd_csrf, 최대 8시간)와 로그인·인증 쿠키를 사용합니다. 직원 로그인은 최대 24시간, 회원 로그인은 최대 30일 동안 유효하며 로그아웃·계정 삭제·비밀번호 변경 등으로 무효화될 수 있습니다. Google 인증 과정에서는 최대 10분의 임시 상태 쿠키를 사용합니다. 이 쿠키는 예약·문의 전환 분석용 추적 쿠키가 아닙니다.</p>
<p>반복 로그인 등 악용을 제한하기 위해 플랫폼이 전달한 접속 IP와 로그인 식별자를 서버에서 HMAC 처리한 키, 시도 수와 만료 시각을 임시 저장합니다. 원문 IP·비밀번호는 이 제한 테이블에 저장하지 않습니다. 제한 구간은 15분이며 만료 키는 다음 관련 보안 요청 때 정리합니다. 직원 관리 작업 기록에는 직원 ID·작업 종류·대상 식별자·시각이 포함되며, 예약 응대 이력은 해당 예약 파기 시 함께 삭제합니다. 일반 관리 작업 기록의 보유·파기 정책과 외부 이메일·백업의 삭제 절차는 별도 운영 검수가 필요합니다.</p>
<h2>9. 개인정보 보호책임자</h2>
<p>${clinic.business.owner} (${clinic.name} 대표원장) · 전화 ${clinic.phone} · 이메일 ${clinic.email}</p>
<p class="hint">시행일: 2026년 9월 1일</p>
</div></section>`
  return c.html(Layout(c, { title: '개인정보 처리방침', description: `${clinic.name} 개인정보 처리방침. 수집 항목, 이용 목적, 보유 기간, 이용자 권리.`, path: '/privacy' }, body))
}

export function termsPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`${pageHero({ eyebrow: '법적 고지', title: '이용약관', crumbs: [{ name: '홈', href: '/' }, { name: '이용약관', href: '/terms' }] })}
<section class="section"><div class="container container-narrow prose reveal in">
<h2>제1조 (목적)</h2><p>이 약관은 ${clinic.name}(이하 "병원")이 운영하는 홈페이지(이하 "사이트")의 이용 조건과 절차, 병원과 이용자의 권리·의무를 규정합니다.</p>
<h2>제2조 (서비스 내용)</h2><p>사이트는 진료 안내, 의료진 소개, 치료 전후 사례(회원 열람), 원장 칼럼, 치과 백과사전, 공지사항, 온라인 진료 예약 접수 기능을 제공합니다. 온라인 예약은 접수 단계이며, 병원의 확인 연락 후 확정됩니다.</p>
<h2>제3조 (의료 정보의 성격)</h2><p>사이트의 모든 의료 정보는 일반적인 정보 제공 목적이며 개별 진단이나 치료를 대신하지 않습니다. 개인의 구강 상태에 따라 치료 방법과 결과는 다를 수 있으며, 정확한 판단은 진료를 통해 이루어집니다. 치료 전후 사진은 해당 환자의 결과로 다른 환자의 결과를 보장하지 않습니다.</p>
<h2>제4조 (회원)</h2><p>회원가입은 개인정보 처리방침에 동의한 만 14세 이상 이용자가 할 수 있습니다. 회원은 계정 정보를 안전하게 관리해야 하며, 타인에게 양도할 수 없습니다. 병원은 허위 정보 기재, 사이트 운영 방해 시 이용을 제한할 수 있습니다.</p>
<h2>제5조 (콘텐츠 저작권)</h2><p>사이트의 글·사진·이미지 등 콘텐츠의 저작권은 병원에 있습니다. 치료 전후 사진은 환자 동의 하에 게시된 것으로, 무단 복제·배포·2차 이용을 금합니다.</p>
<h2>제6조 (면책)</h2><p>병원은 천재지변, 통신 장애 등 불가항력으로 인한 서비스 중단에 책임을 지지 않으며, 이용자가 사이트 정보를 근거로 한 판단에 대해 책임을 지지 않습니다.</p>
<p class="hint">시행일: 2026년 9월 1일 · 문의 ${clinic.phone}</p>
</div></section>`
  return c.html(Layout(c, { title: '이용약관', description: `${clinic.name} 홈페이지 이용약관.`, path: '/terms' }, body))
}

export function sitemapHtml(c: Context<Env>) {
  const groups: [string, [string, string][]][] = [
    ['병원', [['/', '홈'], ['/mission', '병원 미션'], ['/doctors', '의료진'], ['/doctors/han-hwirim', '한휘림 대표원장'], ['/floor-guide', '장비·감염관리']]],
    ['진료', [['/treatments', '진료 안내'], ...treatments.map((t) => [`/treatments/${t.slug}`, t.name] as [string, string])]],
    ['콘텐츠', [['/cases/gallery', '치료 전후'], ['/column', '원장 칼럼'], ['/encyclopedia', '치과 백과사전'], ['/notice', '공지사항']]],
    ['안내', [['/first-visit', '첫 방문 안내'], ['/directions', '오시는 길'], ['/hours', '진료시간'], ['/pricing', '비급여 진료비'], ['/faq', 'FAQ'], ['/reservation', '진료 예약'], ['/area', '지역별 안내']]],
    ['회원', [['/auth/login', '로그인'], ['/auth/register', '회원가입'], ['/privacy', '개인정보 처리방침'], ['/terms', '이용약관']]],
  ]
  const body = html`${pageHero({ eyebrow: '사이트맵', title: '전체 페이지', crumbs: [{ name: '홈', href: '/' }, { name: '사이트맵', href: '/sitemap' }] })}
<section class="section"><div class="container grid-3 stagger">${groups.map(([g, links]) => html`<div class="card card-body"><h2 class="h3">${g}</h2><ul class="side-links">${links.map(([h, n]) => html`<li><a href="${h}">${n}</a></li>`)}</ul></div>`)}</div></section>`
  return c.html(Layout(c, { title: '사이트맵', description: '서울도담치과 홈페이지 전체 페이지 목록.', path: '/sitemap' }, body))
}

export function notFoundPage(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`<section class="error-page"><div class="container container-narrow center">
    <p class="error-code">404</p>
    <h1 class="h2">찾으시는 페이지가 없습니다</h1>
    <p class="lead">주소가 바뀌었거나 삭제된 페이지일 수 있습니다. 아래에서 원하시는 곳으로 이동해 주세요.</p>
    <div class="error-links"><a href="/" class="btn btn-primary">홈으로</a><a href="/treatments" class="btn btn-outline">진료 안내</a><a href="/reservation" class="btn btn-outline">진료 예약</a><a href="tel:${clinic.phoneTel}" class="btn btn-outline">${clinic.phone}</a></div>
  </div></section>`
  c.status(404)
  return c.html(Layout(c, { title: '페이지를 찾을 수 없습니다', description: '요청하신 페이지가 존재하지 않습니다.', path: c.req.path, noindex: true }, body))
}
