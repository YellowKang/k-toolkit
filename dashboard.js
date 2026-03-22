// ── 工具列表 ──
const TOOLS = [
  // 文本处理
  { id: 'uuid', render: 'renderUUID',          icon: '🎲', color: '#f59e0b', name: 'UUID 生成器',    desc: '批量生成 UUID v4，一键复制，支持自定义数量', category: '文本处理', file: 'uuid.js' },
  { id: 'json', render: 'renderJSON',          icon: '📋', color: '#3b82f6', name: 'JSON 格式化',   desc: '格式化、压缩、校验 JSON，语法错误即时提示', category: '文本处理', file: 'json-format.js' },
  { id: 'base64', render: 'renderBase64',        icon: '🔤', color: '#8b5cf6', name: 'Base64 编解码',  desc: '文本与 Base64 互转，支持 URL 安全模式', category: '文本处理', file: 'base64.js' },
  { id: 'wordcount', render: 'renderWordCount',     icon: '📝', color: '#10b981', name: '字数统计',      desc: '统计字符数、单词数、行数、段落数、中文字数', category: '文本处理', file: 'word-count.js' },
  { id: 'regex', render: 'renderRegex',         icon: '🔍', color: '#6366f1', name: '正则测试器',    desc: '实时高亮匹配，捕获组详情，多 flag 切换', category: '文本处理', file: 'regex.js' },
  { id: 'json-csv', render: 'renderJsonCsv',      icon: '🔄', color: '#0ea5e9', name: 'JSON/CSV 互转', desc: 'JSON 数组与 CSV 双向转换，支持下载文件', category: '文本处理', file: 'json-csv.js' },
  { id: 'text-diff', render: 'renderTextDiff',     icon: '📊', color: '#f97316', name: '文本对比',      desc: '逐行对比两段文本，高亮差异内容', category: '文本处理', file: 'text-diff.js' },
  { id: 'markdown', render: 'renderMarkdown',      icon: '✍️',  color: '#14b8a6', name: 'Markdown 预览', desc: '实时渲染 Markdown，支持代码高亮', category: '文本处理', file: 'markdown.js' },
  { id: 'case-convert', render: 'renderCaseConvert',  icon: '🔡', color: '#64748b', name: '大小写转换',    desc: '驼峰、下划线、全大写等多种格式互转', category: '文本处理', file: 'case-convert.js' },
  { id: 'unicode-convert', render: 'renderUnicode',icon: '🌐', color: '#7c3aed', name: 'Unicode 转换', desc: 'Unicode 码点与字符互转，支持转义序列', category: '文本处理', file: 'unicode-convert.js' },
  { id: 'html-entity', render: 'renderHTMLEntity',   icon: '🏷️', color: '#dc2626', name: 'HTML 实体转换', desc: 'HTML 实体编解码，< > & " \'等特殊字符处理', category: '文本处理', file: 'html-entity.js' },
  { id: 'lorem', render: 'renderLorem',         icon: '📄', color: '#059669', name: '占位文本生成',  desc: '生成中英文 Lorem ipsum 占位文本，自定义段落数', category: '文本处理', file: 'lorem.js' },
  // 开发工具
  { id: 'timestamp', render: 'renderTimestamp',     icon: '⏱️',  color: '#f59e0b', name: '时间戳转换',   desc: '实时时间戳、秒/毫秒互转、日期解析、相对时间', category: '开发工具', file: 'timestamp.js' },
  { id: 'url-parser', render: 'renderUrlParser',    icon: '🔗', color: '#14b8a6', name: 'URL 解析器',    desc: '拆解 URL 字段、参数表格展示、URL 编解码', category: '开发工具', file: 'url-parser.js' },
  { id: 'hash', render: 'renderHash',          icon: '🔐', color: '#ec4899', name: '哈希生成器',    desc: 'SHA-1/256/384/512，支持文本和文件哈希校验', category: '开发工具', file: 'hash.js' },
  { id: 'jwt', render: 'renderJWT',           icon: '🎫', color: '#8b5cf6', name: 'JWT 解析器',    desc: '解码 Header/Payload，过期检测，结构展示', category: '开发工具', file: 'jwt.js' },
  { id: 'jwt-gen', render: 'renderJWTGen',       icon: '🔑', color: '#7c3aed', name: 'JWT 生成器',    desc: '自定义 Payload 和 Secret 生成 JWT Token', category: '开发工具', file: 'jwt-gen.js' },
  { id: 'number-base', render: 'renderNumberBase',   icon: '🔢', color: '#f97316', name: '进制转换',      desc: '二/八/十/十六进制互转，ASCII/Unicode 码点', category: '开发工具', file: 'number-base.js' },
  { id: 'number-format', render: 'renderNumberFormat', icon: '💯', color: '#0891b2', name: '数字格式化',    desc: '千分位、货币、字节单位（B/KB/MB/GB）格式化', category: '开发工具', file: 'number-format.js' },
  { id: 'yaml-json', render: 'renderYAMLJSON',     icon: '📑', color: '#65a30d', name: 'YAML/JSON 互转',desc: 'YAML 与 JSON 双向转换，配置文件处理', category: '开发工具', file: 'yaml-json.js' },
  { id: 'sql-format', render: 'renderSQLFormat',    icon: '🗄️', color: '#b45309', name: 'SQL 格式化',    desc: 'SQL 美化/压缩，支持 SELECT/INSERT/UPDATE/DELETE', category: '开发工具', file: 'sql-format.js' },
  { id: 'curl-gen', render: 'renderCurlGen',      icon: '🌀', color: '#0369a1', name: 'cURL 生成器',   desc: '可视化配置生成 curl / fetch / axios 代码片段', category: '开发工具', file: 'curl-gen.js' },
  { id: 'http-status', render: 'renderHttpStatus',   icon: '📡', color: '#be185d', name: 'HTTP 状态码',   desc: '查询 HTTP 状态码含义，支持搜索和分类浏览', category: '开发工具', file: 'http-status.js' },
  { id: 'cron', render: 'renderCron',          icon: '⏰', color: '#d97706', name: 'Cron 表达式',   desc: '可视化解析 Cron 表达式，展示下次执行时间', category: '开发工具', file: 'cron.js' },
  { id: 'password-gen', render: 'renderPasswordGen',  icon: '🛡️', color: '#16a34a', name: '密码生成器',    desc: '自定义规则生成强密码，密码强度评估', category: '开发工具', file: 'password-gen.js' },
  // CSS 工具
  { id: 'gradient', render: 'renderGradient',      icon: '🎨', color: '#ec4899', name: '渐变生成器',    desc: '可视化创建 CSS 渐变，实时预览代码输出', category: 'CSS 工具', file: 'gradient.js' },
  { id: 'color', render: 'renderColor',         icon: '🖌️', color: '#f43f5e', name: '颜色选择器',    desc: '拾色器 + 色板，HEX/RGB/HSL 实时转换', category: 'CSS 工具', file: 'color.js' },
  { id: 'color-convert', render: 'renderColorConvert', icon: '🎭', color: '#a855f7', name: '颜色转换',      desc: 'HEX / RGB / HSL / HSV 多格式互转', category: 'CSS 工具', file: 'color-convert.js' },
  { id: 'shadow', render: 'renderShadow',        icon: '🌑', color: '#475569', name: '阴影生成器',    desc: '可视化调整 box-shadow，多层阴影叠加', category: 'CSS 工具', file: 'shadow.js' },
  { id: 'flexbox', render: 'renderFlexbox',       icon: '📐', color: '#0284c7', name: 'Flexbox 生成',  desc: '可视化配置 Flexbox 布局，自动生成 CSS', category: 'CSS 工具', file: 'flexbox.js' },
  // 图片工具
  { id: 'img-base64', render: 'renderImgBase64',    icon: '🖼️', color: '#0891b2', name: '图片 Base64',  desc: '图片与 Base64 字符串互转，支持预览', category: '图片工具', file: 'img-base64.js' },
  { id: 'img-compress', render: 'renderImgCompress',  icon: '🗜️', color: '#16a34a', name: '图片压缩',      desc: '本地压缩图片，调整质量和尺寸，支持批量', category: '图片工具', file: 'img-compress.js' },
  { id: 'qrcode', render: 'renderQrCode',        icon: '📱', color: '#0f172a', name: '二维码生成',    desc: '文本/URL 转二维码，自定义颜色和尺寸', category: '图片工具', file: 'qrcode.js' },
  { id: 'qrcode-decode', render: 'renderQRCodeDecode', icon: '🔭', color: '#1d4ed8', name: '二维码解析',    desc: '上传图片识别二维码内容，支持拖拽', category: '图片工具', file: 'qrcode-decode.js' },
  // 编码与加密
  { id: 'url-encode', render: 'renderUrlEncode',     icon: '🔗', color: '#0ea5e9', name: 'URL 编解码',     desc: 'URL 编码/解码，查询参数解析与构建', category: '编码加密', file: 'url-encode.js' },
  { id: 'aes', render: 'renderAES',            icon: '🔒', color: '#7c3aed', name: 'AES 加解密',     desc: 'AES-GCM 对称加解密，SubtleCrypto 实现', category: '编码加密', file: 'aes.js' },
  { id: 'morse', render: 'renderMorse',          icon: '📡', color: '#b45309', name: '摩斯电码',       desc: '文本与摩斯电码互转，支持播放音频', category: '编码加密', file: 'morse.js' },
  { id: 'xml-format', render: 'renderXmlFormat',     icon: '📰', color: '#0369a1', name: 'XML 格式化',     desc: 'XML 美化/压缩，一键转 JSON', category: '编码加密', file: 'xml-format.js' },
  // 计算工具
  { id: 'calculator', render: 'renderCalculator',     icon: '🧮', color: '#6366f1', name: '科学计算器',     desc: '键盘/鼠标双控，支持基础及百分比运算', category: '计算工具', file: 'calculator.js' },
  { id: 'unit-convert', render: 'renderUnitConvert',   icon: '📏', color: '#10b981', name: '单位换算',       desc: '长度/重量/温度/面积/存储/速度多维换算', category: '计算工具', file: 'unit-convert.js' },
  { id: 'loan-calc', render: 'renderLoanCalc',      icon: '🏦', color: '#f59e0b', name: '贷款计算器',     desc: '等额本息/本金还款，含完整还款计划表', category: '计算工具', file: 'loan-calc.js' },
  { id: 'byte-convert', render: 'renderByteConvert',   icon: '💾', color: '#64748b', name: '存储换算',       desc: '字节/KB/MB/GB/TB 互转，含网速换算', category: '计算工具', file: 'byte-convert.js' },
  { id: 'number-chinese', render: 'renderNumberChinese', icon: '🀄', color: '#dc2626', name: '数字大写',       desc: '数字转财务中文大写，适合票据填写', category: '计算工具', file: 'number-chinese.js' },
  { id: 'ip-calc', render: 'renderIpCalc',        icon: '🌐', color: '#0891b2', name: 'IP 子网计算',    desc: 'IP/CIDR 子网掩码计算，主机范围与广播地址', category: '计算工具', file: 'ip-calc.js' },
  // 时间工具
  { id: 'date-diff', render: 'renderDateDiff',      icon: '📅', color: '#14b8a6', name: '日期差计算',     desc: '两日期间隔天数，含工作日/节假日计算', category: '时间工具', file: 'date-diff.js' },
  { id: 'timezone', render: 'renderTimezone',       icon: '🌍', color: '#6366f1', name: '时区转换',       desc: '13 个主要时区实时对比，快速换算', category: '时间工具', file: 'timezone.js' },
  { id: 'countdown', render: 'renderCountdown',      icon: '⏳', color: '#ec4899', name: '倒计时',         desc: '自定义目标日期倒计时，SVG 圆弧进度', category: '时间工具', file: 'countdown.js' },
  // 效率工具
  { id: 'pomodoro', render: 'renderPomodoro',       icon: '🍅', color: '#ef4444', name: '番茄钟',         desc: '25分钟专注 + 5分钟休息，SVG 进度环', category: '效率工具', file: 'pomodoro.js' },
  { id: 'meeting-cost', render: 'renderMeetingCost',   icon: '💰', color: '#f97316', name: '会议费用',       desc: '实时计算会议成本，输入人数和薪资即刻开始', category: '效率工具', file: 'meeting-cost.js' },
  { id: 'spinner', render: 'renderSpinner',        icon: '🎡', color: '#8b5cf6', name: '随机抽签',       desc: '自定义名单随机抽取，转盘动效', category: '效率工具', file: 'spinner.js' },
  // 网络工具
  { id: 'user-agent', render: 'renderUserAgent',     icon: '🖥️', color: '#475569', name: 'UA 解析',        desc: '解析浏览器 User-Agent，识别系统/浏览器/设备', category: '网络工具', file: 'user-agent.js' },
  { id: 'http-tester', render: 'renderHttpTester',    icon: '🛰️', color: '#be185d', name: 'HTTP 请求测试',  desc: '可视化发送 GET/POST 请求，简版 Postman', category: '网络工具', file: 'http-tester.js' },
  // 趣味工具
  { id: 'ascii-art', render: 'renderAsciiArt',      icon: '🎨', color: '#0f172a', name: 'ASCII 艺术字',   desc: '文字转 ASCII 艺术字，4 种字体风格', category: '趣味工具', file: 'ascii-art.js' },
  // 新增工具
  { id: 'ip-info', render: 'renderIpInfo',        icon: '📡', color: '#0891b2', name: 'IP 信息',        desc: '查询本机 IP 及地理位置信息', category: '网络工具', file: 'ip-info.js' },
  { id: 'text-escape', render: 'renderTextEscape',    icon: '↩️', color: '#64748b', name: '字符串转义',     desc: 'JSON/正则/HTML/URL 字符串转义与反转义', category: '文本处理', file: 'text-escape.js' },
  { id: 'svg-preview', render: 'renderSvgPreview',    icon: '🖼️', color: '#7c3aed', name: 'SVG 预览',       desc: '粘贴 SVG 代码实时预览，支持缩放', category: 'CSS 工具', file: 'svg-preview.js' },
  { id: 'aspect-ratio', render: 'renderAspectRatio',   icon: '📐', color: '#10b981', name: '比例计算',       desc: '屏幕/图片尺寸比例换算，4:3/16:9 等常用比例', category: '计算工具', file: 'aspect-ratio.js' },
  { id: 'palette-gen', render: 'renderPaletteGen',    icon: '🎨', color: '#ec4899', name: '调色板生成器',   desc: '输入主色生成完整色阶、互补色、CSS 变量', category: 'CSS 工具', file: 'palette-gen.js', isNew: true },
  { id: 'img-webp', render: 'renderImgWebp',        icon: '🔄', color: '#0ea5e9', name: '图片转 WebP',    desc: '批量转换图片为 WebP 格式，支持质量调节和对比', category: '图片工具', file: 'img-webp.js', isNew: true },
  { id: 'git-commit', render: 'renderGitCommit',      icon: '💬', color: '#f97316', name: 'Git Commit 生成', desc: 'Conventional Commits 规范，含 type/scope/breaking，一键复制', category: '开发工具', file: 'git-commit.js', isNew: true },
  { id: 'nginx-gen',  render: 'renderNginxGen',       icon: '⚙️',  color: '#22c55e', name: 'Nginx 配置生成', desc: '静态站/SPA/反向代理/HTTPS/负载均衡五种场景，一键生成 nginx.conf', category: '开发工具', file: 'nginx-gen.js', isNew: true },
  { id: 'clip-path',  render: 'renderClipPath',       icon: '✂️',  color: '#a855f7', name: 'clip-path 生成器', desc: '可视化生成 CSS clip-path，支持多边形/圆形/椭圆/内嵌，拖拽控制点', category: 'CSS 工具', file: 'clip-path.js', isNew: true },
  { id: 'speed-test', render: 'renderSpeedTest',      icon: '🚀', color: '#06b6d4', name: '网速测试',        desc: '测试网络下载/上传速度与延迟，仪表盘实时展示', category: '网络工具', file: 'speed-test.js', isNew: true },
  // 新增工具
  { id: 'diff-json',       render: 'renderDiffJson',       icon: '🔀', color: '#3b82f6', name: 'JSON 对比',        desc: '两个 JSON 结构递归对比，高亮新增/删除/变更字段',              category: '文本处理', file: 'diff-json.js',       isNew: true },
  { id: 'toml-json',       render: 'renderTomlJson',       icon: '🔄', color: '#f59e0b', name: 'TOML ↔ JSON',      desc: 'TOML 与 JSON 双向互转，支持 [section] 和嵌套结构',           category: '文本处理', file: 'toml-json.js',       isNew: true },
  { id: 'env-parse',       render: 'renderEnvParse',       icon: '⚙️', color: '#10b981', name: 'ENV 解析器',       desc: '解析 .env 文件，提取 KEY/VALUE，一键复制',                   category: '开发工具', file: 'env-parse.js',       isNew: true },
  { id: 'docker-gen',      render: 'renderDockerGen',      icon: '🐳', color: '#0ea5e9', name: 'Dockerfile 生成',  desc: '选择语言生成最佳实践 Dockerfile，支持 Node/Python/Go/Java',   category: '开发工具', file: 'docker-gen.js',      isNew: true },
  { id: 'css-unit',        render: 'renderCssUnit',        icon: '📐', color: '#a855f7', name: 'CSS 单位转换',     desc: 'px/rem/em/vw/vh/pt 多单位互转，基准字号和视口宽度可配置',    category: 'CSS 工具', file: 'css-unit.js',        isNew: true },
  { id: 'color-contrast',  render: 'renderColorContrast',  icon: '👁️', color: '#f43f5e', name: '对比度检查',       desc: 'WCAG AA/AAA 对比度评级，前景/背景色实时计算',                category: 'CSS 工具', file: 'color-contrast.js',  isNew: true },
  { id: 'world-clock',     render: 'renderWorldClock',     icon: '🌍', color: '#06b6d4', name: '世界时钟',         desc: '8 大时区同屏实时显示，上海/纽约/伦敦/东京等',               category: '时间工具', file: 'world-clock.js',     isNew: true },
  { id: 'stopwatch',       render: 'renderStopwatch',      icon: '⏱️', color: '#f59e0b', name: '秒表计时',         desc: '开始/暂停/复位/计次，毫秒精度，计次记录列表',               category: '效率工具', file: 'stopwatch.js',       isNew: true },
  { id: 'text-template',   render: 'renderTextTemplate',   icon: '📋', color: '#10b981', name: '文本模板',         desc: '{{变量}} 占位符替换，自动生成填写表单，实时预览输出',        category: '效率工具', file: 'text-template.js',   isNew: true },
  { id: 'matrix-rain',     render: 'renderMatrixRain',     icon: '💻', color: '#22c55e', name: '矩阵雨',           desc: 'Matrix 数字雨 canvas 动画，经典绿色字符瀑布',               category: '趣味工具', file: 'matrix-rain.js',     isNew: true },
  // 文本处理 - 新增
  { id: 'text-repeat',     render: 'renderTextRepeat',     icon: '🔁', color: '#f59e0b', name: '文本重复器',       desc: '将文本重复 N 次，支持自定义分隔符（换行/逗号等）',           category: '文本处理', file: 'text-repeat.js',     isNew: true },
  { id: 'slug-gen',        render: 'renderSlugGen',        icon: '🔗', color: '#6366f1', name: 'Slug 生成器',      desc: '标题转 URL 友好 slug，支持横线/下划线/点分隔符',            category: '文本处理', file: 'slug-gen.js',        isNew: true },
  { id: 'line-sort',       render: 'renderLineSort',       icon: '↕️', color: '#0ea5e9', name: '行排序去重',       desc: '多行文本升序/降序/随机打乱/去重/去空行/翻转',               category: '文本处理', file: 'line-sort.js',       isNew: true },
  // 开发工具 - 新增
  { id: 'semver',          render: 'renderSemver',         icon: '🏷️', color: '#8b5cf6', name: 'Semver 比较',      desc: '语义化版本解析、大小比较，支持预发布版本',                   category: '开发工具', file: 'semver.js',          isNew: true },
  { id: 'dns-lookup',      render: 'renderDnsLookup',      icon: '🌐', color: '#06b6d4', name: 'DNS 查询',         desc: '通过 DNS over HTTPS 查询 A/AAAA/MX/TXT/CNAME/NS 记录',     category: '开发工具', file: 'dns-lookup.js',      isNew: true },
  { id: 'terminal-color',  render: 'renderTerminalColor',  icon: '🖥️', color: '#22c55e', name: '终端颜色码',       desc: 'ANSI 颜色代码生成预览，前景/背景/样式任意组合',             category: '开发工具', file: 'terminal-color.js',  isNew: true },
  // 计算工具 - 新增
  { id: 'bmi-calc',        render: 'renderBmiCalc',        icon: '⚖️', color: '#10b981', name: 'BMI 计算器',      desc: '体质指数计算，偏轻/正常/超重/肥胖分级（中国标准）',         category: '计算工具', file: 'bmi-calc.js',        isNew: true },
  { id: 'percent-calc',    render: 'renderPercentCalc',    icon: '💹', color: '#f97316', name: '百分比计算',       desc: '涨跌幅、折扣、占比、百分之几四种快速计算',                  category: '计算工具', file: 'percent-calc.js',    isNew: true },
  { id: 'age-calc',        render: 'renderAgeCalc',        icon: '🎂', color: '#ec4899', name: '年龄计算器',       desc: '精确年龄（岁月日）、距生日天数、生肖星座查询',              category: '计算工具', file: 'age-calc.js',        isNew: true },
  { id: 'tax-calc',        render: 'renderTaxCalc',        icon: '💰', color: '#f59e0b', name: '个税计算器',       desc: '2024 个人所得税速算，含五险一金和专项附加扣除',            category: '计算工具', file: 'tax-calc.js',        isNew: true },
  // 时间工具 - 新增
  { id: 'time-format',     render: 'renderTimeFormat',     icon: '🕐', color: '#6366f1', name: '时间格式转换',     desc: '时间戳/日期字符串互转，输出 ISO/UTC/本地等多种格式',        category: '时间工具', file: 'time-format.js',     isNew: true },
  { id: 'lunar-calendar',  render: 'renderLunarCalendar',  icon: '🌙', color: '#8b5cf6', name: '农历查询',         desc: '查询任意日期的干支年、生肖、节气、年内天数',               category: '时间工具', file: 'lunar-calendar.js',  isNew: true },
  // 效率工具 - 新增
  { id: 'todo',            render: 'renderTodo',           icon: '✅', color: '#10b981', name: 'Todo 清单',        desc: '本地存储 Todo 清单，支持完成/删除/清空已完成',             category: '效率工具', file: 'todo.js',            isNew: true },
  { id: 'note',            render: 'renderNote',           icon: '📝', color: '#f59e0b', name: '临时便签',         desc: '自动保存文本便签，关闭不丢失，字数统计',                    category: '效率工具', file: 'note.js',            isNew: true },
  { id: 'typing-speed',    render: 'renderTypingSpeed',    icon: '⌨️', color: '#3b82f6', name: '打字速度测试',     desc: 'WPM 实时计算，正确/错误高亮，英文句子练习',                category: '效率工具', file: 'typing-speed.js',    isNew: true },
  // 图片工具 - 新增
  { id: 'img-exif',        render: 'renderImgExif',        icon: '📷', color: '#64748b', name: 'EXIF 查看器',      desc: '读取图片拍摄参数、相机型号、ISO、曝光时间等 EXIF 信息',    category: '图片工具', file: 'img-exif.js',        isNew: true },
  // 趣味工具 - 新增
  { id: 'emoji-picker',    render: 'renderEmojiPicker',    icon: '😀', color: '#f59e0b', name: 'Emoji 选择器',     desc: '分类浏览 Emoji，点击一键复制，支持搜索',                   category: '趣味工具', file: 'emoji-picker.js',    isNew: true },
  { id: 'noise-gen',       render: 'renderNoiseGen',       icon: '🎵', color: '#8b5cf6', name: '白噪音',           desc: '白噪音/粉红噪音/棕色噪音/雨声，可调音量，Web Audio API',  category: '趣味工具', file: 'noise-gen.js',       isNew: true },
  { id: 'typing-game',     render: 'renderTypingGame',     icon: '🎮', color: '#22c55e', name: '单词打字练习',     desc: '随机英文单词打字，60 秒计时，实时 WPM 统计',              category: '趣味工具', file: 'typing-game.js',     isNew: true },
];

// ── 分类 & 计数（顶层常量，避免重复遍历）──
const CATEGORIES = [...new Set(TOOLS.map(t => t.category))];
const CAT_COUNTS = Object.fromEntries(CATEGORIES.map(c => [c, TOOLS.filter(t => t.category === c).length]));

// ── 分类图标 ──
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

// ── 持久化 ──
const LS = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── 状态 ──
let currentPage = 'home';
let currentCatFilter = 'all';
let favorites = LS.get('dtb_favorites', []);
let recent = LS.get('dtb_recent', []);
let collapsed = LS.get('dtb_sidebar_collapsed', false);
let theme = LS.get('dtb_theme', 'dark');
let loadedTools = {};
const _loadOrder = []; // LRU 追踪加载顺序
const _MAX_LOADED = 30;
let searchQuery = '';
let searchHistory = LS.get('dtb_search_history', []); // 最近5条搜索词
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
  // 批量写入：延迟 2s，避免频繁 IO
  clearTimeout(addUsage._timer);
  addUsage._timer = setTimeout(() => { LS.set('dtb_usage', usageCounts); }, 2000);
}

// ── 首页渲染 ──
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

  // 主页 Hero
  const hour = new Date().getHours();
  const greeting = hour < 6 ? t('greet_late') : hour < 12 ? t('greet_morning') : hour < 18 ? t('greet_afternoon') : t('greet_evening');
  // 热门工具 top5（使用次数）
  const topTools = Object.entries(usageCounts)
    .sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([id]) => tools.find(t => t.id===id)).filter(Boolean);
  const topHtml = topTools.length ? `
    <div class="home-hero-quick">
      <span style="font-size:11px;color:var(--text-muted)">${t('hero_hot')}</span>
      ${topTools.map(tool => `<button class="hero-quick-btn" onclick="navigateTo('${tool.id}')" style="--qc:${tool.color}">${tool.icon} ${tool.name}</button>`).join('')}
    </div>` : '';
  html += `<div class="home-hero">
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div>
        <div class="home-hero-title">🔧 K Toolkit</div>
        <div class="home-hero-sub">${greeting}，${t('hero_sub', tools.length)}</div>
      </div>
      <div class="home-hero-stats" style="margin-left:auto">
        <div class="home-hero-stat"><strong>${tools.length}</strong>${t('stat_tools')}</div>
        <div class="home-hero-stat"><strong>${favorites.length || 0}</strong>${t('stat_favs')}</div>
        <div class="home-hero-stat"><strong>${recent.length || 0}</strong>${t('stat_recent')}</div>
      </div>
    </div>
    ${topHtml}
  </div>`;

  // 分类 tab
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

  // 收藏区
  if (currentCatFilter === 'all' && favorites.length) {
    const favTools = favorites.slice(0,6).map(id => localizedTools.find(t => t.id === id)).filter(Boolean);
    html += `<div class="home-section"><div class="section-title">⭐ ${t('fav_title')} <span class="section-count">${favorites.length}</span></div><div class="tools-grid">${favTools.map(renderToolCard).join('')}</div></div>`;
  }

  // 最近使用
  if (currentCatFilter === 'all' && recent.length) {
    const recentTools = recent.slice(0,6).map(id => localizedTools.find(t => t.id === id)).filter(Boolean);
    html += `<div class="home-section"><div class="section-title">🕐 ${t('recent_title')} <span class="section-count">${recent.length}</span></div><div class="tools-grid">${recentTools.map(renderToolCard).join('')}</div></div>`;
  }

  // 分类工具区（IntersectionObserver 懒加载）
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

// ── 顶部进度条 ──
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

// ── 懒加载 ──
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

// ── 侧边栏导航动态生成 ──
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
  // 重建后重新绑定 tooltip（折叠态悬停显示工具名）
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

// ── 初始化 ──
function init() {
  buildSidebarNav();
  applyTheme();
  applySidebarCollapse();
  bindKeyboard();
  initScrollTop();
  // 给侧边栏 nav-item 设置 tooltip（折叠态悬停显示）
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

// ── 返回顶部 ──
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

// ── 路由 ──
let _homeScrollTop = 0;

async function navigateTo(page, pushHash = true) {
  if (pushHash && location.hash !== '#' + page) {
    historyStack.push(currentPage);
    location.hash = page;
    return;
  }
  // 清理上一个工具的副作用（如 setInterval）
  if (window._activeCleanup) { window._activeCleanup(); window._activeCleanup = null; }
  const prevPage = currentPage;
  const prevIsSpecial = ['home','favorites','recent'].includes(prevPage);
  const content = document.getElementById('content');
  // 离开首页前记录滚动位置
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
  // 回到首页恢复滚动位置，进入工具页滚到顶
  if (isSpecial) {
    content.scrollTop = _homeScrollTop;
  } else {
    content.scrollTop = 0;
  }
  // 工具页隐藏 FAB，首页显示
  const fab = document.getElementById('scrollTopBtn');
  if (fab) fab.style.display = isSpecial ? '' : 'none';
  // 页面切换淡入
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

// ── 搜索 ──
let searchDropdownIdx = -1;
let _searchTimer = null;

function handleSearch(val) {
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.style.display = val.trim() ? '' : 'none';
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
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return escHtml(text);
  return escHtml(text.slice(0, idx)) +
    '<span class="search-highlight">' + escHtml(text.slice(idx, idx + q.length)) + '</span>' +
    escHtml(text.slice(idx + q.length));
}

function showSearchDropdown(q) {
  let drop = document.getElementById('searchDropdown');
  if (!drop) {
    drop = document.createElement('div');
    drop.id = 'searchDropdown';
    drop.className = 'search-dropdown';
    document.querySelector('.search-wrap').appendChild(drop);
    // close on outside click
    document.addEventListener('mousedown', function _sdClose(e) {
      const wrap = document.querySelector('.search-wrap');
      if (wrap && !wrap.contains(e.target)) {
        hideSearchDropdown();
      }
    });
  }
  const matched = TOOLS.filter(t =>
    t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
  ).slice(0, 12);
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
  hideSearchDropdown();
}

function focusSearch(e) {
  if (e) e.preventDefault();
  const inp = document.getElementById('searchInput');
  if (inp) {
    inp.focus(); inp.select();
    // 无内容时展示搜索历史
    if (!inp.value.trim() && searchHistory.length) _showSearchHistory();
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
  const items = searchHistory.map(h =>
    `<div class="sdrop-item" onclick="_useHistory('${escHtml(h)}')"><span style="color:var(--text-muted);margin-right:8px">🕐</span>${escHtml(h)}</div>`
  ).join('');
  drop.innerHTML = `<div class="sdrop-header">${t('search_history')}</div>${items}`;
  drop.style.display = '';
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
  const ql = q.toLowerCase();
  const score = tool => {
    if (tool.name.toLowerCase() === ql) return 100;
    if (tool.name.toLowerCase().startsWith(ql)) return 80;
    if (tool.name.toLowerCase().includes(ql)) return 60;
    if (tool.category.toLowerCase().includes(ql)) return 40;
    if (tool.desc.toLowerCase().includes(ql)) return 20;
    return 0;
  };
  // 使用频率加权：高频工具在同分段内靠前
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

// ── 主题 ──
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

// ── 侧边栏折叠 ──
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

// ── 键盘快捷键 ──
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
      const inp = document.getElementById('searchInput');
      if (document.activeElement === inp) { clearSearch(); inp.blur(); }
      else if (['home','favorites','recent'].indexOf(currentPage) === -1) navigateTo('home');
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
  // 点击空白关闭搜索下拉
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) hideSearchDropdown();
  });
}

// ── 工具页面（完整版，替代旧的 renderToolPage）──
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

  // 相关工具推荐
  const related = getLocalizedTools(TOOLS).filter(tool2 => tool2.id !== tool.id && TOOLS.find(x => x.id === tool2.id && x.category === tool.category)).slice(0, 4);
  if (related.length) {
    const relDiv = document.createElement('div');
    relDiv.className = 'related-tools';
    relDiv.innerHTML = `<div class="section-title" style="margin-top:32px">${t('related_tools')}</div><div class="tools-grid">${related.map(renderToolCard).join('')}</div>`;
    document.querySelector('.tool-page').appendChild(relDiv);
  }
}

// ── Toast 通知 ──
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

// ── 工具函数 ──
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.classList.add('copied');
    showToast('已复制到剪贴板');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  }).catch(() => showToast('复制失败', 'error'));
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

// ── Command Palette (lazy-loaded via dashboard-cmd.js) ──
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

document.addEventListener('DOMContentLoaded', init);

// ── 离线状态提示 ──
window.addEventListener('online',  () => showToast(t('toast_online'), 'success'));
window.addEventListener('offline', () => showToast(t('toast_offline'), 'warn'));

// ── SW 更新提示 ──
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data === 'sw-updated') showToast(t('toast_sw_update'), 'info', 8000, () => location.reload());
  });
}
