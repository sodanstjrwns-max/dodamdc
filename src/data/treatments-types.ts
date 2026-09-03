export type FAQ = { q: string; a: string }
export type Section = { h: string; lead: string; body: string[]; list?: string[] }
export type Step = { title: string; desc: string }
export type Treatment = {
  slug: string
  name: string
  nameEn: string
  category: string
  core: boolean // 핵심 TOP3
  order: number
  keywords: string[] // SEO / 지역 조합
  areaKey?: string // 지역 SEO URL 슬러그 (예: implant)
  short: string // 카드 한 줄
  heroTitle: string
  heroLead: string
  heroImage?: string
  summary: string[] // 결론 요약 박스
  sections: Section[]
  steps?: Step[]
  compare?: { caption: string; head: string[]; rows: string[][] }
  sideEffects: string[]
  related: string[] // 관련 진료 slugs
  encyclopedia: string[] // 관련 백과사전 용어 slugs
  faqs: FAQ[]
  reviewedAt: string
}
