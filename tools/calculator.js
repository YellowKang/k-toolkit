const _calcI18nDict = {
zh: {
scientific:     '科学',
basic:          '基础',
deg:            'DEG',
rad:            'RAD',
history:        '历史记录',
history_empty:  '暂无记录',
clear_history:  '清空',
error:          '错误',
},
en: {
scientific:     'SCI',
basic:          'BASIC',
deg:            'DEG',
rad:            'RAD',
history:        'History',
history_empty:  'No history yet',
clear_history:  'Clear',
error:          'Error',
},
};
function renderCalculator(el) {
const tl = (typeof makeToolI18n === 'function') ? makeToolI18n(_calcI18nDict) : (k) => _calcI18nDict.zh[k] || k;
el.innerHTML = `
<div class="tool-card-panel" style="max-width:380px;margin:0 auto">
<div style="display:flex;justify-content:flex-end;margin-bottom:8px;gap:6px">
<button id="calcSciToggle" style="padding:4px 14px;font-size:12px;border-radius:8px;border:1px solid var(--glass-border);cursor:pointer;transition:all 0.2s;background:rgba(255,255,255,0.05);color:var(--text-muted)"></button>
</div>
<div id="calcDisplay" style="background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:12px;padding:16px 20px;margin-bottom:16px;text-align:right">
<div id="calcExpr" style="font-size:13px;color:var(--text-muted);min-height:20px;word-break:break-all"></div>
<div id="calcVal" style="font-size:32px;font-weight:700;color:var(--neon,#a78bfa);margin-top:4px;word-break:break-all">0</div>
</div>
<div id="calcSciRows" style="display:none;margin-bottom:8px">
<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:6px" id="calcSciRow1"></div>
<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px" id="calcSciRow2"></div>
</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px" id="calcBtns"></div>
<div id="calcHistorySection" style="margin-top:16px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<span id="calcHistLabel" style="font-size:12px;color:var(--text-muted)"></span>
<button id="calcHistClear" style="font-size:11px;padding:2px 8px;border-radius:6px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.05);color:var(--text-muted);cursor:pointer;display:none"></button>
</div>
<div id="calcHistList" style="max-height:160px;overflow-y:auto"></div>
</div>
</div>`;
let sciMode = false;
let degMode = true; 
let expr = '', val = '0', lastResult = null, newNum = true;
const history = []; 
const buttons = [
['C','±','%','÷'],
['7','8','9','×'],
['4','5','6','−'],
['1','2','3','+'],
['0','.','⌫','='],
];
const sciRow1 = ['sin','cos','tan','log','ln','√'];
const sciRow2 = ['x^y','π','e','(',')', 'DEG'];
function updateDisplay() {
document.getElementById('calcExpr').textContent = expr;
document.getElementById('calcVal').textContent = val;
}
function addHistory(exprStr, result) {
history.unshift({ expr: exprStr, result });
if (history.length > 10) history.pop();
renderHistory();
}
function renderHistory() {
const list = document.getElementById('calcHistList');
const clearBtn = document.getElementById('calcHistClear');
const label = document.getElementById('calcHistLabel');
label.textContent = tl('history');
clearBtn.textContent = tl('clear_history');
if (history.length === 0) {
list.innerHTML = `<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px 0">${tl('history_empty')}</div>`;
clearBtn.style.display = 'none';
return;
}
clearBtn.style.display = '';
list.innerHTML = history.map((h, i) => `
<div class="calc-hist-item" data-idx="${i}" style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;margin-bottom:4px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);cursor:pointer;transition:background 0.15s;font-size:13px">
<span style="color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60%">${h.expr}</span>
<span style="color:var(--neon,#a78bfa);font-weight:600">${h.result}</span>
</div>`).join('');
list.querySelectorAll('.calc-hist-item').forEach(item => {
item.onmouseenter = () => item.style.background = 'rgba(124,58,237,0.1)';
item.onmouseleave = () => item.style.background = 'rgba(255,255,255,0.03)';
item.onclick = () => {
const h = history[+item.dataset.idx];
val = h.result;
expr = '';
lastResult = h.result;
newNum = true;
updateDisplay();
};
});
}
function updateSciToggle() {
const btn = document.getElementById('calcSciToggle');
const rows = document.getElementById('calcSciRows');
btn.textContent = sciMode ? tl('basic') : tl('scientific');
btn.style.background = sciMode ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)';
btn.style.color = sciMode ? 'var(--accent,#a78bfa)' : 'var(--text-muted)';
rows.style.display = sciMode ? 'block' : 'none';
}
document.getElementById('calcSciToggle').onclick = () => {
sciMode = !sciMode;
updateSciToggle();
};
function press(k) {
const sciFns = {
'sin': 'sin(', 'cos': 'cos(', 'tan': 'tan(',
'log': 'log10(', 'ln': 'ln(', '√': 'sqrt(',
};
if (k === 'C') {
expr = ''; val = '0'; newNum = true; lastResult = null;
}
else if (k === '⌫') {
if (!newNum && val.length > 1) val = val.slice(0,-1);
else { val = '0'; newNum = true; }
}
else if (k === '±') {
val = val.startsWith('-') ? val.slice(1) : (val==='0'?'0':'-'+val);
}
else if (k === '%') {
try { val = String(parseFloat(val)/100); } catch{}
}
else if (k === 'DEG') {
degMode = !degMode;
const degBtn = document.querySelector('[data-calc-key="DEG"]');
if (degBtn) degBtn.textContent = degMode ? tl('deg') : tl('rad');
return; 
}
else if (k === 'π') {
if (newNum) { val = String(Math.PI); newNum = false; }
else { val = String(Math.PI); }
}
else if (k === 'e') {
if (newNum) { val = String(Math.E); newNum = false; }
else { val = String(Math.E); }
}
else if (k === 'x^y') {
expr = (lastResult!==null && newNum ? lastResult : (expr||val)) + ' ^ ';
lastResult = null; newNum = true;
}
else if (k in sciFns) {
expr = (lastResult!==null && newNum ? lastResult : (expr||'')) + sciFns[k];
val = '0'; newNum = true; lastResult = null;
}
else if (k === '(') {
expr = (newNum && !expr ? '' : (lastResult!==null && newNum ? lastResult : expr)) + '(';
val = '0'; newNum = true; lastResult = null;
}
else if (k === ')') {
expr = (expr || '') + val + ')';
val = '0'; newNum = true; lastResult = null;
}
else if ('÷×−+'.includes(k)) {
expr = (lastResult!==null && newNum ? lastResult : (expr||val)) + ' ' + k + ' ';
lastResult = null; newNum = true;
}
else if (k === '=') {
if (!expr) return;
const full = expr + val;
try {
let safe = full
.replace(/÷/g,'/')
.replace(/×/g,'*')
.replace(/−/g,'-')
.replace(/\^/g,'**');
if (degMode) {
safe = safe.replace(/sin\(/g, 'Math.sin((Math.PI/180)*(');
safe = safe.replace(/cos\(/g, 'Math.cos((Math.PI/180)*(');
safe = safe.replace(/tan\(/g, 'Math.tan((Math.PI/180)*(');
safe = _closeDegParens(safe);
} else {
safe = safe.replace(/sin\(/g, 'Math.sin(');
safe = safe.replace(/cos\(/g, 'Math.cos(');
safe = safe.replace(/tan\(/g, 'Math.tan(');
}
safe = safe.replace(/log10\(/g, 'Math.log10(');
safe = safe.replace(/ln\(/g, 'Math.log(');
safe = safe.replace(/sqrt\(/g, 'Math.sqrt(');
const r = Function('"use strict";return (' + safe + ')')();
lastResult = String(isFinite(r) ? (Math.round(r*1e10)/1e10) : tl('error'));
val = lastResult;
const displayExpr = full + ' =';
addHistory(full, val);
expr = displayExpr;
newNum = true;
} catch {
val = tl('error');
expr = '';
newNum = true;
}
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
function _closeDegParens(s) {
const result = [];
let i = 0;
while (i < s.length) {
const trigMatch = s.slice(i).match(/^Math\.(sin|cos|tan)\(\(Math\.PI\/180\)\*\(/);
if (trigMatch) {
const prefix = trigMatch[0];
result.push(prefix);
i += prefix.length;
let depth = 1;
while (i < s.length && depth > 0) {
if (s[i] === '(') depth++;
if (s[i] === ')') depth--;
if (depth > 0) result.push(s[i]);
i++;
}
result.push('))'); 
} else {
result.push(s[i]);
i++;
}
}
return result.join('');
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
function renderSciBtn(container, keys) {
const el = document.getElementById(container);
keys.forEach(k => {
const btn = document.createElement('button');
const displayKey = k === 'DEG' ? (degMode ? tl('deg') : tl('rad')) : k;
btn.textContent = displayKey;
if (k === 'DEG') btn.setAttribute('data-calc-key', 'DEG');
const isFn = ['sin','cos','tan','log','ln','√','x^y'].includes(k);
const isConst = ['π','e'].includes(k);
const isParen = ['(',')'].includes(k);
const isDeg = k === 'DEG';
btn.style.cssText = `padding:10px 4px;font-size:13px;border-radius:8px;border:1px solid var(--glass-border);cursor:pointer;transition:all 0.15s;background:${isDeg?'rgba(59,130,246,0.15)':isFn?'rgba(124,58,237,0.1)':isConst?'rgba(234,179,8,0.12)':isParen?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.05)'};color:${isDeg?'#60a5fa':isFn?'var(--accent,#a78bfa)':isConst?'#facc15':'var(--text-main,#e2e8f0)'}`;
btn.onmouseenter = () => btn.style.opacity = '0.8';
btn.onmouseleave = () => btn.style.opacity = '1';
btn.onclick = () => press(k);
el.appendChild(btn);
});
}
renderSciBtn('calcSciRow1', sciRow1);
renderSciBtn('calcSciRow2', sciRow2);
document.getElementById('calcHistClear').onclick = () => {
history.length = 0;
renderHistory();
};
function _calcKey(e) {
const map = {'Enter':'=','Backspace':'⌫','Escape':'C','*':'×','/':'÷','-':'−'};
const k = map[e.key] || e.key;
if ('0123456789.C⌫=÷×−+%()'.includes(k)) { e.preventDefault(); press(k); }
}
document.addEventListener('keydown', _calcKey);
window._activeCleanup = () => document.removeEventListener('keydown', _calcKey);
updateSciToggle();
renderHistory();
}