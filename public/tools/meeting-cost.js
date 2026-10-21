const _mcDict = {
  zh: {
    title: '会议费用计算器', people: '参会人数', hourly: '默认时薪（元）', roles: '角色分级（可选，留空则用默认时薪）', add_role: '+ 添加角色',
    start: '开始计费', resume: '继续计费', pause: '暂停', reset: '重置', save: '保存记录', history: '历史记录', clear: '清空',
    role_name_ph: '角色名（如 PM）', role_count_ph: '人数', role_hourly_ph: '时薪', role_default: i => '角色' + i,
    start_first: '请先开始计费', saved: '记录已保存',
  },
  en: {
    title: 'Meeting cost calculator', people: 'Attendees', hourly: 'Default hourly rate (CNY)', roles: 'Roles (optional; otherwise the default rate applies)', add_role: '+ Add role',
    start: 'Start meter', resume: 'Resume', pause: 'Pause', reset: 'Reset', save: 'Save record', history: 'History', clear: 'Clear',
    role_name_ph: 'Role name (e.g. PM)', role_count_ph: 'Count', role_hourly_ph: 'Rate', role_default: i => 'Role ' + i,
    start_first: 'Start the meter first', saved: 'Record saved',
  },
};

function renderMeetingCost(el) {
  const T = makeToolI18n(_mcDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('people')}</label><input class="tool-input" id="mcPeople" type="number" value="5" min="1" oninput="mcUpdate()"></div>
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('hourly')}</label><input class="tool-input" id="mcHourly" type="number" value="100" oninput="mcUpdate()"></div>
      </div>
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:12px;color:var(--text-muted);font-weight:600">${T('roles')}</span>
          <button class="btn btn-secondary" onclick="mcAddRole()" style="font-size:12px;padding:3px 10px">${T('add_role')}</button>
        </div>
        <div id="mcRoles" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>
      <div style="text-align:center;margin-bottom:20px">
        <div id="mcDisplay" style="font-size:48px;font-weight:800;color:var(--neon);line-height:1">¥0.00</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px" id="mcTime">00:00:00</div>
        <div id="mcBreakdown" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
      </div>
      <div style="display:flex;justify-content:center;gap:12px">
        <button class="btn btn-primary" id="mcStartBtn" onclick="mcToggle()">${T('start')}</button>
        <button class="btn btn-secondary" onclick="mcReset()">${T('reset')}</button>
        <button class="btn btn-secondary" onclick="mcSaveRecord()">${T('save')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="mcHistoryPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('history')}</div>
        <button class="btn btn-secondary" onclick="mcClearHistory()" style="font-size:12px">${T('clear')}</button>
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
  const T = makeToolI18n(_mcDict);
  const id = ++window._mcRoleCount;
  const div = document.createElement('div');
  div.id = 'mcRole_' + id;
  div.style.cssText = 'display:flex;gap:8px;align-items:center';
  div.innerHTML = `
    <input class="tool-input" placeholder="${T('role_name_ph')}" style="flex:1" id="mcRoleName_${id}">
    <input class="tool-input" type="number" placeholder="${T('role_count_ph')}" style="width:70px" id="mcRoleCount_${id}" value="1" min="1" oninput="mcUpdate()">
    <input class="tool-input" type="number" placeholder="${T('role_hourly_ph')}" style="width:80px" id="mcRoleHourly_${id}" value="100" oninput="mcUpdate()">
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
      const name = (document.getElementById('mcRoleName_' + i) || {}).value || makeToolI18n(_mcDict)('role_default', i);
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
  const T = makeToolI18n(_mcDict);
  if (window._mcRunning) {
    clearInterval(window._mcTimer);
    window._mcRunning = false;
    document.getElementById('mcStartBtn').textContent = T('resume');
  } else {
    window._mcRunning = true;
    document.getElementById('mcStartBtn').textContent = T('pause');
    window._mcTimer = setInterval(() => {
      window._mcSec++;
      mcUpdate();
      const h = Math.floor(window._mcSec / 3600);
      const m = Math.floor(window._mcSec % 3600 / 60);
      const s = window._mcSec % 60;
      const t = document.getElementById('mcTime');
      if (t) t.textContent = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    }, 1000);
  }
}

function mcReset() {
  clearInterval(window._mcTimer);
  window._mcRunning = false;
  window._mcSec = 0;
  const b = document.getElementById('mcStartBtn');
  if (b) b.textContent = makeToolI18n(_mcDict)('start');
  const t = document.getElementById('mcTime');
  if (t) t.textContent = '00:00:00';
  mcUpdate();
}

function mcSaveRecord() {
  const T = makeToolI18n(_mcDict);
  const sec = window._mcSec || 0;
  if (sec === 0) { showToast(T('start_first'), 'info'); return; }
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  const duration = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  const cost = (window._mcLastTotal || 0).toFixed(2);
  const records = JSON.parse(localStorage.getItem('dtb_mc_history') || '[]');
  records.unshift({ time: new Date().toLocaleString(), duration, cost });
  localStorage.setItem('dtb_mc_history', JSON.stringify(records.slice(0, 20)));
  mcRenderHistory();
  showToast(T('saved'), 'success');
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
      <span style="color:var(--text-muted)">${escHtml(r.time)}</span>
      <span style="color:var(--text)">${escHtml(r.duration)}</span>
      <span style="color:var(--neon);font-weight:700">¥${escHtml(r.cost)}</span>
    </div>`
  ).join('');
}

function mcClearHistory() {
  localStorage.removeItem('dtb_mc_history');
  mcRenderHistory();
}
// _activeCleanup is set in renderMeetingCost and covers mcToggle's timer
