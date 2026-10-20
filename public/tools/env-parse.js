/* ── .env 解析：dotenv 兼容规则见 compute/env.js（页面与 Agent 共用） ── */

const _epDict = {
  zh: {
    input: '粘贴 .env 内容',
    placeholder: '# 注释行会被忽略\nAPP_NAME=MyApp\nexport PORT=3000\nDB_URL="postgres://localhost/db" # 行尾注释\nPRIVATE_KEY="-----BEGIN-----\n...\n-----END-----"',
    parse: '解析', clear: '清空',
    found: n => `✓ 解析到 ${n} 个变量`,
    none: '未找到有效键值对',
    hint: '点击值可复制',
    duplicates: list => `重复的键（以最后一次为准）：${list}`,
    invalid: list => `无法解析的行：${list}`,
    export_as: '导出为',
    formats: { json: 'JSON', shell: 'Shell export', docker: 'docker run -e', compose: 'docker-compose' },
    copy: '复制',
  },
  en: {
    input: 'Paste .env content',
    placeholder: '# comments are ignored\nAPP_NAME=MyApp\nexport PORT=3000\nDB_URL="postgres://localhost/db" # trailing comment\nPRIVATE_KEY="-----BEGIN-----\n...\n-----END-----"',
    parse: 'Parse', clear: 'Clear',
    found: n => `✓ Parsed ${n} variable(s)`,
    none: 'No valid KEY=VALUE pairs found',
    hint: 'Click a value to copy',
    duplicates: list => `Duplicate keys (last one wins): ${list}`,
    invalid: list => `Unparsed lines: ${list}`,
    export_as: 'Export as',
    formats: { json: 'JSON', shell: 'Shell export', docker: 'docker run -e', compose: 'docker-compose' },
    copy: 'Copy',
  },
};

window.renderEnvParse = function(el) {
  const T = makeToolI18n(_epDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('input')}</div>
      <textarea class="tool-textarea" id="epInput" rows="10" spellcheck="false" style="font-family:monospace" placeholder="${escHtml(T('placeholder'))}" oninput="epParse()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="epParse()">${T('parse')}</button>
        <button class="btn btn-secondary" onclick="epClear()">${T('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="epResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:10px;flex-wrap:wrap">
        <div class="panel-label" style="margin:0" id="epStatus"></div>
        <span style="font-size:12px;color:var(--text-muted)">${T('hint')}</span>
      </div>
      <div id="epWarnings" style="font-size:12px;color:#f59e0b;margin-bottom:8px"></div>
      <div id="epTable"></div>
      <div id="epExport" style="display:none;margin-top:14px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
          <span style="font-size:12px;color:var(--text-muted)">${T('export_as')}</span>
          ${Object.entries(T('formats')).map(([k, label], i) => `<button class="copy-inline${i ? '' : ' active'}" data-format="${k}" onclick="epExport('${k}')">${label}</button>`).join('')}
          <button class="btn btn-secondary" style="margin-left:auto;padding:4px 12px;font-size:12px" onclick="copyText(document.getElementById('epExportOut').textContent,this)">${T('copy')}</button>
        </div>
        <pre class="result-box" id="epExportOut" style="max-height:260px;overflow:auto"></pre>
      </div>
    </div>`;
  ToolCompute.load('env').catch(() => {});
};

let _epLast = null, _epFormat = 'json';

async function epParse() {
  const T = makeToolI18n(_epDict);
  const input = document.getElementById('epInput').value;
  const result = document.getElementById('epResult'), status = document.getElementById('epStatus');
  if (!input.trim()) { result.style.display = 'none'; return; }
  const env = await ToolCompute.load('env');
  const parsed = env.parse(input);
  _epLast = parsed;
  const warnings = [];
  if (parsed.duplicates.length) warnings.push(T('duplicates', parsed.duplicates.join(', ')));
  if (parsed.invalid.length) warnings.push(T('invalid', parsed.invalid.map(x => x.line).join(', ')));
  document.getElementById('epWarnings').textContent = warnings.join('；');
  const table = document.getElementById('epTable');
  if (!parsed.entries.length) {
    status.textContent = T('none'); status.style.color = '#e74c3c';
    table.replaceChildren();
    document.getElementById('epExport').style.display = 'none';
    result.style.display = '';
    return;
  }
  status.textContent = T('found', parsed.entries.length); status.style.color = '#10b981';
  table.innerHTML = parsed.entries.map((e, i) => `
    <div class="result-row" style="margin-bottom:6px;align-items:flex-start">
      <span style="font-family:monospace;color:var(--accent);font-weight:600;min-width:140px;word-break:break-all">${escHtml(e.key)}</span>
      <span class="ep-val" data-index="${i}" title="${T('hint')}" style="font-family:monospace;flex:1;white-space:pre-wrap;word-break:break-all;cursor:pointer;color:var(--text)">${escHtml(e.value) || '<span style="color:var(--text-muted)">""</span>'}</span>
    </div>`).join('');
  table.querySelectorAll('.ep-val').forEach(el => { el.onclick = () => copyText(parsed.entries[+el.dataset.index].value, el); });
  document.getElementById('epExport').style.display = '';
  epExport(_epFormat);
  result.style.display = '';
}

async function epExport(kind) {
  if (!_epLast) return;
  _epFormat = kind;
  const env = await ToolCompute.load('env');
  document.querySelectorAll('#epExport [data-format]').forEach(b => b.classList.toggle('active', b.dataset.format === kind));
  document.getElementById('epExportOut').textContent = env.format(_epLast.variables, kind);
}

function epClear() {
  document.getElementById('epInput').value = '';
  document.getElementById('epResult').style.display = 'none';
  _epLast = null;
}
