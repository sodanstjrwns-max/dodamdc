// AI 상담 위젯 마크업 — 플로팅 버튼(.fab-ai) + 첫 방문 말풍선 + 패널. 로직은 /static/ai-chat.js, 스타일은 kinetic.css 끝부분.
// 2026-09-21 원장 요청(성모치과 위젯 참고): 무엇을 물을 수 있는지/없는지 안내, 자주 묻는 질문 칩, 예약·전화 바로가기, 눈에 띄는 고지.
import { html } from 'hono/html'
import { getNaverBookingUrl, type Clinic } from '../data/clinic'

export type AiChatTopic = { id: string; label: string; q: string }

// 칩 하나당 자주 묻는 질문 1개. 서버(시스템 프롬프트 힌트)와 클라이언트(data-q)가 같은 목록을 쓴다.
export const AI_CHAT_TOPICS: AiChatTopic[] = [
  { id: 'hours', label: '진료시간·휴진일', q: '진료시간이랑 야간진료, 휴진일이 어떻게 되나요?' },
  { id: 'cost', label: '임플란트 비용 범위', q: '임플란트 비용은 대략 어느 정도이고, 보험 적용은 되나요?' },
  { id: 'booking', label: '예약은 어떻게 하나요?', q: '진료 예약은 어떻게 하나요? 당일 예약도 가능한가요?' },
  { id: 'location', label: '오시는 길·주차', q: '병원 위치와 오시는 길, 주차는 어떻게 하나요?' },
  { id: 'pain', label: '갑자기 이가 아파요', q: '치아가 갑자기 아프고 잇몸이 부었어요. 어떻게 해야 하나요?' },
  { id: 'cavity', label: '신경치료 꼭 해야 하나요?', q: '충치가 깊으면 꼭 신경치료를 해야 하나요?' },
]

// 공개 페이지에서만 노출. 관리자·로그인·납품 안내서·증상 체크(connect-src 'none' CSP)는 제외.
export const aiChatEnabled = (path: string) => !/^\/(auth|admin|handover|symptom-check)(\/|$)/.test(path)

export const aiChatFab = () => html`<button type="button" class="fab fab-ai" id="ai-chat-open" aria-controls="ai-chat" aria-expanded="false" aria-label="AI 상담 열기"><span class="ai-mark" aria-hidden="true">AI</span><span class="fab-label">AI 상담</span></button>`

const callIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>`

export function aiChatWidget(clinic: Clinic) {
  const naver = getNaverBookingUrl(clinic)
  return html`<div class="ai-chat-tip" id="ai-chat-tip" hidden>
  <button type="button" class="ai-chat-tip-btn" id="ai-chat-tip-open">궁금한 점을 바로 물어보세요 <b>AI 상담</b></button>
  <button type="button" class="ai-chat-tip-close" id="ai-chat-tip-close" aria-label="안내 닫기">×</button>
</div>
<section class="ai-chat" id="ai-chat" role="dialog" aria-labelledby="ai-chat-title" aria-describedby="ai-chat-disclaimer" data-endpoint="/api/ai-chat" data-phone="${clinic.phone}" data-tel="tel:${clinic.phoneTel}" data-naver="${naver || ''}" hidden>
  <div class="ai-chat-head">
    <div class="ai-chat-brand"><span class="ai-mark" aria-hidden="true">AI</span><div><b id="ai-chat-title">${clinic.shortName} AI 상담</b><small>원장님이 직접 학습시킨 안내 · 24시간</small></div></div>
    <button type="button" class="ai-chat-close" id="ai-chat-close" aria-label="AI 상담 닫기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  </div>
  <nav class="ai-chat-actions" aria-label="예약·전화 바로가기">
    <a href="tel:${clinic.phoneTel}" class="ai-act ai-act-call" aria-label="전화 ${clinic.phone}">${callIcon}<span>전화 걸기</span></a>
    ${naver ? html`<a href="${naver}" class="ai-act ai-act-naver" target="_blank" rel="noopener noreferrer" data-booking-provider="naver"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z"/></svg><span>네이버 예약</span></a>` : html`<a href="/reservation" class="ai-act ai-act-naver"><span>진료 예약</span></a>`}
    <a href="${clinic.channels.kakao}" class="ai-act ai-act-kakao" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.2 4.6 6.6L5.5 21l4.3-2.8c.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg><span>카카오톡</span></a>
  </nav>
  <div class="ai-chat-log" id="ai-chat-log" aria-live="polite" aria-busy="false">
    <div class="ai-msg ai-msg-bot ai-msg-greeting">
      <p>안녕하세요! 원장님이 직접 학습시킨 ${clinic.shortName} AI 상담사예요.</p>
      <p class="ai-greet-label">이런 걸 물어보실 수 있어요</p>
      <ul class="ai-greet-list">
        <li>진료시간 · 야간진료 · 휴진일</li>
        <li>치료별 비용 범위와 보험 적용</li>
        <li>예약 방법 (네이버 예약 · 전화)</li>
        <li>오시는 길 · 주차 안내</li>
      </ul>
      <p class="ai-greet-note">다만 입안 상태는 사람마다 달라서 <b>진단이나 처방은 드릴 수 없어요.</b> 정확한 판단은 원장님이 직접 보고 안내드립니다.</p>
    </div>
  </div>
  <div class="ai-chat-chips" id="ai-chat-chips" role="group" aria-label="자주 묻는 질문">
    ${AI_CHAT_TOPICS.map((t) => html`<button type="button" class="ai-chip" data-topic="${t.id}" data-q="${t.q}">${t.label}</button>`)}
  </div>
  <form class="ai-chat-form" id="ai-chat-form" autocomplete="off">
    <label class="sr-only" for="ai-chat-input">질문 입력</label>
    <textarea id="ai-chat-input" rows="1" maxlength="1000" placeholder="궁금한 점을 입력하세요" enterkeyhint="send"></textarea>
    <button type="submit" class="ai-chat-send" id="ai-chat-send" aria-label="보내기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
  </form>
  <p class="ai-chat-disclaimer" id="ai-chat-disclaimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg><span>일반 정보 안내이며 <b>진단·처방이 아닙니다.</b> 급한 증상은 전화(<a href="tel:${clinic.phoneTel}">${clinic.phone}</a>)로 문의해 주세요. 대화 내용은 저장하지 않습니다.</span></p>
</section>`
}
