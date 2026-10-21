const _cdDict = {
  zh: {
    title: '倒计时生成器', target: '目标时间', name: '事件名称', name_ph: '如：春节、发布日...', start: '开始倒计时', stop: '停止', save: '保存',
    saved_title: '已保存倒计时', none_saved: '暂无保存', load: '加载', saved: '已保存', default_name: '目标时间',
    presets: ['元旦', '春节', '劳动节', '国庆节', '圣诞节'], units: ['天', '时', '分', '秒'], past: '已过去 ↑', left: '距目标还有 ↑',
    summary: (past, d, h) => past ? `已过 ${d}天${h}时` : `还有 ${d}天${h}时`,
  },
  en: {
    title: 'Countdown', target: 'Target time', name: 'Event name', name_ph: 'e.g. Spring Festival, launch day...', start: 'Start countdown', stop: 'Stop', save: 'Save',
    saved_title: 'Saved countdowns', none_saved: 'Nothing saved yet', load: 'Load', saved: 'Saved', default_name: 'Target time',
    presets: ['New Year', 'Spring Festival', 'Labor Day', 'National Day', 'Christmas'], units: ['Days', 'Hours', 'Minutes', 'Seconds'], past: 'Since the target ↑', left: 'Until the target ↑',
    summary: (past, d, h) => past ? `${d}d ${h}h ago` : `in ${d}d ${h}h`,
  },
};

function renderCountdown(el) {
  const T = makeToolI18n(_cdDict);
  const names = T('presets');
  const PRESETS = [
    { label: names[0], date: () => { const y = new Date().getFullYear(); return `${y+1}-01-01T00:00`; } },
    { label: names[1], date: () => { const y = new Date().getFullYear(); return `${y+1}-01-29T00:00`; } },
    { label: names[2], date: () => { const n=new Date(),y=n.getFullYear(); const d=new Date(`${y}-05-01`); return `${d>n?y:y+1}-05-01T00:00`; } },
    { label: names[3], date: () => { const n=new Date(),y=n.getFullYear(); const d=new Date(`${y}-10-01`); return `${d>n?y:y+1}-10-01T00:00`; } },
    { label: names[4], date: () => { const n=new Date(),y=n.getFullYear(); const d=new Date(`${y}-12-25`); return `${d>n?y:y+1}-12-25T00:00`; } },
  ];
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('title')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        ${PRESETS.map(p => `<button class="btn btn-secondary" style="font-size:12px" onclick="cdPreset('${p.label}','${p.date()}')">&#128197; ${p.label}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('target')}</label><input class="tool-input" id="cdTarget" type="datetime-local"></div>
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('name')}</label><input class="tool-input" id="cdName" placeholder="${T('name_ph')}"></div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="cdStart()">${T('start')}</button>
        <button class="btn btn-secondary" onclick="cdStop()">${T('stop')}</button>
        <button class="btn btn-secondary" onclick="cdSave()">${T('save')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="cdDisplay" style="display:none;text-align:center">
      <div id="cdName2" style="font-size:14px;color:var(--text-muted);margin-bottom:16px"></div>
      <div style="display:flex;justify-content:center;gap:16px" id="cdUnits"></div>
      <div id="cdMsg" style="margin-top:16px;font-size:14px;color:var(--accent)"></div>
    </div>
    <div class="tool-card-panel" id="cdSavedPanel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('saved_title')}</div>
      </div>
      <div id="cdSavedList"></div>
    </div>`;

  const now = new Date(); now.setDate(now.getDate()+7);
  now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  document.getElementById('cdTarget').value = now.toISOString().slice(0,16);
  cdRenderSaved();
}

let _cdTimer = null;

function cdPreset(name, date) {
  document.getElementById('cdTarget').value = date;
  document.getElementById('cdName').value = name;
}

function cdStart() {
  cdStop();
  const target = new Date(document.getElementById('cdTarget').value);
  if (isNaN(target)) return;
  const name = document.getElementById('cdName').value || makeToolI18n(_cdDict)('default_name');
  document.getElementById('cdName2').textContent = name;
  document.getElementById('cdDisplay').style.display = '';
  _cdTimer = setInterval(() => _cdTick(target), 1000);
  _cdTick(target);
  window._activeCleanup = cdStop;
}

function cdStop() { if (_cdTimer) { clearInterval(_cdTimer); _cdTimer = null; } }

function _cdTick(target) {
  const diff = target - Date.now();
  const past = diff < 0;
  const abs = Math.abs(diff);
  const d = Math.floor(abs/86400000);
  const h = Math.floor(abs%86400000/3600000);
  const m = Math.floor(abs%3600000/60000);
  const s = Math.floor(abs%60000/1000);
  const T = makeToolI18n(_cdDict);
  const units = [d, h, m, s].map((v, i) => [v, T('units')[i]]);
  document.getElementById('cdUnits').innerHTML = units.map(([v,l]) =>
    `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 20px;min-width:70px">
      <div style="font-size:32px;font-weight:800;color:var(--neon);font-variant-numeric:tabular-nums">${String(v).padStart(2,'0')}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${l}</div>
    </div>`).join('');
  document.getElementById('cdMsg').textContent = past ? T('past') : T('left');
}

function cdSave() {
  const T = makeToolI18n(_cdDict);
  const target = document.getElementById('cdTarget').value;
  const name = document.getElementById('cdName').value || T('default_name');
  if (!target) return;
  const list = JSON.parse(localStorage.getItem('dtb_countdowns') || '[]');
  list.unshift({ name, target, saved: Date.now() });
  localStorage.setItem('dtb_countdowns', JSON.stringify(list.slice(0, 10)));
  cdRenderSaved();
  showToast(T('saved'));
}

function cdRenderSaved() {
  const T = makeToolI18n(_cdDict);
  const el = document.getElementById('cdSavedList');
  if (!el) return;
  let list = [];
  try { list = JSON.parse(localStorage.getItem('dtb_countdowns') || '[]'); } catch {}
  if (!Array.isArray(list) || !list.length) { el.innerHTML = `<span style="color:var(--text-muted);font-size:12px">${T('none_saved')}</span>`; return; }
  el.innerHTML = list.map((item, i) => {
    const diff = new Date(item.target) - Date.now();
    const past = diff < 0;
    const abs = Math.abs(diff);
    const d = Math.floor(abs/86400000);
    const h = Math.floor(abs%86400000/3600000);
    const summary = T('summary', past, d, h);
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--surface);margin-bottom:6px">
      <span style="flex:1;font-size:13px;color:var(--text)">${escHtml(String(item.name ?? ''))}</span>
      <span style="font-size:12px;color:${past?'var(--text-muted)':'var(--accent)'}">${summary}</span>
      <button onclick="cdLoadSaved(${i})" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:12px">${T('load')}</button>
      <button onclick="cdDeleteSaved(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px">×</button>
    </div>`;
  }).join('');
}

function cdLoadSaved(i) {
  const list = JSON.parse(localStorage.getItem('dtb_countdowns') || '[]');
  const item = list[i];
  if (!item) return;
  document.getElementById('cdTarget').value = item.target;
  document.getElementById('cdName').value = item.name;
  cdStart();
}

function cdDeleteSaved(i) {
  const list = JSON.parse(localStorage.getItem('dtb_countdowns') || '[]');
  list.splice(i, 1);
  localStorage.setItem('dtb_countdowns', JSON.stringify(list));
  cdRenderSaved();
}
// _activeCleanup is set inside cdStart() when the timer begins
