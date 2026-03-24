function renderPomodoro(el) {
  // clean up any existing timer
  if (window._pomTimer) { clearInterval(window._pomTimer); window._pomTimer = null; }
  window._pomWork=25; window._pomBreak=5; window._pomSec=1500; window._pomTotal=1500;
  window._pomRunning=false; window._pomPhase='work'; window._pomCount=0;

  el.innerHTML = `
    <div class="tool-card-panel" style="text-align:center">
      <div class="panel-label" style="margin-bottom:16px">🍅 番茄钟计时器</div>
      <div style="display:flex;justify-content:center;gap:10px;margin-bottom:24px">
        <button class="btn btn-secondary" id="pom2505" onclick="pomSet(25,5)">25/5（标准）</button>
        <button class="btn btn-secondary" onclick="pomSet(50,10)">50/10（深度）</button>
        <button class="btn btn-secondary" onclick="pomSet(15,5)">15/5（短时）</button>
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
          <div id="pomPhase" style="font-size:12px;color:var(--text-muted);margin-top:6px">🍅 专注时间</div>
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:12px">
        <button class="btn btn-primary" id="pomStartBtn" onclick="pomToggle()">开始</button>
        <button class="btn btn-secondary" onclick="pomReset()">重置</button>
      </div>
      <div id="pomCount" style="margin-top:16px;font-size:13px;color:var(--text-muted)">完成番茄：0 个</div>
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
  if (window._pomRunning) {
    clearInterval(window._pomTimer); window._pomTimer=null; window._pomRunning=false;
    const btn=document.getElementById('pomStartBtn'); if(btn) btn.textContent='继续';
  } else {
    window._pomRunning=true;
    window._pomTimer=setInterval(_pomTick,1000);
    const btn=document.getElementById('pomStartBtn'); if(btn) btn.textContent='暂停';
  }
}

function pomReset() {
  if(window._pomTimer){clearInterval(window._pomTimer);window._pomTimer=null;}
  window._pomRunning=false; window._pomPhase='work';
  window._pomSec=window._pomWork*60; window._pomTotal=window._pomWork*60;
  const btn=document.getElementById('pomStartBtn'); if(btn) btn.textContent='开始';
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
      if(Notification.permission==='granted') new Notification('休息一下！',{body:'专注时间结束，休息'+window._pomBreak+'分钟'});
    } else {
      window._pomPhase='work';
      window._pomSec=window._pomWork*60;
      window._pomTotal=window._pomWork*60;
    }
  }
  _updatePomDisplay();
}

function _updatePomDisplay() {
  const m=Math.floor(window._pomSec/60),s=window._pomSec%60;
  const timeEl=document.getElementById('pomTime');
  if(timeEl) timeEl.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
  const ph=document.getElementById('pomPhase');
  if(ph) ph.textContent=window._pomPhase==='work'?'🍅 专注时间':'☕ 休息时间';
  const arc=document.getElementById('pomArc');
  if(arc){
    const pct=window._pomSec/window._pomTotal;
    arc.style.strokeDashoffset=502*(1-pct);
    arc.style.stroke=window._pomPhase==='work'?'var(--accent)':'#10b981';
  }
  const cnt=document.getElementById('pomCount');
  if(cnt) cnt.textContent='完成番茄：'+window._pomCount+' 个';
  // update page title when running
  if(window._pomRunning){
    const m2=Math.floor(window._pomSec/60),s2=window._pomSec%60;
    document.title=(window._pomPhase==='work'?'🍅 ':'☕ ')+String(m2).padStart(2,'0')+':'+String(s2).padStart(2,'0')+' - DevToolbox';
  } else {
    document.title='DevToolbox';
  }
}
