const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load() {
  const context = { window: {} }; vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'public/tool-catalog.js'), 'utf8'), context);
  return context.window.ToolCatalog;
}
test('all stable capabilities exist, have unique IDs and valid category/file metadata', () => {
  const catalog = load();
  assert.equal(catalog.tools.length, 92); assert.equal(new Set(catalog.tools.map(tool => tool.id)).size, 92);
  for (const tool of catalog.tools) {
    assert.ok(tool.id === 'ai-chat' || catalog.categories[tool.category], tool.id);
    assert.ok(fs.existsSync(path.join(root, 'public/tools', tool.file)), tool.file);
    assert.ok(['local', 'network', 'model', 'optional-network'].includes(tool.execution));
  }
  assert.equal(Object.keys(catalog.categories).length, 10);
  assert.equal(catalog.entries.length, 86);
});
test('workbenches have one primary entry and preserve every child capability', () => {
  const catalog = load(); const members = new Set();
  for (const group of catalog.workbenches) {
    assert.equal(catalog.entries.filter(entry => group.tools.includes(entry.id)).length, 1);
    assert.ok(catalog.entries.some(entry => entry.id === group.tools[0]));
    for (const id of group.tools) {
      assert.ok(!members.has(id)); members.add(id);
      assert.equal(catalog.tools.find(tool => tool.id === id).workbenchId, group.id);
      assert.equal(catalog.groupFor(id).id, group.id);
    }
  }
});
test('representative classifications and processing labels match actual tool roles', () => {
  const catalog = load(); const tool = id => catalog.tools.find(tool => tool.id === id);
  for (const id of ['json','yaml-json','toml-json','xml-format','json-csv']) assert.equal(tool(id).category, '数据格式');
  assert.equal(tool('timestamp').category, '时间效率');
  assert.equal(tool('hash').category, '编码加密');
  assert.equal(tool('totp').category, '编码加密');
  assert.equal(tool('totp').execution, 'local');
  assert.equal(tool('curl-gen').category, '网络工具');
  assert.equal(tool('http-tester').execution, 'network');
  assert.equal(tool('img-compress').requiresFile, true);
});
