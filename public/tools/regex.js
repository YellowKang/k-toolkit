function renderRegex(el) {
  const tl = makeToolI18n({
    zh: {
      title:          '正则表达式',
      placeholder:    '输入正则表达式...',
      save:           '保存',
      clear:          '清空',
      snippets:       '常用片段',
      tab_match:      '匹配模式',
      tab_replace:    '替换模式',
      test_text:      '测试文本',
      text_placeholder:'输入要测试的文本...',
      replace_with:   '替换为',
      replace_placeholder:'替换字符串（支持 $1 $2 等捕获组引用）...',
      match_highlight:'匹配高亮',
      match_detail:   '匹配详情',
      replace_result: '替换结果',
      copy_result:    '复制结果',
      saved_title:    '已保存的正则',
      saved_hint:     '点击加载',
      no_saved:       '暂无保存',
      regex_error:    '正则错误: ',
      replace_error:  '替换出错: ',
      replace_done:   '替换完成',
      match_count:    (n) => `✓ ${n} 个匹配`,
      no_match:       '○ 无匹配',
      match_detail_title: (n) => `匹配详情 (前 ${n} 个)`,
      group_label:    (i) => `组${i}:`,
      position_label: '位置',
      name_prompt:    '为此正则命名（方便识别）：',
      no_pattern:     '请先输入正则表达式',
      saved_toast:    '已保存',
      copied_toast:   '已复制替换结果',
      flag_g: '全局匹配', flag_i: '忽略大小写', flag_m: '多行模式', flag_s: '点号匹配换行', flag_u: 'Unicode模式',
      // snippet labels
      sn_email:'邮箱', sn_url:'URL', sn_phone:'手机', sn_ip:'IP', sn_date:'日期', sn_number:'数字',
      sn_idcard:'身份证', sn_chinese:'中文', sn_html:'HTML标签', sn_hex:'HEX颜色', sn_domain:'域名',
      sn_zip:'邮编', sn_uuid:'UUID', sn_mac:'MAC地址', sn_version:'版本号',
    },
    en: {
      title:          'Regex Tester',
      placeholder:    'Enter regex pattern...',
      save:           'Save',
      clear:          'Clear',
      snippets:       'Common Patterns',
      tab_match:      'Match',
      tab_replace:    'Replace',
      test_text:      'Test Text',
      text_placeholder:'Enter text to test...',
      replace_with:   'Replace with',
      replace_placeholder:'Replacement string ($1 $2 for capture groups)...',
      match_highlight:'Match Highlights',
      match_detail:   'Match Details',
      replace_result: 'Replace Result',
      copy_result:    'Copy Result',
      saved_title:    'Saved Patterns',
      saved_hint:     'Click to load',
      no_saved:       'No saved patterns',
      regex_error:    'Regex error: ',
      replace_error:  'Replace error: ',
      replace_done:   'Replaced',
      match_count:    (n) => `✓ ${n} match${n===1?'':'es'}`,
      no_match:       '○ No match',
      match_detail_title: (n) => `Match Details (first ${n})`,
      group_label:    (i) => `Group ${i}:`,
      position_label: 'Position',
      name_prompt:    'Name this pattern:',
      no_pattern:     'Enter a regex pattern first',
      saved_toast:    'Saved',
      copied_toast:   'Copied replace result',
      flag_g: 'Global', flag_i: 'Case insensitive', flag_m: 'Multiline', flag_s: 'Dotall', flag_u: 'Unicode',
      sn_email:'Email', sn_url:'URL', sn_phone:'Phone', sn_ip:'IP', sn_date:'Date', sn_number:'Number',
      sn_idcard:'ID Card', sn_chinese:'Chinese', sn_html:'HTML Tag', sn_hex:'HEX Color', sn_domain:'Domain',
      sn_zip:'Zip Code', sn_uuid:'UUID', sn_mac:'MAC Addr', sn_version:'Version',
    },
  });
  window._regexTl = tl;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${tl('title')}</div>
      <div style="display:flex;gap:0;align-items:center;background:rgba(0,0,0,0.35);border:1px solid var(--glass-border);border-radius:10px;overflow:hidden;margin-bottom:10px">
        <span style="padding:0 12px;color:var(--text-muted);font-size:20px;flex-shrink:0;line-height:1">/</span>
        <input class="tool-input" id="regexPattern" placeholder="${tl('placeholder')}" style="border:none;background:none;border-radius:0;flex:1;padding:10px 0" oninput="runRegex()">
        <span style="padding:0 10px;color:var(--text-muted);font-size:20px;flex-shrink:0;line-height:1">/</span>
        <input class="tool-input" id="regexFlags" placeholder="flags" style="border:none;background:none;border-radius:0;width:72px;padding:10px 8px" oninput="runRegex()">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        ${['g','i','m','s','u'].map(f => `<button class="flag-btn" id="flag_${f}" onclick="_regexToggleFlag('${f}')" title="${tl('flag_'+f)}" style="padding:3px 12px;border-radius:20px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:12px;cursor:pointer;font-family:monospace;transition:all 0.2s">${f}</button>`).join('')}
        <button class="btn btn-secondary" onclick="regexSaveCurrent()" style="margin-left:auto">${tl('save')}</button>
        <button class="btn btn-secondary" onclick="clearRegex()">${tl('clear')}</button>
      </div>
      <div style="margin-bottom:4px">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:7px">${tl('snippets')}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${[
            {key:'sn_email', pattern:'[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}'},
            {key:'sn_url',  pattern:'https?:\\/\\/[\\w\\-.]+(?:\\.[\\w\\-.]+)+[\\w\\-._~:/?#[\\]@!$&\'()*+,;=%]*'},
            {key:'sn_phone', pattern:'1[3-9]\\d{9}'},
            {key:'sn_ip',   pattern:'(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)'},
            {key:'sn_date', pattern:'\\d{4}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\\d|3[01])'},
            {key:'sn_number', pattern:'-?\\d+(?:\\.\\d+)?'},
            {key:'sn_idcard', pattern:'[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]'},
            {key:'sn_chinese',   pattern:'[\\u4e00-\\u9fa5]+'},
            {key:'sn_html',pattern:'<\\/?[a-zA-Z][^>]*>'},
            {key:'sn_hex',pattern:'#[0-9a-fA-F]{3,8}'},
            {key:'sn_domain',   pattern:'[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(?:\\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+'},
            {key:'sn_zip',   pattern:'\\d{6}'},
            {key:'sn_uuid',   pattern:'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'},
            {key:'sn_mac', pattern:'[0-9a-fA-F]{2}(?::[0-9a-fA-F]{2}){5}'},
            {key:'sn_version',  pattern:'v?\\d+\\.\\d+(?:\\.\\d+)?(?:-[\\w.]+)?'},
          ].map(s => {const label=tl(s.key); return `<button onclick="_regexFillSnippet(this)" data-pattern="${s.pattern.replace(/"/g,'&quot;')}" title="${label}: ${s.pattern.replace(/"/g,'&quot;')}" style="padding:2px 10px;border-radius:16px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:11px;cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(102,126,234,0.5)';this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--glass-border)';this.style.color='var(--text-muted)'">${label}</button>`;}).join('')}
        </div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;gap:0;margin-bottom:12px">
        <button id="regexTabMatch" onclick="_regexSwitchTab('match')" style="padding:6px 18px;border-radius:8px 0 0 8px;border:1px solid var(--glass-border);background:rgba(102,126,234,0.2);color:var(--accent);font-size:13px;cursor:pointer;font-weight:600;transition:all 0.2s">${tl('tab_match')}</button>
        <button id="regexTabReplace" onclick="_regexSwitchTab('replace')" style="padding:6px 18px;border-radius:0 8px 8px 0;border:1px solid var(--glass-border);border-left:none;background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:13px;cursor:pointer;transition:all 0.2s">${tl('tab_replace')}</button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${tl('test_text')}</div>
        <span id="regexStatus" style="font-size:12px"></span>
      </div>
      <textarea class="tool-textarea" id="regexText" rows="7" placeholder="${tl('text_placeholder')}" oninput="runRegex()"></textarea>
      <div id="regexReplaceRow" style="display:none;margin-top:10px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${tl('replace_with')}</div>
        <input class="tool-input" id="regexReplaceStr" placeholder="${tl('replace_placeholder')}" oninput="runRegex()">
      </div>
    </div>
    <div class="tool-card-panel" id="regexResultPanel" style="display:none">
      <div id="regexMatchPanel">
        <div class="panel-label" style="margin-bottom:10px">${tl('match_highlight')}</div>
        <div id="regexHighlight" style="font-family:monospace;font-size:13px;line-height:1.9;white-space:pre-wrap;word-break:break-all;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;margin-bottom:12px;max-height:240px;overflow-y:auto"></div>
        <div id="regexMatches"></div>
      </div>
      <div id="regexReplacePanel" style="display:none">
        <div class="panel-label" style="margin-bottom:10px">${tl('replace_result')}</div>
        <div id="regexReplaceResult" style="font-family:monospace;font-size:13px;line-height:1.9;white-space:pre-wrap;word-break:break-all;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;max-height:300px;overflow-y:auto"></div>
        <button class="btn btn-secondary" style="margin-top:10px" onclick="_regexCopyReplace()">${tl('copy_result')}</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${tl('saved_title')}</div>
        <span style="font-size:11px;color:var(--text-muted)">${tl('saved_hint')}</span>
      </div>
      <div id="regexSavedList"></div>
    </div>`;

  window._regexMode = 'match';
  regexRenderSaved();
}

function _regexFlagDesc(f) {
  const tl = window._regexTl || ((k) => k);
  return tl('flag_'+f);
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
  const tl = window._regexTl || ((k) => k);
  navigator.clipboard.writeText(el.textContent).then(() => showToast(tl('copied_toast')));
}

function runRegex() { testRegex(); }

function testRegex() {
  const tl = window._regexTl || ((k) => k);
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
    statusEl.textContent = tl('regex_error') + e.message;
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
      result = tl('replace_error') + e.message;
    }
    document.getElementById('regexReplaceResult').textContent = result;
    statusEl.textContent = tl('replace_done');
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

  statusEl.textContent = matches.length ? tl('match_count', matches.length) : tl('no_match');
  statusEl.style.color  = matches.length ? '#10b981' : 'var(--text-muted)';

  let html = '', last = 0;
  matches.forEach(m => {
    html += _escRe(text.slice(last, m.index));
    html += `<mark style="background:rgba(240,147,251,0.35);color:#f093fb;border-radius:2px">${_escRe(m[0])}</mark>`;
    last = m.index + m[0].length;
  });
  html += _escRe(text.slice(last));
  highlight.innerHTML = html;

  if (matches.length) {
    matchesEl.innerHTML = `<div class="panel-label" style="margin-bottom:8px">${tl('match_detail_title', Math.min(matches.length,20))}</div>` +
      matches.slice(0,20).map((m,i) => `
        <div style="margin-bottom:6px;padding:8px 12px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:8px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">#${i+1} · ${tl('position_label')} ${m.index}\u2013${m.index+m[0].length}</div>
          <div style="font-family:monospace;color:var(--neon);word-break:break-all">${_escRe(m[0])}</div>
          ${m.slice(1).length ? m.slice(1).map((g,gi) =>
            `<span style="font-size:11px;color:var(--text-muted)">${tl('group_label', gi+1)}</span> <span style="font-size:11px;color:#f093fb">${_escRe(g||'undefined')}</span> `).join('') : ''}
        </div>`).join('');
  } else matchesEl.innerHTML = '';
}

function _escRe(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── 保存常用正则 ──
function regexSaveCurrent() {
  const tl = window._regexTl || ((k) => k);
  const pattern = (document.getElementById('regexPattern') || {}).value || '';
  const flags = (document.getElementById('regexFlags') || {}).value || '';
  if (!pattern) { showToast(tl('no_pattern'), 'info'); return; }
  const name = prompt(tl('name_prompt'), pattern.slice(0, 20));
  if (!name) return;
  const saved = JSON.parse(localStorage.getItem('dtb_saved_regex') || '[]');
  saved.unshift({ name, pattern, flags, time: Date.now() });
  localStorage.setItem('dtb_saved_regex', JSON.stringify(saved.slice(0, 30)));
  regexRenderSaved();
  showToast(tl('saved_toast'), 'success');
}

function regexRenderSaved() {
  const tl = window._regexTl || ((k) => k);
  const el = document.getElementById('regexSavedList');
  if (!el) return;
  const saved = JSON.parse(localStorage.getItem('dtb_saved_regex') || '[]');
  if (!saved.length) { el.innerHTML = '<span style="color:var(--text-muted);font-size:12px">' + tl('no_saved') + '</span>'; return; }
  el.innerHTML = saved.map((r, i) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:8px;background:var(--surface);margin-bottom:6px">
      <span style="flex:1;font-size:12px;color:var(--text);cursor:pointer;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" onclick="regexLoad(${i})" title="${tl('saved_hint')}"><span style="color:var(--text-muted)">${_escRe(r.name)}:</span> /${_escRe(r.pattern)}/${_escRe(r.flags)}</span>
      <button onclick="regexDeleteSaved(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:0 4px">×</button>
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
