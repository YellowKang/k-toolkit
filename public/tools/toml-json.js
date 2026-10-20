/* ── TOML ↔ JSON：smol-toml（TOML 1.0），见 compute/formats.js ── */

const _tjDict = {
  zh: {
    toml_in: 'TOML 输入', json_in: 'JSON 输入',
    to_json: '转换为 JSON', to_toml: '转换为 TOML', clear: '清空', copy: '复制',
    ok: '转换成功', toml_err: 'TOML 解析失败', json_err: 'JSON 格式错误', toml_out_err: '无法转换为 TOML',
    at: (line, col) => line ? `第 ${line} 行${col ? `第 ${col} 列` : ''}：` : '',
    dropped: list => `TOML 没有 null，已省略：${list}`,
    note: '支持内联表、多行数组与字符串、点分键、日期时间（保持原样）等完整 TOML 1.0 语法',
  },
  en: {
    toml_in: 'TOML input', json_in: 'JSON input',
    to_json: 'Convert to JSON', to_toml: 'Convert to TOML', clear: 'Clear', copy: 'Copy',
    ok: 'Converted', toml_err: 'Invalid TOML', json_err: 'Invalid JSON', toml_out_err: 'Cannot convert to TOML',
    at: (line, col) => line ? `Line ${line}${col ? `, column ${col}` : ''}: ` : '',
    dropped: list => `TOML has no null; omitted: ${list}`,
    note: 'Full TOML 1.0: inline tables, multi-line arrays and strings, dotted keys and date-times (kept as written)',
  },
};

window.renderTomlJson = function(el) {
  const T = makeToolI18n(_tjDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <button class="btn btn-primary" id="tjTab1" onclick="tjSwitchTab(1)">TOML → JSON</button>
        <button class="btn btn-secondary" id="tjTab2" onclick="tjSwitchTab(2)">JSON → TOML</button>
      </div>
      <div id="tjPane1">
        <div class="panel-label">${T('toml_in')}</div>
        <textarea class="tool-textarea" id="tjTomlIn" rows="10" spellcheck="false" style="font-family:monospace" placeholder="[package]\nname = &quot;demo&quot;\n\n[dependencies]\nserde = { version = &quot;1.0&quot;, features = [&quot;derive&quot;] }"></textarea>
        <div class="tool-actions">
          <button class="btn btn-primary" onclick="tjTomlToJson()">${T('to_json')}</button>
          <button class="btn btn-secondary" onclick="tjClear1()">${T('clear')}</button>
        </div>
      </div>
      <div id="tjPane2" style="display:none">
        <div class="panel-label">${T('json_in')}</div>
        <textarea class="tool-textarea" id="tjJsonIn" rows="10" spellcheck="false" style="font-family:monospace" placeholder='{"server":{"host":"localhost","port":8080}}'></textarea>
        <div class="tool-actions">
          <button class="btn btn-primary" onclick="tjJsonToToml()">${T('to_toml')}</button>
          <button class="btn btn-secondary" onclick="tjClear2()">${T('clear')}</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">${T('note')}</div>
    </div>
    <div class="tool-card-panel" id="tjResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="tjStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('tjOutput').textContent,this)">${T('copy')}</button>
      </div>
      <div id="tjNote" style="display:none;font-size:12px;color:#f59e0b;margin-bottom:8px"></div>
      <pre class="result-box" id="tjOutput" style="max-height:400px;overflow-y:auto"></pre>
    </div>`;
  ToolCompute.load('formats').catch(() => {});
};

function tjSwitchTab(n) {
  document.getElementById('tjPane1').style.display = n === 1 ? '' : 'none';
  document.getElementById('tjPane2').style.display = n === 2 ? '' : 'none';
  document.getElementById('tjTab1').className = n === 1 ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('tjTab2').className = n === 2 ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('tjResult').style.display = 'none';
}

function tjShowResult(text, ok, label, note = '') {
  document.getElementById('tjOutput').textContent = text;
  const status = document.getElementById('tjStatus');
  status.textContent = (ok ? '✓ ' : '✗ ') + label;
  status.style.color = ok ? '#10b981' : '#e74c3c';
  const noteEl = document.getElementById('tjNote');
  noteEl.textContent = note;
  noteEl.style.display = note ? '' : 'none';
  document.getElementById('tjResult').style.display = '';
}

async function tjTomlToJson() {
  const T = makeToolI18n(_tjDict);
  const src = document.getElementById('tjTomlIn').value;
  if (!src.trim()) return;
  try {
    const formats = await ToolCompute.load('formats');
    tjShowResult(JSON.stringify(await formats.tomlParse(src), null, 2), true, T('ok'));
  } catch (e) {
    tjShowResult(T('at', e.line, e.column) + e.message, false, T('toml_err'));
  }
}

async function tjJsonToToml() {
  const T = makeToolI18n(_tjDict);
  const src = document.getElementById('tjJsonIn').value.trim();
  if (!src) return;
  let obj;
  try { obj = JSON.parse(src); }
  catch (e) { tjShowResult(e.message, false, T('json_err')); return; }
  try {
    const formats = await ToolCompute.load('formats');
    const { text, dropped } = await formats.tomlStringify(obj);
    tjShowResult(text, true, T('ok'), dropped.length ? T('dropped', dropped.slice(0, 10).join(', ') + (dropped.length > 10 ? '…' : '')) : '');
  } catch (e) {
    tjShowResult(e.message, false, T('toml_out_err'));
  }
}

function tjClear1() {
  document.getElementById('tjTomlIn').value = '';
  document.getElementById('tjResult').style.display = 'none';
}
function tjClear2() {
  document.getElementById('tjJsonIn').value = '';
  document.getElementById('tjResult').style.display = 'none';
}
