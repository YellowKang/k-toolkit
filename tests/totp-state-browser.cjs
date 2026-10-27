const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');
const express = require('express');
const { chromium, firefox } = require('playwright');
const SECRET = 'JBSWY3DPEHPK3PXP', OTHER = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
function reference(secret, time) {
  let bits = 0, value = 0; const bytes = [];
  for (const c of secret) { value = (value << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c); bits += 5; if (bits >= 8) { bits -= 8; bytes.push((value >>> bits) & 255); } }
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const mac = crypto.createHmac('sha1', Buffer.from(bytes)).update(counter).digest();
  return String((mac.readUInt32BE(mac.at(-1) & 15) & 0x7fffffff) % 1000000).padStart(6, '0');
}
(async () => {
  let browser, server, temp;
  try {
    const root = path.join(__dirname, '..'); let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-otp-state-'));
      for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe' }); source = path.join(temp, 'dist');
    }
    const app = express(); app.use('/k-toolkit', express.static(source));
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    browser = await (process.env.TEST_BROWSER === 'firefox' ? firefox : chromium).launch({ headless: true });
    const page = await browser.newPage({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000); const errors = []; let external = 0;
    page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => { external++; return route.abort(); });
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html#totp`);
    await page.locator('[data-tab="quick"]').click();
    await page.evaluate(() => {
      window.__now = 1800000000000; Date.now = () => __now; clearInterval(_tf.timer);
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
        writeText: async text => { window.__copied = text; },
        write: async items => { window.__copied = await (await items[0].getType('text/plain')).text(); },
      } });
    });
    await page.locator('#tfQuickInput').fill(SECRET.toLowerCase());
    await page.waitForFunction(() => /^\d{6}$/.test(document.getElementById('tfQuickCode').dataset.code || ''));
    // A background tab's timer can lag behind real time. Copy must calculate now.
    await page.evaluate(() => { __now += 90000; });
    await page.locator('#tfQuickCode').click();
    await page.waitForFunction(() => typeof __copied === 'string');
    assert.equal(await page.evaluate(() => __copied), reference(SECRET, 1800000090000), 'copy must not use an expired cached code');
    assert.match(await page.evaluate(() => __copied), /^\d{6}$/, 'clipboard contains only digits');
    await page.evaluate(() => { __now += 30000; window.dispatchEvent(new Event('focus')); });
    await page.waitForFunction(expected => document.getElementById('tfQuickCode').dataset.code === expected, reference(SECRET, 1800000120000));
    await page.waitForTimeout(1600);
    assert.equal((await page.locator('#tfQuickCode').textContent()).replace(/\s/g, ''), reference(SECRET, 1800000120000), 'copy feedback must not restore old digits');

    // Hold the WebCrypto boundary, then change secrets before the old result arrives.
    await page.evaluate(() => {
      const sign = crypto.subtle.sign.bind(crypto.subtle); window.__blockNext = true;
      crypto.subtle.sign = (...args) => {
        const result = sign(...args);
        if (!window.__blockNext) return result;
        window.__blockNext = false; return new Promise(resolve => { window.__releaseOtp = async () => resolve(await result); });
      };
    });
    await page.locator('#tfQuickInput').fill(OTHER); await page.waitForFunction(() => typeof __releaseOtp === 'function');
    await page.locator('#tfQuickInput').fill(SECRET);
    await page.waitForFunction(expected => document.getElementById('tfQuickCode').dataset.code === expected && !document.getElementById('tfQuickCode').disabled, reference(SECRET, 1800000120000));
    await page.evaluate(() => __releaseOtp()); await page.waitForTimeout(100);
    assert.equal(await page.locator('#tfQuickCode').getAttribute('data-code'), reference(SECRET, 1800000120000), 'late result cannot replace the current secret');
    await page.locator('#tfQuickInput').fill(''); assert.equal(await page.locator('#tfQuickResult').isVisible(), false);

    await page.locator('[data-tab="vault"]').click();
    await page.locator('#tfNewPw').fill('fixture-only-password'); await page.locator('#tfNewPw2').fill('fixture-only-password'); await page.locator('#tfCreateBtn').click(); await page.locator('#tfSearch').waitFor();
    await page.getByRole('button', { name: '⇣ 导入', exact: true }).click();
    const accounts = [
      { issuer: 'Google', account: 'work@example.com', note: 'primary team' },
      { issuer: 'google', account: 'private@example.com', note: 'personal' },
      { issuer: ' OpenAI ', account: 'work@example.com', note: 'primary team' },
      { issuer: '', account: 'unclassified@gmail.com' },
      { issuer: 'Meta', account: 'team@example.com' },
      { issuer: '<img data-group-probe src=x onerror=alert(1)>', account: '<b>literal</b>' },
    ].map(({ account, ...e }) => ({ ...e, name: account, type: 'totp', info: { secret: SECRET, algo: 'SHA1', digits: 6, period: 30 } }));
    await page.locator('#tfImportText').fill(JSON.stringify({ version: 1, db: { entries: accounts } }));
    await page.locator('#tfPanel .btn-primary').first().click(); await page.locator('#tfImportGo').click();
    await page.waitForFunction(() => document.querySelectorAll('.tf-card').length === 6);
    assert.equal(await page.locator('.tf-account-group').count(), 5);
    assert.equal(await page.locator('[data-issuer="issuer:google"] .tf-card').count(), 2);
    assert.equal(await page.locator('[data-issuer="unclassified"] .tf-card').count(), 1);
    assert.equal(await page.locator('[data-group-probe]').count(), 0);
    await page.locator('#tfIssuerFilter').selectOption('issuer:google'); assert.equal(await page.locator('.tf-card').count(), 2);
    assert.match(await page.locator('#tfCount').textContent(), /2.*6/);
    await page.locator('#tfSearch').fill('GOOGLE primary'); await page.waitForFunction(() => document.querySelectorAll('.tf-card').length === 1);
    assert.match(await page.locator('.tf-account').textContent(), /work@example.com/);
    await page.locator('#tfClearFilters').click(); assert.equal(await page.locator('.tf-card').count(), 6);
    await page.locator('#tfSearch').fill(SECRET); await page.waitForFunction(() => document.querySelectorAll('.tf-card').length === 0);
    await page.locator('#tfClearFilters').click();
    const google = page.locator('[data-issuer="issuer:google"]'); await google.locator('summary').click(); assert.equal(await google.locator('.tf-card').first().isVisible(), false);
    await google.locator('summary').click();
    // Imported account copying must also refresh a stale cached code.
    await page.waitForFunction(() => /^\d{6}$/.test(document.querySelector('.tf-card .tf-code').dataset.code || ''));
    await page.evaluate(() => { __now += 90000; window.__copied = null; });
    await google.locator('.tf-code').first().click(); await page.waitForFunction(() => typeof __copied === 'string');
    assert.equal(await page.evaluate(() => __copied), reference(SECRET, 1800000210000));
    await page.locator('[data-issuer="unclassified"]').getByRole('button', { name: '编辑', exact: true }).click();
    await page.locator('#tfPanel input[data-key="issuer"]').fill('Google'); await page.locator('#tfPanel .btn-primary').click();
    await page.waitForFunction(() => document.querySelectorAll('[data-issuer="issuer:google"] .tf-card').length === 3);
    assert.equal(await page.locator('[data-issuer="unclassified"]').count(), 0);
    assert.doesNotMatch(await page.evaluate(() => localStorage.getItem('dtb_otp_vault')), /work@example.com|Google|JBSWY/);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator('#tfGrid').evaluate(el => el.scrollWidth <= el.clientWidth));
    if (process.env.VISUAL_CHECK) await page.screenshot({ path: '/tmp/ktool-2fa-groups-mobile.png', fullPage: true });
    await page.evaluate(() => setLang('en')); await page.locator('#tfIssuerFilter').waitFor();
    assert.match(await page.locator('#tfIssuerFilter option').first().textContent(), /All/);
    await page.getByRole('button', { name: '🔒 Lock', exact: true }).click(); assert.equal(await page.locator('#tfIssuerFilter').count(), 0); assert.equal(await page.locator('.tf-card').count(), 0);
    assert.deepEqual(errors, []); assert.equal(external, 0);
    console.log('PASS fresh-code copying, foreground refresh, late crypto guards, issuer groups, combined search, edit regrouping, encrypted storage and mobile/English UI');
  } finally { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); if (temp) fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
