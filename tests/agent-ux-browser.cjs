const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const express = require('express');
const { chromium, firefox } = require('playwright');
(async () => {
  let browser, server, temp;
  try {
    const root = path.join(__dirname, '..'); let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-agent-ux-'));
      for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe' }); source = path.join(temp, 'dist');
    }
    const app = express(); app.use('/k-toolkit', express.static(source));
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    browser = await (process.env.TEST_BROWSER === 'firefox' ? firefox : chromium).launch({ headless: true });
    const page = await browser.newPage({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000); const errors = []; page.on('pageerror', e => errors.push(e.message));
    let status = 200, requests = [], holdTest = false, releaseTest, holdModels = false, releaseModels;
    await page.route(/^https:\/\//, async route => {
      if (!route.request().url().startsWith('https://fixture.invalid/')) return route.abort();
      if (route.request().method() === 'GET') {
        if (holdModels) await new Promise(resolve => { releaseModels = resolve; });
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'test-openai' }, { id: 'another-model' }] }) }).catch(() => {});
      }
      requests.push({ url: route.request().url(), body: route.request().postDataJSON() });
      if (holdTest) await new Promise(resolve => { releaseTest = resolve; });
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(status === 200 ? { choices: [{ message: { content: 'OK' }, finish_reason: 'stop' }] } : { error: 'sensitive-upstream-content' }) }).catch(() => {});
    });
    const base = `http://127.0.0.1:${server.address().port}/k-toolkit/`;
    await page.goto(base + 'dashboard.html#ai-chat'); await page.locator('#_chatInput').waitFor();
    await page.evaluate(async () => { await Promise.all([_agEnsureLoaded(), _agEnsureLoaded()]); });
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copied = value; } } }));
    await page.locator('._chat-settings-btn').click();
    await page.locator('[data-adapter="openai-chat"]').click();
    await page.locator('#cfgApiKey').fill('fixture-key'); await page.locator('#cfgBaseUrl').fill('https://fixture.invalid/v1'); await page.locator('#cfgModel').fill('test-openai');
    await page.locator('[data-adapter="claude"]').click(); assert.equal(await page.locator('#cfgBaseUrl').inputValue(), '');
    await page.locator('[data-adapter="openai-chat"]').click(); assert.equal(await page.locator('#cfgModel').inputValue(), 'test-openai');
    await page.locator('#cfgTestBtn').click(); await page.locator('#cfgStatus').filter({ hasText: '连接成功' }).waitFor();
    assert.equal(requests[0].url, 'https://fixture.invalid/v1/chat/completions');
    assert.equal(requests[0].body.model, 'test-openai'); assert.equal(requests[0].body.messages.length, 1);
    status = 401; await page.locator('#cfgTestBtn').click(); await page.locator('#cfgStatus').filter({ hasText: '认证失败' }).waitFor();
    assert.doesNotMatch(await page.locator('#cfgStatus').textContent(), /sensitive/); status = 200;
    holdTest = true; await page.locator('#cfgTestBtn').click();
    await page.waitForFunction(() => document.querySelector('#cfgTestBtn').textContent.includes('取消'));
    await page.locator('#cfgTestBtn').click(); await page.locator('#cfgStatus').filter({ hasText: '测试已取消' }).waitFor();
    if (releaseTest) releaseTest(); holdTest = false;
    await page.locator('#cfgFetchModels').click(); await page.locator('#cfgStatus').filter({ hasText: '已获取 2' }).waitFor();
    await page.locator('#cfgRemoteModel').selectOption('another-model'); assert.equal(await page.locator('#cfgModel').inputValue(), 'another-model');
    await page.locator('#cfgRemoteModel').selectOption('test-openai');
    holdModels = true; await page.locator('#cfgFetchModels').click();
    await page.waitForFunction(() => document.querySelector('#cfgFetchModels').textContent.includes('取消'));
    await page.locator('[data-adapter="claude"]').click();
    if (releaseModels) releaseModels(); holdModels = false;
    await page.waitForTimeout(100); assert.equal(await page.locator('#cfgRemoteModel').isVisible(), false); assert.equal(await page.locator('#cfgStatus').textContent(), '');
    await page.locator('[data-adapter="openai-chat"]').click();
    await page.locator('#cfgSaveBtn').click(); await page.locator('#agConfigModal').waitFor({ state: 'detached' });
    assert.equal(await page.locator('#_chatModelBadge').textContent(), 'test-openai');
    await page.evaluate(() => { const AG = AgentConfig.AG; AG.save({ ...AG.load(), ...AG.profile('custom'), baseUrl: 'https://fixture.invalid/v1', model: 'test-custom', apiKey: 'fixture-key' }); });
    assert.equal(await page.locator('#_chatModelBadge').textContent(), 'test-custom');
    await page.locator('._chat-settings-btn').click(); await page.locator('[data-adapter="openai-chat"]').click();
    assert.equal(await page.locator('#cfgBaseUrl').inputValue(), 'https://fixture.invalid/v1'); assert.equal(await page.locator('#cfgModel').inputValue(), 'test-openai');
    await page.keyboard.press('Escape'); await page.locator('#agConfigModal').waitFor({ state: 'detached' });

    // Configuration values must never become attributes or HTML.
    await page.evaluate(() => { const AG = AgentConfig.AG; AG.save({ ...AG.load(), model: '"><img data-agent-probe src=x onerror=alert(1)>', apiKey: '"><img data-agent-probe src=x>' }); });
    await page.locator('._chat-settings-btn').click(); assert.equal(await page.locator('[data-agent-probe]').count(), 0);
    assert.match(await page.locator('#cfgModel').inputValue(), /data-agent-probe/);
    await page.locator('#cfgModel').fill('test-custom'); await page.locator('#cfgApiKey').fill('fixture-key');
    if (process.env.QA_SHOTS) await page.screenshot({ animations: 'disabled', path: path.join(os.tmpdir(), 'k-toolkit-agent-settings.png') });
    await page.locator('#cfgSaveBtn').click();

    await page.evaluate(() => {
      window.__mode = 'pause'; window.__late = []; window.__calls = [];
      AgentAdapters.getAdapter('custom').chatStream = async function* (params) {
        window.__calls.push(params.messages); const mode = window.__mode;
        if (mode === 'error') throw AgentTransport.httpError(401);
        if (mode === 'pause') { yield { type: 'delta', text: '部分回复 **保留**' }; await new Promise(resolve => window.__late.push(resolve)); yield { type: 'delta', text: '迟到文本' }; }
        else if (mode === 'long') { for (let i = 0; i < 35; i++) { yield { type: 'delta', text: '段落 ' + i + '\n\n' }; await new Promise(resolve => setTimeout(resolve, 30)); } }
        else yield { type: 'delta', text: mode === 'xss' ? '<img data-agent-probe src=x>\n[x](javascript:alert(1))' : '最终回复 ```text\nhello\n```' };
      };
    });
    await page.locator('#_chatInput').fill('第一个问题'); await page.locator('#_chatSendBtn').click();
    await page.getByText('部分回复', { exact: false }).first().waitFor();
    await page.locator('#_chatInput').fill('输入中的下一条'); await page.locator('#_chatStopBtn').click();
    assert.equal(await page.locator('#_chatInput').inputValue(), '输入中的下一条');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dtb_chat_history')).at(-1).content), '部分回复 **保留**');
    await page.evaluate(() => { window.__mode = 'normal'; }); await page.locator('#_chatSendBtn').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('dtb_chat_history')).at(-1).content.startsWith('最终回复'));
    await page.evaluate(() => { window.__late.forEach(resolve => resolve()); }); await page.waitForTimeout(150);
    assert.doesNotMatch(await page.locator('#_chatMsgList').textContent(), /迟到/);
    assert.equal(await page.locator('._chat-cursor').count(), 0);
    assert.equal(await page.locator('[data-action-key="retry"]:visible').count(), 1);
    const before = await page.evaluate(() => localStorage.getItem('dtb_chat_history'));
    await page.evaluate(() => { window.__mode = 'error'; }); await page.locator('[data-action-key="retry"]:visible').click();
    await page.locator('._chat-msg-error').filter({ hasText: '认证失败' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('dtb_chat_history')), before, 'failed regeneration preserves the previous reply');
    await page.evaluate(() => { window.__mode = 'normal'; }); await page.locator('._chat-msg-error button').click();
    await page.waitForFunction(() => !document.querySelector('._chat-msg-error'));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dtb_chat_history')).filter(m => m.role === 'user').length), 2);

    await page.locator('#_chatInput').fill('切页草稿'); await page.evaluate(() => navigateTo('json')); await page.locator('#jsonInput').waitFor();
    await page.evaluate(() => navigateTo('ai-chat')); await page.locator('#_chatInput').waitFor(); assert.equal(await page.locator('#_chatInput').inputValue(), '切页草稿');
    await page.evaluate(() => _chatClear()); await page.locator('#_chatUndoBar button').click();
    assert.equal(await page.locator('#_chatInput').inputValue(), '切页草稿');
    assert.equal(await page.locator('._chat-row-user').count(), 2);

    // User scroll wins while streaming; latest-message control restores follow mode.
    await page.evaluate(() => { window.__mode = 'long'; }); await page.locator('#_chatInput').fill('长回复'); await page.locator('#_chatSendBtn').click();
    await page.waitForFunction(() => document.querySelector('#_chatMsgList').scrollHeight > document.querySelector('#_chatMsgList').clientHeight + 250);
    await page.locator('#_chatMsgList').evaluate(el => { el.scrollTop = 0; el.dispatchEvent(new Event('scroll')); });
    await page.locator('#_chatJumpBottom').waitFor(); await page.waitForTimeout(300);
    assert.ok(await page.locator('#_chatMsgList').evaluate(el => el.scrollTop < 20));
    await page.waitForFunction(() => !document.querySelector('#_chatStopBtn') || document.querySelector('#_chatStopBtn').style.display === 'none');
    await page.locator('#_chatJumpBottom').click();
    await page.waitForFunction(() => { const el = document.querySelector('#_chatMsgList'); return el.scrollHeight - el.scrollTop - el.clientHeight < 5; });
    if (process.env.QA_SHOTS) await page.screenshot({ animations: 'disabled', path: path.join(os.tmpdir(), 'k-toolkit-ai-chat.png') });
    await page.evaluate(() => { window.__mode = 'xss'; }); await page.locator('#_chatInput').fill('unsafe fixture'); await page.locator('#_chatSendBtn').click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('dtb_chat_history')).at(-1).content.includes('data-agent-probe'));
    assert.equal(await page.locator('[data-agent-probe],a[href^="javascript:"]').count(), 0);

    // Quick assistant retains its real history and composer on reopen.
    await page.locator('#_chatHome').click();
    await page.evaluate(() => {
      window.__miniRequests = [];
      AgentAdapters.getAdapter('custom').chat = async params => { window.__miniRequests.push(params.messages); return { stop_reason: 'end', message: { role: 'assistant', content: 'mini reply' } }; };
      return _agOpenMini();
    });
    await page.locator('#agMiniInput').fill('mini first'); await page.locator('#agMiniInput').press('Enter'); await page.locator('#agMiniMessages').getByText('mini reply', { exact: true }).waitFor();
    await page.locator('#agMiniInput').fill('mini second'); await page.locator('#agMiniInput').press('Escape');
    await page.evaluate(() => _agOpenMini()); assert.equal(await page.locator('#agMiniInput').inputValue(), 'mini second');
    await page.locator('#agMiniInput').press('Enter'); await page.waitForFunction(() => window.__miniRequests.length === 2);
    assert.equal(await page.evaluate(() => window.__miniRequests[1].filter(m => m.role === 'user').length), 2);
    await page.locator('#agMiniInput').press('Escape');

    // A real panel retry resumes the failed request; shared configuration keeps its history.
    await page.evaluate(() => {
      window.__panelCalls = 0;
      AgentAdapters.getAdapter('custom').chat = async () => { if (++window.__panelCalls === 1) throw AgentTransport.httpError(401); return { stop_reason: 'end', message: { role: 'assistant', content: 'panel recovered' } }; };
    });
    await page.locator('#agentFab').click(); await page.locator('#agInput').fill('panel question'); await page.locator('#agSendBtn').click();
    await page.locator('#agMessages .ag-bubble.error button').click(); await page.locator('#agMessages').getByText('panel recovered', { exact: false }).waitFor();
    assert.equal(await page.evaluate(() => _agCurrentSession().messages.filter(m => m.role === 'user').length), 1);
    await page.locator('#agConfigBtn').click(); await page.locator('#cfgModel').fill('updated-model'); await page.locator('#cfgSaveBtn').click();
    assert.equal(await page.evaluate(() => _agCurrentSession().messages.length), 2);
    await page.locator('#agInput').fill('/model slash-model'); await page.locator('#agSendBtn').click();
    assert.equal(await page.evaluate(() => AgentConfig.AG.load().model), 'slash-model');
    await page.locator('#agInput').fill('/retry'); await page.locator('#agSendBtn').click();
    await page.locator('#agMessages').getByText('当前没有可重试的失败请求。', { exact: false }).waitFor();

    // Output-limit errors expose a retry that picks up changed settings without duplicating the turn.
    await page.evaluate(() => {
      window.__limitedRequests=[];
      AgentAdapters.getAdapter('custom').chat=async params=>{window.__limitedRequests.push(params);return window.__limitedRequests.length===1?{stop_reason:'max_tokens',message:{role:'assistant',content:'partial'}}:{stop_reason:'end',message:{role:'assistant',content:'output limit recovered'}};};
    });
    await page.locator('#agInput').fill('output limit question');await page.locator('#agSendBtn').click();
    await page.locator('#agMessages .ag-bubble.error').filter({hasText:'模型达到输出上限'}).waitFor();
    await page.locator('#agConfigBtn').click();await page.locator('.ag-config-advanced summary').click();await page.locator('#cfgMaxTokens').fill('4096');await page.locator('#cfgSaveBtn').click();
    await page.locator('#agMessages .ag-bubble.error').filter({hasText:'模型达到输出上限'}).getByRole('button').click();
    await page.locator('#agMessages').getByText('output limit recovered',{exact:false}).waitFor();
    assert.equal(await page.evaluate(()=>window.__limitedRequests.at(-1).max_tokens),4096);
    assert.equal(await page.evaluate(()=>_agCurrentSession().messages.filter(m=>m.role==='user').length),2);
    await page.locator('#agCloseBtn').click();

    // Hash verification follows the latest text and file output; clearing cancels pending results.
    await page.evaluate(() => navigateTo('hash')); await page.locator('#hashInput').waitFor();
    await page.locator('#hashInput').fill('abc'); await page.waitForFunction(() => document.querySelectorAll('#hashResults [data-hash]').length === 4);
    const digest = await page.locator('#hashResults [data-algo="SHA-256"]').getAttribute('data-hash');
    await page.locator('#hashVerifyInput').fill(digest); await page.locator('#hashVerifyResult').filter({ hasText: '匹配' }).waitFor();
    await page.locator('#hashInput').fill('different'); assert.doesNotMatch(await page.locator('#hashVerifyResult').textContent(), /✓/);
    await page.waitForFunction(() => document.querySelector('#hashVerifyResult').textContent.includes('不匹配'));
    await page.locator('#hashVerifyInput').fill('a'); assert.match(await page.locator('#hashVerifyResult').textContent(), /十六进制/);
    await page.locator('#hashInput').fill('race'); await page.evaluate(() => clearHash()); await page.waitForTimeout(400); assert.equal(await page.locator('#hashResults [data-hash]').count(), 0);
    await page.evaluate(() => calcHash()); assert.equal(await page.locator('#hashResults [data-algo="SHA-256"]').getAttribute('data-hash'), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    await page.locator('#hashFileInput').setInputFiles({ name: 'hello.txt', mimeType: 'text/plain', buffer: Buffer.from('abc') });
    await page.locator('#hashFileStatus').filter({ hasText: '已完成' }).waitFor(); await page.locator('#hashVerifyInput').fill(digest);
    assert.match(await page.locator('#hashVerifyResult').textContent(), /hello.txt/);
    let filePickers = 0; page.on('filechooser', () => filePickers++);
    await page.locator('#fileHashResult .copy-inline').first().click(); assert.equal(filePickers, 0);
    await page.evaluate(() => { window.__slowHash=hashFiles([new File([new Uint8Array(16*1024*1024)],'old-file')]);document.getElementById('hashFileCancel').click(); });
    await page.locator('#hashFileInput').setInputFiles({ name: 'new-file.txt', mimeType: 'text/plain', buffer: Buffer.from('new') });
    await page.locator('#hashFileStatus').filter({ hasText: '已完成' }).waitFor();
    await page.evaluate(async () => { await window.__slowHash; });
    assert.doesNotMatch(await page.locator('#fileHashResult').textContent(), /old-file/); assert.match(await page.locator('#fileHashResult').textContent(), /new-file/);
    await page.locator('#hmacKeyInput').fill('key'); await page.locator('#hmacMsgInput').fill(''); await page.evaluate(() => calcHmac());
    assert.equal(await page.locator('#hmacResultHex').textContent(), require('node:crypto').createHmac('sha256', 'key').update('').digest('hex'));

    // Shared modal stays within the viewport at mobile sizes and supports keyboard close.
    await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => navigateTo('ai-chat')); await page.locator('#_chatInput').waitFor();
    await page.locator('._chat-settings-btn').click();
    assert.ok(await page.locator('._chat-toolbar').evaluate(el => el.scrollWidth <= el.clientWidth));
    assert.ok((await page.locator('#_chatHome').boundingBox()).height <= 36, 'mobile labels remain on one line');
    const box = await page.locator('.ag-config-box').boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= 391);
    if (process.env.QA_SHOTS) await page.screenshot({ animations: 'disabled', path: path.join(os.tmpdir(), 'k-toolkit-agent-mobile.png') });
    await page.keyboard.press('Escape');
    await page.evaluate(() => setLang('en'));
    assert.equal(await page.locator('#_chatHome').textContent(), '← Toolbox');
    await page.locator('._chat-settings-btn').click(); assert.equal(await page.locator('#cfgTitle').textContent(), 'AI connection settings');
    assert.doesNotMatch(await page.locator('.ag-config-box').innerText(), /[\u4e00-\u9fff]/);
    await page.keyboard.press('Escape');
    assert.deepEqual(errors, []);
    console.log('Agent settings, chat cancellation/retry/drafts/scroll, hash verification, mobile and XSS regressions passed.');
  } finally { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); if (temp) fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
