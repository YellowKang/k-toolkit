function renderNumberBase(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">输入数值</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px" id="baseGrid">
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">十进制 (DEC)</div>
<input class="tool-input" id="nbDec" placeholder="255" oninput="nbConvert('dec',this.value)">
</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">十六进制 (HEX)</div>
<input class="tool-input" id="nbHex" placeholder="FF" oninput="nbConvert('hex',this.value)">
</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">八进制 (OCT)</div>
<input class="tool-input" id="nbOct" placeholder="377" oninput="nbConvert('oct',this.value)">
</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">二进制 (BIN)</div>
<input class="tool-input" id="nbBin" placeholder="11111111" oninput="nbConvert('bin',this.value)">
</div>
</div>
</div>
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:10px">ASCII / Unicode</div>
<div style="display:flex;gap:10px;flex-wrap:wrap">
<div style="flex:1;min-width:140px">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">字符</div>
<input class="tool-input" id="nbChar" placeholder="A" maxlength="2" oninput="nbCharConvert(this.value)">
</div>
<div style="flex:1;min-width:140px">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">码点 (十进制)</div>
<input class="tool-input" id="nbCode" placeholder="65" oninput="nbCodeConvert(this.value)">
</div>
<div style="flex:1;min-width:140px">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Unicode 转义</div>
<input class="tool-input" id="nbUni" placeholder="\u0041" readonly style="opacity:0.7">
</div>
</div>
</div>
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:10px">快速参考</div>
<div style="display:flex;gap:8px;flex-wrap:wrap" id="nbRefBtns">
${[0,32,48,65,97,127,128,255,256,1000,65535].map(n =>
`<button class="copy-inline" onclick="nbConvert('dec','${n}')" style="font-family:monospace">${n}</button>`
).join('')}
</div>
</div>`;
}
let _nbLock = false;
function nbConvert(from, val) {
if (_nbLock) return;
_nbLock = true;
try {
val = val.trim().replace(/\s/g,'');
if (!val) { ['Dec','Hex','Oct','Bin'].forEach(k => { const el=document.getElementById('nb'+k); if(el) el.value=''; }); _nbLock=false; return; }
let n;
if (from==='dec') n = parseInt(val, 10);
else if (from==='hex') n = parseInt(val, 16);
else if (from==='oct') n = parseInt(val, 8);
else if (from==='bin') n = parseInt(val, 2);
if (isNaN(n) || n < 0) { _nbLock=false; return; }
if (from!=='dec') document.getElementById('nbDec').value = n;
if (from!=='hex') document.getElementById('nbHex').value = n.toString(16).toUpperCase();
if (from!=='oct') document.getElementById('nbOct').value = n.toString(8);
if (from!=='bin') document.getElementById('nbBin').value = n.toString(2);
if (n >= 0 && n <= 0x10FFFF) {
try {
document.getElementById('nbChar').value = String.fromCodePoint(n);
document.getElementById('nbCode').value = n;
document.getElementById('nbUni').value = n <= 0xFFFF ? '\\u' + n.toString(16).toUpperCase().padStart(4,'0') : '\\u{' + n.toString(16).toUpperCase() + '}';
} catch {}
}
} finally { _nbLock = false; }
}
function nbCharConvert(ch) {
if (!ch) return;
const code = ch.codePointAt(0);
nbConvert('dec', String(code));
document.getElementById('nbChar').value = ch[0];
}
function nbCodeConvert(val) {
const n = parseInt(val);
if (!isNaN(n)) nbConvert('dec', String(n));
}