const _diffDict = {
  zh: {
    title: '文本在线比对', realtime: '实时对比', mode_line: '逐行对比', mode_word: '逐词对比', mode_char: '逐字对比',
    view_split: '并排视图', view_unified: '合并视图', compare: '对比', copy_result: '复制结果', clear: '清空',
    original: '原始文本', modified: '修改文本', original_ph: '粘贴原始文本...', modified_ph: '粘贴修改后文本...', result: '差异结果',
    count: (lines, chars) => `${lines} 行 / ${chars} 字`,
    stat: (added, removed) => `+${added} 增加  −${removed} 删除  ${added + removed === 0 ? '✓ 无差异' : ''}`,
    run_first: '请先执行对比', copied: '已复制差异结果',
    previous: '上一页', next: '下一页', first_change: '首处差异', download: '下载差异',
    page: (n,total) => `第 ${n} / ${total} 页 · 每页最多 200 段，复制与下载包含全部差异`,
    complex: '内容差异过大，请改用逐行对比或缩小范围后再试。',
  },
  en: {
    title: 'Compare texts', realtime: 'Live diff', mode_line: 'By line', mode_word: 'By word', mode_char: 'By character',
    view_split: 'Side by side', view_unified: 'Unified', compare: 'Compare', copy_result: 'Copy result', clear: 'Clear',
    original: 'Original', modified: 'Modified', original_ph: 'Paste the original text...', modified_ph: 'Paste the modified text...', result: 'Differences',
    count: (lines, chars) => `${lines} line${lines === 1 ? '' : 's'} / ${chars} char${chars === 1 ? '' : 's'}`,
    stat: (added, removed) => `+${added} added  −${removed} removed  ${added + removed === 0 ? '✓ No differences' : ''}`,
    run_first: 'Run a comparison first', copied: 'Diff copied',
    previous: 'Previous', next: 'Next', first_change: 'First change', download: 'Download diff',
    page: (n,total) => `Page ${n} of ${total} · Up to 200 segments per page. Copy and download include the full diff.`,
    complex: 'The comparison is too complex. Try line mode or compare a smaller section.',
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
          <select id="diffMode" class="tool-input" style="width:auto;font-size:12px" onchange="runDiff()">
            <option value="line">${T('mode_line')}</option>
            <option value="word">${T('mode_word')}</option>
            <option value="char">${T('mode_char')}</option>
          </select>
          <select id="diffView" class="tool-input" style="width:auto;font-size:12px" onchange="diffChangeView()">
            <option value="split">${T('view_split')}</option>
            <option value="unified">${T('view_unified')}</option>
          </select>
          <button class="btn btn-primary" data-tool-submit onclick="runDiff()">${T('compare')}</button>
          <button class="btn btn-secondary" onclick="diffCopyResult()">${T('copy_result')}</button>
          <button class="btn btn-secondary" onclick="diffDownload()">${T('download')}</button>
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
      <p class="workspace-notice" id="diffError" role="status" hidden></p>
    </div>
    <div class="tool-card-panel" id="diffResultPanel" style="display:none">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <div class="panel-label" style="margin:0">${T('result')}</div>
        <span id="diffStat" style="font-size:12px;color:var(--text-muted)"></span>
      </div>
      <div id="diffOutput" style="font-family:monospace;font-size:13px;line-height:1.8;overflow-x:auto"></div>
      <div class="tool-actions" id="diffPagination">
        <button class="btn btn-secondary" id="diffPrevious" onclick="diffShowPage(-1)">${T('previous')}</button>
        <button class="btn btn-secondary" id="diffNext" onclick="diffShowPage(1)">${T('next')}</button>
        <button class="btn btn-secondary" onclick="diffShowPage(0,true)">${T('first_change')}</button>
        <span class="workspace-notice" id="diffPageStatus" role="status"></span>
      </div>
    </div>`;

  window._activeCleanup = () => clearTimeout(_diffTimer);
}

let _diffTimer;
function diffOnInput() {
  const T = makeToolI18n(_diffDict);
  const a = document.getElementById('diffA');
  const b = document.getElementById('diffB');
  const ca = document.getElementById('diffCountA');
  const cb = document.getElementById('diffCountB');
  if (a && ca) ca.textContent = T('count', a.value.split('\n').length, a.value.length);
  if (b && cb) cb.textContent = T('count', b.value.split('\n').length, b.value.length);
  clearTimeout(_diffTimer);
  document.getElementById('diffResultPanel').style.display='none';
  document.getElementById('diffOutput')._result=null;
  if (document.getElementById('diffRealtime').checked) _diffTimer=setTimeout(runDiff,200);
}

function diffRealtimeToggle() {
  clearTimeout(_diffTimer);
  if (document.getElementById('diffRealtime').checked) runDiff();
}

function diffChangeView() {
  const a = (document.getElementById('diffA') || {}).value;
  const b = (document.getElementById('diffB') || {}).value;
  if (document.getElementById('diffOutput')._result) diffShowPage();
  else if (a || b) runDiff();
}

let _diffRevision = 0;
async function runDiff() {
  const revision=++_diffRevision, host=document.getElementById('diffA');
  clearTimeout(_diffTimer);
  if(!document.getElementById('diffMode')) return;
  const a = (document.getElementById('diffA') || {}).value || '';
  const b = (document.getElementById('diffB') || {}).value || '';
  if (!a && !b) return;
  const mode = document.getElementById('diffMode').value;

  const error=document.getElementById('diffError'); error.hidden=true;
  let diff;
  try {
    const compute = await ToolCompute.load('text-diff');
    if (!host?.isConnected || revision!==_diffRevision || host.value!==a || document.getElementById('diffB').value!==b) return {success:false,cancelled:true};
    diff = _computeDiff(compute.tokenize(a,mode), compute.tokenize(b,mode));
  }
  catch(e) {
    if (!host?.isConnected || revision!==_diffRevision) return {success:false,cancelled:true};
    error.textContent=makeToolI18n(_diffDict)('complex');error.hidden=false;
    document.getElementById('diffResultPanel').style.display='none';
    document.getElementById('diffOutput')._result=null;return {success:false,error:error.textContent};
  }
  let added = 0, removed = 0;
  diff.forEach(([t]) => { if (t === 1) added++; else if (t === -1) removed++; });

  const statEl = document.getElementById('diffStat');
  if (statEl) statEl.textContent = makeToolI18n(_diffDict)('stat', added, removed);

  const out = document.getElementById('diffOutput');
  const segments=[];
  for(const [type,value] of diff) {
    const last=segments[segments.length-1];
    if(mode!=='line' && last?.[0]===type) last[1]+=value;
    else segments.push([type,value]);
  }
  out._result={diff:segments,mode,page:0};
  document.getElementById('diffResultPanel').style.display = '';
  diffShowPage();
  return {success:true,data:{added,removed,diff}};
}

function diffShowPage(delta=0,firstChange=false) {
  const out=document.getElementById('diffOutput'), state=out?._result;
  if(!state) return;
  const {diff,mode}=state, pages=Math.max(1,Math.ceil(diff.length/200));
  state.page=firstChange ? Math.floor(Math.max(0,diff.findIndex(item=>item[0]!==0))/200) : Math.min(pages-1,Math.max(0,state.page+delta));
  const start=state.page*200, visible=diff.slice(start,start+200);
  let left=1,right=1;
  for(let i=0;i<start;i++) {if(diff[i][0]!==1)left++;if(diff[i][0]!==-1)right++;}
  const view=document.getElementById('diffView').value;
  if (view === 'split' && mode === 'line') {
    out.innerHTML = _renderSplitView([], [], visible, left, right);
  } else {
    out.innerHTML = _renderUnifiedView(visible, mode, left);
  }
  document.getElementById('diffPrevious').disabled=state.page===0;
  document.getElementById('diffNext').disabled=state.page===pages-1;
  document.getElementById('diffPageStatus').textContent=makeToolI18n(_diffDict)('page',state.page+1,pages);
}

function _renderSplitView(tokensA, tokensB, diff, startLeft=1, startRight=1) {
  const T = makeToolI18n(_diffDict);
  // 构建左右行对应
  const left = [], right = [];
  diff.forEach(([t, v]) => {
    if (t === 0)  { left.push([0, v]);  right.push([0, v]); }
    else if (t === -1) { left.push([-1, v]); right.push([2, '']); }
    else           { left.push([2, '']);  right.push([1, v]); }
  });

  const bgMap = { '-1': 'rgba(239,68,68,0.15)', '1': 'rgba(16,185,129,0.15)', '2': 'rgba(0,0,0,0.1)', '0': '' };
  const colorMap = { '-1': 'var(--danger)', '1': 'var(--success)', '2': 'var(--text-muted)', '0': 'var(--text)' };

  let leftHtml = '', rightHtml = '';
  let ln = startLeft, rn = startRight;
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

function _renderUnifiedView(diff, mode, startLine=1) {
  const isLine = mode === 'line';
  let html = '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">';
  let lineNum = startLine;
  if (isLine) {
    diff.forEach(([t, v]) => {
      const bg = t === -1 ? 'rgba(239,68,68,0.12)' : t === 1 ? 'rgba(16,185,129,0.12)' : '';
      const color = t === -1 ? 'var(--danger)' : t === 1 ? 'var(--success)' : 'var(--text)';
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
      else if (t === -1) html += `<span style="background:rgba(239,68,68,0.25);color:var(--danger);border-radius:3px;padding:0 2px;text-decoration:line-through">${_escD(v)}</span>`;
      else           html += `<span style="background:rgba(16,185,129,0.25);color:var(--success);border-radius:3px;padding:0 2px">${_escD(v)}</span>`;
    });
    html += '</div>';
  }
  return html + '</div>';
}

function diffCopyResult() {
  const T = makeToolI18n(_diffDict);
  const out = document.getElementById('diffOutput');
  if (!out?._result) { showToast(T('run_first'), 'info'); return; }
  copyText(_diffToText(out._result));
}

function _diffToText({diff,mode}) {
  return mode==='line' ? diff.map(([type,value])=>(type===1?'+ ':type===-1?'- ':'  ')+value).join('\n')
    : diff.map(([type,value])=>type===0?value:type===1?'{+'+value+'+}':'[-'+value+'-]').join('');
}

function diffDownload() {
  const result=document.getElementById('diffOutput')?._result;
  if(!result) {showToast(makeToolI18n(_diffDict)('run_first'),'info');return;}
  const url=URL.createObjectURL(new Blob([_diffToText(result)],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='difference.txt';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function _escD(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _computeDiff(...args) { return window.KCompute['text-diff'].diff(...args); }

function diffClear() {
  clearTimeout(_diffTimer);
  document.getElementById('diffA').value = '';
  document.getElementById('diffB').value = '';
  document.getElementById('diffResultPanel').style.display = 'none';
  document.getElementById('diffOutput')._result=null;
  document.getElementById('diffError').hidden=true;
  const ca = document.getElementById('diffCountA');
  const cb = document.getElementById('diffCountB');
  if (ca) ca.textContent = '';
  if (cb) cb.textContent = '';
}
