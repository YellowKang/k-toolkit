function renderCalculator(el) {
el.innerHTML = `
<div class="tool-card-panel" style="max-width:360px;margin:0 auto">
<div id="calcDisplay" style="background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:12px;padding:16px 20px;margin-bottom:16px;text-align:right">
<div id="calcExpr" style="font-size:13px;color:var(--text-muted);min-height:20px;word-break:break-all"></div>
<div id="calcVal" style="font-size:32px;font-weight:700;color:var(--neon,#a78bfa);margin-top:4px;word-break:break-all">0</div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="calcBtns"></div>
</div>`;
const buttons = [
['C','±','%','÷'],
['7','8','9','×'],
['4','5','6','−'],
['1','2','3','+'],
['0','.','⌫','='],
];
let expr = '', val = '0', lastResult = null, newNum = true;
function updateDisplay() {
document.getElementById('calcExpr').textContent = expr;
document.getElementById('calcVal').textContent = val;
}
function press(k) {
if (k === 'C') { expr = ''; val = '0'; newNum = true; lastResult = null; }
else if (k === '⌫') {
if (!newNum && val.length > 1) val = val.slice(0,-1);
else { val = '0'; newNum = true; }
}
else if (k === '±') { val = val.startsWith('-') ? val.slice(1) : (val==='0'?'0':'-'+val); }
else if (k === '%') { try { val = String(parseFloat(val)/100); } catch{} }
else if ('÷×−+'.includes(k)) {
const op = {'÷':'/','×':'*','−':'-','+':'+'}[k];
expr = (lastResult!==null && newNum ? lastResult : (expr||val)) + ' ' + k + ' ';
lastResult = null; newNum = true;
}
else if (k === '=') {
if (!expr) return;
const full = expr + val;
try {
const safe = full.replace(/÷/g,'/').replace(/×/g,'*').replace(/−/g,'-');
const r = Function('"use strict";return (' + safe + ')')();
lastResult = String(isFinite(r) ? (Math.round(r*1e10)/1e10) : 'Error');
val = lastResult;
expr = full + ' =';
newNum = true;
} catch { val = 'Error'; expr = ''; newNum = true; }
}
else {
if (newNum) { val = (k === '.' ? '0.' : k); newNum = false; }
else {
if (k === '.' && val.includes('.')) return;
val = val === '0' && k !== '.' ? k : val + k;
}
}
updateDisplay();
}
const grid = document.getElementById('calcBtns');
buttons.forEach(row => {
row.forEach(k => {
const btn = document.createElement('button');
btn.textContent = k;
const isOp = '÷×−+'.includes(k);
const isEq = k === '=';
const isC  = k === 'C';
btn.style.cssText = `padding:18px 8px;font-size:18px;border-radius:10px;border:1px solid var(--glass-border);cursor:pointer;transition:all 0.15s;font-weight:${isEq?700:400};background:${isEq?'var(--accent,#7c3aed)':isOp?'rgba(124,58,237,0.15)':isC?'rgba(239,68,68,0.15)':'rgba(255,255,255,0.05)'};color:${isEq?'#fff':isOp?'var(--accent,#a78bfa)':isC?'#ef4444':'var(--text-main,#e2e8f0)'}`;
if (k === '0') btn.style.gridColumn = 'span 1';
btn.onmouseenter = () => btn.style.opacity = '0.8';
btn.onmouseleave = () => btn.style.opacity = '1';
btn.onclick = () => press(k);
grid.appendChild(btn);
});
});
document.addEventListener('keydown', _calcKey);
window._activeCleanup = () => document.removeEventListener('keydown', _calcKey);
function _calcKey(e) {
const map = {'Enter':'=','Backspace':'⌫','Escape':'C','*':'×','/':'÷','-':'−'};
const k = map[e.key] || e.key;
if ('0123456789.C⌫=÷×−+%'.includes(k)) { e.preventDefault(); press(k); }
}
}