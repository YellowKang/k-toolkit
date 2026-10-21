const _ngDict = {
  zh: {
    scene: '场景模板', domain: '域名', root: '根目录 / 代理地址', root_ph: '/var/www/html 或 http://127.0.0.1:3000', port: '监听端口',
    gzip: '开启 Gzip', cache: '静态缓存', access_log: '访问日志', ssl: 'SSL 配置', output: '生成的配置', download: '⬇ 下载', copy: '复制', copied: '✓ 已复制',
    scenes: { static: '静态网站', spa: '单页应用（SPA）', proxy: '反向代理', https: 'HTTPS + 重定向', loadbalance: '负载均衡' },
    redirect_comment: '# HTTP → HTTPS 重定向', server_comment: '# HTTPS 主服务',
  },
  en: {
    scene: 'Scenario', domain: 'Domain', root: 'Root directory / upstream', root_ph: '/var/www/html or http://127.0.0.1:3000', port: 'Listen port',
    gzip: 'Enable gzip', cache: 'Cache static assets', access_log: 'Access log', ssl: 'SSL settings', output: 'Generated config', download: '⬇ Download', copy: 'Copy', copied: '✓ Copied',
    scenes: { static: 'Static site', spa: 'Single-page app (SPA)', proxy: 'Reverse proxy', https: 'HTTPS + redirect', loadbalance: 'Load balancer' },
    redirect_comment: '# Redirect HTTP → HTTPS', server_comment: '# HTTPS server',
  },
};

function renderNginxGen(el) {
  const T = makeToolI18n(_ngDict);
  const scenes = T('scenes');
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div class="panel-label">${T('scene')}</div>
          <select class="tool-input" id="ngScene" onchange="ngApplyScene()">
            ${Object.keys(scenes).map(scene => `<option value="${scene}">${scenes[scene]}</option>`).join('')}
          </select>
        </div>
        <div>
          <div class="panel-label">${T('domain')}</div>
          <input class="tool-input" id="ngDomain" value="example.com" oninput="ngGen()" placeholder="example.com">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
        <div>
          <div class="panel-label">${T('root')}</div>
          <input class="tool-input" id="ngRoot" value="/var/www/html" oninput="ngGen()" placeholder="${T('root_ph')}">
        </div>
        <div>
          <div class="panel-label">${T('port')}</div>
          <input class="tool-input" id="ngPort" value="80" oninput="ngGen()" placeholder="80">
        </div>
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="ngGzip" checked onchange="ngGen()"> ${T('gzip')}
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="ngCache" checked onchange="ngGen()"> ${T('cache')}
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="ngAccessLog" onchange="ngGen()"> ${T('access_log')}
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="ngSsl" onchange="ngGen()"> ${T('ssl')}
        </label>
      </div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('output')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="ngDownload()">${T('download')}</button>
          <button class="btn btn-primary" id="ngCopyBtn" onclick="ngCopy()">${T('copy')}</button>
        </div>
      </div>
      <pre class="result-box" id="ngOutput" style="white-space:pre;overflow-x:auto;max-height:420px"></pre>
    </div>`;
  ngGen();
}

const NG_SCENES = {
  static:      { root: '/var/www/html',          label: '静态网站' },
  spa:         { root: '/var/www/html',          label: 'SPA' },
  proxy:       { root: 'http://127.0.0.1:3000',  label: '反向代理' },
  https:       { root: '/var/www/html',          label: 'HTTPS' },
  loadbalance: { root: 'http://127.0.0.1:3000',  label: '负载均衡' },
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
  const T = makeToolI18n(_ngDict);
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
    const proxyTarget = scene === 'loadbalance' ? 'http://backend' : root;
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
    conf = `${T('redirect_comment')}
server {
    listen      80;
    server_name ${domain} www.${domain};
    return 301 https://$host$request_uri;
}

${T('server_comment')}
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
    btn.textContent = makeToolI18n(_ngDict)('copied');
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
