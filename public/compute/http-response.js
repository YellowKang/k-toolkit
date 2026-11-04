/* Bounded UTF-8 responses. Raw text is kept separately from its preview/formatting. */
(function () {
  const say=(zh,en)=>window.getCurrentLang?.()==='en'?en:zh;
  const check=signal=>{if(signal?.aborted)throw new DOMException('Cancelled','AbortError');};
  const limit=()=>new Error(say('响应超过 5 MiB，已停止读取；请缩小接口返回范围。','Response exceeds 5 MiB. Reading stopped; request a smaller response.'));
  async function read(response,{signal,maxBytes=5*1024*1024}={}) {
    check(signal);
    const reader=response.body?.getReader();
    const cancel=()=>{Promise.resolve(reader?.cancel()).catch(()=>{});};
    signal?.addEventListener('abort',cancel,{once:true});
    try {
      if(Number(response.headers?.get('content-length'))>maxBytes)throw limit();
      const chunks=[];let size=0;
      if(reader) {
        for(;;) {
          check(signal);const {done,value}=await reader.read();check(signal);if(done)break;
          size+=value.byteLength;if(size>maxBytes)throw limit();chunks.push(value);
        }
      } else {
        const bytes=new TextEncoder().encode(await response.text());check(signal);
        size=bytes.byteLength;if(size>maxBytes)throw limit();chunks.push(bytes);
      }
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      let raw;try{raw=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw new Error(say('响应不是有效的 UTF-8 文本。','Response is not valid UTF-8 text.'));}
      let formatted=raw,isJson=false;
      if(raw.length<=1000000)try{const json=window.KCompute['json-text'];formatted=json.stringify(json.parse(raw),2);isJson=true;}catch{}
      return {raw,formatted,isJson,bytes:size};
    } finally {signal?.removeEventListener('abort',cancel);if(reader){try{await reader.cancel();}catch{}reader.releaseLock();}}
  }
  (window.KCompute ||= {})['http-response']=Object.freeze({read});
})();
