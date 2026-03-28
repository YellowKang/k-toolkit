const LANG_ZH = {
greet_late:    '夜深了',
greet_morning: '早上好',
greet_afternoon:'下午好',
greet_evening: '晚上好',
hero_sub:      (total) => `${total} 个工具 · AI 智能体助手 · 按 / 搜索 · Alt+A 唤起 AI`,
stat_tools:    '工具',
stat_favs:     '收藏',
stat_recent:   '最近',
stat_ai_chat:  'AI 对话',
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
nav_ai_chat:   'AI 对话',
bottom_home:   '首页',
bottom_favs:   '收藏',
bottom_recent: '最近',
bottom_ai:     'AI 对话',
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
theme_dark:    '暗夜黑',
theme_light:   '纯白色',
theme_tech_blue:'科技蓝',
theme_sakura:  '樱花粉',
theme_orange:  '商务橙',
theme_green:   '清新绿',
};
const LANG_EN = {
greet_late:    'Good night',
greet_morning: 'Good morning',
greet_afternoon:'Good afternoon',
greet_evening: 'Good evening',
hero_sub:      (total) => `${total} tools · AI Agent assistant · Press / to search · Alt+A for AI`,
stat_tools:    'Tools',
stat_favs:     'Favorites',
stat_recent:   'Recent',
stat_ai_chat:  'AI Chat',
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
nav_ai_chat:   'AI Chat',
bottom_home:   'Home',
bottom_favs:   'Favorites',
bottom_recent: 'Recent',
bottom_ai:     'AI Chat',
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
theme_dark:    'Dark',
theme_light:   'Light',
theme_tech_blue:'Tech Blue',
theme_sakura:  'Sakura',
theme_orange:  'Orange',
theme_green:   'Green',
};
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
const TOOLS_EN = {
'uuid':             { name:'UUID Generator',     desc:'Batch generate UUID v4, one-click copy, custom count',                        category:'Text' },
'json':             { name:'JSON Formatter',     desc:'Format, minify and validate JSON with instant syntax highlighting',            category:'Text' },
'base64':           { name:'Base64',             desc:'Encode/decode text and files to Base64, supports URL-safe and Data URL',      category:'Text' },
'wordcount':        { name:'Word Count',         desc:'Count characters, words, lines, paragraphs and CJK characters',              category:'Text' },
'regex':            { name:'Regex Tester',       desc:'Real-time highlight matches, capture group details, multiple flags',          category:'Text' },
'json-csv':         { name:'JSON/CSV Convert',   desc:'Bidirectional conversion between JSON arrays and CSV, download support',      category:'Text' },
'text-diff':        { name:'Text Diff',          desc:'Line-by-line comparison of two texts with highlighted differences',           category:'Text' },
'markdown':         { name:'Markdown Preview',   desc:'Real-time Markdown rendering with syntax highlighting',                       category:'Text' },
'case-convert':     { name:'Case Convert',       desc:'Convert between camelCase, snake_case, UPPERCASE and more',                  category:'Text' },
'unicode-convert':  { name:'Unicode Convert',    desc:'Convert Unicode code points and characters, escape sequences',               category:'Text' },
'html-entity':      { name:'HTML Entity',        desc:'HTML entity encode/decode with swap, reference for special characters',      category:'Text' },
'lorem':            { name:'Lorem Ipsum',        desc:'Generate Lorem Ipsum placeholder text, custom paragraphs and word count',    category:'Text' },
'text-escape':      { name:'Text Escape',        desc:'Escape/unescape JSON/regex/HTML/URL special characters',                     category:'Text' },
'diff-json':        { name:'JSON Diff',          desc:'Diff two JSON or YAML objects with highlighted differences',                  category:'Text' },
'toml-json':        { name:'TOML/JSON',          desc:'Bidirectional conversion between TOML and JSON',                             category:'Text' },
'slug-gen':         { name:'Slug Generator',     desc:'Convert text to URL-friendly slug with pinyin support',                      category:'Text' },
'line-sort':        { name:'Line Sort',          desc:'Sort lines alphabetically, reverse, deduplicate, shuffle or remove blanks',  category:'Text' },
'timestamp':        { name:'Timestamp',          desc:'Real-time timestamp, ms/s conversion, date parsing, multi-format output',    category:'Dev Tools' },
'url-parser':       { name:'URL Toolkit',        desc:'URL parse, encode/decode, and query param builder in one tool',              category:'Dev Tools' },
'hash':             { name:'Hash Generator',     desc:'SHA-1/256/384/512, supports text and file hash verification',                category:'Dev Tools' },
'jwt':              { name:'JWT Tool',           desc:'Decode/generate JWT tokens with HS256 signing support',                      category:'Dev Tools' },
'number-base':      { name:'Number Base',        desc:'Convert between binary, octal, decimal and hex, ASCII/Unicode code points',  category:'Dev Tools' },
'yaml-json':        { name:'YAML/JSON',          desc:'Bidirectional conversion between YAML and JSON',                             category:'Dev Tools' },
'sql-format':       { name:'SQL Formatter',      desc:'Beautify/minify SQL, supports SELECT/INSERT/UPDATE/DELETE',                  category:'Dev Tools' },
'curl-gen':         { name:'cURL Generator',     desc:'Visually generate curl/fetch/axios code snippets with cURL import',          category:'Dev Tools' },
'http-status':      { name:'HTTP Status',        desc:'Look up HTTP status code meanings, search and browse by category',           category:'Dev Tools' },
'cron':             { name:'Cron Expression',    desc:'Visually parse Cron expressions, show next execution times',                 category:'Dev Tools' },
'password-gen':     { name:'Password Generator', desc:'Generate strong passwords with HIBP breach detection and Diceware mode',     category:'Dev Tools' },
'env-parse':        { name:'Env Parser',         desc:'Parse .env files, format checking and key extraction',                       category:'Dev Tools' },
'docker-gen':       { name:'Dockerfile Gen',     desc:'Generate best-practice Dockerfile for Node/Python/Go/Java',                  category:'Dev Tools' },
'nginx-gen':        { name:'Nginx Config',       desc:'Generate Nginx config for static site/reverse proxy/HTTPS redirect',         category:'Dev Tools' },
'git-commit':       { name:'Git Commit',         desc:'Generate conventional commit messages following Angular convention',          category:'Dev Tools' },
'semver':           { name:'Semver',             desc:'Parse semantic versions, compare ranges, check compatibility',               category:'Dev Tools' },
'dns-lookup':       { name:'DNS Lookup',         desc:'DNS over HTTPS query for A/AAAA/MX/TXT/CNAME/NS records',                   category:'Dev Tools' },
'terminal-color':   { name:'Terminal Color',     desc:'ANSI color code generator with foreground/background/style preview',         category:'Dev Tools' },
'gradient':         { name:'Gradient',           desc:'CSS gradient generator with 20 presets, animation preview and Tailwind export', category:'CSS Tools' },
'color':            { name:'Color Tool',         desc:'Color picker, format converter, WCAG contrast checker in one tool',          category:'CSS Tools' },
'shadow':           { name:'Box Shadow',         desc:'Visual CSS box-shadow generator, multiple layers, real-time preview',        category:'CSS Tools' },
'flexbox':          { name:'Flexbox',            desc:'Visual Flexbox layout debugger, all properties adjustable',                  category:'CSS Tools' },
'svg-preview':      { name:'SVG Preview',        desc:'Paste SVG code for live preview with zoom support',                          category:'CSS Tools' },
'palette-gen':      { name:'Palette Generator',  desc:'Generate full color scale from base color, export CSS variables',            category:'CSS Tools' },
'clip-path':        { name:'Clip-path',          desc:'CSS clip-path generator, polygon/ellipse/inset shape editor',                category:'CSS Tools' },
'css-unit':         { name:'CSS Unit Convert',   desc:'px/rem/em/vw/vh/pt conversions with configurable base font size',            category:'CSS Tools' },
'img-base64':       { name:'Image Base64',       desc:'Convert images to Base64 data URI and back',                                 category:'Image' },
'img-compress':     { name:'Image Compress',     desc:'Client-side image compression with quality adjustment',                      category:'Image' },
'qrcode':           { name:'QR Code',            desc:'Generate QR codes with dot/rounded styles and logo embedding',               category:'Image' },
'qrcode-decode':    { name:'QR Decode',          desc:'Decode QR codes from image files',                                           category:'Image' },
'img-webp':         { name:'Image to WebP',      desc:'Batch convert images to WebP with quality control',                          category:'Image' },
'img-exif':         { name:'EXIF Viewer',        desc:'Read image EXIF data: camera model, ISO, exposure time and more',            category:'Image' },
'aes':              { name:'AES Encrypt',        desc:'AES-GCM symmetric encryption and decryption, SubtleCrypto',                  category:'Crypto' },
'morse':            { name:'Morse Code',         desc:'Convert text to Morse code and decode back',                                 category:'Crypto' },
'xml-format':       { name:'XML Formatter',      desc:'Format and validate XML with collapsible nodes',                             category:'Crypto' },
'calculator':       { name:'Calculator',         desc:'Scientific calculator with history, supports keyboard input',                category:'Calculator' },
'unit-convert':     { name:'Unit Convert',       desc:'Convert length, weight, temperature, area, storage, speed and number formats', category:'Calculator' },
'loan-calc':        { name:'Loan Calculator',    desc:'Monthly payment, total interest and amortization schedule',                  category:'Calculator' },
'byte-convert':     { name:'Byte Convert',       desc:'Convert B/KB/MB/GB/TB/PB storage units',                                    category:'Calculator' },
'number-chinese':   { name:'Number Chinese',     desc:'Convert numbers to Chinese uppercase for financial documents',               category:'Calculator' },
'ip-calc':          { name:'IP Subnet Calc',     desc:'IPv4 subnet calculator, CIDR, network and broadcast address',                category:'Calculator' },
'aspect-ratio':     { name:'Aspect Ratio',       desc:'Calculate dimensions from aspect ratio, common presets',                     category:'Calculator' },
'age-calc':         { name:'Age Calculator',     desc:'Exact age (years/months/days), days to birthday, zodiac sign',               category:'Calculator' },
'tax-calc':         { name:'Tax Calculator',     desc:'2024 personal income tax calculator with deductions',                        category:'Calculator' },
'date-diff':        { name:'Date Diff',          desc:'Days between two dates, with weekday/holiday calculation',                   category:'Time' },
'timezone':         { name:'Timezone Convert',   desc:'13 major timezones real-time comparison',                                    category:'Time' },
'countdown':        { name:'Countdown',          desc:'Custom target date countdown with SVG arc progress',                         category:'Time' },
'world-clock':      { name:'World Clock',        desc:'8 major timezones displayed simultaneously in real time',                    category:'Time' },
'lunar-calendar':   { name:'Lunar Calendar',     desc:'Query Chinese lunar date, zodiac, solar terms for any date',                 category:'Time' },
'pomodoro':         { name:'Pomodoro',           desc:'25-min focus + 5-min break timer with SVG progress ring',                    category:'Productivity' },
'meeting-cost':     { name:'Meeting Cost',       desc:'Real-time meeting cost calculator, input headcount and salary',              category:'Productivity' },
'spinner':          { name:'Random Picker',      desc:'Random draw from custom list with Canvas spinning wheel animation',          category:'Productivity' },
'stopwatch':        { name:'Stopwatch',          desc:'Start/pause/reset/lap with millisecond precision and lap history',           category:'Productivity' },
'text-template':    { name:'Text Template',      desc:'{{variable}} placeholder replacement with batch JSON mode',                  category:'Productivity' },
'todo':             { name:'Todo',               desc:'Local storage todo list with complete/delete/clear support',                 category:'Productivity' },
'note':             { name:'Quick Note',         desc:'Auto-saved text note with word count, persists after close',                 category:'Productivity' },
'typing-speed':     { name:'Typing Practice',    desc:'Sentence/word/code mode, WPM test with stats chart',                         category:'Productivity' },
'user-agent':       { name:'User Agent',         desc:'Parse browser User-Agent, detect OS/browser/device',                         category:'Network' },
'http-tester':      { name:'HTTP Tester',        desc:'Send GET/POST requests visually in browser, simple Postman',                 category:'Network' },
'ip-info':          { name:'IP Info',            desc:'Query your public IP and geolocation info',                                  category:'Network' },
'speed-test':       { name:'Speed Test',         desc:'Test network download/upload speed in browser',                              category:'Network' },
'ascii-art':        { name:'ASCII Art',          desc:'Convert text to ASCII art with 4 font styles',                               category:'Fun' },
'emoji-picker':     { name:'Emoji Picker',       desc:'Browse Emoji by category, one-click copy, searchable',                       category:'Fun' },
'noise-gen':        { name:'White Noise',        desc:'White/pink/brown noise and rain sounds, adjustable volume',                  category:'Fun' },
'matrix-rain':      { name:'Matrix Rain',        desc:'Matrix digital rain canvas animation, classic green characters',              category:'Fun' },
'mock-data':        { name:'Mock Data',          desc:'Batch generate fake data (name/phone/email/address), JSON/CSV/SQL export',    category:'Dev Tools' },
'chmod-calc':       { name:'Chmod Calculator',   desc:'Linux file permission calculator, numeric and symbolic mode conversion',      category:'Dev Tools' },
'placeholder-img':  { name:'Placeholder Image',  desc:'Generate placeholder images with custom size/color/text, Canvas download',    category:'Image' },
'string-inspect':   { name:'String Inspector',   desc:'Inspect each character: Unicode codepoint, byte count, invisible char highlight', category:'Text' },
'json-schema':      { name:'JSON Schema',        desc:'Infer JSON Schema (Draft-07) from sample JSON, validate against schema',     category:'Dev Tools' },
'favicon-gen':      { name:'Favicon Generator',  desc:'Generate multi-size favicons from text/emoji, export ICO/PNG/SVG',           category:'Image' },
'llm-token':        { name:'LLM Token Counter',  desc:'Estimate text token count and API call cost for GPT/Claude models',          category:'Dev Tools' },
'hmac-gen':         { name:'HMAC Generator',     desc:'Generate HMAC-SHA256/384/512/SHA1 message authentication codes',             category:'Crypto' },
'ai-chat':          { name:'AI Chat',            desc:'Chat with AI models — multi-turn, images, Markdown',                       category:'Productivity' },
};
let _currentLang = localStorage.getItem('dtb_lang') || 'zh';
function t(key, ...args) {
const pack = _currentLang === 'en' ? LANG_EN : LANG_ZH;
const val = pack[key];
if (typeof val === 'function') return val(...args);
return val ?? key;
}
function getCurrentLang() { return _currentLang; }
function makeToolI18n(dict) {
return function(key, ...args) {
const lang = _currentLang || 'zh';
const pack = dict[lang] || dict['zh'];
const val = pack[key] ?? key;
if (typeof val === 'function') return val(...args);
return val;
};
}
function setLang(lang) {
_currentLang = lang;
_ltCache = null; 
localStorage.setItem('dtb_lang', lang);
const btn = document.getElementById('langBtn');
if (btn) btn.textContent = t('lang_btn');
const inp = document.getElementById('searchInput');
if (inp) inp.placeholder = t('search_placeholder');
if (typeof renderHomePage === 'function') renderHomePage(typeof currentPage !== 'undefined' ? currentPage : 'home');
if (typeof buildSidebarNav === 'function') buildSidebarNav();
if (typeof applyTheme === 'function') applyTheme();
if (typeof currentPage !== 'undefined' && !['home','favorites','recent','ai-chat'].includes(currentPage)) {
if (typeof TOOLS !== 'undefined' && typeof renderToolPageFull === 'function') {
const tool = TOOLS.find(t => t.id === currentPage);
if (tool) renderToolPageFull(tool);
}
}
if (typeof window._chatRefreshI18n === 'function' && document.getElementById('_chatPageRoot')) {
window._chatRefreshI18n();
}
if (typeof window._agRefreshI18n === 'function') window._agRefreshI18n();
document.querySelectorAll('[data-i18n]').forEach(el => {
const key = el.dataset.i18n;
if (key) el.textContent = t(key);
});
}
let _ltCache = null;
let _ltCacheLang = '';
let _ltCacheSrc = null;
function getLocalizedTools(tools) {
if (_currentLang === 'zh') return tools;
if (_ltCache && _ltCacheLang === _currentLang && _ltCacheSrc === tools) return _ltCache;
_ltCache = tools.map(t => {
const en = TOOLS_EN[t.id];
if (!en) return t;
return Object.assign({}, t, {
name: en.name,
desc: en.desc,
category: en.category,
});
});
_ltCacheLang = _currentLang;
_ltCacheSrc = tools;
return _ltCache;
}
function getLocalizedCatIcons(catIcons) {
if (_currentLang === 'zh') return catIcons;
const result = {};
for (const [zh, icon] of Object.entries(catIcons)) {
const en = CAT_NAME_EN[zh] || zh;
result[en] = icon;
}
return result;
}