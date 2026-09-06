import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ToothScene } from './tooth-scene'

gsap.registerPlugin(ScrollTrigger)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const desktop = matchMedia('(min-width: 1001px)')
const finePointer = matchMedia('(hover: hover) and (pointer: fine)')
const all = <T extends Element = HTMLElement>(selector: string) => Array.from(document.querySelectorAll<T>(selector))
const body = document.body
const motionButton = document.querySelector<HTMLButtonElement>('#motion-toggle')
let paused = reducedMotion.matches
let scene: ToothScene | null = null
let motionContext: gsap.Context | null = null
let galleryTrigger: ScrollTrigger | undefined
let galleryIndex = 0
let sceneRequested = false
let galleryCleanup: (() => void) | undefined

function setupGallery() {
  galleryCleanup?.()
  galleryCleanup = undefined
  const experience = document.querySelector<HTMLElement>('#space-experience')
  const viewport = document.querySelector<HTMLElement>('#space-viewport')
  const track = document.querySelector<HTMLElement>('.space-track')
  const progress = document.querySelector<HTMLElement>('.space-progress i')
  const current = document.querySelector<HTMLElement>('#space-current')
  const prev = document.querySelector<HTMLButtonElement>('#space-prev')
  const next = document.querySelector<HTMLButtonElement>('#space-next')
  if (!experience || !viewport || !track || !prev || !next) return
  const slides = all<HTMLElement>('.space-slide')
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)
  function update(value: number) {
    galleryIndex = Math.max(0, Math.min(slides.length - 1, Math.round(value * (slides.length - 1))))
    if (current) current.textContent = String(galleryIndex + 1).padStart(2, '0')
    if (progress) progress.style.transform = `scaleX(${Math.max(1 / slides.length, (galleryIndex + 1) / slides.length)})`
    prev!.disabled = galleryIndex === 0
    next!.disabled = galleryIndex === slides.length - 1
  }
  if (!paused && desktop.matches) {
    experience.classList.add('is-scroll-gallery')
    const tween = gsap.to(track, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: experience, start: 'top 115px', end: () => `+=${distance() * 1.05}`,
        pin: true, scrub: 0.65, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: self => update(self.progress),
      },
    })
    galleryTrigger = tween.scrollTrigger
  } else {
    experience.classList.remove('is-scroll-gallery')
    gsap.set(track, { clearProps: 'transform' })
    galleryTrigger = undefined
  }
  function move(step: number) {
    const index = Math.max(0, Math.min(slides.length - 1, galleryIndex + step))
    if (galleryTrigger) {
      window.scrollTo({ top: galleryTrigger.start + (galleryTrigger.end - galleryTrigger.start) * index / (slides.length - 1), behavior: paused ? 'instant' : 'smooth' })
    } else {
      viewport!.scrollTo({ left: distance() * index / (slides.length - 1), behavior: paused ? 'instant' : 'smooth' })
    }
  }
  const previous = () => move(-1)
  const following = () => move(1)
  const scrolling = () => { if (!galleryTrigger) update(viewport.scrollLeft / Math.max(distance(), 1)) }
  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
  }
  prev.addEventListener('click', previous)
  next.addEventListener('click', following)
  viewport.addEventListener('scroll', scrolling, { passive: true })
  viewport.addEventListener('keydown', keydown)
  update(0)
  galleryCleanup = () => {
    prev.removeEventListener('click', previous); next.removeEventListener('click', following)
    viewport.removeEventListener('scroll', scrolling); viewport.removeEventListener('keydown', keydown)
    galleryTrigger = undefined
  }
}

function setupMotion() {
  galleryCleanup?.()
  galleryCleanup = undefined
  motionContext?.revert()
  motionContext = null
  body.classList.toggle('motion-paused', paused)
  body.classList.toggle('motion-enabled', !paused)
  if (motionButton) {
    motionButton.hidden = false
    motionButton.setAttribute('aria-pressed', String(paused))
    motionButton.setAttribute('aria-label', paused ? '애니메이션 재생' : '애니메이션 일시정지')
    motionButton.querySelector('.motion-toggle-label')!.textContent = paused ? '모션 꺼짐' : '모션 켜짐'
    motionButton.querySelector('.motion-icon')!.textContent = paused ? '▷' : 'Ⅱ'
  }
  scene?.setPaused(paused)
  motionContext = gsap.context(() => {
    setupGallery()
    if (paused) return
    if (document.querySelector('.kinetic-hero')) {
    gsap.from('.headline-line > span', { yPercent: 115, rotate: 3, duration: 1.15, stagger: 0.12, ease: 'expo.out', clearProps: 'transform' })
    gsap.from('.kinetic-hero-top, .kinetic-eyebrow, .hero-copy-bottom', { opacity: 0, y: 15, duration: 0.8, delay: 0.25, stagger: 0.1, clearProps: 'opacity,transform' })
    gsap.from('.tooth-experience', { opacity: 0, scale: 0.8, duration: 1.5, ease: 'expo.out', clearProps: 'opacity,transform' })
    }
    if (desktop.matches && document.querySelector('.kinetic-hero')) {
      gsap.to('.tooth-experience', { y: 100, rotation: 9, ease: 'none', scrollTrigger: { trigger: '#hero-section', start: 'top top', end: 'bottom top', scrub: 1 } })
      const manifesto = document.querySelector('#dodam-philosophy')
      if (manifesto) {
        const lines = all<HTMLElement>('[data-ink]')
        const timeline = gsap.timeline({ scrollTrigger: { trigger: manifesto, start: 'top 30%', end: 'bottom 95%', scrub: 0.6 } })
        lines.forEach((line, i) => timeline.fromTo(line, { '--ink-fill': '0%' }, { '--ink-fill': '100%', duration: 1 }, i * 0.7))
        gsap.to('.mindset-ring', { rotation: 150, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: { trigger: manifesto, start: 'top bottom', end: 'bottom top', scrub: 1.4 } })
      }
    }
    all<HTMLElement>('.display-heading, .doctor-editorial-copy h2, .page-hero .h1, .mission-poster h1').forEach(heading => {
      gsap.from(heading, { clipPath: 'inset(0 0 100% 0)', y: 22, duration: 0.95, ease: 'expo.out', clearProps: 'clipPath,transform', scrollTrigger: { trigger: heading, start: 'top 92%', once: true } })
    })
    const photo = document.querySelector('.doctor-editorial-photo img')
    if (photo) gsap.fromTo(photo, { scale: 1.12, yPercent: 4 }, { scale: 1, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '#doctor-story', start: 'top bottom', end: 'bottom top', scrub: 1 } })
    const footer = document.querySelector('.footer-wordmark')
    if (footer) gsap.fromTo(footer, { yPercent: 35, letterSpacing: '0.035em' }, { yPercent: 0, letterSpacing: '-0.07em', ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } })
  })
  ScrollTrigger.refresh()
}

async function loadSculpture() {
  if (sceneRequested) return
  const host = document.querySelector<HTMLElement>('#tooth-render')
  if (!host) return
  sceneRequested = true
  try {
    const module = await import('./tooth-scene')
    scene = module.createToothScene(host, paused)
  } catch {
    host.dataset.render = 'fallback'
  }
}

// Native scrolling is retained: no wheel interception or forced scroll smoothing.
setupMotion()
if (document.querySelector('#tooth-render')) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => { void loadSculpture() }, { timeout: 900 })
  else setTimeout(() => { void loadSculpture() }, 100)
}
motionButton?.addEventListener('click', () => { paused = !paused; setupMotion() })
reducedMotion.addEventListener('change', event => { paused = event.matches; setupMotion() })
desktop.addEventListener('change', () => setupMotion())

// Pointer magnetism is deliberately restricted to buttons and fine pointers.
all<HTMLElement>('[data-magnetic], .header-cta').forEach(button => {
  button.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches) return
    const rect = button.getBoundingClientRect()
    gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * 0.12, y: (event.clientY - rect.top - rect.height / 2) * 0.2, duration: 0.3, overwrite: true })
  })
  button.addEventListener('pointerleave', () => gsap.to(button, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .5)', overwrite: true }))
})

// The existing accessible tabs own state; animate only the newly displayed panel.
all<HTMLButtonElement>('.care-tab').forEach(button => {
  const animatePanel = () => {
    if (paused) return
    const panel = document.querySelector<HTMLElement>('.care-panel:not([hidden])')
    if (panel) gsap.fromTo(panel.querySelectorAll('.care-panel-copy > *, .care-panel-photo'), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.045, ease: 'power3.out', overwrite: true, clearProps: 'opacity,transform' })
  }
  button.addEventListener('click', () => requestAnimationFrame(animatePanel))
  button.addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) requestAnimationFrame(animatePanel) })
})

void document.fonts.ready.then(() => ScrollTrigger.refresh())
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
window.addEventListener('pagehide', event => {
  if (event.persisted) { scene?.setPaused(true); return }
  galleryCleanup?.(); motionContext?.revert(); scene?.dispose()
})
window.addEventListener('pageshow', event => { if (event.persisted) { scene?.setPaused(paused); ScrollTrigger.refresh() } })
body.dataset.experience = 'ready'
