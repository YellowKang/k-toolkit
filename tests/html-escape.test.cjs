const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PUB = path.resolve(__dirname, '..', 'public');
const sources = (function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.name.endsWith('.js') ? [{ rel: path.relative(PUB, file), text: fs.readFileSync(file, 'utf8') }] : [];
  });
})(PUB);

test('escHtml is defined once globally so later scripts cannot weaken it', () => {
  const owners = sources.filter(s => /^function escHtml\b/m.test(s.text)).map(s => s.rel);
  assert.deepEqual(owners, ['dashboard.js']);
});

test('escHtml escapes text and both attribute quote styles', () => {
  const src = sources.find(s => s.rel === 'dashboard.js').text.match(/^function escHtml[\s\S]*?^}/m)[0];
  const escHtml = vm.runInNewContext(src + '\nescHtml');
  assert.equal(escHtml(`<a href="x">it's & co</a>`), '&lt;a href=&quot;x&quot;&gt;it&#39;s &amp; co&lt;/a&gt;');
  assert.equal(escHtml(42), '42');
  assert.equal(escHtml(undefined), '');
});

test('inline handlers never embed escaped user text inside a JS string', () => {
  // HTML entities are decoded before the handler runs, so `'${escHtml(x)}'` breaks on quotes; use data-* instead.
  const unsafe = /on[a-z]+="[^"]*'\$\{(?:escHtml\(|escaped\})/;
  const offenders = sources.flatMap(s => s.text.split('\n').map((line, i) => unsafe.test(line) ? `${s.rel}:${i + 1}` : null)).filter(Boolean);
  assert.deepEqual(offenders, []);
});
