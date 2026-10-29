const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SUITES, parseArgs } = require('../scripts/browser-tests.js');

test('the browser runner lists every browser suite exactly once', () => {
  const files = fs.readdirSync(__dirname).filter(name => name.endsWith('-browser.cjs') || name === 'image-tools.cjs').sort();
  assert.deepEqual(SUITES.map(([, file]) => file).sort(), files, 'add new browser suites to scripts/browser-tests.js');
  assert.equal(new Set(SUITES.map(([name]) => name)).size, SUITES.length);
});

test('browser suites launch through the shared helper so local channel overrides apply', () => {
  for (const [, file] of SUITES) {
    const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
    assert.ok(source.includes('launchBrowser'), `${file} ignores TEST_BROWSER_CHANNEL`);
  }
});

test('runner arguments accept filters, --jobs and --bail', () => {
  assert.deepEqual(parseArgs(['totp', '--jobs', '3', '--bail']), { jobs: 3, bail: true, filters: ['totp'] });
  assert.equal(parseArgs(['--jobs=2']).jobs, 2);
});
