import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { normalizeBrief } from '../lib/validate.mjs';
import { buildDemoReport } from '../lib/demo.mjs';

const brief = { brand:'Luma Botanics',description:'Fictional skincare brand',region:'AU',industry:'Beauty & personal care',audience:'Sydney adults',valueProp:'Clear ingredient descriptions',goal:'Market validation',budget:10000,channels:['Instagram','TikTok','Google Search'] };

test('accepts a valid brief and assigns regional currency',()=>{
  const normalized=normalizeBrief(brief);
  assert.equal(normalized.currency,'AUD');
  assert.equal(normalized.brand,'Luma Botanics');
});
test('rejects unsupported market, empty channels and invalid budget',()=>{
  assert.throws(()=>normalizeBrief({...brief,region:'ZZ'}));
  assert.throws(()=>normalizeBrief({...brief,channels:[]}));
  assert.throws(()=>normalizeBrief({...brief,budget:-1}));
});
test('allocations total 100% and exact budget across every number of channels',()=>{
  for(const channels of [brief.channels,['Instagram'],['Instagram','Email','TikTok','LinkedIn','Google Search']]){
    const b=normalizeBrief({...brief,budget:10457,channels});
    const r=buildDemoReport(b);
    assert.equal(r.execution.allocation.reduce((x,a)=>x+a.percent,0),100);
    assert.equal(r.execution.allocation.reduce((x,a)=>x+a.amount,0),b.budget);
    assert.ok(r.strategy.assumptions.length>=2);
  }
});

process.env.NODE_ENV='test';
const {app} = await import('../server.mjs');
let base;
before(async()=>{await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${app.address().port}`});
after(async()=>{await new Promise(resolve=>app.close(resolve))});

test('health endpoint returns mode and does not expose credentials',async()=>{
  const response=await fetch(`${base}/api/health`);
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.mode,'demo');
  assert.equal('apiKey' in data,false);
});
test('API produces a structured demo report and labels the generator accurately',async()=>{
  const response=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(brief)});
  assert.equal(response.status,200);
  const data=await response.json();
  assert.equal(data.meta.mode,'demo');
  assert.match(data.meta.notice,/未调用AI模型/);
  assert.equal(data.report.execution.timeline.length,4);
  assert.equal(data.report.execution.allocation.reduce((a,c)=>a+c.amount,0),10000);
});
test('API rejects bad input with a 400 response',async()=>{
  const response=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...brief,channels:[]})});
  assert.equal(response.status,400);
});
test('website home page is served with CSP protection',async()=>{
  const response=await fetch(`${base}/`);
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy'),/script-src 'self'/);
  const html=await response.text();
  assert.match(html,/GlobalLaunch AI/);
});
test('blocks path traversal and non-JSON API requests',async()=>{
  const traversal=await fetch(`${base}/%2e%2e/%2e%2e/etc/passwd`);
  assert.equal(traversal.status,404);
  const invalid=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'text/plain'},body:'{}'});
  assert.equal(invalid.status,415);
});

test('Responses API sends strict schema, keeps key server-side and repairs budgets',async()=>{
  const {generateWithAI}=await import('../lib/ai.mjs');
  const mock=http.createServer(async(req,res)=>{
    assert.equal(req.url,'/responses');
    assert.equal(req.headers.authorization,'Bearer test-key');
    let raw='';for await(const c of req)raw+=c;
    const j=JSON.parse(raw);
    assert.equal(j.text.format.type,'json_schema');
    assert.equal(j.text.format.strict,true);
    assert.equal(j.text.format.schema.additionalProperties,false);
    assert.equal(j.store,false);
    assert.equal(j.model,'gpt-4.1-mini');
    assert.match(JSON.stringify(j.input),/Luma Botanics/);
    const fake=buildDemoReport(normalizeBrief(brief));
    fake.execution.allocation.forEach((a,i)=>{a.percent=i===0?71:18;a.amount=1});
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({id:'resp_test',status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(fake)}]}]}));
  });
  await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
  try{
    const result=await generateWithAI(normalizeBrief(brief),{apiKey:'test-key',model:'gpt-4.1-mini',baseUrl:`http://127.0.0.1:${mock.address().port}`,timeoutMs:3500});
    assert.equal(result.execution.allocation.reduce((a,c)=>a+c.percent,0),100);
    assert.equal(result.execution.allocation.reduce((a,c)=>a+c.amount,0),brief.budget);
    assert.deepEqual(result.execution.allocation.map(x=>x.channel),brief.channels);
  }finally{await new Promise(resolve=>mock.close(resolve))}
});

test('budget reconciliation is robust to missing channels, negative and zero weights',async()=>{
  const {repairBudget}=await import('../lib/ai.mjs');
  for (const channels of [ ['Email'],['Email','LinkedIn','Instagram'],['Instagram','TikTok','Google Search','Email','LinkedIn'] ]) {
    const b=normalizeBrief({...brief,budget:11111,channels});
    const report=buildDemoReport(b);
    report.execution.allocation=[{channel:'Instagram',percent:-5,why:'no'},{channel:'Unknown',percent:200,why:'ignore'}];
    repairBudget(report,b);
    assert.equal(report.execution.allocation.reduce((a,c)=>a+c.percent,0),100);
    assert.equal(report.execution.allocation.reduce((a,c)=>a+c.amount,0),b.budget);
    assert.ok(report.execution.allocation.every(x=>x.percent>=0 && x.amount>=0));
    assert.deepEqual(report.execution.allocation.map(x=>x.channel),channels);
  }
});

test('handles refusal and incomplete Responses API outputs safely',async()=>{
  const {extractResponseText}=await import('../lib/ai.mjs');
  assert.throws(()=>extractResponseText({status:'incomplete'}),/长度不足/);
  assert.throws(()=>extractResponseText({output:[{content:[{type:'refusal',refusal:'No'}]}]}),/拒绝/);
  assert.equal(extractResponseText({output:[{content:[{type:'output_text',text:'hello'}]}]}),'hello');
});

test('maps upstream API errors to actionable messages without leaking secrets',async()=>{
  const {generateWithAI}=await import('../lib/ai.mjs');
  const mock=http.createServer((req,res)=>{
    res.writeHead(401,{'Content-Type':'application/json'});
    res.end(JSON.stringify({error:{message:'Secret test-key should not be shown'}}));
  });
  await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
  try{
    await assert.rejects(
      generateWithAI(normalizeBrief(brief),{apiKey:'test-key',baseUrl:`http://127.0.0.1:${mock.address().port}`}),
      err=>{assert.match(err.message,/鉴权失败/); assert.doesNotMatch(err.message,/test-key/);return true}
    );
  }finally{await new Promise(resolve=>mock.close(resolve))}
});

// Regression: prevent split-version UIs after a local upgrade.
test('versioned app and stylesheet bypass stale browser caches',async()=>{
  const home = await fetch(`${base}/`);
  assert.equal(home.headers.get('cache-control'),'no-store');
  const html = await home.text();
  assert.match(html,/app\.js\?v=0\.6\.0/);
  assert.match(html,/styles\.css\?v=0\.6\.0/);
  for (const file of ['/app.js?v=0.5.0','/styles.css?v=0.5.0','/report-view.mjs']) {
    const res = await fetch(`${base}${file}`);
    assert.equal(res.status,200);
    assert.equal(res.headers.get('cache-control'),'no-store');
  }
  const appRes=await fetch(`${base}/app.js?v=0.5.0`);
  const appJs=await appRes.text();
  assert.match(appJs,/↗ 导出PDF/);
  assert.match(appJs,/决策总览/);
});
