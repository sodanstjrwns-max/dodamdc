// ===== 칼럼 작성 주체 (2026-10-08, 사용자 승인) =====
// 원장을 저자·감수자로 표시하는 건 원장이 쓰거나 검토했다는 근거가 있을 때만 한다.
//
// 대행사 투입 글 — 원장 작성·검토 근거 없음:
//   id 1 wisdom-tooth-when-to-extract / id 2 gum-care-in-your-30s / id 3 why-microscope-root-canal
//   근거: seed.sql (커밋 185c9e1, 2026-09-03 사이트 구축 시 시드)로 들어간 글. author_slug 'han-hwirim' 은
//   시드·스키마 기본값(columns.author_slug DEFAULT 'han-hwirim')이라 원장 작성 근거가 아니다.
// → 작성·발행 = 병원(/#clinic), reviewedBy·lastReviewed 없음, 화면엔 일반 건강정보 안내.
//
// 관리자 칼럼 에디터에서 병원이 원장을 지정해 올린 글(id 4 이후)은 기존 표시(원장 글)를 유지한다.
// 관리자에서 '병원 발행'(author_slug = 'clinic')을 고르면 원장 이름이 붙지 않는다(새 글 기본값).
import { getDoctor } from '../data/doctors'

export const AGENCY_SEED_COLUMN_IDS = new Set<number>([1, 2, 3])
export const CLINIC_AUTHOR_SLUG = 'clinic'
export const CLINIC_GENERAL_INFO_NOTE = '일반 건강정보입니다. 진료 판단은 내원 상담에서 원장이 직접 합니다.'

export const isAgencyColumn = (p: { id?: number | string | null }) => AGENCY_SEED_COLUMN_IDS.has(Number(p.id))

/** 원장 저자를 표시해도 되는 글이면 그 원장, 아니면 undefined(= 병원 발행). 알 수 없는 slug 도 병원 발행. */
export const columnDoctor = (p: { id?: number | string | null; author_slug?: string | null }) =>
  isAgencyColumn(p) || !p.author_slug ? undefined : getDoctor(p.author_slug)

/** SQL 조건: 원장 글만 (doctor 프로필의 '원장 칼럼' 목록용) */
export const NOT_AGENCY_SQL = `id NOT IN (${[...AGENCY_SEED_COLUMN_IDS].join(',')})`
