const _ipInfoDict = {
  zh: {
    loading: '正在获取 IP 信息...', copy: '复制', ip: 'IP 地址', city: '城市', region: '地区', country: '国家', timezone: '时区', isp: 'ISP',
    coords: '经纬度', postal: '邮编', currency: '货币', language: '语言',
    no_geo: '无法获取详细地理信息（网络限制或需要代理）', failed: '获取失败，请检查网络连接',
  },
  en: {
    loading: 'Fetching IP information...', copy: 'Copy', ip: 'IP address', city: 'City', region: 'Region', country: 'Country', timezone: 'Time zone', isp: 'ISP',
    coords: 'Coordinates', postal: 'Postal code', currency: 'Currency', language: 'Language',
    no_geo: 'Detailed location unavailable (network restrictions, or a proxy is needed)', failed: 'Could not fetch IP information. Check your network connection.',
  },
};

async function renderIpInfo(container) {
  const T = makeToolI18n(_ipInfoDict);
  container.innerHTML = `
    <div id="ip-result" style="display:flex;flex-direction:column;gap:12px">
      <div style="text-align:center;padding:40px;color:var(--text-muted)">${T('loading')}</div>
    </div>
  `;

  const box = container.querySelector('#ip-result');

  // Values come from a third-party API: escape them for both text and attributes.
  function row(label, value) {
    const safe = escHtml(String(value));
    value = safe;
    return `<div style="display:flex;justify-content:space-between;align-items:center;
      padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);
      border-radius:10px;gap:12px">
      <span style="font-size:13px;color:var(--text-muted);min-width:100px;flex-shrink:0">${label}</span>
      <span style="font-size:14px;font-weight:600;color:var(--text);text-align:right;word-break:break-all;flex:1">${value}</span>
      <button class="copy-inline" onclick="copyText(this.dataset.v,this)" data-v="${safe}">${T('copy')}</button>
    </div>`;
  }

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('fetch failed');
    const d = await res.json();
    if (d.error) throw new Error(d.reason || 'api error');
    box.innerHTML = [
      row(T('ip'), d.ip || '-'),
      row(T('city'), d.city || '-'),
      row(T('region'), d.region || '-'),
      row(T('country'), (d.country_name || '-') + ' (' + (d.country || '-') + ')'),
      row(T('timezone'), d.timezone || '-'),
      row(T('isp'), d.org || '-'),
      row(T('coords'), d.latitude && d.longitude ? d.latitude + ', ' + d.longitude : '-'),
      row(T('postal'), d.postal || '-'),
      row(T('currency'), d.currency_name ? d.currency_name + ' (' + d.currency + ')' : '-'),
      row(T('language'), d.languages ? d.languages.split(',')[0] : '-'),
    ].join('');
  } catch(e) {
    try {
      const r2 = await fetch('https://api.ipify.org?format=json');
      const d2 = await r2.json();
      box.innerHTML = row(T('ip'), d2.ip || '-') +
        `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">${T('no_geo')}</div>`;
    } catch(e2) {
      box.innerHTML = `<div style="text-align:center;padding:40px;color:#ef4444">${T('failed')}</div>`;
    }
  }
}
