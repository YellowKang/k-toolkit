const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const express=require('express');
const {chromium,firefox}=require('playwright');
(async()=>{
  let browser,server,temp;
  try {
    const root=path.join(__dirname,'..');let source=path.join(root,'public');
    if(process.env.TEST_BUILD==='1') {
      temp=fs.mkdtempSync(path.join(os.tmpdir(),'k-toolkit-json-workflow-'));
      for(const dir of ['public','scripts'])fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});
      execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe'});source=path.join(temp,'dist');
    }
    const app=express();app.use('/k-toolkit',express.static(source));
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    browser=await(process.env.TEST_BROWSER==='firefox'?firefox:chromium).launch({headless:true});
    const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1440,height:1000}});
    page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route(/^https:\/\//,route=>route.abort());
    const origin=`http://127.0.0.1:${server.address().port}/k-toolkit/`;
    await page.goto(origin+'dashboard.html#json');await page.locator('#jsonInput').waitFor();
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));
    const go=async id=>{await page.evaluate(id=>navigateTo(id),id);await page.waitForFunction(id=>document.querySelector('#toolBody')?.dataset.tool===id,id);};
    const input={id:'00123',payload:JSON.stringify({ok:true,detail:JSON.stringify({name:'中文🙂',path:'C:\\new\\file'})})};
    const encoded=JSON.stringify(JSON.stringify(input));
    await page.locator('#jsonInput').fill(encoded);
    await page.waitForFunction(()=>document.querySelector('#jsonDetectHint').textContent.includes('3 处'));
    await page.getByRole('button',{name:'展开嵌套 JSON',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#jsonStatus').textContent.includes('3 处'));
    assert.deepEqual(JSON.parse(await page.locator('#jsonOutput').textContent()),{id:'00123',payload:{ok:true,detail:{name:'中文🙂',path:'C:\\new\\file'}}});
    assert.equal(await page.locator('#jsonInput').inputValue(),encoded);
    await page.locator('.jw-path-query summary').click();await page.locator('#jsonPathInput').fill('$.payload.detail.name');
    assert.equal(JSON.parse(await page.locator('#jsonPathResult pre').textContent()),'中文🙂','queries follow the expanded result');
    await page.locator('.jw-path-query summary').click();
    await page.getByRole('button',{name:'结果作为输入',exact:true}).click();
    assert.equal(JSON.parse(await page.locator('#jsonInput').inputValue()).payload.ok,true);
    await page.getByRole('button',{name:'撤销输入替换',exact:true}).click();assert.equal(await page.locator('#jsonInput').inputValue(),encoded);
    await page.getByRole('button',{name:'去转义一层',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#jsonStatus').textContent.includes('去转义'));
    assert.equal(await page.locator('#jsonOutput').textContent(),JSON.stringify(input));

    const raw='  {"x": 1, "text":"中"}\n';
    await page.locator('#jsonInput').fill(raw);
    await page.getByRole('button',{name:'转义字符串',exact:true}).click();assert.equal(JSON.parse(await page.locator('#jsonOutput').textContent()),raw,'escape preserves surrounding whitespace');
    await page.getByRole('button',{name:'格式化并复制',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__copied),JSON.stringify(JSON.parse(raw),null,2));
    await page.locator('#jsonCopyMode').selectOption('minified');await page.locator('#jsonCopy').click();
    assert.equal(await page.evaluate(()=>window.__copied),JSON.stringify(JSON.parse(raw)));
    await page.locator('#jsonCopyMode').selectOption('escaped');await page.locator('#jsonCopy').click();
    assert.equal(JSON.parse(await page.evaluate(()=>window.__copied)),await page.locator('#jsonOutput').textContent());
    await page.waitForTimeout(1600);assert.equal(await page.locator('#jsonCopy').textContent(),'复制结果');

    const key='a".\\\n[0]', nested=JSON.stringify({hello:'世界',empty:''});
    const special=Object.fromEntries([[key,nested],['empty',''],['zero',0],['__proto__',{safe:true}],['<img data-json-xss src=x>','<svg data-json-xss onload=alert(1)>']]);
    await page.locator('#jsonInput').fill(JSON.stringify(special));await page.locator('#jsonInput').press('Control+Enter');
    await page.locator('#jsonTreeBtn').click();
    assert.equal(await page.locator('[data-json-xss]').count(),0,'tree keys and values stay inert text');
    const pathForKey='$['+JSON.stringify(key)+']';
    await page.locator('.jt-select').filter({hasText:'世界'}).click();
    assert.equal(await page.locator('#jsonPathBar code').textContent(),pathForKey);
    await page.getByRole('button',{name:'复制值',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),nested);
    await page.getByRole('button',{name:'复制 JSON',exact:true}).click();assert.equal(JSON.parse(await page.evaluate(()=>window.__copied)),nested);
    await page.getByRole('button',{name:'复制路径',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),pathForKey);
    await page.locator('.jt-select[data-jpath="$.empty"]').focus();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:'复制值',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),'');
    await page.locator('.jt-select[data-jpath="$.__proto__.safe"]').click();await page.getByRole('button',{name:'编辑值',exact:true}).click();
    await page.getByRole('textbox',{name:'编辑值',exact:true}).fill('false');await page.getByRole('button',{name:'保存',exact:true}).click();
    assert.equal(JSON.parse(await page.locator('#jsonOutput').textContent()).__proto__.safe,false);
    assert.equal(await page.evaluate(()=>({}).safe),undefined);
    await page.locator('.jw-path-query summary').click();await page.locator('#jsonPathInput').fill(pathForKey);
    assert.equal(JSON.parse(await page.locator('#jsonPathResult pre').textContent()),nested);
    await page.locator('#jsonPathInput').fill('$.empty invalid');assert.match(await page.locator('#jsonPathResult').textContent(),/路径错误/);

    await page.locator('#jsonInput').fill(JSON.stringify(Array.from({length:3000},(_,i)=>({index:i}))));
    await page.locator('#jsonInput').press('Control+Enter');await page.locator('#jsonTreeBtn').click();
    assert.ok(await page.locator('.jt-select').count()<=500);
    await page.locator('.jt-select[data-jpath="$"], .jt-select').first().click();
    await page.getByRole('button',{name:'复制 JSON',exact:true}).click();assert.equal(JSON.parse(await page.evaluate(()=>window.__copied)).length,3000);
    await go('text-escape');
    const text='  C:\\new\\test.json\n中文🙂\t"quoted"  ';
    await page.locator('#esc-input').fill(JSON.stringify(text));await page.locator('#escUnescapeCopy').click();
    await page.waitForFunction(()=>document.querySelector('#escStatus').textContent.includes('完成'));
    assert.equal(await page.locator('#esc-output').inputValue(),text);assert.equal(await page.evaluate(()=>window.__copied),text);
    await page.locator('#escUse').click();assert.equal(await page.locator('#esc-input').inputValue(),text);
    await page.locator('#escUndo').click();assert.equal(await page.locator('#esc-input').inputValue(),JSON.stringify(text));
    await page.locator('#esc-input').fill('\\q');await page.locator('#unesc-btn').click();
    await page.waitForFunction(()=>document.querySelector('#escStatus').textContent.includes('无效'));
    assert.equal(await page.locator('#esc-output').inputValue(),'');assert.equal(await page.locator('#esc-copy').isDisabled(),true);
    await page.locator('#escMode').selectOption('html');await page.locator('#esc-input').fill('&amp;lt; &#x1f642; &copy;');await page.locator('#unesc-btn').click();
    assert.equal(await page.locator('#esc-output').inputValue(),'&lt; 🙂 ©');assert.equal(await page.locator('#escExpand').isVisible(),false);
    await go('json');await go('text-escape');assert.equal(await page.locator('#escMode').inputValue(),'html');
    await page.locator('#langBtn').click();await page.locator('#esc-input').waitFor();
    assert.equal(await page.locator('#escMode').inputValue(),'html');assert.equal(await page.locator('#escExpand').isVisible(),false);
    await page.locator('#unesc-btn').click();assert.equal(await page.locator('#esc-output').inputValue(),'&lt; 🙂 ©');
    await page.locator('#escMode').selectOption('url');await page.locator('#esc-input').fill('%zz');await page.locator('#unesc-btn').click();
    assert.match(await page.locator('#escStatus').textContent(),/Invalid URL/);
    await page.addScriptTag({url:origin+'agent/actions/nav.js'});
    const agent=await page.evaluate(()=>NavActions.find(action=>action.name==='fill_and_run_tool').execute({toolId:'text-escape',inputs:{type:'json',text:'"hello\\nworld"'},action:'unescape'}));
    assert.equal(agent.success,true);assert.equal(agent.data.result,'hello\nworld');
    const invalid=await page.evaluate(()=>NavActions.find(action=>action.name==='fill_and_run_tool').execute({toolId:'text-escape',inputs:{type:'json',text:'\\q'},action:'unescape'}));
    assert.equal(invalid.success,false);
    await go('json');
    const expandedByAgent=await page.evaluate(text=>NavActions.find(action=>action.name==='fill_and_run_tool').execute({toolId:'json',inputs:{text},action:'expand'}),encoded);
    assert.equal(expandedByAgent.success,true);assert.equal(JSON.parse(expandedByAgent.data.result).payload.ok,true);
    await go('text-escape');
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));
    await page.locator('#esc-input').fill('plain');await page.locator('#esc-btn').click();await page.locator('#esc-copy').click();
    assert.equal(await page.locator('#esc-copy').textContent(),'Copy result');assert.match(await page.locator('.toast-msg').last().textContent(),/Copy failed/);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));

    const shots=path.join(os.tmpdir(),'k-toolkit-json-workflow-shots');if(process.env.TEST_SCREENSHOTS)fs.mkdirSync(shots,{recursive:true});
    if(process.env.TEST_SCREENSHOTS)await page.waitForTimeout(2300);
    for(const id of ['json','text-escape']) {
      await go(id);
      if(id==='json'){await page.locator('#jsonInput').fill(JSON.stringify(input,null,2));await page.getByRole('button',{name:'Expand nested JSON',exact:true}).click();}
      for(const theme of ['dark','light']) {
        await page.evaluate(theme=>{document.documentElement.setAttribute('data-theme',theme);},theme);
        for(const width of [1440,768,375]) {
          await page.setViewportSize({width,height:1000});await page.waitForTimeout(220);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${id}/${theme}/${width} has no page overflow`);
          if(process.env.TEST_SCREENSHOTS)await page.screenshot({path:path.join(shots,`${id}-${theme}-${width}.png`)});
        }
      }
    }
    await go('json-schema');
    const activeTab=await page.locator('.tool-workbench-links [aria-current=page]').boundingBox();
    assert.ok(activeTab.x>=0 && activeTab.x+activeTab.width<=375,'current mobile workbench tab stays visible');
    assert.deepEqual(errors,[]);
    console.log('PASS: nested JSON, exact single-layer unescape, typed field/path copies, complete large-tree copy, undo, errors, draft/language restore, Agent actions, clipboard failure, dark/light responsive layouts');
  } finally {
    if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));if(temp)fs.rmSync(temp,{recursive:true,force:true});
  }
})().catch(error=>{console.error(String(error.stack||error).slice(0,2000));process.exitCode=1;});
