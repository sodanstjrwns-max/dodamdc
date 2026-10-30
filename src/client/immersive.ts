// 메인 스크롤 몰입 연출 (도담 — '보호 고리' 궤도 테마, 절제된 power3/expo 감속)
// - 글자는 모두 HTML에 그대로, 움직임만 더한다(크롤러·AEO 영향 없음)
// - 기존 키네틱(히어로 제목·철학 잉크·원장 사진·공간 가로 갤러리·푸터 워드마크·.reveal/.stagger)은 건드리지 않는다
// - experience.ts 의 gsap.context 안에서 호출되므로 모션 끄기 버튼·동작 줄이기에서 모두 원상 복귀된다
// - 브라우저 스크롤은 가로채지 않는다(도담 기존 원칙: 관성 스크롤 없음)
import type { gsap as GSAP } from 'gsap'
import type { ScrollTrigger as ST } from 'gsap/ScrollTrigger'

export function setupImmersive(gsap: typeof GSAP, ScrollTrigger: typeof ST, desktop: boolean) {
  if (!document.body.classList.contains('kinetic-home')) return
  const root = document.documentElement
  root.classList.add('mx')
  const $ = <T extends Element = HTMLElement>(sel: string, ctx: Document | Element = document) => ctx.querySelector<T>(sel)
  const $$ = <T extends Element = HTMLElement>(sel: string, ctx: Document | Element = document) => Array.from(ctx.querySelectorAll<T>(sel))
  const ease = 'power3.out'

  // 화면에 들어오면 한 번 재생 — 빠르게 지나치거나 탭이 숨겨져도 끝 상태를 보장한다
  const TIMING = ['duration', 'ease', 'stagger', 'delay']
  function enter(targets: Element[] | Element, vars: Record<string, unknown>, trigger: Element, start = 'top 88%') {
    const list = Array.isArray(targets) ? targets : [targets]
    if (!list.length) return
    const from: Record<string, unknown> = {}
    const to: Record<string, unknown> = {
      opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, clipPath: vars.clipPath ? 'circle(75% at 50% 50%)' : undefined, paused: true,
      onStart: () => { gsap.set(list, { transition: 'none' }) },
      onComplete: () => { gsap.set(list, { clearProps: 'opacity,transform,transition,clipPath' }) },
    }
    if (!vars.clipPath) delete to.clipPath
    Object.keys(vars).forEach(k => { (TIMING.includes(k) ? to : from)[k] = vars[k] })
    const tw = gsap.fromTo(list, from, to)
    ScrollTrigger.create({
      trigger, start, once: true,
      onEnter: () => {
        tw.play()
        setTimeout(() => { if (tw.progress() < 1) tw.progress(1) }, (tw.totalDuration() + 0.6) * 1000)
      },
    })
  }

  // ── 상황 레일: 다섯 가지 고민이 왼쪽부터 한 칸씩 자리를 잡고, 화살표가 궤도를 따라 돈다
  const situations = $$('.situation-rail .situation-card')
  if (situations.length) {
    enter(situations, { y: 34, opacity: 0, duration: 0.9, ease, stagger: 0.07 }, situations[0], 'top 92%')
    enter($$('.situation-rail-arrow'), { rotate: -90, opacity: 0, duration: 0.9, ease, stagger: 0.07, delay: 0.25 }, situations[0], 'top 92%')
  }

  // ── 화서역 진료 카드: 사진이 가운데에서 '보호 고리'처럼 둥글게 열리며 카드가 차례로 올라온다
  const areaGrid = $('#hwaseo-care .area-card-grid')
  if (areaGrid) {
    const cards = $$('.area-card', areaGrid)
    enter(cards, { y: desktop ? 60 : 32, opacity: 0, duration: 1.05, ease, stagger: desktop ? 0.09 : 0.06 }, areaGrid, 'top 86%')
    enter($$('.area-card-img', areaGrid), { clipPath: 'circle(16% at 50% 50%)', duration: 1.3, ease: 'expo.out', stagger: desktop ? 0.09 : 0.06 }, areaGrid, 'top 86%')
  }

  // ── 브랜드 띠: 스크롤 속도만큼 살짝 기울었다가 제자리로
  const ticker = $('.brand-ticker')
  if (ticker) {
    const skewTo = gsap.quickTo(ticker, 'skewY', { duration: 0.6, ease: 'power3' })
    ScrollTrigger.create({
      trigger: ticker, start: 'top bottom', end: 'bottom top',
      onUpdate: self => skewTo(gsap.utils.clamp(-2.2, 2.2, self.getVelocity() / -900)),
      onLeave: () => skewTo(0), onLeaveBack: () => skewTo(0),
    })
  }

  // ── 핵심 진료: 탭이 차례로 서고, 지금 보이는 패널의 칩이 하나씩 놓인다(튀지 않게)
  const tabs = $$('.care-tabs .care-tab')
  if (tabs.length) enter(tabs, { y: 22, opacity: 0, duration: 0.8, ease, stagger: 0.08 }, tabs[0], 'top 92%')
  const panel = $('.care-panel:not([hidden])')
  if (panel) {
    const chips = $$('.care-chips li', panel)
    if (chips.length) enter(chips, { y: 12, scale: 0.94, opacity: 0, duration: 0.7, ease, stagger: 0.06 }, chips[0], 'top 94%')
    const num = $('.care-photo-number', panel)
    if (num) gsap.fromTo(num, { yPercent: 40 }, { yPercent: -20, ease: 'none', scrollTrigger: { trigger: panel, start: 'top bottom', end: 'bottom top', scrub: 1 } })
  }
  // 그 밖의 진료 목록: 한 줄씩 왼쪽에서
  const dir = $$('.treatment-directory > div > a')
  if (dir.length) enter(dir, { x: -22, opacity: 0, duration: 0.7, ease, stagger: 0.035 }, dir[0], 'top 94%')

  // ── 빠른 내원 안내: 세 칸이 차례로, 번호가 먼저 자리를 잡는다
  const quick = $$('.quick-visit-grid > a')
  if (quick.length) {
    enter(quick, { y: 24, opacity: 0, duration: 0.85, ease, stagger: 0.1 }, quick[0], 'top 94%')
    enter($$('.quick-number'), { scale: 0.6, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1, delay: 0.15 }, quick[0], 'top 94%')
  }

  // ── 진료시간: 표가 요일 순서대로 한 줄씩 켜진다(기존 .reveal 은 이쪽이 넘겨받음)
  const hours = $('.visit-hours')
  if (hours) {
    hours.classList.remove('reveal')
    const rows = $$('.hours-table tr', hours)
    enter($$(':scope > h3', hours), { y: 18, opacity: 0, duration: 0.8, ease }, hours, 'top 97%')
    if (rows.length) enter(rows, { x: 26, opacity: 0, duration: 0.7, ease, stagger: 0.055, delay: 0.1 }, rows[0], 'top 97%')
  }

  // ── 마지막 상담 안내: 푸터의 큰 파란 면이 화면 쪽으로 다가온다
  const cta = $('.footer-cta')
  if (cta) {
    gsap.fromTo(cta, { scale: desktop ? 0.9 : 0.96, transformOrigin: '50% 100%' }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'top 45%', scrub: 0.8 },
    })
  }

  // ── 기존 .reveal/.stagger 등장(app.js IntersectionObserver)은 같은 모양 그대로 이쪽이 넘겨받는다
  //    — 빠른 휠·앵커 이동으로 건너뛴 블록이 투명하게 남던 문제를 막는다(ScrollTrigger 는 지나친 구간도 onEnter 를 부른다)
  //    이미 보인(.in) 블록은 다시 숨기지 않는다
  const REVEAL = ['reveal', 'reveal-left', 'reveal-right', 'reveal-scale']
  $$('main .reveal, main .reveal-left, main .reveal-right, main .reveal-scale').forEach(el => {
    const shown = el.classList.contains('in')
    const scaleIn = el.classList.contains('reveal-scale')
    el.classList.remove(...REVEAL)
    if (!shown) enter(el, scaleIn ? { scale: 0.97, opacity: 0, duration: 0.85, ease } : { y: 24, opacity: 0, duration: 0.85, ease }, el, 'top 90%')
  })
  $$('main .stagger').forEach(group => {
    const shown = group.classList.contains('in')
    group.classList.remove('stagger')
    if (!shown) enter(Array.from(group.children), { y: 18, opacity: 0, duration: 0.65, ease, stagger: 0.08 }, group, 'top 90%')
  })

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
}
