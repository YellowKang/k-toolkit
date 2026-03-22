function renderUnitConvert(el) {
  const categories = {
    '长度': {units:['米','千米','厘米','毫米','英寸','英尺','英里','海里'],factors:[1,1000,0.01,0.001,0.0254,0.3048,1609.344,1852]},
    '重量': {units:['千克','克','毫克','磅','盎司','吨'],factors:[1,0.001,0.000001,0.453592,0.028350,1000]},
    '温度': {units:['摄氏度','华氏度','开尔文'],factors:null},
    '面积': {units:['平方米','平方千米','平方厘米','平方英尺','亩','公顷'],factors:[1,1e6,0.0001,0.0929,666.667,10000]},
    '存储': {units:['字节','KB','MB','GB','TB','PB'],factors:[1,1024,1048576,1073741824,1099511627776,1125899906842624]},
    '速度': {units:['米/秒','千米/小时','英里/小时','节'],factors:[1,0.277778,0.44704,0.514444]},
  };
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">选择类别</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px" id="ucCats">
        ${Object.keys(categories).map((c,i)=>`<button class="btn ${i===0?'btn-primary':'btn-secondary'}" onclick="ucSetCat('${c}')">${c}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px">
        <div>
          <select class="tool-input" id="ucFromUnit" onchange="ucConvert()"></select>
          <input class="tool-input" id="ucFromVal" type="number" value="1" style="margin-top:8px" oninput="ucConvert()">
        </div>
        <div style="color:var(--accent);font-size:20px">⇄</div>
        <div>
          <select class="tool-input" id="ucToUnit" onchange="ucConvert()"></select>
          <input class="tool-input" id="ucToVal" type="number" style="margin-top:8px" readonly>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="ucAllPanel">
      <div class="panel-label" style="margin-bottom:10px">全部换算</div>
      <div id="ucAllResults"></div>
    </div>`;
  window._ucCats = categories;
  window._ucCur = Object.keys(categories)[0];
  ucSetCat(window._ucCur);
}

function ucSetCat(cat) {
  window._ucCur = cat;
  document.querySelectorAll('#ucCats button').forEach(b=>b.className='btn '+(b.textContent===cat?'btn-primary':'btn-secondary'));
  const {units} = window._ucCats[cat];
  ['ucFromUnit','ucToUnit'].forEach((id,i)=>{
    const sel=document.getElementById(id);
    sel.innerHTML=units.map((u,j)=>`<option value="${j}">${u}</option>`).join('');
    sel.value=i===1&&units.length>1?'1':'0';
  });
  ucConvert();
}

function ucConvert() {
  const cat=window._ucCur, {units,factors}=window._ucCats[cat];
  const fromIdx=+document.getElementById('ucFromUnit').value;
  const toIdx=+document.getElementById('ucToUnit').value;
  const val=parseFloat(document.getElementById('ucFromVal').value)||0;
  let result;
  if (cat==='温度') {
    let celsius;
    if (fromIdx===0) celsius=val;
    else if (fromIdx===1) celsius=(val-32)*5/9;
    else celsius=val-273.15;
    if (toIdx===0) result=celsius;
    else if (toIdx===1) result=celsius*9/5+32;
    else result=celsius+273.15;
  } else {
    const base=val*factors[fromIdx];
    result=base/factors[toIdx];
  }
  document.getElementById('ucToVal').value=parseFloat(result.toFixed(8));
  // all results
  let allHtml='';
  if (cat==='温度') {
    let celsius=fromIdx===0?val:fromIdx===1?(val-32)*5/9:val-273.15;
    const rs=[celsius,celsius*9/5+32,celsius+273.15];
    allHtml=units.map((u,i)=>`<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);width:80px">${u}</span><span style="color:var(--neon);font-weight:600">${parseFloat(rs[i].toFixed(6))}</span><button class="copy-inline" onclick="copyText('${parseFloat(rs[i].toFixed(6))}',this)">复制</button></div>`).join('');
  } else {
    const base=val*factors[fromIdx];
    allHtml=units.map((u,i)=>{const r=parseFloat((base/factors[i]).toFixed(8));return `<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);width:100px">${u}</span><span style="color:var(--neon);font-weight:600">${r}</span><button class="copy-inline" onclick="copyText('${r}',this)">复制</button></div>`;}).join('');
  }
  document.getElementById('ucAllResults').innerHTML=allHtml;
}
