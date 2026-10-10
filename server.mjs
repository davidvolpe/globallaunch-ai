import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadDotEnv } from './lib/config.mjs';
import { normalizeBrief, assertReportShape } from './lib/validate.mjs';
import { buildDemoReport } from './lib/demo.mjs';
import { generateWithAI } from './lib/ai.mjs';
import {normalizeRevisionRequest,applyRevisionGuard,demoRevision,diffSections} from './lib/revision.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(root, '.env'));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
// Use DeepSeek by default when its key is present. Keep OpenAI compatibility.
const provider = (process.env.AI_PROVIDER || (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'openai')).toLowerCase();
if (!['openai','deepseek'].includes(provider)) throw new Error('AI_PROVIDER 必须是 deepseek 或 openai。');
const apiKey = provider === 'deepseek' ? (process.env.DEEPSEEK_API_KEY || '') : (process.env.OPENAI_API_KEY || '');
const aiConfigured = Boolean(apiKey);
const baseUrl = provider === 'deepseek' ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com') : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
const model = provider === 'deepseek' ? (process.env.DEEPSEEK_MODEL || 'deepseek-flash') : (process.env.OPENAI_MODEL || 'gpt-4.1-mini');
const appAccessCode = process.env.APP_ACCESS_CODE || '';
const maxDailyLiveCalls = Math.max(1, Math.min(10000, Number(process.env.MAX_DAILY_LIVE_CALLS || 60) || 60));
let dayStamp = '';
let dailyLiveCalls = 0;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.ico':'image/x-icon'};
const publicRoot = path.join(root, 'public');
const requests = new Map();

function headers(type='application/json; charset=utf-8') {
  return {
    'Content-Type': type, 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
    'X-Frame-Options':'DENY', 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
  };
}
function json(res, status, data, extra={}) { res.writeHead(status,{...headers(), 'Cache-Control':'no-store', ...extra}); res.end(JSON.stringify(data)); }
function clientIP(req) {
  if(process.env.TRUST_PROXY==='true') return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  return req.socket.remoteAddress || 'unknown';
}
function limit(req) {
  const key = clientIP(req);
  const now = Date.now();
  const history = (requests.get(key) || []).filter(t => now-t < 60_000);
  if(history.length >= (aiConfigured ? 5 : 15)) { requests.set(key,history); return false; }
  history.push(now); requests.set(key,history);
  if(requests.size > 3000) for(const [ip, times] of requests) if(times.every(t=>now-t>60_000)) requests.delete(ip);
  return true;
}
function authorized(req) {
  if(!appAccessCode) return true;
  const given = String(req.headers['x-demo-access-code'] || '');
  const a = Buffer.from(appAccessCode);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a,b);
}
function dailyQuotaAvailable() {
  const date = new Date().toISOString().slice(0,10);
  if(dayStamp !== date) { dayStamp = date; dailyLiveCalls = 0; }
  if(dailyLiveCalls >= maxDailyLiveCalls) return false;
  dailyLiveCalls++;
  return true;
}
async function readJSON(req, maxSize=16_384) {
  let size = 0, parts = [];
  for await(const chunk of req) {
    size += chunk.length;
    if(size > maxSize) { const e=new Error('提交内容过大。');e.status=413;throw e; }
    parts.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { const e = new Error('提交内容不是合法的JSON。');e.status=400;throw e; }
}
async function serve(req, res, url) {
  let requestPath;
  try { requestPath = decodeURIComponent(url.pathname); }
  catch { return json(res,400,{error:'无效路径。'}); }
  if(requestPath==='/' || requestPath==='/index.html') requestPath='/index.html';
  if(!/^\/[\w./-]+$/.test(requestPath) || requestPath.includes('..')) return json(res,404,{error:'Not found'});
  const absolute = path.resolve(publicRoot, '.'+requestPath);
  if(!absolute.startsWith(publicRoot + path.sep)) return json(res,404,{error:'Not found'});
  try {
    const data=await fs.readFile(absolute);
    res.writeHead(200,{...headers(mime[path.extname(absolute)]||'application/octet-stream'), 'Cache-Control':'no-store'});
    res.end(data);
  } catch { json(res,404,{error:'页面不存在。'}); }
}
const app = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if(url.pathname==='/api/health' && req.method==='GET') return json(res,200,{ok:true,mode:aiConfigured?'live':'demo',model:aiConfigured?model:null,version:'0.6.0',provider:aiConfigured?provider:null,accessRequired:Boolean(appAccessCode)});
    if(url.pathname==='/api/generate') {
      if(req.method!=='POST') return json(res,405,{error:'Method not allowed'},{Allow:'POST'});
      if(!limit(req)) return json(res,429,{error:'操作太频繁，请一分钟后重试。'});
      if(!authorized(req)) return json(res,401,{error:'访问口令不正确，请填写项目演示口令。'});
      if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return json(res,415,{error:'请提交JSON格式数据。'});
      const brief=normalizeBrief(await readJSON(req));
      if(aiConfigured && !dailyQuotaAvailable()) return json(res,429,{error:'本日 AI 演示额度已用完，请明天再试。'});
      const report=assertReportShape(aiConfigured?await generateWithAI(brief,{apiKey,baseUrl,model,provider}):buildDemoReport(brief));
      return json(res,200,{ meta:{mode:aiConfigured?'live':'demo',model:aiConfigured?model:null,provider:aiConfigured?provider:null,generatedAt:new Date().toISOString(),region:brief.region,currency:brief.currency,notice:aiConfigured?'AI生成的草稿，需人工验证。':'演示模式：本地规则模板生成，未调用AI模型。'}, brief, report });
    }
    if(url.pathname==='/api/revise') {
      if(req.method!=='POST') return json(res,405,{error:'Method not allowed'},{Allow:'POST'});
      if(!limit(req)) return json(res,429,{error:'操作太频繁，请一分钟后重试。'});
      if(!authorized(req)) return json(res,401,{error:'访问口令不正确，请填写项目演示口令。'});
      if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return json(res,415,{error:'请提交JSON格式数据。'});
      const revision=normalizeRevisionRequest(await readJSON(req,70_000));
      if(aiConfigured && !dailyQuotaAvailable()) return json(res,429,{error:'本日 AI 演示额度已用完，请明天再试。'});
      const suggested=aiConfigured
        ? await generateWithAI(revision.brief,{apiKey,baseUrl,model,provider,revision})
        : demoRevision(revision);
      const report=applyRevisionGuard(suggested,revision);
      return json(res,200,{meta:{mode:aiConfigured?'live':'demo',model:aiConfigured?model:null,provider:aiConfigured?provider:null,generatedAt:new Date().toISOString(),currency:revision.brief.currency,region:revision.brief.region,notice:aiConfigured?'AI修订草稿，新增材料未经独立核验。':'模拟修订模式：本地规则修改，未调用AI模型。'},brief:revision.brief,report,revision:{changedSections:diffSections(revision.previousReport,report),requestedSections:revision.sections,records:revision.records}});
    }
    if(req.method!=='GET' && req.method!=='HEAD') return json(res,405,{error:'Method not allowed'});
    return await serve(req,res,url);
  } catch(e) {
    const status=e.status || 502;
    console.error(`[request failed] ${status}: ${e.message}`);
    return json(res,status,{error:status>=500?e.message:e.message});
  }
});

if(import.meta.url===`file://${process.argv[1]}` || process.env.NODE_ENV !== 'test') {
  app.listen(port,host,()=>console.log(`GlobalLaunch AI available at http://${host}:${port} | ${aiConfigured?'LIVE AI':'DEMO'}`));
}
export {app};
