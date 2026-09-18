// 진료 중 / 점심시간 / 진료 종료 상태 — KST 기준, clinic.hours(요일별 open/close/lunch)와 공휴일 목록으로 계산.
// 서버에서 초기 렌더하고, 브라우저(app.js)에서 1분마다 같은 규칙으로 갱신한다.
import type { Clinic } from '../data/clinic'

// 대한민국 공휴일 (2026~2027, 대체공휴일 포함). 임시공휴일은 관리자 '진료시간·기본정보'의 예외 문구로 안내.
export const KR_HOLIDAYS = [
  '2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01','2026-03-02','2026-05-05','2026-05-24','2026-05-25','2026-06-03','2026-06-06','2026-08-15','2026-08-17','2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-05','2026-10-09','2026-12-25',
  '2027-01-01','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-03-01','2027-05-05','2027-05-13','2027-06-06','2027-08-15','2027-08-16','2027-09-14','2027-09-15','2027-09-16','2027-10-03','2027-10-04','2027-10-09','2027-10-11','2027-12-25',
]
const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

export interface ClinicStatus { state: 'open' | 'lunch' | 'closed'; label: string; detail: string }

export function clinicStatus(clinic: Clinic, now = new Date()): ClinicStatus {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const ymd = kst.toISOString().slice(0, 10)
  const day = DAYS[kst.getUTCDay()]
  const cur = kst.getUTCHours() * 60 + kst.getUTCMinutes()
  const row = clinic.hours.find(h => h.day === day)
  const holiday = KR_HOLIDAYS.includes(ymd)
  const nextOpen = (): string => {
    for (let i = 1; i <= 7; i++) {
      const d = new Date(kst.getTime() + i * 86400000)
      const r = clinic.hours.find(h => h.day === DAYS[d.getUTCDay()])
      if (r?.open && !KR_HOLIDAYS.includes(d.toISOString().slice(0, 10))) return `${i === 1 ? '내일' : DAYS[d.getUTCDay()] + '요일'} ${r.open} 진료 시작`
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
