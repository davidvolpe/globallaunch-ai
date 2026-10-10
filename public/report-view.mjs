// GlobalLaunch AI v0.4: dependency-free presentation and print rendering.
// All AI/user-authored strings are HTML-escaped before insertion.
const COUNTRIES = {AU:'Australia',SG:'Singapore',UK:'United Kingdom',US:'United States'};
const COLORS = ['#30ae92','#3478a9','#f4b862','#8276be','#d67e7a'];
export const htmlEsc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeList = x => Array.isArray(x) ? x : [];
export const formattedMoney = (amount,currency='AUD') => Number.isFinite(Number(amount)) ? new Intl.NumberFormat('en-AU',{style:'currency',currency,maximumFractionDigits:0}).format(Number(amount)) : '—';
const h = htmlEsc;
const bulletList = (items, cls='dashboard-list') => `<ul class="${cls}">${safeList(items).map(s=>`<li>${h(s)}</li>`).join('')}</ul>`;
function countryName(code){return COUNTRIES[code] || code;}
function safePercentage(value){return Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):0));}
export function getBudgetSummary(data){
  const lines = safeList(data.report.execution.allocation).map(item=>({channel:String(item.channel||''),amount:Math.max(0,Math.round(Number(item.amount)||0)),percent:safePercentage(item.percent),why:String(item.why||'')}));
  const total = lines.reduce((a,x)=>a+x.amount,0);
  return {lines,total,expected:Number(data.brief.budget),balanced:total===Number(data.brief.budget)};
}
export function getRiskCounts(data){
  return safeList(data.report.risk.flags).reduce((tot,x)=>{if(['high','medium','low'].includes(x.level))tot[x.level]++;return tot;},{high:0,medium:0,low:0});
}
export function budgetChart(data,{compact=false}={}){
  const {lines,total,expected,balanced}=getBudgetSummary(data);
  const currency=data.meta.currency||data.brief.currency||'AUD';
  const denom=total||1;
  let cursor=0;
  const sectors=lines.map((x,i)=>{const from=cursor;cursor+=x.amount/denom*100;return `${COLORS[i%COLORS.length]} ${from.toFixed(3)}% ${cursor.toFixed(3)}%`;});
  const gradient=sectors.length?`conic-gradient(${sectors.join(',')})`:'conic-gradient(#e2e9eb 0% 100%)';
  return `<div class="visual-budget ${compact?'is-compact':''}"><div class="donut-wrap"><div class="donut" role="img" aria-label="预算渠道分配图" style="background:${gradient}"><div class="donut-hole"><span>30 DAYS</span><strong>${h(formattedMoney(total,currency))}</strong><small>Planned spend</small></div></div></div><div class="budget-legend">${lines.map((x,i)=>`<div class="budget-legend-row"><span class="legend-mark" style="background:${COLORS[i%COLORS.length]}"></span><div class="legend-main"><strong>${h(x.channel)}</strong>${compact?'':`<small>${h(x.why)}</small>`}</div><div class="legend-amount"><b>${h(formattedMoney(x.amount,currency))}</b><small>${h(x.percent)}%</small></div></div>`).join('')}${balanced?'':`<p class="calc-warning">⚠ 预算总和 ${h(formattedMoney(total,currency))} 与输入 ${h(formattedMoney(expected,currency))} 不一致，请人工检查。</p>`}</div></div>`;
}
export function timelineView(data,{compact=false}={}){
  const timeline=safeList(data.report.execution.timeline);
  return `<div class="visual-timeline ${compact?'is-compact':''}">${timeline.map((step,i)=>`<article class="roadmap-step"><div class="roadmap-index">${String(i+1).padStart(2,'0')}</div><div class="roadmap-content"><div class="roadmap-week">${h(step.week)}</div><h4>${h(step.title)}</h4>${bulletList(compact?safeList(step.actions).slice(0,2):step.actions)}</div></article>`).join('')}</div>`;
}
export function kpiView(data,{compact=false}={}){
  const kpis=safeList(data.report.execution.kpis);
  return `<div class="kpi-card-grid">${(compact?kpis.slice(0,3):kpis).map((x,i)=>`<article class="kpi-card"><div class="kpi-head"><span>METRIC ${String(i+1).padStart(2,'0')}</span><span class="kpi-spark">↗</span></div><h4>${h(x.name)}</h4><div class="kpi-target">${h(x.target)}</div><p>${h(x.note)}</p></article>`).join('')}</div>`;
}
export function riskView(data,{compact=false}={}){
  const risks=safeList(data.report.risk.flags);const counts=getRiskCounts(data);
  return `<div class="risk-overview"><div class="risk-overview-item high"><strong>${counts.high}</strong><span>HIGH / 高风险</span></div><div class="risk-overview-item medium"><strong>${counts.medium}</strong><span>MEDIUM / 中风险</span></div><div class="risk-overview-item low"><strong>${counts.low}</strong><span>LOW / 低风险</span></div></div><div class="risk-list-v4">${(compact?risks.slice(0,3):risks).map(x=>`<article class="risk-item-v4"><div class="risk-item-title"><span class="risk-severity ${['high','medium','low'].includes(x.level)?x.level:'low'}">${h((x.level||'review').toUpperCase())}</span><strong>${h(x.label)}</strong></div><p>${h(x.issue)}</p><div class="risk-resolution"><span>建议行动</span>${h(x.fix)}</div></article>`).join('')}</div>`;
}
export function overviewView(data){
  const r=data.report,cur=data.meta.currency||data.brief.currency||'AUD';
  const assumptions=safeList(r.strategy.assumptions).slice(0,3);
  return `<div class="overview-kicker">EXECUTIVE DECISION DASHBOARD <span>· 30-DAY LAUNCH</span></div>
    <div class="executive-banner"><div class="executive-eyebrow">STRATEGIC DIRECTION</div><h3>${h(r.strategy.headline)}</h3><p>${h(r.strategy.summary)}</p><div class="executive-label">AI 草稿 · 任何市场判断均须验证</div></div>
    <div class="decision-stats"><div><small>MARKET</small><strong>${h(countryName(data.brief.region))}</strong><span>${h(data.brief.goal)}</span></div><div><small>TEST BUDGET</small><strong>${h(formattedMoney(data.brief.budget,cur))}</strong><span>30-day allocation</span></div><div><small>CHANNELS</small><strong>${h(data.brief.channels.length)}</strong><span>Selected by user</span></div></div>
    <div class="visual-section"><div class="visual-section-head"><span>01 / INVESTMENT</span><h3>预算配置 <small>Allocation</small></h3></div>${budgetChart(data,{compact:true})}</div>
    <div class="visual-section"><div class="visual-section-head"><span>02 / IMPLEMENTATION</span><h3>执行路线 <small>Roadmap</small></h3></div>${timelineView(data,{compact:true})}</div>
    <div class="visual-section"><div class="visual-section-head"><span>03 / MEASUREMENT</span><h3>关键验证指标 <small>KPIs</small></h3></div>${kpiView(data,{compact:true})}</div>
    <div class="visual-section"><div class="visual-section-head"><span>04 / QUALITY GATE</span><h3>风险与人工复核 <small>Risk gates</small></h3></div>${riskView(data,{compact:true})}</div>
    <div class="decision-action"><div><span>WHAT WE STILL NEED TO PROVE</span><strong>待验证的关键假设</strong></div>${bulletList(assumptions)}<p>此仪表盘反映 AI 生成的行动建议，并非已开展的市场调查或实际广告投放结果。</p></div>`;
}
export function executionView(data){
  const x=data.report.execution;
  return `<div class="visual-section-head"><span>ALLOCATE / 01</span><h3>预算策略与渠道拆分</h3></div>${budgetChart(data)}<div class="report-subsection">30天执行时间线</div>${timelineView(data)}<div class="report-subsection">衡量什么才算成功</div>${kpiView(data)}<div class="report-subsection">A/B 实验设计</div><div class="experiments-grid">${safeList(x.experiments).map(v=>`<article class="experiment-card"><div class="experiment-name">${h(v.name)}</div><div class="experiment-variants"><div><span>VARIANT A</span><p>${h(v.a)}</p></div><div><span>VARIANT B</span><p>${h(v.b)}</p></div></div><div class="experiment-metric"><b>衡量指标：</b>${h(v.metric)}</div></article>`).join('')}</div><div class="report-warning">所有预算均为 AI 制定的规划分配，不代表实际投放；KPI 目标需要结合实测设定。</div>`;
}
export function riskDetailView(data){
  const x=data.report.risk;
  return `<div class="report-callout">初步广告风险筛查，不是法律意见，也不代表已通过任何当地监管审查。</div>${riskView(data)}<div class="report-subsection">发布前核查清单</div><div class="checklist-v4">${safeList(x.checklist).map(t=>`<div><span aria-hidden="true">□</span> ${h(t)}</div>`).join('')}</div><p class="export-hint">${h(x.disclaimer)}</p>`;
}
export function buildPrintReport(data){
  const {brief:b,report:r,meta:m}=data;
  const fmt=formattedMoney(b.budget,m.currency||b.currency);
  const date=m.generatedAt?new Date(m.generatedAt):new Date();
  const dateLabel=Number.isNaN(date.getTime())?'':date.toISOString().slice(0,10);
  const lines=safeList(r.localisation.channels);
  const claims=safeList(r.evidence.claims);
  return `<article class="print-sheet" aria-label="完整市场营销报告">
    <header class="print-cover"><div class="print-cover-top"><div class="print-logo">✦ GLOBAL<span>LAUNCH</span> AI</div><div>STRATEGY INTELLIGENCE / 2026</div></div><div class="print-cover-content"><p>GLOBAL GO-TO-MARKET / CAMPAIGN REPORT</p><h1>${h(b.brand)}</h1><h2>${h(countryName(b.region))} · 30-day launch plan</h2><div class="print-cover-line"></div><p class="print-cover-summary">${h(r.strategy.summary)}</p></div><div class="print-cover-footer"><div><small>MARKET</small><strong>${h(b.region)}</strong></div><div><small>INVESTMENT</small><strong>${h(fmt)}</strong></div><div><small>OBJECTIVE</small><strong>${h(b.goal)}</strong></div><div><small>DATE</small><strong>${h(dateLabel)}</strong></div></div></header>
    <section class="print-section"><div class="print-section-heading"><small>01 / STRATEGY</small><h2>战略方向 · Strategy</h2></div><div class="print-highlight"><h3>${h(r.strategy.headline)}</h3><p>${h(r.strategy.summary)}</p></div><h3>品牌定位 / Positioning</h3><p>${h(r.strategy.positioning)}</p><h3>核心客群 / Customer persona</h3><div class="print-pair"><div><strong>${h(r.strategy.persona?.name)}</strong><p>${h(r.strategy.persona?.need)}</p></div><div><strong>Friction &amp; trigger</strong><p>${h(r.strategy.persona?.friction)} / ${h(r.strategy.persona?.trigger)}</p></div></div><h3>需要验证的假设</h3>${bulletList(r.strategy.assumptions)}<h3>建议验证方式</h3>${bulletList(r.strategy.nextValidation)}</section>
    <section class="print-section"><div class="print-section-heading"><small>02 / LOCALISATION</small><h2>本地化广告创意</h2></div><div class="print-ad"><small>PRIMARY CREATIVE</small><h3>${h(r.localisation.heroCopy)}</h3><small>ALTERNATIVE</small><p>${h(r.localisation.altCopy)}</p></div><p>${h(r.localisation.rationale)}</p>${lines.map(t=>`<div class="print-creative"><strong>${h(t.channel)} · ${h(t.angle)}</strong><p>${h(t.idea)}</p><blockquote>${h(t.sample)}</blockquote></div>`).join('')}<h3>文化适配与验证提醒</h3>${bulletList(r.localisation.culturalNotes)}</section>
    <section class="print-section"><div class="print-section-heading"><small>03 / INVESTMENT</small><h2>预算与执行方案</h2></div>${budgetChart(data)}<h3>30天推进路线</h3>${timelineView(data)}</section>
    <section class="print-section"><div class="print-section-heading"><small>04 / MEASUREMENT</small><h2>衡量指标与实验设计</h2></div><h3>关键衡量指标</h3>${kpiView(data)}<div class="print-experiment-block"><h3>A/B实验</h3><div class="print-experiments">${safeList(r.execution.experiments).map(t=>`<div><strong>${h(t.name)}</strong><p>A · ${h(t.a)}</p><p>B · ${h(t.b)}</p><p>Measurement · ${h(t.metric)}</p></div>`).join('')}</div></div></section>
    <section class="print-section"><div class="print-section-heading"><small>05 / GOVERNANCE</small><h2>风险和发布前检查</h2></div>${riskView(data)}<h3>发布核查清单</h3>${bulletList(r.risk.checklist)}<p class="print-disclaimer">${h(r.risk.disclaimer)}</p></section>
    <section class="print-section"><div class="print-section-heading"><small>06 / EVIDENCE</small><h2>证据缺口与验证计划</h2></div><table class="print-evidence-table"><thead><tr><th>判断或主张</th><th>证据状态</th><th>建议验证路径</th></tr></thead><tbody>${claims.map(t=>`<tr><td>${h(t.claim)}</td><td>${h(t.status)}</td><td>${h(t.verification)}</td></tr>`).join('')}</tbody></table><h3>使用边界</h3>${bulletList(r.evidence.safeguards)}<div class="print-final-note">AI-generated strategy draft · Human verification required. ${h(m.notice)}<br>Report source: user-supplied brand brief and AI planning — not an independent market research study.</div></section>
  </article>`;
}
