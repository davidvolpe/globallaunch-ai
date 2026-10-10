import {overviewView, executionView, riskDetailView, buildPrintReport} from './report-view.mjs';
import {loadLibrary,saveLibrary,addProjectVersion,currentProject,allProjectEvidence,checkLibrary,emptyLibrary,safeDiff} from './project-store.mjs';
const $ = id => document.getElementById(id);
const regionCurrencies = {AU:'AUD',SG:'SGD',UK:'GBP',US:'USD'};
const samples = {
  brand:'Luma Botanics',
  description:'虚构的中国独立护肤品牌，主打简洁护肤体验。所有功效说明与可持续声明均待验证。',
  region:'AU',industry:'Beauty & personal care',audience:'25–35岁的悉尼城市职场女性',
  valueProp:'简洁透明的产品信息、易懂的护肤步骤和清晰的成分说明',
  goal:'Market validation',budget:10000,channels:['Instagram','TikTok','Google Search']
};
let current = null;
let library=loadLibrary(window.localStorage);
let currentProjectId=null;
let displayedVersion=0;
let pendingRevision=null;
let activeTab = 'overview';
let mode = 'demo';
let toastTimer;
let reportReady=false;
const regionNames = {AU:'澳大利亚',SG:'新加坡',UK:'英国',US:'美国'};
function closeMobileNav(){document.body.classList.remove('mobile-nav-open');$('mobileMenuBtn').setAttribute('aria-expanded','false')}
function navigateTo(selector){closeMobileNav();document.querySelector(selector)?.scrollIntoView({behavior:'smooth',block:'start'})}
function setCompactBrief(compact){document.body.classList.toggle('brief-compact',compact);$('briefSummary').hidden=!compact;}
function setReportReady(ready){reportReady=ready;document.body.classList.toggle('has-report',ready);$('navResults').disabled=!ready;$('navEvidence').disabled=!ready;document.querySelector('.studio-head .kicker').textContent=ready?'02 / REPORT':'01 / INPUT';document.querySelector('.studio-head h2').innerHTML=ready?'Launch report <span class="muted-light">/ 营销决策报告</span>':'Campaign brief <span class="muted-light">/ 营销简报</span>';document.querySelector('.studio-head p').textContent=ready?'查看报告、导出PDF，或展开简报调整参数后重新生成。':'输入品牌、目标受众和营销目标，生成可供验证的出海营销方案。';if(!ready){setCompactBrief(false);$('briefSummary').hidden=true;}$('iterationWorkspace').hidden=!ready;}
function updateSummary(brief){$('summaryBrand').textContent=brief.brand;$('summaryFacts').textContent=`${regionNames[brief.region]||brief.region} · ${brief.industry} · ${money(brief.budget,regionCurrencies[brief.region]||'AUD')}`;$('summaryChannels').textContent=brief.channels.join(' · ')}
const initialEmptyHtml = $('outputBody').innerHTML;
const tabs = [
  ['overview','决策总览'],['strategy','策略洞察'],['localisation','本地化文案'],['execution','预算与执行'],['risk','风险审查'],['evidence','证据清单']
];
function esc(input) {
  return String(input ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function safeArray(items){return Array.isArray(items)?items:[]}
function money(amount,currency) {const n=Number(amount);return Number.isFinite(n)?new Intl.NumberFormat('en-AU',{style:'currency',currency,maximumFractionDigits:0}).format(n):'—'}
function showToast(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3700)}
function setExample(sample){for(const k of ['brand','description','region','industry','audience','valueProp','goal','budget']) $(k).value=sample[k] ?? ''; document.querySelectorAll('.channel input').forEach(e=>e.checked=sample.channels.includes(e.value));syncCurrency()}
function syncCurrency(){$('currencyText').textContent=regionCurrencies[$('region').value] || 'AUD'}
function getBrief(){const channels=[...document.querySelectorAll('.channel input:checked')].map(e=>e.value); if(!channels.length)throw new Error('至少选择一个营销渠道。');return {brand:$('brand').value,description:$('description').value,region:$('region').value,industry:$('industry').value,audience:$('audience').value,valueProp:$('valueProp').value,goal:$('goal').value,budget:Number($('budget').value),channels,tone:'Trustworthy & clear'}}
async function getStatus(){try{const r=await fetch('/api/health');if(!r.ok)throw Error('offline');const j=await r.json();mode=j.mode;$('accessGroup').hidden=!j.accessRequired;$('systemStatus').classList.toggle('demo',mode==='demo');$('systemStatus').innerHTML=`<span class="status-dot"></span>${mode==='live'?'API CONFIGURED · '+esc(j.model):'DEMO MODE'}`;$('sideStatusText').textContent=mode==='live'?'已配置 AI 模型':'演示模式';$('sideStatusDetail').textContent=mode==='live'?j.model:'本地模板生成';$('sideStatus').classList.toggle('demo',mode==='demo');}catch{$('systemStatus').textContent='OFFLINE';$('sideStatusText').textContent='服务不可用';$('sideStatusDetail').textContent='请检查服务器';$('sideStatus').classList.add('demo');}}
function reportPill(label,cls=''){$('resultPill').className='result-pill '+cls;$('resultPill').textContent=label}
function loading(){$('outputBody').innerHTML='<div class="busy-state"><div><div class="loading-orb"></div><h4>正在构建你的市场进入方案…</h4><p>梳理品牌定位、广告本地化、预算规划及风险检查。实时模型可能需要几十秒。</p></div></div>';reportPill('GENERATING')}
function fail(message){reportPill('ACTION REQUIRED');$('outputBody').innerHTML=`<div class="error-box"><strong>生成失败</strong><p>${esc(message)}</p><button class="btn outline" id="retryAction">重新尝试</button></div>`;$('retryAction').addEventListener('click',()=> $('briefForm').requestSubmit())}
async function generate(ev){ev?.preventDefault();if(!$('briefForm').reportValidity())return;let brief;try{brief=getBrief()}catch(e){showToast(e.message);return;}const btn=$('generateBtn');btn.disabled=true;$('generateText').textContent='正在生成…';loading();try{const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Access-Code':$('accessCode').value.trim()},body:JSON.stringify(brief)});const data=await response.json().catch(()=>({error:'服务器没有返回有效的JSON。'}));if(!response.ok)throw Error(data.error || `HTTP ${response.status}`);current=data;activeTab='overview';pendingRevision=null;
    const existing=currentProjectId?library.projects.find(p=>p.id===currentProjectId):null;
    const projectId=existing&&existing.name===brief.brand?currentProjectId:null;
    persistNewVersion(data,projectId? '重新生成简报':'初始生成',[],projectId);
    renderReport();updateSummary(brief);setReportReady(true);setCompactBrief(true);navigateTo('.studio-head');showToast('策略报告已生成并保存。可以补充证据进行迭代。')}catch(e){fail(e.message)}finally{btn.disabled=false;$('generateText').textContent='重新生成策略'}}
function list(items){return `<ul class="report-list">${safeArray(items).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
function strategy(r){const s=r.strategy;const p=s.persona||{};return `<div class="report-callout">${esc(s.summary)}</div><div class="section-title">定位建议 / Positioning</div><p class="report-text">${esc(s.positioning)}</p><div class="section-title">消费者画像 · 待验证</div><div class="data-cards"><div class="data-card"><small>AUDIENCE</small><p>${esc(p.name)}<br>${esc(p.need)}</p></div><div class="data-card"><small>FRICTION & TRIGGER</small><p>${esc(p.friction)}<br>${esc(p.trigger)}</p></div></div><div class="report-subsection">关键假设</div>${list(s.assumptions)}<div class="report-subsection">下阶段验证清单</div>${list(s.nextValidation)}`}
function localisation(r){const s=r.localisation;return `<div class="ad-card"><small>PRIMARY HERO COPY · LOCALIZED</small><p>${esc(s.heroCopy)}</p></div><div class="ad-card secondary-ad"><small>ALTERNATIVE / A-B CREATIVE</small><p>${esc(s.altCopy)}</p></div><div class="report-subsection">原文 → 本地化逻辑</div><p class="report-text"><b>原文：</b>${esc(s.sourceCopy)}<br><b>本地化理由：</b>${esc(s.rationale)}</p><div class="report-subsection">渠道创意角度</div><div class="line-list">${safeArray(s.channels).map(x=>`<div class="line-item"><strong>${esc(x.channel)} · ${esc(x.angle)}</strong><p>${esc(x.idea)}</p><p><i>${esc(x.sample)}</i></p></div>`).join('')}</div><div class="report-subsection">文化适配提醒</div>${list(s.culturalNotes)}`}
function executionLegacy(r){const s=r.execution;const currency=r.currency||current.meta.currency;return `<div class="section-title">30天试验预算</div><div class="budget-total">总预算：${esc(money(r.brief.budget,currency))}</div>${safeArray(s.allocation).map(x=>`<div class="budget-item"><div class="budget-item-top"><span>${esc(x.channel)}</span><span>${esc(x.percent)}% · ${esc(money(x.amount,currency))}</span></div><div class="budget-bar"><span class="budget-fill" data-pct="${Math.min(100,Math.max(0,Number(x.percent)||0))}"></span></div><div class="budget-note">${esc(x.why)}</div></div>`).join('')}<div class="report-subsection">30日执行路线</div>${safeArray(s.timeline).map(x=>`<div class="timeline-card"><span class="timeline-week">${esc(x.week)}</span><strong>${esc(x.title)}</strong>${list(x.actions)}</div>`).join('')}<div class="report-subsection">核心测量指标</div><div class="line-list">${safeArray(s.kpis).map(x=>`<div class="line-item"><strong>${esc(x.name)} · ${esc(x.target)}</strong><p>${esc(x.note)}</p></div>`).join('')}</div><div class="report-subsection">A/B实验</div><div class="line-list">${safeArray(s.experiments).map(x=>`<div class="line-item"><strong>${esc(x.name)}</strong><p>A: ${esc(x.a)}<br>B: ${esc(x.b)}<br>评估：${esc(x.metric)}</p></div>`).join('')}</div>`}
function riskLegacy(r){const s=r.risk;return `<div class="report-callout">这是一份初步营销风险筛查，不是法律意见，也不代表广告合规已被认证。</div><div class="section-title">需要优先人工复核</div>${safeArray(s.flags).map(x=>`<div class="risk-card"><span class="risk-tag ${esc(x.level)}">${esc(x.level?.toUpperCase())}</span><strong>${esc(x.label)}</strong><p><b>风险：</b>${esc(x.issue)}<br><b>建议：</b>${esc(x.fix)}</p></div>`).join('')}<div class="report-subsection">发布前核查</div>${list(s.checklist)}<p class="export-hint">${esc(s.disclaimer)}</p>`}
function evidence(r){const e=r.evidence;return `<div class="report-callout">Evidence-first：把事实、规划假设与待验证问题分开，拒绝虚构市场数据和ROI预测。</div><div class="section-title">证据缺口 / Claims ledger</div>${safeArray(e.claims).map(x=>`<div class="evidence-row"><span class="evidence-status">${esc(x.status)}</span><strong>${esc(x.claim)}</strong><p>验证方式：${esc(x.verification)}</p></div>`).join('')}<div class="report-subsection">系统输出边界</div>${list(e.safeguards)}<p class="export-hint">AI辅助产出的建议仅供规划。上线前请使用真实来源、当地用户反馈及人工审核确认。</p>`}
function renderReport(){if(!current)return;const {brief,report:r,meta}=current;reportPill(meta.mode==='live'?'AI DRAFT READY':'DEMO OUTPUT',meta.mode==='live'?'ready':'demo');const country={AU:'Australia',SG:'Singapore',UK:'United Kingdom',US:'United States'}[brief.region];const content={overview:()=>overviewView(current),strategy,localisation,execution:()=>executionView(current),risk:()=>riskDetailView(current),evidence}[activeTab](r);
  $('outputBody').innerHTML=`<div class="report-wrap"><div class="report-intro"><div><div class="report-eyebrow">YOUR LAUNCH REPORT / 30 DAYS · <span id="reportVersionLabel">${displayedVersion?`v${displayedVersion}`:"unsaved"}</span></div><div class="report-title">${esc(brief.brand)} → ${esc(country)}</div><div class="report-sub">${esc(brief.industry)} · ${esc(brief.goal)}</div></div><div class="report-tools"><button class="report-tool" id="copyBtn" title="复制策略摘要">复制</button><button class="report-tool" id="downloadBtn" title="下载Markdown报告">↓ MD</button><button class="report-tool pdf-export" id="pdfBtn" title="打印或保存完整PDF报告">↗ 导出PDF</button></div></div><div class="mode-notice ${meta.mode==='live'?'live':''}"><strong>${meta.mode==='live'?'● AI草稿模式':'◉ 本地演示模式'}</strong> — ${esc(meta.notice)} 本报告不包含已验证的真实市场调查数据。</div><div class="metrics-grid"><div class="metric"><span class="metric-label">TARGET MARKET</span><strong>${esc(brief.region)}</strong><small>${esc(country)}</small></div><div class="metric"><span class="metric-label">CAMPAIGN BUDGET</span><strong>${esc(money(brief.budget,meta.currency))}</strong><small>30-day test</small></div><div class="metric"><span class="metric-label">LAUNCH CHANNELS</span><strong>${brief.channels.length}</strong><small>Selected channels</small></div></div><div class="report-tabs" role="tablist" aria-label="报告分类">${tabs.map(([k,v])=>`<button type="button" data-tab="${k}" role="tab" aria-selected="${activeTab===k}" class="${activeTab===k?'active':''}">${v}</button>`).join('')}</div><div class="report-content" role="tabpanel">${content}</div></div>`;
  $('outputBody').querySelectorAll('.budget-fill').forEach(el=>{el.style.width = el.dataset.pct + '%'});
  $('outputBody').querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;renderReport()}));
  $('copyBtn').addEventListener('click',copySummary);
  $('downloadBtn').addEventListener('click',downloadReport);
  $('pdfBtn').addEventListener('click',exportPDF);
}
async function copySummary(){if(!current)return;const r=current.report.strategy;const str=`${r.headline}\n\n${r.summary}\n\n${r.positioning}\n\n注意：仅供草稿规划，须人工验证。`;try{await navigator.clipboard.writeText(str);showToast('策略摘要已复制')}catch{showToast('复制失败，可使用下载报告功能。')}}
function reportAsMarkdown(data){const {report:r,brief:b,meta:m}=data;const line=items=>safeArray(items).map(x=>`- ${typeof x==='string'?x:JSON.stringify(x)}`).join('\n');return `# GlobalLaunch AI — ${b.brand} / ${b.region}\n\n> ${m.notice} 本内容不代表已完成市场研究。需人工验证。\n\n## Brief\n- Brand: ${b.brand}\n- Market: ${b.region}\n- Industry: ${b.industry}\n- Audience: ${b.audience}\n- Value: ${b.valueProp}\n- Objective: ${b.goal}\n- Budget: ${money(b.budget,m.currency)}\n- Channels: ${b.channels.join(', ')}\n\n## 1. Strategy\n${r.strategy.summary}\n\n**Positioning:** ${r.strategy.positioning}\n\n**Assumptions**\n${line(r.strategy.assumptions)}\n\n**Validation**\n${line(r.strategy.nextValidation)}\n\n## 2. Localisation\n**Hero:** ${r.localisation.heroCopy}\n\n**Alternative:** ${r.localisation.altCopy}\n\n${r.localisation.rationale}\n\n**Channel creatives**\n${safeArray(r.localisation.channels).map(x=>`- ${x.channel}: ${x.idea}; example: ${x.sample}`).join('\n')}\n\n## 3. Execution\n**Budget**\n${safeArray(r.execution.allocation).map(x=>`- ${x.channel}: ${x.percent}%, ${money(x.amount,m.currency)}`).join('\n')}\n\n**Roadmap**\n${safeArray(r.execution.timeline).map(x=>`- ${x.week} (${x.title}): ${safeArray(x.actions).join('; ')}`).join('\n')}\n\n**KPI definitions**\n${safeArray(r.execution.kpis).map(x=>`- ${x.name}: ${x.target} (${x.note})`).join('\n')}\n\n**Experiments**\n${safeArray(r.execution.experiments).map(x=>`- ${x.name}: A ${x.a}; B ${x.b}; measurement ${x.metric}`).join('\n')}\n\n## 4. Risk review\n${safeArray(r.risk.flags).map(x=>`- [${x.level}] ${x.label}: ${x.issue} → ${x.fix}`).join('\n')}\n\n**Checklist**\n${line(r.risk.checklist)}\n\n## 5. Evidence ledger\n${safeArray(r.evidence.claims).map(x=>`- ${x.claim} [${x.status}]: ${x.verification}`).join('\n')}\n\nGenerated: ${m.generatedAt}\n`}
function exportPDF(){if(!current)return;showToast('请在打印窗口选择「另存为 PDF」以下载完整报告。'); const root=$('printReportRoot');root.innerHTML=appendRevisionPrint(buildPrintReport(current));document.title=`${current.brief.brand} | GlobalLaunch AI Report`;window.print();}
window.addEventListener('afterprint',()=>{document.title='GlobalLaunch AI — Launch Studio'});
function downloadReport(){if(!current)return;const content=reportAsMarkdown(current)+revisionMarkdown();const blob=new Blob([content],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`GlobalLaunch_${current.brief.brand.replace(/[^a-z0-9\u4e00-\u9fa5-]/gi,'_').slice(0,45)}_report.md`;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Markdown报告已下载')}
function dialog(title,html){$('dialogTitle').textContent=title;$('dialogBody').className='dialog-body';$('dialogBody').innerHTML=html;$('infoDialog').showModal()}
$('navStudio').addEventListener('click',()=>navigateTo('.studio-head'));
$('navResults').addEventListener('click',()=>{if(reportReady)navigateTo('.result-panel')});
$('navEvidence').addEventListener('click',()=>{if(reportReady)navigateTo('#iterationWorkspace')});
$('navHistory').addEventListener('click',()=>navigateTo('#historySection'));
$('navNew').addEventListener('click',()=>{$('resetBtn').click();navigateTo('.studio-head')});
$('editBrief').addEventListener('click',()=>{setCompactBrief(false);navigateTo('.form-panel')});
$('sidebarToggle').addEventListener('click',()=>{const collapsed=document.body.classList.toggle('nav-collapsed');$('sidebarToggle').setAttribute('aria-expanded',String(!collapsed));$('sidebarToggle').setAttribute('aria-label',collapsed?'展开侧边栏':'收起侧边栏')});
$('mobileMenuBtn').addEventListener('click',()=>{const open=document.body.classList.toggle('mobile-nav-open');$('mobileMenuBtn').setAttribute('aria-expanded',String(open))});
$('sidebarBackdrop').addEventListener('click',closeMobileNav);
window.addEventListener('keydown',event=>{if(event.key==='Escape')closeMobileNav()});
$('navMethod').addEventListener('click',()=>{closeMobileNav();dialog('方法与证据边界','<p><strong>1. Brief → Strategy：</strong>分析品牌提供的定位和目标，不将用户描述当成已被验证的市场事实。</p><p><strong>2. Localise：</strong>针对目标市场重写营销表达，保留原本含义，不直接逐字翻译。</p><p><strong>3. Launch plan：</strong>预算和KPI为实验规划，不编造实际转化率、消费者调查或ROI。</p><p><strong>4. Human review：</strong>上线前必须人工检查当地法规、隐私、产品功效和文案真实性。</p><p><strong>演示模式：</strong>不调用AI模型，只运行透明的本地模板。配置API Key后才启用真实模型调用。</p>')});
const guide=()=>dialog('三步使用指南','<p><strong>第一步：</strong>输入品牌、价值主张、客群、市场和预算。可以使用虚构的Luma Botanics示例。</p><p><strong>第二步：</strong>点击「生成30天市场启动策略」。系统将显示六个报告标签及可视化决策总览，切换标签查看。</p><p><strong>第三步：</strong>下载Markdown或使用「导出PDF」生成完整可打印报告（打印窗口选择「另存为PDF」），验证广告主张、消费者假设与营销KPI，再用于真实商业决策。</p><p>要启用实时AI，请在项目根目录的 <strong>.env</strong> 中填入 <strong>DEEPSEEK_API_KEY</strong>（或切换为 OpenAI），然后重启服务。密钥只保存在服务器端，不会返回浏览器。</p>');
$('navGuide').addEventListener('click',()=>{closeMobileNav();guide()});$('topHelp').addEventListener('click',guide);$('closeDialog').addEventListener('click',()=>$('infoDialog').close());$('doneDialog').addEventListener('click',()=>$('infoDialog').close());
$('exampleBtn').addEventListener('click',()=>{setExample(samples);showToast('已加载虚构品牌示例，点击生成即可体验。')});
$('resetBtn').addEventListener('click',()=>{if(current&&!window.confirm('新建简报会清空当前报告，建议先导出 PDF 或 Markdown。确定继续吗？'))return;setReportReady(false);$('briefForm').reset();$('revisionForm').reset();for(const id of ['brand','description','audience','valueProp'])$(id).value='';document.querySelectorAll('.channel input').forEach(e=>e.checked=e.value==='Instagram');syncCurrency();current=null;currentProjectId=null;displayedVersion=0;pendingRevision=null;activeTab='overview';$('outputBody').innerHTML=initialEmptyHtml;reportPill('AWAITING INPUT');$('printReportRoot').innerHTML='';$('revisionPreview').innerHTML='<div class="revision-placeholder"><strong>等待新的材料</strong><p>补充证据后可生成修订草案，原报告不会被覆盖。</p></div>';$('generateText').textContent='生成30天市场启动策略';showToast('已清空简报，可以开始新的项目。')});
$('region').addEventListener('change',syncCurrency);
$('briefForm').addEventListener('submit',generate);
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();$('briefForm').requestSubmit()}});
setExample(samples);syncCurrency();getStatus();
renderHistory();
const restored=currentProject(library);
if(restored){loadStoredVersion(restored.id,restored.versions.at(-1).number,false);}


// v0.6 — evidence-driven iteration; browser-local project history, no server persistence.
function persistNewVersion(data,reason,records=[],projectId=currentProjectId){
  try{
    const updated=addProjectVersion(library,{projectId,data,reason,records});
    saveLibrary(window.localStorage,updated);
    library=updated;currentProjectId=updated.activeId;
    displayedVersion=currentProject(library).versions.at(-1).number;
    $('versionToken').textContent=`Report v${displayedVersion}`;$('compareHistory').hidden=displayedVersion<2;
    renderHistory();
  }catch(error){
    // A storage failure must not lose the generated result in memory.
    showToast('报告可继续使用，但本地存档失败：'+error.message);
  }
}
function loadStoredVersion(projectId,version,scroll=true){
  const project=library.projects.find(p=>p.id===projectId);
  const entry=project?.versions.find(v=>v.number===version);
  if(!entry)return;
  currentProjectId=project.id;library.activeId=project.id;
  try{saveLibrary(window.localStorage,library)}catch{}
  current=JSON.parse(JSON.stringify(entry.data)); displayedVersion=entry.number;activeTab='overview';pendingRevision=null;
  setExample(current.brief);setReportReady(true);setCompactBrief(true);updateSummary(current.brief);
  $('versionToken').textContent=`Report v${displayedVersion}`;$('compareHistory').hidden=displayedVersion<2;
  $('revisionPreview').innerHTML='<div class="revision-placeholder"><strong>准备修订 v'+displayedVersion+'</strong><p>输入新的证据或想法，选择允许修改的章节，生成一份可核对的修订草案。</p></div>';
  $('generateText').textContent='重新生成策略';renderReport();renderHistory();
  if(scroll)navigateTo('.result-panel');
}
function renderHistory(){
  const host=$('projectHistory');
  if(!library.projects.length){host.innerHTML='<p class="history-empty">暂无本地项目记录。生成首份报告后将自动建立版本 v1。</p>';return;}
  host.innerHTML=library.projects.map(project=>`<article class="project-history-row"><div class="history-project-name"><strong>${esc(project.name)}</strong><small>${project.versions.length} 个版本 · 仅存于当前浏览器</small></div><div class="history-versions">${project.versions.map(version=>`<button type="button" class="history-version ${currentProjectId===project.id && displayedVersion===version.number?'selected':''}" data-project="${esc(project.id)}" data-version="${version.number}" title="${esc(version.reason)}">v${version.number}<small>${esc(version.reason)}</small></button>`).join('')}</div></article>`).join('');
  host.querySelectorAll('[data-project]').forEach(btn=>btn.addEventListener('click',()=>loadStoredVersion(btn.dataset.project,Number(btn.dataset.version))));
}
function recordFromForm(){
  return {kind:$('evidenceKind').value,content:$('evidenceContent').value.trim(),source:$('evidenceSource').value.trim(),observedAt:$('evidenceDate').value||'',verification:'user-supplied-unverified'};
}
function compareSnapshots(before,after,sections,saved=false){
  const labels={strategy:'策略洞察',localisation:'本地化文案',execution:'预算与执行',risk:'风险审查',evidence:'证据清单'};
  const changed=safeDiff(before,after,sections);
  const snippetFor=(section,report)=>{
    if(section==='strategy')return report.strategy.summary;
    if(section==='localisation')return report.localisation.heroCopy;
    if(section==='execution')return report.execution.timeline.map(t=>t.title).join(' / ');
    if(section==='risk')return report.risk.flags.map(t=>t.label).join(' / ');
    return report.evidence.claims.slice(0,2).map(t=>t.claim).join(' / ');
  };
  return `<div class="revision-review-header"><strong>${saved?"历史版本对比 · 已保存":"修订草案 · 尚未保存"}</strong><span>${changed.length} 个章节发生变化</span></div>
    <div class="change-summary">${sections.map(s=>`<span class="change-chip ${changed.includes(s)?'changed':''}">${changed.includes(s)?'↗ 更新':'✓ 未变化'} · ${labels[s]}</span>`).join('')}</div>
    ${changed.length? changed.map(s=>`<div class="revision-compare-row"><div class="revision-compare-label">${labels[s]}</div><div class="revision-comparison"><div><small>BEFORE / 当前版本</small><p>${esc(snippetFor(s,before)).slice(0,580)}</p></div><div><small>AFTER / 修订草案</small><p>${esc(snippetFor(s,after)).slice(0,580)}</p></div></div></div>`).join(''):'<p class="no-change-notice">模型没有修改所选章节。可以补充更具体的证据或修改指令后重试。</p>'}
    <div class="revision-notice">材料属于用户提供的信息，未经过平台独立核验。没有选择的章节保持原样；预算总额及渠道选择已由后端锁定。</div>
    ${saved?'':`<div class="revision-actions"><button type="button" class="btn outline" id="rejectRevision">放弃草案</button><button type="button" class="btn primary-accept" id="acceptRevision">✓ 采用为新版本</button></div>`}`;
}
$('revisionForm').addEventListener('submit',async(event)=>{
  event.preventDefault();if(!current)return;
  const record=recordFromForm();
  if(record.content.length<10){showToast('请至少输入10个字的新信息。');return}
  if(record.kind!=='idea'&&!record.source){showToast('非想法类信息必须注明来源。');$('evidenceSource').focus();return}
  const sections=[...document.querySelectorAll('.revision-sections input:checked')].map(e=>e.value);
  if(!sections.length){showToast('请选择至少一个允许修改的章节。');return}
  const btn=$('reviseBtn');btn.disabled=true;$('reviseText').textContent='正在分析新信息…';
  $('revisionPreview').innerHTML='<div class="revision-placeholder"><strong>正在生成修订草案…</strong><p>此操作不会覆盖当前版本。首次请求可能需要几十秒。</p></div>';
  try{
    const response=await fetch('/api/revise',{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Access-Code':$('accessCode').value.trim()},body:JSON.stringify({brief:current.brief,previousReport:current.report,records:[record],sections,direction:$('changeDirection').value.trim()})});
    const data=await response.json().catch(()=>({error:'服务器没有返回有效 JSON。'}));
    if(!response.ok)throw Error(data.error||`HTTP ${response.status}`);
    pendingRevision={data,record,sections,parentVersion:displayedVersion,projectId:currentProjectId,fromReport:structuredClone(current.report)};
    $('revisionPreview').innerHTML=compareSnapshots(current.report,data.report,sections);
    $('acceptRevision').addEventListener('click',acceptRevision);
    $('rejectRevision').addEventListener('click',()=>{pendingRevision=null;$('revisionPreview').innerHTML='<div class="revision-placeholder"><strong>草案已放弃</strong><p>当前报告未发生任何变化。可继续添加新的证据或想法。</p></div>'});
  }catch(error){$('revisionPreview').innerHTML=`<div class="error-box"><strong>修订失败</strong><p>${esc(error.message)}</p></div>`;}
  finally{btn.disabled=false;$('reviseText').textContent='生成修订草案'}
});
function acceptRevision(){
  if(!pendingRevision)return;
  const draft=pendingRevision;
  if(currentProjectId!==draft.projectId || displayedVersion!==draft.parentVersion){showToast('当前项目或版本已切换，请重新生成修订草案。');pendingRevision=null;return}
  current=draft.data;activeTab='overview';
  persistNewVersion(current,`基于 v${draft.parentVersion} 补充${{interview:'访谈',campaign:'投放数据',research:'外部资料',idea:'新想法'}[draft.record.kind]||'资料'}并修订`,[draft.record],draft.projectId);
  renderReport();pendingRevision=null;
  $('revisionPreview').innerHTML=`<div class="revision-accepted"><strong>✓ 已保存 v${displayedVersion}</strong><p>原版本已保留。你可以在下方项目历史中切换查看，也可以继续补充下一条材料。</p></div>`;
  $('evidenceContent').value='';$('evidenceSource').value='';$('changeDirection').value='';
  showToast(`已采用修订并保存为 v${displayedVersion}，旧版本仍可查看。`);
  navigateTo('.result-panel');
}
function currentEvidence(){return allProjectEvidence(currentProject(library),displayedVersion)}
function revisionMarkdown(){const records=currentEvidence();if(!records.length)return '';
  return `
## User-supplied additions (not independently verified)
${records.map(x=>`- [v${x.version}] ${x.kind} ${x.observedAt||''}: ${x.content} — source: ${x.source||'not provided'}; status: user supplied, unverified`).join('\n')}
`;
}
function appendRevisionPrint(html){const records=currentEvidence();if(!records.length)return html;
  const appendix=`<section class="print-section"><div class="print-section-heading"><small>07 / ITERATION HISTORY</small><h2>新增材料与版本追踪</h2></div><p>下述资料均由用户提供，未经系统独立核实；意见与假设不可直接当作市场事实。</p>${records.map(x=>`<div class="print-evidence-added"><strong>v${x.version} · ${esc(x.kind)} ${esc(x.observedAt)}</strong><p>${esc(x.content)}</p><small>来源：${esc(x.source||'未提供')} · 未独立核验</small></div>`).join('')}</section>`;
  return html.replace(/<\/article>\s*$/,`${appendix}</article>`);
}
$('compareHistory').addEventListener('click',()=>{
  const p=currentProject(library);if(!p||displayedVersion<2)return;
  const old=p.versions.find(v=>v.number===displayedVersion-1);
  if(!old)return;
  $('revisionPreview').innerHTML=compareSnapshots(old.data.report,current.report,['strategy','localisation','execution','risk','evidence'],true);
  navigateTo('#iterationWorkspace');
});
$('backupProjects').addEventListener('click',()=>{
  if(!library.projects.length){showToast('还没有可备份的项目。');return}
  const blob=new Blob([JSON.stringify(library,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='GlobalLaunch_AI_projects_backup.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  showToast('已导出本地项目备份。备份包含品牌资料，请妥善保管。');
});
$('importProjects').addEventListener('click',()=>$('importProjectFile').click());
$('importProjectFile').addEventListener('change',async(e)=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>2_500_000){showToast('备份文件超过2.5MB。');return}
  try{
    const imported=checkLibrary(JSON.parse(await file.text()));
    if(!window.confirm('导入备份会替换当前浏览器保存的所有项目。建议先导出当前备份。确定继续吗？'))return;
    saveLibrary(window.localStorage,imported);library=imported;
    const p=currentProject(library);
    if(p)loadStoredVersion(p.id,p.versions.at(-1).number,false);
    else {current=null;currentProjectId=null;displayedVersion=0;setReportReady(false)}
    renderHistory();showToast('本地项目备份导入成功。');
  }catch(err){showToast(`无法导入：${err.message}`)}
});
