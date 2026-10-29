'use strict';

// Connection credentials are temporary per-tab drafts; workflow drafts survive browser restarts.
window.AgentDrafts = (() => {
  const stores = { workflow: ['localStorage', 'dtb_workflow_draft', 1048576], connections: ['sessionStorage', 'dtb_connection_drafts', 4194304] };
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  function spec(name) { if (!Object.hasOwn(stores, name)) throw new Error('Unknown draft'); return stores[name]; }
  // Accessing storage itself throws when the browser blocks site data, so every call goes through here.
  function area(storage) {
    try { return window[storage]; }
    catch { throw new Error(say('浏览器禁用了本地存储，草稿无法暂存，请先导出或保存。', 'Browser storage is disabled, so drafts cannot be kept. Export or save first.')); }
  }
  function read(name) {
    const [storage, key] = spec(name);
    let raw;
    try { raw = area(storage).getItem(key); } catch { return null; }
    if (raw === null) return null;
    try {
      const draft = JSON.parse(raw);
      if (draft?.version !== 1 || !draft.value || typeof draft.value !== 'object') throw new Error();
      return draft;
    } catch { throw new Error(say('草稿格式无法读取，请导出数据备份或清除草稿后重试。', 'Draft format could not be read. Export a data backup or clear the draft and retry.')); }
  }
  function write(name, value) {
    const [storage, key, limit] = spec(name), text = JSON.stringify({ version: 1, updatedAt: Date.now(), value });
    if (text.length > limit) throw new Error(say('草稿超过暂存上限，请导出草稿或保存后再离开。', 'Draft exceeds the storage limit. Export or save it before leaving.'));
    const target = area(storage);
    try { target.setItem(key, text); }
    catch { throw new Error(say('草稿暂存失败：浏览器空间不足或存储不可用，请先导出或保存。', 'Draft could not be saved: browser storage is full or unavailable. Export or save it first.')); }
  }
  function remove(name) {
    const [storage, key] = spec(name);
    try { area(storage).removeItem(key); } catch { /* Nothing can be stored there, so nothing is left to remove. */ }
  }
  return Object.freeze({ read, write, remove });
})();
