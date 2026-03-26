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

// ── Render a single message bubble ──
function _chatRenderMsg(msg, container) {
  const isUser = msg.role === 'user';
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
    // AI: Markdown render
    const md = typeof window._agMdToHtml === 'function'
      ? window._agMdToHtml(msg.content || '')
      : _chatEsc(msg.content || '').replace(/\n/g, '<br>');
    content.innerHTML = md;
    // Add copy buttons to code blocks
    content.querySelectorAll('pre').forEach(pre => {
      const btn = document.createElement('button');
      btn.className = '_chat-copy-btn';
      btn.textContent = _chatTl('copy');
      btn.onclick = () => {
        navigator.clipboard.writeText(pre.textContent).then(() => {
          btn.textContent = _chatTl('copied');
          setTimeout(() => btn.textContent = _chatTl('copy'), 1500);
        });
      };
      pre.style.position = 'relative';
      pre.appendChild(btn);
    });
  }
  bubble.appendChild(content);
  container.appendChild(bubble);
  return bubble;
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

  // Show thinking
  _chatBusy = true;
  _chatUpdateButtons();
  const thinkEl = document.createElement('div');
  thinkEl.className = '_chat-msg _chat-msg-ai _chat-thinking';
  thinkEl.innerHTML = `<div class="_chat-content"><span class="_chat-dots">${_chatTl('thinking')}</span></div>`;
  msgList.appendChild(thinkEl);
  _chatScrollBottom();

  try {
    _chatAbort = new AbortController();
    // Ensure Agent module is loaded before using adapters
    if (!window.AgentAdapters) {
      if (window._agEnsureLoaded) await window._agEnsureLoaded();
    }
    const adapter = window.AgentAdapters?.getAdapter(_chatAdapterId);
    if (!adapter) throw new Error(_chatTl('no_adapter'));

    const messages = _chatBuildMessages();
    const baseUrl = AG?.get?.('base_url', '') || '';

    const result = await adapter.chat({
      messages,
      model: _chatModel || adapter.defaultModel,
      max_tokens: AG?.get?.('max_tokens', 2000) || 2000,
      temperature: _chatTemp,
      baseUrl: baseUrl || undefined,
      apiKey,
      signal: _chatAbort.signal,
      // No tools parameter → pure chat
    });

    thinkEl.remove();
    const aiMsg = {
      role: 'assistant',
      content: result.message?.content || '',
      ts: Date.now(),
    };
    _chatMessages.push(aiMsg);
    _chatRenderMsg(aiMsg, msgList);
    _chatScrollBottom();
    _chatSaveHistory();
  } catch (err) {
    thinkEl.remove();
    if (err.name !== 'AbortError') {
      _chatShowError(err.message || _chatTl('error'));
    }
  } finally {
    _chatBusy = false;
    _chatAbort = null;
    _chatUpdateButtons();
  }
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
}

function _chatShowError(msg) {
  const msgList = _chatGetMsgContainer();
  if (!msgList) return;
  const el = document.createElement('div');
  el.className = '_chat-msg _chat-msg-error';
  el.innerHTML = `<div class="_chat-content" style="color:#ef4444">&#x26a0; ${_chatEsc(msg)}</div>`;
  msgList.appendChild(el);
  _chatScrollBottom();
}

function _chatShowNoKey() {
  const msgList = _chatGetMsgContainer();
  if (!msgList) return;
  const el = document.createElement('div');
  el.className = '_chat-msg _chat-msg-error';
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
  document.body.appendChild(overlay);
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  document.getElementById('_chatSysCancel').onclick = () => overlay.remove();
  document.getElementById('_chatSysReset').onclick = () => {
    document.getElementById('_chatSysInput').value = _chatTl('system_default');
  };
  document.getElementById('_chatSysSave').onclick = () => {
    _chatSystemPrompt = document.getElementById('_chatSysInput').value.trim();
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

  btn.parentElement.style.position = 'relative';
  btn.parentElement.appendChild(menu);
  // Close on outside click
  setTimeout(() => {
    const handler = e => { if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); document.removeEventListener('click', handler); } };
    document.addEventListener('click', handler);
  }, 0);
}

// ── Main render ──
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
    ._chat-wrap{display:flex;flex-direction:column;flex:1;height:100%;min-height:0;border-radius:0;overflow:hidden;border:none;background:var(--bg-main,#0f0f1a)}
    .content.chat-page-mode{padding:0!important;overflow:hidden;display:flex;flex-direction:column}
    ._chat-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--border-color,#2d2d4e);background:var(--bg-card,rgba(18,18,30,0.95));flex-shrink:0}
    ._chat-toolbar label{font-size:12px;color:var(--text-secondary,#94a3b8);white-space:nowrap}
    ._chat-toolbar select,._chat-toolbar input[type="text"]{background:var(--bg-main,#0f172a);color:var(--text-color,#e2e8f0);border:1px solid var(--border-color,#334155);border-radius:6px;padding:4px 8px;font-size:13px;outline:none}
    ._chat-toolbar select:focus,._chat-toolbar input:focus{border-color:#6366f1}
    ._chat-temp-wrap{display:flex;align-items:center;gap:4px}
    ._chat-temp-wrap input[type="range"]{width:80px;accent-color:#6366f1}
    ._chat-temp-val{font-size:12px;color:var(--text-secondary,#94a3b8);min-width:28px;text-align:center}
    ._chat-msgs{flex:1;overflow-y:auto;padding:20px 0;display:flex;flex-direction:column;gap:14px;min-height:0}
    ._chat-msgs-inner{width:100%;max-width:860px;margin:0 auto;padding:0 20px;display:flex;flex-direction:column;gap:14px}
    ._chat-msg{max-width:75%;animation:_chatFadeIn .25s ease}
    ._chat-msg-user{align-self:flex-end}
    ._chat-msg-ai{align-self:flex-start}
    ._chat-msg-error{align-self:center}
    ._chat-content{padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.65;word-break:break-word}
    ._chat-msg-user ._chat-content{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-bottom-right-radius:4px}
    ._chat-msg-ai ._chat-content{background:var(--bg-main,#1e293b);color:var(--text-color,#e2e8f0);border-bottom-left-radius:4px}
    ._chat-msg-ai ._chat-content pre{background:rgba(0,0,0,.3);border-radius:8px;padding:12px;overflow-x:auto;margin:8px 0;font-size:13px}
    ._chat-msg-ai ._chat-content code{font-family:'SF Mono',Monaco,Consolas,monospace;font-size:13px}
    ._chat-msg-ai ._chat-content p{margin:0 0 8px}
    ._chat-msg-ai ._chat-content p:last-child{margin-bottom:0}
    ._chat-msg-ai ._chat-content table{border-collapse:collapse;width:100%;margin:8px 0}
    ._chat-msg-ai ._chat-content th,._chat-msg-ai ._chat-content td{border:1px solid var(--border-color,#334155);padding:6px 10px;text-align:left;font-size:13px}
    ._chat-msg-ai ._chat-content th{background:rgba(99,102,241,.15)}
    ._chat-msg-ai ._chat-content a{color:#818cf8;text-decoration:underline}
    ._chat-msg-ai ._chat-content ul,._chat-msg-ai ._chat-content ol{padding-left:20px;margin:4px 0}
    ._chat-msg-ai ._chat-content blockquote{border-left:3px solid #6366f1;margin:8px 0;padding:4px 12px;opacity:.85}
    ._chat-copy-btn{position:absolute;top:6px;right:6px;background:rgba(255,255,255,.12);border:none;color:#94a3b8;padding:3px 8px;border-radius:4px;font-size:11px;cursor:pointer;opacity:0;transition:opacity .15s}
    pre:hover ._chat-copy-btn{opacity:1}
    ._chat-copy-btn:hover{background:rgba(255,255,255,.2);color:#e2e8f0}
    ._chat-input-area{display:flex;align-items:flex-end;gap:8px;padding:12px 20px 16px;border-top:1px solid var(--border-color,#2d2d4e);background:var(--bg-card,rgba(18,18,30,0.95));flex-shrink:0}
    ._chat-input-inner{display:flex;align-items:flex-end;gap:8px;width:100%;max-width:860px;margin:0 auto}
    ._chat-input-area textarea{flex:1;resize:none;background:var(--bg-main,#0f172a);color:var(--text-color,#e2e8f0);border:1px solid var(--border-color,#334155);border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.6;max-height:160px;outline:none;font-family:inherit;transition:border-color .15s}
    ._chat-input-area textarea:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.15)}
    ._chat-input-area textarea::placeholder{color:var(--text-secondary,#64748b)}
    ._chat-btn{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;border:none;cursor:pointer;font-size:18px;transition:background .15s,transform .1s;flex-shrink:0}
    ._chat-btn:active{transform:scale(.92)}
    ._chat-btn-send{background:#6366f1;color:#fff}
    ._chat-btn-send:hover{background:#4f46e5}
    ._chat-btn-stop{background:#ef4444;color:#fff}
    ._chat-btn-stop:hover{background:#dc2626}
    ._chat-btn-attach{background:transparent;color:var(--text-secondary,#94a3b8);font-size:20px}
    ._chat-btn-attach:hover{color:#6366f1}
    ._chat-img-row{display:flex;gap:6px;margin-bottom:6px;flex-wrap:wrap}
    ._chat-thumb{width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,.1)}
    ._chat-thumb-sm{width:48px;height:48px;object-fit:cover;border-radius:6px}
    ._chat-img-preview{display:none;gap:6px;padding:0 16px 4px;flex-wrap:wrap;align-items:center}
    ._chat-img-preview-item{position:relative}
    ._chat-img-remove{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;border:none;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
    ._chat-dots{display:inline-block;animation:_chatPulse 1.2s infinite}
    @keyframes _chatPulse{0%,100%{opacity:.4}50%{opacity:1}}
    @keyframes _chatFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    ._chat-dropdown{position:absolute;top:100%;right:0;margin-top:4px;background:var(--bg-card,#1e293b);border:1px solid var(--border-color,#334155);border-radius:10px;padding:4px;min-width:140px;z-index:100;box-shadow:0 8px 24px rgba(0,0,0,.3)}
    ._chat-dropdown-item{padding:8px 12px;border-radius:6px;cursor:pointer;font-size:13px;color:var(--text-color,#e2e8f0);white-space:nowrap}
    ._chat-dropdown-item:hover{background:rgba(99,102,241,.15)}
    ._chat-dropdown-item.active{color:#818cf8;font-weight:600}
    ._chat-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;display:flex;align-items:center;justify-content:center}
    ._chat-dialog{background:var(--bg-card,#1e293b);border:1px solid var(--border-color,#334155);border-radius:16px;padding:24px;max-width:500px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,.4)}
    ._chat-dialog h3{margin:0 0 16px;color:var(--text-color,#e2e8f0);font-size:16px}
    ._chat-btn-primary{background:#6366f1;color:#fff;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px}
    ._chat-btn-primary:hover{background:#4f46e5}
    ._chat-btn-secondary{background:transparent;color:var(--text-secondary,#94a3b8);border:1px solid var(--border-color,#334155);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px}
    ._chat-btn-secondary:hover{background:rgba(255,255,255,.05)}
    ._chat-no-key{display:flex;align-items:center;gap:12px;padding:12px 16px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;margin:16px;color:#f59e0b;font-size:13px}
    ._chat-no-key button{background:#f59e0b;color:#000;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap}
    ._chat-toolbar-group{display:flex;align-items:center;gap:4px}
    ._chat-adapter-btn{padding:4px 10px;border-radius:6px;border:1px solid var(--border-color,#334155);background:transparent;color:var(--text-secondary,#94a3b8);font-size:12px;cursor:pointer;transition:all .15s}
    ._chat-adapter-btn:hover{border-color:#6366f1;color:#818cf8}
    ._chat-adapter-btn.active{background:rgba(99,102,241,.15);border-color:#6366f1;color:#818cf8;font-weight:600}
    ._chat-welcome{text-align:center;color:var(--text-secondary,#64748b);padding:48px 24px;font-size:14px}
    ._chat-welcome-icon{font-size:48px;margin-bottom:16px;display:block}
  `;
  container.innerHTML = '';
  container.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = '_chat-wrap';

  // ── Toolbar ──
  const toolbar = document.createElement('div');
  toolbar.className = '_chat-toolbar';

  // Adapter buttons
  const adapterGroup = document.createElement('div');
  adapterGroup.className = '_chat-toolbar-group';
  adapterGroup.innerHTML = `<label>${_chatTl('adapter')}:</label>`;
  for (const a of adapterList) {
    const btn = document.createElement('button');
    btn.className = '_chat-adapter-btn' + (a.id === _chatAdapterId ? ' active' : '');
    btn.textContent = a.name || a.id;
    btn.onclick = () => {
      _chatAdapterId = a.id;
      adapterGroup.querySelectorAll('._chat-adapter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Update model list
      const newAdapter = window.AgentAdapters?.getAdapter?.(a.id);
      const dl = document.getElementById('_chatModelList');
      if (dl && newAdapter?.models) {
        dl.innerHTML = '';
        newAdapter.models.forEach(m => { const o = document.createElement('option'); o.value = m; dl.appendChild(o); });
      }
      _chatModel = newAdapter?.defaultModel || '';
      const modelInput = document.getElementById('_chatModelInput');
      if (modelInput) modelInput.value = _chatModel;
      _chatSaveConfig();
    };
    adapterGroup.appendChild(btn);
  }
  toolbar.appendChild(adapterGroup);

  // Model input
  const modelGroup = document.createElement('div');
  modelGroup.className = '_chat-toolbar-group';
  modelGroup.innerHTML = `<label>${_chatTl('model')}:</label>
    <input type="text" id="_chatModelInput" list="_chatModelList" value="${_chatEsc(_chatModel || currentAdapter?.defaultModel || '')}" style="width:160px" placeholder="model name">
    <datalist id="_chatModelList">${models.map(m => `<option value="${m}">`).join('')}</datalist>`;
  modelGroup.querySelector('input').oninput = e => {
    _chatModel = e.target.value.trim();
    _chatSaveConfig();
  };
  toolbar.appendChild(modelGroup);

  // Temperature
  const tempGroup = document.createElement('div');
  tempGroup.className = '_chat-toolbar-group _chat-temp-wrap';
  tempGroup.innerHTML = `<label>${_chatTl('temp')}:</label>
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

  // Context control button
  const ctxWrap = document.createElement('div');
  ctxWrap.className = '_chat-toolbar-group';
  ctxWrap.style.position = 'relative';
  const ctxBtn = document.createElement('button');
  ctxBtn.className = '_chat-adapter-btn';
  ctxBtn.textContent = `${_chatTl('context')} ▾`;
  ctxBtn.onclick = () => _chatToggleCtxMenu(ctxBtn);
  ctxWrap.appendChild(ctxBtn);
  toolbar.appendChild(ctxWrap);

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
    welcome.innerHTML = `<span class="_chat-welcome-icon">💬</span>${_chatTl('welcome')}`;
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
    if (e.key === 'Enter' && !e.shiftKey) {
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
