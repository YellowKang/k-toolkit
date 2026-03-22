function renderImgBase64(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">图片 → Base64</div>
      <div id="imgDropZone" style="border:2px dashed rgba(102,126,234,0.3);border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all 0.2s" onclick="document.getElementById('imgFile').click()" ondragover="event.preventDefault();this.style.borderColor='rgba(102,126,234,0.7);this.style.background=rgba(102,126,234,0.05)'" ondragleave="this.style.borderColor='rgba(102,126,234,0.3)';this.style.background=''" ondrop="handleImgDrop(event)">
        <div style="font-size:40px;margin-bottom:10px">🖼️</div>
        <div style="font-size:14px;color:var(--text)">点击或拖拽图片到此处</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:6px">支持 PNG / JPG / GIF / WebP / SVG</div>
      </div>
      <input type="file" id="imgFile" accept="image/*" style="display:none" onchange="handleImgFile(this.files[0])">
    </div>
    <div class="tool-card-panel" id="imgResultPanel" style="display:none">
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">
        <img id="imgPreview" style="max-width:160px;max-height:120px;border-radius:10px;border:1px solid var(--glass-border);object-fit:contain">
        <div id="imgInfo" style="font-size:13px;color:var(--text-muted);line-height:2"></div>
      </div>
      <div class="panel-label">Base64 Data URL</div>
      <textarea class="tool-textarea" id="imgB64Output" rows="5" readonly style="font-family:monospace;font-size:11px"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="copyText(document.getElementById('imgB64Output').value,this)">复制 Base64</button>
        <button class="btn btn-secondary" onclick="copyText('&lt;img src=&quot;'+document.getElementById('imgB64Output').value+'&quot;&gt;',this)">复制 HTML img 标签</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">Base64 → 图片预览</div>
      <textarea class="tool-textarea" id="b64ToImgInput" rows="4" placeholder="粘贴 Base64 Data URL 或纯 Base64..."></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="previewB64Img()">预览图片</button>
      </div>
      <div id="b64ImgPreview" style="margin-top:12px"></div>
    </div>`;
}

function handleImgDrop(e) {
  e.preventDefault();
  document.getElementById('imgDropZone').style.borderColor='rgba(102,126,234,0.3)';
  document.getElementById('imgDropZone').style.background='';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleImgFile(file);
}

function handleImgFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    document.getElementById('imgPreview').src = dataUrl;
    document.getElementById('imgB64Output').value = dataUrl;
    document.getElementById('imgInfo').innerHTML =
      `<div>文件名: <strong>${file.name}</strong></div>
       <div>大小: <strong>${(file.size/1024).toFixed(2)} KB</strong></div>
       <div>类型: <strong>${file.type}</strong></div>
       <div>Base64 长度: <strong>${dataUrl.length} 字符</strong></div>`;
    document.getElementById('imgResultPanel').style.display='';
  };
  reader.readAsDataURL(file);
}

function previewB64Img() {
  let val = document.getElementById('b64ToImgInput').value.trim();
  const out = document.getElementById('b64ImgPreview');
  if (!val) return;
  if (!val.startsWith('data:')) val = 'data:image/png;base64,' + val;
  out.innerHTML = `<img src="${val}" style="max-width:100%;max-height:300px;border-radius:10px;border:1px solid var(--glass-border);display:block" onerror="this.parentElement.innerHTML='<span style=color:#e74c3c>无法预览：无效的 Base64 图片</span>'">`;
}
