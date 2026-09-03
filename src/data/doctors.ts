// 의료진 — ★ 자격·경력은 신청서/회신 원문만 사용 (창작 금지)
export type Doctor = {
  slug: string
  name: string
  nameEn: string
  title: string
  specialty: string
  photo: string
  photoAlt: string
  photoCutout: string
  quote: string
  philosophy: string[]
  education: string[]
  license: string[]
  career: string[]
  training: string[]
  societies: string[]
  treatments: string[] // treatment slugs — "잘하는 진료"
  story: { heading: string; body: string }[]
}

export const doctors: Doctor[] = [
  {
    slug: 'han-hwirim',
    name: '한휘림',
    nameEn: 'Han Hwi-rim',
    title: '대표원장',
    specialty: '통합치의학과 전문의',
    photo: '/static/img/dr-han-hwirim-portrait.webp',
    photoAlt: '서울도담치과 한휘림 대표원장 프로필 사진',
    photoCutout: '/static/img/dr-han-hwirim-cutout.webp',
    quote: '치아는 재생되지 않습니다. 살릴 수 있는 방법이 하나라도 남아 있으면 그것부터 합니다.',
    philosophy: [
      '치료는 진행을 멈추는 것이지, 없어진 조직을 되돌리는 것이 아닙니다. 그래서 한 번 손대기 전에 한 번 더 생각합니다.',
      '신경치료는 발치 바로 전 단계입니다. 그 카드를 아껴두기 위해 MTA 생활치수치료를 먼저 봅니다.',
      '임플란트는 정말 살릴 방법이 없을 때 가는 마지막 선택지입니다. 처음부터 발치를 말씀드린 적은 거의 없습니다.',
      '제가 받기 싫은 치료는 환자분께도 하지 않습니다. 그래서 아픈 지점을 하나씩 찾아 없애왔습니다.',
    ],
    education: ['연세대학교 (원주) 의과대학', '단국대학교 치과대학 졸업'],
    license: ['통합치의학과 전문의 (보건복지부 인증)'],
    career: ['양평군 보건소 치과과장', '부여미소치과 원장', '미소지음치과 수술원장', '평화의치과 원장', '現 서울도담치과의원 대표원장'],
    training: [
      '대한치주과학회 치주수술 & GBR Course 수료',
      '오스템 One Guide Seminar 수료',
      '덴티움 Prosthetic Course 수료',
      '가야 보철 임상 연구회 수료',
      '최성백 근관치료 연수회 수료',
      'Dental Bean Tooth Preparation Course 수료',
      'DIATECH Tooth Preparation Course 수료',
    ],
    societies: ['미국 임플란트학회(AAID) 정회원', '대한노년치의학회 정회원', '대한치과보철학회 정회원', '대한심미치과학회 정회원', '대한레이저치의학회 정회원'],
    treatments: ['vpt-crown', 'periodontal', 'implant', 'endodontics', 'wisdom-tooth', 'restorative', 'prosthodontics', 'pediatric', 'tmj', 'preventive', 'oral-surgery', 'whitening'],
    story: [
      {
        heading: '병원을 시작한 이유',
        body: '거창한 뜻을 갖고 시작한 건 아닙니다. 가족의 건강 문제를 겪으면서, 제 사람들을 제가 직접 책임지고 도와야겠다는 생각이 들었습니다. 병원을 시작한 이유는 그것뿐입니다.',
      },
      {
        heading: '빛날 휘(輝), 수풀 림(林)',
        body: '어머니 태몽에 작은 묘목을 건네받는 장면이 있었다고 합니다. 그 이야기를 듣고 아버지께서 빛날 휘에 수풀 림, 휘림이라는 이름을 지어주셨습니다. 숲은 그 안의 여러 생명에게 쉴 곳과 먹을 것을 내어주는 곳입니다. 저도 그렇게, 제 곁에 온 사람들에게 필요한 것을 내어주는 쪽으로 살고 싶습니다. 환자분의 상태를 제 일처럼 여기고 끝까지 챙기는 이유가 여기에 있습니다.',
      },
      {
        heading: '통증에 예민한 치과의사',
        body: '저는 통증에 예민한 사람입니다. 제가 받기 싫은 치료는 환자분께도 하지 않습니다. 대부분의 환자분이 치과에서 가장 무서워하는 건 치료 자체가 아니라 마취 주사입니다. 그래서 마취크림, 마취액 워머 3대, 무통마취기, 골내마취기 2대까지 — 아픈 지점을 하나씩 찾아 없애왔습니다.',
      },
      {
        heading: '이해되지 않는 건 받아들이지 못하는 성격',
        body: '그래서 환자분께도 지금 무엇을 왜 하는지 이해되실 때까지 설명드립니다. 눈을 가린 채 무슨 일이 벌어지는지 모르고 누워 있는 시간이, 사실 통증만큼이나 무섭기 때문입니다. 안 해도 되는 치료는 왜 안 해도 되는지까지 말씀드립니다. 그래야 환자분이 스스로 판단하실 수 있습니다.',
      },
    ],
  },
]

export const getDoctor = (slug: string) => doctors.find((d) => d.slug === slug)
