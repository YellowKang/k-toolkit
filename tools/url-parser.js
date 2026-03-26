function renderUrlParser(el) {
const tl = makeToolI18n({
zh: {
tab_parse:        'URL 解析',
tab_encode:       '编解码',
tab_build:        '参数构建',
input_url:        '输入 URL',
btn_parse:        '解析',
btn_current:      '当前页',
parse_result:     '解析结果',
btn_copy_all:     '复制全部',
query_params:     '查询参数',
url_encode:       'URL 编码',
url_decode:       'URL 解码',
param_parse:      '参数解析',
input_text:       '输入文本',
input_url_label:  '输入 URL',
ph_encode:        '输入需要编码的文本...',
ph_decode:        '输入需要解码的 URL...',
ph_parse:         '输入完整 URL（含参数）',
btn_exec:         '执行',
btn_clear:        '清空',
btn_copy_result:  '复制结果',
btn_copy:         '复制',
base_url:         '基础 URL',
btn_add_param:    '+ 添加参数',
btn_gen_url:      '生成 URL',
gen_result:       '生成结果',
protocol:         '协议',
host:             '主机',
port:             '端口',
path:             '路径',
query:            '查询串',
default_val:      '(默认)',
none_val:         '(无)',
param_key:        '参数名',
param_value:      '参数值',
ph_key:           '参数名 (key)',
ph_value:         '参数值 (value)',
invalid_url:      '无效 URL',
copied_result:    '已复制解析结果',
ok_encoded:       'OK 编码完成',
ok_decoded:       'OK 解码完成',
decode_fail:      '解码失败：',
error:            '错误',
domain:           '域名：',
no_query_params:  '无查询参数',
ok_parsed:        (n) => `OK 解析到 ${n} 个参数`,
url_format_error: 'URL 格式错误',
decode_fail_legacy:'解码失败：包含无效的百分号编码',
},
en: {
tab_parse:        'URL Parse',
tab_encode:       'Encode/Decode',
tab_build:        'Param Builder',
input_url:        'Input URL',
btn_parse:        'Parse',
btn_current:      'Current Page',
parse_result:     'Parse Result',
btn_copy_all:     'Copy All',
query_params:     'Query Params',
url_encode:       'URL Encode',
url_decode:       'URL Decode',
param_parse:      'Param Parse',
input_text:       'Input Text',
input_url_label:  'Input URL',
ph_encode:        'Text to encode...',
ph_decode:        'URL-encoded text to decode...',
ph_parse:         'Full URL with params',
btn_exec:         'Execute',
btn_clear:        'Clear',
btn_copy_result:  'Copy Result',
btn_copy:         'Copy',
base_url:         'Base URL',
btn_add_param:    '+ Add Param',
btn_gen_url:      'Generate URL',
gen_result:       'Result',
protocol:         'Protocol',
host:             'Host',
port:             'Port',
path:             'Path',
query:            'Query',
default_val:      '(default)',
none_val:         '(none)',
param_key:        'Key',
param_value:      'Value',
ph_key:           'Key',
ph_value:         'Value',
invalid_url:      'Invalid URL',
copied_result:    'Copied',
ok_encoded:       'OK Encoded',
ok_decoded:       'OK Decoded',
decode_fail:      'Decode failed: ',
error:            'Error',
domain:           'Domain: ',
no_query_params:  'No query params',
ok_parsed:        (n) => `OK Parsed ${n} param${n===1?'':'s'}`,
url_format_error: 'Invalid URL format',
decode_fail_legacy:'Decode failed: invalid percent-encoding',
}
});
window._urlTl = tl;
el.innerHTML = `
<div style="display:flex;gap:8px;margin-bottom:16px">
<button class="btn btn-primary" id="urlTabParse" onclick="urlSwitchTab('parse')">${tl('tab_parse')}</button>
<button class="btn btn-secondary" id="urlTabEncode" onclick="urlSwitchTab('encode')">${tl('tab_encode')}</button>
<button class="btn btn-secondary" id="urlTabBuild" onclick="urlSwitchTab('build')">${tl('tab_build')}</button>
</div>
<!-- Tab: URL Parse (parse) -->
<div id="urlTabContentParse">
<div class="tool-card-panel">
<div class="panel-label">${tl('input_url')}</div>
<div style="display:flex;gap:10px;flex-wrap:wrap">
<input class="tool-input" id="urlInput" placeholder="https://example.com/path?foo=bar&baz=qux#section" style="flex:1">
<button class="btn btn-primary" onclick="parseUrl()">${tl('btn_parse')}</button>
<button class="btn btn-secondary" onclick="urlUseCurrent()">${tl('btn_current')}</button>
</div>
</div>
<div class="tool-card-panel" id="urlResultPanel" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">${tl('parse_result')}</div>
<button class="btn btn-secondary" onclick="urlCopyAll()">${tl('btn_copy_all')}</button>
</div>
<div id="urlFields"></div>
</div>
<div class="tool-card-panel" id="urlParamsPanel" style="display:none">
<div class="panel-label" style="margin-bottom:12px">${tl('query_params')}</div>
<div id="urlParamsTable"></div>
</div>
</div>
<!-- Tab: Encode/Decode (encode) -->
<div id="urlTabContentEncode" style="display:none">
<div class="tool-card-panel">
<div style="display:flex;gap:10px;margin-bottom:14px">
<button class="btn btn-primary" id="ueEncBtn" onclick="setUEMode('encode')">${tl('url_encode')}</button>
<button class="btn btn-secondary" id="ueDecBtn" onclick="setUEMode('decode')">${tl('url_decode')}</button>
<button class="btn btn-secondary" id="ueParseBtn" onclick="setUEMode('parse')">${tl('param_parse')}</button>
</div>
<div class="panel-label" id="ueLabel">${tl('input_text')}</div>
<textarea class="tool-textarea" id="ueInput" rows="5" placeholder="${tl('ph_encode')}" oninput="_ueRealtime()"></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="doUrlEncode()">${tl('btn_exec')}</button>
<button class="btn btn-secondary" onclick="document.getElementById('ueInput').value='';document.getElementById('ueResult').style.display='none'">${tl('btn_clear')}</button>
</div>
</div>
<div class="tool-card-panel" id="ueResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="ueStatus"></div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('ueOutput').innerText,this)">${tl('btn_copy_result')}</button>
</div>
<div id="ueOutput" class="result-box" style="white-space:pre-wrap;word-break:break-all"></div>
</div>
</div>
<!-- Tab: Param Builder (build) -->
<div id="urlTabContentBuild" style="display:none">
<div class="tool-card-panel">
<div class="panel-label">${tl('base_url')}</div>
<input class="tool-input" id="urlBuildBase" placeholder="https://example.com/api/endpoint" style="width:100%;margin-bottom:14px" oninput="urlBuildAutoPreview()">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">${tl('query_params')}</div>
<button class="btn btn-secondary" onclick="urlBuildAddRow()">${tl('btn_add_param')}</button>
</div>
<div id="urlBuildRows"></div>
<div class="tool-actions" style="margin-top:14px">
<button class="btn btn-primary" onclick="urlBuildGenerate()">${tl('btn_gen_url')}</button>
<button class="btn btn-secondary" onclick="urlBuildClear()">${tl('btn_clear')}</button>
</div>
</div>
<div class="tool-card-panel" id="urlBuildResultPanel" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">${tl('gen_result')}</div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('urlBuildOutput').textContent,this)">${tl('btn_copy')}</button>
</div>
<div id="urlBuildOutput" class="result-box" style="word-break:break-all;font-family:monospace;font-size:13px"></div>
</div>
</div>
<!-- Legacy encode/decode panel (hidden, keeps IDs for backward compat) -->
<div style="display:none">
<textarea id="urlEncInput"></textarea>
<div id="urlEncOutput"></div>
</div>`;
const inp = document.getElementById('urlInput');
inp.addEventListener('keydown', e => { if (e.key==='Enter') { e.preventDefault(); parseUrl(); } });
inp.addEventListener('input', () => { if (inp.value.trim().startsWith('http')) parseUrl(); });
window._ueMode = 'encode';
urlBuildAddRow();
urlBuildAddRow();
}
function urlSwitchTab(tab) {
const tabs = ['parse','encode','build'];
tabs.forEach(t => {
const content = document.getElementById('urlTabContent' + t.charAt(0).toUpperCase() + t.slice(1));
const btn = document.getElementById('urlTab' + t.charAt(0).toUpperCase() + t.slice(1));
if (content) content.style.display = (t === tab) ? '' : 'none';
if (btn) btn.className = (t === tab) ? 'btn btn-primary' : 'btn btn-secondary';
});
}
function urlUseCurrent() {
document.getElementById('urlInput').value = location.href;
parseUrl();
}
function parseUrl() {
const tl = window._urlTl;
const raw = document.getElementById('urlInput').value.trim();
if (!raw) return;
let url;
try { url = new URL(raw); }
catch { try { url = new URL('https://' + raw); } catch {
document.getElementById('urlResultPanel').style.display = '';
document.getElementById('urlFields').innerHTML = `<span style="color:#ef4444">${tl('invalid_url')}</span>`;
return;
}}
const fields = [
{ label: tl('protocol'), value: url.protocol },
{ label: tl('host'),     value: url.hostname },
{ label: tl('port'),     value: url.port || tl('default_val') },
{ label: tl('path'),     value: url.pathname },
{ label: tl('query'),    value: url.search || tl('none_val') },
{ label: 'Hash',         value: url.hash || tl('none_val') },
{ label: 'Origin',       value: url.origin },
];
document.getElementById('urlFields').innerHTML = fields.map(f => `
<div class="result-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
<span style="color:var(--text-muted);width:72px;flex-shrink:0;font-size:12px">${f.label}</span>
<span style="font-family:monospace;font-size:13px;flex:1;word-break:break-all">${escHtml(f.value)}</span>
<button class="copy-inline" onclick="copyText('${escHtml(f.value).replace(/'/g,"&#39;")}',this)">${tl('btn_copy')}</button>
</div>`).join('');
document.getElementById('urlResultPanel').style.display = '';
const params = [...url.searchParams.entries()];
const pp = document.getElementById('urlParamsPanel');
if (params.length) {
document.getElementById('urlParamsTable').innerHTML =
`<div style="border:1px solid var(--glass-border);border-radius:10px;overflow:hidden">
<div style="display:grid;grid-template-columns:1fr 2fr auto;padding:8px 14px;background:rgba(102,126,234,0.08);font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase"><span>${tl('param_key')}</span><span>${tl('param_value')}</span><span></span></div>` +
params.map(([k,v], i) =>
`<div style="display:grid;grid-template-columns:1fr 2fr auto;padding:9px 14px;gap:12px;align-items:center;${i%2?'background:rgba(255,255,255,0.015)':''};border-top:1px solid var(--glass-border)">
<span style="color:var(--accent);font-family:monospace;font-size:13px;word-break:break-all">${escHtml(k)}</span>
<span style="font-family:monospace;font-size:13px;word-break:break-all">${escHtml(v)}</span>
<button class="copy-inline" onclick="copyText('${escHtml(v).replace(/'/g,"&#39;")}',this)">${tl('btn_copy')}</button>
</div>`).join('') + `</div>`;
pp.style.display = '';
} else { pp.style.display = 'none'; }
}
function urlCopyAll() {
const tl = window._urlTl;
const rows = document.getElementById('urlFields').querySelectorAll('.result-row span:nth-child(2)');
const text = [...rows].map(s => s.textContent).join('\n');
navigator.clipboard.writeText(text).then(() => showToast(tl('copied_result')));
}
function urlEncode() {
const v = document.getElementById('urlEncInput').value || document.getElementById('ueInput').value;
const out = document.getElementById('urlEncOutput');
out.textContent = encodeURIComponent(v);
out.style.display = '';
}
function urlDecode() {
const tl = window._urlTl;
const v = document.getElementById('urlEncInput').value || document.getElementById('ueInput').value;
const out = document.getElementById('urlEncOutput');
try { out.textContent = decodeURIComponent(v); }
catch { out.textContent = tl('decode_fail_legacy'); }
out.style.display = '';
}
function clearUrlEnc() {
document.getElementById('urlEncInput').value = '';
document.getElementById('urlEncOutput').style.display = 'none';
}
function setUEMode(mode) {
const tl = window._urlTl;
window._ueMode = mode;
const labels = {encode:tl('ph_encode'),decode:tl('ph_decode'),parse:tl('ph_parse')};
document.getElementById('ueInput').placeholder = labels[mode];
document.getElementById('ueLabel').textContent = mode==='parse'?tl('input_url_label'):tl('input_text');
document.getElementById('ueEncBtn').className = mode==='encode'?'btn btn-primary':'btn btn-secondary';
document.getElementById('ueDecBtn').className = mode==='decode'?'btn btn-primary':'btn btn-secondary';
document.getElementById('ueParseBtn').className = mode==='parse'?'btn btn-primary':'btn btn-secondary';
document.getElementById('ueResult').style.display='none';
}
function doUrlEncode() {
const tl = window._urlTl;
const v = document.getElementById('ueInput').value.trim();
if (!v) return;
const out = document.getElementById('ueOutput');
const status = document.getElementById('ueStatus');
if (window._ueMode === 'encode') {
out.textContent = encodeURIComponent(v);
status.textContent = tl('ok_encoded'); status.style.color='#10b981';
out.style.display='';
} else if (window._ueMode === 'decode') {
try {
out.textContent = decodeURIComponent(v);
status.textContent=tl('ok_decoded'); status.style.color='#10b981';
out.style.display='';
} catch(e) {
out.textContent=tl('decode_fail')+e.message;
status.textContent=tl('error'); status.style.color='#ef4444';
}
} else {
try {
const url = new URL(v.includes('://')?v:'https://'+v);
const params = [...url.searchParams.entries()];
let html = `<div style="margin-bottom:10px"><span style="color:var(--text-muted);font-size:12px">${tl('domain')}</span><code style="color:var(--neon)">${url.hostname}</code>`;
if (url.pathname !== '/') html += `<span style="color:var(--text-muted)"> ${url.pathname}</span>`;
html += '</div>';
if (params.length) {
html += params.map(([k,pv])=>`<div class="result-row" style="margin-bottom:6px"><code style="color:var(--accent);min-width:140px;display:inline-block">${k}</code><span style="color:var(--text);flex:1;margin:0 8px">${decodeURIComponent(pv)}</span><button class="copy-inline" onclick="copyText(this.dataset.v,this)" data-v="${pv}">${tl('btn_copy')}</button></div>`).join('');
} else {
html += `<div style="color:var(--text-muted)">${tl('no_query_params')}</div>`;
}
out.innerHTML = html;
out.style.removeProperty('white-space');
const okParsed = tl('ok_parsed');
status.textContent = typeof okParsed === 'function' ? okParsed(params.length) : okParsed;
status.style.color='#10b981';
} catch(e) {
out.textContent=tl('url_format_error');
status.textContent=tl('error'); status.style.color='#ef4444';
}
}
document.getElementById('ueResult').style.display='';
}
function _ueRealtime() {
var val = document.getElementById('ueInput').value;
if (!val) { document.getElementById('ueResult').style.display='none'; return; }
doUrlEncode();
}
var _urlBuildRowId = 0;
function urlBuildAddRow() {
const tl = window._urlTl;
const container = document.getElementById('urlBuildRows');
const rowId = _urlBuildRowId++;
const row = document.createElement('div');
row.id = 'urlBuildRow_' + rowId;
row.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
row.innerHTML = `
<input class="tool-input" placeholder="${tl('ph_key')}" style="flex:1" data-role="key" oninput="urlBuildAutoPreview()">
<input class="tool-input" placeholder="${tl('ph_value')}" style="flex:1.5" data-role="value" oninput="urlBuildAutoPreview()">
<button class="btn btn-secondary" onclick="urlBuildRemoveRow('urlBuildRow_${rowId}')" style="padding:6px 10px;flex-shrink:0">X</button>`;
container.appendChild(row);
}
function urlBuildRemoveRow(rowId) {
const row = document.getElementById(rowId);
if (row) row.remove();
urlBuildAutoPreview();
}
function urlBuildGetParams() {
const rows = document.getElementById('urlBuildRows').children;
const params = [];
for (let i = 0; i < rows.length; i++) {
const key = rows[i].querySelector('[data-role="key"]').value.trim();
const value = rows[i].querySelector('[data-role="value"]').value;
if (key) params.push([key, value]);
}
return params;
}
function urlBuildGenerate() {
const base = document.getElementById('urlBuildBase').value.trim();
const params = urlBuildGetParams();
const panel = document.getElementById('urlBuildResultPanel');
const out = document.getElementById('urlBuildOutput');
if (!base && params.length === 0) {
panel.style.display = 'none';
return;
}
const qs = params.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
let result;
if (base) {
try {
const url = new URL(base.includes('://') ? base : 'https://' + base);
params.forEach(([k, v]) => url.searchParams.append(k, v));
result = url.toString();
} catch {
const sep = base.includes('?') ? '&' : '?';
result = qs ? base + sep + qs : base;
}
} else {
result = '?' + qs;
}
out.textContent = result;
panel.style.display = '';
}
function urlBuildAutoPreview() {
const base = document.getElementById('urlBuildBase').value.trim();
const params = urlBuildGetParams();
if (base || params.length > 0) {
urlBuildGenerate();
}
}
function urlBuildClear() {
document.getElementById('urlBuildBase').value = '';
document.getElementById('urlBuildRows').innerHTML = '';
document.getElementById('urlBuildResultPanel').style.display = 'none';
_urlBuildRowId = 0;
urlBuildAddRow();
urlBuildAddRow();
}
function renderUrlEncode(el) {
renderUrlParser(el);
urlSwitchTab('encode');
}