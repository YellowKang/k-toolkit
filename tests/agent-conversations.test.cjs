const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
function setup(seed = {}) {
  const map = new Map(Object.entries(seed)), storage = { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
  const context = { window: { getCurrentLang: () => 'en' }, localStorage: storage, crypto: webcrypto, navigator: { locks: { request: async (_name, fn) => fn() } } };
  vm.createContext(context); vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../public/tool-runtime.js'), 'utf8'), context); vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../public/agent/agent-conversations.js'), 'utf8'), context);
  return { store: context.window.ChatConversations, map, storage };
}
const snapshot = text => ({ messages: [{ role: 'user', content: text }, { role: 'assistant', content: 'Reply to ' + text }], draft: 'draft ' + text, systemPrompt: 'system ' + text, images: [], meta: {} });
test('legacy history migrates without rewriting and sessions keep drafts and prompts separate', async () => {
  const raw = JSON.stringify(snapshot('legacy').messages); const { store, map } = setup({ dtb_chat_history: raw });
  const first = store.ensure().activeId; assert.equal(map.get('dtb_chat_history'), raw);
  const next = await store.switchTo(null, snapshot('first'), first, true); assert.notEqual(next.index.activeId, first);
  assert.equal(next.record.messages.length, 0); assert.equal(store.record(first).draft, 'draft first');
  assert.equal(map.has('dtb_chat_session_' + next.index.activeId), false);
  const back = await store.switchTo(first, snapshot('second'), next.index.activeId);
  assert.equal(back.record.systemPrompt, 'system first'); assert.equal(back.record.messages[0].content, 'first');
  assert.equal(store.record(next.index.activeId).draft, 'draft second');
  await store.edit(first, { title: 'Renamed', pinned: true }); await store.save(snapshot('changed'), first);
  assert.equal(store.ensure().items.find(x => x.id === first).title, 'Renamed');
  await store.remove(first, first); assert.equal(store.ensure().activeId, next.index.activeId);
  assert.equal(store.activeSnapshot().messages[0].content, 'second');
});
test('storage failure never switches sessions or discards current history', async () => {
  const { store, map, storage } = setup(); const first = store.ensure().activeId; await store.save(snapshot('first'), first);
  const second = (await store.switchTo(null, snapshot('first'), first, true)).index.activeId; await store.save(snapshot('second'), second);
  const before = Object.fromEntries(map), write = storage.setItem; let count = 0;
  storage.setItem = (...args) => { if (++count === 3) throw new Error('quota'); return write(...args); };
  await assert.rejects(() => store.switchTo(first, snapshot('second'), second), /Save failed/);
  assert.deepEqual(Object.fromEntries(map), before); assert.equal(store.ensure().activeId, second);
  await assert.rejects(() => store.save(snapshot('stale'), first), /Another tab/);
});
test('deleting the last conversation creates a valid empty replacement', async () => {
  const { store } = setup(); const first = store.ensure().activeId; const result = await store.remove(first, first);
  assert.notEqual(result.index.activeId, first); assert.equal(result.index.items.length, 1); assert.equal(result.record.messages.length, 0);
});


test('restoring or focusing an unchanged draft does not invalidate another tab', async () => {
  const { store, map } = setup(); const id = store.ensure().activeId;
  let revision = map.get('dtb_chat_sessions');
  await store.patch({ draft: '' }, id); assert.equal(map.get('dtb_chat_sessions'), revision);
  await store.patch({ draft: 'typed' }, id); assert.notEqual(map.get('dtb_chat_sessions'), revision);
  revision = map.get('dtb_chat_sessions');
  await store.patch({ draft: 'typed' }, id); assert.equal(map.get('dtb_chat_sessions'), revision);
});

test('oversized latest image turns reject saving and switching without changing any stored data', async () => {
  const {store,map} = setup(), id = store.ensure().activeId;
  await store.save(snapshot('saved question'), id);
  const before = Object.fromEntries(map), next = snapshot('saved question');
  next.messages.push({role:'user',content:'Describe this image',_images:[{mime:'image/png',base64:'A'.repeat(1600000)}]});
  await assert.rejects(async () => store.save(next,id), e => e.code === 'chat_turn_limit');
  assert.deepEqual(Object.fromEntries(map), before);
  await assert.rejects(async () => store.switchTo(null,next,id,true), e => e.code === 'chat_turn_limit');
  assert.deepEqual(Object.fromEntries(map), before);
});

test('save and archive share one complete-turn limit and retain omission metadata', async () => {
  const {store,map} = setup(), id = store.ensure().activeId;
  const next = {messages:Array.from({length:521},(_,i)=>({role:i%2?'assistant':'user',content:'message '+i})),meta:{omitted:10}};
  await store.save(next,id);
  const saved = JSON.parse(map.get('dtb_chat_history'));
  assert.equal(saved.length,499); assert.equal(saved[0].content,'message 22');
  assert.equal(JSON.parse(map.get('dtb_chat_history_meta')).omitted,32);
  await store.switchTo(null,next,id,true);
  const archived = store.record(id);
  assert.deepEqual(plain(archived.messages),saved);
  assert.equal(archived.meta.omitted,32);
});

const plain = value => JSON.parse(JSON.stringify(value));
