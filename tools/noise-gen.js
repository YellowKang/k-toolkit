window.renderNoiseGen = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">白噪音生成器</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px" id="ngTypes">
<button class="btn btn-secondary" onclick="ngSelect('white')" id="ngBtn-white">🌊 白噪音</button>
<button class="btn btn-secondary" onclick="ngSelect('pink')" id="ngBtn-pink">🌸 粉红噪音</button>
<button class="btn btn-secondary" onclick="ngSelect('brown')" id="ngBtn-brown">☕ 棕色噪音</button>
<button class="btn btn-secondary" onclick="ngSelect('rain')" id="ngBtn-rain">🌧️ 雨声</button>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
<span style="font-size:13px;color:var(--text-muted)">音量</span>
<input type="range" id="ngVol" min="0" max="1" step="0.01" value="0.5" oninput="ngSetVol()" style="flex:1">
<span id="ngVolLabel" style="font-size:13px;color:var(--text-muted);min-width:36px">50%</span>
</div>
<div class="tool-actions">
<button class="btn btn-primary" id="ngPlayBtn" onclick="ngToggle()">▶ 播放</button>
<button class="btn btn-secondary" onclick="ngStop()">⏹ 停止</button>
</div>
<div id="ngStatus" style="margin-top:10px;font-size:13px;color:var(--text-muted)">选择音效后点击播放</div>
</div>`;
window._ng = {ctx: null, source: null, gain: null, type: 'white', playing: false};
ngSelect('white');
};
function ngSelect(type) {
window._ng.type = type;
['white','pink','brown','rain'].forEach(t => {
const b = document.getElementById('ngBtn-'+t);
if (b) b.style.borderColor = t === type ? 'var(--accent)' : 'var(--glass-border)';
});
if (window._ng.playing) { ngStop(); ngPlay(); }
}
function ngSetVol() {
const vol = parseFloat(document.getElementById('ngVol').value);
document.getElementById('ngVolLabel').textContent = Math.round(vol*100)+'%';
if (window._ng.gain) window._ng.gain.gain.value = vol;
}
function ngPlay() {
const ng = window._ng;
ng.ctx = new (window.AudioContext || window.webkitAudioContext)();
ng.gain = ng.ctx.createGain();
ng.gain.gain.value = parseFloat(document.getElementById('ngVol').value);
ng.gain.connect(ng.ctx.destination);
const bufSize = ng.ctx.sampleRate * 2;
const buf = ng.ctx.createBuffer(1, bufSize, ng.ctx.sampleRate);
const data = buf.getChannelData(0);
if (ng.type === 'white' || ng.type === 'rain') {
for (let i=0;i<bufSize;i++) data[i] = (Math.random()*2-1) * (ng.type==='rain' ? 0.7 : 1);
} else if (ng.type === 'pink') {
let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
for (let i=0;i<bufSize;i++) {
const w=Math.random()*2-1;
b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;
b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;
b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;
data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)/5.5; b6=w*0.115926;
}
} else {
let last=0;
for (let i=0;i<bufSize;i++) { last=(last+(0.02*(Math.random()*2-1)))/1.02; data[i]=last*3.5; }
}
ng.source = ng.ctx.createBufferSource();
ng.source.buffer = buf;
ng.source.loop = true;
ng.source.connect(ng.gain);
ng.source.start();
ng.playing = true;
const btn = document.getElementById('ngPlayBtn');
const status = document.getElementById('ngStatus');
if (btn) btn.textContent = '⏸ 暂停';
if (status) status.textContent = '正在播放...';
}
function ngStop() {
const ng = window._ng;
if (ng.source) { try { ng.source.stop(); } catch {} ng.source = null; }
if (ng.ctx) { ng.ctx.close(); ng.ctx = null; }
ng.playing = false;
const btn = document.getElementById('ngPlayBtn');
const status = document.getElementById('ngStatus');
if (btn) btn.textContent = '▶ 播放';
if (status) status.textContent = '已停止';
}
function ngToggle() {
if (window._ng.playing) ngStop(); else ngPlay();
}
window._activeCleanup = function() { ngStop(); };