function renderUrlParser(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">输入 URL</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="urlInput" placeholder="https://example.com/path?foo=bar&baz=qux#section" style="flex:1">
        <button class="btn btn-primary" onclick="parseUrl()">解析</button>
        <button class="btn btn-secondary" onclick="urlUseCurrent()">当前页</button>
      </div>
    </div>
    <div class="tool-card-panel" id="urlResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">解析结果</div>
        <button class="btn btn-secondary" onclick="urlCopyAll()">复制全部</button>
      </div>
      <div id="urlFields"></div>
    </div>
    <div class="tool-card-panel" id="urlParamsPanel" style="display:none">
      <div class="panel-label" style="margin-bottom:12px">查询参数</div>
      <div id="urlParamsTable"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">URL 编解码</div>
      <textarea class="tool-textarea" id="urlEncInput" rows="3" placeholder="输入要编码/解码的内容..."></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="urlEncode()">编码</button>
        <button class="btn btn-primary" onclick="urlDecode()">解码</button>
        <button class="btn btn-secondary" onclick="clearUrlEnc()">清空</button>
      </div>
      <div class="result-box" id="urlEncOutput" style="display:none;margin-top:10px;word-break:break-all"></div>
    </div>`;

  const inp = document.getElementById('urlInput');
  inp.addEventListener('keydown', e => { if (e.key==='Enter') parseUrl(); });
  inp.addEventListener('input', () => { if (inp.value.trim().startsWith('http')) parseUrl(); });
}

function urlUseCurrent() {
  document.getElementById('urlInput').value = location.href;
  parseUrl();
}

function parseUrl() {
  const raw = document.getElementById('urlInput').value.trim();
  if (!raw) return;
  let url;
  try { url = new URL(raw); }
  catch { try { url = new URL('https://' + raw); } catch {
    document.getElementById('urlResultPanel').style.display = '';
    document.getElementById('urlFields').innerHTML = '<span style="color:#ef4444">无效 URL</span>';
    return;
  }}

  const fields = [
    { label: '协议',   value: url.protocol },
    { label: '主机',   value: url.hostname },
    { label: '端口',   value: url.port || '(默认)' },
    { label: '路径',   value: url.pathname },
    { label: '查询串', value: url.search || '(无)' },
    { label: 'Hash',  value: url.hash || '(无)' },
    { label: 'Origin', value: url.origin },
  ];

  document.getElementById('urlFields').innerHTML = fields.map(f => `
    <div class="result-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="color:var(--text-muted);width:72px;flex-shrink:0;font-size:12px">${f.label}</span>
      <span style="font-family:monospace;font-size:13px;flex:1;word-break:break-all">${escHtml(f.value)}</span>
      <button class="copy-inline" onclick="copyText('${escHtml(f.value).replace(/'/g,"&#39;")}',this)">复制</button>
    </div>`).join('');
  document.getElementById('urlResultPanel').style.display = '';

  // 查询参数表格
  const params = [...url.searchParams.entries()];
  const pp = document.getElementById('urlParamsPanel');
  if (params.length) {
    document.getElementById('urlParamsTable').innerHTML =
      `<div style="border:1px solid var(--glass-border);border-radius:10px;overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 2fr auto;padding:8px 14px;background:rgba(102,126,234,0.08);font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.5px;text-transform:uppercase"><span>参数名</span><span>参数值</span><span></span></div>` +
      params.map(([k,v], i) =>
        `<div style="display:grid;grid-template-columns:1fr 2fr auto;padding:9px 14px;gap:12px;align-items:center;${i%2?'background:rgba(255,255,255,0.015)':''};border-top:1px solid var(--glass-border)">
          <span style="color:var(--accent);font-family:monospace;font-size:13px;word-break:break-all">${escHtml(k)}</span>
          <span style="font-family:monospace;font-size:13px;word-break:break-all">${escHtml(v)}</span>
          <button class="copy-inline" onclick="copyText('${escHtml(v).replace(/'/g,"&#39;")}',this)">复制</button>
        </div>`).join('') + `</div>`;
    pp.style.display = '';
  } else { pp.style.display = 'none'; }
}

function urlCopyAll() {
  const rows = document.getElementById('urlFields').querySelectorAll('.result-row span:nth-child(2)');
  const text = [...rows].map(s => s.textContent).join('\n');
  navigator.clipboard.writeText(text).then(() => showToast('已复制解析结果'));
}

function urlEncode() {
  const v = document.getElementById('urlEncInput').value;
  const out = document.getElementById('urlEncOutput');
  out.textContent = encodeURIComponent(v);
  out.style.display = '';
}
function urlDecode() {
  const v = document.getElementById('urlEncInput').value;
  const out = document.getElementById('urlEncOutput');
  try { out.textContent = decodeURIComponent(v); }
  catch { out.textContent = '解码失败：包含无效的百分号编码'; }
  out.style.display = '';
}
function clearUrlEnc() {
  document.getElementById('urlEncInput').value = '';
  document.getElementById('urlEncOutput').style.display = 'none';
}
