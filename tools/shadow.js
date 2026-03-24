function renderShadow(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
<div class="panel-label" style="margin:0">预览</div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary" onclick="shadowAddLayer()">+ 添加层</button>
<button class="btn btn-secondary" onclick="shadowRandom()">随机</button>
</div>
</div>
<div style="display:flex;align-items:center;justify-content:center;min-height:160px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:12px;margin-bottom:14px">
<div id="shadowBox" style="width:100px;height:100px;background:linear-gradient(135deg,rgba(102,126,234,0.5),rgba(240,147,251,0.3));border:1px solid rgba(102,126,234,0.3);border-radius:12px;transition:box-shadow 0.3s"></div>
</div>
<div id="shadowLayers" style="display:flex;flex-direction:column;gap:10px"></div>
</div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">CSS 代码</div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('shadowCode').textContent,this)">复制</button>
</div>
<pre class="result-box" id="shadowCode" style="white-space:pre-wrap"></pre>
</div>`;
window._shadowLayers = [
{x:0,y:4,blur:20,spread:0,color:'#667eea',opacity:40,inset:false},
];
shadowRenderLayers();
shadowUpdate();
}
function shadowRenderLayers() {
const c = document.getElementById('shadowLayers');
c.innerHTML = window._shadowLayers.map((s,i) => `
<div style="padding:12px 14px;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:10px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<span style="font-size:12px;color:var(--text-muted)">阴影层 ${i+1}</span>
<div style="display:flex;gap:8px;align-items:center">
<label style="font-size:12px;color:var(--text-muted);cursor:pointer;display:flex;align-items:center;gap:4px">
<input type="checkbox" ${s.inset?'checked':''} onchange="_shadowLayers[${i}].inset=this.checked;shadowUpdate()" style="accent-color:var(--accent)"> inset
</label>
${window._shadowLayers.length>1?`<button class="copy-inline" onclick="shadowRemoveLayer(${i})">删除</button>`:''}
</div>
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px">
${[['X 偏移','x',-50,50],['Y 偏移','y',-50,50],['模糊','blur',0,100],['扩散','spread',-30,50]].map(([label,key,min,max]) => `
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${label} <span id="sv_${i}_${key}">${s[key]}</span>px</div>
<input type="range" min="${min}" max="${max}" value="${s[key]}" style="width:100%" oninput="_shadowLayers[${i}].${key}=+this.value;document.getElementById('sv_${i}_${key}').textContent=this.value;shadowUpdate()">
</div>`).join('')}
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">颜色</div>
<input type="color" value="${s.color}" style="width:100%;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" oninput="_shadowLayers[${i}].color=this.value;shadowUpdate()">
</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">透明度 <span id="sv_${i}_op">${s.opacity}</span>%</div>
<input type="range" min="0" max="100" value="${s.opacity}" style="width:100%" oninput="_shadowLayers[${i}].opacity=+this.value;document.getElementById('sv_${i}_op').textContent=this.value;shadowUpdate()">
</div>
</div>
</div>`).join('');
}
function shadowUpdate() {
const layers = window._shadowLayers;
const css = layers.map(s => {
const hex = s.color.replace('#','');
const r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);
return `${s.inset?'inset ':''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px rgba(${r},${g},${b},${(s.opacity/100).toFixed(2)})`;
}).join(',\n  ');
const box = document.getElementById('shadowBox');
const code = document.getElementById('shadowCode');
if (box)  box.style.boxShadow = css.replace(/\n  /g,' ');
if (code) code.textContent = `box-shadow: ${css};`;
}
function shadowAddLayer() {
window._shadowLayers.push({x:0,y:8,blur:30,spread:0,color:'#f093fb',opacity:30,inset:false});
shadowRenderLayers(); shadowUpdate();
}
function shadowRemoveLayer(i) {
window._shadowLayers.splice(i,1); shadowRenderLayers(); shadowUpdate();
}
function shadowRandom() {
window._shadowLayers = Array.from({length:1+Math.floor(Math.random()*2)}, () => ({
x: Math.round((Math.random()-0.5)*40),
y: Math.round(Math.random()*30),
blur: Math.round(Math.random()*60+10),
spread: Math.round((Math.random()-0.5)*20),
color: '#'+(Math.random()*0xFFFFFF|0).toString(16).padStart(6,'0'),
opacity: Math.round(Math.random()*50+20),
inset: false,
}));
shadowRenderLayers(); shadowUpdate();
}