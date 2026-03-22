function renderNumberChinese(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">数字大写转换（财务）</div>
      <input class="tool-input" id="ncInput" type="number" placeholder="输入金额，如 12345.67" oninput="ncConvert()" style="margin-bottom:14px">
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="ncConvert()">转换</button>
        <button class="btn btn-secondary" onclick="document.getElementById('ncInput').value='';document.getElementById('ncResult').style.display='none'">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="ncResult" style="display:none">
      <div style="margin-bottom:10px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">财务大写</div>
        <div id="ncOutput" style="font-size:18px;font-weight:700;color:var(--neon);word-break:break-all"></div>
      </div>
      <div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">中文小写</div>
        <div id="ncSmall" style="font-size:16px;color:var(--accent)"></div>
      </div>
      <button class="btn btn-secondary" style="margin-top:12px" onclick="copyText(document.getElementById('ncOutput').textContent,this)">复制大写</button>
    </div>`;
}

function ncConvert() {
  const v = parseFloat(document.getElementById('ncInput').value);
  if (isNaN(v)) return;
  document.getElementById('ncOutput').textContent = numToChinese(v);
  document.getElementById('ncSmall').textContent = numToSmallChinese(v);
  document.getElementById('ncResult').style.display='';
}

function numToChinese(n) {
  if (n===0) return '零元整';
  const digits=['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
  const units=['','拾','佰','仟'];
  const sections=['','万','亿','万亿'];
  const neg=n<0; n=Math.abs(n);
  const intPart=Math.floor(n), decPart=Math.round((n-intPart)*100);
  function sectionToChinese(num) {
    let s='',zero=false;
    for(let i=3;i>=0;i--){const d=Math.floor(num/Math.pow(10,i))%10;if(d===0){if(s.length>0&&i>0)zero=true;}else{if(zero){s+='零';zero=false;}s+=digits[d]+(i>0?units[i]:'');}}
    return s;
  }
  let result='',parts=[intPart%10000,Math.floor(intPart/10000)%10000,Math.floor(intPart/100000000)];
  let sec=parts.reverse().findIndex(p=>p>0);
  let built='',hasContent=false;
  [parts[0],parts[1],parts[2]].reverse().forEach((p,i)=>{
    const idx=2-i;
    if(p>0){const s=sectionToChinese(p);if(hasContent&&p<1000)built+='零';built+=s+sections[idx];hasContent=true;}
    else if(hasContent&&idx>0) built+='零';
  });
  result=built.replace(/零+/g,'零').replace(/零([万亿])/g,'$1').replace(/亿万/g,'亿')+'元';
  if(decPart>0){const j=Math.floor(decPart/10),f=decPart%10;result+=(j>0?digits[j]+'角':'')+(f>0?digits[f]+'分':'');}
  else result+='整';
  return (neg?'负':'')+result;
}

function numToSmallChinese(n) {
  const map=['零','一','二','三','四','五','六','七','八','九'];
  const u=['','十','百','千','万','十万','百万','千万','亿'];
  const neg=n<0; n=Math.abs(n);
  const i=Math.floor(n), d=Math.round((n-i)*100);
  const s=String(i).split('').reverse().map((c,idx)=>map[+c]+(c!=='0'?u[idx]:'')).reverse().join('').replace(/零+/g,'零').replace(/^零/,'');
  const dec=d>0?(Math.floor(d/10)?map[Math.floor(d/10)]+'角':'')+(d%10?map[d%10]+'分':''):'整';
  return (neg?'负':'')+(s||'零')+'元'+dec;
}
