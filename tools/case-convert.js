// ── i18n dict ──
const _caseConvertDict = {
  zh: {
    input_text: '输入文本',
    example: '示例',
    placeholder: '输入要转换的文本...',
    all_formats: '全部格式',
    copy_result: '复制结果',
    copy: '复制',
    formats_count: '种格式',
  },
  en: {
    input_text: 'Input Text',
    example: 'Example',
    placeholder: 'Enter text to convert...',
    all_formats: 'All Formats',
    copy_result: 'Copy Result',
    copy: 'Copy',
    formats_count: 'formats',
  },
};

function renderCaseConvert(el) {
  const tl = makeToolI18n(_caseConvertDict);
  // Store tl at module level for use in other functions
  window._ccTl = tl;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${tl('input_text')}</div>
        <button class="btn btn-secondary" onclick="ccLoadSample()">${tl('example')}</button>
      </div>
      <textarea class="tool-textarea" id="ccText" rows="5" placeholder="${tl('placeholder')}"></textarea>
      <div class="tool-actions" style="flex-wrap:wrap;gap:8px">
        <button class="btn btn-primary" onclick="ccConvert('camel')">camelCase</button>
        <button class="btn btn-primary" onclick="ccConvert('pascal')">PascalCase</button>
        <button class="btn btn-secondary" onclick="ccConvert('snake')">snake_case</button>
        <button class="btn btn-secondary" onclick="ccConvert('kebab')">kebab-case</button>
        <button class="btn btn-secondary" onclick="ccConvert('upper')">UPPER_CASE</button>
        <button class="btn btn-secondary" onclick="ccConvert('lower')">lower case</button>
        <button class="btn btn-secondary" onclick="ccConvert('title')">Title Case</button>
        <button class="btn btn-secondary" onclick="ccConvert('dot')">dot.case</button>
        <button class="btn btn-secondary" onclick="ccConvert('path')">path/case</button>
        <button class="btn btn-secondary" onclick="ccConvert('sentence')">Sentence case</button>
      </div>
    </div>
    <div class="tool-card-panel" id="ccAllResults" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">${tl('all_formats')}</div>
        <span style="font-size:12px;color:var(--text-muted)" id="ccAllStatus"></span>
      </div>
      <div id="ccAllRows"></div>
    </div>
    <div class="tool-card-panel" id="ccResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="ccStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('ccOutput').textContent,this)">${tl('copy_result')}</button>
      </div>
      <div class="result-box" id="ccOutput" style="word-break:break-all;font-family:monospace"></div>
    </div>`;

  document.getElementById('ccText').addEventListener('input', ccShowAll);
}

const _ccFormats = [
  { key: 'camel',    label: 'camelCase' },
  { key: 'pascal',   label: 'PascalCase' },
  { key: 'snake',    label: 'snake_case' },
  { key: 'kebab',    label: 'kebab-case' },
  { key: 'upper',    label: 'UPPER_CASE' },
  { key: 'lower',    label: 'lower case' },
  { key: 'title',    label: 'Title Case' },
  { key: 'dot',      label: 'dot.case' },
  { key: 'path',     label: 'path/case' },
  { key: 'sentence', label: 'Sentence case' },
];

function _ccWords(text) {
  return text
    .replace(/([a-z])([A-Z])/g,'$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2')
    .replace(/[-_./\\]+/g,' ')
    .trim().split(/\s+/).filter(Boolean);
}

function _ccApplyFormat(words, fmt) {
  switch(fmt) {
    case 'camel':    return words.map((w,i) => i===0?w.toLowerCase():w[0].toUpperCase()+w.slice(1).toLowerCase()).join('');
    case 'pascal':   return words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join('');
    case 'snake':    return words.map(w => w.toLowerCase()).join('_');
    case 'kebab':    return words.map(w => w.toLowerCase()).join('-');
    case 'upper':    return words.map(w => w.toUpperCase()).join('_');
    case 'lower':    return words.map(w => w.toLowerCase()).join(' ');
    case 'title':    return words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ');
    case 'dot':      return words.map(w => w.toLowerCase()).join('.');
    case 'path':     return words.map(w => w.toLowerCase()).join('/');
    case 'sentence': return words.map((w,i) => i===0?w[0].toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join(' ');
    default: return '';
  }
}

function ccShowAll() {
  const tl = window._ccTl || function(k){ return k; };
  const text = document.getElementById('ccText').value;
  const allPanel = document.getElementById('ccAllResults');
  const rowsEl = document.getElementById('ccAllRows');

  if (!text.trim()) {
    allPanel.style.display = 'none';
    return;
  }

  const words = _ccWords(text);
  if (!words.length) {
    allPanel.style.display = 'none';
    return;
  }

  const results = _ccFormats.map(f => ({
    key: f.key,
    label: f.label,
    value: _ccApplyFormat(words, f.key)
  }));

  rowsEl.innerHTML = results.map(row => `
    <div class="result-row" id="ccRow_${row.key}" style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="color:var(--text-muted);width:90px;flex-shrink:0;font-size:12px">${row.label}</span>
      <span style="font-family:monospace;font-size:13px;flex:1;word-break:break-all">${row.value}</span>
      <button class="copy-inline" onclick="copyText('${row.value.replace(/'/g,"&#39;")}',this)">${tl('copy')}</button>
    </div>`).join('');

  document.getElementById('ccAllStatus').textContent = `${results.length} ${tl('formats_count')}`;
  allPanel.style.display = '';

  // Agent compat: update ccOutput with first format
  document.getElementById('ccOutput').textContent = results[0].value;
  document.getElementById('ccStatus').textContent = '✓ ' + results[0].label;
  document.getElementById('ccStatus').style.color = '#10b981';
  // Keep ccResultPanel hidden when showing all results; only show via button click
}

function ccConvert(fmt) {
  const text = document.getElementById('ccText').value;
  if (!text.trim()) return;
  const words = _ccWords(text);
  const label = _ccFormats.find(f => f.key === fmt)?.label || fmt;
  const result = _ccApplyFormat(words, fmt);

  document.getElementById('ccOutput').textContent = result;
  document.getElementById('ccStatus').textContent = '✓ ' + label;
  document.getElementById('ccStatus').style.color = '#10b981';
  document.getElementById('ccResultPanel').style.display = '';

  // If all-results panel is visible, highlight the corresponding row
  const targetRow = document.getElementById('ccRow_' + fmt);
  if (targetRow) {
    // Remove previous highlights
    document.querySelectorAll('#ccAllRows .result-row').forEach(r => {
      r.style.background = '';
      r.style.borderRadius = '';
      r.style.padding = '';
    });
    // Highlight and scroll to target
    targetRow.style.background = 'rgba(102,126,234,0.12)';
    targetRow.style.borderRadius = '8px';
    targetRow.style.padding = '4px 8px';
    targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function ccLoadSample() {
  document.getElementById('ccText').value = 'hello world foo bar';
  ccShowAll();
}
