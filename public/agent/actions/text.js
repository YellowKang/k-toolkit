'use strict';

const TextActions = [
  {
    name: 'uuid_generate',
    description: '生成 UUID v4，支持批量生成',
    meta: { tier: 'standard', tags: ['uuid', 'generate', 'id'], category: 'text' },
    parameters: {
      type: 'object',
      properties: {
        count:  { type: 'number', description: '生成数量 1-100', default: 1 },
        format: { type: 'string', enum: ['standard', 'no-dash', 'upper'], default: 'standard' },
      },
      required: [],
    },
    execute({ count = 1, format = 'standard' }) {
      count = Math.min(100, Math.max(1, Math.floor(count)));
      const uuids = [];
      for (let i = 0; i < count; i++) {
        let uuid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
        if (format === 'no-dash') uuid = uuid.replace(/-/g, '');
        if (format === 'upper') uuid = uuid.toUpperCase();
        uuids.push(uuid);
      }
      return { success: true, data: { uuids }, display: `已生成 ${count} 个 UUID` };
    },
  },
  {
    name: 'json_format',
    description: '格式化或压缩 JSON 字符串',
    meta: { tier: 'standard', tags: ['json', 'format', 'minify', 'prettify'], category: 'text' },
    parameters: {
      type: 'object',
      properties: {
        input:  { type: 'string', description: 'JSON 字符串' },
        minify: { type: 'boolean', description: '是否压缩', default: false },
      },
      required: ['input'],
    },
    execute({ input, minify = false }) {
      try {
        const parsed = JSON.parse(input);
        const result = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
        return { success: true, data: { result, valid: true }, display: minify ? 'JSON 已压缩' : 'JSON 已格式化' };
      } catch (e) {
        return { success: false, data: { valid: false, error: e.message }, display: `JSON 无效: ${e.message}` };
      }
    },
  },
  {
    name: 'json_validate',
    description: '验证 JSON 字符串是否合法',
    meta: { tier: 'standard', tags: ['json', 'validate', 'check'], category: 'text' },
    parameters: {
      type: 'object',
      properties: { input: { type: 'string', description: 'JSON 字符串' } },
      required: ['input'],
    },
    execute({ input }) {
      try {
        JSON.parse(input);
        return { success: true, data: { valid: true }, display: 'JSON 格式有效' };
      } catch (e) {
        return { success: true, data: { valid: false, error: e.message }, display: `JSON 无效: ${e.message}` };
      }
    },
  },
  {
    name: 'base64_encode',
    description: '将文本 Base64 编码',
    meta: { tier: 'standard', tags: ['base64', 'encode', 'decode'], category: 'text' },
    parameters: {
      type: 'object',
      properties: {
        text:    { type: 'string', description: '要编码的文本' },
        urlSafe: { type: 'boolean', description: '是否 URL 安全', default: false },
      },
      required: ['text'],
    },
    execute({ text, urlSafe = false }) {
      let result = btoa(unescape(encodeURIComponent(text)));
      if (urlSafe) result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      return { success: true, data: { result }, display: `Base64 编码完成（${result.length} 字符）` };
    },
  },
  {
    name: 'base64_decode',
    description: '将 Base64 字符串解码为文本',
    meta: { tier: 'standard', tags: ['base64', 'decode', 'encode'], category: 'text' },
    parameters: {
      type: 'object',
      properties: { encoded: { type: 'string', description: 'Base64 字符串' } },
      required: ['encoded'],
    },
    execute({ encoded }) {
      try {
        const result = decodeURIComponent(escape(atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))));
        return { success: true, data: { result }, display: `Base64 解码完成（${result.length} 字符）` };
      } catch (e) {
        return { success: false, data: { error: e.message }, display: `解码失败: ${e.message}` };
      }
    },
  },
  {
    name: 'wordcount',
    description: '统计文本字数、行数等信息',
    meta: { tier: 'standard', tags: ['wordcount', 'count', 'words', 'lines', 'stats'], category: 'text' },
    parameters: {
      type: 'object',
      properties: { text: { type: 'string', description: '要统计的文本' } },
      required: ['text'],
    },
    execute({ text }) {
      const chars      = text.length;
      const words      = text.trim() ? text.trim().split(/\s+/).length : 0;
      const lines      = text.split('\n').length;
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
      const chinese    = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      return { success: true, data: { chars, words, lines, paragraphs, chinese },
        display: `${chars} 字符 / ${words} 单词 / ${lines} 行` };
    },
  },
  {
    name: 'case_convert',
    description: '转换文本大小写风格',
    meta: { tier: 'standard', tags: ['case', 'convert', 'camel', 'snake', 'kebab', 'pascal'], category: 'text' },
    parameters: {
      type: 'object',
      properties: {
        text:  { type: 'string', description: '要转换的文本' },
        style: { type: 'string', enum: ['camel', 'snake', 'upper', 'lower', 'kebab', 'pascal'] },
      },
      required: ['text', 'style'],
    },
    execute({ text, style }) {
      const words = text.replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_\-]+/g, ' ').trim().split(/\s+/);
      let result;
      switch (style) {
        case 'camel':  result = words.map((w,i) => i===0 ? w.toLowerCase() : w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
        case 'pascal': result = words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
        case 'snake':  result = words.map(w => w.toLowerCase()).join('_'); break;
        case 'kebab':  result = words.map(w => w.toLowerCase()).join('-'); break;
        case 'upper':  result = text.toUpperCase(); break;
        case 'lower':  result = text.toLowerCase(); break;
        default:       result = text;
      }
      return { success: true, data: { result }, display: `已转换为 ${style}: ${result}` };
    },
  },
  {
    name: 'text_diff',
    description: '比较两段文本的差异',
    meta: { tier: 'standard', tags: ['diff', 'compare', 'text'], category: 'text' },
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'string', description: '原始文本' },
        b: { type: 'string', description: '新文本' },
      },
      required: ['a', 'b'],
    },
    execute({ a, b }) {
      const linesA = a.split('\n');
      const linesB = b.split('\n');
      const setA = new Set(linesA);
      const setB = new Set(linesB);
      const addedLines   = linesB.filter(l => !setA.has(l)).length;
      const removedLines = linesA.filter(l => !setB.has(l)).length;
      const hasDiff = a !== b;
      return { success: true,
        data: { addedLines, removedLines, hasDiff, summary: hasDiff ? `+${addedLines} -${removedLines} 行` : '内容相同' },
        display: hasDiff ? `差异: +${addedLines} 行 / -${removedLines} 行` : '两段文本相同' };
    },
  },
];

window.TextActions = TextActions;
