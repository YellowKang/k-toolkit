function renderSvgPreview(container) {
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;height:500px">
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:12px;color:var(--text-muted)">SVG 代码</div>
          <div style="display:flex;gap:6px">
            <button id="svg-sample" style="padding:4px 10px;border:1px solid var(--glass-border);background:none;border-radius:6px;color:var(--text-muted);font-size:12px;cursor:pointer">示例</button>
            <button id="svg-clear" style="padding:4px 10px;border:1px solid var(--glass-border);background:none;border-radius:6px;color:var(--text-muted);font-size:12px;cursor:pointer">清空</button>
            <button id="svg-copy" style="padding:4px 10px;border:1px solid var(--glass-border);background:none;border-radius:6px;color:var(--text);font-size:12px;cursor:pointer">复制</button>
          </div>
        </div>
        <textarea id="svg-input" style="flex:1;resize:none;
          background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);
          border-radius:10px;padding:12px;color:var(--text);font-size:12px;
          font-family:monospace;line-height:1.5" placeholder="粘贴 SVG 代码..."></textarea>
        <div id="svg-info" style="font-size:11px;color:var(--text-muted);min-height:16px"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:12px;color:var(--text-muted)">预览</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;color:var(--text-muted)">缩放</span>
            <input type="range" id="svg-scale" min="10" max="300" value="100" style="width:80px">
            <span id="svg-scale-val" style="font-size:12px;color:var(--accent);min-width:36px">100%</span>
          </div>
        </div>
        <div id="svg-bg-toggle" style="display:flex;gap:6px;margin-bottom:2px">
          <button data-bg="checker" style="padding:3px 8px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:#fff;font-size:11px;cursor:pointer">格子</button>
          <button data-bg="white" style="padding:3px 8px;border-radius:6px;border:1px solid var(--glass-border);background:none;color:var(--text-muted);font-size:11px;cursor:pointer">白色</button>
          <button data-bg="black" style="padding:3px 8px;border-radius:6px;border:1px solid var(--glass-border);background:none;color:var(--text-muted);font-size:11px;cursor:pointer">黑色</button>
        </div>
        <div id="svg-preview-box" style="flex:1;
          background:repeating-conic-gradient(rgba(128,128,128,0.1) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px;
          border:1px solid var(--glass-border);border-radius:10px;
          overflow:auto;display:flex;align-items:center;justify-content:center;padding:16px">
          <div style="color:var(--text-muted);font-size:13px">预览区域</div>
        </div>
      </div>
    </div>
  `;

  const input = container.querySelector('#svg-input');
  const preview = container.querySelector('#svg-preview-box');
  const info = container.querySelector('#svg-info');
  const scaleInput = container.querySelector('#svg-scale');
  const scaleVal = container.querySelector('#svg-scale-val');
  let scale = 1;

  const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <circle cx="60" cy="60" r="50" fill="url(#g)"/>
  <text x="60" y="66" text-anchor="middle" fill="white" font-size="16" font-family="sans-serif">SVG</text>
</svg>`;

  function render() {
    const code = input.value.trim();
    if (!code) {
      preview.innerHTML = '<div style="color:var(--text-muted);font-size:13px">预览区域</div>';
      info.textContent = '';
      return;
    }
    if (!code.includes('<svg')) {
      preview.innerHTML = '<div style="color:#ef4444;font-size:13px">不是有效的 SVG</div>';
      info.textContent = '';
      return;
    }
    const wrapper = document.createElement('div');
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.transformOrigin = 'center center';
    wrapper.innerHTML = code;
    const svgEl = wrapper.querySelector('svg');
    if (svgEl) {
      const w = svgEl.getAttribute('width') || svgEl.viewBox?.baseVal?.width || '?';
      const h = svgEl.getAttribute('height') || svgEl.viewBox?.baseVal?.height || '?';
      info.textContent = `尺寸: ${w} × ${h}px`;
    }
    preview.innerHTML = '';
    preview.appendChild(wrapper);
  }

  input.oninput = render;

  scaleInput.oninput = () => {
    scale = scaleInput.value / 100;
    scaleVal.textContent = scaleInput.value + '%';
    render();
  };

  container.querySelector('#svg-sample').onclick = () => { input.value = SAMPLE; render(); };
  container.querySelector('#svg-clear').onclick = () => { input.value = ''; render(); };
  container.querySelector('#svg-copy').onclick = () => {
    if (!input.value) return;
    navigator.clipboard.writeText(input.value);
    const btn = container.querySelector('#svg-copy');
    const orig = btn.textContent;
    btn.textContent = '已复制!';
    setTimeout(() => btn.textContent = orig, 1500);
  };

  container.querySelectorAll('#svg-bg-toggle button').forEach(btn => {
    btn.onclick = () => {
      container.querySelectorAll('#svg-bg-toggle button').forEach(b => {
        b.style.background = 'none'; b.style.borderColor = 'var(--glass-border)'; b.style.color = 'var(--text-muted)';
      });
      btn.style.background = 'var(--accent)'; btn.style.borderColor = 'var(--accent)'; btn.style.color = '#fff';
      const bg = btn.dataset.bg;
      preview.style.background = bg === 'checker'
        ? 'repeating-conic-gradient(rgba(128,128,128,0.1) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px'
        : bg === 'white' ? '#fff' : '#000';
    };
  });
}
