import { html, raw } from 'hono/html'
import type { HtmlEscapedString } from 'hono/utils/html'
import type { FAQ } from '../data/treatments'
import type { Crumb } from './seo'
import { esc } from './util'
import { imageManifest } from '../data/image-manifest'
import { getNaverBookingUrl, type Clinic } from '../data/clinic'

/** External reservation handoff only; no patient data or selected dates are forwarded. */
export function naverBookingLink(clinic: Clinic, classes = 'btn btn-primary', label = '네이버 예약', arrow = true) {
  const url = getNaverBookingUrl(clinic)
  if (!url) return ''
  return html`<a href="${url}" class="${classes} naver-booking-link" target="_blank" rel="noopener noreferrer" aria-label="${label} (네이버 예약, 새 창)" data-booking-provider="naver">${label}${arrow ? html`<span aria-hidden="true">↗</span>` : ''}</a>`
}

export function imageAttrs(src: string, sizes = '(max-width: 760px) calc(100vw - 44px), (max-width: 1000px) 50vw, 600px', width = 960, height = 640) {
  const asset = imageManifest[src]
  return html`width="${asset?.width || width}" height="${asset?.height || height}" ${asset ? html`srcset="${asset.srcset}" sizes="${sizes}"` : ''}`
}

export type H = HtmlEscapedString | Promise<HtmlEscapedString>

export const crumbs = (items: Crumb[]) => html`<nav class="crumbs" aria-label="현재 위치"><ol>
  ${items.map((c, i) => (i === items.length - 1 ? html`<li aria-current="page">${c.name}</li>` : html`<li><a href="${c.href}">${c.name}</a></li>`))}
</ol></nav>`

/** 서브페이지 상단 히어로 */
export function pageHero(o: { eyebrow?: string; title: string | H; lead?: string; crumbs?: Crumb[]; image?: string; imageAlt?: string; actions?: H | string }) {
  return html`<section class="page-hero ${o.image ? 'has-img' : ''}">
  <div class="container page-hero-grid">
    <div class="page-hero-text">
      ${o.crumbs ? crumbs(o.crumbs) : ''}
      ${o.eyebrow ? html`<p class="eyebrow reveal in">${o.eyebrow}</p>` : ''}
      <h1 class="h1 reveal in">${o.title}</h1>
      ${o.lead ? html`<p class="lead reveal in">${o.lead}</p>` : ''}
      ${o.actions ? html`<div class="hero-actions reveal in">${o.actions}</div>` : ''}
    </div>
    ${o.image ? html`<figure class="page-hero-img reveal-scale in"><img src="${o.image}" alt="${o.imageAlt || ''}" ${imageAttrs(o.image)} fetchpriority="high" decoding="async"><figcaption class="page-image-label">SEOUL DODAM · CARE IN DETAIL</figcaption></figure>` : ''}
  </div>
</section>`
}

/** FAQ 아코디언 (CSS-only details) */
export function faqList(faqs: FAQ[], opts: { cat?: string; open?: number } = {}) {
  return html`<div class="faq-list">
  ${faqs.map(
    (f, i) => html`<details class="faq-item" data-cat="${opts.cat || ''}" ${opts.open != null && i < opts.open ? 'open' : ''}>
      <summary><span class="q">${f.q}</span><span class="faq-icon" aria-hidden="true"></span></summary>
      <div class="faq-a"><p>${f.a}</p></div>
    </details>`,
  )}
</div>`
}

/** 하단 CTA 스트립 */
export function ctaStrip(clinic: any, o: { title?: string; sub?: string } = {}) {
  return html`<section class="section-sm">
  <div class="container">
    <div class="cta-strip reveal">
      <div>
        <h2 class="h3">${o.title || '어떤 치료가 필요한지부터 함께 확인해 드립니다'}</h2>
        <p>${o.sub || `전화 ${clinic.phone} · 화요일 야간진료 20:30까지 · ${clinic.addressShort}`}</p>
      </div>
      <div class="cta-strip-actions">
        ${naverBookingLink(clinic)}
        <a href="/reservation" class="btn btn-outline">홈페이지 예약 신청</a>
        <a href="tel:${clinic.phoneTel}" class="btn btn-outline">전화 문의</a>
      </div>
    </div>
  </div>
</section>`
}

/** 리뷰 카운트 문구 — 의료광고법: 정확한 표기 고정 */
export const reviewLine = (clinic: any) => `${clinic.reviews.source} ${Number(clinic.reviews.count).toLocaleString('ko-KR')}개 (${clinic.reviews.asOf} 기준)`

/** The page title owns H1; editor body headings start at H2 without changing stored text. */
export function articleHtml(s: string) {
  return safeHtml(String(s || '').replace(/<(\/?)(h1)(?=[\s>])/gi, '<$1h2'))
}

/** 안전한 raw HTML (관리자 작성 콘텐츠용 — 스크립트 제거) */
export function safeHtml(s: string) {
  const cleaned = String(s || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
  return raw(cleaned)
}

export const img = (src: string, alt: string, w = 800, h = 600, cls = '', lazy = true) =>
  raw(`<img src="${esc(src)}" alt="${esc(alt)}" width="${w}" height="${h}" ${cls ? `class="${cls}"` : ''} ${lazy ? 'loading="lazy"' : ''} decoding="async">`)

export const pill = (items: string[]) => html`<ul class="pill-list">${items.map((s) => html`<li>${s}</li>`)}</ul>`

export const alertBox = (msg?: string | null, type: 'error' | 'ok' = 'error') => (msg ? html`<div class="alert-${type}" role="alert">${msg}</div>` : '')

export const paginate = (base: string, page: number, total: number, per: number) => {
  const pages = Math.max(1, Math.ceil(total / per))
  if (pages <= 1) return ''
  const q = (p: number) => `${base}${base.includes('?') ? '&' : '?'}page=${p}`
  return html`<nav class="pagination" aria-label="페이지"><ul>
    ${page > 1 ? html`<li><a href="${q(page - 1)}" rel="prev">이전</a></li>` : ''}
    ${Array.from({ length: pages }, (_, i) => i + 1).map((p) => html`<li>${p === page ? html`<span aria-current="page">${p}</span>` : html`<a href="${q(p)}">${p}</a>`}</li>`)}
    ${page < pages ? html`<li><a href="${q(page + 1)}" rel="next">다음</a></li>` : ''}
  </ul></nav>`
}
