// The directory is shared by navigation, search, Agent discovery and generated docs.
(function () {
  const tools = [
  // AI 工具（置顶）
  { id: 'ai-chat',         render: 'renderAiChat',         icon: '💬', color: '#6366f1', name: 'AI 对话',           desc: '直接与 AI 模型对话，支持多轮、发图、Markdown 渲染',        category: 'AI 助手', file: 'ai-chat.js',         isNew: true, tags: ['ai','chat','gpt','claude','gemini','对话','聊天'] },
  // 文本处理
  { id: 'uuid', render: 'renderUUID',          icon: '🎲', color: '#f59e0b', name: 'UUID 生成器',    desc: '批量生成 UUID v4，一键复制，支持自定义数量', category: '开发工具', file: 'uuid.js', tags: ['uuid','guid','id','唯一标识','随机id','generate'] },
  { id: 'json', render: 'renderJSON',          icon: '📋', color: '#3b82f6', name: 'JSON 格式化',   desc: '格式化、去转义、展开嵌套 JSON，快速复制字段值与路径', category: '数据格式', file: 'json-format.js', tags: ['json','format','prettify','minify','validate','校验','美化','压缩','嵌套','nested','去转义','unescape','复制'] },
  { id: 'base64', render: 'renderBase64',        icon: '🔤', color: '#8b5cf6', name: 'Base64 编解码',  desc: '文本与 Base64 互转，支持 URL 安全模式', category: '编码加密', file: 'base64.js', tags: ['base64','encode','decode','编码','解码','b64'] },
  { id: 'wordcount', render: 'renderWordCount',     icon: '📝', color: '#10b981', name: '字数统计',      desc: '统计字符数、单词数、行数、段落数、中文字数', category: '文本处理', file: 'word-count.js', tags: ['word','count','字数','字符','统计','行数','words'] },
  { id: 'regex', render: 'renderRegex',         icon: '🔍', color: '#6366f1', name: '正则测试器',    desc: '捕获组、命名分组与替换，支持零宽匹配和超时保护', category: '文本处理', file: 'regex.js', tags: ['regex','regexp','正则','匹配','pattern','regular expression'] },
  { id: 'json-csv', render: 'renderJsonCsv',      icon: '🔄', color: '#0ea5e9', name: 'JSON/CSV 互转', desc: 'JSON 与 CSV 双向转换，支持引号换行、分隔符识别与 Excel 下载', category: '数据格式', file: 'json-csv.js', tags: ['json','csv','转换','convert','表格','excel'] },
  { id: 'text-diff', render: 'renderTextDiff',     icon: '📊', color: '#f97316', name: '文本对比',      desc: '按行、词或字符精确对比，分页查看与完整差异导出', category: '文本处理', file: 'text-diff.js', tags: ['diff','compare','对比','比较','差异','文本'] },
  { id: 'markdown', render: 'renderMarkdown',      icon: '✍️',  color: '#14b8a6', name: 'Markdown 预览', desc: '分栏编辑与预览，支持表格、任务清单和 HTML 复制', category: '文本处理', file: 'markdown.js', tags: ['markdown','md','预览','preview','渲染'] },
  { id: 'case-convert', render: 'renderCaseConvert',  icon: '🔡', color: '#64748b', name: '大小写转换',    desc: '驼峰、下划线、全大写等多种格式互转', category: '文本处理', file: 'case-convert.js', tags: ['case','camel','snake','kebab','pascal','大小写','驼峰','下划线','命名'] },
  { id: 'unicode-convert', render: 'renderUnicode',icon: '🌐', color: '#7c3aed', name: 'Unicode 转换', desc: 'Unicode 码点与字符互转，支持转义序列', category: '编码加密', file: 'unicode-convert.js', tags: ['unicode','码点','转义','字符','codepoint','escape'] },
  { id: 'html-entity', render: 'renderHTMLEntity',   icon: '🏷️', color: '#dc2626', name: 'HTML 实体转换', desc: 'HTML 实体编解码，< > & " \'等特殊字符处理', category: '编码加密', file: 'html-entity.js', tags: ['html','entity','实体','转义','escape','特殊字符'] },
  { id: 'lorem', render: 'renderLorem',         icon: '📄', color: '#059669', name: '占位文本生成',  desc: '生成中英文 Lorem ipsum 占位文本，自定义段落数', category: '文本处理', file: 'lorem.js', tags: ['lorem','ipsum','占位','placeholder','假文','dummy'] },
  // 开发工具
  { id: 'timestamp', render: 'renderTimestamp',     icon: '⏱️',  color: '#f59e0b', name: '时间戳转换',   desc: '实时时间戳、秒/毫秒互转、日期解析、多格式输出', category: '时间效率', file: 'timestamp.js', tags: ['timestamp','unix','epoch','时间戳','日期','date','time','毫秒','秒','format','格式','iso','utc'] },
  { id: 'url-parser', render: 'renderUrlParser',    icon: '🔗', color: '#14b8a6', name: 'URL 工具箱',    desc: 'URL 解析、编解码、参数构建三合一', category: '网络工具', file: 'url-parser.js', tags: ['url','parse','链接','网址','参数','query','href','encode','decode','编码','解码'] },
  { id: 'hash', render: 'renderHash',          icon: '🔐', color: '#ec4899', name: '哈希生成器',    desc: 'SHA-1/256/384/512，支持文本和文件哈希校验', category: '编码加密', file: 'hash.js', tags: ['hash','sha','sha256','sha1','sha512','md5','摘要','digest','哈希','散列','校验'] },
  { id: 'jwt', render: 'renderJWT',           icon: '🎫', color: '#8b5cf6', name: 'JWT 工具',      desc: '解析/生成 JWT Token，支持 HS256 签名', category: '编码加密', file: 'jwt.js', tags: ['jwt','token','解码','decode','auth','认证','json web token','生成','generate','签名','sign','secret'] },
  { id: 'number-base', render: 'renderNumberBase',   icon: '🔢', color: '#f97316', name: '进制转换',      desc: '二/八/十/十六进制任意精度互转，ASCII/Unicode 码点', category: '计算工具', file: 'number-base.js', tags: ['hex','binary','octal','decimal','进制','十六进制','二进制','八进制','0x'] },
  { id: 'yaml-json', render: 'renderYAMLJSON',     icon: '📑', color: '#65a30d', name: 'YAML/JSON 互转',desc: 'YAML 与 JSON 双向转换，支持锚点合并与多文档', category: '数据格式', file: 'yaml-json.js', tags: ['yaml','yml','json','配置','config','convert'] },
  { id: 'sql-format', render: 'renderSQLFormat',    icon: '🗄️', color: '#b45309', name: 'SQL 格式化',    desc: '保留字符串与注释的 SQL 排版，支持方言、大小写与缩进', category: '数据格式', file: 'sql-format.js', tags: ['sql','format','数据库','query','查询','美化','database'] },
  { id: 'curl-gen', render: 'renderCurlGen',      icon: '🌀', color: '#0369a1', name: 'cURL 生成器',   desc: '可视化配置生成 curl / fetch / axios 代码片段', category: '网络工具', file: 'curl-gen.js', tags: ['curl','http','fetch','axios','api','请求','request'] },
  { id: 'http-status', render: 'renderHttpStatus',   icon: '📡', color: '#be185d', name: 'HTTP 状态码',   desc: '查询 HTTP 状态码含义，支持搜索和分类浏览', category: '网络工具', file: 'http-status.js', tags: ['http','status','状态码','200','404','500','response'] },
  { id: 'cron', render: 'renderCron',          icon: '⏰', color: '#d97706', name: 'Cron 表达式',   desc: '解析 Linux/Spring/Quartz Cron，校验字段并推算下次执行时间', category: '时间效率', file: 'cron.js', tags: ['cron','crontab','定时','schedule','调度','定时任务'] },
  { id: 'password-gen', render: 'renderPasswordGen',  icon: '🛡️', color: '#16a34a', name: '密码生成器',    desc: '自定义规则生成强密码，密码强度评估', category: '编码加密', file: 'password-gen.js', tags: ['password','密码','生成','random','安全','强密码','pwd'] },
  // CSS 工具
  { id: 'gradient', render: 'renderGradient',      icon: '🎨', color: '#ec4899', name: '渐变生成器',    desc: '可视化创建 CSS 渐变，实时预览代码输出', category: 'CSS 工具', file: 'gradient.js', tags: ['gradient','渐变','css','linear','radial','背景'] },
  { id: 'color', render: 'renderColor',         icon: '🖌️', color: '#f43f5e', name: '颜色工具',      desc: '拾色器/格式转换/对比度检查三合一', category: 'CSS 工具', file: 'color.js', tags: ['color','picker','颜色','拾色','hex','rgb','hsl','取色','convert','转换','hsv','cmyk','contrast','对比度','wcag'] },
  { id: 'shadow', render: 'renderShadow',        icon: '🌑', color: '#475569', name: '阴影生成器',    desc: '可视化调整 box-shadow，多层阴影叠加', category: 'CSS 工具', file: 'shadow.js', tags: ['shadow','box-shadow','阴影','css','投影'] },
  { id: 'flexbox', render: 'renderFlexbox',       icon: '📐', color: '#0284c7', name: 'Flexbox 生成',  desc: '可视化配置 Flexbox 布局，自动生成 CSS', category: 'CSS 工具', file: 'flexbox.js', tags: ['flexbox','flex','布局','layout','css','弹性'] },
  // 图片工具
  { id: 'img-base64', render: 'renderImgBase64',    icon: '🖼️', color: '#0891b2', name: '图片 Base64',  desc: '图片与 Base64 字符串互转，支持预览', category: '图片工具', file: 'img-base64.js', tags: ['image','base64','图片','转换','data uri','img'] },
  { id: 'img-compress', render: 'renderImgCompress',  icon: '🗜️', color: '#16a34a', name: '图片压缩',      desc: '本地压缩图片，调整质量并转换 JPEG / PNG / WebP', category: '图片工具', file: 'img-compress.js', tags: ['image','compress','图片','压缩','convert','格式转换'] },
  { id: 'qrcode', render: 'renderQrCode',        icon: '📱', color: '#0f172a', name: '二维码生成',    desc: '文本/URL 转二维码，自定义颜色和尺寸', category: '图片工具', file: 'qrcode.js', tags: ['qr','qrcode','二维码','扫码','generate'] },
  { id: 'qrcode-decode', render: 'renderQRCodeDecode', icon: '🔭', color: '#1d4ed8', name: '二维码解析',    desc: '上传图片识别二维码内容，支持拖拽', category: '图片工具', file: 'qrcode-decode.js', tags: ['qr','qrcode','二维码','解析','识别','scan','decode'] },
  // 编码与加密
  { id: 'totp', render: 'renderTotp',           icon: '🛡️', color: '#0ea5e9', name: '2FA 工具',       desc: '多账号 2FA 验证码看板（主密码加密保存），快速计算与生成密钥，支持 Google Authenticator 导入导出', category: '编码加密', file: 'totp.js', isNew: true, tags: ['2fa','otp','totp','hotp','mfa','authenticator','google authenticator','aegis','2fas','验证码','双因素','二次验证','动态口令','身份验证器'] },
  { id: 'aes', render: 'renderAES',            icon: '🔒', color: '#7c3aed', name: 'AES 加解密',     desc: 'AES-GCM/CBC/CTR 加解密，可与 OpenSSL / Java / Python 互通', category: '编码加密', file: 'aes.js', tags: ['aes','encrypt','decrypt','加密','解密','对称','crypto','gcm','cbc','ctr','openssl','pbkdf2'] },
  { id: 'morse', render: 'renderMorse',          icon: '📡', color: '#b45309', name: '摩斯电码',       desc: '文本与摩斯电码互转，支持播放音频', category: '编码加密', file: 'morse.js', tags: ['morse','摩斯','电码','编码','点划'] },
  { id: 'xml-format', render: 'renderXmlFormat',     icon: '📰', color: '#0369a1', name: 'XML 格式化',     desc: 'XML 美化/压缩/转 JSON，保留注释与 CDATA', category: '数据格式', file: 'xml-format.js', tags: ['xml','format','格式化','美化','markup'] },
  // 计算工具
  { id: 'calculator', render: 'renderCalculator',     icon: '🧮', color: '#6366f1', name: '科学计算器',     desc: '可编辑表达式、科学函数、幂与百分比，和 Agent 共用解析器', category: '计算工具', file: 'calculator.js', tags: ['calculator','calc','计算','数学','math','加减乘除'] },
  { id: 'unit-convert', render: 'renderUnitConvert',   icon: '📏', color: '#10b981', name: '单位换算',       desc: '长度/重量/温度/面积/体积/时间/存储/速度换算与数字格式化', category: '计算工具', file: 'unit-convert.js', tags: ['unit','convert','单位','换算','长度','重量','温度','面积','数字格式化','千分位','currency','货币','number format'] },
  { id: 'loan-calc', render: 'renderLoanCalc',      icon: '🏦', color: '#f59e0b', name: '贷款计算器',     desc: '等额本息/本金还款，含完整还款计划表', category: '计算工具', file: 'loan-calc.js', tags: ['loan','贷款','房贷','还款','利率','mortgage','等额本息'] },
  { id: 'byte-convert', render: 'renderByteConvert',   icon: '💾', color: '#64748b', name: '存储换算',       desc: '存储单位 1024/1000 两种进制互转，含网速与传输时间', category: '计算工具', file: 'byte-convert.js', tags: ['byte','kb','mb','gb','tb','存储','容量','storage','网速'] },
  { id: 'number-chinese', render: 'renderNumberChinese', icon: '🀄', color: '#dc2626', name: '数字大写',       desc: '数字转财务中文大写，适合票据填写', category: '计算工具', file: 'number-chinese.js', tags: ['chinese','大写','财务','金额','票据','壹贰叁'] },
  { id: 'ip-calc', render: 'renderIpCalc',        icon: '🌐', color: '#0891b2', name: 'IP 子网计算',    desc: 'IPv4 子网、掩码、主机范围与地址类型判断', category: '网络工具', file: 'ip-calc.js', tags: ['ip','cidr','subnet','子网','掩码','网段','network'] },
  // 时间工具
  { id: 'date-diff', render: 'renderDateDiff',      icon: '📅', color: '#14b8a6', name: '日期差计算',     desc: '两日期间隔天数、年月日跨度与工作日（不含节假日）', category: '时间效率', file: 'date-diff.js', tags: ['date','diff','日期','天数','间隔','工作日','days'] },
  { id: 'timezone', render: 'renderTimezone',       icon: '🌍', color: '#6366f1', name: '时区转换',       desc: '13 个主要时区实时对比，快速换算', category: '时间效率', file: 'timezone.js', tags: ['timezone','时区','utc','gmt','时差','convert'] },
  { id: 'countdown', render: 'renderCountdown',      icon: '⏳', color: '#ec4899', name: '倒计时',         desc: '自定义目标日期倒计时，SVG 圆弧进度', category: '时间效率', file: 'countdown.js', tags: ['countdown','倒计时','timer','计时','目标'] },
  // 效率工具
  { id: 'pomodoro', render: 'renderPomodoro',       icon: '🍅', color: '#ef4444', name: '番茄钟',         desc: '25分钟专注 + 5分钟休息，SVG 进度环', category: '时间效率', file: 'pomodoro.js', tags: ['pomodoro','番茄','专注','focus','timer','计时'] },
  { id: 'meeting-cost', render: 'renderMeetingCost',   icon: '💰', color: '#f97316', name: '会议费用',       desc: '实时计算会议成本，输入人数和薪资即刻开始', category: '时间效率', file: 'meeting-cost.js', tags: ['meeting','会议','费用','成本','薪资','cost'] },
  { id: 'spinner', render: 'renderSpinner',        icon: '🎡', color: '#8b5cf6', name: '随机抽签',       desc: '自定义名单随机抽取，转盘动效', category: '时间效率', file: 'spinner.js', tags: ['random','抽签','抽奖','转盘','随机','pick','lottery'] },
  // 网络工具
  { id: 'user-agent', render: 'renderUserAgent',     icon: '🖥️', color: '#475569', name: 'UA 解析',        desc: '解析浏览器 User-Agent，识别系统/浏览器/设备', category: '网络工具', file: 'user-agent.js', tags: ['ua','user-agent','浏览器','browser','设备','device','useragent'] },
  { id: 'http-tester', render: 'renderHttpTester',    icon: '🛰️', color: '#be185d', name: 'HTTP 请求测试',  desc: '可视化发送 GET/POST 请求，简版 Postman', category: '网络工具', file: 'http-tester.js', tags: ['http','request','请求','get','post','api','postman','test'] },
  // 趣味工具
  { id: 'ascii-art', render: 'renderAsciiArt',      icon: '🎨', color: '#0f172a', name: 'ASCII 艺术字',   desc: '文字转 ASCII 艺术字，4 种字体风格', category: '趣味工具', file: 'ascii-art.js', tags: ['ascii','art','艺术字','figlet','字符画'] },
  // 新增工具
  { id: 'ip-info', render: 'renderIpInfo',        icon: '📡', color: '#0891b2', name: 'IP 信息',        desc: '查询本机 IP 及地理位置信息', category: '网络工具', file: 'ip-info.js', tags: ['ip','info','地理','位置','location','myip','公网'] },
  { id: 'text-escape', render: 'renderTextEscape',    icon: '↩️', color: '#64748b', name: '字符串转义',     desc: 'JSON/HTML/URL/正则转义，逐层去转义、直接复制与继续处理', category: '编码加密', file: 'text-escape.js', tags: ['escape','unescape','转义','反转义','去转义','字符串','backslash','嵌套','nested'] },
  { id: 'svg-preview', render: 'renderSvgPreview',    icon: '🖼️', color: '#7c3aed', name: 'SVG 预览',       desc: '粘贴 SVG 代码实时预览，支持缩放', category: '图片工具', file: 'svg-preview.js', tags: ['svg','preview','预览','矢量','vector','icon'] },
  { id: 'aspect-ratio', render: 'renderAspectRatio',   icon: '📐', color: '#10b981', name: '比例计算',       desc: '屏幕/图片尺寸比例换算，4:3/16:9 等常用比例', category: '计算工具', file: 'aspect-ratio.js', tags: ['aspect','ratio','比例','尺寸','屏幕','分辨率','16:9','4:3'] },
  { id: 'palette-gen', render: 'renderPaletteGen',    icon: '🎨', color: '#ec4899', name: '调色板生成器',   desc: '输入主色生成完整色阶、互补色、CSS 变量', category: 'CSS 工具', file: 'palette-gen.js', isNew: true, tags: ['palette','调色板','色阶','互补色','配色','color scheme'] },
  { id: 'img-webp', render: 'renderImgWebp',        icon: '🔄', color: '#0ea5e9', name: '图片转 WebP',    desc: '批量转换图片为 WebP 格式，支持质量调节和对比', category: '图片工具', file: 'img-compress.js', isNew: true, tags: ['webp','image','图片','转换','format','convert'] },
  { id: 'git-commit', render: 'renderGitCommit',      icon: '💬', color: '#f97316', name: 'Git Commit 生成', desc: 'Conventional Commits 规范，含 type/scope/breaking，一键复制', category: '开发工具', file: 'git-commit.js', isNew: true, tags: ['git','commit','提交','conventional','message','版本'] },
  { id: 'nginx-gen',  render: 'renderNginxGen',       icon: '⚙️',  color: '#22c55e', name: 'Nginx 配置生成', desc: '静态站/SPA/反向代理/HTTPS/负载均衡五种场景，一键生成 nginx.conf', category: '开发工具', file: 'nginx-gen.js', isNew: true, tags: ['nginx','config','配置','反向代理','proxy','https','server'] },
  { id: 'clip-path',  render: 'renderClipPath',       icon: '✂️',  color: '#a855f7', name: 'clip-path 生成器', desc: '可视化生成 CSS clip-path，支持多边形/圆形/椭圆/内嵌，拖拽控制点', category: 'CSS 工具', file: 'clip-path.js', isNew: true, tags: ['clip-path','裁剪','css','polygon','circle','shape'] },
  { id: 'speed-test', render: 'renderSpeedTest',      icon: '🚀', color: '#06b6d4', name: '网速测试',        desc: '测试网络下载/上传速度与延迟，仪表盘实时展示', category: '网络工具', file: 'speed-test.js', isNew: true, tags: ['speed','test','网速','带宽','bandwidth','ping','延迟'] },
  // 新增工具
  { id: 'diff-json',       render: 'renderDiffJson',       icon: '🔀', color: '#3b82f6', name: 'JSON 对比',        desc: '两个 JSON 结构递归对比，高亮新增/删除/变更字段',              category: '数据格式', file: 'diff-json.js',       isNew: true, tags: ['json','diff','对比','compare','差异','merge'] },
  { id: 'toml-json',       render: 'renderTomlJson',       icon: '🔄', color: '#f59e0b', name: 'TOML ↔ JSON',      desc: 'TOML 1.0 与 JSON 双向互转，支持内联表与多行数组',           category: '数据格式', file: 'toml-json.js',       isNew: true, tags: ['toml','json','配置','config','convert','cargo'] },
  { id: 'env-parse',       render: 'renderEnvParse',       icon: '⚙️', color: '#10b981', name: 'ENV 解析器',       desc: '按 dotenv 规则解析 .env，检查重复键，导出 JSON/Shell/Docker',                   category: '数据格式', file: 'env-parse.js',       isNew: true, tags: ['env','dotenv','环境变量','config','配置','.env'] },
  { id: 'docker-gen',      render: 'renderDockerGen',      icon: '🐳', color: '#0ea5e9', name: 'Dockerfile 生成',  desc: '选择语言生成最佳实践 Dockerfile，支持 Node/Python/Go/Java',   category: '开发工具', file: 'docker-gen.js',      isNew: true, tags: ['docker','dockerfile','容器','container','镜像','image'] },
  { id: 'css-unit',        render: 'renderCssUnit',        icon: '📐', color: '#a855f7', name: 'CSS 单位转换',     desc: 'px/rem/em/%/vw/vh/pt 互转，根字号、父字号和视口可配置',    category: 'CSS 工具', file: 'css-unit.js',        isNew: true, tags: ['css','unit','px','rem','em','vw','vh','pt','像素','单位'] },
  { id: 'world-clock',     render: 'renderWorldClock',     icon: '🌍', color: '#06b6d4', name: '世界时钟',         desc: '8 大时区同屏实时显示，上海/纽约/伦敦/东京等',               category: '时间效率', file: 'world-clock.js',     isNew: true, tags: ['world','clock','时钟','全球','时区','timezone'] },
  { id: 'stopwatch',       render: 'renderStopwatch',      icon: '⏱️', color: '#f59e0b', name: '秒表计时',         desc: '开始/暂停/复位/计次，毫秒精度，计次记录列表',               category: '时间效率', file: 'stopwatch.js',       isNew: true, tags: ['stopwatch','秒表','计时','lap','timer'] },
  { id: 'text-template',   render: 'renderTextTemplate',   icon: '📋', color: '#10b981', name: '文本模板',         desc: '{{变量}} 占位符替换，自动生成填写表单，实时预览输出',        category: '时间效率', file: 'text-template.js',   isNew: true, tags: ['template','模板','变量','placeholder','替换','批量'] },
  { id: 'matrix-rain',     render: 'renderMatrixRain',     icon: '💻', color: '#22c55e', name: '矩阵雨',           desc: 'Matrix 数字雨 canvas 动画，经典绿色字符瀑布',               category: '趣味工具', file: 'matrix-rain.js',     isNew: true, tags: ['matrix','rain','数字雨','动画','黑客','hacker'] },
  // 文本处理 - 新增
  { id: 'slug-gen',        render: 'renderSlugGen',        icon: '🔗', color: '#6366f1', name: 'Slug 生成器',      desc: '标题转 URL 友好 slug，支持横线/下划线/点分隔符',            category: '文本处理', file: 'slug-gen.js',        isNew: true, tags: ['slug','url','seo','permalink','friendly','链接'] },
  { id: 'line-sort',       render: 'renderLineSort',       icon: '↕️', color: '#0ea5e9', name: '行排序去重',       desc: '多行文本排序、去重、去空行、首尾清理，支持组合清洗',               category: '文本处理', file: 'line-sort.js',       isNew: true, tags: ['sort','排序','去重','dedup','unique','行','line','trim','清洗'] },
  // 开发工具 - 新增
  { id: 'semver',          render: 'renderSemver',         icon: '🏷️', color: '#8b5cf6', name: 'Semver 比较',      desc: '语义化版本解析、比较与批量排序，预发布按规范比较',                   category: '开发工具', file: 'semver.js',          isNew: true, tags: ['semver','version','版本','semantic','比较','npm'] },
  { id: 'dns-lookup',      render: 'renderDnsLookup',      icon: '🌐', color: '#06b6d4', name: 'DNS 查询',         desc: '通过 DNS over HTTPS 查询 A/AAAA/MX/TXT/CNAME/NS 记录',     category: '网络工具', file: 'dns-lookup.js',      isNew: true, tags: ['dns','domain','域名','lookup','mx','cname','ns','resolve'] },
  { id: 'terminal-color',  render: 'renderTerminalColor',  icon: '🖥️', color: '#22c55e', name: '终端颜色码',       desc: 'ANSI 颜色代码生成预览，前景/背景/样式任意组合',             category: '开发工具', file: 'terminal-color.js',  isNew: true, tags: ['ansi','terminal','终端','颜色','color','bash','shell'] },
  // 计算工具 - 新增
  { id: 'age-calc',        render: 'renderAgeCalc',        icon: '🎂', color: '#ec4899', name: '年龄计算器',       desc: '精确年龄（岁月日）、距生日天数、生肖星座查询',              category: '计算工具', file: 'age-calc.js',        isNew: true, tags: ['age','年龄','生日','birthday','星座','生肖'] },
  { id: 'tax-calc',        render: 'renderTaxCalc',        icon: '💰', color: '#f59e0b', name: '个税计算器',       desc: '工资个税按月累计预扣明细，含专项附加扣除与年终奖单独计税',            category: '计算工具', file: 'tax-calc.js',        isNew: true, tags: ['tax','个税','所得税','工资','salary','五险一金'] },
  // 时间工具 - 新增
  { id: 'lunar-calendar',  render: 'renderLunarCalendar',  icon: '🌙', color: '#8b5cf6', name: '农历查询',         desc: '公历农历互转，含干支、生肖、节气与日干支',               category: '时间效率', file: 'lunar-calendar.js',  isNew: true, tags: ['lunar','农历','日历','干支','节气','calendar','阴历'] },
  // 效率工具 - 新增
  { id: 'todo',            render: 'renderTodo',           icon: '✅', color: '#10b981', name: 'Todo 清单',        desc: '本地存储 Todo 清单，支持完成/删除/清空已完成',             category: '时间效率', file: 'todo.js',            isNew: true, tags: ['todo','待办','任务','task','checklist','清单'] },
  { id: 'data-backup',     render: 'renderDataBackup',     icon: '📦', color: '#14b8a6', name: '数据备份与迁移',   desc: '一键导出/导入收藏、设置、便签、待办、AI 对话等本机数据，支持合并与加密 API 密钥', category: '时间效率', file: 'data-backup.js',     isNew: true, tags: ['backup','restore','export','import','migrate','sync','备份','恢复','导出','导入','迁移','同步','数据'] },
  { id: 'note',            render: 'renderNote',           icon: '📝', color: '#f59e0b', name: '临时便签',         desc: '自动保存文本便签，关闭不丢失，字数统计',                    category: '时间效率', file: 'note.js',            isNew: true, tags: ['note','便签','笔记','memo','记事','notepad'] },
  { id: 'typing-speed',    render: 'renderTypingSpeed',    icon: '⌨️', color: '#3b82f6', name: '打字速度测试',     desc: '句子/单词双模式，WPM 实时计算，60秒计时挑战',              category: '时间效率', file: 'typing-speed.js',    isNew: true, tags: ['typing','打字','速度','wpm','keyboard','练习','game','游戏','单词','word'] },
  // 图片工具 - 新增
  { id: 'img-exif',        render: 'renderImgExif',        icon: '📷', color: '#64748b', name: 'EXIF 查看器',      desc: '读取图片拍摄参数、相机型号、ISO、曝光时间等 EXIF 信息',    category: '图片工具', file: 'img-exif.js',        isNew: true, tags: ['exif','photo','照片','拍摄','相机','camera','metadata'] },
  // 第三轮新增工具
  { id: 'mock-data',       render: 'renderMockData',       icon: '🎭', color: '#8b5cf6', name: 'Mock 数据生成',    desc: '批量生成模拟数据（姓名/手机/邮箱/地址等），支持 JSON/CSV/SQL',  category: '开发工具', file: 'mock-data.js',       isNew: true, tags: ['mock','fake','数据','生成','模拟','test','faker'] },
  { id: 'chmod-calc',      render: 'renderChmodCalc',      icon: '🔑', color: '#f59e0b', name: 'Chmod 计算器',     desc: 'Linux 文件权限计算，数字与符号模式双向转换',                  category: '开发工具', file: 'chmod-calc.js',      isNew: true, tags: ['chmod','permission','权限','linux','rwx','755','644'] },
  { id: 'placeholder-img', render: 'renderPlaceholderImg', icon: '🖼️', color: '#06b6d4', name: '占位图生成',       desc: '自定义尺寸/颜色/文字的占位图，Canvas 绘制+下载',             category: '图片工具', file: 'placeholder-img.js', isNew: true, tags: ['placeholder','占位图','image','尺寸','dummy','thumbnail'] },
  { id: 'string-inspect',  render: 'renderStringInspect',  icon: '🔬', color: '#ec4899', name: '字符串检查器',     desc: '逐字符检查 Unicode 码点/字节数/不可见字符高亮',              category: '文本处理', file: 'string-inspect.js',  isNew: true, tags: ['string','inspect','unicode','字符','不可见','zero-width','BOM','检查'] },
  { id: 'json-schema',     render: 'renderJsonSchema',     icon: '📐', color: '#3b82f6', name: 'JSON Schema 生成', desc: '从全部样本推断 Schema，完整 Draft-07 校验、错误路径与取消',          category: '数据格式', file: 'json-schema.js',     isNew: true, tags: ['json','schema','类型','type','validate','draft-07','推断'] },
  { id: 'favicon-gen',     render: 'renderFaviconGen',     icon: '⭐', color: '#f43f5e', name: 'Favicon 生成器',   desc: '文字/Emoji 生成多尺寸 Favicon，导出 ICO/PNG/SVG',            category: '图片工具', file: 'favicon-gen.js',     isNew: true, tags: ['favicon','icon','图标','ico','generate','网站'] },
  { id: 'llm-token',       render: 'renderLlmToken',       icon: '🤖', color: '#10b981', name: 'LLM Token 计数',   desc: '估算文本 Token 数和 API 调用价格（GPT/Claude）',             category: '开发工具', file: 'llm-token.js',       isNew: true, tags: ['token','llm','gpt','claude','ai','价格','计数','tokenizer'] },
  { id: 'hmac-gen',        render: 'renderHmacGen',        icon: '🔏', color: '#7c3aed', name: 'HMAC 生成器',      desc: 'HMAC-SHA256/384/512/SHA1 消息认证码生成',                    category: '编码加密', file: 'hmac-gen.js',        isNew: true, tags: ['hmac','sha256','mac','签名','signature','hash','认证'] },
  // 趣味工具 - 新增
  { id: 'emoji-picker',    render: 'renderEmojiPicker',    icon: '😀', color: '#f59e0b', name: 'Emoji 选择器',     desc: '分类浏览 Emoji，点击一键复制，支持搜索',                   category: '趣味工具', file: 'emoji-picker.js',    isNew: true, tags: ['emoji','表情','icon','copy','符号'] },
  { id: 'noise-gen',       render: 'renderNoiseGen',       icon: '🎵', color: '#8b5cf6', name: '白噪音',           desc: '白噪音/粉红噪音/棕色噪音/雨声，可调音量，Web Audio API',  category: '趣味工具', file: 'noise-gen.js',       isNew: true, tags: ['noise','white','pink','rain','噪音','雨声','助眠','专注'] },
];
  const categories = {
  "文本处理": {
    "en": "Text",
    "icon": "🔤"
  },
  "数据格式": {
    "en": "Data & Formats",
    "icon": "📋"
  },
  "开发工具": {
    "en": "Development",
    "icon": "🛠️"
  },
  "编码加密": {
    "en": "Encoding & Crypto",
    "icon": "🔐"
  },
  "图片工具": {
    "en": "Images",
    "icon": "🖼️"
  },
  "CSS 工具": {
    "en": "CSS & Design",
    "icon": "🎨"
  },
  "网络工具": {
    "en": "Network & HTTP",
    "icon": "🌐"
  },
  "时间效率": {
    "en": "Time & Productivity",
    "icon": "⏱️"
  },
  "计算工具": {
    "en": "Calculators",
    "icon": "🧮"
  },
  "趣味工具": {
    "en": "Fun",
    "icon": "🎪"
  }
};
  const workbenches = [
  { id: 'formats', tools: ['json','json-csv','yaml-json','toml-json','xml-format','env-parse','json-schema','diff-json'], name: {zh:'数据格式工作台', en:'Data Format Workbench'}, desc: {zh:'格式化、转换、结构对比与 Schema，结果可继续处理', en:'Format, convert, compare and generate schemas with reusable results'} },
  { id: 'text', tools: ['case-convert','slug-gen','line-sort','wordcount'], name: {zh:'文本处理工作台', en:'Text Workbench'}, desc: {zh:'命名转换、Slug、行清洗与字数统计', en:'Naming styles, slugs, line cleanup and text statistics'} },
  { id: 'escaping', tools: ['text-escape','html-entity','unicode-convert'], name: {zh:'编码与转义', en:'Encoding & Escaping'}, desc: {zh:'JSON、HTML、URL、正则与 Unicode 转义', en:'JSON, HTML, URL, regex and Unicode escaping'} },
  { id: 'units', tools: ['unit-convert','byte-convert'], name: {zh:'单位与容量换算', en:'Units & Storage'}, desc: {zh:'常用单位、1000/1024 容量与带宽换算', en:'Unit conversion, decimal/binary storage and bandwidth'} },
  {
    "id": "images",
    "tools": [
      "img-compress",
      "img-webp"
    ],
    "name": {
      "zh": "图片压缩与转换",
      "en": "Image Compression & Conversion"
    },
    "desc": {
      "zh": "图片压缩、格式转换、批量 WebP",
      "en": "Compress images, convert formats and batch-export WebP"
    }
  },
  {
    "id": "hashing",
    "tools": [
      "hash",
      "hmac-gen"
    ],
    "name": {
      "zh": "哈希与 HMAC",
      "en": "Hash & HMAC"
    },
    "desc": {
      "zh": "文本与文件摘要、校验与 HMAC 签名",
      "en": "Text/file hashes, verification and HMAC signing"
    }
  },
  {
    "id": "qr",
    "tools": [
      "qrcode",
      "qrcode-decode"
    ],
    "name": {
      "zh": "二维码工具",
      "en": "QR Code Tools"
    },
    "desc": {
      "zh": "生成二维码、上传图片识别内容",
      "en": "Generate QR codes and decode uploaded images"
    }
  },
  {
    "id": "timezones",
    "tools": [
      "timezone",
      "world-clock"
    ],
    "name": {
      "zh": "时区与世界时钟",
      "en": "Time Zones & World Clock"
    },
    "desc": {
      "zh": "换算时区、查看世界时钟、对比会议时间",
      "en": "Convert time zones, view world clocks and compare meeting times"
    }
  },
  {
    "id": "http",
    "tools": [
      "http-tester",
      "curl-gen",
      "http-status"
    ],
    "name": {
      "zh": "HTTP 请求工具",
      "en": "HTTP Request Tools"
    },
    "desc": {
      "zh": "发送请求、导入与生成 cURL、查询状态码",
      "en": "Send requests, import/generate cURL and look up status codes"
    }
  }
];
  const network = new Set(['http-tester', 'dns-lookup', 'ip-info', 'speed-test']);
  const fileTools = new Set(['img-compress', 'img-webp', 'img-base64', 'img-exif', 'qrcode-decode']);
  for (const tool of tools) {
    tool.execution = tool.id === 'ai-chat' ? 'model' : network.has(tool.id) ? 'network' : tool.id === 'password-gen' ? 'optional-network' : 'local';
    tool.requiresFile = fileTools.has(tool.id);
    tool.workbenchId = workbenches.find(group => group.tools.includes(tool.id))?.id || null;
  }
  const groupFor = id => workbenches.find(group => group.tools.includes(id)) || null;
  const entries = tools.filter(tool => {
    const group = groupFor(tool.id);
    return !group || group.tools[0] === tool.id;
  }).map(tool => {
    const group = groupFor(tool.id);
    return group ? { ...tool, name: group.name.zh, desc: group.desc.zh, catalogEntry: true } : tool;
  });
  const categoryName = (name, lang) => lang === 'en' ? categories[name]?.en || (name === 'AI 助手' ? 'AI Assistant' : name) : name;
  window.ToolCatalog = { tools, entries, categories, workbenches, groupFor, categoryName };
})();
