// 공유 미리보기(og:image) 1200×630 가로형 JPG 생성 — 수동 실행: node scripts/build-og-image.mjs
// 기존 실사 자산(한휘림 대표원장 프로필 사진·로고)만 합성합니다. AI 생성 이미지는 쓰지 않습니다.
// 문구는 사이트에 이미 공개된 사실(지역·대표원장·전문의 자격)만 사용합니다.
import sharp from 'sharp'

const img = (name) => new URL(`../public/static/img/${name}`, import.meta.url).pathname
const OUT = img('og-dodam-1200x630.jpg')
const W = 1200, H = 630, P = 600
const FONT = 'Apple SD Gothic Neo, AppleSDGothicNeo, Noto Sans KR, sans-serif'

const portrait = await sharp(img('dr-han-hwirim-portrait-v2.webp'))
  .resize({ width: P }).extract({ left: 0, top: 40, width: P, height: H }).toBuffer()
const logo = await sharp(img('logo-wide.png')).resize({ width: 458, kernel: 'lanczos3' }).png().toBuffer()
const logoMeta = await sharp(logo).metadata()
const text = Buffer.from(`<svg width="${P}" height="120" xmlns="http://www.w3.org/2000/svg">
  <text x="${P / 2}" y="40" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="600" fill="#3a4450">수원 화서역 치과</text>
  <text x="${P / 2}" y="88" text-anchor="middle" font-family="${FONT}" font-size="26" fill="#5d6873">한휘림 대표원장 · 통합치의학과 전문의</text>
</svg>`)

await sharp({ create: { width: W, height: H, channels: 3, background: '#F4F6F8' } })
  .composite([
    { input: portrait, left: P, top: 0 },
    { input: logo, left: Math.round((P - logoMeta.width) / 2), top: 190 },
    { input: text, left: 0, top: 190 + logoMeta.height + 40 },
  ])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT)
const meta = await sharp(OUT).metadata()
console.log(`og image: ${OUT} ${meta.width}×${meta.height}`)
