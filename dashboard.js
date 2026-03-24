const TOOLS = [
{ id: 'uuid', render: 'renderUUID',          icon: '🎲', color: '#f59e0b', name: 'UUID 生成器',    desc: '批量生成 UUID v4，一键复制，支持自定义数量', category: '文本处理', file: 'uuid.js', tags: ['uuid','guid','id','唯一标识','随机id','generate'] },
{ id: 'json', render: 'renderJSON',          icon: '📋', color: '#3b82f6', name: 'JSON 格式化',   desc: '格式化、压缩、校验 JSON，语法错误即时提示', category: '文本处理', file: 'json-format.js', tags: ['json','format','prettify','minify','validate','校验','美化','压缩'] },
{ id: 'base64', render: 'renderBase64',        icon: '🔤', color: '#8b5cf6', name: 'Base64 编解码',  desc: '文本与 Base64 互转，支持 URL 安全模式', category: '文本处理', file: 'base64.js', tags: ['base64','encode','decode','编码','解码','b64'] },
{ id: 'wordcount', render: 'renderWordCount',     icon: '📝', color: '#10b981', name: '字数统计',      desc: '统计字符数、单词数、行数、段落数、中文字数', category: '文本处理', file: 'word-count.js', tags: ['word','count','字数','字符','统计','行数','words'] },
{ id: 'regex', render: 'renderRegex',         icon: '🔍', color: '#6366f1', name: '正则测试器',    desc: '实时高亮匹配，捕获组详情，多 flag 切换', category: '文本处理', file: 'regex.js', tags: ['regex','regexp','正则','匹配','pattern','regular expression'] },
{ id: 'json-csv', render: 'renderJsonCsv',      icon: '🔄', color: '#0ea5e9', name: 'JSON/CSV 互转', desc: 'JSON 数组与 CSV 双向转换，支持下载文件', category: '文本处理', file: 'json-csv.js', tags: ['json','csv','转换','convert','表格','excel'] },
{ id: 'text-diff', render: 'renderTextDiff',     icon: '📊', color: '#f97316', name: '文本对比',      desc: '逐行对比两段文本，高亮差异内容', category: '文本处理', file: 'text-diff.js', tags: ['diff','compare','对比','比较','差异','文本'] },
{ id: 'markdown', render: 'renderMarkdown',      icon: '✍️',  color: '#14b8a6', name: 'Markdown 预览', desc: '实时渲染 Markdown，支持代码高亮', category: '文本处理', file: 'markdown.js', tags: ['markdown','md','预览','preview','渲染'] },
{ id: 'case-convert', render: 'renderCaseConvert',  icon: '🔡', color: '#64748b', name: '大小写转换',    desc: '驼峰、下划线、全大写等多种格式互转', category: '文本处理', file: 'case-convert.js', tags: ['case','camel','snake','kebab','pascal','大小写','驼峰','下划线','命名'] },
{ id: 'unicode-convert', render: 'renderUnicode',icon: '🌐', color: '#7c3aed', name: 'Unicode 转换', desc: 'Unicode 码点与字符互转，支持转义序列', category: '文本处理', file: 'unicode-convert.js', tags: ['unicode','码点','转义','字符','codepoint','escape'] },
{ id: 'html-entity', render: 'renderHTMLEntity',   icon: '🏷️', color: '#dc2626', name: 'HTML 实体转换', desc: 'HTML 实体编解码，< > & " \'等特殊字符处理', category: '文本处理', file: 'html-entity.js', tags: ['html','entity','实体','转义','escape','特殊字符'] },
{ id: 'lorem', render: 'renderLorem',         icon: '📄', color: '#059669', name: '占位文本生成',  desc: '生成中英文 Lorem ipsum 占位文本，自定义段落数', category: '文本处理', file: 'lorem.js', tags: ['lorem','ipsum','占位','placeholder','假文','dummy'] },
{ id: 'timestamp', render: 'renderTimestamp',     icon: '⏱️',  color: '#f59e0b', name: '时间戳转换',   desc: '实时时间戳、秒/毫秒互转、日期解析、多格式输出', category: '开发工具', file: 'timestamp.js', tags: ['timestamp','unix','epoch','时间戳','日期','date','time','毫秒','秒','format','格式','iso','utc'] },
{ id: 'url-parser', render: 'renderUrlParser',    icon: '🔗', color: '#14b8a6', name: 'URL 工具箱',    desc: 'URL 解析、编解码、参数构建三合一', category: '开发工具', file: 'url-parser.js', tags: ['url','parse','链接','网址','参数','query','href','encode','decode','编码','解码'] },
{ id: 'hash', render: 'renderHash',          icon: '🔐', color: '#ec4899', name: '哈希生成器',    desc: 'SHA-1/256/384/512，支持文本和文件哈希校验', category: '开发工具', file: 'hash.js', tags: ['hash','sha','sha256','sha1','sha512','md5','摘要','digest','哈希','散列','校验'] },
{ id: 'jwt', render: 'renderJWT',           icon: '🎫', color: '#8b5cf6', name: 'JWT 工具',      desc: '解析/生成 JWT Token，支持 HS256 签名', category: '开发工具', file: 'jwt.js', tags: ['jwt','token','解码','decode','auth','认证','json web token','生成','generate','签名','sign','secret'] },
{ id: 'number-base', render: 'renderNumberBase',   icon: '🔢', color: '#f97316', name: '进制转换',      desc: '二/八/十/十六进制互转，ASCII/Unicode 码点', category: '开发工具', file: 'number-base.js', tags: ['hex','binary','octal','decimal','进制','十六进制','二进制','八进制','0x'] },
{ id: 'yaml-json', render: 'renderYAMLJSON',     icon: '📑', color: '#65a30d', name: 'YAML/JSON 互转',desc: 'YAML 与 JSON 双向转换，配置文件处理', category: '开发工具', file: 'yaml-json.js', tags: ['yaml','yml','json','配置','config','convert'] },
{ id: 'sql-format', render: 'renderSQLFormat',    icon: '🗄️', color: '#b45309', name: 'SQL 格式化',    desc: 'SQL 美化/压缩，支持 SELECT/INSERT/UPDATE/DELETE', category: '开发工具', file: 'sql-format.js', tags: ['sql','format','数据库','query','查询','美化','database'] },
{ id: 'curl-gen', render: 'renderCurlGen',      icon: '🌀', color: '#0369a1', name: 'cURL 生成器',   desc: '可视化配置生成 curl / fetch / axios 代码片段', category: '开发工具', file: 'curl-gen.js', tags: ['curl','http','fetch','axios','api','请求','request'] },
{ id: 'http-status', render: 'renderHttpStatus',   icon: '📡', color: '#be185d', name: 'HTTP 状态码',   desc: '查询 HTTP 状态码含义，支持搜索和分类浏览', category: '开发工具', file: 'http-status.js', tags: ['http','status','状态码','200','404','500','response'] },
{ id: 'cron', render: 'renderCron',          icon: '⏰', color: '#d97706', name: 'Cron 表达式',   desc: '可视化解析 Cron 表达式，展示下次执行时间', category: '开发工具', file: 'cron.js', tags: ['cron','crontab','定时','schedule','调度','定时任务'] },
{ id: 'password-gen', render: 'renderPasswordGen',  icon: '🛡️', color: '#16a34a', name: '密码生成器',    desc: '自定义规则生成强密码，密码强度评估', category: '开发工具', file: 'password-gen.js', tags: ['password','密码','生成','random','安全','强密码','pwd'] },
{ id: 'gradient', render: 'renderGradient',      icon: '🎨', color: '#ec4899', name: '渐变生成器',    desc: '可视化创建 CSS 渐变，实时预览代码输出', category: 'CSS 工具', file: 'gradient.js', tags: ['gradient','渐变','css','linear','radial','背景'] },
{ id: 'color', render: 'renderColor',         icon: '🖌️', color: '#f43f5e', name: '颜色工具',      desc: '拾色器/格式转换/对比度检查三合一', category: 'CSS 工具', file: 'color.js', tags: ['color','picker','颜色','拾色','hex','rgb','hsl','取色','convert','转换','hsv','cmyk','contrast','对比度','wcag'] },
{ id: 'shadow', render: 'renderShadow',        icon: '🌑', color: '#475569', name: '阴影生成器',    desc: '可视化调整 box-shadow，多层阴影叠加', category: 'CSS 工具', file: 'shadow.js', tags: ['shadow','box-shadow','阴影','css','投影'] },
{ id: 'flexbox', render: 'renderFlexbox',       icon: '📐', color: '#0284c7', name: 'Flexbox 生成',  desc: '可视化配置 Flexbox 布局，自动生成 CSS', category: 'CSS 工具', file: 'flexbox.js', tags: ['flexbox','flex','布局','layout','css','弹性'] },
{ id: 'img-base64', render: 'renderImgBase64',    icon: '🖼️', color: '#0891b2', name: '图片 Base64',  desc: '图片与 Base64 字符串互转，支持预览', category: '图片工具', file: 'img-base64.js', tags: ['image','base64','图片','转换','data uri','img'] },
{ id: 'img-compress', render: 'renderImgCompress',  icon: '🗜️', color: '#16a34a', name: '图片压缩',      desc: '本地压缩图片，调整质量和尺寸，支持批量', category: '图片工具', file: 'img-compress.js', tags: ['image','compress','图片','压缩','resize','缩小'] },
{ id: 'qrcode', render: 'renderQrCode',        icon: '📱', color: '#0f172a', name: '二维码生成',    desc: '文本/URL 转二维码，自定义颜色和尺寸', category: '图片工具', file: 'qrcode.js', tags: ['qr','qrcode','二维码','扫码','generate'] },
{ id: 'qrcode-decode', render: 'renderQRCodeDecode', icon: '🔭', color: '#1d4ed8', name: '二维码解析',    desc: '上传图片识别二维码内容，支持拖拽', category: '图片工具', file: 'qrcode-decode.js', tags: ['qr','qrcode','二维码','解析','识别','scan','decode'] },
{ id: 'aes', render: 'renderAES',            icon: '🔒', color: '#7c3aed', name: 'AES 加解密',     desc: 'AES-GCM 对称加解密，SubtleCrypto 实现', category: '编码加密', file: 'aes.js', tags: ['aes','encrypt','decrypt','加密','解密','对称','crypto'] },
{ id: 'morse', render: 'renderMorse',          icon: '📡', color: '#b45309', name: '摩斯电码',       desc: '文本与摩斯电码互转，支持播放音频', category: '编码加密', file: 'morse.js', tags: ['morse','摩斯','电码','编码','点划'] },
{ id: 'xml-format', render: 'renderXmlFormat',     icon: '📰', color: '#0369a1', name: 'XML 格式化',     desc: 'XML 美化/压缩，一键转 JSON', category: '编码加密', file: 'xml-format.js', tags: ['xml','format','格式化','美化','markup'] },
{ id: 'calculator', render: 'renderCalculator',     icon: '🧮', color: '#6366f1', name: '科学计算器',     desc: '键盘/鼠标双控，支持基础及百分比运算', category: '计算工具', file: 'calculator.js', tags: ['calculator','calc','计算','数学','math','加减乘除'] },
{ id: 'unit-convert', render: 'renderUnitConvert',   icon: '📏', color: '#10b981', name: '单位换算',       desc: '长度/重量/温度/面积/存储/速度/数字格式化多维换算', category: '计算工具', file: 'unit-convert.js', tags: ['unit','convert','单位','换算','长度','重量','温度','面积','数字格式化','千分位','currency','货币','number format'] },
{ id: 'loan-calc', render: 'renderLoanCalc',      icon: '🏦', color: '#f59e0b', name: '贷款计算器',     desc: '等额本息/本金还款，含完整还款计划表', category: '计算工具', file: 'loan-calc.js', tags: ['loan','贷款','房贷','还款','利率','mortgage','等额本息'] },
{ id: 'byte-convert', render: 'renderByteConvert',   icon: '💾', color: '#64748b', name: '存储换算',       desc: '字节/KB/MB/GB/TB 互转，含网速换算', category: '计算工具', file: 'byte-convert.js', tags: ['byte','kb','mb','gb','tb','存储','容量','storage','网速'] },
{ id: 'number-chinese', render: 'renderNumberChinese', icon: '🀄', color: '#dc2626', name: '数字大写',       desc: '数字转财务中文大写，适合票据填写', category: '计算工具', file: 'number-chinese.js', tags: ['chinese','大写','财务','金额','票据','壹贰叁'] },
{ id: 'ip-calc', render: 'renderIpCalc',        icon: '🌐', color: '#0891b2', name: 'IP 子网计算',    desc: 'IP/CIDR 子网掩码计算，主机范围与广播地址', category: '计算工具', file: 'ip-calc.js', tags: ['ip','cidr','subnet','子网','掩码','网段','network'] },
{ id: 'date-diff', render: 'renderDateDiff',      icon: '📅', color: '#14b8a6', name: '日期差计算',     desc: '两日期间隔天数，含工作日/节假日计算', category: '时间工具', file: 'date-diff.js', tags: ['date','diff','日期','天数','间隔','工作日','days'] },
{ id: 'timezone', render: 'renderTimezone',       icon: '🌍', color: '#6366f1', name: '时区转换',       desc: '13 个主要时区实时对比，快速换算', category: '时间工具', file: 'timezone.js', tags: ['timezone','时区','utc','gmt','时差','convert'] },
{ id: 'countdown', render: 'renderCountdown',      icon: '⏳', color: '#ec4899', name: '倒计时',         desc: '自定义目标日期倒计时，SVG 圆弧进度', category: '时间工具', file: 'countdown.js', tags: ['countdown','倒计时','timer','计时','目标'] },
{ id: 'pomodoro', render: 'renderPomodoro',       icon: '🍅', color: '#ef4444', name: '番茄钟',         desc: '25分钟专注 + 5分钟休息，SVG 进度环', category: '效率工具', file: 'pomodoro.js', tags: ['pomodoro','番茄','专注','focus','timer','计时'] },
{ id: 'meeting-cost', render: 'renderMeetingCost',   icon: '💰', color: '#f97316', name: '会议费用',       desc: '实时计算会议成本，输入人数和薪资即刻开始', category: '效率工具', file: 'meeting-cost.js', tags: ['meeting','会议','费用','成本','薪资','cost'] },
{ id: 'spinner', render: 'renderSpinner',        icon: '🎡', color: '#8b5cf6', name: '随机抽签',       desc: '自定义名单随机抽取，转盘动效', category: '效率工具', file: 'spinner.js', tags: ['random','抽签','抽奖','转盘','随机','pick','lottery'] },
{ id: 'user-agent', render: 'renderUserAgent',     icon: '🖥️', color: '#475569', name: 'UA 解析',        desc: '解析浏览器 User-Agent，识别系统/浏览器/设备', category: '网络工具', file: 'user-agent.js', tags: ['ua','user-agent','浏览器','browser','设备','device','useragent'] },
{ id: 'http-tester', render: 'renderHttpTester',    icon: '🛰️', color: '#be185d', name: 'HTTP 请求测试',  desc: '可视化发送 GET/POST 请求，简版 Postman', category: '网络工具', file: 'http-tester.js', tags: ['http','request','请求','get','post','api','postman','test'] },
{ id: 'ascii-art', render: 'renderAsciiArt',      icon: '🎨', color: '#0f172a', name: 'ASCII 艺术字',   desc: '文字转 ASCII 艺术字，4 种字体风格', category: '趣味工具', file: 'ascii-art.js', tags: ['ascii','art','艺术字','figlet','字符画'] },
{ id: 'ip-info', render: 'renderIpInfo',        icon: '📡', color: '#0891b2', name: 'IP 信息',        desc: '查询本机 IP 及地理位置信息', category: '网络工具', file: 'ip-info.js', tags: ['ip','info','地理','位置','location','myip','公网'] },
{ id: 'text-escape', render: 'renderTextEscape',    icon: '↩️', color: '#64748b', name: '字符串转义',     desc: 'JSON/正则/HTML/URL 字符串转义与反转义', category: '文本处理', file: 'text-escape.js', tags: ['escape','unescape','转义','反转义','字符串','backslash'] },
{ id: 'svg-preview', render: 'renderSvgPreview',    icon: '🖼️', color: '#7c3aed', name: 'SVG 预览',       desc: '粘贴 SVG 代码实时预览，支持缩放', category: 'CSS 工具', file: 'svg-preview.js', tags: ['svg','preview','预览','矢量','vector','icon'] },
{ id: 'aspect-ratio', render: 'renderAspectRatio',   icon: '📐', color: '#10b981', name: '比例计算',       desc: '屏幕/图片尺寸比例换算，4:3/16:9 等常用比例', category: '计算工具', file: 'aspect-ratio.js', tags: ['aspect','ratio','比例','尺寸','屏幕','分辨率','16:9','4:3'] },
{ id: 'palette-gen', render: 'renderPaletteGen',    icon: '🎨', color: '#ec4899', name: '调色板生成器',   desc: '输入主色生成完整色阶、互补色、CSS 变量', category: 'CSS 工具', file: 'palette-gen.js', isNew: true, tags: ['palette','调色板','色阶','互补色','配色','color scheme'] },
{ id: 'img-webp', render: 'renderImgWebp',        icon: '🔄', color: '#0ea5e9', name: '图片转 WebP',    desc: '批量转换图片为 WebP 格式，支持质量调节和对比', category: '图片工具', file: 'img-webp.js', isNew: true, tags: ['webp','image','图片','转换','format','convert'] },
{ id: 'git-commit', render: 'renderGitCommit',      icon: '💬', color: '#f97316', name: 'Git Commit 生成', desc: 'Conventional Commits 规范，含 type/scope/breaking，一键复制', category: '开发工具', file: 'git-commit.js', isNew: true, tags: ['git','commit','提交','conventional','message','版本'] },
{ id: 'nginx-gen',  render: 'renderNginxGen',       icon: '⚙️',  color: '#22c55e', name: 'Nginx 配置生成', desc: '静态站/SPA/反向代理/HTTPS/负载均衡五种场景，一键生成 nginx.conf', category: '开发工具', file: 'nginx-gen.js', isNew: true, tags: ['nginx','config','配置','反向代理','proxy','https','server'] },
{ id: 'clip-path',  render: 'renderClipPath',       icon: '✂️',  color: '#a855f7', name: 'clip-path 生成器', desc: '可视化生成 CSS clip-path，支持多边形/圆形/椭圆/内嵌，拖拽控制点', category: 'CSS 工具', file: 'clip-path.js', isNew: true, tags: ['clip-path','裁剪','css','polygon','circle','shape'] },
{ id: 'speed-test', render: 'renderSpeedTest',      icon: '🚀', color: '#06b6d4', name: '网速测试',        desc: '测试网络下载/上传速度与延迟，仪表盘实时展示', category: '网络工具', file: 'speed-test.js', isNew: true, tags: ['speed','test','网速','带宽','bandwidth','ping','延迟'] },
{ id: 'diff-json',       render: 'renderDiffJson',       icon: '🔀', color: '#3b82f6', name: 'JSON 对比',        desc: '两个 JSON 结构递归对比，高亮新增/删除/变更字段',              category: '文本处理', file: 'diff-json.js',       isNew: true, tags: ['json','diff','对比','compare','差异','merge'] },
{ id: 'toml-json',       render: 'renderTomlJson',       icon: '🔄', color: '#f59e0b', name: 'TOML ↔ JSON',      desc: 'TOML 与 JSON 双向互转，支持 [section] 和嵌套结构',           category: '文本处理', file: 'toml-json.js',       isNew: true, tags: ['toml','json','配置','config','convert','cargo'] },
{ id: 'env-parse',       render: 'renderEnvParse',       icon: '⚙️', color: '#10b981', name: 'ENV 解析器',       desc: '解析 .env 文件，提取 KEY/VALUE，一键复制',                   category: '开发工具', file: 'env-parse.js',       isNew: true, tags: ['env','dotenv','环境变量','config','配置','.env'] },
{ id: 'docker-gen',      render: 'renderDockerGen',      icon: '🐳', color: '#0ea5e9', name: 'Dockerfile 生成',  desc: '选择语言生成最佳实践 Dockerfile，支持 Node/Python/Go/Java',   category: '开发工具', file: 'docker-gen.js',      isNew: true, tags: ['docker','dockerfile','容器','container','镜像','image'] },
{ id: 'css-unit',        render: 'renderCssUnit',        icon: '📐', color: '#a855f7', name: 'CSS 单位转换',     desc: 'px/rem/em/vw/vh/pt 多单位互转，基准字号和视口宽度可配置',    category: 'CSS 工具', file: 'css-unit.js',        isNew: true, tags: ['css','unit','px','rem','em','vw','vh','pt','像素','单位'] },
{ id: 'world-clock',     render: 'renderWorldClock',     icon: '🌍', color: '#06b6d4', name: '世界时钟',         desc: '8 大时区同屏实时显示，上海/纽约/伦敦/东京等',               category: '时间工具', file: 'world-clock.js',     isNew: true, tags: ['world','clock','时钟','全球','时区','timezone'] },
{ id: 'stopwatch',       render: 'renderStopwatch',      icon: '⏱️', color: '#f59e0b', name: '秒表计时',         desc: '开始/暂停/复位/计次，毫秒精度，计次记录列表',               category: '效率工具', file: 'stopwatch.js',       isNew: true, tags: ['stopwatch','秒表','计时','lap','timer'] },
{ id: 'text-template',   render: 'renderTextTemplate',   icon: '📋', color: '#10b981', name: '文本模板',         desc: '{{变量}} 占位符替换，自动生成填写表单，实时预览输出',        category: '效率工具', file: 'text-template.js',   isNew: true, tags: ['template','模板','变量','placeholder','替换','批量'] },
{ id: 'matrix-rain',     render: 'renderMatrixRain',     icon: '💻', color: '#22c55e', name: '矩阵雨',           desc: 'Matrix 数字雨 canvas 动画，经典绿色字符瀑布',               category: '趣味工具', file: 'matrix-rain.js',     isNew: true, tags: ['matrix','rain','数字雨','动画','黑客','hacker'] },
{ id: 'slug-gen',        render: 'renderSlugGen',        icon: '🔗', color: '#6366f1', name: 'Slug 生成器',      desc: '标题转 URL 友好 slug，支持横线/下划线/点分隔符',            category: '文本处理', file: 'slug-gen.js',        isNew: true, tags: ['slug','url','seo','permalink','friendly','链接'] },
{ id: 'line-sort',       render: 'renderLineSort',       icon: '↕️', color: '#0ea5e9', name: '行排序去重',       desc: '多行文本升序/降序/随机打乱/去重/去空行/翻转',               category: '文本处理', file: 'line-sort.js',       isNew: true, tags: ['sort','排序','去重','dedup','unique','行','line'] },
{ id: 'semver',          render: 'renderSemver',         icon: '🏷️', color: '#8b5cf6', name: 'Semver 比较',      desc: '语义化版本解析、大小比较，支持预发布版本',                   category: '开发工具', file: 'semver.js',          isNew: true, tags: ['semver','version','版本','semantic','比较','npm'] },
{ id: 'dns-lookup',      render: 'renderDnsLookup',      icon: '🌐', color: '#06b6d4', name: 'DNS 查询',         desc: '通过 DNS over HTTPS 查询 A/AAAA/MX/TXT/CNAME/NS 记录',     category: '开发工具', file: 'dns-lookup.js',      isNew: true, tags: ['dns','domain','域名','lookup','mx','cname','ns','resolve'] },
{ id: 'terminal-color',  render: 'renderTerminalColor',  icon: '🖥️', color: '#22c55e', name: '终端颜色码',       desc: 'ANSI 颜色代码生成预览，前景/背景/样式任意组合',             category: '开发工具', file: 'terminal-color.js',  isNew: true, tags: ['ansi','terminal','终端','颜色','color','bash','shell'] },
{ id: 'age-calc',        render: 'renderAgeCalc',        icon: '🎂', color: '#ec4899', name: '年龄计算器',       desc: '精确年龄（岁月日）、距生日天数、生肖星座查询',              category: '计算工具', file: 'age-calc.js',        isNew: true, tags: ['age','年龄','生日','birthday','星座','生肖'] },
{ id: 'tax-calc',        render: 'renderTaxCalc',        icon: '💰', color: '#f59e0b', name: '个税计算器',       desc: '2024 个人所得税速算，含五险一金和专项附加扣除',            category: '计算工具', file: 'tax-calc.js',        isNew: true, tags: ['tax','个税','所得税','工资','salary','五险一金'] },
{ id: 'lunar-calendar',  render: 'renderLunarCalendar',  icon: '🌙', color: '#8b5cf6', name: '农历查询',         desc: '查询任意日期的干支年、生肖、节气、年内天数',               category: '时间工具', file: 'lunar-calendar.js',  isNew: true, tags: ['lunar','农历','日历','干支','节气','calendar','阴历'] },
{ id: 'todo',            render: 'renderTodo',           icon: '✅', color: '#10b981', name: 'Todo 清单',        desc: '本地存储 Todo 清单，支持完成/删除/清空已完成',             category: '效率工具', file: 'todo.js',            isNew: true, tags: ['todo','待办','任务','task','checklist','清单'] },
{ id: 'note',            render: 'renderNote',           icon: '📝', color: '#f59e0b', name: '临时便签',         desc: '自动保存文本便签，关闭不丢失，字数统计',                    category: '效率工具', file: 'note.js',            isNew: true, tags: ['note','便签','笔记','memo','记事','notepad'] },
{ id: 'typing-speed',    render: 'renderTypingSpeed',    icon: '⌨️', color: '#3b82f6', name: '打字速度测试',     desc: '句子/单词双模式，WPM 实时计算，60秒计时挑战',              category: '效率工具', file: 'typing-speed.js',    isNew: true, tags: ['typing','打字','速度','wpm','keyboard','练习','game','游戏','单词','word'] },
{ id: 'img-exif',        render: 'renderImgExif',        icon: '📷', color: '#64748b', name: 'EXIF 查看器',      desc: '读取图片拍摄参数、相机型号、ISO、曝光时间等 EXIF 信息',    category: '图片工具', file: 'img-exif.js',        isNew: true, tags: ['exif','photo','照片','拍摄','相机','camera','metadata'] },
{ id: 'emoji-picker',    render: 'renderEmojiPicker',    icon: '😀', color: '#f59e0b', name: 'Emoji 选择器',     desc: '分类浏览 Emoji，点击一键复制，支持搜索',                   category: '趣味工具', file: 'emoji-picker.js',    isNew: true, tags: ['emoji','表情','icon','copy','符号'] },
{ id: 'noise-gen',       render: 'renderNoiseGen',       icon: '🎵', color: '#8b5cf6', name: '白噪音',           desc: '白噪音/粉红噪音/棕色噪音/雨声，可调音量，Web Audio API',  category: '趣味工具', file: 'noise-gen.js',       isNew: true, tags: ['noise','white','pink','rain','噪音','雨声','助眠','专注'] },
];
const CATEGORIES = [...new Set(TOOLS.map(t => t.category))];
const CAT_COUNTS = Object.fromEntries(CATEGORIES.map(c => [c, TOOLS.filter(t => t.category === c).length]));
const CAT_ICONS = {
'文本处理': '🔤',
'开发工具': '🛠️',
'CSS 工具': '🎨',
'编码加密': '🔐',
'计算工具': '🧮',
'时间工具': '⏱️',
'图片工具': '🖼️',
'效率工具': '⚡',
'网络工具': '🌐',
'趣味工具': '🎪',
};
const LS = {
get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let currentPage = 'home';
let currentCatFilter = 'all';
let favorites = LS.get('dtb_favorites', []);
let recent = LS.get('dtb_recent', []);
let collapsed = LS.get('dtb_sidebar_collapsed', false);
let theme = LS.get('dtb_theme', 'dark');
let loadedTools = {};
const _loadOrder = []; 
const _MAX_LOADED = 30;
let searchQuery = '';
let searchHistory = LS.get('dtb_search_history', []); 
let collapsedCats = LS.get('dtb_collapsed_cats', {});
let usageCounts = LS.get('dtb_usage', {});
const _prefetchQueue = new Set();
function prefetchTool(id) {
if (loadedTools[id] || _prefetchQueue.has(id)) return;
if (_prefetchQueue.size >= 3) return;
const tool = TOOLS.find(t => t.id === id);
if (!tool) return;
_prefetchQueue.add(id);
const s = document.createElement('script');
s.src = 'tools/' + tool.file;
s.onload = () => { loadedTools[id] = true; _trackLoaded(id); _prefetchQueue.delete(id); };
s.onerror = () => { _prefetchQueue.delete(id); };
document.head.appendChild(s);
}
function addUsage(id) {
usageCounts[id] = (usageCounts[id] || 0) + 1;
clearTimeout(addUsage._timer);
addUsage._timer = setTimeout(() => { LS.set('dtb_usage', usageCounts); }, 2000);
}
function renderHomePage(mode) {
const content = document.getElementById('content');
if (!content) return;
const tools = getLocalizedTools(TOOLS);
let html = '';
if (mode === 'favorites') {
const favTools = favorites.map(id => tools.find(t => t.id === id)).filter(Boolean);
if (!favTools.length) {
html = `<div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-title">${t('fav_empty_title')}</div><div class="empty-sub">${t('fav_empty_sub')}</div></div>`;
} else {
html = `<div class="home-section"><div class="section-title">${t('fav_title')} <span class="section-count">${favTools.length}</span></div><div class="tools-grid">${favTools.map(renderToolCard).join('')}</div></div>`;
}
content.innerHTML = html;
return;
}
if (mode === 'recent') {
const recentTools = recent.map(id => tools.find(t => t.id === id)).filter(Boolean);
if (!recentTools.length) {
html = `<div class="empty-state"><div class="empty-icon">🕐</div><div class="empty-title">${t('recent_empty_title')}</div><div class="empty-sub">${t('recent_empty_sub')}</div></div>`;
} else {
html = `<div class="home-section"><div class="section-title">${t('recent_title')} <span class="section-count">${recentTools.length}</span></div><div class="tools-grid">${recentTools.map(renderToolCard).join('')}</div></div>`;
}
content.innerHTML = html;
return;
}
const hour = new Date().getHours();
const greeting = hour < 6 ? t('greet_late') : hour < 12 ? t('greet_morning') : hour < 18 ? t('greet_afternoon') : t('greet_evening');
const topTools = Object.entries(usageCounts)
.sort((a,b) => b[1]-a[1]).slice(0,5)
.map(([id]) => tools.find(t => t.id===id)).filter(Boolean);
const topHtml = topTools.length ? `
<div class="home-hero-quick">
<span style="font-size:11px;color:var(--text-muted)">${t('hero_hot')}</span>
${topTools.map(tool => `<button class="hero-quick-btn" onclick="navigateTo('${tool.id}')" style="--qc:${tool.color}">${tool.icon} ${tool.name}</button>`).join('')}
</div>` : '';
html += `<div class="home-hero">
<div class="home-hero-top">
<div class="home-hero-title">🔧 K Toolkit <span style="font-size:12px;opacity:0.6;font-weight:400;margin-left:6px">Agentic</span></div>
<div class="home-hero-sub">${greeting}，${t('hero_sub', tools.length)}</div>
</div>
<div class="home-hero-stats">
<div class="home-hero-stat"><strong>${tools.length}</strong>${t('stat_tools')}</div>
<div class="home-hero-stat"><strong>${favorites.length || 0}</strong>${t('stat_favs')}</div>
<div class="home-hero-stat"><strong>${recent.length || 0}</strong>${t('stat_recent')}</div>
</div>
${topHtml}
</div>`;
const localCats = getLocalizedTools(TOOLS).reduce((acc, tool) => { if (!acc.includes(tool.category)) acc.push(tool.category); return acc; }, []);
const localizedTools = getLocalizedTools(TOOLS);
const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
html += `<div class="cat-tabs-wrap"><div class="cat-tabs"><button class="cat-tab ${currentCatFilter === 'all' ? 'active' : ''}" onclick="setCatFilter('all')">${t('cat_all')} <span class="cat-tab-count">${localizedTools.length}</span></button>`;
CATEGORIES.forEach(cat => {
const localCat = getLocalizedTools(TOOLS).find(tool => {
const orig = TOOLS.find(x => x.id === tool.id);
return orig && orig.category === cat;
});
const localCatName = localCat ? localCat.category : cat;
const n = CAT_COUNTS[cat];
html += `<button class="cat-tab ${currentCatFilter === cat ? 'active' : ''}" onclick="setCatFilter('${cat}')">${localCatIcons[cat] || CAT_ICONS[cat] || ''} ${localCatName} <span class="cat-tab-count">${n}</span></button>`;
});
html += `</div></div>`;
if (currentCatFilter === 'all' && favorites.length) {
const favTools = favorites.slice(0,6).map(id => localizedTools.find(t => t.id === id)).filter(Boolean);
html += `<div class="home-section"><div class="section-title">⭐ ${t('fav_title')} <span class="section-count">${favorites.length}</span></div><div class="tools-grid">${favTools.map(renderToolCard).join('')}</div></div>`;
}
if (currentCatFilter === 'all' && recent.length) {
const recentTools = recent.slice(0,6).map(id => localizedTools.find(t => t.id === id)).filter(Boolean);
html += `<div class="home-section"><div class="section-title">🕐 ${t('recent_title')} <span class="section-count">${recent.length}</span></div><div class="tools-grid">${recentTools.map(renderToolCard).join('')}</div></div>`;
}
const filteredCats = currentCatFilter === 'all' ? CATEGORIES : [currentCatFilter];
filteredCats.forEach(cat => {
const sampleTool = localizedTools.find(tool => TOOLS.find(x => x.id === tool.id && x.category === cat));
const localCatName = sampleTool ? sampleTool.category : cat;
const catTools = TOOLS.filter(tool => tool.category === cat);
const icon = localCatIcons[cat] || CAT_ICONS[cat] || '';
html += `<div class="home-section" data-lazy-cat="${cat}"><div class="section-title">${icon} ${localCatName} <span class="section-count">${catTools.length}</span></div><div class="tools-grid"></div></div>`;
});
content.innerHTML = html;
_initLazyCats();
}
let _lazyCatObserver = null;
function _initLazyCats() {
if (_lazyCatObserver) { _lazyCatObserver.disconnect(); _lazyCatObserver = null; }
const sections = document.querySelectorAll('[data-lazy-cat]');
if (!sections.length) return;
_lazyCatObserver = new IntersectionObserver(entries => {
entries.forEach(entry => {
if (!entry.isIntersecting) return;
const cat = entry.target.dataset.lazyCat;
const grid = entry.target.querySelector('.tools-grid');
if (!grid || grid.children.length) return;
grid.innerHTML = getLocalizedTools(TOOLS).filter(tool => TOOLS.find(x => x.id === tool.id && x.category === cat)).map(renderToolCard).join('');
_lazyCatObserver.unobserve(entry.target);
});
}, { rootMargin: '200px' });
sections.forEach(s => _lazyCatObserver.observe(s));
}
function setCatFilter(cat) {
currentCatFilter = cat;
renderHomePage('home');
}
function renderToolCard(tool) {
const isFav = favorites.includes(tool.id);
const useCount = usageCounts[tool.id] || 0;
const badge = useCount >= 3 ? `<span class="tool-card-badge">${useCount >= 99 ? '99+' : useCount}</span>` : '';
const newBadge = tool.isNew ? `<span class="tool-card-new">NEW</span>` : '';
return `<div class="tool-card" onclick="navigateTo('${tool.id}')" onmouseenter="prefetchTool('${tool.id}')" style="--card-color:${tool.color}">
<button class="fav-btn ${isFav ? 'active' : ''}" data-id="${tool.id}" onclick="toggleFavorite('${tool.id}',event)" title="${isFav ? t('fav_remove') : t('fav_add')}">★</button>
${badge}${newBadge}
<div class="tool-card-icon">${tool.icon}</div>
<div class="tool-card-name">${tool.name}</div>
<div class="tool-card-desc">${tool.desc}</div>
<div class="tool-card-tag">${tool.category}</div>
</div>`;
}
let historyStack = [];
function _progressStart() {
const el = document.getElementById('top-progress');
if (!el) return;
el.style.transform = 'scaleX(0.6)';
el.classList.add('running');
el.classList.remove('done');
}
function _progressDone() {
const el = document.getElementById('top-progress');
if (!el) return;
el.classList.add('done');
setTimeout(() => { el.classList.remove('running', 'done'); el.style.transform = ''; }, 600);
}
async function loadTool(id) {
if (loadedTools[id]) return;
const tool = TOOLS.find(t => t.id === id);
if (!tool) return;
_progressStart();
await new Promise((resolve, reject) => {
const s = document.createElement('script');
s.src = 'tools/' + tool.file;
s.onload = () => { _progressDone(); resolve(); };
s.onerror = () => { _progressDone(); reject(new Error('加载失败: ' + tool.file)); };
document.head.appendChild(s);
});
loadedTools[id] = true;
_trackLoaded(id);
}
function _trackLoaded(id) {
const idx = _loadOrder.indexOf(id);
if (idx !== -1) _loadOrder.splice(idx, 1);
_loadOrder.push(id);
if (_loadOrder.length > _MAX_LOADED) {
const evict = _loadOrder.shift();
delete loadedTools[evict];
const s = document.head.querySelector(`script[src="tools/${TOOLS.find(t=>t.id===evict)?.file}"]`);
if (s) s.remove();
}
}
function buildSidebarNav() {
const nav = document.getElementById('sidebarNav');
if (!nav) return;
const fixed = [
{ page: 'home', icon: '🏠', label: t('nav_home') },
{ page: 'favorites', icon: '⭐', label: t('nav_favs') },
{ page: 'recent', icon: '🕐', label: t('nav_recent') },
];
let html = '<div class="nav-section nav-section-fixed">';
fixed.forEach(i => {
html += `<a class="nav-item" data-page="${i.page}" href="#${i.page}" data-tooltip="${i.label}"><span class="nav-icon">${i.icon}</span><span class="nav-label">${i.label}</span></a>`;
});
html += '</div><div class="nav-divider"></div>';
const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
const localizedTools = getLocalizedTools(TOOLS);
CATEGORIES.forEach(cat => {
const catTools = localizedTools.filter(tool => TOOLS.find(x => x.id === tool.id && x.category === cat));
const localCatName = catTools.length ? catTools[0].category : cat;
const icon = localCatIcons[cat] || CAT_ICONS[cat] || '📁';
const isCollapsed = collapsedCats[cat];
html += `<div class="nav-cat ${isCollapsed ? 'collapsed' : ''}" data-cat="${cat}">`;
html += `<div class="nav-cat-header" onclick="toggleNavCat('${cat}')">`;
html += `<span class="nav-cat-icon">${icon}</span>`;
html += `<span class="nav-cat-label">${localCatName}</span>`;
html += `<span class="nav-cat-count">${catTools.length}</span>`;
html += `<span class="nav-cat-arrow">›</span>`;
html += `</div>`;
html += `<div class="nav-cat-tools">`;
catTools.forEach(tool => {
html += `<a class="nav-item nav-tool-item" data-page="${tool.id}" href="#${tool.id}" data-tooltip="${tool.name}"><span class="nav-icon">${tool.icon}</span><span class="nav-label">${tool.name}</span></a>`;
});
html += `</div></div>`;
});
nav.innerHTML = html;
nav.querySelectorAll('.nav-item[data-page]').forEach(a => {
const label = a.querySelector('.nav-label');
if (label) a.dataset.tooltip = label.textContent.trim();
});
}
function toggleNavCat(cat) {
collapsedCats[cat] = !collapsedCats[cat];
LS.set('dtb_collapsed_cats', collapsedCats);
const el = document.querySelector(`.nav-cat[data-cat="${cat}"]`);
if (el) el.classList.toggle('collapsed', collapsedCats[cat]);
}
function init() {
buildSidebarNav();
applyTheme();
applySidebarCollapse();
bindKeyboard();
initScrollTop();
initTopbarClock();
document.querySelectorAll('.nav-item[data-page]').forEach(a => {
const label = a.querySelector('.nav-label');
if (label) a.dataset.tooltip = label.textContent.trim();
});
const hash = location.hash.replace('#', '') || 'home';
navigateTo(hash, false);
window.addEventListener('hashchange', () => {
const h = location.hash.replace('#', '') || 'home';
navigateTo(h, false);
});
}
function initTopbarClock() {
const el = document.getElementById('topbarClock');
if (!el) return;
const DAYS_ZH = ['日','一','二','三','四','五','六'];
const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function tick() {
const now = new Date();
const h = String(now.getHours()).padStart(2,'0');
const m = String(now.getMinutes()).padStart(2,'0');
const s = String(now.getSeconds()).padStart(2,'0');
const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh';
const day = lang === 'zh' ? `周${DAYS_ZH[now.getDay()]}` : DAYS_EN[now.getDay()];
const mo = String(now.getMonth()+1).padStart(2,'0');
const d = String(now.getDate()).padStart(2,'0');
const dateStr = lang === 'zh' ? `${mo}/${d} ${day}` : `${day} ${mo}/${d}`;
el.innerHTML = `<span class="topbar-clock-time">${h}:${m}:${s}</span><span class="topbar-clock-date">${dateStr}</span>`;
}
tick();
setInterval(tick, 1000);
}
function initScrollTop() {
const btn = document.createElement('button');
btn.id = 'scrollTopBtn';
btn.title = '返回顶部';
btn.innerHTML = '↑';
btn.onclick = () => document.getElementById('content').scrollTo({ top: 0, behavior: 'smooth' });
document.body.appendChild(btn);
document.getElementById('content').addEventListener('scroll', function() {
btn.classList.toggle('visible', this.scrollTop > 300);
});
}
let _homeScrollTop = 0;
async function navigateTo(page, pushHash = true) {
if (pushHash && location.hash !== '#' + page) {
historyStack.push(currentPage);
location.hash = page;
return;
}
if (window._activeCleanup) { window._activeCleanup(); window._activeCleanup = null; }
const prevPage = currentPage;
const prevIsSpecial = ['home','favorites','recent'].includes(prevPage);
const content = document.getElementById('content');
if (prevIsSpecial && content) _homeScrollTop = content.scrollTop;
currentPage = page;
updateNavActive(page);
const isSpecial = ['home','favorites','recent'].includes(page);
if (isSpecial) {
renderHomePage(page);
} else {
const tool = TOOLS.find(t => t.id === page);
if (tool) { addUsage(page); await renderToolPageFull(tool); }
else renderHomePage('home');
}
if (!isSpecial && TOOLS.find(t => t.id === page)) addRecent(page);
if (isSpecial) {
content.scrollTop = _homeScrollTop;
} else {
content.scrollTop = 0;
}
const fab = document.getElementById('scrollTopBtn');
if (fab) fab.style.display = isSpecial ? '' : 'none';
content.classList.remove('content-fade-in');
void content.offsetWidth;
content.classList.add('content-fade-in');
}
function updateNavActive(page) {
document.querySelectorAll('.nav-item').forEach(a =>
a.classList.toggle('active', a.dataset.page === page));
document.querySelectorAll('.bottom-nav-item').forEach(a =>
a.classList.toggle('active', a.dataset.page === page));
}
function addRecent(id) {
recent = [id, ...recent.filter(x => x !== id)].slice(0, 8);
LS.set('dtb_recent', recent);
}
function toggleFavorite(id, event) {
event && event.stopPropagation();
const adding = !favorites.includes(id);
favorites = adding ? [id, ...favorites] : favorites.filter(x => x !== id);
LS.set('dtb_favorites', favorites);
showToast(adding ? t('toast_fav_add') : t('toast_fav_remove'), adding ? 'success' : 'info', 1500);
if (['home','favorites','recent'].includes(currentPage)) {
renderHomePage(currentPage);
} else {
document.querySelectorAll('.fav-btn').forEach(btn => {
if (btn.dataset.id === id) {
btn.classList.toggle('active', favorites.includes(id));
btn.innerHTML = '★ <span>' + (favorites.includes(id) ? t('toast_fav_add') : t('fav_add')) + '</span>';
}
});
}
}
let searchDropdownIdx = -1;
let _searchTimer = null;
function handleSearch(val) {
const clearBtn = document.getElementById('searchClear');
const kbdHint = document.getElementById('searchKbdHint');
if (clearBtn) clearBtn.style.display = val.trim() ? '' : 'none';
if (kbdHint) kbdHint.style.display = val.trim() ? 'none' : '';
clearTimeout(_searchTimer);
_searchTimer = setTimeout(() => {
searchQuery = val.trim().toLowerCase();
if (searchQuery) {
showSearchDropdown(searchQuery);
} else {
hideSearchDropdown();
}
}, 100);
}
function handleSearchKey(e) {
if (e.isComposing || e.keyCode === 229) return;
const drop = document.getElementById('searchDropdown');
if (e.key === 'Escape') { clearSearch(); hideSearchDropdown(); return; }
if (!drop || drop.style.display === 'none') return;
const items = drop.querySelectorAll('.sdrop-item');
if (e.key === 'ArrowDown') { e.preventDefault(); searchDropdownIdx = Math.min(searchDropdownIdx + 1, items.length - 1); updateDropdownActive(items); }
else if (e.key === 'ArrowUp') { e.preventDefault(); searchDropdownIdx = Math.max(searchDropdownIdx - 1, 0); updateDropdownActive(items); }
else if (e.key === 'Enter') {
e.preventDefault();
const active = drop.querySelector('.sdrop-item.active');
if (active) { hideSearchDropdown(); clearSearch(); navigateTo(active.dataset.id); }
else if (searchQuery) {
_addSearchHistory(searchQuery);
hideSearchDropdown(); renderSearchResults(searchQuery); currentPage = '__search__'; updateNavActive('');
}
}
}
function updateDropdownActive(items) {
items.forEach((el, i) => el.classList.toggle('active', i === searchDropdownIdx));
if (items[searchDropdownIdx]) items[searchDropdownIdx].scrollIntoView({ block: 'nearest' });
}
let _searchHistoryTimer = null;
function _addSearchHistory(q) {
if (!q || q.length < 2) return;
searchHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 5);
clearTimeout(_searchHistoryTimer);
_searchHistoryTimer = setTimeout(() => LS.set('dtb_search_history', searchHistory), 1000);
}
function _hlMatch(text, q) {
if (!q) return escHtml(text);
const tokens = q.split(/[\s,，、]+/).filter(Boolean);
if (!tokens.length) return escHtml(text);
const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const re = new RegExp('(' + escaped.join('|') + ')', 'gi');
const testRe = new RegExp('^(' + escaped.join('|') + ')$', 'i');
const parts = text.split(re);
return parts.map(p => testRe.test(p) ? '<span class="search-highlight">' + escHtml(p) + '</span>' : escHtml(p)).join('');
}
function showSearchDropdown(q) {
let drop = document.getElementById('searchDropdown');
if (!drop) {
drop = document.createElement('div');
drop.id = 'searchDropdown';
drop.className = 'search-dropdown';
document.querySelector('.search-wrap').appendChild(drop);
document.addEventListener('mousedown', function _sdClose(e) {
const wrap = document.querySelector('.search-wrap');
if (wrap && !wrap.contains(e.target)) {
hideSearchDropdown();
}
});
}
const tokens = q.toLowerCase().split(/[\s,，、]+/).filter(Boolean);
const scored = [];
for (const t of TOOLS) {
const name = (t.name || '').toLowerCase();
const desc = (t.desc || '').toLowerCase();
const cat  = (t.category || '').toLowerCase();
const id   = (t.id || '').toLowerCase();
const tags = (t.tags || []).map(tag => tag.toLowerCase()).join(' ');
let score = 0, matchedToks = 0;
for (const tok of tokens) {
let s = 0;
if (id === tok) s += 10; else if (id.includes(tok)) s += 5;
if (name.includes(tok)) s += 6;
if (tags.includes(tok)) s += 3;
if (cat.includes(tok)) s += 2;
if (desc.includes(tok)) s += 1;
if (s > 0) { score += s; matchedToks++; }
}
if (matchedToks > 0) {
if (matchedToks === tokens.length && tokens.length > 1) score += 5;
scored.push({ t, score });
}
}
scored.sort((a, b) => b.score - a.score);
const matched = scored.slice(0, 12).map(x => x.t);
searchDropdownIdx = -1;
if (!matched.length) {
drop.innerHTML = `<div class="sdrop-empty">未找到「${escHtml(q)}」相关工具</div>`;
} else {
const bycat = {};
matched.forEach(t => { (bycat[t.category] = bycat[t.category] || []).push(t); });
let html = `<div class="sdrop-header">${t('search_results', matched.length)}</div>`;
Object.entries(bycat).forEach(([cat, tools]) => {
const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
html += `<div class="sdrop-cat">${localCatIcons[cat] || CAT_ICONS[cat] || ''} ${cat}</div>`;
const visible = tools.slice(0, 3);
visible.forEach(tool => {
const hlName = _hlMatch(tool.name, q);
const hlDesc = _hlMatch(tool.desc, q);
html += `<div class="sdrop-item" data-id="${tool.id}" onclick="sdropClick('${tool.id}')">`;
html += `<span class="sdrop-icon" style="background:${tool.color}22">${tool.icon}</span>`;
html += `<span class="sdrop-info"><span class="sdrop-name">${hlName}</span><span class="sdrop-desc">${hlDesc}</span></span>`;
html += `<span class="sdrop-cat-tag">${cat}</span>`;
html += `</div>`;
});
if (tools.length > 3) {
html += `<div class="sdrop-more" onclick="sdropViewAll('${escHtml(q)}')">  ${t('search_view_all', tools.length)}</div>`;
}
});
drop.innerHTML = html;
}
drop.style.display = 'block';
}
function hideSearchDropdown() {
const drop = document.getElementById('searchDropdown');
if (drop) drop.style.display = 'none';
searchDropdownIdx = -1;
}
function sdropClick(id) {
hideSearchDropdown();
clearSearch();
navigateTo(id);
}
function sdropViewAll(q) {
hideSearchDropdown();
const inp = document.getElementById('searchInput');
if (inp) inp.value = q;
searchQuery = q;
renderSearchResults(q);
}
function clearSearch() {
const inp = document.getElementById('searchInput');
if (inp) inp.value = '';
searchQuery = '';
const clearBtn = document.getElementById('searchClear');
if (clearBtn) clearBtn.style.display = 'none';
const kbdHint = document.getElementById('searchKbdHint');
if (kbdHint) kbdHint.style.display = '';
hideSearchDropdown();
}
function focusSearch(e) {
if (e) e.preventDefault();
const inp = document.getElementById('searchInput');
if (inp) {
inp.focus(); inp.select();
if (!inp.value.trim()) _showSearchHistory();
}
}
function _showSearchHistory() {
let drop = document.getElementById('searchDropdown');
if (!drop) {
drop = document.createElement('div');
drop.id = 'searchDropdown';
drop.className = 'search-dropdown';
document.querySelector('.search-wrap').appendChild(drop);
document.addEventListener('mousedown', function _sdClose(e) {
const wrap = document.querySelector('.search-wrap');
if (wrap && !wrap.contains(e.target)) hideSearchDropdown();
});
}
const localTools = getLocalizedTools(TOOLS);
const hotTools = Object.entries(usageCounts)
.sort((a,b) => b[1]-a[1]).slice(0,5)
.map(([id]) => localTools.find(t => t.id===id)).filter(Boolean);
const showHot = hotTools.length ? hotTools : localTools.slice(0,5);
let html = '';
if (searchHistory.length) {
html += `<div class="sdrop-header"><span>${t('search_history')}</span><span class="sdrop-clear-all" onclick="_clearSearchHistory()" style="cursor:pointer;font-size:11px;color:var(--text-muted);padding:2px 6px;border-radius:4px;transition:color 0.15s" onmouseenter="this.style.color='var(--accent)'" onmouseleave="this.style.color='var(--text-muted)'">✕ 清除</span></div>`;
searchHistory.forEach((h,i) => {
html += `<div class="sdrop-item" onclick="_useHistory('${escHtml(h)}')"><span style="color:var(--text-muted);font-size:12px;margin-right:8px">🕐</span><span style="flex:1">${escHtml(h)}</span><span onclick="event.stopPropagation();_removeSearchHistory(${i})" style="color:var(--text-muted);padding:2px 6px;border-radius:4px;font-size:12px;cursor:pointer" onmouseenter="this.style.color='var(--text)'" onmouseleave="this.style.color='var(--text-muted)'">✕</span></div>`;
});
html += `<div style="height:1px;background:rgba(255,255,255,0.06);margin:6px 8px"></div>`;
}
html += `<div class="sdrop-header"><span>${searchHistory.length ? '🔥 热门' : '🔥 热门工具'}</span></div>`;
showHot.forEach(tool => {
html += `<div class="sdrop-item" data-id="${tool.id}" onclick="sdropClick('${tool.id}')">`;
html += `<span class="sdrop-icon" style="background:${tool.color}22">${tool.icon}</span>`;
html += `<span class="sdrop-info"><span class="sdrop-name">${escHtml(tool.name)}</span><span class="sdrop-desc">${escHtml(tool.desc)}</span></span>`;
html += `<span class="sdrop-cat-tag">${escHtml(tool.category)}</span>`;
html += `</div>`;
});
drop.innerHTML = html;
drop.style.display = '';
}
function _clearSearchHistory() {
searchHistory = [];
LS.set('dtb_search_history', []);
hideSearchDropdown();
}
function _removeSearchHistory(idx) {
searchHistory.splice(idx, 1);
LS.set('dtb_search_history', searchHistory);
if (searchHistory.length || Object.keys(usageCounts).length) _showSearchHistory();
else hideSearchDropdown();
}
function _useHistory(q) {
const inp = document.getElementById('searchInput');
if (inp) inp.value = q;
hideSearchDropdown();
_addSearchHistory(q);
renderSearchResults(q);
currentPage = '__search__'; updateNavActive('');
}
function renderSearchResults(q) {
const tokens = q.toLowerCase().split(/[\s,，、]+/).filter(Boolean);
if (!tokens.length) return;
const score = tool => {
const name = (tool.name || '').toLowerCase();
const desc = (tool.desc || '').toLowerCase();
const cat  = (tool.category || '').toLowerCase();
const id   = (tool.id || '').toLowerCase();
const tags = (tool.tags || []).map(t => t.toLowerCase()).join(' ');
let total = 0, matched = 0;
for (const tok of tokens) {
let s = 0;
if (id === tok) s += 10;
else if (id.includes(tok)) s += 5;
if (name === tok) s += 10;
else if (name.startsWith(tok)) s += 8;
else if (name.includes(tok)) s += 6;
if (tags.includes(tok)) s += 3;
if (cat.includes(tok)) s += 2;
if (desc.includes(tok)) s += 1;
if (s > 0) { total += s; matched++; }
}
if (matched === tokens.length && tokens.length > 1) total += 5;
return matched > 0 ? total : 0;
};
const localizedTools = getLocalizedTools(TOOLS);
const matched = localizedTools.map(tool => ({ tool, s: score(tool) })).filter(x => x.s > 0)
.sort((a, b) => b.s - a.s || (usageCounts[b.tool.id] || 0) - (usageCounts[a.tool.id] || 0))
.map(x => x.tool);
const content = document.getElementById('content');
if (!content) return;
if (!matched.length) {
content.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">${t('search_no_result', escHtml(q))}</div></div>`;
return;
}
const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
const categories = [...new Set(matched.map(tool => tool.category))];
let html = '';
categories.forEach(cat => {
const catMatched = matched.filter(tool => tool.category === cat);
html += `<div class="home-section"><div class="section-title">${localCatIcons[cat] || CAT_ICONS[cat] || ''} ${cat} <span class="section-count">${catMatched.length}</span></div><div class="tools-grid">${catMatched.map(renderToolCard).join('')}</div></div>`;
});
content.innerHTML = `<div class="search-results-header">${t('search_results_header', escHtml(q), matched.length)}</div>` + html;
}
const THEMES = [
{ key: 'dark',      i18n: 'theme_dark',      color: '#8b5cf6', border: '#a78bfa' },
{ key: 'light',     i18n: 'theme_light',     color: '#ede9fe', border: '#6d28d9' },
{ key: 'tech-blue', i18n: 'theme_tech_blue', color: '#60a5fa', border: '#bfdbfe' },
{ key: 'sakura',    i18n: 'theme_sakura',    color: '#ec4899', border: '#f9a8d4' },
{ key: 'orange',    i18n: 'theme_orange',    color: '#f97316', border: '#fdba74' },
{ key: 'green',     i18n: 'theme_green',     color: '#10b981', border: '#6ee7b7' },
];
function applyTheme() {
document.documentElement.setAttribute('data-theme', theme);
const th = THEMES.find(th => th.key === theme) || THEMES[0];
const btn = document.getElementById('themeBtn');
if (btn) btn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${th.color};border:2.5px solid ${th.border};box-shadow:0 0 8px ${th.color},0 0 2px ${th.border};vertical-align:middle;flex-shrink:0"></span><span style="font-size:11px;margin-left:6px;color:var(--text);vertical-align:middle;font-weight:500">${t(th.i18n)}</span>`;
}
function toggleTheme() {
openThemePicker();
}
function openThemePicker() {
let picker = document.getElementById('themePicker');
if (picker) { picker.remove(); return; }
picker = document.createElement('div');
picker.id = 'themePicker';
picker.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;background:var(--sidebar-bg);border:1px solid var(--border);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:4px;min-width:160px;z-index:9999;backdrop-filter:blur(24px);box-shadow:0 16px 48px rgba(0,0,0,0.4)';
THEMES.forEach(th => {
const item = document.createElement('div');
item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;font-size:13px;color:var(--text);transition:background 0.15s' + (th.key === theme ? ';background:var(--surface);outline:1px solid var(--accent)' : '');
item.innerHTML = `<span style="width:14px;height:14px;border-radius:50%;background:${th.color};flex-shrink:0;display:inline-block"></span>${t(th.i18n)}`;
item.onmouseenter = () => { if (th.key !== theme) item.style.background = 'var(--surface-hover)'; };
item.onmouseleave = () => { if (th.key !== theme) item.style.background = ''; };
item.onclick = () => { theme = th.key; LS.set('dtb_theme', theme); applyTheme(); picker.remove(); };
picker.appendChild(item);
});
const wrap = document.getElementById('themeBtn').parentElement;
wrap.style.position = 'relative';
wrap.appendChild(picker);
setTimeout(() => document.addEventListener('click', function h(e) {
if (!picker.contains(e.target) && e.target.id !== 'themeBtn') { picker.remove(); document.removeEventListener('click', h); }
}), 0);
}
function applySidebarCollapse() {
const app = document.getElementById('app');
const btn = document.getElementById('collapseBtn');
if (!app) return;
app.classList.toggle('sidebar-collapsed', collapsed);
if (btn) btn.textContent = collapsed ? '›' : '‹';
}
function toggleCollapse() {
collapsed = !collapsed;
LS.set('dtb_sidebar_collapsed', collapsed);
applySidebarCollapse();
}
function toggleSidebar() {
document.getElementById('sidebar').classList.toggle('open');
document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
document.getElementById('sidebar').classList.remove('open');
document.getElementById('overlay').classList.remove('show');
}
function bottomNavClick(el) {
closeSidebar();
}
function bindKeyboard() {
document.addEventListener('keydown', e => {
const tag = document.activeElement.tagName;
const inInput = ['INPUT','TEXTAREA','SELECT'].includes(tag);
if (e.key === '/' && !inInput) {
e.preventDefault();
focusSearch();
}
if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
e.preventDefault();
openCmdPalette();
}
if (e.key === 'Escape') {
if (document.getElementById('agMiniOverlay') || document.getElementById('agConfigModal')) return;
const inp = document.getElementById('searchInput');
if (document.activeElement === inp) {
clearSearch(); inp.blur();
} else if (inInput) {
document.activeElement.blur();
} else if (['home','favorites','recent'].indexOf(currentPage) === -1) {
navigateTo('home');
}
}
if (e.key === 'ArrowLeft' && e.altKey && historyStack.length) {
e.preventDefault();
const prev = historyStack.pop();
navigateTo(prev, false);
location.hash = prev;
}
if (e.key === '?' && !inInput) {
e.preventDefault();
openCmdPalette();
}
});
document.addEventListener('click', e => {
if (!e.target.closest('.search-wrap')) hideSearchDropdown();
});
}
async function renderToolPageFull(tool) {
const content = document.getElementById('content');
if (!content) return;
content.innerHTML = `<div class="tool-loading"><div class="tool-loading-spinner"></div><span>${t('loading')}</span></div>`;
try { await loadTool(tool.id); } catch(e) {
content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">${t('load_fail')}</div><div class="empty-sub">${escHtml(e.message)}</div><div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="btn btn-primary" onclick="navigateTo('${tool.id}')">${t('retry')}</button><button class="btn btn-secondary" onclick="navigateTo('home')">${t('back_home')}</button></div></div>`;
return;
}
const fn = window[tool.render];
const isFav = favorites.includes(tool.id);
const localTool = getLocalizedTools(TOOLS).find(x => x.id === tool.id) || tool;
const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
content.innerHTML = `
<div class="tool-page">
<div class="tool-page-header">
<button class="back-btn" onclick="navigateTo('home')">${t('back')}</button>
<div class="tool-page-title-wrap">
<span class="tool-page-icon" style="background:${tool.color}20;color:${tool.color}">${tool.icon}</span>
<div>
<div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap">
<div class="tool-page-name">${localTool.name}</div>
<span class="tool-breadcrumb" onclick="setCatFilter('${tool.category}');navigateTo('home')" title="${localTool.category}">${localCatIcons[tool.category]||CAT_ICONS[tool.category]||'📁'} ${localTool.category}</span>
</div>
<div class="tool-page-desc">${localTool.desc}</div>
</div>
</div>
<div style="display:flex;gap:8px;align-items:center">
<button class="icon-btn" onclick="shareTool('${tool.id}')" title="${t('share')}">🔗</button>
<button class="fav-btn ${isFav?'active':''}" data-id="${tool.id}" onclick="toggleFavorite('${tool.id}',event)">★ <span>${isFav?t('toast_fav_add'):t('fav_add')}</span></button>
</div>
</div>
<div class="tool-body" id="toolBody"></div>
</div>`;
if (fn) fn(document.getElementById('toolBody'));
else document.getElementById('toolBody').innerHTML = `<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-title">${t('load_fail')}</div></div>`;
const related = getLocalizedTools(TOOLS).filter(tool2 => tool2.id !== tool.id && TOOLS.find(x => x.id === tool2.id && x.category === tool.category)).slice(0, 4);
if (related.length) {
const relDiv = document.createElement('div');
relDiv.className = 'related-tools';
relDiv.innerHTML = `<div class="section-title" style="margin-top:32px">${t('related_tools')}</div><div class="tools-grid">${related.map(renderToolCard).join('')}</div>`;
document.querySelector('.tool-page').appendChild(relDiv);
}
}
function showToast(msg, type = 'success', duration = 2000, onClick = null) {
let container = document.getElementById('toast-container');
if (!container) {
container = document.createElement('div');
container.id = 'toast-container';
document.body.appendChild(container);
}
const el = document.createElement('div');
el.className = 'toast-msg ' + type;
const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
el.innerHTML = `<span>${icons[type] || '✓'}</span><span>${msg}</span>`;
if (onClick) { el.style.cursor = 'pointer'; el.addEventListener('click', onClick); }
container.appendChild(el);
if (duration > 0) {
setTimeout(() => {
el.classList.add('toast-out');
setTimeout(() => el.remove(), 280);
}, duration);
}
}
function copyText(text, btn) {
const isEn = typeof getCurrentLang === 'function' && getCurrentLang() === 'en';
navigator.clipboard.writeText(text).then(() => {
const orig = btn.textContent;
btn.textContent = isEn ? '✓ Copied' : '✓ 已复制';
btn.classList.add('copied');
showToast(isEn ? 'Copied to clipboard' : '已复制到剪贴板');
setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
}).catch(() => showToast(isEn ? 'Copy failed' : '复制失败', 'error'));
}
function shareTool(id) {
const tool = TOOLS.find(t => t.id === id);
if (!tool) return;
const url = location.origin + location.pathname + '#' + id;
if (navigator.share) {
navigator.share({ title: tool.name, text: tool.desc, url }).catch(() => {});
} else {
navigator.clipboard.writeText(url).then(() => showToast('链接已复制 🔗')).catch(() => showToast('复制失败', 'error'));
}
}
function escHtml(s) {
return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
let _cmdLoaded = false;
function _loadCmd(cb) {
if (_cmdLoaded) { cb(); return; }
const s = document.createElement('script');
s.src = '/dashboard-cmd.js';
s.onload = () => { _cmdLoaded = true; cb(); };
document.head.appendChild(s);
}
function openCmdPalette() { _loadCmd(() => _cmdOpen()); }
function closeCmdPalette() { const el = document.getElementById('cmdPalette'); if (el) el.remove(); if (typeof _cmdIdx !== 'undefined') _cmdIdx = -1; }
function _initGlobalKeySubmit() {
const content = document.getElementById('content');
if (!content) return;
content.addEventListener('keydown', e => {
const el = e.target;
const panel = el.closest('.tool-card-panel') || el.closest('.tool-body');
if (!panel) return;
const btn = panel.querySelector('.btn-primary');
if (!btn) return;
if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
e.preventDefault();
btn.click();
return;
}
if (e.key === 'Enter' && el.tagName === 'INPUT' && (el.classList.contains('tool-input') || el.type === 'text')) {
if (el.id === 'searchInput' || el.closest('.search-wrap') || el.closest('.cmd-palette')) return;
e.preventDefault();
btn.click();
}
});
}
function _initGlobalPasteExec() {
const content = document.getElementById('content');
if (!content) return;
content.addEventListener('paste', e => {
const el = e.target;
if (!el.matches('textarea.tool-textarea, input.tool-input')) return;
if (el.dataset.noAutopaste !== undefined) return;
if (el.id === 'diffA' || el.id === 'diffB' || el.id === 'mdInput') return;
if (el.value.trim()) return;
const panel = el.closest('.tool-card-panel') || el.closest('.tool-body');
if (!panel) return;
const btn = panel.querySelector('.btn-primary');
if (!btn) return;
setTimeout(() => btn.click(), 200);
});
}
function _initTextareaCounter() {
const content = document.getElementById('content');
if (!content) return;
content.addEventListener('input', e => {
const el = e.target;
if (!el.matches('textarea.tool-textarea')) return;
let counter = el.parentElement.querySelector('.textarea-counter');
if (!counter) {
counter = document.createElement('div');
counter.className = 'textarea-counter';
counter.style.cssText = 'text-align:right;font-size:11px;color:var(--text-muted);opacity:0.7;margin-top:4px;font-family:monospace';
el.parentElement.insertBefore(counter, el.nextSibling);
}
const val = el.value;
const lines = val ? val.split('\n').length : 0;
const chars = val.length;
const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh';
counter.textContent = chars ? (lang === 'en' ? `${lines} lines · ${chars} chars` : `${lines} 行 · ${chars} 字符`) : '';
});
}
document.addEventListener('DOMContentLoaded', () => {
init();
_initGlobalKeySubmit();
_initGlobalPasteExec();
_initTextareaCounter();
window.TOOLS        = TOOLS;
window.navigateTo   = navigateTo;
window.showToast    = showToast;
window.getCurrentLang = getCurrentLang;
Object.defineProperties(window, {
currentPage: { get: () => currentPage, configurable: true },
favorites:   { get: () => favorites,   configurable: true },
recent:      { get: () => recent,       configurable: true },
});
});
window.addEventListener('online',  () => showToast(t('toast_online'), 'success'));
window.addEventListener('offline', () => showToast(t('toast_offline'), 'warn'));
if ('serviceWorker' in navigator) {
navigator.serviceWorker.addEventListener('message', e => {
if (e.data === 'sw-updated') showToast(t('toast_sw_update'), 'info', 8000, () => location.reload());
});
}