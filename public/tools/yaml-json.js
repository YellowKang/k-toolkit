/* ── YAML ↔ JSON：js-yaml（YAML 1.2 core schema + 合并键），见 compute/formats.js ── */

const _yjDict = {
  zh: {
    input: '输入内容',
    placeholder: '粘贴 YAML 或 JSON，自动识别方向...',
    to_json: 'YAML → JSON',
    to_yaml: 'JSON → YAML',
    swap: '↕ 互换',
    clear: '清空',
    copy: '复制',
    ok_json: n => n > 1 ? `✓ 转换成功（${n} 个文档，已合并为数组）` : '✓ 转换成功',
    ok_yaml: '✓ 转换成功',
    yaml_err: '✗ YAML 解析失败',
    json_err: '✗ JSON 格式错误',
    at: (line, col) => line ? `第 ${line} 行${col ? `第 ${col} 列` : ''}：` : '',
    note: '支持锚点/别名与 << 合并键、多文档（---）；日期保持字符串；超过 2^53 的整数会损失精度',
  },
  en: {
    input: 'Input',
    placeholder: 'Paste YAML or JSON; direction is detected automatically...',
    to_json: 'YAML → JSON',
    to_yaml: 'JSON → YAML',
    swap: '↕ Swap',
    clear: 'Clear',
    copy: 'Copy',
    ok_json: n => n > 1 ? `✓ Converted (${n} documents merged into an array)` : '✓ Converted',
    ok_yaml: '✓ Converted',
    yaml_err: '✗ Invalid YAML',
    json_err: '✗ Invalid JSON',
    at: (line, col) => line ? `Line ${line}${col ? `, column ${col}` : ''}: ` : '',
    note: 'Supports anchors/aliases, << merge keys and multiple documents (---); dates stay strings; integers beyond 2^53 lose precision',
  },
};

function renderYAMLJSON(el) {
  window._activeCleanup = () => clearTimeout(_yjTimer);
  const T = makeToolI18n(_yjDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('input')}</div>
      <textarea class="tool-textarea" id="yjInput" rows="10" spellcheck="false" placeholder="${T('placeholder')}" oninput="_yjAutoDetect()" style="font-family:monospace"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" data-tool-submit onclick="yjToJSON()">${T('to_json')}</button>
        <button class="btn btn-primary" onclick="yjToYAML()">${T('to_yaml')}</button>
        <button class="btn btn-secondary" onclick="yjSwap()">${T('swap')}</button>
        <button class="btn btn-secondary" onclick="yjClear()">${T('clear')}</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">${T('note')}</div>
    </div>
    <div class="tool-card-panel" id="yjResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="yjStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('yjOutput').textContent,this)">${T('copy')}</button>
      </div>
      <pre class="result-box" id="yjOutput" style="max-height:400px;overflow-y:auto"></pre>
    </div>`;
  ToolCompute.load('formats').catch(() => {});
}

function _yjShow(ok, label, text) {
  const status = document.getElementById('yjStatus');
  status.textContent = label;
  status.style.color = ok ? '#10b981' : '#e74c3c';
  document.getElementById('yjOutput').textContent = text;
  document.getElementById('yjResult').style.display = '';
}

async function yjToJSON() {
  const T = makeToolI18n(_yjDict);
  const v = document.getElementById('yjInput').value;
  if (!v.trim()) return;
  try {
    const formats = await ToolCompute.load('formats');
    const { value, documents } = await formats.yamlParse(v);
    _yjShow(true, T('ok_json', documents), JSON.stringify(value, null, 2) ?? 'null');
  } catch (e) {
    _yjShow(false, T('yaml_err'), T('at', e.line, e.column) + e.message);
  }
}

async function yjToYAML() {
  const T = makeToolI18n(_yjDict);
  const v = document.getElementById('yjInput').value.trim();
  if (!v) return;
  let obj;
  try { obj = JSON.parse(v); }
  catch (e) { _yjShow(false, T('json_err'), e.message); return; }
  try {
    const formats = await ToolCompute.load('formats');
    _yjShow(true, T('ok_yaml'), await formats.yamlStringify(obj));
  } catch (e) {
    _yjShow(false, T('json_err'), e.message);
  }
}

let _yjTimer = null;
function _yjAutoDetect() {
  clearTimeout(_yjTimer);
  const v = document.getElementById('yjInput').value.trim();
  if (!v) { document.getElementById('yjResult').style.display = 'none'; return; }
  _yjTimer = setTimeout(() => {
    if (/^[[{]/.test(v)) yjToYAML();
    else yjToJSON();
  }, 400);
}

function yjSwap() {
  const out = document.getElementById('yjOutput').textContent;
  if (!out) return;
  document.getElementById('yjInput').value = out;
  document.getElementById('yjResult').style.display = 'none';
  _yjAutoDetect();
}

function yjClear() {
  document.getElementById('yjInput').value = '';
  document.getElementById('yjResult').style.display = 'none';
}
