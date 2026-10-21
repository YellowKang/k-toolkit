const _pomDict = {
  zh: {
    title: '🍅 番茄钟计时器', standard: '25/5（标准）', deep: '50/10（深度）', short: '15/5（短时）', focus: '🍅 专注时间', rest: '☕ 休息时间',
    start: '开始', pause: '暂停', resume: '继续', reset: '重置', count: n => '完成番茄：' + n + ' 个',
    notify_title: '休息一下！', notify_body: n => '专注时间结束，休息' + n + '分钟',
  },
  en: {
    title: '🍅 Pomodoro timer', standard: '25/5 (standard)', deep: '50/10 (deep work)', short: '15/5 (short)', focus: '🍅 Focus', rest: '☕ Break',
    start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', count: n => `Pomodoros completed: ${n}`,
    notify_title: 'Time for a break!', notify_body: n => `Focus session done. Take ${n} minute${n === 1 ? '' : 's'} off.`,
  },
};

function renderPomodoro(el) {
  const T = makeToolI18n(_pomDict);
  // clean up any existing timer
  if (window._pomTimer) { clearInterval(window._pomTimer); window._pomTimer = null; }
  window._pomWork=25; window._pomBreak=5; window._pomSec=1500; window._pomTotal=1500;
  window._pomRunning=false; window._pomPhase='work'; window._pomCount=0;

  el.innerHTML = `
    <div class="tool-card-panel" style="text-align:center">
      <div class="panel-label" style="margin-bottom:16px">${T('title')}</div>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:24px">
        <button class="btn btn-secondary" id="pom2505" onclick="pomSet(25,5)">${T('standard')}</button>
        <button class="btn btn-secondary" onclick="pomSet(50,10)">${T('deep')}</button>
        <button class="btn btn-secondary" onclick="pomSet(15,5)">${T('short')}</button>
      </div>
      <div style="position:relative;display:inline-block;margin-bottom:24px">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
          <circle cx="90" cy="90" r="80" fill="none" stroke="var(--accent)" stroke-width="10"
            stroke-dasharray="502" stroke-dashoffset="0" stroke-linecap="round"
            transform="rotate(-90 90 90)" id="pomArc" style="transition:stroke-dashoffset 1s linear"/>
        </svg>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center">
          <div id="pomTime" style="font-size:38px;font-weight:800;color:var(--neon);line-height:1">25:00</div>
          <div id="pomPhase" style="font-size:12px;color:var(--text-muted);margin-top:6px">${T('focus')}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:12px">
        <button class="btn btn-primary" id="pomStartBtn" onclick="pomToggle()">${T('start')}</button>
        <button class="btn btn-secondary" onclick="pomReset()">${T('reset')}</button>
      </div>
      <div id="pomCount" style="margin-top:16px;font-size:13px;color:var(--text-muted)">${T('count', 0)}</div>
    </div>`;
  _updatePomDisplay();

  window._activeCleanup = function() {
    if (window._pomTimer) { clearInterval(window._pomTimer); window._pomTimer = null; }
    window._pomRunning = false;
    document.title = 'DevToolbox';
  };
}

function pomSet(w,b) {
  pomReset();
  window._pomWork=w; window._pomBreak=b;
  window._pomSec=w*60; window._pomTotal=w*60;
  _updatePomDisplay();
}

function pomToggle() {
  const T = makeToolI18n(_pomDict);
  if (window._pomRunning) {
    clearInterval(window._pomTimer); window._pomTimer=null; window._pomRunning=false;
    const btn=document.getElementById('pomStartBtn'); if(btn) btn.textContent=T('resume');
  } else {
    window._pomRunning=true;
    window._pomTimer=setInterval(_pomTick,1000);
    const btn=document.getElementById('pomStartBtn'); if(btn) btn.textContent=T('pause');
  }
}

function pomReset() {
  if(window._pomTimer){clearInterval(window._pomTimer);window._pomTimer=null;}
  window._pomRunning=false; window._pomPhase='work';
  window._pomSec=window._pomWork*60; window._pomTotal=window._pomWork*60;
  const btn=document.getElementById('pomStartBtn'); if(btn) btn.textContent=makeToolI18n(_pomDict)('start');
  _updatePomDisplay();
}

function _pomTick() {
  window._pomSec--;
  if (window._pomSec<=0) {
    if(window._pomPhase==='work'){
      window._pomCount++;
      window._pomPhase='break';
      window._pomSec=window._pomBreak*60;
      window._pomTotal=window._pomBreak*60;
      const T = makeToolI18n(_pomDict);
      if(Notification.permission==='granted') new Notification(T('notify_title'),{body:T('notify_body', window._pomBreak)});
    } else {
      window._pomPhase='work';
      window._pomSec=window._pomWork*60;
      window._pomTotal=window._pomWork*60;
    }
  }
  _updatePomDisplay();
}

function _updatePomDisplay() {
  const T = makeToolI18n(_pomDict);
  const m=Math.floor(window._pomSec/60),s=window._pomSec%60;
  const timeEl=document.getElementById('pomTime');
  if(timeEl) timeEl.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  const ph=document.getElementById('pomPhase');
  if(ph) ph.textContent=window._pomPhase==='work'?T('focus'):T('rest');
  const arc=document.getElementById('pomArc');
  if(arc){
    const pct=window._pomSec/window._pomTotal;
    arc.style.strokeDashoffset=502*(1-pct);
    arc.style.stroke=window._pomPhase==='work'?'var(--accent)':'#10b981';
  }
  const cnt=document.getElementById('pomCount');
  if(cnt) cnt.textContent=T('count', window._pomCount);
  // update page title when running
  if(window._pomRunning){
    const m2=Math.floor(window._pomSec/60),s2=window._pomSec%60;
    document.title=(window._pomPhase==='work'?'🍅 ':'☕ ')+String(m2).padStart(2,'0')+':'+String(s2).padStart(2,'0')+' - DevToolbox';
  } else {
    document.title='DevToolbox';
  }
}
