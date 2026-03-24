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

window.initAgentRouter = initAgentRouter;
