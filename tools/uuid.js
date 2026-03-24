function renderUUID(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
<div style="display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:13px">数量</span>
<input type="number" id="uuidCount" class="tool-input" value="5" min="1" max="100" style="width:80px">
</div>
<div style="display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:13px">格式</span>
<select id="uuidFormat" class="tool-input" style="width:auto">
<option value="standard">标准 (带横线)</option>
<option value="no-dash">无横线</option>
<option value="upper">大写</option>
<option value="braces">{} 包裹</option>
</select>
</div>
<button class="btn btn-primary" onclick="generateUUIDs()">生成</button>
<button class="btn btn-secondary" onclick="copyAllUUIDs()">复制全部</button>
</div>
</div>
<div class="tool-card-panel" id="uuidResultPanel" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0" id="uuidStatus"></div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary" onclick="copyAllUUIDs()">复制全部</button>
<button class="btn btn-secondary" onclick="uuidDownload()">下载</button>
</div>
</div>
<div id="uuidList"></div>
</div>`;
generateUUIDs();
}
function uuidv4() {
return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}
function applyUuidFormat(id) {
const fmt = document.getElementById('uuidFormat').value;
if (fmt === 'no-dash')  return id.replace(/-/g,'');
if (fmt === 'upper')    return id.toUpperCase();
if (fmt === 'braces')   return '{' + id.toUpperCase() + '}';
return id;
}
function generateUUIDs() {
const count = Math.min(100, Math.max(1, parseInt(document.getElementById('uuidCount').value) || 5));
const ids = Array.from({length: count}, () => applyUuidFormat(uuidv4()));
const list = document.getElementById('uuidList');
const panel = document.getElementById('uuidResultPanel');
list.innerHTML = ids.map(id => `
<div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
<span style="font-family:monospace;font-size:13px;flex:1;color:var(--neon);word-break:break-all">${id}</span>
<button class="copy-inline" onclick="copyText('${id}',this)">复制</button>
</div>`).join('');
list._ids = ids;
document.getElementById('uuidStatus').textContent = `✓ 已生成 ${count} 个 UUID`;
panel.style.display = '';
}
function copyAllUUIDs() {
const list = document.getElementById('uuidList');
const ids = list._ids;
if (!ids) return;
navigator.clipboard.writeText(ids.join('\n')).then(() =>
showToast('已复制 ' + ids.length + ' 个 UUID'));
}
function uuidDownload() {
const list = document.getElementById('uuidList');
const ids = list._ids;
if (!ids) return;
const a = document.createElement('a');
a.href = URL.createObjectURL(new Blob([ids.join('\n')], { type: 'text/plain' }));
a.download = 'uuids.txt';
a.click();
showToast('文件已下载');
}