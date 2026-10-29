const _stDict = {
  zh: {
    download_speed: '下载速度', upload_speed: '上传速度', ping: '延迟', download: '下载', upload: '上传', start: '开始测速', stop: '停止',
    testing_ping: '正在测试延迟...', timeout: '超时', testing_dl: '正在测试下载速度...', unreachable: '网络不可达，请检查连接',
    testing_ul: '正在测试上传速度...', done: '测速完成', upload_failed: '下载已完成，上传测试失败，请重试。',
  },
  en: {
    download_speed: 'Download speed', upload_speed: 'Upload speed', ping: 'Ping', download: 'Download', upload: 'Upload', start: 'Start test', stop: 'Stop',
    testing_ping: 'Measuring ping...', timeout: 'Timeout', testing_dl: 'Measuring download speed...', unreachable: 'Network unreachable. Check your connection.',
    testing_ul: 'Measuring upload speed...', done: 'Test complete', upload_failed: 'Download complete; upload test failed. Please retry.',
  },
};

window.renderSpeedTest = function(el) {
  const T = makeToolI18n(_stDict);
  window._activeCleanup = stStop;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="text-align:center;padding:24px 0 16px">
        <div id="stGauge" style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:180px;height:180px">
          <svg width="180" height="180" style="position:absolute;top:0;left:0">
            <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14"/>
            <circle id="stArc" cx="90" cy="90" r="78" fill="none"
              stroke="url(#stGrad)" stroke-width="14" stroke-linecap="round"
              stroke-dasharray="490" stroke-dashoffset="490"
              transform="rotate(-90 90 90)" style="transition:stroke-dashoffset 0.4s ease"/>
            <defs>
              <linearGradient id="stGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="var(--accent)"/>
                <stop offset="100%" stop-color="var(--accent-blue)"/>
              </linearGradient>
            </defs>
          </svg>
          <div style="text-align:center;z-index:1">
            <div id="stVal" style="font-size:36px;font-weight:700;color:var(--text);line-height:1">--</div>
            <div id="stUnit" style="font-size:13px;color:var(--text-muted);margin-top:4px">Mbps</div>
            <div id="stLabel" style="font-size:11px;color:var(--text-muted);margin-top:2px">${T('download_speed')}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:32px;margin-bottom:20px">
        <div style="text-align:center">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${T('ping')}</div>
          <div id="stPing" style="font-size:20px;font-weight:700;color:var(--text)">--</div>
          <div style="font-size:11px;color:var(--text-muted)">ms</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${T('download')}</div>
          <div id="stDl" style="font-size:20px;font-weight:700;color:#10b981">--</div>
          <div style="font-size:11px;color:var(--text-muted)">Mbps</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${T('upload')}</div>
          <div id="stUl" style="font-size:20px;font-weight:700;color:var(--accent)">--</div>
          <div style="font-size:11px;color:var(--text-muted)">Mbps</div>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:16px">
        <div id="stStatus" style="font-size:12px;color:var(--text-muted);min-height:18px"></div>
      </div>
      <div style="display:flex;justify-content:center;gap:10px">
        <button class="btn btn-primary" id="stStartBtn" onclick="stStart()">${T('start')}</button>
        <button class="btn btn-secondary" id="stStopBtn" onclick="stStop()" style="display:none">${T('stop')}</button>
      </div>
    </div>`;
};

let _stRunning = false, _stAbort = null, _stRunId = 0;
const _stCurrent = id => _stRunning && id === _stRunId;

function stStart() {
  if (_stRunning) return;
  _stRunning = true;
  const startBtn = document.getElementById('stStartBtn');
  const stopBtn = document.getElementById('stStopBtn');
  if (startBtn) startBtn.style.display = 'none';
  if (stopBtn) stopBtn.style.display = '';
  _stReset();
  _stRunSeq(++_stRunId);
}

function stStop() {
  _stRunId++;
  _stRunning = false;
  if (_stAbort) { _stAbort.abort(); _stAbort = null; }
  const startBtn = document.getElementById('stStartBtn');
  const stopBtn = document.getElementById('stStopBtn');
  if (startBtn) startBtn.style.display = '';
  if (stopBtn) stopBtn.style.display = 'none';
  _stStatus('');
}

function _stReset() {
  const T = makeToolI18n(_stDict);
  ['stPing','stDl','stUl'].forEach(id => { const e = document.getElementById(id); if(e) e.textContent='--'; });
  _stSetGauge(0, '--', 'Mbps', T('download_speed'));
}

async function _stRunSeq(id) {
  const T = makeToolI18n(_stDict);
  // 1. 延迟测试
  _stStatus(T('testing_ping'));
  const ping = await _stMeasurePing(id);
  if (!_stCurrent(id)) return;
  const pe = document.getElementById('stPing');
  if (pe) pe.textContent = ping < 0 ? T('timeout') : ping;

  // 2. 下载测试
  _stStatus(T('testing_dl'));
  _stSetGauge(0, '0', 'Mbps', T('download_speed'));
  const dl = await _stMeasureDownload(id);
  if (!_stCurrent(id)) return;
  if (dl < 0) {
    _stStatus(T('unreachable'));
    _stSetGauge(0, '--', 'Mbps', T('download_speed'));
    const sb = document.getElementById('stStartBtn');
    const tb = document.getElementById('stStopBtn');
    if (sb) sb.style.display = '';
    if (tb) tb.style.display = 'none';
    _stRunning = false;
    return;
  }
  const de = document.getElementById('stDl');
  if (de) de.textContent = dl.toFixed(1);
  _stSetGauge(Math.min(dl / 100, 1), dl.toFixed(1), 'Mbps', T('download_speed'));

  // 3. 上传测试
  _stStatus(T('testing_ul'));
  _stSetGauge(0, '0', 'Mbps', T('upload_speed'));
  const ul = await _stMeasureUpload(id);
  if (!_stCurrent(id)) return;
  const ue = document.getElementById('stUl');
  if (ue) ue.textContent = ul < 0 ? '--' : ul.toFixed(1);
  if (ul >= 0) _stSetGauge(Math.min(ul / 100, 1), ul.toFixed(1), 'Mbps', T('upload_speed'));

  _stStatus(T(ul < 0 ? 'upload_failed' : 'done'));
  const sb2 = document.getElementById('stStartBtn');
  const tb2 = document.getElementById('stStopBtn');
  if (sb2) sb2.style.display = '';
  if (tb2) tb2.style.display = 'none';
  _stRunning = false;
}

// Each request owns its timeout/controller; a stopped run cannot abort or update a newer run.
async function _stRequest(id, url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  if (!_stCurrent(id)) throw new Error('Cancelled');
  _stAbort = controller;
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const started = performance.now();
    const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.arrayBuffer();
    if (!_stCurrent(id) || controller.signal.aborted) throw new Error('Cancelled');
    return { bytes: data.byteLength, ms: Math.max(performance.now() - started, 1) };
  } finally {
    clearTimeout(timer);
    if (_stAbort === controller) _stAbort = null;
  }
}

async function _stMeasurePing(id = _stRunId) {
  const samples = [];
  for (let i = 0; i < 4; i++) {
    if (!_stCurrent(id)) return -1;
    try {
      const sample = await _stRequest(id, `https://speed.cloudflare.com/__down?bytes=0&t=${Date.now()}`, {}, 3000);
      samples.push(sample.ms);
    } catch { /* Missing samples are failures, never zero-latency successes. */ }
    if (_stCurrent(id)) await _stSleep(200);
  }
  return _stCurrent(id) && samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : -1;
}

async function _stMeasureDownload(id = _stRunId) {
  const T = makeToolI18n(_stDict);
  let totalBits = 0, totalMs = 0;
  for (const size of [1e6, 5e6]) {
    if (!_stCurrent(id)) return -1;
    try {
      const sample = await _stRequest(id, `https://speed.cloudflare.com/__down?bytes=${size}&t=${Date.now()}`);
      if (!sample.bytes) return -1;
      totalBits += sample.bytes * 8;
      totalMs += sample.ms;
      const cur = (totalBits / totalMs / 1000).toFixed(1);
      _stSetGauge(Math.min(+cur / 100, 1), cur, 'Mbps', T('download_speed'));
    } catch { return -1; }
  }
  return _stCurrent(id) && totalMs > 0 ? totalBits / totalMs / 1000 : -1;
}

async function _stMeasureUpload(id = _stRunId) {
  const T = makeToolI18n(_stDict);
  let totalBits = 0, totalMs = 0;
  for (const size of [500e3, 2e6]) {
    if (!_stCurrent(id)) return -1;
    const body = new Uint8Array(size);
    try {
      const sample = await _stRequest(id, `https://speed.cloudflare.com/__up?t=${Date.now()}`, { method: 'POST', body });
      totalBits += body.byteLength * 8;
      totalMs += sample.ms;
      const cur = (totalBits / totalMs / 1000).toFixed(1);
      _stSetGauge(Math.min(+cur / 100, 1), cur, 'Mbps', T('upload_speed'));
    } catch { return -1; }
  }
  return _stCurrent(id) && totalMs > 0 ? totalBits / totalMs / 1000 : -1;
}

function _stSetGauge(ratio, val, unit, label) {
  const arc = document.getElementById('stArc');
  const ve = document.getElementById('stVal');
  const ue = document.getElementById('stUnit');
  const le = document.getElementById('stLabel');
  if (arc) arc.style.strokeDashoffset = 490 - 490 * Math.max(0, Math.min(1, ratio));
  if (ve) ve.textContent = val;
  if (ue) ue.textContent = unit;
  if (le) le.textContent = label;
}

function _stStatus(msg) {
  const el = document.getElementById('stStatus');
  if (el) el.textContent = msg;
}

function _stSleep(ms) { return new Promise(r => setTimeout(r, ms)); }
