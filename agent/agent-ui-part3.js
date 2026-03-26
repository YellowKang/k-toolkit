'use strict';
function openConfig() {
if (document.getElementById('agConfigModal')) return;
const { AG, SKINS } = window.AgentConfig;
const cfg = AG.load();
const adapters = window.AgentAdapters.listAdapters();
const isEn = (window._i18n?.lang || 'zh') === 'en';
const L = isEn ? {
title: 'Settings', api_section: 'API Config', adapter: 'Adapter',
apikey_hint: 'API Key stored locally only, never uploaded',
baseurl: 'Base URL (optional, custom proxy)', baseurl_ph: 'https://api.anthropic.com',
model: 'Model (type custom name or select)', model_ph: 'Type or select model',
temp: 'Temperature', appearance: 'Appearance', skin: 'Skin',
custom_accent: 'Custom accent color', accent_desc: 'Override current skin accent',
reset: 'Reset', position: 'Panel position', right: 'Right', left: 'Left',
size: 'Panel size', compact: 'Compact', normal: 'Normal', large: 'Large',
shortcuts: 'Shortcuts', sc_open: 'Open dialog', sc_quick: 'Quick ask',
sc_send: 'Send', sc_newline: 'New line', sc_cmd: 'Command palette', sc_close: 'Close panel',
cancel: 'Cancel', save: 'Save', saved: 'Settings saved',
} : {
title: '助手设置', api_section: '接口配置', adapter: '适配器',
apikey_hint: 'API Key 仅存储在浏览器本地，不会上传',
baseurl: 'Base URL（可选，自定义代理）', baseurl_ph: 'https://api.anthropic.com',
model: '模型（可直接输入自定义名称）', model_ph: '输入或选择模型名',
temp: '温度', appearance: '外观', skin: '皮肤',
custom_accent: '自定义主色', accent_desc: '覆盖当前皮肤强调色',
reset: '重置', position: '面板位置', right: '右侧', left: '左侧',
size: '面板尺寸', compact: '紧凑', normal: '正常', large: '大',
shortcuts: '快捷键', sc_open: '唤起对话', sc_quick: '快捷问答',
sc_send: '发送消息', sc_newline: '换行', sc_cmd: '命令面板', sc_close: '关闭面板',
cancel: '取消', save: '保存', saved: '设置已保存',
};
const modal = document.createElement('div');
modal.id = 'agConfigModal';
const box = document.createElement('div');
box.className = 'ag-config-box';
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
const _skinMeta = {
glass:    { zh: '毛玻璃', en: 'Glass',    emoji: '🪟', accent: '#6366f1' },
dark:     { zh: '深邃黑', en: 'Dark',     emoji: '🌑', accent: '#6366f1' },
light:    { zh: '纯白',   en: 'Light',    emoji: '☀️', accent: '#6366f1' },
purple:   { zh: '暗紫',   en: 'Purple',   emoji: '🔮', accent: '#a855f7' },
sakura:   { zh: '樱花',   en: 'Sakura',   emoji: '🌸', accent: '#ff6b9d' },
ocean:    { zh: '深海',   en: 'Ocean',    emoji: '🌊', accent: '#00c8ff' },
neon:     { zh: '霓虹',   en: 'Neon',     emoji: '💜', accent: '#ff00ff' },
terminal: { zh: '终端',   en: 'Terminal', emoji: '💻', accent: '#00ff41' },
};
const _isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const _mod = _isMac ? '⌘' : 'Ctrl';
function skinBtns() {
return Object.keys(SKINS).map(s => {
const m = _skinMeta[s] || { zh: s, en: s, emoji: '', accent: SKINS[s]['--ag-accent'] || '#6366f1' };
const label = isEn ? m.en : m.zh;
return `<button class="ag-skin-btn${cfg.skin===s?' active':''}" data-skin="${s}">
<span class="ag-skin-dot" style="background:${m.accent}"></span>${m.emoji} ${label}
</button>`;
}).join('');
}
box.innerHTML = `
<div class="ag-config-header">
<h3>⚙️ ${L.title}</h3>
<button class="ag-config-close" id="cfgCloseBtn">✕</button>
</div>
<div class="ag-config-section">
<div class="ag-config-section-title">🔌 ${L.api_section}</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.adapter}</div>
<div class="ag-adapter-btns" id="cfgAdapterBtns">${adapterBtns()}</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">API Key</div>
<div class="ag-key-wrap">
<input type="password" id="cfgApiKey" value="${AG.getKey(selAdapter)}" autocomplete="off">
<button class="ag-eye-btn" onclick="(function(){var i=document.getElementById('cfgApiKey');i.type=i.type==='password'?'text':'password'})()">👁</button>
</div>
<div class="ag-hint">🔒 ${L.apikey_hint}</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.baseurl}</div>
<input type="text" id="cfgBaseUrl" value="${cfg.baseUrl || ''}" placeholder="${L.baseurl_ph}">
</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.model}</div>
<input type="text" id="cfgModel" list="cfgModelList" value="${currentModelVal(selAdapter)}" placeholder="${L.model_ph}">
<datalist id="cfgModelList">${modelDatalist(selAdapter)}</datalist>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.temp} <span id="cfgTempVal">${cfg.temperature}</span></div>
<input class="ag-range" type="range" id="cfgTemp" min="0" max="1" step="0.1" value="${cfg.temperature}"
oninput="document.getElementById('cfgTempVal').textContent=this.value">
</div>
</div>
<div class="ag-config-section">
<div class="ag-config-section-title">🎨 ${L.appearance}</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.skin}</div>
<div class="ag-skin-btns" id="cfgSkinBtns">${skinBtns()}</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.custom_accent}</div>
<div class="ag-color-row">
<input type="color" id="cfgAccentColor" value="${SKINS[cfg.skin]?.['--ag-accent'] || '#6366f1'}">
<span style="font-size:12px;color:var(--ag-text2,#94a3b8)">${L.accent_desc}</span>
<button class="ag-btn" id="cfgResetColor" style="margin-left:auto">${L.reset}</button>
</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.position}</div>
<div class="ag-pos-btns">
<button class="ag-opt-btn${cfg.position==='right'?' active':''}" data-pos="right">📌 ${L.right}</button>
<button class="ag-opt-btn${cfg.position==='left'?' active':''}" data-pos="left">📌 ${L.left}</button>
</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${L.size}</div>
<div class="ag-size-btns">
<button class="ag-opt-btn${cfg.size==='compact'?' active':''}" data-sz="compact">${L.compact}</button>
<button class="ag-opt-btn${cfg.size==='normal'?' active':''}" data-sz="normal">${L.normal}</button>
<button class="ag-opt-btn${cfg.size==='large'?' active':''}" data-sz="large">${L.large}</button>
</div>
</div>
</div>
<div class="ag-config-section">
<div class="ag-config-section-title">⌨️ ${L.shortcuts}</div>
<div class="ag-shortcuts-grid">
<div class="ag-shortcut-item"><span>${L.sc_open}</span><span class="ag-shortcut-key">Alt + A</span></div>
<div class="ag-shortcut-item"><span>${L.sc_quick}</span><span class="ag-shortcut-key">${_mod} + J</span></div>
<div class="ag-shortcut-item"><span>${L.sc_send}</span><span class="ag-shortcut-key">Enter</span></div>
<div class="ag-shortcut-item"><span>${L.sc_newline}</span><span class="ag-shortcut-key">Shift + Enter</span></div>
<div class="ag-shortcut-item"><span>${L.sc_cmd}</span><span class="ag-shortcut-key">${_mod} + K</span></div>
<div class="ag-shortcut-item"><span>${L.sc_close}</span><span class="ag-shortcut-key">Esc</span></div>
</div>
</div>
<div class="ag-config-footer">
<button class="ag-btn" id="cfgCancelBtn">${L.cancel}</button>
<button class="ag-btn" id="cfgSaveBtn" style="background:var(--ag-accent,#6366f1);color:var(--ag-accent-text,#fff)">💾 ${L.save}</button>
</div>
`;
modal.appendChild(box);
document.body.appendChild(modal);
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
document.getElementById('cfgCloseBtn').onclick = () => modal.remove();
box.querySelector('#cfgSkinBtns').addEventListener('click', e => {
const btn = e.target.closest('[data-skin]');
if (!btn) return;
box.querySelectorAll('[data-skin]').forEach(b => b.classList.toggle('active', b.dataset.skin === btn.dataset.skin));
window.AgentConfig.applySkin(btn.dataset.skin);
const vars = window.AgentConfig.SKINS[btn.dataset.skin];
if (vars) document.getElementById('cfgAccentColor').value = vars['--ag-accent'] || '#6366f1';
});
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
box.querySelectorAll('[data-pos]').forEach(btn => {
btn.addEventListener('click', () => {
box.querySelectorAll('[data-pos]').forEach(b => b.classList.toggle('active', b === btn));
const panel = document.getElementById('agentPanel');
if (panel) panel.setAttribute('data-position', btn.dataset.pos);
});
});
box.querySelectorAll('[data-sz]').forEach(btn => {
btn.addEventListener('click', () => {
box.querySelectorAll('[data-sz]').forEach(b => b.classList.toggle('active', b === btn));
const panel = document.getElementById('agentPanel');
if (panel) panel.setAttribute('data-size', btn.dataset.sz);
});
});
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
if (_session) { _session.abort(); _session = null; }
modal.remove();
window.showToast && window.showToast(L.saved);
};
document.getElementById('cfgCancelBtn').onclick = () => modal.remove();
modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
window._agOpenConfig = openConfig;