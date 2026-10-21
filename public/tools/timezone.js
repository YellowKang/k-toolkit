const _tzDict = {
  zh: {
    title: '时区转换', input: '输入时间', from: '来源时区', convert: '转换到所有时区', result: '各时区时间', copy: '复制',
    zones: { UTC: 'UTC', 'Asia/Shanghai': '中国 (UTC+8)', 'Asia/Tokyo': '日本 (UTC+9)', 'Asia/Seoul': '韩国 (UTC+9)', 'Asia/Singapore': '新加坡 (UTC+8)',
      'Asia/Dubai': '迪拜 (UTC+4)', 'Europe/London': '伦敦', 'Europe/Paris': '巴黎/柏林', 'Europe/Moscow': '莫斯科 (UTC+3)', 'America/New_York': '纽约 (UTC-5/-4)',
      'America/Chicago': '芝加哥', 'America/Los_Angeles': '洛杉矶 (UTC-8/-7)', 'America/Sao_Paulo': '圣保罗 (UTC-3)', 'Australia/Sydney': '悉尼' },
    places: { UTC: 'UTC', 'Asia/Shanghai': '中国', 'Asia/Tokyo': '日本', 'Asia/Seoul': '韩国', 'Asia/Singapore': '新加坡', 'Asia/Dubai': '迪拜',
      'Europe/London': '伦敦', 'Europe/Paris': '巴黎', 'Europe/Moscow': '莫斯科', 'America/New_York': '纽约', 'America/Los_Angeles': '洛杉矶',
      'America/Sao_Paulo': '圣保罗', 'Australia/Sydney': '悉尼' },
  },
  en: {
    title: 'Time zone converter', input: 'Date and time', from: 'Source time zone', convert: 'Convert to all time zones', result: 'Time in each zone', copy: 'Copy',
    zones: { UTC: 'UTC', 'Asia/Shanghai': 'China (UTC+8)', 'Asia/Tokyo': 'Japan (UTC+9)', 'Asia/Seoul': 'Korea (UTC+9)', 'Asia/Singapore': 'Singapore (UTC+8)',
      'Asia/Dubai': 'Dubai (UTC+4)', 'Europe/London': 'London', 'Europe/Paris': 'Paris / Berlin', 'Europe/Moscow': 'Moscow (UTC+3)', 'America/New_York': 'New York (UTC-5/-4)',
      'America/Chicago': 'Chicago', 'America/Los_Angeles': 'Los Angeles (UTC-8/-7)', 'America/Sao_Paulo': 'São Paulo (UTC-3)', 'Australia/Sydney': 'Sydney' },
    places: { UTC: 'UTC', 'Asia/Shanghai': 'China', 'Asia/Tokyo': 'Japan', 'Asia/Seoul': 'Korea', 'Asia/Singapore': 'Singapore', 'Asia/Dubai': 'Dubai',
      'Europe/London': 'London', 'Europe/Paris': 'Paris', 'Europe/Moscow': 'Moscow', 'America/New_York': 'New York', 'America/Los_Angeles': 'Los Angeles',
      'America/Sao_Paulo': 'São Paulo', 'Australia/Sydney': 'Sydney' },
  },
};

function renderTimezone(el) {
  const T = makeToolI18n(_tzDict);
  const zones = Object.entries(T('zones'));
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
        <div style="flex:1;min-width:200px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('input')}</label>
          <input class="tool-input" id="tzInput" type="datetime-local" oninput="tzConvert()">
        </div>
        <div style="flex:1;min-width:200px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('from')}</label>
          <select class="tool-input" id="tzFrom" onchange="tzConvert()">
            ${zones.map(([z,l])=>`<option value="${z}">${l}</option>`).join('')}
          </select>
        </div>
      </div>
      <button class="btn btn-primary" onclick="tzConvert()">${T('convert')}</button>
    </div>
    <div class="tool-card-panel" id="tzResult" style="display:none">
      <div class="panel-label" style="margin-bottom:12px">${T('result')}</div>
      <div id="tzOutput"></div>
    </div>`;
  const now = new Date();
  now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  document.getElementById('tzInput').value = now.toISOString().slice(0,16);
  document.getElementById('tzFrom').value = 'Asia/Shanghai';
  tzConvert();
}

function tzConvert() {
  const val = document.getElementById('tzInput').value;
  const fromZone = document.getElementById('tzFrom').value;
  if (!val) return;
  const T = makeToolI18n(_tzDict);
  const zones = Object.entries(T('places'));
  try {
    const date = new Date(val + ':00');
    const html = zones.map(([tz,label]) => {
      try {
        const str = date.toLocaleString('zh-CN',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
        const offset = new Intl.DateTimeFormat('en',{timeZone:tz,timeZoneName:'short'}).format(date).split(' ').pop();
        return `<div class="result-row" style="margin-bottom:8px"><span style="color:var(--text-muted);min-width:80px">${label}</span><span style="color:var(--neon);font-weight:600;flex:1">${str}</span><span style="color:var(--text-muted);font-size:11px">${offset}</span><button class="copy-inline" onclick="copyText('${str}',this)">${T('copy')}</button></div>`;
      } catch(e) { return ''; }
    }).join('');
    document.getElementById('tzOutput').innerHTML = html;
    document.getElementById('tzResult').style.display = '';
  } catch(e) { console.error(e); }
}
