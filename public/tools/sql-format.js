const _sqlDict = {
  zh: {
    loading: '处理中…', failure: msg => '处理失败：' + msg, input: '输入 SQL', generic: '通用 SQL', sample: '示例', input_ph: '粘贴 SQL 语句...', format: '格式化', compress: '压缩', clear: '清空',
    copy_result: '复制结果', download: '下载', formatted: '格式化完成', compressed: '已压缩', downloaded: 'SQL 文件已下载',
    upper: '关键词大写', lower: '关键词小写', keep: '保留大小写', indent: n => `${n} 空格缩进`,
    hint: '仅调整排版，保留字符串与注释；不执行 SQL 或校验数据库语法。',
    invalid: '字符串、引用标识符或注释未闭合，请检查输入。', large: '长 SQL 已暂停自动格式化，请点击格式化。',
  },
  en: {
    loading: 'Processing…', failure: msg => 'Could not process: ' + msg, input: 'SQL input', generic: 'Generic SQL', sample: 'Sample', input_ph: 'Paste a SQL statement...', format: 'Format', compress: 'Minify', clear: 'Clear',
    copy_result: 'Copy result', download: 'Download', formatted: 'Formatted', compressed: 'Minified', downloaded: 'SQL file downloaded',
    upper: 'Uppercase keywords', lower: 'Lowercase keywords', keep: 'Keep keyword case', indent: n => `${n}-space indent`,
    hint: 'Formats text while preserving strings and comments. Does not run SQL or validate database syntax.',
    invalid: 'Unclosed string, quoted identifier or comment. Check the input.', large: 'Auto format paused for this large SQL. Select Format.',
  },
};

function renderSQLFormat(el) {
  const T = makeToolI18n(_sqlDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('input')}</div>
        <div style="display:flex;gap:6px">
          <select id="sqlDialect" aria-label="SQL dialect" class="tool-input" style="width:auto;font-size:12px" onchange="_sqlRealtime()">
            <option value="sql">${T('generic')}</option>
            <option value="mysql">MySQL</option>
            <option value="pgsql">PostgreSQL</option>
          </select>
          <button class="btn btn-secondary" onclick="sqlLoadSample()">${T('sample')}</button>
        </div>
      </div>
      <div class="tool-actions">
        <select id="sqlCase" class="tool-select" aria-label="${T('keep')}" onchange="_sqlRealtime()"><option value="upper">${T('upper')}</option><option value="lower">${T('lower')}</option><option value="keep">${T('keep')}</option></select>
        <select id="sqlIndent" class="tool-select" aria-label="${T('indent',2)}" onchange="_sqlRealtime()"><option value="2">${T('indent',2)}</option><option value="4">${T('indent',4)}</option></select>
      </div>
      <textarea class="tool-textarea" id="sqlInput" rows="10" placeholder="${T('input_ph')}" oninput="_sqlRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" data-tool-submit onclick="formatSQL()">${T('format')}</button>
        <button class="btn btn-secondary" onclick="compressSQL()">${T('compress')}</button>
        <button class="btn btn-secondary" onclick="clearSQL()">${T('clear')}</button>
      </div>
      <p class="workspace-notice" id="sqlHint" role="status">${T('hint')}</p>
    </div>
    <div class="tool-card-panel" id="sqlResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="sqlStatus"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="sqlCopy(this)">${T('copy_result')}</button>
          <button class="btn btn-secondary" onclick="sqlDownload()">${T('download')}</button>
        </div>
      </div>
      <pre class="result-box" id="sqlOutput" style="max-height:400px;overflow-y:auto;color:var(--text)"></pre>
    </div>`;
  window._activeCleanup = () => { clearTimeout(_sqlTimer); _sqlRevision++; document.getElementById('sqlHint').textContent=T('hint'); };
}

function sqlTokens(...args) { return window.KCompute.sql.tokens(...args); }
function sqlMinify(...args) { return window.KCompute.sql.minify(...args); }
function sqlPretty(...args) { return window.KCompute.sql.pretty(...args); }

function formatSQL() {
  return _sqlRun(false);
}

function compressSQL() { return _sqlRun(true); }
let _sqlRevision = 0;
async function _sqlRun(minify) {
  const revision = ++_sqlRevision;
  clearTimeout(_sqlTimer);
  const input=document.getElementById('sqlInput'); if(!input) return;
  const raw=input.value.trim();
  if (!raw) return;
  const T=makeToolI18n(_sqlDict), dialect=document.getElementById('sqlDialect').value;
  document.getElementById('sqlHint').textContent=T('loading');
  try {
    await ToolCompute.load('sql');
    if (!input.isConnected || revision !== _sqlRevision || input.value.trim() !== raw) return {success:false,cancelled:true};
    const result=minify?sqlMinify(raw,dialect):sqlPretty(raw,{dialect,keywordCase:document.getElementById('sqlCase').value,indent:Number(document.getElementById('sqlIndent').value)});
    _sqlShow(result,T(minify?'compressed':'formatted'));
    document.getElementById('sqlHint').textContent=T('hint');
    return {success:true,data:{result}};
  } catch(error) {
    if (!input.isConnected || revision !== _sqlRevision) return {success:false,cancelled:true};
    document.getElementById('sqlResultPanel').style.display='none';
    const message=/Unclosed/.test(error.message) ? T('invalid') : T('failure',error.message);
    document.getElementById('sqlHint').textContent=message;
    return {success:false,error:message};
  }
}

function _sqlShow(text, label) {
  document.getElementById('sqlOutput').textContent = text;
  document.getElementById('sqlStatus').textContent = '✓ ' + label;
  document.getElementById('sqlStatus').style.color = 'var(--success)';
  document.getElementById('sqlResultPanel').style.display = '';
}

function sqlCopy(btn) { copyText(document.getElementById('sqlOutput').textContent, btn); }

function sqlDownload() {
  const text = document.getElementById('sqlOutput').textContent;
  if (!text) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text],{type:'text/sql'}));
  a.download = 'query.sql'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href),1000);
  showToast(makeToolI18n(_sqlDict)('downloaded'));
}

let _sqlTimer = null;
function _sqlRealtime() {
  _sqlRevision++;
  clearTimeout(_sqlTimer);
  document.getElementById('sqlResultPanel').style.display='none';
  document.getElementById('sqlHint').textContent=makeToolI18n(_sqlDict)('hint');
  const v = document.getElementById('sqlInput').value.trim();
  if (!v) { document.getElementById('sqlResultPanel').style.display='none'; return; }
  if(v.length>100000) { document.getElementById('sqlHint').textContent=makeToolI18n(_sqlDict)('large');return; }
  _sqlTimer = setTimeout(formatSQL, 500);
}

function clearSQL() {
  _sqlRevision++;
  clearTimeout(_sqlTimer);
  document.getElementById('sqlInput').value='';
  document.getElementById('sqlResultPanel').style.display='none';
  document.getElementById('sqlHint').textContent=makeToolI18n(_sqlDict)('hint');
}

function sqlLoadSample() {
  document.getElementById('sqlInput').value = `select u.id,u.name,u.email,count(o.id) as order_count,sum(o.amount) as total from users u left join orders o on u.id=o.user_id where u.created_at>='2024-01-01' and u.status='active' group by u.id,u.name,u.email having count(o.id)>0 order by total desc limit 20`;
}
