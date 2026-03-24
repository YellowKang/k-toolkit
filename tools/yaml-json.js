function renderYAMLJSON(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">输入内容</div>
<textarea class="tool-textarea" id="yjInput" rows="10" placeholder="粘贴 YAML 或 JSON..." oninput="_yjAutoDetect()"></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="yjToJSON()">YAML → JSON</button>
<button class="btn btn-primary" onclick="yjToYAML()">JSON → YAML</button>
<button class="btn btn-secondary" onclick="yjSwap()">↕ 互换</button>
<button class="btn btn-secondary" onclick="yjClear()">清空</button>
</div>
</div>
<div class="tool-card-panel" id="yjResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="yjStatus"></div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('yjOutput').textContent,this)">复制</button>
</div>
<pre class="result-box" id="yjOutput" style="max-height:400px;overflow-y:auto"></pre>
</div>`;
}
function yjParseYAML(yaml) {
const lines = yaml.split('\n');
function parseBlock(lines, baseIndent) {
const result = {};
let i = 0;
while (i < lines.length) {
const line = lines[i];
const trimmed = line.trimStart();
if (!trimmed || trimmed.startsWith('#')) { i++; continue; }
const indent = line.length - trimmed.length;
if (indent < baseIndent) break;
const colonIdx = trimmed.indexOf(': ');
if (colonIdx > -1) {
const key = trimmed.slice(0, colonIdx);
const val = trimmed.slice(colonIdx + 2).trim();
if (val === '' || val === '|' || val === '>') {
const subLines = [];
i++;
while (i < lines.length) {
const sub = lines[i];
const subTrim = sub.trimStart();
const subIndent = sub.length - subTrim.length;
if (subTrim && subIndent <= indent) break;
subLines.push(sub.slice(indent + 2));
i++;
}
if (subLines[0] && subLines[0].trimStart().startsWith('- ')) {
result[key] = subLines.filter(l=>l.trim()).map(l=>yjParseVal(l.trim().replace(/^- /,'')));
} else {
result[key] = parseBlock(subLines, 0)[Object.keys(parseBlock(subLines,0))[0]] || parseBlock(subLines,0);
result[key] = parseBlock(subLines, 0);
}
} else {
result[key] = yjParseVal(val);
i++;
}
} else if (trimmed.startsWith('- ')) {
if (!Array.isArray(result._arr)) result._arr = [];
result._arr.push(yjParseVal(trimmed.slice(2)));
i++;
} else { i++; }
}
return result._arr || result;
}
function yjParseVal(v) {
if (v === 'true') return true;
if (v === 'false') return false;
if (v === 'null' || v === '~') return null;
if (!isNaN(v) && v !== '') return Number(v);
return v.replace(/^['"]|['"]$/g,'');
}
return parseBlock(lines, 0);
}
function objToYAML(obj, indent) {
const pad = ' '.repeat(indent);
if (Array.isArray(obj)) {
return obj.map(item => {
if (typeof item === 'object' && item !== null) {
const inner = objToYAML(item, indent + 2).trimStart();
return pad + '- ' + inner;
}
return pad + '- ' + item;
}).join('\n');
}
if (typeof obj === 'object' && obj !== null) {
return Object.entries(obj).map(([k,v]) => {
if (typeof v === 'object' && v !== null) {
return pad + k + ':\n' + objToYAML(v, indent + 2);
}
return pad + k + ': ' + v;
}).join('\n');
}
return pad + obj;
}
function yjToJSON() {
const v = document.getElementById('yjInput').value.trim();
const out = document.getElementById('yjOutput');
const status = document.getElementById('yjStatus');
const result = document.getElementById('yjResult');
if (!v) return;
try {
const obj = yjParseYAML(v);
out.textContent = JSON.stringify(obj, null, 2);
status.textContent = '✓ 转换成功';
status.style.color = '#10b981';
} catch(e) {
out.textContent = '错误: ' + e.message;
status.textContent = '✗ 解析失败';
status.style.color = '#e74c3c';
}
result.style.display = '';
}
function yjToYAML() {
const v = document.getElementById('yjInput').value.trim();
const out = document.getElementById('yjOutput');
const status = document.getElementById('yjStatus');
const result = document.getElementById('yjResult');
if (!v) return;
try {
const obj = JSON.parse(v);
out.textContent = objToYAML(obj, 0);
status.textContent = '✓ 转换成功';
status.style.color = '#10b981';
} catch(e) {
out.textContent = '错误: ' + e.message;
status.textContent = '✗ JSON 格式错误';
status.style.color = '#e74c3c';
}
result.style.display = '';
}
let _yjTimer = null;
function _yjAutoDetect() {
clearTimeout(_yjTimer);
const v = document.getElementById('yjInput').value.trim();
if (!v) { document.getElementById('yjResult').style.display='none'; return; }
_yjTimer = setTimeout(() => {
if (v.startsWith('{') || v.startsWith('[')) yjToYAML();
else yjToJSON();
}, 400);
}
function yjSwap() {
const out = document.getElementById('yjOutput').textContent;
if (!out) return;
document.getElementById('yjInput').value = out;
document.getElementById('yjResult').style.display = 'none';
_yjAutoDetect();
}
function yjClear() {
document.getElementById('yjInput').value = '';
document.getElementById('yjResult').style.display = 'none';
}