// ============================================================
// 서울도담치과의원(dodamdc.kr) 관리자 통합 통계 — 중앙 대시보드(PF Web Engine) 연동
// 렌더 로직은 clients/mgbestdc/src/pages/stats.ts 와 동일 (FontAwesome 미사용 → 아이콘 제거, 도담 CSS 변수로 매핑)
// 토큰은 서버사이드 API 호출에만 사용
// ============================================================
import { raw } from 'hono/html'

const STATS_API_URL = 'https://pf-dashboard-2nt.pages.dev/api/stats/dodamdc.kr'
export const STATS_TOKEN = 'b534f424fd8e770bb0829dfce15c61690852219f0abe17bc'
export const MASTER_KEY = 'pfwe-b4f42f06'

export async function fetchSiteStats(): Promise<any | null> {
  try {
    const res = await fetch(STATS_API_URL, { headers: { Authorization: `Bearer ${STATS_TOKEN}` } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ---------- 유틸 ----------
function escS(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
const fmt = (n: any) => (n == null || isNaN(Number(n)) ? '—' : Number(n).toLocaleString('ko-KR'))

function deltaBadge(v: number | null | undefined, invert = false): string {
  if (v == null || !isFinite(Number(v))) return ''
  const n = Number(v)
  if (n === 0) return `<span class="stx-delta flat">— 0%</span>`
  const up = n > 0
  const good = invert ? !up : up
  return `<span class="stx-delta ${good ? 'good' : 'bad'}">${up ? '▲' : '▼'} ${Math.abs(n).toFixed(1)}%</span>`
}

function sparkline(values: number[], color: string): string {
  if (!values || values.length < 2) return '<div class="stx-spark-empty">데이터 수집 중</div>'
  const w = 600, h = 70
  const max = Math.max(...values, 1)
  const stepX = w / (values.length - 1)
  const pts = values.map((v, i) => [i * stepX, h - 8 - (v / max) * (h - 18)] as const)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  const last = pts[pts.length - 1]
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:70px;display:block" role="img" aria-label="추이 그래프">
    <path d="${area}" fill="${color}" opacity="0.08"/>
    <path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="${color}"/>
  </svg>`
}

// ---------- 규칙 기반 인사이트 ----------
function buildInsights(d: any): string[] {
  const out: string[] = []
  const g = d?.gsc, a = d?.ga, ai = d?.ai
  if (!d || !d.configured) {
    return [
      '중앙 대시보드 데이터 연동이 완료되면 이 자리에 자동 인사이트가 표시됩니다.',
      '사이트맵·IndexNow·구조화데이터 등 검색 가속 세팅은 이미 적용되어 운영 중입니다.',
      '공지·건강칼럼 콘텐츠가 쌓일수록 롱테일 키워드 노출이 먼저 늘어납니다.',
    ]
  }
  if (g) {
    if ((g.clicks ?? 0) < 100) {
      out.push(`최근 28일 검색 클릭 ${fmt(g.clicks)}회 — 아직 색인·순위 안착 단계입니다. 지금은 클릭보다 노출(${fmt(g.impressions)}회) 증가 추세가 더 중요한 신호입니다.`)
    } else if (g.delta?.clicks != null) {
      out.push(
        g.delta.clicks >= 0
          ? `최근 28일 검색 클릭 ${fmt(g.clicks)}회 — 직전 기간 대비 ${Number(g.delta.clicks).toFixed(1)}% 증가했습니다.`
          : `최근 28일 검색 클릭 ${fmt(g.clicks)}회 — 직전 기간 대비 ${Math.abs(Number(g.delta.clicks)).toFixed(1)}% 감소했습니다. 계절 요인 또는 순위 변동을 지켜볼 필요가 있습니다.`
      )
    }
    if ((g.impressions ?? 0) >= 200 && g.ctr != null && g.ctr < 0.02) {
      out.push(`노출 대비 클릭률(CTR ${(g.ctr * 100).toFixed(1)}%)이 아직 낮습니다. 노출이 쌓이는 초기에는 자연스러운 현상이며, 순위가 오르면 클릭률도 함께 개선됩니다.`)
    }
    if (g.position != null) {
      out.push(
        g.position <= 10
          ? `평균 노출 순위 ${Number(g.position).toFixed(1)}위 — 검색 1페이지에 노출되는 키워드가 형성되고 있습니다.`
          : `평균 노출 순위 ${Number(g.position).toFixed(1)}위 — 롱테일 키워드부터 순위가 형성되는 정상적인 초기 흐름입니다.`
      )
    }
    if (g.topQueries?.length) out.push(`가장 많이 유입된 검색어는 "${escS(g.topQueries[0].query)}" 입니다.`)
  }
  if (a && (a.leads ?? 0) > 0) out.push(`예약·상담 등 전환(리드)이 최근 28일 ${fmt(a.leads)}건 발생했습니다.`)
  if (ai && (ai.sessions ?? 0) > 0) out.push(`ChatGPT 등 AI 검색을 통한 방문이 ${fmt(ai.sessions)}회(전체 세션의 ${ai.share}%) 발생했습니다. AEO 구조가 작동하고 있다는 신호입니다.`)
  while (out.length < 3) {
    const fillers = [
      '사이트맵·IndexNow·구조화데이터 등 검색 가속 세팅이 적용되어 운영 중입니다.',
      '콘텐츠가 쌓일수록 지역+진료 조합 키워드의 노출이 단계적으로 늘어납니다.',
      '검색 순위는 6개월 이후 본격적인 경쟁 구간에 진입합니다.',
    ]
    const f = fillers[out.length % fillers.length]
    if (out.includes(f)) break
    out.push(f)
  }
  return out.slice(0, 5)
}

// ---------- 렌더 ----------
const TIMELINE = [
  { p: '0~1개월', t: '색인' },
  { p: '1~3개월', t: '롱테일 노출' },
  { p: '3~6개월', t: '지역+진료 키워드' },
  { p: '6개월~', t: '경쟁 키워드 본순위' },
]

function timelineHtml(): string {
  return `<div class="stx-timeline">${TIMELINE.map((s, i) => `
    <div class="stx-tl-step">
      <div class="stx-tl-dot">${i + 1}</div>
      <div class="stx-tl-period">${s.p}</div>
      <div class="stx-tl-label">${s.t}</div>
    </div>`).join('<div class="stx-tl-line"></div>')}</div>`
}

function expectationCard(large: boolean): string {
  if (large) {
    return `<section class="stx-expect stx-expect-lg">
      <div class="stx-expect-icon"></div>
      <h2>검색 순위는 시간이 필요합니다</h2>
      <p>신규 사이트는 색인과 순위 안착까지 시간이 걸립니다. 본격적인 순위 경쟁은 개설 6개월부터 시작됩니다.<br/>사이트맵·IndexNow·구조화데이터 등 검색 가속 세팅은 모두 완료되어 있습니다.</p>
      ${timelineHtml()}
    </section>`
  }
  return `<section class="stx-expect stx-expect-sm">
    <div class="stx-expect-sm-head">검색 순위는 시간이 필요합니다</div>
    ${timelineHtml()}
  </section>`
}

function metricCard(label: string, value: string, delta: string, icon: string): string {
  return `<div class="stx-card">
    <div class="stx-card-label">${label}</div>
    <div class="stx-card-value">${value}</div>
    <div class="stx-card-foot">${delta}</div>
  </div>`
}

function tableHtml(title: string, heads: string[], rows: string[][]): string {
  if (!rows.length) return `<div class="stx-table-wrap"><h3>${title}</h3><div class="stx-empty">데이터 수집 중입니다</div></div>`
  return `<div class="stx-table-wrap"><h3>${title}</h3>
  <table class="stx-table">
    <thead><tr>${heads.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((cell, i) => `<td class="${i === 0 ? 'tl' : 'tr'}">${cell}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`
}

const AI_SOURCE_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT', perplexity: 'Perplexity', claude: 'Claude', gemini: 'Gemini', etc: '기타 AI',
}

// ---------- 행동 분석 (Microsoft Clarity) ----------
const CLARITY_URL = 'https://clarity.microsoft.com/projects/view/yenge7hmxi/dashboard'

function secFmt(n: any): string {
  if (n == null || isNaN(Number(n))) return '—'
  const s = Math.round(Number(n))
  return s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`
}
const pct1 = (n: any) => (n == null || isNaN(Number(n)) ? '—' : `${Number(n).toFixed(1)}%`)

function clarityInsights(cl: any): string[] {
  const out: string[] = []
  if ((cl.rageClickPct ?? 0) >= 1 || (cl.deadClickPct ?? 0) >= 5) out.push('화면 반응이 없어 반복 클릭하는 사용자가 있습니다 (UI 답답 신호)')
  if (cl.avgScrollDepth != null && cl.avgScrollDepth < 40 && (cl.sessions ?? 0) >= 30) out.push('첫 화면에서 이탈이 많습니다')
  if ((cl.scriptErrors ?? 0) > 0) out.push(`스크립트 오류 ${fmt(cl.scriptErrors)}건 감지 — 점검 필요`)
  if ((cl.quickbackPct ?? 0) >= 8) out.push('들어왔다 바로 나가는 비율이 높습니다')
  if (!out.length && (cl.sessions ?? 0) > 0) out.push('특이 신호 없음')
  return out
}

function claritySub(s: string): string {
  return `<span class="stx-sub">${s}</span>`
}

function claritySection(cl: any): string {
  let s = `<div class="stx-sec">행동 분석 <span>Clarity · 최근 3일</span><a class="stx-clarity-link" href="${CLARITY_URL}" target="_blank" rel="noopener">Clarity 대시보드 </a></div>`
  if (!cl) {
    s += `<div class="stx-empty">Clarity 수집 대기 중</div>`
    return s
  }
  s += `<div class="stx-grid">
    ${metricCard('세션', fmt(cl.sessions), cl.botSessions != null ? claritySub(`봇 ${fmt(cl.botSessions)}`) : '', 'fa-users')}
    ${metricCard('사용자', fmt(cl.users), '', 'fa-user')}
    ${metricCard('평균 스크롤', pct1(cl.avgScrollDepth), '', 'fa-angles-down')}
    ${metricCard('참여시간', secFmt(cl.engagementSec), cl.activeSec != null ? claritySub(`활성 ${secFmt(cl.activeSec)}`) : '', 'fa-stopwatch')}
    ${metricCard('레이지 클릭', cl.rageClicks != null ? `${fmt(cl.rageClicks)}건` : '—', claritySub(pct1(cl.rageClickPct)), 'fa-bolt')}
    ${metricCard('데드 클릭', cl.deadClicks != null ? `${fmt(cl.deadClicks)}건` : '—', claritySub(pct1(cl.deadClickPct)), 'fa-ban')}
    ${metricCard('퀵백', cl.quickbacks != null ? `${fmt(cl.quickbacks)}건` : '—', claritySub(pct1(cl.quickbackPct)), 'fa-rotate-left')}
    ${metricCard('스크립트 오류', cl.scriptErrors != null ? `${fmt(cl.scriptErrors)}건` : '—', claritySub(pct1(cl.scriptErrorPct)), 'fa-bug')}
  </div>`
  const ins = clarityInsights(cl)
  if (ins.length) {
    s += `<section class="stx-insight"><h3>행동 신호</h3><ul>${ins.map((l) => `<li>${l}</li>`).join('')}</ul></section>`
  }
  return s
}

const STATS_CSS = `
.stx-wrap{--ink-3:var(--gray-2);--brand-2:var(--brand-dark);--r:var(--radius-lg)}
.stx-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.stx-head .hint{margin:0}
.stx-range{color:var(--ink-3);font-size:0.82rem}
.stx-expect{background:#fff;border:1px solid var(--line);border-radius:var(--r);margin-bottom:22px}
.stx-expect-lg{padding:38px 30px;text-align:center;background:linear-gradient(165deg,#EAF1FD 0%,#fff 45%);border-color:#C6D8F0}
.stx-expect-icon{width:52px;height:52px;border-radius:14px;background:#EAF1FD;color:var(--brand);display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin:0 auto 16px}
.stx-expect-lg h2{font-size:1.4rem;font-weight:800;margin-bottom:12px;color:var(--ink)}
.stx-expect-lg p{color:var(--ink-2);font-size:0.92rem;line-height:1.8;margin-bottom:24px}
.stx-expect-sm{padding:16px 20px}
.stx-expect-sm-head{font-weight:800;font-size:0.9rem;color:var(--brand);margin-bottom:10px}
.stx-timeline{display:flex;align-items:stretch;justify-content:center;flex-wrap:wrap}
.stx-tl-step{flex:1;min-width:105px;text-align:center;padding:4px}
.stx-tl-dot{width:28px;height:28px;border-radius:50%;background:#EAF1FD;border:1px solid var(--brand);color:var(--brand);font-weight:800;font-size:0.78rem;display:flex;align-items:center;justify-content:center;margin:0 auto 7px}
.stx-tl-period{font-size:0.7rem;color:var(--brand);font-weight:800;margin-bottom:2px}
.stx-tl-label{font-size:0.8rem;color:var(--ink-2)}
.stx-tl-line{flex:0 0 20px;height:1px;background:#C6D8F0;align-self:center;margin-top:-22px}
.stx-pending{background:#fff;border:1px dashed var(--line);border-radius:var(--r);padding:40px 20px;text-align:center;margin-bottom:22px}
.stx-pending i{font-size:1.5rem;color:var(--ink-3);margin-bottom:12px}
.stx-pending h3{font-size:1.02rem;margin-bottom:6px}
.stx-pending p{color:var(--ink-3);font-size:0.86rem;line-height:1.7}
.stx-sec{font-size:0.95rem;font-weight:800;margin:26px 0 12px;color:var(--ink)}
.stx-sec span{font-size:0.72rem;color:var(--ink-3);font-weight:600;margin-left:8px}
.stx-clarity-link{font-size:0.72rem;color:var(--brand);font-weight:700;margin-left:10px;border:1px solid #C6D8F0;padding:3px 10px;border-radius:99px;text-decoration:none;transition:background .2s}
.stx-clarity-link:hover{background:#EAF1FD}
.stx-clarity-link i{font-size:0.62rem;margin-left:2px}
.stx-sub{font-size:0.72rem;color:var(--ink-3);font-weight:600}
.stx-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
@media(max-width:820px){.stx-grid{grid-template-columns:repeat(2,1fr)}}
.stx-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px 18px}
.stx-card-label{font-size:0.74rem;color:var(--ink-3);font-weight:700;margin-bottom:8px}
.stx-card-label i{color:var(--brand);margin-right:4px}
.stx-card-value{font-size:1.55rem;font-weight:800;color:var(--ink)}
.stx-card-value em{font-style:normal;font-size:0.85rem;color:var(--brand)}
.stx-card-foot{margin-top:6px;min-height:18px}
.stx-delta{font-size:0.72rem;font-weight:800;padding:2px 8px;border-radius:99px}
.stx-delta.good{color:#16A34A;background:#EAF6EE}
.stx-delta.bad{color:#DC2626;background:#FEF2F2}
.stx-delta.flat{color:var(--ink-3);background:#F1F3F7}
.stx-spark{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:16px 18px 10px;margin-bottom:8px}
.stx-spark-title{font-size:0.74rem;color:var(--ink-3);font-weight:700;margin-bottom:8px}
.stx-spark-empty{color:var(--ink-3);font-size:0.82rem;padding:18px 0;text-align:center}
.stx-insight{background:linear-gradient(165deg,#EAF1FD 0%,#fff 55%);border:1px solid #C6D8F0;border-radius:var(--r);padding:20px 24px;margin:24px 0}
.stx-insight h3{font-size:0.92rem;color:var(--brand);margin-bottom:10px}
.stx-insight ul{list-style:none;margin:0;padding:0}
.stx-insight li{font-size:0.87rem;color:var(--ink-2);line-height:1.7;padding:5px 0 5px 18px;position:relative}
.stx-insight li::before{content:'·';color:var(--brand);position:absolute;left:5px;font-weight:900}
.stx-tables{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:900px){.stx-tables{grid-template-columns:1fr}}
.stx-table-wrap{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:18px}
.stx-table-wrap h3{font-size:0.85rem;margin-bottom:10px}
.stx-table{width:100%;border-collapse:collapse;font-size:0.82rem}
.stx-table th{background:transparent;text-align:right;color:var(--ink-3);font-size:0.7rem;padding:5px 8px;border-bottom:1px solid var(--line)}
.stx-table th:first-child{text-align:left}
.stx-table td{padding:7px 8px;border-top:none;border-bottom:1px solid var(--bg);color:var(--ink-2)}
.stx-table td.tl{text-align:left;max-width:0;width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.stx-table td.tr{text-align:right;font-variant-numeric:tabular-nums}
.stx-table tr:hover td{background:transparent}
.stx-path{color:var(--brand-2)}
.stx-empty{color:var(--ink-3);font-size:0.82rem;padding:20px 0;text-align:center}
`

export function AdminStats(d: any) {
  const configured = !!(d && d.configured)
  const g = d?.gsc, a = d?.ga, ai = d?.ai
  const lowTraffic = !configured || !g || (g.clicks ?? 0) < 100
  const range = d?.range ? `${d.range.start} ~ ${d.range.end}` : ''

  let inner = `<style>${STATS_CSS}</style><div class="stx-wrap">`
  inner += `<div class="stx-head"><p class="hint">검색·방문·AI 유입 성과 — 서울도담치과의원(dodamdc.kr) · 중앙 대시보드 연동</p>
    ${range ? `<span class="stx-range">${range}</span>` : ''}</div>`

  inner += expectationCard(lowTraffic)

  if (!configured) {
    inner += `<section class="stx-pending">
      
      <h3>데이터 연동 대기 중</h3>
      <p>검색콘솔·애널리틱스 데이터 연동이 준비되는 대로 이 페이지에 지표가 자동 표시됩니다.</p>
    </section>`
    inner += `<section class="stx-insight"><h3>자동 인사이트</h3><ul>${buildInsights(d).map((l) => `<li>${l}</li>`).join('')}</ul></section>`
    return raw(inner + '</div>')
  }

  inner += `<div class="stx-sec">검색 성과 <span>Google Search Console · 최근 28일</span></div>`
  if (g) {
    inner += `<div class="stx-grid">
      ${metricCard('검색 클릭', fmt(g.clicks), deltaBadge(g.delta?.clicks), 'fa-arrow-pointer')}
      ${metricCard('검색 노출', fmt(g.impressions), deltaBadge(g.delta?.impressions), 'fa-eye')}
      ${metricCard('CTR', g.ctr != null ? (g.ctr * 100).toFixed(1) + '%' : '—', deltaBadge(g.delta?.ctr), 'fa-percent')}
      ${metricCard('평균 순위', g.position != null ? Number(g.position).toFixed(1) + '위' : '—', deltaBadge(g.delta?.position, true), 'fa-ranking-star')}
    </div>`
    inner += `<div class="stx-spark"><div class="stx-spark-title">일별 검색 클릭</div>${sparkline((g.dailyClicks ?? []).map((x: any) => Number(x.clicks) || 0), '#0C5B9D')}</div>`
  } else {
    inner += `<div class="stx-empty">검색콘솔 데이터 수집 중입니다</div>`
  }

  inner += `<div class="stx-sec">방문 성과 <span>Google Analytics · 최근 28일</span></div>`
  if (a) {
    inner += `<div class="stx-grid">
      ${metricCard('사용자', fmt(a.users), deltaBadge(a.delta?.users), 'fa-user')}
      ${metricCard('세션', fmt(a.sessions), deltaBadge(a.delta?.sessions), 'fa-chart-simple')}
      ${metricCard('리드(전환)', fmt(a.leads), deltaBadge(a.delta?.leads), 'fa-phone')}
      ${metricCard('AI 유입', ai ? `${fmt(ai.sessions)} <em>(${ai.share ?? 0}%)</em>` : '—', ai ? deltaBadge(ai.delta) : '', 'fa-robot')}
    </div>`
    inner += `<div class="stx-spark"><div class="stx-spark-title">일별 사용자</div>${sparkline((a.dailyUsers ?? []).map((x: any) => Number(x.users) || 0), '#00B4E5')}</div>`
  } else {
    inner += `<div class="stx-empty">${d.hasGa ? '애널리틱스 데이터 수집 중입니다' : '애널리틱스 연동 대기 중입니다'}</div>`
  }

  inner += claritySection(d?.clarity)

  inner += `<section class="stx-insight"><h3>자동 인사이트</h3><ul>${buildInsights(d).map((l) => `<li>${l}</li>`).join('')}</ul></section>`

  inner += `<div class="stx-tables">`
  inner += tableHtml('상위 검색어 TOP 10', ['검색어', '클릭', '노출'],
    (g?.topQueries ?? []).slice(0, 10).map((q: any) => [escS(q.query), fmt(q.clicks), fmt(q.impressions)]))
  inner += tableHtml('상위 페이지 TOP 10', ['페이지', '클릭', '노출'],
    (g?.topPages ?? []).slice(0, 10).map((q: any) => [`<span class="stx-path">${escS(String(q.page ?? '').replace(/^https?:\/\/[^/]+/, '') || '/')}</span>`, fmt(q.clicks), fmt(q.impressions)]))
  const aiRows = ai
    ? Object.entries(ai.bySource ?? {}).filter(([, v]) => Number(v) > 0).sort((x, y) => Number(y[1]) - Number(x[1])).map(([k, v]) => [AI_SOURCE_LABELS[k] ?? escS(k), fmt(v), ''])
    : []
  inner += tableHtml('AI 소스별 유입', ['AI 소스', '세션', ''], aiRows)
  inner += `</div>`

  return raw(inner + '</div>')
}
