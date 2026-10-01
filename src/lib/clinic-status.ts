// 진료 중 / 점심시간 / 진료 종료 상태 — KST 기준, clinic.hours(요일별 open/close/lunch)와 공휴일 목록으로 계산.
// 서버에서 초기 렌더하고, 브라우저(app.js)에서 1분마다 같은 규칙으로 갱신한다.
// 공휴일 주 수요일 규칙(원장 지시 2026-09-23): 월~일 주간에 수요일이 아닌 평일(월·화·목·금) 공휴일이 있으면
// 그 주 수요일은 평일 시간(목→월→금 순으로 첫 진료 요일 시간)으로 진료한다. 수요일 자체가 공휴일이면 휴진.
// 날짜별 예외(원장 요청 2026-10-01): 관리자에서 지정한 임시 휴진일 → 휴진, 임시 진료일 → 그 시간으로 진료가 위 규칙보다 우선한다.
import type { Clinic, ClinicHour } from '../data/clinic'

/** 시간 계산에 필요한 병원 데이터. 날짜별 예외는 없을 수 있다(테스트·기본값). */
export type HoursSource = Pick<Clinic, 'hours'> & Partial<Pick<Clinic, 'extraOpenDays' | 'extraClosedDays'>>

// 대한민국 공휴일 (2026~2027, 대체공휴일 포함). 임시공휴일은 관리자 '진료시간·기본정보'의 예외 문구로 안내.
export const KR_HOLIDAYS = [
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01','2026-03-02','2026-05-05','2026-05-24','2026-05-25','2026-06-03','2026-06-06','2026-08-15','2026-08-17','2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-05','2026-10-09','2026-12-25',
  '2027-01-01','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-03-01','2027-05-05','2027-05-13','2027-06-06','2027-08-15','2027-08-16','2027-09-14','2027-09-15','2027-09-16','2027-10-03','2027-10-04','2027-10-09','2027-10-11','2027-12-25','2027-12-27',
]
const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const DAY_MS = 86400000

/** UTC 자정 기준 Date ↔ 'YYYY-MM-DD' (요일 계산 전용, 시간대 영향 없음) */
const fromYmd = (ymd: string) => new Date(ymd + 'T00:00:00Z')
export const toYmd = (d: Date) => d.toISOString().slice(0, 10)
/** 현재 시각을 KST 벽시계 값으로 옮긴 Date (getUTC* 로 읽는다) */
export const kstNow = (now = new Date()) => new Date(now.getTime() + 9 * 60 * 60 * 1000)
export const dayOf = (ymd: string) => DAYS[fromYmd(ymd).getUTCDay()]
export const isHoliday = (ymd: string) => KR_HOLIDAYS.includes(ymd)

/** 공휴일이 있는 주(월~일)의 수요일인가. 수요일 자체가 공휴일이거나 주말 공휴일만 있는 주는 해당 없음. */
export function isSubstituteWednesday(ymd: string): boolean {
  const d = fromYmd(ymd)
  if (d.getUTCDay() !== 3 || isHoliday(ymd)) return false
  for (let off = -2; off <= 4; off++) {
    if (off === 0) continue
    const other = new Date(d.getTime() + off * DAY_MS)
    const wd = other.getUTCDay()
    if (wd >= 1 && wd <= 5 && isHoliday(toYmd(other))) return true
  }
  return false
}

/** 대체 진료 수요일에 적용할 평일 시간표 행 (목 → 월 → 금 순으로 첫 진료 요일) */
export function substituteWednesdayHours(clinic: HoursSource): ClinicHour | null {
  for (const day of ['목', '월', '금']) {
    const r = clinic.hours.find(h => h.day === day)
    if (r?.open && r.close) return { day: '수', open: r.open, close: r.close, lunch: r.lunch, note: '공휴일 주 진료' }
  }
  return null
}

export const extraClosedOn = (clinic: HoursSource, ymd: string) => clinic.extraClosedDays?.find(d => d.date === ymd) || null
export const extraOpenOn = (clinic: HoursSource, ymd: string) => clinic.extraOpenDays?.find(d => d.date === ymd) || null

/** 해당 날짜에 실제 적용되는 시간표 행.
 *  우선순위: 임시 휴진일 → null, 임시 진료일 → 그 시간, 공휴일 → null, 공휴일 주 수요일 → 평일 행, 그 외 요일 시간표. */
export function effectiveHours(clinic: HoursSource, ymd: string): ClinicHour | null {
  if (extraClosedOn(clinic, ymd)) return null
  const extra = extraOpenOn(clinic, ymd)
  if (extra) return { day: dayOf(ymd), open: extra.open, close: extra.close, lunch: extra.lunch, note: extra.note || '임시 진료' }
  if (isHoliday(ymd)) return null
  const day = dayOf(ymd)
  const row = clinic.hours.find(h => h.day === day) || null
  if (day === '수' && !row?.open && isSubstituteWednesday(ymd)) return substituteWednesdayHours(clinic)
  return row?.open && row.close ? row : null
}

/** from(포함)부터 months 개월 동안의 대체 진료 수요일 목록 */
export function substituteWednesdays(from: Date = new Date(), months = 12): string[] {
  const start = fromYmd(toYmd(kstNow(from)))
  const end = new Date(start.getTime()); end.setUTCMonth(end.getUTCMonth() + months)
  const out: string[] = []
  const first = new Date(start.getTime() + ((3 - start.getUTCDay() + 7) % 7) * DAY_MS)
  for (let d = first; d < end; d = new Date(d.getTime() + 7 * DAY_MS)) { const ymd = toYmd(d); if (isSubstituteWednesday(ymd)) out.push(ymd) }
  return out
}

/** 이번 주(월~일)에 대체 진료 수요일이 있으면 그 날짜와 시간표. 진료시간 표의 강조 문구용. */
export function thisWeekSubstituteWednesday(clinic: HoursSource, now = new Date()): { ymd: string; row: ClinicHour; label: string } | null {
  const today = fromYmd(toYmd(kstNow(now)))
  const wd = today.getUTCDay() || 7 // 월=1 … 일=7
  const wed = new Date(today.getTime() + (3 - wd) * DAY_MS)
  const ymd = toYmd(wed)
  const row = substituteWednesdayHours(clinic)
  if (!row || !isSubstituteWednesday(ymd)) return null
  return { ymd, row, label: `이번 주 수요일(${wed.getUTCMonth() + 1}/${wed.getUTCDate()}) 진료 ${row.open}–${row.close}` }
}

/** baseOpen: 날짜별 예외가 없었다면 진료하는 날인지 (임시 휴진일 안내가 의미 있는지 판단) */
export type SpecialDay = { ymd: string; kind: 'open' | 'closed'; source: 'auto' | 'manual'; row: ClinicHour | null; note: string; baseOpen: boolean }

/** from(KST 오늘 포함)부터 days일 동안 기본 시간표와 다르게 운영되는 날:
 *  자동(공휴일 주 수요일) + 직접 추가한 임시 진료일·임시 휴진일. 날짜 오름차순. */
export function upcomingSpecialDays(clinic: HoursSource, from: Date = new Date(), days = 366): SpecialDay[] {
  const start = toYmd(kstNow(from))
  const endDate = new Date(fromYmd(start).getTime() + days * DAY_MS)
  const end = toYmd(endDate)
  const inRange = (ymd: string) => ymd >= start && ymd < end
  const out: SpecialDay[] = []
  const base: HoursSource = { hours: clinic.hours }
  const baseOpen = (ymd: string) => !!effectiveHours(base, ymd)
  for (const d of clinic.extraOpenDays || []) if (inRange(d.date)) out.push({ ymd: d.date, kind: 'open', source: 'manual', row: effectiveHours(clinic, d.date), note: d.note, baseOpen: baseOpen(d.date) })
  for (const d of clinic.extraClosedDays || []) if (inRange(d.date)) out.push({ ymd: d.date, kind: 'closed', source: 'manual', row: null, note: d.note, baseOpen: baseOpen(d.date) })
  const sub = substituteWednesdayHours(clinic)
  const wedRow = clinic.hours.find(h => h.day === '수')
  if (sub && !wedRow?.open) {
    for (const ymd of substituteWednesdays(from, Math.ceil(days / 30) + 1)) {
      if (!inRange(ymd) || out.some(x => x.ymd === ymd)) continue
      out.push({ ymd, kind: 'open', source: 'auto', row: sub, note: '공휴일 주 진료', baseOpen: true })
    }
  }
  return out.filter(x => x.kind === 'closed' || x.row).sort((a, b) => a.ymd.localeCompare(b.ymd))
}

/** 'M/D(요일)' */
export const shortDate = (ymd: string) => { const d = fromYmd(ymd); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${DAYS[d.getUTCDay()]})` }

/** 사람이 읽는 한 줄: '수요일(10/7) 진료 09:00–18:00' / '목요일(10/8) 임시 휴진' */
export function specialDayLabel(d: SpecialDay, prefix = '') {
  const dt = fromYmd(d.ymd)
  const head = `${prefix}${DAYS[dt.getUTCDay()]}요일(${dt.getUTCMonth() + 1}/${dt.getUTCDate()})`
  return d.kind === 'open' && d.row ? `${head} 진료 ${d.row.open}–${d.row.close}` : `${head} 임시 휴진`
}

/** 이번 주(월~일) 남은 날(오늘 포함) 중 기본 시간표와 다른 날의 안내 문구. 진료시간 표·푸터·예약 안내용. */
export function thisWeekSpecialLines(clinic: HoursSource, now = new Date()): string[] {
  const today = fromYmd(toYmd(kstNow(now)))
  const wd = today.getUTCDay() || 7
  return upcomingSpecialDays(clinic, now, 8 - wd).filter(d => d.kind === 'open' || d.baseOpen).map(d => specialDayLabel(d, '이번 주 '))
}

/** 짧은 목록 문구: '10/1(수) 임시 진료 09:00–18:00, 10/7(수) 진료 09:00–18:00(공휴일 주), 10/8(목) 임시 휴진' */
export function specialDaysText(days: SpecialDay[]): string {
  return days.filter(d => d.kind === 'open' || d.baseOpen).map(d => d.kind === 'open' && d.row
    ? `${shortDate(d.ymd)} ${d.source === 'manual' ? '임시 진료' : '진료'} ${d.row.open}–${d.row.close}${d.source === 'auto' ? '(공휴일 주)' : ''}`
    : `${shortDate(d.ymd)} 임시 휴진`).join(', ')
}

/** 브라우저(app.js) 1분 갱신용 날짜별 예외 데이터 — 오늘 이후 것만 */
export function clientSpecialDays(clinic: HoursSource, now = new Date()) {
  const today = toYmd(kstNow(now))
  return {
    open: (clinic.extraOpenDays || []).filter(d => d.date >= today).map(d => ({ date: d.date, open: d.open, close: d.close, lunch: d.lunch })),
    closed: (clinic.extraClosedDays || []).filter(d => d.date >= today).map(d => d.date),
  }
}

export const SUBSTITUTE_WEDNESDAY_NOTE = '공휴일이 있는 주의 수요일은 정상 진료합니다.'

export interface ClinicStatus { state: 'open' | 'lunch' | 'closed'; label: string; detail: string }

export function clinicStatus(clinic: HoursSource, now = new Date()): ClinicStatus {
  const kst = kstNow(now)
  const ymd = toYmd(kst)
  const day = DAYS[kst.getUTCDay()]
  const cur = kst.getUTCHours() * 60 + kst.getUTCMinutes()
  const row = effectiveHours(clinic, ymd)
  const holiday = isHoliday(ymd)
  const manualClosed = !!extraClosedOn(clinic, ymd)
  const nextOpen = (): string => {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(kst.getTime() + i * DAY_MS)
      const r = effectiveHours(clinic, toYmd(d))
      if (r?.open) return `${i === 1 ? '내일' : DAYS[d.getUTCDay()] + '요일'} ${r.open} 진료 시작`
    }
    return '진료 일정은 전화로 확인해 주세요'
  }
  if (!row?.open || !row.close) return { state: 'closed', label: '진료 종료', detail: (manualClosed ? '오늘 임시 휴진 · ' : holiday ? '공휴일 휴진 · ' : `${day}요일 휴진 · `) + nextOpen() }
  const o = mins(row.open), c = mins(row.close)
  if (cur < o) return { state: 'closed', label: '진료 전', detail: `오늘 ${row.open} 진료 시작` }
  if (cur >= c) return { state: 'closed', label: '진료 종료', detail: nextOpen() }
  if (row.lunch) {
    const [ls, le] = row.lunch.split(/[–-]/).map(s => mins(s.trim()))
    if (cur >= ls && cur < le) return { state: 'lunch', label: '점심시간', detail: `${row.lunch.replace('–', '~')} · 이후 진료` }
  }
  return { state: 'open', label: '진료 중', detail: `오늘 ${row.close}까지 진료 (접수 마감 30분 전)` }
}
