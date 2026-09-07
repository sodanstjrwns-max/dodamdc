import { clinicDefaults, type Clinic } from '../data/clinic'

/** 관리자에서 수정 가능한 기본정보 키 (한 곳에서 수정 → 전체 반영) */
export const EDITABLE_KEYS: { key: string; label: string; type?: 'text' | 'textarea' }[] = [
  { key: 'name', label: '병원명 (정식)' },
  { key: 'shortName', label: '병원명 (짧게)' },
  { key: 'slogan', label: '슬로건', type: 'textarea' },
  { key: 'mission', label: '미션 문장', type: 'textarea' },
  { key: 'phone', label: '대표 전화' },
  { key: 'address', label: '주소 (전체)' },
  { key: 'addressShort', label: '주소 (짧게)' },
  { key: 'hoursNote', label: '진료시간 비고' },
  { key: 'directions.subway', label: '오시는길 - 지하철' },
  { key: 'directions.bus', label: '오시는길 - 버스' },
  { key: 'directions.parking', label: '오시는길 - 주차', type: 'textarea' },
  { key: 'directions.landmark', label: '오시는길 - 건물 안내' },
  { key: 'channels.naverPlace', label: '네이버 플레이스 URL' },
  { key: 'channels.naverBooking', label: '네이버 예약 URL (booking.naver.com 예약 페이지)' },
  { key: 'channels.naverBlog', label: '네이버 블로그 URL' },
  { key: 'channels.instagram', label: '인스타그램 URL' },
  { key: 'channels.kakao', label: '카카오톡 채널 URL' },
  { key: 'reviews.count', label: '네이버 방문자 리뷰 수' },
  { key: 'reviews.asOf', label: '리뷰 수 기준 시점 (예: 2026년 8월)' },
  { key: 'email', label: '예약 알림 수신 이메일' },
  { key: 'ga4', label: 'GA4 측정 ID (G-XXXX)' },
  { key: 'gsc', label: 'Google Search Console 인증 메타 content' },
  { key: 'naverVerify', label: '네이버 서치어드바이저 인증 content' },
]

function setPath(obj: any, path: string, value: any) {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] ?? {}
    cur = cur[parts[i]]
  }
  const last = parts[parts.length - 1]
  cur[last] = typeof cur[last] === 'number' ? Number(value) : value
}

export function getPath(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
}

let cache: { at: number; clinic: Clinic } | null = null

export async function loadClinic(db: D1Database | undefined): Promise<Clinic & { ga4?: string; gsc?: string; naverVerify?: string }> {
  const base: any = structuredClone(clinicDefaults)
  if (!db) return base
  if (cache && Date.now() - cache.at < 30_000) return cache.clinic as any
  try {
    const { results } = await db.prepare('SELECT key, value FROM site_settings').all<{ key: string; value: string }>()
    for (const r of results || []) if (r.value !== null && r.value !== '') setPath(base, r.key, r.value)
  } catch {
    /* 테이블 없을 수 있음 (마이그레이션 전) */
  }
  cache = { at: Date.now(), clinic: base }
  return base
}

export function invalidateClinicCache() {
  cache = null
}

export async function saveSettings(db: D1Database, entries: Record<string, string>) {
  const stmts = Object.entries(entries).map(([k, v]) =>
    db.prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP').bind(k, v),
  )
  if (stmts.length) await db.batch(stmts)
  invalidateClinicCache()
}
