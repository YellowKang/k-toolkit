function renderIpCalc(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">IP / 子网计算器</div>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
<input class="tool-input" id="ipInput" placeholder="192.168.1.100" style="flex:1" oninput="ipCalc()">
<input class="tool-input" id="ipCidr" placeholder="CIDR 前缀 (如 24)" type="number" min="0" max="32" value="24" style="width:160px" oninput="ipCalc()">
</div>
<div class="tool-actions">
<button class="btn btn-primary" onclick="ipCalc()">计算</button>
<button class="btn btn-secondary" onclick="document.getElementById('ipInput').value='192.168.1.100';document.getElementById('ipCidr').value='24';ipCalc()">示例</button>
</div>
</div>
<div class="tool-card-panel" id="ipResult" style="display:none">
<div class="panel-label" style="margin-bottom:12px">子网信息</div>
<div id="ipOutput"></div>
</div>
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:10px">IP 类型判断</div>
<div style="display:flex;gap:12px;margin-bottom:10px">
<input class="tool-input" id="ipTypeInput" placeholder="输入 IP 地址" style="flex:1" oninput="ipTypeCheck()">
</div>
<div id="ipTypeResult" style="font-size:13px"></div>
</div>`;
document.getElementById('ipInput').value='192.168.1.100';
ipCalc();
}
function ipToNum(ip) {
return ip.split('.').reduce((acc,oct)=>(acc<<8)+(+oct),0)>>>0;
}
function numToIp(n) {
return [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
}
function ipCalc() {
const ip = document.getElementById('ipInput').value.trim();
const cidr = parseInt(document.getElementById('ipCidr').value);
if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || isNaN(cidr) || cidr<0 || cidr>32) return;
if (ip.split('.').some(o => +o < 0 || +o > 255)) { document.getElementById('ipResult').style.display='none'; return; }
const mask = cidr===0 ? 0 : (~0 << (32-cidr)) >>> 0;
const ipNum = ipToNum(ip);
const network = (ipNum & mask) >>> 0;
const broadcast = (network | (~mask >>> 0)) >>> 0;
const hosts = cidr>=31 ? Math.pow(2,32-cidr) : Math.pow(2,32-cidr)-2;
const first = cidr>=31 ? network : network+1;
const last = cidr>=31 ? broadcast : broadcast-1;
const rows = [
['IP 地址', ip],
['子网掩码', numToIp(mask)],
['网络地址', numToIp(network)],
['广播地址', numToIp(broadcast)],
['可用 IP 范围', numToIp(first)+' ~ '+numToIp(last)],
['可用主机数', hosts.toLocaleString()],
['IP 二进制', ip.split('.').map(o=>parseInt(o).toString(2).padStart(8,'0')).join('.')],
];
document.getElementById('ipOutput').innerHTML = rows.map(([l,v])=>
`<div class="result-row" style="margin-bottom:8px"><span style="color:var(--text-muted);min-width:120px">${l}</span><span style="color:var(--neon);font-weight:600;flex:1;font-family:monospace">${v}</span><button class="copy-inline" onclick="copyText('${v}',this)">复制</button></div>`
).join('');
document.getElementById('ipResult').style.display='';
}
function ipTypeCheck() {
const ip = document.getElementById('ipTypeInput').value.trim();
if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) { document.getElementById('ipTypeResult').innerHTML=''; return; }
const n = ipToNum(ip);
const types = [];
if ((n>>>24)===10) types.push('私有地址 (A类)');
if ((n>>>24)===172 && ((n>>>16)&255)>=16 && ((n>>>16)&255)<=31) types.push('私有地址 (B类)');
if ((n>>>24)===192 && ((n>>>16)&255)===168) types.push('私有地址 (C类)');
if ((n>>>24)===127) types.push('回环地址');
if ((n>>>24)===169 && ((n>>>16)&255)===254) types.push('链路本地地址');
if ((n>>>24)>=224 && (n>>>24)<=239) types.push('多播地址');
if (n===0xFFFFFFFF) types.push('广播地址');
if (!types.length) types.push('公网地址');
const cls = (n>>>24)<128?'A类':(n>>>24)<192?'B类':(n>>>24)<224?'C类':'D/E类';
document.getElementById('ipTypeResult').innerHTML =
`<span style="color:var(--neon);font-weight:600">${ip}</span> &nbsp;` +
`<span style="background:rgba(102,126,234,0.2);padding:2px 8px;border-radius:6px;font-size:12px;color:var(--accent)">${cls}</span> &nbsp;` +
types.map(t=>`<span style="background:rgba(16,185,129,0.15);padding:2px 8px;border-radius:6px;font-size:12px;color:#10b981">${t}</span>`).join(' ');
}