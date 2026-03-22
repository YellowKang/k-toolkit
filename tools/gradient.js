function renderGradient(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">渐变设置</div>
        <button class="btn btn-secondary" onclick="gradRandom()">随机</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:14px">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">类型</div>
          <select class="tool-input" id="gradType" onchange="gradUpdate()">
            <option value="linear">linear-gradient</option>
            <option value="radial">radial-gradient</option>
            <option value="conic">conic-gradient</option>
          </select>
        </div>
        <div id="gradAngleWrap">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">角度 <span id="gradAngleVal">135</span>°</div>
          <input type="range" id="gradAngle" min="0" max="360" value="135" oninput="document.getElementById('gradAngleVal').textContent=this.value;gradUpdate()">
        </div>
      </div>
      <div id="gradStops" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px"></div>
      <button class="btn btn-secondary" onclick="gradAddStop()" style="font-size:12px">+ 添加色标</button>
    </div>
    <div class="tool-card-panel">
      <div style="height:120px;border-radius:12px;margin-bottom:14px;border:1px solid var(--glass-border);transition:all 0.3s" id="gradPreview"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">CSS 代码</div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('gradCode').textContent,this)">复制</button>
      </div>
      <pre class="result-box" id="gradCode" style="white-space:pre-wrap"></pre>
    </div>`;

  // 初始化两个色标
  _gradStops = [
    {color:'#667eea',pos:0},
    {color:'#f093fb',pos:100},
  ];
  gradRenderStops();
  gradUpdate();
}

let _gradStops = [];

function gradRenderStops() {
  const container = document.getElementById('gradStops');
  container.innerHTML = _gradStops.map((s,i) => `
    <div style="display:flex;align-items:center;gap:10px">
      <input type="color" value="${s.color}" style="width:40px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" oninput="_gradStops[${i}].color=this.value;gradUpdate()">
      <span style="font-family:monospace;font-size:13px;color:var(--neon);min-width:56px" id="gsc${i}">${s.color.toUpperCase()}</span>
      <div style="flex:1">
        <input type="range" min="0" max="100" value="${s.pos}" style="width:100%" oninput="_gradStops[${i}].pos=+this.value;document.getElementById('gsp${i}').textContent=this.value+'%';gradUpdate()">
      </div>
      <span style="font-size:12px;color:var(--text-muted);min-width:36px" id="gsp${i}">${s.pos}%</span>
      ${_gradStops.length>2?`<button class="copy-inline" onclick="gradRemoveStop(${i})">✕</button>`:'<span style="width:28px"></span>'}
    </div>`).join('');
}

function gradUpdate() {
  const type   = document.getElementById('gradType').value;
  const angle  = document.getElementById('gradAngle').value;
  const angleWrap = document.getElementById('gradAngleWrap');
  if (angleWrap) angleWrap.style.display = type==='radial' ? 'none' : '';
  const sorted = [..._gradStops].sort((a,b)=>a.pos-b.pos);
  const stops  = sorted.map(s => `${s.color} ${s.pos}%`).join(', ');
  let grad;
  if (type==='linear')      grad = `linear-gradient(${angle}deg, ${stops})`;
  else if (type==='radial') grad = `radial-gradient(circle, ${stops})`;
  else                      grad = `conic-gradient(from ${angle}deg, ${stops})`;
  const preview = document.getElementById('gradPreview');
  const code    = document.getElementById('gradCode');
  if (preview) preview.style.background = grad;
  if (code) code.textContent = `background: ${grad};\nbackground-image: ${grad};`;
  // update color hex displays
  _gradStops.forEach((s,i) => {
    const el = document.getElementById('gsc'+i);
    if (el) el.textContent = s.color.toUpperCase();
  });
}

function gradAddStop() {
  _gradStops.push({color:'#'+(Math.random()*0xFFFFFF|0).toString(16).padStart(6,'0'),pos:50});
  gradRenderStops(); gradUpdate();
}

function gradRemoveStop(i) {
  _gradStops.splice(i,1); gradRenderStops(); gradUpdate();
}

function gradRandom() {
  const n = 2 + Math.floor(Math.random()*3);
  _gradStops = Array.from({length:n},(_,i)=>({
    color:'#'+(Math.random()*0xFFFFFF|0).toString(16).padStart(6,'0'),
    pos: Math.round(i/(n-1)*100)
  }));
  const angle = document.getElementById('gradAngle');
  if (angle) { angle.value=Math.floor(Math.random()*360); document.getElementById('gradAngleVal').textContent=angle.value; }
  gradRenderStops(); gradUpdate();
}
