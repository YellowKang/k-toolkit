const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');const express=require('express');const {launchBrowser}=require('./browser-launch.cjs');
(async()=>{
 let browser,server,temp;
 try {
  const root=path.resolve(__dirname,'..');let source=path.join(root,'public');
  if(process.env.TEST_BUILD==='1'){temp=fs.mkdtempSync(path.join(os.tmpdir(),'k-toolkit-workflow-resume-'));for(const dir of ['public','scripts'])fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});source=path.join(temp,'dist');}
  const app=express();app.use('/k-toolkit',express.static(source));server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  browser=await launchBrowser();const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});await context.route(/^https:\/\//,route=>route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
  const url=`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html`;
  await page.goto(url+'#workflow-studio');await page.locator('#wfInput').waitFor();
  const id=await page.evaluate(()=>{
    const plan=AgentWorkflow.save({name:'Resume demo',steps:[{id:'format',action:'json_format',params:{input:{$input:true},minify:true}},{id:'pick',action:'json_extract',params:{input:{$ref:'format.data.result'},pointer:'/missing'}}]});
    const original=_AGENT_ALL_ACTIONS.get('json_format').execute;window.__formatCalls=0;_AGENT_ALL_ACTIONS.get('json_format').execute=async(...args)=>{__formatCalls++;return original(...args);};
    return plan.id;
  });
  const go=async(id,selector)=>{await page.evaluate(id=>navigateTo(id,false),id);await page.locator(selector).first().waitFor();};
  await go('home','.tool-card');await go('workflow-studio','#wfLibrary');await page.locator('#wfLibrary').selectOption(id);
  const input='{"name":"Ada","token":"SYNTHETIC_WORKFLOW_SECRET"}';await page.locator('#wfInput').fill(input);
  await page.locator('#wfPreviewButton').click();assert.equal(await page.locator('#wfPreview > ol > li').count(),2);assert.equal(await page.evaluate(()=>__formatCalls),0);
  assert.match(await page.locator('#wfPreview').textContent(),/format/);
  await page.locator('#wfInput').fill(input+' ');assert.match(await page.locator('#wfPreviewState').textContent(),/变化/);await page.locator('#wfInput').fill(input);
  const run=async()=>{await page.locator('#wfRun').click();await page.waitForFunction(()=>!document.getElementById('wfRun').disabled);};
  await run();assert.match(await page.locator('#wfStatus').textContent(),/1\/2/);assert.equal(await page.evaluate(()=>__formatCalls),1);
  const first=await page.evaluate(async()=> (await AgentWorkflow.listRuns()).runs[0].id);
  await page.locator('[data-step-id="pick"] [data-param="pointer"]').fill('/name');assert.equal(await page.locator('#wfResume').isEnabled(),true);
  await page.locator('#wfResume').click();await page.waitForFunction(()=>!document.getElementById('wfRun').disabled);
  assert.match(await page.locator('#wfStatus').textContent(),/已完成 2\/2/);assert.match(await page.locator('#wfResult').textContent(),/Ada/);assert.equal(await page.evaluate(()=>__formatCalls),1);
  const summary=await page.evaluate(id=>JSON.parse(localStorage.getItem('dtb_workflow_runs')).items.find(r=>r.id===id),first);assert.equal(summary.attempt,2);assert.equal(summary.steps[0].reused,true);
  assert.doesNotMatch(await page.evaluate(()=>localStorage.getItem('dtb_workflow_runs')),/SYNTHETIC_WORKFLOW_SECRET|Ada|missing|"params"/);

  await page.locator('[data-step-id="pick"] [data-param="pointer"]').fill('/missing');await run();
  const failed=await page.evaluate(async()=> (await AgentWorkflow.listRuns()).runs.find(r=>r.status==='failed').id);
  await page.locator('#wfInput').fill('{"name":"changed"}');assert.equal(await page.locator('#wfResume').isEnabled(),false);assert.match(await page.locator('#wfResumeStatus').textContent(),/已完成步骤/);
  await page.locator('#wfInput').fill(input);assert.equal(await page.locator('#wfResume').isEnabled(),true);
  await go('json','#jsonInput');await go('workflow-studio','#wfRunList');
  const row=page.locator(`[data-run-id="${failed}"]`);await row.locator('summary').click();page.once('dialog',d=>d.accept());await page.locator(`[data-load-run="${failed}"]`).click();
  assert.equal(await page.locator('[data-step-id="format"] [data-step-literal]').inputValue(),input);
  const beforeResume=await page.evaluate(()=>__formatCalls);await page.locator('[data-step-id="pick"] [data-param="pointer"]').fill('/name');
  await page.locator('#wfResume').click();await page.waitForFunction(()=>!document.getElementById('wfRun').disabled);assert.equal(await page.evaluate(()=>__formatCalls),beforeResume);

  await page.evaluate(()=>{const action=_AGENT_ALL_ACTIONS.get('json_extract'),original=action.execute;action.execute=(params,ctx)=>params.pointer==='/slow'?new Promise(resolve=>{window.__late=resolve;ctx.signal.addEventListener('abort',()=>window.__cancelled=true,{once:true});}):original(params,ctx);});
  await page.locator('[data-step-id="pick"] [data-param="pointer"]').fill('/slow');await page.locator('#wfRun').click();await page.waitForFunction(()=>!!window.__late);
  await page.locator('#wfCancel').click();await page.waitForFunction(()=>!document.getElementById('wfRun').disabled);assert.equal(await page.evaluate(()=>__cancelled),true);
  await page.evaluate(()=>__late({success:true,data:{result:'LATE_MUST_NOT_APPEAR'}}));assert.doesNotMatch(await page.locator('#wfResult').textContent(),/LATE_MUST_NOT_APPEAR/);
  const beforeCancelResume=await page.evaluate(()=>__formatCalls);await page.locator('[data-step-id="pick"] [data-param="pointer"]').fill('/name');await page.locator('#wfResume').click();await page.waitForFunction(()=>!document.getElementById('wfRun').disabled);assert.equal(await page.evaluate(()=>__formatCalls),beforeCancelResume);
  const sourceGuard=await page.evaluate(async()=>{
    const manual=(await AgentWorkflow.listRuns()).runs.find(r=>r.source==='studio');
    const denied=await _AGENT_ALL_ACTIONS.get('resume_workflow').execute({runId:manual.id});
    const assistant=await _AGENT_ALL_ACTIONS.get('run_workflow').execute({steps:[{id:'bad',action:'json_format',params:{input:'not json'}}]});
    const list=await _AGENT_ALL_ACTIONS.get('list_workflow_runs').execute({});return{denied:denied.success,listed:list.data.runs.map(r=>r.id),assistant:assistant.runId,manual:manual.id};
  });assert.equal(sourceGuard.denied,false);assert.ok(sourceGuard.listed.includes(sourceGuard.assistant));assert.ok(!sourceGuard.listed.includes(sourceGuard.manual));
  await page.locator('#wfRefreshHistory').click();
  const download=page.waitForEvent('download');await page.locator('#wfExportRuns').click();const text=fs.readFileSync(await(await download).path(),'utf8');assert.doesNotMatch(text,/SYNTHETIC_WORKFLOW_SECRET|"params"|"result"/);assert.ok(JSON.parse(text).items.length>=3);

  await page.locator('[data-step-id="pick"] [data-param="pointer"]').fill('/missing');await run();
  const reloadId=await page.evaluate(async()=> (await AgentWorkflow.listRuns()).runs.find(r=>r.source==='studio'&&r.status==='failed').id);
  await page.reload();await page.locator('#wfRunList').waitFor();await page.locator(`[data-run-id="${reloadId}"] > summary`).click();
  assert.equal(await page.locator(`[data-load-run="${reloadId}"]`).count(),0);assert.match(await page.locator(`[data-run-id="${reloadId}"]`).textContent(),/过期|刷新/);

  const other=await context.newPage();await other.goto(url+'#home');await other.evaluate(()=>_agEnsureLoaded());
  const activeId=await other.evaluate(async()=>{const action=_AGENT_ALL_ACTIONS.get('json_format');action.execute=()=>new Promise(resolve=>window.__complete=resolve);window.__pending=AgentWorkflow.run({steps:[{id:'waiting',action:'json_format',params:{input:'{}'}}]},{source:'studio',name:'Other tab running'});while(!window.__complete)await new Promise(r=>setTimeout(r,0));return(await AgentWorkflow.listRuns()).runs.find(r=>r.status==='running').id;});
  await page.locator('#wfRefreshHistory').click();await page.locator(`[data-run-id="${activeId}"]`).waitFor();
  page.once('dialog',d=>d.accept());await page.locator('#wfClearRuns').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('dtb_workflow_runs')).items.length===1);assert.equal(await page.evaluate(id=>JSON.parse(localStorage.getItem('dtb_workflow_runs')).items[0].id===id,activeId),true);
  await other.evaluate(async()=>{__complete({success:true,data:{result:'{}'}});await __pending;});await other.close();
  const quota=await page.evaluate(async()=>{const write=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='dtb_workflow_runs')throw new DOMException('Full','QuotaExceededError');return write.call(this,k,v);};try{return await AgentWorkflow.run({steps:[{id:'format',action:'json_format',params:{input:'{"ok":true}'}}]},{source:'studio',name:'<img data-run-xss src=x onerror=alert(1)>'});}finally{Storage.prototype.setItem=write;}});
  assert.equal(quota.success,true);assert.equal(quota.historySaved,false);await page.locator('#wfRefreshHistory').click();assert.equal(await page.locator('[data-run-xss]').count(),0);
  await page.evaluate(()=>setLang('en'));await page.getByRole('button',{name:'Preview plan',exact:true}).waitFor();await page.locator('#wfPreviewButton').click();
  for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  if(process.env.TEST_SCREENSHOTS){fs.mkdirSync(process.env.TEST_SCREENSHOTS,{recursive:true});await page.locator('#wfPlan').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.TEST_SCREENSHOTS,'workflow-preview.png')});await page.setViewportSize({width:375,height:900});await page.locator('#wfRunList').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.TEST_SCREENSHOTS,'workflow-runs-mobile.png')});}
  assert.deepEqual(errors,[]);console.log('PASS: inert previews, prefix reuse/correction guards, cancelled/late results, history reload and export, cross-tab active-run protection, quota fallback, assistant ownership, bilingual mobile UI');
 }finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));if(temp)fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
