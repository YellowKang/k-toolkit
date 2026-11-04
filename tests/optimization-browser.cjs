const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const express = require('express');
const { launchBrowser } = require('./browser-launch.cjs');

(async () => {
  let browser, server, temp;
  try {
    const root = path.resolve(__dirname, '..');
    let source = path.join(root, 'public');
    if (process.env.TEST_BUILD === '1') {
      temp = fs.mkdtempSync(path.join(os.tmpdir(), 'k-toolkit-optimization-'));
      for (const dir of ['public','scripts']) fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});
      execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});
      source = path.join(temp,'dist');
    }
    const app=express(); app.use('/k-toolkit',express.static(source));
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    browser=await launchBrowser();
    const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route=>route.abort());
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
    const url=`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`;
    await page.goto(url+'#json');await page.locator('#jsonInput').waitFor();
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));
    const go=async(id,selector)=>{await page.evaluate(id=>navigateTo(id,false),id);await page.locator(selector).waitFor();};

    const input='{"name":"original","id":9223372036854775807,"decimal":0.1234567890123456789,"zero":-0}';
    await page.locator('#jsonInput').fill(input);await page.evaluate(()=>formatJSON());
    await page.locator('#jsonCopyMode').selectOption('minified');await page.locator('#jsonCopy').click();
    assert.equal(await page.evaluate(()=>window.__copied),input);
    await page.locator('#jsonTreeBtn').click();await page.locator('[data-jpath="$.id"]').click();
    await page.getByRole('button',{name:'复制 JSON',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),'9223372036854775807');
    await page.locator('[data-jpath="$.name"]').click();await page.getByRole('button',{name:'编辑值',exact:true}).click();
    await page.getByRole('textbox',{name:'编辑值',exact:true}).fill('edited');await page.getByRole('button',{name:'保存',exact:true}).click();
    assert.match(await page.locator('#jsonOutput').textContent(),/9223372036854775807/);
    assert.match(await page.locator('#jsonOutput').textContent(),/0\.1234567890123456789/);
    const queried=await page.evaluate(()=>{document.getElementById('jsonPathInput').value='$.id';jsonPathQuery();return document.querySelector('#jsonPathResult pre').textContent;});
    assert.equal(queried,'9223372036854775807');
    const filtered=await page.evaluate(()=>_jsonStringify(_jsonPath(_jsonParse('[{"id":9007199254740992},{"id":9007199254740993}]'),'$[?(@.id>9007199254740992)]')));
    assert.equal(filtered,'{"id":9007199254740993}');
    await page.evaluate(()=>jsonSort());assert.match(await page.locator('#jsonOutput').textContent(),/9223372036854775807/);

    await go('diff-json','#djInputA');
    await page.locator('#djInputA').fill('9007199254740992');await page.locator('#djInputB').fill('9007199254740993');await page.evaluate(()=>djCompare());
    assert.match(await page.locator('#djOutput').textContent(),/9007199254740992 → 9007199254740993/);
    const metrics=await page.evaluate(async()=>{
      const a={},b={};for(let i=0;i<4900;i++){a['key'+i]='A'.repeat(80);b['key'+i]='B'.repeat(80);}
      document.getElementById('djInputA').value=JSON.stringify(a);document.getElementById('djInputB').value=JSON.stringify(b);
      const start=performance.now();await djCompare();const render=performance.now()-start,layoutStart=performance.now();
      document.getElementById('djOutput').getBoundingClientRect();
      return {renderMs:render,layoutMs:performance.now()-layoutStart,dom:document.querySelectorAll('#djOutput *').length};
    });
    assert.ok(metrics.dom<=400);assert.equal(await page.locator('#djOutput > div').count(),100);
    await page.locator('#djNext').click();assert.match(await page.locator('#djOutput > div').first().textContent(),/\/key100:/);
    await page.locator('#djCopy').click();assert.equal(await page.evaluate(()=>JSON.parse(__copied).length),4900);
    const downloadPromise=page.waitForEvent('download');await page.locator('#djDownload').click();
    const download=await downloadPromise;assert.equal(JSON.parse(fs.readFileSync(await download.path(),'utf8')).length,4900);
    for(const width of [375,768]) {await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    if(process.env.TEST_SCREENSHOTS){fs.mkdirSync(process.env.TEST_SCREENSHOTS,{recursive:true});await page.setViewportSize({width:375,height:900});await page.locator('#djNext').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.TEST_SCREENSHOTS,'json-diff-mobile.png')});}
    await page.evaluate(()=>setLang('en'));await page.getByRole('button',{name:'Compare',exact:true}).waitFor();await page.evaluate(()=>djCompare());
    assert.match(await page.locator('#djPageStatus').textContent(),/Page 1 \/ 49/);
    await page.evaluate(()=>{theme='light';applyTheme();});await page.setViewportSize({width:1440,height:1000});
    if(process.env.TEST_SCREENSHOTS){await page.locator('#djNext').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.TEST_SCREENSHOTS,'json-diff-light.png')});}
    await page.locator('#djInputA').fill('{}');assert.equal(await page.locator('#djResult').isVisible(),false);assert.equal(await page.evaluate(()=>djResultText()),'');
    await page.locator('#djInputB').fill('{"id":9007199254740993}');await page.evaluate(()=>djCompare());
    const fullDiff=await page.evaluate(()=>djResultText());
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('.workspace-actions button').click();await page.locator('#jsonInput').waitFor();
    assert.equal(await page.locator('#jsonInput').inputValue(),fullDiff,'continue processing transfers the complete diff, not JSON A');

    await go('json-csv','#jcInput');await page.locator('#jcInput').fill('[{"before":123}]');await page.evaluate(()=>convertJsonCsv());
    await page.evaluate(()=>loadJCDemo());assert.equal(await page.locator('#jcResultPanel').isVisible(),false);assert.equal(await page.locator('#jcOutput').inputValue(),'');
    await page.evaluate(()=>convertJsonCsv());await page.evaluate(()=>setJsonCsvMode('csv2json',true));assert.equal(await page.locator('#jcOutput').inputValue(),'');

    await go('ai-chat','#_chatInput');await page.evaluate(()=>_agEnsureLoaded());
    await page.waitForTimeout(400);
    const saved=await page.evaluate(async()=>{
      _chatMessages=[{role:'user',content:'Keep this question'},{role:'assistant',content:'Keep this answer'}];
      await _chatSaveHistory();const before=localStorage.getItem('dtb_chat_history');
      _chatMessages.push({role:'user',content:'Describe image',_images:[{mime:'image/png',base64:'A'.repeat(1600000)}]});
      const ok=await _chatSaveHistory();let switched=false;try{await _chatSwitchSession(null,true);switched=true;}catch{}
      return {ok,switched,intact:before===localStorage.getItem('dtb_chat_history'),inMemory:_chatMessages.length,notice:document.getElementById('_chatStorageStatus').textContent};
    });
    assert.equal(saved.ok,false);assert.equal(saved.switched,false);assert.equal(saved.intact,true);assert.equal(saved.inMemory,3);assert.match(saved.notice,/previous saved history is intact/);
    const sent=await page.evaluate(async()=>{
      _chatMessages=[{role:'user',content:'Keep this question'},{role:'assistant',content:'Keep this answer'}];
      await _chatSaveHistory();
      AgentConfig.AG.save({adapter:'custom',apiKey:'',baseUrl:'http://127.0.0.1:1',model:'fixture',temperature:0.7,max_tokens:2000});
      window.__modelRequests=0;AgentAdapters.getAdapter('custom').chat=async()=>{__modelRequests++;return{message:{content:'Unexpected request'}};};
      _chatImages=[{mime:'image/png',base64:'A'.repeat(1600000)}];document.getElementById('_chatInput').value='Keep this draft';
      const before=localStorage.getItem('dtb_chat_history');await _chatSend();
      return {requests:__modelRequests,intact:before===localStorage.getItem('dtb_chat_history'),input:document.getElementById('_chatInput').value,images:_chatImages.length,messages:_chatMessages.length};
    });
    assert.deepEqual(sent,{requests:0,intact:true,input:'Keep this draft',images:1,messages:2});
    const bounded=await page.evaluate(async()=>{
      _chatImages=[];_chatMessages=Array.from({length:520},(_,i)=>({role:i%2?'assistant':'user',content:'History '+i}));
      await _chatSaveHistory();const id=_chatSessionId;await _chatSwitchSession(null,true);const record=ChatConversations.record(id);
      await _chatSwitchSession(id);return {count:record.messages.length,omitted:record.meta.omitted,restored:_chatHistoryOmitted};
    });
    assert.deepEqual(bounded,{count:500,omitted:20,restored:20});
    assert.deepEqual(errors,[]);
    await context.close();

    if(process.env.TEST_BUILD==='1') {
      const offlineContext=await browser.newContext({serviceWorkers:'allow'});
      // Save-Data works even in engines without a built-in NetworkInformation API.
      await offlineContext.addInitScript(()=>Object.defineProperty(navigator,'connection',{configurable:true,value:{saveData:true,effectiveType:'4g'}}));
      const offlinePage=await offlineContext.newPage();await offlinePage.goto(url);
      await offlinePage.waitForTimeout(1400);
      assert.equal(await offlinePage.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length),0,'Save-Data prevents automatic full-site downloads');
      await offlinePage.evaluate(()=>AppUpdates.check());await offlinePage.waitForFunction(()=>!!navigator.serviceWorker.controller);
      assert.ok(await offlinePage.evaluate(async()=>(await caches.keys()).some(key=>key.startsWith('dtb-release:'))),'manual check still installs a complete offline release');
      await offlineContext.close();
    }
    console.log('PASS: lossless JSON UI and queries, paged full diff export, stale CSV clearing, protected chat limits, manual offline override',metrics);
  } finally {if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));if(temp)fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
