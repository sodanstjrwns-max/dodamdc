import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { pageHero } from '../lib/ui'
import { definedTermLd, truncate } from '../lib/seo'
import { getTreatment } from '../data/treatments'
import { terms, getTerm, termsByCategory, CATEGORIES, initial, type Term } from '../data/encyclopedia'
import { editorial, EDITORIAL_UPDATED } from '../data/encyclopedia/editorial'
import { categoryGuides, readingPaths, referencesFor, searchAliases } from '../data/encyclopedia/guides'
import { comparisons, detailedSections } from '../data/encyclopedia/details'

const rootCrumbs = [{ name: '홈', href: '/' }, { name: '치과 백과사전', href: '/encyclopedia' }]
const categoryHref = (category: string) => `/encyclopedia#cat-${encodeURIComponent(category)}`
const termCard = (t: Term) => html`<a href="/encyclopedia/${t.slug}" class="ency-term-card"><span class="ency-term-name">${t.term}</span><span class="ency-english" lang="en">${t.en}</span><p>${truncate(t.def, 100)}</p><span class="ency-read">해설 읽기 <span aria-hidden="true">↗</span></span></a>`
const editorialPolicy = html`<p>서울도담치과 홈페이지의 일반 건강정보입니다. 뜻·진료 맥락·오해와 상담 질문을 구분해 정리했습니다. 개인의 진단·처방은 진료에서 확인해야 합니다.</p><p>이번에 보강한 해설은 의료진의 개별 감수가 아직 완료되지 않았습니다. 내용 수정일은 의학적 감수일을 뜻하지 않습니다. 제품명은 우수성의 보증이 아니며, 소개된 모든 진료를 본원에서 시행한다는 의미는 아닙니다.</p>`

export function encyclopediaIndex(c: Context<Env>) {
  const body = html`
${pageHero({ eyebrow: '서울도담 · 치과 백과사전', title: html`낯선 용어에서,<br>이해하는 진료로.`, lead: `${terms.length}개의 용어를 뜻에서 멈추지 않고 풀었습니다. 진료에서 어떻게 쓰이는지, 무엇과 구별해야 하는지, 어떤 질문을 하면 좋을지 함께 읽어보세요.`, crumbs: rootCrumbs, actions: html`<a href="#dictionary" class="btn btn-primary">용어 찾아보기 <span aria-hidden="true">↓</span></a><a href="#reading-paths" class="btn btn-outline">상황별로 읽기</a>` })}
<div class="container ency-intro-line"><span><strong>${terms.length}</strong> 용어 해설</span><span><strong>${CATEGORIES.length}</strong> 주제</span><span>내용 수정 <time datetime="${EDITORIAL_UPDATED}">${EDITORIAL_UPDATED.replaceAll('-', '.')}</time></span></div>
<section class="container ency-section" id="reading-paths" aria-labelledby="paths-title">
  <div class="ency-section-heading"><div><p class="ency-kicker">상황에서 시작하기</p><h2 id="paths-title">어떤 점이 궁금하신가요?</h2></div><p>관련 용어를 순서대로 읽으면<br>상담의 흐름이 보입니다.</p></div>
  <div class="ency-paths">${readingPaths.map((path, i) => html`<article class="ency-path"><span class="ency-path-number" aria-hidden="true">0${i + 1}</span><h3>${path.title}</h3><p>${path.description}</p><ol>${path.slugs.map(slug => { const t = getTerm(slug)!; return html`<li><a href="/encyclopedia/${slug}">${t.term}<span aria-hidden="true">↗</span></a></li>` })}</ol></article>`)}</div>
</section>
<section class="container ency-section" id="dictionary" aria-labelledby="dictionary-title">
  <div class="ency-section-heading"><div><p class="ency-kicker">진료실 옆 작은 도서관</p><h2 id="dictionary-title">용어 찾아보기</h2></div><p>한글·영문·약어로 찾고<br>주제별로 이어서 읽으세요.</p></div>
  <div class="ency-search-tools" hidden data-ency-controls>
    <div class="ency-search-row"><div class="ency-query-wrap"><label for="ency-query">용어 검색</label><input id="ency-query" type="search" placeholder="예: 신경치료, MTA, 잇몸 피" autocomplete="off" aria-describedby="ency-search-help"></div>
    <div class="ency-select-wrap"><label for="ency-category">주제</label><select id="ency-category"><option value="all">전체 주제</option>${CATEGORIES.map(category => html`<option value="${categoryGuides[category].id}">${category}</option>`)}</select></div>
    <button type="button" class="ency-reset" data-ency-reset>초기화</button></div>
    <p id="ency-search-help" class="ency-search-help">띄어쓰기 없이도 검색할 수 있습니다. 초성(예: ㅊㅅ)으로도 찾아보세요.</p>
    <div class="ency-initials" role="group" aria-label="첫 글자로 좁히기"><button type="button" aria-pressed="true" data-initial="all">전체</button>${['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','A-Z','#'].map(letter => html`<button type="button" aria-pressed="false" data-initial="${letter}">${letter}</button>`)}</div>
    <p class="ency-result-count" role="status" aria-live="polite" aria-atomic="true" id="ency-results">전체 ${terms.length}개 용어</p>
  </div>
  <div class="ency-directory-layout">
    <nav class="ency-categories" aria-label="백과사전 주제 바로가기"><p>주제별 목차</p>${CATEGORIES.map(category => html`<a href="#cat-${encodeURIComponent(category)}" data-ency-category-link="${categoryGuides[category].id}"><span>${category}</span><small>${termsByCategory[category].length}</small></a>`)}</nav>
    <div class="ency-directory">
      <div class="ency-empty" id="ency-empty" hidden><h3>일치하는 용어가 없습니다.</h3><p>단어를 짧게 바꾸거나 주제·첫 글자 필터를 풀어보세요.</p><button type="button" class="btn btn-outline" data-ency-reset>전체 용어 보기</button></div>
      ${CATEGORIES.map(category => { const guide = categoryGuides[category]; return html`<section class="ency-topic" id="cat-${encodeURIComponent(category)}" data-ency-topic="${guide.id}">
        <div class="ency-topic-heading"><h3>${category}</h3><span>${termsByCategory[category].length}개 용어</span></div><p class="ency-topic-intro">${guide.introduction}</p>
        <details class="ency-topic-guide"><summary>이 주제를 읽을 때 확인할 점</summary><ul>${guide.checks.map(check => html`<li>${check}</li>`)}</ul></details>
        <div class="ency-term-grid">${termsByCategory[category].map(t => html`<div data-ency-entry data-category="${guide.id}" data-first="${initial(t.term)}" data-search="${t.term} ${t.en} ${t.def} ${searchAliases[t.slug] || ''}">${termCard(t)}</div>`)}</div>
      </section>` })}
    </div>
  </div>
</section>
<section class="container ency-section ency-policy" id="editorial-policy"><h2>이 백과사전을 읽는 기준</h2>${editorialPolicy}<p>각 해설 아래에서 관련 주제의 공공기관·전문학회 자료를 확인할 수 있습니다. 적용 대상과 자료의 시점·국가가 다를 수 있으며 국내 급여는 현재 공단 기준과 본인 자격을 확인해야 합니다.</p></section>`
  return c.html(Layout(c, { title: `치과 백과사전 — ${terms.length}개 용어의 뜻·진료 해설`, description: `치과 용어 ${terms.length}개의 뜻, 진료에서 확인할 점, 헷갈리는 개념과 상담 질문. 충치·치수보존·잇몸·임플란트부터 어린이 구강 관리까지 주제별로 찾아보세요.`, path: '/encyclopedia', bodyClass: 'ency-page ency-index-page', modifiedAt: EDITORIAL_UPDATED, crumbs: rootCrumbs, jsonld: [{ '@context': 'https://schema.org', '@type': 'DefinedTermSet', '@id': `${c.get('siteUrl')}/encyclopedia#terms`, name: '서울도담치과 치과 백과사전', url: `${c.get('siteUrl')}/encyclopedia`, inLanguage: 'ko-KR', description: `${terms.length}개의 치과 용어와 환자용 해설` }] }, body))
}

export function encyclopediaTerm(c: Context<Env>, t: Term) {
  const e = editorial[t.slug]
  if (!e) throw new Error(`Missing encyclopedia editorial: ${t.slug}`)
  const context = e.context.startsWith(t.def) ? e.context.slice(t.def.length).trim() : e.context
  const clinic = c.get('clinic') as any
  const relatedTerms = e.related.map(slug => getTerm(slug)!)
  const relatedTreatments = t.treatments.map(getTreatment).filter((v): v is NonNullable<typeof v> => !!v)
  const refs = referencesFor(t)
  const comparison = comparisons[t.slug]
  const details = detailedSections[t.slug] || []
  const path = `/encyclopedia/${t.slug}`
  const crumbs = [...rootCrumbs, { name: t.term, href: path }]
  const body = html`
${pageHero({ eyebrow: `치과 백과사전 · ${t.category}`, title: t.term, crumbs })}
<div class="container ency-article-layout">
  <article class="ency-article" aria-label="${t.term} 해설">
    <div class="ency-article-meta"><span lang="en">${t.en}</span><span>내용 수정 <time datetime="${EDITORIAL_UPDATED}">${EDITORIAL_UPDATED.replaceAll('-', '.')}</time></span></div>
    <section class="ency-definition" id="definition"><p class="ency-kicker">먼저, 뜻부터</p><h2 class="sr-only">${t.term}의 뜻</h2><p>${t.def}</p></section>
    <nav class="ency-toc" aria-label="이 해설의 목차"><a href="#clinical-context">진료에서의 의미</a><a href="#distinction">헷갈리기 쉬운 점</a><a href="#consultation">상담 질문</a><a href="#related-terms">함께 읽기</a><a href="#references">참고자료</a></nav>
    <section class="ency-prose-section" id="clinical-context"><span class="ency-section-number" aria-hidden="true">01</span><h2>진료에서는 이렇게 살펴봅니다</h2><p>${context}</p></section>
    <section class="ency-prose-section ency-distinction" id="distinction"><span class="ency-section-number" aria-hidden="true">02</span><h2>헷갈리기 쉬운 점</h2><p>${e.distinction}</p></section>
    ${comparison ? html`<section class="ency-comparison"><h2>판단 기준을 나란히 비교하면</h2><div class="ency-table-scroll" role="region" aria-label="${t.term} 비교표" tabindex="0"><table><thead><tr>${comparison.headings.map(h => html`<th scope="col">${h}</th>`)}</tr></thead><tbody>${comparison.rows.map(row => html`<tr><th scope="row">${row[0]}</th><td>${row[1]}</td><td>${row[2]}</td></tr>`)}</tbody></table></div><p>${comparison.note}</p></section>` : ''}
    ${details.map(detail => html`<section class="ency-prose-section ency-detail"><h2>${detail.title}</h2><p>${detail.body}</p></section>`)}
    <section class="ency-question" id="consultation"><p class="ency-kicker">진료실에서 이어갈 질문</p><h2 id="ency-question-text">${e.question}</h2><p>검사 결과나 사진에서 해당 부위를 짚어 설명받으면 이해하기 쉽습니다.</p><button type="button" class="ency-copy" data-ency-copy hidden>질문 복사</button><span class="ency-copy-status" role="status" aria-live="polite"></span></section>
    <section class="ency-related" id="related-terms"><div class="ency-section-heading"><div><p class="ency-kicker">개념을 연결해 읽기</p><h2>함께 알아두면 좋은 용어</h2></div></div><div class="ency-related-grid">${relatedTerms.map(termCard)}</div></section>
    ${relatedTreatments.length ? html`<section class="ency-treatment-links"><h2>관련 진료 안내</h2><p>용어를 이해한 뒤 실제 진료의 과정과 주의점을 확인하세요.</p><ul>${relatedTreatments.map(tx => html`<li><a href="/treatments/${tx.slug}">${tx.name}<span aria-hidden="true">↗</span></a></li>`)}</ul></section>` : ''}
    <section class="ency-references" id="references"><h2>참고자료와 작성 기준</h2><p>아래 자료는 표시된 관련 주제의 일반 원칙을 더 읽기 위한 공식 자료입니다. 개별 제품의 성능이나 본원의 치료 결과를 보증하는 자료는 아닙니다.</p><ul>${refs.map(ref => html`<li><a href="${ref.url}" target="_blank" rel="noopener noreferrer"><span>${ref.publisher}</span><strong>${ref.title} <span aria-hidden="true">↗</span><span class="sr-only"> (새 창)</span></strong></a></li>`)}</ul><div class="ency-editorial-note">${editorialPolicy}<a href="/encyclopedia#editorial-policy">백과사전 작성 기준 보기</a></div></section>
    <a class="ency-back" href="${categoryHref(t.category)}">← ${t.category} 전체 용어로 돌아가기</a>
  </article>
  <aside class="ency-article-side" aria-label="백과사전 탐색"><div class="ency-side-card"><p class="ency-kicker">지금 읽는 주제</p><h2>${t.category}</h2><p>${categoryGuides[t.category].introduction}</p><a href="${categoryHref(t.category)}">이 주제 전체 보기 <span aria-hidden="true">↗</span></a><a href="/encyclopedia#dictionary">다른 용어 검색 <span aria-hidden="true">↗</span></a></div><div class="ency-side-card ency-side-contact"><h2>내 치아에 맞는 설명이 필요하다면</h2><p>일반 해설과 내 검사 결과를 함께 확인해 보세요.</p><a href="/reservation" class="btn btn-primary btn-block">진료 상담 예약</a><a href="tel:${clinic.phoneTel}">${clinic.phone}</a></div></aside>
</div>`
  return c.html(Layout(c, { title: `${t.term} 뜻과 진료에서 확인할 점 — 치과 백과사전`, description: truncate(`${t.term}(${t.en}): ${t.def} ${e.distinction}`), path, type: 'article', bodyClass: 'ency-page ency-term-page', modifiedAt: EDITORIAL_UPDATED, citations: refs.map(ref => ref.url), jsonld: [definedTermLd(t, c.get('siteUrl'))], crumbs }, body))
}
