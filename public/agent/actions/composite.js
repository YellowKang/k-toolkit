'use strict';

// ── Simple MD5 ─────────────────────────────────────────────────
function simpleMD5(str) {
  function sa(x,y){const l=(x&0xffff)+(y&0xffff);return(((x>>16)+(y>>16)+(l>>16))<<16)|(l&0xffff);}
  function br(n,c){return(n<<c)|(n>>>(32-c));}
  function cm(q,a,b,x,s,t){return sa(br(sa(sa(a,q),sa(x,t)),s),b);}
  function ff(a,b,c,d,x,s,t){return cm((b&c)|(~b&d),a,b,x,s,t);}
  function gg(a,b,c,d,x,s,t){return cm((b&d)|(c&~d),a,b,x,s,t);}
  function hh(a,b,c,d,x,s,t){return cm(b^c^d,a,b,x,s,t);}
  function ii(a,b,c,d,x,s,t){return cm(c^(b|~d),a,b,x,s,t);}
  function blk(s){const r=[];for(let i=0;i<64;i+=4)r[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);return r;}
  function cyc(x,k){
    let a=x[0],b=x[1],c=x[2],d=x[3];
    a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
    a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
    a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
    a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
    a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
    a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
    a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
    a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
    a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
    a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
    a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
    a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
    a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
    a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
    a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
    a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
    x[0]=sa(a,x[0]);x[1]=sa(b,x[1]);x[2]=sa(c,x[2]);x[3]=sa(d,x[3]);
  }
  function md51(s){
    const n=s.length,st=[1732584193,-271733879,-1732584194,271733878];let i;
    for(i=64;i<=n;i+=64)cyc(st,blk(s.substring(i-64,i)));
    s=s.substring(i-64);const t=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for(i=0;i<s.length;i++)t[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);
    t[i>>2]|=0x80<<((i%4)<<3);if(i>55){cyc(st,t);for(i=0;i<16;i++)t[i]=0;}
    t[14]=n*8;cyc(st,t);return st;
  }
  function hex(words){return words.map(word => [0,8,16,24].map(shift => ((word >>> shift) & 255).toString(16).padStart(2,'0')).join('')).join('');}
  let s=str;try{s=unescape(encodeURIComponent(str));}catch(e){}
  return hex(md51(s));
}
window._simpleMD5 = simpleMD5;

// hash_all
const HashAllAction = {
  name: 'hash_all',
  description: '一次性计算所有哈希（MD5/SHA-1/SHA-256/SHA-512）。触发：用户说所有哈希/各种哈希/multiple hash。',
  parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
  meta: { tier: 'standard', category: 'dev', icon: '🔐', sideEffect: false },
  async execute({ text }) {
    const enc = new TextEncoder();
    const results = { 'MD5': window._simpleMD5(text) };
    for (const algo of ['SHA-1','SHA-256','SHA-512']) {
      try {
        const buf = await crypto.subtle.digest(algo, enc.encode(text));
        results[algo] = Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
      } catch(e) { results[algo] = 'error:'+e.message; }
    }
    return { success:true, data:{results}, display:Object.entries(results).map(([k,v])=>k+': '+v).join('\n') };
  }
};

window.HashAllAction = HashAllAction;


// text_pipeline
const STEPS = ['base64_encode','base64_decode','url_encode','url_decode',
  'hash_sha1','hash_sha256','hash_sha512','hash_md5',
  'to_upper','to_lower','trim','reverse',
  'to_snake','to_camel','to_kebab','to_pascal',
  'json_format','json_minify','html_encode','html_decode',
  'json_escape','json_unescape','sql_format','xml_format','morse_encode','morse_decode'];

async function applyStep(cur, step) {
  const enc = new TextEncoder();
  const digest = async (a,t) => { const b=await crypto.subtle.digest(a,enc.encode(t)); return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join(''); };
  switch(step) {
    case 'base64_encode': return window.ToolCompute.base64Encode(cur);
    case 'base64_decode': return window.ToolCompute.base64Decode(cur);
    case 'url_encode':    return encodeURIComponent(cur);
    case 'url_decode':    return decodeURIComponent(cur);
    case 'to_upper':      return cur.toUpperCase();
    case 'to_lower':      return cur.toLowerCase();
    case 'trim':          return cur.trim();
    case 'reverse':       return Array.from(cur).reverse().join('');
    case 'to_snake': return window.ToolCompute.caseConvert(cur, 'snake');
    case 'to_camel': return window.ToolCompute.caseConvert(cur, 'camel');
    case 'to_kebab': return window.ToolCompute.caseConvert(cur, 'kebab');
    case 'to_pascal': return window.ToolCompute.caseConvert(cur, 'pascal');
    case 'json_format':   return JSON.stringify(JSON.parse(cur),null,2);
    case 'json_minify':   return JSON.stringify(JSON.parse(cur));
    case 'html_encode':   return cur.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    case 'html_decode':   { const d=document.createElement('textarea');d.innerHTML=cur.replace(/</g,'&lt;');return d.value; }
    case 'hash_sha256':   return digest('SHA-256',cur);
    case 'hash_sha512':   return digest('SHA-512',cur);
    case 'hash_sha1':     return digest('SHA-1',cur);
    case 'hash_md5':      return window._simpleMD5(cur);
    case 'json_escape':   return JSON.stringify(cur).slice(1,-1);
    case 'json_unescape': return JSON.parse('"' + cur + '"');
    case 'sql_format': { const action = window.ConvertActions?.find(a => a.name === 'sql_format'); if (!action) throw new Error('Action unavailable'); const out = await action.execute({input:cur}); if (out.success !== true || typeof out.data?.result !== 'string') throw new Error(out.error || out.data?.error || out.display || 'Conversion failed'); return out.data.result; }
    case 'xml_format': { const action = window.ConvertActions?.find(a => a.name === 'xml_format'); if (!action) throw new Error('Action unavailable'); const out = await action.execute({input:cur}); if (out.success !== true || typeof out.data?.result !== 'string') throw new Error(out.error || out.data?.error || out.display || 'Conversion failed'); return out.data.result; }
    case 'morse_encode': { const action = window.ConvertActions?.find(a => a.name === 'morse_encode'); if (!action) throw new Error('Action unavailable'); const out = await action.execute({text:cur}); if (out.success !== true || typeof out.data?.result !== 'string') throw new Error(out.error || out.data?.error || out.display || 'Conversion failed'); return out.data.result; }
    case 'morse_decode': { const action = window.ConvertActions?.find(a => a.name === 'morse_decode'); if (!action) throw new Error('Action unavailable'); const out = await action.execute({morse:cur}); if (out.success !== true || typeof out.data?.result !== 'string') throw new Error(out.error || out.data?.error || out.display || 'Conversion failed'); return out.data.result; }
    default: throw new Error('Unknown pipeline step: ' + step);
  }
}

const TextPipelineAction = {
  name: 'text_pipeline',
  description: '对文本依次执行多个处理步骤。触发：用户说先...再.../先...然后.../连续处理。',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', maxLength: 65536 },
      steps: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string', enum: STEPS } }
    },
    required: ['input','steps']
  },
  meta: { tier: 'standard', category: 'composite', icon: '⛓', sideEffect: false },
  async execute({ input, steps }, { signal, onProgress } = {}) {
    let cur = input;
    const log = [];
    try {
      if (typeof input !== 'string' || input.length > 65536 || !Array.isArray(steps) || !steps.length || steps.length > 12 || steps.some(step => !STEPS.includes(step))) throw new Error('Invalid pipeline input or steps');
      for (const step of steps) {
        if (signal?.aborted) throw new Error('Task cancelled');
        try {
          cur = await applyStep(cur, step);
          if (cur.length > 65536) throw new Error('Result exceeds 65536 characters');
          if (signal?.aborted) throw new Error('Task cancelled');
          log.push({ step, ok:true, out:cur.slice(0,80) });
          onProgress?.({ step, state:'completed', completed:log.length, total:steps.length });
          await new Promise(resolve => setTimeout(resolve, 0));
        } catch(error) { log.push({ step, ok:false, error:error.message }); throw error; }
      }
      return { success:true, data:{result:cur,steps:log}, display:steps.length+' / '+steps.length+' ✓' };
    } catch(error) { return { success:false, error:error.message, data:{steps:log}, display:error.message }; }
  }
};

window.TextPipelineAction = TextPipelineAction;


// batch_convert
const BatchConvertAction = {
  name: 'batch_convert',
  description: '批量对多个输入值执行同一操作。触发：用户提供多个值需要同一处理，例如把这几个字符串都base64编码。',
  parameters: {
    type: 'object',
    properties: {
      inputs: { type: 'array', minItems: 1, maxItems: 50, items: { type: 'string', maxLength: 65536 }, description: '输入值列表最多50条' },
      operation: { type: 'string', enum: STEPS, description: '要执行的操作' }
    },
    required: ['inputs','operation']
  },
  meta: { tier: 'standard', category: 'composite', icon: '📦', sideEffect: false },
  async execute({ inputs, operation }, { signal } = {}) {
    if (!Array.isArray(inputs) || !inputs.length || inputs.length > 50 || JSON.stringify(inputs).length > 65536 || !STEPS.includes(operation)) return { success:false, error:'Invalid batch or limit exceeded' };
    const results = [];
    for (const item of inputs) {
      if (signal?.aborted) return { success:false, error:'Task cancelled', data:{results,operation} };
      try { const r = await applyStep(item, operation); if (r.length > 65536) throw new Error('Result exceeds limit'); results.push({ input:item, result:r, ok:true }); }
      catch(e) { results.push({ input:item, result:null, ok:false, error:e.message }); }
    }
    return { success:results.every(r=>r.ok), data:{results,operation}, display:results.map(r=>r.ok?(r.input+' -> '+r.result):(r.input+' -> [error:'+r.error+']')).join('\n') };
  }
};

// format_and_validate
const FormatValidateAction = {
  name: 'format_and_validate',
  description: '格式化JSON并同时校验有效性。触发：用户说帮我看看这个JSON对不对/格式化并验证。',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'JSON字符串' },
      minify: { type: 'boolean', default: false }
    },
    required: ['input']
  },
  meta: { tier: 'standard', category: 'text', icon: '📋', sideEffect: false },
  execute({ input, minify=false }) {
    try {
      const parsed = JSON.parse(input);
      const result = minify ? JSON.stringify(parsed) : JSON.stringify(parsed,null,2);
      return { success:true, data:{result,valid:true}, display:'JSON有效 ✓\n'+result.slice(0,300) };
    } catch(e) {
      return { success:false, data:{valid:false,error:e.message}, display:'JSON无效 ✗\n'+e.message };
    }
  }
};

// 汇总注册
const CompositeActions = [HashAllAction, TextPipelineAction, BatchConvertAction, FormatValidateAction];
window.CompositeActions = CompositeActions;
