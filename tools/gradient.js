const GRAD_PRESETS = [
{ name:'日落',   colors:['#ff512f','#f09819'], angle:135 },
{ name:'极光',   colors:['#00c6ff','#0072ff','#1a1a8c'], angle:135 },
{ name:'樱花',   colors:['#fbc2eb','#a6c1ee'], angle:120 },
{ name:'海洋',   colors:['#2193b0','#6dd5ed'], angle:90 },
{ name:'火焰',   colors:['#f12711','#f5af19'], angle:45 },
{ name:'薰衣草', colors:['#e8cbc0','#636fa4'], angle:135 },
{ name:'糖果',   colors:['#ff9a9e','#fecfef','#fdfbfb'], angle:135 },
{ name:'森林',   colors:['#11998e','#38ef7d'], angle:120 },
{ name:'星空',   colors:['#0f0c29','#302b63','#24243e'], angle:180 },
{ name:'柠檬',   colors:['#f7ff00','#db36a4'], angle:90 },
{ name:'深海',   colors:['#1a2980','#26d0ce'], angle:135 },
{ name:'蜜桃',   colors:['#ed6ea0','#ec8c69'], angle:120 },
{ name:'极夜',   colors:['#232526','#414345'], angle:180 },
{ name:'彩虹',   colors:['#ff0000','#ff7700','#ffff00','#00ff00','#0000ff','#8b00ff'], angle:90 },
{ name:'薄荷',   colors:['#00b09b','#96c93d'], angle:135 },
{ name:'玫瑰',   colors:['#ee9ca7','#ffdde1'], angle:135 },
{ name:'午夜',   colors:['#0f2027','#203a43','#2c5364'], angle:135 },
{ name:'阳光',   colors:['#f6d365','#fda085'], angle:120 },
{ name:'冰川',   colors:['#e6dada','#274046'], angle:135 },
{ name:'霓虹',   colors:['#12c2e9','#c471ed','#f64f59'], angle:135 },
];
let _gradStops = [];
function renderGradient(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">渐变设置</div>
<button class="btn btn-secondary" onclick="gradRandom()">随机</button>
</div>
<div style="margin-bottom:14px">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:7px">预设模板</div>
<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px">
${GRAD_PRESETS.map((p,i) => `<button onclick="gradApplyPreset(${i})" style="flex-shrink:0;width:48px;height:28px;border-radius:8px;border:1px solid var(--glass-border);cursor:pointer;background:linear-gradient(135deg, ${p.colors.join(',')})" title="${p.name}"></button>`).join('')}
</div>
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
<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
<button class="btn btn-secondary" id="gradAnimToggle" onclick="gradToggleAnim()" style="font-size:12px">▶ 动画</button>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">CSS 代码</div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('gradCode').textContent,this)">复制</button>
</div>
<pre class="result-box" id="gradCode" style="white-space:pre-wrap"></pre>
<div style="margin-top:10px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<div style="font-size:11px;color:var(--text-muted)">Tailwind CSS</div>
<button class="btn btn-secondary" style="padding:2px 8px;font-size:11px" onclick="copyText(document.getElementById('gradTailwind').textContent,this)">复制</button>
</div>
<pre class="result-box" id="gradTailwind" style="white-space:pre-wrap;font-size:12px"></pre>
</div>
</div>`;
_gradStops = [
{color:'#667eea',pos:0},
{color:'#f093fb',pos:100},
];
gradRenderStops();
gradUpdate();
}
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
_gradStops.forEach((s,i) => {
const el = document.getElementById('gsc'+i);
if (el) el.textContent = s.color.toUpperCase();
});
const twEl = document.getElementById('gradTailwind');
if (twEl) {
if (type === 'linear' && sorted.length >= 2) {
const angleMap = {0:'to-t',45:'to-tr',90:'to-r',135:'to-br',180:'to-b',225:'to-bl',270:'to-l',315:'to-tl'};
const dir = angleMap[+angle] || 'to-r';
let tw = `bg-gradient-${dir} from-[${sorted[0].color}]`;
if (sorted.length === 3) tw += ` via-[${sorted[1].color}]`;
if (sorted.length >= 2) tw += ` to-[${sorted[sorted.length-1].color}]`;
twEl.textContent = tw;
} else {
twEl.textContent = '
}
}
}
function gradApplyPreset(i) {
const p = GRAD_PRESETS[i];
_gradStops = p.colors.map((c,j) => ({color:c, pos:Math.round(j/(p.colors.length-1)*100)}));
const angle = document.getElementById('gradAngle');
if (angle) { angle.value = p.angle; document.getElementById('gradAngleVal').textContent = p.angle; }
gradRenderStops(); gradUpdate();
}
function gradToggleAnim() {
const preview = document.getElementById('gradPreview');
const btn = document.getElementById('gradAnimToggle');
if (!preview) return;
const isAnimating = preview.style.animation;
if (isAnimating) {
preview.style.animation = '';
btn.textContent = '▶ 动画';
} else {
if (!document.getElementById('gradAnimStyle')) {
const s = document.createElement('style');
s.id = 'gradAnimStyle';
s.textContent = '@keyframes gradSpin{to{filter:hue-rotate(360deg)}}';
document.head.appendChild(s);
}
preview.style.animation = 'gradSpin 3s linear infinite';
btn.textContent = '⏸ 停止';
}
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