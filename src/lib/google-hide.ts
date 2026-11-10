// ===== 구글 전용 검색 제외 (2026-11-10, 사용자 결정) =====
// 배경: 구글이 사이트 단위 판정으로 홈 한 장만 색인하고 있다(백과·지역 조합을 대량 공개한 뒤 전체 탈락).
//   방문의 대부분은 네이버에서 백과·용어 페이지로 들어오므로, 대량 생성 구역을 "구글에만" 검색 제외해
//   구글이 보는 사이트를 병원 핵심 페이지(진료·의료진·비용·허브·칼럼 등)로 줄여 재평가를 받는다.
// 방식: 요청 UA 가 구글 크롤러이고 대상 경로의 200 HTML 응답일 때만
//   응답 헤더 X-Robots-Tag 를 `googlebot: noindex` 로 바꾼다(src/index.tsx 맨 바깥 미들웨어).
//   네이버(Yeti)·Bing·일반 브라우저·AI 봇 응답은 헤더·본문이 한 글자도 달라지지 않는다.
//   HTML 메타 태그·robots.txt·sitemap·canonical·본문·스키마는 건드리지 않는다. 301·404 에는 붙이지 않는다.
// 되돌리기: isGoogleHiddenPath 가 항상 false 를 돌려주게 하면 끝(배포 후 구글이 다시 읽으면 복구).
//
// 가리는 구역
//   /encyclopedia, /encyclopedia/*  — 치과 백과사전(목록 + 용어 약 508쪽)
//   /area, /area/*                  — 지역 목록 + 화서역을 뺀 12개 지역의 지역×진료 조합(12 × 12)
// 남기는 구역(이 함수가 false)
//   /area/hwaseo-station            — 주 지역 허브
//   /area/hwaseo-station-*          — 화서역×진료 조합 12쪽(/area/hwaseo-station-implant 등). 병원 소재 역이라
//                                     "화서역 임플란트" 같은 목표 검색어의 착지 페이지다. 화서동(/area/hwaseo-vpt 등)은 가린다.
//   홈·진료·의료진·비용·소개·오시는 길·예약·FAQ·공지·치료 사례·언론보도·칼럼(전부 D1 에서 오는 글) 등 나머지 전부

export const GOOGLE_HIDE_HEADER = 'googlebot: noindex'

/** 주 지역 허브와 그 역×진료 조합 — 구글에도 계속 보여 준다. */
const KEEP_AREA = /^\/area\/hwaseo-station(-[a-z0-9-]+)?$/

/** 구글 검색 크롤러인가. Google-Extended·GoogleOther·AdsBot·Mediapartners 는 대상이 아니다. */
export const isGoogleCrawler = (ua?: string | null) => /googlebot|google-inspectiontool/i.test(ua || '')

/** 구글에만 검색 제외할 경로인가. 판정은 이 함수 한 곳에서만 한다. */
export function isGoogleHiddenPath(pathname: string): boolean {
  if (pathname === '/encyclopedia' || pathname.startsWith('/encyclopedia/')) return true
  if (pathname === '/area') return true
  if (pathname.startsWith('/area/')) return !KEEP_AREA.test(pathname)
  return false
}
