(function () {
  const fail=()=>{throw new Error(window.getCurrentLang?.()==='en'?'Invalid color: use HEX (3/4/6/8), RGB(A), HSL(A), HSV or CMYK with valid ranges':'颜色无效：支持 3/4/6/8 位 HEX、RGB(A)、HSL(A)、HSV、CMYK，请检查通道范围');};
  const round=n=>Math.round(n*10000)/10000;
  const number=s=>{if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s))fail();return Number(s);};
  const range=(n,max)=>{if(!Number.isFinite(n)||n<0||n>max)fail();return n;};
  const percent=s=>range(number(s.replace(/%$/,'')),100)/100;
  const alpha=s=>s===undefined?1:s.endsWith('%')?percent(s):range(number(s),1);
  function hsl(h,s,l) { h=((h%360)+360)%360;s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1)));};return {r:f(0),g:f(8),b:f(4)}; }
  function rgbHsl(r,g,b) {r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0;if(d)h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;return {h:round(h*60),s:round(d?d/(1-Math.abs(2*l-1))*100:0),l:round(l*100)};}
  function rgbHsv(r,g,b) {const {h}=rgbHsl(r,g,b),max=Math.max(r,g,b),min=Math.min(r,g,b);return {h,s:round(max?(max-min)/max*100:0),v:round(max/255*100)};}
  function rgbCmyk(r,g,b) {const k=1-Math.max(r,g,b)/255;return k===1?{c:0,m:0,y:0,k:100}:{c:round((1-r/255-k)/(1-k)*100),m:round((1-g/255-k)/(1-k)*100),y:round((1-b/255-k)/(1-k)*100),k:round(k*100)};}
  function parse(input,from='auto') {
    const raw=String(input??'').trim().toLowerCase();if(raw.length>200)fail();let out;
    if(/^#[0-9a-f]+$/.test(raw)) {
      if(!['auto','hex'].includes(from))fail();let h=raw.slice(1);if(![3,4,6,8].includes(h.length))fail();if(h.length<=4)h=[...h].map(c=>c+c).join('');
      out={r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:h.length===8?parseInt(h.slice(6,8),16)/255:1};
    } else {
      const m=/^(rgb|rgba|hsl|hsla|hsv|cmyk)\(([^()]*)\)$/.exec(raw);if(!m)fail();const kind=m[1].replace(/a$/,''),body=m[2].trim();
      if(from!=='auto'&&from!==kind&&from!==m[1])fail();
      let parts;if(body.includes(',')){if(body.includes('/'))fail();parts=body.split(',').map(s=>s.trim());}else{parts=body.replace(/\s*\/\s*/,' ').split(/\s+/);if((body.match(/\//g)||[]).length>1)fail();}
      if(parts.some(s=>!s)||parts.length<3||parts.length>4||kind==='cmyk'&&parts.length!==4)fail();
      const a=kind==='cmyk'?1:alpha(parts[3]);
      if(kind==='rgb')out={r:Math.round(parts[0].endsWith('%')?percent(parts[0])*255:range(number(parts[0]),255)),g:Math.round(parts[1].endsWith('%')?percent(parts[1])*255:range(number(parts[1]),255)),b:Math.round(parts[2].endsWith('%')?percent(parts[2])*255:range(number(parts[2]),255)),a};
      else if(kind==='hsl'||kind==='hsv'){
        const h=((number(parts[0].replace(/deg$/,''))%360)+360)%360;if(!parts[1].endsWith('%')||!parts[2].endsWith('%'))fail();const s=percent(parts[1]),v=percent(parts[2]);
        if(kind==='hsl')out={...hsl(h,s*100,v*100),a};else{const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),n=v-c;const rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];out={r:Math.round((rgb[0]+n)*255),g:Math.round((rgb[1]+n)*255),b:Math.round((rgb[2]+n)*255),a};}
      }else{if(parts.some(s=>!s.endsWith('%')))fail();const[c,m,y,k]=parts.map(percent);out={r:Math.round(255*(1-c)*(1-k)),g:Math.round(255*(1-m)*(1-k)),b:Math.round(255*(1-y)*(1-k)),a};}
    }return out;
  }
  function formats(color) {
    const {r,g,b,a}=color,{h,s,l}=rgbHsl(r,g,b),hsv=rgbHsv(r,g,b),cmyk=rgbCmyk(r,g,b),hexRGB='#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join(''),alphaHex=Math.round(a*255).toString(16).padStart(2,'0');
    const rgb=`rgb(${r}, ${g}, ${b})`,rgba=`rgba(${r}, ${g}, ${b}, ${a})`,hslText=`hsl(${h}, ${s}%, ${l}%)`,hsla=`hsla(${h}, ${s}%, ${l}%, ${a})`;
    return {hex:a===1?hexRGB:hexRGB+alphaHex,hexRGB,rgb:a===1?rgb:rgba,rgba,hsl:a===1?hslText:hsla,hsla,hsv:`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`,cmyk:`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`};
  }
  function convert(input,{from='auto',to='hex'}={}){const color=parse(input,from),all=formats(color);if(!Object.hasOwn(all,to))fail();return {result:all[to],...color,formats:all,...(color.a<1&&['hsv','cmyk'].includes(to)?{alphaSeparate:true}:{})};}
  function luminance(color){return [color.r,color.g,color.b].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
  function contrast(foreground,background){const fg=parse(foreground),bg=parse(background);if(fg.a!==1||bg.a!==1)fail();const a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
  function palette(input,scheme='shades'){
    const color=parse(input);if(color.a!==1)fail();const base=formats(color).hex,{h,s,l}=rgbHsl(color.r,color.g,color.b),hex=(h,s,l)=>formats({...hsl(h,s,l),a:1}).hex;
    const scale=[95,90,80,70,60,50,40,30,20,10].map((value,i)=>({hex:hex(h,s*.8+i*2,value),label:String((i+1)*100),name:(i+1)*100}));
    const offsets={complementary:[0,180],analogous:[0,30,-30],triadic:[0,120,240],split:[0,150,210]},schemes=Object.fromEntries(Object.entries(offsets).map(([key,values])=>[key,values.map((offset,i)=>({label:i?'color-'+i:'base',hex:i?hex(h+offset,s,l):base}))]));
    const colors=scheme==='shades'?scale:schemes[scheme];if(!colors)fail();return {base,scale,schemes,colors,scheme,cssVars:colors.map(c=>`--color-${c.label}: ${c.hex};`).join('\n')};
  }
  window.KCompute=window.KCompute||{};window.KCompute.color=Object.freeze({parse,formats,convert,hsl,rgbHsl,rgbHsv,rgbCmyk,luminance,contrast,palette});
})();
