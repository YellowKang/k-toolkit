// Backup & restore end to end: export (API keys encrypted) → wipe storage → import with merge → reload → data is back.
const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const express = require('express');

(async () => {
  const root = path.resolve(__dirname, '..');
  let browser, server, temp;
  try {
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-backup-test-'));
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
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => { errors.push(e.message); console.error('Browser error:', e.stack); });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('dtb_favorites', JSON.stringify(['hash', 'uuid']));
      localStorage.setItem('dtb_todo', JSON.stringify([{ id: 1, text: 'ship <b>backup</b>', done: false }]));
      localStorage.setItem('dtb_note', 'remember the milk');
      localStorage.setItem('dtb_usage', JSON.stringify({ hash: 4 }));
      localStorage.setItem('ag_key_openai', JSON.stringify('sk-test-secret-123'));
      localStorage.setItem('ag_model', JSON.stringify('gpt-test'));
      localStorage.setItem('dtb_chat_history', JSON.stringify([{role:'user',content:'saved question'},{role:'assistant',content:'saved reply'}]));
      localStorage.setItem('dtb_chat_history_meta', JSON.stringify({omitted:12}));
      localStorage.setItem('dtb_context_preferences', JSON.stringify({budget:16000,note:'Keep ID 00123'}));
    });
    const base = `http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`;
    await page.goto(base);
    await page.locator('#dataBackupButton').click();
    await page.locator('#dbGroups input[data-group="apikeys"]').waitFor();
    assert.equal(await page.locator('#dbGroups input[data-group="apikeys"]').isChecked(), false);
    assert.equal(await page.locator('#dbGroups input[data-group="otp"]').isDisabled(), true);

    // Export everything, API keys encrypted with a backup password.
    await page.locator('#dbGroups input[data-group="apikeys"]').check();
    await page.locator('#dbPw1').fill('backup password');
    await page.locator('#dbPw2').fill('backup password');
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /下载备份文件|Download backup/ }).click()]);
    const text = fs.readFileSync(await download.path(), 'utf8');
    const file = JSON.parse(text);
    assert.equal(file.format, 'k-toolkit-backup');
    assert.ok(!text.includes('sk-test-secret-123'), 'API key is encrypted');
    assert.ok(file.secret && file.data.dtb_favorites && file.data.ag_model && !file.data.ag_key_openai);

    // Wipe this browser, then restore from the file.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.evaluate(() => navigateTo('data-backup'));
    await page.locator('#dbFile').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(text) });
    await page.locator('#dbImportGo').waitFor();
    await page.locator('#dbPreview input[type=password]').fill('wrong password');
    await page.getByRole('button', { name: /解密|Decrypt/ }).click();
    await page.waitForFunction(() => /错误|Wrong/.test(document.getElementById('dbImportMsg').textContent));
    await page.locator('#dbPreview input[type=password]').fill('backup password');
    await page.getByRole('button', { name: /解密|Decrypt/ }).click();
    await page.locator('#dbPreview input[data-import-group="apikeys"]').waitFor();
    await page.locator('#dbImportGo').click();
    await Promise.all([page.waitForEvent('domcontentloaded'), page.getByRole('button', { name: /立即刷新|Reload now/ }).click()]);
    await page.waitForFunction(() => window.currentPage === 'data-backup' && document.querySelector('#dbImportText'));
    const restored = await page.evaluate(() => Object.fromEntries(['dtb_favorites', 'dtb_todo', 'dtb_note', 'dtb_usage', 'ag_key_openai', 'ag_model', 'dtb_chat_history', 'dtb_chat_history_meta', 'dtb_context_preferences'].map(k => [k, localStorage.getItem(k)])));
    assert.deepEqual(JSON.parse(restored.dtb_favorites), ['hash', 'uuid']);
    assert.equal(JSON.parse(restored.dtb_todo)[0].text, 'ship <b>backup</b>');
    assert.equal(restored.dtb_note, 'remember the milk');
    assert.equal(JSON.parse(restored.ag_key_openai), 'sk-test-secret-123');
    assert.deepEqual(JSON.parse(restored.dtb_chat_history), [{role:'user',content:'saved question'},{role:'assistant',content:'saved reply'}]);
    assert.deepEqual(JSON.parse(restored.dtb_chat_history_meta), {omitted:12});
    assert.deepEqual(JSON.parse(restored.dtb_context_preferences), {budget:16000,note:'Keep ID 00123'});

    // Lists deduplicate, while usage counters add as documented. Visiting the backup page changes those counters.
    await page.evaluate(() => navigateTo('data-backup'));
    await page.locator('#dbImportText').fill(text);
    await page.getByRole('button', { name: /^(解析|Parse)$/ }).click();
    const usageBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('dtb_usage')));
    await page.locator('#dbImportGo').click();
    await page.waitForFunction(() => /已写入|Wrote|无需写入|nothing to write/.test(document.getElementById('dbPreview').textContent));
    const expectedUsage = { ...usageBefore };
    if (JSON.stringify(usageBefore) !== file.data.dtb_usage) {
      for (const [key, count] of Object.entries(JSON.parse(file.data.dtb_usage))) expectedUsage[key] = (expectedUsage[key] || 0) + count;
    }
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('dtb_usage'))), expectedUsage);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('dtb_favorites'))), ['hash','uuid']);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dtb_todo')).length), 1);
    // Importing unchanged tool data/settings alone has nothing to write.
    await page.locator('#dbImportText').fill(text);
    await page.getByRole('button', { name: /^(解析|Parse)$/ }).click();
    await page.locator('#dbPreview input[data-import-group="history"]').uncheck();
    await page.locator('#dbImportGo').click();
    await page.waitForFunction(() => /无需写入|nothing to write/.test(document.getElementById('dbPreview').textContent));
    await page.locator('#dbImportText').fill('{"hello":1}');
    await page.getByRole('button', { name: /^(解析|Parse)$/ }).click();
    await page.waitForFunction(() => /K Toolkit/.test(document.getElementById('dbImportMsg').textContent));
    await page.evaluate(() => navigateTo('favorites'));
    await page.waitForFunction(() => document.querySelectorAll('.tool-card').length >= 2);
    assert.deepEqual(errors, []);
    console.log('PASS: backup export with encrypted API keys, wipe, import with wrong/right password, reload restores data, additive usage merge, deduplicated lists, unchanged tool data, foreign file rejected');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
