const _swDict = {
  zh: { title: '秒表', start: '开始', pause: '暂停', resume: '继续', lap: '计次', reset: '重置', laps: '计次记录' },
  en: { title: 'Stopwatch', start: 'Start', pause: 'Pause', resume: 'Resume', lap: 'Lap', reset: 'Reset', laps: 'Laps' },
};

const _swState = { elapsed: 0, startAt: 0, running: false, laps: [] };
const _swElapsed = () => _swState.running ? Date.now() - _swState.startAt : _swState.elapsed;
let _swActivityTimer = null;
function _swFmt(ms) {
  return String(Math.floor(ms / 60000)).padStart(2,'0') + ':' + String(Math.floor(ms % 60000 / 1000)).padStart(2,'0') + '.' + String(ms % 1000).padStart(3,'0');
}
function _swActivity() {
  window.ToolActivity?.update('stopwatch', '⏱ ' + _swFmt(_swElapsed()).split('.')[0], _swState.running);
}
window.renderStopwatch = function(el) {
  const T = makeToolI18n(_swDict);
  el.innerHTML = `
    <div class="tool-card-panel" style="text-align:center">
      <div class="panel-label">${T('title')}</div>
      <div id="swDisplay" style="font-size:52px;font-weight:800;color:var(--neon);font-variant-numeric:tabular-nums;letter-spacing:.04em;margin:18px 0">00:00.000</div>
      <div class="tool-actions" style="justify-content:center">
        <button class="btn btn-primary"  id="swBtnStart" onclick="_swToggle()">${T('start')}</button>
        <button class="btn btn-secondary" onclick="_swLap()" id="swBtnLap" disabled>${T('lap')}</button>
        <button class="btn btn-secondary" onclick="_swReset()">${T('reset')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="swLapPanel" style="display:none">
      <div class="panel-label">${T('laps')}</div>
      <div id="swLapList" style="max-height:260px;overflow-y:auto"></div>
    </div>`;

  let timer = null;
  const state = _swState;
  let laps = state.laps;

  window._swToggle = function() {
    if (!state.running) {
      state.startAt = Date.now() - state.elapsed;
      timer = setInterval(update, 50);
      state.running = true;
      _swActivityTimer = setInterval(_swActivity, 1000);
      _swActivity();
      document.getElementById('swBtnStart').textContent = T('pause');
      document.getElementById('swBtnStart').className = 'btn btn-secondary';
      document.getElementById('swBtnLap').disabled = false;
      window._activeCleanup = () => clearInterval(timer);
    } else {
      clearInterval(timer); timer = null;
      state.elapsed = _swElapsed(); state.running = false;
      clearInterval(_swActivityTimer); _swActivityTimer = null;
      document.getElementById('swBtnStart').textContent = T('resume');
      document.getElementById('swBtnStart').className = 'btn btn-primary';
      document.getElementById('swBtnLap').disabled = true;
      update();
      window.ToolActivity?.update('stopwatch', '', false);
    }
  };

  window._swLap = function() {
    if (!state.running) return;
    const lapTime = _swElapsed();
    const prev = laps.length ? laps[laps.length-1].abs : 0;
    laps.push({ abs: lapTime, split: lapTime - prev });
    renderLaps();
  };

  function renderLaps() {
    const panel = document.getElementById('swLapPanel');
    panel.style.display = laps.length ? '' : 'none';
    document.getElementById('swLapList').innerHTML = laps.slice().reverse().map((l,i) => {
      const n = laps.length - i;
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--glass-border);font-variant-numeric:tabular-nums">
        <span style="color:var(--text-muted);font-size:12px">${T('lap')} ${n}</span>
        <span style="font-size:13px;color:var(--text-muted)">${_swFmt(l.split)}</span>
        <span style="font-size:14px;font-weight:700;color:var(--neon)">${_swFmt(l.abs)}</span>
      </div>`;
    }).join('');
  }

  window._swReset = function() {
    clearInterval(timer); timer = null;
    clearInterval(_swActivityTimer); _swActivityTimer = null;
    state.running = false; state.elapsed = 0; state.laps = []; laps = state.laps;
    window.ToolActivity?.update('stopwatch', '', false);
    document.getElementById('swDisplay').textContent = '00:00.000';
    document.getElementById('swBtnStart').textContent = T('start');
    document.getElementById('swBtnStart').className = 'btn btn-primary';
    document.getElementById('swBtnLap').disabled = true;
    document.getElementById('swLapPanel').style.display = 'none';
    document.getElementById('swLapList').innerHTML = '';
  };

  function update() {
    document.getElementById('swDisplay').textContent = _swFmt(_swElapsed());
  }
  update(); renderLaps(); _swActivity();
  document.getElementById('swBtnStart').textContent = T(state.running ? 'pause' : state.elapsed ? 'resume' : 'start');
  document.getElementById('swBtnStart').className = state.running ? 'btn btn-secondary' : 'btn btn-primary';
  document.getElementById('swBtnLap').disabled = !state.running;
  if (state.running) timer = setInterval(update, 50);
  window._activeCleanup = () => clearInterval(timer);
};
