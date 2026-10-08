/**
 * "화서역 치과" 허브(/area/hwaseo-station)로 보내는 내부 링크 (2026-10-08 허브 내부 링크 몰아주기)
 *
 * - 앵커 텍스트는 대표 키워드 "화서역 치과" 그대로, nofollow 없음.
 * - 한 페이지에 허브 링크는 최대 2개(전역 푸터 1 + 본문 1). 허브 자신에는 넣지 않는다.
 * - 칼럼 끝 문장은 slug 해시로 4개 문형 중 하나를 고정 선택 (글마다 같은 문장 반복 방지).
 * - 진료시간은 관리자 화면에서 바뀔 수 있으므로 문장에 시각을 쓰지 않는다. 사실은 data/clinic.ts 에 있는 것만.
 */
import { html, raw } from 'hono/html'

export const HUB_PATH = '/area/hwaseo-station'
export const HUB_ANCHOR = '화서역 치과'

export const hubA = () => raw(`<a href="${HUB_PATH}">${HUB_ANCHOR}</a>`)

export function slugHash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h
}

const COLUMN_LINES: [string, string][] = [
  ['서울도담치과는 ', '를 찾는 화서동 이웃분들께 진료시간과 찾아오는 길을 한곳에 정리해 안내합니다.'],
  ['글을 읽고 직접 상담을 받아 보고 싶으시다면, ', ' 안내에서 화서역에서 걸어오는 길과 요일별 진료시간을 먼저 확인해 보세요.'],
  ['버스·지하철로 오시는 방법과 휴진일은 ', ' 안내 페이지에 함께 모아 두었습니다.'],
  ['화서역 가까이에서 다니기 편한 ', '를 알아보고 계시다면 서울도담치과의 의료진과 진료 항목을 함께 살펴보세요.'],
]

/** 칼럼 본문 끝(글쓴이 박스 위) 지역 안내 1문장 */
export function columnHubLine(slug: string) {
  const [pre, post] = COLUMN_LINES[slugHash(slug || '') % COLUMN_LINES.length]
  return html`<p class="hub-local-line summary-box">${pre}${hubA()}${post}</p>`
}

/** 본문 HTML 에 이미 허브 링크가 있는지 (있으면 문장 블록 생략 → 페이지당 2개 이하) */
export function htmlHasHubLink(s: string): boolean {
  return /href=["'](?:https?:\/\/(?:www\.)?dodamdc\.kr)?\/area\/hwaseo-station\/?["'#?]/i.test(s || '')
}
