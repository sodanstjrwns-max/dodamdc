import type { Clinic } from '../data/clinic'

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
