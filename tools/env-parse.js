window.renderEnvParse = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">粘贴 .env 内容</div>
<textarea class="tool-textarea" id="epInput" rows="10" placeholder="# 注释行会被忽略\nAPP_NAME=MyApp\nPORT=3000\nDB_URL=postgres:
<div class="tool-actions">
<button class="btn btn-primary" onclick="epParse()">解析</button>
<button class="btn btn-secondary" onclick="epClear()">清空</button>
</div>
</div>
<div class="tool-card-panel" id="epResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="epStatus"></div>
<span style="font-size:12px;color:#9ca3af">点击值可复制</span>
</div>
<div id="epTable"></div>
</div>`;
};
var _epValMap = new Map();
function epParse() {
var input = document.getElementById('epInput').value;
var result = document.getElementById('epResult');
var status = document.getElementById('epStatus');
var tableEl = document.getElementById('epTable');
var lines = input.split('\n');
var pairs = [];
lines.forEach(function(line) {
var t = line.trim();
if (!t || t.startsWith('#')) return;
var idx = t.indexOf('=');
if (idx < 1) return;
var key = t.slice(0, idx).trim();
var val = t.slice(idx + 1).trim();
if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
val = val.slice(1, -1);
}
pairs.push({key: key, val: val});
});
if (pairs.length === 0) {
status.textContent = '未找到有效键值对';
status.style.color = '#e74c3c';
tableEl.innerHTML = '';
result.style.display = '';
return;
}
status.textContent = '✓ 解析到 ' + pairs.length + ' 个变量';
status.style.color = '#10b981';
_epValMap.clear();
var esc = function(s) {
return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
var html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
html += '<thead><tr style="background:#f3f4f6"><th style="text-align:left;padding:8px 12px;border:1px solid #e5e7eb;color:#374151;font-weight:600">KEY</th><th style="text-align:left;padding:8px 12px;border:1px solid #e5e7eb;color:#374151;font-weight:600">VALUE</th></tr></thead><tbody>';
pairs.forEach(function(p, i) {
var bg = i % 2 === 0 ? '#fff' : '#f9fafb';
_epValMap.set(i, p.val);
html += '<tr style="background:' + bg + '">';
html += '<td style="padding:7px 12px;border:1px solid #e5e7eb;font-family:monospace;color:#1e40af;font-weight:500">' + esc(p.key) + '</td>';
html += '<td style="padding:7px 12px;border:1px solid #e5e7eb"><span style="font-family:monospace;cursor:pointer;background:#f3f4f6;padding:2px 6px;border-radius:4px;display:inline-block;max-width:100%;word-break:break-all" title="点击复制" onclick="epCopyVal(this,' + i + ')">' + esc(p.val) + '</span></td>';
html += '</tr>';
});
html += '</tbody></table>';
tableEl.innerHTML = html;
result.style.display = '';
}
function epCopyVal(el, idx) {
var val = _epValMap.get(idx);
if (val === undefined) return;
var orig = el.style.background;
navigator.clipboard.writeText(val).then(function() {
el.style.background = '#d1fae5';
setTimeout(function() { el.style.background = orig; }, 800);
}).catch(function() {
var ta = document.createElement('textarea');
ta.value = val;
document.body.appendChild(ta);
ta.select();
document.execCommand('copy');
document.body.removeChild(ta);
el.style.background = '#d1fae5';
setTimeout(function() { el.style.background = orig; }, 800);
});
}
function epClear() {
document.getElementById('epInput').value = '';
document.getElementById('epResult').style.display = 'none';
}