'use strict';

// The active conversation keeps the legacy keys. Archives never duplicate active history.
window.ChatConversations = (() => {
  const INDEX = 'dtb_chat_sessions', PREFIX = 'dtb_chat_session_';
  const keys = { messages: 'dtb_chat_history', meta: 'dtb_chat_history_meta', systemPrompt: 'dtb_chat_system', draft: 'dtb_chat_draft', images: 'dtb_chat_draft_images' };
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const idOK = id => /^chat-[a-zA-Z0-9-]{1,80}$/.test(id || '');
  let observed;
  const clone = value => JSON.parse(JSON.stringify(value)); // The persistence contract contains JSON values only.
  const mutate = operation => window.ToolRuntime.exclusive('chat-conversations', operation);
  function prepare(snapshot) {
    const messages = snapshot.messages || [], saved = [];
    let end = messages.length, chars = 2, count = 0;
    while (end > 0) {
      let start = end - 1;
      while (start > 0 && messages[start].role !== 'user') start--;
      const turn = messages.slice(start, end).map(m => ({ role: m.role, content: m.content, _images: m._images || null, ts: m.ts, status: m.status }));
      const size = turn.reduce((n, m) => n + JSON.stringify(m).length + 1, 0);
      if (turn[0].role !== 'user' || count + turn.length > 500 || chars + size > 1500000) {
        if (!count) throw Object.assign(new Error(say(
          '本轮文字或图片超过会话保存上限，原存档已保留。请缩小图片或文字后重试；当前输入和回复仍在本标签页。',
          'This turn exceeds the chat storage limit. The previous saved history is intact. Reduce the images or text and retry; current inputs and replies remain in this tab.'
        )), { code: 'chat_turn_limit' });
        break;
      }
      saved.unshift(turn); count += turn.length; chars += size; end = start;
    }
    const prior = Number.isSafeInteger(snapshot.meta?.omitted) && snapshot.meta.omitted > 0 ? snapshot.meta.omitted : 0;
    return { ...snapshot, messages: saved.flat(), meta: { ...snapshot.meta, omitted: prior + messages.length - count } };
  }
  function write(values) {
    const before = new Map(Object.keys(values).map(key => [key, localStorage.getItem(key)]));
    try {
      // Remove target archives first so switching does not temporarily double storage.
      for (const [key, value] of Object.entries(values)) if (value === null) localStorage.removeItem(key);
      for (const [key, value] of Object.entries(values)) if (value !== null) localStorage.setItem(key, value);
    } catch {
      for (const key of Object.keys(values)) { try { localStorage.removeItem(key); } catch {} }
      for (const [key, value] of before) if (value !== null) { try { localStorage.setItem(key, value); } catch {} }
      throw new Error(say('保存失败，未切换会话。请导出对话后释放浏览器空间。', 'Save failed; conversation was not switched. Export chats and free browser storage.'));
    }
    observed = localStorage.getItem(INDEX);
  }
  function ensure() {
    const saved = parse(INDEX, null);
    if (saved?.version === 1 && Array.isArray(saved.items) && saved.items.length && saved.items.length <= 50 && saved.items.every(item => idOK(item.id) && typeof item.title === 'string') && new Set(saved.items.map(item => item.id)).size === saved.items.length && saved.items.some(item => item.id === saved.activeId)) { if (observed === undefined) observed = localStorage.getItem(INDEX); return saved; }
    if (saved) throw new Error(say('会话索引损坏，请先导出备份再恢复。', 'Conversation index is invalid. Export a backup before restoring.'));
    const item = fresh(), index = { version: 1, activeId: item.id, items: [item] };
    write({ [INDEX]: JSON.stringify(index) }); return index;
  }
  function fresh() { return { id: 'chat-' + crypto.randomUUID(), title: say('新对话', 'New chat'), pinned: false, createdAt: Date.now(), updatedAt: Date.now(), automaticTitle: true }; }
  function activeSnapshot() {
    const raw = parse(keys.messages, []);
    return { messages: Array.isArray(raw) ? raw : raw.messages || [], meta: parse(keys.meta, {}), systemPrompt: localStorage.getItem(keys.systemPrompt) || '', draft: parse(keys.draft, ''), images: parse(keys.images, []) };
  }
  function activeValues(record) { return Object.fromEntries(Object.entries(keys).map(([field, key]) => [key, field === 'systemPrompt' ? record[field] || '' : JSON.stringify(record[field] ?? (['messages', 'images'].includes(field) ? [] : field === 'draft' ? '' : {}))])); }
  function assertActive(expected) { const index = ensure(); if ((expected && index.activeId !== expected) || observed !== localStorage.getItem(INDEX)) throw new Error(say('另一页面已修改或切换会话，请导出当前内容并刷新页面。', 'Another tab changed or switched conversations. Export your current content and reload.')); return index; }
  function record(id, index = ensure()) {
    if (!index.items.some(item => item.id === id)) throw new Error('Unknown conversation');
    if (id === index.activeId) return activeSnapshot();
    const saved = parse(PREFIX + id, null); if (!saved || !Array.isArray(saved.messages)) throw new Error(say('会话记录缺失，请从备份恢复。', 'Conversation record is missing. Restore it from a backup.')); return saved;
  }
  function updateTitle(index, snapshot) {
    index.revision = crypto.randomUUID();
    const item = index.items.find(item => item.id === index.activeId); item.updatedAt = Date.now();
    const first = snapshot.messages?.find(m => m.role === 'user' && m.content?.trim());
    if (item.automaticTitle && first) item.title = first.content.trim().replace(/\s+/g, ' ').slice(0, 60);
  }
  function save(snapshot, expected) {
    snapshot = clone(prepare(snapshot));
    return mutate(() => { const index = assertActive(expected); updateTitle(index, snapshot);
      write({ ...activeValues(snapshot), [INDEX]: JSON.stringify(index) }); return index;
    });
  }
  function patch(fields, expected) {
    fields = clone(fields);
    return mutate(() => {
      const index = assertActive(expected), values = activeValues(fields), defaults = activeValues({});
      const changed = Object.keys(fields).filter(field => keys[field] && (localStorage.getItem(keys[field]) ?? defaults[keys[field]]) !== values[keys[field]]);
      if (!changed.length) return index;
      index.revision = crypto.randomUUID();
      write({ ...Object.fromEntries(changed.map(field => [keys[field], values[keys[field]]])), [INDEX]: JSON.stringify(index) });
      return index;
    });
  }
  function switchTo(id, snapshot, expected, create = false) {
    snapshot = clone(prepare(snapshot));
    return mutate(() => {
    const index = assertActive(expected); const next = create ? fresh() : index.items.find(item => item.id === id);
    if (!next) throw new Error('Unknown conversation');
    if (next.id === index.activeId) return { index, record: snapshot };
    if (create && index.items.length >= 50) throw new Error(say('最多保存 50 个会话，请先导出并删除旧会话。', 'Up to 50 conversations. Export and remove old chats first.'));
    const target = create ? { messages: [], meta: {}, draft: '', systemPrompt: '', images: [] } : record(next.id, index);
    updateTitle(index, snapshot);
    const values = { [PREFIX + index.activeId]: JSON.stringify(snapshot), [PREFIX + next.id]: null, ...activeValues(target) };
    if (create) index.items.push(next);
    index.activeId = next.id; values[INDEX] = JSON.stringify(index); write(values);
    return { index, record: target };
    });
  }
  function edit(id, changes) {
    changes = clone(changes);
    return mutate(() => {
    const index = assertActive(), item = index.items.find(item => item.id === id); if (!item) throw new Error('Unknown conversation');
    index.revision = crypto.randomUUID();
    if (changes.title !== undefined) { const title = String(changes.title).trim(); if (!title || title.length > 60) throw new Error(say('标题需要 1–60 个字符。', 'Title: 1–60 characters.')); item.title = title; item.automaticTitle = false; }
    if (changes.pinned !== undefined) item.pinned = !!changes.pinned;
    write({ [INDEX]: JSON.stringify(index) }); return index;
    });
  }
  function remove(id, expected) {
    return mutate(() => {
    const index = assertActive(expected); if (!index.items.some(item => item.id === id)) throw new Error('Unknown conversation');
    index.revision = crypto.randomUUID();
    const values = { [PREFIX + id]: null }; let target;
    if (id === index.activeId) {
      let next = index.items.find(item => item.id !== id);
      if (next) target = record(next.id, index);
      else { next = fresh(); index.items.push(next); target = { messages: [], draft: '', systemPrompt: '', images: [], meta: {} }; }
      index.activeId = next.id; Object.assign(values, activeValues(target), { [PREFIX + next.id]: null });
    }
    index.items = index.items.filter(item => item.id !== id); values[INDEX] = JSON.stringify(index); write(values); return { index, record: target };
    });
  }
  return { ensure, record, prepare, save, patch, switchTo, edit, remove, assertActive, activeSnapshot };
})();
