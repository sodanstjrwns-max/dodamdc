import { html, raw } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { procedureLd, faqLd, physicianLd } from '../lib/seo'
import { treatments, coreTreatments, otherTreatments, getTreatment, type Treatment } from '../data/treatments'
import { doctors } from '../data/doctors'
import { treatmentPricingUrl } from '../data/pricing'
import { autoLink, termsForTreatment } from '../data/encyclopedia'
import { imageAttrs, pageHero, faqList, ctaStrip } from '../lib/ui'
import { esc, fmtDate } from '../lib/util'

import { consultationGuide, patientSituations } from './journey'

const sid = (i: number) => `sec-${i + 1}`

// Photo subjects are the clinic's actual rooms/equipment, not simulated treatment results.
const treatmentPhotoAlts: Record<string, string> = {
  'vpt-crown': '서울도담치과에서 사용하는 One-Fil Putty MTA 보존 재료',
  periodontal: '미온수 스케일링 환경을 갖춘 서울도담치과의 실제 진료 체어',
  implant: '서울도담치과에 설치된 바텍 Green16 저선량 CT',
  endodontics: '신경치료 시 격리에 사용하는 서울도담치과의 러버댐 세트',
  'wisdom-tooth': '사랑니 진단에 사용하는 서울도담치과의 저선량 CT',
  restorative: '서울도담치과의 큐레이 형광 충치 진단기',
  prosthodontics: '보철 치료 계획을 함께 논의하는 서울도담치과 상담실',
  pediatric: '서울도담치과의 별무늬 장식이 있는 진료 공간',
  'oral-surgery': '서울도담치과에서 사용하는 EXARO 휴대용 엑스레이',
  tmj: '서울도담치과의 PHL 턱관절 물리치료 장비',
  preventive: '검진과 예방관리를 진행하는 서울도담치과 진료실',
  whitening: '서울도담치과에서 사용하는 치아미백기',
}

export function treatmentsIndex(c: Context<Env>) {
  const clinic = c.get('clinic') as any
  const body = html`
${pageHero({
  eyebrow: '진료 안내',
  title: html`내 치아를 위한 선택,<br>순서부터 다르게.`,
  lead: '보존할 수 있는 가능성을 먼저 살피고, 잇몸 건강을 지키며, 필요한 경우 임플란트까지. 지금의 구강 상태에 맞는 치료를 함께 찾아갑니다.',
  crumbs: [{ name: '홈', href: '/' }, { name: '진료 안내', href: '/treatments' }],
})}
<section class="section">
  <div class="container">
    <div class="section-kicker"><span>THREE WAYS TO CARE</span><span>도담의 핵심 진료</span></div>
    <div class="treatment-chapters">
      ${coreTreatments.map((t, i) => html`<a href="/treatments/${t.slug}" class="treatment-chapter reveal">
        <span class="chapter-number">0${i + 1}</span>
        <div class="chapter-copy"><p class="edition-label">${['PRESERVE', 'PROTECT', 'RESTORE'][i]} / ${t.category}</p><h2>${t.name}</h2><p>${t.heroTitle}</p><span class="link-arrow">진료 이야기 읽기</span></div>
        ${t.heroImage ? html`<figure><img src="${t.heroImage}" alt="${treatmentPhotoAlts[t.slug] || t.name}" ${imageAttrs(`${t.heroImage}`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 640, 420)} loading="lazy" decoding="async"></figure>` : ''}
      </a>`)}
    </div>
  </div>
</section>
<section class="section section-bg">
  <div class="container">
    <div class="section-head reveal"><p class="eyebrow">진료 과목</p><h2 class="h2">작은 불편도 놓치지 않도록.</h2></div>
    <div class="tx-grid stagger">
      ${otherTreatments.map((t) => html`<a href="/treatments/${t.slug}" class="tx-item"><span class="tag ${t.category === '자연치아 보존' ? 'green' : 'gray'}">${t.category}</span><h3>${t.name}</h3><p>${t.short}</p><span class="link-arrow">자세히</span></a>`)}
    </div>
    <div class="summary-box reveal" style="margin-top:40px">
      <h3>시행하지 않는 진료</h3>
      <p>치아교정, 수면(진정) 진료, 보톡스·필러는 서울도담치과에서 시행하지 않습니다. 필요하신 경우 적절한 의료기관을 안내드립니다.</p>
    </div>
  </div>
</section>
${patientSituations()}
${ctaStrip(clinic)}`
  return c.html(Layout(c, {
    title: '진료 안내',
    description: `서울도담치과 진료 과목 안내. MTA 생활치수치료, 잇몸치료, 임플란트, 신경치료, 사랑니, 충치치료, 보철, 소아치과, 턱관절, 예방관리. 수원 화서동. ${clinic.phone}`,
    path: '/treatments',
    crumbs: [{ name: '홈', href: '/' }, { name: '진료 안내', href: '/treatments' }],
  }, body))
}

export async function treatmentDetail(c: Context<Env>, t: Treatment) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const dr = doctors.find((d) => d.treatments.includes(t.slug)) || doctors[0]
  const related = t.related.map(getTreatment).filter(Boolean) as Treatment[]
  const terms = termsForTreatment(t.slug).slice(0, 8)
  const exclude = [t.slug]

  // 관련 증례·칼럼 (DB)
  let cases: any[] = [], columns: any[] = []
  try {
    cases = (await c.env.DB.prepare('SELECT slug, title, age_group, gender, duration, pano_before, intra_before FROM cases WHERE published=1 AND treatment_slug=? ORDER BY created_at DESC LIMIT 3').bind(t.slug).all()).results || []
    columns = (await c.env.DB.prepare('SELECT slug, title, excerpt, published_at FROM columns WHERE published=1 AND treatment_slug=? ORDER BY published_at DESC LIMIT 3').bind(t.slug).all()).results || []
  } catch { /* */ }

  const body = html`
${pageHero({
  eyebrow: `${t.category} · ${t.nameEn}`,
  title: t.heroTitle,
  lead: t.heroLead,
  image: t.heroImage,
  imageAlt: treatmentPhotoAlts[t.slug] || `${t.name} — ${clinic.shortName}`,
  crumbs: [{ name: '홈', href: '/' }, { name: '진료 안내', href: '/treatments' }, { name: t.name, href: `/treatments/${t.slug}` }],
  actions: html`<a href="/reservation?treatment=${t.slug}" class="btn btn-primary">이 진료 예약하기</a><a href="#faq" class="btn btn-outline">자주 묻는 질문</a>`,
})}
<nav class="reading-nav" aria-label="진료 안내 빠른 목차"><div class="container"><span>${t.name}</span><a href="#summary">핵심 요약</a>${t.core ? html`<a href="#consultation-guide">상담 전 확인</a>` : ''}${t.steps ? html`<a href="#steps">치료 과정</a>` : ''}<a href="#side-effects">주의사항</a><a href="#faq">자주 묻는 질문</a><a class="reading-reserve" href="/reservation?treatment=${t.slug}">예약하기 ↗</a></div></nav>
<div class="container tx-layout">
  <article class="tx-body">
    <section class="summary-box reveal" id="summary" aria-labelledby="summary-h">
      <h2 id="summary-h">${t.name}, 어떤 진료인가요?</h2>
      <p class="treatment-answer">${t.short}</p>
      <ul>${t.summary.map((s) => html`<li>${s}</li>`)}</ul>
    </section>

    ${consultationGuide(t.slug)}
    <div class="prose">
    ${t.sections.map((s, i) => html`<section id="${sid(i)}" class="reveal">
      <h2>${s.h}</h2>
      <p class="lead">${s.lead}</p>
      ${s.body.map((p) => raw(`<p>${autoLink(esc(p), { exclude, max: 3 })}</p>`))}
      ${s.list ? html`<ul>${s.list.map((li) => raw(`<li>${autoLink(esc(li), { exclude, max: 1 })}</li>`))}</ul>` : ''}
    </section>`)}
    </div>

    ${t.steps ? html`<section id="steps" class="reveal">
      <h2 class="h3">치료 과정</h2>
      <ol class="steps">${t.steps.map((s, i) => html`<li class="step"><span class="step-num">${i + 1}</span><div><h3>${s.title}</h3><p>${s.desc}</p></div></li>`)}</ol>
    </section>` : ''}

    ${t.compare ? html`<section id="compare" class="reveal">
      <h2 class="h3">${t.compare.caption}</h2>
      <p class="hint" id="compare-scroll-hint">작은 화면에서는 표를 좌우로 움직여 보세요. 키보드로 표에 초점을 맞춘 뒤 방향키로 이동할 수도 있습니다.</p>
      <div class="table-wrap" role="region" aria-label="${t.compare.caption}" aria-describedby="compare-scroll-hint compare-note" tabindex="0"><table class="compare-table"><caption class="sr-only">${t.compare.caption}</caption><thead><tr>${t.compare.head.map((h) => html`<th scope="col">${h}</th>`)}</tr></thead>
      <tbody>${t.compare.rows.map((r) => html`<tr>${r.map((cell, j) => (j === 0 ? html`<th scope="row">${cell}</th>` : html`<td>${cell}</td>`))}</tr>`)}</tbody></table></div>
      <p class="hint" id="compare-note">일반적인 차이를 이해하기 위한 안내입니다. 증상만으로 치료를 선택할 수 없으며, 적용 여부·기간·비용은 검사와 상담 후 확인해야 합니다.</p>
    </section>` : ''}

    <section id="side-effects" class="side-effects reveal">
      <h2 class="h3">치료 전 알아두셔야 할 점 (부작용·주의사항)</h2>
      <ul>${t.sideEffects.map((s) => html`<li>${s}</li>`)}</ul>
      <p class="hint">개인의 구강 상태에 따라 치료 방법과 결과는 다를 수 있습니다. 진단 후 상담을 통해 결정합니다.</p>
    </section>

    ${cases.length ? html`<section id="cases" class="reveal">
      <h2 class="h3">${t.name} 치료 전후</h2>
      <div class="case-grid">${cases.map((k) => html`<a href="/cases/gallery/${k.slug}" class="case-card">
        <div class="case-thumb">${k.pano_before || k.intra_before ? html`<img src="/files/${k.intra_before || k.pano_before}" alt="${k.title} 치료 전" ${imageAttrs(`/files/${k.intra_before || k.pano_before}`, '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', 480, 320)} loading="lazy">` : html`<span class="lock">치료 전 사진</span>`}</div>
        <div class="case-body"><h3>${k.title}</h3><p class="case-meta">${[k.age_group, k.gender, k.duration].filter(Boolean).join(' · ')}</p></div></a>`)}</div>
      <p><a href="/cases/gallery?treatment=${t.slug}" class="link-arrow">전체 보기</a></p>
    </section>` : ''}

    <section id="faq" class="reveal">
      <h2 class="h3">${t.name} 자주 묻는 질문</h2>
      ${faqList(t.faqs, { cat: t.slug, open: 1 })}
    </section>

    ${columns.length ? html`<section id="columns" class="reveal">
      <h2 class="h3">원장 칼럼에서 더 읽기</h2>
      <ul class="notice-list">${columns.map((p) => html`<li class="notice-row"><a href="/column/${p.slug}">${p.title}</a><span class="date">${fmtDate(p.published_at)}</span></li>`)}</ul>
    </section>` : ''}

    <p class="reviewed">기존 진료 자료의 검토자: <a href="/doctors/${dr.slug}">${dr.name} ${dr.title}</a>(${dr.specialty}). 기존 자료 검토일 <time datetime="${t.reviewedAt}">${t.reviewedAt}</time>. 추가·수정된 상담 안내와 표현은 의료진 재검토 전이며, 이 날짜가 새 콘텐츠의 검토일을 의미하지 않습니다. 개인별 치료 효과를 보장하지 않습니다.</p>
  </article>

  <aside class="tx-side">
    <nav class="side-card toc" aria-label="이 페이지 목차">
      <p class="side-title">목차</p>
      <a href="#summary">결론 요약</a>
      ${t.core ? html`<a href="#consultation-guide">상담 전 확인할 질문</a>` : ''}
      <a href="/first-visit">첫 방문 안내</a>
      ${t.sections.map((s, i) => html`<a href="#${sid(i)}">${s.h}</a>`)}
      ${t.steps ? html`<a href="#steps">치료 과정</a>` : ''}
      ${t.compare ? html`<a href="#compare">비교표</a>` : ''}
      <a href="#side-effects">주의사항</a>
      <a href="#faq">자주 묻는 질문</a>
    </nav>
    <div class="side-card side-doctor">
      <img src="${dr.photoAvatar}" alt="${dr.photoAlt}" ${imageAttrs(`${dr.photoAvatar}`, '96px', 96, 96)} loading="lazy">
      <p class="side-title">담당 의료진</p>
      <p><strong>${dr.name} ${dr.title}</strong><br><small>${dr.specialty}</small></p>
      <a href="/doctors/${dr.slug}" class="link-arrow">소개 보기</a>
    </div>
    ${terms.length ? html`<div class="side-card"><p class="side-title">관련 용어</p><ul class="side-links">${terms.map((x) => html`<li><a href="/encyclopedia/${x.slug}">${x.term}</a></li>`)}</ul></div>` : ''}
    ${related.length ? html`<div class="side-card"><p class="side-title">함께 보는 진료</p><ul class="side-links">${related.map((r) => html`<li><a href="/treatments/${r.slug}">${r.name}</a></li>`)}</ul></div>` : ''}
    <div class="side-card side-cta">
      <p class="side-title">예약·문의</p>
      <p class="side-phone"><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></p>
      <a href="/reservation?treatment=${t.slug}" class="btn btn-primary btn-block">온라인 예약</a>
      <a href="${treatmentPricingUrl(t.slug)}" class="link-arrow">진료비·보험 안내 확인</a>
    </div>
  </aside>
</div>
${ctaStrip(clinic, { title: `${t.name}, 필요한지부터 함께 확인해 드립니다` })}`

  return c.html(Layout(c, {
    title: `${t.name} | 과정·주의사항·FAQ — 수원 화서동`,
    description: t.metaDescription,
    path: `/treatments/${t.slug}`,
    image: t.heroImage,
    type: 'article', reviewer: t.core ? undefined : dr, reviewedAt: t.core ? undefined : t.reviewedAt,
    imageAlt: treatmentPhotoAlts[t.slug],
    jsonld: [procedureLd(t, clinic, siteUrl), physicianLd(dr, clinic, siteUrl), faqLd(t.faqs, `${siteUrl}/treatments/${t.slug}`)],
    crumbs: [{ name: '홈', href: '/' }, { name: '진료 안내', href: '/treatments' }, { name: t.name, href: `/treatments/${t.slug}` }],
  }, body))
}

export { treatments }
