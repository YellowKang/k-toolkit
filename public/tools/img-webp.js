(function () {
  const tl = makeToolI18n({
    zh: { title: '批量转换 WebP', choose: '点击选择图片，或拖拽到此处', formats: '支持浏览器可解码的 JPG / PNG / GIF / BMP / WebP · 可多选', quality: 'WebP 质量', note: '在本地转换。质量调节不等于无损编码；动画图片仅导出静态帧。', results: '转换结果', download: '下载', downloadAll: '全部下载', waiting: '等待转换…', working: '转换中…', invalid: '请选择图片文件', decodeError: '图片无法解码，请检查文件格式', encodeError: '转换失败：浏览器未生成 WebP 图片', large: '图片超过 4000 万像素，请先缩小', original: '原始', saved: '节省', increased: '体积增加', image: '图片预览' },
    en: { title: 'Batch convert to WebP', choose: 'Choose images or drop them here', formats: 'Browser-supported JPG / PNG / GIF / BMP / WebP · Multiple files allowed', quality: 'WebP quality', note: 'Processed locally. Quality settings do not guarantee lossless encoding. Animated images export a still frame.', results: 'Results', download: 'Download', downloadAll: 'Download all', waiting: 'Queued…', working: 'Converting…', invalid: 'Choose image files', decodeError: 'Unable to decode this image. Check the file format.', encodeError: 'Conversion failed: the browser did not produce a WebP image.', large: 'Image exceeds 40 megapixels. Resize it first.', original: 'Original', saved: 'Saved', increased: 'Size increased', image: 'Image preview' },
  });
  const size = bytes => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';

  window.renderImgWebp = function (el) {
    let disposed = false, queue = Promise.resolve(), shared;
    const urls = new Set(), downloads = [];
    const objectUrl = blob => { const url = URL.createObjectURL(blob); urls.add(url); return url; };
    const release = url => { URL.revokeObjectURL(url); urls.delete(url); };
    window._activeCleanup = () => { disposed = true; urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); shared?.dispose(); };
    el.innerHTML = `
      <div class="tool-card-panel"><div class="panel-label">${tl('title')}</div>
        <button type="button" id="iwDrop" style="display:block;width:100%;border:2px dashed var(--glass-border);border-radius:12px;padding:32px 16px;text-align:center;cursor:pointer;background:transparent;color:var(--text)">
          <span style="font-size:32px;display:block">🖼️</span><span>${tl('choose')}</span>
          <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:8px">${tl('formats')}</span>
        </button><input type="file" id="iwFile" accept="image/*" multiple hidden>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px">
          <label for="iwQuality">${tl('quality')}</label>
          <input type="range" id="iwQuality" min="0.1" max="1" step="0.05" value="0.85" style="flex:1;min-width:100px">
          <output id="iwQVal" for="iwQuality">85%</output>
        </div><p style="font-size:12px;color:var(--text-muted)">${tl('note')}</p>
        <div id="iwStatus" role="status" aria-live="polite"></div>
      </div>
      <div class="tool-card-panel" id="iwResults" hidden>
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
          <div class="panel-label">${tl('results')}</div><button type="button" class="btn btn-primary" id="iwDownloadAll" hidden>${tl('downloadAll')}</button>
        </div><div id="iwList" style="display:flex;flex-direction:column;gap:12px"></div>
      </div>`;
    const find = selector => el.querySelector(selector);
    const zone = find('#iwDrop'), input = find('#iwFile'), list = find('#iwList');
    const downloadAll = find('#iwDownloadAll');
    const download = entry => {
      const a = document.createElement('a'); a.href = entry.url; a.download = entry.name;
      el.appendChild(a); a.click(); a.remove();
      // Keep URLs alive until this page is disposed, so repeated downloads work.
    };
    downloadAll.addEventListener('click', () => downloads.forEach(download));
    find('#iwQuality').addEventListener('input', event => { find('#iwQVal').textContent = Math.round(Number(event.target.value) * 100) + '%'; });

    const convert = async (file, quality, item) => {
      if (disposed || !el.isConnected) return;
      const info = item.querySelector('[data-info]'), image = item.querySelector('img');
      info.textContent = tl('working');
      let sourceUrl;
      try {
        sourceUrl = objectUrl(file);
        const decoded = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(tl('decodeError')));
          img.src = sourceUrl;
        });
        if (disposed || !el.isConnected) return;
        const width = decoded.naturalWidth, height = decoded.naturalHeight;
        if (!width || !height) throw new Error(tl('decodeError'));
        if (width * height > 40000000) throw new Error(tl('large'));
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error(tl('encodeError'));
        ctx.drawImage(decoded, 0, 0);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
        canvas.width = canvas.height = 0;
        if (disposed || !el.isConnected) return;
        if (!blob || blob.type !== 'image/webp') throw new Error(tl('encodeError'));
        const url = objectUrl(blob), saved = (1 - blob.size / file.size) * 100;
        image.src = url; image.hidden = false;
        const entry = { url, name: (file.name.replace(/\.[^.]+$/, '') || 'image') + '.webp' };
        downloads.push(entry);
        item.appendChild(shared.resultButton(blob, entry.name));
        info.textContent = `WebP: ${size(blob.size)} · ${tl(saved >= 0 ? 'saved' : 'increased')}: ${Math.abs(saved).toFixed(1)}% · ${width} × ${height}`;
        const button = item.querySelector('button[data-download]'); button.hidden = false;
        button.addEventListener('click', () => download(entry)); downloadAll.hidden = false;
      } catch (error) {
        if (!disposed && el.isConnected) info.textContent = error.message || tl('decodeError');
      } finally {
        if (sourceUrl) release(sourceUrl);
      }
    };
    const choose = (files, remember = true) => {
      find('#iwStatus').textContent = '';
      const valid = files.filter(file => file.type.startsWith('image/'));
      if (remember && valid.length) shared.remember(valid);
      const quality = Number(find('#iwQuality').value);
      for (const file of files) {
        if (!file.type.startsWith('image/')) { find('#iwStatus').textContent = tl('invalid'); continue; }
        find('#iwResults').hidden = false;
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--glass-border);border-radius:12px;flex-wrap:wrap';
        item.innerHTML = `<img alt="${tl('image')}" hidden style="width:56px;height:56px;object-fit:cover;border-radius:8px">
          <div style="flex:1;min-width:0;overflow-wrap:anywhere"><strong data-name></strong><div style="font-size:12px;color:var(--text-muted)">${tl('original')}: ${size(file.size)}</div><div data-info role="status" style="font-size:12px">${tl('waiting')}</div></div>
          <button type="button" class="btn btn-secondary" data-download hidden>${tl('download')}</button>`;
        item.querySelector('[data-name]').textContent = file.name;
        list.appendChild(item);
        queue = queue.then(() => convert(file, quality, item));
      }
    };
    shared = ImageSession.mount(el, { multiple: true, onUse: files => choose(files, false) });
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { choose(Array.from(input.files)); input.value = ''; });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', event => { event.preventDefault(); zone.style.borderColor = ''; choose(Array.from(event.dataTransfer.files)); });
  };
})();
