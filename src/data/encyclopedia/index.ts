import { parse, type Term, CATEGORIES } from './types'
import { part1 } from './part1'
import { part2 } from './part2'
import { part3 } from './part3'
import { part4 } from './part4'
import { part5 } from './part5'
import { part6 } from './part6'

export type { Term }
export { CATEGORIES }

const all = [part1, part2, part3, part4, part5, part6].flatMap(parse)

// 중복 slug 제거 (첫 정의 우선)
const seen = new Set<string>()
export const terms: Term[] = all.filter((t) => {
  if (seen.has(t.slug)) return false
  seen.add(t.slug)
  return true
})

const bySlug = new Map(terms.map((t) => [t.slug, t]))
export const getTerm = (slug: string) => bySlug.get(slug)

export const termsByCategory = (): Record<string, Term[]> => {
  const out: Record<string, Term[]> = {}
  for (const c of CATEGORIES) out[c] = []
  for (const t of terms) (out[t.category] ||= []).push(t)
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.term.localeCompare(b.term, 'ko'))
  return out
}

export const termsForTreatment = (treatmentSlug: string) =>
  terms.filter((t) => t.treatments.includes(treatmentSlug))

// 초성 그룹 (ㄱ~ㅎ, A-Z)
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const GROUP: Record<string, string> = { ㄲ: 'ㄱ', ㄸ: 'ㄷ', ㅃ: 'ㅂ', ㅆ: 'ㅅ', ㅉ: 'ㅈ' }
export function initial(s: string): string {
  const c = s.trim().charCodeAt(0)
  if (c >= 0xac00 && c <= 0xd7a3) {
    const ch = CHO[Math.floor((c - 0xac00) / 588)]
    return GROUP[ch] || ch
  }
  return /[A-Za-z]/.test(s[0]) ? 'A-Z' : '#'
}
export const INITIALS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ','A-Z','#']
export const termsByInitial = (): Record<string, Term[]> => {
  const out: Record<string, Term[]> = {}
  for (const t of terms) (out[initial(t.term)] ||= []).push(t)
  for (const k of Object.keys(out)) out[k].sort((a, b) => a.term.localeCompare(b.term, 'ko'))
  return out
}

// ---- 자동 인링크 ----
// 긴 용어 우선 매칭, 각 용어는 문서당 1회, 이미 <a> 안이나 태그 속성 안은 건너뜀
const linkable = [...terms]
  .filter((t) => t.term.length >= 2)
  .map((t) => ({ slug: t.slug, word: t.term.replace(/\(.*?\)/g, '').trim() }))
  .filter((t) => t.word.length >= 2)
  .sort((a, b) => b.word.length - a.word.length)

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** HTML 문자열에서 백과사전 용어를 링크로 치환 (텍스트 노드에서만, 용어당 최대 1회) */
export function autoLink(html: string, opts: { exclude?: string[]; max?: number } = {}): string {
  const exclude = new Set(opts.exclude || [])
  const max = opts.max ?? 12
  let count = 0
  const used = new Set<string>()
  // 태그와 텍스트 분리
  const parts = html.split(/(<[^>]+>)/g)
  let depthA = 0
  let inHeading = 0
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (p.startsWith('<')) {
      if (/^<a[\s>]/i.test(p)) depthA++
      else if (/^<\/a>/i.test(p)) depthA--
      else if (/^<h[1-6][\s>]/i.test(p)) inHeading++
      else if (/^<\/h[1-6]>/i.test(p)) inHeading--
      continue
    }
    if (depthA > 0 || inHeading > 0 || !p.trim()) continue
    let text = p
    for (const t of linkable) {
      if (count >= max) break
      if (used.has(t.slug) || exclude.has(t.slug)) continue
      const re = new RegExp(esc(t.word))
      if (re.test(text)) {
        text = text.replace(re, `<a href="/encyclopedia/${t.slug}" class="ency-link" data-ency="${t.slug}">${t.word}</a>`)
        used.add(t.slug)
        count++
      }
    }
    parts[i] = text
  }
  return parts.join('')
}
