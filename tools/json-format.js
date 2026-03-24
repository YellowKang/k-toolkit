function renderJSON(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">输入 JSON</div>
<div style="display:flex;gap:6px;align-items:center">
<span id="jsonLiveStatus" style="font-size:12px"></span>
<button class="btn btn-secondary" onclick="jsonLoadSample()">示例</button>
<button class="btn btn-secondary" onclick="clearJSON()">清空</button>
</div>
</div>
<textarea class="tool-textarea" id="jsonInput" rows="10" placeholder='粘贴 JSON 内容...'></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="formatJSON()">格式化</button>
<button class="btn btn-secondary" onclick="compressJSON()">压缩</button>
<button class="btn btn-secondary" onclick="jsonSort()">键名排序</button>
<button class="btn btn-secondary" onclick="jsonEscape()">转义字符串</button>
</div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">JSONPath 查询</div>
<span style="font-size:11px;color:var(--text-muted)">示例: $.name &nbsp;|&nbsp; $.categories[0] &nbsp;|&nbsp; $..author</span>
</div>
<div style="display:flex;gap:8px">
<input class="tool-input" id="jsonPathInput" placeholder="输入 JSONPath 表达式..." style="flex:1" oninput="jsonPathQuery()">
<button class="btn btn-secondary" onclick="jsonPathQuery()">查询</button>
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
<button class="btn btn-secondary" onclick="copyJSON(this)">复制结果</button>
<button class="btn btn-secondary" onclick="jsonDownload()">下载</button>
<button class="btn btn-secondary" id="jsonTreeBtn" onclick="jsonToggleView()">树形视图</button>
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
try { JSON.parse(v); st.textContent = '✓ 有效'; st.style.color = '#10b981'; }
catch { st.textContent = '✗ 无效'; st.style.color = '#ef4444'; }
}
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
meta.textContent = `${lines} 行 · ${text.length} 字符`;
} else meta.textContent = '';
panel.style.display = '';
}
function formatJSON() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
try { _jsonRender(JSON.stringify(JSON.parse(v), null, 2), '格式化完成', true); }
catch(e) { _jsonRender('错误：' + e.message, '无效 JSON', false); }
}
function compressJSON() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
try { _jsonRender(JSON.stringify(JSON.parse(v)), '已压缩', true); }
catch(e) { _jsonRender('错误：' + e.message, '无效 JSON', false); }
}
function jsonSort() {
const v = document.getElementById('jsonInput').value.trim();
if (!v) return;
try {
const sorted = _sortKeys(JSON.parse(v));
_jsonRender(JSON.stringify(sorted, null, 2), '键名已排序', true);
} catch(e) { _jsonRender('错误：' + e.message, '无效 JSON', false); }
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
_jsonRender(escaped, '已转义为 JSON 字符串', true);
}
function clearJSON() {
document.getElementById('jsonInput').value = '';
document.getElementById('jsonResultPanel').style.display = 'none';
document.getElementById('jsonLiveStatus').textContent = '';
}
function copyJSON(btn) { copyText(document.getElementById('jsonOutput').textContent, btn); }
function jsonDownload() {
const text = document.getElementById('jsonOutput').textContent;
if (!text) return;
const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
a.download = 'output.json';
a.click();
showToast('文件已下载');
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
treeEl.innerHTML = _jsonBuildTree(JSON.parse(raw), 0, '$');
textEl.style.display = 'none';
treeEl.style.display = '';
btn.textContent = '文本视图';
} catch { _jsonViewMode = 'text'; }
} else {
textEl.style.display = '';
treeEl.style.display = 'none';
btn.textContent = '树形视图';
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
if (val === null) return `<span class="jt-clickable" ${pathAttr} onclick="_jShowPath(this,event)" style="color:#ef4444">null</span>`;
if (typeof val === 'boolean') return `<span class="jt-clickable" ${pathAttr} onclick="_jShowPath(this,event)" style="color:#f59e0b">${val}</span>`;
if (typeof val === 'number') return `<span class="jt-clickable" ${pathAttr} onclick="_jShowPath(this,event)" style="color:#06b6d4">${val}</span>`;
if (typeof val === 'string') return `<span class="jt-clickable" ${pathAttr} onclick="_jShowPath(this,event)" style="color:#10b981">"${esc(val)}"</span>`;
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
const prev = document.querySelector('.jt-active');
if (prev) prev.classList.remove('jt-active');
el.classList.add('jt-active');
const wildcard = path.replace(/\[\d+\]/g, '[*]');
const hasWildcard = wildcard !== path;
let bar = document.getElementById('jsonPathBar');
if (!bar) {
bar = document.createElement('div');
bar.id = 'jsonPathBar';
const treeEl = document.getElementById('jsonTreeOutput');
treeEl.insertBefore(bar, treeEl.firstChild);
}
const row = (p) => `<div style="display:flex;align-items:center;gap:8px"><code style="flex:1;font-size:13px;word-break:break-all">${p.replace(/</g,'&lt;')}</code><button class="btn btn-secondary" style="padding:2px 10px;font-size:11px;flex-shrink:0" onclick="copyText('${p.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}',this)">复制</button></div>`;
bar.innerHTML = row(path) + (hasWildcard ? row(wildcard) : '');
bar.style.cssText = 'position:sticky;top:0;z-index:2;background:rgba(30,30,40,0.95);border:1px solid var(--glass-border);border-radius:8px;padding:8px 12px;margin-bottom:10px;display:flex;flex-direction:column;gap:4px;backdrop-filter:blur(8px)';
}
(function() {
if (document.getElementById('jt-click-styles')) return;
const style = document.createElement('style');
style.id = 'jt-click-styles';
style.textContent = `.jt-clickable{cursor:pointer;border-radius:3px;padding:0 2px;transition:background .15s}.jt-clickable:hover{background:rgba(255,255,255,0.08)}.jt-clickable.jt-active{background:rgba(99,102,241,0.25);outline:1px solid rgba(99,102,241,0.4)}`;
document.head.appendChild(style);
})();
function jsonPathQuery() {
const path = (document.getElementById('jsonPathInput') || {}).value || '';
const resultEl = document.getElementById('jsonPathResult');
if (!resultEl) return;
const raw = (document.getElementById('jsonInput') || {}).value.trim();
if (!raw) { resultEl.innerHTML = ''; return; }
let obj;
try { obj = JSON.parse(raw); } catch(e) { resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px">JSON 无效: ${e.message}</span>`; return; }
if (!path.trim()) { resultEl.innerHTML = ''; return; }
try {
const result = _jsonPath(obj, path.trim());
if (result === undefined) {
resultEl.innerHTML = `<span style="color:var(--text-muted);font-size:12px">无匹配结果</span>`;
} else {
const text = JSON.stringify(result, null, 2);
resultEl.innerHTML = `<pre class="result-box" style="max-height:200px;overflow-y:auto">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
}
} catch(e) {
resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px">路径错误: ${e.message}</span>`;
}
}
function _jsonPath(obj, path) {
if (path === '$') return obj;
let p = path.replace(/^\$/, '');
if (p.startsWith('..')) {
const key = p.slice(2).split(/[.[]/, 1)[0];
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
const parts = [];
let rem = p;
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
for (const part of parts) {
if (cur === null || cur === undefined) return undefined;
cur = cur[part];
}
return cur;
}
function jsonLoadSample() {
document.getElementById('jsonInput').value = JSON.stringify({
name: 'DevToolbox', version: '2.0', tools: 53,
categories: ['文本处理','开发工具','编码加密','计算工具','时间工具','效率工具'],
meta: { author: 'bigkang', updated: new Date().toISOString().slice(0,10), dark: true }
}, null, 2);
_jsonLiveCheck();
}