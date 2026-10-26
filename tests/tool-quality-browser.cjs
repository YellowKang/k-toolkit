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
      temp=fs.mkdtempSync(path.join(os.tmpdir(),'k-toolkit-quality-test-'));
      for(const dir of ['public','scripts'])fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});
      execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe'});source=path.join(temp,'dist');
    }
    const app=express();app.use('/k-toolkit',express.static(source));
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    browser=await(process.env.TEST_BROWSER==='firefox'?firefox:chromium).launch({headless:true});
    const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1440,height:1000},acceptDownloads:true});
    page.setDefaultTimeout(8000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https:\/\//,r=>r.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html#sql-format`);
    await page.locator('#sqlInput').waitFor();
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__copied=value;}}}));
    const go=async id=>{await page.evaluate(id=>navigateTo(id),id);await page.waitForFunction(id=>document.querySelector('#toolBody')?.dataset.tool===id,id);};
    const sql="select 'select  a, from b' as text from tbl -- keep  spaces\nwhere name = 'it''s  safe';";
    await page.locator('#sqlInput').fill(sql);await page.locator('#sqlInput').press('Control+Enter');
    await page.waitForFunction(()=>document.querySelector('#sqlOutput').textContent.includes("'select  a, from b'"));
    assert.ok((await page.locator('#sqlOutput').textContent()).includes("'select  a, from b'"));
    await page.getByRole('button',{name:'压缩',exact:true}).click();
    assert.ok((await page.locator('#sqlOutput').textContent()).includes('-- keep  spaces\nwhere'));
    await page.locator('#sqlDialect').selectOption('pgsql');
    await page.locator('#sqlInput').fill('select $body$select  a,\nfrom b$body$;');
    await page.locator('#sqlInput').press('Control+Enter');
    assert.equal(await page.locator('#sqlOutput').textContent(),'SELECT $body$select  a,\nfrom b$body$;');
    await page.locator('#sqlInput').fill("select 'unfinished");await page.locator('#sqlInput').press('Control+Enter');
    assert.equal(await page.locator('#sqlResultPanel').isVisible(),false);
    assert.match(await page.locator('#sqlHint').textContent(),/未闭合/);
    await page.locator('#sqlInput').fill(sql);await go('json');await page.waitForTimeout(600);await go('sql-format');
    assert.equal(await page.locator('#sqlInput').inputValue(),sql);

    await go('text-diff');
    const a=Array.from({length:3000},(_,i)=>'line '+i),b=a.slice();b.splice(2200,0,'inserted');
    await page.locator('#diffA').fill('original');await page.locator('#diffB').fill('modified');
    // Seed bulk input through DOM events; concurrent local headless runs showed
    // flaky native insertion timeouts before the comparison was even started.
    await page.evaluate(({a,b})=>{
      for(const [id,value] of [['diffA',a],['diffB',b]]) {
        const input=document.getElementById(id);input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));
      }
    },{a:a.join('\n'),b:b.join('\n')});
    await page.getByRole('button',{name:'对比',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('#diffStat').textContent.includes('+1 增加'));
    assert.match(await page.locator('#diffStat').textContent(),/\+1 增加\s+−0 删除/);
    assert.ok(await page.locator('#diffOutput *').count()<1500,'large diffs render at most one page');
    await page.getByRole('button',{name:'首处差异',exact:true}).click();
    assert.match(await page.locator('#diffOutput').textContent(),/inserted/);
    await page.getByRole('button',{name:'复制结果',exact:true}).click();
    assert.ok((await page.evaluate(()=>window.__copied)).includes('  line 2999'));
    assert.equal((await page.evaluate(()=>window.__copied)).split('\n').filter(line=>line.startsWith('+ ')).length,1);
    const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'下载差异',exact:true}).click();
    const download=await downloadPromise;assert.ok(fs.readFileSync(await download.path(),'utf8').includes('+ inserted'));
    await page.locator('#diffRealtime').check();
    await page.evaluate(()=>{const original=_computeDiff;window.__compares=0;window._computeDiff=(...args)=>{window.__compares++;return original(...args);};});
    for(let i=0;i<5;i++)await page.locator('#diffB').fill('new '+i);
    await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__compares),1);

    await go('regex');await page.locator('#regexPattern').fill('(?<word>[a-z]+)(\\d*)');await page.locator('#regexFlags').fill('g');
    await page.locator('#regexText').fill('a12 b');
    await page.waitForFunction(()=>document.querySelector('#regexStatus').textContent.includes('2 个匹配'));
    assert.match(await page.locator('#regexMatches').textContent(),/word/);
    assert.match(await page.locator('#regexMatches').textContent(),/12/);
    await page.locator('#regexPattern').fill('(?:)');await page.locator('#regexFlags').fill('gu');await page.locator('#regexText').fill('🙂中');
    await page.waitForFunction(()=>document.querySelector('#regexStatus').textContent.includes('3 个匹配'));
    await page.getByRole('button',{name:'替换模式',exact:true}).click();
    await page.locator('#regexReplaceStr').fill('-');
    await page.waitForFunction(()=>document.querySelector('#regexReplaceResult').textContent==='-🙂-中-');
    await page.getByRole('button',{name:'匹配模式',exact:true}).click();
    await page.locator('#regexPattern').fill('(a+)+$');await page.locator('#regexFlags').fill('');await page.locator('#regexText').fill('a'.repeat(40)+'!');
    await page.evaluate(()=>{window.__beats=0;window.__beatTimer=setInterval(()=>window.__beats++,25);});
    await page.waitForFunction(()=>document.querySelector('#regexStatus').textContent.includes('超时'));
    assert.ok(await page.evaluate(()=>window.__beats)>10,'UI thread stays responsive during expensive regex');
    await page.evaluate(()=>clearInterval(window.__beatTimer));
    await page.locator('#regexPattern').fill('a+');
    await page.waitForFunction(()=>document.querySelector('#regexStatus').textContent.includes('1 个匹配'));
    await page.addScriptTag({url:`http://127.0.0.1:${server.address().port}/k-toolkit/agent/actions/nav.js`});
    const agentResult=await page.evaluate(()=>NavActions.find(a=>a.name==='fill_and_run_tool').execute({toolId:'regex',inputs:{text:'b12',pattern:'([a-z]+)(\\d+)',flags:'g'}}));
    assert.equal(agentResult.success,true);assert.match(agentResult.data.result,/12/);
    const agentTimeout=await page.evaluate(()=>NavActions.find(a=>a.name==='fill_and_run_tool').execute({toolId:'regex',inputs:{text:'a'.repeat(40)+'!',pattern:'(a+)+$',flags:''}}));
    assert.equal(agentTimeout.success,false);assert.match(agentTimeout.display,/超时/);
    await page.locator('#regexPattern').fill('(a+)+$');await page.waitForTimeout(250);await go('json');
    assert.equal(await page.evaluate(()=>_regexWorker),null,'leaving terminates the worker');
    await page.waitForTimeout(1600);assert.equal(await page.evaluate(()=>currentPage),'json');
    assert.deepEqual(errors,[]);
    console.log('PASS: SQL literals/dialects/comments/cleanup; exact large diff, pagination/full copy/download/live debounce; regex groups/Unicode/replace/timeout/responsiveness/cleanup');
  } finally {
    if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));if(temp)fs.rmSync(temp,{recursive:true,force:true});
  }
})().catch(error=>{console.error(String(error.stack || error).slice(0,1500));process.exitCode=1;});
