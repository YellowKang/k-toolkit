const _djDict = {
  zh: {
    paste: name => `粘贴 ${name}...`, compare: '对比', clear: '清空', invalid: (name, msg) => `✗ ${name} 格式错误: ${msg}`,
    same: '✓ 两个 JSON 完全相同', no_diff: '未发现差异。', found: n => `发现 ${n} 处差异`,
    added: '+ 新增', removed: '- 删除', changed: '~ 修改',
  },
  en: {
    paste: name => `Paste ${name}...`, compare: 'Compare', clear: 'Clear', invalid: (name, msg) => `✗ ${name} is not valid JSON: ${msg}`,
    same: '✓ Both JSON documents are identical', no_diff: 'No differences found.', found: n => `Found ${n} difference${n === 1 ? '' : 's'}`,
    added: '+ Added', removed: '- Removed', changed: '~ Changed',
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
        <div class="panel-label" style="margin:0" id="djStatus"></div>
      </div>
      <div id="djOutput" style="font-family:monospace;font-size:13px;line-height:1.7;max-height:420px;overflow-y:auto"></div>
    </div>`;
  for (const id of ['djInputA', 'djInputB']) el.querySelector('#' + id).addEventListener('input', () => {
    _djRevision++; el.querySelector('#djResult').style.display = 'none'; el.querySelector('#djOutput')._diffs = null;
  });
};

let _djRevision=0;
async function djCompare() {
  const revision=++_djRevision;
  const T = makeToolI18n(_djDict);
  var a = document.getElementById('djInputA').value.trim();
  var b = document.getElementById('djInputB').value.trim();
  var status = document.getElementById('djStatus');
  var result = document.getElementById('djResult');
  var out = document.getElementById('djOutput');
  out._diffs = null;
  result.style.display = '';
  var objA, objB;
  try { objA = JSON.parse(a); } catch(e) { status.textContent = T('invalid', 'JSON A', e.message); status.style.color='#e74c3c'; out.innerHTML=''; return; }
  try { objB = JSON.parse(b); } catch(e) { status.textContent = T('invalid', 'JSON B', e.message); status.style.color='#e74c3c'; out.innerHTML=''; return; }
  let lines;
  try {
    const compute=await ToolCompute.load('json-diff');
    if(!out.isConnected || revision!==_djRevision || document.getElementById('djInputA').value.trim()!==a || document.getElementById('djInputB').value.trim()!==b)return {success:false,cancelled:true};
    const diffs=compute.compareText(a,b);
    lines=diffs.map(row=>djLine(row.path || '$',row.type==='removed'?row.value:row.from,row.type==='added'?row.value:row.to,row.type));
    out._diffs=diffs;
  } catch(error) {
    if(!out.isConnected || revision!==_djRevision)return {success:false,cancelled:true};
    status.textContent=T('invalid','JSON',error.message);status.style.color='var(--danger)';out.replaceChildren();return {success:false,error:status.textContent};
  }
  if (lines.length === 0) {
    status.textContent = T('same');
    status.style.color = '#10b981';
    out.innerHTML = '<div style="color:#10b981;padding:8px">' + T('no_diff') + '</div>';
  } else {
    status.textContent = T('found', lines.length);
    status.style.color = '#f59e0b';
    out.innerHTML = lines.join('');
  }
  return {success:true,data:{diffs:out._diffs}};
}

function djLine(path, a, b, type) {
  var colors = { added: '#10b981', removed: '#e74c3c', changed: '#f59e0b' };
  var bg = { added: 'rgba(16,185,129,0.08)', removed: 'rgba(231,76,60,0.08)', changed: 'rgba(245,158,11,0.08)' };
  const T = makeToolI18n(_djDict);
  var labels = { added: T('added'), removed: T('removed'), changed: T('changed') };
  var color = colors[type];
  var valA = a === undefined ? '' : JSON.stringify(a);
  var valB = b === undefined ? '' : JSON.stringify(b);
  var detail = type === 'added' ? valB : type === 'removed' ? valA : valA + ' → ' + valB;
  return '<div style="padding:4px 10px;border-left:3px solid ' + color + ';background:' + bg[type] + ';margin-bottom:3px;border-radius:0 4px 4px 0">'
    + '<span style="color:' + color + ';font-weight:600">' + labels[type] + '</span> '
    + '<span style="color:#94a3b8">' + djEscape(path) + '</span>: '
    + '<span style="color:#e2e8f0">' + djEscape(detail) + '</span></div>';
}

function djEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function djClear() {
  _djRevision++;
  document.getElementById('djInputA').value = '';
  document.getElementById('djInputB').value = '';
  document.getElementById('djResult').style.display = 'none';
}
