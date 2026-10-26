(function () {
  const tl = makeToolI18n({
    zh: { title: '图片暂存', empty: '选择图片后，可供图片工具和 Agent 复用。', count: (n, name) => `${n} 个文件 · ${name}`, use: '复用暂存图片', first: '使用第一张图片', clear: '清除暂存', note: '图片仅在本地处理；使用 Agent 时，文件信息和识别结果会发给所选模型。输入与结果各暂存最多 20 张 / 100 MB；刷新或清除后引用失效，超限清理最旧结果。', limit: '未暂存：仅支持最多 20 张图片，总大小不超过 100 MB。之前的暂存保持不变。', stage: '暂存此结果', staged: '结果已暂存，可切换工具并复用。', compress: '压缩 / 转换', webp: '批量 WebP', base64: '图片 Base64', exif: '图片信息', qr: '识别二维码' },
    en: { title: 'Staged images', empty: 'Choose images to reuse in image tools and the assistant.', count: (n, name) => `${n} file(s) · ${name}`, use: 'Reuse staged images', first: 'Use the first image', clear: 'Clear staged files', note: 'Images are processed locally. With the assistant, file metadata and decoded text are sent to the selected model. Inputs and results each hold up to 20 files / 100 MB; references expire on refresh or clear, and oldest results are evicted at the limit.', limit: 'Not staged: choose up to 20 images totaling at most 100 MB. Previous staged files are unchanged.', stage: 'Stage this result', staged: 'Result staged. Switch tools to reuse it.', compress: 'Compress / convert', webp: 'Batch WebP', base64: 'Image Base64', exif: 'Image metadata', qr: 'Decode QR' },
  });
  const MAX_FILES = 20, MAX_BYTES = 100 * 1024 * 1024;
  let files = [], nextTarget = null, sequence = 0, generation = 0, ids = new WeakMap();
  const results = new Map();
  const idFor = file => { if (!ids.has(file)) ids.set(file, 'image-' + (++sequence)); return ids.get(file); };
  const metadata = file => ({ id: idFor(file), name: file.name, size: file.size, type: file.type });
  const expired = () => Object.assign(new Error(window.getCurrentLang?.() === 'en' ? 'This file is no longer available. Select it again.' : '文件已清除或过期，请重新选择。'), { code: 'expired' });
  function getFile(id) {
    const file = files.find(file => idFor(file) === id) || results.get(id);
    if (!file) throw expired();
    return file;
  }
  function addResult(blob, name, expectedGeneration = generation) {
    if (expectedGeneration !== generation) throw expired();
    if (!(blob instanceof Blob) || !blob.type.startsWith('image/') || blob.size > MAX_BYTES) throw new Error('Invalid or oversized image result');
    const file = new File([blob], name, { type: blob.type });
    let bytes = [...results.values()].reduce((n, file) => n + file.size, 0);
    while (results.size >= MAX_FILES || bytes + file.size > MAX_BYTES) {
      const oldest = results.keys().next().value; bytes -= results.get(oldest).size; results.delete(oldest);
    }
    results.set(idFor(file), file); emit(); return metadata(file);
  }
  function download(id) {
    const file = getFile(id), url = URL.createObjectURL(file), link = document.createElement('a');
    link.href = url; link.download = file.name; document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  const listeners = new Set();
  const emit = () => listeners.forEach(listener => listener());
  const replace = selected => {
    const next = Array.from(selected);
    if (!next.length || next.length > MAX_FILES || next.some(file => !(file instanceof File) || !file.type.startsWith('image/')) || next.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES) return false;
    files = next; emit(); return true;
  };
  const clear = () => { files = []; results.clear(); ids = new WeakMap(); generation++; nextTarget = null; emit(); };
  function mount(container, { multiple = false, onUse }) {
    const panel = document.createElement('section'); panel.className = 'tool-card-panel image-session';
    panel.innerHTML = '<div class="panel-label" data-title></div><p data-summary></p><div class="tool-actions"><button type="button" class="btn btn-secondary" data-reuse></button><button type="button" class="btn btn-secondary" data-clear></button></div><nav data-links></nav><p data-note></p><div data-message role="status" aria-live="polite"></div>';
    container.prepend(panel);
    const find = selector => panel.querySelector(selector);
    const render = () => {
      find('[data-title]').textContent = tl('title');
      find('[data-summary]').textContent = files.length ? tl('count', files.length, files[0].name) : tl('empty');
      find('[data-reuse]').textContent = tl(!multiple && files.length > 1 ? 'first' : 'use');
      find('[data-reuse]').disabled = !files.length; find('[data-clear]').disabled = !files.length && !results.size;
      find('[data-clear]').textContent = tl('clear'); find('[data-note]').textContent = tl('note');
      const nav = find('[data-links]'); nav.replaceChildren();
      for (const [id, key] of [['img-compress','compress'], ['img-base64','base64'], ['img-exif','exif'], ['qrcode-decode','qr']]) {
        const link = document.createElement('a'); link.href = '#' + id; link.className = 'btn btn-secondary'; link.textContent = tl(key); nav.appendChild(link);
      }
      find('[data-message]').textContent = '';
    };
    const remember = selected => { const ok = replace(selected); if (!ok) find('[data-message]').textContent = tl('limit'); return ok; };
    find('[data-reuse]').addEventListener('click', () => onUse(multiple ? [...files] : files.slice(0, 1)));
    find('[data-clear]').addEventListener('click', clear);
    listeners.add(render); render();
    if (nextTarget === window.currentPage) { nextTarget = null; queueMicrotask(() => { if (panel.isConnected) onUse(multiple ? [...files] : files.slice(0,1)); }); }
    return {
      remember,
      resultButton(blob, name) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary'; button.dataset.stageResult = '';
        button.textContent = tl('stage');
        button.addEventListener('click', () => {
          if (remember([new File([blob], name, { type: blob.type })])) { button.textContent = tl('staged'); }
        });
        return button;
      },
      dispose() { listeners.delete(render); },
    };
  }
  window.ImageSession = {
    useNext: (target, selected) => { if (!replace(selected)) return false; nextTarget = target; return true; },
    replace, clear, getFile, addResult, download, getFiles: () => [...files],
    metadata: () => files.map(metadata), generation: () => generation,
    list: () => [...files.map(file => ({ ...metadata(file), origin: 'selected' })), ...[...results.values()].filter(file => !files.includes(file)).map(file => ({ ...metadata(file), origin: 'result' }))],
    mount,
  };
})();
