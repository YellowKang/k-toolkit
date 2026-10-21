const _worldClockDict = {
  zh: {
    title: '世界时钟', local_tz: tz => `本地时区: ${tz}`, meeting: '会议时间对比', compare: '对比', work: '工作时间', off_work: '非工作时间', locale: 'zh-CN',
    cities: { UTC: 'UTC', 'Asia/Shanghai': '上海', 'Asia/Tokyo': '东京', 'Asia/Seoul': '首尔', 'Asia/Singapore': '新加坡', 'Asia/Dubai': '迪拜',
      'Asia/Kolkata': '孟买', 'Europe/London': '伦敦', 'Europe/Paris': '巴黎', 'Europe/Moscow': '莫斯科', 'America/New_York': '纽约',
      'America/Chicago': '芝加哥', 'America/Los_Angeles': '洛杉矶', 'America/Sao_Paulo': '圣保罗', 'Australia/Sydney': '悉尼', 'Pacific/Auckland': '奥克兰' },
  },
  en: {
    title: 'World clock', local_tz: tz => `Local time zone: ${tz}`, meeting: 'Compare a meeting time', compare: 'Compare', work: 'Working hours', off_work: 'Off hours', locale: 'en-US',
    cities: { UTC: 'UTC', 'Asia/Shanghai': 'Shanghai', 'Asia/Tokyo': 'Tokyo', 'Asia/Seoul': 'Seoul', 'Asia/Singapore': 'Singapore', 'Asia/Dubai': 'Dubai',
      'Asia/Kolkata': 'Mumbai', 'Europe/London': 'London', 'Europe/Paris': 'Paris', 'Europe/Moscow': 'Moscow', 'America/New_York': 'New York',
      'America/Chicago': 'Chicago', 'America/Los_Angeles': 'Los Angeles', 'America/Sao_Paulo': 'São Paulo', 'Australia/Sydney': 'Sydney', 'Pacific/Auckland': 'Auckland' },
  },
};

window.renderWorldClock = function(el) {
  const T = makeToolI18n(_worldClockDict);
  const cities = T('cities');
  const ALL_ZONES = [
    { tz: 'UTC',                  city: 'Coordinated Universal Time', flag: '🌐' },
    { tz: 'Asia/Shanghai',        city: 'China Standard Time', flag: '🇨🇳' },
    { tz: 'Asia/Tokyo',           city: 'Japan Standard Time', flag: '🇯🇵' },
    { tz: 'Asia/Seoul',           city: 'Korea Standard Time', flag: '🇰🇷' },
    { tz: 'Asia/Singapore',       city: 'Singapore Time', flag: '🇸🇬' },
    { tz: 'Asia/Dubai',           city: 'Gulf Standard Time', flag: '🇦🇪' },
    { tz: 'Asia/Kolkata',         city: 'India Standard Time', flag: '🇮🇳' },
    { tz: 'Europe/London',        city: 'GMT / BST', flag: '🇬🇧' },
    { tz: 'Europe/Paris',         city: 'Central European Time', flag: '🇫🇷' },
    { tz: 'Europe/Moscow',        city: 'Moscow Time', flag: '🇷🇺' },
    { tz: 'America/New_York',     city: 'Eastern Time', flag: '🇺🇸' },
    { tz: 'America/Chicago',      city: 'Central Time', flag: '🇺🇸' },
    { tz: 'America/Los_Angeles',  city: 'Pacific Time', flag: '🇺🇸' },
    { tz: 'America/Sao_Paulo',    city: 'Brasilia Time', flag: '🇧🇷' },
    { tz: 'Australia/Sydney',     city: 'Australia Eastern', flag: '🇦🇺' },
    { tz: 'Pacific/Auckland',     city: 'New Zealand Time', flag: '🇳🇿' },
  ].map(zone => ({ ...zone, label: cities[zone.tz] }));

  // 本地时区
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  window._wcVisible = new Set(['Asia/Shanghai','America/New_York','Europe/London','UTC','Asia/Tokyo']);

  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">${T('title')}</div>
        <span style="font-size:11px;color:var(--text-muted)">${T('local_tz', localTz)}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="wcZonePicker">
        ${ALL_ZONES.map(z => `<button class="btn btn-secondary" id="wcBtn_${z.tz.replace(/\//g,'_')}" onclick="wcToggleZone('${z.tz}')" style="font-size:12px;padding:3px 10px">${z.flag} ${z.label}</button>`).join('')}
      </div>
      <div id="wcGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('meeting')}</div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <input class="tool-input" id="wcMeetTime" type="datetime-local" style="flex:1">
        <button class="btn btn-primary" onclick="wcCompareMeeting()">${T('compare')}</button>
      </div>
      <div id="wcMeetResult"></div>
    </div>`;

  // 设置本地时间默认值
  const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('wcMeetTime').value = now.toISOString().slice(0,16);

  window._wcAllZones = ALL_ZONES;
  wcUpdateButtons();
  _wcRender();
  const timer = setInterval(_wcRender, 1000);
  window._activeCleanup = () => clearInterval(timer);
};

function wcToggleZone(tz) {
  if (window._wcVisible.has(tz)) window._wcVisible.delete(tz);
  else window._wcVisible.add(tz);
  wcUpdateButtons();
  _wcRender();
}

function wcUpdateButtons() {
  window._wcAllZones.forEach(z => {
    const btn = document.getElementById('wcBtn_' + z.tz.replace(/\//g,'_'));
    if (btn) btn.style.borderColor = window._wcVisible.has(z.tz) ? 'var(--accent)' : 'var(--glass-border)';
  });
}

function _wcRender() {
  const grid = document.getElementById('wcGrid');
  if (!grid) return;
  const now = Date.now();
  const locale = makeToolI18n(_worldClockDict)('locale');
  const visible = window._wcAllZones.filter(z => window._wcVisible.has(z.tz));
  grid.innerHTML = visible.map(z => {
    const fmt = new Intl.DateTimeFormat(locale, { timeZone: z.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const dateFmt = new Intl.DateTimeFormat(locale, { timeZone: z.tz, month: 'short', day: 'numeric', weekday: 'short' });
    const off = new Intl.DateTimeFormat('en', { timeZone: z.tz, timeZoneName: 'short' });
    const tzName = (off.formatToParts(now).find(p => p.type === 'timeZoneName') || {}).value || '';
    return `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px">
      <div style="font-size:18px;margin-bottom:2px">${z.flag}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600">${z.label} <span style="opacity:.6;font-size:10px">${tzName}</span></div>
      <div style="font-size:26px;font-weight:800;color:var(--neon);font-variant-numeric:tabular-nums">${fmt.format(now)}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${dateFmt.format(now)}</div>
      <div style="font-size:10px;color:var(--text-muted);opacity:.5;margin-top:2px">${z.city}</div>
    </div>`;
  }).join('');
}

function wcCompareMeeting() {
  const val = document.getElementById('wcMeetTime').value;
  if (!val) return;
  const base = new Date(val);
  const el = document.getElementById('wcMeetResult');
  if (!el) return;
  const T = makeToolI18n(_worldClockDict);
  const visible = window._wcAllZones.filter(z => window._wcVisible.has(z.tz));
  el.innerHTML = visible.map(z => {
    const fmt = new Intl.DateTimeFormat(T('locale'), { timeZone: z.tz, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
    const h = parseInt(new Intl.DateTimeFormat('en', { timeZone: z.tz, hour: 'numeric', hour12: false }).format(base));
    const ok = h >= 9 && h < 18;
    return `<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;background:${ok?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.06)'};margin-bottom:5px">
      <span style="font-size:16px">${z.flag}</span>
      <span style="flex:1;font-size:13px;color:var(--text)">${z.label}</span>
      <span style="font-size:13px;font-weight:600;color:var(--text)">${fmt.format(base)}</span>
      <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'};color:${ok?'#10b981':'#ef4444'}">${ok?T('work'):T('off_work')}</span>
    </div>`;
  }).join('');
}
