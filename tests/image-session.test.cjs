const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function setup() {
  const ctx = { window: {}, File, makeToolI18n: () => () => '' };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/image-session.js'), 'utf8'), ctx);
  return ctx.window.ImageSession;
}
test('image session preserves File references, exposes metadata and clears references', () => {
  const store = setup(); const file = new File(['image bytes'], '<image>.png', { type: 'image/png' });
  assert.equal(store.replace([file]), true); assert.equal(store.getFiles()[0], file);
  const returned = store.getFiles(); returned.pop(); assert.equal(store.getFiles().length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(store.metadata())), [{ name: file.name, size: file.size, type: file.type }]);
  assert.equal(JSON.stringify(store.metadata()).includes('image bytes'), false);
  store.clear(); assert.equal(store.getFiles().length, 0);
});
test('invalid or oversized batches do not replace previously staged files', () => {
  const store = setup(); const file = new File(['x'], 'image.png', { type: 'image/png' }); store.replace([file]);
  for (const invalid of [[], Array(21).fill(file), [new File(['x'], 'a.txt', { type: 'text/plain' })], [{ type: 'image/png', size: 1 }]]) assert.equal(store.replace(invalid), false);
  const large = new File(['x'], 'large.png', { type: 'image/png' }); Object.defineProperty(large, 'size', { value: 101 * 1024 * 1024 });
  assert.equal(store.replace([large]), false); assert.equal(store.getFiles()[0], file);
});
