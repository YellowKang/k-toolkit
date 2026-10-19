const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const express = require('express');
(async () => {
  const root = path.resolve(__dirname, '..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-update-test-'));
  let browser, server;
  try {
    for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
    const gradient = path.join(temp, 'public/tools/gradient.js');
    const original = fs.readFileSync(gradient, 'utf8');
    const versions = {};
    for (const release of ['A', 'B', 'C']) {
      fs.writeFileSync(gradient, original + '\nwindow.__releaseTool = ' + JSON.stringify(release) + ';\n');
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe' });
      fs.renameSync(path.join(temp, 'dist'), path.join(temp, release));
      versions[release] = JSON.parse(fs.readFileSync(path.join(temp, release, 'version.json'))).version;
    }
    let deployed = 'A', failure = '';
    const app = express();
    app.use('/k-toolkit', (req, res) => {
      res.set('Cache-Control', 'public, max-age=600');
      if (failure && req.path === '/tools/gradient.js') {
        if (failure === 'missing') return res.status(404).end();
        return res.sendFile(path.join(temp, 'B/tools/gradient.js'));
      }
      res.sendFile(path.join(temp, deployed, req.path === '/' ? 'dashboard.html' : req.path.slice(1)));
    });
    server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    const options = { headless: true };
    if (process.env.TEST_BROWSER_CHANNEL) options.channel = process.env.TEST_BROWSER_CHANNEL;
    if (process.env.TEST_BROWSER_EXECUTABLE) options.executablePath = process.env.TEST_BROWSER_EXECUTABLE;
    browser = await (process.env.TEST_BROWSER === 'firefox' ? firefox : chromium).launch(options);
    const context = await browser.newContext({ serviceWorkers: 'allow' });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}/k-toolkit/`;
    const current = p => p.locator('meta[name="toolkit-version"]').getAttribute('content');
    await page.goto(base + 'dashboard.html#json');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.evaluate(async () => {
      await AppUpdates.check();
      localStorage.setItem('dtb_favorites', '["hash"]');
      await caches.open('dtb-release:/other-project/:keep');
    });
    const second = await context.newPage();
    await second.goto(base + 'dashboard.html#json');
    await second.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.locator('#jsonInput').fill('{"unsaved":true}');
    deployed = 'B';
    await page.locator('#appUpdateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-apply]').textContent === '更新并刷新' && !document.querySelector('[data-apply]').disabled, null, { timeout: 60000 });
    assert.equal(await current(page), versions.A);
    assert.equal(await page.locator('#jsonInput').inputValue(), '{"unsaved":true}');
    await page.locator('[data-apply]').click();
    await page.waitForFunction(version => document.querySelector('meta[name="toolkit-version"]').content === version, versions.B);
    assert.equal(await page.evaluate(() => localStorage.getItem('dtb_favorites')), '["hash"]');
    assert.equal(await current(second), versions.A, 'other tabs must not reload automatically');
    await second.evaluate(async () => { await loadTool('gradient'); });
    assert.equal(await second.evaluate(() => window.__releaseTool), 'A', 'old tabs must still receive old lazy scripts');
    assert.ok(await page.evaluate(async () => (await caches.keys()).includes('dtb-release:/other-project/:keep')));

    await context.setOffline(true);
    await page.reload();
    assert.equal(await current(page), versions.B);
    await page.locator('#appUpdateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-status]').textContent.includes('暂时无法'));
    await page.locator('[data-close]').click();
    await page.evaluate(async () => { await loadTool('gradient'); });
    assert.equal(await page.evaluate(() => window.__releaseTool), 'B');
    deployed = 'C'; failure = 'missing';
    await context.setOffline(false);
    for (const mode of ['missing', 'mismatch']) {
      failure = mode;
      await page.evaluate(() => AppUpdates.check());
      assert.match(await page.locator('[data-status]').textContent(), /暂时无法/);
      assert.equal(await current(page), versions.B);
      assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).waiting === null), true);
    }
    failure = '';
    await page.evaluate(() => AppUpdates.check());
    assert.equal(await page.locator('[data-apply]').textContent(), '更新并刷新');
    await page.locator('#appUpdateButton').click();
    await page.locator('[data-check]').waitFor();
    await page.waitForFunction(() => !document.querySelector('[data-apply]').disabled);
    await page.locator('[data-apply]').click();
    await page.waitForFunction(version => document.querySelector('meta[name="toolkit-version"]').content === version, versions.C);
    await page.locator('#appUpdateButton').click();
    await page.waitForFunction(() => document.querySelector('[data-status]').textContent === '当前已是线上版本。');
    await page.evaluate(() => setLang('en'));
    assert.equal(await page.locator('#updateTitle').textContent(), 'Version & updates');
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 850 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const box = await page.locator('#appUpdateDialog').boundingBox();
      assert.ok(Math.abs(box.x - (width - box.width) / 2) < 2, 'update dialog should remain centered');
    }
    if (process.env.TEST_SCREENSHOT) await page.screenshot({ path: process.env.TEST_SCREENSHOT, animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS: actual A→B→C SW updates, explicit refresh, old tabs, offline reload, missing/mismatched release rejection, scoped caches, favorites, bilingual mobile dialog');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
