function renderNginxGen(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div>
<div class="panel-label">场景模板</div>
<select class="tool-input" id="ngScene" onchange="ngApplyScene()">
<option value="static">静态网站</option>
<option value="spa">单页应用（SPA）</option>
<option value="proxy">反向代理</option>
<option value="https">HTTPS + 重定向</option>
<option value="loadbalance">负载均衡</option>
</select>
</div>
<div>
<div class="panel-label">域名</div>
<input class="tool-input" id="ngDomain" value="example.com" oninput="ngGen()" placeholder="example.com">
</div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
<div>
<div class="panel-label">根目录 / 代理地址</div>
<input class="tool-input" id="ngRoot" value="/var/www/html" oninput="ngGen()" placeholder="/var/www/html 或 http:
</div>
<div>
<div class="panel-label">监听端口</div>
<input class="tool-input" id="ngPort" value="80" oninput="ngGen()" placeholder="80">
</div>
</div>
<div style="margin-top:12px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
<input type="checkbox" id="ngGzip" checked onchange="ngGen()"> 开启 Gzip
</label>
<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
<input type="checkbox" id="ngCache" checked onchange="ngGen()"> 静态缓存
</label>
<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
<input type="checkbox" id="ngAccessLog" onchange="ngGen()"> 访问日志
</label>
<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
<input type="checkbox" id="ngSsl" onchange="ngGen()"> SSL 配置
</label>
</div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">生成的配置</div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary" onclick="ngDownload()">⬇ 下载</button>
<button class="btn btn-primary" id="ngCopyBtn" onclick="ngCopy()">复制</button>
</div>
</div>
<pre class="result-box" id="ngOutput" style="white-space:pre;overflow-x:auto;max-height:420px"></pre>
</div>`;
ngGen();
}
const NG_SCENES = {
static:      { root: '/var/www/html',          label: '静态网站' },
spa:         { root: '/var/www/html',          label: 'SPA' },
proxy:       { root: 'http:
https:       { root: '/var/www/html',          label: 'HTTPS' },
loadbalance: { root: 'http:
};
function ngApplyScene() {
const scene = document.getElementById('ngScene').value;
const cfg = NG_SCENES[scene];
if (cfg) document.getElementById('ngRoot').value = cfg.root;
const sslCb = document.getElementById('ngSsl');
if (scene === 'https') sslCb.checked = true;
ngGen();
}
function ngGen() {
const domain  = document.getElementById('ngDomain').value.trim() || 'example.com';
const root    = document.getElementById('ngRoot').value.trim() || '/var/www/html';
const port    = document.getElementById('ngPort').value.trim() || '80';
const scene   = document.getElementById('ngScene').value;
const gzip    = document.getElementById('ngGzip').checked;
const cache   = document.getElementById('ngCache').checked;
const log     = document.getElementById('ngAccessLog').checked;
const ssl     = document.getElementById('ngSsl').checked;
const gzipBlock = gzip ? `
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;
` : '';
const logLine = log
? `\n    access_log /var/log/nginx/${domain}.access.log;\n    error_log  /var/log/nginx/${domain}.error.log;`
: '\n    access_log off;';
const cacheBlock = cache ? `
location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
expires 1y;
add_header Cache-Control "public, immutable";
access_log off;
}
` : '';
const sslBlock = ssl ? `
ssl_certificate     /etc/nginx/ssl/${domain}.crt;
ssl_certificate_key /etc/nginx/ssl/${domain}.key;
ssl_protocols       TLSv1.2 TLSv1.3;
ssl_ciphers         HIGH:!aNULL:!MD5;
ssl_session_cache   shared:SSL:10m;
add_header Strict-Transport-Security "max-age=31536000" always;
` : '';
let locationBlock = '';
if (scene === 'proxy' || scene === 'loadbalance') {
const upstream = scene === 'loadbalance'
? `\nupstream backend {\n    server 127.0.0.1:3000;\n    server 127.0.0.1:3001;\n    keepalive 32;\n}\n`
: '';
const proxyTarget = scene === 'loadbalance' ? 'http:
locationBlock = `${upstream}
location / {
proxy_pass         ${proxyTarget};
proxy_http_version 1.1;
proxy_set_header   Host              $host;
proxy_set_header   X-Real-IP         $remote_addr;
proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
proxy_set_header   X-Forwarded-Proto $scheme;
proxy_set_header   Upgrade           $http_upgrade;
proxy_set_header   Connection        "upgrade";
proxy_read_timeout 60s;
}
`;
} else if (scene === 'spa') {
locationBlock = `
root ${root};
index index.html;
location / {
try_files $uri $uri/ /index.html;
}
`;
} else {
locationBlock = `
root ${root};
index index.html index.htm;
location / {
try_files $uri $uri/ =404;
}
`;
}
let conf = '';
if (scene === 'https') {
conf = `# HTTP → HTTPS 重定向
server {
listen      80;
server_name ${domain} www.${domain};
return 301 https:
}
# HTTPS 主服务
server {
listen      443 ssl http2;
server_name ${domain} www.${domain};${logLine}${sslBlock}${gzipBlock}${locationBlock}${cacheBlock}}`;
} else {
const listenSsl = ssl ? `\n    listen      443 ssl http2;` : '';
conf = `server {
listen      ${port};${listenSsl}
server_name ${domain} www.${domain};${logLine}${ssl ? sslBlock : ''}${gzipBlock}${locationBlock}${cacheBlock}}`;
}
document.getElementById('ngOutput').textContent = conf;
}
function ngCopy() {
const text = document.getElementById('ngOutput').textContent;
navigator.clipboard.writeText(text).then(() => {
const btn = document.getElementById('ngCopyBtn');
const orig = btn.textContent;
btn.textContent = '✓ 已复制';
btn.classList.add('copied');
setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
});
}
function ngDownload() {
const text = document.getElementById('ngOutput').textContent;
const domain = document.getElementById('ngDomain').value.trim() || 'example.com';
const blob = new Blob([text], { type: 'text/plain' });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = domain + '.conf';
a.click();
}