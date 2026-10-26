'use strict';

// ── CSS 生成 & 颜色工具 原子 Actions ─────────────────────────────

(function () {
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
    async execute({ fg, bg }) {
      try {
        const ratio=(await ToolCompute.load('color')).contrast(fg,bg);
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
    async execute({ color, scheme = 'shades' }) {
      try {
        await ToolCompute.load('color');
        const data=KCompute.color.palette(color,scheme);return {success:true,data,display:data.colors.map(c=>c.hex).join(' | ')};
      } catch (e) { return { success: false, data: { error: e.message }, display: '颜色格式错误' }; }
    },
  },
];

window.CssGenActions = CssGenActions;

})();
