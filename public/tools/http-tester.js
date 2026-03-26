/* ── HTTP Tester — Request History + cURL Export + i18n ── */

/* ── i18n dictionary ── */
const _htI18nDict = {
  zh: {
    panel_title:      'HTTP 请求测试',
    cors_warn:        '浏览器安全限制：跨域请求可能因 CORS 策略被拦截。建议测试同域或已配置 CORS 的接口，或使用后端代理。',
    send:             '发送',
    sending:          '请求中...',
    headers_label:    '请求头（每行 Key: Value）',
    body_label:       '请求体（JSON）',
    copy_response:    '复制响应',
    export_curl:      '导出 cURL',
    res_headers:      '响应头',
    res_body:         '响应体',
    cors_footer:      '受浏览器同源策略限制，跨域请求可能失败。可配合本地代理或测试允许跨域的接口。',
    net_error:        '网络错误',
    request_fail:     '请求失败：',
    history_title:    '请求历史',
    clear_history:    '清空历史',
    history_empty:    '暂无请求历史',
    curl_copied:      '已复制 cURL',
    no_request:       '请先发送一次请求',
    deleted:          '已删除',
    history_cleared:  '历史已清空',
  },
  en: {
    panel_title:      'HTTP Request Tester',
    cors_warn:        'Browser security: Cross-origin requests may be blocked by CORS policy. Test same-origin or CORS-enabled APIs, or use a backend proxy.',
    send:             'Send',
    sending:          'Sending...',
    headers_label:    'Headers (one per line: Key: Value)',
    body_label:       'Body (JSON)',
    copy_response:    'Copy Response',
    export_curl:      'Export cURL',
    res_headers:      'Response Headers',
    res_body:         'Response Body',
    cors_footer:      'Cross-origin requests may fail due to browser same-origin policy. Use a local proxy or test CORS-enabled APIs.',
    net_error:        'Network Error',
    request_fail:     'Request failed: ',
    history_title:    'Request History',
    clear_history:    'Clear History',
    history_empty:    'No request history',
    curl_copied:      'cURL copied',
    no_request:       'Send a request first',
    deleted:          'Deleted',
    history_cleared:  'History cleared',
  }
};
const _htT = makeToolI18n(_htI18nDict);

/* ── History helpers ── */
const _HT_HISTORY_KEY = 'dtb_http_history';
const _HT_HISTORY_MAX = 20;

function _htLoadHistory() {
  try { return JSON.parse(localStorage.getItem(_HT_HISTORY_KEY)) || []; } catch(_) { return []; }
}

function _htSaveHistory(list) {
  localStorage.setItem(_HT_HISTORY_KEY, JSON.stringify(list.slice(0, _HT_HISTORY_MAX)));
}

function _htAddHistory(entry) {
  const list = _htLoadHistory();
  list.unshift(entry);
  _htSaveHistory(list);
}

function _htDeleteHistory(index) {
  const list = _htLoadHistory();
  list.splice(index, 1);
  _htSaveHistory(list);
  _htRenderHistory();
}

function _htClearHistory() {
  localStorage.removeItem(_HT_HISTORY_KEY);
  _htRenderHistory();
}

function _htRestoreFromHistory(index) {
  const list = _htLoadHistory();
  const item = list[index];
  if (!item) return;
  document.getElementById('htMethod').value = item.method;
  document.getElementById('htUrl').value = item.url;
  document.getElementById('htHeaders').value = item.headers || '';
  document.getElementById('htBody').value = item.body || '';
}

/* ── Method badge color ── */
function _htMethodColor(method) {
  const colors = {
    GET:    { bg: 'rgba(16,185,129,0.15)', fg: '#10b981' },
    POST:   { bg: 'rgba(59,130,246,0.15)', fg: '#3b82f6' },
    PUT:    { bg: 'rgba(245,158,11,0.15)', fg: '#f59e0b' },
    PATCH:  { bg: 'rgba(168,85,247,0.15)', fg: '#a855f7' },
    DELETE: { bg: 'rgba(239,68,68,0.15)', fg: '#ef4444' },
    HEAD:   { bg: 'rgba(107,114,128,0.15)', fg: '#6b7280' },
  };
  return colors[method] || colors.GET;
}

/* ── Render history panel ── */
function _htRenderHistory() {
  const container = document.getElementById('htHistoryList');
  if (!container) return;
  const list = _htLoadHistory();
  if (!list.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px 0;font-size:13px">${_htT('history_empty')}</div>`;
    return;
  }
  container.innerHTML = list.map((item, i) => {
    const mc = _htMethodColor(item.method);
    const truncUrl = item.url.length > 60 ? item.url.slice(0, 57) + '...' : item.url;
    const statusColor = item.status >= 200 && item.status < 300 ? '#10b981' : '#ef4444';
    const statusText = item.status ? `<span style="color:${statusColor};font-weight:600;font-size:12px">${item.status}</span>` : '';
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--border-color,rgba(128,128,128,0.12))" onmouseenter="this.style.background='var(--hover-bg,rgba(128,128,128,0.06))'" onmouseleave="this.style.background=''" onclick="_htRestoreFromHistory(${i})">
      <span style="padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px;min-width:52px;text-align:center;background:${mc.bg};color:${mc.fg}">${item.method}</span>
      <span style="flex:1;font-size:12px;color:var(--text-main);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${item.url}">${truncUrl}</span>
      ${statusText}
      <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${item.time || ''}</span>
      <button class="btn btn-secondary" style="padding:2px 7px;font-size:14px;line-height:1;min-width:auto;border:none;opacity:0.5" onclick="event.stopPropagation();_htDeleteHistory(${i})" title="Delete">&times;</button>
    </div>`;
  }).join('');
}

/* ── cURL export ── */
function _htExportCurl(btnEl) {
  const method = document.getElementById('htMethod').value;
  const url = document.getElementById('htUrl').value.trim();
  if (!url) return;
  const headersRaw = document.getElementById('htHeaders').value.trim();
  const bodyRaw = document.getElementById('htBody').value.trim();
  let cmd = `curl -X ${method} '${url}'`;
  if (headersRaw) {
    headersRaw.split('\n').forEach(line => {
      const [k, ...v] = line.split(':');
      if (k && v.length) {
        cmd += ` \\\n  -H '${k.trim()}: ${v.join(':').trim()}'`;
      }
    });
  }
  if (bodyRaw && !['GET', 'HEAD'].includes(method)) {
    cmd += ` \\\n  -d '${bodyRaw.replace(/'/g, "'\\''")}'`;
  }
  copyText(cmd, btnEl);
}

/* ── Main render ── */
function renderHttpTester(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${_htT('panel_title')}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px 12px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px">⚠️ ${_htT('cors_warn')}</div>
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <select class="tool-input" id="htMethod" style="width:110px">
          <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option>
        </select>
        <input class="tool-input" id="htUrl" placeholder="https://api.example.com/endpoint" style="flex:1">
        <button class="btn btn-primary" onclick="doHttpTest()" id="htSendBtn">${_htT('send')}</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${_htT('headers_label')}</div>
          <textarea class="tool-textarea" id="htHeaders" rows="4" placeholder="Content-Type: application/json\nAuthorization: Bearer token"></textarea>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${_htT('body_label')}</div>
          <textarea class="tool-textarea" id="htBody" rows="4" placeholder='{"key": "value"}'></textarea>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="htResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span id="htStatusBadge" style="padding:4px 12px;border-radius:20px;font-weight:700;font-size:13px"></span>
          <span id="htTime" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="_htExportCurl(this)">${_htT('export_curl')}</button>
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('htResBody').textContent,this)">${_htT('copy_response')}</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${_htT('res_headers')}</div>
      <pre id="htResHeaders" class="result-box" style="max-height:120px;overflow-y:auto;margin-bottom:10px;font-size:11px"></pre>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${_htT('res_body')}</div>
      <pre id="htResBody" class="result-box" style="max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin-bottom:0">${_htT('history_title')}</div>
        <button class="btn btn-secondary" style="font-size:12px;padding:4px 12px" onclick="_htClearHistory()">${_htT('clear_history')}</button>
      </div>
      <div id="htHistoryList"></div>
    </div>
    <div class="tool-card-panel" style="font-size:12px;color:var(--text-muted)">
      ⚠️ ${_htT('cors_footer')}
    </div>`;
  _htRenderHistory();
}

async function doHttpTest() {
  const url = document.getElementById('htUrl').value.trim();
  if (!url) return;
  const method = document.getElementById('htMethod').value;
  const headersRaw = document.getElementById('htHeaders').value.trim();
  const bodyRaw = document.getElementById('htBody').value.trim();
  const btn = document.getElementById('htSendBtn');
  btn.textContent = _htT('sending'); btn.disabled = true;
  const headers = {};
  headersRaw.split('\n').forEach(line => { const [k,...v]=line.split(':'); if(k&&v.length) headers[k.trim()]=v.join(':').trim(); });
  const opts = { method, headers };
  if (bodyRaw && !['GET','HEAD'].includes(method)) opts.body = bodyRaw;
  const t0 = Date.now();
  let status = 0;
  try {
    const res = await fetch(url, opts);
    const elapsed = Date.now()-t0;
    status = res.status;
    const resText = await res.text();
    let resBody = resText;
    try { resBody = JSON.stringify(JSON.parse(resText),null,2); } catch(_){}
    const badge = document.getElementById('htStatusBadge');
    badge.textContent = res.status+' '+res.statusText;
    badge.style.background = res.ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)';
    badge.style.color = res.ok?'#10b981':'#ef4444';
    document.getElementById('htTime').textContent = elapsed+'ms';
    let hText='';
    res.headers.forEach((v,k)=>hText+=k+': '+v+'\n');
    document.getElementById('htResHeaders').textContent = hText;
    document.getElementById('htResBody').textContent = resBody;
    // Save to history
    _htAddHistory({
      method,
      url,
      headers: headersRaw,
      body: bodyRaw,
      status: res.status,
      time: new Date().toLocaleTimeString(),
    });
    _htRenderHistory();
  } catch(e) {
    document.getElementById('htResBody').textContent = _htT('request_fail')+e.message;
    const badge = document.getElementById('htStatusBadge');
    badge.textContent=_htT('net_error'); badge.style.background='rgba(239,68,68,0.2)'; badge.style.color='#ef4444';
  }
  document.getElementById('htResult').style.display='';
  btn.textContent=_htT('send'); btn.disabled=false;
}
