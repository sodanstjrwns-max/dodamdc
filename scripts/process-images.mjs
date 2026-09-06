// Photo-only curation. Uses clinic-supplied originals, never invents rooms or people.
// DODAM_PHOTO_SOURCE may point to a local copy of the supplied source collection.
// Outputs are versioned: existing public originals are intentionally retained.
import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const source = process.env.DODAM_PHOTO_SOURCE || '/home/user/dodam_src'
const output = join(process.cwd(), 'public/static/img')
mkdirSync(output, { recursive: true })

// Crops are fractions of the auto-oriented source; source dimensions are never upscaled.
// Room originals are documentary photographs (not the supplied AI-retouched interior folder).
const jobs = [
  { src: 'photos/m17.jpg', name: 'suwon-dodam-dental-reception-desk-v2', size: [1600, 1100], crop: [0, .17, 1, .64], note: 'Actual reception desk, original file 19' },
  { src: 'photos/m41.jpg', name: 'suwon-dodam-dental-treatment-room-v2', size: [1600, 1100], crop: [0, .16, 1, .69], note: 'Sunlit treatment room, original file 35' },
  { src: 'photos/m22.jpg', name: 'suwon-dodam-dental-waiting-lounge-v2', size: [1600, 1100], crop: [0, .23, 1, .61], note: 'Actual wooden waiting room, original file 20' },
  { src: 'photos/m31.jpg', name: 'suwon-dodam-dental-information-desk-v2', size: [1600, 1100], crop: [0, .18, 1, .64], note: 'Reception counter, original file 18' },
  { src: 'photos/m28.jpg', name: 'suwon-dodam-dental-sterilization-room-v2', size: [1600, 1100], crop: [0, .16, 1, .67], note: 'Actual sterilization room, original file 46' },
  { src: 'photos/m34.jpg', name: 'suwon-dodam-dental-consult-room-v2', size: [1600, 1100], crop: [0, .13, 1, .72], note: 'Private consultation room, original file 28' },
  { src: 'photos/m27.jpg', name: 'suwon-dodam-dental-chair-unit-v2', size: [1400, 1100], crop: [0, .19, 1, .69], note: 'Patient chair, original file 40' },
  { src: 'photos/m15.jpg', name: 'suwon-dodam-dental-child-room-v2', size: [1400, 1100], crop: [0, .1, 1, .72], note: 'Star-patterned treatment room, original file 44' },
  // Seated portrait is intentionally cropped around the real face and torso.
  { src: 'photos/profile/pf09.jpg', name: 'dr-han-hwirim-portrait-v2', size: [1200, 1500], crop: [.20, 0, .60, 1], note: 'Original seated portrait; no facial retouching' },
  { src: 'photos/profile/pf08.jpg', name: 'dr-han-hwirim-standing-v2', size: [1200, 1500], crop: [0, 0, 1, .84], note: 'Original white-coat portrait; less empty headroom' },
  { src: 'photos/profile/pf08.jpg', name: 'dr-han-hwirim-avatar-v2', size: [480, 480], crop: [.25, .11, .55, .367], note: 'Dedicated face-and-shoulders avatar crop' },
  { src: 'photos/equip/e05.jpg', name: 'one-fil-putty-mta-v2', size: [1400, 1100], crop: [.06, .18, .88, .64], note: 'MTA material only, same verified source' },
  { src: 'photos/equip/e21.jpg', name: 'qraycam-pro-fluorescence-caries-detector-v2', size: [1400, 1100], crop: [0, .14, 1, .73], note: 'Actual Qray diagnostic device' },
  { src: 'photos/equip/e24.jpg', name: 'vatech-green16-low-dose-ct-v2', size: [1400, 1100], fit: 'contain', note: 'Full CT visible, do not crop the C-arm' },
  { src: 'photos/equip/e37.jpg', name: 'denops-i-portable-intraosseous-anesthesia-v2', size: [1400, 1100], fit: 'contain', note: 'Correct DENOPS source e37; e35 was an endomotor' },
  { src: 'photos/equip/e46.jpg', name: 'anesthetic-warmer-iject-on-v2', size: [1400, 1100], crop: [0, .15, 1, .75], note: 'Correct iJECT ON warmer; e14 was an ultrasonic cleaner' },
  { src: 'photos/equip/e10.jpg', name: 'iject-on-warmer-unit-v2', size: [1400, 1100], crop: [0, .14, 1, .75], note: 'Carpule warmer; separate from the warmer base' },
  { src: 'photos/equip/e44.jpg', name: 'iject-painless-anesthesia-gun-v2', size: [1400, 1100], fit: 'contain', note: 'Actual iJECT; not the Endosonic instrument previously mislabeled as a pen' },
  { src: 'photos/equip/e48.jpg', name: 'portable-xray-v2', size: [1400, 1100], fit: 'contain', note: 'Correct EXARO x-ray; e47 was the TMJ laser' },
  { src: 'photos/equip/e47.jpg', name: 'tmj-phl-laser-v2', size: [1400, 1100], fit: 'contain', note: 'Actual PHL treatment device' },
  { src: 'photos/equip/e02.jpg', name: 'dental-whitening-light-v2', size: [1400, 1100], fit: 'contain', note: 'Actual whitening light; entire head remains visible' },
  { src: 'photos/equip/e40.jpg', name: 'person-vacuum-autoclave-48l-v2', size: [1400, 1100], fit: 'contain', note: 'Actual autoclave, retained in full' },
]

for (const job of jobs) {
  const path = join(source, job.src)
  if (!existsSync(path)) throw new Error(`Missing supplied original: ${job.src}`)
  const normalized = await sharp(path).rotate().toBuffer()
  const meta = await sharp(normalized).metadata()
  let image = sharp(normalized)
  if (job.crop) {
    const [x, y, w, h] = job.crop
    image = image.extract({ left: Math.round(x * meta.width), top: Math.round(y * meta.height), width: Math.round(w * meta.width), height: Math.round(h * meta.height) })
  }
  const buffer = await image.resize(job.size[0], job.size[1], { fit: job.fit || 'cover', position: 'centre', withoutEnlargement: true, background: '#edf2ee' })
    .modulate({ brightness: 1.025, saturation: 0.98 }).sharpen({ sigma: 0.4 })
    .webp({ quality: 83, effort: 5 }).toBuffer()
  await sharp(buffer).toFile(join(output, job.name + '.webp'))
  await sharp(buffer).resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(output, job.name + '-sm.webp'))
  console.log(`${job.name}: ${Math.round(buffer.length / 1024)} KB — ${job.note}`)
}
console.log(`Curated ${jobs.length} images. Original source files and previous public images preserved.`)
