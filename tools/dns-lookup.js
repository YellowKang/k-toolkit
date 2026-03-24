window.renderDnsLookup = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">DNS 查询</div>
<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
<input class="tool-input" id="dnsInput" placeholder="输入域名（如 example.com）" style="flex:1" onkeydown="if(event.key==='Enter')doDnsLookup()">
<select class="tool-input" id="dnsType" style="width:100px">
<option>A</option><option>AAAA</option><option>MX</option><option>TXT</option><option>CNAME</option><option>NS</option>
</select>
<button class="btn btn-primary" onclick="doDnsLookup()">查询</button>
</div>
</div>
<div class="tool-card-panel" id="dnsResult" style="display:none">
<div class="panel-label" id="dnsTitle" style="margin-bottom:10px"></div>
<div id="dnsData"></div>
</div>`;
};
async function doDnsLookup() {
const domain = document.getElementById('dnsInput').value.trim();
const type = document.getElementById('dnsType').value;
if (!domain) return;
const res = document.getElementById('dnsResult');
const data = document.getElementById('dnsData');
const title = document.getElementById('dnsTitle');
title.textContent = `查询中...`;
data.innerHTML = '<span style="color:var(--text-muted)">请稍候...</span>';
res.style.display = '';
try {
const r = await fetch(`https:
headers: {Accept:'application/dns-json'},
signal: AbortSignal.timeout(8000)
});
const json = await r.json();
title.textContent = `${domain} — ${type} 记录`;
if (!json.Answer || !json.Answer.length) {
data.innerHTML = '<span style="color:var(--text-muted)">未找到记录</span>';
return;
}
data.innerHTML = json.Answer.map(a =>
`<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--glass-border);font-family:monospace;font-size:13px">
<span style="color:var(--text-muted);min-width:50px">TTL:${a.TTL}</span>
<span style="color:var(--text);word-break:break-all">${a.data}</span>
</div>`
).join('');
} catch(e) {
data.innerHTML = `<span style="color:#ef4444">查询失败：${e.message}</span>`;
}
}