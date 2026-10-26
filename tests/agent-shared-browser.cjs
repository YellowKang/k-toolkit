const { chromium, firefox } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const express = require('express');
(async () => {
  let server, browser, temp;
  try {
    const root = path.resolve(__dirname, '..'); let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'toolkit-shared-'));
      for (const dir of ['public', 'scripts']) fs.cpSync(path.join(root, dir), path.join(temp, dir), { recursive: true });
      execFileSync(process.execPath, ['scripts/build.js'], { cwd: temp, stdio: 'pipe' }); source = path.join(temp, 'dist');
    }
    const app = express(); app.use('/k-toolkit', express.static(source));
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    browser = await (process.env.TEST_BROWSER === 'firefox' ? firefox : chromium).launch({ headless: true });
    const page = await browser.newPage({ serviceWorkers: 'block', acceptDownloads: true, viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(10000);
    const errors = [], external = []; page.on('pageerror', e => errors.push(e.message));
    await page.route(/^https?:\/\//, route => {
      if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
      external.push(route.request().url()); return route.abort();
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html#text-escape`);
    await page.locator('#esc-input').waitFor(); await page.keyboard.press('Alt+a'); await page.locator('#agInput').waitFor();
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } });
      _session = new AgentSession({ adapter: { chat: () => { throw new Error('Local actions must not call a model'); } }, config: {} });
      _agWireSession(_session);
    });
    const run = (name, params) => page.evaluate(({ name, params }) => _session.executeLocal(name, params), { name, params });
    const go = id => page.evaluate(id => navigateTo(id, false), id);
    const card = () => page.locator('.ag-card').last();
    const download = async locator => {
      const [item] = await Promise.all([page.waitForEvent('download'), locator.click()]);
      assert.equal(await item.failure(), null); return fs.readFileSync(await item.path());
    };
    const escaped = String.raw`C:\\new\\test`, original = 'C:\\new\\test';
    await page.locator('#esc-input').fill(escaped); await page.evaluate(() => textEscapeRun('unescape'));
    assert.equal(await page.locator('#esc-output').inputValue(), original);
    assert.equal((await run('string_escape', { text: escaped, type: 'json', unescape: true })).data.result, original);
    await go('sql-format'); const sql = "select 'a  b' -- keep comment\nfrom t;";
    await page.locator('#sqlInput').fill(sql); const sqlPage = await page.evaluate(() => compressSQL());
    assert.equal((await run('sql_format', { input: sql, minify: true })).data.result, sqlPage.data.result);
    await go('text-diff'); await page.locator('#diffA').fill('a\na'); await page.locator('#diffB').fill('a');
    const diffPage = await page.evaluate(() => runDiff()), diffAgent = await run('text_diff', { a: 'a\na', b: 'a' });
    assert.equal(diffPage.data.removed, 1); assert.equal(diffAgent.data.removedLines, 1);
    await go('diff-json'); await page.locator('#djInputA').fill('1'); await page.locator('#djInputB').fill('2');
    const jsonPage = await page.evaluate(() => djCompare()); assert.deepEqual((await run('json_diff', { a: '1', b: '2' })).data.diffs, jsonPage.data.diffs);
    const regex = await run('regex_test', { pattern: '(?:)', flags: 'gu', text: '🙂中' });
    assert.deepEqual(regex.data.matches.map(m => m.index), [0, 2, 3]);
    assert.equal((await run('regex_test', { pattern: '^', flags: 'g', text: 'abc' })).data.count, 1);
    assert.equal((await run('regex_test', { pattern: '(?<first>a)(b)', flags: 'g', text: 'ab ab', mode: 'replace', replacement: '$2:$<first>' })).data.result, 'b:a b:a');
    await page.evaluate(() => { window.__ticks = 0; window.__ticker = setInterval(() => window.__ticks++, 20); });
    const timed = await run('regex_test', { pattern: '(a+)+$', flags: '', text: 'a'.repeat(40) + '!' });
    assert.equal(timed.success, false); assert.equal(timed.error, 'timeout'); assert.ok(await page.evaluate(() => window.__ticks > 10));
    const cancelled = await page.evaluate(async () => {
      const controller = new AbortController(); setTimeout(() => controller.abort(), 30);
      try { await _AGENT_ALL_ACTIONS.get('regex_test').execute({ pattern: '(a+)+$', flags: '', text: 'a'.repeat(40) + '!' }, { signal: controller.signal }); return false; }
      catch (error) { return error.name === 'AbortError'; }
      finally { clearInterval(window.__ticker); }
    }); assert.equal(cancelled, true);
    console.log('PASS manual/Agent parity: escapes, SQL, duplicate lines, scalar JSON, real regex Worker timeout/cancel');

    const input = JSON.stringify({ payload: '<img src=x onerror=alert(1)>' + 'x'.repeat(5000) });
    const workflow = await run('run_workflow', { steps: [
      { id: 'format', action: 'json_format', params: { input } },
      { id: 'hash', action: 'hash_generate', params: { text: { $ref: 'format.data.result' }, algo: 'SHA-256' } },
    ], returnSteps: ['format', 'hash'] });
    assert.equal(workflow.success, true, JSON.stringify(workflow));
    const formatted = workflow.data.outputs.format.result;
    assert.equal(workflow.data.result.hash, crypto.createHash('sha256').update(formatted).digest('hex'));
    await card().locator('[data-result-select]').selectOption('1');
    assert.ok((await card().locator('.ag-workflow-preview').textContent()).length < formatted.length);
    assert.equal(await card().locator('img').count(), 0);
    await card().locator('[data-result-copy]').click(); assert.equal(await page.evaluate(() => window.__copied), formatted);
    assert.equal((await download(card().locator('[data-result-download]'))).toString(), formatted);
    await go('json'); await page.locator('#jsonInput').fill('{"keep":true}');
    await card().locator('[data-result-target]').selectOption('json');
    page.once('dialog', dialog => dialog.dismiss()); await card().locator('[data-result-send]').click();
    assert.equal(await page.locator('#jsonInput').inputValue(), '{"keep":true}');
    page.once('dialog', dialog => dialog.accept()); await card().locator('[data-result-send]').click();
    await page.waitForFunction(text => document.querySelector('#jsonInput')?.value === text, formatted);
    await run('text_diff', { a: 'a\na', b: 'a' });
    await card().getByText('调整参数重跑', { exact: true }).click();
    await card().getByRole('textbox', { name: '运行参数（JSON）' }).fill('{"a":"a","b":7}');
    const count = await page.locator('.ag-card').count(); await card().getByRole('button', { name: '使用这些参数运行' }).click();
    assert.equal(await page.locator('.ag-card').count(), count); assert.match(await card().locator('.ag-result-status').textContent(), /string/);
    await card().getByRole('textbox', { name: '运行参数（JSON）' }).fill('{"a":"a","b":"a\\nb"}');
    await card().getByRole('button', { name: '使用这些参数运行' }).click();
    await page.waitForFunction(n => { const cards = document.querySelectorAll('.ag-card'); return cards.length === n + 1 && cards[cards.length - 1].classList.contains('success'); }, count);
    assert.equal(await page.locator('.ag-card').count(), count + 1); assert.match(await card().innerText(), /\+1/);
    console.log('PASS result cards: intermediate selection, full copy/download, inert markup, live-input protection, parameter validation/rerun');

    const missing = await run('list_image_files', {}); assert.equal(missing.needsInput, true);
    await card().getByRole('button', { name: '选择图片', exact: true }).click(); await page.locator('#imgFileInput').waitFor({ state: 'attached' });
    const fixture = await page.evaluate(async () => {
      await ToolCompute.loadVendor('qrcodejs');
      const holder = document.createElement('div'); document.body.append(holder);
      new QRCode(holder, { text: 'https://example.com/shared?value=correct', width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M });
      const base64 = holder.querySelector('canvas').toDataURL('image/png').split(',')[1]; holder.remove(); return base64;
    });
    await page.locator('#imgFileInput').setInputFiles([
      { name: 'qr-fixture.png', mimeType: 'image/png', buffer: Buffer.from(fixture, 'base64') },
      { name: 'bad.png', mimeType: 'image/png', buffer: Buffer.from('broken file') },
    ]);
    const listed = (await run('list_image_files', {})).data.files, first = listed[0].id;
    assert.equal(listed.length, 2); assert.equal(JSON.stringify(listed).includes(fixture), false);
    const converted = await run('image_convert', { fileIds: listed.map(file => file.id), format: 'image/webp', quality: 90 });
    assert.equal(converted.success, false); assert.equal(converted.data.files.length, 1); assert.equal(converted.data.errors.length, 1);
    const resultId = converted.data.files[0].id;
    const output = await download(card().locator('[data-file-download]')); assert.equal(output.subarray(8, 12).toString(), 'WEBP');
    assert.deepEqual(await download(card().locator('[data-file-download]')), output);
    assert.equal(converted.data.files[0].width, 256);
    await card().locator('.ag-result-file select').selectOption('qrcode-decode'); await card().locator('[data-file-send]').click();
    await page.waitForFunction(() => document.querySelector('#qrdContent')?.textContent === 'https://example.com/shared?value=correct');
    assert.equal((await run('image_qr_decode', { fileId: resultId })).data.result, 'https://example.com/shared?value=correct');
    await go('img-exif'); await page.locator('[data-reuse]').click();
    await page.waitForFunction(() => document.querySelector('#exifData')?._metadata);
    const pageMeta = await page.evaluate(() => document.querySelector('#exifData')._metadata);
    const agentMeta = await run('image_metadata', { fileId: resultId });
    assert.equal(agentMeta.data.width, pageMeta.width); assert.equal(agentMeta.data.height, pageMeta.height); assert.deepEqual(agentMeta.data.tags, pageMeta.tags);
    // Clear during actual encoding must prevent a late Agent result from reappearing.
    const cancellation = await page.evaluate(async fileId => {
      const original = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (...args) { setTimeout(() => original.apply(this, args), 150); };
      const controller = new AbortController(); const start = ImageSession.list().length;
      const task = _AGENT_ALL_ACTIONS.get('image_convert').execute({ fileIds: [fileId], format: 'image/png' }, { signal: controller.signal });
      setTimeout(() => controller.abort(), 40);
      const result = await task; HTMLCanvasElement.prototype.toBlob = original;
      return { result, before: start, after: ImageSession.list().length };
    }, resultId);
    assert.equal(cancellation.result.success, false); assert.equal(cancellation.after, cancellation.before);
    const exifId = await page.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
      const jpeg = new Uint8Array(await (await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))).arrayBuffer());
      const segment = new Uint8Array(140), view = new DataView(segment.buffer);
      view.setUint16(0, 0xFFE1); view.setUint16(2, 138); segment.set([69, 120, 105, 102, 0, 0], 4);
      const base = 10, u16 = (pos, value) => view.setUint16(base + pos, value, true), u32 = (pos, value) => view.setUint32(base + pos, value, true);
      view.setUint16(base, 0x4949); u16(2, 42); u32(4, 8); u16(8, 3);
      const entry = (pos, tag, type, count, value) => { u16(pos, tag); u16(pos + 2, type); u32(pos + 4, count); u32(pos + 8, value); };
      entry(10, 0x010F, 2, 3, 0); segment.set([65, 66, 0], base + 18);
      entry(22, 0x0112, 3, 1, 0); u16(30, 6); entry(34, 0x8769, 4, 1, 50); u16(50, 2);
      entry(52, 0x829A, 5, 1, 84); u32(84, 1); u32(88, 125); entry(64, 0xA002, 4, 1, 321);
      const file = new File([jpeg.slice(0, 2), segment, jpeg.slice(2)], 'camera-fixture.jpg', { type: 'image/jpeg' });
      ImageSession.replace([file]); return ImageSession.metadata()[0].id;
    });
    const exifResult = await run('image_metadata', { fileId: exifId });
    assert.equal(exifResult.success, true, JSON.stringify(exifResult));
    assert.deepEqual(exifResult.data.tags, { 271: 'AB', 274: 6, 33434: 0.008, 40962: 321 });
    await page.locator('[data-reuse]').click();
    await page.waitForFunction(() => document.querySelector('#exifData')?._metadata?.name === 'camera-fixture.jpg');
    assert.deepEqual(await page.evaluate(() => document.querySelector('#exifData')._metadata.tags), exifResult.data.tags);
    const cleared = await page.evaluate(async fileId => {
      const original = HTMLCanvasElement.prototype.toBlob;
      HTMLCanvasElement.prototype.toBlob = function (...args) { setTimeout(() => original.apply(this, args), 150); };
      const task = _AGENT_ALL_ACTIONS.get('image_convert').execute({ fileIds: [fileId], format: 'image/png' });
      setTimeout(() => ImageSession.clear(), 40);
      const result = await task; HTMLCanvasElement.prototype.toBlob = original;
      return { result, remaining: ImageSession.list().length };
    }, exifId);
    assert.equal(cleared.result.success, false); assert.equal(cleared.remaining, 0, 'clearing files rejects late output');
    const transparent = await page.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      ImageSession.replace([new File([blob], 'transparent.png', { type: 'image/png' })]); return ImageSession.metadata()[0].id;
    });
    const jpeg = await run('image_convert', { fileIds: [transparent], format: 'image/jpeg', quality: 95, maxWidth: 16 });
    assert.equal(jpeg.data.files[0].width, 16);
    const corner = await page.evaluate(async id => {
      const file = ImageSession.getFile(id), url = URL.createObjectURL(file), image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 16; const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      const pixel = [...context.getImageData(0, 0, 1, 1).data]; URL.revokeObjectURL(url); return pixel;
    }, jpeg.data.files[0].id); assert.deepEqual(corner, [255, 255, 255, 255]);
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator('#agentPanel').evaluate(el => el.scrollWidth > el.clientWidth + 1), false);
    }
    if (process.env.TEST_SCREENSHOT) { await page.evaluate(() => { const list = document.getElementById('agMessages'); list.scrollTop = list.scrollHeight; }); await page.screenshot({ path: process.env.TEST_SCREENSHOT, fullPage: true }); }
    await page.evaluate(() => ImageSession.clear()); await card().locator('[data-file-download]').click();
    assert.match(await card().locator('.ag-result-status').textContent(), /重新选择/);
    assert.equal((await run('image_metadata', { fileId: resultId })).success, false);
    // Only the model boundary is a fixture here; actual mini UI, session execution,
    // retained DOM listeners, file bytes and navigation run normally.
    await page.evaluate(base64 => {
      ImageSession.replace([new File([Uint8Array.from(atob(base64), char => char.charCodeAt(0))], 'mini.png', { type: 'image/png' })]);
      const load = AgentConfig.AG.load, get = AgentAdapters.getAdapter;
      window.__restoreMini = () => { AgentConfig.AG.load = load; AgentAdapters.getAdapter = get; };
      AgentConfig.AG.load = () => ({ ...load(), apiKey: 'fixture-key' });
      AgentAdapters.getAdapter = () => ({ id: 'fixture', chat: async request => request.messages.some(m => m.role === 'tool')
        ? { stop_reason: 'end', message: { role: 'assistant', content: '完成' } }
        : { stop_reason: 'tool_use', message: { role: 'assistant', tool_calls: [{ id: 'mini-files', function: { name: 'list_image_files', arguments: '{}' } }] } } });
    }, fixture);
    await page.evaluate(() => _agOpenMini()); await page.locator('#agMiniInput').fill('列出图片'); await page.locator('#agMiniSendBtn').click();
    await page.locator('#agMiniMessages [data-file-download]').waitFor();
    await page.waitForFunction(() => !document.querySelector('#agMiniInput').disabled);
    await page.locator('#agMiniCloseBtn').click(); await page.evaluate(() => _agOpenMini());
    assert.equal((await download(page.locator('#agMiniMessages [data-file-download]'))).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    await page.locator('#agMiniMessages .ag-result-file select').selectOption('img-base64');
    await page.locator('#agMiniMessages [data-file-send]').click(); await page.locator('#agMiniOverlay').waitFor({ state: 'detached' });
    await page.locator('#imgResultPanel').waitFor(); assert.equal((await page.locator('#imgB64Output').inputValue()).split(',')[1], fixture);
    await page.evaluate(() => { window.__restoreMini(); ImageSession.clear(); });
    await page.evaluate(() => setLang('en')); await run('list_image_files', {}); assert.equal(await card().getByRole('button', { name: 'Choose images', exact: true }).count(), 1);
    assert.deepEqual(errors, []); assert.deepEqual(external, []);
    console.log('PASS actual local files: batch partial failure, WebP bytes, repeated downloads, QR decode, manual reuse, actual EXIF and metadata parity, cancellation/clear, resize, white JPEG, expired IDs, bilingual 375/768 layouts, mini reopen/download/handoff, zero external requests');
  } finally {
    await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); if (temp) fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
