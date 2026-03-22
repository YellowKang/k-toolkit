function renderPaletteGen(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="panel-label" style="margin:0">主色</div>
        <input type="color" id="pgPicker" value="#8b5cf6" style="width:44px;height:36px;border:none;background:none;cursor:pointer;border-radius:8px">
        <input class="tool-input" id="pgHex" value="#8b5cf6" placeholder="#8b5cf6" style="width:120px">
        <button class="btn btn-primary" onclick="genPalette()">生成调色板</button>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#8b5cf6','#ec4899'].map(c =>
            `<div onclick="pgSetColor('${c}')" style="width:24px;height:24px;border-radius:6px;background:${c};cursor:pointer;border:2px solid transparent;transition:border-color 0.15s" title="${c}"></div>`
          ).join('')}
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="pgResult" style="display:none">
      <div id="pgContent"></div>
    </div>`;

  document.getElementById('pgPicker').addEventListener('input', function() {
    document.getElementById('pgHex').value = this.value;
    genPalette();
  });
  document.getElementById('pgHex').addEventListener('input', function() {
    const v = this.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) {
      document.getElementById('pgPicker').value = v;
      genPalette();
    }
  });
  document.getElementById('pgHex').addEventListener('keydown', e => { if(e.key==='Enter') genPalette(); });
  genPalette();
}

function pgSetColor(c) {
  document.getElementById('pgHex').value = c;
  document.getElementById('pgPicker').value = c;
  genPalette();
}

function genPalette() {
  const hex = document.getElementById('pgHex').value.trim();
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
  const [r,g,b] = [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  const {h,s,l} = _pgRgbToHsl(r,g,b);

  // 生成 10 级 shade（深）和 tint（浅）
  const shades = [90,80,70,60,50,40,30,20,10,5].map(lv => _pgHslToHex(h, s, lv));
  const tints  = [95,90,85,80,70,60,50,40,30,20].map(lv => _pgHslToHex(h, Math.min(s,60), lv));
  const scale  = [95,90,80,70,60,50,40,30,20,10].map((lv,i) => ({ hex: _pgHslToHex(h, s*0.8+i*2, lv), name: (i+1)*100 }));

  // 互补色、三角色
  const comp   = _pgHslToHex((h+180)%360, s, l);
  const tri1   = _pgHslToHex((h+120)%360, s, l);
  const tri2   = _pgHslToHex((h+240)%360, s, l);
  const split1 = _pgHslToHex((h+150)%360, s, l);
  const split2 = _pgHslToHex((h+210)%360, s, l);
  const ana1   = _pgHslToHex((h+30)%360, s, l);
  const ana2   = _pgHslToHex((h-30+360)%360, s, l);

  const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
  const textOn = luminance > 0.45 ? '#1a1a2e' : '#ffffff';

  const result = document.getElementById('pgResult');
  const content = document.getElementById('pgContent');
  result.style.display = '';

  content.innerHTML = `
    <div style="margin-bottom:20px">
      <div class="panel-label">色阶（100-1000）</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${scale.map(c => `
          <div style="flex:1;min-width:60px;cursor:pointer" onclick="copyText('${c.hex}',event.target)" title="复制 ${c.hex}">
            <div style="height:52px;background:${c.hex};border-radius:8px;margin-bottom:4px"></div>
            <div style="font-size:10px;color:var(--text-muted);text-align:center">${c.name}</div>
            <div style="font-size:10px;color:var(--text-muted);text-align:center;font-family:monospace">${c.hex}</div>
          </div>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div>
        <div class="panel-label">调和色系</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            {label:'原色', colors:[hex]},
            {label:'互补色', colors:[hex,comp]},
            {label:'分裂互补', colors:[hex,split1,split2]},
            {label:'三角配色', colors:[hex,tri1,tri2]},
            {label:'邻近色', colors:[hex,ana1,ana2]},
          ].map(g => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:11px;color:var(--text-muted);width:64px;flex-shrink:0">${g.label}</span>
              <div style="display:flex;gap:4px">
                ${g.colors.map(c => `<div onclick="copyText('${c}',this)" title="${c}" style="width:32px;height:32px;border-radius:6px;background:${c};cursor:pointer;border:1px solid rgba(255,255,255,0.1)"></div>`).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>
      <div>
        <div class="panel-label">预览示例</div>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div style="background:${hex};padding:16px;color:${textOn}">
            <div style="font-weight:700;font-size:15px">主色背景</div>
            <div style="font-size:12px;opacity:0.8">${hex.toUpperCase()} · 示例文字</div>
          </div>
          <div style="background:${_pgHslToHex(h,s,95)};padding:12px;color:${hex}">
            <div style="font-weight:600;font-size:13px">浅色背景</div>
            <div style="font-size:12px">次要文字颜色</div>
          </div>
          <div style="background:${_pgHslToHex(h,s,10)};padding:12px;color:${hex}">
            <div style="font-weight:600;font-size:13px">深色背景</div>
            <div style="font-size:12px">代码风格</div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="panel-label">CSS 变量</div>
      <pre class="result-box" style="font-size:12px">:root {
${scale.map(c => `  --color-${c.name}: ${c.hex};`).join('\n')}
  --color-base: ${hex};
  --color-complement: ${comp};
}</pre>
      <button class="btn btn-secondary" style="margin-top:8px" onclick="copyText(document.querySelector('.result-box').textContent,this)">复制 CSS 变量</button>
    </div>`;
}

function _pgRgbToHsl(r,g,b) {
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h=0,s=0,l=(max+min)/2;
  if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
    if(max===r)h=(g-b)/d+(g<b?6:0);
    else if(max===g)h=(b-r)/d+2;
    else h=(r-g)/d+4;h=h*60;}
  return {h:Math.round(h),s:Math.round(s*100),l:Math.round(l*100)};
}

function _pgHslToHex(h,s,l) {
  s/=100;l/=100;
  const a=s*Math.min(l,1-l);
  const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};
  return '#'+f(0)+f(8)+f(4);
}
