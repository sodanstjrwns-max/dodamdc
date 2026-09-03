export type Term = {
  slug: string
  term: string
  en: string
  category: string
  def: string
  treatments: string[]
}

export const CATEGORIES = [
  '기본 해부·용어',
  '충치·보존치료',
  '신경치료',
  '치주(잇몸)',
  '임플란트',
  '보철(크라운·틀니)',
  '구강외과·사랑니',
  '소아치과',
  '턱관절',
  '예방·관리',
  '미백',
  '마취·통증관리',
  '감염관리·소독',
  '영상·진단장비',
  '재료',
  '전신질환·약물',
  '증상',
  '보험·제도',
] as const

/**
 * 한 줄 형식: slug|용어|영문|카테고리|정의|관련진료(콤마)
 */
export function parse(raw: string): Term[] {
  return raw
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [slug, term, en, category, def, tr] = l.split('|')
      return {
        slug: slug.trim(),
        term: term.trim(),
        en: (en || '').trim(),
        category: category.trim(),
        def: def.trim(),
        treatments: (tr || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }
    })
}
