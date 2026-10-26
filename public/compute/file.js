(function () {
  const say=(zh,en)=>window.getCurrentLang?.()==='en'?en:zh;
  const check=signal=>{if(signal?.aborted)throw new DOMException('Cancelled','AbortError');};
  function run(file,operation,options={}, {signal}={}){
    check(signal);if(!(file instanceof Blob)||file.size>32*1024*1024)return Promise.reject(new Error(say('文件超过 32 MiB','File exceeds 32 MiB')));
    return new Promise((resolve,reject)=>{const worker=new Worker('tools/file-worker.js?v='+encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content||'dev'));let done=false;
      const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);worker.terminate();error?reject(error):resolve(value);};
      const cancel=()=>finish(new DOMException('Cancelled','AbortError'));const timer=setTimeout(()=>finish(new Error(say('文件处理超时，请缩小文件','File processing timed out; use a smaller file'))),12000);
      signal?.addEventListener('abort',cancel,{once:true});worker.onmessage=e=>e.data.error?finish(new Error(e.data.error)):finish(null,e.data);worker.onerror=()=>finish(new Error(say('文件处理失败','File processing failed')));worker.postMessage({file,operation,options,en:window.getCurrentLang?.()==='en'});
    });
  }
  async function text(file,{signal,maxBytes=2*1024*1024}={}){check(signal);if(file.size>maxBytes)throw new Error(say('文本文件过大，请缩小到 2 MiB 内','Text file too large; use at most 2 MiB'));const bytes=await file.arrayBuffer();check(signal);let value;try{value=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error(say('文件不是有效 UTF-8 文本','File is not valid UTF-8 text'));}if(value.includes('\0'))throw new Error(say('文件包含二进制内容','File contains binary content'));return value;}
  async function convert(file,operation,options={},context={}){
    if(['base64_encode','base64_decode'].includes(operation))return run(file,operation,options,context);
    const input=await text(file,context);check(context.signal);if(input.length>1000000)throw new Error(say('文本超过 1,000,000 字符','Text exceeds 1,000,000 characters'));
    let result,extension='json';
    if(operation==='json_format')result=JSON.stringify(JSON.parse(input),null,options.minify?0:2);
    else if(['csv_to_json','json_to_csv'].includes(operation)){const data=(await ToolCompute.load('csv')).convert(input,{direction:operation==='csv_to_json'?'csv2json':'json2csv',delimiter:options.delimiter||'auto'});result=data.result;extension=data.extension;}
    else throw new Error('Unsupported file operation');
    check(context.signal);if(result.length>2000000)throw new Error(say('结果超过 2,000,000 字符','Result exceeds 2,000,000 characters'));
    return {blob:new Blob([result],{type:extension==='json'?'application/json':'text/csv'}),name:file.name.replace(/\.[^.]*$/,'')+'.'+extension};
  }
  window.KCompute=window.KCompute||{};window.KCompute.file=Object.freeze({run,text,convert});
})();
