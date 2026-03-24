function renderHttpStatus(el) {
const STATUS = [
[100,'Continue'],[101,'Switching Protocols'],[102,'Processing'],[103,'Early Hints'],
[200,'OK'],[201,'Created'],[202,'Accepted'],[203,'Non-Authoritative Information'],[204,'No Content'],[205,'Reset Content'],[206,'Partial Content'],[207,'Multi-Status'],[208,'Already Reported'],[226,'IM Used'],
[300,'Multiple Choices'],[301,'Moved Permanently'],[302,'Found'],[303,'See Other'],[304,'Not Modified'],[305,'Use Proxy'],[307,'Temporary Redirect'],[308,'Permanent Redirect'],
[400,'Bad Request'],[401,'Unauthorized'],[402,'Payment Required'],[403,'Forbidden'],[404,'Not Found'],[405,'Method Not Allowed'],[406,'Not Acceptable'],[407,'Proxy Authentication Required'],[408,'Request Timeout'],[409,'Conflict'],[410,'Gone'],[411,'Length Required'],[412,'Precondition Failed'],[413,'Content Too Large'],[414,'URI Too Long'],[415,'Unsupported Media Type'],[416,'Range Not Satisfiable'],[417,'Expectation Failed'],[418,"I'm a Teapot"],[421,'Misdirected Request'],[422,'Unprocessable Content'],[423,'Locked'],[424,'Failed Dependency'],[425,'Too Early'],[426,'Upgrade Required'],[428,'Precondition Required'],[429,'Too Many Requests'],[431,'Request Header Fields Too Large'],[451,'Unavailable For Legal Reasons'],
[500,'Internal Server Error'],[501,'Not Implemented'],[502,'Bad Gateway'],[503,'Service Unavailable'],[504,'Gateway Timeout'],[505,'HTTP Version Not Supported'],[506,'Variant Also Negotiates'],[507,'Insufficient Storage'],[508,'Loop Detected'],[510,'Not Extended'],[511,'Network Authentication Required'],
];
const DESCS = {
200:'请求成功，服务器返回所求数据。',404:'请求的资源不存在。',500:'服务器发生内部错误。',
301:'资源已永久移至新 URL。',302:'资源临时重定向。',304:'资源未修改，使用缓存。',
400:'客户端发送了错误的请求。',401:'需要身份验证。',403:'服务器拒绝访问，权限不足。',
429:'请求过于频繁，触发限流。',408:'请求超时，客户端未及时发送完请求。',
201:'请求成功且资源已创建。',204:'请求成功但无响应体。',503:'服务器暂时不可用（维护/过载）。',
502:'网关从上游收到无效响应。',504:'网关等待上游超时。',422:'请求格式正确但语义错误。',
};
const COLORS = {1:'#67e8f9',2:'#34d399',3:'#fbbf24',4:'#f87171',5:'#f87171'};
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
<input class="tool-input" id="hsSearch" placeholder="输入状态码或关键词..." style="flex:1" oninput="hsFilter(this.value)">
<div style="display:flex;gap:6px" id="hsCatBtns"></div>
</div>
</div>
<div id="hsGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px"></div>`;
window._hsData = STATUS;
window._hsCat  = 'all';
const catEl = document.getElementById('hsCatBtns');
['all','1xx','2xx','3xx','4xx','5xx'].forEach(cat => {
const btn = document.createElement('button');
btn.textContent = cat==='all'?'全部':cat;
btn.className = 'copy-inline';
btn.style.fontFamily = 'monospace';
btn.onclick = () => { window._hsCat=cat; hsFilter(document.getElementById('hsSearch').value); };
catEl.appendChild(btn);
});
hsFilter('');
window.hsFilter = function(q) {
const cat = window._hsCat;
const query = q.toLowerCase();
const filtered = STATUS.filter(([code,name]) => {
const catMatch = cat==='all' || String(code).startsWith(cat[0]);
const qMatch = !query || String(code).includes(query) || name.toLowerCase().includes(query);
return catMatch && qMatch;
});
const grid = document.getElementById('hsGrid');
if (!grid) return;
grid.innerHTML = filtered.map(([code,name]) => {
const g = String(code)[0];
const color = COLORS[g] || 'var(--text-muted)';
const desc = DESCS[code] || '';
return `<div style="padding:14px 16px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:12px;cursor:pointer;transition:all 0.2s" onclick="hsCopy(${code},'${name}',this)" onmouseenter="this.style.borderColor='${color}'" onmouseleave="this.style.borderColor='rgba(255,255,255,0.08)'">
<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
<span style="font-family:monospace;font-size:18px;font-weight:800;color:${color}">${code}</span>
<span style="font-size:12px;color:var(--text-muted)">${name}</span>
</div>
${desc?`<div style="font-size:11px;color:var(--text-muted);line-height:1.5">${desc}</div>`:''}
</div>`;
}).join('');
};
window.hsCopy = function(code, name, el) {
navigator.clipboard.writeText(String(code)).then(() => showToast(`已复制 ${code} ${name}`));
};
}