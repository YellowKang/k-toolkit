/* Bounded CSV parser/writer shared by manual tools, Agent and workflows. */
(function () {
  const CANDIDATES=[',',';','\t','|'],MAX=1000000,ROWS=20000,CELLS=200000;
  const fail=(zh,en)=>{throw new Error(window.getCurrentLang?.()==='zh'?zh:en);};
  function delimiterCheck(d){if(typeof d!=='string'||d.length!==1||/["\r\n]/.test(d))fail('分隔符必须是单个字符（引号和换行除外）','Delimiter must be one character, excluding quotes/newlines');}
  function detectDelimiter(text) {
    const counts=[],current=[0,0,0,0];let quote=false,hasText=false;
    for(let i=0;i<Math.min(text.length,32768)&&counts.length<5;i++) {
      const c=text[i];
      if(c==='"'){if(quote&&text[i+1]==='"'){i++;continue;}quote=!quote;hasText=true;continue;}
      if(quote)continue;
      const idx=CANDIDATES.indexOf(c);if(idx>=0)current[idx]++;
      if(c==='\n'||c==='\r'){if(hasText||current.some(Boolean)){counts.push(current.slice());current.fill(0);hasText=false;}if(c==='\r'&&text[i+1]==='\n')i++;}
      else if(c.trim())hasText=true;
    }
    if(hasText||current.some(Boolean))counts.push(current.slice());
    let best=',',score=0;
    CANDIDATES.forEach((d,i)=>{const values=counts.map(row=>row[i]),first=values[0]||0,n=first*(values.every(v=>v===first)?2:1);if(n>score){score=n;best=d;}});
    return best;
  }
  function parse(text,{delimiter='auto'}={}) {
    const src=String(text??'').replace(/^\uFEFF/,'');
    if(src.length>MAX)fail('CSV 最多 1,000,000 个字符','CSV limit: 1,000,000 characters');
    const d=delimiter==='auto'?detectDelimiter(src):delimiter;delimiterCheck(d);
    const rows=[];let row=[],field='',quote=false,closed=false,atStart=true,explicit=false,total=0;
    const pushField=()=>{if(++total>CELLS||row.length>=1000)fail('CSV 最多 200,000 个单元格、1,000 列','CSV limit: 200,000 cells / 1,000 columns');row.push(field);field='';closed=false;atStart=true;};
    const pushRow=()=>{if(row.length>1||row[0]!==''||explicit)rows.push(row);if(rows.length>ROWS)fail('CSV 最多 20,000 行','CSV limit: 20,000 rows');row=[];explicit=false;};
    for(let i=0;i<src.length;i++) {
      const c=src[i];
      if(quote){if(c==='"'){if(src[i+1]==='"'){field+='"';i++;}else{quote=false;closed=true;}}else field+=c;continue;}
      if(c===d){pushField();continue;}
      if(c==='\r'||c==='\n'){pushField();pushRow();if(c==='\r'&&src[i+1]==='\n')i++;continue;}
      if(closed)fail('结束引号后只能是分隔符或换行','Unexpected text after closing quote');
      if(c==='"'){if(!atStart)fail('未引用字段内出现引号','Quote inside an unquoted field');quote=true;explicit=true;atStart=false;continue;}
      field+=c;atStart=false;
    }
    if(quote)fail('引用字段未闭合','Unterminated quoted field');
    if(field!==''||row.length||closed){pushField();pushRow();}
    return {rows,delimiter:d};
  }
  function inferValue(value) {
    if(/^(true|false)$/i.test(value))return value.toLowerCase()==='true';
    if(/^null$/i.test(value))return null;
    if(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value)&&Number.isFinite(+value)&&(!Number.isInteger(+value)||Number.isSafeInteger(+value)))return +value;
    return value;
  }
  function toObjects(rows,{header=true,infer=false}={}) {
    if(!rows.length)return [];
    if(rows.length>ROWS)fail('CSV 最多 20,000 行','CSV limit: 20,000 rows');
    let width=0;for(const r of rows)width=Math.max(width,r.length);
    if(width>1000||rows.length*width>CELLS)fail('CSV 超出行列限制','CSV exceeds the cell limit');
    const bases=Array.from({length:width},(_,i)=>(header?String(rows[0][i]??'').trim():'')||`column${i+1}`),reserved=new Set(bases),used=new Set(),next=new Map();
    const keys=bases.map(base=>{let key=base,n=next.get(base)||2;while(used.has(key)){do{key=base+'_'+n++;}while(reserved.has(key)||used.has(key));}next.set(base,n);used.add(key);return key;});
    return rows.slice(header?1:0).map(r=>Object.fromEntries(keys.map((k,i)=>[k,infer?inferValue(r[i]??''):(r[i]??'')])));
  }
  function flatten(value) {
    const out=Object.create(null);let count=0;
    function visit(object,prefix,depth){if(depth>64||++count>CELLS)fail('嵌套结构过深或过大','Nested structure is too deep or large');for(const [k,v] of Object.entries(object)){const key=prefix===null?k:prefix+'.'+k;if(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length)visit(v,key,depth+1);else{if(Object.prototype.hasOwnProperty.call(out,key))fail('展开路径重复：'+key,'Flattened path collision: '+key);out[key]=v;}}}
    visit(value,null,0);return out;
  }
  const cellText=v=>v===null||v===undefined?'':typeof v==='object'?JSON.stringify(v):String(v);
  function serialize(records,{delimiter=',',flat=true,newline='\n'}={}) {
    delimiterCheck(delimiter);
    if(!['\n','\r\n','\r'].includes(newline))fail('未知换行格式','Invalid newline format');
    const list=Array.isArray(records)?records:[records];
    if(list.length>ROWS)fail('CSV 最多 20,000 行','CSV limit: 20,000 rows');
    const cell=v=>{const s=cellText(v);return s.includes(delimiter)||/["\r\n]/.test(s)||/^\s|\s$/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    let lines;
    if(list.every(Array.isArray))lines=list;
    else{const objects=list.map(r=>r&&typeof r==='object'&&!Array.isArray(r)?(flat?flatten(r):r):{value:r}),set=new Set();for(const o of objects)for(const k of Object.keys(o)){set.add(k);if(set.size>1000)fail('CSV 最多 1,000 列','CSV limit: 1,000 columns');}const keys=[...set];if((objects.length+1)*keys.length>CELLS)fail('CSV 最多 200,000 个单元格','CSV limit: 200,000 cells');lines=[keys,...objects.map(o=>keys.map(k=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:''))];}
    let length=0,total=0;const output=[];
    for(const row of lines){total+=row.length;if(row.length>1000||total>CELLS)fail('CSV 超出行列限制','CSV exceeds the cell limit');const line=row.map(cell).join(delimiter);length+=line.length+newline.length;if(length>MAX*2)fail('CSV 输出最多 2,000,000 个字符','CSV output limit: 2,000,000 characters');output.push(line);}
    return {result:output.join(newline),columns:lines[0]?.length||0};
  }
  const stringify=(records,options)=>serialize(records,options).result;
  function convert(input,{direction,delimiter='auto',header=true,infer=false,flat=true}={}) {
    if(typeof input!=='string'||input.length>MAX)fail('输入最多 1,000,000 个字符','Input limit: 1,000,000 characters');
    if(direction==='json2csv') {
      const data=JSON.parse(input);if(data===null||typeof data!=='object')fail('需要 JSON 数组或对象','Expected a JSON array or object');
      const records=Array.isArray(data)?data:[data],d=delimiter==='auto'?',':delimiter;
      const {result,columns}=serialize(records,{delimiter:d,flat});
      return {result,rows:records.length,columns,delimiter:d,extension:'csv'};
    }
    if(direction!=='csv2json')fail('未知转换方向','Invalid conversion direction');
    const parsed=parse(input,{delimiter}),records=toObjects(parsed.rows,{header,infer}),result=JSON.stringify(records,null,2);
    if(result.length>MAX*2)fail('JSON 输出最多 2,000,000 个字符','JSON output limit: 2,000,000 characters');
    return {result,rows:records.length,delimiter:parsed.delimiter,extension:'json'};
  }
  (window.KCompute ||= {}).csv=Object.freeze({parse,toObjects,stringify,detectDelimiter,inferValue,convert});
})();
