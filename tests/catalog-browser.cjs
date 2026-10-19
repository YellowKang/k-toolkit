const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const express = require('express');

(async () => {
  const root = path.resolve(__dirname, '..');
  let browser, server, temp;
  try {
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-catalog-test-'));
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
    const page = await browser.newPage({ serviceWorkers: 'block' }); page.setDefaultTimeout(8000);
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('Browser error:', error.stack); });
    await page.addInitScript(() => localStorage.setItem('dtb_favorites', JSON.stringify(['hmac-gen', 'img-webp'])));
    await page.route(/^https:\/\//, route => route.abort()); // No CDN or provider is needed to verify navigation.
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.locator('.nav-cat').first().waitFor();
    assert.equal(await page.locator('.nav-cat').count(), 10);
    assert.equal(await page.locator('.nav-tool-item').count(), 84);
    const categories = await page.evaluate(() => Object.keys(ToolCatalog.categories));
    for (const category of categories) {
      await page.evaluate(category => setCatFilter(category), category);
      await page.waitForFunction(category => {
        const section = document.querySelector('[data-lazy-cat]');
        return section && section.dataset.lazyCat === category && section.querySelectorAll('.tool-card').length === ToolCatalog.entries.filter(tool => tool.category === category).length;
      }, category);
    }
    await page.evaluate(() => setLang('en'));
    assert.ok((await page.locator('.nav-cat-label').allTextContents()).includes('Data & Formats'));
    await page.evaluate(() => setCatFilter('数据格式'));
    await page.waitForFunction(() => document.querySelector('[data-lazy-cat="数据格式"] .tool-card-name')?.textContent === 'JSON Formatter');
    assert.equal(await page.locator('[data-lazy-cat] .tool-card').count(), 9);
    await page.evaluate(() => setLang('zh'));
    const route = async (id, selector) => {
      await page.evaluate(id => navigateTo(id), id);
      await page.locator(selector).first().waitFor({ state: 'attached' });
    };
    const routes = [
      ['img-compress', '#imgFileInput'], ['img-webp', '#iwFile'],
      ['hash', '#hashInput'], ['hmac-gen', '#hmacMsg'],
      ['qrcode', '#qrInput'], ['qrcode-decode', '#qrdFile'],
      ['timezone', '#tzInput'], ['world-clock', '#wcGrid'],
      ['http-tester', '#htUrl'], ['curl-gen', '#cgUrl'], ['http-status', '#toolBody'],
    ];
    for (const [id, selector] of routes) {
      await route(id, selector);
      await page.locator(`.tool-workbench a[href="#${id}"][aria-current="page"]`).waitFor();
      const primary = await page.evaluate(id => ToolCatalog.groupFor(id).tools[0], id);
      assert.equal(await page.locator('.nav-tool-item.active').getAttribute('href'), '#' + primary);
    }
    await page.locator('#hsSearch').fill('418');
    assert.equal(await page.locator('#hsGrid > div').count(), 1);
    assert.ok((await page.locator('#hsGrid').textContent()).includes("I'm a Teapot"));
    await page.evaluate(() => { window.__copiedStatus = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedStatus = value; } } }); });
    await page.locator('#hsGrid > div').click();
    assert.equal(await page.evaluate(() => window.__copiedStatus), '418');
    await route('hmac-gen', '#hmacMsg');
    await page.locator('#hmacMsg').fill('hello'); await page.locator('#hmacKey').fill('secret');
    await page.waitForFunction(expected => document.querySelector('#hmacResult').textContent === expected, crypto.createHmac('sha256', 'secret').update('hello').digest('hex'));
    await route('hash', '#hashInput'); await page.locator('#hashInput').fill('hello');
    await page.waitForFunction(expected => document.querySelector('[data-algo="SHA-256"]')?.textContent === expected, crypto.createHash('sha256').update('hello').digest('hex'));
    await route('favorites', '.tools-grid');
    assert.ok((await page.locator('.tool-card-name').allTextContents()).includes('HMAC 生成器'));
    assert.ok((await page.locator('.tool-card-name').allTextContents()).includes('图片转 WebP'));
    // Exercise the whole classic-script catalog, including prefetch/navigation races.
    await page.evaluate(async () => {
      const cleanup = window._activeCleanup;
      await Promise.all([prefetchTool('gradient'), loadTool('gradient'), loadTool('gradient')]);
      for (const tool of TOOLS.filter(tool => tool.id !== 'ai-chat')) await loadTool(tool.id);
      await loadTool('gradient');
      if (window._activeCleanup !== cleanup) throw new Error('Preloading a tool replaced the active page cleanup');
    });
    assert.equal(await page.locator('script[src^="tools/gradient.js?v="]').count(), 1);
    assert.deepEqual(errors, []);
    await route('gradient', '#toolBody'); assert.equal(await page.evaluate(() => typeof renderGradient), 'function');
    await route('note', '#noteArea'); await page.locator('#noteArea').fill('Saved when leaving immediately');
    await route('noise-gen', '#ngPlayBtn');
    assert.equal(await page.evaluate(() => localStorage.getItem('dtb_note')), 'Saved when leaving immediately');
    await route('svg-preview', '#svg-input');
    await page.locator('#svg-input').fill('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" onload="window.__svgProbe=true"><rect width="80" height="40" fill="blue"/></svg>');
    await page.waitForFunction(() => document.querySelector('#svg-preview-box img')?.naturalWidth === 80);
    assert.equal(await page.evaluate(() => window.__svgProbe), undefined);
    assert.equal(await page.locator('#svg-preview-box svg').count(), 0);
    await route('hmac-gen', '#hmacMsg');
    for (const width of [375, 768]) {
      await page.setViewportSize({ width, height: 850 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    if (process.env.TEST_SCREENSHOT) await page.screenshot({ path: process.env.TEST_SCREENSHOT, fullPage: true, animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS: 10 categories, 5 workbenches, all legacy child routes/favorites, bilingual catalog, HMAC/hash, >30 script loads, SVG isolation, mobile widths');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
