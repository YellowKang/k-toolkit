const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { minifyJS } = require('../scripts/build.js');

test('minifier strips code indentation, blank lines and comments', () => {
  const src = '\r\n  // header\r\n  function add(a, b) {\r\n\r\n    /* sum */\r\n    return a + b; // done\r\n  }\r\n';
  assert.equal(minifyJS(src), 'function add(a, b) {\nreturn a + b; \n}');
});

test('minifier keeps whitespace inside multi-line template literals', () => {
  const src = [
    'function conf() {',
    '  return `server {',
    '',
    '    location / {',
    '        try_files $uri /index.html;',
    '    }',
    '}`;',
    '}',
  ].join('\n');
  const out = minifyJS(src);
  assert.ok(out.includes('`server {\n\n    location / {\n        try_files $uri /index.html;\n    }\n}`'));
  assert.equal(vm.runInNewContext(out + '\nconf()'), vm.runInNewContext(src + '\nconf()'));
});

test('minifier keeps nested templates, quotes and braces inside substitutions intact', () => {
  const src = [
    'const items = [1, 2];',
    'const html = `<ul>',
    '  ${items.map(n => `',
    '    <li data-x="${n}">${n > 1 ? \'}\' : "{"}</li>`).join(\'\')}',
    '</ul>`;',
    'html',
  ].join('\n');
  assert.equal(vm.runInNewContext(minifyJS(src)), vm.runInNewContext(src));
});

test('minifier treats a slash after a number as division, not a regex', () => {
  const src = [
    "const units = [['chi', 1 / 3, 'http://a'], ['cun', 1 / 30, 'x']];",
    '  // indented comment',
    '  JSON.stringify(units)',
  ].join('\n');
  assert.equal(vm.runInNewContext(minifyJS(src)), vm.runInNewContext(src));
  assert.ok(!minifyJS(src).includes('indented comment'));
});

test('minifier preserves comment-like text in strings and regex literals', () => {
  const src = [
    'const url = "https://example.com/*x*/";',
    'const re = /\\/\\/[a-z/]+/g; // comment',
    'const half = 10 / 2 / 5;',
    'JSON.stringify([url, "a//b".match(re)[0], half])',
  ].join('\n');
  assert.equal(vm.runInNewContext(minifyJS(src)), vm.runInNewContext(src));
});
