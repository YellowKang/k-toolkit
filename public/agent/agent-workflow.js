'use strict';

// Explicit allowlist: discovering an action does not make it safe to compose.
window.AgentWorkflow = (() => {
  const outputs = {
    base64_encode: ['data.result'], base64_decode: ['data.result'],
    json_format: ['data.result'], json_validate: ['data.valid'], json_extract: ['data.result', 'data.value'],
    text_lines: ['data.result'], case_convert: ['data.result'], wordcount: ['data'],
    hash_generate: ['data.hash'], hash_all: ['data.results'], hmac_generate: ['data.hash'],
    url_encode: ['data.result'], url_decode: ['data.result'],
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
  async function run({ steps }, { signal, onProgress } = {}) {
    const log = [];
    let activeStep = null;
    try {
      checkCancelled(signal);
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
      return { success: true, data: { result: results.get(steps.at(-1).id).data, steps: log, completed: log.length, total: steps.length }, display: summary(log.length, steps.length, true) };
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
    { id: 'json-sha256', name: 'Minify JSON → SHA-256 (preserves key order)', build: input => [
      { id: 'json', action: 'json_format', params: { input, minify: true } },
      { id: 'hash', action: 'hash_generate', params: { text: ref('json'), algo: 'SHA-256' } },
    ] },
  ];
  return { run, outputs, templates, list: () => templates.map(({ id, name }) => ({ id, name })) };
})();

window.WorkflowActions = [
  {
    name: 'run_workflow',
    description: '串联已发现的本地计算动作（最多12步）。params 内可用 {"$ref":"earlierStep.data.result"} 引用前一步结果，hash_generate 用 data.hash。仅支持 search_tools 返回 workflow:true 的动作；失败立即停止，不发起网络或页面操作。',
    meta: { tier: 'standard', tags: ['workflow', 'pipeline', 'chain', '串联', '流程', '先', '再'], category: 'composite' },
    parameters: { type: 'object', properties: { steps: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'object', properties: { id: { type: 'string', minLength: 1, maxLength: 40 }, action: { type: 'string' }, params: { type: 'object' } }, required: ['id', 'action', 'params'], additionalProperties: false } } }, required: ['steps'], additionalProperties: false },
    execute: (params, context) => window.AgentWorkflow.run(params, context),
  },
  {
    name: 'list_workflows', description: '列出无需模型即可执行的本地工作流模板和允许串联的动作及输出字段。',
    meta: { tier: 'standard', tags: ['workflow', 'templates', '模板', '串联', '流程'], category: 'composite' },
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    execute: () => ({ success: true, data: { templates: window.AgentWorkflow.list(), actions: window.AgentWorkflow.outputs }, display: window.AgentWorkflow.list().map(t => t.id + ': ' + t.name).join('\n') }),
  },
  {
    name: 'run_workflow_template', description: '执行内置本地模板：decode-json、clean-base64 或 json-sha256。通过引用传递结果，失败即停止。',
    meta: { tier: 'standard', tags: ['workflow', 'template', 'base64', 'json', 'hash', '模板', '串联'], category: 'composite' },
    parameters: { type: 'object', properties: { template: { type: 'string', enum: ['decode-json', 'clean-base64', 'json-sha256'] }, input: { type: 'string', maxLength: 65536 } }, required: ['template', 'input'], additionalProperties: false },
    execute: ({ template, input }, context) => {
      const selected = window.AgentWorkflow.templates.find(item => item.id === template);
      if (!selected) return { success: false, error: 'Unknown workflow template' };
      return window.AgentWorkflow.run({ steps: selected.build(input) }, context);
    },
  },
];
