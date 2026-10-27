'use strict';

// A read-only picker for saved settings. Draft editing stays in connection settings.
window._agOpenQuickSwitch = function (anchor, initialMode = 'models') {
  if (document.getElementById('agQuickSwitch') || document.getElementById('agConfigModal')) return;
  const { AG } = window.AgentConfig;
  const cfg = AG.load(), catalog = AG.modelCatalog(cfg);
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  const currentModel = cfg.model || window.AgentAdapters.getAdapter(cfg.adapter).defaultModel;
  let mode = initialMode, limit = 30;
  const overlay = document.createElement('div'); overlay.id = 'agQuickSwitch';
  const box = document.createElement('div'); box.className = 'ag-quick-box';
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'agQuickTitle');
  box.innerHTML = `<style>
    #agQuickSwitch{position:fixed;inset:0;z-index:21000;background:rgba(0,0,0,.12)}
    .ag-quick-box{position:fixed;box-sizing:border-box;width:min(400px,calc(100vw - 24px));max-height:calc(100dvh - 24px);display:flex;flex-direction:column;gap:10px;padding:16px;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:14px;box-shadow:0 12px 40px #0003;font-family:inherit;font-size:14px;line-height:1.5}
    .ag-quick-box *{box-sizing:border-box}.ag-quick-head,.ag-quick-tabs{display:flex;align-items:center;gap:8px}.ag-quick-head strong{flex:1}.ag-quick-tabs button{flex:1}
    .ag-quick-box button,.ag-quick-box input{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:9px 11px;font:inherit;font-size:13px}.ag-quick-box button{cursor:pointer}.ag-quick-box button:hover{border-color:var(--accent)}.ag-quick-box button:focus-visible,.ag-quick-box input:focus{outline:2px solid var(--accent);outline-offset:2px}.ag-quick-box [aria-pressed=true]{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
    #agQuickList{overflow:auto;min-height:0;max-height:360px;display:flex;flex-direction:column;gap:6px;padding:3px}#agQuickList button{text-align:left;overflow-wrap:anywhere;flex-shrink:0}#agQuickList small{display:block;color:var(--text-muted);margin-top:3px}.ag-quick-hint{font-size:12px;color:var(--text-muted);margin:0;overflow-wrap:anywhere}#agQuickError{color:var(--danger,#e11d48)}#agQuickError:empty{display:none}
  </style><div class="ag-quick-head"><strong id="agQuickTitle">${say('快速切换', 'Quick switch')}</strong><button id="agQuickClose" aria-label="${say('关闭', 'Close')}">✕</button></div>
  <div class="ag-quick-tabs"><button id="agQuickConnections">${say('连接', 'Connections')}</button><button id="agQuickModels">${say('模型', 'Models')}</button></div>
  <input type="search" id="agQuickSearch" autocomplete="off" aria-label="${say('搜索连接或模型', 'Search connections or models')}">
  <p id="agQuickHint" class="ag-quick-hint"></p><div id="agQuickList"></div><p id="agQuickError" class="ag-quick-hint" role="status" aria-live="polite"></p>
  <button id="agQuickManage">${say('管理连接与模型…', 'Manage connections and models…')}</button>`;
  overlay.append(box); document.body.append(overlay);
  const field = id => box.querySelector('#' + id);
  function position() {
    if (!anchor?.isConnected) { close(); return; }
    const rect = anchor.getBoundingClientRect(), height = box.offsetHeight, width = box.offsetWidth;
    box.style.left = Math.max(12, Math.min(rect.left, innerWidth - width - 12)) + 'px';
    const top = rect.bottom + 8 + height <= innerHeight - 12 ? rect.bottom + 8 : rect.top - height - 8;
    box.style.top = Math.max(12, Math.min(top, innerHeight - height - 12)) + 'px';
  }
  function close() { overlay.remove(); release(); window.removeEventListener('resize', position); window.removeEventListener('hashchange', close); }
  const release = window.AgentDialog.trap(overlay, box, close);
  function manage(id) { close(); window._agOpenConfig({ modelsOnly: mode === 'models', initialConnectionId: id }); }
  function apply(config) {
    try { AG.save(config); close(); window.showToast?.(say('已切换，下次发送生效。', 'Switched. Applies to your next message.')); }
    catch (e) { field('agQuickError').textContent = e.message; }
  }
  function render() {
    const query = field('agQuickSearch').value.trim(), lower = query.toLocaleLowerCase();
    field('agQuickConnections').setAttribute('aria-pressed', String(mode === 'connections'));
    field('agQuickModels').setAttribute('aria-pressed', String(mode === 'models'));
    field('agQuickSearch').placeholder = mode === 'connections' ? say('搜索连接名称或地址', 'Search connection name or address') : say('搜索或输入模型 ID', 'Search or enter a model ID');
    field('agQuickHint').textContent = mode === 'connections' ? say('一键使用已保存的连接；未保存草稿可在设置中恢复。', 'Use saved connections in one click. Unsaved drafts remain in settings.') : say('已保存的模型与最近使用；在设置中可拉取更多模型。', 'Saved and recent models. Fetch more models in settings.');
    const list = field('agQuickList'); list.replaceChildren();
    const row = (name, description, active, fn, id) => {
      const button = document.createElement('button'); button.textContent = name; button.setAttribute('aria-pressed', String(active)); button.dataset.quickValue = id;
      const small = document.createElement('small'); small.textContent = description; button.append(small); button.onclick = fn; list.append(button);
    };
    let total = 0;
    if (mode === 'connections') {
      const entries = AG.connections().map(entry => {
        const config = AG.connection(entry.id);
        return { entry, config, ready: !!config.apiKey || (config.adapter === 'custom' && !!config.baseUrl && !!config.model) };
      }).sort((a, b) => Number(b.entry.id === cfg.connectionId) - Number(a.entry.id === cfg.connectionId) || Number(b.ready) - Number(a.ready));
      for (const { entry, config, ready } of entries) {
        let host = ''; try { host = new URL(window.AgentTransport.endpoint(config.adapter, config.baseUrl)).host; } catch {}
        if (![entry.name, host].some(text => text.toLocaleLowerCase().includes(lower))) continue;
        total++;
        row(entry.name, host + ' · ' + (ready ? config.model || window.AgentAdapters.getAdapter(config.adapter).defaultModel : say('需要配置', 'Setup needed')), entry.id === cfg.connectionId, () => ready ? apply({ ...AG.load(), ...config }) : manage(entry.id), entry.id);
      }
    } else {
      const ids = AG.modelIds([currentModel, ...catalog.recent, ...catalog.models]);
      const matches = ids.filter(id => id.toLocaleLowerCase().includes(lower)); total = matches.length;
      for (const id of matches.slice(0, limit)) row(id, id === currentModel ? say('当前模型', 'Current model') : catalog.recent.includes(id) ? say('最近使用', 'Recently used') : say('已拉取', 'Fetched'), id === currentModel, () => apply({ ...AG.load(), model: id }), id);
      if (query && AG.modelIds([query]).length && !ids.includes(query)) { total++; row(query, say('使用此自定义模型 ID', 'Use this custom model ID'), false, () => apply({ ...AG.load(), model: query }), query); }
      if (matches.length > limit) {
        const more = document.createElement('button'); more.textContent = say(`显示更多（共 ${matches.length} 个）`, `Show more (${matches.length} total)`);
        more.onclick = () => { limit += 30; render(); list.lastElementChild?.focus(); }; list.append(more);
      }
    }
    if (!total) { const empty = document.createElement('p'); empty.className = 'ag-quick-hint'; empty.textContent = say('没有匹配项，可打开设置添加。', 'No matches. Add one in settings.'); list.append(empty); }
    position();
  }
  for (const [id, next] of [['agQuickConnections', 'connections'], ['agQuickModels', 'models']]) field(id).onclick = () => { mode = next; limit = 30; field('agQuickSearch').value = ''; render(); field('agQuickSearch').focus(); };
  field('agQuickSearch').oninput = () => { limit = 30; render(); };
  field('agQuickSearch').onkeydown = event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); field('agQuickList').querySelector('button')?.focus(); }
  };
  field('agQuickClose').onclick = close; field('agQuickManage').onclick = () => manage(cfg.connectionId);
  overlay.onclick = event => { if (event.target === overlay) close(); };
  window.addEventListener('resize', position); window.addEventListener('hashchange', close);
  render(); field('agQuickSearch').focus();
};
