const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const express = require('express');
const { launchBrowser } = require('./browser-launch.cjs');

(async () => {
  let server, browser, temp;
  try {
    const root = path.resolve(__dirname, '..');
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-reliability-'));
      for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
      fs.symlinkSync(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe', env: { ...process.env, NODE_PATH: path.resolve(__dirname, '../node_modules') } });
      source = path.join(temp, 'dist');
    }
    const app = express(); app.use(express.static(source));
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    browser = await launchBrowser();
    const context = await browser.newContext({ serviceWorkers: 'block' });
    await context.route(/^https:\/\//, route => {
      if (route.request().url().startsWith('https://review.invalid/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      return route.fulfill({ status: 503, contentType: 'text/plain', body: 'Service unavailable' });
    });
    const url = `http://127.0.0.1:${server.address().port}/dashboard.html`;
    const open = async id => { const p = await context.newPage(); p.setDefaultTimeout(12000); await p.goto(url + '#' + id); return p; };
    const go = async (page, id, selector) => { await page.evaluate(id => navigateTo(id, false), id); await page.locator(selector).waitFor(); };

    // Invalid data must be rejected before it can replace working site data.
    let page = await open('data-backup'); await page.locator('#dbImportText').waitFor();
    const invalid = await page.evaluate(async () => {
      const backup = await ToolCompute.load('backup');
      return backup.parse(JSON.stringify({ format: 'k-toolkit-backup', version: 1, data: { dtb_favorites: '{}', dtb_todo: '{}', dtb_otp_vault: 'null' } }));
    });
    assert.equal(Object.keys(invalid.data).length, 0);
    assert.equal(invalid.rejected.length, 3);

    // A failed note write must never claim success, and its text stays available.
    await go(page, 'note', '#noteArea');
    await page.evaluate(() => {
      localStorage.setItem('dtb_note', 'saved before quota failure');
      window.__originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { if (key === 'dtb_note') throw new DOMException('Full', 'QuotaExceededError'); return __originalSetItem.call(this, key, value); };
    });
    await page.locator('#noteArea').fill('unsaved note must remain available');
    await page.waitForFunction(() => /失败|failed/i.test(document.querySelector('#noteSaved').textContent));
    assert.equal(await page.evaluate(() => localStorage.getItem('dtb_note')), 'saved before quota failure');
    await page.evaluate(() => { Storage.prototype.setItem = __originalSetItem; });
    await page.close();

    // Two unlocked boards must not silently replace one another's accounts.
    const a = await open('totp');
    await a.locator('#tfNewPw').fill('fixture-only-master'); await a.locator('#tfNewPw2').fill('fixture-only-master');
    await a.locator('#tfCreateBtn').click(); await a.locator('#tfSearch').waitFor();
    const b = await open('totp'); await b.locator('#tfUnlockPw').fill('fixture-only-master'); await b.locator('#tfUnlockBtn').click(); await b.locator('#tfSearch').waitFor();
    const add = (p, account) => p.evaluate(async account => {
      try { const otp = await ToolCompute.load('otp'); await _tfAddEntries([otp.normalize({ issuer: 'Fixture', account, secret: 'JBSWY3DPEHPK3PXP' })]); return 'saved'; }
      catch (e) { return e.message; }
    }, account);
    assert.equal(await add(a, 'account-a'), 'saved'); assert.notEqual(await add(b, 'account-b'), 'saved');
    const accounts = await a.evaluate(async () => { const box = await ToolCompute.load('secure-box'); const value = await box.unlock(JSON.parse(localStorage.getItem('dtb_otp_vault')), 'fixture-only-master'); return JSON.parse(value.text).entries.map(e => e.account); });
    assert.deepEqual(accounts, ['account-a']);
    const concurrent = await a.evaluate(async () => {
      const otp = await ToolCompute.load('otp');
      await Promise.all(['queued-one', 'queued-two'].map(account => _tfAddEntries([otp.normalize({ account, secret: 'JBSWY3DPEHPK3PXP' })])));
      const count = _tf.entries.length, before = localStorage.getItem('dtb_otp_vault'), write = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) { if (key === 'dtb_otp_vault') throw new DOMException('Full', 'QuotaExceededError'); return write.call(this, key, value); };
      try { await _tfAddEntries([otp.normalize({ account: 'must-not-appear', secret: 'JBSWY3DPEHPK3PXP' })]); } catch {}
      finally { Storage.prototype.setItem = write; }
      return { count, after: _tf.entries.length, same: before === localStorage.getItem('dtb_otp_vault') };
    });
    assert.deepEqual(concurrent, { count: 3, after: 3, same: true }); await a.close(); await b.close();

    // Same-conversation edits from another tab must also be detected.
    const c = await open('home'), d = await open('home');
    for (const p of [c, d]) await p.evaluate(async () => { await loadAgentScripts(); window.__chatId = ChatConversations.ensure().activeId; });
    await c.evaluate(() => ChatConversations.save({ messages: [{ role: 'user', content: 'new history' }], draft: '', images: [] }, __chatId));
    const conflict = await d.evaluate(async () => { try { await ChatConversations.save({ messages: [], draft: 'old page', images: [] }, __chatId); return false; } catch { return true; } });
    assert.equal(conflict, true); assert.match(await c.evaluate(() => localStorage.getItem('dtb_chat_history')), /new history/); await c.close(); await d.close();

    // Sensitive pages cannot be included automatically in a model prompt.
    page = await open('env-parse'); await page.locator('#epInput').fill('API_KEY=SYNTHETIC_PRIVATE_VALUE');
    const contextInput = await page.evaluate(async () => { await loadAgentScripts(); const s = { on() {}, emit() {} }; initAgentRouter(s); s.stopRouterObserver(); return s.pageContext; });
    assert.doesNotMatch(JSON.stringify(contextInput), /SYNTHETIC_PRIVATE_VALUE/);
    await go(page, 'http-tester', '#htUrl');
    await page.locator('#htUrl').fill('https://review.invalid/api?token=SYNTHETIC_QUERY');
    await page.locator('#htHeaders').fill('Authorization: Bearer SYNTHETIC_AUTH');
    await page.locator('#htSendBtn').click(); await page.waitForFunction(() => document.querySelector('#htResBody').textContent.includes('ok'));
    const stored = await page.evaluate(async () => { const b = await ToolCompute.load('backup'); return { history: localStorage.getItem('dtb_http_history'), backup: b.collect(localStorage, b.DEFAULT_GROUPS).backup }; });
    assert.doesNotMatch(JSON.stringify(stored), /SYNTHETIC_AUTH|SYNTHETIC_QUERY/);
    await go(page, 'password-gen', '#pwdPwnedResult');
    assert.equal(await page.evaluate(() => _pgCheckPwned('fixture-password')), -1);
    const malformed = await page.evaluate(async () => { window.fetch = async () => new Response('temporary upstream error'); return _pgCheckPwned('fixture-password'); });
    assert.equal(malformed, -1);
    await page.close();

    // A failed old route cannot replace the active JSON editor.
    page = await open('home'); let held, requested;
    const waiting = new Promise(resolve => { requested = resolve; });
    await page.route('**/tools/ai-chat.js*', route => { held = route; requested(); });
    await page.evaluate(() => { window.__navigation = navigateTo('ai-chat', false); }); await waiting;
    await go(page, 'json', '#jsonInput'); await page.locator('#jsonInput').fill('{"keep":"draft"}');
    await held.abort(); await page.evaluate(() => __navigation);
    assert.equal(await page.locator('#jsonInput').inputValue(), '{"keep":"draft"}'); await page.close();

    page = await open('aes'); await page.locator('#aesInput').fill('old plaintext'); await page.locator('#aesKey').fill('fixture-only-passphrase');
    const stale = await page.evaluate(async () => { const job = doAES(); const input = document.querySelector('#aesInput'); input.value = 'new plaintext'; input.dispatchEvent(new Event('input', { bubbles: true })); await job; return document.querySelector('#aesStatus').dataset.state; });
    assert.notEqual(stale, 'ok');
    await go(page, 'dns-lookup', '#dnsInput');
    const dns = await page.evaluate(async () => {
      const pending = {}; window.fetch = url => new Promise(resolve => { pending[new URL(url).searchParams.get('name')] = body => resolve(new Response(JSON.stringify(body))); });
      document.querySelector('#dnsInput').value = 'first.example'; const first = doDnsLookup();
      document.querySelector('#dnsInput').value = 'second.example'; const second = doDnsLookup();
      pending['second.example']({ Status: 0, Answer: [{ TTL: 60, data: '192.0.2.2' }] }); await second;
      pending['first.example']({ Status: 0, Answer: [{ TTL: 60, data: '192.0.2.1' }] }); await first;
      return document.querySelector('#dnsTitle').textContent;
    });
    assert.match(dns, /second.example/);
    for (const body of [{ Status: 2 }, {}, { Status: 0, Answer: {} }]) {
      const message = await page.evaluate(async body => { window.fetch = async () => new Response(JSON.stringify(body)); await doDnsLookup(); return document.querySelector('#dnsData').textContent; }, body);
      assert.match(message, /失败|failed/i);
    }
    await go(page, 'speed-test', '#stStartBtn');
    const speed = await page.evaluate(async () => { _stRunning = true; window.fetch = async () => new Response('x', { status: 503 }); const values = [await _stMeasureDownload(), await _stMeasureUpload()]; _stRunning = false; return values; });
    assert.deepEqual(speed, [-1, -1]);
    const measured = await page.evaluate(async () => { _stRunning = true; window.fetch = async () => new Response('x'); const mbps = await _stMeasureDownload(); _stRunning = false; return mbps; });
    assert.ok(measured > 0 && measured <= 0.008, 'use actual one-byte responses, never the requested megabyte sizes');
    const cancelled = await page.evaluate(async () => {
      _stRunning = true; let release;
      window.fetch = () => new Promise(resolve => { release = resolve; });
      const old = _stMeasureDownload(); stStop();
      _stRunning = true; _stSetGauge(0.42, '42', 'Mbps', 'New run');
      release(new Response('old')); const result = await old; _stRunning = false;
      return { result, gauge: document.querySelector('#stVal').textContent };
    });
    assert.deepEqual(cancelled, { result: -1, gauge: '42' });
    await go(page, 'text-template', '#ttTpl'); await page.locator('#ttTpl').fill('{{a}} | {{b}}');
    await page.locator('#ttBatchData').fill('[{"a":"{{b}}","b":"VALUE"}]'); await page.evaluate(() => _ttBatch());
    assert.equal(await page.locator('#ttOutput').innerText(), '{{b}} | VALUE');
    await page.close();

    // The production bundle is lazy and shared by repeated opens; search exposes keyboard focus to AT.
    page = await open('home'); await page.evaluate(() => setLang('en'));
    await page.locator('#searchInput').focus();
    await page.locator('#searchDropdown').waitFor();
    assert.doesNotMatch(await page.locator('#searchDropdown').innerText(), /[\u4e00-\u9fff]/);
    await page.locator('#searchInput').fill('json');
    await page.waitForFunction(() => document.querySelector('#searchStatus').textContent.includes('result'));
    await page.locator('#searchInput').press('ArrowDown');
    const active = await page.locator('#searchInput').getAttribute('aria-activedescendant');
    assert.equal(await page.locator('#' + active).getAttribute('aria-selected'), 'true');
    await page.locator('#searchInput').press('Escape');
    assert.equal(await page.locator('#searchInput').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('#searchInput').getAttribute('aria-activedescendant'), null);
    const agentRequests = []; page.on('request', r => { if (r.resourceType() === 'script' && r.url().includes('/agent/')) agentRequests.push(r.url()); });
    await page.evaluate(async () => { await _agEnsureLoaded(); await _agEnsureLoaded(); });
    if (process.env.TEST_BUILD === '1') assert.equal(agentRequests.length, 1);
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (width === 375) assert.ok((await page.locator('.home-hero').boundingBox()).height < 205);
    }
    if (process.env.VISUAL_CHECK) { await page.setViewportSize({ width: 375, height: 844 }); await page.screenshot({ path: '/tmp/k-toolkit-home-mobile.png' }); }
    await page.close();
    page = await open('ai-chat'); await page.locator('#_chatInput').fill('keep draft while saving');
    const oldId = await page.evaluate(() => ChatConversations.ensure().activeId);
    await page.evaluate(() => { window.__heldChatLock = navigator.locks.request('k-toolkit:chat-conversations', () => new Promise(resolve => { window.__releaseChatLock = resolve; })); });
    await page.waitForFunction(() => typeof __releaseChatLock === 'function');
    await page.locator('#_chatNewBtn').click();
    await page.waitForFunction(() => document.querySelector('#_chatInput').readOnly);
    assert.equal(await page.locator('#_chatInput').inputValue(), 'keep draft while saving');
    await page.evaluate(() => __releaseChatLock());
    await page.waitForFunction(() => document.querySelector('#_chatInput').value === '' && !document.querySelector('#_chatInput').readOnly);
    assert.equal(await page.evaluate(id => ChatConversations.record(id).draft, oldId), 'keep draft while saving');
    await page.close();
    console.log('PASS: storage conflicts, privacy, quota errors, navigation and computation races, network errors and literal templates');
  } finally {
    if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
    if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
