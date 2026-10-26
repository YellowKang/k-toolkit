const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/tools/markdown.js'), 'utf8'), ctx);

test('Markdown code preserves literal replacement tokens, markup and whitespace', () => {
  const html = ctx._mdParse('```js\nconst a = "$& $1";\n  <tag> & text\n```\n\n`<b>$&</b>`');
  assert.ok(html.includes('const a = "$&amp; $1";\n  &lt;tag&gt; &amp; text\n'));
  assert.ok(html.includes('<code>&lt;b&gt;$&amp;&lt;/b&gt;</code>'));
  assert.doesNotMatch(html, /\x00/);
});

test('Markdown mixed task states retain source order while code blocks stay inert', () => {
  const html = ctx._mdParse('- [ ] first\n- [x] second\n```\n- [ ] not a task\n```\n- [ ] third');
  assert.deepEqual([...html.matchAll(/data-cb-index="(\d+)" data-cb-checked="(\d)"/g)].map(m => [m[1],m[2]]), [['0','0'],['1','1'],['2','0']]);
});

test('Markdown table separators are validated and inline formatting is preserved', () => {
  const html = ctx._mdParse('| Name | Value |\n| --- | :---: |\n| **bold** | `code` |');
  assert.match(html, /<thead><tr><th>Name<\/th><th>Value<\/th>/);
  assert.match(html, /<td><strong>bold<\/strong><\/td><td><code>code<\/code><\/td>/);
  assert.doesNotMatch(ctx._mdParse('| a |\n| - |\n| b |'), /<table>/);
});

test('Markdown restores thousands of code spans without leaving internal placeholders', () => {
  const source = Array.from({length:2000}, (_,i) => '`span '+i+'`\n\n```\nblock '+i+'\n```').join('\n');
  const html = ctx._mdParse(source);
  assert.equal((html.match(/<pre>/g)||[]).length, 2000);
  assert.equal((html.match(/<code>/g)||[]).length, 4000);
  assert.doesNotMatch(html, /\x00/);
  assert.ok(html.includes('span 1999') && html.includes('block 1999'));
});

test('Markdown heading anchors follow source order, including inline code and duplicates',()=>{
  const html=ctx._mdParse('### `Same`\n\n# Same\n\n## Same\n\n```\n# Not a heading\n```');
  assert.deepEqual([...html.matchAll(/<h\d id="([^"]+)"/g)].map(m=>m[1]),['md-h-same','md-h-same-2','md-h-same-3']);
});
