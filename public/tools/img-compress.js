// File state and event handlers belong to this page instance, not the global scope.
(function () {
  const tl = makeToolI18n({
    zh: {
      title: '图片压缩 / 格式转换', choose: '点击选择图片，或拖拽到此处',
      formats: 'JPG / PNG / WebP / GIF · 在本地处理，不上传服务器',
      note: 'GIF 仅导出静态帧；PNG 不受质量滑块影响；转 JPEG 时透明背景填充为白色。',
      quality: '质量', format: '格式', run: '压缩 / 转换', busy: '处理中…',
      empty: '请先选择图片', invalid: '请选择有效的图片文件', readError: '图片读取失败，请重新选择',
      decodeError: '无法解码图片，请选择浏览器支持的有效图片', encodeError: '无法生成所选格式，请更换格式或图片',
      large: '图片超过 4000 万像素，请先缩小后再处理', original: '原图', output: '处理后',
      saved: '节省', increased: '体积增加', size: '尺寸', result: '处理结果', download: '下载图片',
    },
    en: {
      title: 'Compress / convert image', choose: 'Choose an image or drop it here',
      formats: 'JPG / PNG / WebP / GIF · Processed locally, no upload',
      note: 'GIF exports a still frame. PNG ignores quality. JPEG uses a white background for transparency.',
      quality: 'Quality', format: 'Format', run: 'Compress / convert', busy: 'Processing…',
      empty: 'Choose an image first', invalid: 'Choose a valid image file', readError: 'Unable to read the image. Please select it again.',
      decodeError: 'Unable to decode the image. Choose a valid image supported by your browser.', encodeError: 'Unable to encode this format. Try a different format or image.',
      large: 'Image exceeds 40 megapixels. Resize it before processing.', original: 'Original', output: 'Output',
      saved: 'Saved', increased: 'Size increased', size: 'Dimensions', result: 'Result', download: 'Download image',
    },
  });
  const size = bytes => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  window.renderImgCompress = function (el) {
    let file = null, revision = 0, disposed = false;
    const urls = new Set();
    const release = () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); };
    const objectUrl = blob => { const url = URL.createObjectURL(blob); urls.add(url); return url; };
    window._activeCleanup = () => { disposed = true; revision++; release(); };

    el.innerHTML = `
      <div class="tool-card-panel">
        <div class="panel-label">${tl('title')}</div>
        <button type="button" id="imgDropZone" style="display:block;width:100%;border:2px dashed var(--glass-border);background:transparent;color:var(--text);border-radius:14px;padding:32px 16px;text-align:center;cursor:pointer;margin-bottom:14px">
          <span style="font-size:32px;display:block">🖼️</span>
          <span id="imgSelectedName" style="display:block;overflow-wrap:anywhere">${tl('choose')}</span>
          <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:8px">${tl('formats')}</span>
        </button>
        <input type="file" id="imgFileInput" accept="image/*" hidden>
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <label for="imgQuality">${tl('quality')}</label>
          <input type="range" id="imgQuality" min="10" max="100" value="80" style="flex:1;min-width:100px">
          <output id="imgQualVal" for="imgQuality">80%</output>
          <label for="imgFormat">${tl('format')}</label>
          <select id="imgFormat" class="tool-input" style="width:auto"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select>
          <button type="button" class="btn btn-primary" id="imgCompressRun">${tl('run')}</button>
        </div>
        <p style="font-size:12px;color:var(--text-muted)">${tl('note')}</p>
        <div id="imgCompressStatus" role="status" aria-live="polite" style="overflow-wrap:anywhere"></div>
      </div>
      <div id="imgCompressResult" hidden></div>`;
    const find = selector => el.querySelector(selector);
    const zone = find('#imgDropZone'), input = find('#imgFileInput');
    const status = find('#imgCompressStatus'), result = find('#imgCompressResult');
    const run = find('#imgCompressRun'), qualityInput = find('#imgQuality');
    const reset = () => {
      revision++; release(); result.replaceChildren(); result.hidden = true;
      run.disabled = false; run.textContent = tl('run'); status.textContent = '';
    };
    const choose = selected => {
      if (!selected) return;
      reset(); file = null;
      find('#imgSelectedName').textContent = tl('choose');
      if (!selected.type.startsWith('image/')) { status.textContent = tl('invalid'); return; }
      file = selected;
      find('#imgSelectedName').textContent = file.name + ' · ' + size(file.size);
    };
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { choose(input.files[0]); input.value = ''; });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', event => { event.preventDefault(); zone.style.borderColor = ''; choose(event.dataTransfer.files[0]); });
    qualityInput.addEventListener('input', () => { find('#imgQualVal').textContent = qualityInput.value + '%'; });
    find('#imgFormat').addEventListener('change', event => { qualityInput.disabled = event.target.value === 'image/png'; });

    run.addEventListener('click', async () => {
      if (!file) { status.textContent = tl('empty'); return; }
      reset();
      const ticket = revision, selected = file;
      const current = () => !disposed && ticket === revision && el.isConnected;
      const format = find('#imgFormat').value, quality = Number(qualityInput.value) / 100;
      run.disabled = true; run.textContent = tl('busy'); status.textContent = tl('busy');
      try {
        const sourceUrl = objectUrl(selected);
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = () => reject(new Error(tl('decodeError')));
          image.src = sourceUrl;
        });
        if (!current()) return;
        const width = img.naturalWidth, height = img.naturalHeight;
        if (!width || !height) throw new Error(tl('decodeError'));
        if (width * height > 40000000) throw new Error(tl('large'));
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error(tl('encodeError'));
        if (format === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height); }
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, format, quality));
        canvas.width = canvas.height = 0;
        if (!current()) return;
        if (!blob || blob.type !== format) throw new Error(tl('encodeError'));
        const outputUrl = objectUrl(blob), saved = (1 - blob.size / selected.size) * 100;
        result.innerHTML = `<div class="tool-card-panel">
          <div class="panel-label">${tl('result')}</div>
          <p>${tl('original')}: ${size(selected.size)} · ${tl('output')}: ${size(blob.size)} · ${tl(saved >= 0 ? 'saved' : 'increased')}: ${Math.abs(saved).toFixed(1)}% · ${tl('size')}: ${width} × ${height}</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:14px">
            <img data-preview="original" alt="${tl('original')}" style="flex:1;min-width:0;width:45%;max-height:260px;object-fit:contain">
            <img data-preview="output" alt="${tl('output')}" style="flex:1;min-width:0;width:45%;max-height:260px;object-fit:contain">
          </div><a class="btn btn-primary" data-download>${tl('download')}</a></div>`;
        result.querySelector('[data-preview="original"]').src = sourceUrl;
        result.querySelector('[data-preview="output"]').src = outputUrl;
        const download = result.querySelector('[data-download]');
        download.href = outputUrl;
        download.download = (selected.name.replace(/\.[^.]+$/, '') || 'image') + '-compressed.' + (format === 'image/jpeg' ? 'jpg' : format.split('/')[1]);
        result.hidden = false; status.textContent = '';
      } catch (error) {
        if (current()) { release(); status.textContent = error.message || tl('readError'); }
      } finally {
        if (current()) { run.disabled = false; run.textContent = tl('run'); }
      }
    });
  };
})();
