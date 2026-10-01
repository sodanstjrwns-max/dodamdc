// 공휴일 주 수요일 진료 규칙 검증 (원장 지시 2026-09-23). 로컬 계산만, 네트워크·DB 없음.
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const compiled = await build({ stdin: { resolveDir: process.cwd(), contents: `
export { clinicStatus, isSubstituteWednesday, effectiveHours, substituteWednesdays, thisWeekSubstituteWednesday, KR_HOLIDAYS } from './src/lib/clinic-status';
export { clinicDefaults } from './src/data/clinic';
export { upcomingSpecialDays, thisWeekSpecialLines, specialDaysText, clientSpecialDays } from './src/lib/clinic-status';
export { specialOpeningHours } from './src/lib/seo';
export { parseExtraOpenDays, parseExtraClosedDays } from './src/lib/clinic-hours';
export { validSetting } from './src/lib/settings';
` }, bundle: true, write: false, format: 'esm', platform: 'node' })
const m = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'))
const { clinicStatus, isSubstituteWednesday, effectiveHours, substituteWednesdays, thisWeekSubstituteWednesday, clinicDefaults: clinic } = m

const kst = (ymd, hm) => new Date(`${ymd}T${hm}:00+09:00`)

// 1) 추석 주(9/24~26 공휴일) 수요일 9/23 → 진료
assert.equal(isSubstituteWednesday('2026-09-23'), true)
assert.deepEqual(effectiveHours(clinic, '2026-09-23'), { day: '수', open: '09:00', close: '18:00', lunch: '13:00–14:00', note: '공휴일 주 진료' })
assert.equal(clinicStatus(clinic, kst('2026-09-23', '10:30')).label, '진료 중')
assert.equal(clinicStatus(clinic, kst('2026-09-23', '13:20')).label, '점심시간')
assert.equal(clinicStatus(clinic, kst('2026-09-23', '19:00')).label, '진료 종료')
assert.doesNotMatch(clinicStatus(clinic, kst('2026-09-23', '19:00')).detail, /수요일 휴진/)
assert.equal(clinicStatus(clinic, kst('2026-09-23', '08:00')).label, '진료 전')
// 9/22(화) 저녁: 다음 진료는 '내일 09:00' (수요일 대체 진료)
assert.equal(clinicStatus(clinic, kst('2026-09-22', '21:00')).detail, '내일 09:00 진료 시작')

// 2) 10/3(토)·10/5(월)·10/9(금) 주 수요일 10/7 → 진료
assert.equal(isSubstituteWednesday('2026-10-07'), true)
assert.equal(clinicStatus(clinic, kst('2026-10-07', '15:00')).label, '진료 중')

// 3) 평소 수요일 → 휴진
assert.equal(isSubstituteWednesday('2026-09-16'), false)
assert.equal(effectiveHours(clinic, '2026-09-16'), null)
assert.match(clinicStatus(clinic, kst('2026-09-16', '11:00')).detail, /^수요일 휴진/)

// 4) 수요일 자체가 공휴일(6/3 지방선거) → 휴진
assert.equal(isSubstituteWednesday('2026-06-03'), false)
assert.match(clinicStatus(clinic, kst('2026-06-03', '11:00')).detail, /^공휴일 휴진/)

// 5) 토요일만 공휴일인 주(6/6 현충일 주는 6/3 수요일 공휴일이라 이미 휴진), 일요일만 공휴일인 주는 해당 없음
assert.equal(isSubstituteWednesday('2027-06-09'), false) // 2027-06-06 일요일

// 6) 12개월 목록에 9/23·10/7 포함, 일반 수요일 미포함
const list = substituteWednesdays(kst('2026-09-21', '09:00'), 12)
assert.ok(list.includes('2026-09-23') && list.includes('2026-10-07') && !list.includes('2026-09-16'))
assert.ok(list.every(d => isSubstituteWednesday(d)))

// 7) 이번 주 강조 문구
assert.equal(thisWeekSubstituteWednesday(clinic, kst('2026-09-21', '09:00'))?.label, '이번 주 수요일(9/23) 진료 09:00–18:00')
assert.equal(thisWeekSubstituteWednesday(clinic, kst('2026-09-27', '09:00'))?.ymd, '2026-09-23') // 일요일까지 같은 주
assert.equal(thisWeekSubstituteWednesday(clinic, kst('2026-09-28', '09:00')), null)

// 8) 날짜별 예외 (원장 요청 2026-10-01): 임시 진료일·임시 휴진일
const { upcomingSpecialDays, thisWeekSpecialLines, specialDaysText, clientSpecialDays, specialOpeningHours, parseExtraOpenDays, parseExtraClosedDays, validSetting } = m
const special = { ...clinic,
  extraOpenDays: [{ date: '2026-10-14', open: '09:00', close: '18:00', lunch: '13:00–14:00', note: '' }, { date: '2026-10-09', open: '10:00', close: '15:00', lunch: null, note: '한글날 임시' }],
  extraClosedDays: [{ date: '2026-10-08', note: '학회' }, { date: '2026-10-21', note: '' }] }
// 평소 휴진 수요일(10/14)에 임시 진료
assert.equal(clinicStatus(clinic, kst('2026-10-14', '10:30')).label, '진료 종료')
assert.equal(clinicStatus(special, kst('2026-10-14', '10:30')).label, '진료 중')
assert.equal(clinicStatus(special, kst('2026-10-14', '13:30')).label, '점심시간')
assert.equal(clinicStatus(special, kst('2026-10-13', '21:00')).detail, '내일 09:00 진료 시작')
// 공휴일 주 수요일 10/7 자동 진료 유지, 10/8(목) 임시 휴진
assert.equal(clinicStatus(special, kst('2026-10-07', '10:00')).label, '진료 중')
assert.equal(clinicStatus(special, kst('2026-10-08', '10:00')).label, '진료 종료')
assert.match(clinicStatus(special, kst('2026-10-08', '10:00')).detail, /^오늘 임시 휴진 · /)
assert.equal(clinicStatus(special, kst('2026-10-07', '19:00')).detail, '금요일 10:00 진료 시작') // 10/8 휴진 → 10/9 임시 진료(한글날이지만 직접 지정)
// 공휴일(10/9)이라도 직접 지정하면 진료
assert.equal(clinicStatus(special, kst('2026-10-09', '11:00')).label, '진료 중')
// 평소 수요일 10/28 휴진, 평소 목요일(10/1) 진료
assert.match(clinicStatus(special, kst('2026-10-28', '11:00')).detail, /^수요일 휴진/)
assert.equal(clinicStatus(special, kst('2026-10-01', '11:00')).label, '진료 중')
// 자동 수요일도 임시 휴진으로 덮을 수 있음
assert.equal(effectiveHours({ ...clinic, extraClosedDays: [{ date: '2026-10-07', note: '' }] }, '2026-10-07'), null)
// 목록: 10/7 자동, 10/8 휴진, 10/9 수동, 10/14 수동, 10/21 휴진(원래 휴진 수요일)
const up = upcomingSpecialDays(special, kst('2026-10-01', '09:00'), 30)
assert.deepEqual(up.map(d => `${d.ymd}:${d.kind}:${d.source}`), ['2026-10-07:open:auto', '2026-10-08:closed:manual', '2026-10-09:open:manual', '2026-10-14:open:manual', '2026-10-21:closed:manual'])
assert.equal(up.find(d => d.ymd === '2026-10-21').baseOpen, false)
assert.equal(specialDaysText(up), '10/7(수) 진료 09:00–18:00(공휴일 주), 10/8(목) 임시 휴진, 10/9(금) 임시 진료 10:00–15:00, 10/14(수) 임시 진료 09:00–18:00')
// 지난 날짜는 목록에서 제외
assert.ok(!upcomingSpecialDays(special, kst('2026-10-15', '09:00'), 30).some(d => d.ymd <= '2026-10-14'))
// 이번 주 문구 (10/5 월요일 기준: 10/7 자동, 10/8 휴진, 10/9 임시 진료 / 10/12 월요일 기준: 10/14)
assert.deepEqual(thisWeekSpecialLines(special, kst('2026-10-05', '09:00')), ['이번 주 수요일(10/7) 진료 09:00–18:00', '이번 주 목요일(10/8) 임시 휴진', '이번 주 금요일(10/9) 진료 10:00–15:00'])
assert.deepEqual(thisWeekSpecialLines(special, kst('2026-10-12', '09:00')), ['이번 주 수요일(10/14) 진료 09:00–18:00'])
assert.deepEqual(thisWeekSpecialLines(special, kst('2026-10-15', '09:00')), [])
// 스키마: 날짜 지정 영업시간 — 10/14 점심 분할 2구간, 10/8 종일 휴무 00:00, 원래 휴진일 10/21은 생략
const sp = specialOpeningHours(special, kst('2026-10-01', '09:00'))
assert.deepEqual(sp.filter(x => x.validFrom === '2026-10-14').map(x => `${x.dayOfWeek}|${x.opens}-${x.closes}`), ['https://schema.org/Wednesday|09:00-13:00', 'https://schema.org/Wednesday|14:00-18:00'])
assert.deepEqual(sp.filter(x => x.validFrom === '2026-10-08').map(x => `${x.dayOfWeek}|${x.opens}-${x.closes}`), ['https://schema.org/Thursday|00:00-00:00'])
assert.ok(!sp.some(x => x.validFrom === '2026-10-21'))
assert.deepEqual(clientSpecialDays(special, kst('2026-10-09', '09:00')).closed, ['2026-10-21'])
// 저장 형식 검증
assert.ok(parseExtraOpenDays('[{"date":"2026-10-01","open":"09:00","close":"18:00","lunch":"13:00-14:00","note":""}]'))
assert.equal(parseExtraOpenDays('[{"date":"2026-02-30","open":"09:00","close":"18:00","lunch":null}]'), null)
assert.equal(parseExtraOpenDays('[{"date":"2026-10-01","open":"18:00","close":"09:00","lunch":null}]'), null)
assert.equal(parseExtraOpenDays('[{"date":"2026-10-01","open":"09:00","close":"18:00","lunch":"08:00-09:30"}]'), null)
assert.equal(parseExtraClosedDays('[{"date":"2026-10-08"},{"date":"2026-10-08"}]'), null)
assert.equal(parseExtraClosedDays('[{"date":"2026-10-08","note":"<b>"}]'), null)
assert.ok(validSetting('extraOpenDays', '[]') && validSetting('extraClosedDays', '') && !validSetting('extraClosedDays', '{"x":1}'))

console.log('wednesday-smoke: OK')
console.log('substitute Wednesdays (12 months from 2026-09-23):', substituteWednesdays(kst('2026-09-23', '09:00'), 12).join(', '))
