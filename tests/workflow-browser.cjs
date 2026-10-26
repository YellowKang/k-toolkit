const {chromium,firefox}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {execFileSync}=require('node:child_process');const express=require('express');
(async()=>{
 let server,browser,temp;
 try {
  const root=path.resolve(__dirname,'..');let source=path.join(root,'public');
  if(process.env.TEST_BUILD==='1'){
   temp=fs.mkdtempSync(path.join(os.tmpdir(),'toolkit-workflow-'));
   for(const dir of ['public','scripts'])fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});
   execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe'});source=path.join(temp,'dist');
  }
  const app=express();app.use('/k-toolkit',express.static(source));server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
  const options={headless:true};if(process.env.TEST_BROWSER_CHANNEL)options.channel=process.env.TEST_BROWSER_CHANNEL;if(process.env.TEST_BROWSER_EXECUTABLE)options.executablePath=process.env.TEST_BROWSER_EXECUTABLE;
  browser=await(process.env.TEST_BROWSER==='firefox'?firefox:chromium).launch(options);
  const page=await browser.newPage({serviceWorkers:'block'});page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https:\/\//,route=>route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/k-toolkit/dashboard.html#base64`);
  await page.locator('#b64Input').fill('中文🙂 some status');await page.evaluate(()=>encodeB64());
  const pageBase64=await page.locator('#b64Output').textContent();
  await page.keyboard.press('Alt+a');await page.locator('#agInput').waitFor();
  const actionBase64=await page.evaluate(()=>_AGENT_ALL_ACTIONS.get('base64_encode').execute({text:'中文🙂 some status'}));assert.equal(actionBase64.data.result,pageBase64);
  await page.locator('[data-chip="chip_workflows"]').click();
  await page.locator('.ag-card.success').waitFor();assert.match(await page.locator('.ag-card').last().innerText(),/decode-json/);
  await page.locator('.ag-card button').filter({hasText:'clean-base64'}).click();assert.equal(await page.locator('#agInput').inputValue(),'/workflow clean-base64 ');
  const send=async text=>{const count=await page.locator('.ag-card').count();await page.locator('#agInput').fill(text);await page.locator('#agSendBtn').click();await page.waitForFunction(n=>{const cards=document.querySelectorAll('.ag-card');return cards.length===n+1&&cards[cards.length-1].matches('.success,.error')},count);};
  await send('/workflow clean-base64  beta \nalpha\n beta\n');assert.equal(await page.locator('.ag-card').last().locator('ol li').count(),2);
  assert.equal(await page.locator('.ag-workflow-preview').last().textContent(),Buffer.from('beta\nalpha').toString('base64'));
  await page.evaluate(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text}}})});
  await page.locator('.ag-card').last().getByRole('button',{name:'复制完整内容',exact:true}).click();assert.equal(await page.evaluate(()=>window.__copied),Buffer.from('beta\nalpha').toString('base64'));
  await send('/workflow decode-json bm90IGpzb24=');assert.ok(await page.locator('.ag-card').last().evaluate(el=>el.classList.contains('error')));assert.equal(await page.locator('.ag-card').last().locator('ol li').count(),2);
  await page.evaluate(()=>{const action=_AGENT_ALL_ACTIONS.get('base64_encode');window.__savedEncode=action.execute;action.execute=(_, {signal})=>new Promise(resolve=>signal.addEventListener('abort',()=>resolve({success:false,error:'cancelled'}),{once:true}));});
  await page.locator('#agInput').fill('/b64 stop test');await page.locator('#agSendBtn').click();await page.locator('#agStopBtn.visible').click();
  await page.waitForFunction(()=>document.querySelector('.ag-card:last-child')?.classList.contains('error') || !document.querySelector('.ag-card .ag-spin'));
  assert.match(await page.locator('.ag-card').last().innerText(),/已停止/);
  await page.evaluate(()=>{_AGENT_ALL_ACTIONS.get('base64_encode').execute=window.__savedEncode;});
  await send('/hash abc md5');assert.match(await page.locator('.ag-card').last().innerText(),/900150983cd24fb0d6963f7d28e17f72/);
  // Real registry/discovery + fake model transport, without a provider account.
  const chain=await page.evaluate(async()=>{
   let rounds=0;const session=new AgentSession({adapter:{id:'fixture',chat:async request=>{
    rounds++;
    if(rounds===1)return{stop_reason:'tool_use',message:{role:'assistant',tool_calls:[{id:'find',function:{name:'search_tools',arguments:'{"query":"run_workflow json_extract case_convert"}'}}]}};
    if(rounds===2){if(!request.tools.some(t=>t.name==='run_workflow'))throw new Error('Workflow not discovered');return{stop_reason:'tool_use',message:{role:'assistant',tool_calls:[{id:'run',function:{name:'run_workflow',arguments:JSON.stringify({steps:[{id:'pick',action:'json_extract',params:{input:'{"name":"HTTP Server"}',pointer:'/name'}},{id:'case',action:'case_convert',params:{text:{$ref:'pick.data.result'},style:'snake'}}]})}}]}};}
    return{stop_reason:'end',message:{role:'assistant',content:'done'}};
   }},config:{apiKey:'fixture'}});
   await session.send('提取字段并转换命名');return {rounds,result:JSON.parse(session.messages.find(m=>m.role==='tool'&&m.name==='run_workflow').content)};
  });assert.equal(chain.rounds,3);assert.equal(chain.result.data.result.result,'http_server');
  // Rendering result text must not interpret raw HTML or unsafe links.
  await page.evaluate(()=>{window.__injected=false;appendBubble('assistant','<span onclick="window.__injected=true">raw</span> [x](javascript:alert(1))');});
  assert.equal(await page.locator('#agMessages [onclick]').count(),0);assert.equal(await page.locator('#agMessages a[href^="javascript:"]').count(),0);
  await page.locator('#agCloseBtn').click();
  await page.evaluate(()=>navigateTo('line-sort'));await page.locator('#lsInput').fill(' b \r\na\n b\n');await page.locator('#lsClean').click();
  assert.equal(await page.locator('#lsOutput').inputValue(),'b\na');
  const read=await page.evaluate(()=>_AGENT_ALL_ACTIONS.get('read_tool_output').execute({toolId:'line-sort'}));assert.equal(read.data.result,'b\na');
  const lines=await page.evaluate(()=>_AGENT_ALL_ACTIONS.get('text_lines').execute({input:' b \r\na\n b\n',trim:true,removeEmpty:true,deduplicate:true}));assert.equal(lines.data.result,await page.locator('#lsOutput').inputValue());
  await page.evaluate(()=>navigateTo('case-convert'));await page.locator('#ccText').fill('HTTPServer some.status');
  assert.equal(await page.locator('#ccRow_snake').locator('span').nth(1).textContent(),'http_server_some_status');
  await page.locator('#ccText').fill('<img src=x onerror=alert(1)>');assert.equal(await page.locator('#ccAllRows img').count(),0);
  await page.evaluate(()=>setLang('en'));await page.evaluate(()=>navigateTo('line-sort'));await page.getByRole('button',{name:'Clean and sort',exact:true}).waitFor();
  await page.keyboard.press('Alt+a');await page.locator('#agInput').waitFor();
  for(const width of [375,768]){await page.setViewportSize({width,height:850});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  for(const card of await page.locator('.ag-card').all()) assert.ok((await card.boundingBox()).height > 70, 'result cards must not collapse in a long conversation');
  await page.locator('#agMessages').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
  if(process.env.TEST_SCREENSHOT)await page.screenshot({path:process.env.TEST_SCREENSHOT});
  assert.deepEqual(errors,[]);console.log('PASS: real Agent loading/discovery, local templates/cards/copy, failures, MD5, model workflow, safe rendering, shared page results, textarea reads, bilingual 375/768 layout');
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));if(temp)fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
