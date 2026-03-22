async function renderIpInfo(container) {
  container.innerHTML = `
    <div id="ip-result" style="display:flex;flex-direction:column;gap:12px">
      <div style="text-align:center;padding:40px;color:var(--text-muted)">正在获取 IP 信息...</div>
    </div>
  `;

  const box = container.querySelector('#ip-result');

  function row(label, value) {
    const safe = String(value).replace(/"/g, '&quot;');
    return `<div style="display:flex;justify-content:space-between;align-items:center;
      padding:12px 16px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);
      border-radius:10px;gap:12px">
      <span style="font-size:13px;color:var(--text-muted);min-width:100px;flex-shrink:0">${label}</span>
      <span style="font-size:14px;font-weight:600;color:var(--text);text-align:right;word-break:break-all;flex:1">${value}</span>
      <button class="copy-inline" onclick="copyText(this.dataset.v,this)" data-v="${safe}">复制</button>
    </div>`;
  }

  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('fetch failed');
    const d = await res.json();
    if (d.error) throw new Error(d.reason || 'api error');
    box.innerHTML = [
      row('IP 地址', d.ip || '-'),
      row('城市', d.city || '-'),
      row('地区', d.region || '-'),
      row('国家', (d.country_name || '-') + ' (' + (d.country || '-') + ')'),
      row('时区', d.timezone || '-'),
      row('ISP', d.org || '-'),
      row('经纬度', d.latitude && d.longitude ? d.latitude + ', ' + d.longitude : '-'),
      row('邮编', d.postal || '-'),
      row('货币', d.currency_name ? d.currency_name + ' (' + d.currency + ')' : '-'),
      row('语言', d.languages ? d.languages.split(',')[0] : '-'),
    ].join('');
  } catch(e) {
    try {
      const r2 = await fetch('https://api.ipify.org?format=json');
      const d2 = await r2.json();
      box.innerHTML = row('IP 地址', d2.ip || '-') +
        '<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:13px">无法获取详细地理信息（网络限制或需要代理）</div>';
    } catch(e2) {
      box.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444">获取失败，请检查网络连接</div>';
    }
  }
}
