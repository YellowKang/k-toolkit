(function () {
  const fail = () => { throw Object.assign(new Error('Comparison exceeds depth, node or output limits'), {code:'complexity'}); };
  const type = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const own = (value,key) => Object.prototype.hasOwnProperty.call(value,key);
  const segment = key => String(key).replace(/~/g,'~0').replace(/\//g,'~1');
  function compare(a,b) {
    let visited=0, bytes=0; const diffs=[];
    function check(value,depth=0) {
      if (++visited>40000 || depth>64) fail();
      if (value!==null && typeof value==='object') for (const key of Object.keys(value)) check(value[key],depth+1);
    }
    check(a);check(b);
    function add(row) { bytes+=JSON.stringify(row).length;if(bytes>2000000 || diffs.length>=5000)fail();diffs.push(row); }
    function walk(left,right,path) {
      const kind=type(left);
      if(kind!==type(right)){add({path,type:'changed',from:left,to:right});return;}
      if(kind==='object' || kind==='array') {
        const keys=kind==='array' ? Array.from({length:Math.max(left.length,right.length)},(_,i)=>String(i)) : [...new Set([...Object.keys(left),...Object.keys(right)])];
        for(const key of keys){const p=path+'/'+segment(key);
          if(!own(left,key))add({path:p,type:'added',value:right[key]});
          else if(!own(right,key))add({path:p,type:'removed',value:left[key]});
          else walk(left[key],right[key],p);
        }
      } else if(left!==right)add({path,type:'changed',from:left,to:right});
    }
    walk(a,b,'');return diffs;
  }
  function compareText(a,b) {
    if(typeof a!=='string' || typeof b!=='string' || a.length>1000000 || b.length>1000000)fail();
    return compare(JSON.parse(a),JSON.parse(b));
  }
  window.KCompute=window.KCompute||{};
  window.KCompute['json-diff']=Object.freeze({compare,compareText});
})();
