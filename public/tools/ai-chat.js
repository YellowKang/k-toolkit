'use strict';

const _chatTl = makeToolI18n({
  zh: {
    title: 'AI 对话', adapter: '适配器', model: '模型', temp: '温度',
    context: '上下文', clear: '清空对话', ctx_5: '最近5轮', ctx_10: '最近10轮',
    ctx_20: '最近20轮', ctx_all: '全部', system_prompt: '系统提示',
    system_default: '你是一个有帮助的 AI 助手。', send: '发送', stop: '停止',
    attach_img: '添加图片', no_key: '请先配置 API Key',
    go_settings: '去设置', thinking: '思考中...', copy: '复制',
    copied: '已复制', error: '出错了', img_preview: '图片预览',
    export_md: '导出 Markdown', ctx_control: '上下文控制',
    welcome: '你好！我是 AI 助手，有什么可以帮你的吗？',
    input_placeholder: '输入消息... (Enter 发送, Shift+Enter 换行)',
    no_adapter: '适配器未加载，请确保 Agent 模块已初始化',
    sys_prompt_title: '编辑系统提示',
    save: '保存', cancel: '取消', reset: '重置',
    settings: '设置', api_key: 'API Key', base_url: 'Base URL (可选)',
    max_tokens: '最大 Token', retry: '重新生成', settings_title: '接口配置',
    suggest1: '解释这段代码', suggest2: '帮我写一个计划', suggest3: '翻译成英文', suggest4: '总结以下内容',
  },
  en: {
    title: 'AI Chat', adapter: 'Adapter', model: 'Model', temp: 'Temperature',
    context: 'Context', clear: 'Clear Chat', ctx_5: 'Last 5', ctx_10: 'Last 10',
    ctx_20: 'Last 20', ctx_all: 'All', system_prompt: 'System Prompt',
    system_default: 'You are a helpful AI assistant.', send: 'Send', stop: 'Stop',
    attach_img: 'Attach Image', no_key: 'Please configure API Key first',
    go_settings: 'Settings', thinking: 'Thinking...', copy: 'Copy',
    copied: 'Copied', error: 'Error', img_preview: 'Image Preview',
    export_md: 'Export Markdown', ctx_control: 'Context Control',
    welcome: 'Hello! I\'m your AI assistant. How can I help?',
    input_placeholder: 'Type a message... (Enter to send, Shift+Enter for new line)',
    no_adapter: 'Adapter not loaded. Make sure Agent module is initialized.',
    sys_prompt_title: 'Edit System Prompt',
    save: 'Save', cancel: 'Cancel', reset: 'Reset',
    settings: 'Settings', api_key: 'API Key', base_url: 'Base URL (optional)',
    max_tokens: 'Max Tokens', retry: 'Retry', settings_title: 'API Settings',
    suggest1: 'Explain this code', suggest2: 'Help me write a plan', suggest3: 'Translate to Chinese', suggest4: 'Summarize the following',
  }
});

// ── State ──
let _chatMessages = [];
let _chatAdapter = null;
let _chatAdapterId = '';
let _chatModel = '';
let _chatTemp = 0.7;
let _chatMaxCtx = 20;
let _chatSystemPrompt = '';
let _chatAbort = null;
let _chatImages = []; // pending images [{base64, mime, name}]
let _chatBusy = false;

const _CHAT_LS_KEY = 'dtb_chat_history';
const _CHAT_SYS_KEY = 'dtb_chat_system';
const _CHAT_CFG_KEY = 'dtb_chat_config';

function _chatLoadHistory() {
  try { return JSON.parse(localStorage.getItem(_CHAT_LS_KEY)) || []; } catch { return []; }
}
function _chatSaveHistory() {
  try {
    const save = _chatMessages.slice(-100).map(m => ({
      role: m.role, content: m.content, _images: m._images || null, ts: m.ts
    }));
    localStorage.setItem(_CHAT_LS_KEY, JSON.stringify(save));
  } catch {}
}
function _chatLoadConfig() {
  try { return JSON.parse(localStorage.getItem(_CHAT_CFG_KEY)) || {}; } catch { return {}; }
}
function _chatSaveConfig() {
  try {
    localStorage.setItem(_CHAT_CFG_KEY, JSON.stringify({
      adapterId: _chatAdapterId, model: _chatModel, temp: _chatTemp, maxCtx: _chatMaxCtx
    }));
  } catch {}
}

// ── Escape HTML ──
function _chatEsc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ── Markdown → HTML (use agent's mdToHtml if available, otherwise built-in fallback) ──
function _chatMd(text) {
  if (typeof window._agMdToHtml === 'function') return window._agMdToHtml(text);
  // Fallback: basic markdown rendering for when agent module hasn't loaded yet
  let html = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Code blocks
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const i = codeBlocks.length;
    const esc = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const label = lang ? '<span class="md-code-lang">' + lang + '</span>' : '';
    codeBlocks.push('<pre class="md-pre">' + label + '<code class="lang-' + (lang||'text') + '">' + esc + '</code></pre>');
    return '\x00CB' + i + '\x00';
  });
  // Inline code
  html = html.replace(/`([^`]+)`/g, (_, c) => '<code class="md-inline-code">' + c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</code>');
  // Escape remaining
  const parts = html.split(/(<\/?(?:pre|code|strong|em|del|a|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td|br|hr|span)[^>]*>)/);
  html = parts.map((p, i) => i % 2 === 0 ? p.replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/<(?!\/?(?:pre|code|strong|em|del|a|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td|br|hr|span))/g, '&lt;') : p).join('');
  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    if (/^\s*(?:javascript|data|vbscript):/i.test(u)) return t;
    return '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>';
  });
  // Blockquotes
  html = html.replace(/((?:^> .+\n?)+)/gm, (_, b) => '<blockquote class="md-blockquote">' + b.replace(/^> /gm, '').trim() + '</blockquote>');
  // Horizontal rules
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="md-hr">');
  // Unordered lists
  html = html.replace(/(?:^|\n)((?:[\-\*\+] .+\n?)+)/g, (_, list) => {
    return '<ul>' + list.trim().split('\n').map(l => '<li>' + l.replace(/^[\-\*\+] /, '') + '</li>').join('') + '</ul>';
  });
  // Ordered lists
  html = html.replace(/(?:^|\n)((?:\d+\. .+\n?)+)/g, (_, list) => {
    return '<ol>' + list.trim().split('\n').map(l => '<li>' + l.replace(/^\d+\. /, '') + '</li>').join('') + '</ol>';
  });
  // Tables
  html = html.replace(/(?:^|\n)((?:\|.+\|\n?)+)/g, (match, block) => {
    const rows = block.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2 || !/^\|[\s:]*-{2,}/.test(rows[1])) return match;
    const pr = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    let t = '<table class="md-table"><thead><tr>' + pr(rows[0]).map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>';
    for (const r of rows.slice(2)) t += '<tr>' + pr(r).map(c => '<td>' + c + '</td>').join('') + '</tr>';
    return t + '</tbody></table>';
  });
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/<br>(<\/?(?:pre|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td|hr))/g, '$1');
  html = html.replace(/(<\/(?:pre|ul|ol|li|h[1-6]|blockquote|table|thead|tbody|tr|th|td|hr)>)<br>/g, '$1');
  // Restore code blocks
  html = html.replace(/\x00CB(\d+)\x00/g, (_, i) => codeBlocks[+i]);
  return html;
}

// ── Build messages for API ──
function _chatBuildMessages() {
  const trimmed = _chatMaxCtx > 0 ? _chatMessages.slice(-(_chatMaxCtx * 2)) : [..._chatMessages];
  const sys = _chatSystemPrompt || _chatTl('system_default');
  const result = [{ role: 'system', content: sys }];

  for (const msg of trimmed) {
    if (msg._images && msg._images.length > 0) {
      const parts = [];
      for (const img of msg._images) {
        if (_chatAdapterId === 'claude') {
          parts.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.base64 } });
        } else {
          parts.push({ type: 'image_url', image_url: { url: `data:${img.mime};base64,${img.base64}` } });
        }
      }
      if (msg.content) parts.push({ type: 'text', text: msg.content });
      result.push({ role: msg.role, content: parts });
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }
  return result;
}

// ── Format timestamp ──
function _chatFmtTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Copy text helper ──
function _chatCopyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = `✓ <span>${_chatTl('copied')}</span>`;
    btn.style.color = '#34d399';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 1500);
  });
}

// ── Render a single message bubble ──
function _chatRenderMsg(msg, container) {
  const isUser = msg.role === 'user';

  // Row wrapper (controls alignment)
  const row = document.createElement('div');
  row.className = `_chat-row ${isUser ? '_chat-row-user' : '_chat-row-ai'}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = `_chat-avatar ${isUser ? '_chat-avatar-user' : '_chat-avatar-ai'}`;
  avatar.textContent = isUser ? '👤' : '🤖';

  // Bubble column
  const col = document.createElement('div');
  col.className = '_chat-col';

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = `_chat-msg ${isUser ? '_chat-msg-user' : '_chat-msg-ai'}`;

  // Images (user)
  if (msg._images && msg._images.length > 0) {
    const imgRow = document.createElement('div');
    imgRow.className = '_chat-img-row';
    for (const img of msg._images) {
      const thumb = document.createElement('img');
      thumb.src = `data:${img.mime};base64,${img.base64}`;
      thumb.className = '_chat-thumb';
      thumb.title = img.name || '';
      imgRow.appendChild(thumb);
    }
    bubble.appendChild(imgRow);
  }

  const content = document.createElement('div');
  content.className = '_chat-content';
  if (isUser) {
    content.innerHTML = _chatEsc(msg.content || '').replace(/\n/g, '<br>');
  } else {
    content.innerHTML = _chatMd(msg.content || '');
    content.querySelectorAll('pre').forEach(pre => {
      const btn = document.createElement('button');
      btn.className = '_chat-copy-btn';
      btn.innerHTML = `⎘ ${_chatTl('copy')}`;
      btn.title = _chatTl('copy');
      btn.onclick = () => _chatCopyText(pre.querySelector('code')?.textContent || pre.textContent, btn);
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  }
  bubble.appendChild(content);
  col.appendChild(bubble);

  // Action bar (below bubble)
  const actions = document.createElement('div');
  actions.className = `_chat-actions ${isUser ? '_chat-actions-user' : '_chat-actions-ai'}`;

  // Timestamp
  const ts = document.createElement('span');
  ts.className = '_chat-ts';
  ts.textContent = _chatFmtTime(msg.ts);
  actions.appendChild(ts);

  // Copy full message button
  const copyBtn = document.createElement('button');
  copyBtn.className = '_chat-action-btn';
  copyBtn.dataset.actionKey = 'copy';
  copyBtn.innerHTML = `⎘ <span>${_chatTl('copy')}</span>`;
  copyBtn.title = _chatTl('copy');
  copyBtn.onclick = () => _chatCopyText(msg.content || '', copyBtn);
  actions.appendChild(copyBtn);

  // Retry button (AI only)
  if (!isUser) {
    const retryBtn = document.createElement('button');
    retryBtn.className = '_chat-action-btn';
    retryBtn.dataset.actionKey = 'retry';
    retryBtn.innerHTML = `↻ <span>${_chatTl('retry')}</span>`;
    retryBtn.title = _chatTl('retry');
    retryBtn.onclick = () => {
      if (_chatBusy) return;
      // Remove this and any subsequent messages
      const idx = _chatMessages.indexOf(msg);
      if (idx >= 0) {
        _chatMessages.splice(idx);
        _chatSaveHistory();
        // Remove DOM rows from this point
        const rows = container.querySelectorAll('._chat-row');
        let found = false;
        rows.forEach(r => { if (r === row || found) { found = true; r.remove(); } });
        // Re-send last user message
        const lastUser = _chatMessages.filter(m => m.role === 'user').pop();
        if (lastUser) _chatDoSend(lastUser.content, lastUser._images || []);
      }
    };
    actions.appendChild(retryBtn);
  }

  col.appendChild(actions);

  if (isUser) {
    row.appendChild(col);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(col);
  }

  container.appendChild(row);
  return bubble;
}

// ── Build an empty AI message row for streaming ──
function _chatCreateStreamRow(container) {
  const row = document.createElement('div');
  row.className = '_chat-row _chat-row-ai';

  const avatar = document.createElement('div');
  avatar.className = '_chat-avatar _chat-avatar-ai';
  avatar.textContent = '🤖';

  const col = document.createElement('div');
  col.className = '_chat-col';

  const bubble = document.createElement('div');
  bubble.className = '_chat-msg _chat-msg-ai';

  const content = document.createElement('div');
  content.className = '_chat-content';
  content.innerHTML = '<span class="_chat-cursor">▍</span>';

  bubble.appendChild(content);
  col.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(col);
  container.appendChild(row);

  return { row, col, bubble, content };
}

// ── Finalize stream row: add action bar ──
function _chatFinalizeStreamRow(aiMsg, col, content, container) {
  // Remove cursor
  const cursor = content.querySelector('._chat-cursor');
  if (cursor) cursor.remove();

  // Re-render final markdown & add code copy buttons
  content.innerHTML = _chatMd(aiMsg.content || '');
  content.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = '_chat-copy-btn';
    btn.innerHTML = `⎘ ${_chatTl('copy')}`;
    btn.title = _chatTl('copy');
    btn.onclick = () => _chatCopyText(pre.querySelector('code')?.textContent || pre.textContent, btn);
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });

  // Action bar
  const actions = document.createElement('div');
  actions.className = '_chat-actions _chat-actions-ai';

  const ts = document.createElement('span');
  ts.className = '_chat-ts';
  ts.textContent = _chatFmtTime(aiMsg.ts);
  actions.appendChild(ts);

  const copyBtn = document.createElement('button');
  copyBtn.className = '_chat-action-btn';
  copyBtn.dataset.actionKey = 'copy';
  copyBtn.innerHTML = `⎘ <span>${_chatTl('copy')}</span>`;
  copyBtn.title = _chatTl('copy');
  copyBtn.onclick = () => _chatCopyText(aiMsg.content || '', copyBtn);
  actions.appendChild(copyBtn);

  const retryBtn = document.createElement('button');
  retryBtn.className = '_chat-action-btn';
  retryBtn.dataset.actionKey = 'retry';
  retryBtn.innerHTML = `↻ <span>${_chatTl('retry')}</span>`;
  retryBtn.title = _chatTl('retry');
  retryBtn.onclick = () => {
    if (_chatBusy) return;
    const idx = _chatMessages.indexOf(aiMsg);
    if (idx >= 0) {
      _chatMessages.splice(idx);
      _chatSaveHistory();
      const rows = container.querySelectorAll('._chat-row');
      const row = col.parentElement;
      let found = false;
      rows.forEach(r => { if (r === row || found) { found = true; r.remove(); } });
      const lastUser = _chatMessages.filter(m => m.role === 'user').pop();
      if (lastUser) _chatDoSend(lastUser.content, lastUser._images || []);
    }
  };
  actions.appendChild(retryBtn);

  col.appendChild(actions);
}

// ── Core send logic (reused by retry) ──
async function _chatDoSend(text, images) {
  const AG = window.AgentConfig?.AG;
  const apiKey = AG?.getKey?.(_chatAdapterId) ||
    (() => { try { return JSON.parse(localStorage.getItem('ag_key_' + _chatAdapterId)) || ''; } catch { return ''; } })();
  if (!apiKey) { _chatShowNoKey(); return; }

  const msgList = _chatGetMsgContainer();
  _chatBusy = true;
  _chatUpdateButtons();

  _chatAbort = new AbortController();
  if (!window.AgentAdapters) {
    if (window._agEnsureLoaded) await window._agEnsureLoaded();
  }
  const adapter = window.AgentAdapters?.getAdapter(_chatAdapterId);
  if (!adapter) {
    _chatBusy = false;
    _chatAbort = null;
    _chatUpdateButtons();
    _chatShowError(_chatTl('no_adapter'));
    return;
  }

  const chatMessages = _chatBuildMessages();
  const baseUrl = AG?.get?.('base_url', '') || '';
  const streamParams = {
    messages: chatMessages,
    model: _chatModel || adapter.defaultModel,
    max_tokens: AG?.get?.('max_tokens', 2000) || 2000,
    temperature: _chatTemp,
    baseUrl: baseUrl || undefined,
    apiKey,
    signal: _chatAbort.signal,
  };

  // Try streaming path
  if (typeof adapter.chatStream === 'function') {
    const thinkEl = document.createElement('div');
    thinkEl.className = '_chat-row _chat-row-ai _chat-thinking';
    thinkEl.innerHTML = `<div class="_chat-avatar _chat-avatar-ai">🤖</div><div class="_chat-col"><div class="_chat-msg _chat-msg-ai"><div class="_chat-content"><span class="_chat-dots">${_chatTl('thinking')}</span></div></div></div>`;
    msgList.appendChild(thinkEl);
    _chatScrollBottom();

    try {
      const gen = adapter.chatStream(streamParams);
      let accumulated = '';
      let streamRowCreated = false;
      let streamRow = null;
      let renderScheduled = false;

      for await (const chunk of gen) {
        if (chunk.type === 'delta') {
          // Create stream row on first delta (replace thinking indicator)
          if (!streamRowCreated) {
            thinkEl.remove();
            streamRow = _chatCreateStreamRow(msgList);
            streamRowCreated = true;
          }
          accumulated += chunk.text;

          // Throttled rendering via requestAnimationFrame
          if (!renderScheduled) {
            renderScheduled = true;
            requestAnimationFrame(() => {
              renderScheduled = false;
              if (streamRow) {
                streamRow.content.innerHTML = _chatMd(accumulated) + '<span class="_chat-cursor">▍</span>';
                _chatScrollBottom();
              }
            });
          }
        } else if (chunk.type === 'done') {
          // Stream complete
        }
      }

      // Ensure thinking is removed even if no deltas received
      if (!streamRowCreated) {
        thinkEl.remove();
        streamRow = _chatCreateStreamRow(msgList);
      }

      const aiMsg = { role: 'assistant', content: accumulated, ts: Date.now() };
      _chatMessages.push(aiMsg);
      _chatFinalizeStreamRow(aiMsg, streamRow.col, streamRow.content, msgList);
      _chatScrollBottom();
      _chatSaveHistory();
    } catch (err) {
      thinkEl.remove();
      // Remove partial stream row on abort
      const partialRow = msgList.querySelector('._chat-row:last-child');
      if (err.name === 'AbortError') {
        // Keep partial content if any was accumulated
        // (the row is already in DOM, just finalize it)
      } else {
        _chatShowError(err.message || _chatTl('error'));
      }
    } finally {
      _chatBusy = false;
      _chatAbort = null;
      _chatUpdateButtons();
    }
    return;
  }

  // Fallback: non-streaming path
  const thinkEl = document.createElement('div');
  thinkEl.className = '_chat-row _chat-row-ai _chat-thinking';
  thinkEl.innerHTML = `<div class="_chat-avatar _chat-avatar-ai">🤖</div><div class="_chat-col"><div class="_chat-msg _chat-msg-ai"><div class="_chat-content"><span class="_chat-dots">${_chatTl('thinking')}</span></div></div></div>`;
  msgList.appendChild(thinkEl);
  _chatScrollBottom();

  try {
    const result = await adapter.chat(streamParams);
    thinkEl.remove();
    const aiMsg = { role: 'assistant', content: result.message?.content || '', ts: Date.now() };
    _chatMessages.push(aiMsg);
    _chatRenderMsg(aiMsg, msgList);
    _chatScrollBottom();
    _chatSaveHistory();
  } catch (err) {
    thinkEl.remove();
    if (err.name !== 'AbortError') _chatShowError(err.message || _chatTl('error'));
  } finally {
    _chatBusy = false;
    _chatAbort = null;
    _chatUpdateButtons();
  }
}

// ── Send message ──
async function _chatSend() {
  const input = document.getElementById('_chatInput');
  const text = (input?.value || '').trim();
  if (!text && _chatImages.length === 0) return;
  if (_chatBusy) return;

  // Check API key — read from Agent config or directly from localStorage
  const AG = window.AgentConfig?.AG;
  const apiKey = AG?.getKey?.(_chatAdapterId) ||
    (() => { try { return JSON.parse(localStorage.getItem('ag_key_' + _chatAdapterId)) || ''; } catch { return ''; } })();
  if (!apiKey) {
    _chatShowNoKey();
    return;
  }

  // Build user message
  const userMsg = {
    role: 'user',
    content: text,
    _images: _chatImages.length > 0 ? [..._chatImages] : null,
    ts: Date.now(),
  };
  _chatMessages.push(userMsg);
  _chatImages = [];
  _chatUpdateImgPreview();

  // Render user bubble
  const msgList = _chatGetMsgContainer();
  _chatRenderMsg(userMsg, msgList);
  input.value = '';
  input.style.height = 'auto';
  _chatScrollBottom();

  // Delegate to core send
  await _chatDoSend(text, userMsg._images || []);
}

function _chatStop() {
  if (_chatAbort) {
    _chatAbort.abort();
    _chatAbort = null;
  }
  _chatBusy = false;
  _chatUpdateButtons();
  // Remove thinking bubble
  const thinking = document.querySelector('._chat-thinking');
  if (thinking) thinking.remove();
  // Remove streaming cursor
  const cursor = document.querySelector('._chat-cursor');
  if (cursor) cursor.remove();
}

function _chatShowError(msg) {
  const msgList = _chatGetMsgContainer();
  if (!msgList) return;
  const el = document.createElement('div');
  el.className = '_chat-msg _chat-msg-error';
  el.style.cssText = 'align-self:center;max-width:90%;margin:4px auto';
  el.innerHTML = `<div class="_chat-content" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;border-radius:12px">&#x26a0; ${_chatEsc(msg)}</div>`;
  msgList.appendChild(el);
  _chatScrollBottom();
}

function _chatShowNoKey() {
  const msgList = _chatGetMsgContainer();
  if (!msgList) return;
  const el = document.createElement('div');
  el.className = '_chat-msg _chat-msg-error';
  el.style.cssText = 'align-self:center;max-width:90%;margin:4px auto';
  const inner = document.createElement('div');
  inner.className = '_chat-no-key';
  inner.innerHTML = `<span>&#x26a0; ${_chatTl('no_key')}</span>`;
  const btn = document.createElement('button');
  btn.textContent = _chatTl('go_settings');
  btn.onclick = () => { if (window.toggleAgentPanel) window.toggleAgentPanel(); };
  inner.appendChild(btn);
  el.appendChild(inner);
  msgList.appendChild(el);
  _chatScrollBottom();
}

function _chatScrollBottom() {
  const el = document.getElementById('_chatMsgList');
  if (el) requestAnimationFrame(() => el.scrollTop = el.scrollHeight);
}

function _chatGetMsgContainer() {
  const list = document.getElementById('_chatMsgList');
  return list?.querySelector('._chat-msgs-inner') || list;
}

function _chatUpdateButtons() {
  const sendBtn = document.getElementById('_chatSendBtn');
  const stopBtn = document.getElementById('_chatStopBtn');
  const input = document.getElementById('_chatInput');
  if (sendBtn) sendBtn.style.display = _chatBusy ? 'none' : '';
  if (stopBtn) stopBtn.style.display = _chatBusy ? '' : 'none';
  if (input) input.disabled = _chatBusy;
}

// ── Image handling ──
function _chatAttachImage() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.multiple = true;
  inp.onchange = () => _chatProcessFiles(inp.files);
  inp.click();
}

function _chatProcessFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      const mime = file.type;
      _chatImages.push({ base64, mime, name: file.name });
      _chatUpdateImgPreview();
    };
    reader.readAsDataURL(file);
  }
}

function _chatUpdateImgPreview() {
  const container = document.getElementById('_chatImgPreview');
  if (!container) return;
  container.innerHTML = '';
  if (_chatImages.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  _chatImages.forEach((img, i) => {
    const wrap = document.createElement('div');
    wrap.className = '_chat-img-preview-item';
    wrap.innerHTML = `<img src="data:${img.mime};base64,${img.base64}" class="_chat-thumb-sm">
      <button class="_chat-img-remove" data-idx="${i}">&times;</button>`;
    wrap.querySelector('button').onclick = () => {
      _chatImages.splice(i, 1);
      _chatUpdateImgPreview();
    };
    container.appendChild(wrap);
  });
}

// ── Clear chat ──
function _chatClear() {
  _chatMessages = [];
  _chatImages = [];
  const msgList = document.getElementById('_chatMsgList');
  const inner = _chatGetMsgContainer();
  if (inner) inner.innerHTML = '';
  _chatUpdateImgPreview();
  try { localStorage.removeItem(_CHAT_LS_KEY); } catch {}
}

// ── Export Markdown ──
function _chatExportMd() {
  let md = `# AI Chat Export\n\n`;
  for (const m of _chatMessages) {
    const label = m.role === 'user' ? '**User**' : '**AI**';
    md += `${label}:\n${m.content || ''}\n\n---\n\n`;
  }
  const blob = new Blob([md], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ai-chat-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Settings dialog ──
function _chatOpenSettings() {
  const overlay = document.createElement('div');
  overlay.className = '_chat-overlay';
  const dialog = document.createElement('div');
  dialog.className = '_chat-dialog _chat-settings-dialog';
  const adapterList = window.AgentAdapters?.listAdapters?.() || [
    { id: 'claude', name: 'Claude' }, { id: 'openai-chat', name: 'OpenAI' },
    { id: 'gemini', name: 'Gemini' }, { id: 'custom', name: 'Custom' },
  ];
  const _adapterIcons2 = { claude: '✦', 'openai-chat': '⬡', openai: '⬡', gemini: '✴', custom: '⚙' };
  let activeTab = _chatAdapterId;
  function getKey(id) { try { return JSON.parse(localStorage.getItem('ag_key_' + id)) || ''; } catch { return ''; } }
  function setKey(id, v) { try { localStorage.setItem('ag_key_' + id, JSON.stringify(v)); } catch {} }
  function getBaseUrl() { try { return JSON.parse(localStorage.getItem('ag_base_url')) || ''; } catch { return ''; } }
  function setBaseUrl(v) { try { localStorage.setItem('ag_base_url', JSON.stringify(v)); } catch {} }
  function getMaxTok() { try { const v = localStorage.getItem('ag_max_tokens'); return v ? JSON.parse(v) : 2000; } catch { return 2000; } }
  function setMaxTok(v) { try { localStorage.setItem('ag_max_tokens', JSON.stringify(+v)); } catch {} }

  function renderDialog() {
    dialog.innerHTML = `
      <div class="_chat-settings-header">
        <span class="_chat-settings-icon">⚙</span>
        <h3>${_chatTl('settings_title')}</h3>
        <button class="_chat-settings-close" id="_chatSettingsClose">✕</button>
      </div>
      <div class="_chat-settings-tabs">${adapterList.map(a =>
        `<button class="_chat-settings-tab${a.id === activeTab ? ' active' : ''}" data-id="${a.id}">${_adapterIcons2[a.id] || '◈'} ${a.name || a.id}</button>`
      ).join('')}</div>
      <div class="_chat-settings-body">
        <div class="_chat-settings-field">
          <label>${_chatTl('api_key')} <span style="opacity:.5;font-size:11px">(${activeTab})</span></label>
          <div class="_chat-key-wrap">
            <input type="password" id="_chatKeyInput" value="${_chatEsc(getKey(activeTab))}" placeholder="sk-..." autocomplete="off">
            <button class="_chat-key-eye" id="_chatKeyEye">👁</button>
          </div>
        </div>
        <div class="_chat-settings-field">
          <label>${_chatTl('base_url')}</label>
          <input type="text" id="_chatBaseUrl" value="${_chatEsc(getBaseUrl())}" placeholder="https://api.openai.com/v1">
        </div>
        <div class="_chat-settings-field _chat-settings-row">
          <div style="flex:1">
            <label>${_chatTl('max_tokens')}</label>
            <input type="number" id="_chatMaxTok" value="${getMaxTok()}" min="256" max="32000" step="256" style="width:100%">
          </div>
          <div style="flex:1">
            <label>${_chatTl('system_prompt')}</label>
            <button class="_chat-btn-secondary" id="_chatSysPromptBtn" style="width:100%;margin-top:2px">${_chatTl('sys_prompt_title')} ↗</button>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding:0 20px 20px">
        <button class="_chat-btn-secondary" id="_chatSettingsCancel">${_chatTl('cancel')}</button>
        <button class="_chat-btn-primary" id="_chatSettingsSave">${_chatTl('save')}</button>
      </div>`;
    overlay.appendChild(dialog);
    // Tab switching
    dialog.querySelectorAll('._chat-settings-tab').forEach(tab => {
      tab.onclick = () => { activeTab = tab.dataset.id; renderDialog(); };
    });
    dialog.querySelector('#_chatSettingsClose').onclick = () => overlay.remove();
    dialog.querySelector('#_chatSettingsCancel').onclick = () => overlay.remove();
    const eyeBtn = dialog.querySelector('#_chatKeyEye');
    const keyInp = dialog.querySelector('#_chatKeyInput');
    if (eyeBtn) eyeBtn.onclick = () => { keyInp.type = keyInp.type === 'password' ? 'text' : 'password'; };
    const sysBtn = dialog.querySelector('#_chatSysPromptBtn');
    if (sysBtn) sysBtn.onclick = () => { overlay.remove(); _chatEditSystemPrompt(); };
    dialog.querySelector('#_chatSettingsSave').onclick = () => {
      const key = dialog.querySelector('#_chatKeyInput')?.value.trim() || '';
      const baseUrl = dialog.querySelector('#_chatBaseUrl')?.value.trim() || '';
      const maxTok = dialog.querySelector('#_chatMaxTok')?.value || '2000';
      setKey(activeTab, key);
      setBaseUrl(baseUrl);
      setMaxTok(maxTok);
      _chatAdapterId = activeTab;
      // update toolbar badge
      if (typeof _chatUpdateBadge === 'function') _chatUpdateBadge();
      const badge = document.getElementById('_chatAdapterBadge');
      if (badge) {
        const icons = { claude: '✦', 'openai-chat': '⬡', openai: '⬡', gemini: '✴', custom: '⚙' };
        const adapters2 = window.AgentAdapters?.listAdapters?.() || [
          { id: 'claude', name: 'Claude' }, { id: 'openai-chat', name: 'OpenAI' },
          { id: 'gemini', name: 'Gemini' }, { id: 'custom', name: 'Custom' },
        ];
        const icon = icons[activeTab] || '◈';
        const name = adapters2.find(a => a.id === activeTab)?.name || activeTab;
        badge.innerHTML = `<span class="_chat-badge-icon">${icon}</span><span class="_chat-badge-name">${name}</span>`;
      }
      overlay.remove();
    };
  }
  renderDialog();
  const _chatRoot = document.getElementById('_chatPageRoot') || document.body;
  _chatRoot.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
}

// ── System prompt dialog ──
function _chatEditSystemPrompt() {
  const overlay = document.createElement('div');
  overlay.className = '_chat-overlay';
  const dialog = document.createElement('div');
  dialog.className = '_chat-dialog';
  dialog.innerHTML = `
    <h3>${_chatTl('sys_prompt_title')}</h3>
    <textarea id="_chatSysInput" rows="6" style="width:100%;resize:vertical;padding:8px;border-radius:8px;border:1px solid var(--border-color,#333);background:var(--bg-card,#1a1a2e);color:var(--text-color,#e2e8f0);font-size:14px">${_chatEsc(_chatSystemPrompt || _chatTl('system_default'))}</textarea>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
      <button class="_chat-btn-secondary" id="_chatSysReset">${_chatTl('reset')}</button>
      <button class="_chat-btn-secondary" id="_chatSysCancel">${_chatTl('cancel')}</button>
      <button class="_chat-btn-primary" id="_chatSysSave">${_chatTl('save')}</button>
    </div>`;
  overlay.appendChild(dialog);
  const _chatRoot2 = document.getElementById('_chatPageRoot') || document.body;
  _chatRoot2.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  dialog.querySelector('#_chatSysCancel').onclick = () => overlay.remove();
  dialog.querySelector('#_chatSysReset').onclick = () => {
    dialog.querySelector('#_chatSysInput').value = _chatTl('system_default');
  };
  dialog.querySelector('#_chatSysSave').onclick = () => {
    _chatSystemPrompt = dialog.querySelector('#_chatSysInput').value.trim();
    try { localStorage.setItem(_CHAT_SYS_KEY, _chatSystemPrompt); } catch {}
    overlay.remove();
  };
}

// ── Context control dropdown ──
function _chatToggleCtxMenu(btn) {
  let menu = document.getElementById('_chatCtxMenu');
  if (menu) { menu.remove(); return; }
  menu = document.createElement('div');
  menu.id = '_chatCtxMenu';
  menu.className = '_chat-dropdown';
  const options = [
    { label: _chatTl('ctx_5'), val: 5 },
    { label: _chatTl('ctx_10'), val: 10 },
    { label: _chatTl('ctx_20'), val: 20 },
    { label: _chatTl('ctx_all'), val: 0 },
  ];
  for (const opt of options) {
    const item = document.createElement('div');
    item.className = '_chat-dropdown-item' + (_chatMaxCtx === opt.val ? ' active' : '');
    item.textContent = opt.label;
    item.onclick = () => {
      _chatMaxCtx = opt.val;
      _chatSaveConfig();
      menu.remove();
    };
    menu.appendChild(item);
  }
  // System prompt
  const sp = document.createElement('div');
  sp.className = '_chat-dropdown-item';
  sp.textContent = _chatTl('system_prompt');
  sp.onclick = () => { menu.remove(); _chatEditSystemPrompt(); };
  menu.appendChild(sp);
  // Clear
  const cl = document.createElement('div');
  cl.className = '_chat-dropdown-item';
  cl.style.color = '#ef4444';
  cl.textContent = _chatTl('clear');
  cl.onclick = () => { menu.remove(); _chatClear(); };
  menu.appendChild(cl);
  // Export
  const ex = document.createElement('div');
  ex.className = '_chat-dropdown-item';
  ex.textContent = _chatTl('export_md');
  ex.onclick = () => { menu.remove(); _chatExportMd(); };
  menu.appendChild(ex);

  // Position menu below the button using fixed coords
  const rect = btn.getBoundingClientRect();
  menu.style.top = (rect.bottom + 6) + 'px';
  menu.style.left = rect.left + 'px';
  const root = document.getElementById('_chatPageRoot') || document.body;
  root.appendChild(menu);
  // Close on outside click
  setTimeout(() => {
    const handler = e => { if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); document.removeEventListener('click', handler); } };
    document.addEventListener('click', handler);
  }, 0);
}

// ── Main render ──
// ── Refresh i18n text in mounted chat UI (on lang switch) ──
function _chatRefreshI18n() {
  const root = document.getElementById('_chatPageRoot');
  if (!root) return;
  // Labels with data-i18n
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const prefix = el.dataset.i18nPrefix || '';
    const suffix = el.dataset.i18nSuffix || '';
    el.textContent = prefix + _chatTl(key) + suffix;
  });
  // Context button has ▾
  root.querySelectorAll('[data-i18n="context"]').forEach(el => {
    el.textContent = _chatTl('context') + ' ▾';
  });
  // Settings button has icon
  root.querySelectorAll('[data-i18n="settings"]').forEach(el => {
    el.innerHTML = '⚙ ' + _chatTl('settings');
  });
  // Input placeholder
  const inp = document.getElementById('_chatInput');
  if (inp) inp.placeholder = _chatTl('input_placeholder');
  // Send / stop button titles
  const sendBtn = document.getElementById('_chatSendBtn');
  if (sendBtn) sendBtn.title = _chatBusy ? _chatTl('stop') : _chatTl('send');
  // Export button
  root.querySelectorAll('[data-i18n="export_md"]').forEach(el => {
    el.textContent = _chatTl('export_md');
  });
  // Action buttons inside message rows (copy, retry)
  root.querySelectorAll('._chat-action-btn').forEach(btn => {
    const key = btn.dataset.actionKey;
    if (key) {
      const icon = key === 'copy' ? '⎘' : key === 'retry' ? '↻' : '';
      btn.innerHTML = `${icon} <span>${_chatTl(key)}</span>`;
      btn.title = _chatTl(key);
    }
  });
  // Code block copy buttons
  root.querySelectorAll('._chat-copy-btn').forEach(btn => {
    btn.innerHTML = `⎘ ${_chatTl('copy')}`;
    btn.title = _chatTl('copy');
  });
  // Welcome area
  const welcomeTitle = root.querySelector('._chat-welcome h3');
  if (welcomeTitle) welcomeTitle.textContent = _chatTl('title');
  const welcomeText = root.querySelector('._chat-welcome p');
  if (welcomeText) welcomeText.textContent = _chatTl('welcome');
  // Suggest buttons
  const suggestKeys = ['suggest1', 'suggest2', 'suggest3', 'suggest4'];
  root.querySelectorAll('._chat-suggest-btn').forEach((btn, i) => {
    if (suggestKeys[i]) btn.textContent = _chatTl(suggestKeys[i]);
  });
  // Model badge title
  const modelBadge = document.getElementById('_chatModelBadge');
  if (modelBadge) modelBadge.title = _chatTl('model');
  // Attach button title
  const attachBtn = document.getElementById('_chatAttachBtn');
  if (attachBtn) attachBtn.title = _chatTl('attach_img');
  // Stop button title
  const stopBtn = document.getElementById('_chatStopBtn');
  if (stopBtn) stopBtn.title = _chatTl('stop');
}
window._chatRefreshI18n = _chatRefreshI18n;
window.renderAiChat = renderAiChat;

function renderAiChat(container) {
  // Load saved state
  const AG = window.AgentConfig?.AG;
  function _lsGet(key, def) { try { const v = localStorage.getItem('ag_' + key); return v === null ? def : JSON.parse(v); } catch { return def; } }
  const savedCfg = _chatLoadConfig();
  _chatAdapterId = savedCfg.adapterId || AG?.get?.('adapter', 'claude') || _lsGet('adapter', 'claude');
  _chatModel = savedCfg.model || AG?.get?.('model', '') || _lsGet('model', '');
  _chatTemp = savedCfg.temp ?? AG?.get?.('temperature', 0.7) ?? _lsGet('temperature', 0.7);
  _chatMaxCtx = savedCfg.maxCtx ?? 20;
  _chatSystemPrompt = '';
  try { _chatSystemPrompt = localStorage.getItem(_CHAT_SYS_KEY) || ''; } catch {}
  _chatMessages = _chatLoadHistory();
  _chatImages = [];
  _chatBusy = false;

  // Trigger Agent module load in background (non-blocking, so adapters are ready when user sends)
  if (!window.AgentAdapters && window._agEnsureLoaded) window._agEnsureLoaded().catch(() => {});
  // Get adapters
  const adapters = window.AgentAdapters?.listAdapters?.() || [];
  const adapterList = adapters.length > 0 ? adapters : [
    { id: 'claude', name: 'Claude' },
    { id: 'openai-chat', name: 'OpenAI' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'custom', name: 'Custom' },
  ];
  const currentAdapter = window.AgentAdapters?.getAdapter?.(_chatAdapterId);
  const models = currentAdapter?.models || [];

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    .content.chat-page-mode{padding:0!important;overflow:hidden!important;position:relative}
    #_chatPageRoot{position:absolute;inset:0;display:flex;flex-direction:column;isolation:isolate}
    ._chat-wrap{display:flex;flex-direction:column;flex:1;min-height:0;background:var(--bg,#09090f)}
    @supports(height:100dvh){
      .content.chat-page-mode{height:100dvh}
      #_chatPageRoot{position:fixed;inset:0;z-index:400}
    }
    ._chat-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 24px;padding-top:max(8px,env(safe-area-inset-top,8px));border-bottom:1px solid var(--border,rgba(255,255,255,.08));background:var(--sidebar-bg,rgba(12,12,20,.95));flex-shrink:0;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
    ._chat-toolbar label{font-size:10px;color:var(--text-muted,rgba(241,245,249,.5));white-space:nowrap;letter-spacing:.5px;text-transform:uppercase;font-weight:600}
    ._chat-toolbar-sep{width:1px;height:18px;background:var(--border,rgba(255,255,255,.08));margin:0 2px;flex-shrink:0}
    ._chat-toolbar select,._chat-toolbar input[type="text"]{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-size:12px;outline:none;transition:border-color .15s}
    ._chat-toolbar select:focus,._chat-toolbar input:focus{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 20%,transparent)}
    ._chat-temp-wrap{display:flex;align-items:center;gap:4px}
    ._chat-temp-wrap input[type="range"]{width:72px;accent-color:var(--accent)}
    ._chat-temp-val{font-size:11px;color:var(--text-muted);min-width:24px;text-align:center}
    ._chat-msgs{flex:1;overflow-y:auto;padding:24px 0;min-height:0}
    ._chat-msgs::-webkit-scrollbar{width:4px}
    ._chat-msgs::-webkit-scrollbar-track{background:transparent}
    ._chat-msgs::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--accent) 30%,transparent);border-radius:4px}
    ._chat-msgs-inner{padding:0 32px;display:flex;flex-direction:column;gap:8px;box-sizing:border-box}
    @keyframes _chatFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

    /* ── Row layout ── */
    ._chat-row{display:flex;align-items:flex-start;gap:12px;animation:_chatFadeIn .22s ease;padding:8px 0;width:100%}
    ._chat-row-user{justify-content:flex-end}
    ._chat-row-ai{justify-content:flex-start}

    /* ── Column (holds bubble + actions) ── */
    ._chat-col{display:flex;flex-direction:column;min-width:0}
    ._chat-row-user ._chat-col{align-items:flex-end}
    ._chat-row-ai ._chat-col{flex:1 1 0%;min-width:0}

    /* ── Avatar ── */
    ._chat-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-top:4px}
    ._chat-avatar-user{background:linear-gradient(135deg,var(--accent),var(--accent2,var(--accent)));box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 35%,transparent)}
    ._chat-avatar-ai{background:var(--surface);border:1px solid var(--border)}

    /* ── Message bubble ── */
    ._chat-msg{animation:none}
    ._chat-msg-user{width:fit-content;max-width:clamp(200px,60%,520px)}
    ._chat-msg-ai{max-width:min(100%,48rem)}
    ._chat-msg-error{align-self:center;max-width:90%}

    /* ── Content ── */
    ._chat-content{padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.7;word-break:break-word;overflow-wrap:anywhere;min-width:0}

    /* User bubble */
    ._chat-msg-user ._chat-content{background:linear-gradient(135deg,var(--accent),var(--accent2,var(--accent)));color:var(--text-on-accent,#fff);border-top-right-radius:4px;box-shadow:0 2px 12px color-mix(in srgb,var(--accent) 28%,transparent)}

    /* AI bubble */
    ._chat-msg-ai ._chat-content{background:color-mix(in srgb,var(--surface) 50%,transparent);border:1px solid color-mix(in srgb,var(--border) 40%,transparent);color:var(--text);padding:12px 16px;border-radius:12px}

    /* ── Actions ── */
    ._chat-actions{display:flex;align-items:center;gap:6px;margin-top:4px;opacity:0;transition:opacity .18s;height:24px}
    ._chat-row:hover ._chat-actions{opacity:1}
    ._chat-actions-user{flex-direction:row-reverse}
    ._chat-ts{font-size:11px;color:var(--text-muted,rgba(241,245,249,.35));padding:0 4px}
    ._chat-action-btn{display:inline-flex;align-items:center;gap:3px;background:transparent;border:1px solid var(--border);cursor:pointer;font-size:12px;color:var(--text-muted);padding:3px 9px;border-radius:6px;transition:color .15s,background .15s,border-color .15s;line-height:1.4;white-space:nowrap}
    ._chat-action-btn span{font-size:11px}
    ._chat-action-btn:hover{color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent);border-color:color-mix(in srgb,var(--accent) 35%,transparent)}

    /* ── AI markdown content ── */
    ._chat-msg-ai ._chat-content{line-height:1.75;font-size:14.5px}

    /* Code blocks */
    ._chat-msg-ai ._chat-content .md-pre{position:relative;background:color-mix(in srgb,var(--bg,#09090f) 80%,var(--surface));border-radius:12px;padding:0;overflow:hidden;margin:14px 0;border:1px solid var(--border);font-size:13px}
    ._chat-msg-ai ._chat-content .md-pre .md-code-lang{display:block;padding:6px 14px;font-size:11px;font-weight:600;color:var(--text-muted);background:color-mix(in srgb,var(--border) 40%,transparent);border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px;font-family:inherit}
    ._chat-msg-ai ._chat-content .md-pre code{display:block;padding:14px 18px;overflow-x:auto;font-family:'SF Mono',Monaco,'Cascadia Code',Consolas,monospace;font-size:13px;line-height:1.65;tab-size:2;-moz-tab-size:2}
    ._chat-msg-ai ._chat-content .md-pre code::-webkit-scrollbar{height:4px}
    ._chat-msg-ai ._chat-content .md-pre code::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--accent) 25%,transparent);border-radius:4px}
    ._chat-msg-ai ._chat-content pre:not(.md-pre){background:color-mix(in srgb,var(--bg,#09090f) 80%,var(--surface));border-radius:12px;padding:14px 18px;overflow-x:auto;margin:14px 0;font-size:13px;border:1px solid var(--border)}

    /* Inline code */
    ._chat-msg-ai ._chat-content code{font-family:'SF Mono',Monaco,'Cascadia Code',Consolas,monospace;font-size:13px}
    ._chat-msg-ai ._chat-content .md-inline-code,._chat-msg-ai ._chat-content :not(pre)>code{background:color-mix(in srgb,var(--accent) 10%,transparent);color:var(--accent3,var(--accent));padding:2px 7px;border-radius:5px;font-size:.88em;border:1px solid color-mix(in srgb,var(--accent) 12%,transparent)}

    /* Paragraphs */
    ._chat-msg-ai ._chat-content p{margin:0 0 12px}
    ._chat-msg-ai ._chat-content p:last-child{margin-bottom:0}

    /* Headers */
    ._chat-msg-ai ._chat-content h1{font-size:1.5em;font-weight:700;margin:24px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--border)}
    ._chat-msg-ai ._chat-content h2{font-size:1.3em;font-weight:700;margin:20px 0 10px;padding-bottom:6px;border-bottom:1px solid color-mix(in srgb,var(--border) 50%,transparent)}
    ._chat-msg-ai ._chat-content h3{font-size:1.15em;font-weight:600;margin:16px 0 8px}
    ._chat-msg-ai ._chat-content h4{font-size:1.05em;font-weight:600;margin:14px 0 6px}
    ._chat-msg-ai ._chat-content h1:first-child,._chat-msg-ai ._chat-content h2:first-child,._chat-msg-ai ._chat-content h3:first-child,._chat-msg-ai ._chat-content h4:first-child{margin-top:0}

    /* Tables */
    ._chat-msg-ai ._chat-content .md-table,._chat-msg-ai ._chat-content table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13px;border-radius:8px;overflow:hidden;border:1px solid var(--border)}
    ._chat-msg-ai ._chat-content th{background:color-mix(in srgb,var(--accent) 10%,transparent);font-weight:600;text-align:left;padding:10px 14px;border:1px solid var(--border);font-size:12px;text-transform:uppercase;letter-spacing:.3px;color:var(--text-muted)}
    ._chat-msg-ai ._chat-content td{padding:8px 14px;border:1px solid var(--border)}
    ._chat-msg-ai ._chat-content tbody tr:hover{background:color-mix(in srgb,var(--accent) 5%,transparent)}

    /* Links */
    ._chat-msg-ai ._chat-content a{color:var(--accent3,var(--accent));text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent);transition:border-color .15s,color .15s}
    ._chat-msg-ai ._chat-content a:hover{border-bottom-color:var(--accent);color:var(--accent)}

    /* Lists */
    ._chat-msg-ai ._chat-content ul,._chat-msg-ai ._chat-content ol{padding-left:24px;margin:10px 0}
    ._chat-msg-ai ._chat-content li{margin:4px 0;line-height:1.7}
    ._chat-msg-ai ._chat-content li::marker{color:var(--accent3,var(--accent))}

    /* Blockquotes */
    ._chat-msg-ai ._chat-content blockquote,._chat-msg-ai ._chat-content .md-blockquote{border-left:3px solid var(--accent);margin:12px 0;padding:10px 16px;background:color-mix(in srgb,var(--accent) 5%,transparent);border-radius:0 8px 8px 0;color:color-mix(in srgb,var(--text) 85%,transparent);font-style:italic}

    /* Horizontal rule */
    ._chat-msg-ai ._chat-content hr,._chat-msg-ai ._chat-content .md-hr{border:none;height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);margin:20px 0}

    /* Strikethrough */
    ._chat-msg-ai ._chat-content del{opacity:.6;text-decoration:line-through}

    /* Strong & em */
    ._chat-msg-ai ._chat-content strong{font-weight:700;color:var(--text)}
    ._chat-msg-ai ._chat-content em{font-style:italic;color:color-mix(in srgb,var(--text) 90%,transparent)}
    ._chat-copy-btn{position:absolute;top:8px;right:8px;background:var(--surface);border:1px solid var(--border);color:var(--text-muted);padding:4px 10px;border-radius:7px;font-size:11px;cursor:pointer;opacity:0;transition:opacity .15s,background .15s;display:inline-flex;align-items:center;gap:4px;z-index:2;backdrop-filter:blur(8px)}
    .md-pre ._chat-copy-btn{top:auto;bottom:8px}
    .md-pre:has(.md-code-lang) ._chat-copy-btn{top:8px;bottom:auto}
    pre:hover ._chat-copy-btn,.md-pre:hover ._chat-copy-btn{opacity:1}
    ._chat-copy-btn:hover{background:color-mix(in srgb,var(--accent) 18%,transparent);color:var(--accent);border-color:color-mix(in srgb,var(--accent) 35%,transparent)}
    ._chat-img-preview{display:none;gap:8px;padding:8px 16px;flex-wrap:wrap;align-items:center;background:var(--sidebar-bg);border-top:1px solid var(--border);flex-shrink:0}
    ._chat-img-preview-item{position:relative}
    ._chat-img-remove{position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:12px;line-height:18px;text-align:center;cursor:pointer;padding:0}
    ._chat-input-area{border-top:1px solid var(--border);background:var(--sidebar-bg);flex-shrink:0;padding:14px 32px 18px;padding-bottom:max(18px,env(safe-area-inset-bottom,18px));backdrop-filter:blur(12px)}
    ._chat-input-inner{display:flex;align-items:flex-end;gap:8px;width:100%;box-sizing:border-box;overflow:hidden}
    ._chat-input-area textarea{flex:1;min-width:0;resize:none;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:16px;padding:12px 16px;font-size:14px;line-height:1.6;max-height:160px;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
    ._chat-input-area textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 15%,transparent)}
    ._chat-input-area textarea::placeholder{color:var(--text-muted)}
    ._chat-btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;font-size:18px;transition:all .15s;flex-shrink:0}
    ._chat-btn:active{transform:scale(.9)}
    ._chat-btn-send{background:var(--accent);color:var(--text-on-accent,#fff);box-shadow:0 2px 8px color-mix(in srgb,var(--accent) 38%,transparent)}
    ._chat-btn-send:hover{background:var(--accent2,var(--accent));box-shadow:0 4px 14px color-mix(in srgb,var(--accent) 48%,transparent)}
    ._chat-btn-stop{background:#ef4444;color:#fff;box-shadow:0 2px 8px rgba(239,68,68,.3)}
    ._chat-btn-stop:hover{background:#dc2626}
    ._chat-btn-attach{background:transparent;color:var(--text-muted);font-size:18px;width:36px;height:36px;flex-shrink:0}
    ._chat-btn-attach:hover{color:var(--accent)}
    ._chat-thumb{width:72px;height:72px;object-fit:cover;border-radius:10px;border:1px solid var(--border)}
    ._chat-thumb-sm{width:44px;height:44px;object-fit:cover;border-radius:8px}
    ._chat-img-row{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
    ._chat-thinking ._chat-dots::after{content:'...';animation:_chatDots 1.2s infinite}
    @keyframes _chatDots{0%,100%{content:'...'}33%{content:'.'}66%{content:'..'}}
    ._chat-cursor{display:inline;animation:_chatBlink .6s step-end infinite;color:var(--accent,#6366f1);font-weight:bold}
    @keyframes _chatBlink{0%,100%{opacity:1}50%{opacity:0}}
    ._chat-dropdown{position:fixed;background:var(--sidebar-bg,rgba(18,18,30,.98));border:1px solid var(--border,rgba(255,255,255,.1));border-radius:12px;min-width:160px;z-index:9998;box-shadow:0 8px 32px rgba(0,0,0,.4);overflow:hidden;backdrop-filter:blur(12px)}
    ._chat-dropdown-item{padding:9px 14px;font-size:13px;cursor:pointer;color:var(--text,#f1f5f9);transition:background .1s}
    ._chat-dropdown-item:hover{background:var(--surface-hover,rgba(255,255,255,.07))}
    ._chat-no-key{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:12px;margin:16px 0;color:#f59e0b;font-size:13px}
    ._chat-no-key button{background:rgba(245,158,11,.2);color:#f59e0b;border:1px solid rgba(245,158,11,.3);padding:5px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;transition:all .15s}
    ._chat-no-key button:hover{background:rgba(245,158,11,.35)}
    ._chat-toolbar-group{display:flex;align-items:center;gap:4px}
    ._chat-adapter-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;background:color-mix(in srgb,var(--accent) 12%,transparent);border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);cursor:default;flex-shrink:0}
    ._chat-badge-icon{font-size:13px;color:var(--accent)}
    ._chat-badge-name{font-size:12px;font-weight:600;color:var(--accent3,var(--accent))}
    ._chat-model-badge{display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:20px;background:var(--surface);border:1px solid var(--border);cursor:pointer;flex-shrink:0;transition:border-color .15s,background .15s;max-width:200px}
    ._chat-model-badge:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent)}
    ._chat-model-label{font-size:12px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px}
    ._chat-model-inline-input{background:transparent;border:none;outline:none;color:var(--text);font-size:12px;width:140px}
    ._chat-adapter-btn{padding:4px 10px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-muted);font-size:12px;cursor:pointer;transition:all .15s}
    ._chat-adapter-btn:hover{border-color:var(--accent);color:var(--accent3,var(--accent))}
    ._chat-adapter-btn.active{background:color-mix(in srgb,var(--accent) 15%,transparent);border-color:var(--accent);color:var(--accent3,var(--accent));font-weight:600}
    ._chat-welcome{text-align:center;color:var(--text-muted,rgba(241,245,249,.5));padding:48px 24px 24px;font-size:14px;display:flex;flex-direction:column;align-items:center;gap:8px}
    ._chat-welcome-icon{font-size:48px;margin-bottom:8px;display:block;color:var(--accent);filter:drop-shadow(0 0 24px color-mix(in srgb,var(--accent) 55%,transparent));animation:_chatPulse 3s ease-in-out infinite}
    @keyframes _chatPulse{0%,100%{filter:drop-shadow(0 0 24px color-mix(in srgb,var(--accent) 55%,transparent))}50%{filter:drop-shadow(0 0 40px color-mix(in srgb,var(--accent) 85%,transparent))}}
    ._chat-welcome h3{font-size:20px;font-weight:700;color:var(--text);margin:0}
    ._chat-welcome p{margin:0;font-size:14px;max-width:340px}
    ._chat-suggests{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
    ._chat-suggest-btn{background:color-mix(in srgb,var(--accent) 8%,transparent);border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);color:var(--accent3,var(--accent));padding:7px 14px;border-radius:20px;font-size:12px;cursor:pointer;transition:all .15s;white-space:nowrap}
    ._chat-suggest-btn:hover{background:color-mix(in srgb,var(--accent) 18%,transparent);border-color:var(--accent);transform:translateY(-1px)}
    ._chat-overlay{position:absolute;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
    ._chat-dialog{background:var(--sidebar-bg,rgba(18,18,30,.98));border:1px solid var(--border,rgba(255,255,255,.1));border-radius:20px;padding:24px;max-width:480px;width:90%;box-shadow:0 24px 64px rgba(0,0,0,.5)}
    ._chat-dialog h3{font-size:16px;font-weight:600;margin-bottom:16px;color:var(--text,#f1f5f9)}
    ._chat-dialog textarea{width:100%;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:10px;padding:10px 12px;font-size:13px;font-family:inherit;resize:vertical;outline:none}
    ._chat-dialog textarea:focus{border-color:var(--accent)}
    ._chat-btn-primary{background:var(--accent);color:var(--text-on-accent,#fff);border:none;padding:7px 16px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:600}
    ._chat-btn-secondary{background:var(--surface);color:var(--text);border:1px solid var(--border);padding:7px 14px;border-radius:9px;cursor:pointer;font-size:13px}
    ._chat-settings-btn{border-color:color-mix(in srgb,var(--accent) 32%,transparent);color:var(--accent3,var(--accent))!important}
    ._chat-settings-btn:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)!important;border-color:var(--accent)!important}
    ._chat-settings-dialog{max-width:520px;padding:0;overflow:hidden}
    ._chat-settings-header{display:flex;align-items:center;gap:10px;padding:20px 20px 16px;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}
    ._chat-settings-icon{font-size:18px;opacity:.8}
    ._chat-settings-header h3{flex:1;font-size:15px;font-weight:600;color:var(--text,#f1f5f9);margin:0}
    ._chat-settings-close{background:none;border:none;cursor:pointer;color:var(--text-muted,rgba(241,245,249,.5));font-size:16px;padding:2px 6px;border-radius:6px;transition:color .15s}
    ._chat-settings-close:hover{color:var(--text,#f1f5f9)}
    ._chat-settings-tabs{display:flex;gap:4px;padding:12px 20px 0;border-bottom:1px solid var(--border,rgba(255,255,255,.08))}
    ._chat-settings-tab{background:none;border:none;border-bottom:2px solid transparent;padding:6px 12px;font-size:13px;cursor:pointer;color:var(--text-muted,rgba(241,245,249,.55));margin-bottom:-1px;transition:all .15s;border-radius:6px 6px 0 0}
    ._chat-settings-tab:hover{color:var(--text,#f1f5f9);background:rgba(255,255,255,.04)}
    ._chat-settings-tab.active{color:var(--accent3,var(--accent));border-bottom-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent)}
    ._chat-settings-body{padding:16px 20px;display:flex;flex-direction:column;gap:14px}
    ._chat-settings-field{display:flex;flex-direction:column;gap:6px}
    ._chat-settings-field label{font-size:11px;font-weight:600;color:var(--text-muted,rgba(241,245,249,.55));text-transform:uppercase;letter-spacing:.4px}
    ._chat-settings-field input{background:rgba(255,255,255,.05);color:var(--text,#f1f5f9);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:10px;padding:9px 12px;font-size:13px;outline:none;width:100%;box-sizing:border-box;transition:border-color .15s}
    ._chat-settings-field input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent)}
    ._chat-settings-row{flex-direction:row;gap:12px}
    ._chat-key-wrap{position:relative;display:flex}
    ._chat-key-wrap input{flex:1;padding-right:40px}
    ._chat-key-eye{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:14px;color:var(--text-muted,rgba(241,245,249,.5));padding:2px}
    /* ── Responsive: tablet ── */
    @media(max-width:768px){
      ._chat-msgs-inner{padding:0 16px}
      ._chat-input-area{padding:10px 16px max(16px,env(safe-area-inset-bottom,16px))}
      ._chat-row{gap:10px}
      ._chat-msg-user{max-width:clamp(180px,72%,420px)}
    }
    /* ── Responsive: mobile ── */
    @media(max-width:600px){
      ._chat-toolbar{gap:4px;padding:6px 10px;flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch}
      ._chat-toolbar::-webkit-scrollbar{display:none}
      ._chat-temp-wrap{display:none}
      ._chat-msgs{padding:8px 0}
      ._chat-msgs-inner{padding:0 12px;gap:4px}
      ._chat-row{gap:8px;padding:4px 0}
      ._chat-msg-user{max-width:clamp(160px,78%,400px)}
      ._chat-avatar{width:26px;height:26px;font-size:13px;flex-shrink:0}
      ._chat-content{font-size:13.5px}
      ._chat-msg-user ._chat-content{padding:10px 14px;border-radius:14px}
      ._chat-msg-ai ._chat-content{font-size:13.5px}
      ._chat-msg-ai ._chat-content .md-pre code{padding:10px 12px;font-size:12px}
      ._chat-msg-ai ._chat-content .md-pre .md-code-lang{padding:4px 12px;font-size:10px}
      ._chat-msg-ai ._chat-content h1{font-size:1.25em}
      ._chat-msg-ai ._chat-content h2{font-size:1.15em}
      ._chat-msg-ai ._chat-content th,._chat-msg-ai ._chat-content td{padding:6px 10px;font-size:12px}
      ._chat-input-area{padding:8px 10px max(10px,env(safe-area-inset-bottom,10px));box-sizing:border-box}
      ._chat-input-inner{gap:6px;width:100%;box-sizing:border-box;align-items:flex-end}
      ._chat-input-area textarea{flex:1;min-width:0;padding:9px 12px;font-size:13px;border-radius:14px;max-height:120px;box-sizing:border-box}
      ._chat-btn{width:36px;height:36px;min-width:36px;font-size:16px;flex-shrink:0}
      ._chat-btn-attach{width:32px;height:32px;min-width:32px;font-size:16px;flex-shrink:0}
      ._chat-actions{height:auto;min-height:20px}
      ._chat-action-btn{padding:2px 7px;font-size:11px}
      ._chat-welcome{padding:32px 16px 16px}
      ._chat-welcome-icon{font-size:36px}
      ._chat-welcome h3{font-size:17px}
      ._chat-welcome p{font-size:13px;max-width:280px}
      ._chat-suggest-btn{padding:6px 10px;font-size:11px}
      ._chat-adapter-badge{padding:4px 8px}
      ._chat-badge-name{font-size:11px}
      ._chat-model-badge{padding:4px 8px;max-width:120px}
      ._chat-model-label{font-size:11px;max-width:80px}
      ._chat-settings-btn{font-size:11px;padding:3px 8px}
    }
    /* ── Responsive: very small ── */
    @media(max-width:380px){
      ._chat-msgs-inner{padding:0 8px}
      ._chat-msg-user{max-width:clamp(140px,80%,300px)}
      ._chat-avatar{width:22px;height:22px;font-size:11px}
      ._chat-content{font-size:13px}
      ._chat-input-area{padding:6px 8px max(10px,env(safe-area-inset-bottom,10px))}
      ._chat-toolbar-group:not(:first-child){display:none}
    }
    /* ── Touch devices: always show action buttons (no hover) ── */
    @media(hover:none){
      ._chat-actions{opacity:1;height:auto}
      ._chat-row:hover ._chat-actions{opacity:1}
    }
  `;
  container.innerHTML = '';
  container.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = '_chat-wrap';

  // ── Toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = '_chat-toolbar';

  // Current adapter badge
  const adapterBadge = document.createElement('div');
  adapterBadge.className = '_chat-adapter-badge';
  adapterBadge.id = '_chatAdapterBadge';
  const _adapterIcons = { claude: '✦', 'openai-chat': '⬡', openai: '⬡', gemini: '✴', custom: '⚙' };
  function _chatUpdateBadge() {
    const icon = _adapterIcons[_chatAdapterId] || '◈';
    const name = adapterList.find(a => a.id === _chatAdapterId)?.name || _chatAdapterId;
    adapterBadge.innerHTML = `<span class="_chat-badge-icon">${icon}</span><span class="_chat-badge-name">${name}</span>`;
  }
  _chatUpdateBadge();
  toolbar.appendChild(adapterBadge);

  // Model display (click to edit inline)
  const modelBadge = document.createElement('div');
  modelBadge.className = '_chat-model-badge';
  modelBadge.id = '_chatModelBadge';
  const _currentModel = () => _chatModel || currentAdapter?.defaultModel || '';
  modelBadge.innerHTML = `<span class="_chat-model-label">${_chatEsc(_currentModel()) || '—'}</span><span style="opacity:.4;font-size:10px"> ▾</span>`;
  modelBadge.title = _chatTl('model');
  modelBadge.onclick = () => {
    // inline edit
    const cur = _currentModel();
    const inp = document.createElement('input');
    inp.type = 'text'; inp.value = cur;
    inp.list = '_chatModelDatalist';
    inp.className = '_chat-model-inline-input';
    const dl = document.createElement('datalist');
    dl.id = '_chatModelDatalist';
    (currentAdapter?.models || []).forEach(m => { const o = document.createElement('option'); o.value = m; dl.appendChild(o); });
    modelBadge.innerHTML = ''; modelBadge.appendChild(inp); modelBadge.appendChild(dl);
    inp.focus(); inp.select();
    const done = () => {
      _chatModel = inp.value.trim();
      _chatSaveConfig();
      modelBadge.innerHTML = `<span class="_chat-model-label">${_chatEsc(_chatModel) || '—'}</span><span style="opacity:.4;font-size:10px"> ▾</span>`;
    };
    inp.onblur = done;
    inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') inp.blur(); };
  };
  toolbar.appendChild(modelBadge);

  // Separator
  const sep1 = document.createElement('div'); sep1.className = '_chat-toolbar-sep'; toolbar.appendChild(sep1);

  // Temperature
  const tempGroup = document.createElement('div');
  tempGroup.className = '_chat-toolbar-group _chat-temp-wrap';
  tempGroup.innerHTML = `<label data-i18n="temp" data-i18n-suffix=":">​${_chatTl('temp')}:</label>
    <input type="range" min="0" max="1" step="0.1" value="${_chatTemp}">
    <span class="_chat-temp-val">${_chatTemp}</span>`;
  const rangeInput = tempGroup.querySelector('input[type="range"]');
  const tempVal = tempGroup.querySelector('._chat-temp-val');
  rangeInput.oninput = () => {
    _chatTemp = parseFloat(rangeInput.value);
    tempVal.textContent = _chatTemp.toFixed(1);
    _chatSaveConfig();
  };
  toolbar.appendChild(tempGroup);

  // Separator
  const sep2 = document.createElement('div'); sep2.className = '_chat-toolbar-sep'; toolbar.appendChild(sep2);

  // Context control button
  const ctxWrap = document.createElement('div');
  ctxWrap.className = '_chat-toolbar-group';
  ctxWrap.style.position = 'relative';
  const ctxBtn = document.createElement('button');
  ctxBtn.className = '_chat-adapter-btn';
  ctxBtn.dataset.i18n = 'context';
  ctxBtn.textContent = `${_chatTl('context')} ▾`;
  ctxBtn.onclick = () => _chatToggleCtxMenu(ctxBtn);
  ctxWrap.appendChild(ctxBtn);
  toolbar.appendChild(ctxWrap);

  // Spacer
  const toolbarSpacer = document.createElement('div');
  toolbarSpacer.style.cssText = 'flex:1;min-width:8px';
  toolbar.appendChild(toolbarSpacer);

  // Settings button
  const settingsBtn = document.createElement('button');
  settingsBtn.className = '_chat-adapter-btn _chat-settings-btn';
  settingsBtn.dataset.i18n = 'settings';
  settingsBtn.innerHTML = '⚙ ' + _chatTl('settings');
  settingsBtn.onclick = () => _chatOpenSettings();
  toolbar.appendChild(settingsBtn);

  wrap.appendChild(toolbar);

  // No-key warning is handled at send time (Agent lazy-loads, AG may not be ready at render)

  // ── Message list ──
  const msgList = document.createElement('div');
  msgList.className = '_chat-msgs';
  msgList.id = '_chatMsgList';
  const msgInner = document.createElement('div');
  msgInner.className = '_chat-msgs-inner';
  msgList.appendChild(msgInner);

  // Render history or welcome
  if (_chatMessages.length === 0) {
    const welcome = document.createElement('div');
    welcome.className = '_chat-welcome';
    const suggests = [_chatTl('suggest1'), _chatTl('suggest2'), _chatTl('suggest3'), _chatTl('suggest4')];
    welcome.innerHTML = `<span class="_chat-welcome-icon">✦</span><h3>${_chatTl('title')}</h3><p>${_chatTl('welcome')}</p><div class="_chat-suggests">${suggests.map(s => `<button class="_chat-suggest-btn">${s}</button>`).join('')}</div>`;
    welcome.querySelectorAll('._chat-suggest-btn').forEach(btn => {
      btn.onclick = () => {
        const inp = document.getElementById('_chatInput');
        if (inp) { inp.value = btn.textContent; inp.focus(); inp.dispatchEvent(new Event('input')); }
      };
    });
    msgInner.appendChild(welcome);
  } else {
    for (const m of _chatMessages) {
      _chatRenderMsg(m, msgInner);
    }
  }
  wrap.appendChild(msgList);

  // ── Image preview area ──
  const imgPreview = document.createElement('div');
  imgPreview.className = '_chat-img-preview';
  imgPreview.id = '_chatImgPreview';
  wrap.appendChild(imgPreview);

  // ── Input area ──
  const inputArea = document.createElement('div');
  inputArea.className = '_chat-input-area';
  const inputInner = document.createElement('div');
  inputInner.className = '_chat-input-inner';

  // Attach image button
  const attachBtn = document.createElement('button');
  attachBtn.id = '_chatAttachBtn';
  attachBtn.className = '_chat-btn _chat-btn-attach';
  attachBtn.innerHTML = '📎';
  attachBtn.title = _chatTl('attach_img');
  attachBtn.onclick = _chatAttachImage;
  inputInner.appendChild(attachBtn);

  // Textarea
  const textarea = document.createElement('textarea');
  textarea.id = '_chatInput';
  textarea.rows = 1;
  textarea.placeholder = _chatTl('input_placeholder');
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      _chatSend();
    }
  });
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  });
  // Paste image support
  textarea.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) _chatProcessFiles([file]);
      }
    }
  });
  inputInner.appendChild(textarea);

  // Send button
  const sendBtn = document.createElement('button');
  sendBtn.id = '_chatSendBtn';
  sendBtn.className = '_chat-btn _chat-btn-send';
  sendBtn.innerHTML = '↑';
  sendBtn.title = _chatTl('send');
  sendBtn.onclick = _chatSend;
  inputInner.appendChild(sendBtn);

  // Stop button
  const stopBtn = document.createElement('button');
  stopBtn.id = '_chatStopBtn';
  stopBtn.className = '_chat-btn _chat-btn-stop';
  stopBtn.style.display = 'none';
  stopBtn.innerHTML = '■';
  stopBtn.title = _chatTl('stop');
  stopBtn.onclick = _chatStop;
  inputInner.appendChild(stopBtn);
  inputArea.appendChild(inputInner);

  wrap.appendChild(inputArea);
  container.appendChild(wrap);

  // Scroll to bottom if history loaded
  if (_chatMessages.length > 0) {
    requestAnimationFrame(() => _chatScrollBottom());
  }
  // Remove welcome on first send
  const origSend = _chatSend;
  // Focus input
  requestAnimationFrame(() => textarea.focus());
}
