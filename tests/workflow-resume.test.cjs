const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
function locks(){const tails=new Map(),held=new Set();return {async request(name,fn){const before=tails.get(name)||Promise.resolve();let release;const next=new Promise(r=>release=r);tails.set(name,next);await before;held.add(name);try{return await fn();}finally{held.delete(name);release();if(tails.get(name)===next)tails.delete(name);}},async query(){return{held:[...held].map(name=>({name})),pending:[]};}};}
function setup(shared={}) {
 const values=shared.values||new Map(),manager=shared.locks||locks();
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const c={console,crypto:webcrypto,localStorage:storage,navigator:{locks:manager},setTimeout,clearTimeout,AbortController,DOMException,TextEncoder,TextDecoder,Uint8Array,btoa,atob,getCurrentLang:()=> 'en'};c.window=c;vm.createContext(c);
 for(const file of ['tool-runtime.js','tool-compute.js','compute/json-text.js','compute/workflow-history.js','agent/actions/text.js','agent/actions/data.js','agent/agent-core.js','agent/agent-workflow.js','agent/actions/index.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});c.AgentActions.registerActions();
 return{c,values,storage,locks:manager,w:c.AgentWorkflow,h:c.KCompute['workflow-history']};
}
const plan=()=>({steps:[{id:'format',action:'json_format',params:{input:'{"name":"Ada"}',minify:true}},{id:'pick',action:'json_extract',params:{input:{$ref:'format.data.result'},pointer:'/missing'}}]});
test('preview is inert, masks secret parameters and describes real dependencies',()=>{
 const {c,w}=setup();let calls=0;c._AGENT_ALL_ACTIONS.get('json_format').execute=()=>calls++;
 const preview=w.preview(plan());assert.equal(calls,0);assert.equal(preview.steps[1].dependencies[0],'format');assert.equal(preview.total,2);
 const action={name:'hmac_generate',parameters:{type:'object',properties:{text:{type:'string'},key:{type:'string'}}},execute(){throw new Error('not called');}};c._AGENT_ALL_ACTIONS.set('hmac_generate',action);
 assert.doesNotMatch(JSON.stringify(w.preview({steps:[{id:'hmac',action:'hmac_generate',params:{text:'hello',key:'fixture-private-key'}}]})),/fixture-private-key/);
 c._AGENT_ALL_ACTIONS.set('sql_format',{parameters:{type:'object',properties:{input:{type:'string'},keywordCase:{type:'string'}}},execute(){throw new Error('preview must not execute');}});
 assert.equal(w.preview({steps:[{id:'sql',action:'sql_format',params:{input:'select 1',keywordCase:'lower'}}]}).steps[0].parameters.keywordCase,'lower');
});
test('resume reuses the completed prefix while accepting corrections only to unfinished steps',async()=>{
 const {c,w,h,values}=setup();const original=c._AGENT_ALL_ACTIONS.get('json_format').execute;let calls=0;c._AGENT_ALL_ACTIONS.get('json_format').execute=async p=>{calls++;return original(p);};
 const input=plan(),failed=await w.run(input,{source:'studio',name:'Extraction'});assert.equal(failed.success,false);assert.equal(failed.data.completed,1);assert.equal(failed.resumable,true);
 const changed=plan();changed.steps[0].params.input='{"name":"different"}';changed.steps[1].params.pointer='/name';
 assert.equal(w.resumeInfo(failed.runId,changed).canResume,false);assert.equal((await w.resume(failed.runId,changed,{source:'studio'})).success,false);assert.equal(calls,1);
 input.steps[1].params.pointer='/name';const result=await w.resume(failed.runId,input,{source:'studio'});
 assert.equal(result.success,true);assert.equal(result.data.result.result,'Ada');assert.equal(calls,1);assert.equal(result.runId,failed.runId);
 const history=await h.list();assert.equal(history[0].status,'completed');assert.equal(history[0].attempt,2);assert.equal(history[0].steps[0].reused,true);
 assert.doesNotMatch(values.get(h.KEY),/Ada|missing|"input"|"params"|"result"/);
});
test('cancelled steps discard late results and concurrent resumes cannot duplicate execution',async()=>{
 const {c,w}=setup();let finish,calls=0;
 c._AGENT_ALL_ACTIONS.get('json_extract').execute=()=>{calls++;return new Promise(resolve=>finish=resolve);};
 const controller=new AbortController(),running=w.run(plan(),{signal:controller.signal,onProgress:p=>{if(p.step==='pick'&&p.state==='running')setTimeout(()=>controller.abort(),0);}});
 const cancelled=await running;assert.equal(cancelled.success,false);assert.equal(cancelled.data.completed,1);finish({success:true,data:{result:'late'}});await new Promise(r=>setTimeout(r,0));
 const resumed=w.resume(cancelled.runId);const duplicate=await w.resume(cancelled.runId);assert.equal(duplicate.success,false);
 while(calls<2)await new Promise(r=>setTimeout(r,0));finish({success:true,data:{result:'current'}});
 assert.equal((await resumed).data.result.result,'current');assert.equal(calls,2);
});
test('per-step timeouts abort the actual action and remain recoverable',async()=>{
 const {c,w}=setup();let signal;
 c._AGENT_ALL_ACTIONS.get('json_extract').execute=(_p,context)=>{signal=context.signal;return new Promise(()=>{});};
 const failed=await w.run(plan(),{stepTimeoutMs:5});assert.equal(failed.errorCode,'timeout');assert.equal(signal.aborted,true);assert.equal(failed.resumable,true);
});
test('checkpoints are isolated from caller mutation and refuse changed action contracts',async()=>{
 const {c,w}=setup(),input=plan();
 const failed=await w.run(input,{onProgress:p=>{if(p.step==='format'&&p.state==='running')input.steps[0].params.input='changed outside';}});
 assert.equal(failed.data.completed,1);const checkpoint=w.checkpoint(failed.runId);assert.equal(checkpoint.plan.steps[0].params.input,'{"name":"Ada"}');
 checkpoint.plan.steps[0].params.input='tampered';assert.equal(w.checkpoint(failed.runId).plan.steps[0].params.input,'{"name":"Ada"}');
 c._AGENT_ALL_ACTIONS.get('json_format').execute=()=>({success:true,data:{result:'changed'}});
 assert.equal(w.resumeInfo(failed.runId).canResume,false);
});
test('assistant tooling cannot resume private manual runs, while same-source runs are available',async()=>{
 const {c,w}=setup(),manual=await w.run(plan(),{source:'studio'});
 const result=await c._AGENT_ALL_ACTIONS.get('resume_workflow').execute({runId:manual.runId});assert.equal(result.success,false);
 const assistant=await c._AGENT_ALL_ACTIONS.get('run_workflow').execute(plan());
 const listing=await c._AGENT_ALL_ACTIONS.get('list_workflow_runs').execute({});assert.equal(listing.data.runs.some(r=>r.id===manual.runId),false);assert.equal(listing.data.runs.some(r=>r.id===assistant.runId),true);
});
test('history persists across reloads without executable checkpoints and storage failures do not discard results',async()=>{
 const first=setup(),failed=await first.w.run(plan());const reloaded=setup(first);
 assert.equal((await reloaded.h.list()).length,1);assert.equal(reloaded.w.resumeInfo(failed.runId).canResume,false);
 first.storage.setItem=()=>{throw new Error('quota');};const good=await first.w.run({steps:[plan().steps[0]]});assert.equal(good.success,true);assert.equal(good.historySaved,false);
});
test('history merges concurrent tab writes, protects active rows, and caps retained summaries/checkpoints',async()=>{
 const a=setup(),b=setup(a);await Promise.all([a.w.run(plan()),b.w.run(plan())]);assert.equal((await a.h.list()).length,2);
 let oldest;for(let i=0;i<31;i++){const r=await a.w.run(plan());oldest ||= r.runId;}
 assert.equal((await a.h.list()).length,30);assert.equal(a.w.resumeInfo(oldest).canResume,false);
 const latest=(await a.h.list())[0];await a.h.withRunLock(latest.id,async()=>{await assert.rejects(a.h.remove(latest.id));await a.h.clear();assert.equal((await a.h.list()).length,1);});
 await a.h.clear();assert.equal((await a.h.list()).length,0);
});

test('run summaries round-trip through backups without executable data and merge by identity',async()=>{
 const {c,w,values,h}=setup();await w.run(plan());
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/compute/backup.js'),'utf8'),c);
 const original=JSON.parse(values.get(h.KEY)),dirty=JSON.parse(JSON.stringify(original));dirty.items[0].params={key:'fixture-private-key'};
 assert.equal(h.validEnvelope(dirty),false);
 const makeStorage=raw=>({length:1,key:()=>h.KEY,getItem:()=>raw});
 const backup=c.KCompute.backup,clean=backup.collect(makeStorage(JSON.stringify(dirty)),['tools']).backup;
 assert.doesNotMatch(JSON.stringify(clean),/fixture-private-key/);
 const exported=backup.collect(makeStorage(values.get(h.KEY)),['tools']).backup;
 const parsed=backup.parse(JSON.stringify(exported));assert.ok(parsed.data[h.KEY]);
 const merged=backup.plan(makeStorage(values.get(h.KEY)),parsed.data,{mode:'merge',groups:['tools']});assert.equal(merged.writes.length,0);
 const rejected=backup.parse(JSON.stringify({...exported,data:{[h.KEY]:JSON.stringify(dirty)}}));assert.equal(rejected.rejected.length,1);
});

test('unavailable Web Locks degrade to computation with a clear unsaved-history result',async()=>{
 const {c,w}=setup();c.navigator.locks.request=async()=>{throw new Error('unavailable');};
 const result=await w.run({steps:[plan().steps[0]]});assert.equal(result.success,true);assert.equal(result.historySaved,false);assert.match(result.historyWarning,/could not be saved/);
});

test('orphaned running summaries are shown as interrupted and never trusted as checkpoints',async()=>{
 const {w,h,values}=setup(),result=await w.run(plan()),record=(await h.list())[0];
 record.status='running';record.finishedAt=null;await h.upsert(record);
 assert.equal((await h.list())[0].status,'interrupted');
 const other=setup({values});assert.equal(other.w.resumeInfo(result.runId).canResume,false);
});

test('checkpoint memory is bounded even before reaching ten retained runs',async()=>{
 const {c,w}=setup();c._AGENT_ALL_ACTIONS.get('base64_encode').execute=()=>({success:true,data:{result:'x'.repeat(60000)}});
 const steps=Array.from({length:10},(_,i)=>({id:'s'+i,action:'base64_encode',params:{text:'small input'}}));steps.push({id:'bad',action:'json_format',params:{input:'broken'}});
 let first,last;for(let i=0;i<8;i++){const result=await w.run({steps});assert.equal(result.data.completed,10);first ||= result.runId;last=result.runId;}
 assert.equal(w.checkpoint(first),null);assert.ok(w.checkpoint(last));
});

test('at most four workflows can execute concurrently in one tab',async()=>{
 const {c,w}=setup(),finish=[];c._AGENT_ALL_ACTIONS.get('json_format').execute=()=>new Promise(resolve=>finish.push(resolve));
 const active=Array.from({length:4},()=>w.run({steps:[plan().steps[0]]}));
 for(let i=0;i<100&&finish.length<4;i++)await new Promise(resolve=>setTimeout(resolve,1));assert.equal(finish.length,4);
 assert.equal((await w.run({steps:[plan().steps[0]]})).success,false);
 finish.forEach(resolve=>resolve({success:true,data:{result:'{}'}}));for(const result of await Promise.all(active))assert.equal(result.success,true);
});
