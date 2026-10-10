import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {generateWithAI} from '../lib/ai.mjs';
import {applyRevisionGuard,normalizeRevisionRequest} from '../lib/revision.mjs';
import {buildDemoReport} from '../lib/demo.mjs';
import {normalizeBrief} from '../lib/validate.mjs';
const brief=normalizeBrief({brand:'Luma Botanics',description:'Fictional skincare brand',region:'AU',industry:'Beauty & personal care',audience:'Sydney adults',valueProp:'Clear skincare labels',goal:'Market validation',budget:10000,channels:['Instagram','TikTok','Google Search']});
const original=buildDemoReport(brief);
const revision=normalizeRevisionRequest({brief,previousReport:original,sections:['strategy','evidence'],direction:'Reflect a small, non-representative qualitative interview set',records:[{kind:'interview',content:'In a convenience sample, 8 of 12 interviewees mentioned ingredient information.',source:'Internal interview notes, 2026-10-10',observedAt:'2026-10-10'}]});
test('live revision requests selected sections, labels self-reported evidence, and locks the rest',async()=>{
 let invoked=0;
 const mock=http.createServer(async(req,res)=>{
  invoked++;
  assert.equal(req.url,'/responses');
  assert.equal(req.headers.authorization,'Bearer private-test-key');
  let body='';for await(const part of req)body+=part;
  const j=JSON.parse(body);
  assert.equal(j.store,false);
  assert.deepEqual(JSON.parse(j.input[0].content).editableSections,['strategy','evidence']);
  assert.match(j.instructions,/UNVERIFIED/);
  assert.match(j.input[0].content,/convenience sample/);
  const fake=structuredClone(original);fake.strategy.summary='Reflect the small interview sample only, with limitations';
  fake.localisation.heroCopy='SHOULD NOT CHANGE';
  fake.execution.allocation=[{channel:'Email',amount:99999,percent:100,why:'hallucinated'}];
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(fake)}]}]}));
 });
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));
 try{
  const changed=await generateWithAI(brief,{apiKey:'private-test-key',model:'deepseek-flash',provider:'deepseek',baseUrl:`http://127.0.0.1:${mock.address().port}`,timeoutMs:5000,revision});
  const guarded=applyRevisionGuard(changed,revision);
  assert.equal(invoked,1);
  assert.equal(guarded.strategy.summary,'Reflect the small interview sample only, with limitations');
  assert.equal(guarded.localisation.heroCopy,original.localisation.heroCopy);
  assert.deepEqual(guarded.execution.allocation,original.execution.allocation);
 }finally{await new Promise(r=>mock.close(r))}
});
