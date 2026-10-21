/* ── XML 格式化 / 压缩 / 转 JSON：见 compute/formats.js（保留注释/CDATA/声明，转义文本与属性） ── */

const _xmlDict = {
  zh: {
    format: '格式化', minify: '压缩', tojson: 'XML→JSON',
    input: '输入 XML', run: '执行', demo: '示例', clear: '清空', copy: '复制结果',
    ok_format: '✓ 格式化完成', ok_minify: '✓ 压缩完成', ok_json: '✓ 转换完成',
    error: '✗ XML 解析错误',
    at: (line, col) => line ? `第 ${line} 行${col ? `第 ${col} 列` : ''}：` : '',
    note: '压缩只移除标签间空白与注释，不改动文本和属性；转 JSON 时属性放在 "@"、文本放在 "#"，同名子元素合并为数组',
    sample: `<?xml version="1.0" encoding="UTF-8"?><!-- 书店示例 --><bookstore><book id="1" category="fiction"><title lang="zh">JavaScript权威指南</title><author>David Flanagan</author><price currency="CNY">89.00</price></book><book id="2" category="tech"><title lang="en">Clean Code &amp; Craft</title><author>Robert Martin</author><price currency="USD">69.00</price><note><![CDATA[<b>二手</b> 九成新]]></note></book></bookstore>`,
  },
  en: {
    format: 'Format', minify: 'Minify', tojson: 'XML→JSON',
    input: 'XML input', run: 'Run', demo: 'Sample', clear: 'Clear', copy: 'Copy result',
    ok_format: '✓ Formatted', ok_minify: '✓ Minified', ok_json: '✓ Converted',
    error: '✗ XML parse error',
    at: (line, col) => line ? `Line ${line}${col ? `, column ${col}` : ''}: ` : '',
    note: 'Minify removes only whitespace between tags and comments; text and attributes are untouched. JSON puts attributes under "@", text under "#", repeated elements into arrays',
    sample: `<?xml version="1.0" encoding="UTF-8"?><!-- Bookstore sample --><bookstore><book id="1" category="fiction"><title lang="en">JavaScript: The Definitive Guide</title><author>David Flanagan</author><price currency="CNY">89.00</price></book><book id="2" category="tech"><title lang="en">Clean Code &amp; Craft</title><author>Robert Martin</author><price currency="USD">69.00</price><note><![CDATA[<b>Used</b> like new]]></note></book></bookstore>`,
  },
};

function renderXmlFormat(el) {
  window._activeCleanup = () => clearTimeout(_xmlTimer);
  const T = makeToolI18n(_xmlDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
        <button class="btn btn-primary" id="xmlFmtBtn" onclick="setXmlMode('format')">${T('format')}</button>
        <button class="btn btn-secondary" id="xmlMinBtn" onclick="setXmlMode('minify')">${T('minify')}</button>
        <button class="btn btn-secondary" id="xmlJsonBtn" onclick="setXmlMode('tojson')">${T('tojson')}</button>
      </div>
      <div class="panel-label">${T('input')}</div>
      <textarea class="tool-textarea" id="xmlInput" rows="10" spellcheck="false" style="font-family:monospace" placeholder="<root><item id=&quot;1&quot;>value</item></root>" oninput="_xmlRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doXml()">${T('run')}</button>
        <button class="btn btn-secondary" onclick="xmlLoadDemo()">${T('demo')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('xmlInput').value='';document.getElementById('xmlResult').style.display='none'">${T('clear')}</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">${T('note')}</div>
    </div>
    <div class="tool-card-panel" id="xmlResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="xmlStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('xmlOutput').textContent,this)">${T('copy')}</button>
      </div>
      <pre class="result-box" id="xmlOutput" style="white-space:pre-wrap;word-break:break-all;max-height:400px;overflow-y:auto"></pre>
    </div>`;
  window._xmlMode = 'format';
  ToolCompute.load('formats').catch(() => {});
}

let _xmlTimer = null;
function _xmlRealtime() {
  clearTimeout(_xmlTimer);
  const v = document.getElementById('xmlInput').value.trim();
  if (!v) { document.getElementById('xmlResult').style.display = 'none'; return; }
  _xmlTimer = setTimeout(doXml, 500);
}

function setXmlMode(m) {
  window._xmlMode = m;
  document.getElementById('xmlFmtBtn').className = m === 'format' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('xmlMinBtn').className = m === 'minify' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('xmlJsonBtn').className = m === 'tojson' ? 'btn btn-primary' : 'btn btn-secondary';
  if (document.getElementById('xmlInput').value.trim()) doXml();
}

async function doXml() {
  const T = makeToolI18n(_xmlDict);
  const v = document.getElementById('xmlInput').value.trim();
  if (!v) return;
  const status = document.getElementById('xmlStatus'), output = document.getElementById('xmlOutput');
  try {
    const formats = await ToolCompute.load('formats');
    if (window._xmlMode === 'minify') { output.textContent = formats.xmlMinify(v); status.textContent = T('ok_minify'); }
    else if (window._xmlMode === 'tojson') { output.textContent = JSON.stringify(formats.xmlToObject(v), null, 2); status.textContent = T('ok_json'); }
    else { output.textContent = formats.xmlFormat(v); status.textContent = T('ok_format'); }
    status.style.color = '#10b981';
  } catch (e) {
    output.textContent = T('at', e.line, e.column) + e.message;
    status.textContent = T('error');
    status.style.color = '#ef4444';
  }
  document.getElementById('xmlResult').style.display = '';
}

function xmlLoadDemo() {
  document.getElementById('xmlInput').value = makeToolI18n(_xmlDict)('sample');
  doXml();
}
