const _exifDict = {
  zh: {
    title: 'EXIF 信息查看器', drop: '点击或拖拽图片到此处', drop_hint: '支持 JPEG（含 EXIF 数据）',
    file_name: '文件名', file_size: '文件大小', mime: 'MIME 类型', modified: '最后修改',
    tags: {
      0x010F:'相机厂商',0x0110:'相机型号',0x0112:'方向',0x0131:'软件',0x0132:'修改时间',
      0x9003:'拍摄时间',0x920A:'焦距',0xA002:'图像宽度',0xA003:'图像高度',
      0x8827:'ISO感光度',0x829A:'曝光时间',0x829D:'光圈F值',0xA403:'白平衡',
    },
  },
  en: {
    title: 'EXIF viewer', drop: 'Click or drop an image here', drop_hint: 'JPEG files with EXIF data',
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
      <div id="exifDrop" onclick="document.getElementById('exifFile').click()" ondragover="event.preventDefault();this.style.borderColor='var(--accent)'" ondragleave="this.style.borderColor='var(--glass-border)'" ondrop="exifHandleDrop(event)" style="border:2px dashed var(--glass-border);border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:border-color 0.2s">
        <div style="font-size:32px;margin-bottom:8px">🖼️</div>
        <div style="color:var(--text-muted);font-size:14px">${T('drop')}</div>
        <div style="color:var(--text-muted);font-size:12px;margin-top:4px">${T('drop_hint')}</div>
        <input type="file" id="exifFile" accept="image/*" style="display:none" onchange="exifLoad(this.files[0])">
      </div>
    </div>
    <div class="tool-card-panel" id="exifResult" style="display:none">
      <div class="panel-label" id="exifFilename" style="margin-bottom:10px"></div>
      <div id="exifData"></div>
    </div>`;
};

function exifHandleDrop(e) {
  e.preventDefault();
  document.getElementById('exifDrop').style.borderColor = 'var(--glass-border)';
  const file = e.dataTransfer.files[0];
  if (file) exifLoad(file);
}

function exifLoad(file) {
  if (!file) return;
  document.getElementById('exifFilename').textContent = file.name;
  const reader = new FileReader();
  reader.onload = ev => {
    const T = makeToolI18n(_exifDict);
    const info = [
      {label:T('file_name'), val: file.name},
      {label:T('file_size'), val: (file.size/1024).toFixed(1)+' KB'},
      {label:T('mime'), val: file.type},
      {label:T('modified'), val: new Date(file.lastModified).toLocaleString()},
    ];
    try {
      const data = new DataView(ev.target.result);
      if (data.getUint16(0) === 0xFFD8) info.push(..._exifParseJpeg(data));
    } catch {}
    document.getElementById('exifData').innerHTML = info.map(r =>
      `<div style="display:flex;gap:12px;padding:7px 0;border-bottom:1px solid var(--glass-border)"><span style="font-size:12px;color:var(--text-muted);min-width:130px;flex-shrink:0">${r.label}</span><span style="font-size:13px;color:var(--text);word-break:break-all">${escHtml(r.val)}</span></div>`
    ).join('');
    document.getElementById('exifResult').style.display = '';
  };
  reader.readAsArrayBuffer(file);
}

function _exifParseJpeg(data) {
  const TAGS = makeToolI18n(_exifDict)('tags');
  const results = [];
  let offset = 2;
  while (offset < data.byteLength - 4) {
    const marker = data.getUint16(offset);
    const len = data.getUint16(offset + 2);
    if (marker === 0xFFE1) {
      const exifBase = offset + 4;
      if (data.getUint32(exifBase) !== 0x45786966) break;
      const tiff = exifBase + 6;
      const little = data.getUint16(tiff) === 0x4949;
      const g16 = o => data.getUint16(tiff + o, little);
      const g32 = o => data.getUint32(tiff + o, little);
      const ifdOff = g32(4);
      const count = g16(ifdOff);
      for (let i = 0; i < count; i++) {
        const e = ifdOff + 2 + i * 12;
        const tag = g16(e);
        const name = TAGS[tag];
        if (!name) continue;
        const type = g16(e + 2);
        const raw = g32(e + 8);
        let val = raw;
        if (type === 2) {
          const strOff = tiff + raw;
          let s = '';
          for (let c = 0; c < 64 && strOff + c < data.byteLength; c++) {
            const ch = data.getUint8(strOff + c);
            if (!ch) break;
            s += String.fromCharCode(ch);
          }
          val = s;
        } else if (type === 5) {
          const num = g32(raw); const den = g32(raw + 4);
          val = den ? (num/den).toFixed(4) : num;
        }
        results.push({label: name, val: String(val)});
      }
      break;
    }
    offset += 2 + len;
  }
  return results;
}