(function () {
  const fail=()=>{throw new Error(window.getCurrentLang?.()==='en'?'Enter a valid IPv4 address and integer prefix 0–32 (no leading zeros)':'请输入有效 IPv4 地址和 0–32 整数前缀（不接受前导零）');};
  function parse(ip) { const parts=String(ip??'').trim().split('.');if(parts.length!==4||!parts.every(p=>/^(0|[1-9]\d{0,2})$/.test(p)&&+p<=255))return null;return parts.reduce((n,p)=>n*256+ +p,0); }
  const format=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
  function subnet(n,prefix) {
    if(!Number.isInteger(n)||n<0||n>0xffffffff||!Number.isInteger(prefix)||prefix<0||prefix>32)fail();
    const mask=prefix===0?0:(0xffffffff<<(32-prefix))>>>0,network=(n&mask)>>>0,broadcast=(network|(~mask>>>0))>>>0,size=2**(32-prefix);
    return {mask,wildcard:(~mask)>>>0,network,broadcast,hosts:prefix>=31?size:size-2,first:prefix>=31?network:network+1,last:prefix>=31?broadcast:broadcast-1,totalHosts:size};
  }
  function types(n) {
    const a=n>>>24,b=(n>>>16)&255,c=(n>>>8)&255,t=[];
    if(a===10||(a===172&&b>=16&&b<=31)||(a===192&&b===168))t.push('private');
    if(a===100&&b>=64&&b<=127)t.push('cgnat');if(a===127)t.push('loopback');if(a===169&&b===254)t.push('link');if(a>=224&&a<=239)t.push('multicast');
    if(n===0xffffffff)t.push('broadcast');else if(a>=240)t.push('reserved');if(a===0)t.push('this');
    if((a===192&&b===0&&c===2)||(a===198&&b===51&&c===100)||(a===203&&b===0&&c===113))t.push('doc');
    if(a===198&&(b===18||b===19))t.push('benchmark');if(a===192&&b===0&&c===0)t.push('protocol');
    if(!t.length)t.push('public');return t;
  }
  function calculate(cidr) {
    const m=/^([^/]+)\/(0|[1-9]\d?)$/.exec(String(cidr??'').trim());if(!m)fail();
    const n=parse(m[1]),prefix=+m[2];if(n===null)fail();const s=subnet(n,prefix);
    return {ip:format(n),prefix,cidr:format(s.network)+'/'+prefix,network:format(s.network),broadcast:format(s.broadcast),reservesNetworkBroadcast:prefix<31,firstHost:format(s.first),lastHost:format(s.last),mask:format(s.mask),wildcard:format(s.wildcard),totalHosts:s.totalHosts,usableHosts:s.hosts,types:types(n)};
  }
  window.KCompute=window.KCompute||{};window.KCompute.ip=Object.freeze({parse,format,subnet,types,calculate});
})();
