/* ── String Inspector — Character Analysis & Invisible Char Detection ── */
function renderStringInspect(el) {
  const t = makeToolI18n({
    zh: {
      title: '字符串检查器', input_placeholder: '粘贴或输入要检查的字符串...',
      chars: '字符', bytes: '字节', lines: '行', words: '词',
      char_table: '字符详情表',
      col_char: '字符', col_unicode: 'Unicode', col_bytes: '字节', col_category: '分类',
      cat_letter: '字母', cat_digit: '数字', cat_symbol: '符号', cat_space: '空白', cat_control: '控制符',
      clean_btn: '清除不可见字符', cleaned: (n) => `已清除 ${n} 个不可见字符`,
      no_invisible: '未发现不可见字符', replace_title: '查找替换不可见字符',
      find_label: '查找 (Unicode)', replace_label: '替换为',
      replace_btn: '替换', replace_all_btn: '全部替换',
      replaced: (n) => `已替换 ${n} 处`,
    },
    en: {
      title: 'String Inspector', input_placeholder: 'Paste or type a string to inspect...',
      chars: 'Chars', bytes: 'Bytes', lines: 'Lines', words: 'Words',
      char_table: 'Character Details',
      col_char: 'Char', col_unicode: 'Unicode', col_bytes: 'Bytes', col_category: 'Category',
      cat_letter: 'Letter', cat_digit: 'Digit', cat_symbol: 'Symbol', cat_space: 'Space', cat_control: 'Control',
      clean_btn: 'Clean Invisible Chars', cleaned: (n) => `Cleaned ${n} invisible char${n===1?'':'s'}`,
      no_invisible: 'No invisible characters found', replace_title: 'Find & Replace Invisible Chars',
      find_label: 'Find (Unicode)', replace_label: 'Replace with',
      replace_btn: 'Replace', replace_all_btn: 'Replace All',
      replaced: (n) => `Replaced ${n} occurrence${n===1?'':'s'}`,
    },
  });
  window._siT = t;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${t('title')}</div>
      <textarea class="tool-textarea" id="siInput" rows="5" placeholder="${t('input_placeholder')}" oninput="_siAnalyze()"></textarea>
      <div id="siStats" style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap"></div>
    </div>
    <div class="tool-card-panel" id="siTablePanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div class="panel-label" style="margin:0">${t('char_table')}</div>
        <button class="btn btn-primary" onclick="_siClean()">${t('clean_btn')}</button>
      </div>
      <div class="result-box" id="siTable" style="max-height:360px;overflow-y:auto"></div>
    </div>
    <div class="tool-card-panel" id="siReplacePanel" style="display:none">
      <div class="panel-label" style="margin-bottom:10px">${t('replace_title')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">
        <div style="flex:1;min-width:120px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${t('find_label')}</div>
          <input class="tool-input" id="siFind" placeholder="U+200B" style="font-family:monospace">
        </div>
        <div style="flex:1;min-width:120px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${t('replace_label')}</div>
          <input class="tool-input" id="siReplace" placeholder="">
        </div>
        <button class="btn btn-secondary" onclick="_siReplace(false)">${t('replace_btn')}</button>
        <button class="btn btn-primary" onclick="_siReplace(true)">${t('replace_all_btn')}</button>
      </div>
    </div>`;
}

const _siEnc = new TextEncoder();

function _siIsInvisible(c) {
  return (c < 32 && c !== 10 && c !== 13 && c !== 9) || c === 127 ||
    (c >= 0x200B && c <= 0x200F) || c === 0xFEFF || c === 0x2028 || c === 0x2029 ||
    (c >= 0x202A && c <= 0x202E) || (c >= 0x2060 && c <= 0x2064) || (c >= 0xFFF9 && c <= 0xFFFB);
}

function _siCategory(ch) {
  const t = window._siT || ((k) => k);
  if (/\p{L}/u.test(ch)) return t('cat_letter');
  if (/\p{N}/u.test(ch)) return t('cat_digit');
  if (/\p{S}/u.test(ch) || /\p{P}/u.test(ch)) return t('cat_symbol');
  if (/\s/.test(ch)) return t('cat_space');
  return t('cat_control');
}

function _siEsc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function _siAnalyze() {
  const t = window._siT || ((k) => k);
  const text = document.getElementById('siInput').value;
  const statsEl = document.getElementById('siStats');
  const tblP = document.getElementById('siTablePanel');
  const repP = document.getElementById('siReplacePanel');
  if (!text) { statsEl.innerHTML = ''; tblP.style.display = 'none'; repP.style.display = 'none'; return; }
  const chars = [...text];
  const byteLen = _siEnc.encode(text).length;
  const lines = text.split('\n').length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  let hasInvisible = false;
  const ss = 'padding:6px 14px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:8px;font-size:13px';
  statsEl.innerHTML =
    `<span style="${ss}"><b style="color:var(--neon)">${chars.length}</b> ${t('chars')}</span>` +
    `<span style="${ss}"><b style="color:var(--neon)">${byteLen}</b> ${t('bytes')}</span>` +
    `<span style="${ss}"><b style="color:var(--neon)">${lines}</b> ${t('lines')}</span>` +
    `<span style="${ss}"><b style="color:var(--neon)">${words}</b> ${t('words')}</span>`;
  const rows = chars.map(ch => {
    const code = ch.codePointAt(0);
    const hex = 'U+' + code.toString(16).toUpperCase().padStart(4, '0');
    const bLen = _siEnc.encode(ch).length;
    const cat = _siCategory(ch);
    const inv = _siIsInvisible(code);
    if (inv) hasInvisible = true;
    const display = inv ? `<span style="color:#ef4444;font-weight:700">[${hex}]</span>` :
      ch === ' ' ? '<span style="color:var(--text-muted)">\u2423</span>' :
      ch === '\n' ? '<span style="color:var(--text-muted)">\u21B5</span>' :
      ch === '\t' ? '<span style="color:var(--text-muted)">\u21E5</span>' :
      ch === '\r' ? '<span style="color:var(--text-muted)">CR</span>' : _siEsc(ch);
    const bg = inv ? 'background:rgba(239,68,68,0.15);' : '';
    return `<tr style="${bg}"><td style="padding:4px 10px;font-family:monospace;font-size:14px">${display}</td>` +
      `<td style="padding:4px 10px;font-family:monospace;font-size:12px;color:var(--text-muted)">${hex}</td>` +
      `<td style="padding:4px 10px;font-size:12px;text-align:center">${bLen}</td>` +
      `<td style="padding:4px 10px;font-size:12px;color:var(--text-muted)">${cat}</td></tr>`;
  });
  tblP.style.display = '';
  repP.style.display = hasInvisible ? '' : 'none';
  document.getElementById('siTable').innerHTML =
    `<table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid var(--glass-border)">` +
    `<th style="padding:6px 10px;text-align:left;font-size:12px;color:var(--text-muted)">${t('col_char')}</th>` +
    `<th style="padding:6px 10px;text-align:left;font-size:12px;color:var(--text-muted)">${t('col_unicode')}</th>` +
    `<th style="padding:6px 10px;text-align:center;font-size:12px;color:var(--text-muted)">${t('col_bytes')}</th>` +
    `<th style="padding:6px 10px;text-align:left;font-size:12px;color:var(--text-muted)">${t('col_category')}</th>` +
    `</tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function _siClean() {
  const t = window._siT || ((k) => k);
  const inp = document.getElementById('siInput');
  const chars = [...inp.value];
  const cleaned = chars.filter(ch => !_siIsInvisible(ch.codePointAt(0)));
  const removed = chars.length - cleaned.length;
  if (removed === 0) { showToast(t('no_invisible')); return; }
  inp.value = cleaned.join('');
  _siAnalyze();
  showToast(t('cleaned', removed));
}

function _siReplace(all) {
  const t = window._siT || ((k) => k);
  const findRaw = document.getElementById('siFind').value.trim();
  const replaceWith = document.getElementById('siReplace').value;
  const inp = document.getElementById('siInput');
  if (!findRaw || !inp.value) return;
  let findChar = findRaw;
  const m = findRaw.match(/^U\+([0-9A-Fa-f]{4,6})$/i);
  if (m) findChar = String.fromCodePoint(parseInt(m[1], 16));
  let count = 0;
  if (all) {
    const parts = inp.value.split(findChar);
    count = parts.length - 1;
    inp.value = parts.join(replaceWith);
  } else {
    const idx = inp.value.indexOf(findChar);
    if (idx !== -1) {
      inp.value = inp.value.slice(0, idx) + replaceWith + inp.value.slice(idx + findChar.length);
      count = 1;
    }
  }
  _siAnalyze();
  showToast(t('replaced', count));
}
