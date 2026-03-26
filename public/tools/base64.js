/* ── Base64 编码/解码 — 文本模式 + 文件模式 ── */

const _b64I18nDict = {
  zh: {
    input_label:    '输入内容',
    realtime:       '实时',
    mode_text:      '文本模式',
    mode_url:       'URL 安全模式',
    input_ph:       '输入要编码或解码的内容...',
    encode:         '编码 Base64 →',
    decode:         '← 解码 Base64',
    swap:           '↕ 互换',
    clear:          '清空',
    use_as_input:   '用作输入',
    copy_result:    '复制结果',
    chars:          (n) => `${n} 字符`,
    encode_ok:      '编码成功',
    decode_ok:      '解码成功',
    decode_result:  '解码结果',
    error:          '错误',
    encode_fail:    '编码失败：包含无法编码的字符',
    decode_fail:    '解码失败：内容不是有效的 Base64',
    filled:         '已填入输入框',
    file_panel:     '文件模式',
    file_drop:      '点击或拖拽文件到此处',
    file_drop_sub:  '支持任意文件类型',
    file_name:      '文件名',
    file_size:      '大小',
    file_type:      '类型',
    b64_length:     'Base64 长度',
    copy_dataurl:   '复制 Data URL',
    restore_panel:  'Data URL → 还原文件',
    restore_ph:     '粘贴 data:MIME;base64,... 格式的 Data URL',
    restore_btn:    '还原文件',
    restore_fail:   '无效的 Data URL 格式',
    restore_ok:     '文件已生成，开始下载',
    preview:        '图片预览',
  },
  en: {
    input_label:    'Input',
    realtime:       'Live',
    mode_text:      'Text Mode',
    mode_url:       'URL-safe Mode',
    input_ph:       'Enter text to encode or decode...',
    encode:         'Encode Base64 →',
    decode:         '← Decode Base64',
    swap:           '↕ Swap',
    clear:          'Clear',
    use_as_input:   'Use as Input',
    copy_result:    'Copy Result',
    chars:          (n) => `${n} chars`,
    encode_ok:      'Encoded',
    decode_ok:      'Decoded',
    decode_result:  'Decode Result',
    error:          'Error',
    encode_fail:    'Encode failed: contains unencodable characters',
    decode_fail:    'Decode failed: invalid Base64 input',
    filled:         'Filled into input',
    file_panel:     'File Mode',
    file_drop:      'Click or drop a file here',
    file_drop_sub:  'Any file type supported',
    file_name:      'Name',
    file_size:      'Size',
    file_type:      'Type',
    b64_length:     'Base64 length',
    copy_dataurl:   'Copy Data URL',
    restore_panel:  'Data URL → Restore File',
    restore_ph:     'Paste data:MIME;base64,... Data URL here',
    restore_btn:    'Restore File',
    restore_fail:   'Invalid Data URL format',
    restore_ok:     'File generated, downloading',
    preview:        'Image Preview',
  },
};

let _b64T = null;

function renderBase64(el) {
  _b64T = makeToolI18n(_b64I18nDict);
  const T = _b64T;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('input_label')}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <label style="font-size:12px;color:var(--text-muted)">${T('realtime')}</label>
          <input type="checkbox" id="b64Realtime" checked onchange="_b64OnChange()">
          <select id="b64Mode" class="tool-input" style="width:auto;font-size:12px">
            <option value="text">${T('mode_text')}</option>
            <option value="url">${T('mode_url')}</option>
          </select>
        </div>
      </div>
      <textarea class="tool-textarea" id="b64Input" rows="6" placeholder="${T('input_ph')}"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="encodeB64()">${T('encode')}</button>
        <button class="btn btn-primary" onclick="decodeB64()">${T('decode')}</button>
        <button class="btn btn-secondary" onclick="b64Swap()">${T('swap')}</button>
        <button class="btn btn-secondary" onclick="clearB64()">${T('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="b64ResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="panel-label" style="margin:0" id="b64Status"></div>
          <span id="b64CharCount" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="b64UseAsInput()">${T('use_as_input')}</button>
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('b64Output').textContent, this)">${T('copy_result')}</button>
        </div>
      </div>
      <div class="result-box" id="b64Output" style="word-break:break-all"></div>
    </div>

    <!-- ── File Mode Panel ── -->
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('file_panel')}</div>
      <div id="b64FileDropZone" style="border:2px dashed rgba(102,126,234,0.3);border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all 0.2s"
           onclick="document.getElementById('b64FileInput').click()"
           ondragover="event.preventDefault();this.style.borderColor='rgba(102,126,234,0.7)';this.style.background='rgba(102,126,234,0.05)'"
           ondragleave="this.style.borderColor='rgba(102,126,234,0.3)';this.style.background=''"
           ondrop="_b64FileDrop(event)">
        <div style="font-size:40px;margin-bottom:10px">📁</div>
        <div style="font-size:14px;color:var(--text)">${T('file_drop')}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px">${T('file_drop_sub')}</div>
      </div>
      <input type="file" id="b64FileInput" style="display:none" onchange="_b64HandleFile(this.files[0])">
    </div>

    <!-- File encode result -->
    <div class="tool-card-panel" id="b64FileResultPanel" style="display:none">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;align-items:flex-start">
        <img id="b64FilePreview" style="max-width:160px;max-height:120px;border-radius:10px;border:1px solid var(--glass-border);object-fit:contain;display:none">
        <div id="b64FileInfo" style="font-size:13px;color:var(--text-muted);line-height:2"></div>
      </div>
      <textarea class="tool-textarea" id="b64FileDataUrl" rows="5" readonly style="font-family:monospace;font-size:11px"></textarea>
      <div class="tool-actions" style="margin-top:10px">
        <button class="btn btn-primary" onclick="copyText(document.getElementById('b64FileDataUrl').value, this)">${T('copy_dataurl')}</button>
      </div>
    </div>

    <!-- Data URL → Restore file -->
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('restore_panel')}</div>
      <textarea class="tool-textarea" id="b64RestoreInput" rows="4" placeholder="${T('restore_ph')}"></textarea>
      <div class="tool-actions" style="margin-top:10px">
        <button class="btn btn-primary" onclick="_b64RestoreFile()">${T('restore_btn')}</button>
      </div>
      <div id="b64RestorePreview" style="margin-top:12px"></div>
    </div>`;

  document.getElementById('b64Input').addEventListener('input', _b64OnChange);
  window._b64LastOp = 'encode';
}

/* ── Text mode functions (unchanged logic) ── */

function _b64OnChange() {
  if (!document.getElementById('b64Realtime').checked) return;
  const val = document.getElementById('b64Input').value;
  if (!val) { document.getElementById('b64ResultPanel').style.display = 'none'; return; }
  const looksB64 = /^[A-Za-z0-9+/\-_]*={0,2}$/.test(val.trim().replace(/\s/g,''));
  if (window._b64LastOp === 'decode' || looksB64) {
    _b64TryDecode(val);
  } else {
    encodeB64();
  }
}

function _b64TryDecode(val) {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  let v = val.trim().replace(/\s/g,'');
  if (_isUrlSafe()) v = v.replace(/-/g,'+').replace(/_/g,'/');
  try {
    const decoded = decodeURIComponent(escape(atob(v)));
    _b64Show(decoded, T('decode_result'), true);
  } catch {
    encodeB64();
  }
}

function _isUrlSafe() {
  return document.getElementById('b64Mode').value === 'url';
}

function _b64Show(text, label, ok) {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  const panel = document.getElementById('b64ResultPanel');
  document.getElementById('b64Output').textContent = text;
  const st = document.getElementById('b64Status');
  st.textContent = label;
  st.style.color = ok ? '#10b981' : '#ef4444';
  const cc = document.getElementById('b64CharCount');
  cc.textContent = T('chars', text.length);
  panel.style.display = '';
}

function encodeB64() {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  window._b64LastOp = 'encode';
  const val = document.getElementById('b64Input').value;
  try {
    let result = btoa(unescape(encodeURIComponent(val)));
    if (_isUrlSafe()) result = result.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    _b64Show(result, T('encode_ok'), true);
  } catch { _b64Show(T('encode_fail'), T('error'), false); }
}

function decodeB64() {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  window._b64LastOp = 'decode';
  let val = document.getElementById('b64Input').value.trim();
  if (_isUrlSafe()) val = val.replace(/-/g,'+').replace(/_/g,'/');
  try { _b64Show(decodeURIComponent(escape(atob(val))), T('decode_ok'), true); }
  catch { _b64Show(T('decode_fail'), T('error'), false); }
}

function b64Swap() {
  const out = document.getElementById('b64Output').textContent;
  if (!out) return;
  document.getElementById('b64Input').value = out;
  document.getElementById('b64ResultPanel').style.display = 'none';
}

function b64UseAsInput() {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  const out = document.getElementById('b64Output').textContent;
  if (!out) return;
  document.getElementById('b64Input').value = out;
  document.getElementById('b64ResultPanel').style.display = 'none';
  showToast(T('filled'), 'info');
}

function clearB64() {
  document.getElementById('b64Input').value = '';
  document.getElementById('b64ResultPanel').style.display = 'none';
  window._b64LastOp = 'encode';
}

/* ── File mode functions ── */

function _b64FileDrop(e) {
  e.preventDefault();
  const zone = document.getElementById('b64FileDropZone');
  zone.style.borderColor = 'rgba(102,126,234,0.3)';
  zone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (file) _b64HandleFile(file);
}

function _b64HandleFile(file) {
  if (!file) return;
  const T = _b64T || makeToolI18n(_b64I18nDict);
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const previewImg = document.getElementById('b64FilePreview');
    const isImage = file.type.startsWith('image/');

    // Show thumbnail if image
    if (isImage) {
      previewImg.src = dataUrl;
      previewImg.style.display = '';
    } else {
      previewImg.style.display = 'none';
    }

    // File info
    const sizeKB = (file.size / 1024).toFixed(2);
    document.getElementById('b64FileInfo').innerHTML =
      `<div>${T('file_name')}: <strong>${file.name}</strong></div>
       <div>${T('file_size')}: <strong>${sizeKB} KB</strong></div>
       <div>${T('file_type')}: <strong>${file.type || 'unknown'}</strong></div>
       <div>${T('b64_length')}: <strong>${dataUrl.length}</strong> ${T('chars', '')}</div>`;

    document.getElementById('b64FileDataUrl').value = dataUrl;
    document.getElementById('b64FileResultPanel').style.display = '';
  };
  reader.readAsDataURL(file);
}

function _b64RestoreFile() {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  const val = document.getElementById('b64RestoreInput').value.trim();
  const previewDiv = document.getElementById('b64RestorePreview');

  // Validate data URL format
  const match = val.match(/^data:([^;,]+)?;base64,(.+)$/s);
  if (!match) {
    showToast(T('restore_fail'), 'error');
    previewDiv.innerHTML = '';
    return;
  }

  const mime = match[1] || 'application/octet-stream';
  const b64Data = match[2];

  // Decode base64 to binary
  let byteString;
  try {
    byteString = atob(b64Data);
  } catch {
    showToast(T('restore_fail'), 'error');
    previewDiv.innerHTML = '';
    return;
  }

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mime });

  // Determine filename extension from MIME
  const ext = _b64MimeToExt(mime);
  const filename = 'restored-file' + ext;

  // Trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(T('restore_ok'), 'success');

  // If it's an image, show preview
  if (mime.startsWith('image/')) {
    previewDiv.innerHTML = `
      <div class="panel-label" style="margin-bottom:8px">${T('preview')}</div>
      <img src="${val}" style="max-width:100%;max-height:300px;border-radius:10px;border:1px solid var(--glass-border);display:block"
           onerror="this.style.display='none'">`;
  } else {
    previewDiv.innerHTML = '';
  }
}

function _b64MimeToExt(mime) {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp',
    'image/x-icon': '.ico',
    'application/pdf': '.pdf',
    'application/json': '.json',
    'application/xml': '.xml',
    'application/zip': '.zip',
    'text/plain': '.txt',
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'application/octet-stream': '.bin',
  };
  return map[mime] || '.' + (mime.split('/')[1] || 'bin');
}
