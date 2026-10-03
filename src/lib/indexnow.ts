// IndexNow (Bing·Naver·Yandex 즉시 색인 통보) — 칼럼·사례 저장 후 응답 뒤(waitUntil)에 보낸다.
// 키는 공개 값(검증 파일 /{key}.txt 로 공개되는 것이 표준)이라 코드에 둔다.
export const INDEXNOW_KEY = 'e75f42d3abfc512e9632345b5206a5a6'
const HOST = 'dodamdc.kr'

export async function pingIndexNow(paths: string[]): Promise<void> {
  const urlList = [...new Set(paths.filter(Boolean).map((p) => (p.startsWith('http') ? p : `https://${HOST}${p.startsWith('/') ? p : '/' + p}`)))]
  if (!urlList.length) return
  const body = JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`, urlList })
  await Promise.all(['https://api.indexnow.org/indexnow', 'https://searchadvisor.naver.com/indexnow'].map(async (ep) => {
    try {
      await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body, signal: AbortSignal.timeout(5000) })
    } catch { /* 저장은 이미 끝났으므로 통보 실패는 무시 */ }
  }))
}

/** 응답 뒤 실행. 로컬 등 executionCtx 가 없으면 조용히 건너뛴다. */
export function pingLater(c: any, paths: string[]) {
  try { c.executionCtx?.waitUntil?.(pingIndexNow(paths)) } catch { /* no ctx */ }
}
