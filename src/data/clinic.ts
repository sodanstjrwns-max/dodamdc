// 병원 기본 정보 — 기본값. 관리자 > 기본정보에서 D1(site_settings)로 덮어쓸 수 있음.
export const clinicDefaults = {
  name: '서울도담치과의원',
  shortName: '서울도담치과',
  nameEn: 'Seoul Dodam Dental Clinic',
  slogan: '이해될 때까지 설명하고, 필요한 만큼만 치료합니다.',
  mission: '환자가 자신의 상태를 충분히 이해하고, 부담 가능한 범위에서 꼭 필요한 치료를 제때 받을 수 있도록 돕습니다.',
  phone: '031-256-2872',
  phoneTel: '+82-31-256-2872',
  address: '경기도 수원시 팔달구 화양로 34, 신우상가 2층 206·207호 (화서동)',
  addressShort: '수원시 팔달구 화양로 34, 2층',
  region: '수원시 팔달구 화서동',
  city: '수원',
  district: '팔달구',
  dong: '화서동',
  postalCode: '16430',
  geo: { lat: 37.2848, lng: 126.9954 },
  directions: {
    subway: '1호선 화서역에서 도보 약 10분',
    bus: '블루밍푸른숲아파트 정류장 하차 후 도보 1분',
    parking: '건물 사정상 주차가 어렵습니다. 인근 공영주차장 또는 대중교통 이용을 권장드립니다.',
    landmark: '신우상가 2층 (1층 입구에 서울도담치과 파란 간판)',
  },
  hours: [
    { day: '월', open: '09:00', close: '18:00', lunch: '13:00–14:00' },
    { day: '화', open: '14:00', close: '20:30', lunch: null, note: '야간진료' },
    { day: '수', open: '09:00', close: '18:00', lunch: null, note: '점심시간 없이 진료' },
    { day: '목', open: '09:00', close: '18:00', lunch: '13:00–14:00' },
    { day: '금', open: '09:00', close: '18:00', lunch: '13:00–14:00' },
    { day: '토', open: '09:00', close: '14:00', lunch: null },
    { day: '일', open: null, close: null, lunch: null, note: '휴진' },
  ],
  hoursNote: '공휴일 휴진. 마감 30분 전 접수 마감.',
  founded: '2022-05-10',
  foundedNote: '2002년 반석치과 → 2020년 서울도담치과 개원 → 2022년 5월 한휘림 원장 인수',
  business: {
    name: '서울도담치과의원',
    owner: '한휘림',
    regNo: '631-01-02911',
    openDate: '2022년 5월 10일',
    type: '보건업 / 치과의원',
  },
  channels: {
    naverPlace: 'https://map.naver.com/p/search/서울도담치과/place/13229580',
    naverBlog: 'https://blog.naver.com/verygood2875',
    instagram: 'https://www.instagram.com/seouldodam',
    kakao: 'http://pf.kakao.com/_pLxlBn',
  },
  reviews: { count: 782, asOf: '2026년 8월', source: '네이버 방문자 리뷰' },
  email: 'verygood2875@gmail.com',
  // 브랜드 컬러 — Q25: 블루 메인(기존 인지) + 그린 포인트(자연치아·생명)
  brand: { primary: '#006AB5', primaryDark: '#0B4A7A', accent: '#2FA37A', ink: '#1D2B36' },
}

export type Clinic = typeof clinicDefaults

// 인근 유입 지역 (지역 SEO 조합용)
export const nearbyAreas = [
  { slug: 'hwaseo', name: '화서동', full: '수원시 팔달구 화서동', note: '병원 소재지' },
  { slug: 'hwaseo-station', name: '화서역', full: '수원시 팔달구 화서역', note: '1호선 화서역 도보 10분' },
  { slug: 'paldal', name: '팔달구', full: '수원시 팔달구', note: '' },
  { slug: 'jeongja', name: '정자동', full: '수원시 장안구 정자동', note: '' },
  { slug: 'yulcheon', name: '율전동', full: '수원시 장안구 율전동', note: '' },
  { slug: 'cheoncheon', name: '천천동', full: '수원시 장안구 천천동', note: '' },
  { slug: 'seodun', name: '서둔동', full: '수원시 권선구 서둔동', note: '' },
  { slug: 'gugun', name: '구운동', full: '수원시 권선구 구운동', note: '' },
  { slug: 'tap', name: '탑동', full: '수원시 권선구 탑동', note: '' },
  { slug: 'suwon-station', name: '수원역', full: '수원시 팔달구 수원역', note: '' },
  { slug: 'jangan', name: '장안구', full: '수원시 장안구', note: '' },
  { slug: 'gwonseon', name: '권선구', full: '수원시 권선구', note: '' },
  { slug: 'suwon', name: '수원', full: '수원시', note: '' },
]
