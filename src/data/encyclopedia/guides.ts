/** Related primary references: the scope label states what each source covers.
 * These are not manufacturer endorsements or evidence of local clinician review. */
export const references = {
  classification: { publisher: '미국치주학회 · AAP', title: '치주·임플란트 질환의 병기·등급 분류', url: 'https://www.perio.org/research-science/2017-classification-of-periodontal-and-peri-implant-diseases-and-conditions/' },
  decay: { publisher: '미국 국립치과두개안면연구소 · NIDCR', title: '충치의 원인·진단·예방', url: 'https://www.nidcr.nih.gov/health-info/tooth-decay' },
  hygiene: { publisher: 'NIDCR', title: '치아와 치간의 일상 위생 관리', url: 'https://www.nidcr.nih.gov/health-info/oral-hygiene' },
  gums: { publisher: 'NIDCR', title: '치주질환의 증상과 치료', url: 'https://www.nidcr.nih.gov/health-info/gum-disease' },
  dry: { publisher: 'NIDCR', title: '구강건조의 원인과 관리', url: 'https://www.nidcr.nih.gov/health-info/dry-mouth' },
  diabetes: { publisher: 'NIDCR', title: '당뇨와 구강 건강', url: 'https://www.nidcr.nih.gov/health-info/diabetes' },
  cancer: { publisher: 'NIDCR', title: '구강암 의심 증상과 진단', url: 'https://www.nidcr.nih.gov/health-info/oral-cancer' },
  oncology: { publisher: 'NIDCR', title: '항암·방사선 치료와 구강 관리', url: 'https://www.nidcr.nih.gov/health-info/cancer-treatments' },
  tmd: { publisher: 'NIDCR', title: '턱관절 장애의 진단·보존적 관리', url: 'https://www.nidcr.nih.gov/health-info/tmd' },
  endo: { publisher: '미국근관치료학회 · AAE', title: '근관치료 환자 안내', url: 'https://www.aae.org/patients/root-canal-treatment/' },
  vpt: { publisher: 'AAE', title: '생활 치수 치료의 선택 조건 · PDF', url: 'https://www.aae.org/wp-content/uploads/2021/05/VitalPulpTherapyPositionStatement_v2.pdf' },
  implant: { publisher: '미국 식품의약국 · FDA', title: '임플란트 구조·이익·위험과 관리', url: 'https://www.fda.gov/medical-devices/dental-devices/dental-implants-what-you-should-know' },
  dentures: { publisher: '영국 국민보건서비스 · NHS', title: '틀니의 사용과 관리', url: 'https://www.nhs.uk/tests-and-treatments/dentures/' },
  abscess: { publisher: 'NHS', title: '치과 농양과 응급 평가가 필요한 증상', url: 'https://www.nhs.uk/conditions/dental-abscess/' },
  trauma: { publisher: 'NHS', title: '빠진 치아의 응급 대응 · 유치와 영구치 구분', url: 'https://www.nhs.uk/conditions/knocked-out-tooth/' },
  fluoride: { publisher: '미국소아치과학회 · AAPD', title: '불소의 예방적 사용', url: 'https://www.aapd.org/research/oral-health-policies--recommendations/fluoride-therapy/' },
  development: { publisher: 'AAPD', title: '성장기 치아 발달과 교합 관리', url: 'https://www.aapd.org/research/oral-health-policies--recommendations/management-of-the-developing-dentition-and-occlusion-in-pediatric-dentistry/' },
  imaging: { publisher: '미국치과의사협회 · ADA', title: '환자별 X-ray·CBCT 선택과 노출 관리', url: 'https://www.ada.org/resources/ada-library/oral-health-topics/x-rays-radiographs' },
  whitening: { publisher: 'ADA', title: '치아 미백의 효과와 주의점', url: 'https://www.ada.org/resources/ada-library/oral-health-topics/whitening' },
  anticoagulant: { publisher: 'ADA', title: '항혈전제 복용자의 치과 처치', url: 'https://www.ada.org/resources/ada-library/oral-health-topics/oral-anticoagulant-and-antiplatelet-medications-and-dental-procedures' },
  osteoporosis: { publisher: 'ADA', title: '골다공증 약물과 턱뼈 괴사 위험', url: 'https://www.ada.org/resources/ada-library/oral-health-topics/osteoporosis-medications' },
  prophylaxis: { publisher: 'ADA', title: '치과 처치 전 예방적 항생제', url: 'https://www.ada.org/resources/ada-library/oral-health-topics/antibiotic-prophylaxis' },
  mouthwash: { publisher: 'ADA', title: '구강 세정액의 종류와 사용 목적', url: 'https://www.ada.org/resources/ada-library/oral-health-topics/mouthrinse-mouthwash' },
  sterilization: { publisher: '미국 질병통제예방센터 · CDC', title: '치과 기구의 멸균·소독과 점검', url: 'https://www.cdc.gov/dental-infection-control/hcp/summary/sterilization-disinfection.html' },
  handpiece: { publisher: 'CDC', title: '환자 사이 핸드피스 재처리', url: 'https://www.cdc.gov/dental-infection-control/hcp/dental-ipc-faqs/dental-handpieces.html' },
  scalingInsurance: { publisher: '국민건강보험공단', title: '치석제거 급여 대상·횟수·절차', url: 'https://www.nhis.or.kr/static/html/wbma/c/wbmac0218.html' },
  dentureInsurance: { publisher: '국민건강보험공단', title: '노인 틀니 급여의 대상과 절차', url: 'https://www.nhis.or.kr/static/html/wbdf/e/03/wbdfe0103_pop_12longdesc.html' },
} as const
export type ReferenceKey = keyof typeof references
export type CategoryGuide = { id: string; introduction: string; checks: string[]; references: ReferenceKey[] }
export const categoryGuides: Record<string, CategoryGuide> = {
  '기본 해부·용어': { id: 'anatomy', introduction: '치아의 위치와 조직을 알면 검사 결과와 치료 범위를 이해하기 쉽습니다. 구조 이름은 진단명이 아니므로 “어디에 어떤 변화가 있는지”를 함께 확인하세요.', checks: ['치관·치근과 치수·잇몸을 구분하기', '치아 번호와 실제 입안 위치 맞춰 보기', '표면 사진과 내부 영상의 역할 구분하기'], references: ['decay', 'gums'] },
  '충치·보존치료': { id: 'restorative', introduction: '색과 크기만으로 치료를 정하지 않습니다. 표면 결손·진행 여부와 남은 치질을 살펴 관찰, 예방, 부분 수복을 비교합니다.', checks: ['활동성 병소인지 확인하기', '덮어야 할 교두와 남길 치질 확인하기', '수복 뒤에도 우식 위험 관리하기'], references: ['decay', 'hygiene'] },
  '신경치료': { id: 'endodontics', introduction: '치수의 상태, 감염 범위와 최종 수복 가능성을 함께 봅니다. 치수를 남기는 접근과 근관 내부를 처리하는 접근은 목표와 적용 조건이 다릅니다.', checks: ['치수 검사와 증상을 함께 보기', '치수 보존의 조건과 전환 계획 확인하기', '근관 충전 후 최종 수복까지 계획하기'], references: ['endo', 'vpt'] },
  '치주(잇몸)': { id: 'periodontal', introduction: '잇몸 출혈의 유무보다 치주낭·부착·뼈 지지와 변화 기록이 중요합니다. 치료 후에는 남은 위험에 맞춰 유지관리를 이어갑니다.', checks: ['염증과 지지 조직 소실 구별하기', '이전 차트·영상과 비교하기', '내 입에 맞는 치간 도구 배우기'], references: ['gums', 'hygiene'] },
  '임플란트': { id: 'implant', introduction: '식립만이 아니라 뼈·잇몸의 치유, 보철 연결과 매일의 청소까지 하나의 계획으로 봅니다. 수술 시기와 씹을 수 있는 시기는 다를 수 있습니다.', checks: ['남은 자연치아와 대안 평가하기', '본체와 보철 부품 문제 구분하기', '임시 치아의 하중 제한 확인하기'], references: ['implant', 'gums'] },
  '보철(크라운·틀니)': { id: 'prosthetics', introduction: '재료 이름보다 남은 치질·지지 조직·씹는 힘과 청소 가능성을 먼저 확인합니다. 최종 고정 전 모양·발음·맞물림을 직접 점검하세요.', checks: ['삭제할 범위와 대안 비교하기', '임시 보철의 사용 기간 확인하기', '보수·교체·유지 비용 구분하기'], references: ['dentures', 'implant'] },
  '구강외과·사랑니': { id: 'surgery', introduction: '현재 병변과 보존 가능성, 주변 신경·상악동 및 전신 상태를 기준으로 결정합니다. 외상과 퍼지는 감염에서는 일반 예약보다 긴급 평가가 먼저일 수 있습니다.', checks: ['발치 이유와 수술 위험 함께 보기', '복용약을 임의로 끊지 않기', '회복 중 연락할 신호 확인하기'], references: ['abscess', 'trauma', 'imaging'] },
  '소아치과': { id: 'children', introduction: '유치와 영구치, 치근 발달과 아이의 진료 적응을 함께 고려합니다. 보호자 양치·수유·간식 습관과 성장 기록을 연결해 관리합니다.', checks: ['어떤 치아가 영구치인지 확인하기', '아이 나이에 맞는 불소 사용량 배우기', '외상 뒤 치수·발달 추적하기'], references: ['development', 'fluoride', 'trauma'] },
  '턱관절': { id: 'jaw', introduction: '관절 소리, 통증과 잠김은 서로 구별해야 합니다. 근육·관절·치아와 다른 원인을 평가하고, 증상과 기능에 맞는 보존적 방법을 먼저 검토합니다.', checks: ['소리만 있는지 기능 제한도 있는지 보기', '교합 하나로 원인을 단정하지 않기', '되돌리기 어려운 처치 전 대안 확인하기'], references: ['tmd'] },
  '예방·관리': { id: 'prevention', introduction: '매일 반복할 수 있는 관리가 중요합니다. 칫솔 압력, 치간 도구와 불소·식습관을 입안 구조와 생활 여건에 맞춰 조정하세요.', checks: ['반복해서 놓치는 치태 위치 찾기', '치간 도구의 크기·접근 배우기', '제품이 기본 관리를 대체한다고 생각하지 않기'], references: ['hygiene', 'decay', 'fluoride'] },
  '미백': { id: 'whitening', introduction: '표면 착색과 내부 변색을 구별하고 치아·잇몸 질환을 먼저 평가합니다. 기존 레진·크라운의 색, 시림 가능성과 현실적인 목표를 확인하세요.', checks: ['미백으로 바뀌지 않는 보철 확인하기', '약제량·사용 시간 지키기', '시림이 지속되면 원인 재평가하기'], references: ['whitening'] },
  '마취·통증관리': { id: 'anesthesia', introduction: '통증 원인 치료와 마취·약물 조절을 함께 계획합니다. 과거 반응과 복용약을 알리고 치료 중 불편하면 멈출 신호를 정하세요.', checks: ['통증을 참고 진행하지 않기', '마취가 남은 입술·혀 깨물지 않기', '진통제 성분 중복 확인하기'], references: ['endo', 'anticoagulant'] },
  '감염관리·소독': { id: 'infection', introduction: '손 위생·기구 재처리·표면·수관 관리가 서로 보완합니다. 소독과 멸균, 일회용과 재사용 가능 기구를 구별하면 운영 과정을 이해하기 쉽습니다.', checks: ['기구 용도에 맞는 처리 구분하기', '세정·포장·멸균·보관을 함께 보기', '장비 표시만으로 결과를 보장하지 않기'], references: ['sterilization', 'handpiece'] },
  '영상·진단장비': { id: 'technology', introduction: '검사마다 답할 수 있는 질문이 다릅니다. 표면 사진·형광·스캔과 X-ray·CT를 구별하고 추가 자료가 진료 결정을 바꾸는지 확인하세요.', checks: ['필요한 정보를 먼저 정하기', '기존 영상으로 중복 촬영 줄이기', '장비명과 진단·치료 보장을 구분하기'], references: ['imaging', 'endo'] },
  '재료': { id: 'materials', introduction: '재료군과 제품명은 다릅니다. 실제 성분·허가 용도·적용 부위와 취급 지침을 확인하며 브랜드 이름을 치료 성공의 보증으로 보지 않습니다.', checks: ['성분·용도와 제품명 구분하기', '임시 재료와 최종 재료 확인하기', '접착·조직 상태와 관리 함께 보기'], references: ['vpt', 'implant', 'whitening'] },
  '전신질환·약물': { id: 'health', introduction: '질환의 조절 상태와 정확한 약물 정보를 공유하면 진료를 안전하게 계획하는 데 도움이 됩니다. 치과 처치를 위해 약을 임의로 중단하지 마세요.', checks: ['약 봉투·목록과 주사 일정 준비하기', '필요한 처방의 협의 확인하기', '질환 이름만으로 일률적 금기 판단하지 않기'], references: ['anticoagulant', 'osteoporosis', 'diabetes', 'prophylaxis'] },
  '증상': { id: 'symptoms', introduction: '증상은 원인을 찾는 단서입니다. 시작 시점·위치·유발 자극·지속과 악화 흐름을 기록하고, 사진이나 단어만으로 스스로 진단하지 않습니다.', checks: ['통증이 줄었다고 원인 해결로 단정하지 않기', '퍼지는 부기·호흡·삼킴 곤란은 즉시 평가받기', '오래 낫지 않는 점막 변화 검사받기'], references: ['abscess', 'cancer', 'dry'] },
  '보험·제도': { id: 'insurance', introduction: '치료의 필요성과 급여 적용은 다른 판단입니다. 본인 자격·치아·술식·이용 이력과 현재 기준을 확인하고 급여·비급여·유지 비용을 구분해 설명받으세요.', checks: ['등록·이용 이력과 적용 조건 확인하기', '전체 비용의 포함·별도 항목 나누기', '동의 전 대안·위험·변경 조건 질문하기'], references: ['scalingInsurance', 'dentureInsurance'] },
}

const specificReferences: Record<string, ReferenceKey[]> = {
  'aggressive-periodontitis': ['classification'], 'periodontal-chart': ['classification', 'gums'],
  vpt: ['vpt'], 'vpt-vs-rct': ['vpt', 'endo'], 'vpt-success': ['vpt'], 'vpt-crown-why': ['vpt'],
  'pulp-capping': ['vpt'], pulpotomy: ['vpt'], mta: ['vpt'], 'one-fil': ['vpt'],
  anticoagulant: ['anticoagulant'], premedication: ['prophylaxis'], bisphosphonate: ['osteoporosis'], mronj: ['osteoporosis'],
  'osteoporosis-dental': ['osteoporosis'], 'cancer-treatment-dental': ['oncology'], 'diabetes-dental': ['diabetes'],
  'diabetes-periodontitis': ['diabetes', 'gums'], 'dry-mouth': ['dry'], saliva: ['dry'], 'salivary-gland': ['dry'],
  avulsion: ['trauma'], 'dental-trauma': ['trauma'], 'crown-fracture-child': ['trauma'],
  'emergency-dental': ['abscess', 'trauma'], 'periapical-abscess': ['abscess'], 'periodontal-abscess': ['abscess'],
  'oral-mucosa-lesion': ['cancer'], leukoplakia: ['cancer'], 'oral-cancer-screening': ['cancer'],
  'scaling-insurance': ['scalingInsurance'], 'denture-insurance': ['dentureInsurance'],
  'implant-xray-check': ['imaging', 'implant'], 'wisdom-ct': ['imaging'],
  'child-xray-safety': ['imaging'], 'pregnancy-xray': ['imaging'],
  chlorhexidine: ['mouthwash'], mouthwash: ['mouthwash'], 'handpiece-sterilization': ['handpiece'],
  'denture-stomatitis': ['dentures'], 'geriatric-denture-care': ['dentures'],
}
export function referencesFor(term: { slug: string; category: string }) {
  return (specificReferences[term.slug] || categoryGuides[term.category].references).map(key => references[key])
}

export const readingPaths = [
  { title: '시리고 아픈 치아', description: '증상을 기록하고, 원인을 구별하기', slugs: ['tooth-sensitivity', 'cavity-no-pain', 'biting-pain', 'emergency-dental'] },
  { title: '치수를 살릴 수 있을까', description: '검사 → 보존 조건 → 수복과 추적', slugs: ['pulp-test', 'vpt-vs-rct', 'vpt', 'post-endo-restoration'] },
  { title: '피 나는 잇몸', description: '염증과 뼈 지지, 유지관리 이해하기', slugs: ['gum-bleeding', 'gingivitis', 'periodontitis', 'supportive-periodontal-therapy'] },
  { title: '임플란트 상담 준비', description: '대안 → 수술 시기 → 치유와 관리', slugs: ['implant-vs-bridge', 'immediate-implant', 'osseointegration', 'implant-maintenance'] },
  { title: '아이의 치아가 바뀔 때', description: '유치·영구치와 예방 방법 알아보기', slugs: ['mixed-dentition', 'six-year-molar', 'child-toothpaste', 'sealant'] },
  { title: '치아가 깨지거나 빠졌다면', description: '외상의 종류와 응급 대응 구분하기', slugs: ['chipped-tooth', 'dental-trauma', 'avulsion', 'emergency-dental'] },
]

export const searchAliases: Record<string, string> = {
  'root-canal-treatment': '신경 치료 근관 치료', caries: '충치 썩은 이', scaling: '스켈링 스케일링',
  'tooth-sensitivity': '시린 이 이 시림', 'gum-bleeding': '잇몸 피 양치 출혈', avulsion: '이가 빠짐 치아 빠짐 탈구',
  'third-molar': '사랑니', vpt: '생활치수치료 치수 보존 신경 살리기', implant: '임프란트',
  'dry-mouth': '입마름 입 마름', halitosis: '입 냄새', 'jaw-locking': '입이 안 벌어짐',
}
