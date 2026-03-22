function renderJWTGen(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div class="panel-label" style="margin-bottom:8px">Header（只读）</div>
          <pre style="padding:12px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;font-size:13px;color:#a8d8a8;font-family:monospace">{\n  "alg": "HS256",\n  "typ": "JWT"\n}</pre>
        </div>
        <div>
          <div class="panel-label" style="margin-bottom:8px">Secret 密钥</div>
          <input type="text" class="tool-input" id="jwtGenSecret" value="your-secret-key" placeholder="输入签名密钥">
          <div style="margin-top:8px">
            <div class="panel-label" style="margin-bottom:6px">有效期</div>
            <select class="tool-input" id="jwtGenExp">
              <option value="3600">1 小时</option>
              <option value="86400" selected>1 天</option>
              <option value="604800">7 天</option>
              <option value="2592000">30 天</option>
              <option value="0">不过期</option>
            </select>
          </div>
        </div>
      </div>
      <div style="margin-top:16px">
        <div class="panel-label" style="margin-bottom:8px">Payload（JSON）</div>
        <textarea class="tool-textarea" id="jwtGenPayload" rows="6">{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "role": "admin"\n}</textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="jwtGenerate()">生成 JWT</button>
        <button class="btn btn-secondary" onclick="jwtGenClear()">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="jwtGenResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="jwtGenStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('jwtGenOutput').textContent,this)">复制 Token</button>
      </div>
      <div id="jwtGenOutput" style="word-break:break-all;font-family:monospace;font-size:13px;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;line-height:1.6"></div>
    </div>`;
}

function b64url(str) {
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function jwtGenerate() {
  const secret = document.getElementById('jwtGenSecret').value.trim();
  const expSec = +document.getElementById('jwtGenExp').value;
  const payloadStr = document.getElementById('jwtGenPayload').value.trim();
  const result = document.getElementById('jwtGenResult');
  const status = document.getElementById('jwtGenStatus');
  const output = document.getElementById('jwtGenOutput');
  let payload;
  try { payload = JSON.parse(payloadStr); } catch(e) {
    status.textContent = '✗ Payload JSON 格式错误: ' + e.message;
    status.style.color = '#e74c3c'; result.style.display = ''; output.textContent = ''; return;
  }
  const now = Math.floor(Date.now()/1000);
  payload.iat = now;
  if (expSec > 0) payload.exp = now + expSec;
  const header = b64url(JSON.stringify({alg:'HS256',typ:'JWT'}));
  const body = b64url(JSON.stringify(payload));
  const msg = header + '.' + body;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    const token = msg + '.' + sigB64;
    const parts = token.split('.');
    output.innerHTML = `<span style="color:#f59e0b">${parts[0]}</span>.<span style="color:#10b981">${parts[1]}</span>.<span style="color:#8b5cf6">${parts[2]}</span>`;
    output.dataset.token = token;
    status.textContent = '✓ 生成成功';
    status.style.color = '#10b981';
  } catch(e) {
    status.textContent = '✗ 签名失败: ' + e.message;
    status.style.color = '#e74c3c'; output.textContent = '';
  }
  result.style.display = '';
}

function jwtGenClear() {
  document.getElementById('jwtGenPayload').value = '{\n  "sub": "1234567890",\n  "name": "John Doe"\n}';
  document.getElementById('jwtGenSecret').value = 'your-secret-key';
  document.getElementById('jwtGenResult').style.display = 'none';
}
