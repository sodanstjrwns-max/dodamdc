import { html, raw } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from './types'
import { fullTitle, absUrl, breadcrumbLd, canonicalPath, dentistLd, websiteLd, webpageLd, isoDate, type PageMeta } from './seo'
import { coreTreatments, otherTreatments } from '../data/treatments'
import { doctors } from '../data/doctors'
import { imageManifest } from '../data/image-manifest'
import { naverBookingLink } from './ui'
import { conversionMeta } from './conversions'

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

export function Layout(c: Context<Env>, meta: PageMeta, body: any) {
  const clinic = c.get('clinic') as any
  const siteUrl = c.get('siteUrl')
  const user = c.get('user')
  const path = canonicalPath(meta.path, c.req.url)
  const pageNumber = new URL('https://canonical.invalid' + path).searchParams.get('page')
  const title = fullTitle(meta.title, clinic) + (pageNumber ? ` · ${pageNumber}페이지` : '')
  const description = meta.description + (pageNumber ? ` (${pageNumber}페이지)` : '')
  const url = absUrl(siteUrl, path)
  const imagePath = meta.image || '/static/img/suwon-dodam-dental-reception-desk-v2.webp'
  const image = absUrl(siteUrl, imagePath)
  const imageSize = imageManifest[imagePath]
  const preview = new URL(c.req.url).origin !== siteUrl
  const noindex = preview || meta.noindex || !['GET', 'HEAD'].includes(c.req.method) || (meta.path === '/reservation' && c.req.query('ok') === '1')
  c.header('X-Robots-Tag', noindex ? 'noindex, follow' : 'index, follow')
  // Personalized headers/forms must never enter a shared HTML cache.
  c.header('Cache-Control', 'private, no-store')
  const lds = [dentistLd(clinic, siteUrl), websiteLd(clinic, siteUrl), webpageLd({ ...meta, title, description }, siteUrl, path), ...(meta.jsonld || [])]
  if (meta.crumbs && meta.crumbs.length > 1) lds.push(breadcrumbLd(meta.crumbs, siteUrl, path))
  const hoursToday = (() => {
    const d = ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.now() + 9 * 3600e3).getUTCDay()]
    const h = clinic.hours.find((x: any) => x.day === d)
    return h?.open ? `오늘(${d}) ${h.open}–${h.close}${h.note ? ' · ' + h.note : ''}` : `오늘(${d}) 휴진`
  })()

  return html`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
${conversionMeta(c, meta.path)}
<link rel="canonical" href="${url}">
${noindex ? raw('<meta name="robots" content="noindex, follow">') : raw('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">')}
<meta property="og:type" content="${meta.type || 'website'}">
<meta property="og:site_name" content="${clinic.name}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:alt" content="${meta.imageAlt || meta.title}">
${imageSize ? html`<meta property="og:image:width" content="${imageSize.width}"><meta property="og:image:height" content="${imageSize.height}">` : ''}
${isoDate(meta.publishedAt) ? html`<meta property="article:published_time" content="${isoDate(meta.publishedAt)}">` : ''}
${isoDate(meta.modifiedAt) ? html`<meta property="article:modified_time" content="${isoDate(meta.modifiedAt)}">` : ''}
${meta.author || meta.reviewer ? html`<meta name="author" content="${(meta.author || meta.reviewer)!.name}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${meta.imageAlt || meta.title}">
${clinic.gsc ? raw(`<meta name="google-site-verification" content="${escAttr(clinic.gsc)}">`) : ''}
${clinic.naverVerify ? raw(`<meta name="naver-site-verification" content="${escAttr(clinic.naverVerify)}">`) : ''}
<meta name="theme-color" content="${clinic.brand.primary}">
<meta name="geo.region" content="KR-41"><meta name="geo.placename" content="수원시 팔달구 화서동">
<meta name="geo.position" content="${clinic.geo.lat};${clinic.geo.lng}"><meta name="ICBM" content="${clinic.geo.lat}, ${clinic.geo.lng}">
<link rel="icon" href="/favicon.png" type="image/png"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/static/fonts/WantedSansCore-v2.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/static/fonts/wanted-subsets.css?v=2">
<link rel="stylesheet" href="/static/style.css?v=8">
<link rel="stylesheet" href="/static/kinetic.css?v=16">
${meta.path === '/handover' ? html`<link rel="stylesheet" href="/static/handover.css?v=1">` : ''}
<link rel="alternate" type="application/rss+xml" title="${clinic.shortName} 원장 칼럼" href="/column/rss.xml">
${lds.map((l) => raw(`<script type="application/ld+json">${JSON.stringify(l).replace(/</g, '\\u003c')}</script>`))}
${clinic.ga4 && !/^\/(auth|admin|reservation|handover)(\/|$)/.test(meta.path) ? raw(`<script async src="https://www.googletagmanager.com/gtag/js?id=${escAttr(clinic.ga4)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${escAttr(clinic.ga4)}',{anonymize_ip:true});</script>`) : ''}
</head>
<body class="site-page experience-theme ${meta.bodyClass || ''} ${meta.path === '/reservation' ? 'reservation-page' : ''}" id="top">
<a href="#main" class="skip-link">본문으로 건너뛰기</a>
<div class="progress-bar" id="scroll-progress" aria-hidden="true"></div>

<header class="site-header" id="site-header">
  <div class="header-inner">
    <a href="/" class="brand" aria-label="${clinic.name} 홈">
      <img src="/static/img/logo-wide.png" alt="${clinic.name} 로고" width="176" height="44" class="brand-logo">
    </a>
    <nav class="gnb" id="gnb" aria-label="주 메뉴">
      <ul class="gnb-list">
        <li><a href="/mission">도담의 철학</a></li>
        <li><a href="/doctors">의료진 소개</a></li>
        <li class="has-mega">
          <a href="/treatments" aria-haspopup="true" aria-expanded="false">진료 안내</a>
          <div class="mega" role="region" aria-label="진료 과목 메뉴">
            <div class="mega-inner">
              <div class="mega-col mega-core">
                <p class="mega-title">자연치아에서 시작하는 핵심 진료</p>
                ${coreTreatments.map(
                  (t) => html`<a href="/treatments/${t.slug}" class="mega-card">
                    <span class="mega-card-name">${t.name}</span>
                    <span class="mega-card-desc">${t.short}</span>
                  </a>`,
                )}
              </div>
              <div class="mega-col">
                <p class="mega-title">진료 과목</p>
                <ul class="mega-links">
                  ${otherTreatments.map((t) => html`<li><a href="/treatments/${t.slug}">${t.name}</a></li>`)}
                </ul>
              </div>
              <div class="mega-col mega-aside">
                <p class="mega-title">함께 보기</p>
                <ul class="mega-links">
                  <li><a href="/floor-guide">장비·감염관리</a></li>
                  <li><a href="/pricing">비급여 진료비</a></li>
                  <li><a href="/faq">자주 묻는 질문</a></li>
                  <li><a href="/encyclopedia">치과 백과사전</a></li>
                </ul>
                <a href="/reservation" class="btn btn-primary btn-sm mega-cta">진료 예약하기</a>
              </div>
            </div>
          </div>
        </li>
        <li class="has-drop">
          <a href="/column" aria-haspopup="true" aria-expanded="false">도담 이야기</a>
          <ul class="drop">
            <li><a href="/cases/gallery">치료 전후</a></li>
            <li><a href="/column">원장 칼럼</a></li>
            <li><a href="/encyclopedia">치과 백과사전</a></li>
          </ul>
        </li>
        <li class="has-drop">
          <a href="/directions" aria-haspopup="true" aria-expanded="false">내원 안내</a>
          <ul class="drop">
            <li><a href="/first-visit">첫 방문 안내</a></li><li><a href="/directions">오시는 길</a></li>
            <li><a href="/hours">진료시간</a></li>
            <li><a href="/pricing">비급여 수가</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/notice">공지사항</a></li>
          </ul>
        </li>
      </ul>
    </nav>
    <div class="header-actions">
      <a href="tel:${clinic.phoneTel}" class="header-phone" aria-label="전화 ${clinic.phone}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg><span>${clinic.phone}</span></a>
      ${user
        ? html`<a href="/auth/mypage" class="header-user">${user.name}님</a>`
        : html`<a href="/auth/login" class="header-login">로그인</a>`}
      ${naverBookingLink(clinic, 'btn btn-primary btn-sm header-cta') || html`<a href="/reservation" class="btn btn-primary btn-sm header-cta">진료 예약 <span aria-hidden="true">↗</span></a>`}
      <button class="menu-toggle" id="menu-toggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span></span></button>
    </div>
  </div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="모바일 메뉴" hidden>
    <ul>
      <li><a href="/mission">도담의 철학</a></li>
      <li><a href="/doctors">의료진 소개</a></li>
      <li><details><summary>진료안내</summary><ul>
        ${[...coreTreatments, ...otherTreatments].map((t) => html`<li><a href="/treatments/${t.slug}">${t.name}</a></li>`)}
        <li><a href="/floor-guide">장비·감염관리</a></li>
      </ul></details></li>
      <li><details><summary>도담 이야기</summary><ul>
        <li><a href="/cases/gallery">치료 전후</a></li><li><a href="/column">원장 칼럼</a></li><li><a href="/encyclopedia">치과 백과사전</a></li>
      </ul></details></li>
      <li><details><summary>내원 안내</summary><ul>
        <li><a href="/first-visit">첫 방문 안내</a></li><li><a href="/directions">오시는 길</a></li><li><a href="/hours">진료시간</a></li><li><a href="/pricing">비급여 수가</a></li><li><a href="/faq">FAQ</a></li><li><a href="/notice">공지사항</a></li>
      </ul></details></li>
      <li class="mobile-nav-actions">
        ${user ? html`<a href="/auth/mypage">마이페이지</a>` : html`<a href="/auth/login">로그인</a><a href="/auth/register">회원가입</a>`}
      </li>
    </ul>
    <p class="mobile-nav-hours">${hoursToday}</p>
  </nav>
</header>
<noscript><nav class="nojs-navigation" aria-label="기본 페이지 메뉴"><a href="/mission">도담의 철학</a><a href="/doctors">의료진</a><a href="/treatments">진료 안내</a><a href="/directions">오시는 길</a><a href="/reservation">예약</a></nav></noscript>

<main id="main">${body}</main>

<footer class="site-footer">
  <div class="footer-cta reveal">
    <div class="container footer-cta-inner">
      <div>
        <p class="eyebrow">${clinic.region} · 화요일 야간진료 20:30</p>
        <h2 class="footer-cta-title">당신의 치아 이야기,<br>도담에서 시작하세요.</h2>
      </div>
      <div class="footer-cta-actions">
        ${naverBookingLink(clinic, 'btn btn-light', '네이버로 예약하기')}
        <a href="/reservation" class="btn btn-ghost-light">홈페이지 예약 신청 <span aria-hidden="true">↗</span></a>
        <a href="tel:${clinic.phoneTel}" class="btn btn-ghost-light">${clinic.phone}</a>
        <a href="${clinic.channels.kakao}" class="btn btn-ghost-light" target="_blank" rel="noopener">카카오톡 상담</a>
      </div>
    </div>
  </div>
  <div class="container footer-grid">
    <div class="footer-brand">
      <img src="/static/img/logo-wide.png" alt="${clinic.name}" width="160" height="40" loading="lazy">
      <p class="footer-mission">${clinic.mission}</p>
      <ul class="footer-sns" aria-label="소셜 채널">
        <li><a href="${clinic.channels.naverPlace}" target="_blank" rel="noopener" aria-label="네이버 플레이스">N 플레이스</a></li>
        <li><a href="${clinic.channels.naverBlog}" target="_blank" rel="noopener" aria-label="네이버 블로그">블로그</a></li>
        <li><a href="${clinic.channels.instagram}" target="_blank" rel="noopener" aria-label="인스타그램">인스타그램</a></li>
        <li><a href="${clinic.channels.kakao}" target="_blank" rel="noopener" aria-label="카카오톡 채널">카카오톡</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h3>진료</h3>
      <ul>${[...coreTreatments, ...otherTreatments].slice(0, 8).map((t) => html`<li><a href="/treatments/${t.slug}">${t.name}</a></li>`)}</ul>
    </div>
    <div class="footer-col">
      <h3>병원</h3>
      <ul>
        <li><a href="/mission">도담의 철학</a></li>
        <li><a href="/doctors">의료진 소개</a></li>
        <li><a href="/floor-guide">장비·감염관리</a></li>
        <li><a href="/cases/gallery">치료 전후</a></li>
        <li><a href="/column">원장 칼럼</a></li>
        <li><a href="/encyclopedia">치과 백과사전</a></li>
        <li><a href="/notice">공지사항</a></li>
      </ul>
    </div>
    <div class="footer-col footer-info">
      <h3>진료시간</h3>
      <ul class="footer-hours">
        ${clinic.hours.map((h: any) => html`<li><span>${h.day}</span><span>${h.open ? `${h.open} – ${h.close}` : '휴진'}${h.note ? html` <em>${h.note}</em>` : ''}</span></li>`)}
      </ul>
      <p class="footer-hours-note">${clinic.hoursNote}</p>
      <a href="tel:${clinic.phoneTel}" class="footer-phone">${clinic.phone}</a>
    </div>
  </div>
  <div class="container footer-legal">
    <p>${clinic.business.name} · 대표자 ${clinic.business.owner} · 사업자등록번호 ${clinic.business.regNo} · ${clinic.address}</p>
    <p>전화 ${clinic.phone} · 이메일 ${clinic.email}</p>
    <p class="footer-notice">본 홈페이지의 치료 정보는 일반적인 의학 정보이며 개인의 구강 상태에 따라 치료 방법·기간·결과가 다를 수 있습니다. 정확한 진단은 내원 후 상담을 통해 안내드립니다. 부작용 및 주의사항은 각 진료 페이지에 명시되어 있습니다.</p>
    <nav class="footer-links" aria-label="정책">
      <a href="/privacy">개인정보처리방침</a><a href="/terms">이용약관</a><a href="/sitemap">사이트맵</a><a href="/admin">관리자</a>
    </nav>
    <p class="footer-copy">© ${new Date().getFullYear()} ${clinic.name}. All rights reserved.</p>
  </div>
  <p class="footer-wordmark" aria-hidden="true">DODAM.</p>
</footer>

<nav class="mobile-action-bar" aria-label="빠른 상담 및 예약">
  <a href="tel:${clinic.phoneTel}">전화 문의</a>
  <a href="${clinic.channels.kakao}" target="_blank" rel="noopener">카카오 상담</a>
  ${naverBookingLink(clinic, '', '네이버 예약') || html`<a href="/reservation">진료 예약 <span aria-hidden="true">↗</span></a>`}
</nav>

<div class="floating-cta" id="floating-cta">
  <a href="tel:${clinic.phoneTel}" class="fab fab-call" aria-label="전화하기"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></a>
  <a href="${clinic.channels.kakao}" class="fab fab-kakao" target="_blank" rel="noopener" aria-label="카카오톡 상담"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.2 4.6 6.6L5.5 21l4.3-2.8c.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg></a>
  ${naverBookingLink(clinic, 'fab fab-book', '네이버 예약', false) || html`<a href="/reservation" class="fab fab-book">예약</a>`}
  <a href="#top" class="fab fab-top" aria-label="맨 위로" id="to-top"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></a>
</div>

<script src="/static/app.js?v=14" defer></script>
<script type="module" src="/static/experience/main.js?v=12"></script>
</body>
</html>`
}
