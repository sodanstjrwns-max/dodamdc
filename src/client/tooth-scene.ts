import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export type ToothScene = { setPaused: (value: boolean) => void; dispose: () => void }

/** Original, stylized enamel sculpture. Not a clinical/anatomical model. */
export function createToothScene(host: HTMLElement, initiallyPaused: boolean): ToothScene | null {
  let renderer: THREE.WebGLRenderer
  const small = matchMedia('(max-width: 760px)').matches
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !small, powerPreference: 'low-power' })
  } catch {
    host.dataset.render = 'fallback'
    return null
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.3 : 1.7))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.setClearColor(0x000000, 0)
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
  camera.position.set(0, 0.1, 8.7)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04)
  scene.environment = env.texture
  room.dispose()
  pmrem.dispose()
  scene.add(new THREE.AmbientLight(0xcceeff, 0.9))
  const key = new THREE.DirectionalLight(0xffffff, 3.2)
  key.position.set(-3, 5, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x5fcaff, 2)
  rim.position.set(4, 1, -2)
  scene.add(rim)

  const sculpture = new THREE.Group()
  scene.add(sculpture)
  const shape = new THREE.Shape()
  shape.moveTo(0, 0.9)
  shape.bezierCurveTo(-0.3, 1.02, -0.63, 1.35, -1.0, 1.12)
  shape.bezierCurveTo(-1.38, 0.87, -1.1, 0.2, -0.91, -0.13)
  shape.bezierCurveTo(-0.68, -0.54, -0.8, -1.4, -0.48, -1.55)
  shape.bezierCurveTo(-0.26, -1.63, -0.24, -0.36, 0, -0.38)
  shape.bezierCurveTo(0.24, -0.36, 0.26, -1.63, 0.48, -1.55)
  shape.bezierCurveTo(0.8, -1.4, 0.68, -0.54, 0.91, -0.13)
  shape.bezierCurveTo(1.1, 0.2, 1.38, 0.87, 1, 1.12)
  shape.bezierCurveTo(0.63, 1.35, 0.3, 1.02, 0, 0.9)
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.56, bevelEnabled: true, bevelThickness: 0.36,
    bevelSize: 0.23, bevelSegments: small ? 7 : 10, curveSegments: small ? 20 : 32,
  })
  geometry.center()
  geometry.computeVertexNormals()
  const enamel = new THREE.MeshPhysicalMaterial({
    color: 0xf5fcff, metalness: 0.06, roughness: 0.22,
    clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1.3,
  })
  const tooth = new THREE.Mesh(geometry, enamel)
  tooth.rotation.set(0.02, -0.34, -0.12)
  sculpture.add(tooth)

  const lime = new THREE.MeshPhysicalMaterial({ color: 0xc2f373, roughness: 0.24, metalness: 0.12, clearcoat: 0.8 })
  const blue = new THREE.MeshPhysicalMaterial({ color: 0x0069b3, roughness: 0.2, metalness: 0.28, clearcoat: 1 })
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.085, 12, 110), lime)
  outer.rotation.set(1.05, -0.25, -0.38)
  outer.scale.set(1.08, 1, 1)
  outer.position.y = -0.05
  sculpture.add(outer)
  const inner = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.024, 8, 110), blue)
  inner.rotation.set(0.92, 0.62, 0.65)
  sculpture.add(inner)
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), blue)
  pearl.position.set(-1.65, 1.37, 0.1)
  sculpture.add(pearl)
  const limePearl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), lime)
  limePearl.position.set(1.9, -0.72, 0.5)
  sculpture.add(limePearl)

  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 128
  const context = shadowCanvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 62)
  gradient.addColorStop(0, 'rgba(18, 76, 106, .23)')
  gradient.addColorStop(0.5, 'rgba(18, 76, 106, .08)')
  gradient.addColorStop(1, 'rgba(18, 76, 106, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.85), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }))
  shadow.position.set(0, -2, -0.4)
  scene.add(shadow)

  let paused = initiallyPaused, visible = true, dead = false, raf = 0, previous = 0
  let pointerX = 0, pointerY = 0, turn = 0, dragging = false, startX = 0
  const resize = () => {
    if (dead) return
    const { width, height } = host.getBoundingClientRect()
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(height, 1)
    camera.position.z = camera.aspect < 0.85 ? 10.5 : 8.7
    camera.updateProjectionMatrix()
    renderer.render(scene, camera)
  }
  const sizeObserver = new ResizeObserver(resize)
  sizeObserver.observe(host)
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting
    if (visible) wake()
  }, { rootMargin: '80px' })
  observer.observe(host)
  const pointerMove = (e: PointerEvent) => {
    if (dragging) { turn += (e.clientX - startX) * 0.009; startX = e.clientX }
    else if (e.pointerType === 'mouse') {
      const r = host.getBoundingClientRect()
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 0.6
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 0.3
    }
    wake()
  }
  const pointerDown = (e: PointerEvent) => {
    // Preserve vertical touch scrolling. Drag rotation is enabled for mouse/pen.
    if (e.pointerType === 'touch') return
    dragging = true; startX = e.clientX
    host.setPointerCapture(e.pointerId)
    host.classList.add('is-dragging')
  }
  const pointerUp = () => { dragging = false; host.classList.remove('is-dragging') }
  const pointerLeave = () => { pointerX = pointerY = 0 }
  host.addEventListener('pointermove', pointerMove)
  host.addEventListener('pointerdown', pointerDown)
  host.addEventListener('pointerup', pointerUp)
  host.addEventListener('pointercancel', pointerUp)
  host.addEventListener('pointerleave', pointerLeave)
  const controls = document.querySelector<HTMLElement>('.model-controls')
  if (controls) controls.hidden = false
  const left = document.getElementById('model-rotate-left')
  const right = document.getElementById('model-rotate-right')
  function rotate(amount: number) {
    turn += amount
    if (paused) {
      sculpture.rotation.y = turn
      renderer.render(scene, camera)
    } else wake()
    host.dataset.rotation = turn.toFixed(2)
  }
  const rotateLeft = () => rotate(-Math.PI / 6)
  const rotateRight = () => rotate(Math.PI / 6)
  left?.addEventListener('click', rotateLeft)
  right?.addEventListener('click', rotateRight)
  const visibility = () => { if (!document.hidden) wake() }
  document.addEventListener('visibilitychange', visibility)

  function render(now: number) {
    raf = 0
    if (dead || !visible || document.hidden) return
    if (now - previous < (small ? 32 : 16)) { raf = requestAnimationFrame(render); return }
    previous = now
    if (!paused) {
      const t = now * 0.001
      sculpture.rotation.y += (turn + pointerX + Math.sin(t * 0.35) * 0.11 - sculpture.rotation.y) * 0.05
      sculpture.rotation.x += (pointerY - sculpture.rotation.x) * 0.04
      sculpture.position.y = Math.sin(t * 0.8) * 0.075
      outer.rotation.z = -0.38 + Math.sin(t * 0.45) * 0.14
      inner.rotation.z = 0.65 + Math.sin(t * 0.35) * 0.16
      pearl.position.y = 1.37 + Math.sin(t * 1.1) * 0.12
    }
    renderer.render(scene, camera)
    if (!paused) raf = requestAnimationFrame(render)
  }
  function wake() { if (!raf && !dead && visible && !document.hidden) raf = requestAnimationFrame(render) }
  const lost = (e: Event) => {
    e.preventDefault(); dead = true; cancelAnimationFrame(raf)
    host.dataset.render = 'fallback'; if (controls) controls.hidden = true
  }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  resize()
  host.dataset.render = 'webgl'
  wake()
  return {
    setPaused(value) { paused = value; if (paused) { cancelAnimationFrame(raf); raf = 0; renderer.render(scene, camera) } else wake() },
    dispose() {
      dead = true; cancelAnimationFrame(raf); observer.disconnect(); sizeObserver.disconnect()
      host.removeEventListener('pointermove', pointerMove); host.removeEventListener('pointerdown', pointerDown)
      host.removeEventListener('pointerup', pointerUp); host.removeEventListener('pointercancel', pointerUp); host.removeEventListener('pointerleave', pointerLeave)
      document.removeEventListener('visibilitychange', visibility)
      left?.removeEventListener('click', rotateLeft); right?.removeEventListener('click', rotateRight)
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(m => m.dispose()) }
      })
      env.dispose(); shadowTexture.dispose(); renderer.dispose(); renderer.domElement.remove()
    },
  }
}
