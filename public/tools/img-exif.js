const _exifDict = {
  zh: {
    title: 'EXIF 信息查看器', drop: '点击或拖拽图片到此处', drop_hint: '查看图片尺寸与 JPEG EXIF，文件仅在本地处理', dimensions: '图片尺寸', loading: '读取中…', none: '未包含支持的 EXIF 标签',
    file_name: '文件名', file_size: '文件大小', mime: 'MIME 类型', modified: '最后修改',
    tags: {
      0x010F:'相机厂商',0x0110:'相机型号',0x0112:'方向',0x0131:'软件',0x0132:'修改时间',
      0x9003:'拍摄时间',0x920A:'焦距',0xA002:'图像宽度',0xA003:'图像高度',
      0x8827:'ISO感光度',0x829A:'曝光时间',0x829D:'光圈F值',0xA403:'白平衡',
    },
  },
  en: {
    title: 'EXIF viewer', drop: 'Click or drop an image here', drop_hint: 'Image dimensions and JPEG EXIF, processed locally', dimensions: 'Dimensions', loading: 'Reading…', none: 'No supported EXIF tags found',
    file_name: 'File name', file_size: 'File size', mime: 'MIME type', modified: 'Last modified',
    tags: {
      0x010F:'Camera make',0x0110:'Camera model',0x0112:'Orientation',0x0131:'Software',0x0132:'Modified',
      0x9003:'Date taken',0x920A:'Focal length',0xA002:'Image width',0xA003:'Image height',
      0x8827:'ISO',0x829A:'Exposure time',0x829D:'F-number',0xA403:'White balance',
    },
  },
};

window.renderImgExif = function(el) {
  const T = makeToolI18n(_exifDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div id="exifDrop" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('exifFile').click()}" onclick="document.getElementById('exifFile').click()" ondragover="event.preventDefault();this.style.borderColor='var(--accent)'" ondragleave="this.style.borderColor='var(--glass-border)'" ondrop="exifHandleDrop(event)" style="border:2px dashed var(--glass-border);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:border-color 0.2s">
        <div style="font-size:32px;margin-bottom:8px">🖼️</div>
        <div style="color:var(--text-muted);font-size:14px">${T('drop')}</div>
        <div style="color:var(--text-muted);font-size:12px;margin-top:4px">${T('drop_hint')}</div>
        <input type="file" id="exifFile" accept="image/*" style="display:none" onchange="exifLoad(this.files[0]);this.value=''">
      </div>
    </div>
    <div class="tool-card-panel" id="exifResult" style="display:none">
      <div class="panel-label" id="exifFilename" style="margin-bottom:10px"></div>
      <div id="exifData" role="status" aria-live="polite"></div>
    </div>`;
  _exifShared = ImageSession.mount(el, { onUse: files => exifLoad(files[0], false) });
  window._activeCleanup = () => { _exifController?.abort(); _exifShared?.dispose(); };
};

function exifHandleDrop(e) {
  e.preventDefault();
  document.getElementById('exifDrop').style.borderColor = 'var(--glass-border)';
  const file = e.dataTransfer.files[0];
  if (file) exifLoad(file);
}

let _exifController = null, _exifShared = null;
async function exifLoad(file, remember = true) {
  if (!file) return;
  _exifController?.abort();
  const controller = _exifController = new AbortController(), T = makeToolI18n(_exifDict);
  const output = document.getElementById('exifData');
  output._metadata = null;
  document.getElementById('exifFilename').textContent = file.name;
  document.getElementById('exifResult').style.display = '';
  output.textContent = T('loading');
  if (remember && !_exifShared.remember([file])) { output.textContent = ''; return; }
  try {
    const data = await (await ToolCompute.load('image')).metadata(file, { signal: controller.signal });
    if (controller.signal.aborted || !output.isConnected) return;
    const info = [
      { label: T('file_name'), val: data.name }, { label: T('file_size'), val: (data.size / 1024).toFixed(1) + ' KB' },
      { label: T('mime'), val: data.type }, { label: T('dimensions'), val: data.width + ' × ' + data.height },
      { label: T('modified'), val: new Date(file.lastModified).toLocaleString() },
      ...Object.entries(data.tags).map(([tag, val]) => ({ label: T('tags')[tag], val })),
    ];
    output.replaceChildren(); output._metadata = data;
    for (const item of info) {
      const row = document.createElement('div'); row.className = 'image-metadata-row';
      const label = document.createElement('span'), value = document.createElement('span');
      label.textContent = item.label; value.textContent = String(item.val); row.append(label, value); output.append(row);
    }
    if (!Object.keys(data.tags).length) { const note = document.createElement('p'); note.textContent = T('none'); output.append(note); }
  } catch (error) { if (!controller.signal.aborted && output.isConnected) { output._metadata = null; output.textContent = error.message; } }
}
