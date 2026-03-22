function renderColorConvert(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">输入颜色值</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input class="tool-input" id="ccInput" placeholder="#667eea 或 rgb(102,126,234) 或 hsl(231,75%,66%)" style="flex:1">
        <input type="color" id="ccPicker" value="#667eea" style="width:44px;height:36px;border:none;background:none;cursor:pointer;border-radius:8px" title="拾色器">
        <button class="btn btn-primary" onclick="convertColor()">转换</button>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${['HEX','RGB','RGBA','HSL','HSV','CMYK'].map(f =>
          `<button class="flag-btn" onclick="ccFillSample('${f}')" style="padding:3px 10px;border-radius:20px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:11px;cursor:pointer;transition:all 0.2s">${f}</button>`
        ).join('')}
      </div>
    </div>
    <div class="tool-card-panel" id="ccResultPanel" style="display:none">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
        <div id="ccPreview" style="width:64px;height:64px;border-radius:14px;border:1px solid var(--glass-border);flex-shrink:0;box-shadow:0 4px 16px rgba(0,0,0,0.3)"></div>
        <div style="flex:1">
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">颜色预览</div>
          <div id="ccLuminance" style="font-size:12px"></div>
        </div>
      </div>
      <div id="ccResults"></div>
    </div>`;

  document.getElementById('ccInput').addEventListener('keydown', e => { if(e.key==='Enter') convertColor(); });
  document.getElementById('ccPicker').addEventListener('input', function() {
    document.getElementById('ccInput').value = this.value;
    convertColor();
  });
  document.getElementById('ccInput').addEventListener('input', () => {
    const v = document.getElementById('ccInput').value.trim();
    if (v.length >= 3) convertColor();
    if (v.match(/^#[0-9a-fA-F]{3,8}$/)) {
      document.getElementById('ccPicker').value = v.slice(0,7);
    }
  });
}
function ccFillSample(fmt) {
  const samples = {
    HEX: '#667eea', RGB: 'rgb(102,126,234)', RGBA: 'rgba(102,126,234,0.8)',
    HSL: 'hsl(231,75%,66%)', HSV: 'hsv(231,56%,92%)', CMYK: 'cmyk(56%,46%,0%,8%)'
  };
  document.getElementById('ccInput').value = samples[fmt] || '';
  convertColor();
}

function convertColor() {
  const raw = document.getElementById('ccInput').value.trim();
  if (!raw) return;
  let r,g,b,a=1;
  try {
    if (/^#([0-9a-f]{3}){1,2}$/i.test(raw)) {
      let h = raw.slice(1);
      if (h.length===3) h = h.split('').map(c=>c+c).join('');
      r=parseInt(h.slice(0,2),16);g=parseInt(h.slice(2,4),16);b=parseInt(h.slice(4,6),16);
    } else if (/rgba?/i.test(raw)) {
      const m = raw.match(/\d+\.?\d*/g);
      [r,g,b,a] = [+m[0],+m[1],+m[2],m[3]!=null?+m[3]:1];
    } else if (/hsla?/i.test(raw)) {
      const m = raw.match(/[\d.]+/g);
      const [h,s,l,al] = [+m[0],+m[1]/100,+m[2]/100,m[3]!=null?+m[3]:1];
      a = al;
      ({r,g,b} = _hslToRgb(h,s*100,l*100));
    } else throw new Error('无法识别的格式');
  } catch(e) {
    document.getElementById('ccResultPanel').style.display='';
    document.getElementById('ccResults').innerHTML = `<span style="color:#ef4444">${e.message}</span>`;
    return;
  }

  const hex = '#' + [r,g,b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  const {h,s,l} = _rgbToHsl(r,g,b);
  const {h:hv,s:sv,v} = _rgbToHsv(r,g,b);
  const {c,m:cm,y,k} = _rgbToCmyk(r,g,b);
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  const textColor = luminance > 0.5 ? '#1a1a2e' : '#ffffff';

  document.getElementById('ccPreview').style.background = `rgba(${r},${g},${b},${a})`;
  document.getElementById('ccLuminance').innerHTML =
    `<span style="font-size:12px;padding:3px 10px;border-radius:20px;background:rgba(${r},${g},${b},0.2);color:${luminance>0.5?'var(--text)':'var(--neon)'}">${luminance>0.5?'浅色':'深色'}（亮度 ${(luminance*100).toFixed(1)}%）</span>`;

  const rows = [
    {label:'HEX',    val: hex.toUpperCase()},
    {label:'RGB',    val: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`},
    {label:'RGBA',   val: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`},
    {label:'HSL',    val: `hsl(${h}, ${s}%, ${l}%)`},
    {label:'HSV',    val: `hsv(${hv}, ${sv}%, ${v}%)`},
    {label:'CMYK',   val: `cmyk(${c}%, ${cm}%, ${y}%, ${k}%)`},
    {label:'CSS var',val: `--color: ${hex};`},
    {label:'对比文字',val: textColor, extra: `<span style="padding:2px 8px;border-radius:4px;font-size:12px;background:${hex};color:${textColor}">示例文字</span>`},
  ];

  document.getElementById('ccResults').innerHTML = rows.map(row => `
    <div class="result-row" style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="color:var(--text-muted);width:72px;flex-shrink:0;font-size:12px">${row.label}</span>
      <span style="font-family:monospace;font-size:13px;flex:1;word-break:break-all">${row.val}</span>
      ${row.extra||''}
      <button class="copy-inline" onclick="copyText('${row.val.replace(/'/g,"&#39;")}',this)">复制</button>
    </div>`).join('');
  document.getElementById('ccResultPanel').style.display='';
}

function _hslToRgb(h,s,l) {
  s/=100;l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c);};
  return {r:f(0),g:f(8),b:f(4)};
}
function _rgbToHsl(r,g,b) {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=Math.round(h*60);}
  return {h,s:Math.round(s*100),l:Math.round(l*100)};
}
function _rgbToHsv(r,g,b) {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d){if(max===r)h=(g-b)/d%6;
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h=Math.round(h*60+360)%360;}
  return {h,s:max?Math.round(d/max*100):0,v:Math.round(max*100)};
}
function _rgbToCmyk(r,g,b) {
  r/=255;g/=255;b/=255;
  const k=1-Math.max(r,g,b);
  if(k===1) return {c:0,m:0,y:0,k:100};
  return {c:Math.round((1-r-k)/(1-k)*100),m:Math.round((1-g-k)/(1-k)*100),y:Math.round((1-b-k)/(1-k)*100),k:Math.round(k*100)};
}
