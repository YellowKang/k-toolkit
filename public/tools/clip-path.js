window.renderClipPath = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">CSS clip-path 生成器</div>
        <div style="display:flex;gap:8px">
          <select id="cpShape" class="tool-input" style="width:auto;font-size:12px" onchange="_cpRender()">
            <option value="polygon">多边形 Polygon</option>
            <option value="circle">圆形 Circle</option>
            <option value="ellipse">椭圆 Ellipse</option>
            <option value="inset">内嵌 Inset</option>
          </select>
          <button class="btn btn-secondary" onclick="_cpReset()">重置</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-weight:600">预览（拖拽控制点）</div>
          <div style="position:relative;width:100%;aspect-ratio:1;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:12px;overflow:hidden;touch-action:none" id="cpCanvas">
            <div id="cpShape" style="position:absolute;inset:0;background:linear-gradient(135deg,var(--accent),var(--accent-blue));transition:clip-path 0.15s"></div>
            <svg id="cpSvg" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" id="cpSvgEl"></svg>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div id="cpControls" style="display:flex;flex-direction:column;gap:8px;flex:1;overflow-y:auto;max-height:280px"></div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">生成代码</div>
            <div style="position:relative">
              <pre class="result-box" id="cpOutput" style="margin:0;font-size:12px;padding:10px 40px 10px 12px;min-height:48px"></pre>
              <button class="btn btn-secondary" onclick="_cpCopy(this)" style="position:absolute;right:6px;top:6px;padding:2px 8px;font-size:11px">复制</button>
            </div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">背景色</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-secondary" style="font-size:11px;padding:3px 10px" onclick="_cpBg('linear-gradient(135deg,var(--accent),var(--accent-blue))')">渐变</button>
              <button class="btn btn-secondary" style="font-size:11px;padding:3px 10px" onclick="_cpBg('var(--accent)')">纯色</button>
              <button class="btn btn-secondary" style="font-size:11px;padding:3px 10px" onclick="_cpBg('url(https://picsum.photos/300/300)')">图片</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  _cpInit();
};

const _CP_PRESETS = {
  polygon: [[50,0],[100,38],[82,100],[18,100],[0,38]],
  circle:  null,
  ellipse: null,
  inset:   null
};

let _cpPts = [], _cpMode = 'polygon', _cpDrag = -1;

function _cpInit() {
  _cpMode = 'polygon';
  document.getElementById('cpShape').value = 'polygon';
  _cpPts = _CP_PRESETS.polygon.map(p => [...p]);
  _cpRenderControls();
  _cpUpdate();
  _cpBindCanvas();
}

function _cpReset() {
  _cpMode = document.getElementById('cpShape').value;
  if (_cpMode === 'polygon') _cpPts = _CP_PRESETS.polygon.map(p=>[...p]);
  _cpRenderControls();
  _cpUpdate();
}

function _cpRender() {
  _cpMode = document.getElementById('cpShape').value;
  if (_cpMode === 'polygon') {
    _cpPts = _CP_PRESETS.polygon.map(p=>[...p]);
  }
  _cpRenderControls();
  _cpUpdate();
}

function _cpRenderControls() {
  const box = document.getElementById('cpControls');
  if (!box) return;
  if (_cpMode !== 'polygon') {
    box.innerHTML = _cpNonPolyControls();
    return;
  }
  box.innerHTML = _cpPts.map((p,i) => `
    <div style="display:flex;align-items:center;gap:6px">
      <span style="font-size:11px;color:var(--text-muted);width:18px">P${i+1}</span>
      <input type="range" min="0" max="100" value="${p[0]}" style="flex:1" oninput="_cpPts[${i}][0]=+this.value;_cpUpdate()" title="X">
      <span style="font-size:11px;color:var(--text-muted);width:22px">${p[0]}%</span>
      <input type="range" min="0" max="100" value="${p[1]}" style="flex:1" oninput="_cpPts[${i}][1]=+this.value;_cpUpdate()" title="Y">
      <span style="font-size:11px;color:var(--text-muted);width:22px">${p[1]}%</span>
      <button onclick="_cpRemovePt(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:14px;padding:0 2px">×</button>
    </div>`).join('') +
    `<button class="btn btn-secondary" style="font-size:11px;margin-top:4px" onclick="_cpAddPt()">+ 添加点</button>`;
}

function _cpNonPolyControls() {
  if (_cpMode === 'circle') {
    return `<div style="display:flex;flex-direction:column;gap:8px">
      <label style="font-size:12px">半径 <span id="cpCR">50</span>%
        <input type="range" min="5" max="80" value="50" id="cpCRv" style="width:100%" oninput="document.getElementById('cpCR').textContent=this.value;_cpUpdate()">
      </label>
      <label style="font-size:12px">中心 X <span id="cpCX">50</span>%
        <input type="range" min="0" max="100" value="50" id="cpCXv" style="width:100%" oninput="document.getElementById('cpCX').textContent=this.value;_cpUpdate()">
      </label>
      <label style="font-size:12px">中心 Y <span id="cpCY">50</span>%
        <input type="range" min="0" max="100" value="50" id="cpCYv" style="width:100%" oninput="document.getElementById('cpCY').textContent=this.value;_cpUpdate()">
      </label>
    </div>`;
  }
  if (_cpMode === 'ellipse') {
    return `<div style="display:flex;flex-direction:column;gap:8px">
      <label style="font-size:12px">X半径 <span id="cpERx">50</span>%
        <input type="range" min="5" max="80" value="50" id="cpERxv" style="width:100%" oninput="document.getElementById('cpERx').textContent=this.value;_cpUpdate()">
      </label>
      <label style="font-size:12px">Y半径 <span id="cpERy">35</span>%
        <input type="range" min="5" max="80" value="35" id="cpERyv" style="width:100%" oninput="document.getElementById('cpERy').textContent=this.value;_cpUpdate()">
      </label>
    </div>`;
  }
  if (_cpMode === 'inset') {
    return ['上','右','下','左'].map((d,i) => {
      const ids = ['IT','IR','IB','IL'];
      return `<label style="font-size:12px">${d} <span id="cp${ids[i]}">10</span>%
        <input type="range" min="0" max="50" value="10" id="cp${ids[i]}v" style="width:100%" oninput="document.getElementById('cp${ids[i]}').textContent=this.value;_cpUpdate()">
      </label>`;
    }).join('');
  }
  return '';
}

function _cpUpdate() {
  const shapeEl = document.querySelector('#cpCanvas #cpShape');
  const svg = document.getElementById('cpSvgEl');
  const out = document.getElementById('cpOutput');
  if (!shapeEl || !out) return;
  let css = '';
  if (_cpMode === 'polygon') {
    const pts = _cpPts.map(p => `${p[0]}% ${p[1]}%`).join(', ');
    css = `clip-path: polygon(${pts});`;
    shapeEl.style.clipPath = `polygon(${pts})`;
    if (svg) {
      const pStr = _cpPts.map(p=>`${p[0]},${p[1]}`).join(' ');
      svg.innerHTML = `<polygon points="${pStr}" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" vector-effect="non-scaling-stroke" style="transform:scale(0.01) translate(0,0);transform-box:fill-box"/>`
      + _cpPts.map((p,i)=>`<circle cx="${p[0]}%" cy="${p[1]}%" r="5" fill="white" fill-opacity="0.8" stroke="var(--accent)" stroke-width="1.5" style="cursor:pointer" data-idx="${i}"/>`).join('');
    }
  } else if (_cpMode === 'circle') {
    const r  = document.getElementById('cpCRv')?.value  || 50;
    const cx = document.getElementById('cpCXv')?.value || 50;
    const cy = document.getElementById('cpCYv')?.value || 50;
    css = `clip-path: circle(${r}% at ${cx}% ${cy}%);`;
    shapeEl.style.clipPath = `circle(${r}% at ${cx}% ${cy}%)`;
    if (svg) svg.innerHTML = `<ellipse cx="${cx}%" cy="${cy}%" rx="${r}%" ry="${r}%" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;
  } else if (_cpMode === 'ellipse') {
    const rx = document.getElementById('cpERxv')?.value || 50;
    const ry = document.getElementById('cpERyv')?.value || 35;
    css = `clip-path: ellipse(${rx}% ${ry}% at 50% 50%);`;
    shapeEl.style.clipPath = `ellipse(${rx}% ${ry}% at 50% 50%)`;
    if (svg) svg.innerHTML = `<ellipse cx="50%" cy="50%" rx="${rx}%" ry="${ry}%" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;
  } else if (_cpMode === 'inset') {
    const t = document.getElementById('cpITv')?.value || 10;
    const r = document.getElementById('cpIRv')?.value || 10;
    const b = document.getElementById('cpIBv')?.value || 10;
    const l = document.getElementById('cpILv')?.value || 10;
    css = `clip-path: inset(${t}% ${r}% ${b}% ${l}%);`;
    shapeEl.style.clipPath = `inset(${t}% ${r}% ${b}% ${l}%)`;
    if (svg) svg.innerHTML = `<rect x="${l}%" y="${t}%" width="${100-+l-+r}%" height="${100-+t-+b}%" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1"/>`;
  }
  out.textContent = css;
}

function _cpAddPt() {
  _cpPts.push([50, 50]);
  _cpRenderControls();
  _cpUpdate();
}

function _cpRemovePt(i) {
  if (_cpPts.length <= 3) return;
  _cpPts.splice(i, 1);
  _cpRenderControls();
  _cpUpdate();
}

function _cpBg(bg) {
  const el = document.querySelector('#cpCanvas #cpShape');
  if (el) el.style.background = bg;
}

function _cpCopy(btn) {
  const text = document.getElementById('cpOutput').textContent;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '已复制';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function _cpBindCanvas() {
  const canvas = document.getElementById('cpCanvas');
  if (!canvas) return;
  canvas.addEventListener('pointerdown', e => {
    if (_cpMode !== 'polygon') return;
    const dot = e.target.closest('[data-idx]');
    if (dot) { _cpDrag = +dot.dataset.idx; canvas.setPointerCapture(e.pointerId); }
  });
  canvas.addEventListener('pointermove', e => {
    if (_cpDrag < 0 || _cpMode !== 'polygon') return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100)));
    const y = Math.round(Math.max(0, Math.min(100, (e.clientY - rect.top)  / rect.height * 100)));
    _cpPts[_cpDrag] = [x, y];
    _cpRenderControls();
    _cpUpdate();
  });
  canvas.addEventListener('pointerup', () => { _cpDrag = -1; });
}
