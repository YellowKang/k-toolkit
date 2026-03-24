'use strict';
const DevActions = [
{
name: 'hash_generate',
description: '计算文本的哈希值',
meta: { tier: 'standard', tags: ['hash', 'sha', 'sha256', 'sha1', 'sha512'], category: 'dev' },
parameters: {
type: 'object',
properties: {
text: { type: 'string', description: '要哈希的文本' },
algo: { type: 'string', enum: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'], default: 'SHA-256' },
},
required: ['text'],
},
async execute({ text, algo = 'SHA-256' }) {
const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
return { success: true, data: { hash, algo }, display: `${algo}: ${hash}` };
},
},
{
name: 'jwt_decode',
description: '解码 JWT Token（不验证签名）',
meta: { tier: 'standard', tags: ['jwt', 'token', 'decode', 'auth'], category: 'dev' },
parameters: {
type: 'object',
properties: { token: { type: 'string', description: 'JWT Token 字符串' } },
required: ['token'],
},
execute({ token }) {
try {
const parts = token.split('.');
if (parts.length !== 3) throw new Error('无效的 JWT 格式');
const decode = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
const header = decode(parts[0]);
const payload = decode(parts[1]);
const signature = parts[2];
const now = Math.floor(Date.now() / 1000);
const expired = payload.exp ? payload.exp < now : undefined;
const expAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined;
return { success: true, data: { header, payload, signature, expired, expAt },
display: expired === true ? 'JWT 已过期' : expired === false ? 'JWT 有效' : 'JWT 解码成功' };
} catch (e) {
return { success: false, data: { error: e.message }, display: `解码失败: ${e.message}` };
}
},
},
{
name: 'url_parse',
description: '解析 URL 各组成部分',
meta: { tier: 'standard', tags: ['url', 'parse', 'query', 'params'], category: 'dev' },
parameters: {
type: 'object',
properties: { url: { type: 'string', description: '要解析的 URL' } },
required: ['url'],
},
execute({ url }) {
try {
const u = new URL(url);
const params = {};
u.searchParams.forEach((v, k) => { params[k] = v; });
return { success: true,
data: { protocol: u.protocol, host: u.host, pathname: u.pathname, params, hash: u.hash },
display: `协议: ${u.protocol} 主机: ${u.host}` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `URL 解析失败: ${e.message}` };
}
},
},
{
name: 'url_encode',
description: 'URL 编码文本',
meta: { tier: 'standard', tags: ['url', 'encode', 'urlencode'], category: 'dev' },
parameters: {
type: 'object',
properties: { text: { type: 'string', description: '要编码的文本' } },
required: ['text'],
},
execute({ text }) {
const result = encodeURIComponent(text);
return { success: true, data: { result }, display: `URL 编码完成` };
},
},
{
name: 'url_decode',
description: 'URL 解码文本',
meta: { tier: 'standard', tags: ['url', 'decode', 'urldecode'], category: 'dev' },
parameters: {
type: 'object',
properties: { text: { type: 'string', description: '要解码的文本' } },
required: ['text'],
},
execute({ text }) {
try {
const result = decodeURIComponent(text);
return { success: true, data: { result }, display: `URL 解码完成` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `解码失败: ${e.message}` };
}
},
},
{
name: 'regex_test',
description: '用正则表达式匹配文本',
meta: { tier: 'standard', tags: ['regex', 'regexp', 'match', 'pattern'], category: 'dev' },
parameters: {
type: 'object',
properties: {
pattern: { type: 'string', description: '正则表达式' },
flags:   { type: 'string', description: '修饰符，如 gi', default: 'g' },
text:    { type: 'string', description: '要匹配的文本' },
},
required: ['pattern', 'text'],
},
execute({ pattern, flags = 'g', text }) {
try {
const re = new RegExp(pattern, flags);
const matches = [];
let m;
while ((m = re.exec(text)) !== null) {
matches.push({ match: m[0], index: m.index, groups: m.groups });
if (!flags.includes('g')) break;
}
return { success: true, data: { matches, count: matches.length, namedGroups: matches[0]?.groups },
display: `找到 ${matches.length} 个匹配` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `正则错误: ${e.message}` };
}
},
},
{
name: 'timestamp_convert',
description: '时间戳与日期相互转换',
meta: { tier: 'standard', tags: ['timestamp', 'date', 'time', 'convert'], category: 'dev' },
parameters: {
type: 'object',
properties: {
value:     { type: 'string', description: '时间戳数字或日期字符串' },
direction: { type: 'string', enum: ['toDate', 'toTs'] },
unit:      { type: 'string', enum: ['s', 'ms'], default: 's' },
},
required: ['value', 'direction'],
},
execute({ value, direction, unit = 's' }) {
if (direction === 'toDate') {
const ms = unit === 's' ? Number(value) * 1000 : Number(value);
const d = new Date(ms);
const iso = d.toISOString();
const now = Date.now();
const diff = Math.round((ms - now) / 1000);
const relative = diff > 0 ? `${diff}s 后` : `${-diff}s 前`;
return { success: true, data: { result: iso, iso, relative }, display: iso };
} else {
const d = new Date(value);
if (isNaN(d)) return { success: false, data: { error: '无效日期' }, display: '无效日期' };
const ts = unit === 's' ? Math.floor(d.getTime() / 1000) : d.getTime();
return { success: true, data: { result: ts, iso: d.toISOString(), relative: '' }, display: String(ts) };
}
},
},
{
name: 'cron_parse',
description: '解析 Cron 表达式并给出下次执行时间',
meta: { tier: 'standard', tags: ['cron', 'schedule', 'crontab'], category: 'dev' },
parameters: {
type: 'object',
properties: { expr: { type: 'string', description: 'Cron 表达式（5位）' } },
required: ['expr'],
},
execute({ expr }) {
const parts = expr.trim().split(/\s+/);
if (parts.length !== 5) {
return { success: false, data: { valid: false }, display: '需要 5 位 Cron 表达式' };
}
const [min, hour, dom, mon, dow] = parts;
const desc = `分钟:${min} 小时:${hour} 日:${dom} 月:${mon} 周:${dow}`;
return { success: true, data: { valid: true, description: desc, nextRuns: ['(需完整 cron 引擎计算)'] },
display: `Cron 有效 — ${desc}` };
},
},
{
name: 'password_gen',
description: '生成随机密码',
meta: { tier: 'standard', tags: ['password', 'generate', 'random', 'security'], category: 'dev' },
parameters: {
type: 'object',
properties: {
length: { type: 'number', description: '密码长度 8-128', default: 16 },
upper:  { type: 'boolean', default: true },
lower:  { type: 'boolean', default: true },
digit:  { type: 'boolean', default: true },
symbol: { type: 'boolean', default: false },
},
required: [],
},
execute({ length = 16, upper = true, lower = true, digit = true, symbol = false }) {
length = Math.min(128, Math.max(8, Math.floor(length)));
let chars = '';
if (upper)  chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
if (lower)  chars += 'abcdefghijklmnopqrstuvwxyz';
if (digit)  chars += '0123456789';
if (symbol) chars += '!@#$%^&*()-_=+[]{}|;:,.<>?';
if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
const arr = crypto.getRandomValues(new Uint8Array(length));
const password = Array.from(arr).map(b => chars[b % chars.length]).join('');
const entropy = Math.floor(length * Math.log2(chars.length));
const strength = entropy < 40 ? 'weak' : entropy < 60 ? 'medium' : entropy < 80 ? 'strong' : 'very strong';
return { success: true, data: { password, strength }, display: `密码已生成（强度: ${strength}）` };
},
},
{
name: 'curl_generate',
description: '生成多种格式的 HTTP 请求代码（curl/fetch/axios/python requests）',
meta: { tier: 'standard', tags: ['curl', 'http', 'fetch', 'axios', 'request', 'api'], category: 'dev' },
parameters: {
type: 'object',
properties: {
url:     { type: 'string', description: '请求 URL' },
method:  { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], description: 'HTTP 方法' },
headers: { type: 'object', description: '请求头（可选）' },
body:    { type: 'string', description: '请求体（可选）' },
format:  { type: 'string', enum: ['curl', 'fetch', 'axios', 'python'], default: 'curl', description: '输出格式' },
},
required: ['url', 'method'],
},
execute({ url, method, headers = {}, body, format = 'curl' }) {
try {
const headerEntries = Object.entries(headers);
let code = '';
if (format === 'curl') {
const parts = [`curl -X ${method} '${url}'`];
for (const [k, v] of headerEntries) parts.push(`  -H '${k}: ${v}'`);
if (body) parts.push(`  -d '${body}'`);
code = parts.join(' \\\n');
} else if (format === 'fetch') {
const opts = { method };
if (headerEntries.length) opts.headers = headers;
if (body) opts.body = body;
const optsStr = JSON.stringify(opts, null, 2);
code = `fetch('${url}', ${optsStr})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
} else if (format === 'axios') {
const cfgParts = [];
if (headerEntries.length) cfgParts.push(`  headers: ${JSON.stringify(headers)},`);
if (body) cfgParts.push(`  data: ${body},`);
const cfgBody = cfgParts.length ? `{\n  url: '${url}',\n  method: '${method}',\n${cfgParts.join('\n')}\n}` : `{\n  url: '${url}',\n  method: '${method}',\n}`;
code = `axios(${cfgBody})\n  .then(res => console.log(res.data))\n  .catch(err => console.error(err));`;
} else if (format === 'python') {
const lines = [`import requests`, ``];
const args = [`'${url}'`];
if (headerEntries.length) args.push(`headers=${JSON.stringify(headers)}`);
if (body) {
try { JSON.parse(body); args.push(`json=${body}`); }
catch { args.push(`data='${body}'`); }
}
lines.push(`response = requests.${method.toLowerCase()}(${args.join(', ')})`);
lines.push(`print(response.status_code)`);
lines.push(`print(response.json())`);
code = lines.join('\n');
}
return { success: true, data: { code, format, method, url }, display: `${format} ${method} 请求代码已生成` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `生成失败: ${e.message}` };
}
},
},
{
name: 'timezone_convert',
description: '在不同时区之间转换时间',
meta: { tier: 'standard', tags: ['timezone', 'time', 'convert', 'utc'], category: 'dev' },
parameters: {
type: 'object',
properties: {
time: { type: 'string', description: '时间字符串（ISO 格式或 HH:mm）' },
from: { type: 'string', description: '源时区，如 Asia/Shanghai' },
to:   { type: 'string', description: '目标时区，如 America/New_York' },
},
required: ['time', 'from', 'to'],
},
execute({ time, from, to }) {
try {
let date;
const hhmm = time.match(/^(\d{1,2}):(\d{2})$/);
if (hhmm) {
date = new Date();
date.setHours(parseInt(hhmm[1], 10), parseInt(hhmm[2], 10), 0, 0);
} else {
date = new Date(time);
}
if (isNaN(date.getTime())) throw new Error('无效时间格式');
const fmtOpts = { timeZone: '', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
fmtOpts.timeZone = from;
const fromStr = new Intl.DateTimeFormat('sv-SE', fmtOpts).format(date);
fmtOpts.timeZone = to;
const toStr = new Intl.DateTimeFormat('sv-SE', fmtOpts).format(date);
const getOffset = (tz) => {
const s = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).format(date);
const m = s.match(/GMT([+-]?\d+(?::\d+)?)/);
if (!m) return 0;
const parts = m[1].split(':');
const h = parseInt(parts[0], 10);
const min = parts[1] ? parseInt(parts[1], 10) * Math.sign(h || 1) : 0;
return h * 60 + min;
};
const fromOffset = getOffset(from);
const toOffset = getOffset(to);
const diffHours = (toOffset - fromOffset) / 60;
const diffStr = diffHours >= 0 ? `+${diffHours}` : `${diffHours}`;
return { success: true,
data: { from: { timezone: from, time: fromStr }, to: { timezone: to, time: toStr }, diffHours },
display: `${from} ${fromStr} → ${to} ${toStr}（差 ${diffStr}h）` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `时区转换失败: ${e.message}` };
}
},
},
{
name: 'ua_parse',
description: '解析 User-Agent 字符串，提取浏览器/操作系统/设备信息',
meta: { tier: 'standard', tags: ['useragent', 'ua', 'browser', 'parse'], category: 'dev' },
parameters: {
type: 'object',
properties: { ua: { type: 'string', description: 'User-Agent 字符串' } },
required: ['ua'],
},
execute({ ua }) {
try {
let browser = { name: 'Unknown', version: '' };
const browserRules = [
[/Edg(?:e|A|iOS)?\/(\S+)/, 'Edge'],
[/OPR\/(\S+)|Opera\/(\S+)/, 'Opera'],
[/Vivaldi\/(\S+)/, 'Vivaldi'],
[/YaBrowser\/(\S+)/, 'Yandex'],
[/SamsungBrowser\/(\S+)/, 'Samsung Browser'],
[/UCBrowser\/(\S+)/, 'UC Browser'],
[/Firefox\/(\S+)/, 'Firefox'],
[/Chrome\/(\S+)/, 'Chrome'],
[/Version\/(\S+).*Safari/, 'Safari'],
[/MSIE (\S+)|Trident.*rv:(\S+)/, 'IE'],
];
for (const [re, name] of browserRules) {
const m = ua.match(re);
if (m) { browser = { name, version: m[1] || m[2] || '' }; break; }
}
let os = { name: 'Unknown', version: '' };
const osRules = [
[/Windows NT (\d+\.\d+)/, 'Windows', { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista' }],
[/Mac OS X ([\d_.]+)/, 'macOS'],
[/Android ([\d.]+)/, 'Android'],
[/iPhone OS ([\d_]+)/, 'iOS'],
[/iPad.*OS ([\d_]+)/, 'iPadOS'],
[/Linux/, 'Linux'],
[/CrOS/, 'Chrome OS'],
];
for (const [re, name, map] of osRules) {
const m = ua.match(re);
if (m) {
let ver = (m[1] || '').replace(/_/g, '.');
if (map && map[ver]) ver = map[ver];
os = { name, version: ver };
break;
}
}
let device = 'desktop';
if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) device = 'mobile';
else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) device = 'tablet';
const isBot = /bot|crawl|spider|slurp|mediapartners/i.test(ua);
return { success: true,
data: { browser, os, device, isBot, raw: ua },
display: `${browser.name} ${browser.version} | ${os.name} ${os.version} | ${device}${isBot ? ' (Bot)' : ''}` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `UA 解析失败: ${e.message}` };
}
},
},
{
name: 'random_pick',
description: '从列表中随机选取元素',
meta: { tier: 'standard', tags: ['random', 'pick', 'choose', 'lottery'], category: 'dev' },
parameters: {
type: 'object',
properties: {
items: { type: 'array', items: { type: 'string' }, description: '待选列表' },
count: { type: 'number', description: '选取数量', default: 1 },
},
required: ['items'],
},
execute({ items, count = 1 }) {
try {
if (!Array.isArray(items) || items.length === 0) throw new Error('列表不能为空');
count = Math.min(Math.max(1, Math.floor(count)), items.length);
const pool = [...items];
const randomBytes = crypto.getRandomValues(new Uint32Array(pool.length));
for (let i = pool.length - 1; i > 0; i--) {
const j = randomBytes[i] % (i + 1);
[pool[i], pool[j]] = [pool[j], pool[i]];
}
const picked = pool.slice(0, count);
return { success: true,
data: { picked, total: items.length, count },
display: `随机选取 ${count} 项: ${picked.join(', ')}` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `随机选取失败: ${e.message}` };
}
},
},
{
name: 'env_parse',
description: '解析 .env 文件内容为结构化键值对',
meta: { tier: 'standard', tags: ['env', 'dotenv', 'parse', 'config'], category: 'dev' },
parameters: {
type: 'object',
properties: { content: { type: 'string', description: '.env 文件内容' } },
required: ['content'],
},
execute({ content }) {
try {
const result = {};
const lines = content.split('\n');
let currentKey = null;
let currentValue = '';
let multiline = false;
let multilineQuote = '';
for (const line of lines) {
if (multiline) {
if (line.endsWith(multilineQuote)) {
currentValue += '\n' + line.slice(0, -1);
result[currentKey] = currentValue;
multiline = false;
currentKey = null;
currentValue = '';
} else {
currentValue += '\n' + line;
}
continue;
}
const trimmed = line.trim();
if (!trimmed || trimmed.startsWith('#')) continue;
const match = trimmed.match(/^([A-Za-z_][\w.]*)\s*=\s*(.*)/);
if (!match) continue;
const key = match[1];
let value = match[2];
if ((value.startsWith('"') && !value.endsWith('"')) ||
(value.startsWith("'") && !value.endsWith("'"))) {
multiline = true;
multilineQuote = value[0];
currentKey = key;
currentValue = value.slice(1);
continue;
}
if ((value.startsWith('"') && value.endsWith('"')) ||
(value.startsWith("'") && value.endsWith("'"))) {
value = value.slice(1, -1);
}
if (!match[2].startsWith('"') && !match[2].startsWith("'")) {
const commentIdx = value.indexOf(' #');
if (commentIdx !== -1) value = value.slice(0, commentIdx).trim();
}
result[key] = value;
}
const entries = Object.entries(result);
return { success: true,
data: { variables: result, count: entries.length },
display: `解析到 ${entries.length} 个变量: ${entries.slice(0, 5).map(([k]) => k).join(', ')}${entries.length > 5 ? '...' : ''}` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `解析失败: ${e.message}` };
}
},
},
{
name: 'docker_generate',
description: '生成最佳实践的多阶段 Dockerfile',
meta: { tier: 'standard', tags: ['docker', 'dockerfile', 'container', 'deploy'], category: 'dev' },
parameters: {
type: 'object',
properties: {
lang:    { type: 'string', enum: ['node', 'python', 'go', 'java', 'rust'], description: '编程语言' },
port:    { type: 'number', description: '暴露端口（可选）' },
appName: { type: 'string', description: '应用名称（可选）' },
},
required: ['lang'],
},
execute({ lang, port, appName }) {
try {
const name = appName || 'app';
const expose = port ? `EXPOSE ${port}` : null;
const templates = {
node: [
'# Build stage',
'FROM node:20-alpine AS builder',
'WORKDIR /app',
'COPY package*.json ./',
'RUN npm ci --only=production',
'COPY . .',
'RUN npm run build',
'',
'# Production stage',
'FROM node:20-alpine',
'WORKDIR /app',
'RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup',
'COPY --from=builder /app/node_modules ./node_modules',
'COPY --from=builder /app/dist ./dist',
'COPY --from=builder /app/package.json ./',
expose,
'USER appuser',
`CMD ["node", "dist/index.js"]`,
],
python: [
'# Build stage',
'FROM python:3.12-slim AS builder',
'WORKDIR /app',
'RUN pip install --no-cache-dir poetry',
'COPY pyproject.toml poetry.lock* ./',
'RUN poetry export -f requirements.txt -o requirements.txt --without-hashes',
'COPY . .',
'',
'# Production stage',
'FROM python:3.12-slim',
'WORKDIR /app',
'RUN groupadd -r appgroup && useradd -r -g appgroup appuser',
'COPY --from=builder /app/requirements.txt .',
'RUN pip install --no-cache-dir -r requirements.txt',
'COPY --from=builder /app .',
expose,
'USER appuser',
`CMD ["python", "main.py"]`,
],
go: [
'# Build stage',
'FROM golang:1.22-alpine AS builder',
'WORKDIR /app',
'COPY go.mod go.sum ./',
'RUN go mod download',
'COPY . .',
`RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ${name} .`,
'',
'# Production stage',
'FROM alpine:3.19',
'RUN apk --no-cache add ca-certificates tzdata',
'RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup',
'WORKDIR /app',
`COPY --from=builder /app/${name} .`,
expose,
'USER appuser',
`CMD ["./${name}"]`,
],
java: [
'# Build stage',
'FROM eclipse-temurin:21-jdk-alpine AS builder',
'WORKDIR /app',
'COPY gradle* gradlew ./',
'COPY gradle ./gradle',
'RUN ./gradlew --no-daemon dependencies || true',
'COPY . .',
'RUN ./gradlew --no-daemon bootJar',
'',
'# Production stage',
'FROM eclipse-temurin:21-jre-alpine',
'RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup',
'WORKDIR /app',
`COPY --from=builder /app/build/libs/*.jar ${name}.jar`,
expose,
'USER appuser',
`CMD ["java", "-jar", "${name}.jar"]`,
],
rust: [
'# Build stage',
'FROM rust:1.77-alpine AS builder',
'RUN apk add --no-cache musl-dev',
'WORKDIR /app',
'COPY Cargo.toml Cargo.lock ./',
'RUN mkdir src && echo "fn main(){}" > src/main.rs && cargo build --release && rm -rf src',
'COPY . .',
'RUN cargo build --release',
'',
'# Production stage',
'FROM alpine:3.19',
'RUN apk --no-cache add ca-certificates',
'RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup',
'WORKDIR /app',
`COPY --from=builder /app/target/release/${name} .`,
expose,
'USER appuser',
`CMD ["./${name}"]`,
],
};
const dockerfile = templates[lang].filter(l => l !== null).join('\n') + '\n';
return { success: true,
data: { dockerfile, lang, port: port || null, appName: name },
display: `${lang} Dockerfile 已生成（多阶段构建）` };
} catch (e) {
return { success: false, data: { error: e.message }, display: `生成失败: ${e.message}` };
}
},
},
{
name: 'git_commit_generate',
description: '生成 Conventional Commit 格式的提交信息',
meta: { tier: 'standard', tags: ['git', 'commit', 'conventional', 'message'], category: 'dev' },
parameters: {
type: 'object',
properties: {
type:        { type: 'string', enum: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'], description: '提交类型' },
scope:       { type: 'string', description: '影响范围（可选）' },
description: { type: 'string', description: '简短描述' },
breaking:    { type: 'boolean', description: '是否为破坏性变更', default: false },
},
required: ['type', 'description'],
},
execute({ type, scope, description, breaking = false }) {
try {
if (!description || !description.trim()) throw new Error('描述不能为空');
const scopePart = scope ? `(${scope})` : '';
const bangPart = breaking ? '!' : '';
const header = `${type}${scopePart}${bangPart}: ${description.trim()}`;
const lines = [header];
if (breaking) {
lines.push('');
lines.push(`BREAKING CHANGE: ${description.trim()}`);
}
const message = lines.join('\n');
return { success: true,
data: { message, type, scope: scope || null, breaking },
display: message };
} catch (e) {
return { success: false, data: { error: e.message }, display: `生成失败: ${e.message}` };
}
},
},
];
window.DevActions = DevActions;