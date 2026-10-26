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
        algo: { type: 'string', enum: ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'], default: 'SHA-256' },
      },
      required: ['text'],
    },
    async execute({ text, algo = 'SHA-256' }) {
      if (algo === 'MD5') { const hash = window._simpleMD5(text); return { success:true, data:{hash,algo}, display:algo+': '+hash }; }
      const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text));
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      return { success: true, data: { hash, algo }, display: `${algo}: ${hash}` };
    },
  },
  // hash_all 由 composite.js 提供（含 MD5），此处不重复定义
  {
    name:'jwt_decode',description:'解码 JWT 的 UTF-8 JSON Header/Payload，返回 exp/nbf 时间状态；不验证签名，不能据此认定令牌可信或有效。',
    meta:{tier:'standard',tags:['jwt','token','decode','auth'],category:'dev'},
    parameters:{type:'object',properties:{token:{type:'string',maxLength:65536}},required:['token'],additionalProperties:false},
    async execute({token}){try{const data=(await window.ToolCompute.load('jwt')).decode(token);return {success:true,data,display:'JWT: '+data.timeStatus+' · signature not verified'};}catch(error){return {success:false,error:error.message};}},
  },
  {
    name:'url_parse',description:'解析 URL，返回有序 entries[{key,value}] 与 params（重复键为数组，单值为字符串），只解码一次；支持基础 URL 和相对路径。',
    meta:{tier:'standard',tags:['url','parse','query','params','参数','解析'],category:'dev'},
    parameters:{type:'object',properties:{url:{type:'string',maxLength:65536},base:{type:'string',description:'解析相对路径时的基础 URL'}},required:['url'],additionalProperties:false},
    async execute({url,base}){try{return {success:true,data:(await window.ToolCompute.load('url')).parse(url,{base})};}catch(error){return {success:false,error:error.message};}},
  },
  {
    name:'url_build',description:'构建 URL；entries 为有序参数数组，保留重复键、空值和片段。默认追加已有查询参数，replace=true 替换已有查询。不发起网络请求。',
    meta:{tier:'standard',tags:['url','build','query','params','构建','参数'],category:'dev'},
    parameters:{type:'object',properties:{base:{type:'string'},entries:{type:'array',maxItems:5000,items:{type:'object',properties:{key:{type:'string'},value:{type:'string'}},required:['key','value'],additionalProperties:false}},replace:{type:'boolean'}},required:['base','entries'],additionalProperties:false},
    async execute({base,entries,replace=false}){try{return {success:true,data:{result:(await window.ToolCompute.load('url')).build(base,entries,{replace})}};}catch(error){return {success:false,error:error.message};}},
  },
  ...['encode','decode'].map(direction=>({
    name:'url_'+direction,description:(direction==='encode'?'URL 编码':'URL 解码')+'，保留空白。mode=component 参数值（默认）/uri 整段 URI/form 表单（空格与 +）。查询参数结果不要重复解码。',
    meta:{tier:'standard',tags:['url',direction,'url'+direction,'编码','解码'],category:'dev'},
    parameters:{type:'object',properties:{text:{type:'string',maxLength:65536},mode:{type:'string',enum:['component','uri','form'],default:'component'}},required:['text'],additionalProperties:false},
    async execute({text,mode='component'}){try{return {success:true,data:{result:(await window.ToolCompute.load('url')).codec(text,{decode:direction==='decode',mode})}};}catch(error){return {success:false,error:error.message};}},
  })),
  {
    name: 'regex_test',
    description: '用正则表达式匹配或替换文本。与页面使用相同的可中止 Worker，替换支持 $1、$& 和命名组；超时明确报错。',
    meta: { tier: 'standard', tags: ['regex', 'regexp', 'match', 'pattern', 'replace', '正则', '替换'], category: 'dev' },
    parameters: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: '正则表达式' },
        flags:   { type: 'string', description: '修饰符，如 gi', default: 'g' },
        text:    { type: 'string', description: '要匹配的文本' },
        mode: { type: 'string', enum: ['match', 'replace'], default: 'match' },
        replacement: { type: 'string', description: '替换模板，默认空字符串' },
      },
      required: ['pattern', 'text'],
    },
    async execute({ pattern, flags = 'g', text, mode = 'match', replacement = '' }, {signal} = {}) {
      const data=await (await window.ToolCompute.load('regex')).run({pattern,flags,text,mode,replacement},{signal});
      if(data.error)return {success:false,error:data.error,display:'Regex: '+data.error};
      if(mode==='replace')return {success:true,data:{result:data.result},display:window.getCurrentLang?.()==='en'?'Replacement complete':'替换完成'};
      const matches=data.matches.map(m=>({match:text.slice(m.index,m.end),index:m.index,groups:m.named,captures:m.groups}));
      return {success:true,data:{matches,count:matches.length,namedGroups:matches[0]?.groups,truncated:data.truncated},display:window.getCurrentLang?.()==='en' ? `${matches.length} matches${data.truncated?' (truncated)':''}` : `${matches.length} 处匹配${data.truncated?'（已截断）':''}`};
    },
  },
  {
    name:'timestamp_convert',description:'严格日期与时间戳转换，与页面共用。unit auto/s/ms/us/ns；自动按位数猜测，历史时间应显式给单位。无偏移日期按 timeZone（默认 local），DST 缺失/重复时间拒绝；重叠可选 earlier/later。us/ns 输出为字符串，精度到毫秒。',
    meta:{tier:'standard',tags:['timestamp','date','time','convert','时间戳','日期'],category:'dev'},
    parameters:{type:'object',properties:{value:{type:'string',maxLength:100},direction:{type:'string',enum:['toDate','toTs']},unit:{type:'string',enum:['auto','s','ms','us','ns']},timeZone:{type:'string',maxLength:80},disambiguation:{type:'string',enum:['reject','earlier','later']}},required:['value','direction'],additionalProperties:false},
    async execute({value,...options}){try{const data=(await ToolCompute.load('date')).timestamp(value,options);return {success:true,data,display:String(data.result)};}catch(e){return {success:false,error:e.message};}}
  },
  {
    name: 'cron_parse',
    description: '解析 Cron 表达式并给出下次执行时间',
    meta: { tier: 'standard', tags: ['cron', 'schedule', 'crontab'], category: 'dev' },
    parameters: {
      type: 'object',
      properties: {
        expr: { type: 'string', description: 'Cron 表达式：5 位 Linux、6 位 Spring（秒在前）或 Quartz（支持 ? L W #）' },
        dialect: { type: 'string', enum: ['auto', 'unix', 'spring', 'quartz'], default: 'auto', description: '格式，默认按字段数自动识别' },
        count: { type: 'integer', minimum: 1, maximum: 20, default: 5, description: '返回的下次执行次数' },
      },
      required: ['expr'],
    },
    async execute({ expr, dialect = 'auto', count = 5 }) {
      const cron = await ToolCompute.load('cron');
      const parsed = cron.parse(expr, dialect);
      if (!parsed.ok) return { success: false, data: { valid: false, field: parsed.field, error: parsed.error }, display: `Cron 无效：${parsed.error}` };
      const lang = typeof getCurrentLang === 'function' && getCurrentLang() === 'en' ? 'en' : 'zh';
      const description = cron.describe(parsed, lang);
      const nextRuns = cron.next(parsed, new Date(), Math.min(Math.max(count, 1), 20)).map(d => `${ToolCompute.localDate(d)} ${d.toTimeString().slice(0, 8)}`);
      return { success: true, data: { valid: true, dialect: parsed.dialect, description, nextRuns },
        display: `${description}\n${nextRuns.join('\n') || '未来 30 年内不会触发'}` };
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
    name:'timezone_convert',description:'严格时区转换：ISO 日期时间或 HH:mm（来源时区今天）。无偏移输入属于 from 时区；DST 跳时拒绝，重复时间默认拒绝，可选 earlier/later。',
    meta:{tier:'standard',tags:['timezone','time','convert','utc','时区'],category:'dev'},
    parameters:{type:'object',properties:{time:{type:'string',maxLength:100},from:{type:'string',maxLength:80},to:{type:'string',maxLength:80},disambiguation:{type:'string',enum:['reject','earlier','later']}},required:['time','from','to'],additionalProperties:false},
    async execute({time,from,to,disambiguation}){try{const data=(await ToolCompute.load('date')).timezone(time,from,to,disambiguation);return {success:true,data,display:data.result};}catch(e){return {success:false,error:e.message};}}
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
        // Browser detection
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

        // OS detection
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

        // Device type
        let device = 'desktop';
        if (/Mobi|Android.*Mobile|iPhone/i.test(ua)) device = 'mobile';
        else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) device = 'tablet';

        // Bot detection
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

        // Fisher-Yates shuffle with crypto randomness
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
    async execute({ content }) {
      const env = await ToolCompute.load('env');
      const { variables, duplicates, invalid } = env.parse(content);
      const entries = Object.entries(variables);
      return { success: true,
        data: { variables, count: entries.length, duplicates, invalidLines: invalid.map(x => x.line) },
        display: `解析到 ${entries.length} 个变量: ${entries.slice(0, 5).map(([k]) => k).join(', ')}${entries.length > 5 ? '...' : ''}` +
          (duplicates.length ? `；重复键 ${duplicates.join(', ')}` : '') + (invalid.length ? `；无法解析 ${invalid.length} 行` : '') };
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
