function renderNumberFormat(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:12px">输入数字</div>
      <input type="text" class="tool-input" id="nfInput" placeholder="输入数字，如 1234567.89" oninput="nfUpdate()">
    </div>
    <div class="tool-card-panel" id="nfResult" style="display:none">
      <div class="panel-label" style="margin-bottom:14px">格式化结果</div>
      <div id="nfRows" style="display:flex;flex-direction:column;gap:10px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:12px">字节单位换算</div>
      <input type="text" class="tool-input" id="nfBytes" placeholder="输入字节数，如 1073741824" oninput="nfBytesUpdate()">
      <div id="nfBytesResult" style="margin-top:12px;display:none">
        <div id="nfBytesRows" style="display:flex;flex-direction:column;gap:8px"></div>
      </div>
    </div>`;
}

function nfRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px">
    <span style="color:var(--text-muted);font-size:13px">${label}</span>
    <div style="display:flex;align-items:center;gap:10px">
      <code style="font-family:monospace;font-size:14px;color:var(--text)">${value}</code>
      <button class="btn btn-secondary" style="padding:4px 10px;font-size:12px" onclick="navigator.clipboard.writeText('${value.replace(/,/g,'')}').then(()=>{this.textContent='✓';setTimeout(()=>this.textContent='复制',1200)})">复制</button>
    </div>
  </div>`;
}

function nfUpdate() {
  const raw = document.getElementById('nfInput').value.trim().replace(/,/g,'');
  const result = document.getElementById('nfResult');
  const rows = document.getElementById('nfRows');
  if (!raw || isNaN(+raw)) { result.style.display='none'; return; }
  const n = +raw;
  const fmt = (v, locale, opts) => new Intl.NumberFormat(locale, opts).format(v);
  rows.innerHTML = [
    nfRow('千分位（中文）', fmt(n,'zh-CN')),
    nfRow('千分位（英文）', fmt(n,'en-US')),
    nfRow('人民币', fmt(n,'zh-CN',{style:'currency',currency:'CNY'})),
    nfRow('美元', fmt(n,'en-US',{style:'currency',currency:'USD'})),
    nfRow('欧元', fmt(n,'de-DE',{style:'currency',currency:'EUR'})),
    nfRow('科学计数法', n.toExponential()),
    nfRow('百分比', fmt(n/100,'zh-CN',{style:'percent',minimumFractionDigits:2})),
    nfRow('整数部分', fmt(Math.trunc(n),'zh-CN')),
  ].join('');
  result.style.display = '';
}

function nfBytesUpdate() {
  const raw = document.getElementById('nfBytes').value.trim();
  const result = document.getElementById('nfBytesResult');
  const rows = document.getElementById('nfBytesRows');
  if (!raw || isNaN(+raw)) { result.style.display='none'; return; }
  const b = +raw;
  const units = [['B',1],['KB',1024],['MB',1024**2],['GB',1024**3],['TB',1024**4]];
  rows.innerHTML = units.map(([u,d])=>nfRow(u, (b/d).toFixed(u==='B'?0:4).replace(/\.?0+$/,'') + ' ' + u)).join('');
  result.style.display = '';
}
