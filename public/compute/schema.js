/* Sample inference and abortable Draft-07 validation. Heavy validation libraries are Worker-only. */
(function () {
  const tr=(zh,en)=>window.getCurrentLang?.()==='en'?en:zh;
  function infer(input) {
    if(typeof input!=='string'||input.length>1000000)throw new Error(tr('JSON 最多 1,000,000 个字符','JSON limit: 1,000,000 characters'));
    const value=JSON.parse(input);let count=0;
    const stack=[[value,0]];
    while(stack.length){const [v,depth]=stack.pop();if(++count>50000||depth>64)throw new Error(tr('最多 50,000 个节点、64 层嵌套','Limit: 50,000 nodes / 64 levels'));if(v&&typeof v==='object')for(const x of Object.values(v))stack.push([x,depth+1]);}
    const type=v=>v===null?'null':Array.isArray(v)?'array':typeof v;
    function merge(values) {
      const groups=new Map();for(const v of values){const t=type(v);if(!groups.has(t))groups.set(t,[]);groups.get(t).push(v);}
      const variants=[];
      for(const [t,group] of groups){
        if(t==='number'){variants.push({type:group.every(Number.isInteger)?'integer':'number'});continue;}
        if(t==='array'){const items=[];for(const list of group)for(const item of list)items.push(item);variants.push(items.length?{type:'array',items:merge(items)}:{type:'array'});continue;}
        if(t==='object'){
          const byKey=new Map();for(const object of group)for(const [key,item] of Object.entries(object)){if(!byKey.has(key))byKey.set(key,[]);byKey.get(key).push(item);}
          const properties=Object.create(null),required=[];for(const [key,samples] of byKey){properties[key]=merge(samples);if(samples.length===group.length)required.push(key);}
          variants.push({type:'object',properties,...(required.length?{required}:{})});continue;
        }
        variants.push({type:t});
      }
      return variants.length===1?variants[0]:{anyOf:variants};
    }
    const schema={$schema:'http://json-schema.org/draft-07/schema#',...merge([value])};
    const result=JSON.stringify(schema,null,2);
    if(result.length>1000000)throw new Error(tr('Schema 结果过大','Generated schema is too large'));
    return {schema,result,nodes:count};
  }
  function validate(input,schema,{signal}={}) {
    if(typeof input!=='string'||typeof schema!=='string'||input.length>1000000||schema.length>200000)return Promise.reject(new Error(tr('数据最多 1,000,000 字符，Schema 最多 200,000 字符','Data limit: 1,000,000 characters; schema limit: 200,000')));
    return new Promise((resolve,reject)=>{
      let worker,timer,settled=false;
      const finish=(data,error)=>{if(settled)return;settled=true;clearTimeout(timer);worker?.terminate();signal?.removeEventListener('abort',abort);error?reject(error):resolve(data);};
      const abort=()=>finish(null,new DOMException(tr('已取消','Cancelled'),'AbortError'));
      if(signal?.aborted){abort();return;}signal?.addEventListener('abort',abort,{once:true});
      try {
        worker=new Worker('tools/schema-worker.js?v='+encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content||'dev'));
        timer=setTimeout(()=>finish(null,new Error(tr('校验超过 2 秒，已停止；请简化 Schema 或缩小输入','Validation stopped after 2 seconds; simplify the schema or reduce input'))),2000);
        worker.onerror=()=>finish(null,new Error(tr('无法加载校验器，请重试','Could not load validator; try again')));
        worker.onmessage=event=>event.data.error?finish(null,new Error(event.data.error)):finish(event.data);
        worker.postMessage({input,schema,lang:window.getCurrentLang?.()||'zh'});
      } catch(error){finish(null,error);}
    });
  }
  (window.KCompute ||= {}).schema=Object.freeze({infer,validate});
})();
