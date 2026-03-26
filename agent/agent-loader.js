'use strict';
const AG_SCRIPT_GROUPS = [
[
'agent/adapters/claude.js',
'agent/adapters/openai-chat.js',
'agent/adapters/openai-response.js',
'agent/adapters/gemini.js',
'agent/adapters/custom.js',
'agent/actions/text.js',
'agent/actions/dev.js',
'agent/actions/calc.js',
'agent/actions/nav.js',
'agent/actions/composite.js',
'agent/actions/convert.js',
'agent/actions/css-gen.js',
'agent/agent-cmd-parser.js',
'agent/agent-skills.js',
'agent/agent-plugin.js',
'agent/agent-config.js',
],
[
'agent/adapters/index.js',
'agent/actions/index.js',
'agent/agent-core.js',
],
[
'agent/agent-router.js',
'agent/agent-autonomy.js',
],
[
'agent/agent-ui.js',
'agent/agent-ui-part2.js',
'agent/agent-ui-part3.js',
],
];
function loadScript(src) {
return new Promise((resolve, reject) => {
const s = document.createElement('script');
s.src = src;
s.onload = resolve;
s.onerror = () => reject(new Error('Failed to load: ' + src));
document.head.appendChild(s);
});
}
async function loadAgentScripts() {
for (const group of AG_SCRIPT_GROUPS) {
await Promise.all(group.map(loadScript));
}
window.AgentAdapters.registerAdapters();
window.AgentActions.registerActions();
window._agNotifyReady && window._agNotifyReady();
}
const _isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const _modKey = _isMac ? 'metaKey' : 'ctrlKey';
const _modLabel = _isMac ? '⌘' : 'Ctrl';
(function initAgentFab() {
let loaded = false;
const fabStyle = document.createElement('style');
fabStyle.textContent = `
#agentFab{position:fixed!important;z-index:9999!important;width:48px;height:48px;border-radius:50%;border:none;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 16px rgba(99,102,241,.4);display:flex!important;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;touch-action:none;user-select:none;-webkit-user-select:none}
#agentFab:hover{box-shadow:0 8px 24px rgba(99,102,241,.5)}
#agentFab.loading{opacity:.7;cursor:wait}
#agentFab.dragging{transform:scale(1.12)!important;box-shadow:0 12px 32px rgba(99,102,241,.6)!important;cursor:grabbing;transition:none}
#agentFab .fab-tooltip{position:absolute;bottom:56px;right:0;background:rgba(15,23,42,.95);color:#e2e8f0;font-size:11px;padding:4px 10px;border-radius:6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s;border:1px solid rgba(255,255,255,.1)}
#agentFab:hover .fab-tooltip{opacity:1}
`;
document.head.appendChild(fabStyle);
const fab = document.createElement('button');
fab.id = 'agentFab';
fab.title = '';
fab.innerHTML = '🤖<span class="fab-tooltip">' + _modLabel + '+J quick · Alt+A panel</span>';
const _fabPosKey = 'ag_fab_pos';
function _loadFabPos() {
try { return JSON.parse(localStorage.getItem(_fabPosKey)); } catch { return null; }
}
function _saveFabPos(x, y) {
try { localStorage.setItem(_fabPosKey, JSON.stringify({ x, y })); } catch {}
}
function _applyFabPos() {
const pos = _loadFabPos();
if (pos) {
fab.style.right = 'auto';
fab.style.bottom = 'auto';
fab.style.left = Math.min(pos.x, window.innerWidth - 56) + 'px';
fab.style.top = Math.min(pos.y, window.innerHeight - 56) + 'px';
} else {
fab.style.bottom = '80px';
fab.style.right = '20px';
}
}
_applyFabPos();
let _fabDrag = { active: false, startX: 0, startY: 0, moved: false };
fab.addEventListener('pointerdown', e => {
if (e.button !== 0) return;
_fabDrag = { active: true, startX: e.clientX, startY: e.clientY, moved: false };
fab.setPointerCapture(e.pointerId);
e.preventDefault();
});
fab.addEventListener('pointermove', e => {
if (!_fabDrag.active) return;
const dx = e.clientX - _fabDrag.startX;
const dy = e.clientY - _fabDrag.startY;
if (!_fabDrag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
_fabDrag.moved = true;
fab.classList.add('dragging');
let x = e.clientX - 24, y = e.clientY - 24;
x = Math.max(0, Math.min(window.innerWidth - 48, x));
y = Math.max(0, Math.min(window.innerHeight - 48, y));
fab.style.right = 'auto';
fab.style.bottom = 'auto';
fab.style.left = x + 'px';
fab.style.top = y + 'px';
});
fab.addEventListener('pointerup', e => {
if (!_fabDrag.active) return;
fab.classList.remove('dragging');
if (_fabDrag.moved) {
const r = fab.getBoundingClientRect();
_saveFabPos(r.left, r.top);
} else {
openAgent();
}
_fabDrag.active = false;
});
window.addEventListener('resize', () => {
const pos = _loadFabPos();
if (pos) {
fab.style.left = Math.min(pos.x, window.innerWidth - 56) + 'px';
fab.style.top = Math.min(pos.y, window.innerHeight - 56) + 'px';
}
});
(document.body ? Promise.resolve() : new Promise(r => document.addEventListener('DOMContentLoaded', r)))
.then(() => document.body.appendChild(fab));
async function ensureLoaded() {
if (loaded) return true;
fab.classList.add('loading');
fab.textContent = '⏳';
try {
await loadAgentScripts();
loaded = true;
} catch (e) {
fab.textContent = '🤖';
fab.classList.remove('loading');
alert('助手加载失败: ' + e.message);
return false;
}
fab.textContent = '🤖';
fab.classList.remove('loading');
return true;
}
async function openAgent() {
const panel = document.getElementById('agentPanel');
if (panel) {
panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
if (panel.style.display === 'flex') {
const input = document.getElementById('agInput');
if (input) input.focus();
}
return;
}
if (!await ensureLoaded()) return;
window._agInjectCSS && window._agInjectCSS();
window._agBuildPanel && window._agBuildPanel();
const input = document.getElementById('agInput');
if (input) input.focus();
}
let _miniSession = null;
let _miniThinkingEl = null;
function _miniEsc(t) {
return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _miniScrollBottom() {
const msgs = document.getElementById('agMiniMessages');
if (msgs) msgs.scrollTop = msgs.scrollHeight;
}
function _miniAppendBubble(cls, html) {
const msgs = document.getElementById('agMiniMessages');
if (!msgs) return null;
const el = document.createElement('div');
el.className = 'ag-mini-bubble ' + cls;
el.innerHTML = html;
msgs.appendChild(el);
_miniScrollBottom();
return el;
}
function _miniRemoveThinking() {
if (_miniThinkingEl && _miniThinkingEl.parentNode) {
_miniThinkingEl.remove();
}
_miniThinkingEl = null;
}
function _miniSend() {
const input = document.getElementById('agMiniInput');
if (!input || input.disabled) return;
const text = input.value.trim();
if (!text) return;
input.value = '';
input.disabled = true;
const sendBtn = document.getElementById('agMiniSendBtn');
if (sendBtn) sendBtn.disabled = true;
_miniAppendBubble('user', _miniEsc(text));
if (window.initAgentRouter && _miniSession && !_miniSession._routerInit) {
window.initAgentRouter(_miniSession);
_miniSession._routerInit = true;
}
if (_miniSession) _miniSession.send(text);
}
async function openMini() {
if (document.getElementById('agMiniOverlay')) { closeMini(); return; }
if (!await ensureLoaded()) return;
window._agInjectCSS && window._agInjectCSS();
const isEn = (window._i18n?.lang || 'zh') === 'en';
const overlay = document.createElement('div');
overlay.id = 'agMiniOverlay';
const box = document.createElement('div');
box.id = 'agMiniBox';
const header = document.createElement('div');
header.className = 'ag-mini-header';
header.innerHTML = `
<span class="ag-mini-header-title">🤖 K Assistant</span>
<div class="ag-mini-header-actions">
<button class="ag-mini-hdr-btn" id="agMiniExpandBtn" title="${isEn ? 'Open full panel' : '展开完整面板'}">⤢</button>
<button class="ag-mini-hdr-btn" id="agMiniCloseBtn" title="${isEn ? 'Close' : '关闭'}">✕</button>
</div>
`;
const messages = document.createElement('div');
messages.id = 'agMiniMessages';
const inputRow = document.createElement('div');
inputRow.className = 'ag-mini-input-row';
const input = document.createElement('input');
input.id = 'agMiniInput';
input.type = 'text';
input.placeholder = isEn ? 'Ask AI anything... (Enter to send)' : '问我任何事... (Enter 发送)';
input.autocomplete = 'off';
const sendBtn = document.createElement('button');
sendBtn.id = 'agMiniSendBtn';
sendBtn.innerHTML = '↑';
sendBtn.title = isEn ? 'Send' : '发送';
inputRow.appendChild(input);
inputRow.appendChild(sendBtn);
const footer = document.createElement('div');
footer.className = 'ag-mini-footer';
footer.innerHTML = `
<div class="ag-mini-keys">
<span><span class="ag-mini-key">${_modLabel}+J</span> mini</span>
<span><span class="ag-mini-key">Alt+A</span> panel</span>
<span><span class="ag-mini-key">Esc</span> close</span>
</div>
`;
box.appendChild(header);
box.appendChild(messages);
box.appendChild(inputRow);
box.appendChild(footer);
overlay.appendChild(box);
document.body.appendChild(overlay);
if (_miniMessagesHtml && _miniSession && _miniSession.messages.length > 0) {
messages.innerHTML = _miniMessagesHtml;
messages.querySelectorAll('.ag-mini-bubble.thinking').forEach(el => el.remove());
} else {
const welcomeChips = [
isEn ? 'Generate UUID' : '生成 UUID',
isEn ? 'Format JSON' : '格式化 JSON',
isEn ? 'Hash text' : '算哈希',
isEn ? 'Convert time' : '时间转换',
];
const welcomeEl = document.createElement('div');
welcomeEl.className = 'ag-mini-welcome';
welcomeEl.innerHTML = `<span class="ag-mini-welcome-text">${isEn ? '👋 Hi! Try a quick command:' : '👋 你好！试试快捷指令：'}</span>
<div class="ag-mini-chips">${welcomeChips.map(c => `<span class="ag-mini-chip">${c}</span>`).join('')}</div>`;
messages.appendChild(welcomeEl);
welcomeEl.querySelectorAll('.ag-mini-chip').forEach(chip => {
chip.addEventListener('click', () => {
input.value = chip.textContent;
_miniSend();
});
});
}
setTimeout(() => input.focus(), 50);
overlay.addEventListener('click', e => { if (e.target === overlay) closeMini(); });
document.getElementById('agMiniCloseBtn').onclick = closeMini;
document.getElementById('agMiniExpandBtn').onclick = () => {
closeMini();
openAgent();
};
if (_miniSession) {
_miniSession._handlers = {};
_miniSession.clearHistory();
}
const { AG } = window.AgentConfig;
const cfg = AG.load();
const adapter = window.AgentAdapters.getAdapter(cfg.adapter);
if (!_miniSession) {
_miniSession = new window.AgentSession({
adapter,
config: { ...cfg, apiKey: AG.getKey(cfg.adapter), max_tokens: 1000 },
});
}
_miniSession.adapter = adapter;
_miniSession.config = { ...cfg, apiKey: AG.getKey(cfg.adapter), max_tokens: 1000 };
_miniSession.on('thinking', () => {
_miniRemoveThinking();
_miniThinkingEl = _miniAppendBubble('thinking', '<div class="ag-thinking-dots"><span></span><span></span><span></span></div> <span class="ag-mini-thinking-text">thinking...</span>');
});
_miniSession.on('tool_start', ({ tool_calls }) => {
const names = tool_calls.map(tc => tc.function.name).join(', ');
if (_miniThinkingEl) {
const textEl = _miniThinkingEl.querySelector('.ag-mini-thinking-text');
if (textEl) textEl.textContent = names;
} else {
_miniThinkingEl = _miniAppendBubble('thinking', `<div class="ag-thinking-dots"><span></span><span></span><span></span></div> <span class="ag-mini-thinking-text">${_miniEsc(names)}</span>`);
}
});
_miniSession.on('assistant', ({ content }) => {
if (!content || !content.trim()) return;
_miniRemoveThinking();
const html = window._agMdToHtml ? window._agMdToHtml(content) : _miniEsc(content);
_miniAppendBubble('assistant', html);
});
_miniSession.on('error', ({ message }) => {
_miniRemoveThinking();
_miniAppendBubble('error', _miniEsc(message || 'Error'));
const inp = document.getElementById('agMiniInput');
const sb = document.getElementById('agMiniSendBtn');
if (inp) inp.disabled = false;
if (sb) sb.disabled = false;
});
_miniSession.on('done', () => {
_miniRemoveThinking();
const inp = document.getElementById('agMiniInput');
const sb = document.getElementById('agMiniSendBtn');
if (inp) { inp.disabled = false; inp.focus(); }
if (sb) sb.disabled = false;
});
overlay.addEventListener('keydown', e => {
if (e.key === 'Escape') {
e.preventDefault();
e.stopPropagation();
closeMini();
}
});
overlay.tabIndex = -1;
input.addEventListener('keydown', e => {
if (e.key === 'Escape') {
e.preventDefault();
e.stopPropagation();
closeMini();
return;
}
if (e.key === 'Enter' && !e.isComposing) {
e.preventDefault();
_miniSend();
}
});
sendBtn.addEventListener('click', _miniSend);
}
let _miniMessagesHtml = '';
function closeMini() {
const msgsEl = document.getElementById('agMiniMessages');
if (msgsEl) _miniMessagesHtml = msgsEl.innerHTML;
const el = document.getElementById('agMiniOverlay');
if (el) el.remove();
_miniThinkingEl = null;
if (_miniSession) {
_miniSession._handlers = {};
}
}
document.addEventListener('keydown', e => {
if (e.altKey && e.key === 'a') {
e.preventDefault();
closeMini();
openAgent();
return;
}
if (e[_modKey] && e.key === 'j') {
e.preventDefault();
openMini();
return;
}
});
window._agOpenMini = openMini;
window._agCloseMini = closeMini;
window._agEnsureLoaded = ensureLoaded;
})();