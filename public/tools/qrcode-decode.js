/* ── 二维码识别：jsQR 本地库；识别结果属于不可信内容，只用 textContent / DOM 属性渲染 ── */

const _qrdDict = {
  zh: {
    upload: '上传二维码图片',
    drop: '点击、拖拽或粘贴（Ctrl/⌘+V）图片到此处',
    formats: '支持 PNG / JPG / GIF / BMP / WebP，图片只在本地识别',
    decoding: '识别中...',
    ok: '✓ 识别成功',
    none: '✗ 未检测到二维码，请确认图片清晰、二维码完整',
    lib_fail: '✗ 识别库加载失败，请刷新后重试',
    bad_image: '✗ 无法读取该图片',
    copy: '复制内容',
    open: '打开链接',
    open_warn: '请确认链接可信后再打开',
  },
  en: {
    upload: 'Upload a QR code image',
    drop: 'Click, drop or paste (Ctrl/⌘+V) an image here',
    formats: 'PNG / JPG / GIF / BMP / WebP — decoded locally',
    decoding: 'Decoding...',
    ok: '✓ Decoded',
    none: '✗ No QR code found; make sure the image is sharp and the code is complete',
    lib_fail: '✗ Failed to load the decoder; refresh and try again',
    bad_image: '✗ Could not read this image',
    copy: 'Copy',
    open: 'Open link',
    open_warn: 'Only open links you trust',
  },
};

function renderQRCodeDecode(el) {
  const T = makeToolI18n(_qrdDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:12px">${T('upload')}</div>
      <div id="qrdDropZone" role="button" tabindex="0" style="border:2px dashed var(--glass-border);border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all 0.2s"
        ondragover="qrdDragOver(event)" ondragleave="qrdDragLeave(event)" ondrop="qrdDrop(event)" onclick="document.getElementById('qrdFile').click()"
        onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('qrdFile').click()}">
        <div style="font-size:48px;margin-bottom:12px">📷</div>
        <div style="color:var(--text-muted);font-size:14px">${T('drop')}</div>
        <div style="color:var(--text-muted);font-size:12px;margin-top:6px">${T('formats')}</div>
      </div>
      <input type="file" id="qrdFile" accept="image/*" style="display:none" onchange="qrdHandleFile(this.files[0]);this.value=''">
    </div>
    <div class="tool-card-panel" id="qrdResult" style="display:none">
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <img id="qrdPreview" alt="" style="max-width:160px;max-height:160px;border-radius:10px;border:1px solid var(--glass-border)">
        <div style="flex:1;min-width:200px">
          <div class="panel-label" style="margin-bottom:8px" id="qrdStatus"></div>
          <div id="qrdContent" style="word-break:break-all;white-space:pre-wrap;font-size:14px;line-height:1.7;padding:12px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px"></div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center" id="qrdActions"></div>
        </div>
      </div>
    </div>`;
  const onPaste = e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); qrdHandleFile(item.getAsFile()); }
  };
  _qrdShared = ImageSession.mount(el, { onUse: files => qrdHandleFile(files[0], false) });
  document.addEventListener('paste', onPaste);
  window._activeCleanup = () => {
    document.removeEventListener('paste', onPaste);
    _qrdRevision++; _qrdController?.abort(); _qrdShared?.dispose();
    if (_qrdUrl) { URL.revokeObjectURL(_qrdUrl); _qrdUrl = null; }
  };
  ToolCompute.loadVendor('jsqr').catch(() => {});
}

function qrdDragOver(e) {
  e.preventDefault();
  document.getElementById('qrdDropZone').style.borderColor = 'var(--accent)';
}
function qrdDragLeave() {
  document.getElementById('qrdDropZone').style.borderColor = 'var(--glass-border)';
}
function qrdDrop(e) {
  e.preventDefault();
  qrdDragLeave();
  const file = e.dataTransfer.files[0];
  if (file) qrdHandleFile(file);
}

let _qrdRevision = 0, _qrdUrl = null, _qrdShared = null, _qrdController = null;
function _qrdStatus(text, color) {
  const status = document.getElementById('qrdStatus');
  if (!status) return;
  status.textContent = text;
  status.style.color = color;
}

async function qrdHandleFile(file, remember = true) {
  const T = makeToolI18n(_qrdDict);
  if (!file) return;
  _qrdController?.abort();
  const revision = ++_qrdRevision, controller = _qrdController = new AbortController();
  if (remember && !_qrdShared.remember([file])) return;
  const img = document.getElementById('qrdPreview');
  if (_qrdUrl) URL.revokeObjectURL(_qrdUrl);
  _qrdUrl = URL.createObjectURL(file); img.src = _qrdUrl;
  document.getElementById('qrdResult').style.display = '';
  _qrdStatus(T('decoding'), 'var(--text-muted)');
  document.getElementById('qrdContent').textContent = '';
  document.getElementById('qrdActions').replaceChildren();
  try {
    const data = await (await ToolCompute.load('image')).qr(file, { signal: controller.signal });
    if (!controller.signal.aborted && revision === _qrdRevision && img.isConnected) qrdRenderText(data.result);
  } catch (error) {
    if (!controller.signal.aborted && revision === _qrdRevision && img.isConnected) _qrdStatus(error.message, 'var(--danger)');
  }
}

/** Render the decoded text without interpreting it as HTML. */
function qrdRunDecode(imageData, canvas, decode = window.jsQR) {
  const T = makeToolI18n(_qrdDict);
  const code = decode(imageData.data, canvas.width, canvas.height);
  document.getElementById('qrdActions').replaceChildren();
  document.getElementById('qrdContent').textContent = '';
  if (!code) { _qrdStatus(T('none'), '#e74c3c'); return; }
  qrdRenderText(code.data);
}
function qrdRenderText(text) {
  const T = makeToolI18n(_qrdDict), actions = document.getElementById('qrdActions'); actions.replaceChildren();
  _qrdStatus(T('ok'), '#10b981');
  document.getElementById('qrdContent').textContent = text;
  const copy = document.createElement('button');
  copy.className = 'btn btn-secondary';
  copy.textContent = T('copy');
  copy.onclick = () => copyText(text, copy);
  actions.append(copy);
  let url = null;
  try { url = new URL(text); } catch {}
  if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
    const link = document.createElement('a');
    link.className = 'btn btn-primary';
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = T('open');
    link.title = T('open_warn');
    actions.append(link);
  }
}
