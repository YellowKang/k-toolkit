'use strict';

const CalcActions = [
  {
    name: 'calculate',
    description: '计算数学表达式',
    meta: { tier: 'standard', tags: ['calculate', 'math', 'expression', 'eval'], category: 'calc' },
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string', description: '数学表达式，如 2+3*4' } },
      required: ['expression'],
    },
    execute({ expression }) {
      try {
        // Only allow safe math characters
        if (!/^[0-9+\-*/().\s%^eE]+$/.test(expression)) {
          return { success: false, data: { error: '非法字符' }, display: '表达式包含非法字符' };
        }
        // eslint-disable-next-line no-new-func
        const result = Function('"use strict"; return (' + expression + ')')();
        return { success: true, data: { result }, display: `${expression} = ${result}` };
      } catch (e) {
        return { success: false, data: { error: e.message }, display: `计算失败: ${e.message}` };
      }
    },
  },
  {
    name: 'unit_convert',
    description: '单位换算（长度/重量/温度/存储/速度）',
    meta: { tier: 'standard', tags: ['unit', 'convert', 'length', 'weight', 'temperature', 'storage', 'speed'], category: 'calc' },
    parameters: {
      type: 'object',
      properties: {
        value: { type: 'number', description: '数值' },
        from:  { type: 'string', description: '源单位' },
        to:    { type: 'string', description: '目标单位' },
        type:  { type: 'string', enum: ['length', 'weight', 'temp', 'storage', 'speed'] },
      },
      required: ['value', 'from', 'to', 'type'],
    },
    execute({ value, from, to, type }) {
      const tables = {
        length:  { m:1, km:1000, cm:0.01, mm:0.001, mile:1609.344, yard:0.9144, ft:0.3048, inch:0.0254 },
        weight:  { kg:1, g:0.001, mg:0.000001, lb:0.453592, oz:0.028349, t:1000 },
        storage: { B:1, KB:1024, MB:1048576, GB:1073741824, TB:1099511627776 },
        speed:   { 'km/h':1, 'm/s':3.6, mph:1.60934, knot:1.852 },
      };
      if (type === 'temp') {
        let celsius;
        if (from === 'C') celsius = value;
        else if (from === 'F') celsius = (value - 32) * 5/9;
        else if (from === 'K') celsius = value - 273.15;
        else return { success: false, data: { error: '未知温度单位' }, display: '未知温度单位' };
        let result;
        if (to === 'C') result = celsius;
        else if (to === 'F') result = celsius * 9/5 + 32;
        else if (to === 'K') result = celsius + 273.15;
        else return { success: false, data: { error: '未知温度单位' }, display: '未知温度单位' };
        result = parseFloat(result.toFixed(4));
        return { success: true, data: { result, unit: to }, display: `${value}${from} = ${result}${to}` };
      }
      const table = tables[type];
      if (!table) return { success: false, data: { error: '未知换算类型' }, display: '未知换算类型' };
      if (!table[from] || !table[to]) return { success: false, data: { error: '未知单位' }, display: `未知单位: ${from} 或 ${to}` };
      const result = parseFloat((value * table[from] / table[to]).toFixed(6));
      return { success: true, data: { result, unit: to }, display: `${value} ${from} = ${result} ${to}` };
    },
  },
  {
    name: 'date_diff',
    description: '计算两个日期之间的差值',
    meta: { tier: 'standard', tags: ['date', 'diff', 'days', 'calendar'], category: 'calc' },
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '起始日期，如 2024-01-01' },
        to:   { type: 'string', description: '结束日期，如 2024-12-31' },
      },
      required: ['from', 'to'],
    },
    execute({ from, to }) {
      const d1 = new Date(from), d2 = new Date(to);
      if (isNaN(d1) || isNaN(d2)) return { success: false, data: { error: '日期格式无效' }, display: '日期格式无效' };
      const ms   = d2 - d1;
      const days  = Math.round(ms / 86400000);
      const weeks = parseFloat((days / 7).toFixed(2));
      const months= parseFloat((days / 30.4375).toFixed(2));
      const years = parseFloat((days / 365.25).toFixed(2));
      return { success: true, data: { days, weeks, months, years },
        display: `${Math.abs(days)} 天（约 ${Math.abs(months)} 个月）` };
    },
  },
  {
    name: 'color_convert',
    description: '颜色格式转换（HEX/RGB/HSL）',
    meta: { tier: 'standard', tags: ['color', 'hex', 'rgb', 'hsl', 'convert'], category: 'calc' },
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '颜色值，如 #ff0000 或 rgb(255,0,0)' },
        from:  { type: 'string', enum: ['hex', 'rgb', 'hsl'] },
        to:    { type: 'string', enum: ['hex', 'rgb', 'hsl'] },
      },
      required: ['input', 'from', 'to'],
    },
    execute({ input, from, to }) {
      try {
        let r, g, b;
        if (from === 'hex') {
          const hex = input.replace('#', '');
          r = parseInt(hex.slice(0,2), 16);
          g = parseInt(hex.slice(2,4), 16);
          b = parseInt(hex.slice(4,6), 16);
        } else if (from === 'rgb') {
          const m = input.match(/(\d+)/g);
          [r, g, b] = m.map(Number);
        } else {
          const m = input.match(/[\d.]+/g).map(Number);
          const [h, s, l] = [m[0], m[1]/100, m[2]/100];
          const q = l < 0.5 ? l*(1+s) : l+s-l*s;
          const p = 2*l - q;
          const hue2rgb = (p, q, t) => {
            if (t<0) t+=1; if (t>1) t-=1;
            if (t<1/6) return p+(q-p)*6*t;
            if (t<1/2) return q;
            if (t<2/3) return p+(q-p)*(2/3-t)*6;
            return p;
          };
          r = Math.round(hue2rgb(p,q,h/360+1/3)*255);
          g = Math.round(hue2rgb(p,q,h/360)*255);
          b = Math.round(hue2rgb(p,q,h/360-1/3)*255);
        }
        let result;
        if (to === 'hex') {
          result = '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
        } else if (to === 'rgb') {
          result = `rgb(${r},${g},${b})`;
        } else {
          let rn=r/255, gn=g/255, bn=b/255;
          const max=Math.max(rn,gn,bn), min=Math.min(rn,gn,bn);
          let h2, s2, l2=(max+min)/2;
          if (max===min) { h2=s2=0; }
          else {
            const d=max-min;
            s2 = l2>0.5 ? d/(2-max-min) : d/(max+min);
            if (max===rn) h2=(gn-bn)/d+(gn<bn?6:0);
            else if (max===gn) h2=(bn-rn)/d+2;
            else h2=(rn-gn)/d+4;
            h2 /= 6;
          }
          result = `hsl(${Math.round(h2*360)},${Math.round(s2*100)}%,${Math.round(l2*100)}%)`;
        }
        return { success: true, data: { result }, display: `颜色转换: ${result}` };
      } catch(e) {
        return { success: false, data: { error: e.message }, display: `转换失败: ${e.message}` };
      }
    },
  },
  {
    name: 'ip_calc',
    description: '计算 CIDR 网段信息',
    meta: { tier: 'standard', tags: ['ip', 'cidr', 'network', 'subnet'], category: 'calc' },
    parameters: {
      type: 'object',
      properties: { cidr: { type: 'string', description: 'CIDR 表示法，如 192.168.1.0/24' } },
      required: ['cidr'],
    },
    execute({ cidr }) {
      try {
        const [ip, prefixStr] = cidr.split('/');
        const prefix = parseInt(prefixStr, 10);
        if (isNaN(prefix) || prefix < 0 || prefix > 32) throw new Error('前缀长度无效');
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) throw new Error('IP 地址无效');
        const ipInt = parts.reduce((acc, p) => (acc << 8) | p, 0) >>> 0;
        const mask  = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
        const network   = (ipInt & mask) >>> 0;
        const broadcast = (network | (~mask >>> 0)) >>> 0;
        const toIP = n => [(n>>>24)&0xFF,(n>>>16)&0xFF,(n>>>8)&0xFF,n&0xFF].join('.');
        const totalHosts = Math.pow(2, 32 - prefix);
        return { success: true, data: {
          network:    toIP(network),
          broadcast:  toIP(broadcast),
          firstHost:  prefix < 31 ? toIP(network + 1) : toIP(network),
          lastHost:   prefix < 31 ? toIP(broadcast - 1) : toIP(broadcast),
          mask:       toIP(mask),
          totalHosts,
        }, display: `网络: ${toIP(network)}, 共 ${totalHosts} 个地址` };
      } catch(e) {
        return { success: false, data: { error: e.message }, display: `计算失败: ${e.message}` };
      }
    },
  },
];

window.CalcActions = CalcActions;
