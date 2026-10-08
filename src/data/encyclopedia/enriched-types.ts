/** 용어별 보강 해설 (2026-10-08). 용어 유형별로 섹션 흐름·소제목이 다르며, 범주 템플릿으로 채우지 않는다. */
export type EnrichedKind = 'anatomy' | 'disease' | 'symptom' | 'procedure' | 'material' | 'equipment' | 'prevention' | 'insurance' | 'systemic' | 'decision'
export type EnrichedSection = { h: string; p?: string[]; ol?: string[] }
export type EnrichedTerm = { kind: EnrichedKind; sections: EnrichedSection[]; faqs: { q: string; a: string }[] }
/** 보강 내용을 실제로 반영한 날짜(고정값). 페이지 dateModified·사이트맵 lastmod에 쓴다. */
export const ENRICHED_UPDATED = '2026-10-08'
