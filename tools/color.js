function renderColor(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">配色方案</div>
        <div style="display:flex;gap:10px">
          <select class="control-select" id="colorScheme" style="font-size:13px">
            <option value="random">随机</option>
            <option value="analogous">类比色</option>
            <option value="complement">互补色</option>
            <option value="triadic">三角色</option>
          </select>
          <button class="btn btn-primary" onclick="generateColors()">生成</button>
        </div>
      </div>
      <div class="color-palette" id="colorPalette"></div>
    </div>
    <div class="tool-card-panel" id="colorDetail" style="display:none">
      <div class="panel-label">颜色详情</div>
      <div id="colorDetailContent"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:14px">WCAG 对比度检查</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
        <div style="flex:1;min-width:120px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">前景色</div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="wcagFg" value="#ffffff" oninput="_wcagUpdate()" style="width:40px;height:36px;border:1px solid var(--glass-border);border-radius:8px;cursor:pointer;background:none;padding:2px">
            <input class="tool-input" id="wcagFgHex" value="#ffffff" oninput="_wcagHexInput('fg')" style="font-family:monospace;width:90px">
          </div>
        </div>
        <div style="flex:1;min-width:120px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">背景色</div>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="wcagBg" value="#1a1a2e" oninput="_wcagUpdate()" style="width:40px;height:36px;border:1px solid var(--glass-border);border-radius:8px;cursor:pointer;background:none;padding:2px">
            <input class="tool-input" id="wcagBgHex" value="#1a1a2e" oninput="_wcagHexInput('bg')" style="font-family:monospace;width:90px">
          </div>
        </div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">预览</div>
          <div id="wcagPreview" style="padding:8px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid var(--glass-border);text-align:center">Aa 示例文字</div>
        </div>
      </div>
      <div id="wcagRatioRow" style="margin-bottom:14px">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">对比度比值</div>
        <div id="wcagRatio" style="font-size:28px;font-weight:700;font-family:monospace;color:var(--neon)">—</div>
      </div>
      <div id="wcagBadges" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px"></div>
    </div>`;
  generateColors();
  _wcagUpdate();
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => { const k=(n+h/30)%12; const c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0'); };
  return '#'+f(0)+f(8)+f(4);
}

function hexToRgb(hex) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return {r,g,b};
}

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
  const {r,g,b} = hexToRgb(hex);
  document.getElementById('colorDetail').style.display = '';
  document.getElementById('colorDetailContent').innerHTML = `
    <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
      <div style="width:80px;height:80px;border-radius:12px;background:${hex};box-shadow:0 4px 12px rgba(0,0,0,0.15)"></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="result-row" style="min-width:260px"><span>HEX</span><span style="margin-left:auto;font-weight:600">${hex}</span><button class="copy-inline" onclick="copyText('${hex}',this)">复制</button></div>
        <div class="result-row"><span>RGB</span><span style="margin-left:auto;font-weight:600">rgb(${r}, ${g}, ${b})</span><button class="copy-inline" onclick="copyText('rgb(${r}, ${g}, ${b})',this)">复制</button></div>
      </div>
    </div>`;
}

function _wcagLinearize(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function _wcagLuminance(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  const {r,g,b} = hexToRgb(hex);
  return 0.2126 * _wcagLinearize(r) + 0.7152 * _wcagLinearize(g) + 0.0722 * _wcagLinearize(b);
}

function _wcagContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function _wcagBadge(label, pass) {
  const color  = pass ? '#22c55e' : '#ef4444';
  const bg     = pass ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
  const mark   = pass ? '✓' : '✗';
  return `<div style="padding:10px 14px;border-radius:10px;border:1px solid ${color}44;background:${bg};display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:12px;color:var(--text)">${label}</span>
    <span style="font-size:13px;font-weight:700;color:${color}">${mark} ${pass?'通过':'未通过'}</span>
  </div>`;
}

function _wcagUpdate() {
  const fgPicker = document.getElementById('wcagFg');
  const bgPicker = document.getElementById('wcagBg');
  const fgHex    = document.getElementById('wcagFgHex');
  const bgHex    = document.getElementById('wcagBgHex');
  if (!fgPicker) return;

  // sync hex inputs from pickers
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

  // AA normal ≥4.5, AA large ≥3, AAA normal ≥7, AAA large ≥4.5
  badges.innerHTML =
    _wcagBadge('AA · 普通文字 (≥4.5:1)',  ratio >= 4.5) +
    _wcagBadge('AA · 大号文字 (≥3:1)',    ratio >= 3)   +
    _wcagBadge('AAA · 普通文字 (≥7:1)',   ratio >= 7)   +
    _wcagBadge('AAA · 大号文字 (≥4.5:1)', ratio >= 4.5);
}
