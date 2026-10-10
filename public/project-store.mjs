// Small, dependency-free local project library. Data remains on this browser;
// this is NOT a cloud database or a collaborative store.
export const STORAGE_KEY='globallaunch.projects.v06';
export const emptyLibrary=()=>({schema:1,activeId:null,projects:[]});
const cloned=x=>JSON.parse(JSON.stringify(x));
const validData=d=>Boolean(d&&d.brief&&typeof d.brief.brand==='string'&&d.report&&d.report.strategy&&d.report.execution&&d.meta&&Array.isArray(d.brief.channels));
const cleanId=id=>String(id||'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
export function checkLibrary(input){
  if(!input||input.schema!==1||!Array.isArray(input.projects)||input.projects.length>12)throw Error('项目备份格式无效或数量超限。');
  const ids=new Set();
  const projects=input.projects.map(p=>{
    if(!p||typeof p!=='object'||!cleanId(p.id)||ids.has(p.id)||!Array.isArray(p.versions)||p.versions.length>12||!p.versions.length)throw Error('项目记录格式无效。');
    ids.add(p.id);
    const versions=p.versions.map((v,i)=>{
      if(!v||!validData(v.data)||typeof v.createdAt!=='string')throw Error('报告版本内容无效。');
      return {id:cleanId(v.id)||`${cleanId(p.id)}-${i+1}`,number:i+1,createdAt:v.createdAt.slice(0,35),reason:String(v.reason||'初始生成').slice(0,200),data:cloned(v.data),records:Array.isArray(v.records)?cloned(v.records).slice(0,5):[]};
    });
    return {id:cleanId(p.id),name:String(p.name||versions.at(-1).data.brief.brand).slice(0,80),versions};
  });
  return {schema:1,activeId:ids.has(input.activeId)?input.activeId:(projects.at(-1)?.id||null),projects};
}
export function loadLibrary(storage){
  try {const raw=storage.getItem(STORAGE_KEY);return raw?checkLibrary(JSON.parse(raw)):emptyLibrary();}
  catch {return emptyLibrary()}
}
export function saveLibrary(storage,lib){
  const checked=checkLibrary(lib);
  const json=JSON.stringify(checked);
  if(json.length>2_500_000)throw Error('本地历史超过大小限制，请先导出备份并清理不需要的项目。');
  storage.setItem(STORAGE_KEY,json);
  return checked;
}
export function addProjectVersion(lib,{projectId=null,data,reason='初始生成',records=[]},newId=()=>`p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`){
  if(!validData(data))throw Error('报告数据不完整，无法存档。');
  const next=cloned(lib);
  let project=next.projects.find(p=>p.id===projectId);
  if(!project){project={id:newId(),name:data.brief.brand,versions:[]};next.projects.push(project)}
  if(project.versions.length>=12)throw Error('这个项目已有12个版本，请导出备份后新建项目。');
  const number=project.versions.length+1;
  project.versions.push({id:`${project.id}-v${number}`,number,createdAt:new Date().toISOString(),reason:String(reason).slice(0,200),data:cloned(data),records:cloned(records).slice(0,5)});
  project.name=data.brief.brand;
  next.activeId=project.id;
  if(next.projects.length>12)throw Error('最多保存12个项目，请导出备份并清理旧项目。');
  return next;
}
export function currentProject(lib){return lib.projects.find(p=>p.id===lib.activeId)||null}
export function allProjectEvidence(project,upto=Infinity){return (project?.versions||[]).filter(v=>v.number<=upto).flatMap(v=>(v.records||[]).map(x=>({...x,version:v.number})));}
export function safeDiff(before,after,sections){return sections.filter(s=>JSON.stringify(before?.[s])!==JSON.stringify(after?.[s]));}
