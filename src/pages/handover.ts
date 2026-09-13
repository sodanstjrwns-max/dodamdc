import { html } from 'hono/html'
import type { Context } from 'hono'
import type { Env } from '../lib/types'
import { terms } from '../data/encyclopedia'
import { areaPages } from '../data/areas'
import { treatments } from '../data/treatments'

export function handoverPage(c: Context<Env>) {
  // The owner explicitly requested visible credentials after being told this URL is public.
  // Render the existing secret only here, escaped, never in source, assets, metadata or logs.
  // Do not extend that disclosure to immutable deployment / sandbox preview hostnames.
  const url = new URL(c.req.url)
  const deliveryOrigin = url.origin === c.get('siteUrl') || ['localhost', '127.0.0.1'].includes(url.hostname)
  const adminPassword = deliveryOrigin ? c.env.ADMIN_PASSWORD : ''
  c.header('Cache-Control', 'private, no-store, max-age=0, no-transform')
  // Disable edge-injected analytics as well as application analytics on this document.
  c.header('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'")
  c.header('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
  c.header('Referrer-Policy', 'no-referrer')
  return c.html(html`<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet"><meta name="referrer" content="no-referrer">
<title>서울도담치과의원 홈페이지 납품 안내서</title>
<meta name="description" content="서울도담치과 홈페이지의 가치와 구성, 콘텐츠 운영 방법, 관리자 사용법, 수정 지원과 결제 안내.">
<link rel="canonical" href="https://dodamdc.kr/handover"><link rel="icon" href="/favicon.png">
<link rel="preload" href="/static/fonts/WantedSansCore-v2.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/static/fonts/wanted-subsets.css?v=2">
<link rel="stylesheet" href="/static/handover.css?v=5">
</head><body class="handover-page"><main id="main" class="handover-document">
  <header class="cover">
    <a class="handover-brand" href="/" aria-label="서울도담치과 홈페이지"><img src="/static/img/logo-wide.png" alt="서울도담치과" width="176" height="44"></a>
    <p class="eyebrow">WEBSITE HANDOVER DOCUMENT</p>
    <h1>서울도담치과의원<br><span class="accent">공식 홈페이지</span> 납품 안내서</h1>
    <p class="sub">좋은 진료가 검색엔진과 AI를 통해 발견되고,<br><b>시간이 지날수록 쌓이는 SEO·AEO 자산</b>으로서의 홈페이지를 전해 드립니다.</p>
    <p class="meta"><b>도메인</b> dodamdc.kr · <b>받는 분</b> 한휘림 대표원장님 · <b>제작</b> 문석준</p>
  </header>
  <div class="document-body">
    <p class="lead">안녕하세요, 한휘림 원장님. 늦은 밤까지 <b>하얗게 불태워 서울도담치과의원 공식 홈페이지(dodamdc.kr)</b> 납품을 완료했습니다.<br>병원의 미래 성장을 함께 만들어갈 홈페이지라고 자신합니다. 단순히 ‘예쁜 홈페이지’ 하나가 아니라, <b>좋은 진료와 콘텐츠가 쌓일수록 광고비 의존도를 낮춰갈 수 있는 자산</b>을 만들어 드렸습니다. 이 홈페이지는 아래 <b>세 가지</b>를 담고 있습니다.</p>

    <section id="delivery-scope">
      <p class="sec-num">CORE PURPOSE</p><h2>이 홈페이지가 담고 있는 <span class="em">세 가지</span></h2>
      <p class="sec-desc">이 세 가지를 모두 충족하도록 한 줄 한 줄 설계했습니다.</p>
      <ol class="flow purpose-flow">
        <li class="step"><span class="dot">1</span><div><strong>SEO</strong> — 검색엔진이 우리 사이트를 찾고 이해하도록 <small>(네이버·구글·빙)</small></div></li>
        <li class="step"><span class="dot">2</span><div><strong>AEO</strong> — AI가 병원과 진료 정보를 참고할 수 있도록 <small>(ChatGPT·Claude·Perplexity 등)</small></div></li>
        <li class="step"><span class="dot">3</span><div><strong>체류시간</strong> — 사람이 실제로 보고 ‘내원’을 결정할 수 있도록 <small>(읽히는 콘텐츠·심리 흐름)</small></div></li>
      </ol>
      <aside class="callout"><p class="title">이 홈페이지의 최대 의의는 SEO·AEO입니다.</p><p>검색엔진과 AI가 우리 병원을 <strong>‘발견하고·이해하고·답변의 근거로 참고’</strong>할 수 있게 만드는 것. 여기에 환자가 믿고 읽을 수 있는 내용을 더하는 것이 광고비에만 기대지 않는 성장의 출발점입니다.</p></aside>
      <p>그래서 이 홈페이지는 <strong>‘로봇이 이해하기 좋은’ 특성</strong>을 의도적으로 많이 담고 있습니다. 진료 안내를 상세하게 써둔 부분이나 수백 개의 백과사전·지역별 안내는, 사람이 처음부터 끝까지 모두 읽길 기대한 콘텐츠가 아닙니다.</p>
      <p>“왜 이렇게 글이 많고 깊지?” 싶은 페이지가 있다면, 서로 다른 질문으로 들어오는 환자에게 필요한 답을 건네기 위한 자리라고 생각해 주세요. <strong>크롤러에게는 의미 있는 정보, 환자에게는 치료를 이해하는 안내서</strong>가 되는 것이 목적입니다. 단순히 페이지 숫자를 늘리는 것보다 정확하고 유용한 답을 쌓는 것이 중요합니다.</p>
    </section>

    <section id="delivery-highlights">
      <p class="sec-num">HIGHLIGHTS</p><h2>이 홈페이지의 백미 — <span class="em">세 가지 핵심 가치</span></h2>
      <p class="sec-desc">단순 디자인이 아니라 ‘검색·신뢰·전환’을 설계한 결과물입니다.</p>
      <h3><span class="badge">1</span>SEO·AEO로 준비한 ‘검색되는 홈페이지’</h3>
      <p>환자들은 “수원 화서동 신경치료”, “치아 신경을 살릴 수 있나요”, “화서역 임플란트”를 검색하고, AI에게도 질문합니다. 서울도담치과의 진료 철학과 설명이 이런 질문에 연결될 수 있도록 기반을 만들었습니다.</p>
      <ul>
        <li><strong>검색엔진 최적화(SEO)</strong> — 페이지별 제목·설명·대표주소(canonical), H1과 소제목 구조, Open Graph, 사이트맵과 내부 링크를 정리했습니다. 대표주소는 <a href="https://dodamdc.kr">dodamdc.kr</a>로 통일했습니다.</li>
        <li><strong>AI 답변을 위한 정보 정리(AEO)</strong> — 병원 정보·진료 원칙·의료진·공식 안내를 연결하는 <a href="/llms.txt">llms.txt</a> 목차와 질문·답변형 콘텐츠를 준비했습니다. AI도 원문을 따라가며 맥락을 이해할 수 있게 했습니다.</li>
        <li><strong>구조화 데이터(Schema)</strong> — 병원·의료진·진료 안내·FAQ·칼럼·공지·백과사전 용어·탐색 경로를 검색엔진이 해석하기 쉬운 형식으로 연결했습니다. 칼럼은 작성자와 게시·수정 날짜를 함께 전달합니다.</li>
        <li><strong>진료 설명의 깊이</strong> — <a href="/treatments/vpt-crown">MTA 생활치수치료·크라운</a> → <a href="/treatments/periodontal">치주치료</a> → <a href="/treatments/implant">임플란트</a>라는 도담의 우선순위를 담았습니다. 증상·진단·치료 과정·주의사항·FAQ·관련 용어까지 이어집니다.</li>
        <li><strong>지역과 실제 방문의 연결</strong> — 화서동·화서역·팔달구·정자동 등 주변 지역의 진료 안내에서 병원 위치·방문 방법·상담으로 이어지게 했습니다.</li>
      </ul>
      <p class="note">검색 수집·실제 색인·순위·AI 인용은 각 서비스가 결정합니다. 구조화 데이터가 특정 검색결과 노출을 보장하지는 않으며, llms.txt 역시 Google 검색의 필수 요건은 아닙니다.</p>

      <h3><span class="badge">2</span>‘비포&애프터 + 칼럼 에디터’ — 채우실수록 강해집니다</h3>
      <p>여기가 <strong>원장님이 직접 운영하셔야 하는 핵심</strong>입니다. 공개 게시물을 올리면 개별 URL이 생기고 사이트맵에 반영됩니다. 칼럼에는 저자·날짜·관련 진료와 검색용 정보가 함께 연결됩니다.</p>
      <ul>
        <li><strong>비포&애프터(치료사례)</strong> — 연령대·성별·치료기간·진료분류·거주 지역·담당 의료진과 치료 설명을 기록할 수 있습니다. 치료 전후 사진을 구분해 올리고, 공개 가능 여부를 확인한 사례를 환자에게 안내합니다.</li>
        <li><strong>칼럼 에디터</strong> — 제목·요약·본문뿐 아니라 검색용 제목·설명·작성 원장·관련 진료·대표 이미지까지 관리합니다. 글 한 편이 또 하나의 구체적인 질문에 답하는 입구가 됩니다.</li>
        <li><strong>저자와 진료의 연결</strong> — 한휘림 원장의 의료진 소개와 작성 글을 연결해 ‘누가 설명한 내용인지’를 분명하게 보여줍니다. 의료 콘텐츠는 실제 경험과 정확한 설명이 중요합니다.</li>
        <li><strong>쓰기 편한 도구</strong> — 소제목·목록·인용·링크·이미지, 이미지 설명 수정, 모바일/PC 미리보기, 전후 사진 교체·삭제를 지원합니다. JavaScript 작성 화면은 저장 오류가 나도 입력을 유지하도록 개선했습니다.</li>
      </ul>
      <aside class="callout"><p class="title">가장 중요한 핵심</p><p>사례와 칼럼은 <strong>꾸준히 업데이트하실수록 병원의 설명과 진료 경험이 축적되는 공간</strong>입니다. 사진만 올리지 마시고, ‘왜 이 치료를 선택했는지’를 함께 적어주세요. 치료 후 사진은 회원 전용이며 환자 동의·비식별화·의료광고 검토가 먼저입니다.</p></aside>

      <h3><span class="badge">3</span>환자의 심리 흐름을 따라가는 콘텐츠 배열</h3>
      <p>페이지 구성이 임의가 아닙니다. <strong>인지 → 공감 → 신뢰 → 결심 → 예약</strong>이라는 환자의 심리 여정, 페이션트 퍼널을 따라 배열했습니다. 도담이 어떤 치과인지 이해하고 상담을 선택하도록 만든 흐름입니다.</p>
      <ol class="flow">
        <li class="step"><span class="dot">1</span><div>“내 치아를 위한 조금 다른 생각, 도담” <small>— 첫인상·자연치아 보존</small></div></li>
        <li class="step"><span class="dot">2</span><div>“지금 어떤 점이 불편하신가요?” <small>— 환자 상황에 맞는 진료 안내</small></div></li>
        <li class="step"><span class="dot">3</span><div>살릴 수 있는 방법이 있다면, 그것부터 <small>— 도담의 철학·신뢰</small></div></li>
        <li class="step"><span class="dot">4</span><div>한휘림 원장이 직접 설명하는 진료 <small>— 누가, 어떤 기준으로 진료하는가</small></div></li>
        <li class="step"><span class="dot">5</span><div>보존·치주·임플란트 중심 진료 <small>— 나에게 필요한 치료 이해</small></div></li>
        <li class="step"><span class="dot">6</span><div>실제 공간·장비·첫 방문 안내 <small>— 낯섦과 걱정을 줄이는 정보</small></div></li>
        <li class="step"><span class="dot">7</span><div>네이버 예약·전화·홈페이지 신청 <small>— 편한 방식으로 행동하기</small></div></li>
      </ol>
    </section>

    <section id="delivery-specs">
      <p class="sec-num">SPECS &amp; HIDDEN GEMS</p><h2>말하지 않으면 모를 <span class="em">자랑들</span></h2>
      <p class="sec-desc">규모뿐 아니라, 겉으로 잘 보이지 않는 운영 기능까지 준비했습니다.</p>
      <div class="stats">
        <div class="stat"><p class="num">701</p><p class="lbl">공개 사이트맵 URL</p></div>
        <div class="stat"><p class="num">${terms.length}</p><p class="lbl">치과 백과사전 용어 페이지</p></div>
        <div class="stat"><p class="num">${areaPages.length}</p><p class="lbl">지역 × 진료 안내 페이지</p></div>
      </div>
      <p class="fine-print">2026년 9월 13일 운영 사이트맵 기준입니다. 701은 제출 가능한 URL 목록의 수이며, 검색엔진에 실제 색인된 페이지 수는 아닙니다. 공개 게시물이 늘면 달라집니다.</p>
      <table class="spec-table"><caption class="sr-only">서울도담치과 홈페이지 구성과 기능</caption><thead><tr><th scope="col">항목</th><th scope="col">내용</th></tr></thead><tbody>
        <tr><th scope="row">전체 공개 안내</th><td><strong>사이트맵 URL 701개</strong> — 병원·의료진·진료·백과사전·지역 안내·공개 콘텐츠를 연결하는 구조입니다.</td></tr>
        <tr><th scope="row">치과 백과사전</th><td><strong>${terms.length}개 용어 페이지</strong> — 어려운 용어를 쉬운 말로 설명하고 관련 진료로 연결합니다.</td></tr>
        <tr><th scope="row">지역 × 진료</th><td><strong>${areaPages.length}개 안내 페이지</strong> — 화서동·화서역·수원 주변 지역과 진료 정보를 연결합니다.</td></tr>
        <tr><th scope="row">자주 묻는 질문</th><td><strong>252개 Q&amp;A</strong> — 병원 이용과 진료별 질문을 검색하고 분류별로 찾아볼 수 있습니다.</td></tr>
        <tr><th scope="row">진료 상세 안내</th><td><strong>${treatments.length}개 진료 페이지</strong> — 핵심 3개 진료와 신경치료·충치·사랑니 등 실제 진료 범위를 안내합니다.</td></tr>
        <tr><th scope="row">실제 병원 사진</th><td>한휘림 원장·진료 공간·장비의 실제 사진 22종과 반응형 경량 이미지를 적용했습니다.</td></tr>
        <tr><th scope="row">입체 치아·모션</th><td>3D 치아 모형, 터치·마우스 회전, 모션 감소 설정과 3D 미지원 환경의 SVG 대체 화면을 제공합니다.</td></tr>
        <tr><th scope="row">예약 응대 업무판</th><td>홈페이지 신청 확인, 담당자·연락 결과·재연락 일정·상태 변경·처리 이력을 관리합니다.</td></tr>
        <tr><th scope="row">공지·진료비 관리</th><td>병원 소식과 대표 공지를 게시하고, 비급여 항목·금액·공개 여부를 관리자에서 수정합니다.</td></tr>
        <tr><th scope="row">빠른 연결 버튼</th><td>네이버 예약·카카오·전화 연결과 모바일 하단 고정 버튼으로 상담 동선을 짧게 만들었습니다.</td></tr>
        <tr><th scope="row">모바일 대응</th><td>작은 화면의 글·이미지·표, 관리자 입력·서식 도구·저장 버튼, 모바일/PC 미리보기를 다듬었습니다.</td></tr>
        <tr><th scope="row">속도·운영 기반</th><td>Cloudflare 엣지, D1 데이터베이스, R2 이미지 저장소와 이미지·폰트 경량화를 사용합니다.</td></tr>
        <tr><th scope="row">검색·접근 분리</th><td>관리 화면은 비로그인 접근을 차단하고 검색 제외합니다. 회원·예약정보와 치료 후 사진은 별도로 접근 권한을 확인합니다.</td></tr>
      </tbody></table>
    </section>

    <section id="delivery-operations">
      <p class="sec-num">ADMIN GUIDE</p><h2>관리자 페이지 <span class="em">사용법</span></h2>
      <p class="sec-desc">원장님이 직접 콘텐츠를 운영하실 수 있도록 정리했습니다.</p>
      <h3>들어가는 방법</h3><ul><li>브라우저에서 <a href="https://dodamdc.kr/admin/login"><strong>https://dodamdc.kr/admin/login</strong></a>에 접속합니다.</li><li>아래 관리자 비밀번호를 입력하면 <strong>바로 관리 화면</strong>으로 들어갑니다. 아이디 입력이나 최초 계정 생성은 필요하지 않습니다.</li></ul>
      <section id="delivery-admin-access" class="credentials" aria-labelledby="admin-access-title" data-nosnippet>
        <h3 id="admin-access-title">관리자 로그인 정보</h3>
        <p class="credential-label">접속 주소</p><p class="credential-url"><a href="https://dodamdc.kr/admin/login">https://dodamdc.kr/admin/login</a></p>
        <p class="credential-label">관리자 비밀번호</p>
        ${adminPassword ? html`<p id="admin-password" class="credential-value" translate="no">${adminPassword}</p><button type="button" class="copy-button" data-copy-target="admin-password">관리자 비밀번호 복사</button>` : html`<p class="credential-unavailable">${deliveryOrigin ? '관리자 비밀번호 설정을 확인해 주세요.' : '실제 로그인 정보는 정식 도메인의 납품 안내서에서 확인해 주세요.'}</p><a href="https://dodamdc.kr/handover#delivery-admin-access">정식 납품 안내서 열기</a>`}
      </section>
      <aside class="warn"><p class="title">로그인 정보가 포함된 안내서입니다.</p><p>원장님 편의를 위해 실제 관리자 비밀번호를 표시했습니다. <strong>이 주소는 링크를 아는 사람이 열 수 있으므로 문서·링크를 외부에 공유하지 않도록 주의해 주세요.</strong> 검색 제외는 접근 잠금이 아닙니다.</p><p>비밀번호를 바꾸고 싶으시면 제작자 문석준에게 말씀해 주세요. 운영 설정에서 변경하며, 기존 비밀번호를 임의로 바꾸지는 않습니다. 공용 관리자 작업은 ‘관리자’로 기록되므로 실제 작업자 개인을 구분하지 못합니다.</p></aside>
      <h3>관리자에서 할 수 있는 것</h3><ul>
        <li><strong>대시보드</strong> — 대기 예약·회원·사례·칼럼·공지와 조회 현황을 한눈에 확인합니다.</li>
        <li><strong>예약 관리</strong> — 홈페이지 신청을 확인하고 담당자·연락 결과·재연락 일정·처리 상태를 기록합니다.</li>
        <li><strong>회원 관리</strong> — 가입 회원을 조회합니다. 예약 내역은 실제 회원 ID에 연결된 접수를 기준으로 표시합니다.</li>
        <li><strong>비포&애프터</strong> — 사례를 작성·수정하고 전후 사진을 구분해 업로드·교체·연결 해제합니다.</li>
        <li><strong>원장 칼럼</strong> — 본문·이미지·작성 원장·관련 진료·검색 정보를 관리합니다.</li>
        <li><strong>공지사항</strong> — 병원 소식을 작성·수정하고 대표 공지와 공개 여부를 설정합니다.</li>
        <li><strong>비급여·통계</strong> — 수가와 공개 여부를 수정하고 자체 조회·예약 동선 통계를 확인합니다.</li>
      </ul>
      <aside class="callout"><p class="title">비포&애프터 올리는 법</p><p><a href="/admin/cases">관리자 → 치료 전후 → 새 사례</a> → 제목·진료분류·담당 의료진·연령대·성별·거주 지역·치료기간·설명을 입력하고 사진을 올립니다.</p><p>설명은 <em>내원 계기 → 진단 → 치료를 선택한 이유 → 과정·결과·주의사항</em> 순서로 작성해 주세요. 구강 사진과 파노라마의 <strong>치료 전 / 치료 후</strong> 슬롯을 구분합니다.</p><p>환자 동의·비식별화·동일 환자 및 부위·의료광고 검토를 마친 뒤 <strong>‘공개’ 체크 → 저장</strong>합니다. 새 사례는 비공개로 시작합니다. <strong>치료 후 사진은 회원 전용</strong>이므로 일반 칼럼이나 공지 이미지로 다시 올리지 마세요. 동의 확인을 대신하는 자동 검수 기능은 아닙니다.</p></aside>
      <aside class="callout"><p class="title">칼럼 쓰는 법</p><p><a href="/admin/columns">관리자 → 원장 칼럼 → 새 칼럼</a> → 제목·요약·본문·작성 원장·관련 진료·대표 이미지를 입력합니다.</p><p><strong>검색용 제목·설명</strong>은 비워두면 기본 내용이 반영되며 직접 작성할 수도 있습니다. 소제목은 H2부터 사용하고, 이미지에는 내용을 설명하는 문구를 넣어 주세요.</p><p><strong>‘작성 내용 미리보기’에서 모바일/PC 폭 확인 → ‘공개’ 체크 → 저장</strong>하면 공개됩니다. 공개를 체크하지 않고 저장하면 비공개 상태로 보관합니다. 게시일은 한국시간으로 입력하며 예약발행 기능은 아닙니다.</p></aside>
      <aside class="callout"><p class="title">공지사항·대표 공지 올리는 법</p><p><a href="/admin/notices">관리자 → 공지사항 → 새 공지</a> → 제목·본문·이미지를 입력합니다.</p><ul><li><strong>대표 공지</strong> — 홈의 공지 노출과 공지 목록에서 우선 안내할 내용을 선택합니다.</li><li><strong>공개</strong> — 체크 후 저장해야 환자에게 보입니다.</li></ul><p>휴진·진료시간 변경·병원 소식에 활용해 주세요. <strong>도담은 대표 공지 방식</strong>이며, 별도 홈 팝업·‘오늘 하루 보지 않기’·팝업 종료일 설정은 현재 기능이 아닙니다.</p></aside>
      <aside class="callout"><p class="title">예약 확인·진료비 수정하기</p><p><a href="/admin/reservations">예약 응대 업무판</a>에서 신규 신청과 연락 이력을 확인합니다. 홈페이지 신청은 병원의 확인 연락 후 확정되며, <strong>네이버 예약은 네이버 관리자에서 따로 확인</strong>해 주세요.</p><p><a href="/admin/fees">비급여 수가 관리</a>에서 항목·금액·공개 여부를 변경한 뒤 공개 페이지와 원내 고지가 일치하는지 확인해 주세요. 예약 파기는 별도의 보유기간 확인·재인증·승인 절차를 사용합니다.</p></aside>
      <p class="note"><b>사진·저장 안내</b><br>JPG·PNG·WebP·GIF, 파일당 8MB를 지원합니다. HEIC는 변환해 주세요. 저장 완료 안내를 확인하고, 연결이 끊겼다면 중복 등록 전에 목록에서 저장 여부를 확인하세요. 자동 저장·브라우저 종료 후 초안 복구·공동편집은 지원하지 않습니다.</p>
      <p class="fine-print">자동 이메일 알림·Google 로그인은 현재 미활성화 상태입니다. 외부 통합통계는 연동 인증정보 확인이 필요합니다. 새 접수는 관리자 업무판에서 확인해 주세요.</p>
    </section>

    <section id="delivery-indexing">
      <p class="sec-num">IMPORTANT</p><h2>가장 중요한 당부 — <span class="em">“검색 색인은 시간이 걸립니다”</span></h2>
      <p class="sec-desc">검색은 광고를 켜듯 바로 완성되는 것이 아니라, 꾸준히 가꾸는 ‘농사’에 가깝습니다.</p>
      <aside class="warn"><p class="title">수집·색인·노출은 서로 다른 단계입니다.</p><p>홈페이지와 사이트맵을 준비했다고 모든 페이지가 바로 검색에 뜨는 것은 아닙니다. 검색엔진의 수집과 평가에는 시간이 걸리며, 사이트·페이지·검색어에 따라 반영 속도가 다릅니다. <strong>‘몇 개월 뒤 반드시 상위 노출’이라는 약속은 드리지 않습니다.</strong></p></aside>
      <p><strong>그래서 중요한 것은 기다리는 동안 사례와 칼럼을 꾸준히 쌓는 일</strong>입니다. 복사한 글보다 원장님이 실제 진료실에서 설명하는 질문과 답, 치료를 판단한 이유를 남겨주세요.</p>
      <ul><li>정확한 글이 쌓일수록 환자의 구체적인 질문에 답할 수 있는 페이지가 늘어납니다.</li><li>Google Search Console·네이버 서치어드바이저에서 수집·색인 상태와 검색어를 확인해 주세요. 소유확인 태그 존재만으로 등록·색인이 완료된 것은 아닙니다.</li><li>오래된 안내·진료시간·비급여·게시물은 주기적으로 확인해 최신 상태로 유지해 주세요.</li></ul>
      <p><strong>한 줄 요약:</strong> “오늘부터 글 한 편, 사례 하나씩.” 기다리는 시간을 콘텐츠가 쌓이는 시간으로 바꿔주세요.</p>
    </section>

    <section id="delivery-growth">
      <p class="sec-num">HOW TO GROW</p><h2>가만히 두면 안 됩니다 — <span class="em">‘돈값 × 100’을 목표로</span></h2>
      <p class="sec-desc">이 홈페이지의 진짜 가치는 ‘납품 시점’이 아니라 ‘앞으로’ 결정됩니다.</p>
      <p>이 홈페이지를 <strong>그대로 내버려두지 않으셨으면 합니다.</strong> 계속해서</p><ul><li><strong>동의와 공개 검토를 마친 치료사례를 꾸준히 올려주시고,</strong></li><li><strong>원장님의 생각과 설명을 담은 칼럼을 꾸준히 남겨주세요.</strong></li></ul>
      <p>저는 이 홈페이지를 <strong>돈값의 100배를 목표로 키워갈 만한 자산</strong>이라고 생각합니다. 수익이나 매출을 보장한다는 뜻이 아니라, 그만큼 오래 제대로 활용해 주셨으면 하는 마음입니다.</p>
      <aside class="callout"><p class="title">왜 콘텐츠를 쌓아야 할까요?</p><p><strong>사례 하나, 글 한 편이 새로운 질문에 답하는 입구가 되기 때문입니다.</strong> “찬물에 시린 치아”, “신경치료 대신 신경을 살릴 수 있나요”, “잇몸치료를 먼저 해야 하나요”처럼 실제 환자의 고민에서 시작해 보세요.</p><p>예를 들어 주 1회, 상담 중 자주 받은 질문을 한 편의 칼럼으로 정리하는 것부터 시작해도 좋습니다. 양보다 정확성, 복제보다 원장님의 설명이 중요합니다.</p></aside>
      <aside class="warn"><p class="title">이 홈페이지를 만드신 목적을 절대 잊지 마세요.</p><p>예쁜 홈페이지를 갖는 것이 목적이 아닙니다. <strong>검색·AI를 통해 발견되고, 좋은 진료를 이해한 환자가 상담을 선택하도록 돕는 것</strong>입니다. 이 목적을 기억하며 꾸준히 채워주시면 홈페이지에 담긴 도담의 자산도 깊어집니다.</p></aside>
    </section>

    <section id="delivery-limits">
      <p class="sec-num">SUPPORT &amp; FEEDBACK</p><h2>베타테스트 &amp; <span class="em">영원한 무상 수정</span></h2>
      <p class="sec-desc">납품은 끝이 아니라 시작입니다. 함께 다듬어 가요.</p>
      <aside class="callout"><p class="title">당분간 베타테스터가 되어 주세요.</p><p>버그와 오류를 잡으려고 정말 열심히 확인했습니다. 그래도 <strong>기기·브라우저마다 반응이 다르고 제가 모든 경우를 확인할 수는 없습니다.</strong> 여러 페이지와 관리자 기능을 직접 써보시고, 잘 되지 않는 부분이 보이면 편하게 말씀해 주세요.</p><p>가능하면 <strong>화면 캡처·사용한 기기·페이지 주소·어떤 동작을 했는지</strong>를 함께 알려주시면 큰 도움이 됩니다. 물론 어떤 방식의 피드백이든 환영합니다.</p></aside>
      <p><strong>원장님이 생각하시는 대부분의 사항은 수정하거나 구현할 방법을 함께 찾을 수 있습니다.</strong> 문구·디자인·배치·기능까지, “이런 것도 되나요?” 싶어도 편하게 전달해 주세요.</p>
      <aside class="note"><p class="title">딱 하나, 제게 없는 실제 사진입니다.</p><p>없는 진료 사진이나 병원 사진을 실제 촬영 자료처럼 대신 만들어드릴 수는 없습니다. 다만 <strong>좋은 사진이나 영상이 생기면 언제든 추가 가능</strong>하니, 동의와 공개 가능 여부를 확인한 자료를 보내주세요.</p></aside>
      <aside class="callout handover-promise"><p class="title">수정 기한은 영원히입니다.</p><p>어디 가지 않고 항상 있을 테니, 걱정 마시고 편하게 연락 주세요.<br>언제든, 어떤 방식의 피드백도 환영합니다.</p></aside>
    </section>

    <section id="delivery-payment">
      <p class="sec-num">PAYMENT</p><h2><span class="em">결제</span> 안내</h2>
      <p class="sec-desc">아래 계좌로 이체해 주시면 세금계산서를 발급해 드립니다.</p>
      <div class="pay"><h3>결제 금액 및 입금 계좌</h3>
        <div class="amount"><p class="bank">홈페이지 납품 금액</p><p class="amount-value">15,000,000<span>원</span></p><p class="holder">일천오백만 원 · 1,500만 원</p></div>
        <div class="acct"><p class="bank">NH 농협</p><p class="no" id="payment-account-number">1085-02-007634</p><p class="holder">예금주 : 문석준</p><button type="button" class="copy-button" data-copy-target="payment-account-number">계좌번호 복사</button></div>
        <ul><li><strong>결제 방법</strong> — 계좌이체로 부탁드립니다.</li><li><strong>세금계산서</strong> — 입금 확인 후 <strong>2주 이내</strong>에 발급해 드립니다.</li><li>카드나 다른 결제 수단이 준비되어 있지 않은 점, 너그러운 양해 부탁드립니다.</li></ul>
      </div>
    </section>
    <p id="handover-copy-status" role="status" aria-live="polite"></p>
    <nav class="document-actions" aria-label="안내서 바로가기"><a href="/">홈페이지 보기</a><a href="#delivery-admin-access">관리자 로그인 정보</a><button type="button" id="handover-print">인쇄 · PDF 저장</button></nav>
  </div>
  <footer class="closing"><p class="q">살릴 수 있는 방법이 하나라도 남아 있으면,<br><span class="em">그것부터 합니다.</span></p><p>서울도담치과의 좋은 진료가 더 많은 환자에게 전해지기를 바랍니다.<br>앞으로도 편하게 연락 주세요.</p><p class="sign"><b>문석준 드림</b><br>서울도담치과의원 공식 홈페이지 · dodamdc.kr</p></footer>
</main><script src="/static/handover.js?v=4" defer></script></body></html>`)
}
