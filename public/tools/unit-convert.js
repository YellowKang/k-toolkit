/* ── 单位换算：精确换算系数（国际定义值），结果按 12 位有效数字消除浮点噪声 ── */

let _UC_CATS = {};

const _ucDict = {
  zh: {
    category: '选择类别',
    cats: { length: '长度', mass: '重量', temperature: '温度', area: '面积', volume: '体积', time: '时间', storage: '存储', speed: '速度', numfmt: '数字格式' },
    all: '全部换算',
    copy: '复制',
    nf_input: '输入数字',
    nf_ph: '输入数字，如 1234567.89',
    nf_empty: '输入数字后显示格式化结果',
    nf_title: '格式化结果',
    nf_zh: '千分位（中文）', nf_en: '千分位（英文）', nf_cny: '人民币 ¥', nf_usd: '美元 $', nf_eur: '欧元 €',
    nf_sci: '科学计数法', nf_pct: '百分比（÷100）', nf_int: '整数部分', nf_bytes: '字节友好格式', nf_compact: '紧凑写法',
  },
  en: {
    category: 'Category',
    cats: { length: 'Length', mass: 'Mass', temperature: 'Temperature', area: 'Area', volume: 'Volume', time: 'Time', storage: 'Storage', speed: 'Speed', numfmt: 'Number format' },
    all: 'All conversions',
    copy: 'Copy',
    nf_input: 'Number',
    nf_ph: 'Enter a number, e.g. 1234567.89',
    nf_empty: 'Enter a number to see formatted results',
    nf_title: 'Formatted results',
    nf_zh: 'Grouping (Chinese)', nf_en: 'Grouping (English)', nf_cny: 'Chinese yuan ¥', nf_usd: 'US dollar $', nf_eur: 'Euro €',
    nf_sci: 'Scientific', nf_pct: 'Percent (÷100)', nf_int: 'Integer part', nf_bytes: 'Human-readable bytes', nf_compact: 'Compact',
  },
};

const _ucUnitName = unit => (typeof getCurrentLang === 'function' && getCurrentLang() === 'en') ? unit[3] : unit[2];
/** Round away binary floating-point noise for display: 3.5999999999 → 3.6. */
const ucClean = v => window.KCompute.units.clean(v);
function ucConvertValue(category, value, from, to) { return window.KCompute.units.convert(category, value, from, to); }

async function renderUnitConvert(el) {
  try { _UC_CATS = (await ToolCompute.load('units')).categories; }
  catch (error) { if(el.isConnected) el.textContent=error.message; return; }
  if (!el.isConnected) return;
  const T = makeToolI18n(_ucDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('category')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px" id="ucCats">
        ${Object.keys(_UC_CATS).map((c, i) => `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-secondary'}" data-cat="${c}" onclick="ucSetCat('${c}')">${T('cats')[c]}</button>`).join('')}
      </div>
      <div id="ucConvertPanel">
        <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px">
          <div>
            <select class="tool-input" id="ucFromUnit" onchange="ucConvert()"></select>
            <input class="tool-input" id="ucFromVal" type="number" value="1" style="margin-top:8px" oninput="ucConvert()">
          </div>
          <button class="btn btn-secondary" style="padding:6px 10px" onclick="ucSwap()" aria-label="swap">⇄</button>
          <div>
            <select class="tool-input" id="ucToUnit" onchange="ucConvert()"></select>
            <input class="tool-input" id="ucToVal" style="margin-top:8px" readonly>
          </div>
        </div>
      </div>
      <div id="ucNumFmtPanel" style="display:none">
        <div style="margin-bottom:12px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${T('nf_input')}</div>
          <input type="text" class="tool-input" id="ucNfInput" inputmode="decimal" placeholder="${T('nf_ph')}" oninput="ucNfUpdate()">
        </div>
      </div>
    </div>
    <div id="ucStorageRoot" hidden></div>
    <div class="tool-card-panel" id="ucAllPanel">
      <div class="panel-label" style="margin-bottom:10px" id="ucAllLabel">${T('all')}</div>
      <div id="ucAllResults"></div>
    </div>`;
  el._toolOutput=()=>!el.querySelector('#ucStorageRoot').hidden?(el.querySelector('#bcMain')?.textContent||''):window._ucCur==='numfmt'?el.querySelector('#ucAllResults').textContent:el.querySelector('#ucToVal').value;
  ucSetCat(window._ucCur && _UC_CATS[window._ucCur] ? window._ucCur : 'length');
}

function ucSetCat(cat) {
  if (!_UC_CATS[cat]) return;
  const T = makeToolI18n(_ucDict);
  window._ucCur = cat;
  document.querySelectorAll('#ucCats button').forEach(b => b.className = 'btn ' + (b.dataset.cat === cat ? 'btn-primary' : 'btn-secondary'));
  const storage = document.getElementById('ucStorageRoot');
  storage.hidden = cat !== 'storage';
  document.getElementById('ucAllPanel').hidden = cat === 'storage';
  if (cat === 'storage') {
    document.getElementById('ucConvertPanel').style.display = 'none';
    document.getElementById('ucNumFmtPanel').style.display = 'none';
    if (!storage.children.length) loadTool('byte-convert').then(() => { if (storage.isConnected && window._ucCur === 'storage') renderByteConvert(storage); }).catch(error => { if (storage.isConnected) storage.textContent = error.message; });
    return;
  }
  const isNumFmt = cat === 'numfmt';
  document.getElementById('ucConvertPanel').style.display = isNumFmt ? 'none' : '';
  document.getElementById('ucNumFmtPanel').style.display = isNumFmt ? '' : 'none';
  document.getElementById('ucAllLabel').textContent = isNumFmt ? T('nf_title') : T('all');
  if (isNumFmt) { ucNfUpdate(); return; }
  const units = _UC_CATS[cat].units;
  ['ucFromUnit', 'ucToUnit'].forEach((id, i) => {
    const sel = document.getElementById(id);
    sel.innerHTML = units.map(u => `<option value="${u[0]}">${_ucUnitName(u)}</option>`).join('');
    sel.value = units[Math.min(i, units.length - 1)][0];
  });
  ucConvert();
}

function ucSwap() {
  const from = document.getElementById('ucFromUnit'), to = document.getElementById('ucToUnit');
  [from.value, to.value] = [to.value, from.value];
  ucConvert();
}

function ucConvert() {
  const T = makeToolI18n(_ucDict);
  const cat = window._ucCur;
  if (!_UC_CATS[cat]?.units) return;
  const from = document.getElementById('ucFromUnit').value, to = document.getElementById('ucToUnit').value;
  const raw = document.getElementById('ucFromVal').value;
  if (!raw.trim()) { document.getElementById('ucToVal').value='';document.getElementById('ucAllResults').replaceChildren();return; }
  const val = Number(raw);
  let result;
  try { result = ucConvertValue(cat, val, from, to); } catch(error) { document.getElementById('ucToVal').value='';document.getElementById('ucAllResults').textContent=error.message;return; }
  document.getElementById('ucToVal').value = String(result);
  document.getElementById('ucAllResults').innerHTML = _UC_CATS[cat].units.map(u => {
    const r = String(ucConvertValue(cat, val, from, u[0]));
    return `<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);min-width:110px">${_ucUnitName(u)}</span><span style="color:var(--neon);font-weight:600;flex:1;word-break:break-all">${r}</span><button class="copy-inline" data-copy="${r}" onclick="copyText(this.dataset.copy,this)">${T('copy')}</button></div>`;
  }).join('');
}

// ── 数字格式化（合入 number-format）──
function _ucNfRow(label, value, copyLabel) {
  return `<div class="result-row" style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px">
    <span style="color:var(--text-muted);font-size:13px">${label}</span>
    <div style="display:flex;align-items:center;gap:10px">
      <code style="font-family:monospace;font-size:14px;color:var(--neon)">${escHtml(value)}</code>
      <button class="copy-inline" data-copy="${escHtml(value)}" onclick="copyText(this.dataset.copy,this)">${copyLabel}</button>
    </div>
  </div>`;
}

function ucNfUpdate() {
  const T = makeToolI18n(_ucDict);
  const raw = (document.getElementById('ucNfInput').value || '').trim().replace(/[,，\s]/g, '');
  const allResults = document.getElementById('ucAllResults');
  if (!raw || isNaN(+raw)) {
    allResults.innerHTML = `<span style="color:var(--text-muted);font-size:13px">${T('nf_empty')}</span>`;
    return;
  }
  const n = +raw;
  const fmt = (v, locale, opts) => new Intl.NumberFormat(locale, opts).format(v);
  const rows = [
    [T('nf_zh'), fmt(n, 'zh-CN', { maximumFractionDigits: 20 })],
    [T('nf_en'), fmt(n, 'en-US', { maximumFractionDigits: 20 })],
    [T('nf_cny'), fmt(n, 'zh-CN', { style: 'currency', currency: 'CNY' })],
    [T('nf_usd'), fmt(n, 'en-US', { style: 'currency', currency: 'USD' })],
    [T('nf_eur'), fmt(n, 'de-DE', { style: 'currency', currency: 'EUR' })],
    [T('nf_compact'), fmt(n, typeof getCurrentLang === 'function' && getCurrentLang() === 'en' ? 'en-US' : 'zh-CN', { notation: 'compact', maximumFractionDigits: 2 })],
    [T('nf_sci'), n.toExponential()],
    [T('nf_pct'), fmt(n / 100, 'zh-CN', { style: 'percent', minimumFractionDigits: 2 })],
    [T('nf_int'), fmt(Math.trunc(n), 'zh-CN')],
  ];
  if (n >= 0) {
    const byteUnits = [['B', 1], ['KB', 1024], ['MB', 1024 ** 2], ['GB', 1024 ** 3], ['TB', 1024 ** 4], ['PB', 1024 ** 5]];
    const best = byteUnits.filter(([, d]) => n / d >= 1).pop() || byteUnits[0];
    rows.push([T('nf_bytes'), (n / best[1]).toFixed(best[0] === 'B' ? 0 : 2) + ' ' + best[0]]);
  }
  allResults.innerHTML = rows.map(([label, value]) => _ucNfRow(label, value, T('copy'))).join('');
}
