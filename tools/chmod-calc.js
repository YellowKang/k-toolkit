const _chmodI18n = {
zh: {
numeric_input: '输入权限数字 (如 755)',
owner: '所有者', group: '组', other: '其他',
read: '读', write: '写', execute: '执行',
numeric: '数字模式', symbolic: '符号模式', command: '命令',
presets: '常用预设',
copy: '复制',
invalid: '请输入有效的三位数字 (0-7)',
copied: '已复制',
},
en: {
numeric_input: 'Enter permission number (e.g. 755)',
owner: 'Owner', group: 'Group', other: 'Other',
read: 'Read', write: 'Write', execute: 'Execute',
numeric: 'Numeric', symbolic: 'Symbolic', command: 'Command',
presets: 'Common Presets',
copy: 'Copy',
invalid: 'Please enter a valid 3-digit number (0-7)',
copied: 'Copied',
},
};
function renderChmodCalc(el) {
const T = makeToolI18n(_chmodI18n);
const roles = ['owner', 'group', 'other'];
const perms = ['read', 'write', 'execute'];
const gridRows = roles.map((r, ri) =>
`<div style="display:contents">
<span style="color:var(--text-muted);font-size:13px;font-weight:600;text-align:right;padding-right:8px">${T(r)}</span>
${perms.map((p, pi) =>
`<label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
<input type="checkbox" id="chm_${ri}_${pi}" onchange="_chmodUpdate()" style="accent-color:var(--accent)"> ${T(p)}
</label>`
).join('')}
</div>`
).join('');
const presets = [755, 644, 600, 777, 400];
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">${T('numeric_input')}</div>
<input type="text" id="chmodNumIn" class="tool-input" maxlength="3" placeholder="755"
style="font-family:monospace;font-size:20px;text-align:center;letter-spacing:6px;max-width:160px"
oninput="_chmodFromNum(this.value)">
</div>
<div class="tool-card-panel">
<div style="display:grid;grid-template-columns:auto repeat(3,1fr);gap:10px 16px;align-items:center">
<span></span>${perms.map(p => `<span style="font-size:12px;color:var(--text-muted);font-weight:600;text-align:center">${T(p)}</span>`).join('')}
${gridRows}
</div>
</div>
<div class="tool-card-panel">
<div class="panel-label">${T('presets')}</div>
<div style="display:flex;gap:8px;flex-wrap:wrap">
${presets.map(p => `<button class="btn btn-secondary" onclick="_chmodPreset(${p})">${p}</button>`).join('')}
</div>
</div>
<div class="tool-card-panel" id="chmodResults">
${_chmodResultRow(T('numeric'), 'chmodResNum', T('copy'))}
${_chmodResultRow(T('symbolic'), 'chmodResSym', T('copy'))}
${_chmodResultRow(T('command'), 'chmodResCmd', T('copy'))}
</div>`;
_chmodPreset(755);
}
function _chmodResultRow(label, id, copyLabel) {
return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
<span style="color:var(--text-muted);font-size:12px;min-width:56px">${label}</span>
<span id="${id}" class="result-box" style="flex:1;font-family:monospace;font-size:14px;padding:8px 12px"></span>
<button class="btn btn-primary" style="padding:4px 12px;font-size:12px" onclick="_chmodCopy('${id}',this)">${copyLabel}</button>
</div>`;
}
function _chmodUpdate() {
let num = '', sym = '';
for (let r = 0; r < 3; r++) {
let v = 0;
for (let p = 0; p < 3; p++) {
if (document.getElementById(`chm_${r}_${p}`).checked) v += [4, 2, 1][p];
}
num += v;
sym += (v & 4 ? 'r' : '-') + (v & 2 ? 'w' : '-') + (v & 1 ? 'x' : '-');
}
document.getElementById('chmodNumIn').value = num;
_chmodDisplay(num, sym);
}
function _chmodFromNum(val) {
val = val.replace(/[^0-7]/g, '').slice(0, 3);
if (val.length !== 3) { _chmodDisplay('---', '---------'); return; }
const digits = val.split('').map(Number);
let sym = '';
digits.forEach((d, r) => {
[4, 2, 1].forEach((bit, p) => {
document.getElementById(`chm_${r}_${p}`).checked = !!(d & bit);
});
sym += (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-');
});
_chmodDisplay(val, sym);
}
function _chmodDisplay(num, sym) {
document.getElementById('chmodResNum').textContent = num;
document.getElementById('chmodResSym').textContent = sym;
document.getElementById('chmodResCmd').textContent = `chmod ${num} filename`;
}
function _chmodPreset(n) {
const s = String(n).padStart(3, '0');
document.getElementById('chmodNumIn').value = s;
_chmodFromNum(s);
}
function _chmodCopy(id, btn) {
copyText(document.getElementById(id).textContent, btn);
}