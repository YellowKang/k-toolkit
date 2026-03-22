function renderJWT(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">输入 JWT Token</div>
        <button class="btn btn-secondary" onclick="jwtLoadSample()">示例</button>
      </div>
      <textarea class="tool-textarea" id="jwtInput" rows="4" placeholder="粘贴 JWT token（三段 base64url 以 . 分隔）..."></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="decodeJWT()">解析</button>
        <button class="btn btn-secondary" onclick="clearJWT()">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="jwtResultPanel" style="display:none">
      <div id="jwtParts"></div>
    </div>`;

  const ta = document.getElementById('jwtInput');
  ta.addEventListener('input', () => {
    const v = ta.value.trim();
    if (v.split('.').length === 3) decodeJWT();
  });
}

function decodeJWT() {
  const token = document.getElementById('jwtInput').value.trim();
  const panel = document.getElementById('jwtResultPanel');
  const parts = document.getElementById('jwtParts');
  if (!token) return;
  const segs = token.split('.');
  if (segs.length !== 3) {
    panel.style.display='';
    parts.innerHTML = '<div style="color:#ef4444;padding:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:8px">✗ 不是有效的 JWT（需要3段）</div>';
    return;
  }
  let header, payload;
  try {
    header  = JSON.parse(atob(segs[0].replace(/-/g,'+').replace(/_/g,'/')));
    payload = JSON.parse(atob(segs[1].replace(/-/g,'+').replace(/_/g,'/')));
  } catch(e) {
    panel.style.display='';
    parts.innerHTML = '<div style="color:#ef4444">解析失败：' + e.message + '</div>';
    return;
  }
  const now = Math.floor(Date.now()/1000);
  const exp = payload.exp;
  const expired = exp && exp < now;
  const expStr = exp ? new Date(exp*1000).toLocaleString('zh-CN') : '无';
  const iatStr = payload.iat ? new Date(payload.iat*1000).toLocaleString('zh-CN') : '无';
  const nbfStr = payload.nbf ? new Date(payload.nbf*1000).toLocaleString('zh-CN') : '无';

  panel.style.display='';
  parts.innerHTML =
    // 状态标签
    '<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">' +
    _jwtBadge(header.alg||'?', 'alg', 'blue') +
    _jwtBadge(header.typ||'?', 'typ', 'blue') +
    (expired
      ? _jwtBadge('✗ 已过期', null, 'red')
      : _jwtBadge('✓ 有效', null, 'green')) +
    '</div>' +
    // 时间信息
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:16px">' +
    _jwtTimeCard('签发 (iat)', iatStr) +
    _jwtTimeCard('过期 (exp)', expStr, expired ? '#ef4444' : '#10b981') +
    (payload.nbf ? _jwtTimeCard('生效 (nbf)', nbfStr) : '') +
    (payload.sub ? _jwtTimeCard('主体 (sub)', payload.sub) : '') +
    '</div>' +
    // Header / Payload
    _jwtSection('Header', header) +
    _jwtSection('Payload', payload) +
    // Signature
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
    '<button class="copy-inline" id="' + id + '" style="position:absolute;top:8px;right:8px">复制</button>' +
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
