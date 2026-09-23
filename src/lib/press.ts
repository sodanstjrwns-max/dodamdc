// 언론보도 공용 조각 — 공개 목록(/press)과 원장 소개 '언론 활동'이 같은 SQL·마크업을 쓴다.
import { html } from 'hono/html'
import { fmtDate } from './util'

export const PRESS_SELECT = 'SELECT id,date,outlet,title,summary,url FROM press WHERE published=1 ORDER BY date DESC, sort DESC, id DESC'

export const pressItem = (p: { date: string; outlet: string; title: string; summary?: string | null; url: string }, heading: 'h2' | 'h3' = 'h2') =>
  html`<li class="press-item"><div class="press-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time><span class="press-outlet">${p.outlet}</span></div><div>${heading === 'h2' ? html`<h2>${p.title}</h2>` : html`<h3>${p.title}</h3>`}${p.summary ? html`<p>${p.summary}</p>` : ''}<a href="${p.url}" class="press-link" target="_blank" rel="noopener noreferrer">원문 보기 <span aria-hidden="true">↗</span></a></div></li>`

/** 관리자 입력 검증. 본문은 받지 않는다(요약·링크만). */
export function validatePress(g: (k: string) => string) {
  const date = g('date'), outlet = g('outlet'), title = g('title'), summary = g('summary'), url = g('url'), sort = Number(g('sort') || 0)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + 'T00:00:00Z'))) throw new Error('보도일은 YYYY-MM-DD 형식으로 입력해 주세요.')
  if (!outlet || outlet.length > 60) throw new Error('매체명을 60자 이내로 입력해 주세요.')
  if (!title || title.length > 200) throw new Error('기사 제목을 200자 이내로 입력해 주세요.')
  if (summary.length > 600) throw new Error('요약은 600자 이내로 입력해 주세요.')
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new Error('원문 링크 형식이 올바르지 않습니다.') }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || url.length > 500) throw new Error('원문 링크는 https 주소만 등록할 수 있습니다.')
  if (!Number.isInteger(sort) || Math.abs(sort) > 9999) throw new Error('정렬값은 -9999~9999 사이의 정수여야 합니다.')
  return { date, outlet, title, summary: summary || null, url: parsed.href, sort }
}
