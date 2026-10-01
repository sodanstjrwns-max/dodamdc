import { html } from 'hono/html'
import type { Clinic } from '../data/clinic'
import { effectiveHours, extraOpenOn, extraClosedOn, substituteWednesdayHours, upcomingSpecialDays, shortDate, kstNow, toYmd } from './clinic-status'

const DAY_MS = 86400000
/** 임시 진료일 기본 시간 = 공휴일 주 수요일에 쓰는 평일 시간 (목→월→금 순) */
export function defaultExtraHours(clinic: Clinic) {
  const sub = substituteWednesdayHours(clinic)
  return { open: sub?.open || '09:00', close: sub?.close || '18:00', lunch: sub?.lunch ?? null }
}
const timeRange = (r: { open: string | null; close: string | null; lunch?: string | null }) => `${r.open}–${r.close}${r.lunch ? ` (점심 ${r.lunch})` : ''}`
const actionForm = (action: string, date: string, ret: string, label: string, cls = 'btn btn-outline btn-sm', confirm = '') =>
  html`<form method="post" action="/admin/settings/special-days" class="inline" ${confirm ? html`data-confirm="${confirm}"` : html`data-once`}><input type="hidden" name="action" value="${action}"><input type="hidden" name="date" value="${date}"><input type="hidden" name="return" value="${ret}"><button type="submit" class="${cls}">${label}</button></form>`

/** '오늘' 한 번에 바꾸기 — 진료시간 화면과 대시보드 상단에 함께 쓴다. */
export function todayQuickPanel(clinic: Clinic, ret: 'settings' | 'dash') {
  const kst = kstNow(), ymd = toYmd(kst)
  const label = `오늘 ${shortDate(ymd)}`
  const def = defaultExtraHours(clinic)
  const manualOpen = extraOpenOn(clinic, ymd), manualClosed = extraClosedOn(clinic, ymd)
  const row = effectiveHours(clinic, ymd)
  let body
  if (manualOpen) body = html`<p class="admin-today-state is-open"><strong>${label}은 임시 진료일로 표시 중입니다.</strong> ${timeRange(manualOpen)}</p>${actionForm('remove-open', ymd, ret, '오늘 임시 진료 취소', 'btn btn-outline', '오늘 임시 진료 표시를 취소할까요? 홈페이지에 다시 휴진으로 표시됩니다.')}`
  else if (manualClosed) body = html`<p class="admin-today-state is-closed"><strong>${label}은 임시 휴진으로 표시 중입니다.</strong></p>${actionForm('remove-closed', ymd, ret, '임시 휴진 취소', 'btn btn-outline')}`
  else if (row) body = html`<p class="admin-today-state is-open"><strong>${label}은 진료일입니다.</strong> ${timeRange(row)} · 따로 바꿀 필요가 없습니다.</p>${actionForm('today-closed', ymd, ret, '오늘 임시 휴진으로 표시', 'btn btn-outline btn-sm', '오늘을 임시 휴진으로 표시할까요?')}`
  else body = html`<p class="admin-today-state is-closed"><strong>${label}은 휴진일로 표시되어 있습니다.</strong> 오늘 진료하시면 아래 버튼을 눌러 주세요.</p>${actionForm('today-open', ymd, ret, `오늘 진료로 표시 (${def.open}–${def.close})`, 'btn btn-primary btn-block admin-today-btn')}`
  return html`<div class="admin-today" id="today-status">${body}${ret === 'dash' ? html`<p class="hint"><a href="/admin/settings#special-days">다른 날짜 지정·목록 보기 →</a></p>` : ''}</div>`
}

/** 임시 진료일·임시 휴진일 편집 (원장 요청 2026-10-01: 쉬는 수요일에 진료할 때 쉽게 '진료 중' 표시) */
export function specialDaysEditor(clinic: Clinic) {
  const kst = kstNow(), today = toYmd(kst)
  const max = toYmd(new Date(Date.parse(today + 'T00:00:00Z') + 365 * DAY_MS))
  const def = defaultExtraHours(clinic)
  const lunch = def.lunch?.split(/[–—-]/) || []
  const list = upcomingSpecialDays(clinic, new Date(), 366)
  return html`<section id="special-days" class="ops-panel admin-special-panel" aria-labelledby="special-title">
    <h2 id="special-title">임시 진료일·휴진일</h2>
    <p>원래 쉬는 날(수요일 등)에 진료하거나, 진료하는 날에 쉬게 되면 <strong>그 날짜만</strong> 추가하세요. 홈페이지 상단 '진료 중' 표시, 진료시간 안내, 검색엔진 정보에 1분 안에 반영됩니다. 지난 날짜는 목록에서 자동으로 사라집니다.</p>
    ${todayQuickPanel(clinic, 'settings')}
    <form method="post" action="/admin/settings/special-days" class="admin-hours-form admin-special-form" data-once>
      <input type="hidden" name="action" value="add"><input type="hidden" name="return" value="settings">
      <div class="admin-hours-times admin-special-head"><label for="sp-date">날짜<input type="date" id="sp-date" name="date" required min="${today}" max="${max}" value="${today}"></label>
      <label for="sp-kind">구분<select id="sp-kind" name="kind"><option value="open">임시 진료 (진료함)</option><option value="closed">임시 휴진</option></select></label></div>
      <div class="admin-hours-times admin-special-times"><label for="sp-open">진료 시작<input type="time" id="sp-open" name="open" value="${def.open}"></label><label for="sp-close">진료 종료<input type="time" id="sp-close" name="close" value="${def.close}"></label></div>
      <div class="admin-hours-times admin-special-times"><label for="sp-lunchStart">점심 시작<input type="time" id="sp-lunchStart" name="lunchStart" value="${lunch[0] || ''}"></label><label for="sp-lunchEnd">점심 종료<input type="time" id="sp-lunchEnd" name="lunchEnd" value="${lunch[1] || ''}"></label></div>
      <label for="sp-note">메모 (선택, 홈페이지에는 표시되지 않음)<input id="sp-note" name="note" maxlength="40" placeholder="예: 원장님 학회 대체 진료"></label>
      <p class="hint">시간은 기본값(공휴일 주 수요일과 같은 평일 시간) 그대로 두면 됩니다. 임시 휴진을 고르면 시간은 무시됩니다. 같은 날짜를 다시 추가하면 새 값으로 바뀝니다.</p>
      <button type="submit" class="btn btn-primary">날짜 추가</button>
    </form>
    <h3 class="h4">앞으로의 임시 일정 <small class="hint">(1년)</small></h3>
    ${list.length ? html`<ul class="admin-special-list">${list.map(d => html`<li class="${d.kind === 'open' ? 'is-open' : 'is-closed'}">
      <span class="sp-date">${d.ymd.slice(0, 4) !== today.slice(0, 4) ? `${d.ymd.slice(0, 4)}년 ` : ''}${shortDate(d.ymd)}${d.ymd === today ? ' · 오늘' : ''}</span>
      <span class="sp-kind">${d.kind === 'open' ? `진료 ${d.row ? timeRange(d.row) : ''}` : '휴진'}</span>
      <span class="sp-src">${d.source === 'auto' ? '자동 · 공휴일 있는 주 수요일' : d.kind === 'open' ? `직접 추가${d.note ? ' · ' + d.note : ''}` : `직접 추가${d.note ? ' · ' + d.note : ''}${d.baseOpen ? '' : ' · 원래 휴진일'}`}</span>
      <span class="sp-act">${d.source === 'auto'
        ? actionForm('add-closed', d.ymd, 'settings', '이날 휴진', 'btn btn-outline btn-sm', `${shortDate(d.ymd)}을 휴진으로 바꿀까요? (공휴일 주 자동 진료 대신)`)
        : actionForm(d.kind === 'open' ? 'remove-open' : 'remove-closed', d.ymd, 'settings', '삭제', 'btn btn-danger btn-sm', `${shortDate(d.ymd)} 임시 ${d.kind === 'open' ? '진료' : '휴진'}을 삭제할까요?`)}</span>
    </li>`)}</ul>` : html`<p class="hint">앞으로 1년 동안 지정된 임시 일정이 없습니다.</p>`}
    <p class="hint">'자동'은 공휴일이 있는 주의 수요일이라 따로 추가하지 않아도 진료로 표시됩니다. 그 수요일에 쉬신다면 '이날 휴진'을 누르세요.</p>
  </section>`
}

export function hoursEditor(clinic: Clinic) {
  return html`<section id="hours" class="ops-panel admin-hours-panel" aria-labelledby="hours-title">
    <h2 id="hours-title">요일별 진료시간·휴진</h2>
    <p><strong>매주 반복되는 기본 시간표</strong>입니다. 특정 날짜 하루만 다르면 여기를 바꾸지 말고 위의 <a href="#special-days">임시 진료일·휴진일</a>에 날짜를 추가하세요. 바꾼 뒤 아래 저장 버튼을 누르면 홈·푸터·진료시간·예약 안내에 함께 반영됩니다.</p>
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
      <p class="hint">예외 안내는 적은 문구 그대로 표시됩니다. 날짜별 진료·휴진 표시는 위의 '임시 진료일·휴진일'에서 지정하세요 (공휴일이 있는 주의 수요일은 자동으로 진료 표시).</p>
      <div class="admin-hours-savebar"><button type="submit" class="btn btn-primary">진료시간 저장</button></div>
    </form>
  </section>`
}
