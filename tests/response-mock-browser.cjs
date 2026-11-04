const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const express=require('express');const {launchBrowser}=require('./browser-launch.cjs');
(async()=>{
  let browser,server,temp;
  try {
    const root=path.resolve(__dirname,'..');let source=path.join(root,'public');
    if(process.env.TEST_BUILD==='1'){temp=fs.mkdtempSync(path.join(os.tmpdir(),'k-toolkit-response-mock-'));for(const dir of ['public','scripts'])fs.cpSync(path.join(root,dir),path.join(temp,dir),{recursive:true});execFileSync(process.execPath,['scripts/build.js'],{cwd:temp,stdio:'pipe',env:{...process.env,NODE_PATH:path.join(root,'node_modules')}});source=path.join(temp,'dist');}
    const raw=' {"id":9223372036854775807,"amount":0.1234567890123456789,"text":"中文🙂","items":[false,0,null,""]}\n';
    const large='{"id":9223372036854775807,"payload":"'+'x'.repeat(90000)+'"}';
    const app=express();let aborted=0;
    app.get('/api/data',(_req,res)=>res.type('json').send(raw));app.get('/api/large',(_req,res)=>res.type('json').send(large));
    app.get('/api/error',(_req,res)=>res.status(422).type('json').send('{"error":"validation","id":9223372036854775807}'));
    app.get('/api/fail',(req)=>req.socket.destroy());app.get('/api/huge',(_req,res)=>res.type('text').send('x'.repeat(5*1024*1024+1)));
    app.get('/api/slow',(req,res)=>{res.type('json');res.write('{"late":');const timer=setTimeout(()=>res.end('true}'),1500);req.on('close',()=>{clearTimeout(timer);aborted++;});});
    app.use('/k-toolkit',express.static(source));server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base=`http://127.0.0.1:${server.address().port}`,url=base+'/k-toolkit/dashboard.html';
    browser=await launchBrowser();const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
    await context.route(/^https:\/\//,route=>route.abort());const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
    await page.goto(url+'#http-tester');await page.locator('#htUrl').waitFor();
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));
    const go=async(id,selector)=>{await page.evaluate(id=>navigateTo(id,false),id);await page.locator(selector).waitFor();};
    const send=async route=>{await page.locator('#htUrl').fill(base+route);await page.locator('#htSendBtn').click();await page.waitForFunction(()=>!document.getElementById('htSendBtn').disabled);};
    await page.locator('#htUrl').fill(base+'/api/data');
    await page.evaluate(async()=>{const pending=doHttpTest();_htController.abort();await pending;});
    assert.match(await page.locator('#htResBody').textContent(),/取消/,'cancelling while response helpers load still shows feedback');
    await send('/api/data');assert.match(await page.locator('#htResBody').textContent(),/9223372036854775807/);
    await page.locator('#htResponseView').selectOption('raw');await page.locator('#htCopyResponse').click();assert.equal(await page.evaluate(()=>__copied),raw);
    await page.locator('#htPointer').fill('/id');await page.evaluate(()=>htExtractField());assert.equal(await page.locator('#htFieldOutput').textContent(),'9223372036854775807');
    await page.locator('#htCopyField').click();assert.equal(await page.evaluate(()=>__copied),'9223372036854775807');
    for(const [pointer,value] of [['/items/0','false'],['/items/1','0'],['/items/2','null'],['/items/3','']]){await page.locator('#htPointer').fill(pointer);await page.evaluate(()=>htExtractField());assert.equal(await page.locator('#htCopyField').isEnabled(),true);await page.locator('#htCopyField').click();assert.equal(await page.evaluate(()=>__copied),value);}
    await page.locator('#htPointer').fill('/missing');await page.evaluate(()=>htExtractField());assert.equal(await page.locator('#htCopyField').isEnabled(),false);
    await page.locator('#htResponseTarget').selectOption('json-schema');await page.evaluate(()=>htHandoffResponse());await page.locator('#jsInput').waitFor();assert.equal(await page.locator('#jsInput').inputValue(),raw);
    await go('http-tester','#htUrl');await send('/api/data');await page.locator('#htResponseTarget').selectOption('diff-json');await page.evaluate(()=>htHandoffResponse());await page.locator('#djInputA').waitFor();assert.equal(await page.locator('#djInputA').inputValue(),raw);
    await go('http-tester','#htUrl');await send('/api/large');assert.ok((await page.locator('#htResBody').textContent()).length<=64000);
    await page.locator('#htResponseView').selectOption('raw');await page.locator('#htCopyResponse').click();assert.equal(await page.evaluate(()=>__copied),large);
    const downloaded=page.waitForEvent('download');await page.locator('#htDownloadResponse').click();assert.equal(fs.readFileSync(await(await downloaded).path(),'utf8'),large);
    await send('/api/error');assert.match(await page.locator('#htStatusBadge').textContent(),/422/);assert.equal(await page.locator('#htCopyResponse').isEnabled(),true);
    await send('/api/fail');assert.equal(await page.locator('#htCopyResponse').isEnabled(),false);assert.equal(await page.locator('#htDownloadResponse').isEnabled(),false);
    await send('/api/huge');assert.match(await page.locator('#htResBody').textContent(),/5 MiB/);assert.equal(await page.evaluate(()=>htResponse()),null);
    await page.locator('#htUrl').fill(base+'/api/slow');const started=page.waitForResponse(r=>r.url().endsWith('/api/slow'));await page.locator('#htSendBtn').click();await started;
    await page.locator('#htHeaders').fill('X-Changed: yes');await page.waitForFunction(()=>!document.getElementById('htSendBtn').disabled);assert.equal(await page.locator('#htResult').isVisible(),false);await page.waitForTimeout(100);assert.ok(aborted>0);
    await send('/api/data');
    for(const width of [375,768]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    if(process.env.TEST_SCREENSHOTS){fs.mkdirSync(process.env.TEST_SCREENSHOTS,{recursive:true});await page.setViewportSize({width:375,height:900});await page.locator('#htResponseTarget').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.TEST_SCREENSHOTS,'http-response-mobile.png')});}
    await page.setViewportSize({width:1440,height:1000});

    await go('mock-data','#mockSchemaMode');await page.locator('#mockSchemaMode').click();
    const schema={type:'object',additionalProperties:false,required:['id','status','tags'],properties:{id:{type:'integer',minimum:10,maximum:99},status:{enum:['active','pending']},tags:{type:'array',minItems:2,maxItems:3,uniqueItems:true,items:{enum:['a','b','c','d']}},profile:{type:'object',required:['email'],properties:{email:{type:'string',format:'email'}},additionalProperties:false}}};
    const schemaText=JSON.stringify(schema);await page.locator('#mockSchemaInput').fill(schemaText);await page.locator('#mockSchemaSeed').fill('regression');await page.locator('#mockSchemaCount').fill('8');
    const generate=async()=>{await page.locator('#mockSchemaGenerate').click();await page.waitForFunction(()=>!document.getElementById('mockSchemaGenerate').disabled);};
    await generate();assert.equal(await page.locator('#mockSchemaResult').isVisible(),true);
    const first=await page.locator('#mockSchemaOutput').textContent();assert.equal(JSON.parse(first).length,8);await generate();assert.equal(await page.locator('#mockSchemaOutput').textContent(),first);
    const valid=await page.evaluate(async({input,schema})=>{const compute=await ToolCompute.load('schema');for(const row of JSON.parse(input))if(!(await compute.validate(JSON.stringify(row),schema)).valid)return false;return true;},{input:first,schema:schemaText});assert.equal(valid,true);
    await page.locator('#mockSchemaView').selectOption('typescript');assert.match(await page.locator('#mockSchemaOutput').textContent(),/export type MockRecord/);assert.match(await page.locator('#mockSchemaOutput').textContent(),/"profile"\?/);
    const tsDownload=page.waitForEvent('download');await page.locator('#mockSchemaDownload').click();assert.match(fs.readFileSync(await(await tsDownload).path(),'utf8'),/"id": number/);
    await page.locator('#mockSchemaView').selectOption('result');await page.evaluate(()=>_agEnsureLoaded());
    const actions=await page.evaluate(async schema=>{const params={schema,seed:'regression',count:8,includeOptional:true};const direct=await _AGENT_ALL_ACTIONS.get('json_schema_mock').execute(params);const flow=await AgentWorkflow.run({steps:[{id:'mock',action:'json_schema_mock',params},{id:'first',action:'json_extract',params:{input:{$ref:'mock.data.result'},pointer:'/0'}}]});return{direct,flow};},schemaText);
    assert.equal(actions.direct.success,true);assert.equal(actions.direct.data.result,first);assert.equal(actions.flow.success,true);assert.deepEqual(JSON.parse(actions.flow.data.result.result),JSON.parse(first)[0]);
    await page.locator('#mockSchemaInput').fill('{"type":"string","pattern":"^a+$"}');assert.equal(await page.locator('#mockSchemaResult').isVisible(),false);await generate();assert.match(await page.locator('#mockSchemaStatus').textContent(),/pattern/);assert.equal(await page.locator('#mockSchemaResult').isVisible(),false);
    await page.locator('#mockSchemaInput').fill('{"type":"string","minLength":1000,"maxLength":1000}');await page.locator('#mockSchemaCount').fill('100');await generate();await page.locator('#mockSchemaCopy').click();assert.ok((await page.evaluate(()=>__copied)).length>64000);assert.equal((await page.locator('#mockSchemaOutput').textContent()).length,64000);
    await page.evaluate(()=>{document.getElementById('mockSchemaGenerate').click();document.getElementById('mockSchemaCancel').click();});assert.equal(await page.locator('#mockSchemaResult').isVisible(),false);assert.match(await page.locator('#mockSchemaStatus').textContent(),/取消/);
    const cancelled=await page.evaluate(async()=>{const c=new AbortController(),module=await ToolCompute.load('schema'),pending=module.mock('{}',{signal:c.signal});c.abort();try{await pending;return false;}catch(e){return e.name==='AbortError';}});assert.equal(cancelled,true);
    await page.evaluate(()=>setLang('en'));await page.locator('#mockSchemaMode').click();await page.locator('#mockSchemaSample').click();await generate();assert.match(await page.locator('#mockSchemaStatus').textContent(),/Generated and validated/);
    await page.evaluate(()=>{theme='light';applyTheme();});
    for(const width of [375,768,1440]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    if(process.env.TEST_SCREENSHOTS){await page.locator('#mockSchemaResult').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.TEST_SCREENSHOTS,'schema-mock-light.png')});}
    await page.locator('#mockSchemaHandoff').click();await page.locator('#jsonInput').waitFor();assert.equal(JSON.parse(await page.locator('#jsonInput').inputValue()).length,3);
    await go('workflow-studio','#wfAdd');assert.equal(await page.locator('[data-step-action] option[value="json_schema_mock"]').count()>0,true);
    assert.deepEqual(errors,[]);console.log('PASS: exact HTTP raw/preview/export/field/handoff, bounded and cancelled network reads, seeded validated Schema Mock, types, Agent/workflow, cancellation, bilingual mobile UI');
  } finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));if(temp)fs.rmSync(temp,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
