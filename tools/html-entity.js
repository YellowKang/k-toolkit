// ── i18n dict ──
const _htmlEntityDict = {
  zh: {
    input_text: '输入文本',
    placeholder: '输入需要编码/解码的文本...',
    html_encode: 'HTML 编码',
    html_decode: 'HTML 解码',
    full_encode: '完整编码',
    swap: '互换',
    clear: '清空',
    copy_result: '复制结果',
    output: '输出结果',
    entity_ref: '常用实体参考',
    click_insert: '点击插入',
    encode_done: '编码完成',
    decode_done: '解码完成',
    input_chars: '输入',
    output_chars: '输出',
    chars_unit: '字符',
    ent_ampersand: '与号',
    ent_less_than: '小于',
    ent_greater_than: '大于',
    ent_double_quote: '双引号',
    ent_single_quote: '单引号',
    ent_nbsp: '不换行空格',
    ent_copyright: '版权',
    ent_registered: '注册商标',
    ent_trademark: '商标',
    ent_em_dash: '长破折号',
    ent_en_dash: '短破折号',
    ent_ellipsis: '省略号',
    ent_laquo: '左书名号',
    ent_raquo: '右书名号',
    ent_multiply: '乘号',
    ent_divide: '除号',
  },
  en: {
    input_text: 'Input Text',
    placeholder: 'Enter text to encode/decode...',
    html_encode: 'HTML Encode',
    html_decode: 'HTML Decode',
    full_encode: 'Full Encode',
    swap: 'Swap',
    clear: 'Clear',
    copy_result: 'Copy Result',
    output: 'Output',
    entity_ref: 'Common Entity Reference',
    click_insert: 'Click to insert',
    encode_done: 'Encode done',
    decode_done: 'Decode done',
    input_chars: 'Input',
    output_chars: 'Output',
    chars_unit: 'chars',
    ent_ampersand: 'Ampersand',
    ent_less_than: 'Less than',
    ent_greater_than: 'Greater than',
    ent_double_quote: 'Double quote',
    ent_single_quote: 'Single quote',
    ent_nbsp: 'Non-breaking space',
    ent_copyright: 'Copyright',
    ent_registered: 'Registered',
    ent_trademark: 'Trademark',
    ent_em_dash: 'Em dash',
    ent_en_dash: 'En dash',
    ent_ellipsis: 'Ellipsis',
    ent_laquo: 'Left guillemet',
    ent_raquo: 'Right guillemet',
    ent_multiply: 'Multiply',
    ent_divide: 'Divide',
  },
};

function renderHTMLEntity(el) {
  const tl = makeToolI18n(_htmlEntityDict);
  // Store tl for use in other functions
  window._heTl = tl;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${tl('input_text')}</div>
      <textarea class="tool-textarea" id="heInput" rows="6" placeholder="${tl('placeholder')}"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="heEncode()">${tl('html_encode')}</button>
        <button class="btn btn-secondary" onclick="heDecode()">${tl('html_decode')}</button>
        <button class="btn btn-secondary" onclick="heEncodeAll()">${tl('full_encode')}</button>
        <button class="btn btn-secondary" onclick="heSwap()">&#8597; ${tl('swap')}</button>
        <button class="btn btn-secondary" onclick="heClear()">${tl('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="heResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="panel-label" style="margin:0" id="heStatus"></div>
          <span id="heCount" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('heOutput').textContent,this)">${tl('copy_result')}</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${tl('output')}</div>
      <pre class="result-box" id="heOutput" style="white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:12px">${tl('entity_ref')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px" id="heRefGrid"></div>
    </div>`;

  const refs = [
    ['&amp;',   '&',  tl('ent_ampersand')],
    ['&lt;',    '<',  tl('ent_less_than')],
    ['&gt;',    '>',  tl('ent_greater_than')],
    ['&quot;',  '"', tl('ent_double_quote')],
    ['&apos;',  "'", tl('ent_single_quote')],
    ['&nbsp;',  null, tl('ent_nbsp')],
    ['&copy;',  '\u00a9',  tl('ent_copyright')],
    ['&reg;',   '\u00ae',  tl('ent_registered')],
    ['&trade;', '\u2122',  tl('ent_trademark')],
    ['&mdash;', '\u2014',  tl('ent_em_dash')],
    ['&ndash;', '\u2013',  tl('ent_en_dash')],
    ['&hellip;','\u2026',  tl('ent_ellipsis')],
    ['&laquo;', '\u00ab',  tl('ent_laquo')],
    ['&raquo;', '\u00bb',  tl('ent_raquo')],
    ['&times;', '\u00d7',  tl('ent_multiply')],
    ['&divide;','\u00f7',  tl('ent_divide')],
  ];
  const grid = document.getElementById('heRefGrid');
  refs.forEach(([entity, char, label]) => {
    const div = document.createElement('div');
    div.title = tl('click_insert') + ' ' + entity;
    div.style.cssText = 'display:flex;align-items:center;gap:6px;padding:6px 10px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:8px;font-size:12px;cursor:pointer;transition:border-color 0.2s';
    div.onmouseover = () => div.style.borderColor = 'var(--accent)';
    div.onmouseout  = () => div.style.borderColor = 'var(--glass-border)';
    div.onclick = () => {
      const ta = document.getElementById('heInput');
      ta.value += entity;
      ta.focus();
    };
    const charDisplay = char === null
      ? '<span style="background:rgba(102,126,234,0.2);padding:0 4px;border-radius:3px;font-size:10px;color:var(--accent)">space</span>'
      : char;
    div.innerHTML = `<code style="color:var(--accent);font-family:monospace;min-width:58px">${entity}</code><span style="color:var(--text-muted);flex:1">${charDisplay}</span><span style="color:var(--text-muted);font-size:10px;opacity:0.6">${label}</span>`;
    grid.appendChild(div);
  });
}

function heEncode() {
  const tl = window._heTl || function(k){ return k; };
  const v = document.getElementById('heInput').value;
  if (!v) return;
  const out = v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  _heShowResult(out, tl('encode_done'));
}

function heEncodeAll() {
  const tl = window._heTl || function(k){ return k; };
  const v = document.getElementById('heInput').value;
  if (!v) return;
  let out = v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  out = out.replace(/[^\x00-\x7E]/g, ch => `&#x${ch.codePointAt(0).toString(16).toUpperCase()};`);
  _heShowResult(out, tl('encode_done'));
}

function heDecode() {
  const tl = window._heTl || function(k){ return k; };
  const v = document.getElementById('heInput').value;
  if (!v) return;
  const doc = new DOMParser().parseFromString(v, 'text/html');
  const out = doc.documentElement.textContent;
  _heShowResult(out, tl('decode_done'));
}

function _heShowResult(out, label) {
  const tl = window._heTl || function(k){ return k; };
  const inputLen = document.getElementById('heInput').value.length;
  document.getElementById('heOutput').textContent = out;
  document.getElementById('heStatus').textContent = '✓ ' + label;
  document.getElementById('heStatus').style.color = '#10b981';
  document.getElementById('heCount').textContent = `${tl('input_chars')} ${inputLen} ${tl('chars_unit')} → ${tl('output_chars')} ${out.length} ${tl('chars_unit')}`;
  document.getElementById('heResult').style.display = '';
}

function heSwap() {
  const output = document.getElementById('heOutput').textContent;
  if (!output) return;
  document.getElementById('heInput').value = output;
  document.getElementById('heResult').style.display = 'none';
}

function heClear() {
  document.getElementById('heInput').value = '';
  document.getElementById('heResult').style.display = 'none';
}
