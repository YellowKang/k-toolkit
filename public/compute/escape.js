(function () {
  async function run(text,{type='json',unescape=false,quotes=false}={}) {
    if(typeof text!=='string' || text.length>1000000)throw Object.assign(new Error('limit'),{code:'limit'});
    if(type==='json') { const json=await window.ToolCompute.load('json-text');return unescape?json.unescapeJSON(text):json.escapeJSON(text,quotes); }
    if(type==='html') {
      if(!unescape)return text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[char]);
      const decoder=document.createElement('textarea');
      return text.replace(/&(?:#(?:x[\da-f]+|\d+)|[a-z][\da-z]+);/gi,entity=>{decoder.innerHTML=entity;return decoder.value;});
    }
    if(type==='url') {try{return unescape?decodeURIComponent(text):encodeURIComponent(text);}catch{throw Object.assign(new Error('invalid_url'),{code:'invalid_url'});}}
    if(type==='regex')return unescape?text.replace(/\\([.*+?^${}()|[\]\\])/g,'$1'):text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    if(type==='shell')return unescape?text.replace(/\\(['"\\ $`!])/g,'$1'):text.replace(/(['"\\ $`!])/g,'\\$1');
    throw new Error('Unsupported escape type');
  }
  window.KCompute=window.KCompute||{};window.KCompute.escape=Object.freeze({run});
})();
