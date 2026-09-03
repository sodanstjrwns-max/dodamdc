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

// slug 중복 제거 (앞에 있는 것 우선)
const seen = new Set<string>()
export const terms: Term[] = all.filter((t) => {
  if (seen.has(t.slug)) return false
  seen.add(t.slug)
  return true
})

const bySlug = new Map(terms.map((t) => [t.slug, t]))
export const getTerm = (slug: string) => bySlug.get(slug)

export const termsByCategory: Record<string, Term[]> = {}
for (const t of terms) (termsByCategory[t.category] ||= []).push(t)

export const termsForTreatment = (treatmentSlug: string) =>
  terms.filter((t) => t.treatments.includes(treatmentSlug))

/** 초성/알파벳 인덱스용 첫 글자 */
export function initial(term: string) {
  const c = term.charCodeAt(0)
  if (c >= 0xac00 && c <= 0xd7a3) {
    const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
    return CHO[Math.floor((c - 0xac00) / 588)]
  }
  return /[A-Za-z]/.test(term[0]) ? 'A-Z' : '#'
}

/**
 * 자동 인링크: HTML 텍스트 노드에서 백과사전 용어를 찾아 링크로 변환.
 * - 용어당 첫 1회만 링크 (과도한 링크 방지)
 * - 이미 <a> 안에 있는 텍스트, 태그 속성은 건너뜀
 * - 긴 용어 우선 매칭
 */
const linkable = terms
  .map((t) => ({ slug: t.slug, word: t.term.replace(/\(.*?\)/g, '').trim() }))
  .filter((t) => t.word.length >= 2)
  .sort((a, b) => b.word.length - a.word.length)

export function autoLink(html: string, opts: { max?: number; exclude?: string[] } = {}): string {
  const max = opts.max ?? 12
  const exclude = new Set(opts.exclude || [])
  const used = new Set<string>()
  let count = 0
  // split into tag / text chunks, tracking <a> depth
  const parts = html.split(/(<[^>]+>)/g)
  let inA = 0
  let inHeading = 0
  return parts
    .map((p) => {
      if (p.startsWith('<')) {
        if (/^<a[\s>]/i.test(p)) inA++
        else if (/^<\/a>/i.test(p)) inA = Math.max(0, inA - 1)
        else if (/^<h[1-6][\s>]/i.test(p)) inHeading++
        else if (/^<\/h[1-6]>/i.test(p)) inHeading = Math.max(0, inHeading - 1)
        return p
      }
      if (inA || inHeading || count >= max || !p.trim()) return p
      let out = p
      for (const { slug, word } of linkable) {
        if (count >= max) break
        if (used.has(slug) || exclude.has(slug)) continue
        const idx = out.indexOf(word)
        if (idx === -1) continue
        // 이미 링크된 구간 안인지 확인 (간단히 '<a' 이후 '</a>' 이전이면 skip)
        const before = out.slice(0, idx)
        const openA = before.lastIndexOf('<a')
        const closeA = before.lastIndexOf('</a>')
        if (openA > closeA) continue
        out =
          before +
          `<a href="/encyclopedia/${slug}" class="ency-link" title="치과 백과사전: ${word}">${word}</a>` +
          out.slice(idx + word.length)
        used.add(slug)
        count++
      }
      return out
    })
    .join('')
}
