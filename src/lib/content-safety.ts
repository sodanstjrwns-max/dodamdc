import { FilterXSS, escapeAttrValue } from 'xss'

const articleFilter = new FilterXSS({
  whiteList: {
    p:[],br:[],h1:[],h2:[],h3:[],h4:[],h5:[],h6:[],strong:[],b:[],em:[],i:[],u:[],s:[],ul:[],ol:[],li:[],blockquote:[],figure:[],figcaption:[],hr:[],table:[],thead:[],tbody:[],tr:[],div:[],span:[],
    a:['href','title','target'], img:['src','alt','width','height','loading'], th:['scope','colspan','rowspan'], td:['colspan','rowspan'],
  },
  stripIgnoreTag:true, stripIgnoreTagBody:['script','style','iframe','object','svg','math','textarea','template'], css:false,
  onTagAttr(tag,name,value) {
    if (tag==='a' && name==='target') return value==='_blank' ? 'target="_blank" rel="noopener noreferrer"' : ''
    if (name==='href') {
      if (!/^(?:\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(value) || /[\u0000-\u0020\\\\]/.test(value)) return ''
      return `href="${escapeAttrValue(value)}"`
    }
    if (tag==='img' && name==='src') return !value.includes('..') && /^\/(?:static\/img|files\/(?:columns|notices|uploads))\/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(value) ? `src="${escapeAttrValue(value)}"` : ''
    if (['width','height','colspan','rowspan'].includes(name) && !/^\d{1,4}$/.test(value)) return ''
  },
})
export function sanitizeArticle(input: string) {
  return articleFilter.process(String(input || '')).replace(/<img\b[^>]*>/gi, tag => tag.replace(/^<img\b/i, `<img${/\bwidth=/.test(tag) ? '' : ' width="960"'}${/\bheight=/.test(tag) ? '' : ' height="640"'}${/\bloading=/.test(tag) ? '' : ' loading="lazy"'}`))
}

// Match only an actual image emitted by the same sanitizer used for rendering.
// A URL in prose, a comment, a removed script, or a longer filename is not publication.
export function articleUsesImage(input: string, key: string) {
  const src = `/files/${key}`
  return Array.from(sanitizeArticle(input).matchAll(/<img\b[^>]*\bsrc="([^"]*)"/gi))
    .some(match => match[1] === src)
}

export async function hasPublishedEditorialImage(db: D1Database, key: string) {
  for (const [table, cover] of [['columns', 'thumbnail'], ['notices', 'image']] as const) {
    const direct = await db.prepare(`SELECT id FROM ${table} WHERE published=1 AND ${cover}=? LIMIT 1`).bind(key).first()
    if (direct) return true
    // Candidate filter only; never use a substring match as an authorization decision.
    // New CMS HTML is normalized on save. Legacy encoded URLs require review/re-save.
    const candidates = await db.prepare(`SELECT content_html FROM ${table} WHERE published=1 AND instr(content_html,?)>0`)
      .bind(`/files/${key}`).all<{ content_html: string }>()
    if (candidates.results.some(row => articleUsesImage(row.content_html, key))) return true
  }
  return false
}

const allowed = ['image/jpeg','image/png','image/webp','image/gif']
export async function checkedImage(file: File) {
  if (!allowed.includes(file.type) || file.size < 12 || file.size > 8 * 1024 * 1024) throw new Error('8MB 이하의 JPG·PNG·WebP·GIF 이미지가 필요합니다.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))
  const type = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' :
    bytes[0] === 137 && text(1, 4) === 'PNG' && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10 ? 'image/png' :
    ['GIF87a','GIF89a'].includes(text(0,6)) ? 'image/gif' :
    text(0,4) === 'RIFF' && text(8,12) === 'WEBP' ? 'image/webp' : ''
  if (type !== file.type) throw new Error('이미지 형식과 실제 파일 내용이 일치하지 않습니다.')
  return { bytes, type, ext: type === 'image/jpeg' ? 'jpg' : type.slice(6) }
}
export const safeFileKey = (key: string) => /^(?:cases\/(?:before|after)|columns|notices|uploads)\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(key)
