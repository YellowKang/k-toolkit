'use strict';

// ── 格式转换 & 编码加密 原子 Actions ─────────────────────────────

// YAML / TOML / XML conversions live in compute/formats.js and are shared with the format pages.
const _formats = () => ToolCompute.load('formats');
const _formatError = e => (e.line ? `第 ${e.line} 行：` : '') + e.message;

// ─── SQL 格式化 ──────────────────────────────────────────────────
const _SQL_KW = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','DISTINCT','AS','UNION','UNION ALL','WITH','CASE','WHEN','THEN','ELSE','END'];

function _sqlFormat(sql, minify) {
  if (minify) return sql.replace(/\s+/g, ' ').trim();
  let out = sql;
  _SQL_KW.forEach(kw => {
    out = out.replace(new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi'), kw);
  });
  ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','UNION','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM'].forEach(kw => {
    out = out.replace(new RegExp('\\s*\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi'), '\n' + kw);
  });
  out = out.replace(/\n(AND|OR)\b/g, '\n  $1');
  out = out.replace(/,\s*/g, ',\n  ');
  return out.replace(/^\s*\n/, '').trim();
}

// ─── JSON Diff ──────────────────────────────────────────────────
function _jsonDiff(a, b, path) {
  path = path || '';
  const diffs = [];
  const ka = Object.keys(a), kb = Object.keys(b);
  const allKeys = new Set([...ka, ...kb]);
  for (const k of allKeys) {
    const p = path ? path + '.' + k : k;
    if (!(k in a)) { diffs.push({ path: p, type: 'added', value: b[k] }); continue; }
    if (!(k in b)) { diffs.push({ path: p, type: 'removed', value: a[k] }); continue; }
    if (typeof a[k] === 'object' && typeof b[k] === 'object' && a[k] !== null && b[k] !== null && !Array.isArray(a[k]) && !Array.isArray(b[k])) {
      diffs.push(..._jsonDiff(a[k], b[k], p));
    } else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
      diffs.push({ path: p, type: 'changed', from: a[k], to: b[k] });
    }
  }
  return diffs;
}

// ─── Morse 编解码 ───────────────────────────────────────────────
const _MORSE_MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','-':'-....-','(':'-.--.',')':'-.--.-'};
const _MORSE_REV = Object.fromEntries(Object.entries(_MORSE_MAP).map(([k,v])=>[v,k]));

// ─── AES 加解密 ─────────────────────────────────────────────────
// compute/aes.js 与 AES 页面共用。默认（口令 PBKDF2-SHA256 10 万次 + AES-256-GCM）就是此前的
// Base64(salt‖IV‖密文‖tag) 输出，旧密文照常可解；返回 IV/salt/tag 等公开参数，不返回密钥。
const _aesModule = () => ToolCompute.load('aes');
const _AES_ACTION_PARAMS = {
  mode: { type: 'string', enum: ['GCM', 'CBC', 'CTR'], description: '模式，默认 GCM' },
  keyType: { type: 'string', enum: ['password', 'openssl', 'hex', 'base64', 'utf8'], description: 'password=口令 PBKDF2（默认）；openssl=兼容 openssl enc -pbkdf2（仅 CBC/CTR）；hex/base64/utf8=原始密钥（16/24/32 字节）' },
  keySize: { type: 'integer', minimum: 128, maximum: 256, description: '口令派生的密钥位数：128 / 192 / 256，默认 256' },
  iterations: { type: 'integer', minimum: 1, maximum: 10000000, description: 'PBKDF2 迭代次数，默认 100000' },
  iv: { type: 'string', description: '指定 IV（Hex），不写入输出；不填则随机生成并拼在开头' },
  salt: { type: 'string', description: '指定 salt（Hex，仅口令），不写入输出；不填则随机生成并拼在开头' },
  aad: { type: 'string', description: 'GCM 附加认证数据（UTF-8），解密时须一致' },
};
const _aesActionOptions = (password, { mode, keyType, keySize, iterations, iv, salt, aad, encoding }) =>
  ({ key: password, mode, keyType, keySize, iterations, iv, salt, aad, encoding: encoding === 'auto' ? undefined : encoding });
const _aesActionFailure = (prefix, e) => ({ success: false, data: { error: e.message, code: e.code }, display: prefix + e.message });

// ─── Actions 注册 ────────────────────────────────────────────────
const ConvertActions = [
  {
    name: 'yaml_to_json',
    description: 'YAML 转 JSON',
    meta: { tier: 'standard', tags: ['yaml','json','convert','配置'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string', description: 'YAML 字符串' } }, required: ['input'] },
    async execute({ input }) {
      try { const { value } = await (await _formats()).yamlParse(input); const r = JSON.stringify(value, null, 2); return { success: true, data: { result: r }, display: 'YAML → JSON 完成' }; }
      catch (e) { return { success: false, data: { error: _formatError(e) }, display: '转换失败: ' + _formatError(e) }; }
    },
  },
  {
    name: 'json_to_yaml',
    description: 'JSON 转 YAML',
    meta: { tier: 'standard', tags: ['json','yaml','convert','配置'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string', description: 'JSON 字符串' } }, required: ['input'] },
    async execute({ input }) {
      try { const r = await (await _formats()).yamlStringify(JSON.parse(input)); return { success: true, data: { result: r }, display: 'JSON → YAML 完成' }; }
      catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
    },
  },
  {
    name: 'toml_to_json',
    description: 'TOML 转 JSON',
    meta: { tier: 'standard', tags: ['toml','json','convert','cargo'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string', description: 'TOML 字符串' } }, required: ['input'] },
    async execute({ input }) {
      try { const r = JSON.stringify(await (await _formats()).tomlParse(input), null, 2); return { success: true, data: { result: r }, display: 'TOML → JSON 完成' }; }
      catch (e) { return { success: false, data: { error: _formatError(e) }, display: '转换失败: ' + _formatError(e) }; }
    },
  },
  {
    name: 'json_to_toml',
    description: 'JSON 转 TOML',
    meta: { tier: 'standard', tags: ['json','toml','convert','cargo'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string', description: 'JSON 字符串' } }, required: ['input'] },
    async execute({ input }) {
      try {
        const { text, dropped } = await (await _formats()).tomlStringify(JSON.parse(input));
        return { success: true, data: { result: text, dropped }, display: 'JSON → TOML 完成' + (dropped.length ? `（TOML 无 null，已省略 ${dropped.length} 项）` : '') };
      } catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
    },
  },
  {
    name: 'xml_format',
    description: 'XML 格式化/压缩',
    meta: { tier: 'standard', tags: ['xml','format','美化','压缩'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string' }, minify: { type: 'boolean', default: false } }, required: ['input'] },
    async execute({ input, minify = false }) {
      try { const f = await _formats(); const r = minify ? f.xmlMinify(input) : f.xmlFormat(input); return { success: true, data: { result: r }, display: minify ? 'XML 已压缩' : 'XML 已格式化' }; }
      catch (e) { return { success: false, data: { error: _formatError(e) }, display: 'XML 错误: ' + _formatError(e) }; }
    },
  },
  {
    name: 'xml_to_json',
    description: 'XML 转 JSON',
    meta: { tier: 'standard', tags: ['xml','json','convert'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string', description: 'XML 字符串' } }, required: ['input'] },
    async execute({ input }) {
      try { const r = JSON.stringify((await _formats()).xmlToObject(input), null, 2); return { success: true, data: { result: r }, display: 'XML → JSON 完成' }; }
      catch (e) { return { success: false, data: { error: _formatError(e) }, display: '转换失败: ' + _formatError(e) }; }
    },
  },
  {
    name: 'sql_format',
    description: 'SQL 格式化/压缩',
    meta: { tier: 'standard', tags: ['sql','format','美化','database'], category: 'convert' },
    parameters: { type: 'object', properties: { input: { type: 'string' }, minify: { type: 'boolean', default: false } }, required: ['input'] },
    execute({ input, minify = false }) {
      try { const r = _sqlFormat(input, minify); return { success: true, data: { result: r }, display: minify ? 'SQL 已压缩' : 'SQL 已格式化' }; }
      catch (e) { return { success: false, data: { error: e.message }, display: 'SQL 错误: ' + e.message }; }
    },
  },
  {
    name: 'json_diff',
    description: '递归对比两个 JSON，列出新增/删除/变更字段',
    meta: { tier: 'standard', tags: ['json','diff','compare','对比'], category: 'convert' },
    parameters: {
      type: 'object',
      properties: { a: { type: 'string', description: '原 JSON' }, b: { type: 'string', description: '新 JSON' } },
      required: ['a', 'b'],
    },
    execute({ a, b }) {
      try {
        const diffs = _jsonDiff(JSON.parse(a), JSON.parse(b));
        const summary = diffs.length === 0 ? '完全相同' : `${diffs.filter(d=>d.type==='added').length} 新增, ${diffs.filter(d=>d.type==='removed').length} 删除, ${diffs.filter(d=>d.type==='changed').length} 变更`;
        return { success: true, data: { diffs, summary, count: diffs.length }, display: summary };
      } catch (e) { return { success: false, data: { error: e.message }, display: 'JSON 解析失败: ' + e.message }; }
    },
  },
  {
    name: 'morse_encode',
    description: '文本转摩斯电码',
    meta: { tier: 'standard', tags: ['morse','摩斯','encode','电码'], category: 'convert' },
    parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
    execute({ text }) {
      const result = text.toUpperCase().split('').map(c => _MORSE_MAP[c] || (c === ' ' ? '/' : '?')).join(' ');
      return { success: true, data: { result }, display: result.slice(0, 100) };
    },
  },
  {
    name: 'morse_decode',
    description: '摩斯电码转文本',
    meta: { tier: 'standard', tags: ['morse','摩斯','decode','电码'], category: 'convert' },
    parameters: { type: 'object', properties: { morse: { type: 'string' } }, required: ['morse'] },
    execute({ morse }) {
      const result = morse.split(/\s+/).map(c => c === '/' ? ' ' : (_MORSE_REV[c] || '?')).join('');
      return { success: true, data: { result }, display: result };
    },
  },
  {
    name: 'aes_encrypt',
    description: 'AES 加密文本（默认 AES-256-GCM + PBKDF2 口令，输出 Base64(salt‖IV‖密文‖tag)；可选 CBC/CTR、原始密钥、OpenSSL 格式，可与 OpenSSL/Java/Python 互通）',
    meta: { tier: 'standard', tags: ['aes','encrypt','加密','crypto','openssl','gcm','cbc'], category: 'convert' },
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '明文' },
        password: { type: 'string', description: '口令；keyType 为 hex/base64/utf8 时为原始密钥' },
        ..._AES_ACTION_PARAMS,
        encoding: { type: 'string', enum: ['base64', 'hex'], description: '输出编码，默认 base64' },
      },
      required: ['text', 'password'],
    },
    async execute({ text, password, ...options }) {
      try {
        const r = await (await _aesModule()).encrypt(text, _aesActionOptions(password, options));
        return {
          success: true,
          data: { result: r.output, mode: r.mode, keySize: r.keySize, format: r.format, encoding: r.encoding, iv: r.iv, salt: r.salt, tag: r.tag, ciphertext: r.ciphertext, iterations: r.iterations },
          display: `AES-${r.keySize}-${r.mode} 加密完成（${r.output.length} 字符）`,
        };
      } catch (e) { return _aesActionFailure('加密失败: ', e); }
    },
  },
  {
    name: 'aes_decrypt',
    description: 'AES 解密（参数与 aes_encrypt 一致；口令模式自动识别 OpenSSL "Salted__" 与旧版页面的 IV:密文 格式）',
    meta: { tier: 'standard', tags: ['aes','decrypt','解密','crypto','openssl','gcm','cbc'], category: 'convert' },
    parameters: {
      type: 'object',
      properties: {
        encrypted: { type: 'string', description: '密文（Base64 或 Hex）' },
        password: { type: 'string', description: '口令；keyType 为 hex/base64/utf8 时为原始密钥' },
        ..._AES_ACTION_PARAMS,
        encoding: { type: 'string', enum: ['auto', 'base64', 'hex'], description: '密文编码，默认自动识别' },
      },
      required: ['encrypted', 'password'],
    },
    async execute({ encrypted, password, ...options }) {
      try {
        const r = await (await _aesModule()).decrypt(encrypted, _aesActionOptions(password, options));
        return {
          success: true,
          data: { result: r.text ?? r.hex, encoding: r.text === null ? 'hex' : 'utf8', mode: r.mode, keySize: r.keySize, format: r.format, legacy: r.legacy, iv: r.iv, salt: r.salt },
          display: `AES-${r.keySize}-${r.mode} 解密完成${r.legacy ? '（旧格式）' : ''}${r.text === null ? '（明文非 UTF-8，返回 Hex）' : ''}`,
        };
      } catch (e) { return _aesActionFailure('解密失败: ', e); }
    },
  },
  {
    name: 'string_escape',
    description: '字符串转义/反转义（JSON/HTML/URL/正则/Shell）',
    meta: { tier: 'standard', tags: ['escape','转义','unescape','反转义','字符串'], category: 'convert' },
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        type: { type: 'string', enum: ['json','html','url','regex','shell'], description: '转义类型' },
        unescape: { type: 'boolean', default: false, description: '反转义模式' },
      },
      required: ['text', 'type'],
    },
    execute({ text, type, unescape: unesc = false }) {
      let r;
      if (type === 'json') r = unesc ? text.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\t/g, '\t') : JSON.stringify(text).slice(1, -1);
      else if (type === 'html') r = unesc ? text.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"') : text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      else if (type === 'url') r = unesc ? decodeURIComponent(text) : encodeURIComponent(text);
      else if (type === 'regex') r = unesc ? text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1') : text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      else if (type === 'shell') r = unesc ? text.replace(/\\(['"\\ $`!])/g, '$1') : text.replace(/(['"\\ $`!])/g, '\\$1');
      else r = text;
      return { success: true, data: { result: r }, display: (unesc ? '反转义' : '转义') + '完成' };
    },
  },
];

window.ConvertActions = ConvertActions;
