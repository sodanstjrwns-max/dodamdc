// One-off asset pipeline: source photos -> optimized WebP with descriptive names
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SRC = '/home/user/dodam_src'
const OUT = '/home/user/webapp/public/static/img'
mkdirSync(OUT, { recursive: true })

// [source, output-name, maxWidth, quality]
const jobs = [
  // 인테리어 (전문 촬영)
  ['photos/interior/in01.png', 'suwon-dodam-dental-treatment-room.webp', 1800, 82],
  ['photos/interior/in02.png', 'suwon-dodam-dental-waiting-lounge.webp', 1800, 82],
  ['photos/interior/in03.png', 'suwon-dodam-dental-reception-desk.webp', 1800, 82],
  ['photos/interior/in04.png', 'suwon-dodam-dental-information-desk.webp', 1800, 82],
  // 현장 사진
  ['photos/m22.jpg', 'suwon-dodam-dental-waiting-area.webp', 1600, 78],
  ['photos/m30.jpg', 'suwon-dodam-dental-entrance-sign.webp', 1600, 78],
  ['photos/m27.jpg', 'suwon-dodam-dental-chair-unit.webp', 1600, 78],
  ['photos/m34.jpg', 'suwon-dodam-dental-consult-room.webp', 1600, 78],
  ['photos/m03.jpg', 'suwon-dodam-dental-corridor-sign.webp', 1600, 78],
  ['photos/m05.jpg', 'suwon-dodam-dental-building-exterior.webp', 1600, 78],
  ['photos/m14.jpg', 'suwon-dodam-dental-operatory.webp', 1600, 78],
  ['photos/m11.jpg', 'suwon-dodam-dental-doctor-profile-board.webp', 1600, 78],
  // 장비
  ['photos/equip/e04.jpg', 'quicksleeper-intraosseous-anesthesia.webp', 1400, 78],
  ['photos/equip/e21.jpg', 'qraycam-pro-fluorescence-caries-detector.webp', 1400, 78],
  ['photos/equip/e14.jpg', 'anesthetic-warmer-iject-on.webp', 1400, 78],
  ['photos/equip/e44.jpg', 'iject-painless-anesthesia-gun.webp', 1400, 78],
  ['photos/equip/e45.jpg', 'iject-pen-type-anesthesia.webp', 1400, 78],
  ['photos/equip/e35.jpg', 'denops-i-portable-intraosseous-anesthesia.webp', 1400, 78],
  ['photos/equip/e24.jpg', 'vatech-green16-low-dose-ct.webp', 1400, 78],
  ['photos/equip/e38.jpg', 'explasma-z7x-plasma-sterilizer.webp', 1400, 78],
  ['photos/equip/e40.jpg', 'person-vacuum-autoclave-48l.webp', 1400, 78],
  ['photos/equip/e27.jpg', 'sterilized-handpiece-cassettes.webp', 1400, 78],
  ['photos/equip/e19.jpg', 'kavo-handpieces.webp', 1400, 78],
  ['photos/equip/e01.jpg', 'kavo-mastertorque-handpiece.webp', 1400, 78],
  ['photos/equip/e05.jpg', 'one-fil-putty-mta.webp', 1400, 78],
  ['photos/equip/e11.jpg', 'rubber-dam-isolation.webp', 1400, 78],
  ['photos/equip/e15.jpg', 'warm-water-scaling-system.webp', 1400, 78],
  ['photos/equip/e33.jpg', 'bioclear-matrix-system.webp', 1400, 78],
  ['photos/equip/e43.jpg', 'garrison-deep-margin-elevation-kit.webp', 1400, 78],
  ['photos/equip/e31.jpg', 'morita-dentaport-zx.webp', 1400, 78],
  ['photos/equip/e36.jpg', 'vatech-intraoral-sensor.webp', 1400, 78],
  ['photos/equip/e18.jpg', 'ultrasonic-endo-uc-one.webp', 1400, 78],
  ['photos/equip/e47.jpg', 'portable-xray.webp', 1400, 78],
  ['photos/equip/e42.jpg', 'operatory-led-light.webp', 1400, 78],
  ['photos/equip/e10.jpg', 'iject-on-warmer-unit.webp', 1400, 78],
  // 원장 프로필
  ['photos/profile/pf09.jpg', 'dr-han-hwirim-portrait.webp', 2000, 82],
  ['photos/profile/pf08.jpg', 'dr-han-hwirim-standing.webp', 1600, 82],
  ['photos/profile/pf05.png', 'dr-han-hwirim-cutout.webp', 900, 85],
]

for (const [src, name, w, q] of jobs) {
  const inPath = join(SRC, src)
  if (!existsSync(inPath)) { console.warn('missing', src); continue }
  const img = sharp(inPath).rotate()
  const meta = await img.metadata()
  const out = join(OUT, name)
  await img.resize({ width: Math.min(w, meta.width || w), withoutEnlargement: true })
    .webp({ quality: q, effort: 5 }).toFile(out)
  // small thumbnail variant
  await sharp(inPath).rotate().resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 74 }).toFile(out.replace('.webp', '-sm.webp'))
  console.log('ok', name)
}

// Logo: transparent PNG mark + wide
await sharp(join(SRC, 'logo/13agFWD5Uh5ADqzOzKupSaAhb94KbIdSZ.png')).resize(512).png().toFile(join(OUT, 'logo-mark.png'))
await sharp(join(SRC, 'logo/1nH2imvu5MC32JuxZ9P4vqyHOmb9VIjAQ.png')).png().toFile(join(OUT, 'logo-wide.png'))
// favicons
const PUB = '/home/user/webapp/public'
for (const s of [16, 32, 48, 180, 192, 512]) {
  await sharp(join(SRC, 'logo/13agFWD5Uh5ADqzOzKupSaAhb94KbIdSZ.png')).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(PUB, `favicon-${s}.png`))
}
console.log('done')
