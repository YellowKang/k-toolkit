function renderSQLFormat(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">输入 SQL</div>
        <div style="display:flex;gap:6px">
          <select id="sqlDialect" class="tool-input" style="width:auto;font-size:12px">
            <option value="sql">通用 SQL</option>
            <option value="mysql">MySQL</option>
            <option value="pgsql">PostgreSQL</option>
          </select>
          <button class="btn btn-secondary" onclick="sqlLoadSample()">示例</button>
        </div>
      </div>
      <textarea class="tool-textarea" id="sqlInput" rows="10" placeholder="粘贴 SQL 语句..." oninput="_sqlRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="formatSQL()">格式化</button>
        <button class="btn btn-secondary" onclick="compressSQL()">压缩</button>
        <button class="btn btn-secondary" onclick="clearSQL()">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="sqlResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="sqlStatus"></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="sqlCopy(this)">复制结果</button>
          <button class="btn btn-secondary" onclick="sqlDownload()">下载</button>
        </div>
      </div>
      <pre class="result-box" id="sqlOutput" style="max-height:400px;overflow-y:auto;color:#93c5fd"></pre>
    </div>`;
}

const SQL_KW = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','ON','AND','OR','NOT','IN','EXISTS','BETWEEN','LIKE','IS NULL','IS NOT NULL','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','DISTINCT','AS','UNION','UNION ALL','WITH','CASE','WHEN','THEN','ELSE','END','COUNT','SUM','AVG','MAX','MIN','COALESCE','NULLIF'];

function formatSQL() {
  const raw = document.getElementById('sqlInput').value.trim();
  if (!raw) return;
  let sql = raw;
  // uppercase keywords
  SQL_KW.forEach(kw => {
    const re = new RegExp('\\b' + kw.replace(/ /g,'\\s+') + '\\b', 'gi');
    sql = sql.replace(re, kw);
  });
  // newlines before major clauses
  const breaks = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','UNION','UNION ALL','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM'];
  breaks.forEach(kw => {
    const re = new RegExp('\\s*\\b' + kw.replace(/ /g,'\\s+') + '\\b', 'gi');
    sql = sql.replace(re, '\n' + kw);
  });
  // indent AND/OR
  sql = sql.replace(/\n(AND|OR)\b/g, '\n  $1');
  // commas
  sql = sql.replace(/,\s*/g, ',\n  ');
  sql = sql.replace(/^\s*\n/,'').trim();
  _sqlShow(sql, '格式化完成');
}

function compressSQL() {
  const raw = document.getElementById('sqlInput').value.trim();
  if (!raw) return;
  const compressed = raw.replace(/\s+/g,' ').trim();
  _sqlShow(compressed, '已压缩');
}

function _sqlShow(text, label) {
  document.getElementById('sqlOutput').textContent = text;
  document.getElementById('sqlStatus').textContent = '✓ ' + label;
  document.getElementById('sqlStatus').style.color = '#10b981';
  document.getElementById('sqlResultPanel').style.display = '';
}

function sqlCopy(btn) { copyText(document.getElementById('sqlOutput').textContent, btn); }

function sqlDownload() {
  const text = document.getElementById('sqlOutput').textContent;
  if (!text) return;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text],{type:'text/sql'}));
  a.download = 'query.sql'; a.click();
  showToast('SQL 文件已下载');
}

let _sqlTimer = null;
function _sqlRealtime() {
  clearTimeout(_sqlTimer);
  const v = document.getElementById('sqlInput').value.trim();
  if (!v) { document.getElementById('sqlResultPanel').style.display='none'; return; }
  _sqlTimer = setTimeout(formatSQL, 500);
}

function clearSQL() {
  document.getElementById('sqlInput').value='';
  document.getElementById('sqlResultPanel').style.display='none';
}

function sqlLoadSample() {
  document.getElementById('sqlInput').value = `select u.id,u.name,u.email,count(o.id) as order_count,sum(o.amount) as total from users u left join orders o on u.id=o.user_id where u.created_at>='2024-01-01' and u.status='active' group by u.id,u.name,u.email having count(o.id)>0 order by total desc limit 20`;
}
