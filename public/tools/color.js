/* === Color tool – merged: picker + convert + contrast === */

var _colorCurrentTab = 'picker';

/* ── i18n dict ── */
var _colorI18nDict = {
  zh: {
    tab_picker:       '拾色器',
    tab_convert:      '格式转换',
    tab_contrast:     '对比度检查',
    color_scheme:     '配色方案',
    random:           '随机',
    analogous:        '类比色',
    complement:       '互补色',
    triadic:          '三角色',
    generate:         '生成',
    color_detail:     '颜色详情',
    copy:             '复制',
    wcag_check:       'WCAG 对比度检查',
    foreground:       '前景色',
    background:       '背景色',
    preview:          '预览',
    preview_text:     'Aa 示例文字',
    contrast_ratio:   '对比度比值',
    pass:             '通过',
    fail:             '未通过',
    normal_text:      '普通文字',
    large_text:       '大号文字',
    input_color:      '输入颜色值',
    picker_title:     '拾色器',
    convert_btn:      '转换',
    color_preview:    '颜色预览',
    unrecognized:     '无法识别的格式',
    light:            '浅色',
    dark:             '深色',
    luminance:        '亮度',
    luminance_note:   pct => `（亮度 ${pct}%）`,
    contrast_text:    '对比文字',
    sample_text:      '示例文字',
    wcag_title:       '色彩对比度检测 (WCAG)',
    fg_label:         '前景色 (Foreground)',
    bg_label:         '背景色 (Background)',
    contrast_result:  '对比度结果',
    contrast_ratio_label: '对比度比值 (Contrast Ratio)',
    normal_text_label:'普通文字 (Normal Text)',
    large_text_label: '大号文字 (Large Text)',
    input_placeholder:'#667eea 或 rgb(102,126,234) 或 hsl(231,75%,66%)',
  },
  en: {
    tab_picker:       'Picker',
    tab_convert:      'Convert',
    tab_contrast:     'Contrast',
    color_scheme:     'Color Scheme',
    random:           'Random',
    analogous:        'Analogous',
    complement:       'Complementary',
    triadic:          'Triadic',
    generate:         'Generate',
    color_detail:     'Color Detail',
    copy:             'Copy',
    wcag_check:       'WCAG Contrast Check',
    foreground:       'Foreground',
    background:       'Background',
    preview:          'Preview',
    preview_text:     'Aa Sample text',
    contrast_ratio:   'Contrast Ratio',
    pass:             'Pass',
    fail:             'Fail',
    normal_text:      'Normal Text',
    large_text:       'Large Text',
    input_color:      'Input Color Value',
    picker_title:     'Picker',
    convert_btn:      'Convert',
    color_preview:    'Color Preview',
    unrecognized:     'Unrecognized format',
    light:            'Light',
    dark:             'Dark',
    luminance:        'Luminance',
    luminance_note:   pct => ` (luminance ${pct}%)`,
    contrast_text:    'Contrast Text',
    sample_text:      'Sample text',
    wcag_title:       'Color Contrast Check (WCAG)',
    fg_label:         'Foreground',
    bg_label:         'Background',
    contrast_result:  'Contrast Result',
    contrast_ratio_label: 'Contrast Ratio',
    normal_text_label:'Normal Text',
    large_text_label: 'Large Text',
    input_placeholder:'#667eea or rgb(102,126,234) or hsl(231,75%,66%)',
  }
};

var _colorTl = typeof makeToolI18n === 'function' ? makeToolI18n(_colorI18nDict) : function(k) { return _colorI18nDict.zh[k] || k; };

function _colorGetTl() {
  return typeof makeToolI18n === 'function' ? makeToolI18n(_colorI18nDict) : function(k) { return _colorI18nDict.zh[k] || k; };
}

async function renderColor(el) {
  await ToolCompute.load('color'); if (!el.isConnected || window.currentPage !== 'color') return;
  el._toolOutput = () => _colorCurrentTab === 'convert' ? (el._colorOutput || '') : _colorCurrentTab === 'contrast' ? (document.getElementById('ccRatio')?.textContent || '') : '';

  var tl = _colorGetTl();
  el.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <button class="btn btn-primary" id="colorTabPicker" onclick="colorSwitchTab('picker')">${tl('tab_picker')}</button>
      <button class="btn btn-secondary" id="colorTabConvert" onclick="colorSwitchTab('convert')">${tl('tab_convert')}</button>
      <button class="btn btn-secondary" id="colorTabContrast" onclick="colorSwitchTab('contrast')">${tl('tab_contrast')}</button>
    </div>
    <div id="colorPanelPicker"></div>
    <div id="colorPanelConvert" style="display:none"></div>
    <div id="colorPanelContrast" style="display:none"></div>`;

  _colorRenderPicker();
  _colorRenderConvert();
  _colorRenderContrast();

  colorSwitchTab('picker');
}

function colorSwitchTab(tab) {
  _colorCurrentTab = tab;
  ['picker','convert','contrast'].forEach(t => {
    document.getElementById('colorPanel' + t.charAt(0).toUpperCase() + t.slice(1)).style.display = t === tab ? '' : 'none';
    var btn = document.getElementById('colorTab' + t.charAt(0).toUpperCase() + t.slice(1));
    if (btn) {
      btn.className = t === tab ? 'btn btn-primary' : 'btn btn-secondary';
    }
  });
  if (tab === 'picker') {
    _wcagUpdate();
  } else if (tab === 'contrast') {
    _ccInitListeners();
    if (typeof _ccUpdate === 'function') _ccUpdate();
  }
}

/* ============================================================
   Tab 1: Picker
   ============================================================ */
function _colorRenderPicker() {
  var tl = _colorGetTl();
  var panel = document.getElementById('colorPanelPicker');
  panel.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">${tl('color_scheme')}</div>
        <div style="display:flex;gap:10px">
          <select class="control-select" id="colorScheme" style="font-size:13px">
            <option value="random">${tl('random')}</option>
            <option value="analogous">${tl('analogous')}</option>
            <option value="complement">${tl('complement')}</option>
            <option value="triadic">${tl('triadic')}</option>
          </select>
          <button class="btn btn-primary" onclick="generateColors()">${tl('generate')}</button>
        </div>
      </div>
      <div class="color-palette" id="colorPalette"></div>
    </div>
    <div class="tool-card-panel" id="colorDetail" style="display:none">
      <div class="panel-label">${tl('color_detail')}</div>
      <div id="colorDetailContent"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:14px">${tl('wcag_check')}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
        <div style="flex:1;min-width:120px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${tl('foreground')}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="wcagFg" value="#ffffff" oninput="_wcagUpdate()" style="width:40px;height:36px;border:1px solid var(--glass-border);border-radius:8px;cursor:pointer;background:none;padding:2px">
            <input class="tool-input" id="wcagFgHex" value="#ffffff" oninput="_wcagHexInput('fg')" style="font-family:monospace;width:90px">
          </div>
        </div>
        <div style="flex:1;min-width:120px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${tl('background')}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="wcagBg" value="#1a1a2e" oninput="_wcagUpdate()" style="width:40px;height:36px;border:1px solid var(--glass-border);border-radius:8px;cursor:pointer;background:none;padding:2px">
            <input class="tool-input" id="wcagBgHex" value="#1a1a2e" oninput="_wcagHexInput('bg')" style="font-family:monospace;width:90px">
          </div>
        </div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${tl('preview')}</div>
          <div id="wcagPreview" style="padding:8px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid var(--glass-border);text-align:center">${tl('preview_text')}</div>
        </div>
      </div>
      <div id="wcagRatioRow" style="margin-bottom:14px">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">${tl('contrast_ratio')}</div>
        <div id="wcagRatio" style="font-size:28px;font-weight:700;font-family:monospace;color:var(--neon)">—</div>
      </div>
      <div id="wcagBadges" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"></div>
    </div>`;
  generateColors();
  _wcagUpdate();
}

function hslToHex(h,s,l) { return KCompute.color.formats({...KCompute.color.hsl(h,s,l),a:1}).hex; }
function hexToRgb(hex) { return KCompute.color.parse(hex,'hex'); }

function generateColors() {
  const scheme = document.getElementById('colorScheme').value;
  const baseH = Math.floor(Math.random()*360);
  const s = 65 + Math.random()*20, l = 50 + Math.random()*10;
  let colors = [];
  if (scheme === 'analogous') {
    colors = [-30,-15,0,15,30].map(d => hslToHex((baseH+d+360)%360, s, l));
  } else if (scheme === 'complement') {
    colors = [0,30,60,180,210].map(d => hslToHex((baseH+d+360)%360, s, l));
  } else if (scheme === 'triadic') {
    colors = [0,20,120,140,240].map(d => hslToHex((baseH+d+360)%360, s, l));
  } else {
    colors = Array.from({length:5}, () => hslToHex(Math.floor(Math.random()*360), 55+Math.random()*30, 45+Math.random()*20));
  }
  const palette = document.getElementById('colorPalette');
  palette.innerHTML = colors.map(c => `
    <div class="color-swatch" onclick="showColorDetail('${c}')">
      <div class="color-block" style="background:${c}"></div>
      <div class="color-hex">${c}</div>
    </div>`).join('');
}

function showColorDetail(hex) {
  var tl = _colorGetTl();
  const {r,g,b} = hexToRgb(hex);
  document.getElementById('colorDetail').style.display = '';
  document.getElementById('colorDetailContent').innerHTML = `
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div style="width:80px;height:80px;border-radius:12px;background:${hex};box-shadow:0 4px 12px rgba(0,0,0,0.15)"></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="result-row" style="min-width:260px"><span>HEX</span><span style="margin-left:auto;font-weight:600">${hex}</span><button class="copy-inline" onclick="copyText('${hex}',this)">${tl('copy')}</button></div>
        <div class="result-row"><span>RGB</span><span style="margin-left:auto;font-weight:600">rgb(${r}, ${g}, ${b})</span><button class="copy-inline" onclick="copyText('rgb(${r}, ${g}, ${b})',this)">${tl('copy')}</button></div>
      </div>
    </div>`;
}

function _wcagLinearize(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function _wcagLuminance(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return KCompute.color.luminance(KCompute.color.parse(hex));
}

function _wcagContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function _wcagBadge(label, pass) {
  var tl = _colorGetTl();
  const color  = pass ? '#22c55e' : '#ef4444';
  const bg     = pass ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
  const mark   = pass ? '✓' : '✗';
  return `<div style="padding:10px 14px;border-radius:10px;border:1px solid ${color}44;background:${bg};display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:12px;color:var(--text)">${label}</span>
    <span style="font-size:13px;font-weight:700;color:${color}">${mark} ${pass ? tl('pass') : tl('fail')}</span>
  </div>`;
}

function _wcagUpdate() {
  const fgPicker = document.getElementById('wcagFg');
  const bgPicker = document.getElementById('wcagBg');
  const fgHex    = document.getElementById('wcagFgHex');
  const bgHex    = document.getElementById('wcagBgHex');
  if (!fgPicker) return;

  fgHex.value = fgPicker.value;
  bgHex.value = bgPicker.value;

  _wcagRender(fgPicker.value, bgPicker.value);
}

function _wcagHexInput(which) {
  const hexEl  = document.getElementById(which === 'fg' ? 'wcagFgHex' : 'wcagBgHex');
  const picker = document.getElementById(which === 'fg' ? 'wcagFg'    : 'wcagBg');
  const val    = hexEl.value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    picker.value = val;
    const fgV = document.getElementById('wcagFg').value;
    const bgV = document.getElementById('wcagBg').value;
    _wcagRender(fgV, bgV);
  }
}

function _wcagRender(fg, bg) {
  var tl = _colorGetTl();
  const preview = document.getElementById('wcagPreview');
  const ratioEl = document.getElementById('wcagRatio');
  const badges  = document.getElementById('wcagBadges');
  if (!preview) return;

  preview.style.color      = fg;
  preview.style.background = bg;

  const lFg = _wcagLuminance(fg);
  const lBg = _wcagLuminance(bg);
  if (lFg === null || lBg === null) {
    ratioEl.textContent = '—';
    badges.innerHTML = '';
    return;
  }

  const ratio = _wcagContrastRatio(lFg, lBg);
  ratioEl.textContent = ratio.toFixed(2) + ':1';

  badges.innerHTML =
    _wcagBadge('AA · ' + tl('normal_text') + ' (≥4.5:1)',  ratio >= 4.5) +
    _wcagBadge('AA · ' + tl('large_text') + ' (≥3:1)',    ratio >= 3)   +
    _wcagBadge('AAA · ' + tl('normal_text') + ' (≥7:1)',   ratio >= 7)   +
    _wcagBadge('AAA · ' + tl('large_text') + ' (≥4.5:1)', ratio >= 4.5);
}

/* ============================================================
   Tab 2: Convert
   IDs prefixed with cv instead of cc to avoid conflicts
   ============================================================ */
function _colorRenderConvert() {
  var tl = _colorGetTl();
  var panel = document.getElementById('colorPanelConvert');
  panel.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${tl('input_color')}</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="tool-input" id="cvInput" placeholder="${tl('input_placeholder')}" style="flex:1">
        <input type="color" id="cvPicker" value="#667eea" style="width:44px;height:36px;border:none;background:none;cursor:pointer;border-radius:8px" title="${tl('tab_picker')}">
        <button class="btn btn-primary" onclick="convertColor()">${tl('convert_btn')}</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${['HEX','RGB','RGBA','HSL','HSV','CMYK'].map(f =>
          `<button class="flag-btn" onclick="cvFillSample('${f}')" style="padding:3px 10px;border-radius:20px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:11px;cursor:pointer;transition:all 0.2s">${f}</button>`
        ).join('')}
      </div>
    </div>
    <div class="tool-card-panel" id="cvResultPanel" style="display:none">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div id="cvPreview" style="width:64px;height:64px;border-radius:14px;border:1px solid var(--glass-border);flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,0.3)"></div>
        <div style="flex:1">
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">${tl('color_preview')}</div>
          <div id="cvLuminance" style="font-size:12px"></div>
        </div>
      </div>
      <div id="cvResults"></div>
    </div>`;

  document.getElementById('cvInput').addEventListener('keydown', e => { if(e.key==='Enter') { e.preventDefault(); convertColor(); } });
  document.getElementById('cvPicker').addEventListener('input', function() {
    document.getElementById('cvInput').value = this.value;
    convertColor();
  });
  document.getElementById('cvInput').addEventListener('input', () => {
    const v = document.getElementById('cvInput').value.trim();
    convertColor();
    if (v.match(/^#[0-9a-fA-F]{3,8}$/)) {
      document.getElementById('cvPicker').value = v.slice(0,7);
    }
  });
}

function cvFillSample(fmt) {
  const samples = {
    HEX: '#667eea', RGB: 'rgb(102,126,234)', RGBA: 'rgba(102,126,234,0.8)',
    HSL: 'hsl(231,75%,66%)', HSV: 'hsv(231,56%,92%)', CMYK: 'cmyk(56%,46%,0%,8%)'
  };
  document.getElementById('cvInput').value = samples[fmt] || '';
  convertColor();
}
/* keep old name for backward compat with agent actions */
function ccFillSample(fmt) { cvFillSample(fmt); }

function convertColor() {
  const tl=_colorGetTl(),raw=document.getElementById('cvInput').value.trim(),root=document.getElementById('toolBody'),panel=document.getElementById('cvResultPanel');
  root._colorOutput='';
  if(!raw){panel.style.display='none';return;}
  try{
    const data=KCompute.color.convert(raw,{to:'hex'}),f=data.formats;root._colorOutput=JSON.stringify(data,null,2);
    document.getElementById('cvPreview').style.background=f.rgba;document.getElementById('cvPicker').value=f.hexRGB;
    document.getElementById('cvLuminance').textContent='Alpha: '+data.a;
    const rows=[['HEX',f.hex],['RGB',f.rgb],['RGBA',f.rgba],['HSL',f.hsl],['HSV',f.hsv],['CMYK',f.cmyk],['CSS var','--color: '+f.hex+';']];
    const out=document.getElementById('cvResults');out.replaceChildren();
    for(const [label,value] of rows){const row=document.createElement('div');row.className='result-row';row.style.cssText='display:flex;gap:10px;margin-bottom:6px;align-items:center;flex-wrap:wrap';const name=document.createElement('span');name.textContent=label;name.style.width='72px';const code=document.createElement('code');code.textContent=value;code.style.cssText='flex:1;overflow-wrap:anywhere;min-width:120px';const copy=document.createElement('button');copy.className='copy-inline';copy.textContent=tl('copy');copy.onclick=()=>copyText(value,copy);row.append(name,code,copy);out.append(row);}
    if(data.a<1){const note=document.createElement('p');note.textContent=getCurrentLang()==='en'?'HEX / RGB / HSL retain alpha; HSV / CMYK describe the color channels only.':'HEX / RGB / HSL 保留透明度；HSV / CMYK 仅表示颜色通道。';out.append(note);}
    panel.style.display='';return {success:true,data};
  }catch(e){panel.style.display='';document.getElementById('cvPreview').style.background='transparent';document.getElementById('cvLuminance').textContent='';document.getElementById('cvResults').textContent=e.message;return {success:false,error:e.message};}
}
function _hslToRgb(h,s,l){return KCompute.color.hsl(h,s,l);}
function _rgbToHsl(r,g,b){return KCompute.color.rgbHsl(r,g,b);}
function _rgbToHsv(r,g,b){return KCompute.color.rgbHsv(r,g,b);}
function _rgbToCmyk(r,g,b){return KCompute.color.rgbCmyk(r,g,b);}

/* ============================================================
   Tab 3: Contrast
   IDs kept as-is: ccFg, ccBg, ccRatio, ccNAA, ccNAAA, ccLAA, ccLAAA, ccPreview→ccContrastPreview, ccSample, ccSampleLg
   Note: ccPreview renamed to ccContrastPreview to avoid conflict with cvPreview (no conflict but clarity)
   ============================================================ */
var _ccListenersAttached = false;

function _resetContrastListeners() { _ccListenersAttached = false; }

function _colorRenderContrast() {
  var tl = _colorGetTl();
  _resetContrastListeners();
  var panel = document.getElementById('colorPanelContrast');
  panel.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${tl('wcag_title')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${tl('fg_label')}</label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="ccFg" value="#ffffff" style="width:44px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none;padding:0">
            <input class="tool-input" id="ccFgHex" value="#ffffff" style="flex:1;font-family:monospace" oninput="_ccSyncFromHex('fg')">
          </div>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${tl('bg_label')}</label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="ccBg" value="#1a1a2e" style="width:44px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none;padding:0">
            <input class="tool-input" id="ccBgHex" value="#1a1a2e" style="flex:1;font-family:monospace" oninput="_ccSyncFromHex('bg')">
          </div>
        </div>
      </div>
      <div id="ccContrastPreview" style="border-radius:12px;padding:20px 24px;margin-bottom:14px;border:1px solid var(--glass-border);text-align:center">
        <div id="ccSample" style="font-size:18px;font-weight:600;margin-bottom:6px">The quick brown fox jumps over the lazy dog</div>
        <div id="ccSampleLg" style="font-size:13px;opacity:0.7">Large text sample (18pt / 14pt bold)</div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('contrast_result')}</div>
      <div style="text-align:center;margin-bottom:18px">
        <div id="ccRatio" style="font-size:40px;font-weight:800;color:var(--neon)">—</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${tl('contrast_ratio_label')}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:14px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;font-weight:600">${tl('normal_text_label')}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span id="ccNAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AA</span>
            <span id="ccNAAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AAA</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">AA ≥ 4.5 : 1 &nbsp; AAA ≥ 7 : 1</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:14px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;font-weight:600">${tl('large_text_label')}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span id="ccLAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AA</span>
            <span id="ccLAAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AAA</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">AA ≥ 3 : 1 &nbsp; AAA ≥ 4.5 : 1</div>
        </div>
      </div>
    </div>`;
}

function _ccInitListeners() {
  if (_ccListenersAttached) return;
  var fg = document.getElementById('ccFg');
  var bg = document.getElementById('ccBg');
  if (!fg || !bg) return;
  fg.addEventListener('input', _ccUpdate);
  bg.addEventListener('input', _ccUpdate);
  _ccListenersAttached = true;
}

function _ccRelLum(hex) { return KCompute.color.luminance(KCompute.color.parse(hex)); }

function _ccBadge(el, pass) {
  el.textContent = el.textContent.split(' ')[0] + (pass ? ' PASS' : ' FAIL');
  el.style.background = pass ? 'rgba(0,200,100,0.18)' : 'rgba(255,60,60,0.15)';
  el.style.color = pass ? '#00c864' : '#ff4444';
  el.style.border = pass ? '1px solid rgba(0,200,100,0.35)' : '1px solid rgba(255,60,60,0.3)';
}

function _ccUpdate() {
  var fgEl = document.getElementById('ccFg');
  var bgEl = document.getElementById('ccBg');
  if (!fgEl || !bgEl) return;
  const fg = fgEl.value;
  const bg = bgEl.value;
  document.getElementById('ccFgHex').value = fg;
  document.getElementById('ccBgHex').value = bg;
  const preview = document.getElementById('ccContrastPreview');
  preview.style.background = bg;
  document.getElementById('ccSample').style.color = fg;
  document.getElementById('ccSampleLg').style.color = fg;
  const L1 = _ccRelLum(fg), L2 = _ccRelLum(bg);
  const ratio = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
  document.getElementById('ccRatio').textContent = ratio.toFixed(2) + ' : 1';
  _ccBadge(document.getElementById('ccNAA'),  ratio >= 4.5);
  _ccBadge(document.getElementById('ccNAAA'), ratio >= 7);
  _ccBadge(document.getElementById('ccLAA'),  ratio >= 3);
  _ccBadge(document.getElementById('ccLAAA'), ratio >= 4.5);
  return {success:true,data:{ratio,aa:ratio>=4.5,aaa:ratio>=7,aaLarge:ratio>=3}};
}

function _ccSyncFromHex(which) {
  try {
    const colors=['fg','bg'].map(key=>KCompute.color.parse(document.getElementById(key==='fg'?'ccFgHex':'ccBgHex').value,'hex'));
    if(colors.some(c=>c.a!==1))throw new Error(getCurrentLang()==='en'?'Choose opaque colors for contrast':'对比度计算请选择不透明颜色');
    document.getElementById('ccFg').value=KCompute.color.formats(colors[0]).hex;
    document.getElementById('ccBg').value=KCompute.color.formats(colors[1]).hex;
    return _ccUpdate();
  }catch(e){document.getElementById('ccRatio').textContent=e.message;for(const id of ['ccNAA','ccNAAA','ccLAA','ccLAAA'])_ccBadge(document.getElementById(id),false);return {success:false,error:e.message};}
}

/* Backward-compat: expose for agent actions that call window._ccUpdate / window._ccSyncFromHex */
window._ccUpdate = _ccUpdate;
window._ccSyncFromHex = _ccSyncFromHex;

/* === Wrapper render functions for backward compat with dashboard.js === */
async function renderColorConvert(el) {
  await renderColor(el);
  colorSwitchTab('convert');
}

async function renderColorContrast(el) {
  await renderColor(el);
  colorSwitchTab('contrast');
}
