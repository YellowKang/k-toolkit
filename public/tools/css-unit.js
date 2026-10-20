/* ── CSS 单位换算：px / rem / em / vw / vh / pt / % ，使用主题变量适配明暗主题 ── */

const _cuDict = {
  zh: {
    params: '输入参数', value: '数值', unit: '源单位', base: '根字号 (px)', parent: '父元素字号 (px)', vw: '视口宽 (px)', vh: '视口高 (px)',
    result: '换算结果', col_unit: '单位', col_value: '值', col_css: 'CSS 写法', copy: '复制',
    note: 'rem 相对根元素字号；em 与 % 相对父元素字号；pt 按 96dpi（1pt = 1/72 英寸）',
  },
  en: {
    params: 'Inputs', value: 'Value', unit: 'From unit', base: 'Root font size (px)', parent: 'Parent font size (px)', vw: 'Viewport width (px)', vh: 'Viewport height (px)',
    result: 'Conversions', col_unit: 'Unit', col_value: 'Value', col_css: 'CSS', copy: 'Copy',
    note: 'rem is relative to the root font size; em and % to the parent font size; pt assumes 96 dpi (1pt = 1/72 in)',
  },
};

const _CU_UNITS = ['px', 'rem', 'em', '%', 'vw', 'vh', 'pt'];

/** Convert a CSS length between units given root/parent font sizes and the viewport. */
function cuConvertValue(value, from, to, { root = 16, parent = 16, vw = 1440, vh = 900 } = {}) {
  const toPx = { px: 1, rem: root, em: parent, '%': parent / 100, vw: vw / 100, vh: vh / 100, pt: 96 / 72 };
  if (!(from in toPx) || !(to in toPx)) throw new Error('Unknown unit');
  return Number((value * toPx[from] / toPx[to]).toPrecision(10));
}

window.renderCssUnit = function(el) {
  const T = makeToolI18n(_cuDict);
  const field = (id, label, value, extra = '') => `<label style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-muted)">${label}<input class="tool-input" id="${id}" type="number" value="${value}" step="any" style="width:130px" oninput="cuConvert()"${extra}></label>`;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('params')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end">
        ${field('cuValue', T('value'), 16)}
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-muted)">${T('unit')}
          <select class="tool-input" id="cuUnit" style="width:110px" onchange="cuConvert()">${_CU_UNITS.map(u => `<option value="${u}">${u}</option>`).join('')}</select>
        </label>
        ${field('cuBase', T('base'), 16, ' min="1"')}
        ${field('cuParent', T('parent'), 16, ' min="1"')}
        ${field('cuVW', T('vw'), 1440, ' min="1"')}
        ${field('cuVH', T('vh'), 900, ' min="1"')}
      </div>
      <div style="margin-top:10px;font-size:12px;color:var(--text-muted)">${T('note')}</div>
    </div>
    <div class="tool-card-panel" id="cuResult" style="display:none">
      <div class="panel-label">${T('result')}</div>
      <div id="cuTable"></div>
    </div>`;
  cuConvert();
};

function cuConvert() {
  const T = makeToolI18n(_cuDict);
  const num = (id, fallback) => { const v = parseFloat(document.getElementById(id).value); return v > 0 ? v : fallback; };
  const val = parseFloat(document.getElementById('cuValue').value);
  const unit = document.getElementById('cuUnit').value;
  if (isNaN(val)) { document.getElementById('cuResult').style.display = 'none'; return; }
  const ctx = { root: num('cuBase', 16), parent: num('cuParent', 16), vw: num('cuVW', 1440), vh: num('cuVH', 900) };
  document.getElementById('cuTable').innerHTML = _CU_UNITS.map(u => {
    const v = cuConvertValue(val, unit, u, ctx), css = v + u, active = u === unit;
    return `<div class="result-row" style="margin-bottom:6px;${active ? 'border-color:var(--accent)' : ''}">
      <span style="color:var(--text-muted);min-width:56px;font-family:monospace">${u}${active ? ' ◀' : ''}</span>
      <span style="color:var(--neon);font-weight:600;flex:1;font-family:monospace">${css}</span>
      <button class="copy-inline" data-copy="${css}" onclick="copyText(this.dataset.copy,this)">${T('copy')}</button>
    </div>`;
  }).join('');
  document.getElementById('cuResult').style.display = '';
}
