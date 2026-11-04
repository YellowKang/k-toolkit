const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function setup(){const c={console,TextDecoder,TextEncoder,Blob,File,Response,ReadableStream,DOMException,AbortController,getCurrentLang:()=> 'en'};c.window=c;c.self=c;vm.createContext(c);for(const name of ['compute/json-text.js','compute/http-response.js','compute/schema-mock.js','vendor/ajv/ajv7.min.js','vendor/ajv-formats/formats.js','tools/schema-worker.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',name),'utf8'),c,{filename:name});return c;}
const plain=x=>JSON.parse(JSON.stringify(x));
test('HTTP retains full raw UTF-8 and exact numbers independently of formatted previews',async()=>{
 const c=setup(),raw=' {"id":9223372036854775807,"value":0.1234567890123456789,"text":"中文🙂"}\n';
 const r=await c.KCompute['http-response'].read(new Response(raw));
 assert.equal(r.raw,raw);assert.equal(r.isJson,true);assert.match(r.formatted,/9223372036854775807/);assert.match(r.formatted,/0\.1234567890123456789/);
 assert.equal(r.bytes,Buffer.byteLength(raw));
 assert.equal((await c.KCompute['http-response'].read(new Response('x'.repeat(1000001)))).raw.length,1000001);
 assert.equal((await c.KCompute['http-response'].read(new Response(''))).raw,'');
});
test('HTTP enforces actual streamed bytes, declared lengths, invalid UTF-8 and cancellation',async()=>{
 const c=setup();let cancelled=false;
 const source=new ReadableStream({pull(controller){controller.enqueue(new Uint8Array(64));},cancel(){cancelled=true;}});
 await assert.rejects(c.KCompute['http-response'].read(new Response(source),{maxBytes:100}),/exceeds/);assert.equal(cancelled,true);
 await assert.rejects(c.KCompute['http-response'].read(new Response('small',{headers:{'content-length':'999'}}),{maxBytes:100}),/exceeds/);
 await assert.rejects(c.KCompute['http-response'].read(new Response(new Uint8Array([255]))),/UTF-8/);
 const controller=new AbortController();controller.abort();await assert.rejects(c.KCompute['http-response'].read(new Response('x'),{signal:controller.signal}),e=>e.name==='AbortError');
});
const schema={type:'object',additionalProperties:false,required:['id','state','profile','tags'],properties:{id:{type:'integer',minimum:100,maximum:999},state:{enum:['active','pending']},profile:{$ref:'#/definitions/Profile'},tags:{type:'array',minItems:2,maxItems:3,uniqueItems:true,items:{enum:['red','green','blue','yellow']}},optional:{type:['string','null']},fixed:{const:0}},definitions:{Profile:{type:'object',required:['email'],additionalProperties:false,properties:{email:{type:'string',format:'email'},enabled:{type:'boolean'}}}}};
test('Schema Mock is seeded, validates every nested sample and produces usable structural types',()=>{
 const c=setup(),run=options=>c.schemaMock({schema:JSON.stringify(schema),lang:'en',...options});
 const a=run({seed:'same',count:20}),b=run({seed:'same',count:20}),other=run({seed:'other',count:20});
 assert.equal(a.result,b.result);assert.notEqual(a.result,other.result);
 const values=JSON.parse(a.result);assert.equal(values.length,20);
 for(const value of values)assert.equal(c.schemaValidate({input:JSON.stringify(value),schema:JSON.stringify(schema)}).valid,true);
 assert.match(a.typescript,/"optional"\?: string \| null/);assert.match(a.typescript,/"id": number/);assert.match(a.typescript,/"email": string/);
  assert.doesNotThrow(()=>require('esbuild').transformSync(a.typescript,{loader:'ts'}));
 const required=JSON.parse(run({seed:'same',count:1,includeOptional:false}).result)[0];assert.equal(Object.hasOwn(required,'optional'),false);assert.equal(Object.hasOwn(required.profile,'enabled'),false);
 assert.equal({}.polluted,undefined);
});
test('Schema Mock supports scalar, tuple, union and boundary constraints without accepting impossible output',()=>{
 const c=setup();
 for(const rules of [true,{const:false},{enum:[null,0,'']},{type:'number',minimum:3,maximum:3},{type:'integer',exclusiveMinimum:2,exclusiveMaximum:4},{type:'integer',multipleOf:5,minimum:5,maximum:30},{type:'string',minLength:0,maxLength:0},{type:'array',minItems:2,maxItems:2,items:[{const:1},{const:'x'}],additionalItems:false},{anyOf:[{type:'integer',minimum:0,maximum:5},{type:'null'}]},{oneOf:[{type:'string'},{type:'boolean'}]},JSON.parse('{"type":"object","required":["constructor"],"properties":{"constructor":{"const":"safe"}},"additionalProperties":false}')]) {
   const text=JSON.stringify(rules),result=c.schemaMock({schema:text,count:10,seed:'boundary'});
   for(const value of JSON.parse(result.result))assert.equal(c.schemaValidate({input:JSON.stringify(value),schema:text}).valid,true,text);
 }
 for(const format of ['uuid','date','date-time','uri','hostname','ipv4']){const text=JSON.stringify({type:'string',format}),r=c.schemaMock({schema:text,count:4});for(const v of JSON.parse(r.result))assert.equal(c.schemaValidate({input:JSON.stringify(v),schema:text}).valid,true);}
 for(const rules of [false,{type:'integer',minimum:5,maximum:4},{type:'array',minItems:2,uniqueItems:true,items:{const:1}},{type:'string',pattern:'^a+$'},{allOf:[{type:'string'}]},{$ref:'https://remote.invalid/schema'},{$ref:'#/definitions/Loop',definitions:{Loop:{$ref:'#/definitions/Loop'}}}])assert.throws(()=>c.schemaMock({schema:JSON.stringify(rules)}));
 assert.throws(()=>c.schemaMock({schema:'{"const":9223372036854775807}'}),/safely representable/);
 assert.throws(()=>c.schemaMock({schema:'{"type":"object","properties":{"__proto__":{"const":"safe"}}}'}),/current validator/);
 assert.throws(()=>c.schemaMock({schema:'{}',count:101}));
  for(const rules of [{type:'integer',minimum:9007199254740991,maximum:9007199254740991},{type:'number',minimum:.001,maximum:.002}]) {
    const text=JSON.stringify(rules),r=c.schemaMock({schema:text,count:10});
    for(const value of JSON.parse(r.result))assert.equal(c.schemaValidate({input:JSON.stringify(value),schema:text}).valid,true);
  }
});
