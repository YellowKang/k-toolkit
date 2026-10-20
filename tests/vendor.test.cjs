const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const PUB = path.resolve(__dirname, '..', 'public');
const manifest = JSON.parse(fs.readFileSync(path.join(PUB, 'vendor/manifest.json'), 'utf8'));
const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');

test('vendored libraries match the pinned upstream digests', () => {
  for (const [name, entry] of Object.entries(manifest)) {
    let content = fs.readFileSync(path.join(PUB, 'vendor', entry.file));
    const text = content.toString('utf8');
    // Wrapped bundles keep the upstream bytes verbatim between markers.
    const begin = '/* ── upstream:begin ── */\n', end = '\n/* ── upstream:end ── */';
    if (text.includes(begin)) content = Buffer.from(text.slice(text.indexOf(begin) + begin.length, text.indexOf(end)), 'utf8');
    assert.equal(sha256(content), entry.sha256, `${name} digest`);
    assert.ok(fs.existsSync(path.join(PUB, 'vendor', path.dirname(entry.file), 'LICENSE')), `${name} license`);
  }
});

test('pages never load scripts from third-party CDNs', () => {
  const offenders = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (entry.name !== 'vendor') walk(file); continue; }
      if (!/\.(js|html)$/.test(entry.name)) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/.test(text)) offenders.push(path.relative(PUB, file));
    }
  })(PUB);
  assert.deepEqual(offenders, []);
});

test('YAML and TOML conversions use the pinned parsers', async () => {
  const context = vm.createContext({ console });
  context.window = context;
  for (const file of ['vendor/js-yaml/js-yaml.min.js', 'vendor/smol-toml/smol-toml.js', 'compute/formats.js']) {
    vm.runInContext(fs.readFileSync(path.join(PUB, file), 'utf8'), context, { filename: file });
  }
  const f = context.KCompute.formats;
  const plain = v => JSON.parse(JSON.stringify(v));
  const k8s = 'defaults: &d\n  image: nginx:1.27\n  ports: [80]\nspec:\n  containers:\n    - name: web\n      <<: *d\n      env:\n        - { name: TZ, value: Asia/Shanghai }\n  date: 2024-01-01\n';
  assert.deepEqual(plain((await f.yamlParse(k8s)).value), {
    defaults: { image: 'nginx:1.27', ports: [80] },
    spec: { containers: [{ name: 'web', image: 'nginx:1.27', ports: [80], env: [{ name: 'TZ', value: 'Asia/Shanghai' }] }], date: '2024-01-01' },
  });
  const multi = await f.yamlParse('a: 1\n---\nb: 2\n');
  assert.equal(multi.documents, 2);
  await assert.rejects(f.yamlParse('a: [1, 2\n'), err => err.line === 2);
  assert.equal(await f.yamlStringify({ s: 'true', num: '123', e: '', list: [] }), "s: 'true'\nnum: '123'\ne: ''\nlist: []\n");
  const cargo = '[package]\nname = "demo"\n\n[dependencies]\nserde = { version = "1.0", features = ["derive"] }\n\n[[bin]]\nname = "cli"\nlist = [\n  "a",\n  "b,c",\n]\n';
  assert.deepEqual(plain(await f.tomlParse(cargo)), { package: { name: 'demo' }, dependencies: { serde: { version: '1.0', features: ['derive'] } }, bin: [{ name: 'cli', list: ['a', 'b,c'] }] });
  await assert.rejects(f.tomlParse('a = [1,'), /./);
  const out = await f.tomlStringify({ a: 1, b: null, t: { c: null, d: 'x' } });
  assert.deepEqual(plain(out.dropped), ['b', 't.c']);
  assert.equal(out.text.trim(), 'a = 1\n\n[t]\nd = "x"');
  await assert.rejects(f.tomlStringify([1, 2]), /top-level/);
});
