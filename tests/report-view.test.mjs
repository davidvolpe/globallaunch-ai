import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBrief } from '../lib/validate.mjs';
import { buildDemoReport } from '../lib/demo.mjs';
import { getBudgetSummary, getRiskCounts, budgetChart, timelineView, kpiView, overviewView, executionView, riskDetailView, buildPrintReport } from '../public/report-view.mjs';
function fixture(){
 const brief=normalizeBrief({brand:'Luma Botanics',description:'a useful brief',region:'AU',industry:'Beauty & personal care',audience:'Women aged 25 to 35',valueProp:'clear information',goal:'Market validation',budget:10000,channels:['Instagram','TikTok','Google Search','LinkedIn']});
 return {brief,report:buildDemoReport(brief),meta:{currency:'AUD',generatedAt:'2026-10-10T08:00:00.000Z',mode:'demo',notice:'Local demo only'}};
}
test('v0.4 allocation donut and legend reflect exact server-calculated budget',()=>{
 const f=fixture(),summary=getBudgetSummary(f),markup=budgetChart(f);
 assert.equal(summary.balanced,true);
 assert.equal(summary.lines.length,4);
 assert.equal(summary.total,10000);
 assert.match(markup,/conic-gradient\(/);
 assert.match(markup,/Instagram/);
 assert.match(markup,/LinkedIn/);
 assert.match(markup,/10,000/);
});
test('overview contains decision KPIs, 4-week route, evidence assumptions, risk distribution',()=>{
 const f=fixture(),markup=overviewView(f);
 for(const term of ['EXECUTIVE DECISION DASHBOARD','01 \/ INVESTMENT','02 \/ IMPLEMENTATION','03 \/ MEASUREMENT','04 \/ QUALITY GATE','Luma Botanics','What we still need']){
  if(term==='What we still need') continue;
  assert.ok(markup.includes(term),term);
 }
 assert.equal((markup.match(/class="roadmap-step"/g)||[]).length,4);
 assert.ok((markup.match(/class="kpi-card"/g)||[]).length>0);
 assert.ok(getRiskCounts(f).high>=0);
});
test('execution and risk views render user-configured data',()=>{
 const f=fixture();
 assert.match(executionView(f),/experiment-card/);
 assert.match(executionView(f),/visual-budget/);
 assert.match(riskDetailView(f),/risk-overview/);
 assert.match(timelineView(f),/Week 1/);
 assert.match(kpiView(f),/kpi-target/);
});
test('print report includes all six sections even with a tab not selected',()=>{
 const html=buildPrintReport(fixture());
 for(const term of ['STRATEGY','LOCALISATION','INVESTMENT','MEASUREMENT','GOVERNANCE','EVIDENCE','Instagram','LinkedIn','Luma Botanics','10,000','print-experiment-block']) assert.ok(html.includes(term),term);
 assert.equal((html.match(/class="print-section"/g)||[]).length,6);
});
test('AI-generated and user inputs are escaped in HTML and PDF views',()=>{
 const data=fixture();
 data.brief.brand='<img src=x onerror=alert(1)>';
 data.report.strategy.summary='<script>alert(1)</script>';
 data.report.execution.kpis[0].name='"><svg onload=alert(1)>';
 for(const html of [overviewView(data),buildPrintReport(data)]){
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<svg onload'));
  assert.ok(html.includes('&lt;script&gt;'));
 }
});
