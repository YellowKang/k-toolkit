/* Deterministic, bounded Draft-07 sample generation. Validation is supplied by the Worker. */
(function () {
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const annotations=new Set(['$schema','$id','$comment','title','description','default','examples','readOnly','writeOnly','definitions']);
  const supported=new Set([...annotations,'$ref','type','enum','const','properties','required','additionalProperties','minProperties','maxProperties','items','additionalItems','minItems','maxItems','uniqueItems','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','minLength','maxLength','format','anyOf','oneOf']);
  const formats=new Set(['email','uuid','date','date-time','uri','hostname','ipv4']);
  function generate(rules,{seed='42',count=3,includeOptional=true,lang='en'}={},validate) {
    const say=(zh,en)=>lang==='en'?en:zh;
    const fail=(zh,en,code='generation')=>{throw Object.assign(new Error(say(zh,en)),{code});};
    if(!Number.isInteger(count)||count<1||count>100||typeof seed!=='string'||seed.length>128||typeof includeOptional!=='boolean')fail('需要 1–100 条样本，种子最多 128 字符。','Use 1–100 samples and a seed up to 128 characters.','limit');
    if(typeof validate!=='function')throw new Error('A compiled validator is required');
    let state=2166136261;
    for(let i=0;i<seed.length;i++)state=Math.imul(state^seed.charCodeAt(i),16777619)>>>0;
    const random=()=>{state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};
    const integer=(a,b)=>a+Math.floor(random()*(b-a+1));
    const clone=v=>JSON.parse(JSON.stringify(v));
    function reference(ref) {
      if(typeof ref!=='string'||!ref.startsWith('#/')||ref.length>1000)fail('Mock 仅支持非循环的本地 JSON Pointer 引用。','Mock supports non-recursive local JSON Pointer references only.','unsupported');
      let parts;try{parts=decodeURIComponent(ref.slice(2)).split('/');}catch{fail('引用无效。','Invalid reference.','unsupported');}
      let value=rules;
      for(const part of parts){if(/~(?![01])/u.test(part))fail('引用无效。','Invalid reference.','unsupported');const key=part.replace(/~1/g,'/').replace(/~0/g,'~');if(!value||typeof value!=='object'||!own(value,key))fail('未找到本地引用。','Local reference was not found.','unsupported');value=value[key];}
      return value;
    }
    let checked=0;
    function inspect(schema,path='#',depth=0,parents=new Set()) {
      if(++checked>5000||depth>20)fail('Schema 超过 5,000 个节点或 20 层限制。','Schema exceeds 5,000 nodes or 20 levels.','limit');
      if(typeof schema==='boolean')return;
      if(!schema||typeof schema!=='object'||Array.isArray(schema))fail('Schema 节点必须是对象或布尔值。','Schema nodes must be objects or booleans.','unsupported');
      if(parents.has(schema))fail('Mock 不支持循环引用。','Mock does not support recursive references.','unsupported');
      const next=new Set(parents);next.add(schema);
      for(const key of Object.keys(schema))if(!supported.has(key))fail('Mock 暂不支持规则 '+key+'（'+path+'）。','Mock does not support '+key+' ('+path+').','unsupported');
      if(depth && schema.$id)fail('Mock 暂不支持嵌套 $id。','Mock does not support nested $id.','unsupported');
      if(schema.format && !formats.has(schema.format))fail('Mock 暂不支持 format: '+schema.format,'Mock does not support format: '+schema.format,'unsupported');
      if(schema.$ref) {
        if(Object.keys(schema).some(k=>k!=='$ref'&&!annotations.has(k)))fail('$ref 旁仅允许注释字段。','Only annotation siblings are supported beside $ref.','unsupported');
        inspect(reference(schema.$ref),schema.$ref,depth+1,next);
      }
      for(const key of ['properties','definitions'])for(const [name,child] of Object.entries(schema[key]||{})) {
        if(key==='properties'&&name==='__proto__')fail('当前校验器不支持为 __proto__ 字段生成样本。','The current validator cannot generate samples for a __proto__ property.','unsupported');
        inspect(child,path+'/'+key+'/'+name,depth+1,next);
      }
      for(const key of ['items','additionalItems','additionalProperties'])if(own(schema,key)){const child=schema[key];if(Array.isArray(child))child.forEach((s,i)=>inspect(s,path+'/'+key+'/'+i,depth+1,next));else inspect(child,path+'/'+key,depth+1,next);}
      for(const key of ['anyOf','oneOf'])if(schema[key])schema[key].forEach((s,i)=>inspect(s,path+'/'+key+'/'+i,depth+1,next));
    }
    inspect(rules);
    const canonical=v=>v&&typeof v==='object'?JSON.stringify(Array.isArray(v)?v.map(x=>canonical(x)):Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]))):JSON.stringify(v);
    let work=0;
    function sample(schema,depth=0) {
      if(++work>50000||depth>24)fail('生成量超过限制，请减少样本或简化 Schema。','Generation limit reached; reduce count or simplify the schema.','limit');
      if(schema===false)fail('Schema 不接受任何值。','Schema accepts no values.');
      if(schema===true)schema={};
      if(schema.$ref)return sample(reference(schema.$ref),depth+1);
      if(own(schema,'const'))return clone(schema.const);
      if(schema.enum)return clone(schema.enum[integer(0,schema.enum.length-1)]);
      const alternatives=schema.oneOf||schema.anyOf;
      if(alternatives) {
        const base={...schema};delete base.oneOf;delete base.anyOf;
        const branch=alternatives[integer(0,alternatives.length-1)];
        if(branch===false)return sample(false,depth+1);
        return sample(branch===true?base:{...base,...branch,...((base.properties||branch.properties)?{properties:{...base.properties,...branch.properties}}:{}),...((base.required||branch.required)?{required:[...new Set([...(base.required||[]),...(branch.required||[])])]}:{})},depth+1);
      }
      let type=schema.type||(schema.properties||schema.required?'object':schema.items?'array':'string');
      if(Array.isArray(type))type=type[integer(0,type.length-1)];
      if(type==='null')return null;
      if(type==='boolean')return random()<.5;
      if(type==='object') {
        const result=Object.create(null),properties=schema.properties||{},required=[...new Set(schema.required||[])];
        const min=schema.minProperties??0,max=Math.min(1000,schema.maxProperties??Math.max(required.length,Object.keys(properties).length,min));
        if(min>1000||required.length>1000||max<required.length||min>max)fail('对象字段约束无法在限制内满足。','Object property constraints cannot be satisfied within the limits.');
        const names=required.slice(),optional=Object.keys(properties).filter(k=>!names.includes(k));
        for(const name of optional)if(names.length<max&&(includeOptional||names.length<min))names.push(name);
        let extra=1;while(names.length<min){if(schema.additionalProperties===false)fail('必需字段数量超出可用字段。','Too few available properties for minProperties.');const name='extra_'+extra++;if(!names.includes(name))names.push(name);}
        for(const name of names){const child=own(properties,name)?properties[name]:schema.additionalProperties??true;result[name]=sample(child,depth+1);}
        return result;
      }
      if(type==='array') {
        const tuple=Array.isArray(schema.items),min=schema.minItems??0;
        const max=Math.min(100,schema.maxItems??Math.max(min,tuple?schema.items.length:3),tuple&&schema.additionalItems===false?schema.items.length:100);
        if(min>100||max<min)fail('数组长度约束无法在 100 项内满足。','Array length constraints cannot be satisfied within 100 items.');
        const length=integer(min,Math.min(max,Math.max(min,tuple?schema.items.length:3))),values=[],seen=new Set();
        for(let i=0;i<length;i++) {
          const child=tuple?(schema.items[i]??schema.additionalItems??true):schema.items??true;
          let value,key,attempt=0;do{value=sample(child,depth+1);key=canonical(value);}while(schema.uniqueItems&&seen.has(key)&&++attempt<40);
          if(schema.uniqueItems&&seen.has(key))fail('无法生成足够的唯一数组项。','Cannot generate enough unique array items.');
          seen.add(key);values.push(value);
        }
        return values;
      }
      if(type==='number'||type==='integer') {
        const low=Math.max(schema.minimum??-Infinity,schema.exclusiveMinimum??-Infinity),high=Math.min(schema.maximum??Infinity,schema.exclusiveMaximum??Infinity);
        const min=Number.isFinite(low)?low:Number.isFinite(high)?high-100:0,max=Number.isFinite(high)?high:min+100;
        const step=schema.multipleOf??(type==='integer'?1:.01);
        if(!Number.isFinite(step)||step<=0||Math.max(Math.abs(min),Math.abs(max))>Number.MAX_SAFE_INTEGER)fail('Mock 数值范围必须可安全表示。','Mock numeric bounds must be safely representable.','unsupported');
        if(type==='number'&&schema.multipleOf===undefined) {
          if(min>max)fail('数值下限超过上限。','Numeric minimum exceeds maximum.');
          return min===max?min:min+(max-min)*random();
        }
        let a=Math.ceil(min/step-1e-10),b=Math.floor(max/step+1e-10);
        if(schema.exclusiveMinimum!==undefined&&a*step<=schema.exclusiveMinimum)a++;
        if(schema.exclusiveMaximum!==undefined&&b*step>=schema.exclusiveMaximum)b--;
        if(a>b||!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b-a>Number.MAX_SAFE_INTEGER)fail('数值约束无法在限制内满足。','Numeric constraints cannot be satisfied within the limits.');
        const product=integer(a,b)*step,value=Number.isSafeInteger(product)?product:Number(product.toPrecision(15));
        if(type==='integer'&&!Number.isSafeInteger(value))fail('无法生成符合要求的整数。','Could not generate an integer matching the constraints.');
        return value;
      }
      if(type==='string') {
        const min=schema.minLength??0,max=schema.maxLength??Math.max(min,16);
        if(min>1000||max<min)fail('字符串长度约束无法在 1,000 字符内满足。','String length constraints cannot be satisfied within 1,000 characters.');
        const letters=n=>Array.from({length:n},()=>String.fromCharCode(integer(97,122))).join('');
        if(schema.format==='uuid')return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>(c==='x'?integer(0,15):integer(8,11)).toString(16));
        if(schema.format==='ipv4')return [integer(1,223),integer(0,255),integer(0,255),integer(1,254)].join('.');
        if(['date','date-time'].includes(schema.format)){const date=new Date(Date.UTC(2024,0,1)+integer(0,365*86400)*1000).toISOString();return schema.format==='date'?date.slice(0,10):date;}
        if(schema.format==='email')return letters(integer(5,12))+'@example.test';
        if(schema.format==='hostname')return letters(integer(5,12))+'.example.test';
        if(schema.format==='uri')return 'https://example.test/'+letters(integer(5,12));
        return letters(integer(Math.max(min,Math.min(8,max)),Math.min(max,Math.max(min,16))));
      }
      fail('Mock 不支持类型 '+type,'Mock does not support type '+type,'unsupported');
    }
    const values=[];let chars=2;
    for(let i=0;i<count;i++) {
      let value,valid=false,last;
      for(let attempt=0;attempt<40;attempt++)try{value=sample(rules);if(validate(value)){valid=true;break;}}catch(error){if(error.code!=='generation')throw error;last=error;}
      if(!valid)fail('无法为当前约束生成有效样本，请简化约束。'+(last?' '+last.message:''),'Unable to generate a valid sample for these constraints; simplify the schema.'+(last?' '+last.message:''));
      chars+=JSON.stringify(value).length+1;if(chars>500000)fail('样本输出超过 500,000 字符，请减少条数。','Sample output exceeds 500,000 characters; reduce the count.','limit');values.push(value);
    }
    let typeNodes=0;
    function ts(s,depth=0) {
      if(++typeNodes>5000||depth>24)fail('类型结构过大。','Type structure is too large.','limit');
      if(s===true)return 'unknown';if(s===false)return 'never';if(s.$ref)return ts(reference(s.$ref),depth+1);
      if(own(s,'const'))return JSON.stringify(s.const);if(s.enum)return s.enum.map(v=>JSON.stringify(v)).join(' | ');
      if(s.anyOf||s.oneOf){const base={...s};delete base.anyOf;delete base.oneOf;const union='('+ (s.anyOf||s.oneOf).map(x=>ts(x,depth+1)).join(' | ')+')';return Object.keys(base).some(k=>!annotations.has(k))?'('+ts(base,depth+1)+') & '+union:union;}
      if(Array.isArray(s.type))return s.type.map(type=>ts({...s,type},depth+1)).join(' | ');
      const type=s.type||(s.properties||s.required?'object':s.items?'array':null);
      if(type==='object') {
        const props=s.properties||{},required=new Set(s.required||[]),names=[...new Set([...Object.keys(props),...required])];
        const lines=names.map(k=>'  '.repeat(depth+1)+JSON.stringify(k)+(required.has(k)?'':'?')+': '+ts(own(props,k)?props[k]:s.additionalProperties??true,depth+1)+';');
        if(s.additionalProperties!==false)lines.push('  '.repeat(depth+1)+'[key: string]: unknown;');
        return '{\n'+lines.join('\n')+'\n'+'  '.repeat(depth)+'}';
      }
      if(type==='array'){if(Array.isArray(s.items))return 'Array<'+([...s.items,...(s.additionalItems===false?[]:[s.additionalItems??true])].map(x=>'('+ts(x,depth+1)+')').join(' | ')||'never')+'>';return 'Array<'+ts(s.items??true,depth+1)+'>';}
      return type==='integer'?'number':['string','number','boolean','null'].includes(type)?type:'unknown';
    }
    const result=JSON.stringify(values,null,2),typescript='export type MockRecord = '+ts(rules)+';\n';
    if(result.length>1000000||typescript.length>200000)fail('输出超过大小限制。','Output exceeds the size limit.','limit');
    return {result,typescript,count,seed};
  }
  (window.KCompute ||= {})['schema-mock']=Object.freeze({generate});
})();
