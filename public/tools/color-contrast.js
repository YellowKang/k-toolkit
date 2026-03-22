window.renderColorContrast = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">色彩对比度检测 (WCAG)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">前景色 (Foreground)</label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="ccFg" value="#ffffff" style="width:44px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none;padding:0">
            <input class="tool-input" id="ccFgHex" value="#ffffff" style="flex:1;font-family:monospace" oninput="_ccSyncFromHex('fg')">
          </div>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">背景色 (Background)</label>
          <div style="display:flex;align-items:center;gap:8px">
            <input type="color" id="ccBg" value="#1a1a2e" style="width:44px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none;padding:0">
            <input class="tool-input" id="ccBgHex" value="#1a1a2e" style="flex:1;font-family:monospace" oninput="_ccSyncFromHex('bg')">
          </div>
        </div>
      </div>
      <div id="ccPreview" style="border-radius:12px;padding:20px 24px;margin-bottom:14px;border:1px solid var(--glass-border);text-align:center">
        <div id="ccSample" style="font-size:18px;font-weight:600;margin-bottom:6px">The quick brown fox jumps over the lazy dog</div>
        <div id="ccSampleLg" style="font-size:13px;opacity:0.7">Large text sample (18pt / 14pt bold)</div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">对比度结果</div>
      <div style="text-align:center;margin-bottom:18px">
        <div id="ccRatio" style="font-size:40px;font-weight:800;color:var(--neon)">—</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:4px">对比度比值 (Contrast Ratio)</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:14px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;font-weight:600">普通文字 (Normal Text)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span id="ccNAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AA</span>
            <span id="ccNAAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AAA</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">AA ≥ 4.5 : 1 &nbsp; AAA ≥ 7 : 1</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:14px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px;font-weight:600">大号文字 (Large Text)</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span id="ccLAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AA</span>
            <span id="ccLAAA" style="padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700">AAA</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px">AA ≥ 3 : 1 &nbsp; AAA ≥ 4.5 : 1</div>
        </div>
      </div>
    </div>`;

  function _ccRelLum(hex) {
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    const lin = v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
    return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
  }

  function _ccBadge(el, pass) {
    el.textContent = el.textContent.split(' ')[0] + (pass ? ' PASS' : ' FAIL');
    el.style.background = pass ? 'rgba(0,200,100,0.18)' : 'rgba(255,60,60,0.15)';
    el.style.color = pass ? '#00c864' : '#ff4444';
    el.style.border = pass ? '1px solid rgba(0,200,100,0.35)' : '1px solid rgba(255,60,60,0.3)';
  }

  window._ccUpdate = function() {
    const fg = document.getElementById('ccFg').value;
    const bg = document.getElementById('ccBg').value;
    document.getElementById('ccFgHex').value = fg;
    document.getElementById('ccBgHex').value = bg;
    const preview = document.getElementById('ccPreview');
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
  };

  window._ccSyncFromHex = function(which) {
    const hexEl = document.getElementById(which === 'fg' ? 'ccFgHex' : 'ccBgHex');
    const pickerEl = document.getElementById(which === 'fg' ? 'ccFg' : 'ccBg');
    const val = hexEl.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) { pickerEl.value = val; window._ccUpdate(); }
  };

  document.getElementById('ccFg').addEventListener('input', window._ccUpdate);
  document.getElementById('ccBg').addEventListener('input', window._ccUpdate);
  window._ccUpdate();
};
