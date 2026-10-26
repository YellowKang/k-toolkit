// A disposable worker keeps untrusted patterns off the UI thread.
'use strict';
function regexReplacement(template, match, text) {
  let size=template.length;
  function expand(token,key) {
    if(key==='$')return '$';
    if(key==='&')return match[0];
    if(key==='`')return text.slice(0,match.index);
    if(key==="'")return text.slice(match.index+match[0].length);
    if(key[0]==='<')return match.groups ? (match.groups[key.slice(1,-1)] ?? '') : token;
    const index=Number(key);
    if(index>0 && index<match.length)return match[index] ?? '';
    if(key.length===2 && Number(key[0])>0 && Number(key[0])<match.length)return (match[Number(key[0])] ?? '')+key[1];
    return token;
  }
  return template.replace(/\$(\$|&|`|'|<[^>]*>|\d{1,2})/g, (token,key) => {
    const value=expand(token,key);size+=value.length-token.length;
    if(size>2000000) {const error=new Error('output_limit');error.code='output_limit';throw error;}
    return value;
  });
}

function regexEvaluate({pattern,text,flags,mode,replacement=''}) {
  if(text.length>200000 || pattern.length>5000 || replacement.length>10000) return {error:'limit'};
  const re=new RegExp(pattern,flags.includes('g')?flags:flags+'g');
  const matches=[], parts=[]; let match,last=0,outputSize=0,truncated=false;
  while((match=re.exec(text))!==null) {
    if(matches.length>=2000) {truncated=true;break;}
    // Keep captures for the detail panel only, without duplicating the entire input.
    matches.push({index:match.index,end:match.index+match[0].length,
      groups:matches.length<20?Array.from(match).slice(1,33).map(v=>v===undefined?null:v.slice(0,2000)):[],
      named:matches.length<20 && match.groups ? Object.fromEntries(Object.entries(match.groups).slice(0,32).map(([k,v])=>[k,v===undefined?null:v.slice(0,2000)])):null});
    if(mode==='replace') {
      const prefix=text.slice(last,match.index), value=regexReplacement(replacement,match,text);
      outputSize+=prefix.length+value.length;
      if(outputSize>2000000)return {error:'output_limit'};
      parts.push(prefix,value);last=match.index+match[0].length;
    }
    if(!flags.includes('g'))break;
    if(match[0].length===0) {
      const index=re.lastIndex;
      re.lastIndex=index+((re.unicode || re.unicodeSets) && text.codePointAt(index)>0xffff?2:1);
      if(re.lastIndex>text.length)break;
    }
  }
  if(mode==='replace') {
    if(truncated)return {error:'match_limit'};
    parts.push(text.slice(last));
    if(outputSize+text.length-last>2000000)return {error:'output_limit'};
    return {result:parts.join('')};
  }
  return {matches,truncated};
}
self.onmessage = event => {
  try { self.postMessage(regexEvaluate(event.data)); }
  catch(error) {self.postMessage({error:error.code || 'syntax',detail:error.message});}
};
