import DOMPurify from 'dompurify'
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (node.nodeName === 'IMG' && data.attrName === 'src' &&
    (data.attrValue.includes('..') || !/^\/(?:static\/img|files\/(?:columns|notices|uploads))\/[A-Za-z0-9_./-]+\.(?:jpg|jpeg|png|webp|gif)$/i.test(data.attrValue))) data.keepAttr = false
})
export function clean(source: string) {
  return DOMPurify.sanitize(source, {
    ALLOWED_TAGS: ['p','br','h2','h3','h4','strong','b','em','i','u','s','ul','ol','li','blockquote','a','img','figure','figcaption','hr','table','thead','tbody','tr','th','td','div','span'],
    ALLOWED_ATTR: ['href','src','alt','title','width','height','loading','target','rel','scope','colspan','rowspan'],
    ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['svg','math','style','form','input','iframe','object','template'],
  })
}
