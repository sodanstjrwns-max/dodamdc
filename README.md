# 서울도담치과의원 홈페이지 (webapp)

## 프로젝트 개요
- **병원**: 서울도담치과의원 · 한휘림 대표원장 · 수원 화서동
- **목표**: 자연치아 보존 철학을 전달하는 반응형 홈페이지와 환자 중심의 진료·예약 동선
- **스택**: Hono + TypeScript + Cloudflare Pages/Workers + D1 + R2, Vanilla JS/CSS
- **작업 경로 / 브랜치**: `/home/user/webapp` / `main`
- **최근 변경**: 2026-09-06 에디토리얼 디자인 전면 개편

## URL과 배포 상태
- **이번 개편 미리보기**: https://3000-im9044c37cori5huz389s-c81df28e.sandbox.novita.ai
- **기존 프로덕션 URL**: https://seoul-dodam-dental.pages.dev
- **이번 개편의 프로덕션 배포 상태**: 미배포. 위 기존 프로덕션과 운영 DB/R2는 이번 작업에서 수정하지 않았습니다.
- 미리보기는 임시 sandbox 서비스로, 영구 운영 주소가 아닙니다.
- 기존 Cloudflare 프로젝트 설정: `seoul-dodam-dental`. 배포 방식과 운영 반영은 별도 확인이 필요합니다.

## 완료된 디자인·UX 개편
1. **메인 구조 재설계**: 브랜드 첫인상 → 진료 철학 → 핵심 진료 탭 → 의료진 → 공간·감염관리 → FAQ → 치과 이야기 → 내원·예약.
2. **공통 디자인 시스템 교체**: 로고 블루, 딥네이비, 아이보리; 큰 타이포그래피, 얇은 구분선, 비대칭 사진 구성. 반복되는 파스텔 박스 및 장식 효과 정리.
3. **실제 기존 사진 활용**: 저해상도 누끼 확대 대신 원본 의료진 사진 사용. 병원·장비 사진을 각 섹션 목적에 맞게 배치. 이번 개편에서 AI 이미지나 외부 스톡 사진을 새로 사용하지 않았습니다.
4. **상세 페이지**: 병원 철학 포스터형 히어로, 의료진 소개, 진료 목록의 번호형 챕터, 개별 진료의 고정 빠른 목차, 읽기 쉬운 본문·FAQ·표.
5. **예약**: 신청 → 확인 연락 → 일정 확정 순서 명시. 폼 및 접수 완료 화면 재구성, 첫 방문 준비물과 진료시간 안내.
6. **내비게이션**: 데스크톱 드롭다운, 모바일 포커스 순환·Escape 닫기, 모바일 하단 전화·카카오·예약 바.
7. **접근성**: 키보드 진료 탭(좌우/Home/End), 본문 바로가기, 모션 감소 설정, JavaScript 없이 읽을 수 있는 콘텐츠와 대체 메뉴.
8. **콘텐츠 없는 상태**: 칼럼·공지·사례의 다음 동선을 제공. 칼럼이 없으면 메인은 실제 진료 안내로 연결되며 가짜 게시물·후기·치료 사례를 생성하지 않습니다.
9. **유지한 기능**: 기존 URL, 메타·구조화 데이터, 예약 DB 저장, 회원·관리자 라우트, 치료 후 사진의 서버 측 로그인 제한.

## 주요 기능 진입 URI
| 경로 | 기능 / 파라미터 |
| --- | --- |
| `/` | 메인 홈페이지, 핵심 진료 탭, FAQ |
| `/mission` | 도담의 진료 철학 |
| `/doctors`, `/doctors/han-hwirim` | 의료진 목록 / 상세 |
| `/treatments`, `/treatments/:slug` | 진료 목록 / 상세 (`vpt-crown`, `periodontal`, `implant` 등) |
| `/floor-guide` | 장비·감염관리·병원 공간 |
| `/reservation?treatment=implant` | 희망 진료 미리 선택. POST `/reservation`으로 신청 |
| `/reservation?ok=1` | 예약 신청 접수 안내 화면 |
| `/directions`, `/hours`, `/pricing` | 위치·진료시간·비급여 안내 |
| `/faq`, `/encyclopedia`, `/encyclopedia/:slug` | FAQ·치과 용어 검색과 상세 |
| `/column`, `/column/:slug` | 칼럼 (`treatment`, `page` 필터), `/column/rss.xml` |
| `/notice`, `/notice/:id` | 공지 목록 / 상세 |
| `/cases/gallery`, `/cases/gallery/:slug` | 치료 전후 (`treatment`, `doctor`, `page` 필터) |
| `/auth/register`, `/auth/login`, `/auth/mypage` | 회원 가입·로그인·내 정보 |
| `/admin/login`, `/admin/*` | 기존 관리자 CMS |
| `/files/:key` | R2 파일. 치료 후 사진 경로는 서버 측 로그인 확인 |
| `/api/regions?q=화서` | 지역 자동완성 |
| `/area`, `/area/:slug` | 지역별 진료 안내 |
| `/privacy`, `/terms`, `/sitemap` | 정책·사이트맵 |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | 검색엔진·AI 크롤러 안내 |

## 데이터 구조와 저장
- **D1 `DB`**: `site_settings`, `users`, `cases`, `columns`, `notices`, `reservations`, `page_views`, `uploads`.
- **예약**: 이름, 연락처, 선택 이메일, 희망 진료·일시, 문의 내용, 상태를 저장. 신청 자체는 확정 예약이 아닙니다.
- **R2 `R2`**: 치료 전후·칼럼·공지 업로드 파일. 공개 범위는 기존 서버 로직 유지.
- **정적 데이터 / 이미지**: `src/data`와 `public/static/img`의 기존 병원 자료.
- **미리보기 DB**: 기존 마이그레이션을 로컬에 적용. 운영 데이터를 내려받거나 시드로 허위 사례를 채우지 않았습니다.
- API 키와 세션·관리자 비밀값은 `.dev.vars` / 프로덕션 secrets에만 저장하며 커밋하지 않습니다.

## 로컬 실행과 테스트
```bash
npm ci
npm run db:migrate:local
npm run build
pm2 start ecosystem.config.cjs
curl http://localhost:3000

npm run typecheck
npx playwright install chromium
npm run test:design
```
- 미리보기 서버: PM2 → `wrangler pages dev dist --local --ip 0.0.0.0 --port 3000`.
- `scripts/design-smoke.mjs`: 공개 페이지 32개를 데스크톱·모바일에서 확인하고 추가 화면 폭을 검사합니다.
- **검증 결과**: 320 / 390 / 768 / 1024 / 1440 / 1920px, 총 80개 페이지·화면 폭 조합 통과. 상태 코드, H1, 가로 넘침, JS 오류, 진료 탭, FAQ, 모바일 메뉴, 폼 필수값, 진료 선택 전달, 치료 후 이미지 비로그인 차단을 점검했습니다.
- JavaScript 비활성화 및 모션 감소 설정의 기본 동작 확인.
- 예약 POST → D1 1건 저장을 로컬에서 확인하고 해당 테스트 데이터 삭제. 실제 알림 이메일은 발송하지 않았습니다.
- 공개 미리보기 브라우저 콘솔 오류 없음 확인.
- 스크린샷·검증 JSON은 `.artifacts/`에 생성하며 커밋하지 않습니다.
- 정량적인 Core Web Vitals·의료광고 적법성·모든 관리자 CRUD까지 전수 검증했다는 의미는 아닙니다.

## 사용 안내
- 환자는 핵심 진료 탭이나 진료 목록에서 상세 안내를 보고, 담당 의료진·주의사항·FAQ를 확인한 뒤 예약할 수 있습니다.
- 모바일 하단 바에서 전화, 카카오 상담, 온라인 예약으로 바로 이동합니다.
- 예약 신청 후에는 병원의 확인 연락을 기다려야 합니다.
- 게시물과 실제 치료 사례는 관리자에서 등록합니다. 실제 동의·원장 검수 후 공개해야 합니다.

## 미구현·운영 전 확인 / 권장 다음 단계
1. 원장님 디자인 확인 후 선택한 배포 방식으로 운영 반영. 이번 작업에서는 배포하지 않았습니다.
2. 기존 프로덕션의 실제 콘텐츠·사진과 새 디자인 결합 확인, 커스텀 도메인·캐노니컬 검수.
3. Google OAuth, Resend 발신 도메인·API 설정은 이전 프로젝트의 후속 과제이며 이번에 설정하지 않았습니다. 미리보기에서 이메일 알림은 비활성 상태입니다.
4. 비급여 금액, 자격·약력, 진료시간, 의료 표현, 환자 동의 및 개인정보 보유·파기 절차를 병원 측에서 최종 검수.
5. 운영 반영 후 실기기 Safari/Android, PageSpeed/Core Web Vitals, 검색 콘솔 및 예약 전환 데이터 확인.
