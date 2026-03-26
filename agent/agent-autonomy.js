'use strict';
const AgentAutonomy = (() => {
function _autoHint(toolId, caps, lang) {
if (!caps || !caps.desc) return null;
const isEn = lang === 'en';
const desc = caps.desc;
if (caps.autoRun === false) {
return isEn
? `On **${toolId}** page. ${caps.note || 'This tool requires manual interaction.'}`
: `当前在 **${toolId}** 页面。${caps.note || '此工具需要手动操作。'}`;
}
const inputs = (caps.inputs || []).join(', ');
return isEn
? `On **${toolId}** — ${desc}. Try: \`@${toolId} ${inputs ? inputs.split(',')[0].trim() : 'your input'}\``
: `当前在 **${toolId}**（${desc}）。试试：\`@${toolId} ${inputs ? inputs.split(',')[0].trim() : '你的输入'}\``;
}
function _autoQuickActions(toolId, caps) {
if (!caps || caps.autoRun === false) return [];
const chips = [];
const id = toolId;
if (caps.actions) {
for (const action of caps.actions.slice(0, 2)) {
chips.push(`@${id} ${action}`);
}
}
return chips;
}
const HINT_OVERRIDES_ZH = {
'uuid':       '当前在 UUID 生成器。试试说「生成 10 个 UUID」或「/uuid 5 no-dash」',
'hash':       '当前在哈希工具。说「计算 hello 的所有哈希」可一次算出 MD5/SHA-256 等。',
'base64':     '当前在 Base64 工具。说「编码 hello world」或「解码 aGVsbG8=」',
'json':       '当前在 JSON 工具。粘贴 JSON 后说「格式化」或「压缩」',
'jwt':        '当前在 JWT 工具。说「解码这个 token：eyJ...」可直接解析。',
'regex':      '当前在正则工具。说「用正则 \\d+ 匹配 abc123」可直接测试。',
'timestamp':  '当前在时间戳工具。说「当前时间戳」或「1700000000 是什么时间」',
'password-gen':'当前在密码生成器。说「生成 20 位含特殊字符密码」或「检查 password123 是否泄露」',
'ip-calc':    '当前在 IP 计算器。说「计算 192.168.1.0/24 的子网信息」',
'cron':       '当前在 Cron 工具。说「解析 0 9 * * 1-5」可显示执行时间。',
'curl-gen':   '当前在 cURL 生成器。说「导入 curl -X POST https://...」可自动解析为 fetch/axios 代码。',
'text-template':'当前在文本模板。说「用模板 {{name}} 和数据 [{name:"张三"}] 批量生成」',
'gradient':   '当前在渐变生成器。说「生成日落渐变」或「三色彩虹渐变」',
'mock-data':  '当前在 Mock 数据生成器。说「生成 50 条用户数据」或「生成 CSV 格式 100 条」',
'chmod-calc': '当前在 Chmod 计算器。说「计算 755 权限」或「644 是什么权限」',
'placeholder-img':'当前在占位图工具。说「生成 800x600 蓝底占位图」',
'string-inspect':'当前在字符串检查器。粘贴文本后可检测不可见字符。',
'json-schema':'当前在 JSON Schema 工具。粘贴 JSON 说「生成 Schema」可自动推断类型。',
'favicon-gen':'当前在 Favicon 生成器。输入 1-2 个字符或 Emoji 即可生成多尺寸图标。',
'llm-token':  '当前在 Token 计数器。粘贴文本可估算 GPT/Claude API 调用价格。',
'hmac-gen':   '当前在 HMAC 生成器。输入消息和密钥即可计算 HMAC-SHA256。',
'calculator': '当前在科学计算器。点击「科学」切换到科学模式，支持 sin/cos/log 等函数。',
'markdown':   '当前在 Markdown 编辑器。支持快捷键 Ctrl+B/I/K，点击 TOC 自动生成目录。',
'http-tester':'当前在 HTTP 测试工具。请求会自动保存历史，可一键导出 cURL 命令。',
'ai-chat':    '当前在 AI 对话工具。配置好 API Key 后即可直接与 AI 模型对话，支持发送图片。',
};
const HINT_OVERRIDES_EN = {
'uuid':       'On UUID generator. Try "generate 10 UUIDs" or "/uuid 5 no-dash"',
'hash':       'On Hash tool. Say "hash hello with all algorithms" to get MD5/SHA-256 etc.',
'base64':     'On Base64 tool. Say "encode hello world" or "decode aGVsbG8="',
'json':       'On JSON tool. Paste JSON and say "format" or "minify"',
'jwt':        'On JWT tool. Say "decode this token: eyJ..." to parse it.',
'regex':      'On Regex tool. Say "test \\d+ against abc123" to match.',
'timestamp':  'On Timestamp tool. Say "current timestamp" or "what time is 1700000000"',
'password-gen':'On Password generator. Say "generate 20-char password with symbols" or "check if password123 is leaked"',
'ip-calc':    'On IP calculator. Say "calc 192.168.1.0/24 subnet"',
'cron':       'On Cron tool. Say "parse 0 9 * * 1-5" to show schedule.',
'curl-gen':   'On cURL generator. Say "import curl -X POST https://..." to auto-parse into fetch/axios code.',
'text-template':'On Text Template. Say "batch generate with template {{name}} and data [{name:"John"}]"',
'gradient':   'On Gradient generator. Say "sunset gradient" or "rainbow gradient"',
'mock-data':  'On Mock Data generator. Say "generate 50 user records" or "100 rows CSV format"',
'chmod-calc': 'On Chmod calculator. Say "calc 755" or "what is 644"',
'placeholder-img':'On Placeholder Image. Say "generate 800x600 blue placeholder"',
'string-inspect':'On String Inspector. Paste text to detect invisible characters.',
'json-schema':'On JSON Schema. Paste JSON and say "generate schema" to infer types.',
'favicon-gen':'On Favicon Generator. Enter 1-2 characters or emoji to generate multi-size icons.',
'llm-token':  'On Token Counter. Paste text to estimate GPT/Claude API costs.',
'hmac-gen':   'On HMAC Generator. Enter message and key to compute HMAC-SHA256.',
'calculator': 'On Scientific Calculator. Click "SCI" to toggle scientific mode with sin/cos/log.',
'markdown':   'On Markdown Editor. Supports Ctrl+B/I/K shortcuts, click TOC for auto table of contents.',
'http-tester':'On HTTP Tester. Requests are auto-saved to history. Export as cURL with one click.',
'ai-chat':    'On AI Chat tool. Configure API Key to chat with AI models. Supports image attachments.',
};
const QA_OVERRIDES = {
'hash':     ['/hash hello sha256', '计算所有哈希'],
'base64':   ['/b64 hello world', '/d64 aGVsbG8gd29ybGQ='],
'uuid':     ['/uuid 5', '/uuid 1 no-dash'],
'jwt':      ['解码我的 token'],
'timestamp':['当前时间戳', '/ts'],
'password-gen': ['/pw 20 s', '检查密码泄露'],
'regex':    ['用 \\d+ 匹配 abc123'],
'unit-convert': ['100 km to miles', '0°C to °F'],
'json':     ['格式化 JSON', '压缩 JSON'],
'cron':     ['/cron 0 9 * * 1-5'],
'color': ['转换 #ff6600', '检查对比度'],
'ip-calc':  ['计算 192.168.1.0/24'],
'curl-gen':       ['生成 POST 请求', '导入 curl 命令'],
'text-template':  ['批量生成通知', '填充模板变量'],
'gradient':       ['生成日落渐变', '彩虹渐变'],
'nginx-gen':      ['生成反向代理配置', '生成 SSL 配置'],
'docker-gen':     ['生成 Node Dockerfile', '生成 Go Dockerfile'],
'mock-data':      ['生成 50 条数据', '生成 CSV 格式'],
'chmod-calc':     ['计算 755', '计算 644'],
'placeholder-img':['生成 800x600', '生成 1920x1080'],
'string-inspect': ['检查不可见字符', '清除零宽字符'],
'json-schema':    ['生成 Schema', '校验 JSON'],
'favicon-gen':    ['生成 Favicon', '导出 ICO'],
'llm-token':      ['估算 Token 数', '计算 API 价格'],
'hmac-gen':       ['HMAC-SHA256', 'Base64 格式'],
'calculator':     ['sin(30)', 'log(100)'],
'markdown':       ['生成 TOC', '插入代码块'],
'http-tester':    ['查看历史', '导出 cURL'],
};
let _session = null;
let _lastPage = null;
let _hintShown = {};
function init(session) {
_session = session;
session.on('page_change', ({ page }) => {
if (page === _lastPage) return;
_lastPage = page;
_onPageChange(page);
});
}
function _onPageChange(page) {
if (_hintShown[page] || page === 'home') return;
_hintShown[page] = true;
const lang = _session?.pageContext?.lang || 'zh';
const isEn = lang === 'en';
const caps = window.TOOL_CAPS && window.TOOL_CAPS[page];
const overrides = isEn ? HINT_OVERRIDES_EN : HINT_OVERRIDES_ZH;
const hint = overrides[page] || _autoHint(page, caps, lang);
if (!hint) return;
const quickActions = QA_OVERRIDES[page] || _autoQuickActions(page, caps);
setTimeout(() => {
const msgs = document.getElementById('agMessages');
if (!msgs) return;
const el = document.createElement('div');
el.className = 'ag-bubble assistant ag-auto-hint';
let html = window._agMdToHtml ? window._agMdToHtml(hint) : hint;
if (quickActions && quickActions.length) {
html += '<div class="ag-hint-chips">' +
quickActions.map(q =>
`<button class="ag-chip" onclick="window._agChipSend(this,'${q.replace(/'/g, "\\'")}')">${escHtml(q)}</button>`
).join('') + '</div>';
}
el.innerHTML = html;
msgs.appendChild(el);
msgs.scrollTop = msgs.scrollHeight;
}, 600);
}
function escHtml(t) {
return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function getPageQuickActions(page) {
const caps = window.TOOL_CAPS && window.TOOL_CAPS[page];
return QA_OVERRIDES[page] || _autoQuickActions(page, caps);
}
return { init, getPageQuickActions };
})();
window.AgentAutonomy = AgentAutonomy;