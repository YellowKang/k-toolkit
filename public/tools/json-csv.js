function renderJsonCsv(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:12px;margin-bottom:14px">
        <button class="btn btn-primary" id="modeJsonToCsv" onclick="setJsonCsvMode('json2csv')">JSON → CSV</button>
        <button class="btn btn-secondary" id="modeCsvToJson" onclick="setJsonCsvMode('csv2json')">CSV → JSON</button>
      </div>
      <div class="panel-label" id="jcInputLabel">输入 JSON（数组格式）</div>
      <textarea class="tool-textarea" id="jcInput" rows="10" placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="convertJsonCsv()">转换</button>
        <button class="btn btn-secondary" onclick="clearJC()">清空</button>
        <button class="btn btn-secondary" onclick="loadJCDemo()">示例数据</button>
      </div>
    </div>
    <div class="tool-card-panel" id="jcResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="jcStatus"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('jcOutput').value,this)">复制结果</button>
          <button class="btn btn-secondary" onclick="downloadJC()">下载文件</button>
        </div>
      </div>
      <textarea class="tool-textarea" id="jcOutput" rows="10" readonly style="font-family:monospace;font-size:12.5px"></textarea>
    </div>`;
  window._jcMode = 'json2csv';
}

function setJsonCsvMode(mode) {
  window._jcMode = mode;
  document.getElementById('modeJsonToCsv').className = mode==='json2csv' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('modeCsvToJson').className = mode==='csv2json' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('jcInputLabel').textContent = mode==='json2csv' ? '输入 JSON（数组格式）' : '输入 CSV';
  document.getElementById('jcInput').placeholder = mode==='json2csv' ? '[{"name":"Alice","age":30}]' : 'name,age\nAlice,30\nBob,25';
  document.getElementById('jcInput').value='';
  document.getElementById('jcResultPanel').style.display='none';
}

function convertJsonCsv() {
  const input = document.getElementById('jcInput').value.trim();
  const status = document.getElementById('jcStatus');
  const output = document.getElementById('jcOutput');
  const panel = document.getElementById('jcResultPanel');
  if (!input) return;
  try {
    let result;
    if (window._jcMode === 'json2csv') {
      const data = JSON.parse(input);
      if (!Array.isArray(data) || !data.length) throw new Error('需要非空数组');
      const keys = [...new Set(data.flatMap(r => Object.keys(r)))];
      const csvRows = [keys.join(','), ...data.map(r => keys.map(k => {
        const v = r[k] ?? '';
        return String(v).includes(',') || String(v).includes('"') || String(v).includes('\n')
          ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
      }).join(','))];
      result = csvRows.join('\n');
      status.innerHTML = `<span style="color:#10b981">✓ 转换成功，共 ${data.length} 行，${keys.length} 列</span>`;
    } else {
      const lines = input.split('\n').filter(l=>l.trim());
      if (lines.length < 2) throw new Error('CSV 至少需要标题行和一行数据');
      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map(l => {
        const vals = parseCsvLine(l);
        return Object.fromEntries(headers.map((h,i) => [h, vals[i]??'']));
      });
      result = JSON.stringify(rows, null, 2);
      status.innerHTML = `<span style="color:#10b981">✓ 转换成功，共 ${rows.length} 行</span>`;
    }
    output.value = result;
    panel.style.display='';
    window._jcLastResult = result;
    window._jcMode === 'json2csv' ? (window._jcExt='csv') : (window._jcExt='json');
  } catch(e) {
    status.innerHTML = `<span style="color:#e74c3c">✗ 错误：${e.message}</span>`;
    output.value='';
    panel.style.display='';
  }
}

function parseCsvLine(line) {
  const result = []; let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQ && line[i+1]==='"') { cur += '"'; i++; } else inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

function downloadJC() {
  const content = window._jcLastResult;
  const ext = window._jcExt || 'txt';
  if (!content) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  a.download = 'converted.' + ext;
  a.click();
}

function clearJC() {
  document.getElementById('jcInput').value='';
  document.getElementById('jcResultPanel').style.display='none';
}

function loadJCDemo() {
  if (window._jcMode === 'json2csv') {
    document.getElementById('jcInput').value = JSON.stringify([
      {name:'Alice',age:30,city:'Beijing',role:'Engineer'},
      {name:'Bob',age:25,city:'Shanghai',role:'Designer'},
      {name:'Charlie',age:35,city:'Guangzhou',role:'Manager'}
    ], null, 2);
  } else {
    document.getElementById('jcInput').value = 'name,age,city,role\nAlice,30,Beijing,Engineer\nBob,25,Shanghai,Designer\nCharlie,35,Guangzhou,Manager';
  }
}
