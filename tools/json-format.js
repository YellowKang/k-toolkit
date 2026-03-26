const _jsonTl = makeToolI18n({
zh: {
input_label:       '输入 JSON',
sample_btn:        '示例',
clear_btn:         '清空',
placeholder:       '粘贴 JSON 内容...',
format_btn:        '格式化',
compress_btn:      '压缩',
sort_btn:          '键名排序',
escape_btn:        '转义字符串',
ts_btn:            'TS Interface',
jsonpath_label:    'JSONPath 查询',
jsonpath_hint:     '示例: $.name | $.categories[0] | $..author | $.arr[*] | $[?(@.age>20)]',
jsonpath_placeholder:'输入 JSONPath 表达式...',
jsonpath_query:    '查询',
copy_btn:          '复制',
copy_result:       '复制结果',
download_btn:      '下载',
tree_view:         '树形视图',
text_view:         '文本视图',
valid:             '✓ 有效',
invalid:           '✗ 无效',
format_done:       '格式化完成',
compressed:        '已压缩',
sorted:            '键名已排序',
escaped:           '已转义为 JSON 字符串',
ts_done:           'TS Interface 已生成',
invalid_json:      '无效 JSON',
error_prefix:      '错误：',
json_invalid_msg:  'JSON 无效: ',
no_match:          '无匹配结果',
path_error:        '路径错误: ',
lines_chars:       (l, c) => `${l} 行 · ${c} 字符`,
downloaded:        '文件已下载',
edit_save_fail:    '值无效，请输入合法 JSON 值',
},
en: {
input_label:       'Input JSON',
sample_btn:        'Sample',
clear_btn:         'Clear',
placeholder:       'Paste JSON here...',
format_btn:        'Format',
compress_btn:      'Minify',
sort_btn:          'Sort Keys',
escape_btn:        'Escape String',
ts_btn:            'TS Interface',
jsonpath_label:    'JSONPath Query',
jsonpath_hint:     'e.g. $.name | $.categories[0] | $..author | $.arr[*] | $[?(@.age>20)]',
jsonpath_placeholder:'Enter JSONPath expression...',
jsonpath_query:    'Query',
copy_btn:          'Copy',
copy_result:       'Copy Result',
download_btn:      'Download',
tree_view:         'Tree View',
text_view:         'Text View',
valid:             '✓ Valid',
invalid:           '✗ Invalid',
format_done:       'Formatted',
compressed:        'Minified',
sorted:            'Keys Sorted',
escaped:           'Escaped to JSON string',
ts_done:           'TS Interface Generated',
invalid_json:      'Invalid JSON',
error_prefix:      'Error: ',
json_invalid_msg:  'Invalid JSON: ',
no_match:          'No match',
path_error:        'Path error: ',
lines_chars:       (l, c) => `${l} lines · ${c} chars`,
downloaded:        'File downloaded',
edit_save_fail:    'Invalid value, enter a valid JSON value',
}
});
function renderJSON(el) {
const tl = _jsonTl;
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">${tl('input_label')}</div>
<div style="display:flex;gap:6px;align-items:center">
<span id="jsonLiveStatus" style="font-size:12px"></span>
<button class="btn btn-secondary" onclick="jsonLoadSample()">${tl('sample_btn')}</button>
<button class="btn btn-secondary" onclick="clearJSON()">${tl('clear_btn')}</button>
</div>
</div>
<textarea class="tool-textarea" id="jsonInput" rows="10" placeholder='${tl('placeholder')}'></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="formatJSON()">${tl('format_btn')}</button>
<button class="btn btn-secondary" onclick="compressJSON()">${tl('compress_btn')}</button>
<button class="btn btn-secondary" onclick="jsonSort()">${tl('sort_btn')}</button>
<button class="btn btn-secondary" onclick="jsonEscape()">${tl('escape_btn')}</button>
</div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">${tl('jsonpath_label')}</div>
<span style="font-size:11px;color:var(--text-muted)">${tl('jsonpath_hint')}</span>
</div>
<div style="display:flex;gap:8px">
<input class="tool-input" id="jsonPathInput" placeholder="${tl('jsonpath_placeholder')}" style="flex:1" oninput="jsonPathQuery()">
<button class="btn btn-secondary" onclick="jsonPathQuery()">${tl('jsonpath_query')}</button>
</div>
<div id="jsonPathResult" style="margin-top:10px"></div>
</div>
<div class="tool-card-panel" id="jsonResultPanel" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div style="display:flex;align-items:center;gap:12px">
<div class="panel-label" style="margin:0" id="jsonStatus"></div>
<span id="jsonMeta" style="font-size:12px;color:var(--text-muted)"></span>
</div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary" onclick="copyJSON(this)">${tl('copy_result')}</button>
<button class="btn btn-secondary" onclick="jsonDownload()">${tl('download_btn')}</button>
<button class="btn btn-secondary" onclick="jsonToTsInterface()">${tl('ts_btn')}</button>
<button class="btn btn-secondary" id="jsonTreeBtn" onclick="jsonToggleView()">${tl('tree_view')}</button>
</div>
</div>
<pre class="result-box" id="jsonOutput" style="max-height:460px;overflow-y:auto;tab-size:2"></pre>
<div id="jsonTreeOutput" style="display:none;max-height:460px;overflow-y:auto;font-family:monospace;font-size:13px;line-height:1.8;padding:14px 16px;background:rgba(0,0,0,0.35);border:1px solid var(--glass-border);border-radius:10px"></div>
</div>`;
const ta = document.getElementById('jsonInput');
ta.addEventListener('input', _jsonLiveCheck);
ta.addEventListener('paste', () => setTimeout(_jsonLiveCheck, 50));
ta.addEventListener('keydown', e => {
if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); formatJSON(); }
});
}
function _jsonLiveCheck() {
const v = document.getElementById('jsonInput').value.trim();
const st = document.getElementById('jsonLiveStatus');
if (!v) { st.textContent = ''; return; }
try { JSON.parse(v); st.textContent = _jsonTl('valid'); st.style.color = '#10b981'; }
catch { st.textContent = _jsonTl('invalid'); st.style.color = '#ef4444'; }
}
let _jsonParsedObj = null;
function _jsonRender(text, label, success) {
const panel = document.getElementById('jsonResultPanel');
const output = document.getElementById('jsonOutput');
const status = document.getElementById('jsonStatus');
const meta   = document.getElementById('jsonMeta');
output.textContent = text;
status.textContent = (success ? '✓ ' : '✗ ') + label;
status.style.color  = success ? '#10b981' : '#ef4444';
if (success) {
const lines = text.split('\n').length;
meta.textContent = _jsonTl('lines_chars', lines, text.length);
try { _jsonParsedObj = JSON.parse(text); } catch { _jsonParsedObj = null; }
} else { meta.textContent = ''; _jsonParsedObj = null; }
panel.style.display = '';
_jsonViewMode = 'text';
const treeEl = document.getElementById('jsonTreeOutput');
const btn = document.getElementById('jsonTreeBtn');
if (treeEl) treeEl.style.display = 'none';
if (output) output.style.display = '';
if (btn) btn.textContent = _jsonTl('tree_view');
}
function formatJSON() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
try { _jsonRender(JSON.stringify(JSON.parse(v), null, 2), _jsonTl('format_done'), true); }
catch(e) { _jsonRender(_jsonTl('error_prefix') + e.message, _jsonTl('invalid_json'), false); }
}
function compressJSON() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
try { _jsonRender(JSON.stringify(JSON.parse(v)), _jsonTl('compressed'), true); }
catch(e) { _jsonRender(_jsonTl('error_prefix') + e.message, _jsonTl('invalid_json'), false); }
}
function jsonSort() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
try {
const sorted = _sortKeys(JSON.parse(v));
_jsonRender(JSON.stringify(sorted, null, 2), _jsonTl('sorted'), true);
} catch(e) { _jsonRender(_jsonTl('error_prefix') + e.message, _jsonTl('invalid_json'), false); }
}
function _sortKeys(obj) {
if (Array.isArray(obj)) return obj.map(_sortKeys);
if (obj !== null && typeof obj === 'object') {
return Object.fromEntries(Object.keys(obj).sort().map(k => [k, _sortKeys(obj[k])]));
}
return obj;
}
function jsonEscape() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
const escaped = JSON.stringify(v);
_jsonRender(escaped, _jsonTl('escaped'), true);
}
function clearJSON() {
document.getElementById('jsonInput').value = '';
document.getElementById('jsonResultPanel').style.display = 'none';
document.getElementById('jsonLiveStatus').textContent = '';
_jsonParsedObj = null;
}
function copyJSON(btn) { copyText(document.getElementById('jsonOutput').textContent, btn); }
function jsonDownload() {
const text = document.getElementById('jsonOutput').textContent;
if (!text) return;
const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
a.download = 'output.json';
a.click();
showToast(_jsonTl('downloaded'));
}
let _jsonViewMode = 'text'; 
function jsonToggleView() {
_jsonViewMode = _jsonViewMode === 'text' ? 'tree' : 'text';
const btn = document.getElementById('jsonTreeBtn');
const textEl = document.getElementById('jsonOutput');
const treeEl = document.getElementById('jsonTreeOutput');
if (_jsonViewMode === 'tree') {
const raw = textEl.textContent;
try {
const parsed = JSON.parse(raw);
_jsonParsedObj = parsed;
treeEl.innerHTML = _jsonBuildTree(parsed, 0, '$');
textEl.style.display = 'none';
treeEl.style.display = '';
btn.textContent = _jsonTl('text_view');
} catch { _jsonViewMode = 'text'; }
} else {
textEl.style.display = '';
treeEl.style.display = 'none';
btn.textContent = _jsonTl('tree_view');
}
}
function _jPathKey(key) {
if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return '.' + key;
return "['" + key.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + "']";
}
function _jsonBuildTree(val, depth, path) {
depth = depth || 0;
path = path || '$';
const esc = (s) => s.replace(/</g,'&lt;').replace(/>/g,'&gt;');
const pathAttr = `data-jpath="${esc(path)}"`;
const editAttr = `ondblclick="_jTreeEdit(this,event)"`;
if (val === null) return `<span class="jt-clickable jt-editable" ${pathAttr} onclick="_jShowPath(this,event)" ${editAttr} data-jtype="null" style="color:#ef4444">null</span>`;
if (typeof val === 'boolean') return `<span class="jt-clickable jt-editable" ${pathAttr} onclick="_jShowPath(this,event)" ${editAttr} data-jtype="boolean" style="color:#f59e0b">${val}</span>`;
if (typeof val === 'number') return `<span class="jt-clickable jt-editable" ${pathAttr} onclick="_jShowPath(this,event)" ${editAttr} data-jtype="number" style="color:#06b6d4">${val}</span>`;
if (typeof val === 'string') return `<span class="jt-clickable jt-editable" ${pathAttr} onclick="_jShowPath(this,event)" ${editAttr} data-jtype="string" style="color:#10b981">"${esc(val)}"</span>`;
const isArr = Array.isArray(val);
const keys = isArr ? val.map((_,i)=>i) : Object.keys(val);
if (!keys.length) return isArr ? '[]' : '{}';
const id = 'jt_' + Math.random().toString(36).slice(2);
const bracket = isArr ? ['[',']'] : ['{','}'];
const items = keys.map(k => {
const childPath = isArr ? path + '[' + k + ']' : path + _jPathKey(String(k));
const childPathAttr = `data-jpath="${esc(childPath)}"`;
const keyHtml = isArr ? '' : `<span class="jt-clickable" ${childPathAttr} onclick="_jShowPath(this,event)" style="color:#c4b5fd">"${esc(String(k))}"</span>: `;
return `<div style="padding-left:18px">${keyHtml}${_jsonBuildTree(val[k], depth+1, childPath)}</div>`;
}).join('');
return `<span onclick="_jCollapse('${id}')" style="cursor:pointer;user-select:none;color:var(--text-muted)">${bracket[0]}▾</span><div id="${id}">${items}</div><span>${bracket[1]}</span>`;
}
function _jCollapse(id) {
const el = document.getElementById(id);
if (!el) return;
const hidden = el.style.display === 'none';
el.style.display = hidden ? '' : 'none';
const toggle = el.previousElementSibling;
if (toggle) toggle.textContent = toggle.textContent.replace(hidden ? '▸' : '▾', hidden ? '▾' : '▸');
}
function _jShowPath(el, e) {
e.stopPropagation();
const path = el.getAttribute('data-jpath');
if (!path) return;
// remove previous active
const prev = document.querySelector('.jt-active');
if (prev) prev.classList.remove('jt-active');
el.classList.add('jt-active');
// compute wildcard path
const wildcard = path.replace(/\[\d+\]/g, '[*]');
const hasWildcard = wildcard !== path;
// render path bar
let bar = document.getElementById('jsonPathBar');
if (!bar) {
bar = document.createElement('div');
bar.id = 'jsonPathBar';
const treeEl = document.getElementById('jsonTreeOutput');
treeEl.insertBefore(bar, treeEl.firstChild);
}
const copyLabel = _jsonTl('copy_btn');
const row = (p) => `<div style="display:flex;align-items:center;gap:8px"><code style="flex:1;font-size:13px;word-break:break-all">${p.replace(/</g,'&lt;')}</code><button class="btn btn-secondary" style="padding:2px 10px;font-size:11px;flex-shrink:0" onclick="copyText('${p.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}',this)">${copyLabel}</button></div>`;
bar.innerHTML = row(path) + (hasWildcard ? row(wildcard) : '');
bar.style.cssText = 'position:sticky;top:0;z-index:2;background:rgba(30,30,40,0.95);border:1px solid var(--glass-border);border-radius:8px;padding:8px 12px;margin-bottom:10px;display:flex;flex-direction:column;gap:4px;backdrop-filter:blur(8px)';
}
// ── Tree view inline editing ──
function _jTreeEdit(span, e) {
e.stopPropagation();
if (span.querySelector('input')) return; // already editing
const jpath = span.getAttribute('data-jpath');
const jtype = span.getAttribute('data-jtype');
if (!jpath || !jtype) return;
const originalText = span.textContent;
// For strings, strip the surrounding quotes
let editVal = originalText;
if (jtype === 'string') editVal = originalText.slice(1, -1);
const input = document.createElement('input');
input.type = 'text';
input.value = editVal;
input.style.cssText = 'background:rgba(0,0,0,0.5);color:#fff;border:1px solid #6366f1;border-radius:3px;padding:1px 4px;font-family:monospace;font-size:13px;outline:none;min-width:60px;max-width:300px;width:' + Math.max(60, editVal.length * 8 + 20) + 'px';
span.textContent = '';
span.appendChild(input);
input.focus();
input.select();
const finish = (save) => {
if (input._done) return;
input._done = true;
if (!save) {
span.textContent = originalText;
return;
}
const raw = input.value;
let newVal;
try {
if (jtype === 'string') {
newVal = raw; // keep as string
} else {
newVal = JSON.parse(raw); // number, boolean, null
// Validate type consistency (allow type change for flexibility)
}
} catch {
showToast(_jsonTl('edit_save_fail'));
span.textContent = originalText;
return;
}
// Write new value back into _jsonParsedObj via path
_jSetByPath(_jsonParsedObj, jpath, newVal);
// Re-render output
const newText = JSON.stringify(_jsonParsedObj, null, 2);
document.getElementById('jsonOutput').textContent = newText;
// Re-render tree
const treeEl = document.getElementById('jsonTreeOutput');
treeEl.innerHTML = _jsonBuildTree(_jsonParsedObj, 0, '$');
};
input.addEventListener('keydown', ev => {
if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
});
input.addEventListener('blur', () => finish(false));
}
// Set a value in an object by JSONPath string like "$.foo.bar[2].name"
function _jSetByPath(obj, jpath, val) {
const parts = [];
let rem = jpath.replace(/^\$/, '');
while (rem) {
const dot = rem.match(/^\.([\w$]+)(.*)/);
const bracket = rem.match(/^\[(\d+)\](.*)/);
const bracketKey = rem.match(/^\[['"](.*?)['"]\](.*)/);
if (dot) { parts.push(dot[1]); rem = dot[2]; }
else if (bracket) { parts.push(Number(bracket[1])); rem = bracket[2]; }
else if (bracketKey) { parts.push(bracketKey[1]); rem = bracketKey[2]; }
else break;
}
let cur = obj;
for (let i = 0; i < parts.length - 1; i++) {
if (cur === null || cur === undefined) return;
cur = cur[parts[i]];
}
if (cur !== null && cur !== undefined && parts.length) {
cur[parts[parts.length - 1]] = val;
}
}
// inject hover/active styles once
(function() {
if (document.getElementById('jt-click-styles')) return;
const style = document.createElement('style');
style.id = 'jt-click-styles';
style.textContent = `.jt-clickable{cursor:pointer;border-radius:3px;padding:0 2px;transition:background .15s}.jt-clickable:hover{background:rgba(255,255,255,0.08)}.jt-clickable.jt-active{background:rgba(99,102,241,0.25);outline:1px solid rgba(99,102,241,0.4)}.jt-editable{cursor:pointer}`;
document.head.appendChild(style);
})();
function jsonPathQuery() {
const path = (document.getElementById('jsonPathInput') || {}).value || '';
const resultEl = document.getElementById('jsonPathResult');
if (!resultEl) return;
const raw = (document.getElementById('jsonInput') || {}).value.trim();
if (!raw) { resultEl.innerHTML = ''; return; }
let obj;
try { obj = JSON.parse(raw); } catch(e) { resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px">${_jsonTl('json_invalid_msg')}${e.message}</span>`; return; }
if (!path.trim()) { resultEl.innerHTML = ''; return; }
try {
const result = _jsonPath(obj, path.trim());
if (result === undefined) {
resultEl.innerHTML = `<span style="color:var(--text-muted);font-size:12px">${_jsonTl('no_match')}</span>`;
} else {
const text = JSON.stringify(result, null, 2);
resultEl.innerHTML = `<pre class="result-box" style="max-height:200px;overflow-y:auto">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
}
} catch(e) {
resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px">${_jsonTl('path_error')}${e.message}</span>`;
}
}
// ── JSONPath 实现：支持 $、.key、[n]、..key、[*]、[?(@.key op value)] ──
function _jsonPath(obj, path) {
if (path === '$') return obj;
let p = path.replace(/^\$/, '');
// 递归下降 ..key
if (p.startsWith('..')) {
const key = p.slice(2).split(/[.[\s]/, 1)[0];
const rest = p.slice(2 + key.length);
const results = [];
function descend(node) {
if (node === null || typeof node !== 'object') return;
if (key in node) {
const val = rest ? _jsonPath(node[key], '$' + rest) : node[key];
if (val !== undefined) results.push(val);
}
Object.values(node).forEach(descend);
}
descend(obj);
return results.length === 1 ? results[0] : results.length ? results : undefined;
}
// 逐段解析，支持 [*] 和 [?()]
let cur = [obj]; // work with array of candidates for wildcard/filter support
let rem = p;
while (rem) {
// [*] array wildcard
const wildcard = rem.match(/^\[\*\](.*)/);
if (wildcard) {
const next = [];
for (const c of cur) {
if (Array.isArray(c)) next.push(...c);
else if (c !== null && typeof c === 'object') next.push(...Object.values(c));
}
cur = next;
rem = wildcard[1];
continue;
}
// [?(@.key op value)] filter expression
const filter = rem.match(/^\[\?\(@\.([\w$]+)\s*(==|!=|>|>=|<|<=)\s*(.+?)\)\](.*)/);
if (filter) {
const fKey = filter[1];
const fOp = filter[2];
let fVal = filter[3].trim();
// parse the comparison value
if (fVal === 'true') fVal = true;
else if (fVal === 'false') fVal = false;
else if (fVal === 'null') fVal = null;
else if (/^['"]/.test(fVal)) fVal = fVal.slice(1, -1);
else if (!isNaN(Number(fVal))) fVal = Number(fVal);
const next = [];
for (const c of cur) {
if (!Array.isArray(c)) continue;
for (const item of c) {
if (item === null || typeof item !== 'object') continue;
const v = item[fKey];
let pass = false;
switch (fOp) {
case '==': pass = v == fVal; break;
case '!=': pass = v != fVal; break;
case '>':  pass = v > fVal; break;
case '>=': pass = v >= fVal; break;
case '<':  pass = v < fVal; break;
case '<=': pass = v <= fVal; break;
}
if (pass) next.push(item);
}
}
cur = next;
rem = filter[4];
continue;
}
// .key
const dot = rem.match(/^\.([\w$]+)(.*)/);
if (dot) {
cur = cur.map(c => (c !== null && c !== undefined) ? c[dot[1]] : undefined).filter(v => v !== undefined);
rem = dot[2];
continue;
}
// [n] numeric index
const bracket = rem.match(/^\[(\d+)\](.*)/);
if (bracket) {
cur = cur.map(c => (c !== null && c !== undefined) ? c[Number(bracket[1])] : undefined).filter(v => v !== undefined);
rem = bracket[2];
continue;
}
// ['key'] or ["key"]
const bracketKey = rem.match(/^\[['"](.*?)['"]\](.*)/);
if (bracketKey) {
cur = cur.map(c => (c !== null && c !== undefined) ? c[bracketKey[1]] : undefined).filter(v => v !== undefined);
rem = bracketKey[2];
continue;
}
break;
}
if (cur.length === 0) return undefined;
if (cur.length === 1) return cur[0];
return cur;
}
// ── JSON → TypeScript Interface ──
function jsonToTsInterface() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
let obj;
try { obj = JSON.parse(v); } catch(e) {
_jsonRender(_jsonTl('error_prefix') + e.message, _jsonTl('invalid_json'), false);
return;
}
const interfaces = [];
_jsonToTs(obj, 'RootObject', interfaces);
const result = interfaces.join('\n\n');
_jsonRender(result, _jsonTl('ts_done'), true);
}
function _jsonToTs(val, name, interfaces) {
if (val === null || typeof val !== 'object') {
// Primitive at root level — just show the type
interfaces.push(`type ${name} = ${_jsonTsType(val, name, interfaces)};`);
return;
}
if (Array.isArray(val)) {
const itemType = val.length > 0 ? _jsonTsType(val[0], name + 'Item', interfaces) : 'unknown';
interfaces.push(`type ${name} = ${itemType}[];`);
return;
}
const lines = [`interface ${name} {`];
for (const [key, value] of Object.entries(val)) {
const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
const tsType = _jsonTsType(value, _tsPascal(key), interfaces);
lines.push(`  ${safeKey}: ${tsType};`);
}
lines.push('}');
interfaces.push(lines.join('\n'));
}
function _jsonTsType(val, hintName, interfaces) {
if (val === null) return 'null';
if (typeof val === 'string') return 'string';
if (typeof val === 'number') return 'number';
if (typeof val === 'boolean') return 'boolean';
if (Array.isArray(val)) {
if (val.length === 0) return 'unknown[]';
const first = val[0];
if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
_jsonToTs(first, hintName, interfaces);
return hintName + '[]';
}
return _jsonTsType(first, hintName + 'Item', interfaces) + '[]';
}
if (typeof val === 'object') {
_jsonToTs(val, hintName, interfaces);
return hintName;
}
return 'unknown';
}
function _tsPascal(str) {
return str.replace(/(^|[_\-\s])(\w)/g, (_, _sep, c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}
function jsonLoadSample() {
document.getElementById('jsonInput').value = JSON.stringify({
name: 'DevToolbox', version: '2.0', tools: 53,
categories: ['文本处理','开发工具','编码加密','计算工具','时间工具','效率工具'],
meta: { author: 'bigkang', updated: new Date().toISOString().slice(0,10), dark: true }
}, null, 2);
_jsonLiveCheck();
}