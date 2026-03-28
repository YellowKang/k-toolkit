'use strict';
function appendBubble(type, text) {
const msgs = document.getElementById('agMessages');
if (!msgs) return null;
const el = document.createElement('div');
el.className = `ag-bubble ${type}`;
const content = type === 'assistant' ? mdToHtml(text) : escHtml(text);
const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
el.innerHTML = content +
'<span class="ag-bubble-time">' + timeStr + '</span>';
if (type === 'assistant') {
const copyBtn = document.createElement('button');
copyBtn.className = 'ag-bubble-copy';
copyBtn.textContent = 'Copy';
copyBtn.onclick = () => {
navigator.clipboard.writeText(text).then(() => {
copyBtn.textContent = '\u2713';
setTimeout(() => copyBtn.textContent = 'Copy', 1500);
});
};
el.appendChild(copyBtn);
}
msgs.appendChild(el);
scrollBottom();
return el;
}
function escHtml(t) {
return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
let _thinkingStartMs = 0;
let _thinkingTimer = null;
function appendThinking(actionName) {
const msgs = document.getElementById('agMessages');
if (!msgs) return null;
_thinkingStartMs = Date.now();
const el = document.createElement('div');
el.className = 'ag-thinking';
const label = actionName || _agT('thinking');
el.innerHTML = '<span class="ag-thinking-label">' + escHtml(label) + '</span>' +
'<div class="ag-thinking-dots"><span></span><span></span><span></span></div>' +
'<span class="ag-thinking-timer" id="agThinkTimer">0.0s</span>';
msgs.appendChild(el);
scrollBottom();
_thinkingTimer = setInterval(() => {
const timerEl = document.getElementById('agThinkTimer');
if (timerEl) timerEl.textContent = ((Date.now() - _thinkingStartMs) / 1000).toFixed(1) + 's';
}, 100);
return el;
}
function removeThinking() {
if (_thinkingTimer) { clearInterval(_thinkingTimer); _thinkingTimer = null; }
if (_thinkingEl && _thinkingEl.parentNode) {
_thinkingEl.parentNode.removeChild(_thinkingEl);
_thinkingEl = null;
}
}
function appendErrorBubble(msg, onRetry) {
const msgs = document.getElementById('agMessages');
if (!msgs) return;
const el = document.createElement('div');
el.className = 'ag-bubble error';
el.innerHTML = `<div>${escHtml(msg)}</div>`;
if (onRetry) {
const btn = document.createElement('button');
btn.className = 'ag-btn';
btn.style.marginTop = '6px';
btn.textContent = _agT('retry');
btn.onclick = onRetry;
el.appendChild(btn);
}
msgs.appendChild(el);
scrollBottom();
}
function createCard(tc) {
const msgs = document.getElementById('agMessages');
if (!msgs) return null;
const paramsStr = Object.entries(JSON.parse(tc.function.arguments || '{}')).slice(0,3)
.map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(' ');
const card = document.createElement('div');
card.className = 'ag-card';
card.dataset.startMs = Date.now();
card.innerHTML = `
<div class="ag-card-header">
<span class="ag-card-icon ag-spin">⚙️</span>
<span class="ag-card-name">${escHtml(tc.function.name)}</span>
<span class="ag-card-params">${escHtml(paramsStr)}</span>
<span class="ag-card-status">...</span>
</div>
<div class="ag-card-body" style="display:none"></div>
`;
msgs.appendChild(card);
_cardMap[tc.id] = card;
scrollBottom();
return card;
}
function finishCard(tc, result) {
const card = _cardMap[tc.id];
if (!card) return;
const elapsed = card.dataset.startMs ? ((Date.now() - parseInt(card.dataset.startMs)) / 1000).toFixed(1) + 's' : '';
card.classList.add(result.success ? 'success' : 'error');
const header = card.querySelector('.ag-card-header');
const icon = header.querySelector('.ag-card-icon');
icon.classList.remove('ag-spin');
icon.textContent = result.success ? '✓' : '✗';
const status = header.querySelector('.ag-card-status');
status.className = 'ag-card-status ' + (result.success ? 'ok' : 'fail');
status.textContent = (result.success ? '\u2713 ' : '\u2717 ') + elapsed;
const body = card.querySelector('.ag-card-body');
body.style.display = 'block';
const display = result.display || (result.success ? _agT('done') : (result.error || 'Failed'));
const detailId = 'ag-detail-' + tc.id;
let copyBtn = null;
if (result.success && result.data) {
copyBtn = document.createElement('button');
copyBtn.className = 'ag-btn';
copyBtn.textContent = _agT('copy');
copyBtn.addEventListener('click', () => {
const txt = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
navigator.clipboard.writeText(txt).then(() => { window.showToast && window.showToast(_agT('copied')); });
});
}
body.innerHTML = `
<div class="ag-card-display">${escHtml(display)}</div>
<div class="ag-card-actions" id="ag-actions-${detailId}">
<button class="ag-btn" onclick="document.getElementById('${detailId}').classList.toggle('open')">${_agT('details')}</button>
</div>
<div class="ag-card-detail" id="${detailId}">
<pre>${escHtml(JSON.stringify(result.data || result, null, 2))}</pre>
</div>
`;
if (copyBtn) {
document.getElementById('ag-actions-' + detailId).prepend(copyBtn);
}
scrollBottom();
}
function escAttr(str) {
return JSON.stringify(str).replace(/'/g, "\\'");
}
function doSend() {
if (_busy) return;
const input = document.getElementById('agInput');
if (!input) return;
const text = input.value.trim();
if (!text) return;
input.value = '';
input.style.height = 'auto';
if (!_session) {
const { AG } = window.AgentConfig;
const cfg = AG.load();
const adapter = window.AgentAdapters.getAdapter(cfg.adapter);
_session = new window.AgentSession({ adapter, config: { ...cfg, apiKey: AG.getKey(cfg.adapter) } });
window.initAgentRouter(_session);
wireSession(_session);
}
if (window.CmdParser) {
const parsed = window.CmdParser.parse(text);
if (parsed) {
if (parsed.type === 'meta') {
_handleMetaCmd(parsed.cmd, parsed.args);
return;
}
if (parsed.type === 'unknown_cmd') {
appendBubble('assistant', _agT('unknown_cmd').replace('{cmd}', parsed.cmd));
return;
}
if (parsed.type === 'action') {
appendBubble('user', text);
const action = window._AGENT_ALL_ACTIONS
? window._AGENT_ALL_ACTIONS.get(parsed.action)
: (window._AGENT_ACTIONS || []).find(a => a.name === parsed.action);
if (action) {
setBusy(true);
Promise.resolve(action.execute(parsed.params)).then(result => {
appendBubble('assistant', result.display || JSON.stringify(result.data));
setBusy(false);
}).catch(e => {
appendBubble('assistant', _agT('exec_fail') + e.message);
setBusy(false);
});
} else {
appendBubble('assistant', _agT('action_missing') + parsed.action);
}
return;
}
}
}
appendBubble('user', text);
setBusy(true);
_session.send(text);
}
function _handleMetaCmd(cmd, args) {
switch(cmd) {
case 'clear':
if (_session) _session.clearHistory();
const msgs = document.getElementById('agMessages');
if (msgs) msgs.innerHTML = '';
appendBubble('assistant', _agT('history_cleared'));
break;
case 'config':
window._agOpenConfig && window._agOpenConfig();
break;
case 'retry':
if (_session && _session.messages.length) {
const last = [..._session.messages].reverse().find(m => m.role === 'user');
if (last) { setBusy(true); _session.send(last.content); }
}
break;
case 'copy': {
const bubbles = document.querySelectorAll('#agMessages .ag-bubble.assistant');
if (bubbles.length) {
navigator.clipboard.writeText(bubbles[bubbles.length-1].innerText);
window.showToast && window.showToast(_agT('copied'));
}
break;
}
case 'help':
appendBubble('assistant', window.CmdParser.getHelpText());
break;
case 'model':
if (args[0] && _session) {
_session.config.model = args[0];
appendBubble('assistant', _agT('model_switched') + args[0]);
}
break;
case 'skin':
appendBubble('assistant', _agT('skin_follows'));
break;
default:
appendBubble('assistant', _agT('unknown_meta') + cmd);
}
}
function setBusy(v) {
_busy = v;
const btn = document.getElementById('agSendBtn');
if (btn) btn.disabled = v;
}
function wireSession(session) {
window._agCurrentSession = () => session;
window.AgentAutonomy && window.AgentAutonomy.init(session);
session.on('user', () => {});
session.on('skill_matched', ({ skill, icon }) => {
const msgs = document.getElementById('agMessages');
if (!msgs) return;
const el = document.createElement('div');
el.className = 'ag-skill-tag';
el.textContent = icon + ' ' + skill + ' ' + _agT('skill_active');
msgs.appendChild(el);
});
session.on('thinking', () => {
removeThinking();
_thinkingEl = appendThinking();
const stopBtn = document.getElementById('agStopBtn');
if (stopBtn) stopBtn.classList.add('visible');
});
session.on('tool_start', ({ tool_calls }) => {
removeThinking();
const names = tool_calls.map(tc => tc.function.name).join(', ');
if (window.AgentConfig.AG.load().show_cards) {
tool_calls.forEach(tc => createCard(tc));
}
_thinkingEl = appendThinking(names);
});
session.on('tool_done', ({ results }) => {
removeThinking();
results.forEach(r => finishCard(r, r.result));
});
session.on('assistant', ({ content }) => {
removeThinking();
if (content && content.trim()) appendBubble('assistant', content);
});
session.on('error', ({ reason, message }) => {
removeThinking();
const msg = message || `错误: ${reason}`;
appendErrorBubble(msg, reason !== 'max_iterations' ? () => {} : null);
setBusy(false);
const stopBtn = document.getElementById('agStopBtn');
if (stopBtn) stopBtn.classList.remove('visible');
});
session.on('done', () => {
removeThinking();
setBusy(false);
const stopBtn = document.getElementById('agStopBtn');
if (stopBtn) stopBtn.classList.remove('visible');
});
}
window._agAppendBubble  = appendBubble;
window._agDoSend        = doSend;
window._agWireSession   = wireSession;