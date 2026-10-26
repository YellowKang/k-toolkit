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
    assert.equal(await page.locator('.nav-tool-item').count(), 73);
    const categories = await page.evaluate(() => Object.keys(ToolCatalog.categories));
    for (const category of categories) {
      await page.evaluate(category => setCatFilter(category), category);
      await page.waitForFunction(category => {
        const section = document.querySelector('[data-lazy-cat]');
        return section && section.dataset.lazyCat === category && section.querySelectorAll('.tool-card').length === ToolCatalog.entries.filter(tool => tool.category === category).length;
      }, category);
    }
    await page.evaluate(() => setLang('en'));
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'en');
    assert.ok((await page.locator('.nav-cat-label').allTextContents()).includes('Data & Formats'));
    await page.evaluate(() => setCatFilter('数据格式'));
    await page.waitForFunction(() => document.querySelector('[data-lazy-cat="数据格式"] .tool-card-name')?.textContent === 'Data Format Workbench');
    assert.equal(await page.locator('[data-lazy-cat] .tool-card').count(), 2);
    await page.evaluate(() => setLang('zh'));
    assert.equal(await page.evaluate(() => document.documentElement.lang), 'zh-CN');
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
    // Quotes in user data must survive inline handlers, including after the Agent bundle loads.
    await page.evaluate(() => loadAgentScripts());
    assert.equal(await page.evaluate(() => escHtml(`<a href="x">it's</a>`)), '&lt;a href=&quot;x&quot;&gt;it&#39;s&lt;/a&gt;');
    const tricky = `it's "quoted" </div>`;
    await page.evaluate(q => { _addSearchHistory(q); _showSearchHistory(); }, tricky);
    await page.locator('.sdrop-item', { hasText: tricky }).first().click();
    assert.equal(await page.locator('#searchInput').inputValue(), tricky);
    await route('url-parser', '#urlInput');
    await page.locator('#urlInput').fill(`https://example.com/?q=it's%22x`);
    await page.evaluate(() => parseUrl());
    await page.locator('#urlParamsTable .copy-inline').click();
    assert.equal(await page.evaluate(() => window.__copiedStatus), `it's"x`);
    // Shared compute modules load on demand (versioned like tools); 2027's new moon is at 23:56 Beijing time.
    await route('lunar-calendar', '#lcDate');
    await page.locator('#lcDate').fill('2027-02-06');
    await page.waitForFunction(() => document.querySelector('#lcCards')?.textContent.includes('丁未年 正月初一'));
    await route('number-chinese', '#ncInput');
    await page.locator('#ncInput').fill('16409.02');
    assert.equal(await page.locator('#ncOutput').textContent(), '壹万陆仟肆佰零玖元零贰分');
    await route('cron', '#cronInput');
    await page.locator('#cronInput').fill('0 0 1 1 *');
    await page.waitForFunction(() => document.querySelectorAll('#cronNextList .result-row').length === 8);
    assert.match(await page.locator('#cronNextList .result-row').first().textContent(), /-01-01 .* 00:00:00/);
    await route('json-csv', '#jcInput');
    await page.locator('#jcInput').fill('name,note\r\n"Bob, Jr.","a\nb"\r\n');
    await page.evaluate(() => convertJsonCsv());
    await page.waitForFunction(() => document.querySelector('#jcOutput').value.includes('Bob, Jr.'));
    assert.deepEqual(JSON.parse(await page.locator('#jcOutput').inputValue()), [{ name: 'Bob, Jr.', note: 'a\nb' }]);
    // QR libraries are local (CDNs are blocked here); decoded content is untrusted and must stay inert.
    const qrPayload = 'https://example.com/?q=" onmouseover="window.__qrPwned=1" x="';
    await route('qrcode', '#qrInput');
    await page.locator('#qrInput').fill(qrPayload);
    await page.evaluate(() => generateQr());
    await page.locator('#qrCanvas canvas').waitFor({ state: 'attached' });
    const qrPng = await page.evaluate(async () => { await new Promise(r => setTimeout(r, 200)); return document.querySelector('#qrCanvas canvas').toDataURL('image/png'); });
    await route('qrcode-decode', '#qrdFile');
    await page.locator('#qrdFile').setInputFiles({ name: 'qr.png', mimeType: 'image/png', buffer: Buffer.from(qrPng.split(',')[1], 'base64') });
    await page.waitForFunction(text => document.querySelector('#qrdContent')?.textContent === text, qrPayload);
    assert.deepEqual(await page.locator('#qrdActions a').evaluate(a => [...a.attributes].map(x => x.name).sort()), ['class', 'href', 'rel', 'target', 'title']);
    await page.locator('#qrdActions a').hover();
    assert.equal(await page.evaluate(() => window.__qrPwned), undefined);
    // Pasted JSON keys and JWT payloads are untrusted: neither tree attributes nor parse errors may become markup.
    await route('json', '#jsonInput');
    await page.locator('#jsonInput').fill(JSON.stringify({ 'k" onmouseover="window.__jsonPwned=1" x="': 1 }));
    await page.evaluate(() => { formatJSON(); jsonToggleView(); });
    await page.locator('#jsonTreeOutput .jt-select').first().hover();
    await page.locator('#jsonTreeOutput .jt-select').first().click();
    assert.equal(await page.evaluate(() => window.__jsonPwned), undefined);
    await route('jwt', '#jwtInput');
    const b64url = s => Buffer.from(s).toString('base64url');
    await page.locator('#jwtInput').fill(`${b64url('{"alg":"HS256"}')}.${b64url('<img src=x onerror="window.__jwtPwned=1">')}.sig`);
    await page.evaluate(() => decodeJWT());
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.__jwtPwned), undefined);
    assert.equal(await page.locator('#jwtParts img').count(), 0);
    await route('xml-format', '#xmlInput');
    await page.locator('#xmlInput').fill('<a x="&quot;"><b>Tom &amp; Jerry</b><!--keep--></a>');
    await page.evaluate(() => doXml());
    assert.equal(await page.locator('#xmlOutput').textContent(), '<a x="&quot;">\n  <b>Tom &amp; Jerry</b>\n  <!--keep-->\n</a>');
    await route('yaml-json', '#yjInput');
    await page.locator('#yjInput').fill('base: &b\n  image: nginx\nweb:\n  <<: *b\n  ports: [80]\n');
    await page.evaluate(() => yjToJSON());
    assert.deepEqual(JSON.parse(await page.locator('#yjOutput').textContent()), { base: { image: 'nginx' }, web: { image: 'nginx', ports: [80] } });
    // The entered time belongs to the chosen source zone, whatever the browser's own zone is.
    await route('timezone', '#tzInput');
    await page.locator('#tzFrom').selectOption('Asia/Tokyo');
    await page.locator('#tzInput').fill('2026-10-21T09:00');
    await page.evaluate(() => tzConvert());
    assert.match(await page.locator('#tzOutput .result-row').first().textContent(), /2026\/10\/21 00:00:00/); // first row is UTC
    // clip-path handles render inside the preview and drag the polygon point.
    await route('clip-path', '#cpCanvas');
    await page.locator('#cpSvgEl circle[data-idx="0"]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('#cpSvgEl circle[data-idx]').count(), 5);
    // Mouse coordinates must be measured after the page's entrance transform settles.
    await page.locator('#content').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    const handle = await page.locator('#cpSvgEl circle[data-idx="0"]').boundingBox();
    const canvasBox = await page.locator('#cpCanvas').boundingBox();
    // The first handle straddles the clipped top edge; grab its visible interior.
    await page.mouse.move(handle.x + handle.width / 2, Math.max(handle.y + handle.height / 2, canvasBox.y + 4));
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.25, canvasBox.y + canvasBox.height * 0.25, { steps: 4 });
    await page.mouse.up();
    assert.match(await page.locator('#cpOutput').textContent(), /^clip-path: polygon\((2[4-6])% (2[4-6])%,/);
    // AES: page round trip, Node/OpenSSL ciphertext, the old page's IV:data output, and Chrome's missing AES-192.
    await route('aes', '#aesInput');
    const aesRun = async () => {
      await page.locator('#aesRunBtn').click();
      await page.waitForFunction(() => ['ok', 'error'].includes(document.querySelector('#aesStatus').dataset.state));
      return page.locator('#aesOutput').textContent();
    };
    await page.locator('#aesKey').fill('secret');
    await page.locator('#aesInput').fill('页面 AES ✓');
    assert.match(await aesRun(), /^[A-Za-z0-9+/]{70,}={0,2}$/);
    assert.match(await page.locator('#aesStatus').textContent(), /AES-256-GCM/);
    await page.locator('button', { hasText: '结果→输入' }).click();
    assert.equal(await aesRun(), '页面 AES ✓');
    const aesKey = crypto.randomBytes(32), nonce = crypto.randomBytes(12), sealer = crypto.createCipheriv('aes-256-gcm', aesKey, nonce);
    sealer.setAAD(Buffer.from('order-7'));
    const sealedByNode = Buffer.concat([nonce, sealer.update('来自 Node'), sealer.final(), sealer.getAuthTag()]).toString('base64');
    await page.locator('#aesKeyType').selectOption('hex');
    await page.locator('#aesKey').fill(aesKey.toString('hex'));
    await page.locator('#aesAad').fill('order-7');
    await page.locator('#aesInput').fill(sealedByNode);
    assert.equal(await aesRun(), '来自 Node');
    await page.locator('#aesKeyType').selectOption('password');
    await page.locator('#aesKey').fill('legacy-pass');
    await page.locator('#aesAad').fill('');
    await page.locator('#aesInput').fill('ABEiM0RVZneImaq7zN3u/w==:fjaw2IX2v1So20/47JnT+Opy3qg3o+XE5YaUTQFeJlU=');
    assert.equal(await aesRun(), '旧版页面 legacy ✓');
    assert.equal(await page.locator('#aesBadge').isVisible(), true);
    await page.locator('#aesEncBtn').click();
    await page.locator('#aesMode').selectOption('CBC');
    await page.locator('#aesKeyType').selectOption('hex');
    const key192 = '8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b', iv = '000102030405060708090a0b0c0d0e0f';
    await page.locator('#aesKey').fill(key192);
    await page.locator('#aesIvType').selectOption('hex');
    await page.locator('#aesIv').fill(iv);
    await page.locator('#aesEncoding').selectOption('hex');
    await page.locator('#aesInput').fill('AES-192 回退');
    const cbc192 = crypto.createCipheriv('aes-192-cbc', Buffer.from(key192, 'hex'), Buffer.from(iv, 'hex'));
    assert.equal(await aesRun(), Buffer.concat([cbc192.update('AES-192 回退'), cbc192.final()]).toString('hex'));
    if (await page.evaluate(() => crypto.subtle.importKey('raw', new Uint8Array(24), 'AES-CBC', false, ['encrypt']).then(() => false, () => true))) {
      assert.match(await page.locator('#aesNote').textContent(), /192/);
    }
    assert.match(await page.locator('#aesSnippets').textContent(), new RegExp(`openssl enc -d -aes-192-cbc -K ${key192} -iv ${iv}`));
    await page.evaluate(() => setLang('en'));
    await route('aes', '#aesInput');
    assert.equal(await page.locator('#aesEncBtn').textContent(), 'Encrypt');
    await page.waitForFunction(() => document.querySelector('#aesSummary').textContent.includes('ciphertext'));
    assert.equal(await page.locator('#aesSummary').textContent(), 'AES-256-GCM · PBKDF2-SHA256 ×100000 → Base64 (salt(16B) ‖ IV(12B) ‖ ciphertext ‖ tag(16B))');
    await page.evaluate(() => setLang('zh'));
    for (const [id, selector] of [['hmac-gen', '#hmacMsg'], ['aes', '#aesInput']]) {
      await route(id, selector);
      for (const width of [375, 768]) {
        await page.setViewportSize({ width, height: 850 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${id} at ${width}px`);
      }
    }
    if (process.env.TEST_SCREENSHOT) await page.screenshot({ path: process.env.TEST_SCREENSHOT, fullPage: true, animations: 'disabled' });
    assert.deepEqual(errors, []);
    console.log('PASS: 10 categories, 9 workbenches, all legacy child routes/favorites, bilingual catalog, HMAC/hash, AES interop/legacy/AES-192, >30 script loads, SVG isolation, mobile widths');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
