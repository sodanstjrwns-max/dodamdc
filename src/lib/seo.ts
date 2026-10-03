import type { Clinic } from '../data/clinic'
import type { Doctor } from '../data/doctors'
import type { Treatment, FAQ } from '../data/treatments-types'
import { upcomingSpecialDays, dayOf } from './clinic-status'

export type Crumb = { name: string; href: string }
export type PageMeta = {
  title: string
  description: string
  path: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
  jsonld?: object[]
  crumbs?: Crumb[]
  citations?: string[]
  bodyClass?: string
  publishedAt?: string
  modifiedAt?: string
  reviewedAt?: string
  reviewer?: Doctor
  author?: Doctor
  /** 음성·AI 답변용 요약 요소 CSS 셀렉터(실제 DOM에 있는 것만) */
  speakable?: string[]
  /** 페이지 주제 MedicalProcedure 경로(예: /treatments/root-canal) → about @id */
  aboutPath?: string
}

// 공유 미리보기 기본 이미지: 1200×630 가로형 JPG(scripts/build-og-image.mjs로 실사 사진·로고 합성)
export const OG_IMAGE = '/static/img/og-dodam-1200x630.jpg'
export const OG_IMAGE_SIZE = { width: 1200, height: 630 }

// Verified custom domain attached to the existing Cloudflare Pages project.
export const DEFAULT_SITE_URL = 'https://dodamdc.kr'
export function resolveSiteUrl(configured?: string) {
  try {
    const url = new URL(configured || DEFAULT_SITE_URL)
    if (url.protocol === 'https:' && !url.username && !url.password && !/^(localhost|127\.|\[::1\])/.test(url.hostname)) return ['seoul-dodam-dental.pages.dev', 'www.dodamdc.kr'].includes(url.hostname) ? DEFAULT_SITE_URL : url.origin
  } catch { /* Invalid or local preview settings must not become canonical URLs. */ }
  return DEFAULT_SITE_URL
}
export const truncate = (s: string, n = 155) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
export function fullTitle(title: string, clinic: Clinic) {
  return title.includes(clinic.shortName) ? title : `${title} | ${clinic.shortName}`
}
export function absUrl(siteUrl: string, path: string) {
  return new URL(path, siteUrl + '/').href
}
// Keep list rendering, titles and canonical URLs on the same bounded page number.
export function paginationPage(value?: string | null) {
  const page = Number(value)
  return Number.isFinite(page) ? Math.min(10000, Math.max(1, Math.floor(page) || 1)) : 1
}
export function canonicalPath(path: string, requestUrl: string) {
  const url = new URL(path, 'https://canonical.invalid')
  url.hash = ''; url.search = ''
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  // Pagination is distinct content, not a duplicate of page one. Keep known facets
  // on their own noindex URLs; remove tracking/preview parameters everywhere.
  if (['/column', '/notice', '/cases/gallery'].includes(url.pathname)) {
    const query = new URL(requestUrl).searchParams
    const facets = url.pathname === '/cases/gallery' ? ['doctor', 'treatment'] : url.pathname === '/column' ? ['treatment'] : []
    for (const key of facets) {
      if (query.get(key)) url.searchParams.set(key, query.get(key)!)
    }
    const page = paginationPage(query.get('page'))
    if (page > 1) url.searchParams.set('page', String(page))
  }
  return url.pathname + url.search
}
export function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined
  let text = value.trim().replace(' ', 'T')
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(text)) return undefined
  const day = text.slice(0, 10)
  const date = new Date(day + 'T00:00:00Z')
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return undefined
  if (text === day) return day
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(text)) text += 'Z' // D1 CURRENT_TIMESTAMP is UTC.
  const timestamp = new Date(text)
  return Number.isFinite(timestamp.getTime()) ? timestamp.toISOString() : undefined
}
export const xmlEscape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const dayMap: Record<string, string> = { 월: 'Monday', 화: 'Tuesday', 수: 'Wednesday', 목: 'Thursday', 금: 'Friday', 토: 'Saturday', 일: 'Sunday' }
const hourPeriods = (h: { open: string | null; close: string | null; lunch: string | null }) => {
  if (!h.open || !h.close) return [] as [string, string][]
  const lunch = h.lunch?.split(/[–—-]/)
  return (lunch?.length === 2 ? [[h.open, lunch[0]], [lunch[1], h.close]] : [[h.open, h.close]]) as [string, string][]
}
export function openingHours(clinic: Clinic) {
  return clinic.hours.flatMap(h => hourPeriods(h).map(([opens, closes]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${dayMap[h.day]}`, opens, closes })))
}
/** 기본 시간표와 다른 날(향후 12개월): 공휴일 주 수요일·임시 진료일은 그날 시간, 임시 휴진일은 opens=closes=00:00(종일 휴무)으로 명시한다. */
export function specialOpeningHours(clinic: Clinic, now = new Date()) {
  return upcomingSpecialDays(clinic, now, 366).flatMap(d => {
    const base = { '@type': 'OpeningHoursSpecification', validFrom: d.ymd, validThrough: d.ymd, dayOfWeek: `https://schema.org/${dayMap[dayOf(d.ymd)]}` }
    if (d.kind === 'closed') return d.baseOpen ? [{ ...base, opens: '00:00', closes: '00:00' }] : []
    return d.row ? hourPeriods(d.row).map(([opens, closes]) => ({ ...base, opens, closes })) : []
  })
}
export type PressItem = { date: string; outlet: string; title: string; summary?: string | null; url: string }
export function newsArticleLd(p: PressItem) {
  return { '@type': 'NewsArticle', headline: p.title, datePublished: p.date, publisher: { '@type': 'Organization', name: p.outlet }, url: p.url, ...(p.summary ? { description: p.summary } : {}) }
}
export function pressListLd(items: PressItem[], siteUrl: string) {
  return { '@context': 'https://schema.org', '@type': 'ItemList', '@id': absUrl(siteUrl, '/press#list'), name: '서울도담치과 언론보도', itemListOrder: 'https://schema.org/ItemListOrderDescending', numberOfItems: items.length, itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: newsArticleLd(p) })) }
}
export function dentistLd(clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Dentist', '@id': absUrl(siteUrl, '/#clinic'),
    name: clinic.name, alternateName: clinic.nameEn, url: siteUrl + '/',
    logo: absUrl(siteUrl, '/static/img/logo-mark.png'),
    image: absUrl(siteUrl, '/static/img/dodam-space-information-desk-v2.webp'),
    telephone: clinic.phoneTel, email: clinic.email,
    address: { '@type': 'PostalAddress', streetAddress: clinic.address, addressLocality: `수원시 ${clinic.district}`, addressRegion: '경기도', postalCode: clinic.postalCode, addressCountry: 'KR' },
    geo: { '@type': 'GeoCoordinates', latitude: clinic.geo.lat, longitude: clinic.geo.lng },
    hasMap: clinic.channels.naverPlace, openingHoursSpecification: openingHours(clinic), specialOpeningHoursSpecification: specialOpeningHours(clinic),
    sameAs: Object.values(clinic.channels).filter(url => /^https?:\/\//.test(url)),
    areaServed: { '@type': 'City', name: clinic.city },
    medicalSpecialty: 'https://schema.org/Dentistry', slogan: clinic.slogan,
    // No invented ratings, price range, acceptance status or founding date.
  }
}
export function physicianLd(d: Doctor, clinic: Clinic, siteUrl: string, press: PressItem[] = []) {
  return {
    '@context': 'https://schema.org', '@type': 'Person', '@id': absUrl(siteUrl, `/doctors/${d.slug}#person`),
    name: d.name, alternateName: d.nameEn, jobTitle: `${d.title} · ${d.specialty}`,
    image: absUrl(siteUrl, d.photo), url: absUrl(siteUrl, `/doctors/${d.slug}`),
    worksFor: { '@id': absUrl(siteUrl, '/#clinic') },
    hasCredential: d.license.map(name => ({ '@type': 'EducationalOccupationalCredential', name, credentialCategory: '전문의 자격' })),
    alumniOf: d.education.map(name => ({ '@type': 'EducationalOrganization', name })),
    memberOf: d.societies.map(name => ({ '@type': 'Organization', name })),
    description: d.quote,
    ...(press.length ? { subjectOf: press.map(newsArticleLd) } : {}),
  }
}
export function websiteLd(clinic: Clinic, siteUrl: string) {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: clinic.name, alternateName: clinic.shortName, inLanguage: 'ko-KR', publisher: { '@id': siteUrl + '/#clinic' } }
}
export function webpageLd(meta: PageMeta, siteUrl: string, path: string) {
  const medical = /^\/(treatments|encyclopedia|column|cases\/gallery)\/.+/.test(meta.path)
  const collection = ['/column', '/cases/gallery'].includes(meta.path)
  const article = meta.jsonld?.find(node => ['Article', 'BlogPosting'].includes(String((node as Record<string, unknown>)['@type']))) as Record<string, unknown> | undefined
  return {
    '@context': 'https://schema.org', '@type': medical ? 'MedicalWebPage' : collection ? 'CollectionPage' : meta.type === 'profile' ? 'ProfilePage' : 'WebPage',
    '@id': absUrl(siteUrl, path + '#webpage'), url: absUrl(siteUrl, path), name: meta.title,
    description: meta.description, inLanguage: 'ko-KR', isPartOf: { '@id': siteUrl + '/#website' },
    publisher: { '@id': siteUrl + '/#clinic' },
    breadcrumb: meta.crumbs && meta.crumbs.length > 1 ? { '@id': absUrl(siteUrl, path + '#breadcrumb') } : undefined,
    mainEntity: meta.type === 'profile' ? { '@id': absUrl(siteUrl, meta.path + '#person') } : meta.path.startsWith('/treatments/') ? { '@id': absUrl(siteUrl, meta.path + '#procedure') } : meta.path.startsWith('/encyclopedia/') ? { '@id': absUrl(siteUrl, meta.path + '#term') } : article ? { '@id': article['@id'] } : undefined,
    author: meta.author ? { '@id': absUrl(siteUrl, `/doctors/${meta.author.slug}#person`) } : undefined,
    reviewedBy: meta.reviewer ? { '@id': absUrl(siteUrl, `/doctors/${meta.reviewer.slug}#person`) } : undefined,
    citation: meta.citations,
    lastReviewed: isoDate(meta.reviewedAt), datePublished: isoDate(meta.publishedAt), dateModified: isoDate(meta.modifiedAt),
    speakable: meta.speakable?.length ? { '@type': 'SpeakableSpecification', cssSelector: meta.speakable } : undefined,
    about: meta.aboutPath ? { '@id': absUrl(siteUrl, meta.aboutPath + '#procedure') } : undefined,
  }
}
export function procedureLd(t: Treatment, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': 'MedicalProcedure', '@id': absUrl(siteUrl, `/treatments/${t.slug}#procedure`),
    name: t.name, alternateName: t.nameEn, url: absUrl(siteUrl, `/treatments/${t.slug}`), description: t.short,
    bodyLocation: '구강', howPerformed: t.steps?.map(s => s.title).join(' → '),
    relevantSpecialty: 'https://schema.org/Dentistry', subjectOf: { '@id': absUrl(siteUrl, `/treatments/${t.slug}#webpage`) },
    // Do not classify mixed/surgical treatment pages as NoninvasiveProcedure.
  }
}
export function faqLd(faqs: FAQ[], url?: string) {
  return {
    '@context': 'https://schema.org', '@type': 'FAQPage', ...(url ? { '@id': url + '#faq', url: url + '#faq', inLanguage: 'ko-KR' } : {}),
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}
// ── CMS 본문 → FAQPage (원장 요청 2026-10-03) ─────────────────────
// 칼럼 본문의 질문형 <h3>과 그 아래 내용(다음 h1~h3 전까지)을 Q&A로 읽는다.
// 화면에 렌더되는 정제 HTML(articleHtml 결과)을 입력으로 받아 보이는 내용과 일치시킨다.
const QUESTION_END = /(?:[?？]|(?:나요|까요|가요|은가|는가|인가|니까|는지요|을까|ㄹ까|죠|습니까)[.!]?)$/
const decodeEntities = (s: string) => s
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => { const c = Number(n); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : '' })
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => { const c = parseInt(n, 16); return c > 0 && c < 0x110000 ? String.fromCodePoint(c) : '' })
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
const htmlText = (s: string) => decodeEntities(s
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<br\s*\/?>|<\/(?:p|li|div|blockquote|tr|figcaption)>/gi, ' ')
  .replace(/<[^>]*>/g, ''))
  .replace(/\[\d+(?:\s*[,–-]\s*\d+)*\]/g, '') // 각주 번호 [1] [2-3]
  .replace(/\s+/g, ' ').trim()
const clip = (s: string, n: number) => {
  if (s.length <= n) return s
  const cut = s.slice(0, n), end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('다. '), cut.lastIndexOf('요. '))
  return (end > n * 0.5 ? cut.slice(0, end + 1) : cut.trimEnd()) + '…'
}
/** 칼럼 본문 HTML에서 질문형 h3 + 답변을 추출. 질문형 h3이 없으면 빈 배열. */
export function faqsFromArticleHtml(html: string, opts: { maxItems?: number; maxAnswer?: number } = {}): FAQ[] {
  const { maxItems = 20, maxAnswer = 1000 } = opts
  const src = String(html || '')
  const heads = Array.from(src.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi))
  const out: FAQ[] = [], seen = new Set<string>()
  for (const m of heads) {
    if (out.length >= maxItems) break
    const q = htmlText(m[1]).replace(/^(?:Q\s*\d*\s*[.:)]|질문\s*\d*\s*[.:)])\s*/i, '').trim()
    if (!q || q.length > 200 || !QUESTION_END.test(q) || seen.has(q)) continue
    let seg = src.slice(m.index! + m[0].length)
    const next = seg.search(/<h[1-3][\s>]/i)
    if (next >= 0) seg = seg.slice(0, next)
    // 답변이 아닌 꼬리 블록에서 멈춤: 굵은 글씨만 있는 소제목 문단(예: <p><strong>참고문헌</strong></p>), 구분선, ※ 안내문
    const stop = seg.search(/<p\b[^>]*>\s*<(strong|b)\b[^>]*>[^<]{1,40}<\/\1>\s*<\/p>|<hr\b|<p\b[^>]*>\s*※/i)
    if (stop >= 0) seg = seg.slice(0, stop)
    const a = htmlText(seg).replace(/^(?:A\s*\d*\s*[.:)]|답변\s*[.:)])\s*/i, '').trim()
    if (a.length < 10) continue
    seen.add(q)
    out.push({ q, a: clip(a, maxAnswer) })
  }
  return out
}
/** jsonld 목록에 FAQPage를 붙인다. 이미 FAQPage가 있으면 새 질문만 그 노드에 병합(중복 FAQPage 금지). */
export function withFaqLd(jsonld: object[], faqs: FAQ[], url?: string): object[] {
  if (!faqs.length) return jsonld
  const existing = jsonld.find(n => (n as Record<string, unknown>)['@type'] === 'FAQPage') as { mainEntity?: { name?: string }[] } | undefined
  if (!existing) return [...jsonld, faqLd(faqs, url)]
  const names = new Set((existing.mainEntity || []).map(e => e.name))
  existing.mainEntity = [...(existing.mainEntity || []), ...faqLd(faqs.filter(f => !names.has(f.q))).mainEntity]
  return jsonld
}
export function breadcrumbLd(crumbs: Crumb[], siteUrl: string, path?: string) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', ...(path ? { '@id': absUrl(siteUrl, path + '#breadcrumb') } : {}),
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(siteUrl, c.href) })),
  }
}
export function articleLd(a: { title: string; description: string; path: string; image?: string; author?: string; authorPath?: string; publishedAt: string; modifiedAt?: string; aboutPath?: string; keywords?: string; type?: 'Article' | 'BlogPosting' }, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': a.type || 'Article', '@id': absUrl(siteUrl, a.path + '#article'),
    url: absUrl(siteUrl, a.path), isPartOf: { '@id': siteUrl + '/#website' },
    ...(a.aboutPath ? { about: { '@id': absUrl(siteUrl, a.aboutPath + '#procedure') } } : {}),
    ...(a.author && a.authorPath ? { reviewedBy: { '@id': absUrl(siteUrl, a.authorPath + '#person') } } : {}),
    ...(a.keywords ? { keywords: a.keywords } : {}),
    headline: a.title, description: a.description, inLanguage: 'ko-KR',
    image: a.image ? { '@type': 'ImageObject', url: absUrl(siteUrl, a.image) } : undefined,
    // Editorial columns name their doctor; clinic notices use the publishing organization.
    author: a.author && a.authorPath ? { '@type': 'Person', '@id': absUrl(siteUrl, a.authorPath + '#person'), name: a.author, url: absUrl(siteUrl, a.authorPath) } : { '@id': absUrl(siteUrl, '/#clinic') },
    publisher: { '@id': absUrl(siteUrl, '/#clinic') },
    datePublished: isoDate(a.publishedAt), dateModified: isoDate(a.modifiedAt || a.publishedAt),
    mainEntityOfPage: { '@id': absUrl(siteUrl, a.path + '#webpage') },
  }
}
export function definedTermLd(term: { term: string; en: string; def: string; slug: string }, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': 'DefinedTerm', '@id': absUrl(siteUrl, `/encyclopedia/${term.slug}#term`),
    name: term.term, alternateName: term.en, description: term.def, url: absUrl(siteUrl, `/encyclopedia/${term.slug}`),
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: '서울도담치과 치과 백과사전', url: absUrl(siteUrl, '/encyclopedia') },
  }
}

// ── 칼럼·사례 목록 ItemList (PFWE-COLUMN-CASE-SEO 2026-10-03) ──
export function itemListLd(items: { name: string; path: string }[], siteUrl: string, listPath: string, start = 0) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', '@id': absUrl(siteUrl, listPath + '#itemlist'), numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: start + i + 1, name: it.name, url: absUrl(siteUrl, it.path) })),
  }
}
// ── 핵심 요약 박스: 본문 앞부분 문단을 그대로 발췌(새 문장 생성 없음) ──
const GREETING = /^(안녕하세요|안녕하십니까|반갑습니다)/
const CONNECTOR = /^(그리고|그런데|하지만|그러나|그래서|그렇게|또|또한|특히|물론|이처럼|이렇게)\s/
const LEAD_IN = /(이런|다음과 같|아래와 같|아래처럼)/
export function answerSummaryFromHtml(html: string): string {
  const paras = Array.from(String(html || '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)).slice(0, 25).map(m => htmlText(m[1])).filter(t => t.length >= 20)
  const ok = (t: string) => t.length >= 40 && !GREETING.test(t) && !/^[“"'「『(]/.test(t) && !/[“”"]/.test(t) && !CONNECTOR.test(t) && !/원장입니다\.?$/.test(t) && !/[?？]$|까요\.?$/.test(t) && !(LEAD_IN.test(t) && t.length < 90)
  const pick = paras.find(t => /^(먼저\s*)?(결론부터|결론적으로|요약하면|한마디로|핵심만)/.test(t))
    || paras.slice(0, 15).find(t => ok(t) && /(입니다|됩니다|습니다)\.?$/.test(t) && /(입니다|됩니다|때문입니다)/.test(t))
    || paras.find(ok)
  if (!pick) return ''
  let out = ''
  for (const sen of pick.split(/(?<=[.!?。])\s+/).filter(Boolean).slice(0, 3)) {
    if ((out + ' ' + sen).trim().length > 220 && out) break
    out = (out + ' ' + sen).trim()
  }
  return out.length > 220 ? out.slice(0, 219).trimEnd() + '…' : out
}
/** meta description 80~160자 — 우선 값이 짧으면 본문 발췌로 보충 */
export function metaDescription(primary: string | null | undefined, fallback: string, max = 158) {
  const norm = (v: string) => String(v || '').replace(/\s+/g, ' ').trim()
  let d = norm(primary || '')
  if (d.length < 80) { const f = norm(fallback); d = d ? (f && !f.startsWith(d) ? `${d} ${f}` : d) : f }
  return truncate(d, max)
}
