'use strict';

function initAgentRouter(session) {
  // 最近操作记录（最多保留 5 条）
  const _recentActions = [];

  function _sniffToolIO() {
    const page = window.currentPage || 'home';
    if (page === 'home') return {};
    const caps = window.TOOL_CAPS && window.TOOL_CAPS[page];
    if (!caps || caps.autoRun === false) return {};
    // 尝试从 TOOL_RUNNERS 获取选择器
    const runner = window.TOOL_RUNNERS && window.TOOL_RUNNERS[page];
    let input = '', output = '';
    if (runner) {
      const mainEl = runner.mainInput && document.querySelector(runner.mainInput);
      if (mainEl) input = (mainEl.value || mainEl.textContent || '').slice(0, 200);
      const outEl = runner.outputSelector && document.querySelector(runner.outputSelector);
      if (outEl) output = (outEl.value || outEl.textContent || '').slice(0, 200);
    }
    return { toolInput: input || '', toolOutput: output || '' };
  }

  function sync() {
    const io = _sniffToolIO();
    session.pageContext = {
      page:       window.currentPage || 'home',
      lang:       window.getCurrentLang?.() || 'zh',
      favorites:  (window.favorites || []).length,
      recent:     (window.recent || []).length,
      totalTools: (window.TOOLS || []).length,
      toolInput:  io.toolInput || '',
      toolOutput: io.toolOutput || '',
      recentActions: _recentActions.slice(-5),
    };
  }

  // 记录 tool 执行历史
  session.on('tool_done', ({ results }) => {
    for (const r of (results || [])) {
      _recentActions.push({ name: r.name, ok: r.result?.success !== false, t: Date.now() });
      if (_recentActions.length > 5) _recentActions.shift();
    }
  });

  // hashchange fires AFTER navigateTo sets currentPage and renders
  // so this is the correct moment to sync context and notify autonomy
  window.addEventListener('hashchange', () => {
    // wait one tick for currentPage let-variable to update
    setTimeout(() => {
      sync();
      session.emit('page_change', { page: window.currentPage || 'home' });
    }, 50);
  });

  // Also patch navigateTo for the pushHash=false path (no hashchange fires)
  const orig = window.navigateTo;
  if (orig && !orig._agentPatched) {
    window.navigateTo = function(...args) {
      const r = orig.apply(this, args);
      // For pushHash=false, hashchange won't fire — sync manually after render
      if (args[1] === false) {
        setTimeout(() => {
          sync();
          session.emit('page_change', { page: window.currentPage || 'home' });
        }, 100);
      }
      return r;
    };
    window.navigateTo._agentPatched = true;
  }

  // MutationObserver on #content to detect tool page DOM ready
  let _muteObserver = false;
  const contentEl = document.getElementById('content') || document.getElementById('main') || document.body;
  const observer = new MutationObserver(() => {
    if (_muteObserver) return;
    sync();
  });
  observer.observe(contentEl, { childList: true, subtree: false });

  session.muteDomObserver   = (v) => { _muteObserver = v; };
  session.stopRouterObserver = () => observer.disconnect();

  sync();
  return sync;
}

// ── 智能工具推荐 ─────────────────────────────────────────────────
// 当用户消息匹配多个工具关键词时，返回 Top-3 推荐列表（带置信度分数）
function suggestTools(userMessage) {
  if (!userMessage || !window.TOOLS) return [];
  const msg = userMessage.toLowerCase();
  const scored = [];

  // 关键词权重映射（高频开发者意图）
  const intentMap = {
    'mock': 'mock-data', 'fake': 'mock-data', '模拟数据': 'mock-data', '假数据': 'mock-data',
    'chmod': 'chmod-calc', '权限': 'chmod-calc', 'rwx': 'chmod-calc', '755': 'chmod-calc', '644': 'chmod-calc',
    '占位图': 'placeholder-img', 'placeholder': 'placeholder-img', '占位': 'placeholder-img',
    '不可见字符': 'string-inspect', 'zero-width': 'string-inspect', '零宽': 'string-inspect', '字符检查': 'string-inspect',
    'schema': 'json-schema', 'json schema': 'json-schema', '推断': 'json-schema',
    'favicon': 'favicon-gen', '图标生成': 'favicon-gen', 'ico': 'favicon-gen',
    'token': 'llm-token', 'token 计数': 'llm-token', 'token count': 'llm-token', '价格估算': 'llm-token',
    'hmac': 'hmac-gen', '消息认证': 'hmac-gen', 'mac': 'hmac-gen',
    'hash': 'hash', '哈希': 'hash', 'sha': 'hash', 'md5': 'hash',
    'base64': 'base64', '编码': 'base64', '解码': 'base64',
    'json': 'json', '格式化': 'json', 'format': 'json',
    'markdown': 'markdown', 'md': 'markdown', '预览': 'markdown',
    'http': 'http-tester', 'api': 'http-tester', 'postman': 'http-tester', '请求': 'http-tester',
    'curl': 'curl-gen', 'fetch': 'curl-gen',
    '计算': 'calculator', 'calc': 'calculator', 'sin': 'calculator', 'cos': 'calculator',
    '密码': 'password-gen', 'password': 'password-gen',
    '正则': 'regex', 'regex': 'regex',
    '时间戳': 'timestamp', 'timestamp': 'timestamp',
    'uuid': 'uuid', 'guid': 'uuid',
    'jwt': 'jwt', 'token解码': 'jwt',
    'cron': 'cron', '定时': 'cron',
    '二维码': 'qrcode', 'qr': 'qrcode',
    '颜色': 'color', 'color': 'color', '对比度': 'color',
    'url': 'url-parser', '链接': 'url-parser',
    'aes': 'aes', '加密': 'aes', '解密': 'aes',
    '渐变': 'gradient', 'gradient': 'gradient',
    'nginx': 'nginx-gen', 'docker': 'docker-gen', 'dockerfile': 'docker-gen',
    'dns': 'dns-lookup', '域名': 'dns-lookup',
    'ip': 'ip-calc', '子网': 'ip-calc', 'cidr': 'ip-calc',
    '聊天': 'ai-chat', 'chat': 'ai-chat', '对话': 'ai-chat', '问ai': 'ai-chat',
    'ask ai': 'ai-chat', '大模型': 'ai-chat', 'llm chat': 'ai-chat',
  };

  const matchedTools = {};
  for (const [keyword, toolId] of Object.entries(intentMap)) {
    if (msg.includes(keyword)) {
      matchedTools[toolId] = (matchedTools[toolId] || 0) + (keyword.length > 3 ? 2 : 1);
    }
  }

  // 也从 TOOLS tags 中匹配
  for (const tool of window.TOOLS) {
    if (!tool.tags) continue;
    let score = matchedTools[tool.id] || 0;
    for (const tag of tool.tags) {
      if (msg.includes(tag.toLowerCase())) score += 1;
    }
    if (score > 0) matchedTools[tool.id] = score;
  }

  // 排序取 Top-3
  const sorted = Object.entries(matchedTools)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, score]) => {
      const tool = window.TOOLS.find(t => t.id === id);
      const maxScore = Math.max(...Object.values(matchedTools));
      return {
        id,
        name: tool ? tool.name : id,
        confidence: Math.min(1, score / Math.max(maxScore, 1)),
        score,
      };
    });

  return sorted;
}

window.suggestTools = suggestTools;
window.initAgentRouter = initAgentRouter;
