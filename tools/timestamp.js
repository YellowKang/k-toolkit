function renderTimestamp(el) {
  const tl = makeToolI18n({
    zh: {
      current_time:    '当前时间',
      pause:           '暂停',
      resume:          '继续',
      ts_to_date:      '时间戳 → 日期',
      date_to_ts:      '日期 → 时间戳',
      input_ts:        '输入时间戳（秒或毫秒）',
      convert:         '转换',
      use_now:         '用当前',
      multi_format:    '多格式输出',
      input_ts_or_date:'输入时间戳(秒/毫秒)或日期字符串',
      now:             '现在',
      clear:           '清空',
      ts_sec:          '秒级时间戳',
      ts_ms:           '毫秒时间戳',
      local_time:      '本地时间',
      invalid_ts:      '无效时间戳',
      utc_time:        'UTC 时间',
      iso_8601:        'ISO 8601',
      relative_time:   '相对时间',
      full_date:       '年月日',
      local_datetime:  '本地日期时间',
      date:            '日期',
      time:            '时间',
      readable:        '可读格式',
      ts_sec_label:    '时间戳（秒）',
      ts_ms_label:     '时间戳（毫秒）',
      utc_string:      'UTC 字符串',
      cannot_parse:    '无法解析该时间格式',
      copy:            '复制',
      just_now:        '刚刚',
      min_ago:         ' 分钟前',
      min_later:       ' 分钟后',
      hr_ago:          ' 小时前',
      hr_later:        ' 小时后',
      day_ago:         ' 天前',
      day_later:       ' 天后',
    },
    en: {
      current_time:    'Current Time',
      pause:           'Pause',
      resume:          'Resume',
      ts_to_date:      'Timestamp → Date',
      date_to_ts:      'Date → Timestamp',
      input_ts:        'Enter timestamp (seconds or milliseconds)',
      convert:         'Convert',
      use_now:         'Use Now',
      multi_format:    'Multi-format Output',
      input_ts_or_date:'Enter timestamp or date string',
      now:             'Now',
      clear:           'Clear',
      ts_sec:          'Unix (s)',
      ts_ms:           'Unix (ms)',
      local_time:      'Local Time',
      invalid_ts:      'Invalid timestamp',
      utc_time:        'UTC',
      iso_8601:        'ISO 8601',
      relative_time:   'Relative',
      full_date:       'Date',
      local_datetime:  'Local DateTime',
      date:            'Date',
      time:            'Time',
      readable:        'Readable',
      ts_sec_label:    'Timestamp (s)',
      ts_ms_label:     'Timestamp (ms)',
      utc_string:      'UTC String',
      cannot_parse:    'Cannot parse this time format',
      copy:            'Copy',
      just_now:        'Just now',
      min_ago:         ' min ago',
      min_later:       ' min later',
      hr_ago:          ' hr ago',
      hr_later:        ' hr later',
      day_ago:         ' day ago',
      day_later:       ' day later',
    },
  });
  window._tsTl = tl;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">${tl('current_time')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" id="tsPauseBtn" onclick="toggleTsPause()">${tl('pause')}</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px" id="tsLiveCards"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('ts_to_date')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="tsInput" placeholder="${tl('input_ts')}" style="flex:1">
        <button class="btn btn-primary" onclick="tsToDate()">${tl('convert')}</button>
        <button class="btn btn-secondary" onclick="tsUseNow()">${tl('use_now')}</button>
      </div>
      <div id="tsDateResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('date_to_ts')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="dateInput" type="datetime-local" style="flex:1">
        <button class="btn btn-primary" onclick="dateToTs()">${tl('convert')}</button>
      </div>
      <div id="tsFromDateResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('multi_format')}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="tool-input" id="tfInput" placeholder="${tl('input_ts_or_date')}" style="flex:1" oninput="doTimeFormat()">
        <button class="btn btn-secondary" onclick="document.getElementById('tfInput').value=Date.now();doTimeFormat()">${tl('now')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('tfInput').value='';document.getElementById('tfResult').style.display='none'">${tl('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="tfResult" style="display:none">
      <div id="tfCards"></div>
    </div>`;

  const dt = new Date();
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  document.getElementById('dateInput').value = dt.toISOString().slice(0,16);
  startTsClock();

  document.getElementById('tsInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); tsToDate(); }
  });
  document.getElementById('tfInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doTimeFormat(); }
  });
}

let _tsPaused = false, _tsTimer = null;

function _tsLocale() {
  return getCurrentLang() === 'en' ? 'en-US' : 'zh-CN';
}

function _renderLiveCards() {
  const tl = window._tsTl;
  const now = Date.now();
  const sec  = Math.floor(now / 1000);
  const cards = [
    { label: tl('ts_sec'), val: sec, color: 'var(--neon)' },
    { label: tl('ts_ms'),  val: now, color: '#f093fb' },
    { label: tl('local_time'), val: new Date().toLocaleString(_tsLocale()), color: 'var(--text)' },
    { label: 'ISO 8601',  val: new Date().toISOString(), color: '#67e8f9' },
  ];
  const container = document.getElementById('tsLiveCards');
  if (!container) return;
  container.innerHTML = cards.map(c => `
    <div style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:12px;display:flex;flex-direction:column;gap:4px">
      <div style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${c.label}</div>
      <div style="font-family:monospace;font-size:14px;font-weight:700;color:${c.color};word-break:break-all">${c.val}</div>
      <button class="copy-inline" style="align-self:flex-start;margin-top:2px" onclick="copyText('${c.val}',this)">${tl('copy')}</button>
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
  const tl = window._tsTl;
  _tsPaused = !_tsPaused;
  const btn = document.getElementById('tsPauseBtn');
  if (btn) btn.textContent = _tsPaused ? tl('resume') : tl('pause');
}

function tsUseNow() {
  document.getElementById('tsInput').value = Math.floor(Date.now()/1000);
  tsToDate();
}

function _padTwo(n) {
  return String(n).padStart(2, '0');
}

function tsToDate() {
  const tl = window._tsTl;
  const val = document.getElementById('tsInput').value.trim();
  if (!val) return;
  const num = parseFloat(val);
  const d = new Date(num > 1e10 ? num : num * 1000);
  if (isNaN(d.getTime())) {
    document.getElementById('tsDateResult').innerHTML = `<span style="color:#ef4444;font-size:13px">${tl('invalid_ts')}</span>`;
    return;
  }
  const locale = _tsLocale();
  const Y = d.getFullYear(), M = _padTwo(d.getMonth()+1), D = _padTwo(d.getDate());
  const h = _padTwo(d.getHours()), m = _padTwo(d.getMinutes()), s = _padTwo(d.getSeconds());
  const fmt = [
    { label: tl('utc_time'),       time: d.toUTCString() },
    { label: tl('local_time'),     time: d.toLocaleString(locale) },
    { label: tl('iso_8601'),       time: d.toISOString() },
    { label: tl('relative_time'),  time: relativeTime(d) },
    { label: tl('full_date'),      time: d.toLocaleDateString(locale,{year:'numeric',month:'long',day:'numeric',weekday:'long'}) },
    { label: tl('local_datetime'), time: `${Y}-${M}-${D} ${h}:${m}:${s}` },
    { label: tl('date'),           time: `${Y}-${M}-${D}` },
    { label: tl('time'),           time: `${h}:${m}:${s}` },
    { label: tl('readable'),       time: d.toLocaleString(locale,{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}) },
  ];
  document.getElementById('tsDateResult').innerHTML = fmt.map(z =>
    `<div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
      <span style="color:var(--text-muted);width:100px;flex-shrink:0;font-size:12px">${z.label}</span>
      <span style="font-weight:600;flex:1;font-size:13px">${z.time}</span>
      <button class="copy-inline" onclick="copyText('${z.time}',this)">${tl('copy')}</button>
    </div>`).join('');
}

function dateToTs() {
  const tl = window._tsTl;
  const val = document.getElementById('dateInput').value;
  if (!val) return;
  const d = new Date(val);
  const sec = Math.floor(d.getTime()/1000);
  const ms  = d.getTime();
  document.getElementById('tsFromDateResult').innerHTML = [
    { label: tl('ts_sec'), val: sec },
    { label: tl('ts_ms'),  val: ms },
  ].map(r => `<div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
    <span style="color:var(--text-muted);width:80px;flex-shrink:0;font-size:12px">${r.label}</span>
    <span style="font-weight:700;color:var(--neon);flex:1">${r.val}</span>
    <button class="copy-inline" onclick="copyText('${r.val}',this)">${tl('copy')}</button>
  </div>`).join('');
}

function relativeTime(d) {
  const tl = window._tsTl;
  const diff = Date.now() - d.getTime();
  const abs  = Math.abs(diff), future = diff < 0;
  if (abs < 60000)    return tl('just_now');
  if (abs < 3600000)  return Math.floor(abs/60000) + (future ? tl('min_later') : tl('min_ago'));
  if (abs < 86400000) return Math.floor(abs/3600000) + (future ? tl('hr_later') : tl('hr_ago'));
  return Math.floor(abs/86400000) + (future ? tl('day_later') : tl('day_ago'));
}

function doTimeFormat() {
  const tl = window._tsTl;
  const locale = _tsLocale();
  const raw = document.getElementById('tfInput').value.trim();
  if (!raw) return;
  let d;
  if (/^\d{10}$/.test(raw)) d = new Date(+raw * 1000);
  else if (/^\d{13}$/.test(raw)) d = new Date(+raw);
  else d = new Date(raw);
  if (isNaN(d.getTime())) {
    document.getElementById('tfCards').innerHTML = '<span style="color:#ef4444">' + tl('cannot_parse') + '</span>';
    document.getElementById('tfResult').style.display = '';
    return;
  }
  const Y = d.getFullYear(), M = _padTwo(d.getMonth()+1), D = _padTwo(d.getDate());
  const h = _padTwo(d.getHours()), m = _padTwo(d.getMinutes()), s = _padTwo(d.getSeconds());
  const rows = [
    [tl('ts_sec_label'), Math.floor(d.getTime()/1000)],
    [tl('ts_ms_label'), d.getTime()],
    [tl('iso_8601'), d.toISOString()],
    [tl('local_datetime'), `${Y}-${M}-${D} ${h}:${m}:${s}`],
    [tl('date'), `${Y}-${M}-${D}`],
    [tl('time'), `${h}:${m}:${s}`],
    [tl('utc_string'), d.toUTCString()],
    [tl('readable'), d.toLocaleString(locale,{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})],
  ];
  document.getElementById('tfCards').innerHTML = rows.map(([k,v]) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--glass-border)">
      <span style="font-size:12px;color:var(--text-muted);min-width:130px">${k}</span>
      <span style="font-size:13px;color:var(--text);font-family:monospace">${v}</span>
      <button onclick="copyText('${String(v).replace(/'/g,"\\'")}',this)" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:12px;padding:2px 6px">${tl('copy')}</button>
    </div>`
  ).join('');
  document.getElementById('tfResult').style.display = '';
}

// Backward compat alias: time-format tool now merged into timestamp
window.renderTimeFormat = function(el) { renderTimestamp(el); };
