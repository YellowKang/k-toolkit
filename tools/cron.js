function renderCron(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">Cron 表达式</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
<input class="tool-input" id="cronInput" placeholder="* * * * *  (分 时 日 月 周)" style="flex:1;font-family:monospace;font-size:15px">
<button class="btn btn-primary" onclick="parseCron()">解析</button>
<button class="btn btn-secondary" onclick="cronClear()">清空</button>
</div>
<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px" id="cronPresets"></div>
</div>
<div class="tool-card-panel" id="cronResultPanel" style="display:none">
<div class="panel-label" style="margin-bottom:10px" id="cronDesc"></div>
<div style="margin-bottom:12px" id="cronFields"></div>
<div class="panel-label" style="margin-bottom:8px">下次执行时间</div>
<div id="cronNextList"></div>
</div>`;
const presets = [
['每分钟','* * * * *'],['每小时','0 * * * *'],['每天零点','0 0 * * *'],
['每周一','0 0 * * 1'],['每月1日','0 0 1 * *'],['每年元旦','0 0 1 1 *'],
['工作日9点','0 9 * * 1-5'],
];
const presetsEl = document.getElementById('cronPresets');
presets.forEach(([label,expr]) => {
const btn = document.createElement('button');
btn.className = 'copy-inline';
btn.textContent = label;
btn.onclick = () => { document.getElementById('cronInput').value=expr; parseCron(); };
presetsEl.appendChild(btn);
});
document.getElementById('cronInput').addEventListener('keydown', e => { if(e.key==='Enter') parseCron(); });
document.getElementById('cronInput').addEventListener('input', () => {
const v = document.getElementById('cronInput').value.trim();
if (v.split(/\s+/).length >= 5) parseCron();
});
}
function parseCron() {
const expr = document.getElementById('cronInput').value.trim();
const parts = expr.split(/\s+/);
const panel = document.getElementById('cronResultPanel');
if (parts.length < 5) {
panel.style.display='none'; return;
}
const [min,hour,day,month,weekday] = parts;
const fieldNames = ['分钟','小时','日期','月份','星期'];
const fieldVals  = [min,hour,day,month,weekday];
const ranges     = [[0,59],[0,23],[1,31],[1,12],[0,6]];
const desc = _cronDesc(min,hour,day,month,weekday);
document.getElementById('cronDesc').innerHTML = `<span style="color:#10b981;font-size:14px;font-weight:600">✓ ${desc}</span>`;
document.getElementById('cronFields').innerHTML =
'<div style="display:flex;gap:8px;flex-wrap:wrap">' +
fieldVals.map((v,i) =>
`<div style="flex:1;min-width:80px;padding:10px 12px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:10px;text-align:center">
<div style="font-family:monospace;font-size:18px;font-weight:700;color:var(--neon)">${escHtml(v)}</div>
<div style="font-size:11px;color:var(--text-muted);margin-top:4px">${fieldNames[i]}</div>
<div style="font-size:10px;color:rgba(102,126,234,0.6);margin-top:2px">${ranges[i][0]}-${ranges[i][1]}</div>
</div>`).join('') + '</div>';
const nexts = _cronNextN(expr, 6);
document.getElementById('cronNextList').innerHTML = nexts.map((d,i) =>
`<div class="result-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
<span style="color:var(--text-muted);font-size:12px;min-width:20px">#${i+1}</span>
<span style="font-family:monospace;font-size:13px;flex:1">${d.toLocaleString('zh-CN')}</span>
<button class="copy-inline" onclick="copyText('${d.toLocaleString('zh-CN')}',this)">复制</button>
</div>`).join('');
panel.style.display='';
}
function _cronDesc(min,hour,day,month,weekday) {
const every = v => v==='*'||v==='?';
let desc = '每';
if(!every(weekday)) desc += (['日','一','二','三','四','五','六'][parseInt(weekday)]||weekday)+'（周）';
if(!every(month))   desc += (parseInt(month))+'月';
if(!every(day))     desc += (parseInt(day))+'日';
if(!every(hour))    desc += hour+'时';
else if(!every(min)) desc += '小时';
if(!every(min))     desc += min+'分';
else                desc += '每分钟';
return desc + '执行一次';
}
function _cronNextN(expr, n) {
const parts = expr.split(/\s+/);
const [min,hour,day,month,weekday] = parts;
const results = [];
let d = new Date();
d.setSeconds(0,0);
d.setMinutes(d.getMinutes()+1);
let tries = 0;
while (results.length < n && tries++ < 100000) {
if (_cronMatch(d,min,hour,day,month,weekday)) results.push(new Date(d));
d.setMinutes(d.getMinutes()+1);
}
return results;
}
function _cronMatch(d,min,hour,day,month,weekday) {
return _field(d.getMinutes(),min,0,59) &&
_field(d.getHours(),hour,0,23) &&
_field(d.getDate(),day,1,31) &&
_field(d.getMonth()+1,month,1,12) &&
_field(d.getDay(),weekday,0,6);
}
function _field(val,expr,min,max) {
if (expr==='*'||expr==='?') return true;
return expr.split(',').some(part => {
if (part.includes('/')) {
const [s,step] = part.split('/');
const start = s==='*'?min:parseInt(s);
return (val-start)%parseInt(step)===0 && val>=start;
}
if (part.includes('-')) {
const [a,b] = part.split('-').map(Number);
return val>=a && val<=b;
}
return parseInt(part)===val;
});
}
function cronClear() {
document.getElementById('cronInput').value='';
document.getElementById('cronResultPanel').style.display='none';
}