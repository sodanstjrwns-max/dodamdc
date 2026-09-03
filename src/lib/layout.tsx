import type { Context } from 'hono'
import { html, raw } from 'hono/html'
import type { Env } from './types'
import type { Meta } from './seo'
import { DEFAULT_OG, breadcrumbLd } from './seo'
import { coreTreatments, otherTreatments } from '../data/treatments'
import { doctors } from '../data/doctors'

const NAV = (c: Context<Env>) => {
  const clinic = c.var.clinic
  return [
    { label: '병원미션', href: '/mission' },
    { label: '의료진', href: '/doctors' },
    { label: '진료안내', href: '/treatments', mega: true },
    {
      label: '콘텐츠',
      href: '/column',
      children: [
        { label: '비포&애프터', href: '/cases/gallery', desc: '치료 전후 기록' },
        { label: '원장 칼럼', href: '/column', desc: '한휘림 원장이 직접 쓰는 글' },
        { label: '치과 백과사전', href: '/encyclopedia', desc: '500+ 치과 용어 사전' },
      ],
    },
    {
      label: '안내',
      href: '/directions',
      children: [
        { label: '오시는 길', href: '/directions', desc: clinic.addressShort },
        { label: '진료시간', href: '/hours', desc: '화요일 야간진료' },
        { label: '비급여 진료비', href: '/pricing', desc: '비급여 항목 고지' },
        { label: '자주 묻는 질문', href: '/faq', desc: '진료별 FAQ 모음' },
        { label: '공지사항', href: '/notice', desc: '휴진·안내' },
        { label: '병원 둘러보기', href: '/floor-guide', desc: '공간·장비·감염관리' },
      ],
    },
  ]
}

export const Icon = (p: { name: string; class?: string }) => {
  const paths: Record<string, string> = {
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
    pin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
    arrow: 'M5 12h14 M12 5l7 7-7 7',
    chevron: 'M6 9l6 6 6-6',
    check: 'M20 6L9 17l-5-5',
    menu: 'M3 6h18 M3 12h18 M3 18h18',
    close: 'M18 6L6 18 M6 6l12 12',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    calendar: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
    lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    quote: 'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
    external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
    image: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21',
    plus: 'M12 5v14 M5 12h14',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01',
    tooth: 'M12 2C9 2 7.5 3.5 6 3.5S3 5 3 8c0 3 1.5 5 2 8s1 6 2.5 6 2-3 4.5-3 3 3 4.5 3 2-3 2.5-6 2-5 2-8c0-3-1.5-4.5-3-4.5S15 2 12 2z',
  }
  return (
    <svg class={p.class || 'ico'} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={paths[p.name] || ''} />
    </svg>
  )
}

export function Header(c: Context<Env>) {
  const clinic = c.var.clinic
  const user = c.var.user
  const nav = NAV(c)
  const path = new URL(c.req.url).pathname
  return (
    <header id="site-header" class="site-header">
      <div class="topbar">
        <div class="container topbar-inner">
          <span class="topbar-item">
            <Icon name="clock" class="ico-sm" /> 화요일 야간진료 20:30까지 · 수요일 점심시간 없이 진료
          </span>
          <span class="topbar-right">
            <a href={`tel:${clinic.phone}`} class="topbar-item"><Icon name="phone" class="ico-sm" />{clinic.phone}</a>
            {user ? (
              <>
                <a href="/auth/mypage" class="topbar-item"><Icon name="user" class="ico-sm" />{user.name}님</a>
                <a href="/auth/logout" class="topbar-item">로그아웃</a>
              </>
            ) : (
              <>
                <a href="/auth/login" class="topbar-item">로그인</a>
                <a href="/auth/register" class="topbar-item">회원가입</a>
              </>
            )}
          </span>
        </div>
      </div>
      <nav class="gnb" aria-label="주 메뉴">
        <div class="container gnb-inner">
          <a href="/" class="brand" aria-label={`${clinic.name} 홈`}>
            <img src="/static/img/logo-wide.png" alt={clinic.name} width="180" height="44" />
          </a>
          <ul class="gnb-list" id="gnb-list">
            {nav.map((n) => (
              <li class={`gnb-item ${n.mega ? 'has-mega' : n.children ? 'has-drop' : ''} ${path.startsWith(n.href) ? 'is-active' : ''}`}>
                <a href={n.href} class="gnb-link" aria-haspopup={n.mega || n.children ? 'true' : undefined}>
                  {n.label}
                  {(n.mega || n.children) && <Icon name="chevron" class="ico-xs" />}
                </a>
                {n.mega && (
                  <div class="mega" role="menu">
                    <div class="container mega-inner">
                      <div class="mega-col mega-core">
                        <p class="mega-eyebrow">도담치과가 가장 자신 있는 진료</p>
                        {coreTreatments.map((t, i) => (
                          <a href={`/treatments/${t.slug}`} class="mega-core-link">
                            <span class="mega-num">0{i + 1}</span>
                            <span>
                              <strong>{t.name}</strong>
                              <small>{t.short}</small>
                            </span>
                            <Icon name="arrow" class="ico-sm" />
                          </a>
                        ))}
                      </div>
                      <div class="mega-col">
                        <p class="mega-eyebrow">일반 진료</p>
                        <ul class="mega-grid">
                          {otherTreatments.map((t) => (
                            <li><a href={`/treatments/${t.slug}`}>{t.name}</a></li>
                          ))}
                        </ul>
                        <a href="/treatments" class="mega-all">진료 전체 보기 <Icon name="arrow" class="ico-xs" /></a>
                      </div>
                      <div class="mega-col mega-side">
                        <a href="/doctors/han-hwirim" class="mega-doctor">
                          <img src="/static/img/dr-han-hwirim-portrait-sm.webp" alt="한휘림 대표원장" width="72" height="72" loading="lazy" />
                          <span>
                            <small>대표원장 · 통합치의학과 전문의</small>
                            <strong>한휘림 원장 소개</strong>
                          </span>
                        </a>
                        <a href="/floor-guide" class="mega-side-link"><Icon name="shield" class="ico-sm" /> 장비·감염관리 시스템</a>
                        <a href="/pricing" class="mega-side-link"><Icon name="info" class="ico-sm" /> 비급여 진료비 안내</a>
                      </div>
                    </div>
                  </div>
                )}
                {n.children && (
                  <div class="drop" role="menu">
                    {n.children.map((ch) => (
                      <a href={ch.href} class="drop-link">
                        <strong>{ch.label}</strong>
                        <small>{ch.desc}</small>
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div class="gnb-actions">
            <a href="/reservation" class="btn btn-primary btn-sm"><Icon name="calendar" class="ico-sm" /> 진료 예약</a>
            <button class="gnb-burger" id="gnb-burger" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobile-menu">
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </nav>
      <div class="mobile-menu" id="mobile-menu" hidden>
        <div class="mobile-menu-head">
          <img src="/static/img/logo-wide.png" alt={clinic.name} width="150" height="37" />
          <button class="gnb-burger" id="gnb-close" aria-label="메뉴 닫기"><Icon name="close" /></button>
        </div>
        <ul class="mobile-list">
          {nav.map((n) => (
            <li>
              <a href={n.href} class="mobile-link">{n.label}</a>
              {n.mega && (
                <ul class="mobile-sub">
                  {[...coreTreatments, ...otherTreatments].map((t) => (
                    <li><a href={`/treatments/${t.slug}`}>{t.name}</a></li>
                  ))}
                </ul>
              )}
              {n.children && (
                <ul class="mobile-sub">
                  {n.children.map((ch) => (
                    <li><a href={ch.href}>{ch.label}</a></li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <div class="mobile-foot">
          <a href="/reservation" class="btn btn-primary btn-block">진료 예약</a>
          <a href={`tel:${clinic.phone}`} class="btn btn-outline btn-block"><Icon name="phone" class="ico-sm" /> {clinic.phone}</a>
          {user ? <a href="/auth/mypage" class="mobile-auth">{user.name}님 · 마이페이지</a> : <a href="/auth/login" class="mobile-auth">로그인 / 회원가입</a>}
        </div>
      </div>
    </header>
  )
}

export function Footer(c: Context<Env>) {
  const clinic = c.var.clinic
  return (
    <footer id="site-footer" class="site-footer">
      <div class="container footer-cta">
        <div>
          <p class="footer-cta-eyebrow">진료 상담·예약</p>
          <h2 class="footer-cta-title">이해될 때까지 설명하겠습니다.</h2>
        </div>
        <div class="footer-cta-actions">
          <a href="/reservation" class="btn btn-light">온라인 예약</a>
          <a href={clinic.channels.kakao} target="_blank" rel="noopener" class="btn btn-kakao">카카오톡 상담</a>
          <a href={`tel:${clinic.phone}`} class="btn btn-outline-light"><Icon name="phone" class="ico-sm" /> {clinic.phone}</a>
        </div>
      </div>
      <div class="container footer-main">
        <div class="footer-brand">
          <img src="/static/img/logo-wide.png" alt={clinic.name} width="170" height="42" loading="lazy" class="footer-logo" />
          <p class="footer-mission">{clinic.mission}</p>
          <ul class="footer-sns">
            <li><a href={clinic.channels.naverPlace} target="_blank" rel="noopener">네이버 플레이스</a></li>
            <li><a href={clinic.channels.naverBlog} target="_blank" rel="noopener">블로그</a></li>
            <li><a href={clinic.channels.instagram} target="_blank" rel="noopener">인스타그램</a></li>
            <li><a href={clinic.channels.kakao} target="_blank" rel="noopener">카카오톡</a></li>
          </ul>
        </div>
        <div class="footer-cols">
          <div>
            <h3>진료</h3>
            <ul>
              {coreTreatments.map((t) => <li><a href={`/treatments/${t.slug}`}>{t.name}</a></li>)}
              <li><a href="/treatments">전체 진료 보기</a></li>
            </ul>
          </div>
          <div>
            <h3>병원</h3>
            <ul>
              <li><a href="/mission">병원 미션</a></li>
              <li><a href="/doctors">의료진</a></li>
              <li><a href="/floor-guide">병원 둘러보기</a></li>
              <li><a href="/directions">오시는 길</a></li>
              <li><a href="/hours">진료시간</a></li>
            </ul>
          </div>
          <div>
            <h3>콘텐츠</h3>
            <ul>
              <li><a href="/cases/gallery">비포&애프터</a></li>
              <li><a href="/column">원장 칼럼</a></li>
              <li><a href="/encyclopedia">치과 백과사전</a></li>
              <li><a href="/faq">자주 묻는 질문</a></li>
              <li><a href="/notice">공지사항</a></li>
            </ul>
          </div>
          <div>
            <h3>진료시간</h3>
            <ul class="footer-hours">
              {clinic.hours.map((h) => (
                <li>
                  <span>{h.day}</span>
                  <span>{h.open ? `${h.open}–${h.close}` : '휴진'}{h.note ? ` · ${h.note}` : ''}</span>
                </li>
              ))}
              <li class="footer-hours-note">{clinic.hoursNote}</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="container footer-legal">
        <p>
          <strong>{clinic.business.name}</strong> · 대표자 {clinic.business.owner} · 사업자등록번호 {clinic.business.regNo} · {clinic.address} · 전화 {clinic.phone} · 이메일 {clinic.email}
        </p>
        <p class="footer-links">
          <a href="/privacy">개인정보처리방침</a>
          <a href="/terms">이용약관</a>
          <a href="/sitemap">사이트맵</a>
          <a href="/pricing">비급여 진료비</a>
          <a href="/admin">관리자</a>
        </p>
        <p class="footer-notice">
          본 홈페이지의 진료 정보는 일반적인 의학 정보 제공을 목적으로 하며, 개인의 상태에 따라 치료 방법과 결과는 달라질 수 있습니다. 정확한 진단은 내원 후 상담을 통해 이루어집니다. 게재된 치료 사례는 환자 동의를 받아 게시되며, 부작용 및 주의사항은 각 진료 안내 페이지에 함께 명시합니다. (의료법 제56조 준수)
        </p>
        <p class="footer-copy">© {new Date().getFullYear()} {clinic.name}. All rights reserved.</p>
      </div>
    </footer>
  )
}

export function Layout(c: Context<Env>, meta: Meta, body: any, opts: { bodyClass?: string; noChrome?: boolean } = {}) {
  const clinic = c.var.clinic as any
  const siteUrl = c.var.siteUrl
  const url = `${siteUrl}${meta.path}`
  const og = meta.ogImage ? (meta.ogImage.startsWith('http') ? meta.ogImage : `${siteUrl}${meta.ogImage}`) : `${siteUrl}${DEFAULT_OG}`
  const title = meta.title.includes(clinic.shortName) ? meta.title : `${meta.title} | ${clinic.shortName}`
  const ld = [...(meta.jsonld || [])]
  if (meta.breadcrumbs?.length) ld.push(breadcrumbLd([{ name: '홈', path: '/' }, ...meta.breadcrumbs], siteUrl))
  return html`<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${meta.description}">
<link rel="canonical" href="${url}">
${meta.noindex ? raw('<meta name="robots" content="noindex, nofollow">') : raw('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">')}
<meta property="og:type" content="${meta.type || 'website'}">
<meta property="og:site_name" content="${clinic.name}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${og}">
<meta name="theme-color" content="#006AB5">
<meta name="geo.region" content="KR-41">
<meta name="geo.placename" content="수원시 팔달구 화서동">
<meta name="geo.position" content="${clinic.geo.lat};${clinic.geo.lng}">
${clinic.gsc ? raw(`<meta name="google-site-verification" content="${clinic.gsc}">`) : ''}
${clinic.naverVerify ? raw(`<meta name="naver-site-verification" content="${clinic.naverVerify}">`) : ''}
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/static/style.css">
${ld.map((o) => raw(`<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`))}
${clinic.ga4 ? raw(`<script async src="https://www.googletagmanager.com/gtag/js?id=${clinic.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${clinic.ga4}');</script>`) : ''}
</head>
<body class="${opts.bodyClass || ''}">
<a href="#main" class="skip-link">본문으로 건너뛰기</a>
${opts.noChrome ? '' : Header(c)}
<main id="main">${body}</main>
${opts.noChrome ? '' : Footer(c)}
${opts.noChrome ? '' : raw(`<div class="quick-bar" id="quick-bar">
  <a href="tel:${clinic.phone}" class="quick-item"><span class="quick-ico">☏</span>전화</a>
  <a href="${clinic.channels.kakao}" target="_blank" rel="noopener" class="quick-item"><span class="quick-ico">💬</span>카톡</a>
  <a href="/reservation" class="quick-item quick-primary"><span class="quick-ico">📅</span>예약</a>
  <a href="/directions" class="quick-item"><span class="quick-ico">📍</span>위치</a>
</div>`)}
<script src="/static/app.js" defer></script>
</body>
</html>`
}
