'use strict';

// One settings surface for the panel, quick assistant and AI chat.
function openConfig() {
  if (document.getElementById('agConfigModal')) return;
  window._agInjectCSS?.();
  const { AG } = window.AgentConfig;
  const cfg = AG.load(), drafts = new Map();
  const adapters = window.AgentAdapters.listAdapters();
  const t = window.AgentI18n?.t || (k => k);
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  const previousFocus = document.activeElement;
  let selected = cfg.adapter, testing = null, discovering = null;
  const modal = document.createElement('div'); modal.id = 'agConfigModal';
  const box = document.createElement('div'); box.className = 'ag-config-box';
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'cfgTitle');
  // Only static/localized labels enter HTML; all saved values use DOM properties.
  box.innerHTML = `
    <div class="ag-config-header"><h3 id="cfgTitle">${say('AI 连接设置', 'AI connection settings')}</h3><button class="ag-config-close" id="cfgCloseBtn" aria-label="${t('close')}">✕</button></div>
    <div class="ag-config-section">
      <p class="ag-hint">${say('Agent、快捷助手和 AI 对话共用；各服务商分别保存。', 'Shared by Agent, quick assistant and AI chat. Each provider has its own settings.')}</p>
      <div class="ag-config-row"><div class="ag-config-label">${t('cfg_adapter')}</div><div class="ag-adapter-btns" id="cfgAdapterBtns"></div></div>
      <div class="ag-config-row"><label class="ag-config-label" for="cfgApiKey">API Key</label><div class="ag-key-wrap"><input type="password" id="cfgApiKey" autocomplete="off" spellcheck="false"><button class="ag-eye-btn" id="cfgEye" aria-label="${say('显示密钥', 'Show API key')}" aria-pressed="false">◉</button></div><div class="ag-hint">${say('保存在当前浏览器。自定义的无认证本地服务可留空。', 'Saved in this browser. Optional for a custom local server without authentication.')}</div></div>
      <div class="ag-config-row"><label class="ag-config-label" for="cfgBaseUrl">Base URL</label><input type="url" id="cfgBaseUrl" placeholder="${say('留空使用官方地址', 'Leave blank for the official endpoint')}" spellcheck="false"><div class="ag-hint">${say('支持域名、/v1 或完整接口路径', 'Accepts an origin, /v1 or a full endpoint')}</div><code id="cfgEndpoint" class="ag-endpoint"></code></div>
      <div class="ag-config-row"><label class="ag-config-label" for="cfgModel">${t('cfg_model')}</label><div class="ag-model-picker"><input id="cfgModel" list="cfgModelList" autocomplete="off" spellcheck="false"><button class="ag-btn" id="cfgFetchModels">${say('获取模型', 'Fetch models')}</button></div><datalist id="cfgModelList"></datalist><select id="cfgRemoteModel" aria-label="${say('接口返回的模型', 'Models returned by the API')}" hidden></select><div class="ag-hint">${say('可手动填写，也可从接口获取。列表中的模型仍需测试是否可用。', 'Enter a name or fetch models from the API. Listed models still need a connection test.')}</div></div>
      <details class="ag-config-advanced"><summary>${say('生成参数与面板布局', 'Generation and panel layout')}</summary>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgTemp">${t('cfg_temp')} <span id="cfgTempVal"></span></label><input type="range" id="cfgTemp" min="0" max="1" step="0.1"></div>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgMaxTokens">${say('最大输出 Token', 'Maximum output tokens')}</label><input id="cfgMaxTokens" type="number" min="1" max="128000" step="1"></div>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgPosition">${t('cfg_position')}</label><select id="cfgPosition"><option value="right">${t('cfg_right')}</option><option value="left">${t('cfg_left')}</option></select></div>
        <div class="ag-config-row"><label class="ag-config-label" for="cfgSize">${t('cfg_size')}</label><select id="cfgSize"><option value="compact">${t('cfg_compact')}</option><option value="normal">${t('cfg_normal')}</option><option value="large">${t('cfg_large')}</option></select></div>
      </details>
      <div class="ag-connection-test"><button class="ag-btn" id="cfgTestBtn">${say('测试连接', 'Test connection')}</button><span class="ag-hint">${say('发送一条短消息，可能产生少量费用。', 'Sends a short message; a small usage charge may apply.')}</span></div>
      <p id="cfgStatus" role="status" aria-live="polite"></p>
    </div>
    <div class="ag-config-footer"><button class="ag-btn" id="cfgCancelBtn">${t('cancel')}</button><button class="ag-btn" id="cfgSaveBtn">${say('保存并使用', 'Save and use')}</button></div>`;
  modal.appendChild(box); document.body.appendChild(modal);
  window.AgentConfig.applySkin(cfg.skin);
  const field = id => box.querySelector('#' + id);
  const status = (message, error = false) => { field('cfgStatus').textContent = message; field('cfgStatus').classList.toggle('error', error); };
  const read = () => ({ ...cfg, adapter: selected, apiKey: field('cfgApiKey').value.trim(), baseUrl: field('cfgBaseUrl').value.trim(), model: field('cfgModel').value.trim(), temperature: Number(field('cfgTemp').value), max_tokens: Number(field('cfgMaxTokens').value), position: field('cfgPosition').value, size: field('cfgSize').value });
  function stopTest() {
    if (testing) { testing.controller.abort(); clearTimeout(testing.timer); testing = null; }
    field('cfgTestBtn').textContent = say('测试连接', 'Test connection');
  }
  function stopDiscovery() {
    if (discovering) { discovering.controller.abort(); clearTimeout(discovering.timer); discovering = null; }
    field('cfgFetchModels').textContent = say('获取模型', 'Fetch models');
  }
  function resetModels() {
    field('cfgRemoteModel').hidden = true; field('cfgRemoteModel').replaceChildren();
    const adapter = adapters.find(a => a.id === selected);
    field('cfgModelList').replaceChildren(...(adapter.models || []).map(model => { const option = document.createElement('option'); option.value = model; return option; }));
  }
  function endpoint() {
    try { field('cfgEndpoint').textContent = window.AgentTransport.endpoint(selected, field('cfgBaseUrl').value); }
    catch (e) { field('cfgEndpoint').textContent = e.message; }
  }
  function populate() {
    const p = drafts.get(selected) || AG.profile(selected);
    const adapter = adapters.find(a => a.id === selected);
    field('cfgApiKey').value = p.apiKey; field('cfgApiKey').type = 'password'; field('cfgEye').setAttribute('aria-pressed', 'false');
    field('cfgEye').setAttribute('aria-label', say('显示密钥', 'Show API key'));
    field('cfgBaseUrl').value = p.baseUrl; field('cfgModel').value = p.model || adapter.defaultModel;
    field('cfgTemp').value = p.temperature; field('cfgTempVal').textContent = p.temperature;
    field('cfgMaxTokens').value = p.max_tokens;
    resetModels();
    box.querySelectorAll('[data-adapter]').forEach(button => { const active = button.dataset.adapter === selected; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    status(''); endpoint();
  }
  for (const adapter of adapters) {
    const button = document.createElement('button'); button.className = 'ag-opt-btn'; button.dataset.adapter = adapter.id; button.textContent = adapter.name;
    button.onclick = () => { if (selected === adapter.id) return; stopTest(); stopDiscovery(); drafts.set(selected, read()); selected = adapter.id; populate(); };
    field('cfgAdapterBtns').appendChild(button);
  }
  field('cfgPosition').value = cfg.position; field('cfgSize').value = cfg.size; populate();
  box.addEventListener('input', event => {
    stopTest(); stopDiscovery(); status(''); endpoint(); field('cfgTempVal').textContent = field('cfgTemp').value;
    if (['cfgApiKey', 'cfgBaseUrl'].includes(event.target.id)) resetModels();
  });
  field('cfgRemoteModel').onchange = () => { if (field('cfgRemoteModel').value) { field('cfgModel').value = field('cfgRemoteModel').value; stopTest(); status(''); } };
  field('cfgFetchModels').onclick = async () => {
    if (discovering) { stopDiscovery(); status(say('获取已取消。', 'Fetch cancelled.')); return; }
    stopTest();
    const config = read();
    if (!config.apiKey && selected !== 'custom') { status(say('请先填写 API Key。', 'Enter an API key first.'), true); return; }
    const run = { controller: new AbortController(), timer: null }; discovering = run;
    run.timer = window.AgentTransport.timeout(run.controller, 15000);
    field('cfgFetchModels').textContent = say('取消获取', 'Cancel fetch'); status(say('正在获取模型…', 'Fetching models…'));
    try {
      const models = await window.AgentTransport.wait(window.AgentTransport.listModels({ ...config, signal: run.controller.signal }), run.controller.signal);
      if (discovering !== run) return;
      const options = models.map(model => { const option = document.createElement('option'); option.value = model; option.textContent = model; return option; });
      field('cfgModelList').replaceChildren(...options.map(option => option.cloneNode(true)));
      const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = say('选择接口模型…', 'Select an API model…');
      field('cfgRemoteModel').replaceChildren(placeholder, ...options); field('cfgRemoteModel').hidden = false;
      field('cfgRemoteModel').value = models.includes(config.model) ? config.model : '';
      status(say('已获取 ', 'Fetched ') + models.length + say(' 个模型，选择后可测试连接。', ' models. Select one and test the connection.'));
    } catch (error) { if (discovering === run) status(window.AgentTransport.message(error), true); }
    finally { clearTimeout(run.timer); if (discovering === run) stopDiscovery(); }
  };
  field('cfgEye').onclick = () => { const show = field('cfgApiKey').type === 'password'; field('cfgApiKey').type = show ? 'text' : 'password'; field('cfgEye').setAttribute('aria-pressed', String(show)); field('cfgEye').setAttribute('aria-label', show ? say('隐藏密钥', 'Hide API key') : say('显示密钥', 'Show API key')); };
  function close() { stopTest(); stopDiscovery(); modal.remove(); if (previousFocus?.isConnected) previousFocus.focus(); }
  field('cfgCloseBtn').onclick = close; field('cfgCancelBtn').onclick = close;
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.isComposing) { event.preventDefault(); event.stopPropagation(); close(); }
    if (event.key === 'Tab') {
      const focusable = [...box.querySelectorAll('button,input,select,summary')].filter(el => !el.disabled && el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  field('cfgTestBtn').onclick = async () => {
    if (testing) { stopTest(); status(say('测试已取消。', 'Test cancelled.')); return; }
    stopDiscovery();
    const config = read();
    try { AG.validate(config); if (!config.apiKey && selected !== 'custom') throw new Error(say('请先填写 API Key。', 'Enter an API key first.')); }
    catch (e) { status(e.message, true); return; }
    const run = { controller: new AbortController(), timer: null }; testing = run;
    run.timer = window.AgentTransport.timeout(run.controller, 20000);
    field('cfgTestBtn').textContent = say('取消测试', 'Cancel test'); status(say('正在连接…', 'Connecting…'));
    const started = performance.now();
    try {
      const result = await window.AgentTransport.wait(window.AgentAdapters.getAdapter(selected).chat({ ...config, messages: [{ role: 'user', content: 'Reply with OK.' }], tools: [], max_tokens: Math.min(config.max_tokens, 64), signal: run.controller.signal }), run.controller.signal);
      if (testing !== run) return;
      if (!result?.message || typeof result.message.content !== 'string' || !result.message.content.trim()) throw new Error('Invalid response');
      status(say('连接成功', 'Connected') + ' · ' + ((performance.now() - started) / 1000).toFixed(1) + ' s · ' + say('已验证基础对话', 'Basic chat verified'));
    } catch (e) { if (testing === run) status(window.AgentTransport.message(e), true); }
    finally { clearTimeout(run.timer); if (testing === run) stopTest(); }
  };
  field('cfgSaveBtn').onclick = () => {
    try { AG.save(read()); close(); window.showToast?.(t('saved')); }
    catch (e) { status(e.message, true); }
  };
  field('cfgAdapterBtns').querySelector('[aria-pressed="true"]')?.focus();
}

window.addEventListener('agent-config-change', () => {
  const cfg = window.AgentConfig.AG.load();
  const panel = document.getElementById('agentPanel');
  if (panel) { panel.dataset.position = cfg.position; panel.dataset.size = cfg.size; }
  if (_session && !_session._run) {
    _session.adapter = window.AgentAdapters.getAdapter(cfg.adapter); _session.config = cfg; _session._responseId = null;
  }
});
window._agOpenConfig = openConfig;
