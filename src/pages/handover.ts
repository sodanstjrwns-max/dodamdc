import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { Layout } from '../lib/layout'

/** Public, non-sensitive operator guide. No credentials, patient records or recovery details. */
export function handoverPage(c: Context<Env>) {
  const body = html`<article class="handover-document">
    <header class="handover-hero">
      <p class="handover-eyebrow">SEOUL DODAM · WEBSITE HANDOVER</p>
      <h1>좋은 진료가,<br><em>잘 전해지도록.</em></h1>
      <p class="handover-intro">서울도담치과 홈페이지 납품 · 운영 안내</p>
      <p>자연치아를 지키는 철학부터 예약 응대까지.<br>이 페이지에서 운영 방법과 납품 범위, 마지막 확인 사항을 살펴보세요.</p>
      <div class="handover-actions"><a class="btn btn-primary" href="/">홈페이지 보기</a><a class="btn btn-outline" href="/admin/login">관리자 로그인</a><button class="btn btn-outline" type="button" id="handover-print">인쇄 · PDF 저장</button></div>
      <p class="handover-caption">공개 가능한 운영 안내입니다. 검색 제외(noindex)는 접근 잠금이 아니므로, 이 페이지에 계정정보나 환자정보를 기록하지 마세요.</p>
    </header>
    <nav class="handover-toc" aria-label="납품 안내 목차"><a href="#delivery-scope">01 납품 범위</a><a href="#delivery-search">02 검색 최적화</a><a href="#delivery-operations">03 운영 방법</a><a href="#delivery-checklist">04 인수 확인</a><a href="#delivery-limits">05 운영 유의사항</a></nav>
    <section id="delivery-scope" class="handover-section">
      <p class="handover-eyebrow">01 / DELIVERED</p><h2>디자인만이 아닌,<br>운영을 위한 홈페이지.</h2>
      <div class="handover-grid">
        <section class="handover-card"><span class="handover-status">구현</span><h3>병원의 브랜드와 진료 철학</h3><p>실제 병원·의료진 사진, 자연치아 보존 중심의 소개, 3D 치아와 모션, 모바일 대응 및 모션 대체 화면.</p><a href="/mission">진료 철학 보기</a></section>
        <section class="handover-card"><span class="handover-status">구현</span><h3>환자가 이해하는 진료 안내</h3><p>상황별 안내, 핵심 진료, 의료진, 첫 방문 준비, 진료시간·오시는 길·비급여·FAQ·치과 백과사전.</p><a href="/first-visit">첫 방문 안내 보기</a></section>
        <section class="handover-card"><span class="handover-status">구현</span><h3>예약 신청과 응대 업무판</h3><p>네이버 예약 연결, 홈페이지 신청 저장, 담당자·연락 결과·재연락 일정·처리 이력 관리. 홈페이지 신청은 병원 확인 연락 후 확정합니다.</p><a href="/admin/reservations">예약 응대 업무판</a></section>
        <section class="handover-card"><span class="handover-status">구현</span><h3>콘텐츠와 직원별 권한</h3><p>공지·칼럼·치료 사례·비급여 편집, 역할별 접근, 회원 본인 예약 확인, 공개/회원 전용 이미지 구분. 예약 만료 자료 삭제는 책임자 확인 후 별도로 진행합니다.</p><a href="/admin">관리자 홈</a></section>
      </div>
    </section>
    <section id="delivery-search" class="handover-section">
      <p class="handover-eyebrow">02 / SEARCH & ANSWERS</p><h2>검색엔진과 AI가<br>본문을 이해할 수 있게.</h2>
      <p class="handover-lead">기술적 접근성, 정확한 대표주소, 일관된 병원 정보와 읽을 수 있는 설명을 기준으로 정리했습니다. 키워드 반복이나 가짜 후기·평점은 추가하지 않았습니다.</p>
      <dl class="handover-specs">
        <div><dt>제목 · H 태그</dt><dd>페이지별 title·description, 본문 H1 1개와 하위 제목 구조, 칼럼 본문 제목과 페이지 제목 분리.</dd></div>
        <div><dt>Canonical · URL</dt><dd>운영 HTTPS 대표주소, 추적 매개변수 제거, 페이지 번호와 필터 기준 정합성, 후행 슬래시 301 정리.</dd></div>
        <div><dt>구조화 데이터</dt><dd>Dentist·WebSite·WebPage·의료진·진료·Article·Breadcrumb·FAQ 정보를 본문과 연결. 작성자와 검토자 역할을 구분합니다.</dd></div>
        <div><dt>검색 공개 정책</dt><dd>공개 페이지 GET/HEAD 응답 일치, 미리보기·회원·관리 화면 검색 제외, 이미지 공개 여부와 검색 허용을 별도로 적용.</dd></div>
        <div><dt>수집 안내</dt><dd><a href="/sitemap.xml">XML 사이트맵</a> · <a href="/robots.txt">robots.txt</a> · <a href="/column/rss.xml">칼럼 RSS</a> · <a href="/llms.txt">AI 참고 목차</a>. 공개 게시물만 사이트맵에 포함하며 납품 안내는 제외합니다.</dd></div>
        <div><dt>공유 · 이미지 · 모바일</dt><dd>Open Graph·Twitter 카드, 실제 사진의 대체텍스트·크기·반응형 소스, 폰트 경량화, 모바일 확대 허용, 키보드·모션 감소 대체 동작.</dd></div>
      </dl>
      <aside class="handover-note"><h3>검색 최적화와 검색 노출은 다릅니다.</h3><p>Google의 AI 검색은 별도 전용 스키마나 llms.txt를 요구하지 않습니다. FAQ 구조는 질문·답변의 의미를 설명하기 위해 유지하며, Google FAQ 리치결과는 2026년 5월 종료되어 노출을 약속하지 않습니다. 색인·순위·AI 인용은 각 검색 서비스의 판단입니다.</p></aside>
      <section class="handover-verification"><h3>검증 기록</h3><p id="delivery-test-summary">최종 회귀 검사 및 운영 반영 확인 후 이 기록을 확정합니다.</p><p>검사는 자동화된 기술 점검입니다. 의료 내용의 적법성 인증, 모든 실기기 지원 인증, 검색서비스 등록 완료를 의미하지 않습니다.</p></section>
      <details class="handover-reference"><summary>적용 기준 · 공식 문서</summary><ul><li><a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener noreferrer">Google AI 기능과 웹사이트</a></li><li><a href="https://developers.google.com/search/docs/updates#faq-deprecation" target="_blank" rel="noopener noreferrer">Google FAQ 리치결과 종료 안내</a></li><li><a href="https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading" target="_blank" rel="noopener noreferrer">Google 페이지 나눔과 canonical</a></li><li><a href="https://searchadvisor.naver.com/guide/seo-basic-intro" target="_blank" rel="noopener noreferrer">네이버 서치어드바이저 기본 가이드</a></li><li><a href="https://schema.org/Dentist" target="_blank" rel="noopener noreferrer">Schema.org Dentist</a></li></ul></details>
    </section>
    <section id="delivery-operations" class="handover-section">
      <p class="handover-eyebrow">03 / DAILY OPERATIONS</p><h2>처음에는 이 순서로<br>시작하시면 됩니다.</h2>
      <ol class="handover-steps">
        <li><h3>개인 관리자 계정으로 로그인</h3><p><a href="/admin/login">관리자 로그인</a>에서 별도로 전달받은 계정을 사용하세요. 최초 설정 화면이 나오는 경우 안내에 따라 개인 관리책임자 계정을 먼저 만드세요. 계정이 이미 있으면 초기 설정을 반복하지 않습니다.</p></li>
        <li><h3>직원별로 역할 부여</h3><p><a href="/admin/staff">직원 관리</a>에서 관리책임자·접수 담당·콘텐츠 담당을 구분합니다. 접수 담당은 예약 응대, 콘텐츠 담당은 칼럼·공지·사례 관리를 맡습니다. 계정 공유 대신 개인 계정을 사용하세요.</p></li>
        <li><h3>새 접수를 업무판에서 확인</h3><p><a href="/admin/reservations">예약 업무판</a>에서 신청을 열고 담당자·연락 결과·상태·필요한 재연락 일정을 저장합니다. 다른 직원이 먼저 수정했다면 최신 내용을 다시 확인하세요. 네이버 예약은 네이버 관리자에서 별도로 확인합니다.</p></li>
        <li><h3>공지 · 칼럼 · 사례 게시</h3><p><a href="/admin/notices">공지</a>, <a href="/admin/columns">칼럼</a>, <a href="/admin/cases">치료 사례</a>에서 작성·저장 후 게시 여부를 확인합니다. 환자 동의, 사진 비식별화, 의료광고 검토를 먼저 진행하고 치료 후 사진을 일반 칼럼 이미지로 재업로드하지 마세요.</p></li>
        <li><h3>변경사항과 성과 확인</h3><p><a href="/admin/settings">병원 설정</a>에서 지원하는 정보만 수정합니다. 관리책임자는 <a href="/admin/fees">비급여 수가</a>에서 금액·항목별 공개 여부를 수정하고 저장 후 공개 화면을 확인할 수 있습니다. 진료 설명 등 코드로 관리하는 항목은 제작 담당자에게 변경을 요청하세요. <a href="/admin/stats">통계</a>의 클릭은 실제 내원이나 네이버 예약 완료 건수와 다릅니다.</p></li>
      </ol>
      <aside class="handover-note handover-note-important"><h3>현재는 새 접수를 직접 확인해 주세요.</h3><p>자동 이메일 알림과 Google 로그인은 현재 운영 연동이 활성화되지 않았습니다. 이메일 알림이 온다고 가정하지 말고 업무판을 정기적으로 확인하세요. 별도 연동 정보를 설정하고 실제 발송·로그인 검증을 마친 뒤 사용해야 합니다. 외부 통합통계 데이터 연결도 인증정보 재설정 후 확인이 필요하며, 기존 로컬 조회·예약 동선 통계는 관리자에서 확인할 수 있습니다.</p></aside>
    </section>
    <section id="delivery-checklist" class="handover-section">
      <p class="handover-eyebrow">04 / ACCEPTANCE CHECKLIST</p><h2>병원에서 마지막으로<br>확인해 주세요.</h2>
      <p>아래 항목은 병원 담당자의 최종 확인이 필요합니다. 인쇄한 안내에 체크하거나 별도 인수 기록으로 보관하세요.</p>
      <ul class="handover-checklist"><li>병원명·주소·전화·진료시간·주차 안내가 실제 운영과 일치하는지</li><li>의료진 약력·진료 설명·가격·개인정보처리방침·치료 사진 동의 및 의료광고 검토</li><li>관리책임자 로그인, 직원별 역할, 새 접수 확인 담당자와 확인 주기</li><li>실제 iPhone·Android·카카오 인앱브라우저에서 메뉴·스크롤·예약 화면 확인</li><li>네이버 공식 예약 주소와 병원 네이버 관리자 접근권한 확인</li><li>Google Search Console·네이버 서치어드바이저 소유권 확인 및 사이트맵 제출</li><li>병원 전용 도메인 사용 여부와 전환 시 대표주소·리디렉션·검색 등록 이전 계획</li><li>운영 DB·사진 저장소의 별도 백업 담당자, 보관 위치와 복구 절차</li><li>외부 통계 연동의 인증정보 재설정, Clarity·방문 분석 도구의 동의·개인정보 고지 확인</li></ul>
      <p class="handover-caption">소유확인 태그를 지원하는 것과 검색서비스 계정에서 등록·제출을 완료하는 것은 별개입니다. 관리자 설정에 제공받은 확인값을 입력한 뒤 각 서비스에서 소유확인을 마쳐야 합니다.</p>
    </section>
    <section id="delivery-limits" class="handover-section">
      <p class="handover-eyebrow">05 / KEEP IN MIND</p><h2>안정적인 운영을 위한<br>몇 가지 약속.</h2>
      <div class="handover-grid"><section class="handover-card"><h3>정보는 필요한 사람에게만</h3><p>퇴사·역할 변경 시 계정을 즉시 정리하세요. 환자정보나 비밀번호를 공개 공지·칼럼·이 안내 페이지에 넣지 마세요. 예약 자료 삭제는 범위와 보존 의무를 확인한 관리책임자만 진행합니다.</p></section><section class="handover-card"><h3>코드 백업 ≠ 환자 데이터 백업</h3><p>코드 저장소와 일반 코드 백업에는 운영 예약 DB·사진 저장소가 포함되지 않습니다. 운영 데이터는 별도 보관·복구 계획이 필요합니다. 자동 알림, 다중인증, 자동 장애 모니터링, 복구 훈련까지 완료된 납품으로 간주하지 않습니다.</p></section></div>
      <p>진료 콘텐츠는 정기적으로 의료진이 검토하고 실제 변경 시에만 검토일을 갱신하세요. 지역별 안내는 내용의 고유성과 실제 이동정보를 확인하며 관리하고, 검색 노출만을 위한 유사 페이지 확장은 지양합니다.</p>
      <p class="handover-signoff">환자에게는 편안한 첫 만남을.<br><strong>병원에는 관리할 수 있는 일상을.</strong></p>
      <a href="/" class="btn btn-primary">서울도담치과 홈페이지로</a>
    </section>
  </article><script src="/static/handover.js?v=1" defer></script>`
  return c.html(Layout(c, { title: '홈페이지 납품·운영 안내', description: '서울도담치과 홈페이지의 납품 범위, 검색 최적화, 관리자 운영 방법과 병원 인수 확인사항을 안내합니다.', path: '/handover', noindex: true, bodyClass: 'handover-page', crumbs: [{ name: '홈', href: '/' }, { name: '납품·운영 안내', href: '/handover' }] }, body))
}
