function renderTimezone(el) {
const zones = [
['UTC','UTC'],['Asia/Shanghai','中国 (UTC+8)'],['Asia/Tokyo','日本 (UTC+9)'],
['Asia/Seoul','韩国 (UTC+9)'],['Asia/Singapore','新加坡 (UTC+8)'],
['Asia/Dubai','迪拜 (UTC+4)'],['Europe/London','伦敦'],['Europe/Paris','巴黎/柏林'],
['Europe/Moscow','莫斯科 (UTC+3)'],['America/New_York','纽约 (UTC-5/-4)'],
['America/Chicago','芝加哥'],['America/Los_Angeles','洛杉矶 (UTC-8/-7)'],
['America/Sao_Paulo','圣保罗 (UTC-3)'],['Australia/Sydney','悉尼'],
];
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">时区转换</div>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
<div style="flex:1;min-width:200px">
<label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">输入时间</label>
<input class="tool-input" id="tzInput" type="datetime-local" oninput="tzConvert()">
</div>
<div style="flex:1;min-width:200px">
<label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">来源时区</label>
<select class="tool-input" id="tzFrom" onchange="tzConvert()">
${zones.map(([z,l])=>`<option value="${z}">${l}</option>`).join('')}
</select>
</div>
</div>
<button class="btn btn-primary" onclick="tzConvert()">转换到所有时区</button>
</div>
<div class="tool-card-panel" id="tzResult" style="display:none">
<div class="panel-label" style="margin-bottom:12px">各时区时间</div>
<div id="tzOutput"></div>
</div>`;
const now = new Date();
now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
document.getElementById('tzInput').value = now.toISOString().slice(0,16);
document.getElementById('tzFrom').value = 'Asia/Shanghai';
tzConvert();
}
function tzConvert() {
const val = document.getElementById('tzInput').value;
const fromZone = document.getElementById('tzFrom').value;
if (!val) return;
const zones = [
['UTC','UTC'],['Asia/Shanghai','中国'],['Asia/Tokyo','日本'],['Asia/Seoul','韩国'],
['Asia/Singapore','新加坡'],['Asia/Dubai','迪拜'],['Europe/London','伦敦'],
['Europe/Paris','巴黎'],['Europe/Moscow','莫斯科'],['America/New_York','纽约'],
['America/Los_Angeles','洛杉矶'],['America/Sao_Paulo','圣保罗'],['Australia/Sydney','悉尼'],
];
try {
const date = new Date(val + ':00');
const html = zones.map(([tz,label]) => {
try {
const str = date.toLocaleString('zh-CN',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const offset = new Intl.DateTimeFormat('en',{timeZone:tz,timeZoneName:'short'}).format(date).split(' ').pop();
return `<div class="result-row" style="margin-bottom:8px"><span style="color:var(--text-muted);min-width:80px">${label}</span><span style="color:var(--neon);font-weight:600;flex:1">${str}</span><span style="color:var(--text-muted);font-size:11px">${offset}</span><button class="copy-inline" onclick="copyText('${str}',this)">复制</button></div>`;
} catch(e) { return ''; }
}).join('');
document.getElementById('tzOutput').innerHTML = html;
document.getElementById('tzResult').style.display = '';
} catch(e) { console.error(e); }
}