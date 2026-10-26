const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function setup(){const c={console,URL,URLSearchParams,TextEncoder,TextDecoder,atob,btoa,AbortController,setTimeout,clearTimeout,getCurrentLang:()=> 'en'};c.window=c;c.self=c;vm.createContext(c);for(const file of ['tool-compute.js','compute/math.js','compute/units.js','compute/url.js','compute/jwt.js','compute/csv.js','compute/schema.js','vendor/ajv/ajv7.min.js','vendor/ajv-formats/formats.js','tools/schema-worker.js','vendor/js-yaml/js-yaml.min.js','vendor/smol-toml/smol-toml.js','compute/formats.js','agent/actions/calc.js','agent/actions/dev.js','agent/actions/data.js','agent/actions/convert.js','agent/actions/text.js','agent/agent-core.js','agent/agent-workflow.js','agent/actions/index.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public',file),'utf8'),c,{filename:file});c.AgentActions.registerActions();return c;}
const plain=x=>JSON.parse(JSON.stringify(x));
test('math precedence, scientific functions and percent agree with independent numeric expectations',async()=>{
 const c=setup(),math=c.KCompute.math;
 for(const [expression,result] of [['2^3',8],['2^3^2',512],['-2^2',-4],['2^-2',.25],['(2+3)*4',20],['2+3*4-1',13],['50%',.5],['200*10%',20],['5 mod 2',1],['sqrt(9)+log10(100)+ln(e)',6],['1e-9*2',2e-9]]){assert.ok(Math.abs(math.evaluate(expression)-result)<1e-12,expression);assert.equal((await c._AGENT_ALL_ACTIONS.get('calculate').execute({expression})).data.result,math.evaluate(expression));}
 assert.ok(Math.abs(math.evaluate('sin(30)')-.5)<1e-14);assert.ok(Math.abs(math.evaluate('sin(pi/2)',{angle:'rad'})-1)<1e-14);
 for(const expression of ['1/0','sqrt(-1)','1e309','2**','2 3','constructor(1)','alert(1)','2;3','1<<2','('.repeat(65)+'1'+')'.repeat(65),'1'.repeat(4097)])assert.throws(()=>math.evaluate(expression),undefined,expression.slice(0,30));
});
test('unit action shares SI/IEC, tiny values, exact weights and all manual categories',async()=>{
 const c=setup(),convert=c.KCompute.units.convert,action=c._AGENT_ALL_ACTIONS.get('unit_convert');
 for(const [type,value,from,to,expected] of [['storage',1,'MB','B',1e6],['storage',1,'MiB','B',1048576],['storage',1,'KB','B',1000],['mass',1,'lb','g',453.59237],['length',.001,'mm','km',1e-9],['volume',1,'usgal','l',3.785411784],['area',1000,'ft2','m2',92.90304],['temp',-40,'F','C',-40]]){assert.equal(convert(type,value,from,to),expected);assert.equal((await action.execute({type,value,from,to})).data.result,expected);}
 assert.throws(()=>convert('temperature',1,'unknown','c'),/Unknown/);assert.throws(()=>convert('temperature',-1,'k','c'),/absolute/);assert.throws(()=>convert('length',Infinity,'m','km'),/finite/);
});
test('URL parsing and building preserve repeated/empty/special keys and exactly one decode',()=>{
 const url=setup().KCompute.url,input='https://example.com/p?tag=a&tag=b&q=100%25&nested=%252F&__proto__=x&constructor=y&=empty#frag',r=url.parse(input);
 assert.deepEqual(plain(r.params),JSON.parse('{"tag":["a","b"],"q":"100%","nested":"%2F","__proto__":"x","constructor":"y","":"empty"}'));
 assert.equal(r.entries.length,7);assert.equal(url.parse(url.build('https://example.com/p#frag',r.entries)).hash,'#frag');assert.deepEqual(plain(url.parse(url.build('https://example.com/p#frag',r.entries)).entries),plain(r.entries));
 assert.equal(url.parse('../x?q=1',{base:'https://example.com/a/b/'}).pathname,'/a/x');assert.throws(()=>url.parse('/relative'),/base/);
 assert.equal(url.build('https://example.com/?old=1#f',[{key:'q',value:'a+b c'}],{replace:true}),'https://example.com/?q=a%2Bb+c#f');
 for(const mode of ['component','uri','form']){const value=' a+b 中文🙂\n ';assert.equal(url.codec(url.codec(value,{mode}),{decode:true,mode}),value);}
 assert.equal(url.codec('a+b',{decode:true,mode:'component'}),'a+b');assert.equal(url.codec('a+b',{decode:true,mode:'form'}),'a b');assert.throws(()=>url.codec('%ZZ',{decode:true}),/Invalid/);
});
test('JWT UTF-8, NumericDate zero/boundaries and nbf never imply verified signatures',async()=>{
 const c=setup(),jwt=c.KCompute.jwt,encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url'),token=p=>encode({alg:'HS256',typ:'JWT'})+'.'+encode(p)+'.fixture';
 const r=jwt.decode(token({name:'中文🙂',iat:0,exp:100,nbf:50}),{now:100});assert.equal(r.payload.name,'中文🙂');assert.equal(r.expired,true);assert.equal(r.dates.iat,'1970-01-01T00:00:00.000Z');assert.equal(r.signatureVerified,false);
 assert.equal(jwt.decode(token({exp:0}),{now:0}).expired,true);assert.equal(jwt.decode(token({nbf:200}),{now:100}).timeStatus,'not-yet-valid');assert.equal(jwt.decode(token({}),{now:100}).timeStatus,'no-expiry');
 assert.throws(()=>jwt.decode(token({exp:'0'})),/NumericDate/);assert.throws(()=>jwt.decode(token([])),/objects/);
 assert.equal((await c._AGENT_ALL_ACTIONS.get('jwt_decode').execute({token:token({name:'中文',exp:0})})).data.expired,true);
});
test('CSV preserves colliding headers and prototype names, rejects flatten collisions and malformed quotes',async()=>{
 const c=setup(),csv=c.KCompute.csv;
 assert.deepEqual(plain(csv.toObjects(csv.parse('a,a,a_2,__proto__,constructor\n1,2,3,safe,ctor').rows)),[JSON.parse('{"a":"1","a_3":"2","a_2":"3","__proto__":"safe","constructor":"ctor"}')]);
 assert.equal(csv.stringify([JSON.parse('{"__proto__":"safe","constructor":"ctor"}')]),'__proto__,constructor\nsafe,ctor');
 assert.throws(()=>csv.stringify([{'a.b':1,a:{b:2}}]),/collision/);assert.throws(()=>csv.stringify([{a:{b:2},'a.b':1}]),/collision/);
 for(const input of ['a,"x"z','a,x"z','a,"x'])assert.throws(()=>csv.parse(input));
 const input='id;note\r\n00123;"first\nsecond;line"\r\n0;"100%"';
 const out=csv.convert(input,{direction:'csv2json'});assert.deepEqual(JSON.parse(out.result),[{id:'00123',note:'first\nsecond;line'},{id:'0',note:'100%'}]);assert.equal((await c._AGENT_ALL_ACTIONS.get('csv_to_json').execute({input})).data.result,out.result);
 assert.equal(csv.inferValue('9007199254740993e0'),'9007199254740993e0');assert.throws(()=>csv.parse('x\n'.repeat(20001)),/20,000/);
});
test('schema inference covers every sample, optional fields, mixed arrays and special property names',()=>{
 const c=setup();for(const value of [[{a:1},{a:null,b:true}],[],[1,'x',null,false],JSON.parse('{"__proto__":1,"constructor":"x"}'),0,false,null]){
  const input=JSON.stringify(value),r=c.KCompute.schema.infer(input),validation=c.schemaValidate({input,schema:r.result});assert.equal(validation.valid,true,JSON.stringify({value,validation}));
 }
 const schema=c.KCompute.schema.infer('[{"a":1},{"a":null,"b":true}]').schema;assert.deepEqual(plain(schema.items.required),['a']);assert.equal(schema.items.properties.a.anyOf.length,2);
});
test('Draft-07 validator checks constraints, formats, refs, unions, boolean schemas and unknown rules',()=>{
 const c=setup(),check=(data,schema)=>c.schemaValidate({input:JSON.stringify(data),schema:JSON.stringify(schema)});
 for(const [data,schema,keyword] of [[1,{minimum:10},'minimum'],[0,false,'false schema'],['bad',{format:'email'},'format'],[{age:2},{type:'object',properties:{age:{$ref:'#/definitions/adult'}},definitions:{adult:{type:'number',minimum:18}}},'minimum'],[{},{required:['constructor']},'required'],[[1,1],{uniqueItems:true},'uniqueItems'],['abc',{maxLength:2},'maxLength'],[2,{enum:[1,3]},'enum'],[{a:1},{additionalProperties:false},'additionalProperties'],[5,{oneOf:[{type:'number'},{minimum:0}]},'oneOf'],[{flag:true,n:2},{if:{properties:{flag:{const:true}}},then:{properties:{n:{minimum:3}}}},'minimum']]){const r=check(data,schema);assert.equal(r.valid,false,keyword);assert.ok(r.errors.some(e=>e.keyword===keyword),JSON.stringify(r));}
 const bounded=check('no',{enum:['x'.repeat(5000)]});assert.equal(bounded.errors[0].detailsTruncated,true);assert.ok(JSON.stringify(bounded).length<3000);
 assert.equal(check({x:'yes'},{properties:{x:{anyOf:[{type:'null'},{type:'string'}]}}}).valid,true);assert.equal(check(0,true).valid,true);
 assert.throws(()=>check(1,{minimun:3}),/unknown keyword/);assert.throws(()=>check(1,{$ref:'https://example.com/remote'}),/reference/);assert.throws(()=>check(1,{type:'invalid'}),/Invalid schema/);assert.throws(()=>check('a',{format:'unregistered'}),/unknown format/);
});
test('format aliases and nested structures have expansion budgets before workflow serialization',async()=>{
 const f=setup().KCompute.formats;
 await assert.rejects(f.yamlParse('a: &a [*a]'),/Cyclic/);let yaml='a: &a ["x","x","x","x","x","x","x","x","x","x"]\n';for(let i=0;i<5;i++)yaml+=String.fromCharCode(98+i)+': &'+String.fromCharCode(98+i)+' ['+Array(10).fill('*'+String.fromCharCode(97+i)).join(',')+']\n';await assert.rejects(f.yamlParse(yaml),/limit/);
});
test('new workflow actions compose CSV → JSON → schema and URL parse → build without lossy params',async()=>{
 const c=setup(),run=params=>c.AgentWorkflow.run(params);
 const r=await run({steps:[{id:'csv',action:'csv_to_json',params:{input:'a,a,a_2\n1,2,3'}},{id:'schema',action:'json_schema_generate',params:{input:{$ref:'csv.data.result'}}}],returnSteps:['csv','schema']});assert.equal(r.success,true,JSON.stringify(r));assert.equal(JSON.parse(r.data.outputs.csv.result)[0].a_3,'2');
 const u=await run({steps:[{id:'parse',action:'url_parse',params:{url:'https://example.com/?a=1&a=2'}},{id:'build',action:'url_build',params:{base:'https://example.org/#ok',entries:{$ref:'parse.data.entries'}}}]});assert.equal(u.data.result.result,'https://example.org/?a=1&a=2#ok');
 const y=await run({steps:[{id:'yaml',action:'yaml_to_json',params:{input:'foo: [1, 2]'}},{id:'toml',action:'json_to_toml',params:{input:{$ref:'yaml.data.result'}}}]});assert.equal(y.success,true,JSON.stringify(y));
});
