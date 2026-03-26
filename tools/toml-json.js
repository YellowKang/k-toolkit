window.renderTomlJson = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:0;margin-bottom:12px;border-bottom:2px solid #e5e7eb">
<button id="tjTab1" onclick="tjSwitchTab(1)" style="padding:8px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;color:#4f46e5;border-bottom:2px solid #4f46e5;margin-bottom:-2px">TOML → JSON</button>
<button id="tjTab2" onclick="tjSwitchTab(2)" style="padding:8px 20px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280">JSON → TOML</button>
</div>
<div id="tjPane1">
<div class="panel-label">TOML 输入</div>
<textarea class="tool-textarea" id="tjTomlIn" rows="10" placeholder="[server]\nhost = \"localhost\"\nport = 8080\nenabled = true\ntags = [\"web\", \"api\"]"></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="tjTomlToJson()">转换为 JSON</button>
<button class="btn btn-secondary" onclick="tjClear1()">清空</button>
</div>
</div>
<div id="tjPane2" style="display:none">
<div class="panel-label">JSON 输入</div>
<textarea class="tool-textarea" id="tjJsonIn" rows="10" placeholder='{"server":{"host":"localhost","port":8080}}'></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="tjJsonToToml()">转换为 TOML</button>
<button class="btn btn-secondary" onclick="tjClear2()">清空</button>
</div>
</div>
</div>
<div class="tool-card-panel" id="tjResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="tjStatus"></div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('tjOutput').textContent,this)">复制</button>
</div>
<pre class="result-box" id="tjOutput" style="max-height:400px;overflow-y:auto"></pre>
</div>`;
};
function tjSwitchTab(n) {
document.getElementById('tjPane1').style.display = n===1 ? '' : 'none';
document.getElementById('tjPane2').style.display = n===2 ? '' : 'none';
document.getElementById('tjTab1').style.cssText = n===1
? 'padding:8px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;color:#4f46e5;border-bottom:2px solid #4f46e5;margin-bottom:-2px'
: 'padding:8px 20px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280';
document.getElementById('tjTab2').style.cssText = n===2
? 'padding:8px 20px;border:none;background:none;cursor:pointer;font-size:14px;font-weight:600;color:#4f46e5;border-bottom:2px solid #4f46e5;margin-bottom:-2px'
: 'padding:8px 20px;border:none;background:none;cursor:pointer;font-size:14px;color:#6b7280';
document.getElementById('tjResult').style.display = 'none';
}
function tjShowResult(text, ok, label) {
var out = document.getElementById('tjOutput');
var status = document.getElementById('tjStatus');
out.textContent = text;
status.textContent = ok ? '✓ ' + label : '✗ ' + label;
status.style.color = ok ? '#10b981' : '#e74c3c';
document.getElementById('tjResult').style.display = '';
}
function tjTomlToJson() {
var src = document.getElementById('tjTomlIn').value.trim();
if (!src) return;
try {
var obj = tjParseToml(src);
tjShowResult(JSON.stringify(obj, null, 2), true, '转换成功');
} catch(e) {
tjShowResult('错误: ' + e.message, false, '解析失败');
}
}
function tjJsonToToml() {
var src = document.getElementById('tjJsonIn').value.trim();
if (!src) return;
try {
var obj = JSON.parse(src);
tjShowResult(tjObjToToml(obj, ''), true, '转换成功');
} catch(e) {
tjShowResult('错误: ' + e.message, false, 'JSON 格式错误');
}
}
function tjClear1() {
document.getElementById('tjTomlIn').value = '';
document.getElementById('tjResult').style.display = 'none';
}
function tjClear2() {
document.getElementById('tjJsonIn').value = '';
document.getElementById('tjResult').style.display = 'none';
}
function tjParseToml(src) {
var lines = src.split('\n');
var root = {};
var current = root;
var currentPath = [];
function getOrCreate(obj, keys) {
var o = obj;
for (var i = 0; i < keys.length; i++) {
if (!(keys[i] in o)) o[keys[i]] = {};
o = o[keys[i]];
}
return o;
}
function parseVal(v) {
v = v.trim();
if ((v[0] === '"' && v[v.length-1] === '"') || (v[0] === "'" && v[v.length-1] === "'")) {
return v.slice(1, -1);
}
if (v[0] === '[') {
var inner = v.slice(1, v.lastIndexOf(']')).trim();
if (!inner) return [];
return inner.split(',').map(function(x){ return parseVal(x.trim()); });
}
if (v === 'true') return true;
if (v === 'false') return false;
if (!isNaN(v) && v !== '') return Number(v);
return v;
}
var arrTableCounts = {};
for (var i = 0; i < lines.length; i++) {
var line = lines[i].trim();
if (!line || line[0] === '#') continue;
var commentIdx = -1;
var inStr = false, strChar = '';
for (var ci = 0; ci < line.length; ci++) {
if (!inStr && (line[ci] === '"' || line[ci] === "'")) { inStr = true; strChar = line[ci]; }
else if (inStr && line[ci] === strChar) { inStr = false; }
else if (!inStr && line[ci] === '#') { commentIdx = ci; break; }
}
if (commentIdx > 0) line = line.slice(0, commentIdx).trim();
if (line.slice(0, 2) === '[[' && line.slice(-2) === ']]') {
var path = line.slice(2, -2).trim().split('.');
var parentPath = path.slice(0, -1);
var lastKey = path[path.length - 1];
var parent = getOrCreate(root, parentPath);
if (!Array.isArray(parent[lastKey])) parent[lastKey] = [];
var newItem = {};
parent[lastKey].push(newItem);
currentPath = path;
current = newItem;
var pathKey = path.join('.');
arrTableCounts[pathKey] = (arrTableCounts[pathKey] || 0) + 1;
continue;
}
if (line[0] === '[' && line[line.length-1] === ']') {
var path = line.slice(1, -1).trim().split('.');
currentPath = path;
current = getOrCreate(root, path);
continue;
}
var eqIdx = line.indexOf('=');
if (eqIdx < 1) continue;
var key = line.slice(0, eqIdx).trim().replace(/^["']|["']$/g, '');
var val = line.slice(eqIdx + 1).trim();
current[key] = parseVal(val);
}
return root;
}
// ---- TOML serializer ----
function tjObjToToml(obj, prefix) {
var scalars = [];
var tables = [];
var arrTables = [];
Object.keys(obj).forEach(function(k) {
var v = obj[k];
if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && v[0] !== null) {
arrTables.push(k);
} else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
tables.push(k);
} else {
scalars.push(k);
}
});
var lines = [];
scalars.forEach(function(k) {
lines.push(k + ' = ' + tjTomlVal(obj[k]));
});
tables.forEach(function(k) {
var heading = prefix ? prefix + '.' + k : k;
lines.push('');
lines.push('[' + heading + ']');
lines.push(tjObjToToml(obj[k], heading));
});
arrTables.forEach(function(k) {
var heading = prefix ? prefix + '.' + k : k;
obj[k].forEach(function(item) {
lines.push('');
lines.push('[[' + heading + ']]');
lines.push(tjObjToToml(item, heading));
});
});
return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
function tjTomlVal(v) {
if (typeof v === 'string') return '"' + v.replace(/"/g, '\\"') + '"';
if (typeof v === 'boolean') return v ? 'true' : 'false';
if (Array.isArray(v)) return '[' + v.map(tjTomlVal).join(', ') + ']';
return String(v);
}