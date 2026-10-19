(function () {
  const tl = makeToolI18n({
    zh: { title: '图片暂存', empty: '选择图片后，可在压缩、WebP 和 Base64 之间复用。', count: (n, name) => `${n} 个文件 · ${name}`, use: '复用暂存图片', first: '使用第一张图片', clear: '清除暂存', note: '仅保存在当前标签页内存，刷新后清除；不会上传。最多 20 个文件，共 100 MB。', limit: '未暂存：仅支持最多 20 张图片，总大小不超过 100 MB。之前的暂存保持不变。', stage: '暂存此结果', staged: '结果已暂存，可切换工具并复用。', compress: '压缩 / 转换', webp: '批量 WebP', base64: '图片 Base64' },
    en: { title: 'Staged images', empty: 'Choose images to reuse across compression, WebP and Base64.', count: (n, name) => `${n} file(s) · ${name}`, use: 'Reuse staged images', first: 'Use the first image', clear: 'Clear staged files', note: 'Stored only in this tab’s memory; cleared on refresh, never uploaded. Up to 20 files and 100 MB total.', limit: 'Not staged: choose up to 20 images totaling at most 100 MB. Previous staged files are unchanged.', stage: 'Stage this result', staged: 'Result staged. Switch tools to reuse it.', compress: 'Compress / convert', webp: 'Batch WebP', base64: 'Image Base64' },
  });
  const MAX_FILES = 20, MAX_BYTES = 100 * 1024 * 1024;
  let files = [];
  const listeners = new Set();
  const emit = () => listeners.forEach(listener => listener());
  const replace = selected => {
    const next = Array.from(selected);
    if (!next.length || next.length > MAX_FILES || next.some(file => !(file instanceof File) || !file.type.startsWith('image/')) || next.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES) return false;
    files = next; emit(); return true;
  };
  const clear = () => { files = []; emit(); };
  function mount(container, { multiple = false, onUse }) {
    const panel = document.createElement('section'); panel.className = 'tool-card-panel image-session';
    panel.innerHTML = '<div class="panel-label" data-title></div><p data-summary></p><div class="tool-actions"><button type="button" class="btn btn-secondary" data-reuse></button><button type="button" class="btn btn-secondary" data-clear></button></div><nav data-links></nav><p data-note></p><div data-message role="status" aria-live="polite"></div>';
    container.prepend(panel);
    const find = selector => panel.querySelector(selector);
    const render = () => {
      find('[data-title]').textContent = tl('title');
      find('[data-summary]').textContent = files.length ? tl('count', files.length, files[0].name) : tl('empty');
      find('[data-reuse]').textContent = tl(!multiple && files.length > 1 ? 'first' : 'use');
      find('[data-reuse]').disabled = !files.length; find('[data-clear]').disabled = !files.length;
      find('[data-clear]').textContent = tl('clear'); find('[data-note]').textContent = tl('note');
      const nav = find('[data-links]'); nav.replaceChildren();
      for (const [id, key] of [['img-compress','compress'], ['img-webp','webp'], ['img-base64','base64']]) {
        const link = document.createElement('a'); link.href = '#' + id; link.className = 'btn btn-secondary'; link.textContent = tl(key); nav.appendChild(link);
      }
      find('[data-message]').textContent = '';
    };
    const remember = selected => { const ok = replace(selected); if (!ok) find('[data-message]').textContent = tl('limit'); return ok; };
    find('[data-reuse]').addEventListener('click', () => onUse(multiple ? [...files] : files.slice(0, 1)));
    find('[data-clear]').addEventListener('click', clear);
    listeners.add(render); render();
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
  window.ImageSession = { replace, clear, getFiles: () => [...files], metadata: () => files.map(({ name, size, type }) => ({ name, size, type })), mount };
})();
