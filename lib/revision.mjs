import {normalizeBrief, assertReportShape} from './validate.mjs';
import {repairBudget} from './ai.mjs';

export const REPORT_SECTIONS = ['strategy','localisation','execution','risk','evidence'];
const kinds = ['interview','campaign','research','idea'];
function invalid(msg){const e=new Error(msg);e.status=400;throw e;}
export function normalizeRevisionRequest(input){
  if(!input || typeof input!=='object' || Array.isArray(input))invalid('修订请求格式不正确。');
  const brief = normalizeBrief(input.brief);
  const raw = input.previousReport;
  if(!raw || typeof raw!=='object' || Array.isArray(raw))invalid('请先生成报告，再进行修订。');
  const previousReport=structuredClone(assertReportShape(raw));
  const originalSize=JSON.stringify(previousReport).length;
  if(originalSize > 42000)invalid('原报告过大，请缩短后再试。');
  const sections=Array.isArray(input.sections)? [...new Set(input.sections)] : [];
  if(sections.length===0 || sections.length>REPORT_SECTIONS.length || sections.some(s=>!REPORT_SECTIONS.includes(s)))invalid('请选择至少一个有效的修订章节。');
  const rawRecords=input.records;
  if(!Array.isArray(rawRecords) || rawRecords.length<1 || rawRecords.length>5)invalid('每次请添加1至5条证据或新想法。');
  const records=rawRecords.map((x,i)=>{
    if(!x || typeof x!=='object')invalid(`第${i+1}条信息无效。`);
    const kind=String(x.kind||'');
    if(!kinds.includes(kind))invalid('不支持的信息类型。');
    const content=String(x.content||'').trim();
    const source=String(x.source||'').trim();
    const observedAt=String(x.observedAt||'').trim();
    if(content.length<10 || content.length>1400)invalid('每条补充内容应为10至1400字。');
    if(source.length>260)invalid('来源不能超过260字。');
    if(kind!=='idea'&&!source)invalid('访谈、投放数据或研究资料必须填写来源说明。');
    if(observedAt && !/^\d{4}-\d{2}-\d{2}$/.test(observedAt))invalid('日期格式应为YYYY-MM-DD。');
    return {kind,content,source,observedAt,verification:'user-supplied-unverified'};
  });
  const direction=String(input.direction||'').trim();
  if(direction.length>800)invalid('修改要求请控制在800字以内。');
  return {brief,previousReport,records,sections,direction};
}
export function applyRevisionGuard(candidate,revision){
  const base=structuredClone(revision.previousReport);
  assertReportShape(candidate);
  for(const section of revision.sections){base[section]=structuredClone(candidate[section]);}
  // Original client budget and channel list remain authoritative, even for changed execution.
  repairBudget(base,revision.brief);
  assertReportShape(base);
  return base;
}
export function demoRevision(revision){
  const out=structuredClone(revision.previousReport);
  const excerpt=revision.records[0].content.slice(0,170);
  const note=`用户新增材料（尚未独立核验）：${excerpt}`;
  if(revision.sections.includes('strategy')) {
    out.strategy.assumptions=[note,...out.strategy.assumptions].slice(0,8);
    out.strategy.nextValidation=[`验证新增材料来源和样本适用范围；${revision.direction||'再决定是否调整市场定位'}`,...out.strategy.nextValidation].slice(0,8);
  }
  if(revision.sections.includes('localisation')) out.localisation.culturalNotes=[`根据新增材料重新检查文案（模拟修订，未使用AI）：${excerpt}`,...out.localisation.culturalNotes].slice(0,8);
  if(revision.sections.includes('execution')) out.execution.timeline[0].actions=[`评估新增材料对本周安排的影响：${excerpt}`,...out.execution.timeline[0].actions].slice(0,8);
  if(revision.sections.includes('risk')) out.risk.checklist=[`核查新材料的真实性及使用授权：${excerpt}`,...out.risk.checklist].slice(0,8);
  if(revision.sections.includes('evidence')) out.evidence.claims=[{claim:excerpt,status:'Needs evidence',verification:`用户提供；来源：${revision.records[0].source||'未注明'}。尚未独立核实。`},...out.evidence.claims].slice(0,12);
  return applyRevisionGuard(out,revision);
}
export function diffSections(before,after){
  return REPORT_SECTIONS.filter(s=>JSON.stringify(before[s])!==JSON.stringify(after[s]));
}
