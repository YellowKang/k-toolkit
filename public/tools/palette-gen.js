const _pgDict = {
  zh: {
    base: '主色', generate: '生成调色板', scale: '色阶（100-1000）', copy_hex: hex => `复制 ${hex}`, harmony: '调和色系',
    original: '原色', complement: '互补色', split: '分裂互补', triad: '三角配色', analogous: '邻近色',
    preview: '预览示例', on_base: '主色背景', sample_text: '示例文字', light_bg: '浅色背景', secondary_text: '次要文字颜色',
    dark_bg: '深色背景', code_style: '代码风格', css_vars: 'CSS 变量', copy_vars: '复制 CSS 变量',
  },
  en: {
    base: 'Base color', generate: 'Generate palette', scale: 'Scale (100-1000)', copy_hex: hex => `Copy ${hex}`, harmony: 'Color harmonies',
    original: 'Base', complement: 'Complementary', split: 'Split complementary', triad: 'Triadic', analogous: 'Analogous',
    preview: 'Preview', on_base: 'On the base color', sample_text: 'Sample text', light_bg: 'Light background', secondary_text: 'Secondary text color',
    dark_bg: 'Dark background', code_style: 'Code style', css_vars: 'CSS variables', copy_vars: 'Copy CSS variables',
  },
};

async function renderPaletteGen(el) {
  await ToolCompute.load('color');if(!el.isConnected||window.currentPage!=='palette-gen')return;el._toolOutput=()=>el._paletteOutput||'';
  const T = makeToolI18n(_pgDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="panel-label" style="margin:0">${T('base')}</div>
        <input type="color" id="pgPicker" value="#8b5cf6" style="width:44px;height:36px;border:none;background:none;cursor:pointer;border-radius:8px">
        <input class="tool-input" id="pgHex" value="#8b5cf6" placeholder="#8b5cf6" style="width:120px">
        <button class="btn btn-primary" onclick="genPalette()">${T('generate')}</button>
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
    genPalette();
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
  const T = makeToolI18n(_pgDict);
  const root=document.getElementById('toolBody');root._paletteOutput='';let data;
  try{data=KCompute.color.palette(document.getElementById('pgHex').value.trim());}catch(e){document.getElementById('pgResult').style.display='';document.getElementById('pgContent').textContent=e.message;return {success:false,error:e.message};}
  root._paletteOutput=JSON.stringify(data,null,2);const hex=data.base,scale=data.scale,{r,g,b}=KCompute.color.parse(hex),{h,s,l}=KCompute.color.rgbHsl(r,g,b);
  document.getElementById('pgPicker').value=hex;
  const comp=data.schemes.complementary[1].hex,[tri1,tri2]=data.schemes.triadic.slice(1).map(c=>c.hex),[split1,split2]=data.schemes.split.slice(1).map(c=>c.hex),[ana1,ana2]=data.schemes.analogous.slice(1).map(c=>c.hex);
  const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
  const textOn = luminance > 0.45 ? '#1a1a2e' : '#ffffff';

  const result = document.getElementById('pgResult');
  const content = document.getElementById('pgContent');
  result.style.display = '';

  content.innerHTML = `
    <div style="margin-bottom:20px">
      <div class="panel-label">${T('scale')}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${scale.map(c => `
          <div style="flex:1;min-width:60px;cursor:pointer" onclick="copyText('${c.hex}',event.target)" title="${T('copy_hex', c.hex)}">
            <div style="height:52px;background:${c.hex};border-radius:8px;margin-bottom:4px"></div>
            <div style="font-size:10px;color:var(--text-muted);text-align:center">${c.name}</div>
            <div style="font-size:10px;color:var(--text-muted);text-align:center;font-family:monospace">${c.hex}</div>
          </div>`).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
      <div>
        <div class="panel-label">${T('harmony')}</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[
            {label:T('original'), colors:[hex]},
            {label:T('complement'), colors:[hex,comp]},
            {label:T('split'), colors:[hex,split1,split2]},
            {label:T('triad'), colors:[hex,tri1,tri2]},
            {label:T('analogous'), colors:[hex,ana1,ana2]},
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
        <div class="panel-label">${T('preview')}</div>
        <div style="border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div style="background:${hex};padding:16px;color:${textOn}">
            <div style="font-weight:700;font-size:15px">${T('on_base')}</div>
            <div style="font-size:12px;opacity:0.8">${hex.toUpperCase()} · ${T('sample_text')}</div>
          </div>
          <div style="background:${_pgHslToHex(h,s,95)};padding:12px;color:${hex}">
            <div style="font-weight:600;font-size:13px">${T('light_bg')}</div>
            <div style="font-size:12px">${T('secondary_text')}</div>
          </div>
          <div style="background:${_pgHslToHex(h,s,10)};padding:12px;color:${hex}">
            <div style="font-weight:600;font-size:13px">${T('dark_bg')}</div>
            <div style="font-size:12px">${T('code_style')}</div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="panel-label">${T('css_vars')}</div>
      <pre class="result-box" style="font-size:12px">:root {
${scale.map(c => `  --color-${c.name}: ${c.hex};`).join('\n')}
  --color-base: ${hex};
  --color-complement: ${comp};
}</pre>
      <button class="btn btn-secondary" style="margin-top:8px" onclick="copyText(document.querySelector('.result-box').textContent,this)">${T('copy_vars')}</button>
    </div>`;
  return {success:true,data};
}

function _pgRgbToHsl(r,g,b){return KCompute.color.rgbHsl(r,g,b);}
function _pgHslToHex(h,s,l){return KCompute.color.formats({...KCompute.color.hsl(h,s,l),a:1}).hex;}
