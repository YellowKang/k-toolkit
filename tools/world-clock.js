window.renderWorldClock = function(el) {
const ALL_ZONES = [
{ tz: 'UTC',                  label: 'UTC',       city: 'Coordinated Universal Time', flag: '🌐' },
{ tz: 'Asia/Shanghai',        label: '上海',      city: 'China Standard Time', flag: '🇨🇳' },
{ tz: 'Asia/Tokyo',           label: '东京',      city: 'Japan Standard Time', flag: '🇯🇵' },
{ tz: 'Asia/Seoul',           label: '首尔',      city: 'Korea Standard Time', flag: '🇰🇷' },
{ tz: 'Asia/Singapore',       label: '新加坡',    city: 'Singapore Time', flag: '🇸🇬' },
{ tz: 'Asia/Dubai',           label: '迪拜',      city: 'Gulf Standard Time', flag: '🇦🇪' },
{ tz: 'Asia/Kolkata',         label: '孟买',      city: 'India Standard Time', flag: '🇮🇳' },
{ tz: 'Europe/London',        label: '伦敦',      city: 'GMT / BST', flag: '🇬🇧' },
{ tz: 'Europe/Paris',         label: '巴黎',      city: 'Central European Time', flag: '🇫🇷' },
{ tz: 'Europe/Moscow',        label: '莫斯科',    city: 'Moscow Time', flag: '🇷🇺' },
{ tz: 'America/New_York',     label: '纽约',      city: 'Eastern Time', flag: '🇺🇸' },
{ tz: 'America/Chicago',      label: '芝加哥',    city: 'Central Time', flag: '🇺🇸' },
{ tz: 'America/Los_Angeles',  label: '洛杉矶',    city: 'Pacific Time', flag: '🇺🇸' },
{ tz: 'America/Sao_Paulo',    label: '圣保罗',    city: 'Brasilia Time', flag: '🇧🇷' },
{ tz: 'Australia/Sydney',     label: '悉尼',      city: 'Australia Eastern', flag: '🇦🇺' },
{ tz: 'Pacific/Auckland',     label: '奥克兰',    city: 'New Zealand Time', flag: '🇳🇿' },
];
const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
window._wcVisible = new Set(['Asia/Shanghai','America/New_York','Europe/London','UTC','Asia/Tokyo']);
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">世界时钟</div>
<span style="font-size:11px;color:var(--text-muted)">本地时区: ${localTz}</span>
</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px" id="wcZonePicker">
${ALL_ZONES.map(z => `<button class="btn btn-secondary" id="wcBtn_${z.tz.replace(/\//g,'_')}" onclick="wcToggleZone('${z.tz}')" style="font-size:12px;padding:3px 10px">${z.flag} ${z.label}</button>`).join('')}
</div>
<div id="wcGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"></div>
</div>
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:10px">会议时间对比</div>
<div style="display:flex;gap:8px;margin-bottom:10px">
<input class="tool-input" id="wcMeetTime" type="datetime-local" style="flex:1">
<button class="btn btn-primary" onclick="wcCompareMeeting()">对比</button>
</div>
<div id="wcMeetResult"></div>
</div>`;
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
const btn = document.getElementById('wcBtn_' + z.tz.replace(/\
if (btn) btn.style.borderColor = window._wcVisible.has(z.tz) ? 'var(--accent)' : 'var(--glass-border)';
});
}
function _wcRender() {
const grid = document.getElementById('wcGrid');
if (!grid) return;
const now = Date.now();
const visible = window._wcAllZones.filter(z => window._wcVisible.has(z.tz));
grid.innerHTML = visible.map(z => {
const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: z.tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const dateFmt = new Intl.DateTimeFormat('zh-CN', { timeZone: z.tz, month: 'short', day: 'numeric', weekday: 'short' });
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
const visible = window._wcAllZones.filter(z => window._wcVisible.has(z.tz));
el.innerHTML = visible.map(z => {
const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: z.tz, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
const h = parseInt(new Intl.DateTimeFormat('en', { timeZone: z.tz, hour: 'numeric', hour12: false }).format(base));
const ok = h >= 9 && h < 18;
return `<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;background:${ok?'rgba(16,185,129,0.08)':'rgba(239,68,68,0.06)'};margin-bottom:5px">
<span style="font-size:16px">${z.flag}</span>
<span style="flex:1;font-size:13px;color:var(--text)">${z.label}</span>
<span style="font-size:13px;font-weight:600;color:var(--text)">${fmt.format(base)}</span>
<span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'};color:${ok?'#10b981':'#ef4444'}">${ok?'工作时间':'非工作时间'}</span>
</div>`;
}).join('');
}