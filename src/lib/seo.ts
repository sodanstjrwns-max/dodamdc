import type { Clinic } from '../data/clinic'
import type { Doctor } from '../data/doctors'
import type { Treatment, FAQ } from '../data/treatments-types'

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
  bodyClass?: string
  publishedAt?: string
  modifiedAt?: string
  reviewedAt?: string
  reviewer?: Doctor
}

// Existing production origin. Set SITE_URL to the verified HTTPS origin on a domain move.
export const DEFAULT_SITE_URL = 'https://seoul-dodam-dental.pages.dev'
export function resolveSiteUrl(configured?: string) {
  try {
    const url = new URL(configured || DEFAULT_SITE_URL)
    if (url.protocol === 'https:' && !url.username && !url.password && !/^(localhost|127\.|\[::1\])/.test(url.hostname)) return url.origin
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
export function canonicalPath(path: string, requestUrl: string) {
  const url = new URL(path, 'https://canonical.invalid')
  url.hash = ''; url.search = ''
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
  // Pagination is distinct content, not a duplicate of page one. Keep known facets
  // on their own noindex URLs; remove tracking/preview parameters everywhere.
  if (['/column', '/notice', '/cases/gallery'].includes(url.pathname)) {
    const query = new URL(requestUrl).searchParams
    for (const key of ['doctor', 'treatment']) {
      if (url.pathname !== '/notice' && query.get(key)) url.searchParams.set(key, query.get(key)!)
    }
    const page = Number(query.get('page'))
    if (Number.isSafeInteger(page) && page > 1) url.searchParams.set('page', String(page))
  }
  return url.pathname + url.search
}
export function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value + 'T00:00:00Z')
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined
  }
  let text = value.trim().replace(' ', 'T')
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) text += 'Z' // D1 CURRENT_TIMESTAMP is UTC.
  const date = new Date(text)
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}
export const xmlEscape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const dayMap: Record<string, string> = { 월: 'Monday', 화: 'Tuesday', 수: 'Wednesday', 목: 'Thursday', 금: 'Friday', 토: 'Saturday', 일: 'Sunday' }
export function openingHours(clinic: Clinic) {
  return clinic.hours.flatMap(h => {
    if (!h.open || !h.close) return []
    const lunch = h.lunch?.split(/[–—-]/)
    const periods = lunch?.length === 2 ? [[h.open, lunch[0]], [lunch[1], h.close]] : [[h.open, h.close]]
    return periods.map(([opens, closes]) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: `https://schema.org/${dayMap[h.day]}`, opens, closes }))
  })
}
export function dentistLd(clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Dentist', '@id': absUrl(siteUrl, '/#clinic'),
    name: clinic.name, alternateName: clinic.nameEn, url: siteUrl + '/',
    logo: absUrl(siteUrl, '/static/img/logo-mark.png'),
    image: absUrl(siteUrl, '/static/img/suwon-dodam-dental-reception-desk-v2.webp'),
    telephone: clinic.phoneTel, email: clinic.email,
    address: { '@type': 'PostalAddress', streetAddress: clinic.address, addressLocality: `수원시 ${clinic.district}`, addressRegion: '경기도', postalCode: clinic.postalCode, addressCountry: 'KR' },
    geo: { '@type': 'GeoCoordinates', latitude: clinic.geo.lat, longitude: clinic.geo.lng },
    hasMap: clinic.channels.naverPlace, openingHoursSpecification: openingHours(clinic),
    sameAs: Object.values(clinic.channels).filter(url => /^https?:\/\//.test(url)),
    areaServed: { '@type': 'City', name: clinic.city },
    medicalSpecialty: 'https://schema.org/Dentistry', slogan: clinic.slogan,
    // No invented ratings, price range, acceptance status or founding date.
  }
}
export function physicianLd(d: Doctor, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Person', '@id': absUrl(siteUrl, `/doctors/${d.slug}#person`),
    name: d.name, alternateName: d.nameEn, jobTitle: `${d.title} · ${d.specialty}`,
    image: absUrl(siteUrl, d.photo), url: absUrl(siteUrl, `/doctors/${d.slug}`),
    worksFor: { '@id': absUrl(siteUrl, '/#clinic') },
    hasCredential: d.license.map(name => ({ '@type': 'EducationalOccupationalCredential', name, credentialCategory: '전문의 자격' })),
    alumniOf: d.education.map(name => ({ '@type': 'EducationalOrganization', name })),
    memberOf: d.societies.map(name => ({ '@type': 'Organization', name })),
    description: d.quote,
  }
}
export function websiteLd(clinic: Clinic, siteUrl: string) {
  return { '@context': 'https://schema.org', '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: clinic.name, alternateName: clinic.shortName, inLanguage: 'ko-KR', publisher: { '@id': siteUrl + '/#clinic' } }
}
export function webpageLd(meta: PageMeta, siteUrl: string, path: string) {
  const medical = /^\/(treatments|encyclopedia)\/.+/.test(meta.path)
  return {
    '@context': 'https://schema.org', '@type': medical ? 'MedicalWebPage' : meta.type === 'profile' ? 'ProfilePage' : 'WebPage',
    '@id': absUrl(siteUrl, path + '#webpage'), url: absUrl(siteUrl, path), name: meta.title,
    description: meta.description, inLanguage: 'ko-KR', isPartOf: { '@id': siteUrl + '/#website' },
    publisher: { '@id': siteUrl + '/#clinic' },
    breadcrumb: meta.crumbs && meta.crumbs.length > 1 ? { '@id': absUrl(siteUrl, path + '#breadcrumb') } : undefined,
    mainEntity: meta.type === 'profile' ? { '@id': absUrl(siteUrl, meta.path + '#person') } : meta.path.startsWith('/treatments/') ? { '@id': absUrl(siteUrl, meta.path + '#procedure') } : meta.path.startsWith('/encyclopedia/') ? { '@id': absUrl(siteUrl, meta.path + '#term') } : undefined,
    reviewedBy: meta.reviewer ? { '@id': absUrl(siteUrl, `/doctors/${meta.reviewer.slug}#person`) } : undefined,
    lastReviewed: isoDate(meta.reviewedAt), datePublished: isoDate(meta.publishedAt), dateModified: isoDate(meta.modifiedAt),
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
export function breadcrumbLd(crumbs: Crumb[], siteUrl: string, path?: string) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', ...(path ? { '@id': absUrl(siteUrl, path + '#breadcrumb') } : {}),
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(siteUrl, c.href) })),
  }
}
export function articleLd(a: { title: string; description: string; path: string; image?: string; author: string; authorPath: string; publishedAt: string; modifiedAt?: string }, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org', '@type': 'Article', '@id': absUrl(siteUrl, a.path + '#article'),
    headline: a.title, description: a.description, inLanguage: 'ko-KR',
    image: a.image ? absUrl(siteUrl, a.image) : undefined,
    author: { '@type': 'Person', '@id': absUrl(siteUrl, a.authorPath + '#person'), name: a.author, url: absUrl(siteUrl, a.authorPath) },
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
