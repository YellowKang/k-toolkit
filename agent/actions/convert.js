'use strict';
function _yamlToJson(yaml) {
const lines = yaml.split('\n');
function parseVal(v) {
v = v.trim();
if (v === '' || v === 'null' || v === '~') return null;
if (v === 'true') return true;
if (v === 'false') return false;
if (/^-?\d+$/.test(v)) return parseInt(v, 10);
if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
if (/^\[.*\]$/.test(v)) {
return v.slice(1, -1).split(',').map(s => parseVal(s.replace(/^\s*["']?|["']?\s*$/g, '')));
}
return v.replace(/^["']|["']$/g, '');
}
function parse(lines, base) {
const obj = {}; let i = 0, isArr = false;
const arr = [];
while (i < lines.length) {
const line = lines[i], trimmed = line.trimStart();
if (!trimmed || trimmed.startsWith('#')) { i++; continue; }
const indent = line.length - trimmed.length;
if (indent < base) break;
if (indent > base) { i++; continue; }
if (trimmed.startsWith('- ')) {
isArr = true;
arr.push(parseVal(trimmed.slice(2)));
i++;
} else {
const ci = trimmed.indexOf(':');
if (ci === -1) { i++; continue; }
const key = trimmed.slice(0, ci).trim();
const val = trimmed.slice(ci + 1).trim();
if (val) { obj[key] = parseVal(val); }
else {
const sub = []; i++;
while (i < lines.length) {
const sl = lines[i], st = sl.trimStart();
if (st && (sl.length - st.length) <= indent) break;
sub.push(sl); i++;
}
obj[key] = parse(sub, indent + 2);
continue;
}
i++;
}
}
return isArr ? arr : obj;
}
return parse(lines, 0);
}
function _jsonToYaml(obj, indent) {
indent = indent || 0;
const pad = '  '.repeat(indent);
if (Array.isArray(obj)) {
return obj.map(v => {
if (typeof v === 'object' && v !== null) return pad + '- ' + _jsonToYaml(v, indent + 1).trimStart();
return pad + '- ' + _yamlVal(v);
}).join('\n');
}
if (typeof obj === 'object' && obj !== null) {
return Object.entries(obj).map(([k, v]) => {
if (typeof v === 'object' && v !== null) return pad + k + ':\n' + _jsonToYaml(v, indent + 1);
return pad + k + ': ' + _yamlVal(v);
}).join('\n');
}
return pad + _yamlVal(obj);
}
function _yamlVal(v) {
if (v === null) return 'null';
if (typeof v === 'string') return /[:#\[\]{}&*!|>'",%@`]/.test(v) ? JSON.stringify(v) : v;
return String(v);
}
function _tomlToJson(toml) {
const result = {}; let current = result;
for (const line of toml.split('\n')) {
const t = line.trim();
if (!t || t.startsWith('#')) continue;
const secMatch = t.match(/^\[([^\]]+)\]$/);
if (secMatch) {
const keys = secMatch[1].split('.');
current = result;
for (const k of keys) { if (!current[k]) current[k] = {}; current = current[k]; }
continue;
}
const eqIdx = t.indexOf('=');
if (eqIdx === -1) continue;
const key = t.slice(0, eqIdx).trim();
const val = t.slice(eqIdx + 1).trim();
current[key] = _tomlParseVal(val);
}
return result;
}
function _tomlParseVal(v) {
if (v === 'true') return true;
if (v === 'false') return false;
if (/^-?\d+$/.test(v)) return parseInt(v, 10);
if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
if (v.startsWith('[') && v.endsWith(']')) {
return v.slice(1, -1).split(',').map(s => _tomlParseVal(s.trim())).filter(x => x !== '');
}
return v;
}
function _jsonToToml(obj, prefix) {
prefix = prefix || '';
const lines = [], sections = [];
for (const [k, v] of Object.entries(obj)) {
if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
sections.push([prefix ? prefix + '.' + k : k, v]);
} else {
lines.push(k + ' = ' + _tomlStringify(v));
}
}
let out = '';
if (prefix) out += '[' + prefix + ']\n';
out += lines.join('\n');
for (const [sec, val] of sections) {
out += '\n\n' + _jsonToToml(val, sec);
}
return out.trim();
}
function _tomlStringify(v) {
if (v === null) return '""';
if (typeof v === 'boolean') return String(v);
if (typeof v === 'number') return String(v);
if (Array.isArray(v)) return '[' + v.map(_tomlStringify).join(', ') + ']';
return JSON.stringify(String(v));
}
function _xmlFormat(xml, minify) {
const parser = new DOMParser();
const doc = parser.parseFromString(xml, 'text/xml');
if (doc.querySelector('parsererror')) throw new Error('XML 解析失败');
if (minify) return new XMLSerializer().serializeToString(doc).replace(/>\s+</g, '><');
const serialized = new XMLSerializer().serializeToString(doc);
let formatted = '', indent = 0;
for (const node of serialized.replace(/>\s*</g, '><').split(/(<[^>]+>)/)) {
if (!node.trim()) continue;
if (node.startsWith('</')) { indent--; formatted += '  '.repeat(Math.max(0, indent)) + node + '\n'; }
else if (node.startsWith('<') && !node.startsWith('<?') && !node.endsWith('/>')) {
formatted += '  '.repeat(indent) + node + '\n'; indent++;
}
else if (node.startsWith('<')) { formatted += '  '.repeat(indent) + node + '\n'; }
else { formatted += '  '.repeat(indent) + node + '\n'; }
}
return formatted.trim();
}
function _xmlToJson(xml) {
const parser = new DOMParser();
const doc = parser.parseFromString(xml, 'text/xml');
if (doc.querySelector('parsererror')) throw new Error('XML 解析失败');
function nodeToObj(node) {
if (node.nodeType === 3) return node.textContent.trim() || undefined;
const obj = {};
for (const attr of node.attributes || []) obj['@' + attr.name] = attr.value;
const children = [...node.childNodes].map(nodeToObj).filter(x => x !== undefined);
if (children.length === 1 && typeof children[0] === 'string') return children[0];
for (const child of node.children) {
const name = child.tagName;
const val = nodeToObj(child);
if (obj[name]) { if (!Array.isArray(obj[name])) obj[name] = [obj[name]]; obj[name].push(val); }
else obj[name] = val;
}
return obj;
}
return nodeToObj(doc.documentElement);
}
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
const _MORSE_MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','-':'-....-','(':'-.--.',')':'-.--.-'};
const _MORSE_REV = Object.fromEntries(Object.entries(_MORSE_MAP).map(([k,v])=>[v,k]));
async function _aesEncrypt(text, password) {
const enc = new TextEncoder();
const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
const buf = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
buf.set(salt, 0); buf.set(iv, salt.length); buf.set(new Uint8Array(encrypted), salt.length + iv.length);
return btoa(String.fromCharCode(...buf));
}
async function _aesDecrypt(b64, password) {
const enc = new TextEncoder();
const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const salt = buf.slice(0, 16), iv = buf.slice(16, 28), data = buf.slice(28);
const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
return new TextDecoder().decode(decrypted);
}
const ConvertActions = [
{
name: 'yaml_to_json',
description: 'YAML 转 JSON',
meta: { tier: 'standard', tags: ['yaml','json','convert','配置'], category: 'convert' },
parameters: { type: 'object', properties: { input: { type: 'string', description: 'YAML 字符串' } }, required: ['input'] },
execute({ input }) {
try { const r = JSON.stringify(_yamlToJson(input), null, 2); return { success: true, data: { result: r }, display: 'YAML → JSON 完成' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
},
},
{
name: 'json_to_yaml',
description: 'JSON 转 YAML',
meta: { tier: 'standard', tags: ['json','yaml','convert','配置'], category: 'convert' },
parameters: { type: 'object', properties: { input: { type: 'string', description: 'JSON 字符串' } }, required: ['input'] },
execute({ input }) {
try { const r = _jsonToYaml(JSON.parse(input)); return { success: true, data: { result: r }, display: 'JSON → YAML 完成' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
},
},
{
name: 'toml_to_json',
description: 'TOML 转 JSON',
meta: { tier: 'standard', tags: ['toml','json','convert','cargo'], category: 'convert' },
parameters: { type: 'object', properties: { input: { type: 'string', description: 'TOML 字符串' } }, required: ['input'] },
execute({ input }) {
try { const r = JSON.stringify(_tomlToJson(input), null, 2); return { success: true, data: { result: r }, display: 'TOML → JSON 完成' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
},
},
{
name: 'json_to_toml',
description: 'JSON 转 TOML',
meta: { tier: 'standard', tags: ['json','toml','convert','cargo'], category: 'convert' },
parameters: { type: 'object', properties: { input: { type: 'string', description: 'JSON 字符串' } }, required: ['input'] },
execute({ input }) {
try { const r = _jsonToToml(JSON.parse(input)); return { success: true, data: { result: r }, display: 'JSON → TOML 完成' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
},
},
{
name: 'xml_format',
description: 'XML 格式化/压缩',
meta: { tier: 'standard', tags: ['xml','format','美化','压缩'], category: 'convert' },
parameters: { type: 'object', properties: { input: { type: 'string' }, minify: { type: 'boolean', default: false } }, required: ['input'] },
execute({ input, minify = false }) {
try { const r = _xmlFormat(input, minify); return { success: true, data: { result: r }, display: minify ? 'XML 已压缩' : 'XML 已格式化' }; }
catch (e) { return { success: false, data: { error: e.message }, display: 'XML 错误: ' + e.message }; }
},
},
{
name: 'xml_to_json',
description: 'XML 转 JSON',
meta: { tier: 'standard', tags: ['xml','json','convert'], category: 'convert' },
parameters: { type: 'object', properties: { input: { type: 'string', description: 'XML 字符串' } }, required: ['input'] },
execute({ input }) {
try { const r = JSON.stringify(_xmlToJson(input), null, 2); return { success: true, data: { result: r }, display: 'XML → JSON 完成' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '转换失败: ' + e.message }; }
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
description: 'AES-GCM 加密文本',
meta: { tier: 'standard', tags: ['aes','encrypt','加密','crypto'], category: 'convert' },
parameters: {
type: 'object',
properties: { text: { type: 'string', description: '明文' }, password: { type: 'string', description: '密码' } },
required: ['text', 'password'],
},
async execute({ text, password }) {
try { const r = await _aesEncrypt(text, password); return { success: true, data: { result: r }, display: 'AES 加密完成（' + r.length + ' 字符）' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '加密失败: ' + e.message }; }
},
},
{
name: 'aes_decrypt',
description: 'AES-GCM 解密',
meta: { tier: 'standard', tags: ['aes','decrypt','解密','crypto'], category: 'convert' },
parameters: {
type: 'object',
properties: { encrypted: { type: 'string', description: '密文(base64)' }, password: { type: 'string', description: '密码' } },
required: ['encrypted', 'password'],
},
async execute({ encrypted, password }) {
try { const r = await _aesDecrypt(encrypted, password); return { success: true, data: { result: r }, display: 'AES 解密完成' }; }
catch (e) { return { success: false, data: { error: e.message }, display: '解密失败: ' + e.message }; }
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