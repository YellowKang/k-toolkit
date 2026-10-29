const _dnsDict = {
  zh: {
    title: 'DNS 查询', input_ph: '输入域名（如 example.com）', query: '查询', querying: '查询中...', wait: '请稍候...',
    records: (domain, type) => `${domain} — ${type} 记录`, none: '未找到记录', failed: msg => `查询失败：${msg}`, network: '服务不可用或响应无效，请重试。', timeout: '查询超时，请重试。', changed: '输入已变化，请重新查询。',
  },
  en: {
    title: 'DNS lookup', input_ph: 'Domain name (e.g. example.com)', query: 'Look up', querying: 'Looking up...', wait: 'Please wait...',
    records: (domain, type) => `${domain} — ${type} records`, none: 'No records found', failed: msg => `Lookup failed: ${msg}`, network: 'Service unavailable or invalid response. Retry the query.', timeout: 'Query timed out. Please retry.', changed: 'Input changed. Run the query again.',
  },
};
const _dnsTask = ToolRuntime.task();

window.renderDnsLookup = function(el) {
  const T = makeToolI18n(_dnsDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        <input class="tool-input" id="dnsInput" placeholder="${T('input_ph')}" style="flex:1" onkeydown="if(event.key==='Enter')doDnsLookup()">
        <select class="tool-input" id="dnsType" style="width:100px">
          <option>A</option><option>AAAA</option><option>MX</option><option>TXT</option><option>CNAME</option><option>NS</option>
        </select>
        <button class="btn btn-primary" onclick="doDnsLookup()">${T('query')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="dnsResult" style="display:none">
      <div class="panel-label" id="dnsTitle" style="margin-bottom:10px"></div>
      <div id="dnsData"></div>
    </div>`;
  const invalidate = () => { _dnsTask.invalidate(); const title = el.querySelector('#dnsTitle'); if (title.textContent) { title.textContent = T('changed'); el.querySelector('#dnsData').replaceChildren(); } };
  el.addEventListener('input', invalidate); el.addEventListener('change', invalidate);
  window._activeCleanup = () => { _dnsTask.dispose(); el.removeEventListener('input', invalidate); el.removeEventListener('change', invalidate); };
};

async function doDnsLookup() {
  const T = makeToolI18n(_dnsDict);
  const domain = document.getElementById('dnsInput').value.trim();
  const type = document.getElementById('dnsType').value;
  if (!domain) return;
  const run = _dnsTask.start({ root: document.getElementById('toolBody'), timeout: 8000 });
  const res = document.getElementById('dnsResult');
  const data = document.getElementById('dnsData');
  const title = document.getElementById('dnsTitle');
  title.textContent = T('querying');
  data.innerHTML = `<span style="color:var(--text-muted)">${T('wait')}</span>`;
  res.style.display = '';
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: {Accept:'application/dns-json'},
      signal: run.signal
    });
    if (!r.ok) throw new Error('http');
    const json = await r.json();
    if (!run.current()) return;
    if (!json || ![0, 3].includes(json.Status) || (json.Answer !== undefined && !Array.isArray(json.Answer))) throw new Error('dns');
    title.textContent = T('records', domain, type);
    if (json.Status === 3 || !json.Answer || !json.Answer.length) {
      data.innerHTML = `<span style="color:var(--text-muted)">${T('none')}</span>`;
      return;
    }
    data.innerHTML = json.Answer.map(a =>
      `<div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--glass-border);font-family:monospace;font-size:13px">
        <span style="color:var(--text-muted);min-width:50px">TTL:${escHtml(String(a.TTL))}</span>
        <span style="color:var(--text);word-break:break-all">${escHtml(String(a.data ?? ''))}</span>
      </div>`
    ).join('');
  } catch(e) {
    if (run.owns()) { title.textContent = T('records', domain, type); data.textContent = T('failed', T(run.timedOut ? 'timeout' : 'network')); }
  } finally { run.finish(); }
}
