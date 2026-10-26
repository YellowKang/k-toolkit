const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function setup(){const values=new Map(),c={console,TextDecoder,TextEncoder,Blob,File,URL,atob,btoa,AbortController,DOMException,setTimeout,clearTimeout,getCurrentLang:()=> 'en',crypto:crypto.webcrypto,localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};c.window=c;c.self=c;vm.createContext(c);for(const file of ['tool-compute.js','compute/date.js','compute/color.js','compute/ip.js','compute/csv.js','compute/file.js','file-session.js','agent/agent-context.js','agent/agent-result-store.js','agent/agent-core.js','agent/agent-workflow.js','agent/actions/calc.js','agent/actions/dev.js','agent/actions/text.js','agent/actions/convert.js','agent/actions/css-gen.js','agent/actions/general-files.js','agent/actions/index.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});c.AgentActions.registerActions();return c;}
const plain=x=>JSON.parse(JSON.stringify(x));
test('calendar actions use month-end clamping, leap dates, signed intervals and inclusive weekdays',async()=>{
 const c=setup(),d=c.KCompute.date;
 const r=d.diff('2024-01-31','2024-02-29');assert.equal(r.days,29);assert.equal(r.months,1);assert.equal(r.calendar.days,0);assert.equal(r.weekdays,22);
 assert.equal(d.diff('2024-02-29','2024-01-31').days,-29);assert.equal(d.diff('2024-03-09','2024-03-11').days,2);assert.equal(d.diff('0001-01-01','0001-01-02').days,1);
 for(const x of ['2023-02-29','2024-02-30','2024-13-01','2024-01-01T00:00:00Z','01/02/2024'])assert.throws(()=>d.diff(x,'2024-03-01'));
 assert.deepEqual(plain((await c.CalcActions.find(a=>a.name==='date_diff').execute({from:'2024-01-31',to:'2024-02-29'})).data),plain(r));
});
test('timestamps preserve integer micro/nanosecond boundaries and reject invalid dates or DST ambiguity',async()=>{
 const c=setup(),d=c.KCompute.date;
 assert.equal(d.timestamp('1700000000123999999',{unit:'ns'}).iso,'2023-11-14T22:13:20.123Z');assert.equal(d.timestamp('0',{unit:'ms'}).iso,'1970-01-01T00:00:00.000Z');assert.equal(d.timestamp('-1',{unit:'s'}).iso,'1969-12-31T23:59:59.000Z');assert.equal(d.timestamp('1000',{unit:'ms'}).milliseconds,1000);
 assert.equal(d.timestamp('2024-01-01T00:00:00.123+08:00',{direction:'toTs',unit:'ns'}).result,'1704038400123000000');
 assert.equal(d.timezone('2024-01-01T08:00','Asia/Shanghai','UTC').result,'2024-01-01 00:00:00');
 assert.throws(()=>d.instant('2024-03-10T02:30',{timeZone:'America/New_York'}),/does not exist/);assert.throws(()=>d.instant('2024-11-03T01:30',{timeZone:'America/New_York'}),/Ambiguous/);
 assert.equal(new Date(d.instant('2024-11-03T01:30',{timeZone:'America/New_York',disambiguation:'earlier'})).toISOString(),'2024-11-03T05:30:00.000Z');assert.equal(new Date(d.instant('2024-11-03T01:30',{timeZone:'America/New_York',disambiguation:'later'})).toISOString(),'2024-11-03T06:30:00.000Z');
 for(const input of ['2024-02-30T00:00:00Z','2024-01-01T24:00','2024-01-01T00:00+03:99','2024-01-01T12:60'])assert.throws(()=>d.instant(input));
 for(const value of ['', 'NaN','0xff','12tail','1e100'])assert.throws(()=>d.timestamp(value));
 assert.equal((await c.DevActions.find(a=>a.name==='timestamp_convert').execute({value:'1700000000123',direction:'toDate'})).data.iso,'2023-11-14T22:13:20.123Z');
});
test('strict shared color parser preserves alpha and checks negative hues and channel ranges',async()=>{
 const c=setup(),color=c.KCompute.color;
 for(const [input,expected]of [['#abc','#aabbcc'],['#abcd','#aabbccdd'],['#01020300','#01020300'],['rgba(255,0,0,0.5)','#ff000080'],['rgb(100% 0% 0% / 50%)','#ff000080'],['hsl(-120,100%,50%)','#0000ff'],['hsv(480,100%,100%)','#00ff00'],['cmyk(0%,100%,100%,0%)','#ff0000']])assert.equal(color.convert(input).result,expected,input);
 for(const input of ['rgb(-1,0,0)','rgb(256,0,0)','rgba(1,2,3,2)','#12345','prefix rgb(1,2,3)','hsl(20,101%,50%)','rgb(1,2)','rgb(1,2,3)tail'])assert.throws(()=>color.parse(input),input);
 assert.equal(color.convert('#0000',{to:'rgb'}).result,'rgba(0, 0, 0, 0)');assert.equal(color.contrast('#000','#fff'),21);assert.throws(()=>color.contrast('#0008','#fff'));
 const action=c.CalcActions.find(a=>a.name==='color_convert');assert.equal((await action.execute({input:'#abcd',to:'hex'})).data.result,'#aabbccdd');
 assert.equal((await c.CssGenActions.find(a=>a.name==='palette_generate').execute({color:'#abc',scheme:'triadic'})).data.colors.length,3);
});
test('IP actions reject partial prefixes and nondecimal octets, preserve /0 /31 /32 facts',async()=>{
 const c=setup(),ip=c.KCompute.ip;
 for(const input of ['1.2.3.4/24tail','1.2.3.4/24.5','1.2..4/24','1e1.2.3.4/24','1.2.3.4/33','01.2.3.4/24','1.2.3.4/024','1.2.3.4/24/1']){assert.throws(()=>ip.calculate(input),input);assert.equal((await c.CalcActions.find(a=>a.name==='ip_calc').execute({cidr:input})).success,false);}
 for(const[prefix,total,usable]of [[0,4294967296,4294967294],[24,256,254],[31,2,2],[32,1,1]]){const r=ip.calculate('192.168.1.1/'+prefix);assert.equal(r.totalHosts,total);assert.equal(r.usableHosts,usable);}
 assert.equal(ip.calculate('192.168.1.129/26').network,'192.168.1.128');assert.deepEqual(plain(ip.calculate('100.70.1.1/10').types),['cgnat']);
});
test('ordinary file references retain real bytes, UTF-8, safe names, limits and clear generations',async()=>{
 const c=setup(),pool=c.FileSession,file=new File(['id,n\n00123,2'],'ledger.csv',{type:'text/csv'}),meta=pool.replace([file])[0];assert.equal(pool.getFile(meta.id),file);
 const output=await c.KCompute.file.convert(file,'csv_to_json');const artifact=pool.addResult(output.blob,output.name);assert.deepEqual(JSON.parse(await pool.getFile(artifact.id).text()),[{id:'00123',n:'2'}]);
 const read=await c.GeneralFileActions.find(a=>a.name==='read_file').execute({fileId:artifact.id,offset:0,limit:8});assert.equal(read.data.nextOffset,8);assert.equal(read.data.truncated,true);
 await assert.rejects(c.KCompute.file.text(new File([Uint8Array.from([255,0])],'bad.bin')),/UTF-8/);
 const cancelled=new AbortController();cancelled.abort();await assert.rejects(c.KCompute.file.text(file,{signal:cancelled.signal}),/Cancelled/);
 const generation=pool.generation();pool.clear();assert.throws(()=>pool.getFile(meta.id),/expired/);assert.throws(()=>pool.addResult(new Blob(['x']),'x',generation),/expired/);
 pool.replace([file]);assert.throws(()=>pool.replace(Array(21).fill(file)));assert.equal(pool.list().length,1);
});
test('context budget preserves complete tool turns, original history and pinned notes',()=>{
 const c=setup(),history=[];for(let i=0;i<20;i++)history.push({role:'user',content:'u'+i+'x'.repeat(2000)},{role:'assistant',content:'',tool_calls:[{id:'c'+i,function:{name:'calculate',arguments:'{}'}}]},{role:'tool',tool_call_id:'c'+i,content:'{}'},{role:'assistant',content:'a'+i});
 history.push({role:'user',content:'latest'});const snapshot=JSON.stringify(history),r=c.AgentContext.build(history,{system:'system',note:'keep ID 00123',budget:5000,replyTokens:1000});
 assert.ok(r.stats.omittedTurns>0);assert.ok(r.stats.estimatedTokens<=5000);assert.equal(r.messages.at(-1).content,'latest');assert.match(r.messages[0].content,/00123/);assert.equal(r.messages[1].role,'user');assert.equal(JSON.stringify(history),snapshot);
 for(const message of r.messages.filter(m=>m.role==='tool'))assert.ok(r.messages.some(m=>m.tool_calls?.some(tc=>tc.id===message.tool_call_id)));
 assert.throws(()=>c.AgentContext.build([{role:'user',content:'中'.repeat(6000)}],{budget:5000,replyTokens:1000}),/current turn exceeds/);
 assert.equal(c.AgentContext.build(history,{budget:64000,maxTurns:2}).stats.sentTurns,2);
});
test('large result references preserve exact text, transform without retyping, and expire explicitly',async()=>{
 const c=setup(),text=JSON.stringify({id:'00123',path:'C:\\workspace',payload:'a'.repeat(10000)}),original={success:true,data:{result:text}},compact=c.AgentResultStore.compact(original);assert.ok(compact.resultId);assert.ok(JSON.stringify(compact).length<2200);assert.equal(c.AgentResultStore.field(compact.resultId),text);
 const action=c.ResultActions.find(a=>a.name==='transform_result'),result=await action.execute({resultId:compact.resultId,action:'json_format',params:{minify:true}});assert.equal(result.data.result,text);
 assert.throws(()=>c.AgentResultStore.field(compact.resultId,'data.__proto__'));
 c.AgentResultStore.clear();assert.throws(()=>c.AgentResultStore.get(compact.resultId),/expired/);assert.equal((await action.execute({resultId:compact.resultId,action:'json_format'})).success,false);
});
test('bounded context keeps tool call pairs valid through Chat, Responses, Claude and Gemini serializers',async()=>{
 const c=setup();c.Response=Response;c.Headers=Headers;c.TextDecoderStream=TextDecoderStream;
 for(const file of ['agent/agent-transport.js','agent/adapters/stream-utils.js','agent/adapters/openai-chat.js','agent/adapters/openai-response.js','agent/adapters/claude.js','agent/adapters/gemini.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});
 const history=[];for(let i=0;i<12;i++)history.push({role:'user',content:'x'.repeat(4000)},{role:'assistant',content:'',tool_calls:[{id:'call_'+i,type:'function',function:{name:'calculate',arguments:'{"expression":"2^3"}'}}]},{role:'tool',tool_call_id:'call_'+i,name:'calculate',content:'{"success":true,"data":{"result":8}}'},{role:'assistant',content:'8'});
 history.push({role:'user',content:'next'});const bounded=c.AgentContext.build(history,{system:'system',budget:5000,replyTokens:1000});assert.ok(bounded.stats.omittedTurns>0);
 for(const name of ['OpenAIChatAdapter','OpenAIResponseAdapter','ClaudeAdapter','GeminiAdapter']){
   let body;c.fetch=async(_url,options)=>{body=JSON.parse(options.body);return Response.json(name==='OpenAIResponseAdapter'?{status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'OK'}]}]}:name==='ClaudeAdapter'?{content:[{type:'text',text:'OK'}],stop_reason:'end_turn'}:{choices:[{message:{role:'assistant',content:'OK'},finish_reason:'stop'}]});};
   await c[name].chat({messages:bounded.messages,model:'fixture',baseUrl:'http://localhost:8080',apiKey:'fixture-only',signal:new AbortController().signal});
   if(name==='OpenAIResponseAdapter'){const calls=new Set(body.input.filter(x=>x.type==='function_call').map(x=>x.call_id));for(const output of body.input.filter(x=>x.type==='function_call_output'))assert.ok(calls.has(output.call_id));}
   else if(name==='ClaudeAdapter'){const blocks=body.messages.flatMap(x=>Array.isArray(x.content)?x.content:[]),calls=new Set(blocks.filter(x=>x.type==='tool_use').map(x=>x.id));for(const output of blocks.filter(x=>x.type==='tool_result'))assert.ok(calls.has(output.tool_use_id));}
   else{const calls=new Set(body.messages.flatMap(x=>x.tool_calls||[]).map(x=>x.id));for(const output of body.messages.filter(x=>x.role==='tool'))assert.ok(calls.has(output.tool_call_id));}
 }
 const a=c.AgentContext.estimate([{role:'user',content:[{type:'image_url',image_url:{url:'data:image/png;base64,'+'A'.repeat(400000)}}]}]),b=c.AgentContext.estimate([{role:'user',content:[{type:'image',source:{media_type:'image/png',data:'A'.repeat(400000)}}]}]);assert.ok(a<5000&&b<5000);assert.ok(a>4000&&b>4000);
});
test('model output limits offer a resumable retry without duplicating user messages or completed calls',async()=>{
 const c=setup();let calls=0,executions=0;const action=c._AGENT_ALL_ACTIONS.get('date_diff'),execute=action.execute;action.execute=async(...args)=>{executions++;return execute(...args);};
 const errors=[],session=new c.AgentSession({adapter:{chat:async()=>{
   calls++;
   if(calls===1)return {stop_reason:'tool_use',message:{role:'assistant',content:'',tool_calls:[{id:'date-1',type:'function',function:{name:'date_diff',arguments:JSON.stringify({from:'2024-01-31',to:'2024-02-29'})}}]}};
   if(calls===2)return {stop_reason:'max_tokens',message:{role:'assistant',content:'partial'}};
   return {stop_reason:'end',message:{role:'assistant',content:'complete'}};
 }},config:{apiKey:'fixture-only'}});
 session.on('error',e=>errors.push(e));await session.send('finish this');assert.equal(errors[0].reason,'max_tokens');assert.match(errors[0].message,/output limit/);assert.ok(session._retryState);assert.equal(session.messages.length,3);assert.equal(JSON.parse(session.messages.at(-1).content).data.days,29);
 await session.retryLast();assert.equal(session.messages.filter(m=>m.role==='user').length,1);assert.equal(session.messages.at(-1).content,'complete');assert.equal(executions,1);assert.equal(calls,3);
});
