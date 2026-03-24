var _unicodeTab = 'unicode';
function renderUnicode(el) {
el.innerHTML =
'<div class="tool-card-panel">' +
'<div style="display:flex;gap:8px;margin-bottom:14px">' +
'<button class="btn btn-primary" id="uTabUnicode" onclick="switchUnicodeTab(\"unicode\")">Unicode 转义</button>' +
'<button class="btn btn-secondary" id="uTabHtml" onclick="switchUnicodeTab(\"html\")">HTML 实体</button>' +
'</div>' +
'<div id="uPaneUnicode">' +
'<div class="panel-label">文本 ↔ Unicode 转义序列</div>' +
'<textarea class="tool-textarea" id="unicodeInput" rows="4" placeholder="输入文本或 \\uXXXX 序列..."></textarea>' +
'<div style="display:flex;gap:8px;margin-top:10px">' +
'<button class="btn btn-primary" onclick="encodeUnicode()">转义 →</button>' +
'<button class="btn btn-secondary" onclick="decodeUnicode()">← 还原</button>' +
'<button class="btn btn-secondary" onclick="document.getElementById(\"unicodeInput\").value=\"\";showUnicodeOutput(\"\")">清空</button>' +
'</div></div>' +
'<div id="uPaneHtml" style="display:none">' +
'<div class="panel-label">文本 ↔ HTML 实体</div>' +
'<textarea class="tool-textarea" id="htmlEntityInput" rows="4" placeholder="输入文本或 HTML 实体..."></textarea>' +
'<div style="display:flex;gap:8px;margin-top:10px">' +
'<button class="btn btn-primary" onclick="encodeHtmlEntity()">HTML 编码 →</button>' +
'<button class="btn btn-secondary" onclick="decodeHtmlEntity()">← HTML 解码</button>' +
'<button class="btn btn-secondary" onclick="document.getElementById(\"htmlEntityInput\").value=\"\";showUnicodeOutput(\"\")">清空</button>' +
'</div></div></div>' +
'<div class="tool-card-panel" id="unicodeOutput" style="display:none"></div>';
}
function switchUnicodeTab(tab) {
_unicodeTab = tab;
document.getElementById('uPaneUnicode').style.display = tab === 'unicode' ? '' : 'none';
document.getElementById('uPaneHtml').style.display = tab === 'html' ? '' : 'none';
document.getElementById('uTabUnicode').className = tab === 'unicode' ? 'btn btn-primary' : 'btn btn-secondary';
document.getElementById('uTabHtml').className = tab === 'html' ? 'btn btn-primary' : 'btn btn-secondary';
}
function encodeUnicode() {
var s = document.getElementById('unicodeInput').value;
var out = s.split('').map(function(c) {
return c.charCodeAt(0) > 127 ? '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0') : c;
}).join('');
showUnicodeOutput(out);
}
function decodeUnicode() {
var s = document.getElementById('unicodeInput').value;
var out = s.replace(/\\u([0-9a-fA-F]{4})/g, function(_, h){ return String.fromCharCode(parseInt(h,16)); });
showUnicodeOutput(out);
}
function encodeHtmlEntity() {
var s = document.getElementById('htmlEntityInput').value;
var out = s.split('').map(function(c) {
var code = c.charCodeAt(0);
if (c === '&') return '&amp;';
if (c === '<') return '&lt;';
if (c === '>') return '&gt;';
if (c === '"') return '&quot;';
if (c === "'") return '&#39;';
if (code > 127) return '&#' + code + ';';
return c;
}).join('');
showUnicodeOutput(out);
}
function decodeHtmlEntity() {
var s = document.getElementById('htmlEntityInput').value;
var d = document.createElement('textarea');
d.innerHTML = s;
showUnicodeOutput(d.value);
}
function showUnicodeOutput(text) {
var el = document.getElementById('unicodeOutput');
if (!text) { el.style.display = 'none'; return; }
el.style.display = '';
var id = 'ucopyBtn';
setTimeout(function(){
var b = document.getElementById(id);
if (b) b.onclick = function(){ copyText(text, b); };
}, 0);
el.innerHTML = '<div class="panel-label">结果</div>' +
'<div style="display:flex;align-items:flex-start;gap:10px">' +
'<pre style="flex:1;font-family:monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;margin:0;color:var(--text)">' + escHtml(text) + '</pre>' +
'<button class="copy-inline" id="' + id + '">复制</button>' +
'</div>';
}