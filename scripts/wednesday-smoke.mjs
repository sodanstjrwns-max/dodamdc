// 공휴일 주 수요일 진료 규칙 검증 (원장 지시 2026-09-23). 로컬 계산만, 네트워크·DB 없음.
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const compiled = await build({ stdin: { resolveDir: process.cwd(), contents: `
export { clinicStatus, isSubstituteWednesday, effectiveHours, substituteWednesdays, thisWeekSubstituteWednesday, KR_HOLIDAYS } from './src/lib/clinic-status';
export { clinicDefaults } from './src/data/clinic';
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

console.log('wednesday-smoke: OK')
console.log('substitute Wednesdays (12 months from 2026-09-23):', substituteWednesdays(kst('2026-09-23', '09:00'), 12).join(', '))
