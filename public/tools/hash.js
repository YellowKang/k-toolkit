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
let _hashRevision = 0, _hmacRevision = 0, _hashFileRun = null;
const _hashSay = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;

function renderHash(el) {
  window._activeCleanup = () => { clearTimeout(_hashTimer); clearTimeout(_hmacTimer); _hashRevision++; _hmacRevision++; _hashFileRun?.controller.abort(); _hashFileRun = null; };
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
      <div id="hashDropZone" role="button" tabindex="0" onkeydown="if((event.key==='Enter'||event.key===' ')&&!event.isComposing){event.preventDefault();document.getElementById('hashFileInput').click()}" style="border:2px dashed rgba(102,126,234,0.3);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all 0.2s" onclick="document.getElementById('hashFileInput').click()" ondragover="hashDragOver(event)" ondragleave="hashDragLeave(event)" ondrop="hashDrop(event)">
        <div style="font-size:28px;margin-bottom:8px">\ud83d\udcc2</div>
        <div style="font-size:13px;color:var(--text-muted)">${T('file_drop_hint')}</div>
      </div>
      <input type="file" id="hashFileInput" style="display:none" multiple onchange="hashFileSelected(this)">
      <p style="font-size:12px;color:var(--text-muted)">${_hashSay('最多 10 个文件，每个不超过 32 MB；逐个计算。', 'Up to 10 files, 32 MB per file; processed sequentially.')}</p>
      <div class="tool-actions"><span id="hashFileStatus" role="status"></span><button id="hashFileCancel" class="btn btn-secondary" hidden onclick="cancelHashFiles()">${_hashSay('停止计算', 'Stop')}</button></div>
      <div id="fileHashResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('hash_verify')}</div>
      <label for="hashVerifySource" style="font-size:12px;color:var(--text-muted)">${_hashSay('校验来源', 'Compare against')}</label>
      <select id="hashVerifySource" class="tool-input" onchange="_hashVerify()" style="margin-bottom:8px"><option value="text">${T('text_hash')}</option><option value="file">${T('file_hash')}</option></select>
      <input class="tool-input" id="hashVerifyInput" placeholder="${T('verify_placeholder')}" style="margin-bottom:8px">
      <div id="hashVerifyResult" role="status"></div>
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
        <input class="tool-input" type="password" autocomplete="off" id="hmacKeyInput" placeholder="${T('hmac_key_placeholder')}" oninput="_hmacRealtime()">
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

  const staged=FileSession.mount(el,{multiple:true,onUse:hashFiles}),cleanup=window._activeCleanup;window._activeCleanup=()=>{cleanup?.();staged.dispose();};
  document.getElementById('hashVerifyInput').addEventListener('input', _hashVerify);
}

function _hashVerify() {
  const expected = document.getElementById('hashVerifyInput'); if (!expected) return;
  const output = document.getElementById('hashVerifyResult'); output.textContent = ''; output.style.color = 'var(--text-muted)';
  const known = expected.value.trim().toLowerCase(); if (!known) return;
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{96}|[a-f0-9]{128})$/.test(known)) { output.textContent = _hashSay('请输入 40 / 64 / 96 / 128 位十六进制摘要。', 'Enter a 40 / 64 / 96 / 128 character hex digest.'); return; }
  const file = document.getElementById('hashVerifySource').value === 'file';
  const results = document.querySelectorAll((file ? '#fileHashResult' : '#hashResults') + ' [data-hash]');
  if (!results.length) { output.textContent = _hashSay('请先计算所选来源的哈希。', 'Calculate hashes for the selected source first.'); return; }
  const matches = [...results].filter(el => el.dataset.hash === known);
  output.style.color = matches.length ? 'var(--success,#10b981)' : 'var(--danger,#ef4444)';
  output.textContent = matches.length ? matches.map(el => _hashT('verify_match', el.dataset.algo) + (el.dataset.file ? ' · ' + el.dataset.file : '')).join('；') : _hashT('verify_no_match');
}

/* ── Text Hash ── */
async function calcHash() {
  clearTimeout(_hashTimer);
  const input = document.getElementById('hashInput'); if (!input) return;
  const revision = ++_hashRevision, text = input.value;
  const enc = new TextEncoder().encode(text);
  if (enc.byteLength > 2 * 1024 * 1024) { window.showToast?.(_hashSay('文本超过 2 MB，请使用文件哈希。', 'Text exceeds 2 MB. Use file hashing.'), 'error'); return; }
  try {
    const hashes = await Promise.all(['SHA-1','SHA-256','SHA-384','SHA-512'].map(async name => ({ name, hex: bufToHex(await crypto.subtle.digest(name, enc)) })));
    if (revision !== _hashRevision || !input.isConnected || input.value !== text) return;
    _showHashResults(hashes); _hashVerify();
  } catch { if (revision === _hashRevision) window.showToast?.(_hashSay('哈希计算失败，请使用 HTTPS 或本地环境。', 'Hashing failed. Use HTTPS or localhost.'), 'error'); }
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

function cancelHashFiles() {
  _hashFileRun?.controller.abort();_hashFileRun = null;
  const button = document.getElementById('hashFileCancel'); if (button) button.hidden = true;
  const status = document.getElementById('hashFileStatus'); if (status) status.textContent = _hashSay('已停止，保留已完成的结果。', 'Stopped. Completed results kept.');
}
async function hashFiles(fileList) {
  const files = Array.from(fileList);
  if (!files.length) return;
  if (files.length > 10 || files.some(file => file.size > 32 * 1024 * 1024)) { window.showToast?.(_hashSay('最多 10 个文件，每个不超过 32 MB。', 'Up to 10 files, at most 32 MB each.'), 'error'); return; }
  try{FileSession.replace(files);}catch(e){showToast(e.message,'error');return;}
  _hashFileRun?.controller.abort();const run = {controller:new AbortController()}; _hashFileRun = run;
  const output = document.getElementById('fileHashResult'), status = document.getElementById('hashFileStatus'), cancel = document.getElementById('hashFileCancel');
  output.replaceChildren(); cancel.hidden = false;
  document.getElementById('hashVerifySource').value = 'file'; _hashVerify();
  try {
    for (let index = 0; index < files.length; index++) {
      const file = files[index]; status.textContent = _hashT('computing') + ' ' + (index + 1) + '/' + files.length + ' · ' + file.name;
      const data=await(await ToolCompute.load('file')).run(file,'hash',{algorithms:['SHA-1','SHA-256','SHA-384','SHA-512']},{signal:run.controller.signal});
      if(_hashFileRun!==run)return;
      const hashes=data.hashes.map(h=>({name:h.algorithm,hex:h.hash}));
      const card = document.createElement('div'); card.className = 'tool-card-panel';
      const title = document.createElement('p'); title.textContent = file.name + ' · ' + (file.size / 1024 / 1024).toFixed(2) + ' MB'; title.style.overflowWrap = 'anywhere'; card.appendChild(title);
      for (const hash of hashes) {
        const row = document.createElement('div'); row.className = 'result-row'; row.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px';
        const label = document.createElement('span'); label.textContent = hash.name; label.style.fontSize = '12px';
        const code = document.createElement('code'); code.textContent = hash.hex; code.dataset.hash = hash.hex; code.dataset.algo = hash.name; code.dataset.file = file.name; code.style.cssText = 'flex:1;min-width:120px;overflow-wrap:anywhere;font-size:12px';
        const button = document.createElement('button'); button.className = 'copy-inline'; button.textContent = _hashT('copy'); button.onclick = () => copyText(hash.hex, button);
        row.append(label, code, button); card.appendChild(row);
      }
      output.appendChild(card); _hashVerify();
    }
    status.textContent = _hashSay('已完成 ', 'Completed ') + files.length + '/' + files.length;
  } catch { if (_hashFileRun === run) status.textContent = _hashSay('文件读取或计算失败，已保留完成结果。', 'Could not read or hash a file. Completed results kept.'); }
  finally { if (_hashFileRun === run) { _hashFileRun = null; cancel.hidden = true; document.getElementById('hashFileInput').value = ''; } }
}

/* ── HMAC ── */
let _hmacTimer = null;

async function calcHmac() {
  const T = _hashT || makeToolI18n(_hashI18nDict);
  const algo = document.getElementById('hmacAlgo').value;
  const keyStr = document.getElementById('hmacKeyInput').value;
  const msg = document.getElementById('hmacMsgInput').value;
  if (!keyStr) { if (typeof showToast === 'function') showToast(T('hmac_empty_key'), 'error'); return; }
  clearTimeout(_hmacTimer); const revision = ++_hmacRevision;
  const source = document.getElementById('hmacMsgInput');
  try {

  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(keyStr),
    { name: 'HMAC', hash: algo },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
  const hex = bufToHex(sig);

  const output = document.getElementById('hmacResultHex');
  if (!output || !source.isConnected || revision !== _hmacRevision) return;
  output.textContent = hex;
  document.getElementById('hmacResultPanel').style.display = '';
  } catch { if (revision === _hmacRevision) window.showToast?.(_hashSay('HMAC 计算失败。', 'HMAC calculation failed.'), 'error'); }
}

function _hmacRealtime() {
  _hmacRevision++;
  document.getElementById('hmacResultPanel').style.display = 'none';
  clearTimeout(_hmacTimer);
  const keyStr = document.getElementById('hmacKeyInput').value;
  const msg = document.getElementById('hmacMsgInput').value;
  if (!keyStr) {
    document.getElementById('hmacResultPanel').style.display = 'none';
    return;
  }
  _hmacTimer = setTimeout(calcHmac, 300);
}

function clearHmac() {
  _hmacRevision++; clearTimeout(_hmacTimer);
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
  _hashRevision++;
  document.getElementById('hashResults').replaceChildren();
  document.getElementById('hashResultPanel').style.display = 'none'; _hashVerify();
  clearTimeout(_hashTimer);
  const val = document.getElementById('hashInput').value;
  if (!val) { document.getElementById('hashResultPanel').style.display='none'; return; }
  _hashTimer = setTimeout(calcHash, 300);
}

function clearHash() {
  _hashRevision++; clearTimeout(_hashTimer);
  document.getElementById('hashResults').replaceChildren(); _hashVerify();
  document.getElementById('hashInput').value='';
  document.getElementById('hashResultPanel').style.display='none';
}
