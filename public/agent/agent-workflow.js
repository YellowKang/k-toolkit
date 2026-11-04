'use strict';

// Explicit allowlist: discovering an action does not make it safe to compose.
window.AgentWorkflow = (() => {
  const outputs = {
    date_diff: ['data.days','data.calendar','data.weekdays'], color_convert: ['data.result','data.formats'], ip_calc: ['data.network','data.usableHosts'], timestamp_convert: ['data.result','data.iso'], timezone_convert: ['data.result','data.iso'],
    base64_encode: ['data.result'], base64_decode: ['data.result'],
    json_format: ['data.result'], json_validate: ['data.valid'], json_extract: ['data.result', 'data.value'],
    json_unescape: ['data.result'], json_expand: ['data.result', 'data.count', 'data.layers'],
    string_escape: ['data.result'], sql_format: ['data.result'],
    text_lines: ['data.result'], case_convert: ['data.result'], wordcount: ['data'],
    hash_generate: ['data.hash'], hash_all: ['data.results'], hmac_generate: ['data.hash'],
    url_encode: ['data.result'], url_decode: ['data.result'], url_parse: ['data.entries','data.params','data.result'], url_build: ['data.result'],
    json_to_csv: ['data.result','data.rows'], csv_to_json: ['data.result','data.rows'],
    json_schema_generate: ['data.result'], json_schema_validate: ['data.valid','data.errors'],
    json_schema_mock: ['data.result','data.typescript','data.count'],
    yaml_to_json: ['data.result'], json_to_yaml: ['data.result'], toml_to_json: ['data.result'], json_to_toml: ['data.result','data.dropped'],
    xml_format: ['data.result'], xml_to_json: ['data.result'], calculate: ['data.result'], unit_convert: ['data.result'],
  };
  const LIMIT = 65536;
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const safeKey = key => !['__proto__', 'prototype', 'constructor'].includes(key);
  const checkSize = value => { if (JSON.stringify(value).length > LIMIT) throw new Error('Workflow data exceeds 65536 characters'); };
  const checkCancelled = signal => { if (signal?.aborted) throw Object.assign(new Error('Task cancelled'), { name: 'AbortError' }); };
  function mapParams(value, resolve, depth = 0) {
    if (depth > 20) throw new Error('Parameters are nested too deeply');
    if (value === null || typeof value !== 'object') return value;
    if (own(value, '$ref')) {
      if (Object.keys(value).length !== 1 || typeof value.$ref !== 'string') throw new Error('A reference must contain only a string $ref');
      return resolve(value.$ref);
    }
    if (Array.isArray(value)) return value.map(item => mapParams(item, resolve, depth + 1));
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      if (!safeKey(key)) throw new Error('Unsafe parameter key');
      result[key] = mapParams(item, resolve, depth + 1);
    }
    return result;
  }
  function referenceParts(ref) {
    const parts = ref.split('.');
    if (parts.length < 2 || parts[1] !== 'data' || parts.some(part => !part || !safeKey(part))) throw new Error('Invalid result reference: ' + ref);
    return parts;
  }
  function validate({ steps, returnSteps }) {
    if (!Array.isArray(steps) || !steps.length || steps.length > 12) throw new Error('A workflow requires 1–12 steps');
    checkSize(steps);
    const known = new Set();
    const actions = new Map();
    // Validate the entire plan before the first execution; no silent truncation.
    for (const step of steps) {
      if (!step || !/^[a-zA-Z][\w-]{0,39}$/.test(step.id) || !safeKey(step.id) || known.has(step.id)) throw new Error('Invalid or duplicate step ID');
      if (Object.keys(step).some(key => !['id', 'action', 'params'].includes(key))) throw new Error('Unknown step field');
      const action = window._AGENT_ALL_ACTIONS?.get(step.action);
      if (!own(outputs, step.action) || !action) throw new Error('Action cannot be used in a local workflow: ' + step.action);
      if (!step.params || Array.isArray(step.params) || typeof step.params !== 'object') throw new Error('Step params must be an object');
      let hasRefs = false;
      mapParams(step.params, ref => {
        hasRefs = true;
        if (!known.has(referenceParts(ref)[0])) throw new Error('Reference must point to an earlier step: ' + ref);
      });
      if (!hasRefs) validateAgentInput(step.params, action.parameters);
      known.add(step.id); actions.set(step.id, action);
    }
    if (returnSteps !== undefined && (!Array.isArray(returnSteps) || returnSteps.length > 12 || new Set(returnSteps).size !== returnSteps.length || returnSteps.some(id => !known.has(id)))) throw new Error('returnSteps must contain unique existing step IDs (up to 12)');
    return actions;
  }
  const checkpoints = new Map(), activeRuns = new Set();
  const clone = value => JSON.parse(JSON.stringify(value));
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  const version = () => window.document?.querySelector('meta[name="toolkit-version"]')?.content || 'dev';
  const signature = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key,item[key]])) : item);
  const snapshot = plan => clone({steps:plan?.steps,...(plan?.returnSteps!==undefined?{returnSteps:plan.returnSteps}:{})});
  const historyWarning = () => say('运行摘要未能保存；本次结果仍可使用，请导出需要保留的内容。', 'Run summary could not be saved; the current result remains available. Export anything you need to keep.');
  async function history() { try { return await window.ToolCompute.load('workflow-history'); } catch { return null; } }
  function preview(plan) {
    const copy = snapshot(plan), actions = validate(copy);
    let nodes = 0;
    const redact = (value, key = '', depth = 0) => {
      if (/^(key|token|password|secret|authorization)$|api.?key|private.?key|client.?secret|access.?token|refresh.?token/i.test(key)) return '[redacted]';
      if (++nodes > 200 || depth > 5) return '…';
      if (typeof value === 'string') return value.length > 300 ? value.slice(0, 300) + '… (' + value.length + ')' : value;
      if (Array.isArray(value)) return value.slice(0, 20).map(v => redact(v, key, depth + 1));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 30).map(([k,v]) => [k, redact(v, k, depth + 1)]));
      return value;
    };
    return { total: copy.steps.length, local: true, steps: copy.steps.map(step => {
      const dependencies = new Set(); mapParams(step.params, ref => dependencies.add(referenceParts(ref)[0]));
      return { id: step.id, action: step.action, dependencies: [...dependencies], parameters: redact(step.params), outputs: outputs[step.action].slice(), required: (actions.get(step.id).parameters.required || []).slice() };
    }) };
  }
  function meta(state) {
    return clone({ id: state.id, name: state.name, source: state.source, appVersion: state.version, createdAt: state.createdAt, updatedAt: state.updatedAt,
      startedAt: state.startedAt, finishedAt: state.finishedAt, status: state.status, total: state.plan.steps.length, completed: state.next,
      nextStep: state.plan.steps[state.next]?.id || null, attempt: state.attempt, steps: state.metrics, attempts: state.attempts });
  }
  async function persist(state, store) {
    state.updatedAt = Date.now();
    try { if (!store) throw new Error(); await store.upsert(meta(state)); state.historySaved = true; }
    catch { state.historySaved = false; }
  }
  function retain(state) {
    state.size = JSON.stringify(state.plan).length + JSON.stringify([...state.results]).length;
    checkpoints.delete(state.id); checkpoints.set(state.id, state);
    const total = () => [...checkpoints.values()].reduce((n, value) => n + value.size, 0);
    while (checkpoints.size > 10 || total() > 4 * 1024 * 1024) {
      const oldest = [...checkpoints.values()].find(value => !value.active); if (!oldest) break;
      checkpoints.delete(oldest.id);
    }
  }
  function resumeInfo(runId, revisedPlan, source) {
    const state = checkpoints.get(runId);
    const no = (reason, message) => ({ canResume: false, reason, message });
    if (!state) return no('expired', say('恢复数据已过期或来自其他标签页；刷新后只保留运行摘要。', 'Checkpoint expired or belongs to another tab; reload keeps summaries only.'));
    if (source && state.source !== source) return no('source', say('不能恢复其他来源的运行。', 'Cannot resume a run from another source.'));
    if (state.active) return no('running', say('此运行正在执行。', 'This run is already active.'));
    if (state.status === 'completed') return no('completed', say('此运行已经完成，请开始新的运行。', 'This run is complete; start a new run.'));
    if (state.attempt >= 20) return no('attempts', say('已达到 20 次尝试，请开始新的运行。', 'Reached 20 attempts; start a new run.'));
    if (state.version !== version()) return no('version', say('版本已变化，请重新运行。', 'The app version changed; start a new run.'));
    try {
      const plan = revisedPlan || state.plan; validate(plan);
      if (plan.steps.length < state.next) throw new Error();
      for (let i = 0; i < state.next; i++) {
        const previous = state.plan.steps[i], contract = state.contracts.get(previous.id), current = window._AGENT_ALL_ACTIONS.get(previous.action);
        if (signature(plan.steps[i]) !== signature(previous) || !state.results.has(previous.id)) return no('prefix', say('已完成步骤或其输入发生变化，请重新运行整个流程。', 'Completed steps or their inputs changed; run the whole workflow again.'));
        if (current !== contract.action || current.execute !== contract.execute || signature(current.parameters) !== contract.signature) return no('contract', say('已完成动作的实现或参数规则已变化，请重新运行。', 'A completed action or its parameter rules changed; start a new run.'));
      }
      return { canResume: true, completed: state.next, total: plan.steps.length, nextStep: plan.steps[state.next]?.id || null };
    } catch (error) { return no('invalid', error.message || say('计划无法恢复，请检查步骤。', 'Cannot resume this plan; check its steps.')); }
  }
  function checkpoint(runId) {
    const state = checkpoints.get(runId); if (!state) return null;
    return { plan: clone(state.plan), name: state.name, source: state.source, summary: meta(state), results: clone(Object.fromEntries([...state.results].map(([id,value]) => [id, value.data]))) };
  }
  function forget(runId) { if (checkpoints.get(runId)?.active) return false; return checkpoints.delete(runId); }
  async function listRuns({ source } = {}) {
    const store = await history(); let saved = [], available = false;
    try { if (!store) throw new Error(); saved = await store.list({ source }); available = true; } catch {}
    const items = new Map(saved.map(record => [record.id, { ...record, historySaved: true }]));
    for (const state of checkpoints.values()) if (!source || source === state.source) items.set(state.id, { ...meta(state), historySaved: state.historySaved });
    return { runs: [...items.values()].sort((a,b) => b.updatedAt - a.updatedAt).slice(0,30).map(record => ({ ...record, resumable: resumeInfo(record.id, undefined, source).canResume })), historyAvailable: available };
  }
  function contract(action) { return { action, execute: action.execute, schema: clone(action.parameters), signature: signature(action.parameters) }; }
  const metric = step => ({ id: step.id, action: step.action, status: 'pending', attempts: 0, durationMs: 0, reused: false, errorCode: null });
  function errorCode(error) {
    if (error.name === 'AbortError') return 'cancelled';
    if (error.name === 'TimeoutError') return 'timeout';
    if (error.code === 'action_failed') return 'action_failed';
    return /65536/.test(error.message) ? 'result_limit' : 'validation';
  }
  async function invoke(saved, params, parent, timeout) {
    const controller = new AbortController(); let timer, cancel;
    const interrupted = new Promise((_,reject) => {
      cancel = () => { reject(Object.assign(new Error(say('任务已取消', 'Task cancelled')), { name: 'AbortError' })); controller.abort(); };
      if (parent?.aborted) cancel(); else parent?.addEventListener('abort', cancel, { once: true });
      timer = setTimeout(() => { reject(Object.assign(new Error(say('步骤执行超时', 'Workflow step timed out')), {name:'TimeoutError'})); controller.abort(); }, timeout);
    });
    const operation = Promise.resolve().then(() => { checkCancelled(controller.signal); return saved.execute.call(saved.action, params, {signal:controller.signal}); });
    try { return await Promise.race([operation, interrupted]); }
    finally { clearTimeout(timer); parent?.removeEventListener('abort',cancel); controller.abort(); }
  }
  function invalid(error,total=0) { return { success:false, error:error.message, errorCode:'validation', data:{steps:[],failedStep:null,completed:0,total},display:summary(0,total,false)+': '+error.message }; }
  async function execute(state, context) {
    if (activeRuns.size >= 4) return invalid(new Error(say('当前标签页最多同时运行 4 个流程。', 'This tab supports up to 4 active workflows.')));
    state.active = true; activeRuns.add(state.id); state.status = 'running'; state.attempt++; state.startedAt = Date.now(); state.finishedAt = null;
    const attempt = { attempt:state.attempt,status:'running',startedAt:state.startedAt,finishedAt:null,fromStep:state.plan.steps[state.next]?.id||null,completed:state.next };
    state.attempts.push(attempt); retain(state);
    const {signal,onProgress} = context, timeout = Math.max(1, Math.min(15000, Number(context.stepTimeoutMs) || 15000));
    const emit = data => { try { Promise.resolve(onProgress?.({runId:state.id,total:state.plan.steps.length,...data})).catch(()=>{}); } catch {} };
    let response,store,entered=false;
    const work = async () => {
      entered=true;
      await persist(state,store);
      try {
        for (let i = 0; i < state.next; i++) { state.metrics[i].reused=true; emit({step:state.plan.steps[i].id,action:state.plan.steps[i].action,state:'reused',completed:i+1}); }
        while (state.next < state.plan.steps.length) {
          checkCancelled(signal);
          const step = state.plan.steps[state.next], item = state.metrics[state.next];
          const params = mapParams(step.params, ref => {
            const [id,...path] = referenceParts(ref); let value = state.results.get(id);
            for (const key of path) { if (value === null || typeof value !== 'object' || !own(value,key)) throw new Error('Result field not found: ' + ref); value=value[key]; }
            return clone(value);
          });
          checkSize(params); validateAgentInput(params,state.contracts.get(step.id).schema);
          item.status='running';item.errorCode=null;item.attempts++;item.reused=false;
          await persist(state,store); checkCancelled(signal);
          emit({step:step.id,action:step.action,state:'running',completed:state.next});
          const started=Date.now();
          try {
            const value=await invoke(state.contracts.get(step.id),params,signal,timeout);checkCancelled(signal);
            if (!value || value.success !== true) throw Object.assign(new Error(value?.error||value?.data?.error||value?.display||'Action failed'),{code:'action_failed'});
            checkSize(value);state.results.set(step.id,clone(value));item.status='completed';state.next++;
          } finally { item.durationMs+=Math.max(0,Date.now()-started); }
          await persist(state,store);
          emit({step:step.id,action:step.action,state:'completed',completed:state.next});
          await new Promise(resolve => setTimeout(resolve,0));
        }
        checkCancelled(signal);
        const data={result:clone(state.results.get(state.plan.steps.at(-1).id).data),steps:state.metrics.slice(0,state.next).map(m=>({id:m.id,action:m.action,success:true,durationMs:m.durationMs,...(m.reused?{reused:true}:{})})),completed:state.next,total:state.plan.steps.length};
        if(state.plan.returnSteps?.length)data.outputs=Object.fromEntries(state.plan.returnSteps.map(id=>[id,clone(state.results.get(id).data)]));
        checkSize(data);state.status='completed';response={success:true,data,display:summary(state.next,state.plan.steps.length,true)};
      } catch(error) {
        const code=errorCode(error),step=state.plan.steps[state.next];state.status=code==='cancelled'?'cancelled':'failed';
        if(step){state.metrics[state.next].status=state.status;state.metrics[state.next].errorCode=code;}
        emit({step:step?.id||null,state:state.status,completed:state.next});
        response={success:false,error:error.message,errorCode:code,data:{steps:state.metrics.slice(0,state.next).map(m=>({id:m.id,action:m.action,success:true,durationMs:m.durationMs,...(m.reused?{reused:true}:{})})),failedStep:step?.id||null,completed:state.next,total:state.plan.steps.length},display:summary(state.next,state.plan.steps.length,false)+': '+error.message};
      } finally {
        state.finishedAt=Date.now();Object.assign(attempt,{status:state.status,finishedAt:state.finishedAt,completed:state.next});await persist(state,store);
      }
    };
    try {
      store=await history();
      if(store)try{await store.withRunLock(state.id,work);}catch(error){if(entered)throw error;store=null;await work();}
      else await work();
    }
    finally { state.active=false;activeRuns.delete(state.id);retain(state); }
    return {...response,runId:state.id,resumable:resumeInfo(state.id).canResume,historySaved:state.historySaved,...(!state.historySaved?{historyWarning:historyWarning()}:{})};
  }
  async function run(plan, context = {}) {
    let copy,actions;try { copy=snapshot(plan);actions=validate(copy); } catch(error) { return invalid(error,Array.isArray(plan?.steps)?plan.steps.length:0); }
    const now=Date.now(),id='wf-run-'+(typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():now.toString(36)+'-'+Math.random().toString(36).slice(2));
    const state={id,name:String(context.name||say('本地流程','Local workflow')).slice(0,80),source:['studio','assistant'].includes(context.source)?context.source:'local',version:version(),createdAt:now,updatedAt:now,startedAt:now,finishedAt:null,status:'running',attempt:0,attempts:[],plan:copy,next:0,results:new Map(),metrics:copy.steps.map(metric),contracts:new Map([...actions].map(([id,action])=>[id,contract(action)])),active:false,size:0,historySaved:false};
    return execute(state,context);
  }
  async function resume(runId, revisedPlan, context = {}) {
    const info=resumeInfo(runId,revisedPlan,context.source);if(!info.canResume)return invalid(new Error(info.message));
    if(activeRuns.size>=4)return invalid(new Error(say('当前标签页最多同时运行 4 个流程。','This tab supports up to 4 active workflows.')));
    const state=checkpoints.get(runId),copy=snapshot(revisedPlan||state.plan),actions=validate(copy);
    state.metrics=copy.steps.map((step,i)=>i<state.next?state.metrics[i]:state.metrics[i]?.id===step.id&&state.metrics[i]?.action===step.action?{...state.metrics[i],status:'pending',errorCode:null,reused:false}:metric(step));
    for(let i=state.next;i<copy.steps.length;i++)state.contracts.set(copy.steps[i].id,contract(actions.get(copy.steps[i].id)));
    state.plan=copy;return execute(state,context);
  }
  function summary(completed, total, success) {
    const en = window.getCurrentLang?.() === 'en';
    return (en ? (success ? 'Completed ' : 'Stopped at ') : (success ? '已完成 ' : '已停止，完成 ')) + completed + '/' + total + (en ? ' steps' : ' 步');
  }
  const ref = (id, path = 'result') => ({ $ref: id + '.data.' + path });
  const templates = [
    { id: 'decode-json', name: 'Base64 → JSON', build: input => [
      { id: 'decode', action: 'base64_decode', params: { encoded: input } },
      { id: 'format', action: 'json_format', params: { input: ref('decode') } },
    ] },
    { id: 'clean-base64', name: 'Trim / deduplicate lines → Base64', build: input => [
      { id: 'clean', action: 'text_lines', params: { input, trim: true, removeEmpty: true, deduplicate: true } },
      { id: 'encode', action: 'base64_encode', params: { text: ref('clean') } },
    ] },
    { id: 'csv-json-schema', name: 'CSV → JSON → infer Schema', build: input => [
      { id:'csv',action:'csv_to_json',params:{input} },
      { id:'schema',action:'json_schema_generate',params:{input:ref('csv')} },
    ] },
    { id: 'yaml-json', name: 'YAML → JSON → format', build: input => [
      { id:'yaml',action:'yaml_to_json',params:{input} },
      { id:'format',action:'json_format',params:{input:ref('yaml')} },
    ] },
    { id: 'json-sha256', name: 'Minify JSON → SHA-256 (preserves key order)', build: input => [
      { id: 'json', action: 'json_format', params: { input, minify: true } },
      { id: 'hash', action: 'hash_generate', params: { text: ref('json'), algo: 'SHA-256' } },
    ] },
  ];
  const customKey = 'ag_custom_workflows';
  function custom() {
    try { const saved = JSON.parse(localStorage.getItem(customKey) || '[]'); return Array.isArray(saved) ? saved.filter(item => item && /^user-[a-zA-Z0-9-]{1,80}$/.test(item.id) && typeof item.name === 'string' && Array.isArray(item.steps)).slice(0, 20) : []; } catch { return []; }
  }
  function inject(value, input, depth = 0) {
    if (depth > 20) throw new Error('Parameters are nested too deeply');
    if (value === null || typeof value !== 'object') return value;
    if (own(value, '$input')) { if (value.$input !== true || Object.keys(value).length !== 1) throw new Error('Input placeholder must be {"$input":true}'); return input; }
    if (Array.isArray(value)) return value.map(v => inject(v, input, depth + 1));
    const result = {}; for (const [key, v] of Object.entries(value)) { if (!safeKey(key)) throw new Error('Unsafe parameter key'); result[key] = inject(v, input, depth + 1); } return result;
  }
  function validateCustom(plan) {
    checkSize(plan.steps);
    const steps = inject(plan.steps, 'sample');
    validate({ steps, returnSteps: plan.returnSteps });
    for (const step of steps) {
      if (step.action === 'hmac_generate') throw new Error('HMAC keys cannot be saved in a reusable workflow');
      const schema = window._AGENT_ALL_ACTIONS.get(step.action).parameters;
      for (const required of schema.required || []) if (!own(step.params, required)) throw new Error(step.id + ': missing ' + required);
      for (const [key, value] of Object.entries(step.params)) {
        if (!own(schema.properties, key)) throw new Error(step.id + ': unknown parameter ' + key);
        let refs = false;
        mapParams(value, ref => {
          refs = true; const [id, ...path] = referenceParts(ref); const source = steps.find(item => item.id === id);
          if (!outputs[source.action].includes(path.join('.'))) throw new Error('Unknown output field: ' + ref);
        });
        if (!refs) validateAgentInput(value, schema.properties[key], step.id + '.' + key);
      }
    }
    return plan;
  }
  function save(plan) {
    validateCustom(plan);
    const name = String(plan.name || '').trim(); if (!name || name.length > 60) throw new Error('Workflow name: 1–60 characters');
    const id = plan.id || 'user-' + crypto.randomUUID(); if (!/^user-[a-zA-Z0-9-]{1,80}$/.test(id)) throw new Error('Invalid workflow ID');
    const entries = custom().filter(item => item.id !== id); if (entries.length >= 20) throw new Error('Up to 20 custom workflows');
    const item = { id, name, steps: plan.steps, ...(plan.returnSteps ? { returnSteps: plan.returnSteps } : {}), updatedAt: Date.now() };
    entries.push(item); const text = JSON.stringify(entries); if (text.length > 524288) throw new Error('Saved workflows exceed 512 KiB');
    localStorage.setItem(customKey, text); return JSON.parse(JSON.stringify(item));
  }
  function remove(id) { localStorage.setItem(customKey, JSON.stringify(custom().filter(item => item.id !== id))); }
  function list() { return [...templates.map(({ id, name }) => ({ id, name, builtin: true })), ...custom().map(({ id, name }) => ({ id, name, builtin: false }))]; }
  function definition(id) {
    const builtin = templates.find(item => item.id === id); if (builtin) return { id, name: builtin.name, steps: builtin.build({ $input: true }) };
    return custom().find(item => item.id === id);
  }
  async function runTemplate(id, input, context) {
    try {
      if (typeof input !== 'string' || input.length > LIMIT) throw new Error('Workflow input must be text, up to 65536 characters');
      const plan = definition(id); if (!plan) throw new Error('Unknown workflow template');
      if (id.startsWith('user-')) validateCustom(plan);
      return run({ steps: inject(plan.steps, input), returnSteps: plan.returnSteps }, context);
    } catch (e) { return { success: false, error: e.message }; }
  }
  return { run, resume, resumeInfo, checkpoint, forget, listRuns, preview, validate, outputs, templates, list, custom, save, remove, definition, inject, validateCustom, runTemplate };
})();

window.WorkflowActions = [
  {
    name: 'run_workflow',
    description: '串联已发现的本地计算动作（最多12步）。params 内可用 {"$ref":"earlierStep.data.result"} 引用前一步结果，hash_generate 用 data.hash。默认返回最后一步；需要中间结果时用 returnSteps 指定步骤 ID，一次返回 data.outputs[id]，无需重复执行。仅支持 search_tools 返回 workflow:true 的动作；失败立即停止，不发起网络或页面操作。',
    meta: { tier: 'standard', tags: ['workflow', 'pipeline', 'chain', '串联', '流程', '先', '再'], category: 'composite' },
    parameters: { type: 'object', properties: { steps: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'object', properties: { id: { type: 'string', minLength: 1, maxLength: 40 }, action: { type: 'string' }, params: { type: 'object' } }, required: ['id', 'action', 'params'], additionalProperties: false } }, returnSteps: { type: 'array', maxItems: 12, items: { type: 'string' }, description: '需要同时返回的步骤 ID，例如 ["format","hash"]。可选，默认只返回最后一步。' } }, required: ['steps'], additionalProperties: false },
    execute: (params, context) => window.AgentWorkflow.run(params, { ...context, source: 'assistant' }),
  },
  {
    name: 'list_workflows', description: '列出内置及用户保存的本地工作流、可串联动作和输出字段。列表中的 id 可直接交给 run_workflow_template；运行不依赖页面。',
    meta: { tier: 'standard', tags: ['workflow', 'templates', '模板', '串联', '流程'], category: 'composite' },
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => ({ success: true, data: { templates: window.AgentWorkflow.list(), actions: window.AgentWorkflow.outputs }, display: window.AgentWorkflow.list().map(t => t.id + ': ' + t.name).join('\n') }),
  },
  {
    name: 'run_workflow_template', description: '执行 list_workflows 返回的内置或用户自定义本地流程。template 使用其准确 ID，input 为本次输入；通过引用传递结果，失败即停止。',
    meta: { tier: 'standard', tags: ['workflow', 'template', 'base64', 'json', 'hash', '模板', '串联'], category: 'composite' },
    parameters: { type: 'object', properties: { template: { type: 'string', minLength: 1, maxLength: 90 }, input: { type: 'string', maxLength: 65536 } }, required: ['template', 'input'], additionalProperties: false },
    execute: ({ template, input }, context) => window.AgentWorkflow.runTemplate(template, input, { ...context, source: 'assistant' }),
  },
];

window.WorkflowActions.push(
  {
    name:'preview_workflow',description:'只校验和预览本地流程，不执行动作。返回步骤依赖、参数摘要与输出字段，敏感参数遮盖。',
    meta:{tier:'standard',tags:['workflow','plan','preview','流程','计划','预览'],category:'composite'},
    parameters:window.WorkflowActions[0].parameters,
    execute(plan){try{return {success:true,data:window.AgentWorkflow.preview(plan)};}catch(error){return {success:false,error:error.message};}},
  },
  {
    name:'list_workflow_runs',description:'查看助手来源的最近运行摘要：runId、步骤状态、耗时、尝试次数与本标签页能否恢复。不返回手动运行、输入、中间结果或密钥。刷新后只有摘要，恢复数据会过期。',
    meta:{tier:'standard',tags:['workflow','history','runs','记录','恢复','流程'],category:'composite'},
    parameters:{type:'object',properties:{},additionalProperties:false},
    async execute(){return {success:true,data:await window.AgentWorkflow.listRuns({source:'assistant'})};},
  },
  {
    name:'resume_workflow',description:'恢复本标签页助手来源的失败或取消流程，复用已完成结果。可提供修正后的完整 steps，但已完成前缀及输入不得变化；不支持网络动作或手动运行记录。先查看 list_workflow_runs。',
    meta:{tier:'standard',tags:['workflow','resume','retry','恢复','重试','流程'],category:'composite'},
    parameters:{type:'object',properties:{runId:{type:'string',minLength:1,maxLength:100},steps:window.WorkflowActions[0].parameters.properties.steps,returnSteps:window.WorkflowActions[0].parameters.properties.returnSteps},required:['runId'],additionalProperties:false},
    execute({runId,steps,returnSteps},context){return window.AgentWorkflow.resume(runId,steps?{steps,returnSteps}:undefined,{...context,source:'assistant'});},
  }
);
