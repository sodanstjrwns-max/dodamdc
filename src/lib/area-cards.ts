// 화서역 진료 안내 사진 카드(2026-10-14): 홈·허브에서 /area/hwaseo-station-* 핵심 6개 하위 페이지로.
// 카드 사진은 각 하위 페이지의 본문 첫 사진·og와 같은 사진의 600×600 정사각 크롭(public/static/img/cards/).
// 한 줄 설명은 진료 데이터(src/data/treatments)의 기존 문장에서만 가져온다.
import { html } from 'hono/html'
import { absUrl } from './seo'

export type AreaCard = { slug: string; key: string; name: string; tag: string; line: string; image: string }

export const HWASEO_CORE_CARDS: AreaCard[] = [
  { slug: 'hwaseo-station-implant', key: 'implant', name: '화서역 임플란트', tag: 'IMPLANT', line: '보존이 어려운 치아라면, 뼈와 신경의 위치부터 확인합니다.' },
  { slug: 'hwaseo-station-endo', key: 'endo', name: '화서역 신경치료', tag: 'ROOT CANAL', line: '한 번밖에 없는 기회라면, 그 한 번을 최대한 오래 가게.' },
  { slug: 'hwaseo-station-gum', key: 'gum', name: '화서역 잇몸치료', tag: 'GUM CARE', line: '발치 전, 살리는 방향을 먼저 봅니다. 3개월 주기로 함께 지켜갑니다.' },
  { slug: 'hwaseo-station-cavity', key: 'cavity', name: '화서역 충치치료', tag: 'CAVITY', line: '큐레이로 보이지 않는 충치를 찾고, 필요한 만큼만 깎습니다.' },
  { slug: 'hwaseo-station-crown', key: 'crown', name: '화서역 크라운', tag: 'CROWN', line: '심미보다 기능. 튼튼하고 오래 쓰실 수 있게 만드는 데 시간을 씁니다.' },
  { slug: 'hwaseo-station-kids', key: 'kids', name: '화서역 소아치과', tag: 'KIDS', line: '아이들은 충치가 빠릅니다. 3개월마다 큐레이로 부모님께 보여드립니다.' },
].map((c) => ({ ...c, image: `/static/img/cards/hwaseo-station-${c.key}-600.webp` }))

/** 사진 카드 그리드. idPrefix는 같은 페이지 안에서 id가 겹치지 않게 한다. */
export function areaCardGrid(cards: AreaCard[], idPrefix: string) {
  return html`<ul class="area-card-grid" role="list">${cards.map((c, i) => html`<li><a class="area-card" href="/area/${c.slug}" aria-labelledby="${idPrefix}-${c.key}" aria-describedby="${idPrefix}-${c.key}-line"><span class="area-card-img"><img src="${c.image}" width="600" height="600" loading="lazy" decoding="async" alt="${c.name}"></span><span class="area-card-body"><span class="area-card-tag" aria-hidden="true">0${i + 1} / ${c.tag}</span><strong class="area-card-title" id="${idPrefix}-${c.key}">${c.name}</strong><span class="area-card-line" id="${idPrefix}-${c.key}-line">${c.line}</span><span class="area-card-arrow" aria-hidden="true">↗</span></span></a></li>`)}</ul>`
}

/** 화면 카드와 1:1인 ItemList(같은 순서·이름·URL·사진) */
export function areaCardItemListLd(cards: AreaCard[], siteUrl: string, listId: string, name: string) {
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', '@id': absUrl(siteUrl, listId), name, numberOfItems: cards.length,
    itemListElement: cards.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: absUrl(siteUrl, `/area/${c.slug}`), image: absUrl(siteUrl, c.image) })),
  }
}
