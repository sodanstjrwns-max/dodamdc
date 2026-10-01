import type { Clinic, ExtraOpenDay, ExtraClosedDay } from '../data/clinic'

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'] as const
const time = (value: unknown): value is string => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)

/** Only a complete, ordered week with valid daytime/lunch intervals may replace the schedule. */
export function parseClinicHours(value: string): Clinic['hours'] | null {
  try {
    const rows = JSON.parse(value)
    if (!Array.isArray(rows) || rows.length !== 7) return null
    const result: Clinic['hours'] = []
    for (let i = 0; i < 7; i++) {
      const row = rows[i]
      if (!row || row.day !== WEEKDAYS[i] || (row.note != null && (typeof row.note !== 'string' || row.note.length > 80))) return null
      const note = String(row.note || '').trim()
      if (row.open === null && row.close === null && row.lunch === null) {
        result.push({ day: row.day, open: null, close: null, lunch: null, note: note === '휴진' ? '' : note })
        continue
      }
      if (!time(row.open) || !time(row.close) || row.open >= row.close) return null
      if (row.lunch !== null) {
        if (typeof row.lunch !== 'string') return null
        const parts = row.lunch.split(/[–—-]/)
        if (parts.length !== 2 || !parts.every(time) || !(row.open < parts[0] && parts[0] < parts[1] && parts[1] < row.close)) return null
        row.lunch = parts.join('–')
      }
      result.push({ day: row.day, open: row.open, close: row.close, lunch: row.lunch, note })
    }
    return result
  } catch { return null }
}

const ymdOk = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(value + 'T00:00:00Z')
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value
}
const noteOk = (value: unknown) => value == null || (typeof value === 'string' && value.length <= 40 && !/[<>\u0000-\u001f]/.test(value))
export const MAX_EXTRA_DAYS = 120

/** 임시 진료일 목록 (날짜 오름차순, 중복 날짜 불가). 형식이 하나라도 틀리면 전체 거부. */
export function parseExtraOpenDays(value: string): ExtraOpenDay[] | null {
  try {
    const rows = JSON.parse(value)
    if (!Array.isArray(rows) || rows.length > MAX_EXTRA_DAYS) return null
    const out: ExtraOpenDay[] = []
    for (const r of rows) {
      if (!r || !ymdOk(r.date) || !time(r.open) || !time(r.close) || r.open >= r.close || !noteOk(r.note)) return null
      let lunch: string | null = null
      if (r.lunch != null) {
        if (typeof r.lunch !== 'string') return null
        const parts = r.lunch.split(/[–—-]/)
        if (parts.length !== 2 || !parts.every(time) || !(r.open < parts[0] && parts[0] < parts[1] && parts[1] < r.close)) return null
        lunch = parts.join('–')
      }
      if (out.some(x => x.date === r.date)) return null
      out.push({ date: r.date, open: r.open, close: r.close, lunch, note: String(r.note || '').trim() })
    }
    return out.sort((a, b) => a.date.localeCompare(b.date))
  } catch { return null }
}

/** 임시 휴진일 목록 */
export function parseExtraClosedDays(value: string): ExtraClosedDay[] | null {
  try {
    const rows = JSON.parse(value)
    if (!Array.isArray(rows) || rows.length > MAX_EXTRA_DAYS) return null
    const out: ExtraClosedDay[] = []
    for (const r of rows) {
      if (!r || !ymdOk(r.date) || !noteOk(r.note) || out.some(x => x.date === r.date)) return null
      out.push({ date: r.date, note: String(r.note || '').trim() })
    }
    return out.sort((a, b) => a.date.localeCompare(b.date))
  } catch { return null }
}
export const isYmd = ymdOk
export const isHm = time

export function clinicHoursFromForm(fields: Record<string, unknown>): Clinic['hours'] | null {
  const rows = WEEKDAYS.map((day, i) => {
    const get = (key: string) => String(fields[`hours.${i}.${key}`] ?? '').trim()
    if (!['open', 'closed'].includes(get('status'))) return null
    const closed = get('status') === 'closed'
    const from = get('lunchStart'), to = get('lunchEnd')
    return { day, open: closed ? null : get('open'), close: closed ? null : get('close'), lunch: closed || (!from && !to) ? null : `${from}–${to}`, note: get('note') }
  })
  return parseClinicHours(JSON.stringify(rows))
}

export const hoursNotices = (clinic: Clinic) => [clinic.hoursException, clinic.hoursNote].filter(Boolean).join(' ')
export const dayHoursText = (clinic: Clinic, day: string) => {
  const row = clinic.hours.find(h => h.day === day)
  return row?.open ? `${day}요일 ${row.open}–${row.close}` : `${day}요일 휴진`
}
export const lunchHoursText = (clinic: Clinic) => {
  const rows = clinic.hours.filter(h => h.open && h.lunch).map(h => `${h.day}요일 ${h.lunch}`)
  return rows.length ? `${rows.join(', ')}은 점심시간입니다.` : '기본 시간표에 별도 점심시간이 없습니다.'
}
