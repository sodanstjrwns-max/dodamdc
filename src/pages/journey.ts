import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { pageHero, faqList, ctaStrip } from '../lib/ui'
import { faqLd } from '../lib/seo'
import { treatmentPricingUrl } from '../data/pricing'

export function patientSituations() {
  const items = [
    ['신경치료를 권유받았어요', '신경을 보존할 수 있는 조건과 치료 선택지를 확인해 보세요.', '/treatments/vpt-crown#consultation-guide', '보존 가능성 살펴보기'],
    ['잇몸에서 피가 나요', '스케일링과 잇몸치료의 차이, 검사에서 확인할 내용을 알아보세요.', '/treatments/periodontal#consultation-guide', '잇몸 상태 이해하기'],
    ['치아를 빼야 한다고 들었어요', '보존 가능성부터 치아를 대신할 방법까지 함께 살펴보세요.', '/treatments/implant#consultation-guide', '발치 전 확인할 질문'],
    ['마취가 무서워요', '불안했던 경험을 미리 알려주세요. 통증을 배려하는 장비와 안내를 확인하세요.', '/first-visit#anxiety', '두려움 미리 이야기하기'],
    ['검진·스케일링을 받고 싶어요', '불편하지 않을 때에도 내 치아와 잇몸을 살피는 시간을 가져보세요.', '/treatments/preventive#summary', '예방관리 알아보기'],
  ]
  return html`<section class="section patient-situations" id="patient-situations" aria-labelledby="situations-title"><div class="container">
    <div class="section-kicker"><span>START WITH YOUR STORY</span><span>치료 이름을 몰라도 괜찮습니다</span></div>
    <div class="section-heading-row"><h2 id="situations-title" class="display-heading">지금, 어떤 고민으로<br>오셨나요?</h2><p>내 이야기와 가까운 안내부터 읽어보세요.<br>증상만으로 치료를 결정하는 진단 기능은 아닙니다.</p></div>
    <nav class="situation-grid" aria-label="환자 상황별 정보 안내">${items.map(([title, desc, href, label], i) => html`<a class="situation-card" href="${href}"><span class="edition-label">0${i + 1} / CARE GUIDE</span><h3>${title}</h3><p>${desc}</p><span class="situation-next">${label}<span aria-hidden="true">↗</span></span></a>`)}</nav>
    <a class="first-visit-teaser" href="/first-visit"><span><small>FIRST VISIT</small><strong>처음 오시나요? 준비물부터 진료 흐름까지.</strong></span><span aria-hidden="true">↗</span></a>
  </div></section>`
}

const guides: Record<string, { question: string; answer: string; checks: string[]; options: string; ask: string[]; equipment: string; equipmentAnchor: string }> = {
  'vpt-crown': {
    question: '신경치료를 권유받았다면, 무엇을 확인할까요?',
    answer: '다른 병원에서 받은 진단도 중요한 참고 자료입니다. 생활치수치료가 가능한지는 통증 유무 하나가 아니라 검사 결과와 남아 있는 치아 상태를 함께 보고 판단합니다.',
    checks: ['통증이 시작된 시점과 지속 시간, 찬 것·뜨거운 것에 대한 반응', '치수 반응 검사와 방사선 소견, 충치의 범위', '치아의 균열 여부와 수복 가능한 치질, 치료 중 확인되는 치수 상태'],
    options: '치수 보존이 적절하면 생활치수치료를, 보존이 어렵다면 신경치료 등 다른 방법을 검토합니다. 크라운 등 최종 수복 방법도 남은 치아 상태에 따라 달라집니다. 치료 중 계획이 바뀌거나 이후 추가 치료가 필요할 수 있습니다.',
    ask: ['제 치아에서 보존이 가능하거나 어려운 이유는 무엇인가요?', '치료 도중 어떤 소견이 있으면 계획을 변경하나요?', '최종 수복까지의 비용과 경과 확인 계획은 어떻게 되나요?'],
    equipment: '실제 MTA 보존 재료 살펴보기', equipmentAnchor: 'equip-보존',
  },
  periodontal: {
    question: '잇몸에서 피가 나면, 스케일링만으로 충분할까요?',
    answer: '출혈만으로 치료 단계를 정할 수는 없습니다. 잇몸 상태와 잇몸 속 치석, 치아를 지탱하는 뼈를 확인한 뒤 필요한 치료 범위를 정합니다.',
    checks: ['출혈·붓기·고름·흔들림 등 현재 불편한 부위', '잇몸 주머니 깊이와 방사선에서 보이는 뼈 상태', '칫솔질·치간 관리 습관, 흡연·당뇨·복용약 등 관리에 영향을 주는 요인'],
    options: '검사 결과에 따라 스케일링과 위생관리 교육, 잇몸 속 치료를 검토합니다. 초기 치료 후 재평가에서 추가 치료 필요성을 판단하며, 유지관리 간격도 개인 상태에 맞춰 정합니다.',
    ask: ['스케일링 외에 잇몸 속 치료가 필요한 부위가 있나요?', '치료 후 언제, 어떤 기준으로 다시 평가하나요?', '제 치아 사이에는 어떤 관리 도구를 사용하면 좋을까요?'],
    equipment: '미온수 진료 환경·통증 배려 장비 살펴보기', equipmentAnchor: 'equip-무통',
  },
  implant: {
    question: '발치를 권유받았다면, 임플란트부터 결정해야 할까요?',
    answer: '먼저 자연치아를 보존할 수 있는지와 발치가 필요한 이유를 확인합니다. 치아를 대신할 방법은 임플란트만 있는 것이 아니며, 주변 치아와 전신 상태까지 고려해 상담합니다.',
    checks: ['남은 치아와 뿌리, 잇몸뼈 상태 및 보존 치료 가능성', '치아를 상실한 위치, 뼈의 양과 신경·상악동 위치', '복용약·전신질환·흡연, 수술 후 관리와 내원 가능 일정'],
    options: '보존이 어렵다면 임플란트·브릿지·틀니 등의 장단점을 비교합니다. 임플란트는 뼈이식이나 추가 협진이 필요한지에 따라 과정과 기간이 달라집니다. 발치와 동시에 식립하거나 임시치아를 사용할 수 있는지도 별도 확인이 필요합니다.',
    ask: ['발치가 필요한 이유와 다른 선택지는 무엇인가요?', '뼈이식·임시치아·보철을 포함한 전체 계획과 비용은 어떻게 되나요?', '복용약 관련 협진과 수술 후 관리 일정은 어떻게 준비하나요?'],
    equipment: '실제 저선량 CT·진단 장비 살펴보기', equipmentAnchor: 'equip-진단',
  },
}

export function consultationGuide(slug: string) {
  const g = guides[slug]
  if (!g) return ''
  return html`<section class="consultation-guide" id="consultation-guide" aria-labelledby="consultation-title">
    <p class="edition-label">BEFORE YOU DECIDE</p><h2 id="consultation-title">${g.question}</h2><p class="lead">${g.answer}</p>
    <h3>검사·상담에서 함께 확인할 것</h3><ul>${g.checks.map(x => html`<li>${x}</li>`)}</ul>
    <h3>검사 결과에 따라 달라지는 선택</h3><p>${g.options}</p>
    <div class="consultation-questions"><h3>진료실에서 이렇게 물어보세요</h3><ol>${g.ask.map(x => html`<li>${x}</li>`)}</ol></div>
    <nav class="guide-links" aria-label="상담을 준비하는 관련 안내"><a href="/floor-guide#${g.equipmentAnchor}">${g.equipment} ↗</a><a href="/doctors/han-hwirim">담당 의료진 소개 ↗</a><a href="${treatmentPricingUrl(slug)}">진료비·보험 항목 확인 ↗</a>${slug === 'vpt-crown' ? html`<a href="/pricing#crown">크라운 비용 확인 ↗</a>` : ''}<a href="/first-visit">첫 방문 준비물 확인 ↗</a><a href="/reservation?treatment=${slug}" data-conversion-location="consultation" class="btn btn-primary">이 진료 상담 신청</a></nav>
    <p class="hint">일반적인 상담 준비 안내입니다. 개인의 진단·치료를 대신하지 않으며, 추가된 안내는 의료진의 재검토 전입니다.</p>
  </section>`
}

export function firstVisitPage(c: Context<Env>) {
  const clinic = c.get('clinic')
  const faqs = [
    { q: '처음 간 날 바로 치료해야 하나요?', a: '첫 방문 당일의 치료 여부는 검사 결과, 증상과 진료 일정에 따라 달라집니다. 상담부터 받고 싶으시면 예약·접수 때 알려주세요. 당일 치료 가능 여부나 소요 시간은 병원에 확인해 주세요.' },
    { q: '다른 병원의 사진이나 진료 자료를 가져가도 되나요?', a: '가지고 계신 방사선 사진, 진료 의뢰서, 치료 계획 등이 있으면 지참해 주세요. 자료의 촬영 시점과 상태에 따라 추가 검사가 필요할 수 있습니다. 전달 형식은 방문 전 병원에 문의해 주세요.' },
    { q: '복용 중인 약은 어떻게 알려드리면 되나요?', a: '약 이름과 복용 기간을 확인할 수 있는 처방전이나 약 목록을 준비해 주세요. 항응고제·골다공증약 등을 포함해 현재 복용약과 주사 치료, 알레르기를 알려주세요. 치과 방문을 위해 임의로 약을 중단하지 마시고 의료진과 상의하세요.' },
    { q: '어떤 치료로 예약할지 모르겠어요.', a: '치료 이름을 고르지 않아도 됩니다. 홈페이지 신청에서는 “잘 모르겠어요 / 상담 먼저”를 선택할 수 있습니다. 네이버 예약은 해당 화면의 항목과 안내를 확인해 주세요.' },
  ]
  const steps = [
    ['예약 방법 확인', '네이버 예약은 해당 화면의 안내를, 홈페이지 신청은 병원의 확인 연락을 확인해 주세요. 두 경로 모두 같은 일정으로 중복 신청하지 않도록 유의해 주세요.'],
    ['준비물 챙기기', '건강보험 본인 확인을 위한 신분증과 복용약 목록을 준비해 주세요. 기존 진료 자료가 있다면 함께 챙겨주세요. 본인 확인 예외나 대체 수단은 병원에 문의해 주세요.'],
    ['찾아오는 길 확인', '출발 전 오시는 길·주차 안내와 진료시간, 임시 휴진 공지를 확인해 주세요. 안내가 불분명하면 전화로 문의해 주세요.'],
    ['접수·문진', '불편한 부위와 시작 시점, 이전 치료 경험을 말씀해 주세요. 전신질환·알레르기·임신 가능성·복용약도 진료 전에 알려주세요.'],
    ['검사·상담', '상태를 확인하고 필요한 검사를 안내합니다. 검사 종류와 범위는 개인 상태에 따라 다릅니다. 궁금한 점은 메모해 가져오셔도 좋습니다.'],
    ['치료 계획 이해하기', '치료가 필요한 이유, 다른 선택지, 예상 과정·비용·주의사항을 확인해 주세요. 이해되지 않는 부분은 다시 질문하고 다음 일정을 상의하세요.'],
  ]
  return c.html(Layout(c, {
    title: '첫 방문 안내 | 준비물·검사·상담 순서', path: '/first-visit',
    description: '서울도담치과 첫 방문 안내. 예약 방법, 신분증·복용약·기존 진료 자료 준비, 접수와 검사·상담, 치료 계획 확인까지 차근차근 안내합니다.',
    crumbs: [{ name: '홈', href: '/' }, { name: '첫 방문 안내', href: '/first-visit' }],
    jsonld: [faqLd(faqs, `${c.get('siteUrl')}/first-visit`)],
  }, html`${pageHero({ eyebrow: 'YOUR FIRST VISIT', title: html`처음 오는 길이,<br>조금 더 편안하도록.`, lead: '치료 이름을 몰라도, 질문이 많아도 괜찮습니다. 방문 전에 알아두면 좋은 내용을 순서대로 정리했습니다.', crumbs: [{ name: '홈', href: '/' }, { name: '첫 방문 안내', href: '/first-visit' }], actions: html`<a href="#visit-preparation" class="btn btn-outline">준비물 먼저 보기 ↓</a><a href="/reservation" class="btn btn-primary">예약 방법 확인</a>` })}
    <nav class="reading-nav visit-reading-nav" aria-label="첫 방문 안내 빠른 목차"><div class="container"><span>첫 방문 안내</span><a href="#visit-preparation">준비물</a><a href="#visit-steps">방문 순서</a><a href="#anxiety">치료 불안</a><a href="#first-visit-faq">자주 묻는 질문</a></div></nav>
    <section class="section"><div class="container container-narrow">
    <section class="visit-preparation" id="visit-preparation" aria-labelledby="preparation-title"><p class="edition-label">BEFORE YOU LEAVE</p><h2 id="preparation-title" class="h2">출발 전에, 이것만 확인해 주세요.</h2><ul class="preparation-list"><li><strong>본인 확인 준비</strong><p>건강보험 본인 확인을 위한 신분증. 예외·대체 수단은 병원에 문의해 주세요.</p></li><li><strong>복용약·기존 자료</strong><p>약 이름을 알 수 있는 목록이나 처방전, 가지고 계신 진료 자료. 약은 임의로 중단하지 마세요.</p></li><li><strong>예약·방문 정보</strong><p>신청한 경로의 일정 확인 안내, 진료시간과 휴진 공지를 확인해 주세요.</p></li></ul><nav class="guide-links" aria-label="출발 전 확인 링크"><a href="/hours">진료시간 ↗</a><a href="/notice">휴진 공지 ↗</a><a href="/directions">오시는 길·주차 ↗</a></nav></section>
    <section id="visit-steps"><h2 class="h2">예약부터 치료 계획까지, 여섯 걸음.</h2><ol class="visit-steps">${steps.map(([title, desc], i) => html`<li><span class="visit-step-number">0${i + 1}</span><div><h3>${title}</h3><p>${desc}</p>${i === 2 ? html`<nav class="guide-links" aria-label="내원 정보"><a href="/directions">오시는 길·주차 ↗</a><a href="/hours">진료시간 ↗</a><a href="/notice">공지사항 ↗</a></nav>` : ''}</div></li>`)}</ol></section>
    <aside class="consultation-guide" id="anxiety" aria-labelledby="anxiety-title"><p class="edition-label">TELL US FIRST</p><h2 id="anxiety-title">무서웠던 경험도 말씀해 주세요.</h2><p>마취 주사, 시린 느낌, 기구 소리처럼 불편했던 부분을 미리 알려주세요. 치료 도중 쉬고 싶을 때의 신호도 의료진과 상의해 보세요. 통증을 느끼는 정도는 개인마다 다릅니다.</p><p>서울도담치과는 수면(진정) 진료를 시행하지 않습니다.</p><nav class="guide-links" aria-label="통증 배려 안내"><a href="/floor-guide#equip-무통">실제 통증 배려 장비 보기 ↗</a><a href="/doctors/han-hwirim">한휘림 원장 소개 ↗</a></nav></aside>
    <section id="first-visit-faq"><h2 class="h2">방문 전에 많이 궁금한 것</h2>${faqList(faqs)}</section></div></section>${ctaStrip(clinic, { title: '처음이라 궁금한 점부터 물어보세요.' })}`))
}
