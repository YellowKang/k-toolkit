function renderMeetingCost(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">会议费用计算器</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">参会人数</label><input class="tool-input" id="mcPeople" type="number" value="5" min="1" oninput="mcUpdate()"></div>
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">默认时薪（元）</label><input class="tool-input" id="mcHourly" type="number" value="100" oninput="mcUpdate()"></div>
      </div>
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--text-muted);font-weight:600">角色分级（可选，留空则用默认时薪）</span>
          <button class="btn btn-secondary" onclick="mcAddRole()" style="font-size:12px;padding:3px 10px">+ 添加角色</button>
        </div>
        <div id="mcRoles" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>
      <div style="text-align:center;margin-bottom:20px">
        <div id="mcDisplay" style="font-size:48px;font-weight:800;color:var(--neon);line-height:1">¥0.00</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px" id="mcTime">00:00:00</div>
        <div id="mcBreakdown" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
      </div>
      <div style="display:flex;justify-content:center;gap:12px">
        <button class="btn btn-primary" id="mcStartBtn" onclick="mcToggle()">开始计费</button>
        <button class="btn btn-secondary" onclick="mcReset()">重置</button>
        <button class="btn btn-secondary" onclick="mcSaveRecord()">保存记录</button>
      </div>
    </div>
    <div class="tool-card-panel" id="mcHistoryPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">历史记录</div>
        <button class="btn btn-secondary" onclick="mcClearHistory()" style="font-size:12px">清空</button>
      </div>
      <div id="mcHistoryList"></div>
    </div>`;

  window._mcRunning = false;
  window._mcSec = 0;
  window._mcTimer = null;
  window._mcRoleCount = 0;
  mcRenderHistory();

  window._activeCleanup = function() {
    if (window._mcTimer) { clearInterval(window._mcTimer); window._mcTimer = null; }
    window._mcRunning = false;
  };
}

function mcAddRole() {
  const id = ++window._mcRoleCount;
  const div = document.createElement('div');
  div.id = 'mcRole_' + id;
  div.style.cssText = 'display:flex;gap:8px;align-items:center';
  div.innerHTML = `
    <input class="tool-input" placeholder="角色名（如 PM）" style="flex:1" id="mcRoleName_${id}">
    <input class="tool-input" type="number" placeholder="人数" style="width:70px" id="mcRoleCount_${id}" value="1" min="1" oninput="mcUpdate()">
    <input class="tool-input" type="number" placeholder="时薪" style="width:80px" id="mcRoleHourly_${id}" value="100" oninput="mcUpdate()">
    <button onclick="document.getElementById('mcRole_${id}').remove();mcUpdate()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:16px;padding:0 4px">×</button>`;
  document.getElementById('mcRoles').appendChild(div);
}

function mcUpdate() {
  const sec = window._mcSec || 0;
  const hours = sec / 3600;
  const roles = document.getElementById('mcRoles');
  let total = 0, breakdown = [];
  if (roles && roles.children.length > 0) {
    [...roles.children].forEach(row => {
      const idMatch = row.id.match(/mcRole_(\d+)/);
      if (!idMatch) return;
      const i = idMatch[1];
      const name = (document.getElementById('mcRoleName_' + i) || {}).value || '角色' + i;
      const cnt = parseInt((document.getElementById('mcRoleCount_' + i) || {}).value) || 1;
      const hourly = parseFloat((document.getElementById('mcRoleHourly_' + i) || {}).value) || 0;
      const cost = hours * hourly * cnt;
      total += cost;
      breakdown.push(`${name}×${cnt}: ¥${cost.toFixed(2)}`);
    });
  } else {
    const hourly = parseFloat((document.getElementById('mcHourly') || {}).value) || 0;
    const people = parseInt((document.getElementById('mcPeople') || {}).value) || 1;
    total = hours * hourly * people;
  }
  const el = document.getElementById('mcDisplay');
  if (el) el.textContent = '¥' + total.toFixed(2);
  const bd = document.getElementById('mcBreakdown');
  if (bd) bd.textContent = breakdown.join('  |  ');
  window._mcLastTotal = total;
}

function mcToggle() {
  if (window._mcRunning) {
    clearInterval(window._mcTimer);
    window._mcRunning = false;
    document.getElementById('mcStartBtn').textContent = '继续计费';
  } else {
    window._mcRunning = true;
    document.getElementById('mcStartBtn').textContent = '暂停';
    window._mcTimer = setInterval(() => {
      window._mcSec++;
      mcUpdate();
      const h = Math.floor(window._mcSec / 3600);
      const m = Math.floor(window._mcSec % 3600 / 60);
      const s = window._mcSec % 60;
      const t = document.getElementById('mcTime');
      if (t) t.textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    }, 1000);
    window._activeCleanup = () => clearInterval(window._mcTimer);
  }
}

function mcReset() {
  clearInterval(window._mcTimer);
  window._mcRunning = false;
  window._mcSec = 0;
  const b = document.getElementById('mcStartBtn');
  if (b) b.textContent = '开始计费';
  const t = document.getElementById('mcTime');
  if (t) t.textContent = '00:00:00';
  mcUpdate();
}

function mcSaveRecord() {
  const sec = window._mcSec || 0;
  if (sec === 0) { showToast('请先开始计费', 'info'); return; }
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  const duration = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  const cost = (window._mcLastTotal || 0).toFixed(2);
  const records = JSON.parse(localStorage.getItem('dtb_mc_history') || '[]');
  records.unshift({ time: new Date().toLocaleString(), duration, cost });
  localStorage.setItem('dtb_mc_history', JSON.stringify(records.slice(0, 20)));
  mcRenderHistory();
  showToast('记录已保存', 'success');
}

function mcRenderHistory() {
  const records = JSON.parse(localStorage.getItem('dtb_mc_history') || '[]');
  const panel = document.getElementById('mcHistoryPanel');
  const list = document.getElementById('mcHistoryList');
  if (!panel || !list) return;
  if (!records.length) { panel.style.display = 'none'; return; }
  panel.style.display = '';
  list.innerHTML = records.map(r =>
    `<div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--surface);border-radius:8px;margin-bottom:6px;font-size:13px">
      <span style="color:var(--text-muted)">${r.time}</span>
      <span style="color:var(--text)">${r.duration}</span>
      <span style="color:var(--neon);font-weight:700">¥${r.cost}</span>
    </div>`
  ).join('');
}

function mcClearHistory() {
  localStorage.removeItem('dtb_mc_history');
  mcRenderHistory();
}
// _activeCleanup is set inside mcToggle() when the timer starts
