function renderHTMLEntity(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">输入文本</div>
      <textarea class="tool-textarea" id="heInput" rows="6" placeholder="输入需要编码/解码的文本..."></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="heEncode()">HTML 编码</button>
        <button class="btn btn-secondary" onclick="heDecode()">HTML 解码</button>
        <button class="btn btn-secondary" onclick="heEncodeAll()">完整编码</button>
        <button class="btn btn-secondary" onclick="heClear()">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="heResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="panel-label" style="margin:0" id="heStatus"></div>
          <span id="heCount" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('heOutput').textContent,this)">复制结果</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">输出结果</div>
      <pre class="result-box" id="heOutput" style="white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:12px">常用实体参考</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px" id="heRefGrid"></div>
    </div>`;

  const refs = [
    ['&amp;',   '&',  '与号'],
    ['&lt;',    '<',  '小于'],
    ['&gt;',    '>',  '大于'],
    ['&quot;',  '"', '双引号'],
    ['&apos;',  "'", '单引号'],
    ['&nbsp;',  null, '不换行空格'],
    ['&copy;',  '©',  '版权'],
    ['&reg;',   '®',  '注册商标'],
    ['&trade;', '™',  '商标'],
    ['&mdash;', '—',  '长破折号'],
    ['&ndash;', '–',  '短破折号'],
    ['&hellip;','…',  '省略号'],
    ['&laquo;', '«',  '左书名号'],
    ['&raquo;', '»',  '右书名号'],
    ['&times;', '×',  '乘号'],
    ['&divide;','÷',  '除号'],
  ];
  const grid = document.getElementById('heRefGrid');
  refs.forEach(([entity, char, label]) => {
    const div = document.createElement('div');
    div.title = '点击插入 ' + entity;
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
  const v = document.getElementById('heInput').value;
  if (!v) return;
  const out = v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  _heShowResult(out, 'HTML 编码');
}

function heEncodeAll() {
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
  _heShowResult(out, '完整编码');
}

function heDecode() {
  const v = document.getElementById('heInput').value;
  if (!v) return;
  const doc = new DOMParser().parseFromString(v, 'text/html');
  const out = doc.documentElement.textContent;
  _heShowResult(out, 'HTML 解码');
}

function _heShowResult(out, label) {
  const inputLen = document.getElementById('heInput').value.length;
  document.getElementById('heOutput').textContent = out;
  document.getElementById('heStatus').textContent = '✓ ' + label + '完成';
  document.getElementById('heStatus').style.color = '#10b981';
  document.getElementById('heCount').textContent = `输入 ${inputLen} 字符 → 输出 ${out.length} 字符`;
  document.getElementById('heResult').style.display = '';
}

function heClear() {
  document.getElementById('heInput').value = '';
  document.getElementById('heResult').style.display = 'none';
}
