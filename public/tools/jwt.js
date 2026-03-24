/* JWT 工具 —— 解析 + 生成（标签页切换） */

let _jwtActiveTab = 'decode';

function renderJWT(el) {
  const dict = {
    zh: {
      tab_decode:     '解析',
      tab_generate:   '生成',
      input_label:    '输入 JWT Token',
      example:        '示例',
      placeholder:    '粘贴 JWT token（三段 base64url 以 . 分隔）...',
      decode:         '解析',
      clear:          '清空',
      header_ro:      'Header（只读）',
      secret_label:   'Secret 密钥',
      secret_ph:      '输入签名密钥',
      expiry_label:   '有效期',
      exp_1h:         '1 小时',
      exp_1d:         '1 天',
      exp_7d:         '7 天',
      exp_30d:        '30 天',
      exp_never:      '不过期',
      gen_jwt:        '生成 JWT',
      copy_token:     '复制 Token',
      invalid_jwt:    '不是有效的 JWT（需要3段）',
      parse_fail:     '解析失败',
      expired:        '已过期',
      valid:          '有效',
      iat_label:      '签发 (iat)',
      exp_label:      '过期 (exp)',
      nbf_label:      '生效 (nbf)',
      sub_label:      '主体 (sub)',
      copy:           '复制',
      payload_err:    'Payload JSON 格式错误',
      gen_ok:         '生成成功',
      sign_fail:      '签名失败',
      na:             '无',
    },
    en: {
      tab_decode:     'Decode',
      tab_generate:   'Generate',
      input_label:    'Input JWT Token',
      example:        'Example',
      placeholder:    'Paste JWT token...',
      decode:         'Decode',
      clear:          'Clear',
      header_ro:      'Header (read-only)',
      secret_label:   'Secret Key',
      secret_ph:      'Enter signing key',
      expiry_label:   'Expiry',
      exp_1h:         '1 hour',
      exp_1d:         '1 day',
      exp_7d:         '7 days',
      exp_30d:        '30 days',
      exp_never:      'Never',
      gen_jwt:        'Generate JWT',
      copy_token:     'Copy Token',
      invalid_jwt:    'Not a valid JWT (requires 3 segments)',
      parse_fail:     'Parse failed',
      expired:        'Expired',
      valid:          'Valid',
      iat_label:      'Issued (iat)',
      exp_label:      'Expires (exp)',
      nbf_label:      'Not Before (nbf)',
      sub_label:      'Subject (sub)',
      copy:           'Copy',
      payload_err:    'Invalid Payload JSON',
      gen_ok:         'Generated',
      sign_fail:      'Signing failed',
      na:             'N/A',
    }
  };
  const tl = makeToolI18n(dict);

  _jwtActiveTab = 'decode';
  el.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn btn-primary" id="jwtTabDecode" onclick="jwtSwitchTab('decode')">${tl('tab_decode')}</button>
      <button class="btn btn-secondary" id="jwtTabGenerate" onclick="jwtSwitchTab('generate')">${tl('tab_generate')}</button>
    </div>
    <!-- decode tab -->
    <div id="jwtPanelDecode">
      <div class="tool-card-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="panel-label" style="margin:0">${tl('input_label')}</div>
          <button class="btn btn-secondary" onclick="jwtLoadSample()">${tl('example')}</button>
        </div>
        <textarea class="tool-textarea" id="jwtInput" rows="4" placeholder="${tl('placeholder')}"></textarea>
        <div class="tool-actions">
          <button class="btn btn-primary" onclick="decodeJWT()">${tl('decode')}</button>
          <button class="btn btn-secondary" onclick="clearJWT()">${tl('clear')}</button>
        </div>
      </div>
      <div class="tool-card-panel" id="jwtResultPanel" style="display:none">
        <div id="jwtParts"></div>
      </div>
    </div>
    <!-- generate tab -->
    <div id="jwtPanelGenerate" style="display:none">
      <div class="tool-card-panel">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div class="panel-label" style="margin-bottom:8px">${tl('header_ro')}</div>
            <pre style="padding:12px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;font-size:13px;color:#a8d8a8;font-family:monospace">{\n  "alg": "HS256",\n  "typ": "JWT"\n}</pre>
          </div>
          <div>
            <div class="panel-label" style="margin-bottom:8px">${tl('secret_label')}</div>
            <input type="text" class="tool-input" id="jwtGenSecret" value="your-secret-key" placeholder="${tl('secret_ph')}">
            <div style="margin-top:8px">
              <div class="panel-label" style="margin-bottom:6px">${tl('expiry_label')}</div>
              <select class="tool-input" id="jwtGenExp">
                <option value="3600">${tl('exp_1h')}</option>
                <option value="86400" selected>${tl('exp_1d')}</option>
                <option value="604800">${tl('exp_7d')}</option>
                <option value="2592000">${tl('exp_30d')}</option>
                <option value="0">${tl('exp_never')}</option>
              </select>
            </div>
          </div>
        </div>
        <div style="margin-top:16px">
          <div class="panel-label" style="margin-bottom:8px">Payload（JSON）</div>
          <textarea class="tool-textarea" id="jwtGenPayload" rows="6">{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "role": "admin"\n}</textarea>
        </div>
        <div class="tool-actions">
          <button class="btn btn-primary" onclick="jwtGenerate()">${tl('gen_jwt')}</button>
          <button class="btn btn-secondary" onclick="jwtGenClear()">${tl('clear')}</button>
        </div>
      </div>
      <div class="tool-card-panel" id="jwtGenResult" style="display:none">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div class="panel-label" style="margin:0" id="jwtGenStatus"></div>
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('jwtGenOutput').textContent,this)">${tl('copy_token')}</button>
        </div>
        <div id="jwtGenOutput" style="word-break:break-all;font-family:monospace;font-size:13px;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;line-height:1.6"></div>
      </div>
    </div>`;

  const ta = document.getElementById('jwtInput');
  ta.addEventListener('input', () => {
    const v = ta.value.trim();
    if (v.split('.').length === 3) decodeJWT();
  });
}

function jwtSwitchTab(tab) {
  _jwtActiveTab = tab;
  const decodeBtn = document.getElementById('jwtTabDecode');
  const genBtn    = document.getElementById('jwtTabGenerate');
  const decodePanel = document.getElementById('jwtPanelDecode');
  const genPanel    = document.getElementById('jwtPanelGenerate');
  if (tab === 'decode') {
    decodeBtn.className = 'btn btn-primary';
    genBtn.className    = 'btn btn-secondary';
    decodePanel.style.display = '';
    genPanel.style.display    = 'none';
  } else {
    decodeBtn.className = 'btn btn-secondary';
    genBtn.className    = 'btn btn-primary';
    decodePanel.style.display = 'none';
    genPanel.style.display    = '';
  }
}

/* ── i18n helper (used by decode/generate outside renderJWT) ── */
function _jwtTl() {
  return makeToolI18n({
    zh: {
      invalid_jwt: '不是有效的 JWT（需要3段）',
      parse_fail:  '解析失败',
      expired:     '已过期',
      valid:       '有效',
      iat_label:   '签发 (iat)',
      exp_label:   '过期 (exp)',
      nbf_label:   '生效 (nbf)',
      sub_label:   '主体 (sub)',
      copy:        '复制',
      payload_err: 'Payload JSON 格式错误',
      gen_ok:      '生成成功',
      sign_fail:   '签名失败',
      na:          '无',
    },
    en: {
      invalid_jwt: 'Not a valid JWT (requires 3 segments)',
      parse_fail:  'Parse failed',
      expired:     'Expired',
      valid:       'Valid',
      iat_label:   'Issued (iat)',
      exp_label:   'Expires (exp)',
      nbf_label:   'Not Before (nbf)',
      sub_label:   'Subject (sub)',
      copy:        'Copy',
      payload_err: 'Invalid Payload JSON',
      gen_ok:      'Generated',
      sign_fail:   'Signing failed',
      na:          'N/A',
    }
  });
}

/* ── 解析相关 ── */

function decodeJWT() {
  const tl = _jwtTl();
  const locale = getCurrentLang() === 'en' ? 'en-US' : 'zh-CN';
  const token = document.getElementById('jwtInput').value.trim();
  const panel = document.getElementById('jwtResultPanel');
  const parts = document.getElementById('jwtParts');
  if (!token) return;
  const segs = token.split('.');
  if (segs.length !== 3) {
    panel.style.display='';
    parts.innerHTML = '<div style="color:#ef4444;padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px">✗ ' + tl('invalid_jwt') + '</div>';
    return;
  }
  let header, payload;
  try {
    header  = JSON.parse(atob(segs[0].replace(/-/g,'+').replace(/_/g,'/')));
    payload = JSON.parse(atob(segs[1].replace(/-/g,'+').replace(/_/g,'/')));
  } catch(e) {
    panel.style.display='';
    parts.innerHTML = '<div style="color:#ef4444">' + tl('parse_fail') + '：' + e.message + '</div>';
    return;
  }
  const now = Math.floor(Date.now()/1000);
  const exp = payload.exp;
  const expired = exp && exp < now;
  const expStr = exp ? new Date(exp*1000).toLocaleString(locale) : tl('na');
  const iatStr = payload.iat ? new Date(payload.iat*1000).toLocaleString(locale) : tl('na');
  const nbfStr = payload.nbf ? new Date(payload.nbf*1000).toLocaleString(locale) : tl('na');

  panel.style.display='';
  parts.innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">' +
    _jwtBadge(header.alg||'?', 'alg', 'blue') +
    _jwtBadge(header.typ||'?', 'typ', 'blue') +
    (expired
      ? _jwtBadge('✗ ' + tl('expired'), null, 'red')
      : _jwtBadge('✓ ' + tl('valid'), null, 'green')) +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:16px">' +
    _jwtTimeCard(tl('iat_label'), iatStr) +
    _jwtTimeCard(tl('exp_label'), expStr, expired ? '#ef4444' : '#10b981') +
    (payload.nbf ? _jwtTimeCard(tl('nbf_label'), nbfStr) : '') +
    (payload.sub ? _jwtTimeCard(tl('sub_label'), payload.sub) : '') +
    '</div>' +
    _jwtSection('Header', header) +
    _jwtSection('Payload', payload) +
    '<div style="margin-bottom:12px">' +
    '<div class="panel-label" style="margin-bottom:8px">Signature</div>' +
    '<div style="font-family:monospace;font-size:12px;color:var(--text-muted);word-break:break-all;padding:10px 14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px">' + segs[2] + '</div>' +
    '</div>';
}

function _jwtBadge(text, prefix, color) {
  const colors = {
    blue:  'background:rgba(102,126,234,0.18);border:1px solid rgba(102,126,234,0.4);color:rgba(102,126,234,0.95)',
    green: 'background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.4);color:#10b981',
    red:   'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.35);color:#ef4444',
  };
  return `<span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;${colors[color]}">${prefix ? prefix+': '+text : text}</span>`;
}

function _jwtTimeCard(label, val, color) {
  return `<div style="padding:10px 14px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:10px">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${label}</div>
    <div style="font-size:13px;font-weight:600;color:${color||'var(--text)'}">${val}</div>
  </div>`;
}

function _jwtSection(title, obj) {
  const tl = _jwtTl();
  const json = JSON.stringify(obj, null, 2);
  const id = 'jwtcopy_' + title;
  setTimeout(() => {
    const btn = document.getElementById(id);
    if (btn) btn.onclick = () => copyText(json, btn);
  }, 0);
  return '<div style="margin-bottom:14px">' +
    '<div class="panel-label" style="margin-bottom:8px">' + title + '</div>' +
    '<div style="position:relative">' +
    '<pre style="font-family:monospace;font-size:13px;line-height:1.7;padding:14px 14px 14px 14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;white-space:pre-wrap;word-break:break-all;color:#a8d8a8;margin:0">' + escHtml(json) + '</pre>' +
    '<button class="copy-inline" id="' + id + '" style="position:absolute;top:8px;right:8px">' + tl('copy') + '</button>' +
    '</div></div>';
}

function jwtLoadSample() {
  document.getElementById('jwtInput').value =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJEZXZUb29sYm94IiwiaWF0IjoxNzEwMDAwMDAwLCJleHAiOjE5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  decodeJWT();
}

function clearJWT() {
  document.getElementById('jwtInput').value='';
  document.getElementById('jwtResultPanel').style.display='none';
}

/* ── 生成相关 ── */

function b64url(str) {
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function jwtGenerate() {
  const tl = _jwtTl();
  const secret = document.getElementById('jwtGenSecret').value.trim();
  const expSec = +document.getElementById('jwtGenExp').value;
  const payloadStr = document.getElementById('jwtGenPayload').value.trim();
  const result = document.getElementById('jwtGenResult');
  const status = document.getElementById('jwtGenStatus');
  const output = document.getElementById('jwtGenOutput');
  let payload;
  try { payload = JSON.parse(payloadStr); } catch(e) {
    status.textContent = '✗ ' + tl('payload_err') + ': ' + e.message;
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
    status.textContent = '✓ ' + tl('gen_ok');
    status.style.color = '#10b981';
  } catch(e) {
    status.textContent = '✗ ' + tl('sign_fail') + ': ' + e.message;
    status.style.color = '#e74c3c'; output.textContent = '';
  }
  result.style.display = '';
}

function jwtGenClear() {
  document.getElementById('jwtGenPayload').value = '{\n  "sub": "1234567890",\n  "name": "John Doe"\n}';
  document.getElementById('jwtGenSecret').value = 'your-secret-key';
  document.getElementById('jwtGenResult').style.display = 'none';
}
