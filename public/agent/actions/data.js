'use strict';

window.DataActions = [
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
