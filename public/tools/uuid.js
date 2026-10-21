const _uuidDict = {
  zh: {
    count: '数量', format: '格式', fmt_standard: '标准 (带横线)', fmt_nodash: '无横线', fmt_upper: '大写', fmt_braces: '{} 包裹',
    generate: '生成', copy_all: '复制全部', download: '下载', copy: '复制',
    generated: n => `✓ 已生成 ${n} 个 UUID`, copied: n => `已复制 ${n} 个 UUID`, downloaded: '文件已下载',
  },
  en: {
    count: 'Count', format: 'Format', fmt_standard: 'Standard (with dashes)', fmt_nodash: 'No dashes', fmt_upper: 'Uppercase', fmt_braces: 'Wrapped in {}',
    generate: 'Generate', copy_all: 'Copy all', download: 'Download', copy: 'Copy',
    generated: n => `✓ Generated ${n} UUID${n === 1 ? '' : 's'}`, copied: n => `Copied ${n} UUID${n === 1 ? '' : 's'}`, downloaded: 'File downloaded',
  },
};

function renderUUID(el) {
  const T = makeToolI18n(_uuidDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-muted);font-size:13px">${T('count')}</span>
          <input type="number" id="uuidCount" class="tool-input" value="5" min="1" max="100" style="width:80px">
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="color:var(--text-muted);font-size:13px">${T('format')}</span>
          <select id="uuidFormat" class="tool-input" style="width:auto">
            <option value="standard">${T('fmt_standard')}</option>
            <option value="no-dash">${T('fmt_nodash')}</option>
            <option value="upper">${T('fmt_upper')}</option>
            <option value="braces">${T('fmt_braces')}</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="generateUUIDs()">${T('generate')}</button>
        <button class="btn btn-secondary" onclick="copyAllUUIDs()">${T('copy_all')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="uuidResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0" id="uuidStatus"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="copyAllUUIDs()">${T('copy_all')}</button>
          <button class="btn btn-secondary" onclick="uuidDownload()">${T('download')}</button>
        </div>
      </div>
      <div id="uuidList"></div>
    </div>`;
  generateUUIDs();
}

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

function applyUuidFormat(id) {
  const fmt = document.getElementById('uuidFormat').value;
  if (fmt === 'no-dash')  return id.replace(/-/g,'');
  if (fmt === 'upper')    return id.toUpperCase();
  if (fmt === 'braces')   return '{' + id.toUpperCase() + '}';
  return id;
}

function generateUUIDs() {
  const T = makeToolI18n(_uuidDict);
  const count = Math.min(100, Math.max(1, parseInt(document.getElementById('uuidCount').value) || 5));
  const ids = Array.from({length: count}, () => applyUuidFormat(uuidv4()));
  const list = document.getElementById('uuidList');
  const panel = document.getElementById('uuidResultPanel');
  list.innerHTML = ids.map(id => `
    <div class="result-row" style="margin-bottom:6px;display:flex;align-items:center;gap:10px">
      <span style="font-family:monospace;font-size:13px;flex:1;color:var(--neon);word-break:break-all">${id}</span>
      <button class="copy-inline" onclick="copyText('${id}',this)">${T('copy')}</button>
    </div>`).join('');
  list._ids = ids;
  document.getElementById('uuidStatus').textContent = T('generated', count);
  panel.style.display = '';
}

function copyAllUUIDs() {
  const T = makeToolI18n(_uuidDict);
  const list = document.getElementById('uuidList');
  const ids = list._ids;
  if (!ids) return;
  navigator.clipboard.writeText(ids.join('\n')).then(() =>
    showToast(T('copied', ids.length)));
}

function uuidDownload() {
  const T = makeToolI18n(_uuidDict);
  const list = document.getElementById('uuidList');
  const ids = list._ids;
  if (!ids) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ids.join('\n')], { type: 'text/plain' }));
  a.download = 'uuids.txt';
  a.click();
  showToast(T('downloaded'));
}
