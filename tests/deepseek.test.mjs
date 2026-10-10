import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateWithAI } from '../lib/ai.mjs';
import { normalizeBrief } from '../lib/validate.mjs';
import { buildDemoReport } from '../lib/demo.mjs';
const brief = normalizeBrief({ brand:'Example brand',description:'Fictional B2C product',region:'AU',industry:'Beauty & personal care',audience:'Sydney adults',valueProp:'clear information',goal:'Market validation',budget:600,channels:['Instagram','Google Search']});

test('DeepSeek Responses API receives correct model, schema, and server-side key',async()=>{
  let hits=0;
  const mock=http.createServer(async(req,res)=>{
    hits++;
    assert.equal(req.url,'/responses');
    assert.equal(req.headers.authorization,'Bearer MOCK_DEEPSEEK_KEY');
    let raw='';for await(const chunk of req)raw+=chunk;
    const data=JSON.parse(raw);
    assert.equal(data.model,'deepseek-flash');
    assert.equal(data.reasoning.effort,'none');
    assert.equal(data.text.format.type,'json_schema');
    assert.equal(data.text.format.strict,true);
    const fake=buildDemoReport(brief);
    res.writeHead(200,{'Content-Type':'application/json'});
    res.end(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(fake)}]}]}));
  });
  await new Promise(resolve=>mock.listen(0,'127.0.0.1',resolve));
  try {
    const result=await generateWithAI(brief,{apiKey:'MOCK_DEEPSEEK_KEY',provider:'deepseek',model:'deepseek-flash',baseUrl:`http://127.0.0.1:${mock.address().port}`,timeoutMs:3000});
    assert.equal(hits,1);
    assert.equal(result.execution.allocation.reduce((s,c)=>s+c.amount,0),600);
    assert.equal(JSON.stringify(result).includes('MOCK_DEEPSEEK_KEY'),false);
  }finally{await new Promise(resolve=>mock.close(resolve));}
});

test('DeepSeek authentication errors never expose upstream secrets',async()=>{
 const server=http.createServer((_req,res)=>{res.writeHead(401,{'Content-Type':'text/plain'});res.end('Secret: MOCK_DEEPSEEK_KEY')});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {await assert.rejects(generateWithAI(brief,{apiKey:'MOCK_DEEPSEEK_KEY',provider:'deepseek',model:'deepseek-flash',baseUrl:`http://127.0.0.1:${server.address().port}`,timeoutMs:3000}), e=>{assert.match(e.message,/DeepSeek API 鉴权失败/); assert.doesNotMatch(e.message,/MOCK_DEEPSEEK_KEY/); return true;});}
 finally{await new Promise(resolve=>server.close(resolve));}
});
