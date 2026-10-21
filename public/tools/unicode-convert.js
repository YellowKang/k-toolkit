var _unicodeTab = 'unicode';

const _unicodeDict = {
  zh: {
    tab_unicode: 'Unicode 转义', tab_html: 'HTML 实体',
    unicode_label: '文本 ↔ Unicode 转义序列', unicode_ph: '输入文本或 \\uXXXX 序列...', escape: '转义 →', unescape: '← 还原',
    html_label: '文本 ↔ HTML 实体', html_ph: '输入文本或 HTML 实体...', html_encode: 'HTML 编码 →', html_decode: '← HTML 解码',
    clear: '清空', result: '结果', copy: '复制',
  },
  en: {
    tab_unicode: 'Unicode escape', tab_html: 'HTML entities',
    unicode_label: 'Text ↔ Unicode escape sequences', unicode_ph: 'Enter text or \\uXXXX sequences...', escape: 'Escape →', unescape: '← Unescape',
    html_label: 'Text ↔ HTML entities', html_ph: 'Enter text or HTML entities...', html_encode: 'HTML encode →', html_decode: '← HTML decode',
    clear: 'Clear', result: 'Result', copy: 'Copy',
  },
};

function renderUnicode(el) {
  const T = makeToolI18n(_unicodeDict);
  _unicodeTab = 'unicode';
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <button class="btn btn-primary" id="uTabUnicode" onclick="switchUnicodeTab('unicode')">${T('tab_unicode')}</button>
        <button class="btn btn-secondary" id="uTabHtml" onclick="switchUnicodeTab('html')">${T('tab_html')}</button>
      </div>
      <div id="uPaneUnicode">
        <div class="panel-label">${T('unicode_label')}</div>
        <textarea class="tool-textarea" id="unicodeInput" rows="4" placeholder="${T('unicode_ph')}"></textarea>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-primary" onclick="encodeUnicode()">${T('escape')}</button>
          <button class="btn btn-secondary" onclick="decodeUnicode()">${T('unescape')}</button>
          <button class="btn btn-secondary" onclick="document.getElementById('unicodeInput').value='';showUnicodeOutput('')">${T('clear')}</button>
        </div>
      </div>
      <div id="uPaneHtml" style="display:none">
        <div class="panel-label">${T('html_label')}</div>
        <textarea class="tool-textarea" id="htmlEntityInput" rows="4" placeholder="${T('html_ph')}"></textarea>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-primary" onclick="encodeHtmlEntity()">${T('html_encode')}</button>
          <button class="btn btn-secondary" onclick="decodeHtmlEntity()">${T('html_decode')}</button>
          <button class="btn btn-secondary" onclick="document.getElementById('htmlEntityInput').value='';showUnicodeOutput('')">${T('clear')}</button>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="unicodeOutput" style="display:none"></div>`;
}

function switchUnicodeTab(tab) {
  _unicodeTab = tab;
  document.getElementById('uPaneUnicode').style.display = tab === 'unicode' ? '' : 'none';
  document.getElementById('uPaneHtml').style.display = tab === 'html' ? '' : 'none';
  document.getElementById('uTabUnicode').className = tab === 'unicode' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('uTabHtml').className = tab === 'html' ? 'btn btn-primary' : 'btn btn-secondary';
}

function encodeUnicode() {
  var s = document.getElementById('unicodeInput').value;
  var out = s.split('').map(function(c) {
    return c.charCodeAt(0) > 127 ? '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0') : c;
  }).join('');
  showUnicodeOutput(out);
}

function decodeUnicode() {
  var s = document.getElementById('unicodeInput').value;
  var out = s.replace(/\\u([0-9a-fA-F]{4})/g, function(_, h){ return String.fromCharCode(parseInt(h,16)); });
  showUnicodeOutput(out);
}

function encodeHtmlEntity() {
  var s = document.getElementById('htmlEntityInput').value;
  var out = s.split('').map(function(c) {
    var code = c.charCodeAt(0);
    if (c === '&') return '&amp;';
    if (c === '<') return '&lt;';
    if (c === '>') return '&gt;';
    if (c === '"') return '&quot;';
    if (c === "'") return '&#39;';
    if (code > 127) return '&#' + code + ';';
    return c;
  }).join('');
  showUnicodeOutput(out);
}

function decodeHtmlEntity() {
  var s = document.getElementById('htmlEntityInput').value;
  var d = document.createElement('textarea');
  d.innerHTML = s;
  showUnicodeOutput(d.value);
}

function showUnicodeOutput(text) {
  const T = makeToolI18n(_unicodeDict);
  var el = document.getElementById('unicodeOutput');
  if (!text) { el.style.display = 'none'; return; }
  el.style.display = '';
  var id = 'ucopyBtn';
  setTimeout(function(){
    var b = document.getElementById(id);
    if (b) b.onclick = function(){ copyText(text, b); };
  }, 0);
  el.innerHTML = '<div class="panel-label">' + T('result') + '</div>' +
    '<div style="display:flex;align-items:flex-start;gap:10px">' +
    '<pre style="flex:1;font-family:monospace;font-size:13px;white-space:pre-wrap;word-break:break-all;margin:0;color:var(--text)">' + escHtml(text) + '</pre>' +
    '<button class="copy-inline" id="' + id + '">' + T('copy') + '</button>' +
    '</div>';
}
