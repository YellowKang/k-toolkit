function renderMorse(el) {
const MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','-':'-....-','(':'-.--.',')':'-.--.-'};
const REV = Object.fromEntries(Object.entries(MAP).map(([k,v])=>[v,k]));
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:10px;margin-bottom:14px">
<button class="btn btn-primary" id="morseEncBtn" onclick="setMorseMode('enc')">文字 → 摩斯</button>
<button class="btn btn-secondary" id="morseDecBtn" onclick="setMorseMode('dec')">摩斯 → 文字</button>
</div>
<div class="panel-label" id="morseLabel">输入文本</div>
<textarea class="tool-textarea" id="morseInput" rows="5" placeholder="输入文本..."></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="doMorse()">转换</button>
<button class="btn btn-secondary" id="morsePlayBtn" onclick="playMorse()" style="display:none">▶ 播放音频</button>
<button class="btn btn-secondary" onclick="document.getElementById('morseInput').value='';document.getElementById('morseResult').style.display='none';document.getElementById('morsePlayBtn').style.display='none'">清空</button>
</div>
</div>
<div class="tool-card-panel" id="morseResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="morseStatus"></div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('morseOutput').textContent,this)">复制结果</button>
</div>
<pre class="result-box" id="morseOutput" style="white-space:pre-wrap;word-break:break-all;font-family:monospace;letter-spacing:2px"></pre>
</div>`;
window._morseMode = 'enc';
window._morseMap = MAP;
window._morseRev = REV;
window._morseAudioCtx = null;
}
function setMorseMode(mode) {
window._morseMode = mode;
document.getElementById('morseEncBtn').className = mode==='enc' ? 'btn btn-primary' : 'btn btn-secondary';
document.getElementById('morseDecBtn').className = mode==='dec' ? 'btn btn-primary' : 'btn btn-secondary';
document.getElementById('morseLabel').textContent = mode==='enc' ? '输入文本' : '输入摩斯码（用空格分隔字符，/ 分隔单词）';
document.getElementById('morseInput').placeholder = mode==='enc' ? '输入文本...' : '.- -... -.-. / . -...';
document.getElementById('morseResult').style.display = 'none';
document.getElementById('morsePlayBtn').style.display = 'none';
}
function doMorse() {
const v = document.getElementById('morseInput').value.trim();
if (!v) return;
let out;
if (window._morseMode === 'enc') {
out = v.toUpperCase().split('').map(c => c===' ' ? '/' : (window._morseMap[c] || '?')).join(' ');
} else {
out = v.split(' / ').map(word => word.split(' ').map(code => window._morseRev[code] || '?').join('')).join(' ');
}
document.getElementById('morseOutput').textContent = out;
document.getElementById('morseStatus').textContent = '✓ 转换完成';
document.getElementById('morseStatus').style.color = '#10b981';
document.getElementById('morseResult').style.display = '';
const playBtn = document.getElementById('morsePlayBtn');
if (playBtn) playBtn.style.display = window._morseMode === 'enc' ? '' : 'none';
window._morseCoded = out;
}
function playMorse() {
const code = window._morseCoded || '';
if (!code) return;
const ctx = new (window.AudioContext || window.webkitAudioContext)();
window._morseAudioCtx = ctx;
const dotDur = 0.08; 
let t = ctx.currentTime + 0.1;
function beep(dur) {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.connect(gain); gain.connect(ctx.destination);
osc.frequency.value = 600;
osc.type = 'sine';
gain.gain.setValueAtTime(0.4, t);
gain.gain.linearRampToValueAtTime(0.4, t + dur - 0.01);
gain.gain.linearRampToValueAtTime(0, t + dur + 0.01);
osc.start(t); osc.stop(t + dur + 0.02);
t += dur + dotDur;
}
const playBtn = document.getElementById('morsePlayBtn');
if (playBtn) { playBtn.disabled = true; playBtn.textContent = '⏸ 播放中...'; }
code.split('').forEach(ch => {
if (ch === '.') { beep(dotDur); }
else if (ch === '-') { beep(dotDur * 3); }
else if (ch === ' ') { t += dotDur * 2; }
else if (ch === '/') { t += dotDur * 5; }
});
setTimeout(() => {
if (playBtn) { playBtn.disabled = false; playBtn.textContent = '▶ 播放音频'; }
}, (t - ctx.currentTime) * 1000 + 200);
}
window._activeCleanup = function() {
if (window._morseAudioCtx) { try { window._morseAudioCtx.close(); } catch {} }
};