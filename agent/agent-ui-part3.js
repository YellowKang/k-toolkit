'use strict';
function openConfig() {
if (document.getElementById('agConfigModal')) return;
const { AG } = window.AgentConfig;
const cfg = AG.load();
const adapters = window.AgentAdapters.listAdapters();
const t = window.AgentI18n?.t || (k => k);
const modal = document.createElement('div');
modal.id = 'agConfigModal';
const box = document.createElement('div');
box.className = 'ag-config-box';
const panelEl = document.getElementById('agentPanel');
if (panelEl) {
const ps = panelEl.style;
for (let i = 0; i < ps.length; i++) {
const prop = ps[i];
if (prop.startsWith('--ag-')) box.style.setProperty(prop, ps.getPropertyValue(prop));
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
const _isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const _mod = _isMac ? '⌘' : 'Ctrl';
box.innerHTML = `
<div class="ag-config-header">
<h3>${t('cfg_title')}</h3>
<button class="ag-config-close" id="cfgCloseBtn">✕</button>
</div>
<div class="ag-config-section">
<div class="ag-config-section-title">${t('cfg_api')}</div>
<div class="ag-config-row">
<div class="ag-config-label">${t('cfg_adapter')}</div>
<div class="ag-adapter-btns" id="cfgAdapterBtns">${adapterBtns()}</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">API Key</div>
<div class="ag-key-wrap">
<input type="password" id="cfgApiKey" value="${AG.getKey(selAdapter)}" autocomplete="off">
<button class="ag-eye-btn" onclick="(function(){var i=document.getElementById('cfgApiKey');i.type=i.type==='password'?'text':'password'})()">👁</button>
</div>
<div class="ag-hint">🔒 ${t('cfg_apikey_hint')}</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${t('cfg_baseurl')}</div>
<input type="text" id="cfgBaseUrl" value="${cfg.baseUrl || ''}" placeholder="${t('cfg_baseurl_ph')}">
</div>
<div class="ag-config-row">
<div class="ag-config-label">${t('cfg_model')}</div>
<input type="text" id="cfgModel" list="cfgModelList" value="${currentModelVal(selAdapter)}" placeholder="${t('cfg_model_ph')}">
<datalist id="cfgModelList">${modelDatalist(selAdapter)}</datalist>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${t('cfg_temp')} <span id="cfgTempVal">${cfg.temperature}</span></div>
<input class="ag-range" type="range" id="cfgTemp" min="0" max="1" step="0.1" value="${cfg.temperature}"
oninput="document.getElementById('cfgTempVal').textContent=this.value">
</div>
</div>
<div class="ag-config-section">
<div class="ag-config-section-title">${t('cfg_layout')}</div>
<div class="ag-config-row">
<div class="ag-config-label">${t('cfg_position')}</div>
<div class="ag-pos-btns">
<button class="ag-opt-btn${cfg.position==='right'?' active':''}" data-pos="right">📌 ${t('cfg_right')}</button>
<button class="ag-opt-btn${cfg.position==='left'?' active':''}" data-pos="left">📌 ${t('cfg_left')}</button>
</div>
</div>
<div class="ag-config-row">
<div class="ag-config-label">${t('cfg_size')}</div>
<div class="ag-size-btns">
<button class="ag-opt-btn${cfg.size==='compact'?' active':''}" data-sz="compact">${t('cfg_compact')}</button>
<button class="ag-opt-btn${cfg.size==='normal'?' active':''}" data-sz="normal">${t('cfg_normal')}</button>
<button class="ag-opt-btn${cfg.size==='large'?' active':''}" data-sz="large">${t('cfg_large')}</button>
</div>
</div>
</div>
<div class="ag-config-section">
<div class="ag-config-section-title">${t('cfg_shortcuts')}</div>
<div class="ag-shortcuts-grid">
<div class="ag-shortcut-item"><span>${t('cfg_sc_open')}</span><span class="ag-shortcut-key">Alt + A</span></div>
<div class="ag-shortcut-item"><span>${t('cfg_sc_quick')}</span><span class="ag-shortcut-key">${_mod} + J</span></div>
<div class="ag-shortcut-item"><span>${t('cfg_sc_send')}</span><span class="ag-shortcut-key">Enter</span></div>
<div class="ag-shortcut-item"><span>${t('cfg_sc_newline')}</span><span class="ag-shortcut-key">Shift + Enter</span></div>
<div class="ag-shortcut-item"><span>${t('cfg_sc_cmd')}</span><span class="ag-shortcut-key">${_mod} + K</span></div>
<div class="ag-shortcut-item"><span>${t('cfg_sc_close')}</span><span class="ag-shortcut-key">Esc</span></div>
</div>
</div>
<div class="ag-config-footer">
<button class="ag-btn" id="cfgCancelBtn">${t('cancel')}</button>
<button class="ag-btn" id="cfgSaveBtn" style="background:var(--accent,#6366f1);color:var(--text-on-accent,#fff)">💾 ${t('save')}</button>
</div>
`;
modal.appendChild(box);
document.body.appendChild(modal);
box.querySelector('#cfgAdapterBtns').addEventListener('click', e => {
const btn = e.target.closest('[data-adapter]');
if (!btn) return;
selAdapter = btn.dataset.adapter;
box.querySelectorAll('[data-adapter]').forEach(b => b.classList.toggle('active', b.dataset.adapter === selAdapter));
box.querySelector('#cfgApiKey').value = AG.getKey(selAdapter);
const a = window.AgentAdapters.getAdapter(selAdapter);
box.querySelector('#cfgModel').value = cfg.model || (a && a.defaultModel) || '';
box.querySelector('#cfgModelList').innerHTML = modelDatalist(selAdapter);
});
box.querySelector('#cfgCloseBtn').onclick = () => modal.remove();
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
box.querySelector('#cfgSaveBtn').onclick = () => {
const newPos  = box.querySelector('[data-pos].active')?.dataset.pos || cfg.position;
const newSz   = box.querySelector('[data-sz].active')?.dataset.sz || cfg.size;
const newModel = box.querySelector('#cfgModel')?.value.trim() || '';
const newCfg = {
adapter:     selAdapter,
apiKey:      box.querySelector('#cfgApiKey').value,
baseUrl:     box.querySelector('#cfgBaseUrl').value.trim(),
model:       newModel,
temperature: parseFloat(box.querySelector('#cfgTemp').value),
max_tokens:  cfg.max_tokens,
skin:        cfg.skin,
position:    newPos,
size:        newSz,
show_cards:  cfg.show_cards,
};
AG.save(newCfg);
if (_session) { _session.abort(); _session = null; }
modal.remove();
window.showToast && window.showToast(t('saved'));
};
box.querySelector('#cfgCancelBtn').onclick = () => modal.remove();
modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
window._agOpenConfig = openConfig;