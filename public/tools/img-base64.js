(function () {
  const tl = makeToolI18n({
    zh: { title: '图片 → Base64', choose: '点击选择图片，或拖拽到此处', local: 'PNG / JPG / GIF / WebP / SVG · 在本地处理', invalid: '请选择图片文件', reading: '正在读取…', failed: '读取失败，请重新选择图片', name: '文件名', size: '大小', type: '类型', length: 'Base64 长度', copy: '复制 Base64', html: '复制 HTML img 标签', previewTitle: 'Base64 → 图片预览', placeholder: '粘贴 Base64 Data URL 或纯 Base64…', preview: '预览图片', previewError: '无法预览：无效的 Base64 图片', image: '图片预览' },
    en: { title: 'Image → Base64', choose: 'Choose an image or drop it here', local: 'PNG / JPG / GIF / WebP / SVG · Processed locally', invalid: 'Choose an image file', reading: 'Reading…', failed: 'Unable to read the image. Please select it again.', name: 'File name', size: 'Size', type: 'Type', length: 'Base64 length', copy: 'Copy Base64', html: 'Copy HTML img tag', previewTitle: 'Base64 → image preview', placeholder: 'Paste an image Data URL or raw Base64…', preview: 'Preview image', previewError: 'Unable to preview: invalid Base64 image', image: 'Image preview' },
  });
  window.renderImgBase64 = function (el) {
    let reader = null, revision = 0, disposed = false;
    window._activeCleanup = () => { disposed = true; revision++; reader?.abort(); };
    el.innerHTML = `
      <div class="tool-card-panel"><div class="panel-label">${tl('title')}</div>
        <button type="button" id="imgDropZone" style="display:block;width:100%;border:2px dashed var(--glass-border);border-radius:12px;padding:32px 16px;text-align:center;cursor:pointer;background:transparent;color:var(--text)">
          <span style="font-size:32px;display:block">🖼️</span><span>${tl('choose')}</span>
          <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:8px">${tl('local')}</span>
        </button><input type="file" id="imgFile" accept="image/*" hidden>
        <div id="imgB64Status" role="status" aria-live="polite"></div>
      </div>
      <div class="tool-card-panel" id="imgResultPanel" hidden>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">
          <img id="imgPreview" alt="${tl('image')}" style="max-width:160px;max-height:120px;object-fit:contain">
          <div id="imgInfo" style="font-size:13px;overflow-wrap:anywhere;min-width:0;white-space:pre-wrap"></div>
        </div><label class="panel-label" for="imgB64Output">Base64 Data URL</label>
        <textarea class="tool-textarea" id="imgB64Output" rows="5" readonly></textarea>
        <div class="tool-actions"><button type="button" class="btn btn-primary" id="imgB64Copy">${tl('copy')}</button><button type="button" class="btn btn-secondary" id="imgB64CopyHtml">${tl('html')}</button></div>
      </div>
      <div class="tool-card-panel"><label class="panel-label" for="b64ToImgInput">${tl('previewTitle')}</label>
        <textarea class="tool-textarea" id="b64ToImgInput" rows="4" placeholder="${tl('placeholder')}"></textarea>
        <div class="tool-actions"><button type="button" class="btn btn-primary" id="imgB64PreviewRun">${tl('preview')}</button></div>
        <div id="b64ImgPreview" role="status" style="margin-top:12px"></div>
      </div>`;
    const find = selector => el.querySelector(selector);
    const zone = find('#imgDropZone'), input = find('#imgFile'), status = find('#imgB64Status');
    const panel = find('#imgResultPanel');
    const choose = file => {
      if (!file) return;
      revision++; reader?.abort(); panel.hidden = true;
      find('#imgB64Output').value = ''; find('#imgPreview').removeAttribute('src');
      if (!file.type.startsWith('image/')) { status.textContent = tl('invalid'); return; }
      const ticket = revision;
      reader = new FileReader(); status.textContent = tl('reading');
      reader.onload = event => {
        if (disposed || ticket !== revision || !el.isConnected) return;
        const dataUrl = event.target.result;
        find('#imgPreview').src = dataUrl;
        find('#imgB64Output').value = dataUrl;
        find('#imgInfo').textContent = `${tl('name')}: ${file.name}\n${tl('size')}: ${(file.size / 1024).toFixed(2)} KB\n${tl('type')}: ${file.type}\n${tl('length')}: ${dataUrl.length}`;
        panel.hidden = false; status.textContent = '';
      };
      reader.onerror = () => { if (!disposed && ticket === revision) status.textContent = tl('failed'); };
      reader.readAsDataURL(file);
    };
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => { choose(input.files[0]); input.value = ''; });
    zone.addEventListener('dragover', event => { event.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', event => { event.preventDefault(); zone.style.borderColor = ''; choose(event.dataTransfer.files[0]); });
    find('#imgB64Copy').addEventListener('click', event => copyText(find('#imgB64Output').value, event.currentTarget));
    find('#imgB64CopyHtml').addEventListener('click', event => copyText('<img src="' + find('#imgB64Output').value + '">', event.currentTarget));
    find('#imgB64PreviewRun').addEventListener('click', () => {
      let value = find('#b64ToImgInput').value.trim();
      const out = find('#b64ImgPreview'); out.replaceChildren();
      if (!value) return;
      if (!value.startsWith('data:')) value = 'data:image/png;base64,' + value.replace(/\s/g, '');
      if (!/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+$/i.test(value)) { out.textContent = tl('previewError'); return; }
      const image = new Image(); image.alt = tl('image');
      image.style.cssText = 'max-width:100%;max-height:300px;object-fit:contain';
      image.onerror = () => { if (out.contains(image)) out.textContent = tl('previewError'); };
      out.appendChild(image); image.src = value;
    });
  };
})();
