import { html } from 'hono/html'
import type { Clinic } from '../data/clinic'

export function hoursEditor(clinic: Clinic) {
  return html`<section id="hours" class="ops-panel admin-hours-panel" aria-labelledby="hours-title">
    <h2 id="hours-title">요일별 진료시간·휴진</h2>
    <p>진료·휴진과 시간을 바꾼 뒤 아래 저장 버튼을 누르세요. 홈·푸터·진료시간·예약 안내에 함께 반영됩니다. 예외가 있는 주의 안내는 시간표 아래에서 수정할 수 있습니다.</p>
    <form method="post" action="/admin/settings" class="admin-hours-form" data-once>
      <input type="hidden" name="hoursIncluded" value="1">
      <nav class="admin-hours-jump" aria-label="수정할 요일 바로가기">${clinic.hours.map((h, i) => html`<a href="#hours-day-${i}">${h.day}</a>`)}</nav>
      <div class="admin-hours-grid">${clinic.hours.map((h, i) => {
        const lunch = h.lunch?.split(/[–—-]/) || []
        return html`<fieldset id="hours-day-${i}" class="admin-hours-day"><legend>${h.day}요일</legend>
          <label for="hours-${i}-status">진료 여부<select id="hours-${i}-status" name="hours.${i}.status"><option value="open" ${h.open ? 'selected' : ''}>진료</option><option value="closed" ${!h.open ? 'selected' : ''}>휴진</option></select></label>
          <div class="admin-hours-times"><label for="hours-${i}-open">진료 시작<input type="time" id="hours-${i}-open" name="hours.${i}.open" value="${h.open || '09:00'}"></label><label for="hours-${i}-close">진료 종료<input type="time" id="hours-${i}-close" name="hours.${i}.close" value="${h.close || '18:00'}"></label></div>
          <div class="admin-hours-times"><label for="hours-${i}-lunchStart">점심 시작<input type="time" id="hours-${i}-lunchStart" name="hours.${i}.lunchStart" value="${lunch[0] || ''}"></label><label for="hours-${i}-lunchEnd">점심 종료<input type="time" id="hours-${i}-lunchEnd" name="hours.${i}.lunchEnd" value="${lunch[1] || ''}"></label></div>
          <label for="hours-${i}-note">요일별 비고<input id="hours-${i}-note" name="hours.${i}.note" value="${h.note || ''}" maxlength="80" placeholder="예: 야간진료"></label>
          <p class="hint">휴진을 선택하면 시간은 적용되지 않습니다. 점심시간이 없으면 두 칸 모두 비워주세요.</p>
        </fieldset>`
      })}</div>
      <label for="hours-exception">예외 진료 안내<textarea id="hours-exception" name="hoursException" rows="3" maxlength="3000">${clinic.hoursException}</textarea></label>
      <label for="hours-note">공휴일·접수 마감 등 공통 안내<textarea id="hours-note" name="hoursNote" rows="2" maxlength="3000">${clinic.hoursNote}</textarea></label>
      <p class="hint">예외 안내는 문구로 표시됩니다. 공휴일 달력에 맞춰 시간표를 자동 변경하거나 예약을 확정하는 기능은 아닙니다.</p>
      <div class="admin-hours-savebar"><button type="submit" class="btn btn-primary">진료시간 저장</button></div>
    </form>
  </section>`
}
