window.renderCssUnit = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">输入参数</div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end">
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">数值</div>
          <input id="cuValue" type="number" value="16" step="any" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;width:110px" oninput="cuConvert()" />
        </div>
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">源单位</div>
          <select id="cuUnit" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;background:#fff" onchange="cuConvert()">
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="em">em</option>
            <option value="vw">vw</option>
            <option value="vh">vh</option>
            <option value="pt">pt</option>
          </select>
        </div>
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Base font (px)</div>
          <input id="cuBase" type="number" value="16" step="any" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;width:100px" oninput="cuConvert()" />
        </div>
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Viewport W (px)</div>
          <input id="cuVW" type="number" value="1440" step="any" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;width:110px" oninput="cuConvert()" />
        </div>
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Viewport H (px)</div>
          <input id="cuVH" type="number" value="900" step="any" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;width:110px" oninput="cuConvert()" />
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="cuResult" style="display:none">
      <div class="panel-label">换算结果</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px" id="cuTable"></table>
    </div>`;
  cuConvert();
};

function cuConvert() {
  var val = parseFloat(document.getElementById('cuValue').value);
  var unit = document.getElementById('cuUnit').value;
  var base = parseFloat(document.getElementById('cuBase').value) || 16;
  var vw = parseFloat(document.getElementById('cuVW').value) || 1440;
  var vh = parseFloat(document.getElementById('cuVH').value) || 900;
  if (isNaN(val)) { document.getElementById('cuResult').style.display='none'; return; }
  // convert to px first
  var px;
  if (unit === 'px')  px = val;
  else if (unit === 'rem') px = val * base;
  else if (unit === 'em')  px = val * base;
  else if (unit === 'vw')  px = val / 100 * vw;
  else if (unit === 'vh')  px = val / 100 * vh;
  else if (unit === 'pt')  px = val * 96 / 72;
  var results = [
    { unit: 'px',  val: px },
    { unit: 'rem', val: px / base },
    { unit: 'em',  val: px / base },
    { unit: 'vw',  val: px / vw * 100 },
    { unit: 'vh',  val: px / vh * 100 },
    { unit: 'pt',  val: px * 72 / 96 }
  ];
  var html = '<thead><tr style="background:#f3f4f6"><th style="text-align:left;padding:8px 16px;border:1px solid #e5e7eb;color:#374151">单位</th><th style="text-align:left;padding:8px 16px;border:1px solid #e5e7eb;color:#374151">值</th><th style="text-align:left;padding:8px 16px;border:1px solid #e5e7eb;color:#374151">CSS 写法</th></tr></thead><tbody>';
  results.forEach(function(r, i) {
    var active = r.unit === unit;
    var bg = active ? 'rgba(99,102,241,0.06)' : (i % 2 === 0 ? '#fff' : '#f9fafb');
    var bold = active ? 'font-weight:700;color:#4f46e5' : '';
    var rounded = Math.round(r.val * 10000) / 10000;
    html += '<tr style="background:' + bg + '">';
    html += '<td style="padding:8px 16px;border:1px solid #e5e7eb;' + bold + '">' + r.unit + (active ? ' ◀' : '') + '</td>';
    html += '<td style="padding:8px 16px;border:1px solid #e5e7eb;font-family:monospace;' + bold + '">' + rounded + '</td>';
    html += '<td style="padding:8px 16px;border:1px solid #e5e7eb;font-family:monospace;color:#6366f1">' + rounded + r.unit + '</td>';
    html += '</tr>';
  });
  html += '</tbody>';
  document.getElementById('cuTable').innerHTML = html;
  document.getElementById('cuResult').style.display = '';
}
