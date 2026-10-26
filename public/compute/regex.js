(function () {
  function run(params,{signal}={}) {
    return new Promise((resolve,reject)=>{
      let worker, timer, settled=false;
      const finish=(value,error)=>{if(settled)return;settled=true;clearTimeout(timer);worker?.terminate();signal?.removeEventListener('abort',abort);error?reject(error):resolve(value);};
      const abort=()=>finish(null,signal.reason || new DOMException('Cancelled','AbortError'));
      if(signal?.aborted){abort();return;}
      signal?.addEventListener('abort',abort,{once:true});
      try{worker=new Worker('tools/regex-worker.js?v='+encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content||'dev'));}
      catch{finish({error:'worker_error'});return;}
      timer=setTimeout(()=>finish({error:'timeout'}),1500);
      worker.onerror=()=>finish({error:'worker_error'});
      worker.onmessage=event=>finish(event.data);
      try{worker.postMessage(params);}catch{finish({error:'worker_error'});}
    });
  }
  window.KCompute=window.KCompute||{};window.KCompute.regex=Object.freeze({run});
})();
