// 비급여 진료비 고지 — 원본 수가표(2026) 기준. '사용안함', 이벤트/할인, 교정(미시행), 내부 관리용 항목 제외.
// 의료광고법: 가격 비교·할인 문구 사용 금지. 금액은 '~원부터'가 아닌 고지 금액 그대로.
export type PriceItem = { name: string; price: number | null; unit?: string; note?: string }
export type PriceGroup = { group: string; desc?: string; items: PriceItem[] }

export const pricingUpdatedAt = '2026-08-01'

export const insuredItems: string[] = [
  '근관치료(신경치료)',
  '발치',
  '보철물 제거',
  '충치치료 (보험 GI·아말감)',
  '보험 GI 코어',
  '스케일링 (만 19세 이상 연 1회)',
  '치주 치료 (치근활택술·치주소파술)',
  '치주치료 후 처치',
  '보험 틀니 (만 65세 이상)',
  '보험 임플란트 (만 65세 이상, 평생 2개)',
  '치면세마 (유치)',
  '치아 홈메우기 (만 18세 이하 제1·2대구치)',
  '어린이 보험 레진 (만 12세 이하 영구치)',
]

export const pricing: PriceGroup[] = [
  {
    group: '임플란트',
    desc: '식립 + 기본 보철 기준. 뼈이식·상악동 거상술은 뼈 상태에 따라 추가될 수 있으며 CT 진단 후 사전에 안내드립니다.',
    items: [
      { name: '오스템 임플란트 (구치부)', price: 990000, unit: '1개' },
      { name: '오스템 임플란트 (전치부)', price: 1090000, unit: '1개' },
      { name: '메가젠 임플란트 (구치부)', price: 890000, unit: '1개' },
      { name: '메가젠 임플란트 (전치부)', price: 990000, unit: '1개' },
      { name: '임플란트 크라운 (지르코니아)', price: 550000, unit: '1개' },
      { name: '임플란트 가이드', price: 150000, unit: '1회' },
      { name: '단순 뼈이식', price: 300000, unit: '1부위' },
      { name: '복잡 뼈이식', price: 500000, unit: '1부위' },
      { name: '상악동 거상술 (Crestal)', price: 500000, unit: '1부위' },
      { name: '커스텀 어버트먼트', price: 200000, unit: '1개' },
      { name: '폰틱 (지르코니아, 구치부)', price: 450000, unit: '1개' },
      { name: '폰틱 (지르코니아, 전치부)', price: 500000, unit: '1개' },
      { name: '임시 치아 Flipper (본원 치료 시)', price: 50000, unit: '1개' },
      { name: '임시 치아 Flipper (제작만)', price: 100000, unit: '1개' },
      { name: '비급여 CT 촬영', price: 50000, unit: '1회' },
    ],
  },
  {
    group: '크라운·보철',
    items: [
      { name: '풀 지르코니아 크라운 (구치부)', price: 450000, unit: '1개' },
      { name: '풀 지르코니아 크라운 (전치부)', price: 550000, unit: '1개' },
      { name: '메탈 크라운', price: 350000, unit: '1개' },
      { name: '서베이드 크라운 (PFM)', price: 400000, unit: '1개' },
      { name: '임시 치아', price: 100000, unit: '1개' },
    ],
  },
  {
    group: '치수보존치료(VPT)·신경치료 관련',
    desc: '신경치료 자체는 건강보험 적용. 아래는 생체재료·코어 등 비급여 재료 항목입니다.',
    items: [
      { name: 'MTA (생체재료)', price: 50000, unit: '1치' },
      { name: '치수절단술 MTA 추가', price: 10000, unit: '1치' },
      { name: '파이버 포스트 + 레진 코어', price: 150000, unit: '1치' },
      { name: '레진 코어', price: 50000, unit: '1치' },
      { name: '레진 코어 마무리', price: 100000, unit: '1치' },
      { name: '포스트', price: 100000, unit: '1치' },
    ],
  },
  {
    group: '충치·보존치료',
    items: [
      { name: '레진 (단순)', price: 100000, unit: '1면' },
      { name: '레진 (앞니)', price: 150000, unit: '1치' },
      { name: '레진 (인접면)', price: 150000, unit: '1치' },
      { name: '레진 (치경부)', price: 80000, unit: '1치' },
      { name: '레진 (앞니 벌어짐)', price: 150000, unit: '1치' },
      { name: '본드필', price: 150000, unit: '1치' },
      { name: '하이브리드 인레이', price: 280000, unit: '1치' },
    ],
  },
  {
    group: '틀니',
    items: [
      { name: '부분 틀니', price: 1500000, unit: '1악' },
      { name: '전체 틀니', price: 1500000, unit: '1악' },
      { name: '임시 틀니', price: 150000, unit: '1악' },
      { name: '틀니 수리', price: 400000, unit: '1회' },
      { name: '틀니 개상(리라이닝)', price: 300000, unit: '1회' },
      { name: 'Wire Temporary', price: 100000, unit: '1개' },
    ],
  },
  {
    group: '소아치과',
    items: [
      { name: 'SS 크라운 (유치)', price: 150000, unit: '1치' },
      { name: 'Band & Loop (공간유지장치)', price: 200000, unit: '1개' },
      { name: '치아 홈메우기 (비급여 치아)', price: 30000, unit: '1치' },
      { name: '불소 도포', price: 30000, unit: '1회' },
    ],
  },
  {
    group: '턱관절·기타',
    items: [
      { name: '이갈이 장치 (스플린트)', price: 600000, unit: '1개' },
      { name: '비급여 스케일링', price: 50000, unit: '1회' },
      { name: '큐탄플라스트 (지혈·치유 보조)', price: 20000, unit: '1개' },
      { name: '미노클린 (치주 국소 항생제)', price: 10000, unit: '1치' },
      { name: '미노클린 (3치 이상)', price: 30000, unit: '1회' },
    ],
  },
  {
    group: '치아 미백 (과세)',
    items: [
      { name: '전문가 미백 (1회)', price: 150000, unit: '1회' },
      { name: '전문가 미백 (3회)', price: 400000, unit: '3회' },
    ],
  },
]

export const won = (n: number) => n.toLocaleString('ko-KR') + '원'
