/* Persist metadata only. Checkpoints, inputs, results and raw errors stay in AgentWorkflow memory. */
(function () {
  const KEY='dtb_workflow_runs',MAX=30,MAX_CHARS=512*1024,PREFIX='k-toolkit:workflow-run:';
  const say=(zh,en)=>window.getCurrentLang?.()==='en'?en:zh;
  const statuses=['running','completed','failed','cancelled','interrupted'];
  const errors=['validation','action_failed','cancelled','timeout','result_limit','runtime'];
  const only=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(key=>keys.includes(key));
  const number=v=>Number.isFinite(v)&&v>=0;
  const id=v=>typeof v==='string'&&/^wf-run-[a-zA-Z0-9-]{1,80}$/.test(v);
  const stepId=v=>typeof v==='string'&&/^[a-zA-Z][\w-]{0,39}$/.test(v);
  function valid(record) {
    if(!only(record,['id','name','source','appVersion','createdAt','updatedAt','startedAt','finishedAt','status','total','completed','nextStep','attempt','steps','attempts']))return false;
    if(!id(record.id)||typeof record.name!=='string'||record.name.length>80||!['studio','assistant','local'].includes(record.source)||typeof record.appVersion!=='string'||record.appVersion.length>64)return false;
    if(!['createdAt','updatedAt','startedAt'].every(key=>number(record[key]))||!(record.finishedAt===null||number(record.finishedAt))||!statuses.includes(record.status))return false;
    if(!Number.isInteger(record.total)||record.total<1||record.total>12||!Number.isInteger(record.completed)||record.completed<0||record.completed>record.total||!Number.isInteger(record.attempt)||record.attempt<1||record.attempt>20)return false;
    if(!Array.isArray(record.steps)||record.steps.length!==record.total||new Set(record.steps.map(s=>s?.id)).size!==record.total)return false;
    if(!record.steps.every(s=>only(s,['id','action','status','attempts','durationMs','reused','errorCode'])&&stepId(s.id)&&typeof s.action==='string'&&/^[a-z][a-z0-9_]{0,80}$/.test(s.action)&&['pending','running','completed','failed','cancelled'].includes(s.status)&&Number.isInteger(s.attempts)&&s.attempts>=0&&s.attempts<=20&&number(s.durationMs)&&typeof s.reused==='boolean'&&(s.errorCode===null||errors.includes(s.errorCode))))return false;
    if(!(record.nextStep===null||record.steps.some(s=>s.id===record.nextStep)))return false;
    return Array.isArray(record.attempts)&&record.attempts.length<=20&&record.attempts.every(a=>only(a,['attempt','status','startedAt','finishedAt','fromStep','completed'])&&Number.isInteger(a.attempt)&&a.attempt>=1&&a.attempt<=20&&statuses.includes(a.status)&&number(a.startedAt)&&(a.finishedAt===null||number(a.finishedAt))&&(a.fromStep===null||stepId(a.fromStep))&&Number.isInteger(a.completed)&&a.completed>=0&&a.completed<=12);
  }
  function validEnvelope(value) { return only(value,['version','items'])&&value.version===1&&Array.isArray(value.items)&&value.items.length<=MAX&&value.items.every(valid)&&new Set(value.items.map(r=>r.id)).size===value.items.length; }
  function read() {
    const raw=localStorage.getItem(KEY);if(raw===null)return [];
    let value;try{if(raw.length>MAX_CHARS)throw new Error();value=JSON.parse(raw);}catch{throw new Error(say('运行记录无法读取，可导出备份后清除记录。','Run history could not be read. Export a backup before clearing it.'));}
    if(!validEnvelope(value))throw new Error(say('运行记录格式无效，可导出备份后清除记录。','Run history is invalid. Export a backup before clearing it.'));
    return value.items;
  }
  async function active() {
    if(!navigator.locks?.query)return null;
    return new Set((await navigator.locks.query()).held.filter(lock=>lock.name.startsWith(PREFIX)).map(lock=>lock.name.slice(PREFIX.length)));
  }
  async function list({source}={}) {
    const items=read(),held=await active();
    return items.filter(r=>!source||r.source===source).map(r=>r.status==='running'&&held&&!held.has(r.id)?{...r,status:'interrupted'}:r).sort((a,b)=>b.updatedAt-a.updatedAt);
  }
  const lock=operation=>window.ToolRuntime.exclusive('workflow-history',operation);
  async function upsert(record) {
    if(!valid(record))throw new Error('Invalid workflow run summary');
    const copy=JSON.parse(JSON.stringify(record));
    return lock(async()=>{
      const items=read().filter(r=>r.id!==copy.id);items.push(copy);items.sort((a,b)=>b.updatedAt-a.updatedAt);
      const held=await active();
      while(items.length>MAX){const index=items.findLastIndex(r=>r.id!==copy.id&&!held?.has(r.id));if(index<0)throw new Error(say('运行记录已满，请等待运行结束。','Run history is full; wait for active runs to finish.'));items.splice(index,1);}
      const text=JSON.stringify({version:1,items});if(text.length>MAX_CHARS)throw new Error('Workflow run summaries exceed 512 KiB');
      localStorage.setItem(KEY,text);
    });
  }
  async function remove(runId) {
    return lock(async()=>{if((await active())?.has(runId))throw new Error(say('运行中的记录不能删除。','An active run cannot be deleted.'));const items=read();localStorage.setItem(KEY,JSON.stringify({version:1,items:items.filter(r=>r.id!==runId)}));return [runId];});
  }
  async function clear() {
    return lock(async()=>{
      const held=await active();let items;
      try{items=read();}catch(error){if(held?.size)throw error;localStorage.removeItem(KEY);return [];}
      const keep=items.filter(r=>held?.has(r.id));localStorage.setItem(KEY,JSON.stringify({version:1,items:keep}));return items.filter(r=>!held?.has(r.id)).map(r=>r.id);
    });
  }
  function withRunLock(runId,operation) { return navigator.locks?.request?navigator.locks.request(PREFIX+runId,operation):operation(); }
  (window.KCompute ||= {})['workflow-history']=Object.freeze({KEY,MAX,valid,validEnvelope,list,upsert,remove,clear,withRunLock});
})();
