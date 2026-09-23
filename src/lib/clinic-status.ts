// 진료 중 / 점심시간 / 진료 종료 상태 — KST 기준, clinic.hours(요일별 open/close/lunch)와 공휴일 목록으로 계산.
// 서버에서 초기 렌더하고, 브라우저(app.js)에서 1분마다 같은 규칙으로 갱신한다.
// 공휴일 주 수요일 규칙(원장 지시 2026-09-23): 월~일 주간에 수요일이 아닌 평일(월·화·목·금) 공휴일이 있으면
// 그 주 수요일은 평일 시간(목→월→금 순으로 첫 진료 요일 시간)으로 진료한다. 수요일 자체가 공휴일이면 휴진.
import type { Clinic, ClinicHour } from '../data/clinic'

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
export function substituteWednesdayHours(clinic: Pick<Clinic, 'hours'>): ClinicHour | null {
  for (const day of ['목', '월', '금']) {
    const r = clinic.hours.find(h => h.day === day)
    if (r?.open && r.close) return { day: '수', open: r.open, close: r.close, lunch: r.lunch, note: '공휴일 주 진료' }
  }
  return null
}

/** 해당 날짜에 실제 적용되는 시간표 행. 공휴일이면 null, 대체 진료 수요일이면 평일 행. */
export function effectiveHours(clinic: Pick<Clinic, 'hours'>, ymd: string): ClinicHour | null {
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
export function thisWeekSubstituteWednesday(clinic: Pick<Clinic, 'hours'>, now = new Date()): { ymd: string; row: ClinicHour; label: string } | null {
  const today = fromYmd(toYmd(kstNow(now)))
  const wd = today.getUTCDay() || 7 // 월=1 … 일=7
  const wed = new Date(today.getTime() + (3 - wd) * DAY_MS)
  const ymd = toYmd(wed)
  const row = substituteWednesdayHours(clinic)
  if (!row || !isSubstituteWednesday(ymd)) return null
  return { ymd, row, label: `이번 주 수요일(${wed.getUTCMonth() + 1}/${wed.getUTCDate()}) 진료 ${row.open}–${row.close}` }
}

export const SUBSTITUTE_WEDNESDAY_NOTE = '공휴일이 있는 주의 수요일은 정상 진료합니다.'

export interface ClinicStatus { state: 'open' | 'lunch' | 'closed'; label: string; detail: string }

export function clinicStatus(clinic: Clinic, now = new Date()): ClinicStatus {
  const kst = kstNow(now)
  const ymd = toYmd(kst)
  const day = DAYS[kst.getUTCDay()]
  const cur = kst.getUTCHours() * 60 + kst.getUTCMinutes()
  const row = effectiveHours(clinic, ymd)
  const holiday = isHoliday(ymd)
  const nextOpen = (): string => {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(kst.getTime() + i * DAY_MS)
      const r = effectiveHours(clinic, toYmd(d))
      if (r?.open) return `${i === 1 ? '내일' : DAYS[d.getUTCDay()] + '요일'} ${r.open} 진료 시작`
    }
    return '진료 일정은 전화로 확인해 주세요'
  }
  if (holiday || !row?.open || !row.close) return { state: 'closed', label: '진료 종료', detail: holiday ? '공휴일 휴진 · ' + nextOpen() : `${day}요일 휴진 · ` + nextOpen() }
  const o = mins(row.open), c = mins(row.close)
  if (cur < o) return { state: 'closed', label: '진료 전', detail: `오늘 ${row.open} 진료 시작` }
  if (cur >= c) return { state: 'closed', label: '진료 종료', detail: nextOpen() }
  if (row.lunch) {
    const [ls, le] = row.lunch.split(/[–-]/).map(s => mins(s.trim()))
    if (cur >= ls && cur < le) return { state: 'lunch', label: '점심시간', detail: `${row.lunch.replace('–', '~')} · 이후 진료` }
  }
  return { state: 'open', label: '진료 중', detail: `오늘 ${row.close}까지 진료 (접수 마감 30분 전)` }
}
