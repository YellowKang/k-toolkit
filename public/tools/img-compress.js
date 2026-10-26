// Both legacy image routes share this bounded, in-memory batch workbench.
(function () {
  const T = makeToolI18n({
    zh: { title: '图片压缩与转换', choose: '选择或拖入图片（可多选）', quality: '质量', format: '输出格式', run: '压缩 / 转换', busy: '处理中…', cancel: '取消', clear: '清空图片', empty: '请先选择图片', invalid: '请选择图片文件', limit: '最多 20 张图片，总大小不超过 100 MB', decode: '无法解码图片，请检查文件格式', encode: '无法生成所选图片格式', large: '图片超过 4000 万像素，请先缩小', queued: '等待处理', cancelled: '已取消，可重新处理', download: '下载', all: '全部下载', original: '原图', result: '处理结果', saved: '节省', increased: '体积增加', note: '在本地处理。PNG 不受质量影响；JPEG 将透明背景填为白色；动画仅导出静态帧。切页保留图片与已完成结果，刷新后清除。', selected: n => `已选择 ${n} 张图片`, result_limit: '结果总大小超过 100 MB，请减少图片数量', reuse: '转为 Base64' },
    en: { title: 'Image compression & conversion', choose: 'Choose or drop images (multiple allowed)', quality: 'Quality', format: 'Output format', run: 'Compress / convert', busy: 'Processing…', cancel: 'Cancel', clear: 'Clear images', empty: 'Choose images first', invalid: 'Choose image files', limit: 'Up to 20 images totaling 100 MB', decode: 'Unable to decode the image. Check the format.', encode: 'Unable to generate the selected image format', large: 'Image exceeds 40 megapixels. Resize it first.', queued: 'Ready to process', cancelled: 'Cancelled. Run again to retry.', download: 'Download', all: 'Download all', original: 'Original', result: 'Results', saved: 'Saved', increased: 'Size increased', note: 'Processed locally. PNG ignores quality; JPEG fills transparency white; animation exports a still frame. Images and completed results stay while switching tools, and clear on refresh.', selected: n => `${n} images selected`, result_limit: 'Results exceed 100 MB. Select fewer images.', reuse: 'Convert to Base64' },
  });
  const state = { files: [], results: [], format: 'image/jpeg', quality: 80, revision: 0, running: false, route: null, controller: null };
  const size = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB';
  function release() { state.results.forEach(result => { if (result.url) URL.revokeObjectURL(result.url); }); state.results = []; }
  function mount(el, webp) {
    let disposed = false;
    if (webp && state.route !== 'webp') state.format = 'image/webp';
    state.route = webp ? 'webp' : 'compress';
    const ids = webp ? { file:'iwFile', drop:'iwDrop', quality:'iwQuality', status:'iwStatus', result:'iwResults' } : { file:'imgFileInput', drop:'imgDropZone', quality:'imgQuality', status:'imgCompressStatus', result:'imgCompressResult' };
    el.innerHTML = `<div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <button type="button" id="${ids.drop}" class="image-drop"><span>🖼️ ${T('choose')}</span><span id="imgSelectedName"></span></button>
      <input type="file" id="${ids.file}" accept="image/*" multiple hidden>
      <div class="tool-actions image-options">
        <label>${T('format')}<select class="tool-input" id="imgFormat"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label>
        <label for="${ids.quality}">${T('quality')} <output id="imgQualVal"></output><input type="range" id="${ids.quality}" min="10" max="100" value="${state.quality}"></label>
        <button type="button" class="btn btn-primary" data-tool-submit id="imgCompressRun">${T('run')}</button>
        <button type="button" class="btn btn-secondary" id="imageCancel" hidden>${T('cancel')}</button>
        <button type="button" class="btn btn-secondary" id="imageClear">${T('clear')}</button>
      </div><p class="workspace-notice">${T('note')}</p><p id="${ids.status}" role="status" aria-live="polite"></p>
    </div>
    <div class="tool-card-panel" id="${ids.result}" hidden><div class="tool-actions"><span class="panel-label">${T('result')}</span><button type="button" class="btn btn-secondary" id="iwDownloadAll" hidden>${T('all')}</button></div><div id="iwList" class="image-results"></div></div>`;
    const find = selector => el.querySelector(selector), status = find('#' + ids.status), runButton = find('#imgCompressRun');
    const shared = ImageSession.mount(el, { multiple: true, onUse: files => choose(files, false) });
    const download = result => { const a = document.createElement('a'); a.href = result.url; a.download = result.name; el.appendChild(a); a.click(); a.remove(); };
    function rows() {
      if (disposed) return;
      const list = find('#iwList'); list.replaceChildren();
      find('#' + ids.result).hidden = !state.results.length;
      find('#iwDownloadAll').hidden = !state.results.some(item => item.url);
      state.files.forEach((file, i) => {
        const result = state.results[i]; if (!result) return;
        const row = document.createElement('div'); row.className = 'image-result-row';
        const name = document.createElement('strong'); name.textContent = file.name;
        const info = document.createElement('div'); info.dataset.info = ''; info.setAttribute('role', 'status');
        const text = document.createElement('div'); text.className = 'image-result-info'; text.append(name, info); row.append(text);
        if (result.url) {
          const img = document.createElement('img'); img.src = result.url; img.alt = T('result'); row.prepend(img);
          const saved = (1 - result.blob.size / file.size) * 100;
          info.textContent = `${size(file.size)} → ${size(result.blob.size)} · ${T(saved >= 0 ? 'saved' : 'increased')} ${Math.abs(saved).toFixed(1)}% · ${result.width} × ${result.height}`;
          const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary'; button.dataset.download = ''; button.textContent = T('download'); button.onclick = () => download(result);
          const next = document.createElement('button'); next.type = 'button'; next.className = 'btn btn-secondary'; next.textContent = T('reuse');
          next.onclick = () => { if (ImageSession.useNext('img-base64', [new File([result.blob], result.name, {type:result.blob.type})])) navigateTo('img-base64'); };
          row.append(button, shared.resultButton(result.blob, result.name), next);
        } else info.textContent = T(result.state || 'queued');
        list.appendChild(row);
      });
    }
    function update() {
      const format = find('#imgFormat'), quality = find('#' + ids.quality);
      format.value = state.format; quality.value = state.quality; quality.disabled = state.format === 'image/png' || state.running; format.disabled = state.running;
      find('#imgQualVal').textContent = state.quality + '%';
      find('#imgSelectedName').textContent = state.files.length ? T('selected', state.files.length) + ' · ' + state.files[0].name : '';
      runButton.disabled = state.running; runButton.textContent = T(state.running ? 'busy' : 'run'); find('#imageCancel').hidden = !state.running;
      rows();
    }
    function cancel() { state.controller?.abort(); state.controller = null; state.revision++; state.running = false; state.results.forEach(item => { if (['busy','queued'].includes(item.state)) item.state = 'cancelled'; }); update(); }
    function choose(files, remember = true) {
      files = Array.from(files); status.textContent = '';
      if (files.some(file => !file.type.startsWith('image/'))) { status.textContent = T('invalid'); return; }
      if (!files.length) return;
      if (files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) { status.textContent = T('limit'); return; }
      cancel(); release(); state.files = files;
      if (remember) shared.remember(files);
      update();
    }
    async function run() {
      if (state.running) return;
      if (!state.files.length) { status.textContent = T('empty'); return; }
      release(); state.results = state.files.map(() => ({ state:'queued' })); state.running = true;
      const ticket = ++state.revision, format = state.format, quality = state.quality;
      const controller = state.controller = new AbortController(), generation = ImageSession.generation();
      const current = () => !disposed && ticket === state.revision;
      let total = 0; update(); status.textContent = '';
      for (let i = 0; i < state.files.length && current(); i++) {
        const file = state.files[i]; state.results[i].state = 'busy'; rows();
        try {
          const compute = await ToolCompute.load('image');
          if (!current()) return;
          const { blob, width, height, name } = await compute.convert(file, { format, quality }, { signal: controller.signal });
          if (!current()) return;
          if (total + blob.size > 100 * 1024 * 1024) throw new Error('result_limit');
          total += blob.size;
          const artifact = generation === ImageSession.generation() ? ImageSession.addResult(blob, name, generation) : null;
          state.results[i] = { blob, width, height, url:URL.createObjectURL(blob), name, fileId:artifact?.id };
        } catch (error) {
          if (!current()) return;
          const key = ['decode','encode','large','result_limit'].includes(error.code || error.message) ? error.code || error.message : 'encode';
          state.results[i] = { state:key }; status.textContent = T(key);
        }
        rows();
      }
      if (current()) { state.running = false; state.controller = null; update(); }
    }
    find('#' + ids.drop).onclick = () => find('#' + ids.file).click();
    find('#' + ids.file).onchange = event => { choose(event.target.files); event.target.value = ''; };
    find('#' + ids.drop).ondragover = event => event.preventDefault();
    find('#' + ids.drop).ondrop = event => { event.preventDefault(); choose(event.dataTransfer.files); };
    find('#imgFormat').onchange = event => { state.format = event.target.value; update(); };
    find('#' + ids.quality).oninput = event => { state.quality = Number(event.target.value); find('#imgQualVal').textContent = state.quality + '%'; };
    runButton.onclick = run; find('#imageCancel').onclick = cancel;
    find('#imageClear').onclick = () => { cancel(); release(); state.files = []; status.textContent = ''; update(); };
    find('#iwDownloadAll').onclick = () => state.results.filter(item => item.url).forEach(download);
    window._activeCleanup = () => { cancel(); disposed = true; shared.dispose(); };
    update();
  }
  window.renderImgCompress = el => mount(el, false);
  window.renderImgWebp = el => mount(el, true);
})();
