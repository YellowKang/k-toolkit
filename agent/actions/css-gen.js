'use strict';

// ── CSS 生成 & 颜色工具 原子 Actions ─────────────────────────────

// ─── 颜色工具函数 ───────────────────────────────────────────────
function _hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
}

function _rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    if (max === r) h = (g-b)/d + (g<b?6:0);
    else if (max === g) h = (b-r)/d + 2;
    else h = (r-g)/d + 4;
    h /= 6;
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function _hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = Math.round(l*255); return [v,v,v]; }
  const hue2rgb = (p, q, t) => {
    if (t<0) t+=1; if (t>1) t-=1;
    if (t<1/6) return p+(q-p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const q = l < 0.5 ? l*(1+s) : l+s-l*s;
  const p = 2*l - q;
  return [Math.round(hue2rgb(p,q,h+1/3)*255), Math.round(hue2rgb(p,q,h)*255), Math.round(hue2rgb(p,q,h-1/3)*255)];
}

function _rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

function _luminance(r, g, b) {
  const a = [r,g,b].map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
}

// ─── Actions ────────────────────────────────────────────────────
const CssGenActions = [
  {
    name: 'gradient_generate',
    description: '生成 CSS 渐变代码',
    meta: { tier: 'standard', tags: ['gradient','渐变','css','linear','radial'], category: 'css' },
    parameters: {
      type: 'object',
      properties: {
        colors: { type: 'array', items: { type: 'string' }, description: '颜色数组如 ["#ff0000","#0000ff"]' },
        angle:  { type: 'number', default: 135, description: '角度（linear 模式）' },
        type:   { type: 'string', enum: ['linear','radial'], default: 'linear' },
      },
      required: ['colors'],
    },
    execute({ colors, angle = 135, type = 'linear' }) {
      if (!colors || colors.length < 2) return { success: false, data: { error: '至少需要 2 个颜色' }, display: '至少需要 2 个颜色' };
      const css = type === 'radial'
        ? `background: radial-gradient(circle, ${colors.join(', ')});`
        : `background: linear-gradient(${angle}deg, ${colors.join(', ')});`;
      return { success: true, data: { result: css, type, colors }, display: css };
    },
  },
  {
    name: 'shadow_generate',
    description: '生成 CSS box-shadow 代码',
    meta: { tier: 'standard', tags: ['shadow','阴影','box-shadow','css'], category: 'css' },
    parameters: {
      type: 'object',
      properties: {
        x:      { type: 'number', default: 4, description: '水平偏移 px' },
        y:      { type: 'number', default: 4, description: '垂直偏移 px' },
        blur:   { type: 'number', default: 12, description: '模糊半径 px' },
        spread: { type: 'number', default: 0, description: '扩展半径 px' },
        color:  { type: 'string', default: 'rgba(0,0,0,0.2)', description: '阴影颜色' },
        inset:  { type: 'boolean', default: false },
      },
      required: [],
    },
    execute({ x=4, y=4, blur=12, spread=0, color='rgba(0,0,0,0.2)', inset=false }) {
      const css = `box-shadow: ${inset ? 'inset ' : ''}${x}px ${y}px ${blur}px ${spread}px ${color};`;
      return { success: true, data: { result: css }, display: css };
    },
  },
  {
    name: 'flexbox_generate',
    description: '生成 Flexbox CSS 布局代码',
    meta: { tier: 'standard', tags: ['flexbox','flex','布局','layout','css'], category: 'css' },
    parameters: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['row','row-reverse','column','column-reverse'], default: 'row' },
        justify:   { type: 'string', enum: ['flex-start','center','flex-end','space-between','space-around','space-evenly'], default: 'flex-start' },
        align:     { type: 'string', enum: ['stretch','flex-start','center','flex-end','baseline'], default: 'stretch' },
        wrap:      { type: 'string', enum: ['nowrap','wrap','wrap-reverse'], default: 'nowrap' },
        gap:       { type: 'string', default: '0', description: '间距如 8px 或 1rem' },
      },
      required: [],
    },
    execute({ direction='row', justify='flex-start', align='stretch', wrap='nowrap', gap='0' }) {
      const lines = [
        'display: flex;',
        `flex-direction: ${direction};`,
        `justify-content: ${justify};`,
        `align-items: ${align};`,
        `flex-wrap: ${wrap};`,
      ];
      if (gap && gap !== '0') lines.push(`gap: ${gap};`);
      const css = lines.join('\n');
      return { success: true, data: { result: css }, display: css };
    },
  },
  {
    name: 'css_unit_convert',
    description: 'CSS 单位转换 px/rem/em/vw/vh/pt',
    meta: { tier: 'standard', tags: ['css','unit','px','rem','vw','转换'], category: 'css' },
    parameters: {
      type: 'object',
      properties: {
        value:   { type: 'number', description: '数值' },
        from:    { type: 'string', enum: ['px','rem','em','vw','vh','pt'], description: '源单位' },
        to:      { type: 'string', enum: ['px','rem','em','vw','vh','pt'], description: '目标单位' },
        base:    { type: 'number', default: 16, description: '基准字号(px)，用于 rem/em 换算' },
        viewW:   { type: 'number', default: 1920, description: '视口宽度(px)，用于 vw 换算' },
        viewH:   { type: 'number', default: 1080, description: '视口高度(px)，用于 vh 换算' },
      },
      required: ['value', 'from', 'to'],
    },
    execute({ value, from, to, base=16, viewW=1920, viewH=1080 }) {
      // 先转为 px
      let px;
      switch(from) {
        case 'px':  px = value; break;
        case 'rem': case 'em': px = value * base; break;
        case 'vw':  px = value * viewW / 100; break;
        case 'vh':  px = value * viewH / 100; break;
        case 'pt':  px = value * 96 / 72; break;
        default: return { success: false, data: { error: '未知单位' }, display: '未知单位: ' + from };
      }
      let result;
      switch(to) {
        case 'px':  result = px; break;
        case 'rem': case 'em': result = px / base; break;
        case 'vw':  result = px / viewW * 100; break;
        case 'vh':  result = px / viewH * 100; break;
        case 'pt':  result = px * 72 / 96; break;
        default: return { success: false, data: { error: '未知单位' }, display: '未知单位: ' + to };
      }
      result = parseFloat(result.toFixed(4));
      return { success: true, data: { result, unit: to, px }, display: `${value}${from} = ${result}${to}` };
    },
  },
  {
    name: 'color_contrast_check',
    description: 'WCAG 对比度检查',
    meta: { tier: 'standard', tags: ['contrast','对比度','wcag','accessibility','a11y'], category: 'css' },
    parameters: {
      type: 'object',
      properties: {
        fg: { type: 'string', description: '前景色 HEX 如 #000000' },
        bg: { type: 'string', description: '背景色 HEX 如 #ffffff' },
      },
      required: ['fg', 'bg'],
    },
    execute({ fg, bg }) {
      try {
        const [fr,fg2,fb] = _hexToRgb(fg);
        const [br,bg2,bb] = _hexToRgb(bg);
        const l1 = _luminance(fr,fg2,fb);
        const l2 = _luminance(br,bg2,bb);
        const ratio = parseFloat(((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05)).toFixed(2));
        const aa = ratio >= 4.5;
        const aaa = ratio >= 7;
        const aaLarge = ratio >= 3;
        return { success: true,
          data: { ratio, aa, aaa, aaLarge, fg, bg },
          display: `对比度 ${ratio}:1 | AA ${aa?'Pass':'Fail'} | AAA ${aaa?'Pass':'Fail'}` };
      } catch (e) { return { success: false, data: { error: e.message }, display: '颜色格式错误' }; }
    },
  },
  {
    name: 'palette_generate',
    description: '基于主色生成配色方案',
    meta: { tier: 'standard', tags: ['palette','调色板','配色','互补色','color'], category: 'css' },
    parameters: {
      type: 'object',
      properties: {
        color:  { type: 'string', description: '主色 HEX 如 #6366f1' },
        scheme: { type: 'string', enum: ['complementary','analogous','triadic','split','shades'], default: 'shades', description: '配色方案' },
      },
      required: ['color'],
    },
    execute({ color, scheme = 'shades' }) {
      try {
        const [r,g,b] = _hexToRgb(color);
        const [h,s,l] = _rgbToHsl(r,g,b);
        let colors = [];

        if (scheme === 'shades') {
          // 生成 9 级色阶 (50-900)
          const levels = [95, 90, 80, 70, 60, 50, 40, 30, 20];
          colors = levels.map(lv => {
            const [rr,gg,bb] = _hslToRgb(h, s, lv);
            return { label: `${100-lv > 50 ? (100-lv)*10+100 : (100-lv)*10+50}`, hex: _rgbToHex(rr,gg,bb) };
          });
        } else if (scheme === 'complementary') {
          colors = [
            { label: 'base', hex: color },
            { label: 'complement', hex: _rgbToHex(..._hslToRgb((h+180)%360, s, l)) },
          ];
        } else if (scheme === 'analogous') {
          colors = [-30, 0, 30].map((offset, i) => ({
            label: ['left', 'base', 'right'][i],
            hex: _rgbToHex(..._hslToRgb((h+offset+360)%360, s, l)),
          }));
        } else if (scheme === 'triadic') {
          colors = [0, 120, 240].map((offset, i) => ({
            label: ['base', 'triadic-1', 'triadic-2'][i],
            hex: _rgbToHex(..._hslToRgb((h+offset)%360, s, l)),
          }));
        } else if (scheme === 'split') {
          colors = [0, 150, 210].map((offset, i) => ({
            label: ['base', 'split-1', 'split-2'][i],
            hex: _rgbToHex(..._hslToRgb((h+offset)%360, s, l)),
          }));
        }

        const cssVars = colors.map((c, i) => `--color-${i}: ${c.hex};`).join('\n');
        return { success: true,
          data: { colors, cssVars, scheme },
          display: colors.map(c => `${c.label}: ${c.hex}`).join(' | ') };
      } catch (e) { return { success: false, data: { error: e.message }, display: '颜色格式错误' }; }
    },
  },
];

window.CssGenActions = CssGenActions;
