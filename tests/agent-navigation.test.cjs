const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup() {
  const context = { window: {}, console, setTimeout, clearTimeout, document: { querySelector() { throw new Error('Must not guess or modify DOM'); } } };
  vm.createContext(context);
  for (const name of ['tool-catalog.js', 'agent/actions/nav.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', name), 'utf8'), context);
  context.window.TOOLS = context.window.ToolCatalog.tools;
  return name => context.window.NavActions.find(action => action.name === name);
}
test('Agent discovery reports executable, manual and file-input capabilities accurately', () => {
  const action = setup()('search_tools');
  const image = action.execute({ query: 'img-compress' }).data.tools.find(tool => tool.id === 'img-compress');
  assert.equal(image.autoRun, false); assert.equal(image.automation, 'file-input'); assert.ok(image.reason);
  const json = action.execute({ query: 'json', category: 'Data & Formats' }).data.tools.find(tool => tool.id === 'json');
  assert.equal(json.autoRun, true); assert.equal(json.automation, 'automatic');
  const note = action.execute({ query: 'note' }).data.tools.find(tool => tool.id === 'note');
  assert.equal(note.autoRun, false); assert.equal(note.automation, 'manual');
});
test('manual and unknown page tools cannot fill unrelated inputs or claim success', async () => {
  const action = setup()('fill_and_run_tool');
  for (const toolId of ['img-compress', 'img-base64', 'note', 'missing-tool']) {
    const result = await action.execute({ toolId, inputs: { text: 'must not write this' } });
    assert.equal(result.success, false); assert.equal(result.data.code, 'MANUAL_INPUT_REQUIRED');
  }
});
