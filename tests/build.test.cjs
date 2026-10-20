const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

test('build preserves CSS math, emits valid JS and versions every source category', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-build-test-'));
  const root = path.resolve(__dirname, '..');
  try {
    for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
    const build = () => {
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe' });
      return fs.readFileSync(path.join(temp, 'dist/sw.js'), 'utf8');
    };
    let previous = build();
    const version = JSON.parse(fs.readFileSync(path.join(temp, 'dist/version.json'), 'utf8')).version;
    assert.match(version, /^[a-f0-9]{8}$/);
    const html = fs.readFileSync(path.join(temp, 'dist/dashboard.html'), 'utf8');
    assert.ok(html.includes('name="toolkit-version" content="' + version + '"'));
    assert.ok(html.includes('app-updates.js?v=' + version));
    assert.ok(html.includes('image-session.js?v=' + version));
    assert.ok(fs.existsSync(path.join(temp, 'dist/.nojekyll')));
    assert.match(fs.readFileSync(path.join(temp, 'dist/dashboard-components.css'), 'utf8'), /calc\(100% \+ 8px\)/);
    const checkJs = dir => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) checkJs(file);
        else if (file.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
      }
    };
    checkJs(path.join(temp, 'dist'));
    // Generated config text lives in template literals; production must keep its indentation.
    assert.ok(fs.readFileSync(path.join(temp, 'dist/tools/nginx-gen.js'), 'utf8').includes('\n    location / {'));
    assert.equal(build(), previous, 'unchanged sources should produce an unchanged version');
    assert.ok(fs.existsSync(path.join(temp, 'dist/compute/lunar.js')), 'compute modules are published');
    for (const file of ['public/tools/img-compress.js', 'public/agent/agent-core.js', 'public/compute/lunar.js', 'public/dashboard.html', 'public/sw.js', 'scripts/build.js']) {
      fs.appendFileSync(path.join(temp, file), '\n');
      const next = build();
      assert.notEqual(next, previous, `${file} must affect the SW version`);
      previous = next;
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
