'use strict';

// One settings surface for the panel, quick assistant and AI chat.
function openConfig({ modelsOnly = false, initialConnectionId } = {}) {
  if (document.getElementById('agConfigModal')) return;
  window._agInjectCSS?.();
  const { AG } = window.AgentConfig;
  const cfg = AG.load(), drafts = new Map();
  const adapters = window.AgentAdapters.listAdapters();
  const t = window.AgentI18n?.t || (k => k);
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  let connectionId = AG.connectionId(cfg);
  let draftTimer, draftError = '';
  try {
    const saved = window.AgentDrafts.read('connections')?.value || window._agConnectionDraftMemory;
    for (const [id, draft] of saved?.drafts || []) {
      if (/^(connection-[a-zA-Z0-9-]{1,80}|legacy-[a-z-]+)$/.test(id) && draft?.config?.connectionId === id && adapters.some(a => a.id === draft.config.adapter)) drafts.set(id, draft);
    }
    if (drafts.has(saved?.selectedConnectionId)) connectionId = saved.selectedConnectionId;
  } catch { draftError = say('连接草稿无法读取，已有的连接仍可使用。', 'Connection drafts could not be read. Saved connections are still available.'); }
  if (initialConnectionId && (drafts.has(initialConnectionId) || AG.connection(initialConnectionId))) connectionId = initialConnectionId;
  let selected = cfg.adapter, testing = null, discovering = null, catalog;
  const modal = document.createElement('div'); modal.id = 'agConfigModal';
  const box = document.createElement('div'); box.className = 'ag-config-box';
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'cfgTitle');
  // Only static/localized labels enter HTML; all saved values use DOM properties.
  box.innerHTML = `
    <div class="ag-config-header"><h3 id="cfgTitle">${modelsOnly ? t('models_switch') : say('AI 连接设置', 'AI connection settings')}</h3><button class="ag-config-close" id="cfgCloseBtn" aria-label="${t('close')}">✕</button></div>
    <div class="ag-config-section">
      <p class="ag-hint">${modelsOnly ? t('models_switch_hint') : say('Agent、快捷助手和 AI 对话共用；每个连接独立保存模型与参数。', 'Shared by Agent, quick assistant and AI chat. Named connections keep separate settings.')}</p>
      <div class="ag-config-row"><label class="ag-config-label" for="cfgSavedConnection">${say('使用的连接', 'Connection')}</label><select id="cfgSavedConnection"></select></div>
      <div class="ag-draft-status"><p id="cfgDraftStatus" class="ag-hint" role="status" aria-live="polite"></p><button class="ag-btn" id="cfgDiscardDraft" hidden>${say('放弃此连接的修改', 'Discard changes to this connection')}</button></div>
      <details id="cfgConnection" class="ag-config-connection" ${modelsOnly ? '' : 'open'}><summary><span>${t('models_connection')}</span><span id="cfgConnectionSummary"></span></summary>
      <div class="ag-connection-actions"><button class="ag-btn" id="cfgNewConnection">${say('新建连接', 'New connection')}</button><button class="ag-btn" id="cfgCopyConnection">${say('复制连接', 'Duplicate')}</button><button class="ag-btn" id="cfgDeleteConnection">${say('删除', 'Delete')}</button></div>
      <div class="ag-config-row" id="cfgNameRow"><label class="ag-config-label" for="cfgConnectionName">${say('连接名称', 'Connection name')}</label><input id="cfgConnectionName" maxlength="60" autocomplete="off"></div>
      <div class="ag-config-row"><div class="ag-config-label">${t('models_protocol')}</div><div class="ag-adapter-btns" id="cfgAdapterBtns"></div><p class="ag-hint">${t('models_protocol_hint')}</p></div>
      <div class="ag-config-row"><label class="ag-config-label" for="cfgApiKey">API Key</label><div class="ag-key-wrap"><input type="password" id="cfgApiKey" autocomplete="off" spellcheck="false"><button class="ag-eye-btn" id="cfgEye" aria-label="${say('显示密钥', 'Show API key')}" aria-pressed="false">◉</button></div><div class="ag-hint">${say('保存在当前浏览器。自定义的无认证本地服务可留空。', 'Saved in this browser. Optional for a custom local server without authentication.')}</div></div>
      <div class="ag-config-row"><label class="ag-config-label" for="cfgBaseUrl">Base URL</label><input type="url" id="cfgBaseUrl" placeholder="${say('留空使用官方地址', 'Leave blank for the official endpoint')}" spellcheck="false"><div class="ag-hint">${say('支持域名、/v1 或完整接口路径', 'Accepts an origin, /v1 or a full endpoint')}</div><code id="cfgEndpoint" class="ag-endpoint"></code><p id="cfgLocalNetworkHint" class="ag-hint"></p></div>
      </details>
      <div class="ag-config-row ag-model-section">
        <div class="ag-model-heading"><h4>${t('models_title')}</h4><button class="ag-btn" id="cfgFetchModels">${t('models_fetch')}</button></div>
        <label class="ag-config-label" for="cfgModel">${t('models_id')}</label><input id="cfgModel" autocomplete="off" spellcheck="false" maxlength="256" placeholder="${t('cfg_model_ph')}"><p class="ag-hint">${t('models_hint')}</p>
        <code id="cfgModelsEndpoint" class="ag-endpoint"></code>
        <p id="cfgModelsStatus" role="status" aria-live="polite"></p>
        <div id="cfgModelLibrary"></div>
      </div>
      <details class="ag-config-advanced"><summary>${say('生成参数与面板布局', 'Generation and panel layout')}</summary>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgTemp">${t('cfg_temp')} <span id="cfgTempVal"></span></label><input type="range" id="cfgTemp" min="0" max="1" step="0.1"></div>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgMaxTokens">${say('最大输出 Token', 'Maximum output tokens')}</label><input id="cfgMaxTokens" type="number" min="1" max="128000" step="1"></div>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgPosition">${t('cfg_position')}</label><select id="cfgPosition"><option value="right">${t('cfg_right')}</option><option value="left">${t('cfg_left')}</option></select></div>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgSize">${t('cfg_size')}</label><select id="cfgSize"><option value="compact">${t('cfg_compact')}</option><option value="normal">${t('cfg_normal')}</option><option value="large">${t('cfg_large')}</option></select></div>
      </details>
      <div class="ag-connection-test"><button class="ag-btn" id="cfgTestBtn">${say('测试连接', 'Test connection')}</button><span class="ag-hint">${say('发送一条短消息，可能产生少量费用。', 'Sends a short message; a small usage charge may apply.')}</span></div>
      <p id="cfgStatus" role="status" aria-live="polite"></p>
      <p id="cfgVersion" class="ag-hint"></p>
    </div>
    <div class="ag-config-footer"><button class="ag-btn" id="cfgCancelBtn">${say('关闭 · 保留草稿', 'Close · keep drafts')}</button><button class="ag-btn" id="cfgSaveOnlyBtn">${say('保存此连接', 'Save connection')}</button><button class="ag-btn" id="cfgSaveBtn">${modelsOnly ? t('models_save_switch') : say('保存并使用', 'Save and use')}</button></div>`;
  modal.appendChild(box); document.body.appendChild(modal);
  window.AgentConfig.applySkin(cfg.skin);
  const field = id => box.querySelector('#' + id);
  const status = (message, error = false) => { field('cfgStatus').textContent = message; field('cfgStatus').classList.toggle('error', error); };
  const modelStatus = (message, error = false) => { field('cfgModelsStatus').textContent = message; field('cfgModelsStatus').classList.toggle('error', error); };
  const read = () => ({ ...cfg, connectionId, connectionName: field('cfgConnectionName').value.trim(), adapter: selected, apiKey: field('cfgApiKey').value.trim(), baseUrl: field('cfgBaseUrl').value.trim(), model: field('cfgModel').value.trim(), temperature: Number(field('cfgTemp').value), max_tokens: Number(field('cfgMaxTokens').value), position: field('cfgPosition').value, size: field('cfgSize').value });
  const picker = window.AgentModelPicker.mount(field('cfgModelLibrary'), { getConfig: read, onSelect(model) { field('cfgModel').value = model; stopTest(); status(''); queueDraft(); } });
  // Compare only editable fields. A displayed default model is not an edit.
  function fingerprint(config, modelCatalog) {
    const values = ['connectionId', 'connectionName', 'adapter', 'apiKey', 'baseUrl', 'model', 'temperature', 'max_tokens', 'position', 'size'].map(key => config[key]);
    return JSON.stringify([values, modelCatalog?.endpoint || '', AG.modelIds(modelCatalog?.models), AG.modelIds(modelCatalog?.recent, 12), modelCatalog?.fetchedAt || 0]);
  }
  function stashCurrent() {
    clearTimeout(draftTimer);
    const config = read(), saved = AG.connection(connectionId);
    const baseline = saved && { ...AG.load(), ...saved, model: saved.model || adapters.find(a => a.id === saved.adapter).defaultModel };
    if (baseline && fingerprint(config, catalog) === fingerprint(baseline, AG.modelCatalog(saved))) drafts.delete(connectionId);
    else drafts.set(connectionId, { config, catalog });
  }
  function persistDrafts() {
    const value = { selectedConnectionId: connectionId, drafts: [...drafts] };
    window._agConnectionDraftMemory = value;
    try {
      if (drafts.size) window.AgentDrafts.write('connections', value); else window.AgentDrafts.remove('connections');
      draftError = ''; showDrafts(); return true;
    } catch (e) { draftError = e.message; showDrafts(); return false; }
  }
  function showDrafts() {
    field('cfgDraftStatus').textContent = draftError || (drafts.size ? say(`${drafts.size} 个连接有未保存修改；草稿暂存在当前标签页，关闭设置或刷新可恢复。保存仅作用于所选连接。`, `${drafts.size} connection(s) have unsaved changes. Drafts stay in this tab across closing settings and reloads. Saving affects only the selected connection.`) : say('修改按连接自动暂存在当前标签页；只有“保存并使用”会切换连接。', 'Edits are kept per connection in this tab. Only “Save and use” switches connections.'));
    field('cfgDraftStatus').classList.toggle('error', !!draftError);
    field('cfgDiscardDraft').hidden = !drafts.has(connectionId);
    connectionOptions();
  }
  function flushDrafts() { stashCurrent(); return persistDrafts(); }
  function queueDraft() { clearTimeout(draftTimer); draftTimer = setTimeout(flushDrafts, 250); }
  const version = document.querySelector('meta[name="toolkit-version"]')?.content || 'dev';
  field('cfgVersion').textContent = t('models_version') + ' · ' + (version === 'dev' ? t('models_dev') : version);
  function stopTest() {
    if (testing) { testing.controller.abort(); clearTimeout(testing.timer); testing = null; }
    field('cfgTestBtn').textContent = say('测试连接', 'Test connection');
  }
  function stopDiscovery(clearPending = true) {
    if (discovering) { discovering.controller.abort(); clearTimeout(discovering.timer); discovering = null; if (clearPending) modelStatus(''); }
    field('cfgFetchModels').textContent = t(catalog?.models?.length ? 'models_refresh' : 'models_fetch');
    field('cfgModelLibrary').setAttribute('aria-busy', 'false');
  }
  function resetModels(value = AG.modelCatalog(read())) {
    catalog = value; picker.setCatalog(catalog, true); modelStatus(''); stopDiscovery();
  }
  function endpoint() {
    let host = '';
    try {
      const url = window.AgentTransport.endpoint(selected, field('cfgBaseUrl').value);
      host = new URL(url).host; field('cfgEndpoint').textContent = 'POST ' + url;
      field('cfgModelsEndpoint').textContent = 'GET ' + window.AgentTransport.modelsEndpoint(selected, field('cfgBaseUrl').value);
    } catch (e) { field('cfgEndpoint').textContent = e.message; field('cfgModelsEndpoint').textContent = e.message; }
    field('cfgConnectionSummary').textContent = adapters.find(a => a.id === selected).name + (host ? ' · ' + host : '');
    field('cfgLocalNetworkHint').textContent = window.AgentTransport.localNetworkHint(read());
    field('cfgLocalNetworkHint').hidden = !field('cfgLocalNetworkHint').textContent;
  }
  function connectionOptions() {
    const select = field('cfgSavedConnection'); select.replaceChildren();
    const entries = new Map(AG.connections().map(c => [c.id, c]));
    for (const [id, draft] of drafts) if (id.startsWith('connection-')) entries.set(id, { id, name: draft.config.connectionName || say('未命名连接', 'Untitled connection') });
    for (const entry of entries.values()) { const option = document.createElement('option'); option.value = entry.id; option.textContent = entry.name + (entry.legacy ? say(' · 默认', ' · default') : '') + (drafts.has(entry.id) ? say(' · 未保存', ' · unsaved') : ''); select.appendChild(option); }
    select.value = connectionId;
  }
  function populate() {
    const draft = drafts.get(connectionId), p = draft?.config || AG.connection(connectionId);
    selected = p.adapter;
    connectionOptions();
    field('cfgConnectionName').value = p.connectionName || '';
    field('cfgNameRow').hidden = connectionId.startsWith('legacy-');
    field('cfgDeleteConnection').disabled = connectionId.startsWith('legacy-');
    const adapter = adapters.find(a => a.id === selected);
    field('cfgApiKey').value = p.apiKey; field('cfgApiKey').type = 'password'; field('cfgEye').setAttribute('aria-pressed', 'false');
    field('cfgEye').setAttribute('aria-label', say('显示密钥', 'Show API key'));
    field('cfgBaseUrl').value = p.baseUrl; field('cfgModel').value = p.model || adapter.defaultModel;
    field('cfgTemp').value = p.temperature; field('cfgTempVal').textContent = p.temperature;
    field('cfgMaxTokens').value = p.max_tokens;
    field('cfgPosition').value = p.position || cfg.position; field('cfgSize').value = p.size || cfg.size;
    resetModels(draft?.catalog || AG.modelCatalog(read()));
    box.querySelectorAll('[data-adapter]').forEach(button => { const active = button.dataset.adapter === selected; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    status(''); endpoint(); showDrafts();
  }
  for (const adapter of adapters) {
    const button = document.createElement('button'); button.className = 'ag-opt-btn'; button.dataset.adapter = adapter.id; button.textContent = adapter.name;
    button.onclick = () => { if (selected === adapter.id) return; stopTest(); stopDiscovery(); stashCurrent();
      if (connectionId.startsWith('legacy-')) connectionId = 'legacy-' + adapter.id;
      else drafts.set(connectionId, { config: { ...read(), adapter: adapter.id, model: adapter.defaultModel }, catalog: { models: [], recent: [] } });
      selected = adapter.id; populate(); flushDrafts(); };
    field('cfgAdapterBtns').appendChild(button);
  }
  field('cfgSavedConnection').onchange = event => {
    const nextId = event.target.value; stopTest(); stopDiscovery(); stashCurrent(); connectionId = nextId; populate(); persistDrafts();
  };
  function addConnection(copy) {
    stopTest(); stopDiscovery(); const current = read(); stashCurrent();
    if (new Set([...AG.connections().filter(c => !c.legacy).map(c => c.id), ...[...drafts.keys()].filter(id => id.startsWith('connection-'))]).size >= 20) { status(say('最多保存 20 个命名连接。', 'Up to 20 named connections.'), true); return; }
    connectionId = 'connection-' + crypto.randomUUID();
    drafts.set(connectionId, { config: { ...current, connectionId, connectionName: copy ? (current.connectionName + say(' 副本', ' copy')).slice(0, 60) : say('新连接', 'New connection'), ...(copy ? {} : { apiKey: '', baseUrl: '', model: adapters.find(a => a.id === selected).defaultModel }) }, catalog: copy ? catalog : { models: [], recent: [] } });
    populate(); persistDrafts(); field('cfgConnection').open = true; field('cfgConnectionName').focus(); field('cfgConnectionName').select();
  }
  field('cfgNewConnection').onclick = () => addConnection(false);
  field('cfgCopyConnection').onclick = () => addConnection(true);
  field('cfgDeleteConnection').onclick = () => {
    if (!confirm(say('删除这个连接及其本地密钥？', 'Delete this connection and its local API key?'))) return;
    try { clearTimeout(draftTimer); stopTest(); stopDiscovery(); AG.removeConnection(connectionId); drafts.delete(connectionId); connectionId = AG.connectionId(AG.load()); populate(); persistDrafts(); } catch (e) { status(e.message, true); }
  };
  field('cfgDiscardDraft').onclick = () => {
    if (!confirm(say('放弃此连接尚未保存的修改？', 'Discard unsaved changes to this connection?'))) return;
    clearTimeout(draftTimer); stopTest(); stopDiscovery(); drafts.delete(connectionId);
    if (!AG.connection(connectionId)) connectionId = AG.connectionId(AG.load());
    populate(); persistDrafts();
  };
  field('cfgPosition').value = cfg.position; field('cfgSize').value = cfg.size; populate();
  box.addEventListener('input', event => {
    if (['cfgModelSearch', 'cfgSavedConnection'].includes(event.target.id)) return;
    stopTest(); status(''); field('cfgTempVal').textContent = field('cfgTemp').value;
    if (['cfgApiKey', 'cfgBaseUrl'].includes(event.target.id)) { resetModels(); endpoint(); }
    if (event.target.id === 'cfgModel') picker.updateSelection();
    queueDraft();
  });
  field('cfgFetchModels').onclick = async () => {
    if (discovering) { stopDiscovery(); modelStatus(say('获取已取消。', 'Fetch cancelled.')); return; }
    stopTest();
    const config = read();
    if (!config.apiKey && selected !== 'custom') { modelStatus(say('请先填写 API Key。', 'Enter an API key first.'), true); field('cfgConnection').open = true; field('cfgApiKey').focus(); return; }
    const run = { controller: new AbortController(), timer: null }; discovering = run;
    run.timer = window.AgentTransport.timeout(run.controller, 15000);
    field('cfgFetchModels').textContent = t('models_cancel'); field('cfgModelLibrary').setAttribute('aria-busy', 'true'); modelStatus(say('正在获取模型…', 'Fetching models…')); status('');
    try {
      const models = await window.AgentTransport.wait(window.AgentTransport.listModels({ ...config, signal: run.controller.signal }), run.controller.signal);
      if (discovering !== run) return;
      catalog = { ...catalog, endpoint: window.AgentTransport.modelsEndpoint(config.adapter, config.baseUrl), models, fetchedAt: Date.now() }; picker.setCatalog(catalog);
      queueDraft();
      modelStatus(say('已获取 ', 'Fetched ') + models.length + say(' 个模型，选择后可测试连接。', ' models. Select one and test the connection.'));
    } catch (error) { if (discovering === run) modelStatus(([404, 405].includes(error.status) ? t('models_route_error') : window.AgentTransport.message(error, config)) + ' ' + t('models_failed_hint'), true); }
    finally { clearTimeout(run.timer); if (discovering === run) stopDiscovery(false); }
  };
  field('cfgEye').onclick = () => { const show = field('cfgApiKey').type === 'password'; field('cfgApiKey').type = show ? 'text' : 'password'; field('cfgEye').setAttribute('aria-pressed', String(show)); field('cfgEye').setAttribute('aria-label', show ? say('隐藏密钥', 'Hide API key') : say('显示密钥', 'Show API key')); };
  function close() {
    if (!flushDrafts()) { field('cfgDraftStatus').scrollIntoView({ block: 'nearest' }); return; }
    stopTest(); stopDiscovery(); window.removeEventListener('beforeunload', beforeLeave); window.removeEventListener('pagehide', flushDrafts); modal.remove(); releaseFocus();
  }
  function beforeLeave(event) { if (!flushDrafts()) { event.preventDefault(); event.returnValue = ''; } }
  window.addEventListener('beforeunload', beforeLeave); window.addEventListener('pagehide', flushDrafts);
  const releaseFocus = window.AgentDialog.trap(modal, box, close);
  field('cfgCloseBtn').onclick = close; field('cfgCancelBtn').onclick = close;
  field('cfgTestBtn').onclick = async () => {
    if (testing) { stopTest(); status(say('测试已取消。', 'Test cancelled.')); return; }
    stopDiscovery();
    const config = read();
    try { AG.validate(config); if (!AG.modelIds([config.model]).length) throw new Error(t('models_required')); if (!config.apiKey && selected !== 'custom') throw new Error(say('请先填写 API Key。', 'Enter an API key first.')); }
    catch (e) { status(e.message, true); return; }
    const run = { controller: new AbortController(), timer: null }; testing = run;
    run.timer = window.AgentTransport.timeout(run.controller, 20000);
    field('cfgTestBtn').textContent = say('取消测试', 'Cancel test'); status(say('正在连接…', 'Connecting…'));
    const started = performance.now();
    try {
      const result = await window.AgentTransport.wait(window.AgentAdapters.getAdapter(selected).chat({ ...config, messages: [{ role: 'user', content: 'Reply with OK.' }], tools: [], max_tokens: Math.min(config.max_tokens, 1024), signal: run.controller.signal }), run.controller.signal);
      if (testing !== run) return;
      if (result?.stop_reason === 'max_tokens') { status(say('已收到服务响应，但达到输出 Token 上限。可提高最大输出后重试；本次未验证完整对话。', 'Server responded but reached the output token limit. Increase the output limit and retry; a complete reply was not verified.'), true); return; }
      if (!result?.message || typeof result.message.content !== 'string' || !result.message.content.trim()) { status(say('已收到服务响应，但回复为空。请检查模型、协议或服务端响应格式。', 'Server responded with an empty reply. Check the model, protocol or response format.'), true); return; }
      status(say('连接成功', 'Connected') + ' · ' + ((performance.now() - started) / 1000).toFixed(1) + ' s · ' + say('已验证基础对话', 'Basic chat verified'));
    } catch (e) { if (testing === run) status(window.AgentTransport.message(e, config), true); }
    finally { clearTimeout(run.timer); if (testing === run) stopTest(); }
  };
  function save(activate) {
    try {
      const config = read(); if (!AG.modelIds([config.model]).length) { field('cfgModel').focus(); throw new Error(t('models_required')); }
      AG.save(config, catalog, { activate }); clearTimeout(draftTimer); drafts.delete(connectionId); populate(); persistDrafts();
      if (activate) close(); else status(say('此连接已保存，当前使用的连接未切换。', 'Connection saved. The active connection was not switched.'));
      window.showToast?.(t('saved'));
    }
    catch (e) { status(e.message, true); field('cfgStatus').scrollIntoView({ block: 'nearest' }); }
  }
  field('cfgSaveOnlyBtn').onclick = () => save(false);
  field('cfgSaveBtn').onclick = () => save(true);
  if (modelsOnly) picker.focus(); else field('cfgAdapterBtns').querySelector('[aria-pressed="true"]')?.focus();
}

window._agSyncModelButton = () => {
  const button = document.getElementById('agModelBtn'); if (!button) return;
  const cfg = window.AgentConfig.AG.load(), adapter = window.AgentAdapters.getAdapter(cfg.adapter);
  button.firstElementChild.textContent = cfg.model || adapter.defaultModel || '—';
  button.lastElementChild.textContent = window.AgentI18n.t('models_switch') + ' ▾';
  button.title = (cfg.connectionName || adapter.name) + ' · ' + (cfg.model || adapter.defaultModel || '—');
};
window.addEventListener('toolkit-language-change', window._agSyncModelButton);
window.addEventListener('agent-config-change', () => {
  const cfg = window.AgentConfig.AG.load();
  const panel = document.getElementById('agentPanel');
  if (panel) { panel.dataset.position = cfg.position; panel.dataset.size = cfg.size; }
  window._agSyncModelButton?.();
  if (_session && !_session._run) {
    _session.adapter = window.AgentAdapters.getAdapter(cfg.adapter); _session.config = cfg; _session._responseId = null;
  }
});
window._agOpenConfig = openConfig;
window._agOpenModelPicker = () => openConfig({ modelsOnly: true });
