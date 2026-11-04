/* Ajv runs in a disposable Worker so user-supplied patterns/recursive refs cannot block the UI. */
function schemaValidate({input,schema,lang='en'}) {
  const message=(zh,en)=>lang==='en'?en:zh;
  let data,rules;
  try{data=JSON.parse(input);}catch(error){throw new Error(message('输入 JSON 无效：','Invalid input JSON: ')+error.message);}
  try{rules=JSON.parse(schema);}catch(error){throw new Error(message('Schema JSON 无效：','Invalid schema JSON: ')+error.message);}
  let count=0;const stack=[[data,0],[rules,0]];
  while(stack.length){const [v,depth]=stack.pop();if(++count>60000||depth>64)throw new Error(message('结构超过 60,000 节点或 64 层限制','Structure exceeds 60,000 nodes or 64 levels'));if(v&&typeof v==='object')for(const item of Object.values(v))stack.push([item,depth+1]);}
  if(rules && typeof rules==='object' && rules.$async)throw new Error(message('仅支持同步 Draft-07 Schema','Only synchronous Draft-07 schemas are supported'));
  const ajv=new self.ajv7({strictSchema:true,strictTypes:false,strictTuples:false,allowMatchingProperties:true,allErrors:true,ownProperties:true,formats:self.AjvFormats,logger:false});
  let validate;
  try{validate=ajv.compile(rules);}catch(error){throw new Error(message('Schema 无效或包含不支持的规则/引用：','Invalid schema or unsupported rule/reference: ')+error.message);}
  const valid=validate(data),errors=validate.errors||[];
  return {valid,errors:errors.slice(0,100).map(e=>{
    const details=JSON.stringify(e.params),cut=details.length>2000||e.instancePath.length>2000;
    return {path:e.instancePath.slice(0,2000),keyword:e.keyword,message:e.message?.slice(0,500),params:details.length>2000?{preview:details.slice(0,2000),truncated:true}:e.params,...(cut?{detailsTruncated:true}:{})};
  }),errorCount:errors.length,truncated:errors.length>100};
}
function schemaMock({schema,seed='42',count=3,includeOptional=true,lang='en'}) {
  const message=(zh,en)=>lang==='en'?en:zh;
  if(typeof schema!=='string'||schema.length>200000)throw new Error(message('Schema 最多 200,000 字符。','Schema limit: 200,000 characters.'));
  const json=self.KCompute['json-text'];let nodes=0;
  function numeric(value,depth=0) {
    if(++nodes>50000||depth>64)throw new Error(message('Schema 结构超过限制。','Schema structure exceeds limits.'));
    if(json.isNumber(value)) {
      const n=Number(value.value);
      if(!Number.isFinite(n)||(Number.isInteger(n)&&!Number.isSafeInteger(n))||json.compareNumbers(value,n)!==0)throw new Error(message('Mock Schema 的数值必须可安全表示；大整数标识请使用字符串。','Mock schema numbers must be safely representable; use strings for large integer identifiers.'));
      return n;
    }
    if(Array.isArray(value))return value.map(v=>numeric(v,depth+1));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,numeric(v,depth+1)]));
    return value;
  }
  const rules=numeric(json.parse(schema));
  const ajv=new self.ajv7({strictSchema:true,strictTypes:false,strictTuples:false,allowMatchingProperties:true,allErrors:false,ownProperties:true,formats:self.AjvFormats,logger:false});
  const validate=ajv.compile(rules);
  return self.KCompute['schema-mock'].generate(rules,{seed,count,includeOptional,lang},validate);
}
self.onmessage=event=>{
  try {
    if(!self.ajv7)importScripts('../vendor/ajv/ajv7.min.js'+self.location.search,'../vendor/ajv-formats/formats.js'+self.location.search);
    if(event.data.operation==='mock') {
      self.window=self;
      if(!self.KCompute?.['schema-mock'])importScripts('../compute/json-text.js'+self.location.search,'../compute/schema-mock.js'+self.location.search);
      self.postMessage(schemaMock(event.data));
    } else self.postMessage(schemaValidate(event.data));
  } catch(error){self.postMessage({error:error.message});}
};
