window.renderDiffJson = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">JSON A</div>
      <textarea class="tool-textarea" id="djInputA" rows="10" placeholder="粘贴 JSON A..."></textarea>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">JSON B</div>
      <textarea class="tool-textarea" id="djInputB" rows="10" placeholder="粘贴 JSON B..."></textarea>
    </div>
    <div style="text-align:center;margin:8px 0">
      <button class="btn btn-primary" onclick="djCompare()">Compare</button>
      <button class="btn btn-secondary" onclick="djClear()">清空</button>
    </div>
    <div class="tool-card-panel" id="djResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="djStatus"></div>
      </div>
      <div id="djOutput" style="font-family:monospace;font-size:13px;line-height:1.7;max-height:420px;overflow-y:auto"></div>
    </div>`;
};

function djCompare() {
  var a = document.getElementById('djInputA').value.trim();
  var b = document.getElementById('djInputB').value.trim();
  var status = document.getElementById('djStatus');
  var result = document.getElementById('djResult');
  var out = document.getElementById('djOutput');
  result.style.display = '';
  var objA, objB;
  try { objA = JSON.parse(a); } catch(e) { status.textContent = '✗ JSON A 格式错误: ' + e.message; status.style.color='#e74c3c'; out.innerHTML=''; return; }
  try { objB = JSON.parse(b); } catch(e) { status.textContent = '✗ JSON B 格式错误: ' + e.message; status.style.color='#e74c3c'; out.innerHTML=''; return; }
  var lines = [];
  djDiff(objA, objB, '', lines);
  if (lines.length === 0) {
    status.textContent = '✓ 两个 JSON 完全相同';
    status.style.color = '#10b981';
    out.innerHTML = '<div style="color:#10b981;padding:8px">No differences found.</div>';
  } else {
    status.textContent = '发现 ' + lines.length + ' 处差异';
    status.style.color = '#f59e0b';
    out.innerHTML = lines.join('');
  }
}

function djDiff(a, b, path, lines) {
  var ta = djType(a), tb = djType(b);
  if (ta !== tb) {
    lines.push(djLine(path, a, b, 'changed'));
    return;
  }
  if (ta === 'object') {
    var keys = Object.keys(Object.assign({}, a, b));
    keys.forEach(function(k) {
      var p = path ? path + '.' + k : k;
      if (!(k in a)) { lines.push(djLine(p, undefined, b[k], 'added')); }
      else if (!(k in b)) { lines.push(djLine(p, a[k], undefined, 'removed')); }
      else { djDiff(a[k], b[k], p, lines); }
    });
  } else if (ta === 'array') {
    var len = Math.max(a.length, b.length);
    for (var i = 0; i < len; i++) {
      var p2 = path + '[' + i + ']';
      if (i >= a.length) { lines.push(djLine(p2, undefined, b[i], 'added')); }
      else if (i >= b.length) { lines.push(djLine(p2, a[i], undefined, 'removed')); }
      else { djDiff(a[i], b[i], p2, lines); }
    }
  } else {
    if (a !== b) lines.push(djLine(path, a, b, 'changed'));
  }
}

function djType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function djLine(path, a, b, type) {
  var colors = { added: '#10b981', removed: '#e74c3c', changed: '#f59e0b' };
  var bg = { added: 'rgba(16,185,129,0.08)', removed: 'rgba(231,76,60,0.08)', changed: 'rgba(245,158,11,0.08)' };
  var labels = { added: '+ 新增', removed: '- 删除', changed: '~ 修改' };
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
  document.getElementById('djInputA').value = '';
  document.getElementById('djInputB').value = '';
  document.getElementById('djResult').style.display = 'none';
}
