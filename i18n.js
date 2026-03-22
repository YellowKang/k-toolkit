// ── i18n: 中/英双语支持 ──
// 仅覆盖 Dashboard 框架层文字；工具内部 UI 暂不多语言化

const LANG_ZH = {
  greet_late:    '夜深了',
  greet_morning: '早上好',
  greet_afternoon:'下午好',
  greet_evening: '晚上好',
  hero_sub:      (total) => `${total} 个开发工具 · 按 / 或 ⌘K 搜索 · ? 快捷键`,
  stat_tools:    '工具',
  stat_favs:     '收藏',
  stat_recent:   '最近',
  hero_hot:      '热门：',
  cat_all:       '全部',
  fav_title:     '我的收藏',
  fav_empty_title:'暂无收藏',
  fav_empty_sub:  '点击工具卡片右上角 ★ 收藏常用工具',
  recent_title:  '最近使用',
  recent_empty_title:'暂无使用记录',
  recent_empty_sub:  '打开任意工具后会在这里显示',
  fav_add:       '收藏',
  fav_remove:    '取消收藏',
  toast_fav_add: '已收藏',
  toast_fav_remove:'已取消收藏',
  toast_cleared: '已清除',
  toast_online:  '网络已恢复',
  toast_offline: '已离线，本地工具仍可使用',
  toast_sw_update:'已更新，点击刷新',
  search_placeholder:'搜索工具... (/ 或 ⌘K)',
  search_history:'最近搜索',
  search_results:(n) => `${n} 个结果`,
  search_view_all:(n) => `查看全部 ${n} 个结果 →`,
  search_no_result:(q) => `未找到「${q}」相关工具`,
  search_results_header:(q, n) => `搜索「${q}」共 ${n} 个结果`,
  loading:       '加载中...',
  load_fail:     '工具加载失败',
  retry:         '重试',
  back_home:     '返回首页',
  back:          '← 返回',
  share:         '分享工具',
  scroll_top:    '返回顶部',
  related_tools: '你可能还需要',
  nav_home:      '工具首页',
  nav_favs:      '我的收藏',
  nav_recent:    '最近使用',
  cmd_placeholder:'搜索工具或操作...',
  cmd_toggle_theme:'切换主题',
  cmd_theme_sub:  '深色 / 浅色',
  cmd_go_home:   '回到首页',
  cmd_home_sub:  '工具列表',
  cmd_favs:      '我的收藏',
  cmd_favs_sub:  (n) => `${n} 个工具`,
  cmd_recent:    '最近使用',
  cmd_recent_sub:(n) => `${n} 个工具`,
  cmd_clear_recent:'清除使用记录',
  cmd_clear_recent_sub:'清空最近使用',
  cmd_clear_usage:'清除统计数据',
  cmd_clear_usage_sub:'清空使用次数',
  cmd_section_tools:'工具',
  cmd_section_recent:'最近使用',
  cmd_section_actions:'操作',
  cmd_footer_nav: '导航',
  cmd_footer_confirm:'确认',
  cmd_footer_close:'关闭',
  lang_btn:      'EN',
};

const LANG_EN = {
  greet_late:    'Good night',
  greet_morning: 'Good morning',
  greet_afternoon:'Good afternoon',
  greet_evening: 'Good evening',
  hero_sub:      (total) => `${total} dev tools · Press / or ⌘K to search · ? for shortcuts`,
  stat_tools:    'Tools',
  stat_favs:     'Favorites',
  stat_recent:   'Recent',
  hero_hot:      'Popular:',
  cat_all:       'All',
  fav_title:     'My Favorites',
  fav_empty_title:'No favorites yet',
  fav_empty_sub:  'Click ★ on any tool card to add it to favorites',
  recent_title:  'Recently Used',
  recent_empty_title:'No recent tools',
  recent_empty_sub:  'Tools you open will appear here',
  fav_add:       'Favorite',
  fav_remove:    'Unfavorite',
  toast_fav_add: 'Added to favorites',
  toast_fav_remove:'Removed from favorites',
  toast_cleared: 'Cleared',
  toast_online:  'Back online',
  toast_offline: 'Offline — local tools still available',
  toast_sw_update:'Updated, click to refresh',
  search_placeholder:'Search tools... (/ or ⌘K)',
  search_history:'Recent searches',
  search_results:(n) => `${n} result${n===1?'':'s'}`,
  search_view_all:(n) => `View all ${n} results →`,
  search_no_result:(q) => `No results for "${q}"`,
  search_results_header:(q, n) => `Search "${q}" — ${n} result${n===1?'':'s'}`,
  loading:       'Loading...',
  load_fail:     'Failed to load tool',
  retry:         'Retry',
  back_home:     'Home',
  back:          '← Back',
  share:         'Share',
  scroll_top:    'Back to top',
  related_tools: 'You might also need',
  nav_home:      'All Tools',
  nav_favs:      'Favorites',
  nav_recent:    'Recent',
  cmd_placeholder:'Search tools or actions...',
  cmd_toggle_theme:'Toggle theme',
  cmd_theme_sub:  'Dark / Light',
  cmd_go_home:   'Go to home',
  cmd_home_sub:  'All tools',
  cmd_favs:      'My Favorites',
  cmd_favs_sub:  (n) => `${n} tool${n===1?'':'s'}`,
  cmd_recent:    'Recently Used',
  cmd_recent_sub:(n) => `${n} tool${n===1?'':'s'}`,
  cmd_clear_recent:'Clear recent history',
  cmd_clear_recent_sub:'Clear recently used list',
  cmd_clear_usage:'Clear usage stats',
  cmd_clear_usage_sub:'Reset usage counts',
  cmd_section_tools:'Tools',
  cmd_section_recent:'Recent',
  cmd_section_actions:'Actions',
  cmd_footer_nav: 'Navigate',
  cmd_footer_confirm:'Confirm',
  cmd_footer_close:'Close',
  lang_btn:      '中文',
};

// ── 分类名中->英映射 ──
const CAT_NAME_EN = {
  '文本处理': 'Text',
  '开发工具': 'Dev Tools',
  'CSS 工具': 'CSS Tools',
  '编码加密': 'Crypto',
  '计算工具': 'Calculator',
  '时间工具': 'Time',
  '图片工具': 'Image',
  '效率工具': 'Productivity',
  '网络工具': 'Network',
  '趣味工具': 'Fun',
};

// ── 工具英文数据（顺序必须与 dashboard.js TOOLS 完全一致）──
const TOOLS_EN = [
  // Text (文本处理)
  { name:'UUID Generator',    desc:'Batch generate UUID v4, one-click copy, custom count',                        category:'Text' },
  { name:'JSON Formatter',    desc:'Format, minify and validate JSON with instant syntax highlighting',            category:'Text' },
  { name:'Base64',            desc:'Encode/decode text and Base64, supports URL-safe mode',                       category:'Text' },
  { name:'Word Count',        desc:'Count characters, words, lines, paragraphs and CJK characters',              category:'Text' },
  { name:'Regex Tester',      desc:'Real-time highlight matches, capture group details, multiple flags',          category:'Text' },
  { name:'JSON/CSV Convert',  desc:'Bidirectional conversion between JSON arrays and CSV, download support',      category:'Text' },
  { name:'Text Diff',         desc:'Line-by-line comparison of two texts with highlighted differences',           category:'Text' },
  { name:'Markdown Preview',  desc:'Real-time Markdown rendering with syntax highlighting',                       category:'Text' },
  { name:'Case Convert',      desc:'Convert between camelCase, snake_case, UPPERCASE and more',                  category:'Text' },
  { name:'Unicode Convert',   desc:'Convert Unicode code points and characters, escape sequences',               category:'Text' },
  { name:'HTML Entity',       desc:'HTML entity encode/decode, reference for common special characters',          category:'Text' },
  { name:'Lorem Ipsum',       desc:'Generate Lorem Ipsum placeholder text, custom paragraphs and word count',    category:'Text' },
  // Dev Tools (开发工具)
  { name:'Timestamp',         desc:'Real-time timestamp, ms/s conversion, date parsing and relative time',       category:'Dev Tools' },
  { name:'URL Parser',        desc:'Break down URL fields, query params table, URL encode/decode',               category:'Dev Tools' },
  { name:'Hash Generator',    desc:'SHA-1/256/384/512, supports text and file hash verification',                category:'Dev Tools' },
  { name:'JWT Decoder',       desc:'Decode JWT header/payload, expiry detection, structure display',             category:'Dev Tools' },
  { name:'JWT Generator',     desc:'Generate JWT token with custom payload and secret',                          category:'Dev Tools' },
  { name:'Number Base',       desc:'Convert between binary, octal, decimal and hex, ASCII/Unicode code points',  category:'Dev Tools' },
  { name:'Number Format',     desc:'Format numbers with thousands separators, currency, byte units',             category:'Dev Tools' },
  { name:'YAML/JSON',         desc:'Bidirectional conversion between YAML and JSON',                            category:'Dev Tools' },
  { name:'SQL Formatter',     desc:'Beautify/minify SQL, supports SELECT/INSERT/UPDATE/DELETE',                  category:'Dev Tools' },
  { name:'cURL Generator',    desc:'Visually generate curl/fetch/axios code snippets',                          category:'Dev Tools' },
  { name:'HTTP Status',       desc:'Look up HTTP status code meanings, search and browse by category',           category:'Dev Tools' },
  { name:'Cron Expression',   desc:'Visually parse Cron expressions, show next execution times',                 category:'Dev Tools' },
  { name:'Password Generator',desc:'Generate strong passwords with custom rules, strength evaluation',           category:'Dev Tools' },
  // CSS Tools (CSS 工具)
  { name:'Gradient',          desc:'CSS gradient generator, linear/radial/conic, multi-stop preview',           category:'CSS Tools' },
  { name:'Color Picker',      desc:'Color picker + palette, real-time HEX/RGB/HSL conversion',                  category:'CSS Tools' },
  { name:'Color Convert',     desc:'Convert between HEX, RGB, HSL, HSV color models',                           category:'CSS Tools' },
  { name:'Box Shadow',        desc:'Visual CSS box-shadow generator, multiple layers, real-time preview',        category:'CSS Tools' },
  { name:'Flexbox',           desc:'Visual Flexbox layout debugger, all properties adjustable',                  category:'CSS Tools' },
  { name:'Clip-path',         desc:'CSS clip-path generator, polygon/ellipse/inset shape editor',               category:'CSS Tools' },
  // Crypto (编码加密)
  { name:'AES Encrypt',       desc:'AES-128/256 CBC/ECB encryption and decryption, Base64 output',              category:'Crypto' },
  { name:'URL Encode',        desc:'URL encode/decode special characters for safe transmission',                 category:'Crypto' },
  { name:'QR Code',           desc:'Generate QR codes from text or URLs, custom size and download',             category:'Crypto' },
  { name:'Morse Code',        desc:'Convert text to Morse code and decode back',                                 category:'Crypto' },
  // Calculator (计算工具)
  { name:'Calculator',        desc:'Scientific calculator with history, supports keyboard input',               category:'Calculator' },
  { name:'Unit Convert',      desc:'Convert length, weight, temperature, area, storage and speed units',        category:'Calculator' },
  { name:'Loan Calculator',   desc:'Monthly payment, total interest and amortization schedule',                 category:'Calculator' },
  { name:'Byte Convert',      desc:'Convert B/KB/MB/GB/TB/PB storage units',                                   category:'Calculator' },
  { name:'Number Chinese',    desc:'Convert numbers to Chinese uppercase for financial documents',               category:'Calculator' },
  { name:'IP Subnet Calc',    desc:'IPv4 subnet calculator, CIDR, network and broadcast address',               category:'Calculator' },
  // Time (时间工具)
  { name:'Date Diff',         desc:'Days between two dates, with weekday/holiday calculation',                  category:'Time' },
  { name:'Timezone Convert',  desc:'13 major timezones real-time comparison',                                   category:'Time' },
  { name:'Countdown',         desc:'Custom target date countdown with SVG arc progress',                        category:'Time' },
  // Productivity (效率工具)
  { name:'Pomodoro',          desc:'25-min focus + 5-min break timer with SVG progress ring',                   category:'Productivity' },
  { name:'Meeting Cost',      desc:'Real-time meeting cost calculator, input headcount and salary',             category:'Productivity' },
  { name:'Random Picker',     desc:'Random draw from custom list with spinning wheel animation',                category:'Productivity' },
  // Network (网络工具)
  { name:'User Agent',        desc:'Parse browser User-Agent, detect OS/browser/device',                       category:'Network' },
  { name:'HTTP Tester',       desc:'Send GET/POST requests visually in browser, simple Postman',               category:'Network' },
  // Fun (趣味工具)
  { name:'ASCII Art',         desc:'Convert text to ASCII art with 4 font styles',                             category:'Fun' },
  // New tools
  { name:'IP Info',           desc:'Query your public IP and geolocation info',                               category:'Network' },
  { name:'Text Escape',       desc:'Escape/unescape JSON/regex/HTML/URL special characters',                   category:'Text' },
  { name:'SVG Preview',       desc:'Paste SVG code for live preview with zoom support',                        category:'CSS Tools' },
  { name:'Aspect Ratio',      desc:'Calculate dimensions from aspect ratio, common presets',                   category:'Calculator' },
  { name:'Palette Generator', desc:'Generate full color scale from base color, export CSS variables',          category:'CSS Tools' },
  { name:'Image to WebP',     desc:'Batch convert images to WebP with quality control',                        category:'Image' },
  { name:'Image Base64',      desc:'Convert images to Base64 data URI and back',                              category:'Image' },
  { name:'Image Compress',    desc:'Client-side image compression with quality adjustment',                    category:'Image' },
  { name:'DNS Lookup',        desc:'DNS over HTTPS query for A/AAAA/MX/TXT/CNAME/NS records',                category:'Network' },
  { name:'Semver',            desc:'Parse semantic versions, compare ranges, check compatibility',             category:'Dev Tools' },
  { name:'JSON Diff',         desc:'Diff two JSON or YAML objects with highlighted differences',              category:'Dev Tools' },
  { name:'Env Parser',        desc:'Parse .env files, format checking and key extraction',                    category:'Dev Tools' },
  { name:'Dockerfile Gen',    desc:'Generate best-practice Dockerfile for Node/Python/Go/Java',              category:'Dev Tools' },
  { name:'CSS Unit Convert',  desc:'px/rem/em/vw/vh/pt conversions with configurable base font size',        category:'CSS Tools' },
  { name:'Color Contrast',    desc:'WCAG AA/AAA contrast ratio checker for foreground/background colors',    category:'CSS Tools' },
  { name:'World Clock',       desc:'8 major timezones displayed simultaneously in real time',                 category:'Time' },
  { name:'Stopwatch',         desc:'Start/pause/reset/lap with millisecond precision and lap history',        category:'Productivity' },
  { name:'Text Template',     desc:'{{variable}} placeholder replacement with auto-generated form',          category:'Productivity' },
  { name:'Matrix Rain',       desc:'Matrix digital rain canvas animation, classic green characters',          category:'Fun' },
  { name:'Matrix Rain',       desc:'Matrix digital rain canvas animation, classic green characters',          category:'Fun' },
  { name:'Text Repeater',     desc:'Repeat text N times with custom separator (newline/comma/etc)',            category:'Text' },
  { name:'Slug Generator',    desc:'Convert text to URL-friendly slug with pinyin support',                   category:'Text' },
  { name:'Line Sort',         desc:'Sort lines alphabetically, reverse, deduplicate, shuffle or remove blanks',category:'Text' },
  { name:'Semver',            desc:'Parse semantic versions, compare ranges, check compatibility',             category:'Dev Tools' },
  { name:'Terminal Color',    desc:'ANSI color code generator with foreground/background/style preview',       category:'Dev Tools' },
  { name:'XML Formatter',     desc:'Format and validate XML with collapsible nodes',                         category:'Dev Tools' },
  { name:'Git Commit',        desc:'Generate conventional commit messages following Angular convention',       category:'Dev Tools' },
  { name:'Nginx Config',      desc:'Generate Nginx config for static site/reverse proxy/HTTPS redirect',     category:'Dev Tools' },
  { name:'Spinner',           desc:'CSS loading animation generator, multiple styles, copy code',            category:'CSS Tools' },
  { name:'QR Decode',         desc:'Decode QR codes from image files',                                       category:'Crypto' },
  { name:'IP Speed Test',     desc:'Test network download speed in browser',                                 category:'Network' },
  { name:'Percent Calc',      desc:'Calculate percentage change, discount, ratio and percentages',           category:'Calculator' },
  { name:'Age Calculator',    desc:'Exact age (years/months/days), days to birthday, zodiac sign',           category:'Calculator' },
  { name:'Tax Calculator',    desc:'2024 personal income tax calculator with deductions',                    category:'Calculator' },
  { name:'Time Format',       desc:'Convert between timestamps and date strings in ISO/UTC/local formats',   category:'Time' },
  { name:'Lunar Calendar',    desc:'Query Chinese lunar date, zodiac, solar terms for any date',             category:'Time' },
  { name:'Todo',              desc:'Local storage todo list with complete/delete/clear support',              category:'Productivity' },
  { name:'Quick Note',        desc:'Auto-saved text note with word count, persists after close',             category:'Productivity' },
  { name:'Typing Speed',      desc:'WPM typing speed test with real-time error highlighting',               category:'Productivity' },
  { name:'EXIF Viewer',       desc:'Read image EXIF data: camera model, ISO, exposure time and more',       category:'Image' },
  { name:'Emoji Picker',      desc:'Browse Emoji by category, one-click copy, searchable',                  category:'Fun' },
  { name:'White Noise',       desc:'White/pink/brown noise and rain sounds, adjustable volume',             category:'Fun' },
  { name:'Typing Game',       desc:'Random English word typing practice, 60-second timer, WPM stats',       category:'Fun' },
];

// ── 核心 i18n 函数 ──
let _currentLang = localStorage.getItem('dtb_lang') || 'zh';

function t(key, ...args) {
  const pack = _currentLang === 'en' ? LANG_EN : LANG_ZH;
  const val = pack[key];
  if (typeof val === 'function') return val(...args);
  return val ?? key;
}

function getCurrentLang() { return _currentLang; }

function setLang(lang) {
  _currentLang = lang;
  localStorage.setItem('dtb_lang', lang);
  // 更新语言按钮文字
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = t('lang_btn');
  // 更新搜索框 placeholder
  const inp = document.getElementById('searchInput');
  if (inp) inp.placeholder = t('search_placeholder');
  // 重渲染当前页
  if (typeof renderHomePage === 'function') renderHomePage(typeof currentPage !== 'undefined' ? currentPage : 'home');
}

// ── 获取当前语言下的工具数据（覆盖 name/desc/category）──
function getLocalizedTools(tools) {
  if (_currentLang === 'zh') return tools;
  return tools.map((t, i) => {
    const en = TOOLS_EN[i];
    if (!en) return t;
    return Object.assign({}, t, {
      name: en.name,
      desc: en.desc,
      category: en.category,
    });
  });
}

// ── 获取当前语言下的分类图标 map（EN 用英文 key）──
function getLocalizedCatIcons(catIcons) {
  if (_currentLang === 'zh') return catIcons;
  const result = {};
  for (const [zh, icon] of Object.entries(catIcons)) {
    const en = CAT_NAME_EN[zh] || zh;
    result[en] = icon;
  }
  return result;
}