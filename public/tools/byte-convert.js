/* ── 存储与带宽换算：区分 1024（KiB/MiB，系统常用）与 1000（kB/MB，硬盘厂商与网速） ── */

const _bcDict = {
  zh: {
    title: '存储单位换算',
    all_iec: '二进制（1024 进制，Windows/内存常用）',
    all_si: '十进制（1000 进制，硬盘厂商/SI）',
    bytes: n => `${n} 字节`,
    copy: '复制',
    speed_title: '网络速度换算',
    per_sec: '每秒传输',
    transfer: size => `传输 ${size} 需要`,
    duration: s => s === Infinity ? '—' : s < 60 ? `${s.toFixed(2)} 秒` : s < 3600 ? `${(s / 60).toFixed(1)} 分钟` : `${(s / 3600).toFixed(2)} 小时`,
    disk_note: '例：标称 1 TB 硬盘 = 10¹² 字节 ≈ 931.32 GiB，系统里显示约 931 GB',
  },
  en: {
    title: 'Storage Units',
    all_iec: 'Binary (1024-based, OS/RAM)',
    all_si: 'Decimal (1000-based, drive vendors/SI)',
    bytes: n => `${n} bytes`,
    copy: 'Copy',
    speed_title: 'Network Speed',
    per_sec: 'Per second',
    transfer: size => `Time to transfer ${size}`,
    duration: s => s === Infinity ? '—' : s < 60 ? `${s.toFixed(2)} s` : s < 3600 ? `${(s / 60).toFixed(1)} min` : `${(s / 3600).toFixed(2)} h`,
    disk_note: 'Example: a "1 TB" drive is 10¹² bytes ≈ 931.32 GiB, shown by many systems as about 931 GB',
  },
};

const _BC_UNITS = [['B', 1], ['KiB', 1024], ['MiB', 1024 ** 2], ['GiB', 1024 ** 3], ['TiB', 1024 ** 4], ['PiB', 1024 ** 5],
  ['kB', 1e3], ['MB', 1e6], ['GB', 1e9], ['TB', 1e12], ['PB', 1e15], ['bit', 1 / 8]];
const _bcNum = v => v === 0 ? '0' : Math.abs(v) < 1e-6 || Math.abs(v) >= 1e21 ? v.toExponential(6) : String(Number(v.toPrecision(12)));

function renderByteConvert(el) {
  const T = makeToolI18n(_bcDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin-bottom:8px">
        <div>
          <input class="tool-input" id="bcVal" type="number" min="0" value="1" oninput="bcCalc()">
          <select class="tool-input" id="bcUnit" style="margin-top:8px" onchange="bcCalc()">
            ${_BC_UNITS.map(([u, f]) => `<option value="${f}"${u === 'TB' ? ' selected' : ''}>${u}</option>`).join('')}
          </select>
        </div>
        <div style="color:var(--accent);font-size:20px">=</div>
        <div id="bcMain" style="color:var(--neon);font-weight:700;font-size:18px;word-break:break-all"></div>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">${T('disk_note')}</div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('all_iec')}</div>
      <div id="bcAll"></div>
      <div class="panel-label" style="margin:14px 0 10px">${T('all_si')}</div>
      <div id="bcAllSi"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('speed_title')}</div>
      <div style="display:flex;gap:12px;margin-bottom:10px">
        <input class="tool-input" id="bpsVal" type="number" min="0" value="100" style="flex:1" oninput="bpsCalc()">
        <select class="tool-input" id="bpsUnit" style="width:120px" onchange="bpsCalc()">
          <option value="1">bps</option><option value="1000">Kbps</option><option value="1000000" selected>Mbps</option><option value="1000000000">Gbps</option>
        </select>
      </div>
      <div id="bpsResult"></div>
    </div>`;
  bcCalc(); bpsCalc();
}

function bcCalc() {
  const T = makeToolI18n(_bcDict);
  const bytes = (parseFloat(document.getElementById('bcVal').value) || 0) * parseFloat(document.getElementById('bcUnit').value);
  document.getElementById('bcMain').textContent = T('bytes', bytes.toLocaleString('en-US', { maximumFractionDigits: 3 }));
  const row = ([u, f]) => { const v = _bcNum(bytes / f); return `<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);width:70px">${u}</span><span style="color:var(--neon);font-weight:600;flex:1;word-break:break-all">${v}</span><button class="copy-inline" data-copy="${v}" onclick="copyText(this.dataset.copy,this)">${T('copy')}</button></div>`; };
  document.getElementById('bcAll').innerHTML = _BC_UNITS.slice(0, 6).reverse().map(row).join('');
  document.getElementById('bcAllSi').innerHTML = _BC_UNITS.slice(6).reverse().map(row).join('');
}

function bpsCalc() {
  const T = makeToolI18n(_bcDict);
  const bps = (parseFloat(document.getElementById('bpsVal').value) || 0) * parseFloat(document.getElementById('bpsUnit').value);
  const Bps = bps / 8;
  const items = [
    [T('per_sec'), `${_bcNum(Bps / 1e6)} MB/s · ${_bcNum(Bps / 1024 ** 2)} MiB/s`],
    [T('transfer', '1 GB'), T('duration', Bps ? 1e9 / Bps : Infinity)],
    [T('transfer', '1 GiB'), T('duration', Bps ? 1024 ** 3 / Bps : Infinity)],
    [T('transfer', '100 GB'), T('duration', Bps ? 1e11 / Bps : Infinity)],
  ];
  document.getElementById('bpsResult').innerHTML = items.map(([l, v]) =>
    `<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);min-width:130px">${l}</span><span style="color:var(--accent);font-weight:600">${v}</span></div>`
  ).join('');
}
