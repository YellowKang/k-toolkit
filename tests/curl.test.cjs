const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const ctx = { window: {}, makeToolI18n: dict => (key, ...args) => typeof dict.en[key] === 'function' ? dict.en[key](...args) : dict.en[key] };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/tools/curl-gen.js'), 'utf8'), ctx);
test('exported cURL round trips quotes, spaces, newlines and shell-like literal data', () => {
  const url = "https://example.com/search?q=O'Reilly&space=a%20b";
  const headers = { 'Content-Type':'application/json', 'X-Label':"someone's label $(literal)" };
  const body = JSON.stringify({ text:"O'Reilly  two spaces", line:'a\nb', quote:'"x"' }, null, 2);
  const parsed = JSON.parse(JSON.stringify(ctx.parseCurlCommand(ctx._genCurl('POST', url, headers, body))));
  assert.deepEqual(parsed, { method:'POST',url,headers,body });
});
test('import preserves data spacing and refuses unsupported file/form semantics', () => {
  assert.equal(ctx.parseCurlCommand("curl https://example.com --data-raw 'a  b'").body, 'a  b');
  assert.equal(ctx.parseCurlCommand("curl --url=https://example.com -d ''").method, 'POST');
  assert.throws(() => ctx.parseCurlCommand('curl https://example.com --data @payload.json'), /Unsupported/);
  assert.throws(() => ctx.parseCurlCommand("curl https://example.com -F 'file=@file'"), /Unsupported/);
  assert.throws(() => ctx.parseCurlCommand("curl 'https://example.com"), /Unclosed/);
});
test('generated JavaScript is valid and preserves raw request body exactly', () => {
  const url = "https://example.com/?q='x'", body = "a'b\nline";
  const fetchCode = ctx._genFetch('POST', url, {}, body);
  const axiosCode = ctx._genAxios('DELETE', url, {}, body);
  new vm.Script('(async () => {' + fetchCode + '})');
  new vm.Script('(async () => {' + axiosCode + '})');
  assert.match(fetchCode, /response\.text/);
  assert.ok(fetchCode.includes(JSON.stringify(body)));
  assert.ok(axiosCode.includes(JSON.stringify(body)));
});
