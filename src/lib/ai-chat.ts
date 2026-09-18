// AI 상담 위젯 마크업 — 플로팅 버튼(.fab-ai)과 패널. 로직은 /static/ai-chat.js, 스타일은 kinetic.css 끝부분.
import { html } from 'hono/html'
import { getNaverBookingUrl, type Clinic } from '../data/clinic'

export type AiChatTopic = { id: string; label: string; q: string }

// 칩 하나당 대표 질문 1개. 서버(시스템 프롬프트 힌트)와 클라이언트(data-q)가 같은 목록을 쓴다.
export const AI_CHAT_TOPICS: AiChatTopic[] = [
  { id: 'info', label: '진료안내·비용·보험', q: '진료시간이랑 비급여 비용, 보험 적용은 어떻게 확인하나요?' },
  { id: 'pain', label: '아파요·응급', q: '치아가 갑자기 아프고 잇몸이 부었어요. 어떻게 해야 하나요?' },
  { id: 'implant', label: '임플란트·보철', q: '임플란트 비용은 어떻게 되나요?' },
  { id: 'cavity', label: '충치·신경치료·보존', q: '충치가 깊으면 꼭 신경치료를 해야 하나요?' },
  { id: 'gum', label: '잇몸·예방·관리', q: '양치할 때 피가 나는데 스케일링만 받으면 되나요?' },
  { id: 'special', label: '미백·교정·특수상황', q: '치아 미백이나 교정도 하나요? 임산부나 고혈압이 있어도 진료받을 수 있나요?' },
]

// 공개 페이지에서만 노출. 관리자·로그인·납품 안내서·증상 체크(connect-src 'none' CSP)는 제외.
export const aiChatEnabled = (path: string) => !/^\/(auth|admin|handover|symptom-check)(\/|$)/.test(path)

export const aiChatFab = () => html`<button type="button" class="fab fab-ai" id="ai-chat-open" aria-controls="ai-chat" aria-expanded="false" aria-label="AI 상담 열기"><span class="ai-mark" aria-hidden="true">AI</span><span class="fab-label">AI 상담</span></button>`

export function aiChatWidget(clinic: Clinic) {
  const naver = getNaverBookingUrl(clinic)
  return html`<section class="ai-chat" id="ai-chat" role="dialog" aria-labelledby="ai-chat-title" aria-describedby="ai-chat-disclaimer" data-endpoint="/api/ai-chat" data-phone="${clinic.phone}" hidden>
  <div class="ai-chat-head">
    <div class="ai-chat-brand"><span class="ai-mark" aria-hidden="true">AI</span><div><b id="ai-chat-title">${clinic.shortName} AI 상담</b><small>일반 정보 안내 · 24시간</small></div></div>
    <button type="button" class="ai-chat-close" id="ai-chat-close" aria-label="AI 상담 닫기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  </div>
  <div class="ai-chat-log" id="ai-chat-log" aria-live="polite" aria-busy="false">
    <div class="ai-msg ai-msg-bot ai-msg-greeting">
      <p>안녕하세요! 원장님이 직접 학습시킨 ${clinic.shortName} AI 상담사예요.</p>
      <p>진료시간·비용·오시는 길부터 증상별 궁금한 점까지 편하게 물어보세요.<br>예) “화요일 야간진료는 몇 시까지 하나요?”, “임플란트 비용은 어떻게 되나요?”, “찬 물에 이가 시려요”</p>
    </div>
  </div>
  <div class="ai-chat-chips" id="ai-chat-chips" role="group" aria-label="자주 찾는 주제">
    ${AI_CHAT_TOPICS.map((t) => html`<button type="button" class="ai-chip" data-topic="${t.id}" data-q="${t.q}">${t.label}</button>`)}
  </div>
  <form class="ai-chat-form" id="ai-chat-form" autocomplete="off">
    <label class="sr-only" for="ai-chat-input">질문 입력</label>
    <textarea id="ai-chat-input" rows="1" maxlength="1000" placeholder="궁금한 점을 입력하세요" enterkeyhint="send"></textarea>
    <button type="submit" class="ai-chat-send" id="ai-chat-send" aria-label="보내기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </form>
  <p class="ai-chat-disclaimer" id="ai-chat-disclaimer">일반 정보 안내이며 진단·처방이 아닙니다. 급한 증상은 전화 주세요.
    <span class="ai-chat-links"><a href="tel:${clinic.phoneTel}">전화 ${clinic.phone}</a>${naver ? html` · <a href="${naver}" target="_blank" rel="noopener noreferrer" data-booking-provider="naver">네이버 예약</a>` : html` · <a href="/reservation">진료 예약</a>`} · <a href="${clinic.channels.kakao}" target="_blank" rel="noopener">카카오톡</a></span>
  </p>
</section>`
}
