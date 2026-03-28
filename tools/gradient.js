const GRAD_PRESETS = [
{ zh:'日落',     en:'Sunset',     colors:['#ff512f','#f09819'], angle:135 },
{ zh:'极光',     en:'Aurora',     colors:['#00c6ff','#0072ff','#1a1a8c'], angle:135 },
{ zh:'樱花',     en:'Sakura',     colors:['#fbc2eb','#a6c1ee'], angle:120 },
{ zh:'海洋',     en:'Ocean',      colors:['#2193b0','#6dd5ed'], angle:90 },
{ zh:'火焰',     en:'Fire',       colors:['#f12711','#f5af19'], angle:45 },
{ zh:'薰衣草',   en:'Lavender',   colors:['#e8cbc0','#636fa4'], angle:135 },
{ zh:'糖果',     en:'Candy',      colors:['#ff9a9e','#fecfef','#fdfbfb'], angle:135 },
{ zh:'森林',     en:'Forest',     colors:['#11998e','#38ef7d'], angle:120 },
{ zh:'星空',     en:'Starry',     colors:['#0f0c29','#302b63','#24243e'], angle:180 },
{ zh:'柠檬',     en:'Lemon',      colors:['#f7ff00','#db36a4'], angle:90 },
{ zh:'午夜',     en:'Midnight',   colors:['#232526','#414345'], angle:180 },
{ zh:'热带',     en:'Tropical',   colors:['#f83600','#f9d423'], angle:120 },
{ zh:'薄荷',     en:'Mint',       colors:['#00b09b','#96c93d'], angle:135 },
{ zh:'玫瑰',     en:'Rose',       colors:['#ee9ca7','#ffdde1'], angle:135 },
{ zh:'夕阳',     en:'Dusk',       colors:['#2c3e50','#fd746c'], angle:135 },
{ zh:'霓虹',     en:'Neon',       colors:['#12c2e9','#c471ed','#f64f59'], angle:90 },
{ zh:'紫罗兰',   en:'Violet',     colors:['#7f00ff','#e100ff'], angle:135 },
{ zh:'冰川',     en:'Glacier',    colors:['#e6dada','#274046'], angle:180 },
{ zh:'彩虹',     en:'Rainbow',    colors:['#ff0000','#ff8800','#ffff00','#00ff00','#0000ff','#8800ff'], angle:90 },
{ zh:'黑金',     en:'Black Gold', colors:['#1a1a2e','#e2b714'], angle:135 },
];
let _gradStops = [];
function renderGradient(el) {
const tl = makeToolI18n({
zh: {
settings:       '渐变设置',
random:         '随机',
presets:        '预设模板',
type_label:     '类型',
angle_label:    '角度',
add_stop:       '+ 添加色标',
anim_play:      '▶ 动画',
anim_pause:     '⏸ 停止',
css_code:       'CSS 代码',
copy:           '复制',
tailwind_label: 'Tailwind CSS',
tw_unsupported: '// Tailwind 仅支持 linear-gradient 的 2-3 色标',
},
en: {
settings:       'Gradient Settings',
random:         'Random',
presets:        'Presets',
type_label:     'Type',
angle_label:    'Angle',
add_stop:       '+ Add Color Stop',
anim_play:      '▶ Animation',
anim_pause:     '⏸ Stop',
css_code:       'CSS Code',
copy:           'Copy',
tailwind_label: 'Tailwind CSS',
tw_unsupported: '// Tailwind only supports linear-gradient with 2-3 stops',
},
});
window._gradTl = tl;
const lang = getCurrentLang();
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">${tl('settings')}</div>
<button class="btn btn-secondary" onclick="gradRandom()">${tl('random')}</button>
</div>
<div style="margin-bottom:14px">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:7px">${tl('presets')}</div>
<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px" id="gradPresetRow">
${GRAD_PRESETS.map((p,i) => `<button onclick="gradApplyPreset(${i})" style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;cursor:pointer;padding:2px" title="${lang==='en'?p.en:p.zh}">
<span style="display:block;width:48px;height:28px;border-radius:8px;border:1px solid var(--glass-border);background:linear-gradient(${p.angle}deg, ${p.colors.join(',')})"></span>
<span style="font-size:9px;color:var(--text-muted);white-space:nowrap">${lang==='en'?p.en:p.zh}</span>
</button>`).join('')}
</div>
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:14px">
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${tl('type_label')}</div>
<select class="tool-input" id="gradType" onchange="gradUpdate()">
<option value="linear">linear-gradient</option>
<option value="radial">radial-gradient</option>
<option value="conic">conic-gradient</option>
</select>
</div>
<div id="gradAngleWrap">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${tl('angle_label')} <span id="gradAngleVal">135</span>°</div>
<input type="range" id="gradAngle" min="0" max="360" value="135" oninput="document.getElementById('gradAngleVal').textContent=this.value;gradUpdate()">
</div>
</div>
<div id="gradStops" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px"></div>
<button class="btn btn-secondary" onclick="gradAddStop()" style="font-size:12px">${tl('add_stop')}</button>
</div>
<div class="tool-card-panel">
<div style="height:120px;border-radius:12px;margin-bottom:14px;border:1px solid var(--glass-border);transition:all 0.3s" id="gradPreview"></div>
<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
<button class="btn btn-secondary" id="gradAnimToggle" onclick="gradToggleAnim()" style="font-size:12px">${tl('anim_play')}</button>
</div>
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">${tl('css_code')}</div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('gradCode').textContent,this)">${tl('copy')}</button>
</div>
<pre class="result-box" id="gradCode" style="white-space:pre-wrap"></pre>
<div style="margin-top:10px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
<div style="font-size:11px;color:var(--text-muted)">${tl('tailwind_label')}</div>
<button class="btn btn-secondary" style="padding:2px 8px;font-size:11px" onclick="copyText(document.getElementById('gradTailwind').textContent,this)">${tl('copy')}</button>
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
window._activeCleanup = function() {
var preview = document.getElementById('gradPreview');
if (preview) preview.style.animation = '';
var styleEl = document.getElementById('gradAnimStyle');
if (styleEl) styleEl.remove();
};
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
// update color hex displays
_gradStops.forEach((s,i) => {
const el = document.getElementById('gsc'+i);
if (el) el.textContent = s.color.toUpperCase();
});
// Tailwind output
const tl = window._gradTl || function(k){ return k; };
const twEl = document.getElementById('gradTailwind');
if (twEl) {
if (type === 'linear' && sorted.length >= 2) {
const angleMap = {
0:'to-t', 45:'to-tr', 90:'to-r', 135:'to-br',
180:'to-b', 225:'to-bl', 270:'to-l', 315:'to-tl'
};
const dir = angleMap[+angle] || 'to-r';
let tw = `bg-gradient-${dir} from-[${sorted[0].color}]`;
if (sorted.length === 3) tw += ` via-[${sorted[1].color}]`;
if (sorted.length >= 2) tw += ` to-[${sorted[sorted.length-1].color}]`;
twEl.textContent = tw;
} else {
twEl.textContent = tl('tw_unsupported');
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
const tl = window._gradTl || function(k){ return k; };
const isAnimating = preview.style.animation;
if (isAnimating) {
preview.style.animation = '';
btn.textContent = tl('anim_play');
} else {
if (!document.getElementById('gradAnimStyle')) {
const s = document.createElement('style');
s.id = 'gradAnimStyle';
s.textContent = '@keyframes gradSpin{to{filter:hue-rotate(360deg)}}';
document.head.appendChild(s);
}
preview.style.animation = 'gradSpin 3s linear infinite';
btn.textContent = tl('anim_pause');
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