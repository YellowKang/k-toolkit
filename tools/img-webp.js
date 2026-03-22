function renderImgWebp(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">选择图片</div>
      <div id="iwDrop" style="border:2px dashed var(--glass-border);border-radius:12px;padding:40px 20px;text-align:center;cursor:pointer;transition:border-color 0.2s;position:relative" ondragover="iwDragOver(event)" ondragleave="iwDragLeave(event)" ondrop="iwDrop(event)" onclick="document.getElementById('iwFile').click()">
        <input type="file" id="iwFile" accept="image/*" style="display:none" onchange="iwLoad(this.files[0])" multiple>
        <div style="font-size:32px;margin-bottom:8px">🖼️</div>
        <div style="font-size:14px;color:var(--text-muted)">拖拽图片到此处，或点击选择</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">支持 JPG / PNG / GIF / BMP · 可多选</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:16px;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--text-muted);white-space:nowrap">WebP 质量</span>
        <input type="range" id="iwQuality" min="0.1" max="1" step="0.05" value="0.85" style="flex:1;min-width:120px" oninput="document.getElementById('iwQVal').textContent=Math.round(this.value*100)+'%'">
        <span id="iwQVal" style="color:var(--neon);font-family:monospace;font-weight:700;min-width:40px">85%</span>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="iwLossless"> 无损压缩
        </label>
      </div>
    </div>
    <div class="tool-card-panel" id="iwResults" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">转换结果</div>
        <button class="btn btn-primary" id="iwDownloadAll" onclick="iwDownloadAll()" style="display:none">全部下载</button>
      </div>
      <div id="iwList" style="display:flex;flex-direction:column;gap:12px"></div>
    </div>`;
}

function iwDragOver(e) {
  e.preventDefault();
  document.getElementById('iwDrop').style.borderColor = 'var(--accent)';
}
function iwDragLeave(e) {
  document.getElementById('iwDrop').style.borderColor = '';
}
function iwDrop(e) {
  e.preventDefault();
  document.getElementById('iwDrop').style.borderColor = '';
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
  files.forEach(iwLoad);
}

function iwLoad(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const results = document.getElementById('iwResults');
  const list = document.getElementById('iwList');
  results.style.display = '';

  const id = 'iw_' + Date.now() + Math.random().toString(36).slice(2);
  const item = document.createElement('div');
  item.id = id;
  item.style.cssText = 'padding:14px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:12px';
  item.innerHTML = `<div style="display:flex;align-items:center;gap:12px">
    <img style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--glass-border)" id="${id}_prev">
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">原始: ${iwSize(file.size)}</div>
      <div id="${id}_info" style="font-size:12px;color:var(--text-muted);margin-top:2px">转换中...</div>
    </div>
    <button class="btn btn-secondary" id="${id}_btn" style="display:none" onclick="iwDownloadOne('${id}')">下载</button>
  </div>
  <div id="${id}_compare" style="display:none;margin-top:12px;display:none"></div>`;
  list.appendChild(item);

  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById(id + '_prev').src = ev.target.result;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const quality = parseFloat(document.getElementById('iwQuality').value);
      const lossless = document.getElementById('iwLossless').checked;
      canvas.toBlob(blob => {
        if (!blob) { document.getElementById(id+'_info').textContent = '转换失败（此浏览器不支持 WebP）'; return; }
        const url = URL.createObjectURL(blob);
        item._webpUrl = url;
        item._webpName = file.name.replace(/\.[^.]+$/, '') + '.webp';
        const saved = ((1 - blob.size / file.size) * 100).toFixed(1);
        const savedColor = saved > 0 ? '#10b981' : '#ef4444';
        document.getElementById(id+'_info').innerHTML =
          `WebP: <strong style="color:var(--neon)">${iwSize(blob.size)}</strong> · 节省: <strong style="color:${savedColor}">${saved > 0 ? '-' : '+'}${Math.abs(saved)}%</strong> · ${img.naturalWidth}×${img.naturalHeight}`;
        document.getElementById(id+'_btn').style.display = '';
        document.getElementById('iwDownloadAll').style.display = '';
      }, lossless ? 'image/webp' : 'image/webp', lossless ? undefined : quality);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function iwSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}

function iwDownloadOne(id) {
  const item = document.getElementById(id);
  if (!item?._webpUrl) return;
  const a = document.createElement('a');
  a.href = item._webpUrl;
  a.download = item._webpName;
  a.click();
  URL.revokeObjectURL(item._webpUrl);
  item._webpUrl = null;
}

function iwDownloadAll() {
  document.querySelectorAll('#iwList > div[id]').forEach(item => {
    if (item._webpUrl) {
      const a = document.createElement('a');
      a.href = item._webpUrl;
      a.download = item._webpName;
      a.click();
      URL.revokeObjectURL(item._webpUrl);
      item._webpUrl = null;
    }
  });
}
