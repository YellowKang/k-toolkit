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
  async function run({ steps, returnSteps }, { signal, onProgress } = {}) {
    const log = [];
    let activeStep = null;
    try {
      checkCancelled(signal);
      const actions = validate({ steps, returnSteps });
      const results = new Map();
      for (const step of steps) {
        checkCancelled(signal);
        activeStep = step.id;
        const started = Date.now();
        const progress = state => onProgress?.({ step: step.id, action: step.action, state, completed: log.length, total: steps.length });
        progress('running');
        const params = mapParams(step.params, ref => {
          const [id, ...path] = referenceParts(ref);
          let value = results.get(id);
          for (const key of path) {
            if (value === null || typeof value !== 'object' || !own(value, key)) throw new Error('Result field not found: ' + ref);
            value = value[key];
          }
          // Isolate downstream mutation and keep JSON types (including false/0/null).
          return JSON.parse(JSON.stringify(value));
        });
        checkSize(params);
        const action = actions.get(step.id);
        validateAgentInput(params, action.parameters);
        const result = await action.execute(params, { signal });
        checkCancelled(signal);
        if (!result || result.success !== true) throw new Error(result?.error || result?.data?.error || result?.display || 'Action failed');
        checkSize(result);
        results.set(step.id, result);
        log.push({ id: step.id, action: step.action, success: true, durationMs: Date.now() - started });
        progress('completed');
        // Give cancellation/UI events a chance between synchronous operations.
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      checkCancelled(signal);
      const data = { result: results.get(steps.at(-1).id).data, steps: log, completed: log.length, total: steps.length };
      if (returnSteps?.length) data.outputs = Object.fromEntries(returnSteps.map(id => [id, results.get(id).data]));
      checkSize(data);
      return { success: true, data, display: summary(log.length, steps.length, true) };
    } catch (error) {
      onProgress?.({ step: activeStep, state: error.name === 'AbortError' ? 'cancelled' : 'failed', completed: log.length, total: steps?.length || 0 });
      return { success: false, error: error.message, data: { steps: log, failedStep: activeStep, completed: log.length, total: steps?.length || 0 }, display: summary(log.length, steps?.length || 0, false) + ': ' + error.message };
    }
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
  return { run, validate, outputs, templates, list, custom, save, remove, definition, inject, validateCustom, runTemplate };
})();

window.WorkflowActions = [
  {
    name: 'run_workflow',
    description: '串联已发现的本地计算动作（最多12步）。params 内可用 {"$ref":"earlierStep.data.result"} 引用前一步结果，hash_generate 用 data.hash。默认返回最后一步；需要中间结果时用 returnSteps 指定步骤 ID，一次返回 data.outputs[id]，无需重复执行。仅支持 search_tools 返回 workflow:true 的动作；失败立即停止，不发起网络或页面操作。',
    meta: { tier: 'standard', tags: ['workflow', 'pipeline', 'chain', '串联', '流程', '先', '再'], category: 'composite' },
    parameters: { type: 'object', properties: { steps: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'object', properties: { id: { type: 'string', minLength: 1, maxLength: 40 }, action: { type: 'string' }, params: { type: 'object' } }, required: ['id', 'action', 'params'], additionalProperties: false } }, returnSteps: { type: 'array', maxItems: 12, items: { type: 'string' }, description: '需要同时返回的步骤 ID，例如 ["format","hash"]。可选，默认只返回最后一步。' } }, required: ['steps'], additionalProperties: false },
    execute: (params, context) => window.AgentWorkflow.run(params, context),
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
    execute: ({ template, input }, context) => window.AgentWorkflow.runTemplate(template, input, context),
  },
];
