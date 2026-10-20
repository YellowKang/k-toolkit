/* ── 单位换算：精确换算系数（国际定义值），结果按 12 位有效数字消除浮点噪声 ── */

const _UC_CATS = {
  length: { base: 'm', units: [
    ['m', 1, '米', 'Meter'], ['km', 1000, '千米', 'Kilometer'], ['cm', 0.01, '厘米', 'Centimeter'], ['mm', 0.001, '毫米', 'Millimeter'],
    ['um', 1e-6, '微米', 'Micrometer'], ['in', 0.0254, '英寸', 'Inch'], ['ft', 0.3048, '英尺', 'Foot'], ['yd', 0.9144, '码', 'Yard'],
    ['mi', 1609.344, '英里', 'Mile'], ['nmi', 1852, '海里', 'Nautical mile'], ['li', 500, '里（市制）', 'Li (市里)'],
    ['chi', 1 / 3, '尺（市制）', 'Chi (市尺)'], ['cun', 1 / 30, '寸（市制）', 'Cun (市寸)'] ] },
  mass: { units: [
    ['kg', 1, '千克', 'Kilogram'], ['g', 0.001, '克', 'Gram'], ['mg', 1e-6, '毫克', 'Milligram'], ['t', 1000, '吨', 'Tonne'],
    ['lb', 0.45359237, '磅', 'Pound'], ['oz', 0.028349523125, '盎司', 'Ounce'], ['jin', 0.5, '斤', 'Jin (斤)'], ['liang', 0.05, '两', 'Liang (两)'] ] },
  temperature: { units: [['c', null, '摄氏度 °C', 'Celsius °C'], ['f', null, '华氏度 °F', 'Fahrenheit °F'], ['k', null, '开尔文 K', 'Kelvin K']] },
  area: { units: [
    ['m2', 1, '平方米', 'Square meter'], ['km2', 1e6, '平方千米', 'Square kilometer'], ['cm2', 1e-4, '平方厘米', 'Square centimeter'],
    ['ha', 1e4, '公顷', 'Hectare'], ['mu', 2000 / 3, '亩', 'Mu (亩)'], ['ft2', 0.09290304, '平方英尺', 'Square foot'],
    ['in2', 0.00064516, '平方英寸', 'Square inch'], ['acre', 4046.8564224, '英亩', 'Acre'] ] },
  volume: { units: [
    ['l', 1, '升', 'Liter'], ['ml', 0.001, '毫升', 'Milliliter'], ['m3', 1000, '立方米', 'Cubic meter'],
    ['usgal', 3.785411784, '美制加仑', 'US gallon'], ['ukgal', 4.54609, '英制加仑', 'UK gallon'],
    ['usfloz', 0.0295735295625, '美制液量盎司', 'US fluid ounce'], ['uscup', 0.2365882365, '美制杯', 'US cup'] ] },
  time: { units: [
    ['ms', 0.001, '毫秒', 'Millisecond'], ['s', 1, '秒', 'Second'], ['min', 60, '分钟', 'Minute'], ['h', 3600, '小时', 'Hour'],
    ['d', 86400, '天', 'Day'], ['wk', 604800, '周', 'Week'], ['yr', 31536000, '年（365 天）', 'Year (365 days)'] ] },
  storage: { units: [
    ['bit', 0.125, '比特 bit', 'Bit'], ['b', 1, '字节 B', 'Byte'], ['kb', 1024, 'KB（1024）', 'KB (1024)'], ['mb', 1024 ** 2, 'MB', 'MB'],
    ['gb', 1024 ** 3, 'GB', 'GB'], ['tb', 1024 ** 4, 'TB', 'TB'], ['pb', 1024 ** 5, 'PB', 'PB'] ] },
  speed: { units: [
    ['mps', 1, '米/秒', 'Meters/second'], ['kmh', 1 / 3.6, '千米/小时', 'Kilometers/hour'], ['mph', 0.44704, '英里/小时', 'Miles/hour'],
    ['kn', 1852 / 3600, '节', 'Knot'], ['fps', 0.3048, '英尺/秒', 'Feet/second'] ] },
  numfmt: { units: null },
};

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
const ucClean = v => Number.isFinite(v) ? Number(v.toPrecision(12)) : v;

/** Convert `value` between unit ids in a category; temperature uses offsets. */
function ucConvertValue(category, value, from, to) {
  const cat = _UC_CATS[category];
  if (!cat?.units) throw new Error('Unknown category: ' + category);
  if (category === 'temperature') {
    const c = from === 'c' ? value : from === 'f' ? (value - 32) * 5 / 9 : value - 273.15;
    return ucClean(to === 'c' ? c : to === 'f' ? c * 9 / 5 + 32 : c + 273.15);
  }
  const f = cat.units.find(u => u[0] === from), t = cat.units.find(u => u[0] === to);
  if (!f || !t) throw new Error('Unknown unit');
  return ucClean(value * f[1] / t[1]);
}

function renderUnitConvert(el) {
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
    <div class="tool-card-panel" id="ucAllPanel">
      <div class="panel-label" style="margin-bottom:10px" id="ucAllLabel">${T('all')}</div>
      <div id="ucAllResults"></div>
    </div>`;
  ucSetCat(window._ucCur && _UC_CATS[window._ucCur] ? window._ucCur : 'length');
}

function ucSetCat(cat) {
  if (!_UC_CATS[cat]) return;
  const T = makeToolI18n(_ucDict);
  window._ucCur = cat;
  document.querySelectorAll('#ucCats button').forEach(b => b.className = 'btn ' + (b.dataset.cat === cat ? 'btn-primary' : 'btn-secondary'));
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
  const val = parseFloat(document.getElementById('ucFromVal').value) || 0;
  let result;
  try { result = ucConvertValue(cat, val, from, to); } catch { return; }
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
