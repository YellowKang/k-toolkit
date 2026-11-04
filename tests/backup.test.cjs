const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({ console, URL });
context.window = context;
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'public/tool-privacy.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'public/compute/workflow-history.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', 'public/compute/backup.js'), 'utf8'), context);
const { backup } = context.KCompute;
const plain = value => JSON.parse(JSON.stringify(value));

function storage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return { get length() { return map.size; }, key: i => [...map.keys()][i] ?? null, getItem: k => map.has(k) ? map.get(k) : null,
    setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k), dump: () => Object.fromEntries(map) };
}
const seed = () => storage({
  dtb_lang: '"zh"', dtb_theme: '"dark"', ag_fab_pos: '{"x":1}', dtb_favorites: '["json","hash"]', dtb_recent: '["a","b"]',
  dtb_usage: '{"json":3}', dtb_note: 'hello', dtb_todo: '[{"text":"a","done":false}]', ag_model: '"gpt"', ag_key_openai: '"sk-live"',
  dtb_otp_vault: '{"v":1}', unrelated_key: 'x',
});

test('keys are grouped by allow-list and API keys stay out of the plain section', () => {
  assert.equal(backup.groupOf('ag_fab_pos'), 'prefs');
  assert.equal(backup.groupOf('ag_key_openai'), 'apikeys');
  assert.equal(backup.groupOf('ag_model'), 'agent');
  assert.equal(backup.groupOf('unrelated_key'), null);
  assert.equal(backup.groupOf('dtb_workflow_draft'), 'tools');
  assert.equal(backup.groupOf('dtb_workflow_runs'), 'tools');
  assert.equal(backup.groupOf('dtb_connection_drafts'), null, 'temporary connection credentials must never be exported');
  const inv = backup.inventory(seed());
  assert.deepEqual(plain(inv.history.map(x => [x.key, x.items])), [['dtb_favorites', 2], ['dtb_recent', 2], ['dtb_usage', 1]]);
  const { backup: file, secret } = backup.collect(seed(), [...backup.DEFAULT_GROUPS, 'apikeys'], { appVersion: 'abc', now: new Date('2026-10-23T00:00:00Z') });
  assert.equal(file.format, 'k-toolkit-backup');
  assert.equal(file.exportedAt, '2026-10-23T00:00:00.000Z');
  assert.ok(!('ag_key_openai' in file.data) && !('unrelated_key' in file.data));
  assert.deepEqual(plain(secret), { ag_key_openai: '"sk-live"' });
  assert.deepEqual(Object.keys(backup.collect(seed(), ['tools']).backup.data).sort(), ['dtb_note', 'dtb_todo']);
});

test('parsing rejects foreign files and drops unknown or malformed keys', () => {
  assert.throws(() => backup.parse(''), err => err.code === 'empty');
  assert.throws(() => backup.parse('{nope'), err => err.code === 'json');
  assert.throws(() => backup.parse('{"format":"other"}'), err => err.code === 'format');
  assert.throws(() => backup.parse('{"format":"k-toolkit-backup","version":2}'), err => err.code === 'version');
  const parsed = backup.parse(JSON.stringify({ format: 'k-toolkit-backup', version: 1, data: {
    dtb_favorites: '["x"]', dtb_note: 'free text', dtb_todo: '{broken', evil_key: '1', ag_key_openai: '"sk"', dtb_recent: 5 } }));
  assert.deepEqual(Object.keys(parsed.data).sort(), ['dtb_favorites', 'dtb_note']);
  assert.deepEqual(plain(parsed.rejected.map(r => [r.key, r.reason])).sort(), [['ag_key_openai', 'unknown'], ['dtb_recent', 'type'], ['dtb_todo', 'json'], ['evil_key', 'unknown']]);
  const secret = backup.parseSecret(JSON.stringify({ ag_key_openai: '"sk"', dtb_note: 'x' }));
  assert.deepEqual(plain(secret.data), { ag_key_openai: '"sk"' });
});

test('merge combines lists and counters, keeps local preferences and never mixes 2FA boards', () => {
  const target = storage({ dtb_favorites: '["hash","uuid"]', dtb_recent: '["1","2","3","4","5","6","7"]', dtb_usage: '{"json":1,"uuid":2}',
    dtb_note: 'mine', dtb_theme: '"light"', dtb_otp_vault: '{"v":1,"data":"A"}', dtb_todo: '[]' });
  const incoming = { dtb_favorites: '["json","hash"]', dtb_recent: '["8","9"]', dtb_usage: '{"json":3}', dtb_note: 'theirs',
    dtb_theme: '"dark"', dtb_otp_vault: '{"v":1,"data":"B"}', dtb_todo: '[{"text":"t"}]', dtb_countdowns: '[1]' };
  const { writes, skipped } = backup.plan(target, incoming);
  const result = Object.fromEntries(writes.map(w => [w.key, w.value]));
  assert.equal(result.dtb_favorites, '["hash","uuid","json"]');
  assert.equal(result.dtb_recent, '["1","2","3","4","5","6","7","8"]');
  assert.equal(result.dtb_usage, '{"json":4,"uuid":2}');
  assert.equal(result.dtb_note, 'mine\n\n---\ntheirs');
  assert.equal(result.dtb_todo, '[{"text":"t"}]');
  assert.equal(result.dtb_countdowns, '[1]');
  assert.ok(!('dtb_theme' in result));
  assert.deepEqual(plain(skipped.map(s => [s.key, s.reason])), [['dtb_otp_vault', 'otp-exists']]);
  const only = backup.plan(target, incoming, { groups: ['history'] }).writes.map(w => w.key).sort();
  assert.deepEqual(plain(only), ['dtb_favorites', 'dtb_recent', 'dtb_usage']);
  const over = backup.plan(target, incoming, { mode: 'overwrite', groups: ['prefs', 'otp'] }).writes;
  assert.deepEqual(plain(over.map(w => [w.key, w.value])), [['dtb_theme', '"dark"'], ['dtb_otp_vault', '{"v":1,"data":"B"}']]);
  const applied = backup.apply(target, over);
  assert.equal(applied.written, 2);
  assert.equal(target.getItem('dtb_theme'), '"dark"');
});

test('merging indexed conversations preserves active history and archives imported active chat', () => {
  const index = (id, title) => JSON.stringify({ version: 1, activeId: id, items: [{ id, title }] });
  const target = storage({ dtb_chat_sessions: index('chat-local', 'Local'), dtb_chat_history: '[{"role":"user","content":"local"}]', dtb_chat_system: 'local system' });
  const incoming = { dtb_chat_sessions: index('chat-remote', 'Remote'), dtb_chat_history: '[{"role":"user","content":"remote"}]', dtb_chat_system: 'remote system', dtb_chat_draft: '"remote draft"' };
  const { writes } = backup.plan(target, incoming); backup.apply(target, writes);
  assert.equal(JSON.parse(target.getItem('dtb_chat_history'))[0].content, 'local');
  assert.equal(JSON.parse(target.getItem('dtb_chat_sessions')).activeId, 'chat-local');
  assert.equal(JSON.parse(target.getItem('dtb_chat_sessions')).items.length, 2);
  const archive = JSON.parse(target.getItem('dtb_chat_session_chat-remote')); assert.equal(archive.messages[0].content, 'remote'); assert.equal(archive.systemPrompt, 'remote system');
  const { backup: file, secret } = backup.collect(storage({ ...target.dump(), 'ag_key_connection-local': '"private"' }), ['chat', 'apikeys']);
  assert.ok(file.data['dtb_chat_session_chat-remote']); assert.equal(secret['ag_key_connection-local'], '"private"');
  assert.equal(backup.parse(JSON.stringify(file)).rejected.length, 0);
});

test('conversation restore rolls back the group if a write fails', () => {
  const target = storage({ dtb_chat_history: '["old"]', dtb_chat_sessions: '{"old":true}' }); const before = target.dump();
  const write = target.setItem; let count = 0; target.setItem = (...args) => { if (++count === 2) throw new Error('quota'); return write(...args); };
  const result = backup.apply(target, [{ key: 'dtb_chat_history', value: '["new"]', group: 'chat' }, { key: 'dtb_chat_sessions', value: '{"new":true}', group: 'chat' }]);
  assert.equal(result.failed.length, 2); assert.deepEqual(target.dump(), before);
});


test('backup rejects structurally invalid data before planning writes', () => {
  const values = { dtb_favorites: {}, dtb_recent: [null], dtb_todo: {}, dtb_otp_vault: null, dtb_chat_sessions: { version: 1, activeId: 'missing', items: [] }, dtb_saved_regex: [{}], dtb_typing_scores: [null] };
  const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)]));
  const parsed = backup.parse(JSON.stringify({ format: 'k-toolkit-backup', version: 1, data }));
  assert.equal(Object.keys(parsed.data).length, 0);
  assert.equal(parsed.rejected.length, Object.keys(data).length);
  assert.ok(parsed.rejected.every(item => item.reason === 'structure'));
});

test('HTTP credentials appear only in the encrypted selection and restore only to tab memory', () => {
  const request = { method: 'POST', url: 'https://user:credential@example.test/path?token=private#private', headers: 'Authorization: Bearer private', body: 'private' };
  const raw = JSON.stringify([request]), target = storage({ dtb_http_history: raw });
  const plainBackup = backup.collect(target, backup.DEFAULT_GROUPS).backup;
  assert.doesNotMatch(JSON.stringify(plainBackup), /private|credential|Bearer/);
  const encrypted = backup.collect(target, ['tools', 'http']);
  assert.equal(encrypted.backup.data.dtb_http_history, undefined);
  assert.equal(backup.parseSecret(JSON.stringify(encrypted.secret)).data.dtb_http_history, raw);
  let memory;
  context.RequestSession = { restoreHistory: values => { memory = values; } };
  const writes = backup.plan(target, encrypted.secret, { mode: 'overwrite', groups: ['http'] }).writes;
  // A fresh browser has no matching plaintext data to skip.
  const fresh = storage(); backup.apply(fresh, backup.plan(fresh, encrypted.secret, { groups: ['http'] }).writes);
  assert.equal(memory[0].headers, request.headers);
  assert.doesNotMatch(fresh.getItem('dtb_http_history'), /private|credential|Bearer/);
  delete context.RequestSession;
});

test('restoring chat messages changes the revision even when the active ID is unchanged', () => {
  const index = { version: 1, activeId: 'chat-a', items: [{ id: 'chat-a', title: 'A' }], revision: 'old' };
  const target = storage({ dtb_chat_sessions: JSON.stringify(index) });
  backup.apply(target, [{ key: 'dtb_chat_history', value: '[{"role":"user","content":"restored"}]', group: 'chat' }]);
  const restored = JSON.parse(target.getItem('dtb_chat_sessions'));
  assert.equal(restored.activeId, index.activeId); assert.notEqual(restored.revision, index.revision);
});


test('language backups accept the actual raw storage format and normalize old JSON strings', () => {
  for (const value of ['en', '"en"']) {
    const parsed = backup.parse(JSON.stringify({ format: 'k-toolkit-backup', version: 1, data: { dtb_lang: value } }));
    assert.equal(parsed.rejected.length, 0); assert.equal(parsed.data.dtb_lang, 'en');
  }
});
