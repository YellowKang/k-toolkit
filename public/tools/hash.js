/* ── Hash Generator — Text Hash / File Hash (batch) / HMAC / Verify ── */

/* ── i18n dictionary ── */
const _hashI18nDict = {
  zh: {
    text_hash:        '文本哈希',
    text_placeholder: '输入要计算哈希的文本...',
    calc_hash:        '计算哈希',
    clear:            '清空',
    hash_result:      '哈希结果',
    copy:             '复制',
    file_hash:        '文件哈希',
    file_support:     '支持任意文件，可批量',
    file_drop_hint:   '拖拽文件到此处，或点击选择文件',
    computing:        '计算中...',
    unknown_type:     '未知类型',
    hash_verify:      '哈希校验',
    verify_placeholder:'粘贴已知哈希值进行比对...',
    verify_match:     (algo) => `\u2713 与 ${algo} 匹配`,
    verify_no_match:  '\u2717 不匹配任何算法的哈希值',
    hmac_title:       'HMAC',
    hmac_algo:        '算法',
    hmac_key:         '密钥 (Key)',
    hmac_key_placeholder: '输入 HMAC 密钥...',
    hmac_msg:         '消息 (Message)',
    hmac_msg_placeholder: '输入要计算 HMAC 的消息...',
    hmac_result:      'HMAC 结果 (Hex)',
    hmac_calc:        '计算 HMAC',
    hmac_clear:       '清空',
    hmac_empty_key:   '请输入密钥',
    hmac_empty_msg:   '请输入消息',
  },
  en: {
    text_hash:        'Text Hash',
    text_placeholder: 'Enter text to hash...',
    calc_hash:        'Calculate Hash',
    clear:            'Clear',
    hash_result:      'Hash Result',
    copy:             'Copy',
    file_hash:        'File Hash',
    file_support:     'Any file type, batch supported',
    file_drop_hint:   'Drop files here, or click to select',
    computing:        'Computing...',
    unknown_type:     'Unknown type',
    hash_verify:      'Hash Verify',
    verify_placeholder:'Paste a known hash to compare...',
    verify_match:     (algo) => `\u2713 Matches ${algo}`,
    verify_no_match:  '\u2717 Does not match any algorithm',
    hmac_title:       'HMAC',
    hmac_algo:        'Algorithm',
    hmac_key:         'Key',
    hmac_key_placeholder: 'Enter HMAC key...',
    hmac_msg:         'Message',
    hmac_msg_placeholder: 'Enter message for HMAC...',
    hmac_result:      'HMAC Result (Hex)',
    hmac_calc:        'Calculate HMAC',
    hmac_clear:       'Clear',
    hmac_empty_key:   'Please enter a key',
    hmac_empty_msg:   'Please enter a message',
  },
};

let _hashT = null;

function renderHash(el) {
  _hashT = makeToolI18n(_hashI18nDict);
  const T = _hashT;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('text_hash')}</div>
      <textarea class="tool-textarea" id="hashInput" rows="5" placeholder="${T('text_placeholder')}" oninput="_hashRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="calcHash()">${T('calc_hash')}</button>
        <button class="btn btn-secondary" onclick="clearHash()">${T('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="hashResultPanel" style="display:none">
      <div class="panel-label" style="margin-bottom:12px">${T('hash_result')}</div>
      <div id="hashResults"></div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">${T('file_hash')}</div>
        <span style="font-size:12px;color:var(--text-muted)">${T('file_support')}</span>
      </div>
      <div id="hashDropZone" style="border:2px dashed rgba(102,126,234,0.3);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s" onclick="document.getElementById('hashFileInput').click()" ondragover="hashDragOver(event)" ondragleave="hashDragLeave(event)" ondrop="hashDrop(event)">
        <div style="font-size:28px;margin-bottom:8px">\ud83d\udcc2</div>
        <div style="font-size:13px;color:var(--text-muted)">${T('file_drop_hint')}</div>
      </div>
      <input type="file" id="hashFileInput" style="display:none" multiple onchange="hashFileSelected(this)">
      <div id="fileHashResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('hash_verify')}</div>
      <input class="tool-input" id="hashVerifyInput" placeholder="${T('verify_placeholder')}" style="margin-bottom:8px">
      <div id="hashVerifyResult"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:12px">${T('hmac_title')}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <span style="color:var(--text-muted);font-size:13px;white-space:nowrap">${T('hmac_algo')}</span>
        <select id="hmacAlgo" class="tool-input" style="width:auto" onchange="_hmacRealtime()">
          <option value="SHA-1">SHA-1</option>
          <option value="SHA-256" selected>SHA-256</option>
          <option value="SHA-384">SHA-384</option>
          <option value="SHA-512">SHA-512</option>
        </select>
      </div>
      <div style="margin-bottom:10px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${T('hmac_key')}</div>
        <input class="tool-input" id="hmacKeyInput" placeholder="${T('hmac_key_placeholder')}" oninput="_hmacRealtime()">
      </div>
      <div style="margin-bottom:12px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${T('hmac_msg')}</div>
        <textarea class="tool-textarea" id="hmacMsgInput" rows="4" placeholder="${T('hmac_msg_placeholder')}" oninput="_hmacRealtime()"></textarea>
      </div>
      <div class="tool-actions" style="margin-bottom:12px">
        <button class="btn btn-primary" onclick="calcHmac()">${T('hmac_calc')}</button>
        <button class="btn btn-secondary" onclick="clearHmac()">${T('hmac_clear')}</button>
      </div>
      <div id="hmacResultPanel" style="display:none">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${T('hmac_result')}</div>
        <div id="hmacResultBox" style="display:flex;align-items:center;gap:10px">
          <span id="hmacResultHex" style="font-family:monospace;font-size:12px;word-break:break-all;flex:1;color:var(--neon)"></span>
          <button class="copy-inline" onclick="_copyHmacResult(this)">${T('copy')}</button>
        </div>
      </div>
    </div>`;

  // hash verify listener
  document.getElementById('hashVerifyInput').addEventListener('input', () => {
    const T = _hashT || makeToolI18n(_hashI18nDict);
    const known = document.getElementById('hashVerifyInput').value.trim().toLowerCase();
    const results = document.getElementById('hashResults').querySelectorAll('[data-hash]');
    if (!known || !results.length) { document.getElementById('hashVerifyResult').innerHTML = ''; return; }
    let found = false;
    results.forEach(el => {
      if (el.dataset.hash === known) {
        document.getElementById('hashVerifyResult').innerHTML = `<div style="color:#10b981;font-size:13px;padding:8px 12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:8px">${T('verify_match', el.dataset.algo)}</div>`;
        found = true;
      }
    });
    if (!found && known.length > 10) {
      document.getElementById('hashVerifyResult').innerHTML = `<div style="color:#ef4444;font-size:13px;padding:8px 12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.25);border-radius:8px">${T('verify_no_match')}</div>`;
    }
  });
}

/* ── Text Hash ── */
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
  const T = _hashT || makeToolI18n(_hashI18nDict);
  const panel = document.getElementById('hashResultPanel');
  document.getElementById('hashResults').innerHTML = hashes.map(h => `
    <div class="result-row" style="margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="color:var(--text-muted);width:76px;flex-shrink:0;font-size:12px;font-weight:600">${h.name}</span>
      <span style="font-family:monospace;font-size:12px;word-break:break-all;flex:1;color:var(--neon)" data-hash="${h.hex}" data-algo="${h.name}">${h.hex}</span>
      <button class="copy-inline" onclick="copyText('${h.hex}',this)">${T('copy')}</button>
    </div>`).join('');
  panel.style.display = '';
}

/* ── File Hash — drag-drop & multi-file support ── */
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
  const files = e.dataTransfer.files;
  if (files.length > 0) hashFiles(files);
}
function hashFileSelected(input) {
  if (input.files.length > 0) hashFiles(input.files);
}

// backward-compatible single-file entry point
async function hashFile(file) {
  await hashFiles([file]);
}

async function hashFiles(fileList) {
  const T = _hashT || makeToolI18n(_hashI18nDict);
  const zone = document.getElementById('hashDropZone');
  const files = Array.from(fileList);
  zone.innerHTML = `<div style="color:var(--text-muted);font-size:13px">${T('computing')} (${files.length})...</div>`;

  const algos = ['SHA-1','SHA-256','SHA-512'];
  const results = [];

  for (const file of files) {
    const buf = await file.arrayBuffer();
    const hashes = await Promise.all(algos.map(async a => ({
      name: a,
      hex: bufToHex(await crypto.subtle.digest(a, buf))
    })));
    results.push({ file, hashes });
  }

  zone.innerHTML = results.map(r => {
    const f = r.file;
    const sizeStr = f.size < 1024 * 1024
      ? (f.size / 1024).toFixed(2) + ' KB'
      : (f.size / 1024 / 1024).toFixed(2) + ' MB';
    return `
      <div style="margin-bottom:14px;padding:10px 14px;background:rgba(102,126,234,0.08);border:1px solid rgba(102,126,234,0.2);border-radius:8px">
        <div style="font-size:13px;font-weight:600;margin-bottom:2px">${escHtml(f.name)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${sizeStr} \u00b7 ${f.type || T('unknown_type')}</div>
        ${r.hashes.map(h => `
          <div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
            <span style="color:var(--text-muted);width:76px;flex-shrink:0;font-size:12px;font-weight:600">${h.name}</span>
            <span style="font-family:monospace;font-size:12px;word-break:break-all;flex:1;color:var(--neon)">${h.hex}</span>
            <button class="copy-inline" onclick="copyText('${h.hex}',this)">${T('copy')}</button>
          </div>`).join('')}
      </div>`;
  }).join('');
}

/* ── HMAC ── */
let _hmacTimer = null;

async function calcHmac() {
  const T = _hashT || makeToolI18n(_hashI18nDict);
  const algo = document.getElementById('hmacAlgo').value;
  const keyStr = document.getElementById('hmacKeyInput').value;
  const msg = document.getElementById('hmacMsgInput').value;
  if (!keyStr) { if (typeof showToast === 'function') showToast(T('hmac_empty_key'), 'error'); return; }
  if (!msg) { if (typeof showToast === 'function') showToast(T('hmac_empty_msg'), 'error'); return; }

  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(keyStr),
    { name: 'HMAC', hash: algo },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
  const hex = bufToHex(sig);

  document.getElementById('hmacResultHex').textContent = hex;
  document.getElementById('hmacResultPanel').style.display = '';
}

function _hmacRealtime() {
  clearTimeout(_hmacTimer);
  const keyStr = document.getElementById('hmacKeyInput').value;
  const msg = document.getElementById('hmacMsgInput').value;
  if (!keyStr || !msg) {
    document.getElementById('hmacResultPanel').style.display = 'none';
    return;
  }
  _hmacTimer = setTimeout(calcHmac, 300);
}

function clearHmac() {
  document.getElementById('hmacKeyInput').value = '';
  document.getElementById('hmacMsgInput').value = '';
  document.getElementById('hmacResultPanel').style.display = 'none';
}

function _copyHmacResult(btn) {
  const hex = document.getElementById('hmacResultHex').textContent;
  if (hex) copyText(hex, btn);
}

/* ── Shared Utilities ── */
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
