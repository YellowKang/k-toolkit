const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ctx = vm.createContext({ window:{}, makeToolI18n:()=>key=>key });
for (const file of ['compute/json-text.js','tools/json-format.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),ctx);
const api = ctx.window.KCompute['json-text'];
const plain = value => JSON.parse(JSON.stringify(value));

test('lossless JSON round trips integer, decimal, exponent and negative-zero tokens', () => {
  const input = '{"id":9223372036854775807,"fraction":0.123456789012345678901,"large":1e400,"small":1e-400,"zero":-0,"same":1.00,"text":"9223372036854775807"}';
  assert.equal(api.stringify(api.parse(input)), input);
  assert.equal(api.stringify(api.parse(api.stringify(api.parse(input), 2))), input);
  assert.equal(api.compareNumbers(api.parse('9007199254740993'), api.parse('9007199254740992')), 1);
  assert.equal(api.compareNumbers(api.parse('123000e-3'), api.parse('123.00')), 0);
  assert.equal(api.compareNumbers(api.parse('-1e400'), api.parse('-9e399')), -1);
  assert.equal(api.compareNumbers(api.parse('-0'), 0), 0);
  assert.equal(api.stringify(api.expandNested('{"payload":"{\\"id\\":9223372036854775807}"}').value), '{"payload":{"id":9223372036854775807}}');
});

test('lossless JSON keeps user strings and prototype keys separate from number placeholders', () => {
  const input = '{"__proto__":9007199254740993,"constructor":"\\u0000k-toolkit-number:0","a":"quote\\\" 123","b":[1,9007199254740995]}';
  const value = api.parse(input);
  assert.equal(Object.hasOwn(value, '__proto__'), true);
  assert.equal(value.constructor, '\0k-toolkit-number:0');
  assert.equal(api.stringify(value), input);
  for (const invalid of ['01','1.','[1,]','{"a":NaN}','1e','{"a":1}false']) assert.throws(() => api.parse(invalid));
  assert.throws(() => api.parse('['.repeat(65)+'0'+']'.repeat(65)), e => e.code === 'complexity');
  assert.throws(() => api.parse('1'.repeat(1000001)), e => e.code === 'limit');
});

test('valid formatted output larger than the input limit remains available to minify and copy', () => {
  const input = JSON.stringify(Array.from({length:40000},()=>({identifier:1})));
  const formatted = api.stringify(api.parse(input),2);
  assert.ok(formatted.length > 1000000);
  const minify = vm.runInContext('(text) => _jsonStringify(_jsonParse(text))', ctx);
  assert.equal(minify(formatted),input);
});

test('exact numeric comparison agrees with independent scaled BigInt arithmetic', () => {
  let seed = 73;
  const next = () => (seed = (Math.imul(seed,1664525)+1013904223) >>> 0);
  for (let i=0;i<250;i++) {
    const a = (BigInt(next()) << 40n) + BigInt(next()), b = (BigInt(next()) << 40n) + BigInt(next());
    const left = next()%2 ? -a : a, right = next()%2 ? -b : b;
    const le = next()%17-8, re = next()%17-8, common = Math.min(le,re);
    const scaledLeft = left*10n**BigInt(le-common), scaledRight = right*10n**BigInt(re-common);
    const expected = scaledLeft===scaledRight ? 0 : scaledLeft<scaledRight ? -1 : 1;
    const l = left+'e'+le, r = right+'e'+re;
    assert.equal(api.stringify(api.parse(l)),l);
    assert.equal(api.compareNumbers(api.parse(l),api.parse(r)),expected,`${l} versus ${r}`);
  }
});

test('JSON escape and unescape preserve exact characters and remove only one encoding layer', () => {
  for (const value of ['', '  hello  ', '中文🙂\n\r\t\u0000', 'C:\\new\\test.json', '\\n', '"quotes"', '$& $1', '</textarea><script>1</script>']) {
    assert.equal(api.unescapeJSON(api.escapeJSON(value)),value);
    assert.equal(api.unescapeJSON(api.escapeJSON(value,false)),value);
    assert.equal(api.unescapeJSON(JSON.stringify(JSON.stringify(value))),JSON.stringify(value));
  }
  for (const value of ['\\q','\\u00xx','"unfinished','\\','line\nbreak']) assert.throws(()=>api.unescapeJSON(value),error=>error.code==='invalid_escape');
});

test('Nested JSON expansion handles escaped fragments, arrays, and repeated encoding without coercing ordinary strings', () => {
  const original = { id:'00123', decimal:'123', yes:'true', nil:'null', path:'C:\\new\\file', payload:JSON.stringify({items:[JSON.stringify({ok:true}), 'hello'], empty:'{}'}), invalid:'{broken}' };
  const expected = {...original, payload:{items:[{ok:true},'hello'],empty:{}}};
  const text = JSON.stringify(original);
  for (const raw of [text,JSON.stringify(text),JSON.stringify(JSON.stringify(text)),JSON.stringify(text).slice(1,-1)]) {
    const result = api.expandNested(raw);
    assert.deepEqual(plain(result.value),expected);
    assert.ok(result.count >= 3);
  }
  for (const text of ['"123"','"true"','"null"','null','0','false','"hello"']) assert.deepEqual(plain(api.expandNested(text).value),JSON.parse(text));
  assert.equal(api.inspect(text).count,3);
  assert.equal(api.inspect(JSON.stringify(text)).kind,'encoded');
  assert.equal(api.inspect('{broken}').kind,'invalid');
});

test('Nested JSON keeps special own keys and refuses partial output at its complexity limits', () => {
  const input = '{"__proto__":"{\\"polluted\\":true}","constructor":"[1]"}';
  const expanded = api.expandNested(input).value;
  assert.equal(Object.getPrototypeOf(expanded),null);
  assert.equal(Object.prototype.hasOwnProperty.call(expanded,'__proto__'),true);
  assert.deepEqual(plain(expanded),JSON.parse('{"__proto__":{"polluted":true},"constructor":[1]}'));
  assert.equal({}.polluted,undefined);
  assert.throws(()=>api.expandNested('x'.repeat(1000001)),error=>error.code==='limit');
  assert.throws(()=>api.expandNested('['.repeat(66)+'0'+']'.repeat(66)),error=>error.code==='complexity');
  assert.throws(()=>api.expandNested(JSON.stringify(Array(20001).fill(0))),error=>error.code==='complexity');
  let encoded='{}';for(let i=0;i<9;i++)encoded=JSON.stringify(encoded);
  assert.throws(()=>api.expandNested(encoded),error=>error.code==='layers');
});

test('Copied JSON paths address punctuation, quotes, slashes and control characters exactly', () => {
  for (const key of ['normal','a.b','a"b',"a'b",'a\\b','line\nbreak','🙂','__proto__','x[0]','x"]evil']) {
    const object=Object.fromEntries([[key,{ok:1}]]);
    assert.deepEqual(plain(ctx._jsonPath(object,'$'+ctx._jPathKey(key))),{ok:1});
  }
  assert.equal(ctx._jsonPath({},'$.toString'),undefined);
  assert.equal(ctx._jsonPath({},'$.__proto__'),undefined);
  assert.equal(ctx._jsonPath({x:1},"$['x']"),1);
  assert.throws(()=>ctx._jsonPath({x:1},'$.x invalid'));
  assert.deepEqual(plain(ctx._jsonPath([{age:19},{age:20},{age:21}],'$[?(@.age>=20)]')),[{age:20},{age:21}]);
});
