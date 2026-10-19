(function () {
  const tl = makeToolI18n({
    zh: { title: '版本与更新', check: '检查更新', current: '当前版本', latest: '线上版本', checking: '正在检查并准备更新…', ready: '新版本已准备好，可以更新。', fresh: '当前已是线上版本。', failed: '暂时无法完成检查，可能离线或新版本尚未部署完整，请稍后重试。', dev: '当前是本地开发版，生产构建后可检查线上更新。', unsupported: '此浏览器无法缓存离线版本；可刷新获取线上版本。', update: '更新并刷新', refresh: '刷新页面', warning: '刷新会结束当前任务，并清除未保存的输入、图片暂存和未下载结果；收藏和设置会保留。', close: '关闭', available: '发现新版本，点击查看', applying: '正在切换版本…' },
    en: { title: 'Version & updates', check: 'Check for updates', current: 'Current version', latest: 'Online version', checking: 'Checking and preparing update…', ready: 'A new version is ready to install.', fresh: 'You are using the online version.', failed: 'Could not complete the check. You may be offline or the deployment is incomplete. Try again later.', dev: 'Local development version. Build the site to enable release checks.', unsupported: 'Offline caching is unavailable in this browser. Refresh to get the online version.', update: 'Update & refresh', refresh: 'Refresh page', warning: 'Refreshing ends the current task and clears unsaved inputs, staged images and undownloaded results. Favorites and settings stay.', close: 'Close', available: 'Update available — view details', applying: 'Switching versions…' },
  });
  const current = document.querySelector('meta[name="toolkit-version"]')?.content || 'dev';
  const base = new URL('./', location.href);
  const trigger = document.getElementById('appUpdateButton');
  const dialog = document.createElement('dialog');
  dialog.id = 'appUpdateDialog'; dialog.className = 'update-dialog';
  dialog.setAttribute('aria-labelledby', 'updateTitle');
  dialog.innerHTML = '<div class="update-heading"><h2 id="updateTitle"></h2><button type="button" data-close class="btn btn-secondary">×</button></div><p><span data-current-label></span>: <code data-current></code></p><p><span data-latest-label></span>: <code data-latest></code></p><p data-status role="status" aria-live="polite"></p><p data-warning class="update-warning"></p><div class="tool-actions"><button type="button" class="btn btn-secondary" data-check></button><button type="button" class="btn btn-primary" data-apply></button></div>';
  document.body.appendChild(dialog);
  const find = selector => dialog.querySelector(selector);
  let registration, latest = '', ready = false, status = current === 'dev' ? 'dev' : 'checking';
  let pending = null, lastCheck = 0, applying = false, reloadRequested = false, reloaded = false;
  const render = () => {
    find('#updateTitle').textContent = tl('title');
    find('[data-current-label]').textContent = tl('current'); find('[data-current]').textContent = current;
    find('[data-latest-label]').textContent = tl('latest'); find('[data-latest]').textContent = latest || '—';
    find('[data-status]').textContent = tl(status); find('[data-warning]').textContent = tl('warning');
    find('[data-close]').setAttribute('aria-label', tl('close'));
    find('[data-check]').textContent = tl('check'); find('[data-check]').disabled = !!pending || applying;
    find('[data-apply]').textContent = tl(ready ? 'update' : 'refresh');
    find('[data-apply]').disabled = applying || !!pending || (latest !== current && !!latest && !ready && !!registration);
    trigger.title = tl(ready ? 'available' : 'title'); trigger.setAttribute('aria-label', trigger.title);
    trigger.querySelector('.update-dot').hidden = !ready;
  };
  const workerVersion = worker => new Promise((resolve, reject) => {
    if (!worker) return resolve('');
    const channel = new MessageChannel();
    const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Worker timeout')); }, 3000);
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data.version || ''); };
    worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
  });
  const waitInstalled = worker => new Promise((resolve, reject) => {
    if (!worker || ['installed', 'activated'].includes(worker.state)) return resolve();
    const cleanup = () => { clearTimeout(timer); worker.removeEventListener('statechange', changed); };
    const changed = () => {
      if (['installed', 'activated'].includes(worker.state)) { cleanup(); resolve(); }
      else if (worker.state === 'redundant') { cleanup(); reject(new Error('Incomplete release')); }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Installation timeout')); }, 45000);
    worker.addEventListener('statechange', changed); changed();
  });
  async function check() {
    if (pending) return pending;
    if (current === 'dev') { status = 'dev'; render(); return; }
    lastCheck = Date.now(); status = 'checking';
    pending = (async () => {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        let response;
        try {
          const url = new URL('version.json', base); url.searchParams.set('check', Date.now());
          response = await fetch(url, { cache: 'no-store', signal: controller.signal });
        } finally { clearTimeout(timer); }
        if (!response.ok) throw new Error('Version unavailable');
        const data = await response.json();
        if (!/^[a-f0-9]{8}$/.test(data.version)) throw new Error('Invalid version');
        if (latest !== data.version) ready = false;
        latest = data.version;
        if (!('serviceWorker' in navigator)) { ready = latest !== current; status = 'unsupported'; return; }
        registration = await navigator.serviceWorker.register(new URL('sw.js', base), { scope: base.pathname, updateViaCache: 'none' });
        if (!registration.installing) await registration.update();
        const candidate = registration.installing;
        await waitInstalled(candidate);
        const installed = await workerVersion(candidate || registration.waiting || registration.active);
        ready = installed === latest && installed !== current;
        if (installed !== latest) throw new Error('Deployment not ready');
        status = ready ? 'ready' : 'fresh';
      } catch { status = 'failed'; }
      finally { pending = null; render(); }
    })();
    render(); return pending;
  }
  const reload = () => {
    if (reloaded) return; reloaded = true;
    const url = new URL(location.href); url.searchParams.set('__toolkit_update', latest || Date.now());
    location.replace(url.href);
  };
  async function apply() {
    if (pending || applying) return;
    applying = true; status = 'applying'; render();
    if (registration?.waiting && ready) {
      reloadRequested = true;
      registration.waiting.postMessage({ type: 'ACTIVATE' });
      setTimeout(() => {
        if (reloaded) return;
        reloadRequested = false; applying = false; status = 'failed'; render();
      }, 10000);
    } else reload();
  }
  trigger.addEventListener('click', () => { if (!dialog.open) dialog.showModal(); check(); });
  find('[data-close]').addEventListener('click', () => dialog.close());
  find('[data-check]').addEventListener('click', check);
  find('[data-apply]').addEventListener('click', apply);
  window.addEventListener('toolkit-language-change', render);
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) reload();
    else if (!pending) check();
  });
  const background = () => { if (!document.hidden && Date.now() - lastCheck > 60000) check(); };
  document.addEventListener('visibilitychange', background);
  window.addEventListener('online', () => check());
  setInterval(background, 5 * 60 * 1000);
  window.AppUpdates = { check };
  render(); check();
})();
