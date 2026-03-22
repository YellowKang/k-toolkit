function renderUrlEncode(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <button class="btn btn-primary" id="ueEncBtn" onclick="setUEMode('encode')">URL 编码</button>
        <button class="btn btn-secondary" id="ueDecBtn" onclick="setUEMode('decode')">URL 解码</button>
        <button class="btn btn-secondary" id="ueParseBtn" onclick="setUEMode('parse')">参数解析</button>
      </div>
      <div class="panel-label" id="ueLabel">输入文本</div>
      <textarea class="tool-textarea" id="ueInput" rows="5" placeholder="输入需要编码的文本..." oninput="_ueRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doUrlEncode()">执行</button>
        <button class="btn btn-secondary" onclick="document.getElementById('ueInput').value='';document.getElementById('ueResult').style.display='none'">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="ueResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="ueStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('ueOutput').innerText,this)">复制结果</button>
      </div>
      <div id="ueOutput" class="result-box" style="white-space:pre-wrap;word-break:break-all"></div>
    </div>`;
  window._ueMode = 'encode';
}

function setUEMode(mode) {
  window._ueMode = mode;
  const labels = {encode:'输入需要编码的文本...',decode:'输入需要解码的 URL...',parse:'输入完整 URL（含参数）'};
  document.getElementById('ueInput').placeholder = labels[mode];
  document.getElementById('ueLabel').textContent = mode==='parse'?'输入 URL':'输入文本';
  document.getElementById('ueEncBtn').className = mode==='encode'?'btn btn-primary':'btn btn-secondary';
  document.getElementById('ueDecBtn').className = mode==='decode'?'btn btn-primary':'btn btn-secondary';
  document.getElementById('ueParseBtn').className = mode==='parse'?'btn btn-primary':'btn btn-secondary';
  document.getElementById('ueResult').style.display='none';
}

function doUrlEncode() {
  const v = document.getElementById('ueInput').value.trim();
  if (!v) return;
  const out = document.getElementById('ueOutput');
  const status = document.getElementById('ueStatus');
  if (window._ueMode === 'encode') {
    out.textContent = encodeURIComponent(v);
    status.textContent = '✓ 编码完成'; status.style.color='#10b981';
    out.style.display='';
  } else if (window._ueMode === 'decode') {
    try {
      out.textContent = decodeURIComponent(v);
      status.textContent='✓ 解码完成'; status.style.color='#10b981';
      out.style.display='';
    } catch(e) {
      out.textContent='解码失败：'+e.message;
      status.textContent='✗ 错误'; status.style.color='#ef4444';
    }
  } else {
    try {
      const url = new URL(v.includes('://')?v:'https://'+v);
      const params = [...url.searchParams.entries()];
      let html = `<div style="margin-bottom:10px"><span style="color:var(--text-muted);font-size:12px">域名：</span><code style="color:var(--neon)">${url.hostname}</code>`;
      if (url.pathname !== '/') html += `<span style="color:var(--text-muted)"> ${url.pathname}</span>`;
      html += '</div>';
      if (params.length) {
        html += params.map(([k,pv])=>`<div class="result-row" style="margin-bottom:6px"><code style="color:var(--accent);min-width:140px;display:inline-block">${k}</code><span style="color:var(--text);flex:1;margin:0 8px">${decodeURIComponent(pv)}</span><button class="copy-inline" onclick="copyText(this.dataset.v,this)" data-v="${pv}">复制</button></div>`).join('');
      } else {
        html += '<div style="color:var(--text-muted)">无查询参数</div>';
      }
      out.innerHTML = html;
      out.style.removeProperty('white-space');
      status.textContent = `✓ 解析到 ${params.length} 个参数`; status.style.color='#10b981';
    } catch(e) {
      out.textContent='URL 格式错误';
      status.textContent='✗ 错误'; status.style.color='#ef4444';
    }
  }
  document.getElementById('ueResult').style.display='';
}

function _ueRealtime() {
  var val = document.getElementById('ueInput').value;
  if (!val) { document.getElementById('ueResult').style.display='none'; return; }
  doUrlEncode();
}
