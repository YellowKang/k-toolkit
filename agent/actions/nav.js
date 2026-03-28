'use strict';
const TOOL_CAPS = {
'uuid':         { autoRun: true,  inputs: ['count','format'],              actions: ['generate'],                    desc: '生成 UUID v4，可指定数量和格式(standard/no-dash/upper/braces)' },
'json':         { autoRun: true,  inputs: ['text'],                         actions: ['format','compress','sort','toYaml','toToml','toCsv','diff','escape','tsInterface'], desc: '格式化/压缩/排序/转换 JSON，支持转 YAML/TOML/CSV、对比、转义、生成 TS Interface' },
'base64':       { autoRun: true,  inputs: ['text'],                         actions: ['encode','decode'],              desc: 'Base64 编解码，支持 URL 安全模式和文件 Base64 编解码' },
'hash':         { autoRun: true,  inputs: ['text','key','algo'],             actions: ['calc','hmac'],                   desc: '计算 SHA-1/SHA-256/SHA-384/SHA-512 哈希，或 HMAC（action=hmac 时需 key 和 algo）' },
'case-convert': { autoRun: true,  inputs: ['text'],                         actions: ['camel','snake','kebab','pascal','upper','lower','title'], desc: '文本大小写/命名风格转换' },
'yaml-json':    { autoRun: true,  inputs: ['text'],                         actions: ['toJSON','toYAML'],              desc: 'YAML 与 JSON 互转' },
'regex':        { autoRun: true,  inputs: ['pattern','text','flags'],       actions: ['test'],                         desc: '正则表达式测试，支持 flags(gimsuy)' },
'timestamp':    { autoRun: true,  inputs: ['value'],                        actions: ['toDate','toTs','format'],       desc: '时间戳与日期互转，含多格式输出' },
'unit-convert': { autoRun: true,  inputs: ['value','from','to','category'], actions: ['convert','format'],              desc: '单位换算：长度/重量/温度/存储/速度 + 数字格式化(千分位/货币/科学计数法)' },
'text-diff':    { autoRun: true,  inputs: ['text1','text2'],                actions: ['diff'],                         desc: '逐行对比两段文本' },
'password-gen': { autoRun: true,  inputs: ['length','upper','lower','digit','symbol'], actions: ['generate'], desc: '生成随机密码，可指定长度和字符集' },
'cron':         { autoRun: true,  inputs: ['expr'],                         actions: ['parse'],                        desc: '解析 Cron 表达式，显示下次执行时间' },
'json-csv':     { autoRun: true,  inputs: ['text'],                         actions: ['toCSV','toJSON'],               desc: 'JSON 数组与 CSV 互转' },
'url-parser':   { autoRun: true,  inputs: ['url','text'],                   actions: ['parse','encode','decode','build'], desc: 'URL 解析、编解码、参数构建三合一' },
'html-entity':  { autoRun: true,  inputs: ['text'],                         actions: ['encode','decode'],              desc: 'HTML 实体编解码' },
'sql-format':   { autoRun: true,  inputs: ['text'],                         actions: ['format','minify'],               desc: 'SQL 格式化/压缩' },
'jwt':          { autoRun: true,  inputs: ['token','payload','secret'],     actions: ['decode','generate'],            desc: '解码 JWT 或生成 JWT Token，action=decode 时填 token，action=generate 时填 payload(JSON) 和 secret' },
'img-compress': { autoRun: false, note: '需要上传图片文件，AI 无法自动填充' },
'img-webp':     { autoRun: false, note: '需要上传图片文件' },
'color':        { autoRun: true,  inputs: ['text','fg','bg'], actions: ['convert','check'], desc: '颜色工具：拾色器（需手动）、格式转换（text 输入颜色值）、对比度检查（fg/bg 为 HEX）' },
'gradient':     { autoRun: true,  inputs: ['colors','positions','angle','type'], actions: ['generate'], desc: '生成 CSS 渐变，colors 为颜色数组如["#00c6ff","#0072ff"]，angle 为角度，type 为 linear/radial' },
'aes':          { autoRun: true,  inputs: ['text','key','mode'], actions: ['encrypt','decrypt'], desc: 'AES 加解密' },
'ascii-art':    { autoRun: true,  inputs: ['text'], actions: ['render'], desc: '文字转 ASCII 艺术字' },
'dns-lookup':   { autoRun: true,  inputs: ['text'], actions: ['lookup'], desc: 'DNS 查询' },
'env-parse':    { autoRun: true,  inputs: ['text'], actions: ['parse'], desc: '解析 .env 文件内容' },
'git-commit':   { autoRun: true,  inputs: ['text'], actions: ['generate'], desc: '生成 Git commit message' },
'http-tester':  { autoRun: true,  inputs: ['url','text'], actions: ['send','exportCurl'], desc: 'HTTP 请求测试，支持请求历史和 cURL 导出' },
'ip-calc':      { autoRun: true,  inputs: ['ip','cidr'], actions: ['calc'], desc: 'IP/CIDR 子网计算，ip 为 IP 地址如 192.168.1.1，cidr 为前缀长度如 24' },
'line-sort':    { autoRun: true,  inputs: ['text'], actions: ['asc','desc','shuffle','dedup','reverse'], desc: '行排序/去重，action 指定操作类型' },
'markdown':     { autoRun: true,  inputs: ['text'], actions: ['render','toc'], desc: 'Markdown 预览，支持 TOC 生成和快捷键' },
'morse':        { autoRun: true,  inputs: ['text'], actions: ['encode','decode'], desc: '摩斯电码编解码' },
'nginx-gen':    { autoRun: true,  inputs: ['domain','scene','root','upstream','port','ssl','gzip','cache','accessLog'], actions: ['static','spa','proxy','https','loadbalance'], desc: 'Nginx 配置生成。scene: static/spa/proxy/https/loadbalance；upstream 为代理后端地址如 http://127.0.0.1:3000；ssl/gzip/cache 为 boolean' },
'number-base':  { autoRun: true,  inputs: ['text'], actions: ['convert'], desc: '进制转换 2/8/10/16' },
'number-chinese':{ autoRun: true, inputs: ['text'], actions: ['convert'], desc: '数字与中文大写互转' },
'qrcode':       { autoRun: true,  inputs: ['text'], actions: ['generate'], desc: '生成二维码' },
'semver':       { autoRun: true,  inputs: ['text'], actions: ['parse'], desc: '语义版本号解析比较' },
'slug-gen':     { autoRun: true,  inputs: ['text'], actions: ['generate'], desc: '生成 URL slug' },
'text-escape':  { autoRun: true,  inputs: ['text','type'], actions: ['escape','unescape'], desc: '文本转义/反转义，type: json/html/url/regex/shell' },
'timezone':     { autoRun: true,  inputs: ['text'], actions: ['convert'], desc: '时区转换' },
'unicode-convert':{ autoRun: true,inputs: ['text'], actions: ['encode','decode'], desc: 'Unicode 编解码' },
'user-agent':   { autoRun: true,  inputs: ['text'], actions: ['parse'], desc: '解析 User-Agent 字符串' },
'xml-format':   { autoRun: true,  inputs: ['text'], actions: ['format','minify','toJson'], desc: 'XML 格式化/压缩/转JSON' },
'palette-gen':  { autoRun: true,  inputs: ['color'], actions: ['generate'], desc: '基于颜色生成调色板' },
'shadow':       { autoRun: true,  inputs: ['x','y','blur','spread','color','inset'], actions: ['generate'], desc: 'CSS box-shadow 生成器，可指定偏移/模糊/颜色' },
'date-diff':    { autoRun: true,  inputs: ['from','to'], actions: ['calc'], desc: '计算两个日期之间的天数/周数/月数，from/to 为日期字符串如 2024-01-01' },
'byte-convert': { autoRun: true,  inputs: ['value','unit'], actions: ['convert'], desc: '字节单位换算，value 为数值，unit 为 B/KB/MB/GB/TB' },
'loan-calc':    { autoRun: true,  inputs: ['amount','rate','months'], actions: ['calc'], desc: '贷款计算，amount 本金，rate 年利率(%)，months 期数' },
'calculator':   { autoRun: true,  inputs: ['expr'], actions: ['calc'], desc: '科学计算器，支持 sin/cos/tan/log/ln/sqrt/pow/π/e 等科学函数和括号' },
'wordcount':    { autoRun: true,  inputs: ['text'], actions: ['count'], desc: '统计字符数、单词数、行数、段落数' },
'lorem':        { autoRun: true,  inputs: ['count','lang'], actions: ['generate'], desc: '生成占位文本，count 段落数，lang 为 zh/en' },
'curl-gen':     { autoRun: true,  inputs: ['url','method','headers','body','curl'], actions: ['generate','import'], desc: '生成 curl/fetch/axios 代码 或 导入 cURL 命令反解析' },
'http-status':  { autoRun: true,  inputs: ['text'], actions: ['search'], desc: '查询 HTTP 状态码含义' },
'flexbox':      { autoRun: true,  inputs: ['direction','justify','align','wrap','gap'], actions: ['generate'], desc: '生成 Flexbox CSS 布局代码' },
'diff-json':    { autoRun: true,  inputs: ['text','text2'], actions: ['diff'], desc: '两个 JSON 递归对比，高亮差异' },
'toml-json':    { autoRun: true,  inputs: ['text'], actions: ['toJSON','toTOML'], desc: 'TOML 与 JSON 互转' },
'docker-gen':   { autoRun: true,  inputs: ['lang','port','appName'], actions: ['generate'], desc: '选择语言生成 Dockerfile' },
'css-unit':     { autoRun: true,  inputs: ['value','unit','base','vw'], actions: ['convert'], desc: 'CSS 单位互转 px/rem/em/vw/vh/pt' },
'aspect-ratio': { autoRun: true,  inputs: ['width','height'], actions: ['calc'], desc: '屏幕/图片比例计算' },
'clip-path':    { autoRun: false, note: 'clip-path 生成器需要拖拽控制点交互' },
'age-calc':     { autoRun: true,  inputs: ['date'], actions: ['calc'], desc: '年龄计算，date 为出生日期如 1990-01-01' },
'tax-calc':     { autoRun: true,  inputs: ['salary','insurance','extra'], actions: ['calc'], desc: '个税计算，salary 月薪，insurance 五险一金，extra 专项扣除' },
'lunar-calendar':{ autoRun: true, inputs: ['date'], actions: ['query'], desc: '农历查询，date 为日期如 2024-01-01' },
'text-template':{ autoRun: true,  inputs: ['template','vars'], actions: ['render','batch'], desc: '文本模板渲染，{{变量}} 替换，支持 JSON 批量数据' },
'terminal-color':{ autoRun: true, inputs: ['text','fg','bg','style'], actions: ['generate'], desc: 'ANSI 终端颜色码生成' },
'countdown':    { autoRun: true,  inputs: ['target','name'], actions: ['start'], desc: '倒计时，target 为目标日期' },
'spinner':      { autoRun: true,  inputs: ['options'], actions: ['spin'], desc: '随机抽签，options 为换行分隔的名单' },
'svg-preview':  { autoRun: true,  inputs: ['text'], actions: ['preview'], desc: 'SVG 代码预览' },
'img-base64':   { autoRun: false, note: '需要上传图片文件，AI 无法自动填充' },
'qrcode-decode':{ autoRun: false, note: '需要上传图片识别二维码' },
'img-exif':     { autoRun: false, note: '需要上传图片读取 EXIF' },
'speed-test':   { autoRun: false, note: '网速测试需要实际网络请求' },
'typing-speed': { autoRun: false, note: '打字速度测试需要用户实时输入' },
'stopwatch':    { autoRun: false, note: '秒表需要用户手动操作' },
'pomodoro':     { autoRun: false, note: '番茄钟需要用户手动启停' },
'meeting-cost': { autoRun: false, note: '会议费用计时器需要实时交互' },
'matrix-rain':  { autoRun: false, note: '矩阵雨为 Canvas 动画展示' },
'noise-gen':    { autoRun: false, note: '白噪音需要音频播放交互' },
'emoji-picker': { autoRun: false, note: 'Emoji 选择器需要用户点选' },
'todo':         { autoRun: false, note: 'Todo 清单需要用户逐条管理' },
'note':         { autoRun: false, note: '便签需要用户自行编辑' },
'world-clock':  { autoRun: false, note: '世界时钟为实时展示，无需输入' },
'ip-info':      { autoRun: false, note: 'IP 信息自动查询，无需输入' },
'mock-data':    { autoRun: true,  inputs: ['count','fields'], actions: ['generate'], desc: '批量生成模拟数据（姓名/手机/邮箱/地址等），count 为条数，fields 为字段配置' },
'chmod-calc':   { autoRun: true,  inputs: ['text'], actions: ['calc'], desc: 'Linux chmod 权限计算，输入数字如 755 或 644 自动解析' },
'placeholder-img':{ autoRun: true, inputs: ['width','height','bg','color','text'], actions: ['generate'], desc: '生成占位图，width/height 为尺寸' },
'string-inspect':{ autoRun: true, inputs: ['text'], actions: ['inspect'], desc: '检查字符串每个字符的 Unicode 码点、字节数、不可见字符高亮' },
'json-schema':  { autoRun: true,  inputs: ['text'], actions: ['generate','validate'], desc: '从 JSON 示例推断 Schema（Draft-07），或校验 JSON 是否符合 Schema' },
'favicon-gen':  { autoRun: true,  inputs: ['text','bg','color'], actions: ['generate'], desc: '从文字/Emoji 生成多尺寸 Favicon' },
'llm-token':    { autoRun: true,  inputs: ['text'], actions: ['count'], desc: '估算文本 LLM Token 数和 API 价格' },
'hmac-gen':     { autoRun: true,  inputs: ['text','key','algo'], actions: ['generate'], desc: 'HMAC 消息认证码生成，algo: SHA-256/SHA-384/SHA-512/SHA-1' },
'ai-chat':      { autoRun: false, desc: 'AI Chat', note: 'Direct chat with AI models' },
};
const TOOL_RUNNERS = {
'hash': {
mainInput: '#hashInput',
trigger: 'calcHash',
outputSelector: '#hashResultPanel',
waitMs: 600,
},
'base64': {
mainInput: '#b64Input',
triggerMap: { encode: 'encodeB64', decode: 'decodeB64' },
trigger: 'encodeB64',
outputSelector: '#b64ResultPanel',
waitMs: 200,
},
'yaml-json': {
mainInput: '#yjInput',
triggerMap: { toJSON: 'yjToJSON', toYAML: 'yjToYAML' },
trigger: 'yjToJSON',
outputSelector: '#yjResult',
waitMs: 200,
},
'json': {
mainInput: '#jsonInput',
triggerMap: { format: 'formatJSON', compress: 'compressJSON', sort: 'jsonSort' },
trigger: 'formatJSON',
outputSelector: '#jsonResultPanel',
waitMs: 200,
},
'json-format': {
mainInput: '#jsonInput',
triggerMap: { format: 'formatJSON', compress: 'compressJSON', sort: 'jsonSort' },
trigger: 'formatJSON',
outputSelector: '#jsonResultPanel',
waitMs: 200,
},
'case-convert': {
mainInput: '#ccText',
triggerMap: {
camel:    () => window.ccConvert && window.ccConvert('camel'),
snake:    () => window.ccConvert && window.ccConvert('snake'),
kebab:    () => window.ccConvert && window.ccConvert('kebab'),
pascal:   () => window.ccConvert && window.ccConvert('pascal'),
upper:    () => window.ccConvert && window.ccConvert('upper'),
lower:    () => window.ccConvert && window.ccConvert('lower'),
title:    () => window.ccConvert && window.ccConvert('title'),
},
outputSelector: '#ccOutput',
waitMs: 200,
},
'uuid': {
mainInput: '#uuidCount',
trigger: 'generateUUIDs',
outputSelector: '#uuidList',
waitMs: 200,
},
'regex': {
mainInput: '#regexText',
extraInputs: { pattern: '#regexPattern', flags: '#regexFlags' },
trigger: 'runRegex',
outputSelector: '#regexResultPanel',
waitMs: 300,
},
'timestamp': {
mainInput: '#tsInput',
triggerMap: { toDate: 'tsToDate', toTs: 'dateToTs', format: 'doTimeFormat' },
outputSelector: '#tsDateResult',
waitMs: 200,
actionOverrides: {
format: {
mainInput: '#tfInput',
trigger: 'doTimeFormat',
outputSelector: '#tfResult',
waitMs: 300,
}
}
},
'unit-convert': {
mainInput: '#ucFromVal',
extraInputs: { from: '#ucFromUnit', to: '#ucToUnit' },
trigger: 'ucConvert',
outputSelector: '#ucAllResults',
waitMs: 300,
},
'cron': {
mainInput: '#cronInput',
trigger: 'parseCron',
outputSelector: '#cronNextList',
waitMs: 300,
},
'password-gen': {
mainInput: null,  
trigger: 'generatePasswords',
outputSelector: '#pwdResult',
waitMs: 200,
},
'jwt': {
mainInput: '#jwtInput',
trigger: 'decodeJWT',
outputSelector: '#jwtResultPanel',
waitMs: 200,
beforeRun(params) {
if (params.action === 'generate') {
jwtSwitchTab('generate');
} else {
jwtSwitchTab('decode');
}
},
actionOverrides: {
generate: {
mainInput: '#jwtGenPayload',
extraInputs: { secret: '#jwtGenSecret' },
trigger: 'jwtGenerate',
outputSelector: '#jwtGenOutput',
waitMs: 400,
}
}
},
'color': {
mainInput: '#cvInput',
trigger: 'convertColor',
outputSelector: '#cvResults',
waitMs: 300,
beforeRun(params) {
if (params.action === 'check') {
window.colorSwitchTab && window.colorSwitchTab('contrast');
} else {
window.colorSwitchTab && window.colorSwitchTab('convert');
}
},
actionOverrides: {
check: {
mainInput: '#ccFgHex',
extraInputs: { bg: '#ccBgHex' },
trigger: '_ccUpdate',
outputSelector: '#ccRatio',
waitMs: 300,
}
}
},
'sql-format': {
mainInput: '#sqlInput',
trigger: 'formatSQL',
outputSelector: '#sqlOutput',
waitMs: 300,
},
'html-entity': {
mainInput: '#heInput',
triggerMap: { encode: 'heEncode', decode: 'heDecode' },
outputSelector: '#heOutput',
waitMs: 200,
},
'text-diff': {
mainInput: '#diffA',
extraInputs: { text2: '#diffB' },
trigger: 'runDiff',
outputSelector: '#diffResultPanel',
waitMs: 300,
},
'url-parser': {
mainInput: '#urlInput',
preTriggerMap: {
parse:  () => window.urlSwitchTab && window.urlSwitchTab('parse'),
encode: () => window.urlSwitchTab && window.urlSwitchTab('encode'),
decode: () => window.urlSwitchTab && window.urlSwitchTab('encode'),
build:  () => window.urlSwitchTab && window.urlSwitchTab('build'),
},
triggerMap: { parse: 'parseUrl', encode: 'doUrlEncode', decode: 'doUrlEncode' },
trigger: 'parseUrl',
outputSelector: '#urlFields',
waitMs: 200,
actionOverrides: {
encode: {
mainInput: '#ueInput',
trigger: 'doUrlEncode',
outputSelector: '#ueOutput',
waitMs: 200,
},
decode: {
mainInput: '#ueInput',
trigger: 'doUrlEncode',
outputSelector: '#ueOutput',
waitMs: 200,
}
}
},
'json-csv': {
mainInput: '#jcInput',
trigger: 'convertJsonCsv',
outputSelector: '#jcOutput',
waitMs: 300,
},
'aes': {
mainInput: '#aesInput',
extraInputs: { key: '#aesKey' },
trigger: 'doAES',
outputSelector: '#aesOutput',
waitMs: 500,
},
'ascii-art': {
mainInput: '#aaInput',
trigger: 'aaGenerate',
outputSelector: '#aaOutput',
waitMs: 400,
},
'dns-lookup': {
mainInput: '#dnsInput',
trigger: 'doDnsLookup',
outputSelector: '#dnsResult',
waitMs: 2000,
},
'env-parse': {
mainInput: '#epInput',
trigger: 'epParse',
outputSelector: '#epResult',
waitMs: 200,
},
'git-commit': {
mainInput: '#gcSubject',
trigger: 'gcPreview',
outputSelector: '#gcPreviewBox',
waitMs: 200,
},
'http-tester': {
mainInput: '#htUrl',
trigger: 'doHttpTest',
outputSelector: '#htResBody',
waitMs: 3000,
},
'ip-calc': {
mainInput: '#ipInput',
extraInputs: { cidr: '#ipCidr' },
trigger: 'ipCalc',
outputSelector: '#ipOutput',
waitMs: 300,
},
'line-sort': {
mainInput: '#lsInput',
triggerMap: {
asc:     () => window.doLineSort && window.doLineSort('asc'),
desc:    () => window.doLineSort && window.doLineSort('desc'),
shuffle: () => window.doLineSort && window.doLineSort('shuffle'),
dedup:   () => window.doLineSort && window.doLineSort('dedup'),
reverse: () => window.doLineSort && window.doLineSort('reverse'),
},
trigger: () => window.doLineSort && window.doLineSort('asc'),
outputSelector: '#lsOutput',
waitMs: 200,
},
'markdown': {
mainInput: '#mdInput',
trigger: 'mdUpdate',
outputSelector: '#mdPreview',
waitMs: 300,
},
'morse': {
mainInput: '#morseInput',
preTriggerMap: {
encode: () => window.setMorseMode && window.setMorseMode('enc'),
decode: () => window.setMorseMode && window.setMorseMode('dec'),
},
trigger: 'doMorse',
outputSelector: '#morseResult',
waitMs: 200,
},
'nginx-gen': {
mainInput: '#ngDomain',
trigger: 'ngGen',
outputSelector: '#ngOutput',
waitMs: 200,
},
'number-base': {
mainInput: '#nbDec',
trigger: () => window.nbConvert && window.nbConvert('dec', document.getElementById('nbDec')?.value),
outputSelector: '#nbHex',
waitMs: 200,
},
'number-chinese': {
mainInput: '#ncInput',
trigger: 'ncConvert',
outputSelector: '#ncResult',
waitMs: 200,
},
'qrcode': {
mainInput: '#qrInput',
trigger: 'generateQr',
outputSelector: '#qrResult',
waitMs: 600,
},
'semver': {
mainInput: '#svParse',
trigger: 'doSvParse',
outputSelector: '#svParseResult',
waitMs: 200,
},
'slug-gen': {
mainInput: '#sgInput',
trigger: 'doSlugGen',
outputSelector: '#sgResult',
waitMs: 200,
},
'text-escape': {
mainInput: '#esc-input',
trigger: () => document.getElementById('esc-btn') && document.getElementById('esc-btn').click(),
outputSelector: '#esc-output',
waitMs: 200,
},
'timezone': {
mainInput: '#tzInput',
trigger: 'tzConvert',
outputSelector: '#tzResult',
waitMs: 200,
},
'unicode-convert': {
mainInput: '#unicodeInput',
triggerMap: { encode: 'encodeUnicode', decode: 'decodeUnicode' },
trigger: 'encodeUnicode',
outputSelector: '#unicodeOutput',
waitMs: 200,
},
'user-agent': {
mainInput: '#uaInput',
trigger: 'parseCustomUA',
outputSelector: '#uaParseOutput',
waitMs: 200,
},
'xml-format': {
mainInput: '#xmlInput',
trigger: 'doXml',
outputSelector: '#xmlOutput',
waitMs: 300,
},
'date-diff': {
mainInput: '#ddFrom',
extraInputs: { to: '#ddTo' },
trigger: 'ddCalc',
outputSelector: '#ddOutput',
waitMs: 300,
},
'byte-convert': {
mainInput: '#bcVal',
trigger: 'bcCalc',
outputSelector: '#bcAll',
waitMs: 200,
},
'loan-calc': {
mainInput: '#lcAmount',
extraInputs: { rate: '#lcRate', months: '#lcMonths' },
trigger: 'lcCalc',
outputSelector: '#lcSummary',
waitMs: 300,
},
'wordcount': {
mainInput: '#wcInput',
trigger: 'wcUpdate',
outputSelector: '#wcStats',
waitMs: 200,
},
'diff-json': {
mainInput: '#djInputA',
extraInputs: { text2: '#djInputB' },
trigger: 'djCompare',
outputSelector: '#djOutput',
waitMs: 400,
},
'toml-json': {
mainInput: '#tjTomlIn',
triggerMap: { toJSON: 'tjTomlToJson', toTOML: 'tjJsonToToml' },
trigger: 'tjTomlToJson',
outputSelector: '#tjResult',
waitMs: 300,
},
'docker-gen': {
mainInput: '#dgLang',
extraInputs: { port: '#dgPort', appName: '#dgAppName' },
trigger: 'dgGenerate',
outputSelector: '#dgOutput',
waitMs: 300,
},
'css-unit': {
mainInput: '#cuValue',
trigger: 'cuConvert',
outputSelector: '#cuResult',
waitMs: 200,
},
'aspect-ratio': {
mainInput: '#ar-w',
extraInputs: { height: '#ar-h' },
trigger: null, 
outputSelector: '#ar-result',
waitMs: 200,
},
'age-calc': {
mainInput: '#ageDate',
trigger: 'doAgeCalc',
outputSelector: '#ageResult',
waitMs: 300,
},
'tax-calc': {
mainInput: '#taxSalary',
extraInputs: { insurance: '#taxIns', extra: '#taxExtra' },
trigger: 'doTaxCalc',
outputSelector: '#taxResult',
waitMs: 300,
},
'lunar-calendar': {
mainInput: '#lcDate',
trigger: 'doLunar',
outputSelector: '#lcResult',
waitMs: 300,
},
'text-template': {
mainInput: '#ttTpl',
extraInputs: { vars: '#ttBatchData' },
trigger: () => window._ttParse && window._ttParse(),
outputSelector: '#ttOutput',
waitMs: 300,
actionOverrides: {
batch: {
mainInput: '#ttBatchData',
trigger: () => window._ttBatch && window._ttBatch(),
outputSelector: '#ttOutput',
waitMs: 500,
}
}
},
'terminal-color': {
mainInput: '#tcText',
trigger: 'doTc',
outputSelector: '#tcCode',
waitMs: 200,
},
'spinner': {
mainInput: '#spinOptions',
trigger: '_spinDoSpin',
outputSelector: '#spinResult',
waitMs: 1500,
},
'svg-preview': {
mainInput: '#svg-input',
trigger: null, 
outputSelector: '#svg-info',
waitMs: 300,
},
'flexbox': {
mainInput: null,
extraInputs: { direction: '#fxDir', justify: '#fxJustify', align: '#fxAlign', wrap: '#fxWrap', gap: '#fxGap' },
trigger: 'updateFlex',
outputSelector: '#flexCode',
waitMs: 200,
},
'http-status': {
mainInput: '#hsSearch',
trigger: () => window.hsFilter && window.hsFilter(),
outputSelector: '#hsGrid',
waitMs: 200,
},
'lorem': {
mainInput: '#loremCount',
trigger: 'loremGen',
outputSelector: '#loremOutput',
waitMs: 300,
},
'curl-gen': {
mainInput: '#cgUrl',
trigger: 'cgGenerate',
outputSelector: '#cgResultPanel',
waitMs: 300,
actionOverrides: {
import: {
mainInput: '#cgImportInput',
trigger: 'cgImportParse',
outputSelector: '#cgOutput',
waitMs: 500,
}
}
},
'countdown': {
mainInput: '#cdTarget',
extraInputs: { name: '#cdName' },
trigger: 'cdStart',
outputSelector: '#cdDisplay',
waitMs: 500,
},
'mock-data': {
mainInput: '#mockCount',
trigger: '_mockGenerate',
outputSelector: '#mockResultPanel',
waitMs: 500,
},
'chmod-calc': {
mainInput: '#chmodNumIn',
trigger: '_chmodFromNum',
outputSelector: '#chmodResults',
waitMs: 200,
},
'placeholder-img': {
mainInput: '#phW',
extraInputs: { height: '#phH' },
trigger: 'phGenerate',
outputSelector: '#phResult',
waitMs: 500,
},
'string-inspect': {
mainInput: '#siInput',
trigger: '_siAnalyze',
outputSelector: '#siStats',
waitMs: 300,
},
'json-schema': {
mainInput: '#jsInput',
trigger: '_jsGenerate',
outputSelector: '#jsOutput',
waitMs: 300,
},
'favicon-gen': {
mainInput: '#favText',
trigger: '_favGenAll',
outputSelector: '#favSizesPanel',
waitMs: 500,
},
'llm-token': {
mainInput: '#ltInput',
trigger: 'ltUpdate',
outputSelector: '#ltStats',
waitMs: 200,
},
'hmac-gen': {
mainInput: '#hmacMsg',
extraInputs: { key: '#hmacKey' },
trigger: '_hmacAutoCalc',
outputSelector: '#hmacResultPanel',
waitMs: 400,
},
};
const SPECIAL_RUNNERS = {
'nginx-gen': async ({ inputs, action }) => {
const deadline = Date.now() + 2000;
while (!document.getElementById('ngDomain') && Date.now() < deadline) {
await new Promise(r => setTimeout(r, 80));
}
if (!document.getElementById('ngDomain')) {
return { success: false, data: { error: '工具页未就绪' }, display: '工具页未就绪' };
}
const sceneMap = { static: 'static', spa: 'spa', proxy: 'proxy', https: 'https', loadbalance: 'loadbalance',
reverse_proxy: 'proxy', https_proxy: 'https', lb: 'loadbalance' };
const scene = sceneMap[inputs.scene || action] || inputs.scene || 'proxy';
const sceneEl = document.getElementById('ngScene');
if (sceneEl) { sceneEl.value = scene; sceneEl.dispatchEvent(new Event('change')); }
const domainEl = document.getElementById('ngDomain');
if (domainEl && inputs.domain) { domainEl.value = inputs.domain; domainEl.dispatchEvent(new Event('input')); }
const rootEl = document.getElementById('ngRoot');
if (rootEl && (inputs.root || inputs.upstream)) {
rootEl.value = inputs.upstream || inputs.root;
rootEl.dispatchEvent(new Event('input'));
}
const portEl = document.getElementById('ngPort');
if (portEl && inputs.port) { portEl.value = inputs.port; portEl.dispatchEvent(new Event('input')); }
const setCheck = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.checked = !!val; };
if (inputs.ssl != null) setCheck('ngSsl', inputs.ssl);
if (inputs.gzip != null) setCheck('ngGzip', inputs.gzip);
if (inputs.cache != null) setCheck('ngCache', inputs.cache);
if (inputs.accessLog != null) setCheck('ngAccessLog', inputs.accessLog);
window.ngApplyScene && window.ngApplyScene();
await new Promise(r => setTimeout(r, 80));
window.ngGen && window.ngGen();
await new Promise(r => setTimeout(r, 300));
const out = document.getElementById('ngOutput');
const result = out ? out.textContent.trim() : '';
return {
success: true,
data: { config: result, scene, domain: inputs.domain },
display: result ? `配置已生成（${scene} 场景，${result.split('\n').length} 行）` : '配置已生成',
};
},
'gradient': async ({ inputs }) => {
const colors    = inputs.colors    || ['#00c6ff', '#0072ff', '#1a1a8c'];
const positions = inputs.positions || colors.map((_,i) => Math.round(i/(colors.length-1)*100));
const angle     = inputs.angle     != null ? inputs.angle : 135;
const type      = inputs.type      || 'linear';
const deadline = Date.now() + 2000;
while (typeof window._gradStops === 'undefined' && Date.now() < deadline) {
await new Promise(r => setTimeout(r, 80));
}
if (typeof window._gradStops === 'undefined') {
return { success: false, data: { error: '工具页未就绪' }, display: '工具页未就绪' };
}
const typeEl = document.getElementById('gradType');
if (typeEl) { typeEl.value = type; typeEl.dispatchEvent(new Event('change')); }
const angleEl = document.getElementById('gradAngle');
if (angleEl) {
angleEl.value = angle;
const valEl = document.getElementById('gradAngleVal');
if (valEl) valEl.textContent = angle;
}
window._gradStops = colors.map((color, i) => ({
color: color,
pos:   positions[i] != null ? positions[i] : Math.round(i/(colors.length-1)*100),
}));
window.gradRenderStops && window.gradRenderStops();
window.gradUpdate && window.gradUpdate();
await new Promise(r => setTimeout(r, 400));
const codeEl = document.getElementById('gradCode');
const cssCode = codeEl ? codeEl.textContent.trim() : '';
return {
success: true,
data: { colors, positions, angle, type, css: cssCode },
display: cssCode || `linear-gradient(${angle}deg, ${colors.join(', ')})`,
};
},
'shadow': async ({ inputs }) => {
if (window._shadowLayers && window._shadowLayers[0]) {
const L = window._shadowLayers[0];
if (inputs.x != null) L.x = +inputs.x;
if (inputs.y != null) L.y = +inputs.y;
if (inputs.blur != null) L.blur = +inputs.blur;
if (inputs.spread != null) L.spread = +inputs.spread;
if (inputs.color) { L.color = inputs.color; L.opacity = 100; }
if (inputs.inset != null) L.inset = inputs.inset === true || inputs.inset === 'true';
if (typeof shadowRenderLayers === 'function') shadowRenderLayers();
if (typeof shadowUpdate === 'function') shadowUpdate();
}
await new Promise(r => setTimeout(r, 300));
const el = document.getElementById('shadowCode');
const css = el ? el.textContent.trim() : '';
return { success: true, data: { css }, display: css || '阴影已生成' };
},
'palette-gen': async ({ inputs }) => {
const colorInput = inputs.color || inputs.text || '';
if (colorInput) {
const el = document.getElementById('pgBaseColor') || document.querySelector('[id*="pgBase"]');
if (el) { el.value = colorInput; el.dispatchEvent(new Event('input', { bubbles: true })); }
}
await new Promise(r => setTimeout(r, 500));
const out = document.getElementById('pgResult');
const text = out ? out.textContent.trim() : '';
return { success: true, data: { result: text }, display: text || '调色板已生成' };
},
};
const NavActions = [
{
name: 'navigate_to_tool',
description: '跳转到指定工具页面',
meta: { tier: 'core', tags: ['navigate', 'go', 'open', 'tool'], category: 'nav' },
parameters: {
type: 'object',
properties: {
id: { type: 'string', description: '工具 ID，如 uuid、json、hash、base64 等' },
},
required: ['id'],
},
execute({ id }) {
const tool = (window.TOOLS || []).find(t => t.id === id);
if (!tool) {
return { success: false, data: { error: `工具 ${id} 不存在` }, display: `未找到工具: ${id}` };
}
window.navigateTo(id);
return { success: true, data: { id, toolName: tool.name, category: tool.category },
display: `已跳转到「${tool.name}」` };
},
},
{
name: 'search_tools',
description: '搜索可用工具。支持多关键词（空格/逗号分隔）智能匹配，大小写无关。返回工具列表及其 autoRun 能力标注，autoRun:true 表示可用 fill_and_run_tool 自动执行；同时返回匹配的 agent action schema，可在下一轮直接调用',
meta: { tier: 'core', tags: ['search', 'find', 'tool', 'discover'], category: 'nav' },
parameters: {
type: 'object',
properties: {
query:    { type: 'string', description: '搜索关键词，支持多词空格/逗号分隔，如 "base64 编码" "json format" "哈希 sha" 等' },
category: { type: 'string', description: '可选：按分类筛选，如 "文本处理" "开发工具" "计算工具"' },
},
required: ['query'],
},
execute({ query, category }) {
const tokens = query.toLowerCase().split(/[\s,，、]+/).filter(Boolean);
if (!tokens.length) return { success: true, data: { tools: [], count: 0, actions: [] }, display: '请输入搜索关键词' };
let tools = window.TOOLS || [];
if (category) tools = tools.filter(t => t.category === category);
const scored = [];
for (const t of tools) {
const fields = {
id:       (t.id || '').toLowerCase(),
name:     (t.name || '').toLowerCase(),
desc:     (t.desc || t.description || '').toLowerCase(),
category: (t.category || '').toLowerCase(),
tags:     (t.tags || []).map(tag => tag.toLowerCase()).join(' '),
};
let score = 0;
let matchedTokens = 0;
for (const tok of tokens) {
let tokScore = 0;
if (fields.id === tok) tokScore += 10;
else if (fields.id.includes(tok)) tokScore += 5;
if (fields.name.includes(tok)) tokScore += 4;
if (fields.tags.includes(tok)) tokScore += 3;
if (fields.desc.includes(tok)) tokScore += 1;
if (fields.category.includes(tok)) tokScore += 1;
if (tokScore > 0) {
score += tokScore;
matchedTokens++;
}
}
if (matchedTokens > 0) {
if (matchedTokens === tokens.length && tokens.length > 1) score += 5;
scored.push({ tool: t, score });
}
}
scored.sort((a, b) => b.score - a.score);
const matched = scored.slice(0, 10).map(({ tool: t }) => {
const caps = TOOL_CAPS[t.id];
const hasRunner = !!(TOOL_RUNNERS[t.id] || SPECIAL_RUNNERS[t.id]);
return {
id: t.id,
name: t.name,
desc: t.desc || t.description || '',
category: t.category,
autoRun: caps ? caps.autoRun : hasRunner,
inputs: caps ? (caps.inputs || []) : [],
actions: caps ? (caps.actions || []) : [],
capsDesc: caps ? caps.desc : '',
};
});
const actionMap = window._AGENT_ALL_ACTIONS;
const matchedActions = [];
if (actionMap) {
const actionScored = [];
for (const [, a] of actionMap) {
if (a.meta && a.meta.tier === 'core') continue;
const aName = (a.name || '').toLowerCase();
const aDesc = (a.description || '').toLowerCase();
const aTags = (a.meta && a.meta.tags || []).map(t => t.toLowerCase()).join(' ');
let score = 0;
let matchedTokens = 0;
for (const tok of tokens) {
let tokScore = 0;
if (aName === tok) tokScore += 10;
else if (aName.includes(tok)) tokScore += 5;
if (aTags.includes(tok)) tokScore += 3;
if (aDesc.includes(tok)) tokScore += 1;
if (tokScore > 0) { score += tokScore; matchedTokens++; }
}
if (matchedTokens > 0) {
if (matchedTokens === tokens.length && tokens.length > 1) score += 5;
actionScored.push({ action: a, score });
}
}
actionScored.sort((a, b) => b.score - a.score);
for (const { action: a } of actionScored.slice(0, 10)) {
matchedActions.push({
id: a.name,
name: a.name,
desc: a.description || '',
tier: (a.meta && a.meta.tier) || 'standard',
schema: { name: a.name, description: a.description, parameters: a.parameters },
});
}
}
return { success: true, data: { tools: matched, count: matched.length, actions: matchedActions },
display: `找到 ${matched.length} 个工具，${matchedActions.length} 个 action` };
},
},
{
name: 'fill_and_run_tool',
description: '向当前工具页填入数据并执行。必须先用 navigate_to_tool 跳转到目标工具页，再调用此 action。仅支持 autoRun:true 的工具。',
meta: { tier: 'core', tags: ['fill', 'run', 'tool', 'execute', 'autorun'], category: 'nav' },
parameters: {
type: 'object',
properties: {
toolId: { type: 'string', description: '工具 ID，必须与当前页面一致' },
inputs: {
type: 'object',
description: '要填入的数据，key 为输入字段名。常用字段：text（主文本）、pattern（正则）、flags（正则标志）、text2（对比文本B）、value（数值）、from/to（单位）、ip（IP/CIDR 子网）、domain（域名）',
},
action: { type: 'string', description: '要触发的操作，如 encode/decode/format/calc/toJSON/toYAML/camel/snake 等，不填则用默认操作' },
},
required: ['toolId', 'inputs'],
},
async execute({ toolId, inputs, action }) {
const deadline = Date.now() + 3000;
while ((window.currentPage || '') !== toolId && Date.now() < deadline) {
await new Promise(r => setTimeout(r, 80));
}
const curPage = window.currentPage || '';
if (curPage !== toolId) {
return {
success: false,
data: { error: `当前页面是 ${curPage}，请先跳转到 ${toolId}` },
display: `请先跳转到工具页: ${toolId}`,
};
}
let runner = TOOL_RUNNERS[toolId];
const special = SPECIAL_RUNNERS[toolId];
if (special) {
return await special({ inputs, action });
}
if (!runner) {
const anyInput = document.querySelector('textarea, input[type="text"]');
if (anyInput && (inputs.text || inputs.value || inputs.payload)) {
const val = inputs.text || inputs.value || inputs.payload || '';
anyInput.value = val;
anyInput.dispatchEvent(new Event('input', { bubbles: true }));
await new Promise(r => setTimeout(r, 500));
const anyOut = document.querySelector('[id*="result"],[id*="output"],[id*="Output"],[id*="Result"]');
const resultText = anyOut ? (anyOut.textContent || '').trim() : '';
return { success: true, data: { toolId, result: resultText }, display: resultText || '已填入数据（请查看页面结果）' };
}
const caps = TOOL_CAPS[toolId];
if (caps && !caps.autoRun) {
return { success: false, data: { error: caps.note || '该工具不支持自动填充' }, display: caps.note || '该工具不支持自动填充' };
}
return { success: false, data: { error: `工具 ${toolId} 暂未配置自动执行` }, display: `工具 ${toolId} 暂未配置自动执行` };
}
if (runner.beforeRun) {
try { runner.beforeRun({ action, inputs }); } catch(e) { console.warn('beforeRun error:', e); }
await new Promise(r => setTimeout(r, 100));
}
const baseRunner = runner;
if (action && runner.actionOverrides && runner.actionOverrides[action]) {
runner = Object.assign({}, runner, runner.actionOverrides[action]);
}
if (runner.mainInput) {
const deadline = Date.now() + 2000;
while (!document.querySelector(runner.mainInput) && Date.now() < deadline) {
await new Promise(r => setTimeout(r, 80));
}
}
const mainVal = inputs.text || inputs.payload || inputs.value || inputs.token || inputs.url || inputs.expr || inputs.text1 || inputs.pattern || inputs.ip || inputs.domain || inputs.input || inputs.from || inputs.amount || '';
if (runner.mainInput && mainVal) {
const mainInput = document.querySelector(runner.mainInput);
if (!mainInput) {
return { success: false, data: { error: `找不到输入框 ${runner.mainInput}，页面渲染超时` }, display: '找不到输入框，页面渲染超时' };
}
mainInput.value = mainVal;
mainInput.dispatchEvent(new Event('input', { bubbles: true }));
}
if (runner.extraInputs) {
for (const [key, selector] of Object.entries(runner.extraInputs)) {
if (inputs[key] != null) {
const el = document.querySelector(selector);
if (el) {
el.value = String(inputs[key]);
el.dispatchEvent(new Event('input', { bubbles: true }));
}
}
}
}
if (baseRunner.preTriggerMap && action && baseRunner.preTriggerMap[action]) {
const pre = baseRunner.preTriggerMap[action];
if (typeof pre === 'function') pre();
await new Promise(r => setTimeout(r, 50));
}
let triggered = false;
if (action && runner.triggerMap) {
const fn = runner.triggerMap[action];
if (typeof fn === 'function') { fn(); triggered = true; }
else if (typeof fn === 'string' && window[fn]) { window[fn](); triggered = true; }
}
if (!triggered && runner.trigger) {
if (typeof runner.trigger === 'function') { runner.trigger(); triggered = true; }
else if (typeof runner.trigger === 'string' && window[runner.trigger]) { window[runner.trigger](); triggered = true; }
}
if (!triggered) {
if (runner.mainInput) {
const el = document.querySelector(runner.mainInput);
if (el) el.dispatchEvent(new Event('input', { bubbles: true }));
}
}
await new Promise(r => setTimeout(r, runner.waitMs || 400));
let resultText = '';
if (runner.outputSelector) {
const outEl = document.querySelector(runner.outputSelector);
resultText = outEl ? (outEl.textContent || outEl.innerText || '').trim() : '';
}
return {
success: true,
data: { toolId, action, input: inputs, result: resultText.slice(0, 1000) },
display: resultText
? `执行完成：${resultText.slice(0, 150)}${resultText.length > 150 ? '...' : ''}`
: '执行完成（结果已显示在页面上）',
};
},
},
{
name: 'get_current_context',
description: '获取当前页面上下文信息',
meta: { tier: 'core', tags: ['context', 'page', 'current', 'status'], category: 'nav' },
parameters: { type: 'object', properties: {}, required: [] },
execute() {
return {
success: true,
data: {
page:       window.currentPage || 'home',
lang:       window.getCurrentLang?.() || 'zh',
favorites:  (window.favorites || []).length,
recent:     (window.recent || []).length,
totalTools: (window.TOOLS || []).length,
},
display: `当前页面: ${window.currentPage || 'home'}，共 ${(window.TOOLS || []).length} 个工具`,
};
},
},
{
name: 'list_categories',
description: '列出所有工具分类',
meta: { tier: 'standard', tags: ['categories', 'list', 'browse'], category: 'nav' },
parameters: { type: 'object', properties: {}, required: [] },
execute() {
const tools = window.TOOLS || [];
const map = {};
for (const t of tools) {
if (!map[t.category]) map[t.category] = { name: t.category, count: 0, icon: t.icon || '' };
map[t.category].count++;
}
const categories = Object.values(map);
return { success: true, data: { categories }, display: `共 ${categories.length} 个分类` };
},
},
{
name: 'list_skills',
description: '列出所有可用的 AI Skills（预定义工作流）。触发：用户问"你能做什么/有什么技能/skills列表"。',
meta: { tier: 'standard', tags: ['skills', 'list', 'workflow'], category: 'nav' },
parameters: { type: 'object', properties: {}, required: [] },
execute() {
const skills = window.AgentSkills ? window.AgentSkills.listSkills() : [];
const display = skills.length
? skills.map(s => s.icon + ' ' + s.name + '：' + s.description).join('\n')
: '暂无 Skills';
return { success: true, data: { skills }, display };
},
},
{
name: 'toggle_favorite',
description: '收藏或取消收藏某个工具。触发：用户说「收藏 xxx」「取消收藏 xxx」「把 hash 加到收藏」',
meta: { tier: 'standard', tags: ['favorite', 'bookmark', 'star'], category: 'nav' },
parameters: {
type: 'object',
properties: {
id: { type: 'string', description: '工具 ID' },
},
required: ['id'],
},
execute({ id }) {
const tool = (window.TOOLS || []).find(t => t.id === id);
if (!tool) return { success: false, data: { error: `工具 ${id} 不存在` }, display: `未找到工具: ${id}` };
const favsBefore = window.favorites || [];
const wasFav = favsBefore.includes(id);
if (typeof window.toggleFavorite === 'function') {
window.toggleFavorite(id, null);
}
const action = wasFav ? '已取消收藏' : '已收藏';
return { success: true, data: { id, toolName: tool.name, isFavorite: !wasFav }, display: `${action}「${tool.name}」` };
},
},
{
name: 'get_favorites',
description: '获取用户收藏的工具列表。触发：用户问「我收藏了哪些工具」「我的收藏」',
meta: { tier: 'standard', tags: ['favorites', 'bookmarks', 'saved'], category: 'nav' },
parameters: { type: 'object', properties: {}, required: [] },
execute() {
const favIds = window.favorites || [];
const tools = (window.TOOLS || []).filter(t => favIds.includes(t.id));
const display = tools.length
? '收藏的工具：' + tools.map(t => t.name).join('、')
: '还没有收藏任何工具';
return { success: true, data: { tools: tools.map(t => ({ id: t.id, name: t.name, category: t.category })), count: tools.length }, display };
},
},
{
name: 'get_recent',
description: '获取最近使用的工具列表。触发：用户问「最近用了什么工具」「最近使用」',
meta: { tier: 'standard', tags: ['recent', 'history', 'last'], category: 'nav' },
parameters: { type: 'object', properties: {}, required: [] },
execute() {
const recentIds = window.recent || [];
const tools = recentIds.map(id => (window.TOOLS || []).find(t => t.id === id)).filter(Boolean);
const display = tools.length
? '最近使用：' + tools.map(t => t.name).join('、')
: '暂无最近使用记录';
return { success: true, data: { tools: tools.map(t => ({ id: t.id, name: t.name })), count: tools.length }, display };
},
},
{
name: 'read_tool_output',
description: '读取当前工具页面的输出结果。在 fill_and_run_tool 执行后，可调用此 action 获取最新结果文本。',
meta: { tier: 'core', tags: ['read', 'output', 'result', 'tool'], category: 'nav' },
parameters: {
type: 'object',
properties: {
toolId: { type: 'string', description: '工具 ID，必须与当前页面一致' },
},
required: ['toolId'],
},
async execute({ toolId }) {
const deadline = Date.now() + 2000;
while ((window.currentPage || '') !== toolId && Date.now() < deadline) {
await new Promise(r => setTimeout(r, 80));
}
const curPage = window.currentPage || '';
if (curPage !== toolId) {
return { success: false, data: { error: `当前页面是 ${curPage}` }, display: `当前不在 ${toolId} 工具页` };
}
const runner = (typeof TOOL_RUNNERS !== 'undefined') ? TOOL_RUNNERS[toolId] : null;
if (!runner || !runner.outputSelector) {
return { success: false, data: { error: '无输出选择器配置' }, display: '该工具暂不支持读取输出' };
}
const el = document.querySelector(runner.outputSelector);
const text = el ? (el.textContent || el.innerText || '').trim() : '';
return {
success: true,
data: { toolId, result: text.slice(0, 2000) },
display: text ? text.slice(0, 200) + (text.length > 200 ? '...' : '') : '（暂无输出）',
};
},
},
{
name: 'show_toast',
description: '在页面显示一条 Toast 通知。触发：需要向用户显示操作反馈时。',
meta: { tier: 'core', tags: ['toast', 'notify', 'message', 'feedback'], category: 'nav' },
parameters: {
type: 'object',
properties: {
message: { type: 'string', description: '通知内容' },
type: { type: 'string', enum: ['success', 'info', 'warn', 'error'], description: '通知类型，默认 success' },
},
required: ['message'],
},
execute({ message, type = 'success' }) {
window.showToast && window.showToast(message, type, 2500);
return { success: true, data: { message, type }, display: `已显示通知：${message}` };
},
},
{
name: 'show_result_panel',
description: '在页面上弹出可视化结果面板，展示计算/生成结果。当没有对应页面工具时用此面板展示结果，提供复制按钮和格式化显示。触发：原子工具执行完毕后需要可视化展示结果。',
meta: { tier: 'core', tags: ['result', 'panel', 'display', 'show', 'output', '展示', '结果'], category: 'nav' },
parameters: {
type: 'object',
properties: {
title:    { type: 'string', description: '面板标题，如"哈希结果"、"Base64 编码"' },
items:    { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, mono: { type: 'boolean' }, type: { type: 'string', enum: ['text','color','code','table'], description: 'text=默认, color=颜色色块, code=代码高亮, table=表格(value为JSON二维数组)' } } }, description: '结果项列表' },
copyAll:  { type: 'string', description: '一键复制的全部内容（可选）' },
toolId:   { type: 'string', description: '关联工具ID，可跳转到该工具页面（可选）' },
},
required: ['title', 'items'],
},
execute({ title, items, copyAll, toolId }) {
_showResultPanel(title, items || [], copyAll, toolId);
return { success: true, data: { title, count: (items||[]).length }, display: `已展示结果面板：${title}` };
},
},
];
function _showResultPanel(title, items, copyAll, toolId) {
const t = window.AgentI18n?.t || (k => k);
if (!document.getElementById('ag-result-panel-css')) {
const style = document.createElement('style');
style.id = 'ag-result-panel-css';
style.textContent = `
.ag-rp-overlay{position:fixed;inset:0;z-index:10100;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;animation:ag-rp-fadein .25s}
@keyframes ag-rp-fadein{from{opacity:0}to{opacity:1}}
@keyframes ag-rp-slideup{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes ag-rp-item-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
.ag-rp-box{background:var(--sidebar-bg,rgba(15,23,42,.95));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid color-mix(in srgb,var(--accent,#6366f1) 25%,transparent);border-radius:18px;padding:0;width:min(500px,92vw);max-height:80vh;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 0 1px color-mix(in srgb,var(--accent,#6366f1) 10%,transparent) inset;display:flex;flex-direction:column;animation:ag-rp-slideup .3s ease-out;color:var(--text,#e2e8f0)}
.ag-rp-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,rgba(255,255,255,.06));background:var(--surface,rgba(255,255,255,.02))}
.ag-rp-title{font-size:15px;font-weight:600;color:var(--text,#f1f5f9);display:flex;align-items:center;gap:8px}
.ag-rp-title::before{content:'';display:inline-block;width:3px;height:16px;border-radius:2px;background:linear-gradient(180deg,var(--accent,#6366f1),var(--accent2,#8b5cf6))}
.ag-rp-close{background:none;border:none;color:var(--text-muted,#94a3b8);font-size:18px;cursor:pointer;padding:4px 8px;border-radius:6px;transition:all .15s}
.ag-rp-close:hover{background:var(--surface,rgba(255,255,255,.08));color:var(--text,#f1f5f9)}
.ag-rp-body{padding:12px 20px 16px;overflow-y:auto;flex:1}
.ag-rp-item{margin-bottom:10px;background:var(--surface,rgba(255,255,255,.03));border:1px solid var(--border,rgba(255,255,255,.06));border-radius:10px;padding:10px 14px;position:relative;animation:ag-rp-item-in .25s ease-out backwards;transition:border-color .15s}
.ag-rp-item:hover{border-color:color-mix(in srgb,var(--accent,#6366f1) 25%,transparent)}
.ag-rp-label{font-size:11px;color:var(--text-muted,#94a3b8);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;font-weight:500}
.ag-rp-value{font-size:13px;color:var(--text,#e2e8f0);word-break:break-all;line-height:1.5;white-space:pre-wrap}
.ag-rp-value.mono{font-family:'SF Mono',Monaco,Consolas,monospace;font-size:12px;color:var(--accent3,#a5b4fc)}
.ag-rp-copy{position:absolute;top:8px;right:8px;background:color-mix(in srgb,var(--accent,#6366f1) 15%,transparent);border:1px solid color-mix(in srgb,var(--accent,#6366f1) 20%,transparent);color:var(--accent3,#a5b4fc);font-size:11px;padding:2px 8px;border-radius:6px;cursor:pointer;opacity:0;transition:opacity .15s}
.ag-rp-item:hover .ag-rp-copy{opacity:1}
.ag-rp-copy:hover{background:color-mix(in srgb,var(--accent,#6366f1) 30%,transparent)}
.ag-rp-footer{padding:10px 20px 14px;border-top:1px solid var(--border,rgba(255,255,255,.06));display:flex;gap:8px;justify-content:flex-end;background:var(--surface,rgba(255,255,255,.01))}
.ag-rp-btn{background:linear-gradient(135deg,var(--accent,#6366f1),var(--accent2,#8b5cf6));border:none;color:var(--text-on-accent,#fff);font-size:12px;padding:6px 16px;border-radius:8px;cursor:pointer;transition:all .15s;font-weight:500}
.ag-rp-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.ag-rp-btn.ghost{background:transparent;border:1px solid var(--border,rgba(255,255,255,.1));color:var(--text-muted,#94a3b8)}
.ag-rp-btn.ghost:hover{background:var(--surface,rgba(255,255,255,.05));color:var(--text,#e2e8f0)}
.ag-rp-color-swatch{display:inline-flex;align-items:center;gap:10px}
.ag-rp-color-box{width:40px;height:40px;border-radius:8px;border:2px solid var(--border,rgba(255,255,255,.15));box-shadow:0 2px 8px rgba(0,0,0,.3)}
.ag-rp-color-hex{font-family:'SF Mono',Monaco,monospace;font-size:13px;color:var(--text,#e2e8f0)}
.ag-rp-code{background:color-mix(in srgb,var(--bg,#000) 80%,transparent);border:1px solid var(--border,rgba(255,255,255,.06));border-radius:8px;padding:12px;font-family:'SF Mono','Fira Code',monospace;font-size:12px;color:var(--text,#e2e8f0);overflow-x:auto;line-height:1.5;white-space:pre;max-height:200px;overflow-y:auto}
.ag-rp-code .kw{color:#c084fc}.ag-rp-code .str{color:#34d399}.ag-rp-code .num{color:#fbbf24}.ag-rp-code .cmt{color:var(--text-muted,#64748b);font-style:italic}
.ag-rp-table{width:100%;border-collapse:collapse;font-size:12px}
.ag-rp-table th,.ag-rp-table td{border:1px solid var(--border,rgba(255,255,255,.08));padding:6px 10px;text-align:left}
.ag-rp-table th{background:color-mix(in srgb,var(--accent,#6366f1) 10%,transparent);color:var(--accent3,#a5b4fc);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.3px}
.ag-rp-table tr:hover td{background:var(--surface,rgba(255,255,255,.03))}
`;
document.head.appendChild(style);
}
const old = document.querySelector('.ag-rp-overlay');
if (old) old.remove();
const overlay = document.createElement('div');
overlay.className = 'ag-rp-overlay';
const box = document.createElement('div');
box.className = 'ag-rp-box';
let footerHtml = '<div class="ag-rp-footer">';
if (toolId) footerHtml += `<button class="ag-rp-btn ghost" data-action="open-tool">${t('open_tool')}</button>`;
if (copyAll) footerHtml += `<button class="ag-rp-btn ghost" data-action="copy-all">${t('copy_all')}</button>`;
footerHtml += `<button class="ag-rp-btn" data-action="close">${t('close')}</button></div>`;
box.innerHTML = `
<div class="ag-rp-header">
<div class="ag-rp-title">${_rpEsc(title)}</div>
<button class="ag-rp-close" title="${t('close')}">&times;</button>
</div>
<div class="ag-rp-body"></div>
${footerHtml}
`;
const body = box.querySelector('.ag-rp-body');
items.forEach((item, idx) => {
const div = document.createElement('div');
div.className = 'ag-rp-item';
div.style.animationDelay = (idx * 0.05) + 's';
const itemType = item.type || 'text';
let contentHtml = '';
if (itemType === 'color') {
const rawColor = item.value || '#000000';
const safeColor = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]{3,20})$/.test(rawColor.trim()) ? rawColor.trim() : '#000000';
contentHtml = `<div class="ag-rp-color-swatch">
<div class="ag-rp-color-box" style="background:${_rpAttr(safeColor)}"></div>
<span class="ag-rp-color-hex">${_rpEsc(rawColor)}</span>
</div>`;
} else if (itemType === 'code') {
contentHtml = `<div class="ag-rp-code">${_rpHighlight(item.value || '')}</div>`;
} else if (itemType === 'table') {
contentHtml = _rpRenderTable(item.value || '[]');
} else {
contentHtml = `<div class="ag-rp-value${item.mono !== false ? ' mono' : ''}">${_rpEsc(item.value || '')}</div>`;
}
div.innerHTML = `
${item.label ? `<div class="ag-rp-label">${_rpEsc(item.label)}</div>` : ''}
${contentHtml}
<button class="ag-rp-copy" data-val="${_rpAttr(item.value || '')}">${t('copy')}</button>
`;
body.appendChild(div);
});
overlay.appendChild(box);
document.body.appendChild(overlay);
// Events
const onKey = e => { if (e.key === 'Escape') close(); };
const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
box.querySelector('.ag-rp-close').addEventListener('click', close);
box.querySelectorAll('[data-action="close"]').forEach(b => b.addEventListener('click', close));
box.querySelectorAll('[data-action="copy-all"]').forEach(b => {
b.addEventListener('click', () => {
navigator.clipboard.writeText(copyAll || '').then(() => {
b.textContent = t('rp_copied');
setTimeout(() => { b.textContent = t('copy_all'); }, 1500);
});
});
});
box.querySelectorAll('[data-action="open-tool"]').forEach(b => {
b.addEventListener('click', () => {
close();
if (toolId && typeof window.navigateTo === 'function') window.navigateTo(toolId);
});
});
box.querySelectorAll('.ag-rp-copy').forEach(btn => {
btn.addEventListener('click', () => {
navigator.clipboard.writeText(btn.dataset.val || '').then(() => {
btn.textContent = t('rp_copied');
setTimeout(() => { btn.textContent = t('copy'); }, 1500);
});
});
});
document.addEventListener('keydown', onKey);
}
// Simple syntax highlighting for code blocks
function _rpHighlight(code) {
return _rpEsc(code)
.replace(/\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new|async|await|try|catch|throw|switch|case|break|default|typeof|instanceof|in|of|void|delete|this|super|extends|implements|interface|type|enum|public|private|protected|static|readonly|abstract|override|declare|module|namespace|require|yield|as|is|keyof|infer|never|unknown|any|string|number|boolean|null|undefined|true|false|SELECT|FROM|WHERE|AND|OR|INSERT|UPDATE|DELETE|CREATE|TABLE|INTO|VALUES|SET|JOIN|LEFT|RIGHT|INNER|ON|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|ALTER|DROP|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|UNIQUE|CHECK|EXISTS|BETWEEN|LIKE|IN|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|UNION|ALL|CASE|WHEN|THEN|ELSE|END|DESC|ASC)\b/g, '<span class="kw">$&</span>')
.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|'[^']*'|"[^"]*")/g, '<span class="str">$&</span>')
.replace(/\b(\d+\.?\d*)\b/g, '<span class="num">$&</span>')
.replace(/(\/\/.*$|#.*$|--.*$)/gm, '<span class="cmt">$&</span>');
}
// Render a table from JSON array
function _rpRenderTable(jsonStr) {
try {
const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
if (!Array.isArray(data) || data.length === 0) return `<div class="ag-rp-value">${_rpEsc(String(jsonStr))}</div>`;
if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
const headers = Object.keys(data[0]);
let html = '<table class="ag-rp-table"><thead><tr>';
headers.forEach(h => { html += `<th>${_rpEsc(h)}</th>`; });
html += '</tr></thead><tbody>';
data.forEach(row => {
html += '<tr>';
headers.forEach(h => { html += `<td>${_rpEsc(String(row[h] ?? ''))}</td>`; });
html += '</tr>';
});
html += '</tbody></table>';
return html;
}
if (Array.isArray(data[0])) {
let html = '<table class="ag-rp-table"><thead><tr>';
data[0].forEach(h => { html += `<th>${_rpEsc(String(h))}</th>`; });
html += '</tr></thead><tbody>';
data.slice(1).forEach(row => {
html += '<tr>';
(Array.isArray(row) ? row : []).forEach(cell => { html += `<td>${_rpEsc(String(cell ?? ''))}</td>`; });
html += '</tr>';
});
html += '</tbody></table>';
return html;
}
return `<div class="ag-rp-value mono">${_rpEsc(String(jsonStr))}</div>`;
} catch {
return `<div class="ag-rp-value">${_rpEsc(String(jsonStr))}</div>`;
}
}
function _rpEsc(t) { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _rpAttr(t) { return String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
window.NavActions = NavActions;
window.TOOL_CAPS = TOOL_CAPS;
window.TOOL_RUNNERS = TOOL_RUNNERS;