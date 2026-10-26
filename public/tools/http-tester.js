/* ── HTTP Tester — Request History + cURL Export + i18n ── */

/* ── i18n dictionary ── */
const _htI18nDict = {
  zh: {
    panel_title:      'HTTP 请求测试',
    cancel: '取消请求', cancelled: '请求已取消', timeout: '请求超时，请检查接口后重试', code: '生成 cURL / fetch / axios', import: '导入 cURL', import_run: '解析并填入', bad_url: '请输入有效的 HTTP 或 HTTPS 地址',
    cors_warn:        '浏览器安全限制：跨域请求可能因 CORS 策略被拦截。建议测试同域或已配置 CORS 的接口，或使用后端代理。',
    send:             '发送',
    sending:          '请求中...',
    headers_label:    '请求头（每行 Key: Value）',
    body_label:       '请求体',
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
    cancel: 'Cancel request', cancelled: 'Request cancelled', timeout: 'Request timed out. Check the endpoint and retry.', code: 'Generate cURL / fetch / axios', import: 'Import cURL', import_run: 'Parse and fill', bad_url: 'Enter a valid HTTP or HTTPS URL',
    cors_warn:        'Browser security: Cross-origin requests may be blocked by CORS policy. Test same-origin or CORS-enabled APIs, or use a backend proxy.',
    send:             'Send',
    sending:          'Sending...',
    headers_label:    'Headers (one per line: Key: Value)',
    body_label:       'Request body',
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
  try { const list = JSON.parse(localStorage.getItem(_HT_HISTORY_KEY)); return Array.isArray(list) ? list : []; } catch(_) { return []; }
}

function _htSaveHistory(list) {
  try { localStorage.setItem(_HT_HISTORY_KEY, JSON.stringify(list.slice(0, _HT_HISTORY_MAX))); } catch {}
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
    // History lives in localStorage: treat every stored field as untrusted text.
    const url = String(item.url ?? ''), method = escHtml(String(item.method ?? ''));
    const truncUrl = escHtml(url.length > 60 ? url.slice(0, 57) + '...' : url);
    const statusColor = item.status >= 200 && item.status < 300 ? '#10b981' : '#ef4444';
    const statusText = item.status ? `<span style="color:${statusColor};font-weight:600;font-size:12px">${escHtml(String(item.status))}</span>` : '';
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .15s;border-bottom:1px solid var(--border-color,rgba(128,128,128,0.12))" onmouseenter="this.style.background='var(--hover-bg,rgba(128,128,128,0.06))'" onmouseleave="this.style.background=''" onclick="_htRestoreFromHistory(${i})">
      <span style="padding:2px 8px;border-radius:6px;font-weight:700;font-size:11px;min-width:52px;text-align:center;background:${mc.bg};color:${mc.fg}">${method}</span>
      <span style="flex:1;font-size:12px;color:var(--text-main);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escHtml(url)}">${truncUrl}</span>
      ${statusText}
      <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${escHtml(String(item.time || ''))}</span>
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
  const bodyRaw = document.getElementById('htBody').value;
  // Single-quote every argument so URLs/headers containing quotes cannot break out of the command.
  const shq = v => "'" + String(v).replace(/'/g, "'\\''") + "'";
  let cmd = `curl -X ${method} ${shq(url)}`;
  if (headersRaw) {
    headersRaw.split('\n').forEach(line => {
      const [k, ...v] = line.split(':');
      if (k && v.length) {
        cmd += ` \\\n  -H ${shq(`${k.trim()}: ${v.join(':').trim()}`)}`;
      }
    });
  }
  if (bodyRaw && !['GET', 'HEAD'].includes(method)) {
    cmd += ` \\\n  --data-raw ${shq(bodyRaw)}`;
  }
  copyText(cmd, btnEl);
}

/* ── Main render ── */
let _htController = null;
function renderHttpTester(el) {
  window._activeCleanup = () => { _htController?.abort(); _htController = null; };
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${_htT('panel_title')}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px 12px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px">⚠️ ${_htT('cors_warn')}</div>
      <div class="http-request-row" style="margin-bottom:12px">
        <select class="tool-input" id="htMethod" style="width:110px">
          <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option>
        </select>
        <input class="tool-input" id="htUrl" placeholder="https://api.example.com/endpoint" style="flex:1">
        <button class="btn btn-primary" data-tool-submit onclick="doHttpTest()" id="htSendBtn">${_htT('send')}</button>
      </div>
      <div class="tool-actions" style="margin-bottom:12px">
        <button type="button" class="btn btn-secondary" onclick="navigateTo('curl-gen')">${_htT('code')}</button>
        <button type="button" class="btn btn-secondary" id="htCancelBtn" hidden onclick="_htController?.abort()">${_htT('cancel')}</button>
      </div>
      <details data-submit-scope><summary>${_htT('import')}</summary><textarea class="tool-textarea" id="htCurlInput" rows="3" placeholder="curl https://api.example.com"></textarea><button type="button" class="btn btn-secondary" data-tool-submit onclick="htImportCurl()">${_htT('import_run')}</button></details>
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
  window._htSession = RequestSession.mount(el, 'http');
}

async function htImportCurl() {
  const input = document.getElementById('htCurlInput'), body = document.getElementById('toolBody');
  const text = input.value;
  try {
    await loadTool('curl-gen', false);
    if (!body.isConnected) return;
    const data = parseCurlCommand(text);
    RequestSession.set({ ...data, headers: Object.entries(data.headers).map(([k,v]) => k + ': ' + v).join('\n'), bodyType: 'raw' });
    window._htSession.restore();
  } catch (error) { if (body.isConnected) showToast(error.message, 'error'); }
}

async function doHttpTest() {
  if (_htController) return;
  const root = document.getElementById('toolBody');
  const find = id => root.querySelector('#' + id);
  const url = find('htUrl').value.trim();
  try { if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error(); }
  catch { showToast(_htT('bad_url'), 'error'); return; }
  const method = find('htMethod').value, headersRaw = find('htHeaders').value, bodyRaw = find('htBody').value;
  const button = find('htSendBtn'), cancel = find('htCancelBtn');
  const controller = new AbortController(); _htController = controller;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
  const current = () => root.isConnected && _htController === controller;
  button.textContent = _htT('sending'); button.disabled = true; cancel.hidden = false;
  const headers = Object.create(null);
  headersRaw.split('\n').forEach(line => { const colon = line.indexOf(':'); if (colon > 0) headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim(); });
  const options = { method, headers, signal: controller.signal };
  if (bodyRaw && !['GET', 'HEAD'].includes(method)) options.body = bodyRaw;
  const start = Date.now();
  try {
    const response = await fetch(url, options);
    const raw = await response.text();
    if (!current()) return;
    let output = raw; try { output = JSON.stringify(JSON.parse(raw), null, 2); } catch {}
    const badge = find('htStatusBadge');
    badge.textContent = response.status + ' ' + response.statusText;
    badge.style.color = response.ok ? '#10b981' : '#ef4444';
    find('htTime').textContent = (Date.now() - start) + 'ms';
    find('htResHeaders').textContent = [...response.headers].map(([key, value]) => key + ': ' + value).join('\n');
    find('htResBody').textContent = output;
    _htAddHistory({ method, url, headers: headersRaw, body: bodyRaw, status: response.status, time: new Date().toLocaleTimeString() });
    _htRenderHistory();
  } catch (error) {
    if (!current()) return;
    find('htResBody').textContent = controller.signal.aborted ? _htT(timedOut ? 'timeout' : 'cancelled') : _htT('request_fail') + error.message;
    find('htStatusBadge').textContent = _htT('net_error');
    find('htResHeaders').textContent = ''; find('htTime').textContent = '';
  } finally {
    clearTimeout(timeout);
    if (current()) { find('htResult').style.display = ''; button.disabled = false; button.textContent = _htT('send'); cancel.hidden = true; _htController = null; }
  }
}
