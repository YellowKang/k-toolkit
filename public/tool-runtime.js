/* Shared cancellation and storage commit boundaries. No user data leaves the browser. */
(function () {
  function task() {
    let active;
    const invalidate = () => { if (active) { clearTimeout(active.timer); active.controller.abort(); active = null; } };
    function start({ root, timeout = 0 } = {}) {
      invalidate();
      const controller = new AbortController();
      const run = { controller, signal: controller.signal, timedOut: false,
        owns: () => active === run && (!root || root.isConnected),
        current: () => active === run && !controller.signal.aborted && (!root || root.isConnected),
        finish: () => { clearTimeout(run.timer); if (active === run) active = null; },
      };
      active = run;
      if (timeout) run.timer = setTimeout(() => { run.timedOut = true; controller.abort(); }, timeout);
      return run;
    }
    return { start, invalidate, dispose: invalidate };
  }
  async function exclusive(name, operation) {
    if (!navigator.locks?.request) throw new Error(window.getCurrentLang?.() === 'en'
      ? 'Safe saving requires a browser with Web Locks on HTTPS or localhost. Export your data before changing browsers.'
      : '安全保存需要在 HTTPS 或 localhost 使用支持 Web Locks 的浏览器，请先导出数据再更换浏览器。');
    return navigator.locks.request('k-toolkit:' + name, operation);
  }
  window.ToolRuntime = Object.freeze({ task, exclusive });
})();
