const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const express = require('express');
const { chromium, firefox } = require('playwright');

(async () => {
  let browser, server, temp;
  try {
    const root = path.join(__dirname, '..');
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-perf-test-'));
      for (const dir of ['public','scripts']) fs.cpSync(path.join(root, dir),path.join(temp,dir),{recursive:true});
      execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe'});
      source = path.join(temp,'dist');
    }
    const app = express(); app.use('/k-toolkit',express.static(source));
    server = await new Promise(resolve => { const s=app.listen(0,'127.0.0.1',()=>resolve(s)); });
    browser = await (process.env.TEST_BROWSER === 'firefox' ? firefox : chromium).launch({headless:true});
    const page = await browser.newPage({serviceWorkers:'block',viewport:{width:1440,height:1000}});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,route=>route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`);
    assert.equal(await page.locator('#mdStyles').count(),0,'editor styling stays out of the home page');
    assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.effect?.getTiming().iterations===Infinity).length),0);
    assert.equal(await page.locator('.tool-card').first().evaluate(el=>getComputedStyle(el).willChange),'auto');
    const go = async id => {
      await page.evaluate(id=>navigateTo(id),id);
      await page.waitForFunction(id=>document.querySelector('#toolBody')?.dataset.tool===id,id);
    };
    await go('markdown');
    await page.waitForFunction(()=>document.getElementById('mdStyles')?.sheet);
    await page.waitForTimeout(250);
    await page.evaluate(()=>{
      const original=_mdParse; window.__mdParses=0;
      window._mdParse=(text)=>{window.__mdParses++;return original(text);};
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}});
    });
    const metrics = await page.evaluate(async ()=>{
      const text=('# Heading\n\nSome **bold text** and `inline code`.\n\n```js\nconst value = 42;\n```\n\n- [ ] A task\n\n').repeat(800);
      const input=document.getElementById('mdInput'), handlers=[];
      for(let i=0;i<20;i++) {
        input.value=text+'\nTyping '+i;
        const start=performance.now(); input.dispatchEvent(new Event('input',{bubbles:true})); handlers.push(performance.now()-start);
        await new Promise(r=>setTimeout(r,25));
      }
      await new Promise(r=>setTimeout(r,350));
      return {characters:text.length,renders:window.__mdParses,inputHandlerTotalMs:handlers.reduce((a,b)=>a+b,0),inputHandlerMaxMs:Math.max(...handlers)};
    });
    assert.equal(metrics.renders,1,'a typing burst must produce one preview');
    assert.ok((await page.locator('#mdPreview').textContent()).includes('Typing 19'));
    await page.evaluate(()=>{
      const input=document.getElementById('mdInput');
      input.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));
      input.value='# 中文输入'; input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(()=>window.__mdParses),1,'composition must not rerender');
    await page.locator('#mdInput').dispatchEvent('compositionend');
    await page.waitForFunction(()=>document.querySelector('#mdPreview h1')?.textContent==='中文输入');
    await page.locator('#mdInput').fill('# Latest copy');
    await page.evaluate(()=>mdCopyHtml());
    assert.match(await page.evaluate(()=>window.__copied),/Latest copy/,'copy flushes pending input');
    await page.locator('#mdInput').fill('# Pending then cleared');
    await page.evaluate(()=>mdClear()); await page.waitForTimeout(250);
    assert.equal(await page.locator('#mdPreview').textContent(),'');

    await page.locator('#mdInput').fill('- [ ] First\n```\n- [ ] Code only\n```\n- [x] Second');
    await page.evaluate(()=>mdUpdate());
    await page.locator('#mdPreview .md-cb').first().click();
    assert.equal(await page.locator('#mdInput').inputValue(),'- [x] First\n```\n- [ ] Code only\n```\n- [x] Second');
    await page.locator('#mdPreview .md-cb').last().press('Space');
    assert.ok((await page.locator('#mdInput').inputValue()).endsWith('- [ ] Second'));
    await page.locator('#mdInput').fill('# Destination');
    await page.locator('#mdInput').evaluate(el=>{el.selectionStart=el.selectionEnd=0;});
    await page.evaluate(()=>mdGenerateToc());
    await page.locator('#mdPreview a').first().click();
    assert.equal(await page.evaluate(()=>currentPage),'markdown','TOC stays within the editor');

    await page.locator('#mdInput').fill('# Saved draft');
    await go('json'); await page.waitForTimeout(250);
    await go('markdown'); assert.equal(await page.locator('#mdInput').inputValue(),'# Saved draft');
    await page.evaluate(()=>setLang('en'));
    await page.getByRole('button',{name:'Copy HTML',exact:true}).waitFor();
    assert.equal(await page.locator('#mdInput').inputValue(),'# Saved draft');
    await page.locator('#mdInput').fill('# Large document\n\n'+'Text '.repeat(22000));
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#mdRefresh').isVisible(),true);
    const beforeManual = await page.locator('#mdPreview').textContent();
    assert.ok(!beforeManual.includes('Large document'));
    await page.locator('#mdRefresh').click();
    assert.match(await page.locator('#mdPreview').textContent(),/Large document/);
    await page.locator('#mdInput').fill('<script>window.__attack=1</script><img src=x onerror="window.__attack=2"><a href="javascript:alert(1)">bad</a><details><summary>Safe</summary>Text</details>');
    await page.evaluate(()=>mdUpdate());
    assert.equal(await page.locator('#mdPreview [onerror],#mdPreview script,#mdPreview a[href^="javascript:"]').count(),0);
    assert.equal(await page.locator('#mdPreview details').count(),1);
    assert.equal(await page.evaluate(()=>window.__attack),undefined);

    await page.evaluate(()=>mdLoadSample());
    assert.equal(await page.locator('#mdPreview table tbody tr').count(),2);
    const screenshots=process.env.TEST_SCREENSHOTS;
    if(screenshots) fs.mkdirSync(screenshots,{recursive:true});
    for(const color of ['dark','light','tech-blue','sakura','orange','green']) {
      await page.evaluate(color=>{theme=color;applyTheme();},color);
      await page.waitForTimeout(220);
      assert.equal(await page.locator('.topbar').evaluate(el=>getComputedStyle(el).backdropFilter),'none');
      if(screenshots && ['dark','light'].includes(color)) await page.screenshot({path:path.join(screenshots,`markdown-${color}.png`)});
    }
    for(const width of [768,375]) {
      await page.setViewportSize({width,height:900});
      await page.waitForFunction(()=>document.querySelector('.md-workspace').dataset.mode==='edit');
      assert.equal(await page.locator('.md-editor-pane').isVisible(),true);
      assert.equal(await page.locator('.md-preview-pane').isVisible(),false);
      await page.locator('[data-md-mode="preview"]').click();
      assert.equal(await page.locator('.md-preview-pane').isVisible(),true);
      assert.equal(await page.locator('.md-editor-pane').isVisible(),false);
      await page.locator('[data-md-mode="edit"]').click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      const bounds=await page.locator('.md-workspace').boundingBox(); assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width);
      if(screenshots) await page.screenshot({path:path.join(screenshots,`markdown-${width}.png`)});
    }
    await page.emulateMedia({reducedMotion:'reduce'}); await go('json');
    assert.equal(await page.locator('#content').evaluate(el=>el.getAnimations().length),0);
    assert.deepEqual(errors,[]);
    console.log('PASS: typing coalescing, IME, fresh copy, clear/cancel, drafts, tasks, TOC, large files, sanitizer, 6 themes and responsive modes', metrics);
  } finally {
    if(browser) await browser.close();
    if(server) await new Promise(resolve=>server.close(resolve));
    if(temp) fs.rmSync(temp,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
