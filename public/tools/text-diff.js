const _diffDict = {
  zh: {
    title: '文本在线比对', realtime: '实时对比', mode_line: '逐行对比', mode_word: '逐词对比', mode_char: '逐字对比',
    view_split: '并排视图', view_unified: '合并视图', compare: '对比', copy_result: '复制结果', clear: '清空',
    original: '原始文本', modified: '修改文本', original_ph: '粘贴原始文本...', modified_ph: '粘贴修改后文本...', result: '差异结果',
    count: (lines, chars) => `${lines} 行 / ${chars} 字`,
    stat: (added, removed) => `+${added} 增加  −${removed} 删除  ${added + removed === 0 ? '✓ 无差异' : ''}`,
    run_first: '请先执行对比', copied: '已复制差异结果',
  },
  en: {
    title: 'Compare texts', realtime: 'Live diff', mode_line: 'By line', mode_word: 'By word', mode_char: 'By character',
    view_split: 'Side by side', view_unified: 'Unified', compare: 'Compare', copy_result: 'Copy result', clear: 'Clear',
    original: 'Original', modified: 'Modified', original_ph: 'Paste the original text...', modified_ph: 'Paste the modified text...', result: 'Differences',
    count: (lines, chars) => `${lines} line${lines === 1 ? '' : 's'} / ${chars} char${chars === 1 ? '' : 's'}`,
    stat: (added, removed) => `+${added} added  −${removed} removed  ${added + removed === 0 ? '✓ No differences' : ''}`,
    run_first: 'Run a comparison first', copied: 'Diff copied',
  },
};

function renderTextDiff(el) {
  const T = makeToolI18n(_diffDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div class="panel-label" style="margin:0">${T('title')}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <label style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:4px">
            <input type="checkbox" id="diffRealtime" onchange="diffRealtimeToggle()"> ${T('realtime')}
          </label>
          <select id="diffMode" class="tool-input" style="width:auto;font-size:12px">
            <option value="line">${T('mode_line')}</option>
            <option value="word">${T('mode_word')}</option>
            <option value="char">${T('mode_char')}</option>
          </select>
          <select id="diffView" class="tool-input" style="width:auto;font-size:12px" onchange="diffChangeView()">
            <option value="split">${T('view_split')}</option>
            <option value="unified">${T('view_unified')}</option>
          </select>
          <button class="btn btn-primary" onclick="runDiff()">${T('compare')}</button>
          <button class="btn btn-secondary" onclick="diffCopyResult()">${T('copy_result')}</button>
          <button class="btn btn-secondary" onclick="diffClear()">${T('clear')}</button>
        </div>
      </div>
      <div class="diff-panels" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;color:var(--text-muted);font-weight:600">${T('original')}</span>
            <span id="diffCountA" style="font-size:11px;color:var(--text-muted)"></span>
          </div>
          <textarea class="tool-textarea" id="diffA" rows="12" placeholder="${T('original_ph')}" oninput="diffOnInput()"></textarea>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <span style="font-size:11px;color:var(--text-muted);font-weight:600">${T('modified')}</span>
            <span id="diffCountB" style="font-size:11px;color:var(--text-muted)"></span>
          </div>
          <textarea class="tool-textarea" id="diffB" rows="12" placeholder="${T('modified_ph')}" oninput="diffOnInput()"></textarea>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="diffResultPanel" style="display:none">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div class="panel-label" style="margin:0">${T('result')}</div>
        <span id="diffStat" style="font-size:12px;color:var(--text-muted)"></span>
      </div>
      <div id="diffOutput" style="font-family:monospace;font-size:13px;line-height:1.8;overflow-x:auto"></div>
    </div>`;

  window._diffRT = false;
}

function diffOnInput() {
  const T = makeToolI18n(_diffDict);
  const a = document.getElementById('diffA');
  const b = document.getElementById('diffB');
  const ca = document.getElementById('diffCountA');
  const cb = document.getElementById('diffCountB');
  if (a && ca) ca.textContent = T('count', a.value.split('\n').length, a.value.length);
  if (b && cb) cb.textContent = T('count', b.value.split('\n').length, b.value.length);
  if (window._diffRT) runDiff();
}

function diffRealtimeToggle() {
  window._diffRT = document.getElementById('diffRealtime').checked;
  if (window._diffRT) runDiff();
}

function diffChangeView() {
  const a = (document.getElementById('diffA') || {}).value;
  const b = (document.getElementById('diffB') || {}).value;
  if (a || b) runDiff();
}

function runDiff() {
  const a = (document.getElementById('diffA') || {}).value || '';
  const b = (document.getElementById('diffB') || {}).value || '';
  if (!a && !b) return;
  const mode = document.getElementById('diffMode').value;
  const view = document.getElementById('diffView').value;

  let tokensA, tokensB;
  if (mode === 'line') {
    tokensA = a.split('\n');
    tokensB = b.split('\n');
  } else if (mode === 'word') {
    tokensA = a.split(/(\s+)/);
    tokensB = b.split(/(\s+)/);
  } else {
    tokensA = [...a];
    tokensB = [...b];
  }

  const diff = _computeDiff(tokensA, tokensB);
  let added = 0, removed = 0;
  diff.forEach(([t]) => { if (t === 1) added++; else if (t === -1) removed++; });

  const statEl = document.getElementById('diffStat');
  if (statEl) statEl.textContent = makeToolI18n(_diffDict)('stat', added, removed);

  const out = document.getElementById('diffOutput');
  if (view === 'split' && mode === 'line') {
    out.innerHTML = _renderSplitView(tokensA, tokensB, diff);
  } else {
    out.innerHTML = _renderUnifiedView(diff, mode);
  }
  document.getElementById('diffResultPanel').style.display = '';
}

function _renderSplitView(tokensA, tokensB, diff) {
  const T = makeToolI18n(_diffDict);
  // 构建左右行对应
  const left = [], right = [];
  diff.forEach(([t, v]) => {
    if (t === 0)  { left.push([0, v]);  right.push([0, v]); }
    else if (t === -1) { left.push([-1, v]); right.push([2, '']); }
    else           { left.push([2, '']);  right.push([1, v]); }
  });

  const bgMap = { '-1': 'rgba(239,68,68,0.15)', '1': 'rgba(16,185,129,0.15)', '2': 'rgba(0,0,0,0.1)', '0': '' };
  const colorMap = { '-1': '#ef4444', '1': '#10b981', '2': 'var(--text-muted)', '0': 'var(--text)' };

  let leftHtml = '', rightHtml = '';
  let ln = 1, rn = 1;
  for (let i = 0; i < left.length; i++) {
    const [lt, lv] = left[i];
    const [rt, rv] = right[i];
    const lNum = lt === 2 ? '' : ln++;
    const rNum = rt === 2 ? '' : rn++;
    leftHtml  += `<div style="display:flex;min-height:1.8em;background:${bgMap[lt]}">`
      + `<span style="min-width:40px;text-align:right;padding:0 8px;color:var(--text-muted);user-select:none;border-right:1px solid var(--border);flex-shrink:0">${lNum}</span>`
      + `<span style="padding:0 8px;flex:1;color:${colorMap[lt]};white-space:pre-wrap;word-break:break-all">${_escD(lv)}</span></div>`;
    rightHtml += `<div style="display:flex;min-height:1.8em;background:${bgMap[rt]}">`
      + `<span style="min-width:40px;text-align:right;padding:0 8px;color:var(--text-muted);user-select:none;border-right:1px solid var(--border);flex-shrink:0">${rNum}</span>`
      + `<span style="padding:0 8px;flex:1;color:${colorMap[rt]};white-space:pre-wrap;word-break:break-all">${_escD(rv)}</span></div>`;
  }
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--border);border-radius:10px;overflow:hidden">`
    + `<div style="border-right:1px solid var(--border)">`
    + `<div style="padding:4px 8px 4px 48px;font-size:11px;color:var(--text-muted);border-bottom:1px solid var(--border);font-weight:600">${T('original')}</div>`
    + leftHtml + `</div>`
    + `<div><div style="padding:4px 8px;font-size:11px;color:var(--text-muted);border-bottom:1px solid var(--border);font-weight:600">${T('modified')}</div>`
    + rightHtml + `</div></div>`;
}

function _renderUnifiedView(diff, mode) {
  const isLine = mode === 'line';
  let html = '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">';
  let lineNum = 1;
  if (isLine) {
    diff.forEach(([t, v]) => {
      const bg = t === -1 ? 'rgba(239,68,68,0.12)' : t === 1 ? 'rgba(16,185,129,0.12)' : '';
      const color = t === -1 ? '#ef4444' : t === 1 ? '#10b981' : 'var(--text)';
      const prefix = t === -1 ? '− ' : t === 1 ? '+ ' : '  ';
      const num = t !== 1 ? lineNum++ : '';
      html += `<div style="display:flex;min-height:1.8em;background:${bg}">`
        + `<span style="min-width:40px;text-align:right;padding:0 8px;color:var(--text-muted);user-select:none;border-right:1px solid var(--border);flex-shrink:0">${num}</span>`
        + `<span style="padding:0 8px;color:${color};white-space:pre-wrap;word-break:break-all">${prefix}${_escD(v)}</span></div>`;
    });
  } else {
    // word/char: inline spans
    html += '<div style="padding:12px 16px;white-space:pre-wrap;word-break:break-all">';
    diff.forEach(([t, v]) => {
      if (t === 0)  html += `<span style="color:var(--text)">${_escD(v)}</span>`;
      else if (t === -1) html += `<span style="background:rgba(239,68,68,0.25);color:#ef4444;border-radius:3px;padding:0 2px;text-decoration:line-through">${_escD(v)}</span>`;
      else           html += `<span style="background:rgba(16,185,129,0.25);color:#10b981;border-radius:3px;padding:0 2px">${_escD(v)}</span>`;
    });
    html += '</div>';
  }
  return html + '</div>';
}

function diffCopyResult() {
  const T = makeToolI18n(_diffDict);
  const out = document.getElementById('diffOutput');
  if (!out || !out.textContent.trim()) { showToast(T('run_first'), 'info'); return; }
  navigator.clipboard.writeText(out.innerText).then(() => showToast(T('copied')));
}

function _escD(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _computeDiff(a, b) {
  const m = a.length, n = b.length;
  // 超大文本降级为逐行简单 diff
  if (m * n > 2000000) {
    const result = [];
    const max = Math.max(m, n);
    for (let i = 0; i < max; i++) {
      if (i < m && i < n) {
        if (a[i] === b[i]) result.push([0, a[i]]);
        else { result.push([-1, a[i]]); result.push([1, b[i]]); }
      } else if (i < m) result.push([-1, a[i]]);
      else result.push([1, b[i]]);
    }
    return result;
  }
  const dp = Array.from({length: m+1}, (_, i) =>
    Array.from({length: n+1}, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  const result = []; let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) { result.unshift([0, a[i-1]]); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j-1] <= dp[i-1][j])) { result.unshift([1, b[j-1]]); j--; }
    else { result.unshift([-1, a[i-1]]); i--; }
  }
  return result;
}

function diffClear() {
  document.getElementById('diffA').value = '';
  document.getElementById('diffB').value = '';
  document.getElementById('diffResultPanel').style.display = 'none';
  const ca = document.getElementById('diffCountA');
  const cb = document.getElementById('diffCountB');
  if (ca) ca.textContent = '';
  if (cb) cb.textContent = '';
}
