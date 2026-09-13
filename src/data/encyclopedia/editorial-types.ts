/** Patient education, not a diagnosis or a claim of clinician sign-off. */
export type TermEditorial = {
  context: string
  distinction: string
  question: string
  related: string[]
}

export const EDITORIAL_UPDATED = '2026-09-14'

// Explicit, term-specific prose. Never fill missing entries with a category template.
export function parseEditorial(raw: string): Record<string, TermEditorial> {
  return Object.fromEntries(raw.trim().split('\n').filter(Boolean).map(line => {
    const [slug, context, distinction, question, links, ...extra] = line.split('|')
    if (!slug || !context || !distinction || !question || !links || extra.length) throw new Error(`Invalid encyclopedia editorial: ${slug}`)
    return [slug, { context, distinction, question, related: links.split(',') }]
  }))
}
