const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public/agent/agent-drafts.js'), 'utf8');
function setup() {
  const make = () => { const data = new Map(); return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };
  const window = { localStorage: make(), sessionStorage: make(), getCurrentLang: () => 'en' };
  vm.runInNewContext(source, { window }); return { ...window, drafts: window.AgentDrafts };
}
test('workflow input survives reload while credential drafts are confined to session storage', () => {
  const { drafts, localStorage, sessionStorage } = setup();
  drafts.write('workflow', { input: 'draft text', plan: { name: 'draft' } });
  drafts.write('connections', { drafts: [['connection-a', { config: { apiKey: 'draft-secret' } }]] });
  assert.equal(drafts.read('workflow').value.input, 'draft text');
  assert.doesNotMatch(JSON.stringify([...localStorage.data]), /draft-secret/);
  assert.match(JSON.stringify([...sessionStorage.data]), /draft-secret/);
  drafts.remove('connections'); assert.equal(drafts.read('connections'), null);
  assert.equal(drafts.read('workflow').value.input, 'draft text');
});
test('oversized and failed draft writes retain the last recoverable copy', () => {
  const { drafts, localStorage } = setup(); drafts.write('workflow', { input: 'last saved' });
  assert.throws(() => drafts.write('workflow', { input: 'x'.repeat(1048576) }), /storage limit/);
  assert.equal(drafts.read('workflow').value.input, 'last saved');
  localStorage.setItem = () => { throw new Error('quota'); };
  assert.throws(() => drafts.write('workflow', { input: 'new' }), /storage is full/);
  assert.equal(drafts.read('workflow').value.input, 'last saved');
  localStorage.data.set('dtb_workflow_draft', '{"version":99,"value":{}}');
  assert.throws(() => drafts.read('workflow'), /format/);
});
