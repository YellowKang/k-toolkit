const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { webcrypto, createHash, createHmac } = require('node:crypto');
function setup() {
 const context={window:{},crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,URL,AbortController,btoa,atob,setTimeout,clearTimeout,console};
 vm.createContext(context);
 for(const file of ['tool-compute.js','compute/url.js','agent/actions/text.js','agent/actions/dev.js','agent/actions/composite.js','agent/actions/data.js','agent/agent-workflow.js','agent/actions/index.js','agent/agent-core.js','agent/agent-cmd-parser.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),context,{filename:file});
 context.window.AgentActions.registerActions();
 return {window:context.window,action:name=>context.window._AGENT_ALL_ACTIONS.get(name),context};
}
const normalize = value => JSON.parse(JSON.stringify(value));
test('MD5 matches standard vectors, Unicode and padding boundaries', async()=>{
 const {window}=setup();
 for(const text of ['', 'abc','message digest','中文🙂','x'.repeat(55),'x'.repeat(56),'x'.repeat(64),'x'.repeat(1000)])assert.equal(window._simpleMD5(text),createHash('md5').update(text).digest('hex'));
});
test('legacy text pipeline preserves s, Unicode and stops after failure', async()=>{
 const {action}=setup();
 const convert=await action('text_pipeline').execute({input:'some status',steps:['to_snake']});assert.equal(convert.data.result,'some_status');
 const reverse=await action('text_pipeline').execute({input:'A🙂',steps:['reverse']});assert.equal(reverse.data.result,'🙂A');
 const failed=await action('text_pipeline').execute({input:'not json',steps:['json_format','base64_encode']});assert.equal(failed.success,false);assert.equal(failed.data.steps.length,1);
 const invalid=await action('text_pipeline').execute({input:'abc',steps:['imaginary']});assert.equal(invalid.success,false);
});
test('shared text operations cover Unicode, acronyms, empty values and line cleaning',()=>{
 const {window}=setup(), c=window.ToolCompute;
 for(const text of ['', '中文🙂 some status\n', '\u0000'])assert.equal(c.base64Decode(c.base64Encode(text,true)),text);
 assert.equal(c.caseConvert('HTTPServer some.status','snake'),'http_server_some_status');
 assert.equal(c.caseConvert('   ','camel'),'');
 assert.deepEqual(normalize(c.processLines(' b \r\na\r\n b\n \n',{trim:true,removeEmpty:true,deduplicate:true,sort:'asc'})),{result:'a\nb',inputLines:5,outputLines:2,removed:3});
});
test('JSON extraction preserves scalar types, escaped keys and rejects missing or malformed paths',()=>{
 const {action}=setup();const extract=action('json_extract');
 const input='{"a/b":{"~key":[false,0,null,"",{"x":1}]}}';
 for(const [index,value]of [false,0,null,'',{x:1}].entries())assert.deepEqual(normalize(extract.execute({input,pointer:'/a~1b/~0key/'+index}).data.value),value);
 for(const pointer of ['/a~1b/~0key/01','/a~1b/~0key/length','/missing','/bad~2escape','a'])assert.equal(extract.execute({input,pointer}).success,false,pointer);
 assert.deepEqual(normalize(extract.execute({input:'{"__proto__":7}',pointer:'/__proto__'}).data.value),7);
});
test('HMAC and hash actions return independently verified digests',async()=>{
 const {action}=setup();
 for(const algo of ['SHA-1','SHA-256','SHA-384','SHA-512']) {
 const result=await action('hmac_generate').execute({text:'中文 workflow payload',key:'fixture-key',algo});assert.equal(result.data.hash,createHmac(algo.replace('-','').toLowerCase(),'fixture-key').update('中文 workflow payload').digest('hex'));
 }
 assert.equal((await action('hash_generate').execute({text:'abc',algo:'MD5'})).data.hash,'900150983cd24fb0d6963f7d28e17f72');
});
test('workflow composes decode → extract → format → hash using actual referenced values',async()=>{
 const {window}=setup();const progress=[];
 const input=window.ToolCompute.base64Encode('{"payload":{"some":"中文","n":0}}');
 const result=await window.AgentWorkflow.run({steps:[
  {id:'decode',action:'base64_decode',params:{encoded:input}},
  {id:'extract',action:'json_extract',params:{input:{$ref:'decode.data.result'},pointer:'/payload'}},
  {id:'format',action:'json_format',params:{input:{$ref:'extract.data.result'},minify:true}},
  {id:'hash',action:'hash_generate',params:{text:{$ref:'format.data.result'}}},
 ]},{onProgress:p=>progress.push(p)});
 assert.equal(result.success,true);assert.equal(result.data.result.hash,createHash('sha256').update('{"some":"中文","n":0}').digest('hex'));assert.equal(result.data.completed,4);assert.equal(progress.filter(p=>p.state==='completed').length,4);
 assert.equal(JSON.stringify(result.data.steps).includes('中文'),false,'step trace must not repeat input/output data');
});
test('workflow returns requested intermediate outputs once, within its combined limit',async()=>{
 const {window,action}=setup();let executions=0;const original=action('json_format').execute;
 action('json_format').execute=p=>{executions++;return original(p)};
 const steps=[{id:'json',action:'json_format',params:{input:'{ "ok": true }',minify:true}},{id:'hash',action:'hash_generate',params:{text:{$ref:'json.data.result'}}}];
 const result=await window.AgentWorkflow.run({steps,returnSteps:['json','hash']});
 assert.equal(result.success,true);assert.equal(executions,1);assert.equal(result.data.outputs.json.result,'{"ok":true}');assert.equal(result.data.outputs.hash.hash,result.data.result.hash);
 for(const returnSteps of [['missing'],['json','json'],'json',['__proto__']])assert.equal((await window.AgentWorkflow.run({steps,returnSteps})).success,false);
 assert.equal(executions,1,'invalid selection must fail before execution');
 action('base64_encode').execute=()=>({success:true,data:{result:'x'.repeat(33000)}});
 const large=await window.AgentWorkflow.run({steps:[{id:'one',action:'base64_encode',params:{text:'x'}}],returnSteps:['one']});
 assert.equal(large.success,false);assert.match(large.error,/65536/);
});
test('invalid plans are rejected before executing anything',async()=>{
 const {window,action}=setup();let executed=0;const original=action('base64_encode').execute;action('base64_encode').execute=p=>{executed++;return original(p)};
 const first={id:'encode',action:'base64_encode',params:{text:'valid'}};
 const bad=[
  [first,{...first}],
  [first,{id:'next',action:'navigate_to_tool',params:{id:'hash'}}],
  [first,{id:'next',action:'run_workflow',params:{steps:[]}}],
  [first,{id:'next',action:'base64_encode',params:{text:{$ref:'future.data.result'}}}],
  [first,{id:'next',action:'base64_encode',params:{text:{$ref:'encode.data.constructor'}}}],
  [first,{id:'next',action:'base64_encode',params:{text:{$ref:'encode.data.result',extra:1}}}],
  [first,{id:'next',action:'base64_encode',params:JSON.parse('{"__proto__":{},"text":"x"}')}],
  Array.from({length:13},(_,i)=>({...first,id:'step'+i})),
 ];
 for(const steps of bad)assert.equal((await window.AgentWorkflow.run({steps})).success,false);
 assert.equal(executed,0);
});
test('runtime checks resolved types and missing fields; a failed step blocks downstream work',async()=>{
 const {window,action}=setup();let hashed=0;action('hash_generate').execute=()=>{hashed++;return{success:true,data:{hash:'unexpected'}}};
 for(const ref of ['value.data.value','value.data.missing']){
  const result=await window.AgentWorkflow.run({steps:[
   {id:'value',action:'json_extract',params:{input:'false',pointer:''}},
   {id:'format',action:'json_format',params:{input:{$ref:ref}}},
   {id:'hash',action:'hash_generate',params:{text:'must not run'}},
  ]});assert.equal(result.success,false);assert.equal(result.data.failedStep,'format');assert.equal(result.data.completed,1);
 }
 const invalid=await window.AgentWorkflow.run({steps:[{id:'format',action:'json_format',params:{input:'broken'}},{id:'hash',action:'hash_generate',params:{text:'must not run'}}]});assert.equal(invalid.success,false);assert.equal(invalid.data.failedStep,'format');assert.equal(hashed,0);
});
test('cancellation and output limits stop the chain without a success result',async()=>{
 const {window,action}=setup();const controller=new AbortController();let executions=0;
 const original=action('base64_encode').execute;action('base64_encode').execute=p=>{executions++;return original(p)};
 const steps=[{id:'one',action:'base64_encode',params:{text:'hello'}},{id:'two',action:'base64_encode',params:{text:{$ref:'one.data.result'}}}];
 const cancelled=await window.AgentWorkflow.run({steps},{signal:controller.signal,onProgress:p=>{if(p.state==='completed')controller.abort()}});
 assert.equal(cancelled.success,false);assert.equal(executions,1);
 const tooLarge=await window.AgentWorkflow.run({steps:[{...steps[0],params:{text:'x'.repeat(50000)}}]});assert.equal(tooLarge.success,false);assert.match(tooLarge.error,/65536/);
});
test('batch conversion reports partial failure and refuses silent truncation',async()=>{
 const {action}=setup();const batch=action('batch_convert');
 assert.equal((await batch.execute({inputs:['{"ok":true}','invalid'],operation:'json_format'})).success,false);
 assert.equal((await batch.execute({inputs:Array(51).fill('x'),operation:'base64_encode'})).success,false);
});
test('local templates preserve multiline input and never call a model',async()=>{
 const {window,context}=setup();context.location={protocol:'https:'};let called=0;
 const session=new window.AgentSession({adapter:{id:'fixture',chat:()=>{called++;throw new Error('must be local')}},config:{}});
 const command=window.CmdParser.parse('/workflow clean-base64  beta \nalpha\n beta\n');assert.equal(command.params.input,' beta \nalpha\n beta\n');
 const events=[];session.on('tool_progress',p=>events.push(p));
 const result=await session.executeLocal(command.action,command.params);assert.equal(result.success,true);assert.equal(window.ToolCompute.base64Decode(result.data.result.result),'beta\nalpha');assert.equal(called,0);assert.equal(events.at(-1).completed,2);
 const listing=await session.executeLocal('list_workflows',{});assert.equal(listing.data.templates.length,5);
 assert.equal((await session.executeLocal('run_workflow_template',{template:'decode-json',input:'bm90IGpzb24='})).success,false);
});
test('model discovers schemas and executes a referenced workflow without page navigation',async()=>{
 const {window,context}=setup();context.location={protocol:'https:'};let rounds=0;
 const workflow={steps:[{id:'json',action:'json_format',params:{input:'{"name":"some status"}'}},{id:'extract',action:'json_extract',params:{input:{$ref:'json.data.result'},pointer:'/name'}},{id:'case',action:'case_convert',params:{text:{$ref:'extract.data.result'},style:'snake'}}]};
 const search={name:'search_tools',parameters:{type:'object'},execute:()=>({success:true,data:{actions:[{id:'run_workflow',schema:window.WorkflowActions[0]}]}})};window._AGENT_ALL_ACTIONS.set('search_tools',search);
 const session=new window.AgentSession({adapter:{id:'fixture',chat:async request=>{
  rounds++;if(rounds===1)return{stop_reason:'tool_use',message:{role:'assistant',tool_calls:[{id:'search',function:{name:'search_tools',arguments:'{}'}}]}};
  if(rounds===2){assert.ok(request.tools.some(t=>t.name==='run_workflow'));return{stop_reason:'tool_use',message:{role:'assistant',tool_calls:[{id:'chain',function:{name:'run_workflow',arguments:JSON.stringify(workflow)}}]}};}assert.equal(JSON.parse(request.messages.at(-1).content).data.result.result,'some_status');return{stop_reason:'end',message:{role:'assistant',content:'done'}};
 }},config:{apiKey:'fixture'}});await session.send('extract and convert');assert.equal(rounds,3);
});
