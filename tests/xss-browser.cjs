// Untrusted text (user input, stored history, network responses, markdown) must never become live markup.
const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const express = require('express');

const PAYLOAD = `x"'><img src=x data-xss onerror="window.__xss=(window.__xss||[]).concat(location.hash)"><svg data-xss onload="window.__xss=(window.__xss||[]).concat(location.hash)">`;

(async () => {
  const root = path.resolve(__dirname, '..');
  let browser, server, temp;
  try {
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-xss-test-'));
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
    const page = await browser.newPage({ serviceWorkers: 'block', acceptDownloads: true });
    page.setDefaultTimeout(8000);
    page.on('dialog', dialog => dialog.dismiss().catch(() => {}));
    // Network tools receive hostile answers; everything else external is blocked.
    await page.route(/cloudflare-dns\.com/, route => route.fulfill({ contentType: 'application/dns-json', body: JSON.stringify({ Status: 0, Answer: [{ TTL: 60, data: PAYLOAD }] }) }));
    await page.route(/ipapi\.co/, route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ip: PAYLOAD, city: PAYLOAD, org: PAYLOAD }) }));
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)(?!.*(cloudflare-dns\.com|ipapi\.co))/, route => route.abort());
    await page.addInitScript(payload => {
      // Stored history/saves are untrusted too.
      localStorage.setItem('dtb_countdowns', JSON.stringify([{ name: payload, target: '2030-01-01T00:00' }]));
      localStorage.setItem('dtb_search_history', JSON.stringify([payload]));
    }, PAYLOAD);
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`);
    await page.waitForFunction(() => typeof TOOLS !== 'undefined');
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } }); window.open = () => null; });
    const ids = await page.evaluate(() => TOOLS.map(tool => tool.id).filter(id => !['ai-chat', 'svg-preview'].includes(id)));
    const findings = {};
    for (const id of ids) {
      await page.evaluate(id => navigateTo(id), id);
      await page.waitForFunction(() => document.querySelector('#toolBody')?.children.length);
      await page.waitForTimeout(150);
      const result = await page.evaluate(async payload => {
        const body = document.querySelector('#toolBody');
        const fill = () => body.querySelectorAll('textarea, input:not([type]), input[type=text], input[type=search], input[type=url]').forEach(el => {
          if (el.readOnly || el.value === payload) return;
          el.value = payload;
          for (const type of ['input', 'change']) el.dispatchEvent(new Event(type, { bubbles: true }));
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        });
        fill();
        await new Promise(r => setTimeout(r, 250));
        const buttons = [...body.querySelectorAll('button')].filter(b => !/download|下载|清空|clear|reset|重置|随机|random|停止|stop/i.test(b.textContent));
        for (const button of buttons.slice(0, 25)) {
          fill();
          try { button.click(); } catch {}
          await new Promise(r => setTimeout(r, 100));
        }
        await new Promise(r => setTimeout(r, 400));
        return { live: [...document.querySelectorAll('[data-xss]')].map(e => `${e.tagName} in #${e.closest('[id]')?.id || '?'}`), fired: window.__xss || [] };
      }, PAYLOAD);
      if (result.live.length || result.fired.length) findings[id] = result;
      await page.evaluate(() => { document.querySelectorAll('[data-xss]').forEach(e => e.remove()); window.__xss = undefined; });
    }
    // Markdown keeps safe raw HTML but strips active content.
    await page.evaluate(() => navigateTo('markdown'));
    await page.locator('#mdInput').waitFor();
    await page.evaluate(payload => {
      const input = document.getElementById('mdInput');
      input.value = `# Title\n\n<details><summary>More</summary><kbd>Ctrl</kbd></details>\n\n${payload}\n\n[x](javascript:alert(1)) <a href="java&#9;script:alert(1)">t</a> <iframe src="https://example.com"></iframe>`;
      mdUpdate();
    }, PAYLOAD);
    await page.waitForTimeout(300);
    const md = await page.evaluate(() => ({ details: !!document.querySelector('#mdPreview details summary'), kbd: !!document.querySelector('#mdPreview kbd'),
      live: document.querySelectorAll('#mdPreview [data-xss], #mdPreview iframe, #mdPreview [onerror]').length,
      hrefs: [...document.querySelectorAll('#mdPreview a')].map(a => a.getAttribute('href')), fired: window.__xss || [] }));
    assert.deepEqual(findings, {});
    assert.deepEqual([md.details, md.kbd, md.live, md.fired.length], [true, true, 0, 0]);
    assert.ok(md.hrefs.every(href => href === null || /^https?:/.test(href)), JSON.stringify(md.hrefs));
    console.log(`PASS: ${ids.length} tools fuzzed with hostile input, stored data, DNS/IP API answers; markdown sanitizer keeps safe HTML`);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
