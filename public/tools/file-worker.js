'use strict';
self.onmessage=async({data:{file,operation,options={},en}})=>{
  try{
    const fail=(zh,english)=>{throw new Error(en?english:zh);};
    if(file.size>32*1024*1024)fail('文件超过 32 MiB','File exceeds 32 MiB');
    if(operation==='hash'){
      const algorithms=options.algorithms||['SHA-256'];if(!Array.isArray(algorithms)||!algorithms.length||algorithms.length>4||algorithms.some(a=>!['SHA-1','SHA-256','SHA-384','SHA-512'].includes(a)))throw new Error('Invalid hash algorithm');
      const bytes=await file.arrayBuffer(),hashes=[];for(const algorithm of algorithms){const digest=await crypto.subtle.digest(algorithm,bytes);hashes.push({algorithm,hash:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')});}self.postMessage({hashes});return;
    }
    if(operation==='base64_encode'){
      if(file.size>24*1024*1024)fail('Base64 编码文件最多 24 MiB（输出最多 32 MiB）','Base64 input is limited to 24 MiB (32 MiB output)');
      const bytes=new Uint8Array(await file.arrayBuffer()),chunks=[];for(let start=0;start<bytes.length;start+=32766)chunks.push(btoa(String.fromCharCode(...bytes.subarray(start,start+32766))));
      const prefix=options.dataUrl?'data:'+(/^[\w.+-]+\/[\w.+-]+$/.test(file.type)?file.type:'application/octet-stream')+';base64,':'';
      const blob=new Blob([prefix,...chunks],{type:'text/plain;charset=utf-8'});if(blob.size>32*1024*1024)fail('输出超过 32 MiB','Output exceeds 32 MiB');self.postMessage({blob,name:file.name+'.base64.txt'});return;
    }
    if(operation==='base64_decode'){
      let input=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()).trim(),type='application/octet-stream';
      if(input.startsWith('data:')){const m=/^data:([\w.+-]+\/[\w.+-]+)?;base64,([\s\S]*)$/.exec(input);if(!m)fail('无效 Data URL','Invalid data URL');type=m[1]||type;input=m[2];}
      input=input.replace(/\s/g,'').replace(/-/g,'+').replace(/_/g,'/');
      if(!/^[A-Za-z0-9+/]*={0,2}$/.test(input)||input.length%4===1)fail('无效 Base64','Invalid Base64');
      const binary=atob(input);if(btoa(binary).replace(/=+$/,'')!==input.replace(/=+$/,''))fail('无效 Base64 填充位','Invalid Base64 padding bits');
      const chunks=[];for(let i=0;i<binary.length;i+=32768){const part=binary.slice(i,i+32768);chunks.push(Uint8Array.from(part,c=>c.charCodeAt(0)));}self.postMessage({blob:new Blob(chunks,{type}),name:file.name.replace(/(?:\.base64)?\.txt$/i,'')+'.decoded'});return;
    }
    throw new Error('Unsupported operation');
  }catch(e){self.postMessage({error:e.message});}
};
