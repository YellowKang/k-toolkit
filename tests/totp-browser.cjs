// 2FA tool end to end: encrypted board, codes matching an independent TOTP, lock/unlock, imports, exports, quick check, generator.
const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const express = require('express');

const SECRET = 'JBSWY3DPEHPK3PXP';
function base32(text) {
  let bits = 0, value = 0; const out = [];
  for (const c of text.replace(/=+$/, '')) {
    value = (value << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(c); bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}
function totp(secret, time = Date.now()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const mac = crypto.createHmac('sha1', base32(secret)).update(counter).digest();
  const offset = mac[19] & 15;
  return String((((mac[offset] & 0x7f) << 24) | (mac[offset + 1] << 16) | (mac[offset + 2] << 8) | mac[offset + 3]) % 1e6).padStart(6, '0');
}
const around = secret => [totp(secret, Date.now() - 30000), totp(secret), totp(secret, Date.now() + 30000)];

(async () => {
  const root = path.resolve(__dirname, '..');
  let browser, server, temp;
  try {
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-totp-test-'));
      for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe' });
      source = path.join(temp, 'dist');
    }
    const app = express(); app.use('/k-toolkit', express.static(source));
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const options = { headless: true };
    if (process.env.TEST_BROWSER_CHANNEL) options.channel = process.env.TEST_BROWSER_CHANNEL;
    if (process.env.TEST_BROWSER_EXECUTABLE) options.executablePath = process.env.TEST_BROWSER_EXECUTABLE;
    browser = await (process.env.TEST_BROWSER === 'firefox' ? firefox : chromium).launch(options);
    const context = await browser.newContext({ serviceWorkers: 'block', acceptDownloads: true });
    if (process.env.TEST_BROWSER !== 'firefox') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error('Browser error:', e.stack); });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html#totp`);

    // Create the encrypted board.
    await page.locator('#tfNewPw').fill('short');
    await page.locator('#tfNewPw2').fill('short');
    await page.locator('#tfCreateBtn').click();
    assert.match(await page.locator('#tfMsg').textContent(), /8/);
    await page.locator('#tfNewPw').fill('correct horse battery');
    await page.locator('#tfNewPw2').fill('correct horse battery');
    await page.locator('#tfCreateBtn').click();
    await page.locator('#tfSearch').waitFor();

    // Add from an otpauth link; the shown code matches an independent TOTP.
    await page.getByRole('button', { name: /添加|Add/ }).click();
    await page.locator('#tfAddSecret').fill(`otpauth://totp/GitHub:alice@example.com?secret=${SECRET}&issuer=GitHub`);
    await page.locator('#tfAddIssuer').waitFor();
    await page.waitForFunction(() => document.getElementById('tfAddIssuer').value === 'GitHub');
    await page.locator('#tfPanel .btn-primary').click();
    await page.waitForFunction(() => /\d{3} \d{3}/.test(document.querySelector('.tf-card .tf-code')?.textContent || ''));
    const shown = (await page.locator('.tf-card .tf-code').first().textContent()).replace(/\s/g, '');
    assert.ok(around(SECRET).includes(shown), `${shown} vs ${around(SECRET)}`);
    const stored = await page.evaluate(() => localStorage.getItem('dtb_otp_vault'));
    assert.ok(!stored.includes(SECRET) && !stored.includes('GitHub'), 'vault is stored encrypted');

    // Lock, reject a wrong password, unlock.
    await page.getByRole('button', { name: /锁定|Lock/ }).click();
    await page.locator('#tfUnlockPw').fill('wrong password');
    await page.locator('#tfUnlockBtn').click();
    await page.waitForFunction(() => /错误|Wrong/.test(document.getElementById('tfMsg').textContent));
    await page.locator('#tfUnlockPw').fill('correct horse battery');
    await page.locator('#tfUnlockBtn').click();
    await page.locator('.tf-card').first().waitFor();

    // Import a Google Authenticator transfer link: one duplicate, one new, one broken line.
    const transfer = await page.evaluate(async secret => (await ToolCompute.load('otp')).buildMigration([
      { issuer: 'GitHub', account: 'alice@example.com', secret }, { issuer: 'Google', account: 'bob@gmail.com', secret: 'GEZDGNBVGY3TQOJQ' }]).uris[0], SECRET);
    await page.getByRole('button', { name: /导入|Import/ }).first().click();
    await page.locator('#tfImportText').fill(`${transfer}\nnot-a-link`);
    await page.locator('#tfPanel .btn-primary').first().click();
    await page.locator('#tfImportGo').waitFor();
    assert.equal(await page.locator('#tfImportPreview input[data-index]').count(), 1);
    assert.equal(await page.locator('#tfImportPreview label').count(), 3);
    await page.locator('#tfImportGo').click();
    await page.waitForFunction(() => document.querySelectorAll('.tf-card').length === 2);
    assert.ok(around('GEZDGNBVGY3TQOJQ').includes((await page.locator('.tf-card').nth(1).locator('.tf-code').textContent()).replace(/\s/g, '')));

    // Encrypted backup download, then plain links and transfer QR behind a confirmation.
    await page.getByRole('button', { name: /导出|Export/ }).first().click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#tfPanel .btn-primary').click()]);
    const backup = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
    assert.equal(backup.format, 'k-toolkit-2fa');
    assert.equal(backup.count, 2);
    assert.ok(!JSON.stringify(backup).includes(SECRET));
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /otpauth/ }).click();
    await page.waitForFunction(secret => document.querySelector('#tfExportOut textarea')?.value.includes(secret), SECRET);
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /Google Authenticator/ }).click();
    await page.locator('#tfExportOut .tf-qr canvas').waitFor({ state: 'attached' });
    const decoded = await page.evaluate(async () => {
      const decode = await ToolCompute.loadVendor('jsqr');
      const canvas = document.querySelector('#tfExportOut .tf-qr canvas');
      const padded = document.createElement('canvas');
      padded.width = canvas.width + 40; padded.height = canvas.height + 40;
      const ctx = padded.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, padded.width, padded.height); ctx.drawImage(canvas, 20, 20);
      const text = decode(ctx.getImageData(0, 0, padded.width, padded.height).data, padded.width, padded.height)?.data;
      return (await ToolCompute.load('otp')).parseMigration(text).entries.map(e => e.issuer);
    });
    assert.deepEqual(decoded, ['GitHub', 'Google']);

    // Re-import the encrypted backup into a fresh board.
    await page.evaluate(() => { tfLock(true); localStorage.removeItem('dtb_otp_vault'); tfSwitchTab('vault'); });
    await page.locator('#tfNewPw').fill('another strong pass');
    await page.locator('#tfNewPw2').fill('another strong pass');
    await page.locator('#tfCreateBtn').click();
    await page.locator('#tfSearch').waitFor();
    await page.getByRole('button', { name: /导入|Import/ }).first().click();
    await page.locator('#tfImportText').fill(JSON.stringify(backup));
    await page.locator('#tfPanel .btn-primary').first().click();
    await page.locator('#tfImportPw input').fill('correct horse battery');
    await page.locator('#tfImportPw button').click();
    await page.locator('#tfImportGo').click();
    await page.waitForFunction(() => document.querySelectorAll('.tf-card').length === 2);

    // Inactivity locks the board.
    await page.evaluate(() => { _tf.lastActive = Date.now() - 61 * 60000; });
    await page.locator('#tfUnlockPw').waitFor();

    // Quick check verifies codes and explains bad secrets; the generator produces a scannable secret.
    await page.locator('[data-tab="quick"]').click();
    await page.locator('#tfQuickInput').fill(SECRET);
    await page.locator('#tfQuickVerify').fill(totp(SECRET));
    await page.waitForFunction(() => document.getElementById('tfQuickVerifyResult').textContent.startsWith('✓'));
    await page.locator('#tfQuickInput').fill('JBSW1');
    await page.waitForFunction(() => /Base32/.test(document.getElementById('tfQuickMsg').textContent));
    await page.locator('[data-tab="generate"]').click();
    await page.locator('#tfGenAccount').fill('dev@acme.io');
    await page.locator('#tfGenBtn').click();
    await page.locator('#tfGenQr canvas').waitFor({ state: 'attached' });
    const generated = (await page.locator('#tfGenSecret').textContent()).replace(/\s/g, '');
    assert.equal(generated.length, 32);
    await page.locator('#tfGenVerify').fill(totp(generated));
    await page.waitForFunction(() => document.getElementById('tfGenVerifyResult').textContent.startsWith('✓'));

    // The Agent never reads this tool.
    await page.evaluate(() => loadAgentScripts());
    assert.equal(await page.evaluate(() => window.TOOL_CAPS?.totp?.autoRun), false);
    assert.equal(await page.evaluate(() => !!window.TOOL_RUNNERS?.totp), false);
    assert.deepEqual(errors, []);
    console.log('PASS: 2FA board encrypted at rest, codes match RFC TOTP, lock/unlock, transfer-link import, encrypted backup round trip, plain/QR export, auto-lock, quick check, generator, Agent isolation');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
