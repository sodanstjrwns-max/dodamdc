// 지역 SEO 페이지 데이터: /area/[지역]-[진료]
import { nearbyAreas } from './clinic'
import { treatments, getTreatment } from './treatments'

export type AreaPage = {
  slug: string // e.g. hwaseo-implant
  areaSlug: string
  areaName: string
  areaFull: string
  areaNote: string
  treatmentSlug: string
  treatmentName: string
  areaKey: string
}

// 지역 페이지 대상 진료: areaKey가 있는 진료만
const areaTreatments = treatments.filter((t) => t.areaKey)

export const areaPages: AreaPage[] = nearbyAreas.flatMap((a) =>
  areaTreatments.map((t) => ({
    slug: `${a.slug}-${t.areaKey}`,
    areaSlug: a.slug,
    areaName: a.name,
    areaFull: a.full,
    areaNote: a.note,
    treatmentSlug: t.slug,
    treatmentName: t.name,
    areaKey: t.areaKey!,
  })),
)

const byArea = new Map(areaPages.map((p) => [p.slug, p]))
export const getAreaPage = (slug: string) => byArea.get(slug)

// 지역별 접근 안내 문구 (사실 기반 — 거리·시간 단정 회피)
export const areaAccess: Record<string, string> = {
  hwaseo: '병원이 위치한 동네입니다. 신우상가 2층, 1층 입구의 파란 간판을 찾아오시면 됩니다.',
  'hwaseo-station': '1호선 화서역에서 도보로 약 10분 거리입니다. 출퇴근길에 방문하시는 분들이 많습니다.',
  paldal: '팔달구 화서동 신우상가 2층에 있으며, 팔달구 전역에서 버스로 접근이 편리합니다.',
  jeongja: '장안구 정자동에서 화서동까지 버스 노선이 연결되어 있습니다. 화서역 방면 버스를 이용하세요.',
  yulcheon: '장안구 율전동에서 화서역 방향으로 이동하시면 됩니다. 성균관대역~화서역 구간 1호선 이용도 가능합니다.',
  cheoncheon: '장안구 천천동에서 화서동 방향 버스를 이용하거나, 화서역에서 도보로 오실 수 있습니다.',
  seodun: '권선구 서둔동에서 수원역·화서역 방향으로 이동 후 화양로를 따라 오시면 됩니다.',
  gugun: '권선구 구운동에서 화서역 방면으로 오시면 됩니다.',
  tap: '권선구 탑동에서 화서동까지 버스 노선이 연결되어 있습니다.',
  'suwon-station': '수원역에서 1호선으로 한 정거장, 화서역 하차 후 도보 약 10분입니다.',
  jangan: '장안구 각 동에서 화서역 방면 버스 또는 1호선을 이용해 오실 수 있습니다.',
  gwonseon: '권선구 각 동에서 수원역·화서역 방면으로 이동하시면 됩니다.',
  suwon: '수원 전역에서 1호선 화서역 또는 화서동 방면 버스로 접근할 수 있습니다.',
}

export const treatmentForArea = (p: AreaPage) => getTreatment(p.treatmentSlug)!
