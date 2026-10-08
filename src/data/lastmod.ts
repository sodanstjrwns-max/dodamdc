/**
 * 사이트맵 lastmod — 페이지 본문이 실제로 바뀐 날짜(git 기록 기준, 고정값).
 * 내용을 바꿀 때 해당 경로의 날짜를 함께 고친다. new Date()·빌드 시각 사용 금지.
 * DB 콘텐츠(칼럼·사례·공지·언론보도)는 각 행의 updated_at을 쓴다.
 */
export const PAGE_LASTMOD: Record<string, string> = {
  '/': '2026-10-08', // 화서역 치과 안내 링크
  '/first-visit': '2026-09-15',
  '/symptom-check': '2026-09-15',
  '/mission': '2026-10-01',
  '/doctors': '2026-10-01',
  '/floor-guide': '2026-10-01',
  '/treatments': '2026-10-08', // 목록 제목 구체화
  '/directions': '2026-10-01',
  '/hours': '2026-10-01',
  '/pricing': '2026-10-01',
  '/faq': '2026-10-01',
  '/reservation': '2026-10-01',
  '/area': '2026-10-08', // 화서역 치과 안내 연결
  '/area/hwaseo-station': '2026-10-08', // 화서역 치과 허브 신설
}
export const DOCTOR_LASTMOD = '2026-10-01'
/** 진료 상세: 진료 데이터 파일과 상세 템플릿(2026-09-29 제목 변경) 중 늦은 날짜 */
export const TREATMENT_LASTMOD: Record<string, string> = {
  'vpt-crown': '2026-10-01', periodontal: '2026-09-29', implant: '2026-09-29',
  endodontics: '2026-09-29', 'wisdom-tooth': '2026-09-29', restorative: '2026-10-01', prosthodontics: '2026-10-01',
  pediatric: '2026-10-01', 'oral-surgery': '2026-10-01', tmj: '2026-10-01', preventive: '2026-10-01', whitening: '2026-10-01',
}
/** 지역×진료 페이지: 진료시간 안내 문구가 마지막으로 바뀐 날(2026-10-01) */
export const AREA_LASTMOD = '2026-10-01'
