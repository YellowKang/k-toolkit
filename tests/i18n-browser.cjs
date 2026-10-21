// English mode must not leak Chinese UI text from any tool: labels, placeholders, titles, samples, results,
// toasts and dialogs. Chinese data (lunar dates, financial numerals, language endonyms) is tagged lang="zh".
const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const express = require('express');

// Tools still waiting for their English UI; remove an id as soon as it is translated.
const PENDING = [
  'aes', 'color', 'favicon-gen', 'jwt', 'lunar-calendar', 'number-chinese', 'password-gen', 'typing-speed', 'unit-convert',
  'xml-format',
];
// Buttons that wipe samples or end a run go last, so every other button acts on the default data.
const LAST = 'clear|reset|delete|remove|stop|清空|重置|删除|停止';
// Han ideographs plus CJK and fullwidth punctuation; fullwidth Latin letters and digits (ASCII art) are not Chinese.
const CJK = '[\\u3000-\\u303f\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff\\uff00-\\uff0f\\uff1a-\\uff20\\uff3b-\\uff40\\uff5b-\\uffef]';

(async () => {
  const root = path.resolve(__dirname, '..');
  let browser, server, temp;
  try {
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-i18n-test-'));
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
    const page = await browser.newPage({ serviceWorkers: 'block' });
    page.setDefaultTimeout(8000);
    const errors = [], dialogs = [];
    let current = 'boot';
    page.on('pageerror', error => { errors.push(`${current}: ${error.message}`); console.error(`Browser error in ${current}:`, error.stack); });
    page.on('dialog', dialog => { dialogs.push(dialog.message()); dialog.dismiss().catch(() => {}); });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => route.abort());
    await page.addInitScript(cjk => {
      window.__cjkLeaks = () => {
        const CJK = new RegExp(cjk);
        const leaks = new Set();
        const note = (el, text) => {
          const tagged = el.closest('[lang]');
          if (text && CJK.test(text) && !(tagged && tagged !== document.documentElement && /^zh/i.test(tagged.lang))) leaks.add(text.trim().replace(/\s+/g, ' ').slice(0, 80));
        };
        for (const scope of [document.getElementById('toolBody'), document.getElementById('toast-container')]) {
          if (!scope) continue;
          const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
          for (let node; (node = walker.nextNode());) if (!node.parentElement.closest('style, script, template')) note(node.parentElement, node.nodeValue);
          for (const el of scope.querySelectorAll('*')) {
            for (const name of ['placeholder', 'title', 'aria-label', 'alt', 'label']) note(el, el.getAttribute(name));
            if (el.matches('textarea, input:not([type=hidden]):not([type=file])')) note(el, el.value);
          }
        }
        return [...leaks];
      };
    }, CJK);
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`);
    await page.waitForFunction(() => typeof TOOLS !== 'undefined');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
      window.open = () => null;
    });
    // Scripts load while the page is Chinese, so labels frozen at load time would surface after the switch.
    await page.evaluate(async () => { for (const tool of TOOLS.filter(tool => tool.id !== 'ai-chat')) await loadTool(tool.id, false); });
    await page.evaluate(() => setLang('en'));
    const only = process.env.TEST_TOOLS ? process.env.TEST_TOOLS.split(',') : null; // e.g. TEST_TOOLS=uuid,lorem while translating
    const ids = await page.evaluate(pending => TOOLS.map(tool => tool.id).filter(id => id !== 'ai-chat' && !pending.includes(id)), PENDING)
      .then(all => only ? all.filter(id => only.includes(id)) : all);
    const findings = {};
    for (const id of ids) {
      current = id; dialogs.length = 0;
      await page.evaluate(id => { document.getElementById('toast-container')?.replaceChildren(); navigateTo(id); }, id);
      await page.waitForFunction(id => currentPage === id && document.querySelector('#toolBody')?.children.length, id);
      await page.waitForTimeout(150);
      const render = await page.evaluate(() => window.__cjkLeaks());
      // Exercise the defaults: every button (twice, to reach panels revealed by the first pass) and every select option.
      await page.evaluate(async ({ id, last }) => {
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        const body = document.getElementById('toolBody');
        const clicked = new WeakSet();
        const isLast = button => new RegExp(last, 'i').test(`${button.textContent} ${button.title}`);
        for (let pass = 0; pass < 2; pass++) {
          const buttons = [...body.querySelectorAll('button, input[type=button], input[type=submit]')].filter(button => !clicked.has(button));
          buttons.sort((a, b) => isLast(a) - isLast(b));
          for (const button of buttons.slice(0, 40)) {
            if (currentPage !== id) return;
            if (!button.isConnected || button.disabled) continue;
            clicked.add(button);
            try { button.click(); } catch {}
            await sleep(30);
          }
        }
        for (const select of body.querySelectorAll('select')) {
          for (const option of [...select.options].slice(0, 12)) {
            if (currentPage !== id || !select.isConnected) break;
            select.value = option.value;
            for (const type of ['input', 'change']) select.dispatchEvent(new Event(type, { bubbles: true }));
            await sleep(15);
          }
        }
        await sleep(300);
      }, { id, last: LAST });
      const after = await page.evaluate(id => currentPage === id ? window.__cjkLeaks() : [], id);
      const leaks = { render, exercise: after.filter(text => !render.includes(text)), dialogs: dialogs.filter(text => new RegExp(CJK).test(text)) };
      if (Object.values(leaks).some(list => list.length)) findings[id] = Object.fromEntries(Object.entries(leaks).filter(([, list]) => list.length));
    }
    // Switching back must restore Chinese, proving tools read the language on every render.
    await page.evaluate(() => { setLang('zh'); navigateTo('uuid'); });
    await page.waitForFunction(() => currentPage === 'uuid' && /[\u4e00-\u9fff]/.test(document.querySelector('#toolBody')?.textContent || ''));
    assert.deepEqual(findings, {}, `Chinese UI text in English mode:\n${JSON.stringify(findings, null, 2)}`);
    assert.deepEqual(errors, []);
    console.log(`PASS: ${ids.length} tools render and run in English without Chinese UI text (pending: ${PENDING.join(', ') || 'none'})`);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
