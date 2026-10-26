'use strict';

// _agT 由 agent-i18n.js 定义为全局函数，直接使用

// ── Message rendering ───────────────────────────────────────────
function appendBubble(type, text) {
  const msgs = document.getElementById('agMessages');
  if (!msgs) return null;
  const el = document.createElement('div');
  el.className = `ag-bubble ${type}`;
  const content = type === 'assistant' ? mdToHtml(text) : escHtml(text);
  const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  el.innerHTML = content +
    '<span class="ag-bubble-time">' + timeStr + '</span>';
  // Copy button for assistant
  if (type === 'assistant') {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'ag-bubble-copy';
    copyBtn.textContent = _agT('copy');
    copyBtn.onclick = () => window.copyText(text, copyBtn);
    el.appendChild(copyBtn);
  }
  msgs.appendChild(el);
  scrollBottom();
  return el;
}

// escHtml comes from dashboard.js (always loaded first); redefining it here would replace the global.

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
  // Start timer
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

// ── Tool execution cards ─────────────────────────────────────────
function createCard(tc) {
  const msgs = document.getElementById('agMessages');
  if (!msgs) return null;

  let paramsStr = '';
  try { paramsStr = JSON.stringify(JSON.parse(tc.function.arguments || '{}'), (key, value) => /^(key|password|token|secret)$/i.test(key) ? '[redacted]' : value).slice(0, 180); } catch { paramsStr = 'Invalid JSON'; }

  const card = document.createElement('div');
  card.className = 'ag-card';
  card.dataset.startMs = Date.now();
  card.innerHTML = `
    <div class="ag-card-header">
      <span class="ag-card-icon ag-spin">⚙️</span>
      <span class="ag-card-name">${escHtml(tc.function.name)}</span>
      <span class="ag-card-params">${escHtml(paramsStr)}</span>
      <span class="ag-card-status" role="status" aria-live="polite">...</span>
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
  body.replaceChildren();
  const label = document.createElement('div'); label.className = 'ag-card-display'; label.textContent = display; body.append(label);
  if (result.data?.steps) {
    const trace = document.createElement('ol');
    for (const step of result.data.steps) {
      const li = document.createElement('li');
      li.textContent = (step.id || step.step) + (step.action ? ': ' + step.action : '') + ' ' + (step.success === false || step.ok === false ? '✗' : '✓') + (step.durationMs !== undefined ? ' (' + step.durationMs + 'ms)' : ''); trace.append(li);
    }
    if (result.data.failedStep) { const failed = document.createElement('li'); failed.textContent = result.data.failedStep + ' ✗ ' + (result.error || ''); trace.append(failed); }
    body.append(trace);
  }
  const actions = document.createElement('div'); actions.className = 'ag-card-actions'; body.append(actions);
  window.AgentResults.mount(body, { tc, result, onRun: async (name, params) => {
    if (_busy) throw new Error(window.getCurrentLang?.() === 'en' ? 'Wait for the current task to finish.' : '请等待当前任务完成。');
    setBusy(true);
    try { await _session.executeLocal(name, params); } finally { setBusy(false); }
  } });
  if (tc.name === 'list_workflows' || tc.function?.name === 'list_workflows') {
    for (const template of result.data?.templates || []) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'ag-btn';
      button.textContent = _agT('workflow_use') + ': ' + template.id;
      button.addEventListener('click', () => { const input = document.getElementById('agInput'); input.value = '/workflow ' + template.id + ' '; input.focus(); });
      body.querySelector('.ag-card-actions').appendChild(button);
    }
  }
  scrollBottom();
}

function escAttr(str) {
  return JSON.stringify(str).replace(/'/g, "\\'");
}

// ── Send logic ──────────────────────────────────────────────────
function doSend() {
  if (_busy) return;
  const input = document.getElementById('agInput');
  if (!input) return;
  const text = input.value.trimStart();
  if (!text.trim()) return;
  input.value = '';
  input.style.height = 'auto';

  // Ensure session exists
  if (!_session) {
    const { AG } = window.AgentConfig;
    const cfg = AG.load();
    const adapter = window.AgentAdapters.getAdapter(cfg.adapter);
    _session = new window.AgentSession({ adapter, config: { ...cfg, apiKey: AG.getKey(cfg.adapter) } });
    window.initAgentRouter(_session);
    wireSession(_session);
  }

  // 斜杠命令 / @mention 处理
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
        // 直接执行，不走 LLM
        appendBubble('user', text);
        const action = window._AGENT_ALL_ACTIONS
          ? window._AGENT_ALL_ACTIONS.get(parsed.action)
          : (window._AGENT_ACTIONS || []).find(a => a.name === parsed.action);
        if (action) {
          setBusy(true);
          _session.executeLocal(parsed.action, parsed.params).then(result => {
            if (!window.AgentConfig.AG.load().show_cards) appendBubble('assistant', result.display || result.error || JSON.stringify(result.data));
          }).catch(e => {
            appendBubble('assistant', _agT('exec_fail') + e.message);
          }).finally(() => setBusy(false));
        } else {
          appendBubble('assistant', _agT('action_missing') + parsed.action);
        }
        return;
      }
      // mention：走 LLM 但原始文本已含 @
    }
  }

  const cfg = window.AgentConfig.AG.load();
  if (!cfg.apiKey && cfg.adapter !== 'custom') {
    input.value = text; openConfig(); return;
  }
  if (_session.config.adapter !== cfg.adapter || _session.config.model !== cfg.model || _session.config.baseUrl !== cfg.baseUrl) _session._responseId = null;
  _session.adapter = window.AgentAdapters.getAdapter(cfg.adapter); _session.config = cfg;
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
      if (_session?._retryState) { setBusy(true); _session.retryLast(); }
      else appendBubble('assistant', _agT('no_retry'));
      break;
    case 'copy': {
      const bubbles = document.querySelectorAll('#agMessages .ag-bubble.assistant');
      if (bubbles.length) {
        window.copyText(bubbles[bubbles.length-1].innerText);
      }
      break;
    }
    case 'help':
      appendBubble('assistant', window.CmdParser.getHelpText());
      break;
    case 'model':
      if (args[0] && _session) {
        try {
          const AG = window.AgentConfig.AG; AG.save({ ...AG.load(), model: args[0] });
          appendBubble('assistant', _agT('model_switched') + args[0]);
        } catch (e) { appendErrorBubble(e.message); }
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
    document.getElementById('agStopBtn')?.classList.add('visible');
    const names = tool_calls.map(tc => tc.function.name).join(', ');
    if (window.AgentConfig.AG.load().show_cards) {
      tool_calls.forEach(tc => createCard(tc));
    }
    _thinkingEl = appendThinking(names);
  });
  session.on('tool_progress', progress => {
    const card = _cardMap[progress.id];
    if (!card) return;
    const status = card.querySelector('.ag-card-status');
    status.textContent = _agT('workflow_step') + ' ' + progress.completed + '/' + progress.total;
  });
  session.on('context', stats => document.getElementById('agentPanel')?._contextUpdate?.(stats));
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
    appendErrorBubble(msg, ['network','max_tokens'].includes(reason) ? () => {
      if (_busy || !session._retryState) return;
      const cfg = window.AgentConfig.AG.load();
      session.config = cfg; session.adapter = window.AgentAdapters.getAdapter(cfg.adapter); session._responseId = null;
      setBusy(true); session.retryLast();
    } : null);
    setBusy(false);
    const stopBtn = document.getElementById('agStopBtn');
    if (stopBtn) stopBtn.classList.remove('visible');
  });
  session.on('done', ({ aborted } = {}) => {
    removeThinking();
    if (aborted) for (const [id, card] of Object.entries(_cardMap)) {
      if (card.querySelector('.ag-spin')) finishCard({ id }, { success:false, error:_agT('cancelled') });
    }
    setBusy(false);
    const stopBtn = document.getElementById('agStopBtn');
    if (stopBtn) stopBtn.classList.remove('visible');
  });
}

window._agAppendBubble  = appendBubble;
window._agDoSend        = doSend;
window._agWireSession   = wireSession;
