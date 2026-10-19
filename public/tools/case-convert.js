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

function _ccWords(text) { return window.ToolCompute.words(text); }
function _ccApplyFormat(words, fmt) { return window.ToolCompute.formatWords(words, fmt); }

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

  rowsEl.replaceChildren();
  for (const row of results) {
    const el = document.createElement('div'); el.className = 'result-row'; el.id = 'ccRow_' + row.key;
    el.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:6px';
    const label = document.createElement('span'); label.textContent = row.label;
    label.style.cssText = 'color:var(--text-muted);width:90px;flex-shrink:0;font-size:12px';
    const value = document.createElement('span'); value.textContent = row.value;
    value.style.cssText = 'font-family:monospace;font-size:13px;flex:1;word-break:break-all';
    const button = document.createElement('button'); button.type = 'button'; button.className = 'copy-inline'; button.textContent = tl('copy');
    button.addEventListener('click', () => copyText(row.value, button));
    el.append(label, value, button); rowsEl.appendChild(el);
  }

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
