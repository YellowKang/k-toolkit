/* ── IPv4 子网计算与地址类型判断（RFC 1918/6598/3927/5737/3021 等） ── */

const _ipDict = {
  zh: {
    title: 'IP / 子网计算器',
    ip_ph: '192.168.1.100 或 10.0.0.1/8',
    cidr_ph: 'CIDR 前缀 (0-32)',
    calc: '计算', demo: '示例', copy: '复制',
    info: '子网信息',
    rows: { ip: 'IP 地址', mask: '子网掩码', wildcard: '反掩码', network: '网络地址', broadcast: '广播地址', range: '可用 IP 范围', hosts: '可用主机数', binary: 'IP 二进制' },
    invalid: '请输入有效的 IPv4 地址（每段 0-255）',
    type_title: 'IP 类型判断',
    type_ph: '输入 IP 地址',
    types: { private: '私有地址', cgnat: '运营商级 NAT (100.64/10)', loopback: '回环地址', link: '链路本地地址', multicast: '多播地址',
      broadcast: '受限广播地址', this: '本网络 (0.0.0.0/8)', doc: '文档示例地址', reserved: '保留地址 (240/4)', benchmark: '基准测试 (198.18/15)', public: '公网地址' },
    cls: c => `${c} 类`,
  },
  en: {
    title: 'IP / Subnet Calculator',
    ip_ph: '192.168.1.100 or 10.0.0.1/8',
    cidr_ph: 'CIDR prefix (0-32)',
    calc: 'Calculate', demo: 'Sample', copy: 'Copy',
    info: 'Subnet details',
    rows: { ip: 'IP address', mask: 'Subnet mask', wildcard: 'Wildcard mask', network: 'Network', broadcast: 'Broadcast', range: 'Usable range', hosts: 'Usable hosts', binary: 'Binary' },
    invalid: 'Enter a valid IPv4 address (each octet 0-255)',
    type_title: 'Address Type',
    type_ph: 'IP address',
    types: { private: 'Private', cgnat: 'Carrier-grade NAT (100.64/10)', loopback: 'Loopback', link: 'Link-local', multicast: 'Multicast',
      broadcast: 'Limited broadcast', this: '"This" network (0.0.0.0/8)', doc: 'Documentation', reserved: 'Reserved (240/4)', benchmark: 'Benchmarking (198.18/15)', public: 'Public' },
    cls: c => `Class ${c}`,
  },
};

/** IPv4 dotted quad → unsigned 32-bit number, or null. */
function ipParse(ip) {
  const parts = String(ip ?? '').trim().split('.');
  if (parts.length !== 4 || !parts.every(p => /^\d{1,3}$/.test(p) && +p <= 255)) return null;
  return parts.reduce((acc, p) => acc * 256 + +p, 0);
}
function ipToNum(ip) { return ipParse(ip) ?? 0; }
function numToIp(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }

/** Subnet facts for an address and prefix; /31 and /32 follow RFC 3021 (no network/broadcast reservation). */
function ipSubnet(ipNum, cidr) {
  const mask = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const network = (ipNum & mask) >>> 0, broadcast = (network | (~mask >>> 0)) >>> 0;
  const size = 2 ** (32 - cidr);
  return { mask, wildcard: (~mask) >>> 0, network, broadcast, hosts: cidr >= 31 ? size : size - 2,
    first: cidr >= 31 ? network : network + 1, last: cidr >= 31 ? broadcast : broadcast - 1 };
}

function ipTypes(n) {
  const a = n >>> 24, b = (n >>> 16) & 255, c = (n >>> 8) & 255;
  const t = [];
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) t.push('private');
  if (a === 100 && b >= 64 && b <= 127) t.push('cgnat');
  if (a === 127) t.push('loopback');
  if (a === 169 && b === 254) t.push('link');
  if (a >= 224 && a <= 239) t.push('multicast');
  if (n === 0xFFFFFFFF) t.push('broadcast');
  else if (a >= 240) t.push('reserved');
  if (a === 0) t.push('this');
  if ((a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)) t.push('doc');
  if (a === 198 && (b === 18 || b === 19)) t.push('benchmark');
  if (!t.length) t.push('public');
  return t;
}

function renderIpCalc(el) {
  const T = makeToolI18n(_ipDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <input class="tool-input" id="ipInput" placeholder="${T('ip_ph')}" style="flex:1;min-width:180px;font-family:monospace" oninput="ipCalc()">
        <input class="tool-input" id="ipCidr" placeholder="${T('cidr_ph')}" type="number" min="0" max="32" value="24" style="width:160px" oninput="ipCalc()">
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="ipCalc()">${T('calc')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('ipInput').value='192.168.1.100';document.getElementById('ipCidr').value='24';ipCalc()">${T('demo')}</button>
      </div>
      <div id="ipError" style="display:none;margin-top:10px;font-size:13px;color:#ef4444"></div>
    </div>
    <div class="tool-card-panel" id="ipResult" style="display:none">
      <div class="panel-label" style="margin-bottom:12px">${T('info')}</div>
      <div id="ipOutput"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('type_title')}</div>
      <input class="tool-input" id="ipTypeInput" placeholder="${T('type_ph')}" style="margin-bottom:10px;font-family:monospace" oninput="ipTypeCheck()">
      <div id="ipTypeResult" style="font-size:13px"></div>
    </div>`;
  document.getElementById('ipInput').value = '192.168.1.100';
  ipCalc();
}

function ipCalc() {
  const T = makeToolI18n(_ipDict);
  const input = document.getElementById('ipInput'), cidrEl = document.getElementById('ipCidr');
  let ip = input.value.trim();
  // Accept "a.b.c.d/nn" in the address box.
  const slash = ip.match(/^(.+)\/(\d{1,2})$/);
  if (slash) { ip = slash[1]; cidrEl.value = slash[2]; }
  const cidr = parseInt(cidrEl.value, 10);
  const ipNum = ipParse(ip), error = document.getElementById('ipError'), result = document.getElementById('ipResult');
  if (ipNum === null || !(cidr >= 0 && cidr <= 32)) {
    error.textContent = T('invalid'); error.style.display = ip ? '' : 'none'; result.style.display = 'none';
    return;
  }
  error.style.display = 'none';
  const s = ipSubnet(ipNum, cidr), labels = T('rows');
  const rows = [
    [labels.ip, numToIp(ipNum) + '/' + cidr], [labels.mask, numToIp(s.mask)], [labels.wildcard, numToIp(s.wildcard)],
    [labels.network, numToIp(s.network)], [labels.broadcast, numToIp(s.broadcast)],
    [labels.range, numToIp(s.first) + ' ~ ' + numToIp(s.last)], [labels.hosts, s.hosts.toLocaleString()],
    [labels.binary, numToIp(ipNum).split('.').map(o => (+o).toString(2).padStart(8, '0')).join('.')],
  ];
  document.getElementById('ipOutput').innerHTML = rows.map(([l, v]) =>
    `<div class="result-row" style="margin-bottom:8px"><span style="color:var(--text-muted);min-width:120px">${l}</span><span style="color:var(--neon);font-weight:600;flex:1;font-family:monospace;word-break:break-all">${v}</span><button class="copy-inline" data-copy="${v}" onclick="copyText(this.dataset.copy,this)">${T('copy')}</button></div>`
  ).join('');
  result.style.display = '';
}

function ipTypeCheck() {
  const T = makeToolI18n(_ipDict);
  const ip = document.getElementById('ipTypeInput').value.trim();
  const out = document.getElementById('ipTypeResult');
  const n = ipParse(ip);
  if (n === null) { out.innerHTML = ip ? `<span style="color:#ef4444">${T('invalid')}</span>` : ''; return; }
  const a = n >>> 24;
  const cls = a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D' : 'E';
  out.innerHTML = `<span style="color:var(--neon);font-weight:600">${numToIp(n)}</span> &nbsp;` +
    `<span style="background:rgba(102,126,234,0.2);padding:2px 8px;border-radius:6px;font-size:12px;color:var(--accent)">${T('cls', cls)}</span> &nbsp;` +
    ipTypes(n).map(t => `<span style="background:rgba(16,185,129,0.15);padding:2px 8px;border-radius:6px;font-size:12px;color:#10b981">${T('types')[t]}</span>`).join(' ');
}
