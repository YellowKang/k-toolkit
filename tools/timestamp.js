function renderTimestamp(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">当前时间</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" id="tsPauseBtn" onclick="toggleTsPause()">暂停</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px" id="tsLiveCards"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">时间戳 → 日期</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="tsInput" placeholder="输入时间戳（秒或毫秒）" style="flex:1">
        <button class="btn btn-primary" onclick="tsToDate()">转换</button>
        <button class="btn btn-secondary" onclick="tsUseNow()">用当前</button>
      </div>
      <div id="tsDateResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">日期 → 时间戳</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="dateInput" type="datetime-local" style="flex:1">
        <button class="btn btn-primary" onclick="dateToTs()">转换</button>
      </div>
      <div id="tsFromDateResult" style="margin-top:12px"></div>
    </div>`;

  const dt = new Date();
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  document.getElementById('dateInput').value = dt.toISOString().slice(0,16);
  startTsClock();

  document.getElementById('tsInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') tsToDate();
  });
}

let _tsPaused = false, _tsTimer = null;

function _renderLiveCards() {
  const now = Date.now();
  const sec  = Math.floor(now / 1000);
  const cards = [
    { label: '秒级时间戳', val: sec, color: 'var(--neon)' },
    { label: '毫秒时间戳', val: now, color: '#f093fb' },
    { label: '本地时间',   val: new Date().toLocaleString('zh-CN'), color: 'var(--text)' },
    { label: 'ISO 8601',  val: new Date().toISOString(), color: '#67e8f9' },
  ];
  const container = document.getElementById('tsLiveCards');
  if (!container) return;
  container.innerHTML = cards.map(c => `
    <div style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:12px;display:flex;flex-direction:column;gap:4px">
      <div style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${c.label}</div>
      <div style="font-family:monospace;font-size:14px;font-weight:700;color:${c.color};word-break:break-all">${c.val}</div>
      <button class="copy-inline" style="align-self:flex-start;margin-top:2px" onclick="copyText('${c.val}',this)">复制</button>
    </div>`).join('');
}

function startTsClock() {
  if (_tsTimer) { clearInterval(_tsTimer); _tsTimer = null; }
  _renderLiveCards();
  _tsTimer = setInterval(() => {
    if (!_tsPaused) {
      if (!document.getElementById('tsLiveCards')) { clearInterval(_tsTimer); return; }
      _renderLiveCards();
    }
  }, 1000);
  window._activeCleanup = () => { clearInterval(_tsTimer); _tsTimer = null; };
}

function toggleTsPause() {
  _tsPaused = !_tsPaused;
  const btn = document.getElementById('tsPauseBtn');
  if (btn) btn.textContent = _tsPaused ? '继续' : '暂停';
}

function tsUseNow() {
  document.getElementById('tsInput').value = Math.floor(Date.now()/1000);
  tsToDate();
}

function tsToDate() {
  const val = document.getElementById('tsInput').value.trim();
  if (!val) return;
  const num = parseFloat(val);
  const d = new Date(num > 1e10 ? num : num * 1000);
  if (isNaN(d.getTime())) {
    document.getElementById('tsDateResult').innerHTML = `<span style="color:#ef4444;font-size:13px">无效时间戳</span>`;
    return;
  }
  const fmt = [
    { label: 'UTC 时间',   time: d.toUTCString() },
    { label: '本地时间',   time: d.toLocaleString('zh-CN') },
    { label: 'ISO 8601',  time: d.toISOString() },
    { label: '相对时间',   time: relativeTime(d) },
    { label: '年月日',     time: d.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'}) },
  ];
  document.getElementById('tsDateResult').innerHTML = fmt.map(z =>
    `<div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
      <span style="color:var(--text-muted);width:80px;flex-shrink:0;font-size:12px">${z.label}</span>
      <span style="font-weight:600;flex:1;font-size:13px">${z.time}</span>
      <button class="copy-inline" onclick="copyText('${z.time}',this)">复制</button>
    </div>`).join('');
}

function dateToTs() {
  const val = document.getElementById('dateInput').value;
  if (!val) return;
  const d = new Date(val);
  const sec = Math.floor(d.getTime()/1000);
  const ms  = d.getTime();
  document.getElementById('tsFromDateResult').innerHTML = [
    { label: '秒级时间戳', val: sec },
    { label: '毫秒时间戳', val: ms },
  ].map(r => `<div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
    <span style="color:var(--text-muted);width:80px;flex-shrink:0;font-size:12px">${r.label}</span>
    <span style="font-weight:700;color:var(--neon);flex:1">${r.val}</span>
    <button class="copy-inline" onclick="copyText('${r.val}',this)">复制</button>
  </div>`).join('');
}

function relativeTime(d) {
  const diff = Date.now() - d.getTime();
  const abs  = Math.abs(diff), future = diff < 0;
  if (abs < 60000)    return '刚刚';
  if (abs < 3600000)  return Math.floor(abs/60000) + ' 分钟' + (future?'后':'前');
  if (abs < 86400000) return Math.floor(abs/3600000) + ' 小时' + (future?'后':'前');
  return Math.floor(abs/86400000) + ' 天' + (future?'后':'前');
}
