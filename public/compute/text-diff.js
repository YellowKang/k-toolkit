(function () {
function _computeDiff(a, b) {
  if(a.length+b.length>200000) throw new Error('complex');
  let prefix=0,endA=a.length,endB=b.length;
  while(prefix<endA && prefix<endB && a[prefix]===b[prefix])prefix++;
  while(endA>prefix && endB>prefix && a[endA-1]===b[endB-1]){endA--;endB--;}
  const left=a.slice(prefix,endA),right=b.slice(prefix,endB),m=left.length,n=right.length;
  let edits;
  if(!m || !n) edits=left.map(v=>[-1,v]).concat(right.map(v=>[1,v]));
  else {
    const shared=new Set(left);
    if(!right.some(v=>shared.has(v))) edits=left.map(v=>[-1,v]).concat(right.map(v=>[1,v]));
    else {
      // Myers shortest edit path. Typed diagonal traces are bounded to ~4 MB.
      const trace=[];let work=0;
      search: for(let d=0;d<=m+n;d++) {
        if((d+1)*(d+1)>1000000) throw new Error('complex');
        const row=new Int32Array(2*d+1),prev=trace[d-1];
        const get=k=>prev?.[k+d-1] ?? -Infinity;
        for(let k=-d;k<=d;k+=2) {
          let x=d===0?0:k===-d || (k!==d && get(k-1)<get(k+1))?get(k+1):get(k-1)+1;
          let y=x-k;
          if(++work>2000000) throw new Error('complex');
          while(x<m && y<n && left[x]===right[y]) {x++;y++;if(++work>2000000)throw new Error('complex');}
          row[k+d]=x;
          if(x>=m && y>=n) {
            trace.push(row);edits=[];
            for(let step=d;step>0;step--) {
              const diagonal=x-y,previous=trace[step-1],at=k=>previous[k+step-1] ?? -Infinity;
              const prior=diagonal===-step || (diagonal!==step && at(diagonal-1)<at(diagonal+1))?diagonal+1:diagonal-1;
              const px=at(prior),py=px-prior;
              while(x>px && y>py) {edits.push([0,left[--x]]);y--;}
              if(x===px) edits.push([1,right[--y]]); else edits.push([-1,left[--x]]);
            }
            while(x>0 && y>0){edits.push([0,left[--x]]);y--;}
            edits.reverse();break search;
          }
        }
        trace.push(row);
      }
    }
  }
  return a.slice(0,prefix).map(v=>[0,v]).concat(edits,a.slice(endA).map(v=>[0,v]));
}

function tokenize(text, mode = 'line') {
  if (typeof text !== 'string' || text.length > 1000000) throw new Error('complex');
  if (mode === 'line') return text ? text.split('\n') : [];
  if (mode === 'word') return text.split(/(\s+)/).filter(Boolean);
  if (mode === 'char') return [...text];
  throw new Error('Unknown diff mode');
}
window.KCompute = window.KCompute || {};
window.KCompute['text-diff'] = Object.freeze({diff:_computeDiff, tokenize});
})();
