import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'
import { naverBookingLink } from '../lib/ui'
import { getTreatment } from '../data/treatments'
import { symptomAreas, symptomGuides, type GuideId } from '../data/symptom-check'

export function symptomCheckPage(c: Context<Env>) {
  const clinic = c.get('clinic')
  return c.html(Layout(c, {
    path: '/symptom-check', title: '증상 체크 | 내 증상에 맞는 진료 안내', bodyClass: 'symptom-page',
    description: '불편한 부위와 증상을 선택해 검사에서 확인할 점과 서울도담치과의 관련 진료를 알아보세요. 진단이 아닌 상담 준비 안내이며 선택 내용은 저장하지 않습니다.',
    crumbs: [{ name: '홈', href: '/' }, { name: '증상 체크', href: '/symptom-check' }],
  }, html`
  <section class="symptom-hero" aria-labelledby="symptom-title"><div class="container symptom-hero-inner">
    <div><p class="eyebrow">DODAM CARE GUIDE · 증상 체크</p><h1 id="symptom-title">어디가 불편하세요?<br><em>치료 이름은 몰라도 괜찮아요.</em></h1>
    <p class="symptom-intro">불편한 부위와 증상을 골라주세요.<br>진료실에서 확인할 점부터, 차근차근 안내해 드릴게요.</p>
    <p class="symptom-disclaimer">이 체크는 진단이 아닙니다. 실제 원인과 치료 방법은 내원 후 검사로 확인합니다.</p></div>
    <div class="symptom-emblem" aria-hidden="true"><span>자연치아에서<br>시작하는 진료</span><strong>DODAM.</strong><small>LISTEN FIRST. CARE TOGETHER.</small></div>
  </div></section>
  <section class="symptom-workspace container" aria-label="증상 선택 안내">
    <aside class="symptom-safety" aria-labelledby="safety-title"><p class="eyebrow">먼저 확인해 주세요</p><h2 id="safety-title">급한 증상이라면, 체크보다 진료가 먼저예요.</h2>
      <p>숨쉬기·삼키기 어렵거나 얼굴·목의 붓기가 빠르게 번지는 경우, 출혈이 심하고 멈추지 않는 경우에는 <strong>119 또는 응급실</strong>로 도움을 요청하세요.</p>
      <details id="symptom-safety-details"><summary>지금 해당하는 증상이 있나요?</summary>
        <div class="symptom-safety-options" id="symptom-safety-options" hidden>
          <label><input type="checkbox" id="safety-breath" data-safety="emergency" autocomplete="off"> 숨쉬기·삼키기가 어렵거나 얼굴·목이 빠르게 부어요</label>
          <label><input type="checkbox" id="safety-bleeding" data-safety="emergency" autocomplete="off"> 출혈이 심하고 멈추지 않아요</label>
          <label><input type="checkbox" id="safety-trauma" data-safety="urgent" autocomplete="off"> 사고로 치아가 빠지거나 위치가 바뀌었어요</label>
        </div>
        <p>사고로 치아가 빠지거나 위치가 바뀌었다면 <strong>즉시 치과 또는 응급 진료기관에 연락</strong>하세요. 유치는 다시 심지 마세요. 위 항목에 없더라도 심하거나 빠르게 악화되는 증상은 진료를 미루지 마세요.</p>
      </details>
      <div id="symptom-emergency" class="symptom-alert" role="alert" hidden><h3>증상 체크를 멈추고 응급 도움을 요청하세요.</h3><p>일반 예약 답변을 기다리지 마세요. 119 또는 가까운 응급실로 연락하세요.</p><a href="tel:119" class="btn btn-primary">119 전화하기</a></div>
      <div id="symptom-trauma" class="symptom-alert" role="alert" hidden><h3>사고로 다친 치아는 즉시 진료를 문의하세요.</h3><p>치아 보존에 시간이 중요할 수 있습니다. 온라인 예약 확인을 기다리지 말고, 연락이 닿지 않거나 진료가 끝났다면 응급 진료기관을 이용하세요.</p><a href="tel:${clinic.phoneTel}" class="btn btn-primary">도담에 전화 ${clinic.phone}</a></div>
    </aside>
    <noscript><section class="symptom-panel"><h2>선택형 안내에는 JavaScript가 필요합니다.</h2><p>JavaScript를 켜거나, 진료 안내와 전화 상담을 이용해 주세요. 증상을 입력하거나 전송하지 않습니다.</p><a class="btn btn-primary" href="/treatments">전체 진료 안내</a> <a class="btn btn-outline" href="tel:${clinic.phoneTel}">전화 ${clinic.phone}</a></section></noscript>
    <div id="symptom-interactive" hidden data-clarity-mask="true">
      <ol class="symptom-progress" aria-label="진행 단계"><li data-step="1" aria-current="step"><span>01</span> 부위 선택</li><li data-step="2"><span>02</span> 증상 선택</li><li data-step="3"><span>03</span> 안내 확인</li></ol>
      <form id="symptom-form" autocomplete="off" novalidate>
        <section class="symptom-panel" id="symptom-area-step"><fieldset><legend><span class="eyebrow">STEP 01</span>어느 부위가 불편하세요?</legend><p class="symptom-helper">가장 불편한 부위 하나를 골라주세요. 다른 부위는 다시 체크할 수 있어요.</p>
          <div class="symptom-area-grid">${symptomAreas.map((area, i) => html`<label class="symptom-area-card"><input type="radio" name="area" value="${area.id}" autocomplete="off"><span class="symptom-area-number" aria-hidden="true">0${i + 1}</span><strong>${area.name}</strong><span>${area.description}</span><span class="symptom-choice-mark" aria-hidden="true">↗</span></label>`)}</div>
        </fieldset><p id="symptom-area-error" class="symptom-error" role="alert"></p><div class="symptom-actions"><span>부위가 애매하다면 ‘입안 전체’를 선택하세요.</span><button type="button" id="symptom-next" class="btn btn-primary">증상 선택하기 <span aria-hidden="true">→</span></button></div></section>
        <section class="symptom-panel" id="symptom-choice-step" hidden><h2 id="symptom-choice-title" tabindex="-1"><span class="eyebrow">STEP 02</span><span id="symptom-area-name"></span>, 어떤 느낌인가요?</h2><p class="symptom-helper">해당하는 증상을 모두 골라주세요. 한 가지만 선택해도 괜찮아요.</p>
        ${symptomAreas.map(area => html`<fieldset data-area-group="${area.id}" hidden disabled><legend class="symptom-group-label">${area.name}에서 느끼는 증상</legend><div class="symptom-options">${area.symptoms.map(s => html`<label class="symptom-option"><input type="checkbox" name="symptom" value="${s.id}" data-guides="${s.guides.join(' ')}" data-urgent="${s.urgent ? 'yes' : 'no'}" autocomplete="off"><span>${s.label}</span></label>`)}</div></fieldset>`)}
        <p class="symptom-helper">목록에 없는 증상도 상담할 수 있어요. <a href="tel:${clinic.phoneTel}">전화 문의</a> 또는 <a href="/treatments">전체 진료 안내</a>를 이용해 주세요.</p><p id="symptom-choice-error" class="symptom-error" role="alert"></p><div class="symptom-actions"><button type="button" id="symptom-back" class="btn btn-outline">부위 다시 선택</button><button type="submit" class="btn btn-primary" id="symptom-result-button">안내 확인하기 <span id="symptom-count">(0개 선택)</span> →</button></div></section>
      </form>
      <section class="symptom-panel symptom-results" id="symptom-results" hidden aria-labelledby="symptom-results-title"><p class="eyebrow">YOUR CARE GUIDE</p><h2 id="symptom-results-title" tabindex="-1">검사에서 확인할 점과<br>함께 읽어볼 진료예요.</h2><p class="symptom-helper">진단이나 치료의 우선순위가 아닙니다. 여러 증상은 하나의 원인에서 나타날 수도 있어요.</p><div class="symptom-selection-summary"><strong id="symptom-selected-area"></strong><ul id="symptom-selected-list"></ul></div>
      <aside id="symptom-urgent-result" class="symptom-alert" hidden><h3>오늘 진료 가능 여부를 먼저 문의하세요.</h3><p>갑작스럽거나 심한 증상은 일반 온라인 예약 답변을 기다리지 마세요. 치과에 연락하고, 진료가 끝났거나 연락이 닿지 않으면 응급 진료기관에 문의하세요. 숨쉬기·삼키기 어려움, 급속한 붓기, 멈추지 않는 심한 출혈은 119 또는 응급실 안내가 우선입니다.</p><a href="tel:${clinic.phoneTel}" class="btn btn-primary">전화 ${clinic.phone}</a></aside>
      <div class="symptom-result-grid">${(Object.keys(symptomGuides) as GuideId[]).map(id => { const g = symptomGuides[id]; return html`<article class="symptom-result-card" data-guide="${id}" hidden><p class="eyebrow">함께 확인해요</p><h3>${g.title}</h3><p>${g.text}</p><div class="symptom-consultation"><strong>진료실에서 이렇게 이야기해 주세요</strong><p>${g.checks}</p></div><nav aria-label="${g.title} 관련 진료">${g.treatments.map(slug => html`<a href="/treatments/${slug}">${getTreatment(slug)!.name} <span aria-hidden="true">↗</span></a>`)}</nav></article>` })}</div>
      <aside class="symptom-next-care"><h3>치료 이름 대신, 불편했던 이야기를 들려주세요.</h3><p>선택 내용은 예약 페이지로 전달되지 않습니다. 언제부터, 어느 부위가, 어떻게 불편했는지 진료실에서 말씀해 주세요.</p><div id="symptom-routine-booking">${naverBookingLink(clinic, 'btn btn-primary', '네이버 진료상담 예약')} <a class="btn btn-outline" href="/reservation">홈페이지 상담 신청</a></div><a class="symptom-phone" href="tel:${clinic.phoneTel}">전화 문의 ${clinic.phone}</a><p class="symptom-helper">홈페이지 신청은 병원의 확인 연락 후 확정됩니다. <a href="/hours">진료시간 확인</a></p></aside>
      <p class="symptom-disclaimer">같은 증상도 원인과 정도가 다릅니다. 이 안내는 개인의 진단·치료를 대신하지 않으며, 선택하지 않은 증상이나 질환이 없다는 뜻도 아닙니다. 새 문항과 안내는 의료진 재검토 전의 일반 정보입니다.</p>
      <div class="symptom-actions"><button type="button" class="btn btn-outline" id="symptom-edit">증상 다시 선택</button><button type="button" class="btn btn-primary" id="symptom-reset">처음부터 다시 체크</button></div></section>
      <p id="symptom-status" class="symptom-status" role="status" aria-live="polite"></p>
    </div>
    <p class="symptom-privacy">선택한 부위·증상은 이 화면에서만 사용합니다.<br>서버·브라우저 저장소에 저장하거나 외부 분석 도구에 전송하지 않습니다. 새로고침하면 초기화됩니다.</p>
  </section>`))
}
