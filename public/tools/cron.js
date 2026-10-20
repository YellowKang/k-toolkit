/* ── Cron 表达式：解析与调度见 compute/cron.js（页面与 Agent 共用） ── */

const _cronDict = {
  zh: {
    title: 'Cron 表达式',
    placeholder: '分 时 日 月 周（5 位）或 秒 分 时 日 月 周（6 位）',
    parse: '解析',
    clear: '清空',
    dialect: '格式',
    dialects: { auto: '自动识别', unix: 'Linux crontab（5 位）', spring: 'Spring @Scheduled（6 位）', quartz: 'Quartz（6–7 位，周 1=周日）' },
    presets: [['每分钟', '* * * * *'], ['每 15 分钟', '*/15 * * * *'], ['每小时', '0 * * * *'], ['每天零点', '0 0 * * *'], ['工作日 9 点', '0 9 * * 1-5'],
      ['每周一', '0 0 * * 1'], ['每月 1 日', '0 0 1 * *'], ['每年元旦', '0 0 1 1 *'], ['Spring 每 5 秒', '*/5 * * * * *'], ['Quartz 每月最后一天', '0 0 0 L * ?']],
    next: '下次执行时间（本机时区）',
    never: '未来 30 年内不会触发，请检查日期组合（如 2 月 30 日）',
    fields: { second: '秒', minute: '分钟', hour: '小时', dom: '日期', month: '月份', dow: '星期', year: '年' },
    dialect_label: d => ({ unix: 'Linux crontab', spring: 'Spring', quartz: 'Quartz' })[d],
    day_or: '日期与星期同时限定：满足任一即执行（Vixie cron 规则）',
    copy: '复制',
    errors: {
      empty: () => '请输入 Cron 表达式',
      macro: d => `不支持的宏：${d}`,
      count: d => { const [want, got] = d.split('|'); return `字段数量不对：需要 ${want.replace(/\//g, ' / ')} 个，实际 ${got} 个`; },
      value: (d, f) => `${f}字段的值无效：${d}`,
      range: (d, f) => `${f}字段超出范围（允许 ${d}）`,
      step: (d, f) => `${f}字段的步长无效：${d}`,
      question: (d, f) => `“?” 只能用于日期或星期字段（当前在${f}）`,
      'quartz-ext': (d, f) => `${f}字段的 ${d} 是 Quartz 扩展语法，请选择 Quartz 格式或使用 6 位表达式`,
      'quartz-both': () => 'Quartz 要求日期与星期中至少一个为 “?”',
    },
  },
  en: {
    title: 'Cron Expression',
    placeholder: 'min hour day month weekday (5 fields) or sec min hour day month weekday (6)',
    parse: 'Parse',
    clear: 'Clear',
    dialect: 'Format',
    dialects: { auto: 'Auto-detect', unix: 'Linux crontab (5 fields)', spring: 'Spring @Scheduled (6 fields)', quartz: 'Quartz (6–7 fields, 1 = Sunday)' },
    presets: [['Every minute', '* * * * *'], ['Every 15 min', '*/15 * * * *'], ['Hourly', '0 * * * *'], ['Daily at midnight', '0 0 * * *'], ['Weekdays 9:00', '0 9 * * 1-5'],
      ['Mondays', '0 0 * * 1'], ['1st of month', '0 0 1 * *'], ['New Year', '0 0 1 1 *'], ['Spring every 5 s', '*/5 * * * * *'], ['Quartz last day', '0 0 0 L * ?']],
    next: 'Next runs (local time zone)',
    never: 'No run within 30 years; check the date combination (e.g. Feb 30)',
    fields: { second: 'Second', minute: 'Minute', hour: 'Hour', dom: 'Day', month: 'Month', dow: 'Weekday', year: 'Year' },
    dialect_label: d => ({ unix: 'Linux crontab', spring: 'Spring', quartz: 'Quartz' })[d],
    day_or: 'Day and weekday are both set: either one triggers a run (Vixie cron)',
    copy: 'Copy',
    errors: {
      empty: () => 'Enter a cron expression',
      macro: d => `Unsupported macro: ${d}`,
      count: d => { const [want, got] = d.split('|'); return `Wrong number of fields: expected ${want}, got ${got}`; },
      value: (d, f) => `Invalid ${f.toLowerCase()} value: ${d}`,
      range: (d, f) => `${f} is out of range (allowed ${d})`,
      step: (d, f) => `Invalid ${f.toLowerCase()} step: ${d}`,
      question: (d, f) => `"?" is only allowed in day or weekday (found in ${f.toLowerCase()})`,
      'quartz-ext': (d, f) => `${d} in ${f.toLowerCase()} is Quartz syntax; choose the Quartz format`,
      'quartz-both': () => 'Quartz needs "?" in either the day or the weekday field',
    },
  },
};

function renderCron(el) {
  const T = makeToolI18n(_cronDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <input class="tool-input" id="cronInput" placeholder="${T('placeholder')}" spellcheck="false" autocomplete="off" style="flex:1;min-width:220px;font-family:monospace;font-size:15px">
        <select class="tool-input" id="cronDialect" style="width:auto" aria-label="${T('dialect')}" onchange="parseCron()">
          ${Object.entries(T('dialects')).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
        </select>
        <button class="btn btn-primary" onclick="parseCron()">${T('parse')}</button>
        <button class="btn btn-secondary" onclick="cronClear()">${T('clear')}</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px" id="cronPresets"></div>
      <div id="cronError" style="display:none;margin-top:10px;font-size:13px;color:#ef4444"></div>
    </div>
    <div class="tool-card-panel" id="cronResultPanel" style="display:none">
      <div class="panel-label" style="margin-bottom:6px" id="cronDesc"></div>
      <div id="cronMeta" style="font-size:12px;color:var(--text-muted);margin-bottom:12px"></div>
      <div style="margin-bottom:12px" id="cronFields"></div>
      <div class="panel-label" style="margin-bottom:8px">${T('next')}</div>
      <div id="cronNextList"></div>
    </div>`;
  const presetsEl = document.getElementById('cronPresets');
  T('presets').forEach(([label, expr]) => {
    const btn = document.createElement('button');
    btn.className = 'copy-inline';
    btn.textContent = label;
    btn.title = expr;
    btn.onclick = () => { document.getElementById('cronInput').value = expr; document.getElementById('cronDialect').value = 'auto'; parseCron(); };
    presetsEl.appendChild(btn);
  });
  const input = document.getElementById('cronInput');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') parseCron(); });
  input.addEventListener('input', () => { if (input.value.trim().split(/\s+/).length >= 5 || input.value.trim().startsWith('@')) parseCron(); });
  ToolCompute.load('cron').catch(() => {});
}

async function parseCron() {
  const T = makeToolI18n(_cronDict);
  const lang = typeof getCurrentLang === 'function' && getCurrentLang() === 'en' ? 'en' : 'zh';
  const expr = document.getElementById('cronInput').value.trim();
  const panel = document.getElementById('cronResultPanel'), error = document.getElementById('cronError');
  if (!expr) { panel.style.display = 'none'; error.style.display = 'none'; return; }
  let cron;
  try { cron = await ToolCompute.load('cron'); } catch (e) { error.textContent = e.message; error.style.display = ''; return; }
  const parsed = cron.parse(expr, document.getElementById('cronDialect').value);
  if (!parsed.ok) {
    const fieldName = parsed.field ? T('fields')[parsed.field] : '';
    error.textContent = (T('errors')[parsed.code] || (() => parsed.error))(parsed.detail, fieldName);
    error.style.display = '';
    panel.style.display = 'none';
    return;
  }
  error.style.display = 'none';
  document.getElementById('cronDesc').innerHTML = `<span style="color:#10b981;font-size:14px;font-weight:600">✓ ${escHtml(cron.describe(parsed, lang))}</span>`;
  document.getElementById('cronMeta').textContent = T('dialect_label', parsed.dialect) + (parsed.dayMode === 'or' ? ' · ' + T('day_or') : '');
  const order = parsed.dialect === 'unix' ? ['minute', 'hour', 'dom', 'month', 'dow'] : ['second', 'minute', 'hour', 'dom', 'month', 'dow', 'year'];
  document.getElementById('cronFields').innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
    order.filter(f => parsed.raw[f] !== undefined).map(f => `
      <div style="flex:1;min-width:90px;padding:10px 12px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:10px;text-align:center">
        <div style="font-family:monospace;font-size:18px;font-weight:700;color:var(--neon)">${escHtml(parsed.raw[f])}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${T('fields')[f]}</div>
        <div style="font-size:11px;color:var(--text);margin-top:2px">${escHtml(cron.describeField(parsed, f, lang) || (lang === 'en' ? 'any' : '任意'))}</div>
      </div>`).join('') + '</div>';
  const runs = cron.next(parsed, new Date(), 8);
  const weekday = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'zh-CN', { weekday: 'short' });
  document.getElementById('cronNextList').innerHTML = runs.length ? runs.map((d, i) => {
    const text = `${ToolCompute.localDate(d)} ${weekday.format(d)} ${d.toTimeString().slice(0, 8)}`;
    return `<div class="result-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="color:var(--text-muted);font-size:12px;min-width:24px">#${i + 1}</span>
      <span style="font-family:monospace;font-size:13px;flex:1">${escHtml(text)}</span>
      <button class="copy-inline" data-copy="${escHtml(ToolCompute.localDate(d) + ' ' + d.toTimeString().slice(0, 8))}" onclick="copyText(this.dataset.copy,this)">${T('copy')}</button>
    </div>`;
  }).join('') : `<div style="color:#f59e0b;font-size:13px">${T('never')}</div>`;
  panel.style.display = '';
}

function cronClear() {
  document.getElementById('cronInput').value = '';
  document.getElementById('cronResultPanel').style.display = 'none';
  document.getElementById('cronError').style.display = 'none';
}
