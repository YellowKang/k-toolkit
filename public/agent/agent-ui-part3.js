'use strict';

// ── Config modal ────────────────────────────────────────────────
function openConfig() {
  if (document.getElementById('agConfigModal')) return;
  const { AG, SKINS } = window.AgentConfig;
  const cfg = AG.load();
  const adapters = window.AgentAdapters.listAdapters();

  const modal = document.createElement('div');
  modal.id = 'agConfigModal';

  const box = document.createElement('div');
  box.className = 'ag-config-box';

  // Apply skin vars to modal box too
  const panelEl = document.getElementById('agentPanel');
  if (panelEl) {
    for (const [k, v] of Object.entries(window.AgentConfig.SKINS[cfg.skin] || {})) {
      box.style.setProperty(k, v);
    }
  }

  let selAdapter = cfg.adapter;

  function adapterBtns() {
    return adapters.map(a =>
      `<button class="ag-opt-btn${selAdapter===a.id?' active':''}" data-adapter="${a.id}">${a.name}</button>`
    ).join('');
  }

  function modelDatalist(adapterId) {
    const a = window.AgentAdapters.getAdapter(adapterId);
    if (!a || !a.models || !a.models.length) return '';
    return a.models.map(m => `<option value="${m}">`).join('');
  }

  function currentModelVal(adapterId) {
    const a = window.AgentAdapters.getAdapter(adapterId);
    return cfg.model || (a && a.defaultModel) || '';
  }

  // Skin display metadata: label, emoji, accent color
  const _skinMeta = {
    glass:    { label: '毛玻璃', emoji: '🪟', accent: '#6366f1' },
    dark:     { label: '深邃黑', emoji: '🌑', accent: '#6366f1' },
    light:    { label: '纯白',   emoji: '☀️', accent: '#6366f1' },
    purple:   { label: '暗紫',   emoji: '🔮', accent: '#a855f7' },
    sakura:   { label: '樱花',   emoji: '🌸', accent: '#ff6b9d' },
    ocean:    { label: '深海',   emoji: '🌊', accent: '#00c8ff' },
    neon:     { label: '霓虹',   emoji: '💜', accent: '#ff00ff' },
    terminal: { label: '终端',   emoji: '💻', accent: '#00ff41' },
  };

  const _isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const _mod = _isMac ? '⌘' : 'Ctrl';

  function skinBtns() {
    return Object.keys(SKINS).map(s => {
      const m = _skinMeta[s] || { label: s, emoji: '', accent: SKINS[s]['--ag-accent'] || '#6366f1' };
      return `<button class="ag-skin-btn${cfg.skin===s?' active':''}" data-skin="${s}">
        <span class="ag-skin-dot" style="background:${m.accent}"></span>${m.emoji} ${m.label}
      </button>`;
    }).join('');
  }

  box.innerHTML = `
    <div class="ag-config-header">
      <h3>⚙️ 助手设置</h3>
      <button class="ag-config-close" id="cfgCloseBtn">✕</button>
    </div>

    <!-- 接口配置 -->
    <div class="ag-config-section">
      <div class="ag-config-section-title">🔌 接口配置</div>

      <div class="ag-config-row">
        <div class="ag-config-label">适配器</div>
        <div class="ag-adapter-btns" id="cfgAdapterBtns">${adapterBtns()}</div>
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">API Key</div>
        <div class="ag-key-wrap">
          <input type="password" id="cfgApiKey" value="${AG.getKey(selAdapter)}" autocomplete="off">
          <button class="ag-eye-btn" onclick="(function(){var i=document.getElementById('cfgApiKey');i.type=i.type==='password'?'text':'password'})()">👁</button>
        </div>
        <div class="ag-hint">🔒 API Key 仅存储在浏览器本地，不会上传</div>
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">Base URL（可选，自定义代理）</div>
        <input type="text" id="cfgBaseUrl" value="${cfg.baseUrl || ''}" placeholder="https://api.anthropic.com">
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">模型（可直接输入自定义名称）</div>
        <input type="text" id="cfgModel" list="cfgModelList" value="${currentModelVal(selAdapter)}" placeholder="输入或选择模型名">
        <datalist id="cfgModelList">${modelDatalist(selAdapter)}</datalist>
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">温度 <span id="cfgTempVal">${cfg.temperature}</span></div>
        <input class="ag-range" type="range" id="cfgTemp" min="0" max="1" step="0.1" value="${cfg.temperature}"
          oninput="document.getElementById('cfgTempVal').textContent=this.value">
      </div>
    </div>

    <!-- 外观 -->
    <div class="ag-config-section">
      <div class="ag-config-section-title">🎨 外观</div>

      <div class="ag-config-row">
        <div class="ag-config-label">皮肤</div>
        <div class="ag-skin-btns" id="cfgSkinBtns">${skinBtns()}</div>
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">自定义主色</div>
        <div class="ag-color-row">
          <input type="color" id="cfgAccentColor" value="${SKINS[cfg.skin]?.['--ag-accent'] || '#6366f1'}">
          <span style="font-size:12px;color:var(--ag-text2,#94a3b8)">覆盖当前皮肤强调色</span>
          <button class="ag-btn" id="cfgResetColor" style="margin-left:auto">重置</button>
        </div>
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">面板位置</div>
        <div class="ag-pos-btns">
          <button class="ag-opt-btn${cfg.position==='right'?' active':''}" data-pos="right">📌 右侧</button>
          <button class="ag-opt-btn${cfg.position==='left'?' active':''}" data-pos="left">📌 左侧</button>
        </div>
      </div>

      <div class="ag-config-row">
        <div class="ag-config-label">面板尺寸</div>
        <div class="ag-size-btns">
          <button class="ag-opt-btn${cfg.size==='compact'?' active':''}" data-sz="compact">紧凑</button>
          <button class="ag-opt-btn${cfg.size==='normal'?' active':''}" data-sz="normal">正常</button>
          <button class="ag-opt-btn${cfg.size==='large'?' active':''}" data-sz="large">大</button>
        </div>
      </div>
    </div>

    <!-- 快捷键 -->
    <div class="ag-config-section">
      <div class="ag-config-section-title">⌨️ 快捷键</div>
      <div class="ag-shortcuts-grid">
        <div class="ag-shortcut-item"><span>唤起对话</span><span class="ag-shortcut-key">Alt + A</span></div>
        <div class="ag-shortcut-item"><span>快捷问答</span><span class="ag-shortcut-key">${_mod} + J</span></div>
        <div class="ag-shortcut-item"><span>发送消息</span><span class="ag-shortcut-key">Enter</span></div>
        <div class="ag-shortcut-item"><span>换行</span><span class="ag-shortcut-key">Shift + Enter</span></div>
        <div class="ag-shortcut-item"><span>命令面板</span><span class="ag-shortcut-key">${_mod} + K</span></div>
        <div class="ag-shortcut-item"><span>关闭面板</span><span class="ag-shortcut-key">Esc</span></div>
      </div>
    </div>

    <div class="ag-config-footer">
      <button class="ag-btn" id="cfgCancelBtn">取消</button>
      <button class="ag-btn" id="cfgSaveBtn" style="background:var(--ag-accent,#6366f1);color:var(--ag-accent-text,#fff)">💾 保存</button>
    </div>
  `;

  modal.appendChild(box);
  document.body.appendChild(modal);

  // Adapter buttons
  box.querySelector('#cfgAdapterBtns').addEventListener('click', e => {
    const btn = e.target.closest('[data-adapter]');
    if (!btn) return;
    selAdapter = btn.dataset.adapter;
    box.querySelectorAll('[data-adapter]').forEach(b => b.classList.toggle('active', b.dataset.adapter === selAdapter));
    document.getElementById('cfgApiKey').value = AG.getKey(selAdapter);
    const a = window.AgentAdapters.getAdapter(selAdapter);
    document.getElementById('cfgModel').value = cfg.model || (a && a.defaultModel) || '';
    document.getElementById('cfgModelList').innerHTML = modelDatalist(selAdapter);
  });

  // Close button
  document.getElementById('cfgCloseBtn').onclick = () => modal.remove();

  // Skin buttons
  box.querySelector('#cfgSkinBtns').addEventListener('click', e => {
    const btn = e.target.closest('[data-skin]');
    if (!btn) return;
    box.querySelectorAll('[data-skin]').forEach(b => b.classList.toggle('active', b.dataset.skin === btn.dataset.skin));
    window.AgentConfig.applySkin(btn.dataset.skin);
    // sync color picker to new skin accent
    const vars = window.AgentConfig.SKINS[btn.dataset.skin];
    if (vars) document.getElementById('cfgAccentColor').value = vars['--ag-accent'] || '#6366f1';
  });

  // Custom accent color
  document.getElementById('cfgAccentColor').addEventListener('input', e => {
    const panel = document.getElementById('agentPanel');
    if (panel) panel.style.setProperty('--ag-accent', e.target.value);
  });
  document.getElementById('cfgResetColor').addEventListener('click', () => {
    const activeSkin = box.querySelector('#cfgSkinBtns .active')?.dataset.skin || cfg.skin;
    const vars = window.AgentConfig.SKINS[activeSkin];
    const accent = vars?.['--ag-accent'] || '#6366f1';
    document.getElementById('cfgAccentColor').value = accent;
    const panel = document.getElementById('agentPanel');
    if (panel) panel.style.setProperty('--ag-accent', accent);
  });

  // Position buttons
  box.querySelectorAll('[data-pos]').forEach(btn => {
    btn.addEventListener('click', () => {
      box.querySelectorAll('[data-pos]').forEach(b => b.classList.toggle('active', b === btn));
      const panel = document.getElementById('agentPanel');
      if (panel) panel.setAttribute('data-position', btn.dataset.pos);
    });
  });

  // Size buttons
  box.querySelectorAll('[data-sz]').forEach(btn => {
    btn.addEventListener('click', () => {
      box.querySelectorAll('[data-sz]').forEach(b => b.classList.toggle('active', b === btn));
      const panel = document.getElementById('agentPanel');
      if (panel) panel.setAttribute('data-size', btn.dataset.sz);
    });
  });

  // Save
  document.getElementById('cfgSaveBtn').onclick = () => {
    const newSkin = box.querySelector('#cfgSkinBtns .active')?.dataset.skin || cfg.skin;
    const newPos  = box.querySelector('[data-pos].active')?.dataset.pos || cfg.position;
    const newSz   = box.querySelector('[data-sz].active')?.dataset.sz || cfg.size;
    const newModel = document.getElementById('cfgModel')?.value.trim() || '';
    const newCfg = {
      adapter:     selAdapter,
      apiKey:      document.getElementById('cfgApiKey').value,
      baseUrl:     document.getElementById('cfgBaseUrl').value.trim(),
      model:       newModel,
      temperature: parseFloat(document.getElementById('cfgTemp').value),
      max_tokens:  cfg.max_tokens,
      skin:        newSkin,
      position:    newPos,
      size:        newSz,
      show_cards:  cfg.show_cards,
    };
    AG.save(newCfg);
    // Reset session with new config
    if (_session) { _session.abort(); _session = null; }
    modal.remove();
    window.showToast && window.showToast('设置已保存');
  };

  document.getElementById('cfgCancelBtn').onclick = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

window._agOpenConfig = openConfig;
