function renderRegex(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">正则表达式</div>
      <div style="display:flex;gap:0;align-items:center;background:rgba(0,0,0,0.35);border:1px solid var(--glass-border);border-radius:10px;overflow:hidden;margin-bottom:10px">
        <span style="padding:0 12px;color:var(--text-muted);font-size:20px;flex-shrink:0;line-height:1">/</span>
        <input class="tool-input" id="regexPattern" placeholder="输入正则表达式..." style="border:none;background:none;border-radius:0;flex:1;padding:10px 0" oninput="runRegex()">
        <span style="padding:0 10px;color:var(--text-muted);font-size:20px;flex-shrink:0;line-height:1">/</span>
        <input class="tool-input" id="regexFlags" placeholder="flags" style="border:none;background:none;border-radius:0;width:72px;padding:10px 8px" oninput="runRegex()">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${['g','i','m','s','u'].map(f => `<button class="flag-btn" id="flag_${f}" onclick="_regexToggleFlag('${f}')" title="${_regexFlagDesc(f)}" style="padding:3px 12px;border-radius:20px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:12px;cursor:pointer;font-family:monospace;transition:all 0.2s">${f}</button>`).join('')}
        <button class="btn btn-secondary" onclick="regexSaveCurrent()" style="margin-left:auto">保存</button>
        <button class="btn btn-secondary" onclick="clearRegex()">清空</button>
      </div>
      <div style="margin-bottom:4px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:7px">常用片段</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${[
            {label:'邮箱', pattern:'[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2}'},
            {label:'URL',  pattern:'https?:\\/\\/[\\w\\-.]+(?:\\.[\\w\\-.]+)+[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]*'},
            {label:'手机', pattern:'1[3-9]\\d{9}'},
            {label:'IP',   pattern:'(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)'},
            {label:'日期', pattern:'\\d{4}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\\d|3[01])'},
            {label:'数字', pattern:'-?\\d+(?:\\.\\d+)?'},
          ].map(s => `<button onclick="_regexFillSnippet(this)" data-pattern="${s.pattern.replace(/"/g,'&quot;')}" style="padding:2px 10px;border-radius:16px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:11px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(102,126,234,0.5)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--glass-border)';this.style.color='var(--text-muted)'">${s.label}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;gap:0;margin-bottom:12px">
        <button id="regexTabMatch" onclick="_regexSwitchTab('match')" style="padding:6px 18px;border-radius:8px 0 0 8px;border:1px solid var(--glass-border);background:rgba(102,126,234,0.2);color:var(--accent);font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s">匹配模式</button>
        <button id="regexTabReplace" onclick="_regexSwitchTab('replace')" style="padding:6px 18px;border-radius:0 8px 8px 0;border:1px solid var(--glass-border);border-left:none;background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:13px;cursor:pointer;transition:all 0.2s">替换模式</button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">测试文本</div>
        <span id="regexStatus" style="font-size:12px"></span>
      </div>
      <textarea class="tool-textarea" id="regexText" rows="7" placeholder="输入要测试的文本..." oninput="runRegex()"></textarea>
      <div id="regexReplaceRow" style="display:none;margin-top:10px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">替换为</div>
        <input class="tool-input" id="regexReplaceStr" placeholder="替换字符串（支持 $1 $2 等捕获组引用）..." oninput="runRegex()">
      </div>
    </div>
    <div class="tool-card-panel" id="regexResultPanel" style="display:none">
      <div id="regexMatchPanel">
        <div class="panel-label" style="margin-bottom:10px">匹配高亮</div>
        <div id="regexHighlight" style="font-family:monospace;font-size:13px;line-height:1.9;white-space:pre-wrap;word-break:break-all;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;margin-bottom:12px;max-height:240px;overflow-y:auto"></div>
        <div id="regexMatches"></div>
      </div>
      <div id="regexReplacePanel" style="display:none">
        <div class="panel-label" style="margin-bottom:10px">替换结果</div>
        <div id="regexReplaceResult" style="font-family:monospace;font-size:13px;line-height:1.9;white-space:pre-wrap;word-break:break-all;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;max-height:300px;overflow-y:auto"></div>
        <button class="btn btn-secondary" style="margin-top:10px" onclick="_regexCopyReplace()">复制结果</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">已保存的正则</div>
        <span style="font-size:11px;color:var(--text-muted)">点击加载</span>
      </div>
      <div id="regexSavedList"></div>
    </div>`;

  window._regexMode = 'match';
  ['regexPattern','regexText','regexFlags'].forEach(id =>
    document.getElementById(id).addEventListener('input', testRegex));
  regexRenderSaved();
}

function _regexFlagDesc(f) {
  return {g:'全局匹配',i:'忽略大小写',m:'多行模式',s:'点号匹配换行',u:'Unicode模式'}[f]||f;
}

function _regexToggleFlag(f) {
  const inp = document.getElementById('regexFlags');
  const flags = inp.value;
  inp.value = flags.includes(f) ? flags.replace(f,'') : flags + f;
  const btn = document.getElementById('flag_'+f);
  const active = inp.value.includes(f);
  btn.style.background = active ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.04)';
  btn.style.color = active ? 'var(--accent)' : 'var(--text-muted)';
  btn.style.borderColor = active ? 'rgba(102,126,234,0.5)' : 'var(--glass-border)';
  testRegex();
}

function _regexFillSnippet(btn) {
  const pattern = btn.dataset.pattern;
  document.getElementById('regexPattern').value = pattern;
  runRegex();
}

function _regexSwitchTab(mode) {
  window._regexMode = mode;
  const isReplace = mode === 'replace';
  const tabMatch   = document.getElementById('regexTabMatch');
  const tabReplace = document.getElementById('regexTabReplace');
  const replaceRow = document.getElementById('regexReplaceRow');
  const matchPanel   = document.getElementById('regexMatchPanel');
  const replacePanel = document.getElementById('regexReplacePanel');

  tabMatch.style.background   = isReplace ? 'rgba(255,255,255,0.04)' : 'rgba(102,126,234,0.2)';
  tabMatch.style.color        = isReplace ? 'var(--text-muted)' : 'var(--accent)';
  tabReplace.style.background = isReplace ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.04)';
  tabReplace.style.color      = isReplace ? 'var(--accent)' : 'var(--text-muted)';
  replaceRow.style.display    = isReplace ? '' : 'none';
  matchPanel.style.display    = isReplace ? 'none' : '';
  replacePanel.style.display  = isReplace ? '' : 'none';
  runRegex();
}

function _regexCopyReplace() {
  const el = document.getElementById('regexReplaceResult');
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => showToast('已复制替换结果'));
}

function runRegex() { testRegex(); }

function testRegex() {
  const pattern  = document.getElementById('regexPattern').value;
  const text     = document.getElementById('regexText').value;
  const flags    = document.getElementById('regexFlags').value;
  const statusEl = document.getElementById('regexStatus');
  const panel    = document.getElementById('regexResultPanel');
  const mode     = window._regexMode || 'match';

  if (!pattern) {
    panel.style.display = 'none';
    statusEl.textContent = '';
    return;
  }

  let re;
  try {
    re = new RegExp(pattern, flags);
  } catch(e) {
    statusEl.textContent = '正则错误: ' + e.message;
    statusEl.style.color = '#ef4444';
    panel.style.display = 'none';
    return;
  }

  panel.style.display = '';

  if (mode === 'replace') {
    const replaceStr = document.getElementById('regexReplaceStr').value;
    let result;
    try {
      result = text.replace(re, replaceStr);
    } catch(e) {
      result = '替换出错: ' + e.message;
    }
    document.getElementById('regexReplaceResult').textContent = result;
    statusEl.textContent = '替换完成';
    statusEl.style.color = '#10b981';
    return;
  }

  // Match mode
  const highlight = document.getElementById('regexHighlight');
  const matchesEl = document.getElementById('regexMatches');

  const matches = [];
  let m;
  const safeRe = new RegExp(pattern, flags.includes('g') ? flags : flags+'g');
  safeRe.lastIndex = 0;
  while ((m = safeRe.exec(text)) !== null) {
    matches.push({...m, index: m.index, input: m.input});
    if (!flags.includes('g') || m[0].length === 0) break;
  }

  statusEl.textContent = matches.length ? `✓ ${matches.length} 个匹配` : '○ 无匹配';
  statusEl.style.color  = matches.length ? '#10b981' : 'var(--text-muted)';

  // 高亮渲染
  let html = '', last = 0;
  matches.forEach(m => {
    html += _escRe(text.slice(last, m.index));
    html += `<mark style="background:rgba(240,147,251,0.35);color:#f093fb;border-radius:2px">${_escRe(m[0])}</mark>`;
    last = m.index + m[0].length;
  });
  html += _escRe(text.slice(last));
  highlight.innerHTML = html;

  // 匹配详情
  if (matches.length) {
    matchesEl.innerHTML = `<div class="panel-label" style="margin-bottom:8px">匹配详情 (前 ${Math.min(matches.length,20)} 个)</div>` +
      matches.slice(0,20).map((m,i) => `
        <div style="margin-bottom:6px;padding:8px 12px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:8px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">#${i+1} · 位置 ${m.index}\u2013${m.index+m[0].length}</div>
          <div style="font-family:monospace;color:var(--neon);word-break:break-all">${_escRe(m[0])}</div>
          ${m.slice(1).length ? m.slice(1).map((g,gi) =>
            `<span style="font-size:11px;color:var(--text-muted)">组${gi+1}:</span> <span style="font-size:11px;color:#f093fb">${_escRe(g||'undefined')}</span> `).join('') : ''}
        </div>`).join('');
  } else matchesEl.innerHTML = '';
}

function _escRe(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── 保存常用正则 ──
function regexSaveCurrent() {
  const pattern = (document.getElementById('regexPattern') || {}).value || '';
  const flags = (document.getElementById('regexFlags') || {}).value || '';
  if (!pattern) { showToast('请先输入正则表达式', 'info'); return; }
  const name = prompt('为此正则命名（方便识别）：', pattern.slice(0, 20));
  if (!name) return;
  const saved = JSON.parse(localStorage.getItem('dtb_saved_regex') || '[]');
  saved.unshift({ name, pattern, flags, time: Date.now() });
  localStorage.setItem('dtb_saved_regex', JSON.stringify(saved.slice(0, 30)));
  regexRenderSaved();
  showToast('已保存', 'success');
}

function regexRenderSaved() {
  const el = document.getElementById('regexSavedList');
  if (!el) return;
  const saved = JSON.parse(localStorage.getItem('dtb_saved_regex') || '[]');
  if (!saved.length) { el.innerHTML = '<span style="color:var(--text-muted);font-size:12px">暂无保存</span>'; return; }
  el.innerHTML = saved.map((r, i) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;background:var(--surface);margin-bottom:6px">
      <span style="flex:1;font-size:12px;color:var(--text);cursor:pointer;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onclick="regexLoad(${i})" title="点击加载"><span style="color:var(--text-muted)">${r.name}:</span> /${r.pattern}/${r.flags}</span>
      <button onclick="regexDeleteSaved(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:0 4px" title="删除">×</button>
    </div>`
  ).join('');
}

function regexLoad(i) {
  const saved = JSON.parse(localStorage.getItem('dtb_saved_regex') || '[]');
  const r = saved[i];
  if (!r) return;
  const p = document.getElementById('regexPattern');
  const f = document.getElementById('regexFlags');
  if (p) p.value = r.pattern;
  if (f) f.value = r.flags;
  runRegex();
}

function regexDeleteSaved(i) {
  const saved = JSON.parse(localStorage.getItem('dtb_saved_regex') || '[]');
  saved.splice(i, 1);
  localStorage.setItem('dtb_saved_regex', JSON.stringify(saved));
  regexRenderSaved();
}

function clearRegex() {
  document.getElementById('regexPattern').value = '';
  document.getElementById('regexText').value = '';
  document.getElementById('regexFlags').value = '';
  document.getElementById('regexReplaceStr').value = '';
  document.getElementById('regexResultPanel').style.display = 'none';
  document.getElementById('regexStatus').textContent = '';
  ['g','i','m','s','u'].forEach(f => {
    const btn = document.getElementById('flag_'+f);
    if (btn) { btn.style.background=''; btn.style.color=''; btn.style.borderColor=''; }
  });
}
