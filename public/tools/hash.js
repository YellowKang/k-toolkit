function renderHash(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">文本哈希</div>
      <textarea class="tool-textarea" id="hashInput" rows="5" placeholder="输入要计算哈希的文本..." oninput="_hashRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="calcHash()">计算哈希</button>
        <button class="btn btn-secondary" onclick="clearHash()">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="hashResultPanel" style="display:none">
      <div class="panel-label" style="margin-bottom:12px">哈希结果</div>
      <div id="hashResults"></div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">文件哈希</div>
        <span style="font-size:12px;color:var(--text-muted)">支持任意文件</span>
      </div>
      <div id="hashDropZone" style="border:2px dashed rgba(102,126,234,0.3);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s" onclick="document.getElementById('hashFileInput').click()" ondragover="hashDragOver(event)" ondragleave="hashDragLeave(event)" ondrop="hashDrop(event)">
        <div style="font-size:28px;margin-bottom:8px">📂</div>
        <div style="font-size:13px;color:var(--text-muted)">拖拽文件到此处，或点击选择文件</div>
      </div>
      <input type="file" id="hashFileInput" style="display:none" onchange="hashFileInput(this)">
      <div id="fileHashResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">哈希校验</div>
      <input class="tool-input" id="hashVerifyInput" placeholder="粘贴已知哈希值进行比对..." style="margin-bottom:8px">
      <div id="hashVerifyResult"></div>
    </div>`;

  document.getElementById('hashVerifyInput').addEventListener('input', () => {
    const known = document.getElementById('hashVerifyInput').value.trim().toLowerCase();
    const results = document.getElementById('hashResults').querySelectorAll('[data-hash]');
    if (!known || !results.length) { document.getElementById('hashVerifyResult').innerHTML = ''; return; }
    let found = false;
    results.forEach(el => {
      if (el.dataset.hash === known) {
        document.getElementById('hashVerifyResult').innerHTML = `<div style="color:#10b981;font-size:13px;padding:8px 12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:8px">✓ 与 ${el.dataset.algo} 匹配</div>`;
        found = true;
      }
    });
    if (!found && known.length > 10) {
      document.getElementById('hashVerifyResult').innerHTML = `<div style="color:#ef4444;font-size:13px;padding:8px 12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:8px">✗ 不匹配任何算法的哈希值</div>`;
    }
  });
}

async function calcHash() {
  const text = document.getElementById('hashInput').value;
  if (!text) return;
  const enc = new TextEncoder().encode(text);
  const algos = ['SHA-1','SHA-256','SHA-384','SHA-512'];
  const hashes = await Promise.all(algos.map(async a => ({
    name: a, hex: bufToHex(await crypto.subtle.digest(a, enc))
  })));
  _showHashResults(hashes);
}

function _showHashResults(hashes) {
  const panel = document.getElementById('hashResultPanel');
  document.getElementById('hashResults').innerHTML = hashes.map(h => `
    <div class="result-row" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="color:var(--text-muted);width:76px;flex-shrink:0;font-size:12px;font-weight:600">${h.name}</span>
      <span style="font-family:monospace;font-size:12px;word-break:break-all;flex:1;color:var(--neon)" data-hash="${h.hex}" data-algo="${h.name}">${h.hex}</span>
      <button class="copy-inline" onclick="copyText('${h.hex}',this)">复制</button>
    </div>`).join('');
  panel.style.display = '';
}

function hashDragOver(e) {
  e.preventDefault();
  document.getElementById('hashDropZone').style.borderColor = 'var(--accent)';
  document.getElementById('hashDropZone').style.background = 'rgba(102,126,234,0.06)';
}
function hashDragLeave(e) {
  document.getElementById('hashDropZone').style.borderColor = 'rgba(102,126,234,0.3)';
  document.getElementById('hashDropZone').style.background = '';
}
function hashDrop(e) {
  e.preventDefault();
  hashDragLeave(e);
  if (e.dataTransfer.files[0]) hashFile(e.dataTransfer.files[0]);
}
function hashFileInput(input) { if (input.files[0]) hashFile(input.files[0]); }

async function hashFile(file) {
  const zone = document.getElementById('hashDropZone');
  zone.innerHTML = '<div style="color:var(--text-muted);font-size:13px">计算中...</div>';
  const buf = await file.arrayBuffer();
  const algos = ['SHA-1','SHA-256','SHA-512'];
  const hashes = await Promise.all(algos.map(async a => ({name:a, hex:bufToHex(await crypto.subtle.digest(a,buf))})));
  zone.innerHTML = `
    <div style="margin-bottom:10px;padding:10px 14px;background:rgba(102,126,234,0.08);border:1px solid rgba(102,126,234,0.2);border-radius:8px">
      <div style="font-size:13px;font-weight:600">${escHtml(file.name)}</div>
      <div style="font-size:12px;color:var(--text-muted)">${(file.size/1024).toFixed(2)} KB · ${file.type||'未知类型'}</div>
    </div>` +
    hashes.map(h => `
      <div class="result-row" style="margin-bottom:8px;display:flex;align-items:center;gap:10px">
        <span style="color:var(--text-muted);width:76px;flex-shrink:0;font-size:12px;font-weight:600">${h.name}</span>
        <span style="font-family:monospace;font-size:12px;word-break:break-all;flex:1;color:var(--neon)">${h.hex}</span>
        <button class="copy-inline" onclick="copyText('${h.hex}',this)">复制</button>
      </div>`).join('');
}

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

let _hashTimer = null;
function _hashRealtime() {
  clearTimeout(_hashTimer);
  const val = document.getElementById('hashInput').value;
  if (!val) { document.getElementById('hashResultPanel').style.display='none'; return; }
  _hashTimer = setTimeout(calcHash, 300);
}

function clearHash() {
  document.getElementById('hashInput').value='';
  document.getElementById('hashResultPanel').style.display='none';
}
