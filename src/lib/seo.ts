import type { Clinic } from '../data/clinic'
import type { Doctor } from '../data/doctors'
import type { Treatment } from '../data/treatments-types'

export type Meta = {
  title: string
  description: string
  path: string
  ogImage?: string
  type?: 'website' | 'article'
  noindex?: boolean
  jsonld?: object[]
  breadcrumbs?: { name: string; path: string }[]
  speakable?: string[]
}

export const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trim() + '…' : s)
export const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export const DEFAULT_OG = '/static/img/suwon-dodam-dental-reception-desk.webp'

export function dentistLd(clinic: Clinic, siteUrl: string) {
  const dayMap: Record<string, string> = { 월: 'Monday', 화: 'Tuesday', 수: 'Wednesday', 목: 'Thursday', 금: 'Friday', 토: 'Saturday', 일: 'Sunday' }
  return {
    '@context': 'https://schema.org',
    '@type': ['Dentist', 'LocalBusiness', 'MedicalBusiness'],
    '@id': `${siteUrl}/#clinic`,
    name: clinic.name,
    alternateName: [clinic.shortName, clinic.nameEn],
    url: siteUrl,
    logo: `${siteUrl}/static/img/logo-mark.png`,
    image: `${siteUrl}${DEFAULT_OG}`,
    telephone: clinic.phoneTel,
    email: clinic.email,
    description: clinic.mission,
    priceRange: '₩₩',
    currenciesAccepted: 'KRW',
    paymentAccepted: '현금, 신용카드, 계좌이체',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '화양로 34, 신우상가 2층 206·207호',
      addressLocality: '수원시 팔달구',
      addressRegion: '경기도',
      postalCode: clinic.postalCode,
      addressCountry: 'KR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: clinic.geo.lat, longitude: clinic.geo.lng },
    hasMap: clinic.channels.naverPlace,
    areaServed: ['수원시 팔달구', '수원시 장안구', '수원시 권선구', '화서동', '화서역'],
    openingHoursSpecification: clinic.hours
      .filter((h) => h.open)
      .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayMap[h.day], opens: h.open, closes: h.close })),
    sameAs: Object.values(clinic.channels),
    medicalSpecialty: ['Dentistry'],
    isAcceptingNewPatients: true,
    foundingDate: clinic.founded,
  }
}

export function physicianLd(d: Doctor, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Physician', 'Person'],
    '@id': `${siteUrl}/doctors/${d.slug}#person`,
    name: d.name,
    alternateName: d.nameEn,
    jobTitle: d.title,
    image: `${siteUrl}${d.photo}`,
    url: `${siteUrl}/doctors/${d.slug}`,
    worksFor: { '@id': `${siteUrl}/#clinic` },
    medicalSpecialty: d.specialty,
    alumniOf: d.education.map((e) => ({ '@type': 'EducationalOrganization', name: e })),
    hasCredential: d.license.map((l) => ({ '@type': 'EducationalOccupationalCredential', name: l })),
    memberOf: d.societies.map((s) => ({ '@type': 'Organization', name: s })),
    knowsAbout: d.treatments,
    description: d.quote,
  }
}

export function procedureLd(t: Treatment, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: t.name,
    alternateName: t.nameEn,
    url: `${siteUrl}/treatments/${t.slug}`,
    description: t.short,
    procedureType: 'https://schema.org/NoninvasiveProcedure',
    howPerformed: t.steps?.map((s) => s.title).join(' → '),
    followup: t.sideEffects.join(' '),
    bodyLocation: '구강',
    provider: { '@id': `${siteUrl}/#clinic` },
  }
}

export const faqLd = (faqs: { q: string; a: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) } })),
})

export const breadcrumbLd = (items: { name: string; path: string }[], siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
})

export const articleLd = (a: { title: string; description: string; path: string; image?: string; published: string; modified?: string; author: string; authorPath: string }, clinic: Clinic, siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'MedicalWebPage',
  mainEntityOfPage: `${siteUrl}${a.path}`,
  headline: a.title,
  description: a.description,
  image: a.image ? [a.image.startsWith('http') ? a.image : `${siteUrl}${a.image}`] : undefined,
  datePublished: a.published,
  dateModified: a.modified || a.published,
  author: { '@type': 'Person', name: a.author, url: `${siteUrl}${a.authorPath}` },
  publisher: { '@type': 'Organization', name: clinic.name, logo: { '@type': 'ImageObject', url: `${siteUrl}/static/img/logo-mark.png` } },
  medicalAudience: { '@type': 'Patient' },
  reviewedBy: { '@type': 'Person', name: a.author },
})

export const speakableLd = (path: string, selectors: string[], siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: `${siteUrl}${path}`,
  speakable: { '@type': 'SpeakableSpecification', cssSelector: selectors },
})

export const webSiteLd = (clinic: Clinic, siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: clinic.name,
  url: siteUrl,
  potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/encyclopedia?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
})
