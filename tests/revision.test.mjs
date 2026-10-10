import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {app} from '../server.mjs';
import {buildDemoReport} from '../lib/demo.mjs';
import {normalizeBrief} from '../lib/validate.mjs';
import {normalizeRevisionRequest,applyRevisionGuard,diffSections} from '../lib/revision.mjs';
import {emptyLibrary,addProjectVersion,checkLibrary,allProjectEvidence} from '../public/project-store.mjs';
const brief=normalizeBrief({brand:'Luma Botanics',description:'Fictional skincare brand',region:'AU',industry:'Beauty & personal care',audience:'Sydney urban women',valueProp:'Clear labels',goal:'Market validation',budget:10000,channels:['Instagram','TikTok','Google Search']});
const original=buildDemoReport(brief);
const evidence={kind:'interview',content:'We interviewed 12 potential users and 8 described labels as important, but the sample was non-random.',source:'Internal interview notes, 2026-10-10',observedAt:'2026-10-10'};
const payload={brief,previousReport:original,records:[evidence],sections:['strategy','evidence'],direction:'Update hypotheses without making market-wide claims'};
let base;
before(async()=>{await new Promise(r=>app.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${app.address().port}`});
after(async()=>{await new Promise(r=>app.close(r))});
test('revision request validates sources, length and section allowlist',()=>{
 const p=normalizeRevisionRequest(payload);
 assert.equal(p.records[0].verification,'user-supplied-unverified');
 assert.throws(()=>normalizeRevisionRequest({...payload,sections:['foo']}),/章节/);
 assert.throws(()=>normalizeRevisionRequest({...payload,records:[{...evidence,source:''}]}),/来源/);
 assert.throws(()=>normalizeRevisionRequest({...payload,records:[{...evidence,content:'short'}]}),/10至1400/);
});
test('server locks unselected sections and enforces budget/channel integrity',()=>{
 const rev=normalizeRevisionRequest(payload);
 const r=structuredClone(original);r.localisation.heroCopy='UNAUTHORIZED CHANGE';r.strategy.summary='New hypothesis: user-reported information';r.execution.allocation=[{channel:'Email',percent:100,amount:999999,why:'wrong'}];
 const guarded=applyRevisionGuard(r,rev);
 assert.equal(guarded.localisation.heroCopy,original.localisation.heroCopy);
 assert.deepEqual(guarded.execution.allocation,original.execution.allocation);
 assert.equal(guarded.strategy.summary,'New hypothesis: user-reported information');
 assert.deepEqual(diffSections(original,guarded),['strategy']);
});
test('demo revision shows unverified additions and never alters original',async()=>{
 const origCopy=JSON.stringify(original);
 const r=await fetch(`${base}/api/revise`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 assert.equal(r.status,200); const data=await r.json();
 assert.equal(data.meta.mode,'demo');
 assert.match(data.meta.notice,/未调用AI/);
 assert.match(data.report.strategy.assumptions[0],/尚未独立核验/);
 assert.equal(data.report.localisation.heroCopy,original.localisation.heroCopy);
 assert.deepEqual(data.report.execution.allocation,original.execution.allocation);
 assert.deepEqual(data.revision.changedSections,['strategy','evidence']);
 assert.equal(JSON.stringify(original),origCopy);
});
test('revision route validates content type, missing sources, invalid sections',async()=>{
 const headers={'Content-Type':'application/json'};
 let r=await fetch(`${base}/api/revise`,{method:'POST',headers,body:JSON.stringify({...payload,sections:['forbidden']})});assert.equal(r.status,400);
 r=await fetch(`${base}/api/revise`,{method:'POST',headers,body:JSON.stringify({...payload,records:[{...evidence,source:''}]})});assert.equal(r.status,400);
 r=await fetch(`${base}/api/revise`,{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});assert.equal(r.status,415);
});
test('local project versions are immutable; restoring earlier version keeps later versions',()=>{
 const item=(report,at)=>({brief,report,meta:{mode:'demo',currency:'AUD',generatedAt:at,notice:'demo'}});
 let library=addProjectVersion(emptyLibrary(),{data:item(original,'2026-10-10'),reason:'Initial'},()=> 'proj1');
 const r2=structuredClone(original);r2.strategy.summary='Updated';
 library=addProjectVersion(library,{projectId:'proj1',data:item(r2,'2026-10-11'),reason:'Evidence revision',records:[evidence]});
 assert.equal(library.projects[0].versions.length,2);
 assert.notEqual(library.projects[0].versions[0].data.report.strategy.summary,r2.strategy.summary);
 assert.equal(allProjectEvidence(library.projects[0]).length,1);
 assert.equal(allProjectEvidence(library.projects[0],1).length,0);
 assert.deepEqual(checkLibrary(library).projects[0].versions.map(x=>x.number),[1,2]);
});
