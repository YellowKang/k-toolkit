function renderJsonSchema(el) {
const tl = makeToolI18n({
zh: {
title:'JSON Schema 生成器', input_label:'输入 JSON', input_ph:'粘贴 JSON 示例...',
sample:'示例', generate:'生成 Schema', output_label:'生成的 Schema（可编辑）',
output_ph:'Schema 将在此显示...', validate:'校验 JSON', copy_schema:'复制 Schema',
result_label:'校验结果', valid:'JSON 符合 Schema', invalid:'JSON 不符合 Schema',
err_input:'输入的 JSON 格式无效', err_schema:'Schema 格式无效',
err_empty:'请先输入 JSON 并生成 Schema', copied:'已复制', generated:'Schema 已生成',
type_mismatch:(p,e,a) => `${p}: 期望类型 "${e}"，实际为 "${a}"`,
required_miss:(p,k) => `${p}: 缺少必填字段 "${k}"`,
},
en: {
title:'JSON Schema Generator', input_label:'Input JSON', input_ph:'Paste a JSON example...',
sample:'Sample', generate:'Generate Schema', output_label:'Generated Schema (editable)',
output_ph:'Schema will appear here...', validate:'Validate JSON', copy_schema:'Copy Schema',
result_label:'Validation Result', valid:'JSON matches the Schema',
invalid:'JSON does not match the Schema', err_input:'Invalid JSON input',
err_schema:'Invalid Schema format', err_empty:'Enter JSON and generate a Schema first',
copied:'Copied', generated:'Schema generated',
type_mismatch:(p,e,a) => `${p}: expected type "${e}", got "${a}"`,
required_miss:(p,k) => `${p}: missing required field "${k}"`,
},
});
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:10px">${tl('title')}</div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<span style="font-size:12px;color:var(--text-muted)">${tl('input_label')}</span>
<button class="btn btn-secondary" onclick="_jsSample()" style="padding:3px 12px;font-size:12px">${tl('sample')}</button>
</div>
<textarea class="tool-textarea" id="jsInput" rows="8" placeholder="${tl('input_ph')}"></textarea>
<div class="tool-actions" style="margin-top:10px">
<button class="btn btn-primary" onclick="_jsGenerate()">${tl('generate')}</button>
</div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<span class="panel-label" style="margin:0">${tl('output_label')}</span>
<button class="btn btn-secondary" onclick="_jsCopy(this)" style="padding:3px 12px;font-size:12px">${tl('copy_schema')}</button>
</div>
<textarea class="tool-textarea" id="jsOutput" rows="10" placeholder="${tl('output_ph')}"></textarea>
<div class="tool-actions" style="margin-top:10px">
<button class="btn btn-primary" onclick="_jsValidate()">${tl('validate')}</button>
</div>
</div>
<div class="tool-card-panel" id="jsResultPanel" style="display:none">
<div class="panel-label" style="margin-bottom:8px">${tl('result_label')}</div>
<div id="jsResult" class="result-box" style="padding:12px 16px;border-radius:10px;font-size:13px;line-height:1.8"></div>
</div>`;
window._jsTl = tl;
}
function _jsSample() {
document.getElementById('jsInput').value = JSON.stringify({
name: "Alice", age: 30, active: true, email: "alice@example.com",
tags: ["admin", "user"], address: { city: "Shanghai", zip: "200000" }
}, null, 2);
}
function _jsInferSchema(value) {
if (value === null) return { type: 'null' };
if (typeof value === 'boolean') return { type: 'boolean' };
if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' };
if (typeof value === 'string') return { type: 'string' };
if (Array.isArray(value)) {
if (value.length === 0) return { type: 'array' };
return { type: 'array', items: _jsInferSchema(value[0]) };
}
if (typeof value === 'object') {
const props = {}, keys = Object.keys(value);
for (const k of keys) props[k] = _jsInferSchema(value[k]);
return { type: 'object', properties: props, required: keys };
}
return {};
}
function _jsGenerate() {
const tl = window._jsTl;
const raw = document.getElementById('jsInput').value.trim();
if (!raw) return;
let data;
try { data = JSON.parse(raw); } catch {
showToast(tl('err_input'), 'error'); return;
}
const schema = { $schema: 'http://json-schema.org/draft-07/schema#', ..._jsInferSchema(data) };
document.getElementById('jsOutput').value = JSON.stringify(schema, null, 2);
document.getElementById('jsResultPanel').style.display = 'none';
showToast(tl('generated'), 'success');
}
function _jsCopy(btn) {
const text = document.getElementById('jsOutput').value;
if (text) copyText(text, btn);
}
function _jsTypeOf(val) {
if (val === null) return 'null';
if (Array.isArray(val)) return 'array';
if (typeof val === 'number' && Number.isInteger(val)) return 'integer';
return typeof val;
}
function _jsValidateRec(data, schema, path) {
const errors = [];
if (!schema || typeof schema !== 'object') return errors;
const tl = window._jsTl;
if (schema.type) {
const actual = _jsTypeOf(data);
const types = Array.isArray(schema.type) ? schema.type : [schema.type];
const match = types.some(t => (t === 'number' && actual === 'integer') || t === actual);
if (!match) {
errors.push(tl('type_mismatch', path || '/', types.join('|'), actual));
return errors;
}
}
if (schema.type === 'object' && typeof data === 'object' && data !== null && !Array.isArray(data)) {
if (schema.required) {
for (const k of schema.required) {
if (!(k in data)) errors.push(tl('required_miss', path || '/', k));
}
}
if (schema.properties) {
for (const k of Object.keys(schema.properties)) {
if (k in data) errors.push(..._jsValidateRec(data[k], schema.properties[k], path ? path + '.' + k : k));
}
}
}
if (schema.type === 'array' && Array.isArray(data) && schema.items) {
data.forEach((item, i) => {
errors.push(..._jsValidateRec(item, schema.items, (path || '') + '[' + i + ']'));
});
}
return errors;
}
function _jsValidate() {
const tl = window._jsTl;
const inputRaw = document.getElementById('jsInput').value.trim();
const schemaRaw = document.getElementById('jsOutput').value.trim();
const panel = document.getElementById('jsResultPanel');
const result = document.getElementById('jsResult');
panel.style.display = '';
if (!inputRaw || !schemaRaw) {
result.innerHTML = `<span style="color:var(--text-muted)">${tl('err_empty')}</span>`; return;
}
let data, schema;
try { data = JSON.parse(inputRaw); } catch {
result.innerHTML = `<span style="color:#ef4444">${tl('err_input')}</span>`; return;
}
try { schema = JSON.parse(schemaRaw); } catch {
result.innerHTML = `<span style="color:#ef4444">${tl('err_schema')}</span>`; return;
}
const errors = _jsValidateRec(data, schema, '');
if (errors.length === 0) {
result.innerHTML = `<span style="color:#22c55e">${tl('valid')}</span>`;
} else {
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
result.innerHTML = `<div style="color:#ef4444;margin-bottom:6px">${tl('invalid')}</div>` +
errors.map(e => `<div style="font-family:monospace;font-size:12px;color:var(--text-muted);padding:2px 0">${esc(e)}</div>`).join('');
}
}