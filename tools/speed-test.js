window.renderSpeedTest = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="text-align:center;padding:24px 0 16px">
<div id="stGauge" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:180px;height:180px">
<svg width="180" height="180" style="position:absolute;top:0;left:0">
<circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14"/>
<circle id="stArc" cx="90" cy="90" r="78" fill="none"
stroke="url(#stGrad)" stroke-width="14" stroke-linecap="round"
stroke-dasharray="490" stroke-dashoffset="490"
transform="rotate(-90 90 90)" style="transition:stroke-dashoffset 0.4s ease"/>
<defs>
<linearGradient id="stGrad" x1="0%" y1="0%" x2="100%" y2="0%">
<stop offset="0%" stop-color="var(--accent)"/>
<stop offset="100%" stop-color="var(--accent-blue)"/>
</linearGradient>
</defs>
</svg>
<div style="text-align:center;z-index:1">
<div id="stVal" style="font-size:36px;font-weight:700;color:var(--text);line-height:1">--</div>
<div id="stUnit" style="font-size:13px;color:var(--text-muted);margin-top:4px">Mbps</div>
<div id="stLabel" style="font-size:11px;color:var(--text-muted);margin-top:2px">下载速度</div>
</div>
</div>
</div>
<div style="display:flex;justify-content:center;gap:32px;margin-bottom:20px">
<div style="text-align:center">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">延迟</div>
<div id="stPing" style="font-size:20px;font-weight:700;color:var(--text)">--</div>
<div style="font-size:11px;color:var(--text-muted)">ms</div>
</div>
<div style="text-align:center">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">下载</div>
<div id="stDl" style="font-size:20px;font-weight:700;color:#10b981">--</div>
<div style="font-size:11px;color:var(--text-muted)">Mbps</div>
</div>
<div style="text-align:center">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">上传</div>
<div id="stUl" style="font-size:20px;font-weight:700;color:var(--accent)">--</div>
<div style="font-size:11px;color:var(--text-muted)">Mbps</div>
</div>
</div>
<div style="text-align:center;margin-bottom:16px">
<div id="stStatus" style="font-size:12px;color:var(--text-muted);min-height:18px"></div>
</div>
<div style="display:flex;justify-content:center;gap:10px">
<button class="btn btn-primary" id="stStartBtn" onclick="stStart()">开始测速</button>
<button class="btn btn-secondary" id="stStopBtn" onclick="stStop()" style="display:none">停止</button>
</div>
</div>`;
};
let _stRunning = false, _stAbort = null;
function stStart() {
if (_stRunning) return;
_stRunning = true;
const startBtn = document.getElementById('stStartBtn');
const stopBtn = document.getElementById('stStopBtn');
if (startBtn) startBtn.style.display = 'none';
if (stopBtn) stopBtn.style.display = '';
_stReset();
_stRunSeq();
}
function stStop() {
_stRunning = false;
if (_stAbort) { _stAbort.abort(); _stAbort = null; }
const startBtn = document.getElementById('stStartBtn');
const stopBtn = document.getElementById('stStopBtn');
if (startBtn) startBtn.style.display = '';
if (stopBtn) stopBtn.style.display = 'none';
_stStatus('');
}
function _stReset() {
['stPing','stDl','stUl'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent='--'; });
_stSetGauge(0, '--', 'Mbps', '下载速度');
}
async function _stRunSeq() {
_stStatus('正在测试延迟...');
const ping = await _stMeasurePing();
if (!_stRunning) return;
const pe = document.getElementById('stPing');
if (pe) pe.textContent = ping < 0 ? '超时' : ping;
_stStatus('正在测试下载速度...');
_stSetGauge(0, '0', 'Mbps', '下载速度');
const dl = await _stMeasureDownload();
if (!_stRunning) return;
if (dl < 0) {
_stStatus('网络不可达，请检查连接');
_stSetGauge(0, '--', 'Mbps', '下载速度');
const sb = document.getElementById('stStartBtn');
const tb = document.getElementById('stStopBtn');
if (sb) sb.style.display = '';
if (tb) tb.style.display = 'none';
_stRunning = false;
return;
}
const de = document.getElementById('stDl');
if (de) de.textContent = dl.toFixed(1);
_stSetGauge(Math.min(dl / 100, 1), dl.toFixed(1), 'Mbps', '下载速度');
_stStatus('正在测试上传速度...');
_stSetGauge(0, '0', 'Mbps', '上传速度');
const ul = await _stMeasureUpload();
if (!_stRunning) return;
const ue = document.getElementById('stUl');
if (ue) ue.textContent = ul < 0 ? '--' : ul.toFixed(1);
if (ul >= 0) _stSetGauge(Math.min(ul / 100, 1), ul.toFixed(1), 'Mbps', '上传速度');
_stStatus('测速完成');
const sb2 = document.getElementById('stStartBtn');
const tb2 = document.getElementById('stStopBtn');
if (sb2) sb2.style.display = '';
if (tb2) tb2.style.display = 'none';
_stRunning = false;
}
async function _stMeasurePing() {
const endpoints = [
'https:
'https:
];
const samples = [];
for (let i = 0; i < 4; i++) {
if (!_stRunning) return -1;
const url = endpoints[i % endpoints.length];
try {
const ac = new AbortController();
const timer = setTimeout(() => ac.abort(), 3000);
const t = Date.now();
await fetch(url, { cache: 'no-store', mode: 'no-cors', signal: ac.signal });
clearTimeout(timer);
samples.push(Date.now() - t);
} catch {  }
await _stSleep(200);
}
return samples.length ? Math.round(samples.reduce((a,b)=>a+b,0)/samples.length) : -1;
}
async function _stMeasureDownload() {
const sizes = [1e6, 5e6]; 
let totalBits = 0, totalMs = 0;
for (const size of sizes) {
if (!_stRunning) break;
_stAbort = new AbortController();
const url = `https:
const timer = setTimeout(() => _stAbort && _stAbort.abort(), 5000);
try {
const t = Date.now();
const res = await fetch(url, { signal: _stAbort.signal, cache: 'no-store' });
await res.arrayBuffer();
clearTimeout(timer);
const ms = Date.now() - t;
totalBits += size * 8;
totalMs += ms;
const cur = (totalBits / totalMs / 1000).toFixed(1);
_stSetGauge(Math.min(+cur / 100, 1), cur, 'Mbps', '下载速度');
} catch (err) {
clearTimeout(timer);
if (totalBits === 0) { _stAbort = null; return -1; }
break;
}
}
_stAbort = null;
return totalMs > 0 ? totalBits / totalMs / 1000 : 0;
}
async function _stMeasureUpload() {
const sizes = [500e3, 2e6]; 
let totalBits = 0, totalMs = 0;
for (const size of sizes) {
if (!_stRunning) break;
_stAbort = new AbortController();
const url = `https:
const body = new Uint8Array(size);
const timer = setTimeout(() => _stAbort && _stAbort.abort(), 5000);
try {
const t = Date.now();
await fetch(url, { method: 'POST', body, signal: _stAbort.signal, cache: 'no-store' });
clearTimeout(timer);
const ms = Date.now() - t;
totalBits += size * 8;
totalMs += ms;
const cur = (totalBits / totalMs / 1000).toFixed(1);
_stSetGauge(Math.min(+cur / 100, 1), cur, 'Mbps', '上传速度');
} catch (err) {
clearTimeout(timer);
if (totalBits === 0) { _stAbort = null; return -1; }
break;
}
}
_stAbort = null;
return totalMs > 0 ? totalBits / totalMs / 1000 : 0;
}
function _stSetGauge(ratio, val, unit, label) {
const arc = document.getElementById('stArc');
const ve = document.getElementById('stVal');
const ue = document.getElementById('stUnit');
const le = document.getElementById('stLabel');
if (arc) arc.style.strokeDashoffset = 490 - 490 * Math.max(0, Math.min(1, ratio));
if (ve) ve.textContent = val;
if (ue) ue.textContent = unit;
if (le) le.textContent = label;
}
function _stStatus(msg) {
const el = document.getElementById('stStatus');
if (el) el.textContent = msg;
}
function _stSleep(ms) { return new Promise(r => setTimeout(r, ms)); }
window._activeCleanup = function() { stStop(); };