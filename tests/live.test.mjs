import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const sample = {brand:'Luma Botanics',description:'Fictional skincare brand',region:'AU',industry:'Beauty & personal care',audience:'Sydney adults',valueProp:'Clear ingredient descriptions',goal:'Market validation',budget:10000,channels:['Instagram','TikTok','Google Search']};
const {app} = await (async()=>{
  process.env.NODE_ENV = 'test';
  process.env.OPENAI_API_KEY = 'mock-only-secret';
  process.env.OPENAI_MODEL = 'gpt-4.1-mini';
  process.env.APP_ACCESS_CODE = 'interview-demo-code';
  process.env.MAX_DAILY_LIVE_CALLS = '1';
  // The API endpoint will be configured after starting the mock upstream server,
  // before the main app import (below).
  let hits = 0;
  const mock = http.createServer(async (req,res)=>{
    hits++;
    assert.equal(req.url,'/responses');
    let body='';for await(const chunk of req)body+=chunk;
    assert.equal(req.headers.authorization,'Bearer mock-only-secret');
    const data=JSON.parse(body);
    assert.equal(data.text.format.strict,true);
    const {buildDemoReport} = await import('../lib/demo.mjs');
    const {normalizeBrief} = await import('../lib/validate.mjs');
    const report=buildDemoReport(normalizeBrief(sample));
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(report)}]}]}));
  });
  await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${mock.address().port}`;
  const {app} = await import('../server.mjs');
  app.mockServer = mock;
  app.getUpstreamHits = () => hits;
  return {app};
})();
let base;
before(async()=>{
  await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${app.address().port}`;
});
after(async()=>{
  await new Promise(resolve=>app.close(resolve));
  await new Promise(resolve=>app.mockServer.close(resolve));
});

test('health reports key configured without exposing its value',async()=>{
  const r=await fetch(`${base}/api/health`);
  const data=await r.json();
  assert.equal(data.mode,'live');
  assert.equal(data.accessRequired,true);
  assert.equal(data.model,'gpt-4.1-mini');
  assert.doesNotMatch(JSON.stringify(data),/mock-only-secret/);
});
test('access code is required and invalid entries do not spend quota',async()=>{
  const r=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Access-Code':'wrong'},body:JSON.stringify(sample)});
  assert.equal(r.status,401);
  assert.equal(app.getUpstreamHits(),0);
});
test('live mode calls mocked OpenAI REST API and returns structured report',async()=>{
  const r=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Access-Code':'interview-demo-code'},body:JSON.stringify(sample)});
  assert.equal(r.status,200);
  const data=await r.json();
  assert.equal(data.meta.mode,'live');
  assert.equal(data.report.execution.timeline.length,4);
  assert.equal(app.getUpstreamHits(),1);
  assert.doesNotMatch(JSON.stringify(data),/mock-only-secret/);
});
test('daily quota caps additional paid calls',async()=>{
  const r=await fetch(`${base}/api/generate`,{method:'POST',headers:{'Content-Type':'application/json','X-Demo-Access-Code':'interview-demo-code'},body:JSON.stringify(sample)});
  assert.equal(r.status,429);
  const data=await r.json();
  assert.match(data.error,/本日/);
  assert.equal(app.getUpstreamHits(),1);
});
