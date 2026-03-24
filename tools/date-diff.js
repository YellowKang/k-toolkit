function renderDateDiff(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">日期差计算</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
<div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">开始日期</label><input class="tool-input" id="ddFrom" type="date" oninput="ddCalc()"></div>
<div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">结束日期</label><input class="tool-input" id="ddTo" type="date" oninput="ddCalc()"></div>
</div>
<div class="tool-actions">
<button class="btn btn-primary" onclick="ddCalc()">计算</button>
<button class="btn btn-secondary" onclick="ddSetToday()">设为今天</button>
</div>
</div>
<div class="tool-card-panel" id="ddResult" style="display:none">
<div id="ddOutput"></div>
</div>
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:10px">工作日计算</div>
<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">（排除周六、周日，不含节假日）</div>
<div id="ddWorkdays" style="color:var(--neon);font-weight:700;font-size:18px"></div>
</div>`;
ddSetToday();
}
function ddSetToday() {
const today = new Date().toISOString().slice(0,10);
document.getElementById('ddFrom').value = today;
document.getElementById('ddTo').value = today;
ddCalc();
}
function ddCalc() {
const from = new Date(document.getElementById('ddFrom').value);
const to = new Date(document.getElementById('ddTo').value);
if (isNaN(from)||isNaN(to)) return;
const diffMs = to - from;
const diffDays = Math.round(diffMs/86400000);
const abs = Math.abs(diffDays);
const label = diffDays >= 0 ? '之后' : '之前';
const weeks = Math.floor(abs/7), days = abs%7;
const months = Math.floor(abs/30), years = Math.floor(abs/365);
document.getElementById('ddOutput').innerHTML = [
['总天数', abs + ' 天 (' + label + ')','var(--neon)'],
['周 + 天', weeks + ' 周 ' + days + ' 天','var(--accent)'],
['约几个月', '约 ' + months + ' 个月','var(--text)'],
['约几年', '约 ' + years + ' 年','var(--text)'],
].map(([l,v,c])=>`<div style="display:flex;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;margin-bottom:8px"><span style="color:var(--text-muted)">${l}</span><span style="font-weight:700;color:${c}">${v}</span></div>`).join('');
document.getElementById('ddResult').style.display='';
let wd = 0;
const d = new Date(from);
const dir = diffDays >= 0 ? 1 : -1;
for (let i=0;i<abs;i++) { d.setDate(d.getDate()+dir); const day=d.getDay(); if(day!==0&&day!==6) wd++; }
document.getElementById('ddWorkdays').textContent = wd + ' 个工作日';
}