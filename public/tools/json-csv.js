/* ── JSON / CSV 互转：解析与生成见 compute/csv.js（RFC 4180） ── */

const _jcDict = {
  zh: {
    json_label: '输入 JSON（对象数组）',
    csv_label: '输入 CSV',
    convert: '转换',
    clear: '清空',
    demo: '示例数据',
    copy: '复制结果',
    download: '下载文件',
    delimiter: '分隔符',
    delimiters: { auto: '自动识别', ',': '逗号 ,', ';': '分号 ;', '\t': 'Tab', '|': '竖线 |' },
    header: '首行为表头',
    infer: '识别数字/布尔/null',
    flatten: '嵌套对象展开为 a.b 列',
    ok_csv: (rows, cols) => `✓ 转换成功，共 ${rows} 行，${cols} 列`,
    ok_json: (rows, d) => `✓ 转换成功，共 ${rows} 行（分隔符：${d}）`,
    err: m => `✗ 错误：${m}`,
    need_array: '需要 JSON 数组或对象',
    need_rows: 'CSV 至少需要一行数据',
    switched: '已根据内容自动切换方向',
    bom_note: '下载的 CSV 带 UTF-8 BOM，Excel 可直接打开中文',
  },
  en: {
    json_label: 'JSON input (array of objects)',
    csv_label: 'CSV input',
    convert: 'Convert',
    clear: 'Clear',
    demo: 'Sample',
    copy: 'Copy result',
    download: 'Download',
    delimiter: 'Delimiter',
    delimiters: { auto: 'Auto-detect', ',': 'Comma ,', ';': 'Semicolon ;', '\t': 'Tab', '|': 'Pipe |' },
    header: 'First row is header',
    infer: 'Detect numbers/booleans/null',
    flatten: 'Flatten nested objects into a.b columns',
    ok_csv: (rows, cols) => `✓ Converted ${rows} row(s), ${cols} column(s)`,
    ok_json: (rows, d) => `✓ Converted ${rows} row(s) (delimiter: ${d})`,
    err: m => `✗ Error: ${m}`,
    need_array: 'Expected a JSON array or object',
    need_rows: 'CSV needs at least one data row',
    switched: 'Direction switched to match the input',
    bom_note: 'Downloaded CSV includes a UTF-8 BOM so Excel shows non-ASCII text correctly',
  },
};

function renderJsonCsv(el) {
  const T = makeToolI18n(_jcDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:12px;margin-bottom:14px">
        <button class="btn btn-primary" id="modeJsonToCsv" onclick="setJsonCsvMode('json2csv')">JSON → CSV</button>
        <button class="btn btn-secondary" id="modeCsvToJson" onclick="setJsonCsvMode('csv2json')">CSV → JSON</button>
      </div>
      <div class="panel-label" id="jcInputLabel">${T('json_label')}</div>
      <textarea class="tool-textarea" id="jcInput" rows="10" spellcheck="false" placeholder='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'></textarea>
      <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:10px;font-size:12px;color:var(--text-muted)">
        <label style="display:flex;align-items:center;gap:6px">${T('delimiter')}
          <select class="tool-input" id="jcDelimiter" style="width:auto;font-size:12px">${Object.entries(T('delimiters')).map(([v, l]) => `<option value="${escHtml(v)}">${l}</option>`).join('')}</select>
        </label>
        <label class="jc-csv-opt" style="display:none;align-items:center;gap:6px"><input type="checkbox" id="jcHeader" checked>${T('header')}</label>
        <label class="jc-csv-opt" style="display:none;align-items:center;gap:6px"><input type="checkbox" id="jcInfer">${T('infer')}</label>
        <label class="jc-json-opt" style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="jcFlatten" checked>${T('flatten')}</label>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="convertJsonCsv()">${T('convert')}</button>
        <button class="btn btn-secondary" onclick="clearJC()">${T('clear')}</button>
        <button class="btn btn-secondary" onclick="loadJCDemo()">${T('demo')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="jcResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="jcStatus"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="copyText(document.getElementById('jcOutput').value,this)">${T('copy')}</button>
          <button class="btn btn-secondary" onclick="downloadJC()" title="${T('bom_note')}">${T('download')}</button>
        </div>
      </div>
      <textarea class="tool-textarea" id="jcOutput" rows="10" readonly style="font-family:monospace;font-size:12.5px"></textarea>
    </div>`;
  window._jcMode = 'json2csv';
  ToolCompute.load('csv').catch(() => {});
}

function setJsonCsvMode(mode, keepInput = false) {
  const T = makeToolI18n(_jcDict);
  window._jcMode = mode;
  const toCsv = mode === 'json2csv';
  document.getElementById('modeJsonToCsv').className = toCsv ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('modeCsvToJson').className = toCsv ? 'btn btn-secondary' : 'btn btn-primary';
  document.getElementById('jcInputLabel').textContent = toCsv ? T('json_label') : T('csv_label');
  document.getElementById('jcInput').placeholder = toCsv ? '[{"name":"Alice","age":30}]' : 'name,age\nAlice,30\nBob,25';
  document.querySelectorAll('.jc-csv-opt').forEach(e => { e.style.display = toCsv ? 'none' : 'flex'; });
  document.querySelectorAll('.jc-json-opt').forEach(e => { e.style.display = toCsv ? 'flex' : 'none'; });
  if (!keepInput) {
    document.getElementById('jcInput').value = '';
    document.getElementById('jcResultPanel').style.display = 'none';
  }
}

async function convertJsonCsv() {
  const T = makeToolI18n(_jcDict);
  const input = document.getElementById('jcInput').value.trim();
  const status = document.getElementById('jcStatus'), output = document.getElementById('jcOutput'), panel = document.getElementById('jcResultPanel');
  if (!input) return;
  // Follow the content when it clearly belongs to the other direction (also used by the Agent runner).
  const looksJson = /^[[{]/.test(input);
  let switched = false;
  if ((window._jcMode === 'json2csv') !== looksJson) { setJsonCsvMode(looksJson ? 'json2csv' : 'csv2json', true); switched = true; }
  try {
    const csv = await ToolCompute.load('csv');
    const chosen = document.getElementById('jcDelimiter').value;
    let result, message;
    if (window._jcMode === 'json2csv') {
      const data = JSON.parse(input);
      if (data === null || typeof data !== 'object') throw new Error(T('need_array'));
      const records = Array.isArray(data) ? data : [data];
      if (!records.length) throw new Error(T('need_array'));
      const delimiter = chosen === 'auto' ? ',' : chosen;
      result = csv.stringify(records, { delimiter, flat: document.getElementById('jcFlatten').checked });
      message = T('ok_csv', records.length, csv.parse(result, { delimiter }).rows[0]?.length || 0);
      window._jcExt = 'csv';
    } else {
      const parsed = csv.parse(input, { delimiter: chosen });
      const header = document.getElementById('jcHeader').checked;
      const rows = csv.toObjects(parsed.rows, { header, infer: document.getElementById('jcInfer').checked });
      if (!rows.length) throw new Error(T('need_rows'));
      result = JSON.stringify(rows, null, 2);
      message = T('ok_json', rows.length, T('delimiters')[parsed.delimiter] || parsed.delimiter);
      window._jcExt = 'json';
    }
    output.value = result;
    status.innerHTML = `<span style="color:#10b981">${escHtml(message)}</span>` + (switched ? ` <span style="font-size:11px;color:var(--text-muted)">${T('switched')}</span>` : '');
    window._jcLastResult = result;
  } catch (e) {
    status.innerHTML = `<span style="color:#e74c3c">${escHtml(T('err', e.message))}</span>`;
    output.value = '';
    window._jcLastResult = '';
  }
  panel.style.display = '';
}

function downloadJC() {
  const content = window._jcLastResult;
  if (!content) return;
  const ext = window._jcExt || 'txt';
  const blob = new Blob([ext === 'csv' ? '﻿' + content : content], { type: ext === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'converted.' + ext;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function clearJC() {
  document.getElementById('jcInput').value = '';
  document.getElementById('jcResultPanel').style.display = 'none';
}

function loadJCDemo() {
  if (window._jcMode === 'json2csv') {
    document.getElementById('jcInput').value = JSON.stringify([
      { name: 'Alice', age: 30, city: 'Beijing', role: 'Engineer', tags: ['go', 'k8s'], profile: { level: 'P7', remote: false } },
      { name: 'Bob', age: 25, city: 'Shanghai', role: 'Designer, UI', tags: [], profile: { level: 'P5', remote: true } },
      { name: 'Charlie', age: 35, city: 'Guangzhou', role: 'Manager "PMO"', note: 'line1\nline2' },
    ], null, 2);
  } else {
    document.getElementById('jcInput').value = 'name,age,city,role\nAlice,30,Beijing,Engineer\n"Bob, Jr.",25,Shanghai,"Designer ""UI"""\nCharlie,35,Guangzhou,"Manager\nTeam lead"';
  }
}
