const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
function setup(seed = {}) {
  const map = new Map(Object.entries(seed)), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
  const context = { window: { getCurrentLang: () => 'en' }, localStorage: storage, crypto: webcrypto };
  vm.createContext(context); vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../public/agent/agent-conversations.js'), 'utf8'), context);
  return { store: context.window.ChatConversations, map, storage };
}
const snapshot = text => ({ messages: [{ role: 'user', content: text }, { role: 'assistant', content: 'Reply to ' + text }], draft: 'draft ' + text, systemPrompt: 'system ' + text, images: [], meta: {} });
test('legacy history migrates without rewriting and sessions keep drafts and prompts separate', () => {
  const raw = JSON.stringify(snapshot('legacy').messages); const { store, map } = setup({ dtb_chat_history: raw });
  const first = store.ensure().activeId; assert.equal(map.get('dtb_chat_history'), raw);
  const next = store.switchTo(null, snapshot('first'), first, true); assert.notEqual(next.index.activeId, first);
  assert.equal(next.record.messages.length, 0); assert.equal(store.record(first).draft, 'draft first');
  assert.equal(map.has('dtb_chat_session_' + next.index.activeId), false);
  const back = store.switchTo(first, snapshot('second'), next.index.activeId);
  assert.equal(back.record.systemPrompt, 'system first'); assert.equal(back.record.messages[0].content, 'first');
  assert.equal(store.record(next.index.activeId).draft, 'draft second');
  store.edit(first, { title: 'Renamed', pinned: true }); store.save(snapshot('changed'), first);
  assert.equal(store.ensure().items.find(x => x.id === first).title, 'Renamed');
  store.remove(first, first); assert.equal(store.ensure().activeId, next.index.activeId);
  assert.equal(store.activeSnapshot().messages[0].content, 'second');
});
test('storage failure never switches sessions or discards current history', () => {
  const { store, map, storage } = setup(); const first = store.ensure().activeId; store.save(snapshot('first'), first);
  const second = store.switchTo(null, snapshot('first'), first, true).index.activeId; store.save(snapshot('second'), second);
  const before = Object.fromEntries(map), write = storage.setItem; let count = 0;
  storage.setItem = (...args) => { if (++count === 3) throw new Error('quota'); return write(...args); };
  assert.throws(() => store.switchTo(first, snapshot('second'), second), /Save failed/);
  assert.deepEqual(Object.fromEntries(map), before); assert.equal(store.ensure().activeId, second);
  assert.throws(() => store.save(snapshot('stale'), first), /Another tab/);
});
test('deleting the last conversation creates a valid empty replacement', () => {
  const { store } = setup(); const first = store.ensure().activeId; const result = store.remove(first, first);
  assert.notEqual(result.index.activeId, first); assert.equal(result.index.items.length, 1); assert.equal(result.record.messages.length, 0);
});
