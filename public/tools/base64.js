function renderBase64(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">输入内容</div>
        <div style="display:flex;gap:6px;align-items:center">
          <label style="font-size:12px;color:var(--text-muted)">实时</label>
          <input type="checkbox" id="b64Realtime" checked onchange="_b64OnChange()">
          <select id="b64Mode" class="tool-input" style="width:auto;font-size:12px">
            <option value="text">文本模式</option>
            <option value="url">URL 安全模式</option>
          </select>
        </div>
      </div>
      <textarea class="tool-textarea" id="b64Input" rows="6" placeholder="输入要编码或解码的内容..."></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="encodeB64()">编码 Base64 →</button>
        <button class="btn btn-primary" onclick="decodeB64()">← 解码 Base64</button>
        <button class="btn btn-secondary" onclick="b64Swap()">↕ 互换</button>
        <button class="btn btn-secondary" onclick="clearB64()">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="b64ResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="panel-label" style="margin:0" id="b64Status"></div>
          <span id="b64CharCount" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="b64UseAsInput()">用作输入</button>
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('b64Output').textContent, this)">复制结果</button>
        </div>
      </div>
      <div class="result-box" id="b64Output" style="word-break:break-all"></div>
    </div>`;

  document.getElementById('b64Input').addEventListener('input', _b64OnChange);
  window._b64LastOp = 'encode';
}

function _b64OnChange() {
  if (!document.getElementById('b64Realtime').checked) return;
  const val = document.getElementById('b64Input').value;
  if (!val) { document.getElementById('b64ResultPanel').style.display = 'none'; return; }
  // auto-detect: if input looks like base64, decode; otherwise encode
  const looksB64 = /^[A-Za-z0-9+/\-_]*={0,2}$/.test(val.trim().replace(/\s/g,''));
  if (window._b64LastOp === 'decode' || looksB64) {
    _b64TryDecode(val);
  } else {
    encodeB64();
  }
}

function _b64TryDecode(val) {
  let v = val.trim().replace(/\s/g,'');
  if (_isUrlSafe()) v = v.replace(/-/g,'+').replace(/_/g,'/');
  try {
    const decoded = decodeURIComponent(escape(atob(v)));
    _b64Show(decoded, '解码结果', true);
  } catch {
    // fallback to encode
    encodeB64();
  }
}

function _isUrlSafe() {
  return document.getElementById('b64Mode').value === 'url';
}

function _b64Show(text, label, ok) {
  const panel = document.getElementById('b64ResultPanel');
  document.getElementById('b64Output').textContent = text;
  const st = document.getElementById('b64Status');
  st.textContent = label;
  st.style.color = ok ? '#10b981' : '#ef4444';
  const cc = document.getElementById('b64CharCount');
  cc.textContent = text.length + ' 字符';
  panel.style.display = '';
}

function encodeB64() {
  window._b64LastOp = 'encode';
  const val = document.getElementById('b64Input').value;
  try {
    let result = btoa(unescape(encodeURIComponent(val)));
    if (_isUrlSafe()) result = result.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    _b64Show(result, '编码成功', true);
  } catch { _b64Show('编码失败：包含无法编码的字符', '错误', false); }
}

function decodeB64() {
  window._b64LastOp = 'decode';
  let val = document.getElementById('b64Input').value.trim();
  if (_isUrlSafe()) val = val.replace(/-/g,'+').replace(/_/g,'/');
  try { _b64Show(decodeURIComponent(escape(atob(val))), '解码成功', true); }
  catch { _b64Show('解码失败：内容不是有效的 Base64', '错误', false); }
}

function b64Swap() {
  const out = document.getElementById('b64Output').textContent;
  if (!out) return;
  document.getElementById('b64Input').value = out;
  document.getElementById('b64ResultPanel').style.display = 'none';
}

function b64UseAsInput() {
  const out = document.getElementById('b64Output').textContent;
  if (!out) return;
  document.getElementById('b64Input').value = out;
  document.getElementById('b64ResultPanel').style.display = 'none';
  showToast('已填入输入框', 'info');
}

function clearB64() {
  document.getElementById('b64Input').value = '';
  document.getElementById('b64ResultPanel').style.display = 'none';
  window._b64LastOp = 'encode';
}
