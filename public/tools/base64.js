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

let _b64T = null, _b64FileRun=null;

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
        <button class="btn btn-primary" data-tool-submit onclick="encodeB64()">${T('encode')}</button>
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
  const staged=FileSession.mount(el,{onUse:files=>_b64HandleFile(files[0])});
  window._activeCleanup=()=>{_b64FileRun?.abort();_b64FileRun=null;staged.dispose();};
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
    const decoded = window.ToolCompute.base64Decode(v);
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
    const result = window.ToolCompute.base64Encode(val, _isUrlSafe());
    _b64Show(result, T('encode_ok'), true);
  } catch { _b64Show(T('encode_fail'), T('error'), false); }
}

function decodeB64() {
  const T = _b64T || makeToolI18n(_b64I18nDict);
  window._b64LastOp = 'decode';
  let val = document.getElementById('b64Input').value.trim();
  if (_isUrlSafe()) val = val.replace(/-/g,'+').replace(/_/g,'/');
  try { _b64Show(window.ToolCompute.base64Decode(val), T('decode_ok'), true); }
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

async function _b64HandleFile(file) {
  if(!file)return;_b64FileRun?.abort();const controller=new AbortController();_b64FileRun=controller;
  const T=_b64T,root=document.getElementById('b64FileResultPanel'),info=document.getElementById('b64FileInfo'),preview=document.getElementById('b64FileDataUrl');
  root.style.display='';info.textContent=getCurrentLang()==='en'?'Processing…':'处理中…';preview.value='';document.getElementById('b64FilePreview').style.display='none';
  root.querySelector('button[onclick]').disabled=true;
  root.querySelector('[data-file-controls]')?.remove();const controls=document.createElement('div');controls.dataset.fileControls='';controls.className='tool-actions';const cancel=document.createElement('button');cancel.className='btn btn-secondary';cancel.textContent=getCurrentLang()==='en'?'Cancel':'取消';cancel.onclick=()=>{controller.abort();info.textContent=getCurrentLang()==='en'?'Cancelled':'已取消';cancel.disabled=true;};controls.append(cancel);root.append(controls);
  try{
    FileSession.replace([file]);const generation=FileSession.generation(),source=FileSession.list().find(x=>x.origin==='selected');
    const output=await(await ToolCompute.load('file')).convert(file,'base64_encode',{dataUrl:true},{signal:controller.signal});
    if(controller.signal.aborted||!root.isConnected||_b64FileRun!==controller)return;FileSession.getFile(source.id);
    const artifact=FileSession.addResult(output.blob,output.name,generation);const text=await output.blob.slice(0,64000).text();
    if(controller.signal.aborted||!root.isConnected||_b64FileRun!==controller)return;
    preview.value=text;info.textContent=file.name+' · '+file.size+' B'+(output.blob.size>64000?(getCurrentLang()==='en'?' · Preview truncated; copy / download keeps full output.':' · 预览已截断，复制和下载保留完整内容。'):'');
    const copy=root.querySelector('button[onclick]');copy.disabled=false;copy.onclick=async()=>{try{const full=await FileSession.getFile(artifact.id).text();copyText(full,copy);}catch(e){showToast(e.message,'error');}};
    controls.replaceChildren();const download=document.createElement('button');download.className='btn btn-secondary';download.dataset.fileDownload=artifact.id;download.textContent=getCurrentLang()==='en'?'Download / reuse result':'下载结果（可继续复用）';download.onclick=()=>{try{FileSession.download(artifact.id);}catch(e){showToast(e.message,'error');}};controls.append(download);
    return {success:true,data:{files:[artifact]}};
  }catch(e){if(!controller.signal.aborted&&root.isConnected&&_b64FileRun===controller)info.textContent=e.message;return {success:false,error:e.message};}
}
async function _b64RestoreFile(){
  _b64FileRun?.abort();const controller=new AbortController();_b64FileRun=controller;const root=document.getElementById('b64RestorePreview'),input=document.getElementById('b64RestoreInput'),value=input.value,generation=FileSession.generation();root.textContent='';
  try{
    const compute=await ToolCompute.load('file'),file=new File([value],'restored-file.txt',{type:'text/plain'}),output=await compute.convert(file,'base64_decode',{}, {signal:controller.signal});
    if(controller.signal.aborted||!root.isConnected||input.value!==value)return;
    const artifact=FileSession.addResult(output.blob,'restored-file'+(_b64MimeToExt(output.blob.type)||'.bin'),generation);FileSession.download(artifact.id);root.textContent=_b64T('restore_ok');return {success:true,data:{files:[artifact]}};
  }catch(e){if(!controller.signal.aborted&&root.isConnected)root.textContent=e.message;return {success:false,error:e.message};}
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
