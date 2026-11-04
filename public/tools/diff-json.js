const _djDict = {
  zh: {
    paste: name => `粘贴 ${name}...`, compare: '对比', clear: '清空', invalid: (name, msg) => `✗ ${name} 格式错误: ${msg}`,
    same: '✓ 两个 JSON 完全相同', no_diff: '未发现差异。', found: n => `发现 ${n} 处差异`,
    added: '+ 新增', removed: '- 删除', changed: '~ 修改',
    previous: '上一页', next: '下一页', page: (n, total) => `第 ${n} / ${total} 页`,
    copy: '复制完整差异', download: '下载完整差异', preview: '每页最多 100 条；长值显示摘要，复制和下载保留完整数据。',
  },
  en: {
    paste: name => `Paste ${name}...`, compare: 'Compare', clear: 'Clear', invalid: (name, msg) => `✗ ${name} is not valid JSON: ${msg}`,
    same: '✓ Both JSON documents are identical', no_diff: 'No differences found.', found: n => `Found ${n} difference${n === 1 ? '' : 's'}`,
    added: '+ Added', removed: '- Removed', changed: '~ Changed',
    previous: 'Previous', next: 'Next', page: (n, total) => `Page ${n} / ${total}`,
    copy: 'Copy all differences', download: 'Download all differences', preview: 'Up to 100 differences per page. Long values are shortened; copy and download include all data.',
  },
};

window.renderDiffJson = function(el) {
  const T = makeToolI18n(_djDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">JSON A</div>
      <textarea class="tool-textarea" id="djInputA" rows="10" placeholder="${T('paste', 'JSON A')}"></textarea>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">JSON B</div>
      <textarea class="tool-textarea" id="djInputB" rows="10" placeholder="${T('paste', 'JSON B')}"></textarea>
    </div>
    <div style="text-align:center;margin:8px 0">
      <button class="btn btn-primary" data-tool-submit onclick="djCompare()">${T('compare')}</button>
      <button class="btn btn-secondary" onclick="djClear()">${T('clear')}</button>
    </div>
    <div class="tool-card-panel" id="djResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="djStatus" role="status"></div>
      </div>
      <p class="workspace-notice">${T('preview')}</p>
      <div class="tool-actions">
        <button class="btn btn-secondary" id="djCopy" onclick="djCopy(this)" disabled>${T('copy')}</button>
        <button class="btn btn-secondary" id="djDownload" onclick="djDownload()" disabled>${T('download')}</button>
      </div>
      <div id="djOutput" style="font-family:monospace;font-size:13px;line-height:1.7;max-height:420px;overflow-y:auto;overflow-wrap:anywhere"></div>
      <div class="tool-actions" id="djPagination" hidden>
        <button class="btn btn-secondary" id="djPrevious" onclick="djShowPage(-1)">${T('previous')}</button>
        <button class="btn btn-secondary" id="djNext" onclick="djShowPage(1)">${T('next')}</button>
        <span id="djPageStatus" class="workspace-notice" role="status"></span>
      </div>
    </div>`;
  for (const id of ['djInputA', 'djInputB']) el.querySelector('#' + id).addEventListener('input', () => {
    djInvalidate();
  });
  el._toolOutput = () => djResultText();
};

let _djRevision=0;
function djInvalidate() {
  _djRevision++;
  document.getElementById('djResult').style.display = 'none';
  document.getElementById('djOutput')._diffs = null;
  document.getElementById('djCopy').disabled = document.getElementById('djDownload').disabled = true;
  document.getElementById('djPagination').hidden = true;
}
async function djCompare() {
  djInvalidate();
  const revision=++_djRevision;
  const T = makeToolI18n(_djDict);
  var a = document.getElementById('djInputA').value.trim();
  var b = document.getElementById('djInputB').value.trim();
  var status = document.getElementById('djStatus');
  var result = document.getElementById('djResult');
  var out = document.getElementById('djOutput');
  out._diffs = null;
  result.style.display = '';
  try {
    const compute=await ToolCompute.load('json-diff');
    if(!out.isConnected || revision!==_djRevision || document.getElementById('djInputA').value.trim()!==a || document.getElementById('djInputB').value.trim()!==b)return {success:false,cancelled:true};
    const diffs=compute.compareText(a,b);
    out._diffs=diffs;
    out._page=0;
  } catch(error) {
    if(!out.isConnected || revision!==_djRevision)return {success:false,cancelled:true};
    status.textContent=T('invalid','JSON',error.message);status.style.color='var(--danger)';out.replaceChildren();return {success:false,error:status.textContent};
  }
  if (out._diffs.length === 0) {
    status.textContent = T('same');
    status.style.color = '#10b981';
    out.innerHTML = '<div style="color:#10b981;padding:8px">' + T('no_diff') + '</div>';
  } else {
    status.textContent = T('found', out._diffs.length);
    status.style.color = '#f59e0b';
  }
  document.getElementById('djCopy').disabled = document.getElementById('djDownload').disabled = false;
  djShowPage();
  return {success:true,data:{diffs:out._diffs}};
}

function djShowPage(delta = 0) {
  const out = document.getElementById('djOutput'), diffs = out?._diffs;
  if (!diffs) return;
  const pages = Math.max(1, Math.ceil(diffs.length / 100));
  out._page = Math.max(0, Math.min(pages - 1, (out._page || 0) + delta));
  document.getElementById('djPagination').hidden = pages === 1;
  document.getElementById('djPrevious').disabled = out._page === 0;
  document.getElementById('djNext').disabled = out._page === pages - 1;
  document.getElementById('djPageStatus').textContent = makeToolI18n(_djDict)('page', out._page + 1, pages);
  if (diffs.length) out.innerHTML = diffs.slice(out._page * 100, (out._page + 1) * 100).map(row => djLine(row.path || '$', row.type === 'removed' ? row.value : row.from, row.type === 'added' ? row.value : row.to, row.type)).join('');
  out.scrollTop = 0;
}
function djResultText() {
  const diffs = document.getElementById('djOutput')?._diffs;
  return diffs ? window.KCompute['json-text'].stringify(diffs) : '';
}
function djCopy(button) { const text = djResultText(); if (text) return copyText(text, button); }
function djDownload() {
  const text = djResultText(); if (!text) return;
  const url = URL.createObjectURL(new Blob([text], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = 'json-diff.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function djLine(path, a, b, type) {
  var colors = { added: '#10b981', removed: '#e74c3c', changed: '#f59e0b' };
  var bg = { added: 'rgba(16,185,129,0.08)', removed: 'rgba(231,76,60,0.08)', changed: 'rgba(245,158,11,0.08)' };
  const T = makeToolI18n(_djDict);
  var labels = { added: T('added'), removed: T('removed'), changed: T('changed') };
  var color = colors[type];
  var valA = a === undefined ? '' : window.KCompute['json-text'].stringify(a);
  var valB = b === undefined ? '' : window.KCompute['json-text'].stringify(b);
  var detail = type === 'added' ? valB : type === 'removed' ? valA : valA + ' → ' + valB;
  if (detail.length > 2000) detail = detail.slice(0, 2000) + '…';
  return '<div style="padding:4px 10px;border-left:3px solid ' + color + ';background:' + bg[type] + ';margin-bottom:3px;border-radius:0 4px 4px 0">'
    + '<span style="color:' + color + ';font-weight:600">' + labels[type] + '</span> '
    + '<span style="color:#94a3b8">' + djEscape(path) + '</span>: '
    + '<span style="color:var(--text)">' + djEscape(detail) + '</span></div>';
}

function djEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function djClear() {
  djInvalidate();
  document.getElementById('djInputA').value = '';
  document.getElementById('djInputB').value = '';
  document.getElementById('djResult').style.display = 'none';
}
