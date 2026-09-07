// 비급여 수가(진료비) — DB(fees) 로더 + 시드 폴백
// 공개 페이지는 published-only 로 읽고, DB 가 비었거나 실패하면 하드코딩 시드(src/data/pricing.ts)로 폴백해
// 가격 페이지가 절대 비지 않도록 한다.
import { pricing, type PriceGroup } from '../data/pricing'

export type FeeEditItem = { name: string; price: number | null; unit: string; note: string; is_published: number }
export type FeeEditGroup = { id: string; group: string; desc: string; items: FeeEditItem[] }

type FeeRow = {
  id: number; group_id: string; group_name: string; group_desc: string | null
  name: string; price: number | null; unit: string | null; note: string | null
  is_published: number; sort_group: number; sort_order: number
}

async function fetchRows(db: any, publishedOnly: boolean): Promise<FeeRow[] | null> {
  if (!db) return null
  try {
    const where = publishedOnly ? 'WHERE is_published = 1' : ''
    const { results } = await db.prepare(
      `SELECT id, group_id, group_name, group_desc, name, price, unit, note, is_published, sort_group, sort_order
       FROM fees ${where} ORDER BY sort_group ASC, sort_order ASC, id ASC`,
    ).all()
    return (results as FeeRow[]) || []
  } catch (e) {
    console.error('fees fetchRows error', e)
    return null
  }
}

// 공개 페이지용: 항목이 하나도 안 남은 그룹은 자동 제외(빈 그룹 숨김).
// 반환 null → 호출부에서 하드코딩 시드로 폴백.
export async function loadPricingGroups(db: any, publishedOnly: boolean): Promise<PriceGroup[] | null> {
  const rows = await fetchRows(db, publishedOnly)
  if (!rows || !rows.length) return null
  const order: number[] = []
  const map = new Map<number, PriceGroup>()
  for (const r of rows) {
    if (!map.has(r.sort_group)) {
      map.set(r.sort_group, { id: r.group_id, group: r.group_name, desc: r.group_desc || undefined, items: [] })
      order.push(r.sort_group)
    }
    map.get(r.sort_group)!.items.push({ name: r.name, price: r.price, unit: r.unit || undefined, note: r.note || undefined })
  }
  const groups = order.map((k) => map.get(k)!).filter((g) => g.items.length)
  return groups.length ? groups : null
}

// 관리자 편집기용: 비공개 포함 전체 행 + 항목별 is_published 유지. 비었으면 시드.
export async function loadFeeGroupsForAdmin(db: any): Promise<FeeEditGroup[]> {
  const rows = await fetchRows(db, false)
  if (!rows || !rows.length) return seedFeeGroups()
  const order: number[] = []
  const map = new Map<number, FeeEditGroup>()
  for (const r of rows) {
    if (!map.has(r.sort_group)) {
      map.set(r.sort_group, { id: r.group_id, group: r.group_name, desc: r.group_desc || '', items: [] })
      order.push(r.sort_group)
    }
    map.get(r.sort_group)!.items.push({ name: r.name, price: r.price, unit: r.unit || '', note: r.note || '', is_published: r.is_published })
  }
  return order.map((k) => map.get(k)!)
}

// 하드코딩 시드(src/data/pricing.ts) → 편집기 그룹 (전 항목 공개)
export function seedFeeGroups(): FeeEditGroup[] {
  return pricing.map((g) => ({
    id: g.id,
    group: g.group,
    desc: g.desc || '',
    items: g.items.map((it) => ({ name: it.name, price: it.price, unit: it.unit || '', note: it.note || '', is_published: 1 })),
  }))
}
