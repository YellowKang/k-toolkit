const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const plain = value => JSON.parse(JSON.stringify(value));
function setup() {
  const ctx = vm.createContext({ window: {}, Blob, File, setTimeout, clearTimeout, DOMException, makeToolI18n: dict => key => dict.zh[key] });
  for (const name of ['compute/json-text.js', 'compute/escape.js', 'compute/sql.js', 'compute/text-diff.js', 'compute/json-diff.js', 'compute/image.js', 'agent/actions/convert.js', 'agent/actions/text.js', 'agent/actions/data.js', 'image-session.js', 'agent/agent-results.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', name), 'utf8'), ctx);
  }
  ctx.ToolCompute = ctx.window.ToolCompute = { load: async name => ctx.window.KCompute[name] };
  const actions = [...ctx.window.ConvertActions, ...ctx.window.TextActions, ...ctx.window.DataActions];
  return { ctx, compute: ctx.window.KCompute, run: (name, params) => actions.find(action => action.name === name).execute(params) };
}
test('Agent escaping shares exact JSON string semantics and nested expansion with manual tools', async () => {
  const { run, compute } = setup();
  for (const text of ['C:\\new\\test', 'line\n\tend', 'quote"\\\\🙂中', '', '\\u0041']) {
    const escaped = await run('string_escape', { text, type: 'json' });
    assert.equal(escaped.data.result, compute['json-text'].escapeJSON(text, false));
    assert.equal((await run('string_escape', { text: escaped.data.result, type: 'json', unescape: true })).data.result, text);
    assert.equal((await run('json_unescape', { input: JSON.stringify(text) })).data.result, text);
  }
  assert.equal((await run('string_escape', { text: '\\q', type: 'json', unescape: true })).success, false);
  const input = JSON.stringify({ nested: JSON.stringify({ id: '123', path: 'C:\\new\\test' }), array: '[1,2]', '__proto__': 'safe' });
  const expanded = await run('json_expand', { input });
  assert.deepEqual(JSON.parse(expanded.data.result), plain(compute['json-text'].expandNested(input).value));
  assert.equal(expanded.data.count, 2);
});
test('Agent SQL and text diffs use the page algorithms, preserving comments, literals and duplicate lines', async () => {
  const { run, compute } = setup();
  const input = "select 'a  b' -- keep\nfrom t where x='from  where';";
  for (const minify of [false, true]) {
    const actual = await run('sql_format', { input, minify });
    assert.equal(actual.data.result, minify ? compute.sql.minify(input) : compute.sql.pretty(input));
    assert.match(actual.data.result, /'a  b'/); assert.match(actual.data.result, /-- keep\n/);
  }
  const data = (await run('text_diff', { a: 'a\na', b: 'a' })).data;
  assert.equal(data.removedLines, 1); assert.equal(data.addedLines, 0);
  assert.deepEqual(plain(data.diff), plain(compute['text-diff'].diff(['a', 'a'], ['a'])));
  const unicode = await run('text_diff', { a: '🙂中', b: '🙂文', mode: 'char' });
  assert.deepEqual(plain(unicode.data.diff), [[0,'🙂'],[-1,'中'],[1,'文']]);
  assert.equal((await run('sql_format', { input: 'select a,b from t', keywordCase: 'lower', indent: 4 })).data.result, compute.sql.pretty('select a,b from t', { keywordCase: 'lower', indent: 4 }));
});
test('JSON diffs support root values, own prototype keys, arrays and unambiguous JSON Pointer paths', async () => {
  const { run, compute } = setup();
  for (const [a, b, expected] of [
    ['1', '2', [{ path: '', type: 'changed', from: 1, to: 2 }]],
    ['null', 'false', [{ path: '', type: 'changed', from: null, to: false }]],
    ['{"__proto__":1,"a/b~c":2}', '{"__proto__":3,"a/b~c":4,"constructor":5}', [
      { path: '/__proto__', type: 'changed', from: 1, to: 3 }, { path: '/a~1b~0c', type: 'changed', from: 2, to: 4 }, { path: '/constructor', type: 'added', value: 5 },
    ]],
    ['[1,1]', '[1]', [{ path: '/1', type: 'removed', value: 1 }]],
  ]) {
    const data = (await run('json_diff', { a, b })).data;
    assert.deepEqual(plain(data.diffs), expected);
    assert.deepEqual(plain(data.diffs), plain(compute['json-diff'].compareText(a, b)));
  }
  assert.throws(() => compute['json-diff'].compareText('['.repeat(66) + '0' + ']'.repeat(66), '[]'), /limits/);
  assert.equal((await run('json_diff', { a: '{broken', b: '{}' })).success, false);
});
function exifFixture(little) {
  const bytes = new Uint8Array(144), view = new DataView(bytes.buffer);
  view.setUint16(0, 0xFFD8); view.setUint16(2, 0xFFE1); view.setUint16(4, 138);
  bytes.set([69, 120, 105, 102, 0, 0], 6);
  const base = 12, u16 = (pos, value) => view.setUint16(base + pos, value, little), u32 = (pos, value) => view.setUint32(base + pos, value, little);
  view.setUint16(base, little ? 0x4949 : 0x4D4D); u16(2, 42); u32(4, 8); u16(8, 3);
  const entry = (pos, tag, type, count, value) => { u16(pos, tag); u16(pos + 2, type); u32(pos + 4, count); u32(pos + 8, value); };
  entry(10, 0x010F, 2, 3, 0); bytes.set([65, 66, 0], base + 18);
  entry(22, 0x0112, 3, 1, 0); u16(30, 6);
  entry(34, 0x8769, 4, 1, 50); u16(50, 2);
  entry(52, 0x829A, 5, 1, 84); u32(84, 1); u32(88, 125);
  entry(64, 0xA002, 4, 1, 321); view.setUint16(142, 0xFFD9);
  return view;
}
test('shared EXIF parser reads both byte orders, inline ASCII/SHORT and camera sub-IFDs with strict bounds', () => {
  const { compute } = setup();
  for (const little of [true, false]) {
    assert.deepEqual(plain(compute.image.parseExif(exifFixture(little))), { 271: 'AB', 274: 6, 33434: 0.008, 40962: 321 });
    const invalid = exifFixture(little); invalid.setUint32(12 + 34 + 8, 999999, little);
    assert.throws(() => compute.image.parseExif(invalid), error => error.code === 'exif');
    const loop = exifFixture(little); loop.setUint32(12 + 34 + 8, 8, little);
    assert.throws(() => compute.image.parseExif(loop), error => error.code === 'exif');
  }
  assert.deepEqual(plain(compute.image.parseExif(new DataView(new Uint8Array([137, 80]).buffer))), {});
});
test('image references expire on replace/clear, output retention is bounded, and only metadata is exposed', () => {
  const { ctx } = setup(), store = ctx.window.ImageSession;
  const file = new File(['private bytes'], 'first.png', { type: 'image/png' });
  store.replace([file]); const id = store.metadata()[0].id;
  assert.equal(store.getFile(id), file); assert.equal(store.metadata()[0].id, id);
  store.replace([new File(['next'], 'next.png', { type: 'image/png' })]); assert.throws(() => store.getFile(id), /重新选择/);
  const generation = store.generation(), oldest = store.addResult(file, 'result.png');
  for (let i = 0; i < 20; i++) store.addResult(file, i + '.png');
  assert.equal(store.list().filter(file => file.origin === 'result').length, 20); assert.throws(() => store.getFile(oldest.id), /重新选择/);
  assert.equal(JSON.stringify(store.list()).includes('private bytes'), false);
  const recent = store.list().at(-1).id; store.clear(); assert.throws(() => store.getFile(recent), /重新选择/);
  assert.throws(() => store.addResult(file, 'late.png', generation), /重新选择/);
  store.replace([file]); assert.notEqual(store.metadata()[0].id, id);
});
test('result selection preserves falsy results and full intermediate output without model text', () => {
  const { ctx } = setup(), values = ctx.window.AgentResults.values;
  for (const value of [false, 0, '', null]) assert.equal(values({ success: true, data: { result: value } })[0].value, value);
  const selected = values({ success: true, data: { steps: [], result: { hash: 'abc' }, outputs: { original: { result: 'x'.repeat(5000) }, hash: { hash: 'abc' } } } });
  assert.equal(selected.length, 3); assert.equal(selected[1].value.length, 5000); assert.equal(selected[0].value, 'abc');
});
