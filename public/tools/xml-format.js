function renderXmlFormat(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <button class="btn btn-primary" id="xmlFmtBtn" onclick="setXmlMode('format')">格式化</button>
        <button class="btn btn-secondary" id="xmlMinBtn" onclick="setXmlMode('minify')">压缩</button>
        <button class="btn btn-secondary" id="xmlJsonBtn" onclick="setXmlMode('tojson')">XML→JSON</button>
      </div>
      <div class="panel-label">输入 XML</div>
      <textarea class="tool-textarea" id="xmlInput" rows="10" placeholder="<root><item id=&quot;1&quot;>value</item></root>" oninput="_xmlRealtime()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doXml()">执行</button>
        <button class="btn btn-secondary" onclick="xmlLoadDemo()">示例</button>
        <button class="btn btn-secondary" onclick="document.getElementById('xmlInput').value='';document.getElementById('xmlResult').style.display='none'">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="xmlResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="xmlStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('xmlOutput').textContent,this)">复制结果</button>
      </div>
      <pre class="result-box" id="xmlOutput" style="white-space:pre-wrap;word-break:break-all;max-height:400px;overflow-y:auto"></pre>
    </div>`;
  window._xmlMode='format';
}

let _xmlTimer = null;
function _xmlRealtime() {
  clearTimeout(_xmlTimer);
  const v = document.getElementById('xmlInput').value.trim();
  if (!v) { document.getElementById('xmlResult').style.display='none'; return; }
  _xmlTimer = setTimeout(doXml, 500);
}

function setXmlMode(m) {
  window._xmlMode=m;
  document.getElementById('xmlFmtBtn').className=m==='format'?'btn btn-primary':'btn btn-secondary';
  document.getElementById('xmlMinBtn').className=m==='minify'?'btn btn-primary':'btn btn-secondary';
  document.getElementById('xmlJsonBtn').className=m==='tojson'?'btn btn-primary':'btn btn-secondary';
}

function doXml() {
  const v=document.getElementById('xmlInput').value.trim();
  if(!v) return;
  const status=document.getElementById('xmlStatus');
  const output=document.getElementById('xmlOutput');
  try {
    const parser=new DOMParser();
    const doc=parser.parseFromString(v,'text/xml');
    const err=doc.querySelector('parsererror');
    if(err){output.textContent='XML 解析错误：'+err.textContent.split('\n')[0];status.textContent='✗ 错误';status.style.color='#ef4444';document.getElementById('xmlResult').style.display='';return;}
    if(window._xmlMode==='format') {
      output.textContent=xmlSerialize(doc.documentElement,0);
      status.textContent='✓ 格式化完成';status.style.color='#10b981';
    } else if(window._xmlMode==='minify') {
      output.textContent=new XMLSerializer().serializeToString(doc).replace(/\s+/g,' ').replace(/> </g,'><');
      status.textContent='✓ 压缩完成';status.style.color='#10b981';
    } else {
      output.textContent=JSON.stringify(xmlToObj(doc.documentElement),null,2);
      status.textContent='✓ 转换完成';status.style.color='#10b981';
    }
  } catch(e){output.textContent='处理失败：'+e.message;status.textContent='✗ 错误';status.style.color='#ef4444';}
  document.getElementById('xmlResult').style.display='';
}

function xmlSerialize(node,depth) {
  const indent='  '.repeat(depth);
  if(node.nodeType===3){const t=node.textContent.trim();return t?indent+t+'\n':'';}
  if(node.nodeType!==1) return '';
  const attrs=[...node.attributes].map(a=>` ${a.name}="${a.value}"`).join('');
  const children=[...node.childNodes].map(c=>xmlSerialize(c,depth+1)).join('');
  if(!children.trim()) return `${indent}<${node.tagName}${attrs}/>${'\n'}`;
  const inline=node.childNodes.length===1&&node.firstChild.nodeType===3&&node.firstChild.textContent.trim().length<60;
  if(inline) return `${indent}<${node.tagName}${attrs}>${node.textContent.trim()}</${node.tagName}>\n`;
  return `${indent}<${node.tagName}${attrs}>\n${children}${indent}</${node.tagName}>\n`;
}

function xmlToObj(node) {
  if(node.nodeType===3) return node.textContent.trim()||undefined;
  const obj={};
  if(node.attributes.length) obj['@']=[...node.attributes].reduce((a,attr)=>{a[attr.name]=attr.value;return a;},{});
  const kids=[...node.childNodes].filter(n=>!(n.nodeType===3&&!n.textContent.trim()));
  if(kids.length===1&&kids[0].nodeType===3) obj['#']=kids[0].textContent.trim();
  else kids.forEach(c=>{if(c.nodeType!==1) return;const v=xmlToObj(c);obj[c.tagName]=obj[c.tagName]?[].concat(obj[c.tagName],v):v;});
  return obj;
}

function xmlLoadDemo() {
  document.getElementById('xmlInput').value=`<?xml version="1.0" encoding="UTF-8"?><bookstore><book id="1" category="fiction"><title>JavaScript权威指南</title><author>David Flanagan</author><price>89.00</price></book><book id="2" category="tech"><title>Clean Code</title><author>Robert Martin</author><price>69.00</price></book></bookstore>`;
}
