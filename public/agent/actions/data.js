'use strict';

window.DataActions = [
  ...['json2csv','csv2json'].map(direction=>({
    name:direction==='json2csv'?'json_to_csv':'csv_to_json',
    description:direction==='json2csv'?'JSON 对象或数组转 CSV，默认嵌套对象展开为点路径；路径冲突会报错。与页面共用实现。':'CSV 转 JSON，支持多行引用字段与重复表头；默认保持字符串，infer=true 才推断数值/布尔/null。重复列不会覆盖。',
    meta:{tier:'standard',tags:['csv','json','convert','表格','转换'],category:'convert'},
    parameters:{type:'object',properties:{input:{type:'string',maxLength:65536},delimiter:{type:'string',enum:['auto',',',';','\t','|'],default:'auto'},...(direction==='json2csv'?{flat:{type:'boolean',default:true}}:{header:{type:'boolean',default:true},infer:{type:'boolean',default:false}})},required:['input'],additionalProperties:false},
    async execute({input,...options}){try{return {success:true,data:(await window.ToolCompute.load('csv')).convert(input,{...options,direction})};}catch(error){return {success:false,error:error.message};}},
  })),
  {
    name:'json_schema_generate',description:'从全部 JSON 样本推断 Draft-07 Schema，合并混合类型及可选字段。返回 result 为 Schema 文本，不能替代业务约束。',
    meta:{tier:'standard',tags:['json','schema','generate','推断','生成'],category:'convert'},
    parameters:{type:'object',properties:{input:{type:'string',maxLength:65536}},required:['input'],additionalProperties:false},
    async execute({input}){try{const {result,nodes}=(await window.ToolCompute.load('schema')).infer(input);return {success:true,data:{result,nodes}};}catch(error){return {success:false,error:error.message};}},
  },
  {
    name:'json_schema_validate',description:'用 Draft-07 Schema 校验 JSON，支持标准 format、本地 $ref、组合/条件/数值/字符串/数组规则；未知规则和远程引用报错。Worker 最多 2 秒，返回 valid 和最多 100 条带 JSON Pointer 路径的 errors。assertValid=true 时数据不合规则停止工作流。',
    meta:{tier:'standard',tags:['json','schema','validate','校验','验证'],category:'convert'},
    parameters:{type:'object',properties:{input:{type:'string',maxLength:65536},schema:{type:'string',maxLength:65536},assertValid:{type:'boolean',default:false}},required:['input','schema'],additionalProperties:false},
    async execute({input,schema,assertValid=false},{signal}={}){try{const data=await (await window.ToolCompute.load('schema')).validate(input,schema,{signal});return {success:!assertValid||data.valid,data,...(assertValid&&!data.valid?{error:'JSON does not match schema'}:{})};}catch(error){return {success:false,error:error.message};}},
  },
  {
    name: 'json_unescape',
    description: 'JSON 字符串去转义一层，接受完整字符串字面量或不带外层引号的片段；准确保留路径、反斜杠和 Unicode。返回 result。',
    meta: { tier: 'standard', tags: ['json', 'unescape', 'decode', '转义', '去转义'], category: 'text' },
    parameters: { type: 'object', properties: { input: { type: 'string', maxLength: 65536 } }, required: ['input'], additionalProperties: false },
    async execute({ input }) {
      try { return { success: true, data: { result: (await window.ToolCompute.load('json-text')).unescapeJSON(input) } }; }
      catch (error) { return { success: false, error: error.message }; }
    },
  },
  {
    name: 'json_expand',
    description: '递归展开嵌套 JSON 字符串中的对象和数组，保留普通字符串、数字字符串和路径。返回格式化 result、展开数量 count、外层 layers。',
    meta: { tier: 'standard', tags: ['json', 'nested', 'expand', '嵌套', '展开', '转义'], category: 'text' },
    parameters: { type: 'object', properties: { input: { type: 'string', maxLength: 65536 } }, required: ['input'], additionalProperties: false },
    async execute({ input }) {
      try {
        const { value, count, layers } = (await window.ToolCompute.load('json-text')).expandNested(input);
        return { success: true, data: { result: JSON.stringify(value, null, 2), count, layers } };
      } catch (error) { return { success: false, error: error.message }; }
    },
  },
  {
    name: 'json_extract',
    description: '按 JSON Pointer 提取 JSON 字段，例如 /users/0/name；空路径返回根值。返回保留类型的 value 和可继续处理的文本 result，不执行表达式。',
    meta: { tier: 'standard', tags: ['json', 'extract', 'pointer', '字段', '提取'], category: 'text' },
    parameters: { type: 'object', properties: { input: { type: 'string', maxLength: 65536 }, pointer: { type: 'string', maxLength: 1000 } }, required: ['input', 'pointer'], additionalProperties: false },
    execute({ input, pointer }) {
      try {
        let value = JSON.parse(input);
        if (pointer !== '' && !pointer.startsWith('/')) throw new Error('JSON Pointer must be empty or start with /');
        for (const part of pointer === '' ? [] : pointer.slice(1).split('/')) {
          if (/~(?![01])/u.test(part)) throw new Error('Invalid JSON Pointer escape');
          const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
          if (value === null || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, key)
            || (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(key))) throw new Error('JSON Pointer not found: ' + pointer);
          value = value[key];
        }
        return { success: true, data: { value, result: typeof value === 'string' ? value : JSON.stringify(value) }, display: 'JSON Pointer: ' + (pointer || '/') };
      } catch (error) { return { success: false, error: error.message }; }
    },
  },
  {
    name: 'text_lines',
    description: '清洗文本行：可同时去首尾空格、去空行、去重和排序，保持未排序时的原始顺序。',
    meta: { tier: 'standard', tags: ['lines', 'sort', 'dedup', 'trim', '清洗', '去重', '排序', '行'], category: 'text' },
    parameters: { type: 'object', properties: { input: { type: 'string', maxLength: 65536 }, trim: { type: 'boolean' }, removeEmpty: { type: 'boolean' }, deduplicate: { type: 'boolean' }, sort: { type: 'string', enum: ['none', 'asc', 'desc', 'reverse'] } }, required: ['input'], additionalProperties: false },
    execute({ input, ...options }) {
      const data = window.ToolCompute.processLines(input, options);
      return { success: true, data, display: data.inputLines + ' → ' + data.outputLines + ' lines' };
    },
  },
  {
    name: 'hmac_generate',
    description: '使用密钥计算文本 HMAC（SHA-1/256/384/512），在本地执行。与普通哈希不同，必须提供 key。',
    meta: { tier: 'standard', tags: ['hmac', 'hash', 'sign', '认证', '签名'], category: 'dev' },
    parameters: { type: 'object', properties: { text: { type: 'string', maxLength: 65536 }, key: { type: 'string', minLength: 1, maxLength: 4096 }, algo: { type: 'string', enum: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] } }, required: ['text', 'key'], additionalProperties: false },
    async execute({ text, key, algo = 'SHA-256' }) {
      const enc = new TextEncoder();
      const imported = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: algo }, false, ['sign']);
      const bytes = await crypto.subtle.sign('HMAC', imported, enc.encode(text));
      const hash = Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
      return { success: true, data: { hash, algo }, display: 'HMAC ' + algo + ': ' + hash };
    },
  },
];
