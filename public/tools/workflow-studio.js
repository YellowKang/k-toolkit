'use strict';

window.renderWorkflowStudio = async function renderWorkflowStudio(container) {
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  container.textContent = say('正在加载流程工具…', 'Loading workflow tools…');
  try { await window._agEnsureLoaded(); } catch { container.textContent = say('加载失败，请刷新重试。', 'Loading failed. Reload and try again.'); return; }
  if (!container.isConnected) return;
  window._agInjectCSS?.();
  const workflow = window.AgentWorkflow;
  const labels = {
    json_unescape: ['JSON 去转义', 'Unescape JSON'], json_expand: ['展开嵌套 JSON', 'Expand nested JSON'], json_format: ['格式化 / 压缩 JSON', 'Format / minify JSON'], json_extract: ['提取 JSON 字段', 'Extract JSON field'],
    base64_encode: ['Base64 编码', 'Base64 encode'], base64_decode: ['Base64 解码', 'Base64 decode'], string_escape: ['字符串转义 / 去转义', 'Escape / unescape string'],
    text_lines: ['清理文本行', 'Clean text lines'], case_convert: ['大小写转换', 'Change case'], hash_generate: ['计算哈希', 'Hash text'],
    yaml_to_json: ['YAML → JSON', 'YAML → JSON'], json_to_yaml: ['JSON → YAML', 'JSON → YAML'], csv_to_json: ['CSV → JSON', 'CSV → JSON'], json_to_csv: ['JSON → CSV', 'JSON → CSV'],
    toml_to_json: ['TOML → JSON', 'TOML → JSON'], json_to_toml: ['JSON → TOML', 'JSON → TOML'], json_schema_generate: ['推断 JSON Schema', 'Infer JSON Schema'],
    url_encode: ['URL 编码', 'URL encode'], url_decode: ['URL 解码', 'URL decode'], xml_format: ['格式化 XML', 'Format XML'], xml_to_json: ['XML → JSON', 'XML → JSON'], sql_format: ['格式化 SQL', 'Format SQL'],
  };
  const actions = Object.keys(labels).map(id => window._AGENT_ALL_ACTIONS.get(id)).filter(Boolean);
  const label = id => labels[id] ? say(...labels[id]) : id;
  const mainKey = action => ['input', 'text', 'encoded', 'sql', 'url'].find(key => action.parameters.properties[key]?.type === 'string');
  const paramLabels = { unescape: ['去转义', 'Unescape'], quotes: ['保留外层引号', 'Keep outer quotes'],  pointer: ['字段路径（如 /users/0/name）', 'Field path (e.g. /users/0/name)'], minify: ['压缩', 'Minify'], trim: ['去除首尾空白', 'Trim whitespace'], removeEmpty: ['移除空行', 'Remove empty lines'], deduplicate: ['去除重复行', 'Deduplicate lines'], sort: ['排序', 'Sort'], algo: ['算法', 'Algorithm'], mode: ['模式', 'Mode'], type: ['类型', 'Type'], format: ['格式', 'Format'], urlSafe: ['URL 安全模式', 'URL safe'], delimiter: ['分隔符', 'Delimiter'], header: ['首行是表头', 'First row is header'], infer: ['推断数字和布尔值', 'Infer numbers and booleans'], flat: ['展开嵌套字段', 'Flatten nested fields'] };
  const clone = value => JSON.parse(JSON.stringify(value));
  let plan = window._workflowDraft?.plan || { name: say('JSON 清理流程', 'JSON cleanup'), steps: [{ id: 'expand', action: 'json_expand', params: { input: { $input: true } } }, { id: 'format', action: 'json_format', params: { input: { $ref: 'expand.data.result' } } }] };
  plan = clone(plan);
  let dirty = !!window._workflowDraft?.dirty, running = null, disposed = false;
  container.innerHTML = `<style>
    .wf-studio{max-width:1100px;margin:auto;color:var(--text)}.wf-studio *{box-sizing:border-box}.wf-studio h2{margin:0 0 10px}.wf-muted{color:var(--text-muted);font-size:13px;line-height:1.6}
    .wf-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0}.wf-bar select{flex:1;min-width:150px}.wf-studio input:not([type=checkbox]),.wf-studio select,.wf-studio textarea{background:var(--surface);color:var(--text);border:1px solid var(--border);padding:10px;border-radius:8px;max-width:100%;font:inherit}
    .wf-studio button{cursor:pointer;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);font:inherit;font-size:13px}.wf-studio button:hover:not(:disabled){border-color:var(--accent);color:var(--accent)}.wf-studio button.btn-primary{background:var(--accent);border-color:var(--accent);color:var(--text-on-accent,#fff)}.wf-studio button.btn-primary:hover:not(:disabled){color:var(--text-on-accent,#fff);filter:brightness(1.08)}.wf-step-head button{min-width:34px;padding:8px}.wf-studio button:disabled{cursor:default;opacity:.5}.wf-name{width:100%;margin:6px 0 16px}.wf-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px}.wf-card{padding:16px;border:1px solid var(--border);border-radius:12px;background:var(--surface);margin-bottom:12px}
    .wf-step-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.wf-step-head select{flex:1;min-width:100px}.wf-field{display:flex;flex-direction:column;gap:6px;margin-top:12px;font-size:13px}.wf-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}.wf-options label{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.wf-options input:not([type=checkbox]),.wf-options select{width:100%;min-width:0}.wf-studio textarea{width:100%;min-height:240px;resize:vertical;font:13px/1.6 ui-monospace,monospace}.wf-status{overflow-wrap:anywhere;min-height:24px;font-size:13px;line-height:1.6}.wf-status.error{color:var(--danger,#e11d48)}.wf-result{min-width:0;--ag-text:var(--text);--ag-bg:var(--surface);--ag-bg2:var(--surface);--ag-border:var(--border);--ag-muted:var(--text-muted);--ag-input-bg:var(--surface);--ag-accent:var(--accent)}.wf-result pre{max-height:360px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}
    @media(max-width:760px){.wf-grid{grid-template-columns:1fr}.wf-card{padding:12px}.wf-bar{align-items:stretch}.wf-bar select{flex-basis:100%}}
  </style><div class="wf-studio"><p class="wf-muted">${say('把常用操作连起来，一次运行。手动与 Agent 使用同一套工具；输入内容不会保存在流程中。', 'Chain everyday operations and run once. Manual runs and Agent use the same tools; input content is not saved in a workflow.')}</p>
    <div class="wf-bar"><select id="wfLibrary" aria-label="${say('选择流程', 'Choose workflow')}"></select><button class="btn" id="wfNew">${say('新建', 'New')}</button><button class="btn" id="wfDuplicate">${say('复制流程', 'Duplicate')}</button><button class="btn" id="wfDelete">${say('删除', 'Delete')}</button></div>
    <label for="wfName">${say('流程名称', 'Workflow name')}</label><input class="wf-name" id="wfName" maxlength="60">
    <div class="wf-grid"><section><div id="wfSteps"></div><button class="btn" id="wfAdd">+ ${say('添加步骤', 'Add step')}</button></section><section><label for="wfInput">${say('本次输入', 'Input for this run')}</label><textarea id="wfInput" spellcheck="false" placeholder="${say('粘贴需要处理的文本', 'Paste text to process')}"></textarea><label class="wf-field"><span><input type="checkbox" id="wfIntermediate"> ${say('同时保留中间步骤结果', 'Include intermediate results')}</span></label><div class="wf-bar"><button class="btn btn-primary" id="wfRun">${say('运行流程', 'Run workflow')}</button><button class="btn" id="wfCancel" hidden>${say('取消', 'Cancel')}</button><button class="btn" id="wfSave">${say('保存流程', 'Save workflow')}</button><button class="btn" id="wfCommand">${say('复制 Agent 指令', 'Copy Agent command')}</button></div><p id="wfStatus" class="wf-status" role="status" aria-live="polite"></p><div id="wfResult" class="wf-result"></div></section></div></div>`;
  const field = id => container.querySelector('#' + id);
  const status = (text, error = false) => { field('wfStatus').textContent = text; field('wfStatus').classList.toggle('error', error); };
  function attempt(fn) { try { return fn(); } catch (e) { status(e.message, true); } }
  function edited() { dirty = true; field('wfSave').textContent = say('保存流程 · 未保存', 'Save workflow · unsaved'); }
  function library() {
    const select = field('wfLibrary'); select.replaceChildren(); const current = document.createElement('option'); current.value = ''; current.textContent = say('未保存的流程', 'Unsaved workflow'); select.append(current);
    for (const item of workflow.list()) { const option = document.createElement('option'); option.value = item.id; option.textContent = (item.builtin ? say('示例 · ', 'Example · ') : '') + item.name; select.append(option); }
    select.value = plan.id || ''; field('wfDelete').disabled = !plan.id?.startsWith('user-'); field('wfCommand').disabled = !plan.id;
  }
  function sourceOptions(select, index, value) {
    const options = [['$input', say('原始输入', 'Original input')]];
    for (const [position, earlier] of plan.steps.slice(0, index).entries()) for (const path of workflow.outputs[earlier.action] || []) if (/\.(result|hash|iso)$/.test(path)) options.push([earlier.id + '.' + path, (position + 1) + ' · ' + label(earlier.action) + (path === 'data.result' ? '' : ' · ' + path.slice(5))]);
    const current = value?.$ref || (value?.$input ? '$input' : '$literal');
    if (!options.some(([key]) => key === current)) options.push([current, current === '$literal' ? say('固定文本（保留）', 'Fixed text (preserved)') : say('引用已失效：', 'Missing reference: ') + current]);
    for (const [key, name] of options) { const option = document.createElement('option'); option.value = key; option.textContent = name; select.append(option); } select.value = current;
  }
  function defaults(action, source) {
    const params = { [mainKey(action)]: source };
    for (const [key, schema] of Object.entries(action.parameters.properties)) if (key !== mainKey(action) && (schema.default !== undefined || action.parameters.required?.includes(key))) params[key] = schema.default ?? schema.enum?.[0] ?? (schema.type === 'boolean' ? false : schema.type === 'number' ? 0 : '');
    return params;
  }
  function steps() {
    const host = field('wfSteps'); host.replaceChildren();
    plan.steps.forEach((step, index) => {
      const action = actions.find(a => a.name === step.action); if (!action) throw new Error('Unsupported builder action: ' + step.action);
      const card = document.createElement('div'); card.className = 'wf-card'; card.dataset.stepId = step.id;
      const head = document.createElement('div'); head.className = 'wf-step-head'; card.append(head);
      const number = document.createElement('strong'); number.textContent = index + 1; head.append(number);
      const select = document.createElement('select'); select.dataset.stepAction = ''; select.setAttribute('aria-label', say('步骤操作', 'Step action'));
      for (const a of actions) { const option = document.createElement('option'); option.value = a.name; option.textContent = label(a.name); select.append(option); } select.value = step.action; head.append(select);
      select.onchange = () => { const next = actions.find(a => a.name === select.value); step.params = defaults(next, step.params[mainKey(action)]); step.action = next.name; edited(); attempt(steps); };
      const button = (text, title, disabled, fn) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = text; b.setAttribute('aria-label', title); b.disabled = disabled; b.onclick = () => { fn(); edited(); attempt(steps); }; head.append(b); };
      button('↑', say('上移步骤', 'Move step up'), index === 0, () => { [plan.steps[index - 1], plan.steps[index]] = [step, plan.steps[index - 1]]; });
      button('×', say('删除步骤', 'Remove step'), plan.steps.length === 1, () => plan.steps.splice(index, 1));
      const sourceLabel = document.createElement('label'); sourceLabel.className = 'wf-field'; sourceLabel.textContent = say('输入来源', 'Input source'); const source = document.createElement('select'); source.dataset.stepSource = ''; sourceOptions(source, index, step.params[mainKey(action)]); sourceLabel.append(source); card.append(sourceLabel);
      source.onchange = () => { if (source.value !== '$literal') step.params[mainKey(action)] = source.value === '$input' ? { $input: true } : { $ref: source.value }; edited(); };
      const options = document.createElement('div'); options.className = 'wf-options'; card.append(options);
      for (const [key, schema] of Object.entries(action.parameters.properties)) {
        if (key === mainKey(action)) continue;
        const labelEl = document.createElement('label'); labelEl.className = 'wf-field'; labelEl.textContent = paramLabels[key] ? say(...paramLabels[key]) : key;
        const input = document.createElement(schema.enum ? 'select' : 'input'); input.dataset.param = key;
        if (schema.enum) { for (const value of schema.enum) { const option = document.createElement('option'); option.value = String(value); option.textContent = String(value); input.append(option); } input.value = step.params[key] ?? schema.default ?? schema.enum[0]; }
        else if (schema.type === 'boolean') { input.type = 'checkbox'; input.checked = step.params[key] ?? schema.default ?? false; }
        else { input.type = schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'; input.value = step.params[key] ?? schema.default ?? ''; }
        input.oninput = () => { step.params[key] = schema.type === 'boolean' ? input.checked : ['number', 'integer'].includes(schema.type) ? Number(input.value) : input.value; edited(); };
        // Defaults shown in the form must match what the executor receives.
        if (step.params[key] === undefined && (schema.enum || schema.default !== undefined)) step.params[key] = schema.enum ? (schema.type === 'number' ? Number(input.value) : input.value) : schema.default;
        labelEl.append(input); options.append(labelEl);
      }
      host.append(card);
    });
    field('wfAdd').disabled = plan.steps.length >= 12;
  }
  function refresh() { library(); field('wfName').value = plan.name; field('wfIntermediate').checked = !!plan.returnSteps?.length; field('wfSave').textContent = dirty ? say('保存流程 · 未保存', 'Save workflow · unsaved') : say('保存流程', 'Save workflow'); attempt(steps); }
  function canReplace() { return !dirty || confirm(say('放弃尚未保存的流程修改？', 'Discard unsaved workflow changes?')); }
  field('wfLibrary').onchange = event => { const id = event.target.value; if (!id || !canReplace()) { library(); return; } plan = clone(workflow.definition(id)); dirty = false; refresh(); status(''); };
  field('wfNew').onclick = () => { if (!canReplace()) return; plan = { name: say('新流程', 'New workflow'), steps: [{ id: 'step1', action: 'json_format', params: { input: { $input: true } } }] }; dirty = false; refresh(); field('wfName').focus(); };
  field('wfDuplicate').onclick = () => { delete plan.id; plan.name = (plan.name + say(' 副本', ' copy')).slice(0, 60); dirty = true; refresh(); };
  field('wfDelete').onclick = () => attempt(() => { if (!plan.id?.startsWith('user-') || !confirm(say('删除此流程？', 'Delete this workflow?'))) return; workflow.remove(plan.id); delete plan.id; dirty = true; refresh(); status(say('已删除，当前步骤仍可运行。', 'Deleted. You can still run the current steps.')); });
  field('wfName').oninput = () => { plan.name = field('wfName').value; edited(); };
  field('wfIntermediate').onchange = edited;
  field('wfAdd').onclick = () => { if (plan.steps.length >= 12) return; const previous = plan.steps.at(-1); const output = workflow.outputs[previous.action].find(path => /\.(result|hash|iso)$/.test(path)); plan.steps.push({ id: 'step' + crypto.randomUUID().slice(0, 8), action: 'json_format', params: { input: output ? { $ref: previous.id + '.' + output } : { $input: true } } }); edited(); attempt(steps); };
  function read() { const value = clone(plan); if (!value.id?.startsWith('user-')) delete value.id; value.returnSteps = field('wfIntermediate').checked ? value.steps.map(step => step.id) : []; return value; }
  field('wfSave').onclick = () => attempt(() => { plan = workflow.save(read()); dirty = false; refresh(); status(say('已保存。Agent 的流程列表也已更新。', 'Saved. Available in the Agent workflow list.')); });
  field('wfCommand').onclick = () => { if (dirty) { status(say('请先保存修改，再复制 Agent 指令。', 'Save changes before copying the Agent command.'), true); return; } window.copyText('/workflow ' + plan.id + '\n' + field('wfInput').value, field('wfCommand')); };
  field('wfInput').value = window._workflowDraft?.input || '';
  field('wfRun').onclick = async () => {
    if (running) return;
    const value = read(); if (!attempt(() => workflow.validateCustom(value))) return;
    const controller = new AbortController(); running = controller; field('wfRun').disabled = true; field('wfCancel').hidden = false;
    container.querySelectorAll('#wfSteps input,#wfSteps select,#wfSteps button,#wfLibrary,#wfNew,#wfDuplicate,#wfDelete,#wfAdd,#wfSave,#wfInput,#wfName,#wfIntermediate').forEach(el => el.disabled = true);
    field('wfResult').replaceChildren(); status(say('正在运行…', 'Running…'));
    try {
      const input = field('wfInput').value; if (input.length > 65536) throw new Error(say('输入最多 65,536 个字符。', 'Input is limited to 65,536 characters.'));
      const result = await workflow.run({ steps: workflow.inject(value.steps, input), returnSteps: value.returnSteps }, { signal: controller.signal, onProgress: p => { if (!disposed && container.isConnected) status(`${p.completed}/${p.total} · ${p.step || ''}`); } });
      if (disposed || !container.isConnected) return;
      status(result.display || result.error, !result.success); window.AgentResults.mount(field('wfResult'), { result, tc: { name: 'run_workflow' }, stepLabels: Object.fromEntries(value.steps.map((step, index) => [step.id, (index + 1) + ' · ' + label(step.action)])) });
    } catch (e) { if (!disposed && container.isConnected) status(e.message, true); }
    finally { running = null; if (!disposed && container.isConnected) { field('wfRun').disabled = false; field('wfCancel').hidden = true; container.querySelectorAll('#wfLibrary,#wfNew,#wfDuplicate,#wfSave,#wfInput,#wfName,#wfIntermediate').forEach(el => el.disabled = false); refresh(); } }
  };
  field('wfCancel').onclick = () => running?.abort();
  refresh();
  window._activeCleanup = () => { disposed = true; running?.abort(); window._workflowDraft = { plan: { ...clone(plan), returnSteps: field('wfIntermediate').checked ? plan.steps.map(step => step.id) : [] }, input: field('wfInput').value, dirty }; };
};
