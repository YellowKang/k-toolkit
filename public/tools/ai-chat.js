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
let _chatAdapterId = '';
let _chatModel = '';
let _chatTemp = 0.7;
let _chatMaxCtx = 20;
let _chatSystemPrompt = '';
let _chatImages = []; // pending images [{base64, mime, name}]
let _chatBusy = false;
let _chatRun = null, _chatPreparing = false, _chatDraft = '', _chatInitialized = false;
let _chatHistoryLimit=40, _chatContextUpdate=null;
let _chatSticky = true, _chatScrollFrame = 0, _chatUndo = null, _chatImageEpoch = 0;
const _chatSay = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;

const _CHAT_LS_KEY = 'dtb_chat_history';
const _CHAT_SYS_KEY = 'dtb_chat_system';
const _CHAT_CFG_KEY = 'dtb_chat_config';

function _chatLoadHistory() {
  try {
    const messages = JSON.parse(localStorage.getItem(_CHAT_LS_KEY));
    const saved=Array.isArray(messages)?messages:messages?.messages;
    if (!Array.isArray(saved)) return [];
    let omitted=messages?.omitted;try{omitted=omitted||JSON.parse(localStorage.getItem('dtb_chat_history_meta')||'{}')?.omitted;}catch{}
    if(omitted)queueMicrotask(()=>window.showToast?.(_chatSay('仅恢复上次保存的最近历史；旧内容请查看导出文件。','Only the recent saved history was restored; see your export for older content.')));

    return saved.filter(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string').slice(-500).map(m => ({ ...m,
      _images: Array.isArray(m._images) ? m._images.filter(img => img && /^image\/(png|jpeg|webp|gif)$/.test(img.mime) && typeof img.base64 === 'string' && /^[A-Za-z0-9+/=]+$/.test(img.base64)).slice(0, 4) : null,
    }));
  } catch { return []; }
}
function _chatSaveHistory() {
  try {
    const save=[];let characters=0;
    for(let i=_chatMessages.length-1;i>=0;i--){const m=_chatMessages[i],value={role:m.role,content:m.content,_images:m._images||null,ts:m.ts,status:m.status},size=JSON.stringify(value).length;if(save.length>=500||characters+size>1500000)break;save.unshift(value);characters+=size;}
    while(save.length&&save[0].role!=='user')save.shift();
    const omitted=_chatMessages.length-save.length;
    localStorage.setItem(_CHAT_LS_KEY,JSON.stringify(save));
    localStorage.setItem('dtb_chat_history_meta',JSON.stringify({omitted}));
    const status=document.getElementById('_chatStorageStatus');if(status)status.textContent=omitted?_chatSay(`刷新后仅恢复最近 ${save.length} 条；请导出以保留完整对话。`,`Only the latest ${save.length} messages will survive refresh; export to keep the full conversation.`):'';
    return true;
  } catch {
    window.showToast?.(_chatSay('对话暂存失败，浏览器空间不足；请导出后再清理。', 'Chat could not be saved. Export it before freeing browser storage.'), 'error');
    return false;
  }
}
function _chatLoadConfig() {
  try { return JSON.parse(localStorage.getItem(_CHAT_CFG_KEY)) || {}; } catch { return {}; }
}
function _chatSaveConfig() {
  try {
    localStorage.setItem(_CHAT_CFG_KEY, JSON.stringify({
      ..._chatLoadConfig(), maxCtx: _chatMaxCtx
    }));
  } catch {}
}

// ── Escape HTML ──
function _chatEsc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Markdown → HTML (use agent's mdToHtml if available, otherwise built-in fallback) ──
function _chatMd(text) {
  if (text.length <= 100000 && typeof window._agMdToHtml === 'function') return window._agMdToHtml(text);
  return '<div style="white-space:pre-wrap">' + _chatEsc(text) + '</div>';
}

// ── Build messages for API ──
function _chatBuildMessages(history = _chatMessages) {
  const trimmed = history;
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
  const context=window.AgentContext?.build(result.slice(1),{system:sys,maxTurns:_chatMaxCtx,replyTokens:window.AgentConfig?.AG.load().max_tokens||2000});
  if(context){_chatContextUpdate?.(context.stats);return context.messages;}
  return result;
}

// ── Format timestamp ──
function _chatFmtTime(ts) {
  const d = ts ? new Date(ts) : new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Copy text helper ──
function _chatCopyText(text, btn) { return window.copyText(text, btn); }

// ── Render a single message bubble ──
function _chatMountContext(){const root=document.getElementById('_chatContextControls');if(root&&!root.childElementCount&&window.AgentContext)_chatContextUpdate=AgentContext.mount(root);}
function _chatOlderButton(container){
  container.querySelector('#_chatLoadOlder')?.remove();
  const first=container.querySelector('._chat-row'),index=first?_chatMessages.indexOf(first._message):0;if(index<=0)return;
  const button=document.createElement('button');button.id='_chatLoadOlder';button.className='_chat-action-btn';button.textContent=_chatSay(`加载更早消息（剩余 ${index} 条）`,`Load earlier messages (${index} remaining)`);
  button.onclick=()=>{const list=document.getElementById('_chatMsgList'),height=list.scrollHeight,top=list.scrollTop;_chatHistoryLimit+=40;_chatRenderHistory(container);list.scrollTop=top+list.scrollHeight-height;};container.prepend(button);
}
function _chatLimitRows(container){const rows=[...container.querySelectorAll('._chat-row')];while(rows.length>_chatHistoryLimit)rows.shift().remove();_chatOlderButton(container);}
function _chatRenderHistory(container){container.replaceChildren();for(const message of _chatMessages.slice(-_chatHistoryLimit))_chatRenderMsg(message,container);_chatOlderButton(container);}
function _chatRenderMsg(msg, container) {
  const isUser = msg.role === 'user';

  // Row wrapper (controls alignment)
  const row = document.createElement('div');
  row._message = msg;
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
  ts.textContent = _chatFmtTime(msg.ts) + (msg.status ? ' · ' + (msg.status === 'stopped' ? _chatSay('已停止 · 部分回复', 'Stopped · Partial reply') : _chatSay('已中断 · 部分回复', 'Interrupted · Partial reply')) : '');
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
    retryBtn.hidden = _chatMessages.at(-1) !== msg;
    retryBtn.onclick = () => _chatRetry(msg);
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

function _chatRefreshRetry() {
  document.querySelectorAll('._chat-row').forEach(row => {
    const button = row.querySelector('[data-action-key="retry"]');
    if (button) { button.hidden = row._message !== _chatMessages.at(-1); button.disabled = _chatBusy; }
  });
}
function _chatRetry(message) {
  if (_chatBusy || _chatMessages.at(-1) !== message) return;
  _chatDoSend('', [], message.role === 'assistant' ? message : null);
}
function _chatFinishRun(run, status, error) {
  if (_chatRun !== run || run.finished) return;
  run.finished = true; clearTimeout(run.renderTimer); clearTimeout(run.timer);
  run.thinking.remove(); run.stream?.row.remove();
  const keep = run.text && (!run.replace || status === 'complete');
  if (keep) {
    const message = { role: 'assistant', content: run.text, ts: Date.now(), status: status === 'complete' ? undefined : status };
    if (run.replace) {
      const index = _chatMessages.indexOf(run.replace);
      if (index >= 0) _chatMessages.splice(index, 1, message);
      run.container.querySelectorAll('._chat-row').forEach(row => { if (row._message === run.replace) row.remove(); });
    } else _chatMessages.push(message);
    _chatRenderMsg(message, run.container);
    _chatSaveHistory();_chatLimitRows(run.container);
  }
  _chatRun = null; _chatBusy = false;
  _chatUpdateButtons(); _chatRefreshRetry();
  if (error) _chatShowError(window.AgentTransport.message(error, run.connection), true);
  _chatScrollBottom();
}
async function _chatDoSend(text, images, replace = null) {
  if (_chatBusy) return;
  const cfg = window.AgentConfig.AG.load();
  if (!cfg.apiKey && cfg.adapter !== 'custom') { _chatShowNoKey(); return; }
  const adapter = window.AgentAdapters.getAdapter(cfg.adapter);
  const container = _chatGetMsgContainer(); if (!container) return;
  const run = { controller: new AbortController(), container, text: '', replace, stream: null, renderTimer: null, finished: false, connection: { baseUrl: cfg.baseUrl } };
  _chatUndo = null; document.getElementById('_chatUndoBar')?.remove();
  _chatRun = run; _chatBusy = true; _chatUpdateButtons(); _chatRefreshRetry();
  container.querySelectorAll('._chat-msg-error, ._chat-welcome').forEach(el => el.remove());
  run.thinking = document.createElement('div'); run.thinking.className = '_chat-thinking'; run.thinking.textContent = _chatTl('thinking'); container.appendChild(run.thinking);
  let params;
  try { params={...cfg,model:cfg.model||adapter.defaultModel,messages:_chatBuildMessages(replace?_chatMessages.slice(0,-1):_chatMessages),signal:run.controller.signal}; }
  catch(error){_chatFinishRun(run,'interrupted',error);return;}
  const transport = window.AgentTransport;
  const resetTimeout = () => { clearTimeout(run.timer); run.timer = transport.timeout(run.controller, 60000); };
  resetTimeout();
  _chatScrollBottom();
  try {
    if (typeof adapter.chatStream === 'function') {
      const iterator = adapter.chatStream(params);
      try {
        while (true) {
          const chunk = await transport.wait(iterator.next(), run.controller.signal);
          if (_chatRun !== run || run.controller.signal.aborted) return;
          if (chunk.done) break;
          resetTimeout();
          if (chunk.value.type !== 'delta' || typeof chunk.value.text !== 'string') continue;
          run.text += chunk.value.text;
          if (run.text.length > 1000000) throw Object.assign(new Error(_chatSay('回复过长，已保留收到的内容。请缩小问题范围。', 'Reply too long. Received text has been kept; narrow the request.')), { code: 'config' });
          if (!run.stream) { run.thinking.remove(); run.stream = _chatCreateStreamRow(container); }
          if (!run.renderTimer) run.renderTimer = setTimeout(() => {
            run.renderTimer = null; if (_chatRun !== run) return;
            run.stream.content.innerHTML = _chatMd(run.text) + '<span class="_chat-cursor">▍</span>';
            _chatScrollBottom();
          }, 100);
        }
      } finally { Promise.resolve(iterator.return?.()).catch(() => {}); }
    } else {
      const result = await transport.wait(adapter.chat(params), run.controller.signal);
      if (_chatRun !== run) return;
      run.text = result.message?.content || '';
    }
    if (!run.text.trim()) throw Object.assign(new Error(_chatSay('服务未返回正文，请检查模型和输出上限后重试。', 'The service returned no text. Check the model and output limit, then retry.')), { code: 'config' });
    _chatFinishRun(run, 'complete');
  } catch (error) {
    _chatFinishRun(run, error.name === 'AbortError' ? 'stopped' : 'interrupted', error.name === 'AbortError' ? null : error);
  } finally {
    clearTimeout(run.timer); run.controller.abort();
  }
}

// ── Send message ──
async function _chatSend() {
  const input = document.getElementById('_chatInput');
  const text = (input?.value || '').trim();
  if (!text && _chatImages.length === 0) return;
  if (_chatBusy) return;

  if (_chatPreparing) return;
  _chatPreparing = true;
  try { if (!window.AgentAdapters && !await window._agEnsureLoaded()) return; }
  catch { _chatShowError(_chatTl('no_adapter')); return; }
  finally { _chatPreparing = false; }
  if (!input?.isConnected || _chatBusy) return;
  _chatSyncConfig();
  const cfg = window.AgentConfig.AG.load();
  if (!cfg.apiKey && cfg.adapter !== 'custom') { _chatShowNoKey(); return; }
  _chatUndo = null; document.getElementById('_chatUndoBar')?.remove();

  // Build user message
  const userMsg = {
    role: 'user',
    content: text,
    _images: _chatImages.length > 0 ? [..._chatImages] : null,
    ts: Date.now(),
  };
  _chatMessages.push(userMsg);
  _chatSaveHistory();
  _chatImages = []; _chatImageEpoch++;
  _chatDraft = "";
  _chatUpdateImgPreview();

  // Render user bubble
  const msgList = _chatGetMsgContainer();
  _chatRenderMsg(userMsg, msgList);_chatLimitRows(msgList);
  input.value = '';
  input.style.height = 'auto';
  _chatScrollBottom(true);

  // Delegate to core send
  await _chatDoSend(text, userMsg._images || []);
}

function _chatStop() {
  if (!_chatRun) return;
  const run = _chatRun;
  run.controller.abort();
  _chatFinishRun(run, 'stopped');
}

function _chatShowError(msg, retry = false) {
  const msgList = _chatGetMsgContainer();
  if (!msgList) return;
  const el = document.createElement('div');
  el.className = '_chat-msg _chat-msg-error';
  el.style.cssText = 'align-self:center;max-width:90%;margin:4px auto';
  el.innerHTML = `<div class="_chat-content" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);color:#f87171;border-radius:12px">&#x26a0; ${_chatEsc(msg)}</div>`;
  if (retry) {
    const button = document.createElement('button'); button.className = '_chat-action-btn'; button.textContent = _chatTl('retry');
    button.onclick = () => { const last = _chatMessages.at(-1); if (last) _chatRetry(last); };
    el.appendChild(button);
  }
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
  btn.onclick = _chatOpenSettings;
  inner.appendChild(btn);
  el.appendChild(inner);
  msgList.appendChild(el);
  _chatScrollBottom();
}

function _chatScrollBottom(force = false) {
  if (force) _chatSticky = true;
  if (!_chatSticky) return;
  const el = document.getElementById('_chatMsgList');
  cancelAnimationFrame(_chatScrollFrame);
  _chatScrollFrame = requestAnimationFrame(() => { if (el?.isConnected && _chatSticky) el.scrollTop = el.scrollHeight; });
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
  if (input) input.setAttribute('aria-busy', String(_chatBusy));
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

async function _chatProcessFiles(files) {
  const epoch = _chatImageEpoch;
  for (const file of files) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 2 * 1024 * 1024 || _chatImages.length >= 4) {
      window.showToast?.(_chatSay('最多 4 张 PNG/JPEG/WebP/GIF，每张不超过 2 MB。', 'Up to 4 PNG/JPEG/WebP/GIF images, at most 2 MB each.'), 'error'); continue;
    }
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      if (epoch !== _chatImageEpoch) return;
      if (_chatImages.length >= 4) break;
      _chatImages.push({ base64: data.split(',')[1], mime: file.type, name: file.name }); _chatUpdateImgPreview();
    } catch { window.showToast?.(_chatSay('图片读取失败。', 'Could not read image.'), 'error'); }
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
  _chatStop();
  _chatUndo = { messages: _chatMessages, images: _chatImages, draft: document.getElementById('_chatInput')?.value || _chatDraft };
  _chatMessages = []; _chatImages = []; _chatDraft = ''; _chatImageEpoch++;
  const inner = _chatGetMsgContainer(); inner?.replaceChildren();
  const input = document.getElementById('_chatInput'); if (input) input.value = '';
  _chatUpdateImgPreview(); _chatSaveHistory();
  document.getElementById('_chatUndoBar')?.remove();
  const bar = document.createElement('div'); bar.id = '_chatUndoBar'; bar.className = '_chat-notice';
  const button = document.createElement('button'); button.className = '_chat-action-btn'; button.textContent = _chatSay('撤销清空', 'Undo clear');
  button.onclick = () => {
    if (!_chatUndo || _chatBusy) return;
    _chatMessages = _chatUndo.messages; _chatImages = _chatUndo.images; _chatDraft = _chatUndo.draft; _chatUndo = null;
    if (input) { input.value = _chatDraft; input.dispatchEvent(new Event('input')); }
    _chatRenderHistory(inner);
    _chatUpdateImgPreview(); _chatSaveHistory(); _chatScrollBottom(true); bar.remove();
  };
  bar.appendChild(button); document.getElementById('_chatMsgList')?.after(bar);
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

// ── Shared connection settings ──
async function _chatOpenSettings() {
  try { if (!window.AgentConfig && !await window._agEnsureLoaded()) return; window._agOpenConfig(); }
  catch { _chatShowError(_chatTl('no_adapter')); }
}
async function _chatOpenModels() {
  try { if (!window.AgentConfig && !await window._agEnsureLoaded()) return; window._agOpenModelPicker(); }
  catch { _chatShowError(_chatTl('no_adapter')); }
}
function _chatSyncConfig() {
  const cfg = window.AgentConfig?.AG.load(); if (!cfg) return;
  _chatAdapterId = cfg.adapter; _chatModel = cfg.model; _chatTemp = cfg.temperature;
  const adapter = window.AgentAdapters.getAdapter(cfg.adapter);
  const setup = document.getElementById('_chatSetup'); if (setup) setup.hidden = !!cfg.apiKey || (cfg.adapter === 'custom' && !!cfg.baseUrl && !!cfg.model);
  const badge = document.getElementById('_chatAdapterBadge'); if (badge) badge.textContent = adapter.name;
  const model = document.getElementById('_chatModelBadge'); if (model) model.textContent = cfg.model || adapter.defaultModel || '—';
  const range = document.querySelector('._chat-temp-wrap input'); if (range) range.value = cfg.temperature;
  const value = document.querySelector('._chat-temp-val'); if (value) value.textContent = cfg.temperature;
}
window.addEventListener('agent-config-change', _chatSyncConfig);

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
  const home = document.getElementById('_chatHome'); if (home) home.textContent = _chatSay('← 工具箱', '← Toolbox');
  const clear = document.getElementById('_chatClearBtn'); if (clear) clear.textContent = _chatSay('清空对话', 'Clear chat');
  const setup = document.getElementById('_chatSetup'); if (setup) setup.textContent = _chatSay('配置 AI 连接', 'Configure AI connection');
  const jump = document.getElementById('_chatJumpBottom'); if (jump) jump.textContent = _chatSay('↓ 回到最新消息', '↓ Latest messages');
  const undo = document.querySelector('#_chatUndoBar button'); if (undo) undo.textContent = _chatSay('撤销清空', 'Undo clear');
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
  _chatAdapterId = AG?.load().adapter || _lsGet('adapter', 'claude');
  _chatModel = AG?.load().model || _lsGet('model', '');
  _chatTemp = AG?.load().temperature ?? _lsGet('temperature', 0.7);
  _chatMaxCtx = [0, 5, 10, 20].includes(savedCfg.maxCtx) ? savedCfg.maxCtx : 20;
  try { _chatSystemPrompt = localStorage.getItem(_CHAT_SYS_KEY) || ''; } catch {}
  if (!_chatInitialized) { _chatMessages = _chatLoadHistory(); _chatInitialized = true; }
  _chatSticky = true;
  if (!window.AgentAdapters && window._agEnsureLoaded) window._agEnsureLoaded().then(() => {
    if (container.isConnected) {
      _chatSyncConfig();_chatMountContext();
      if (!_chatBusy) { const inner = _chatGetMsgContainer(); if (inner && _chatMessages.length) { _chatRenderHistory(inner); } }
    }
  }).catch(() => {});
  // Get adapters
  const adapters = window.AgentAdapters?.listAdapters?.() || [];
  const adapterList = adapters.length > 0 ? adapters : [
    { id: 'claude', name: 'Claude' },
    { id: 'openai-chat', name: 'OpenAI' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'custom', name: 'Custom' },
  ];
  const currentAdapter = window.AgentAdapters?.getAdapter?.(_chatAdapterId);

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

    ._chat-msgs-inner{max-width:1000px;margin:0 auto;width:100%}
    ._chat-input-inner{max-width:936px;margin:0 auto}
    ._chat-actions{opacity:.75!important;height:auto!important;min-height:28px;flex-wrap:wrap}
    ._chat-actions:focus-within,._chat-row:hover ._chat-actions{opacity:1!important}
    #_chatSetup[hidden],._chat-action-btn[hidden],._chat-jump[hidden]{display:none!important}
    ._chat-jump{align-self:center;flex-shrink:0;margin:4px 0;padding:7px 15px;border:1px solid var(--border);border-radius:20px;background:var(--surface);color:var(--accent);cursor:pointer;font-size:12px}
    ._chat-thinking,._chat-notice{color:var(--text-muted);padding:10px 16px;font-size:12px;text-align:center}
    ._chat-model-badge{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    ._chat-wrap button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    @media(prefers-reduced-motion:reduce){._chat-row{animation:none!important}._chat-cursor{animation:none!important}}
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
    /* ── Responsive: tablet ── */
    @media(max-width:768px){
      ._chat-msgs-inner{padding:0 16px}
      ._chat-input-area{padding:10px 16px max(16px,env(safe-area-inset-bottom,16px))}
      ._chat-row{gap:10px}
      ._chat-msg-user{max-width:clamp(180px,72%,420px)}
    }
    /* ── Responsive: mobile ── */
    @media(max-width:600px){
      ._chat-toolbar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:7px;padding:8px 10px;overflow:visible}
      ._chat-toolbar button{white-space:nowrap;min-height:30px}
      #_chatHome{grid-area:1/1} #_chatClearBtn{grid-area:1/2;justify-self:start}
      ._chat-settings-btn{grid-area:1/3}
      #_chatAdapterBadge{grid-area:2/1}
      #_chatModelBadge{grid-area:2/2;max-width:100%;min-width:0}
      #_chatCtxWrap{grid-area:2/3;display:flex}
      ._chat-toolbar-sep,._chat-toolbar-spacer{display:none}
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
  const home = document.createElement('button'); home.id = '_chatHome'; home.className = '_chat-adapter-btn'; home.textContent = _chatSay('← 工具箱', '← Toolbox'); home.onclick = () => navigateTo('home'); toolbar.appendChild(home);
  const clear = document.createElement('button'); clear.id = '_chatClearBtn'; clear.className = '_chat-adapter-btn'; clear.textContent = _chatSay('清空对话', 'Clear chat'); clear.onclick = _chatClear; toolbar.appendChild(clear);

  // Current adapter badge
  const adapterBadge = document.createElement('button');
  adapterBadge.className = '_chat-adapter-badge';
  adapterBadge.id = '_chatAdapterBadge';
  adapterBadge.onclick = _chatOpenSettings; adapterBadge.title = _chatTl('settings');
  const _adapterIcons = { claude: '✦', 'openai-chat': '⬡', openai: '⬡', gemini: '✴', custom: '⚙' };
  function _chatUpdateBadge() {
    const icon = _adapterIcons[_chatAdapterId] || '◈';
    const name = adapterList.find(a => a.id === _chatAdapterId)?.name || _chatAdapterId;
    adapterBadge.innerHTML = `<span class="_chat-badge-icon">${icon}</span><span class="_chat-badge-name">${name}</span>`;
  }
  _chatUpdateBadge();
  toolbar.appendChild(adapterBadge);

  const modelBadge = document.createElement('button');
  modelBadge.className = '_chat-model-badge'; modelBadge.id = '_chatModelBadge';
  modelBadge.textContent = _chatModel || currentAdapter?.defaultModel || '—'; modelBadge.title = _chatSay('切换模型', 'Switch model'); modelBadge.onclick = _chatOpenModels;
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
  };
  rangeInput.setAttribute('aria-label', _chatTl('temp'));
  rangeInput.onchange = () => {
    const AG = window.AgentConfig?.AG; if (!AG) return;
    try { AG.save({ ...AG.load(), temperature: Number(rangeInput.value) }); } catch (e) { _chatSyncConfig(); window.showToast?.(e.message, 'error'); }
  };
  toolbar.appendChild(tempGroup);

  // Separator
  const sep2 = document.createElement('div'); sep2.className = '_chat-toolbar-sep'; toolbar.appendChild(sep2);

  // Context control button
  const ctxWrap = document.createElement('div');
  ctxWrap.className = '_chat-toolbar-group'; ctxWrap.id = '_chatCtxWrap';
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
  toolbarSpacer.className = '_chat-toolbar-spacer';
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
  const context=document.createElement('div');context.id='_chatContextControls';wrap.append(context);queueMicrotask(_chatMountContext);
  const storageStatus=document.createElement('p');storageStatus.id='_chatStorageStatus';storageStatus.className='_chat-notice';storageStatus.setAttribute('role','status');wrap.append(storageStatus);

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
    const setup = document.createElement('button'); setup.id = '_chatSetup'; setup.className = '_chat-btn-primary'; setup.textContent = _chatSay('配置 AI 连接', 'Configure AI connection'); setup.onclick = _chatOpenSettings;
    welcome.appendChild(setup);
    msgInner.appendChild(welcome);
  } else {
    _chatRenderHistory(msgInner);
  }
  wrap.appendChild(msgList);
  const jump = document.createElement('button'); jump.id = '_chatJumpBottom'; jump.className = '_chat-jump'; jump.textContent = _chatSay('↓ 回到最新消息', '↓ Latest messages'); jump.hidden = true;
  jump.onclick = () => { _chatScrollBottom(true); jump.hidden = true; };
  msgList.addEventListener('scroll', () => { _chatSticky = msgList.scrollHeight - msgList.scrollTop - msgList.clientHeight < 80; jump.hidden = _chatSticky; }, { passive: true });
  wrap.appendChild(jump);

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
  textarea.rows = 1; textarea.value = _chatDraft; textarea.setAttribute('aria-label', _chatTl('input_placeholder'));
  textarea.placeholder = _chatTl('input_placeholder');
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      _chatSend();
    }
  });
  textarea.addEventListener('input', () => {
    _chatDraft = textarea.value;
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
    requestAnimationFrame(() => _chatScrollBottom(true));
  }
  _chatUpdateImgPreview(); _chatSyncConfig();
  window._activeCleanup = () => {
    _chatDraft = textarea.value; _chatStop(); _chatImageEpoch++; cancelAnimationFrame(_chatScrollFrame);
  };
  // Focus input
  requestAnimationFrame(() => { if (textarea.isConnected) { textarea.dispatchEvent(new Event('input')); textarea.focus(); } });
}
