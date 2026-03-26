const _spinnerDict = {
zh: {
title: '随机抽签 / 决策转盘',
options_label: '选项（每行一个）',
placeholder: '苹果\n香蕉\n橙子\n葡萄',
min_options: '请至少输入2个选项',
spin_btn: '开始抽签',
clear_btn: '清空结果',
result_title: '抽签结果',
history_title: '历史记录',
toast_result: '结果: ',
default_options: '去吃火锅\n去吃烧烤\n去吃寿司\n去吃披萨\n在家点外卖',
},
en: {
title: 'Random Picker / Spin Wheel',
options_label: 'Options (one per line)',
placeholder: 'Apple\nBanana\nOrange\nGrape',
min_options: 'Please enter at least 2 options',
spin_btn: 'Spin!',
clear_btn: 'Clear',
result_title: 'Result',
history_title: 'History',
toast_result: 'Result: ',
default_options: 'Hot Pot\nBBQ\nSushi\nPizza\nOrder Delivery',
},
};
function renderSpinner(el) {
const tl = makeToolI18n(_spinnerDict);
window._spinTl = tl;
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">${tl('title')}</div>
<div style="margin-bottom:14px">
<label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${tl('options_label')}</label>
<textarea class="tool-textarea" id="spinOptions" rows="5" placeholder="${tl('placeholder')}">${tl('default_options')}</textarea>
</div>
<div style="display:flex;justify-content:center;margin-bottom:14px;position:relative">
<canvas id="spinWheel" width="300" height="300" style="border-radius:50%"></canvas>
</div>
<div class="tool-actions">
<button class="btn btn-primary" onclick="_spinDoSpin()" id="spinBtn">${tl('spin_btn')}</button>
<button class="btn btn-secondary" onclick="_spinClear()">${tl('clear_btn')}</button>
</div>
</div>
<div class="tool-card-panel" id="spinResult" style="display:none;text-align:center">
<div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${tl('result_title')}</div>
<div id="spinOutput" style="font-size:28px;font-weight:800;color:var(--neon);padding:16px"></div>
</div>
<div class="tool-card-panel" id="spinHistoryPanel" style="display:none">
<div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${tl('history_title')}</div>
<div id="spinHistoryList" style="font-size:13px;color:var(--text-secondary)"></div>
</div>`;
window._spinHistory = [];
window._spinAngle = 0;
window._spinAnimating = false;
window._spinAnimId = null;
_spinDrawWheel(_spinGetOpts(), -1, 0);
document.getElementById('spinOptions').addEventListener('input', () => {
if (!window._spinAnimating) {
_spinDrawWheel(_spinGetOpts(), -1, window._spinAngle);
}
});
window._activeCleanup = function() {
if (window._spinAnimId) {
cancelAnimationFrame(window._spinAnimId);
window._spinAnimId = null;
window._spinAnimating = false;
}
};
}
function _spinEsc(s) {
return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _spinGetOpts() {
const el = document.getElementById('spinOptions');
if (!el) return [];
return el.value.split('\n').map(s => s.trim()).filter(Boolean);
}
function _spinDrawWheel(options, highlightIdx, currentAngle) {
const canvas = document.getElementById('spinWheel');
if (!canvas) return;
const ctx = canvas.getContext('2d');
const cx = 150, cy = 150, r = 130;
ctx.clearRect(0, 0, 300, 300);
const n = options.length;
if (n === 0) return;
if (n < 2) {
ctx.fillStyle = 'rgba(255,255,255,0.1)';
ctx.beginPath();
ctx.arc(cx, cy, r, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = 'rgba(255,255,255,0.4)';
ctx.font = '14px system-ui, sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
const tl = window._spinTl || ((k) => k);
ctx.fillText(tl('min_options'), cx, cy);
return;
}
const sliceAngle = (2 * Math.PI) / n;
for (let i = 0; i < n; i++) {
const startAngle = currentAngle + i * sliceAngle;
const endAngle = startAngle + sliceAngle;
ctx.beginPath();
ctx.moveTo(cx, cy);
ctx.arc(cx, cy, r, startAngle, endAngle);
ctx.closePath();
const hue = (i * 360 / n) % 360;
ctx.fillStyle = i === highlightIdx ? `hsl(${hue}, 80%, 65%)` : `hsl(${hue}, 70%, 50%)`;
ctx.fill();
ctx.strokeStyle = '#fff';
ctx.lineWidth = 2;
ctx.stroke();
ctx.save();
ctx.translate(cx, cy);
ctx.rotate(startAngle + sliceAngle / 2);
ctx.textAlign = 'right';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#fff';
ctx.font = 'bold 13px system-ui, sans-serif';
const label = options[i].length > 8 ? options[i].slice(0, 8) + '\u2026' : options[i];
ctx.fillText(label, r - 10, 0);
ctx.restore();
}
ctx.beginPath();
ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
ctx.fillStyle = '#fff';
ctx.fill();
ctx.strokeStyle = '#ddd';
ctx.lineWidth = 2;
ctx.stroke();
ctx.beginPath();
ctx.moveTo(cx - 10, 8);
ctx.lineTo(cx + 10, 8);
ctx.lineTo(cx, 25);
ctx.closePath();
ctx.fillStyle = '#ef4444';
ctx.fill();
}
function _spinDoSpin() {
const opts = _spinGetOpts();
const tl = window._spinTl || ((k) => k);
if (opts.length < 2) {
document.getElementById('spinResult').style.display = '';
document.getElementById('spinOutput').textContent = tl('min_options');
return;
}
if (window._spinAnimating) return;
const btn = document.getElementById('spinBtn');
btn.disabled = true;
window._spinAnimating = true;
let velocity = 0.3 + Math.random() * 0.2;
let angle = window._spinAngle;
function animate() {
angle += velocity;
velocity *= 0.985;
_spinDrawWheel(opts, -1, angle);
if (velocity < 0.001) {
window._spinAngle = angle;
window._spinAnimating = false;
window._spinAnimId = null;
btn.disabled = false;
const n = opts.length;
const sliceAngle = (2 * Math.PI) / n;
let normalizedAngle = angle % (2 * Math.PI);
if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
const pointerAngle = (3 * Math.PI / 2 - normalizedAngle + Math.PI * 4) % (2 * Math.PI);
const winnerIdx = Math.floor(pointerAngle / sliceAngle) % n;
_spinDrawWheel(opts, winnerIdx, angle);
const winner = opts[winnerIdx];
document.getElementById('spinResult').style.display = '';
document.getElementById('spinOutput').textContent = '\uD83C\uDF89 ' + winner;
window._spinHistory.unshift(winner);
if (window._spinHistory.length > 10) window._spinHistory.pop();
_spinRenderHistory();
if (typeof showToast === 'function') showToast(tl('toast_result') + winner, 'success');
} else {
window._spinAnimId = requestAnimationFrame(animate);
}
}
window._spinAnimId = requestAnimationFrame(animate);
}
function _spinRenderHistory() {
const panel = document.getElementById('spinHistoryPanel');
const list = document.getElementById('spinHistoryList');
if (!panel || !list) return;
if (window._spinHistory.length === 0) {
panel.style.display = 'none';
return;
}
panel.style.display = '';
list.innerHTML = window._spinHistory
.map((item, i) => `<div style="padding:4px 0;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:11px;min-width:20px">#${i + 1}</span>
<span>${_spinEsc(item)}</span>
</div>`)
.join('');
}
function _spinClear() {
document.getElementById('spinResult').style.display = 'none';
window._spinHistory = [];
_spinRenderHistory();
if (window._spinAnimId) {
cancelAnimationFrame(window._spinAnimId);
window._spinAnimId = null;
window._spinAnimating = false;
const btn = document.getElementById('spinBtn');
if (btn) btn.disabled = false;
}
window._spinAngle = 0;
_spinDrawWheel(_spinGetOpts(), -1, 0);
}