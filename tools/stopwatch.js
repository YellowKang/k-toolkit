window.renderStopwatch = function(el) {
el.innerHTML = `
<div class="tool-card-panel" style="text-align:center">
<div class="panel-label">秒表</div>
<div id="swDisplay" style="font-size:52px;font-weight:800;color:var(--neon);font-variant-numeric:tabular-nums;letter-spacing:.04em;margin:18px 0">00:00.000</div>
<div class="tool-actions" style="justify-content:center">
<button class="btn btn-primary"  id="swBtnStart" onclick="_swToggle()">开始</button>
<button class="btn btn-secondary" onclick="_swLap()" id="swBtnLap" disabled>计次</button>
<button class="btn btn-secondary" onclick="_swReset()">重置</button>
</div>
</div>
<div class="tool-card-panel" id="swLapPanel" style="display:none">
<div class="panel-label">计次记录</div>
<div id="swLapList" style="max-height:260px;overflow-y:auto"></div>
</div>`;
let timer = null;
let elapsed = 0;
let startAt = 0;
let running = false;
let laps = [];
function _swFmt(ms) {
const m = Math.floor(ms / 60000);
const s = Math.floor((ms % 60000) / 1000);
const cs = ms % 1000;
return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + '.' + String(cs).padStart(3,'0');
}
window._swToggle = function() {
if (!running) {
startAt = Date.now() - elapsed;
timer = setInterval(() => {
elapsed = Date.now() - startAt;
document.getElementById('swDisplay').textContent = _swFmt(elapsed);
}, 10);
running = true;
document.getElementById('swBtnStart').textContent = '暂停';
document.getElementById('swBtnStart').className = 'btn btn-secondary';
document.getElementById('swBtnLap').disabled = false;
window._activeCleanup = () => clearInterval(timer);
} else {
clearInterval(timer); timer = null;
running = false;
document.getElementById('swBtnStart').textContent = '继续';
document.getElementById('swBtnStart').className = 'btn btn-primary';
}
};
window._swLap = function() {
if (!running) return;
const lapTime = elapsed;
const prev = laps.length ? laps[laps.length-1].abs : 0;
laps.push({ abs: lapTime, split: lapTime - prev });
const panel = document.getElementById('swLapPanel');
panel.style.display = '';
document.getElementById('swLapList').innerHTML = laps.slice().reverse().map((l,i) => {
const n = laps.length - i;
return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--glass-border);font-variant-numeric:tabular-nums">
<span style="color:var(--text-muted);font-size:12px">Lap ${n}</span>
<span style="font-size:13px;color:var(--text-muted)">${_swFmt(l.split)}</span>
<span style="font-size:14px;font-weight:700;color:var(--neon)">${_swFmt(l.abs)}</span>
</div>`;
}).join('');
};
window._swReset = function() {
clearInterval(timer); timer = null;
running = false; elapsed = 0; laps = [];
document.getElementById('swDisplay').textContent = '00:00.000';
document.getElementById('swBtnStart').textContent = '开始';
document.getElementById('swBtnStart').className = 'btn btn-primary';
document.getElementById('swBtnLap').disabled = true;
document.getElementById('swLapPanel').style.display = 'none';
document.getElementById('swLapList').innerHTML = '';
};
window._activeCleanup = () => clearInterval(timer);
};