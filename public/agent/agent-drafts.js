'use strict';

// Connection credentials are temporary per-tab drafts; workflow drafts survive browser restarts.
window.AgentDrafts = (() => {
  const stores = { workflow: ['localStorage', 'dtb_workflow_draft', 1048576], connections: ['sessionStorage', 'dtb_connection_drafts', 4194304] };
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  function spec(name) { if (!Object.hasOwn(stores, name)) throw new Error('Unknown draft'); return stores[name]; }
  function read(name) {
    const [storage, key] = spec(name), raw = window[storage].getItem(key);
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
    try { window[storage].setItem(key, text); }
    catch { throw new Error(say('草稿暂存失败：浏览器空间不足或存储不可用，请先导出或保存。', 'Draft could not be saved: browser storage is full or unavailable. Export or save it first.')); }
  }
  function remove(name) { const [storage, key] = spec(name); window[storage].removeItem(key); }
  return Object.freeze({ read, write, remove });
})();
