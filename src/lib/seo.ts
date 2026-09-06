import type { Clinic } from '../data/clinic'
import type { Doctor } from '../data/doctors'
import type { Treatment, FAQ } from '../data/treatments-types'

export type Crumb = { name: string; href: string }

export type PageMeta = {
  title: string // 페이지 고유 제목 (병원명 자동 추가)
  description: string
  path: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
  jsonld?: object[]
  crumbs?: Crumb[]
  bodyClass?: string
  publishedAt?: string
  modifiedAt?: string
}

export const truncate = (s: string, n = 155) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

export function fullTitle(title: string, clinic: Clinic) {
  return title.includes(clinic.shortName) ? title : `${title} | ${clinic.shortName}`
}

export function absUrl(siteUrl: string, path: string) {
  if (/^https?:\/\//.test(path)) return path
  return siteUrl.replace(/\/$/, '') + path
}

// ── JSON-LD 빌더 ────────────────────────────────────────
const dayMap: Record<string, string> = { 월: 'Monday', 화: 'Tuesday', 수: 'Wednesday', 목: 'Thursday', 금: 'Friday', 토: 'Saturday', 일: 'Sunday' }

export function openingHours(clinic: Clinic) {
  return clinic.hours
    .filter((h) => h.open && h.close)
    .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: dayMap[h.day], opens: h.open, closes: h.close }))
}

export function dentistLd(clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Dentist', 'LocalBusiness', 'MedicalBusiness'],
    '@id': absUrl(siteUrl, '/#clinic'),
    name: clinic.name,
    alternateName: clinic.nameEn,
    url: siteUrl,
    logo: absUrl(siteUrl, '/static/img/logo-mark.png'),
    image: absUrl(siteUrl, '/static/img/suwon-dodam-dental-reception-desk-v2.webp'),
    telephone: clinic.phoneTel,
    email: clinic.email,
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
    openingHoursSpecification: openingHours(clinic),
    sameAs: [clinic.channels.naverPlace, clinic.channels.naverBlog, clinic.channels.instagram, clinic.channels.kakao].filter(Boolean),
    areaServed: ['수원시 팔달구', '수원시 장안구', '수원시 권선구', '화서동', '화서역'],
    medicalSpecialty: ['Dentistry'],
    isAcceptingNewPatients: true,
    foundingDate: clinic.founded,
    slogan: clinic.slogan,
  }
}

export function physicianLd(d: Doctor, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Physician', 'Person'],
    '@id': absUrl(siteUrl, `/doctors/${d.slug}#person`),
    name: d.name,
    honorificSuffix: d.title,
    jobTitle: d.title,
    image: absUrl(siteUrl, d.photo),
    url: absUrl(siteUrl, `/doctors/${d.slug}`),
    worksFor: { '@id': absUrl(siteUrl, '/#clinic') },
    medicalSpecialty: 'Dentistry',
    alumniOf: d.education.map((e) => ({ '@type': 'EducationalOrganization', name: e })),
    memberOf: d.societies.map((s) => ({ '@type': 'Organization', name: s })),
    knowsAbout: d.treatments,
    description: d.quote,
  }
}

export function procedureLd(t: Treatment, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    '@id': absUrl(siteUrl, `/treatments/${t.slug}#procedure`),
    name: t.name,
    alternateName: t.nameEn,
    url: absUrl(siteUrl, `/treatments/${t.slug}`),
    description: t.short,
    procedureType: 'https://schema.org/NoninvasiveProcedure',
    bodyLocation: '구강',
    howPerformed: t.steps?.map((s) => s.title).join(' → '),
    followup: t.sideEffects.join(' '),
    provider: { '@id': absUrl(siteUrl, '/#clinic') },
  }
}

export function faqLd(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
}

export function breadcrumbLd(crumbs: Crumb[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: absUrl(siteUrl, c.href) })),
  }
}

export function articleLd(a: { title: string; description: string; path: string; image?: string; author: string; authorPath: string; publishedAt: string; modifiedAt?: string }, clinic: Clinic, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    mainEntity: {
      '@type': 'Article',
      headline: a.title,
      description: a.description,
      image: a.image ? absUrl(siteUrl, a.image) : undefined,
      author: { '@type': 'Person', name: a.author, url: absUrl(siteUrl, a.authorPath) },
      publisher: { '@type': 'Organization', name: clinic.name, logo: { '@type': 'ImageObject', url: absUrl(siteUrl, '/static/img/logo-mark.png') } },
      datePublished: a.publishedAt,
      dateModified: a.modifiedAt || a.publishedAt,
      mainEntityOfPage: absUrl(siteUrl, a.path),
    },
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['.lead', 'h1', '.summary-box'] },
  }
}

export function webpageSpeakableLd(path: string, siteUrl: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': absUrl(siteUrl, path),
    name,
    speakable: { '@type': 'SpeakableSpecification', cssSelector: ['h1', '.lead', '.summary-box'] },
    isPartOf: { '@type': 'WebSite', url: siteUrl },
  }
}

export function definedTermLd(term: { term: string; en: string; def: string; slug: string }, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    alternateName: term.en,
    description: term.def,
    url: absUrl(siteUrl, `/encyclopedia/${term.slug}`),
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: '서울도담치과 치과 백과사전', url: absUrl(siteUrl, '/encyclopedia') },
  }
}
