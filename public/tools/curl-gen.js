function renderCurlGen(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">请求配置</div>
      <div style="display:grid;grid-template-columns:120px 1fr;gap:10px;margin-bottom:10px">
        <select id="cgMethod" class="tool-input">
          <option>GET</option><option>POST</option><option>PUT</option>
          <option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option>
        </select>
        <input class="tool-input" id="cgUrl" placeholder="https://api.example.com/users">
      </div>
      <div class="panel-label" style="margin-bottom:8px">请求头</div>
      <div id="cgHeaders">
        <div class="cg-header-row" style="display:flex;gap:8px;margin-bottom:6px">
          <input class="tool-input" placeholder="Header名" style="flex:1">
          <input class="tool-input" placeholder="Header值" style="flex:2">
          <button class="copy-inline" onclick="cgRemoveRow(this)">✕</button>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="cgAddHeader()" style="margin-bottom:14px;font-size:12px">+ 添加 Header</button>
      <div id="cgBodyWrap">
        <div class="panel-label" style="margin-bottom:8px">请求体</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <select id="cgBodyType" class="tool-input" style="width:auto" onchange="cgBodyTypeChange()">
            <option value="none">无</option>
            <option value="json">JSON</option>
            <option value="form">Form Data</option>
            <option value="raw">Raw</option>
          </select>
        </div>
        <textarea class="tool-textarea" id="cgBody" rows="5" placeholder="{}" style="display:none"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="cgGenerate()">生成代码</button>
        <button class="btn btn-secondary" onclick="cgClear()">清空</button>
        <button class="btn btn-secondary" onclick="cgLoadSample()">示例</button>
      </div>
    </div>
    <div class="tool-card-panel" id="cgResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;gap:6px" id="cgTabs"></div>
        <button class="btn btn-secondary" onclick="cgCopyResult(this)">复制</button>
      </div>
      <pre class="result-box" id="cgOutput" style="max-height:360px;overflow-y:auto;color:#93c5fd;white-space:pre-wrap"></pre>
    </div>`;

  cgBodyTypeChange();
}

function cgAddHeader() {
  const row = document.createElement('div');
  row.className = 'cg-header-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:6px';
  row.innerHTML = '<input class="tool-input" placeholder="Header名" style="flex:1"><input class="tool-input" placeholder="Header值" style="flex:2"><button class="copy-inline" onclick="cgRemoveRow(this)">✕</button>';
  document.getElementById('cgHeaders').appendChild(row);
}

function cgRemoveRow(btn) { btn.closest('.cg-header-row').remove(); }

function cgBodyTypeChange() {
  const t = document.getElementById('cgBodyType').value;
  const body = document.getElementById('cgBody');
  body.style.display = t === 'none' ? 'none' : '';
  if (t === 'json' && !body.value) body.placeholder = '{"key": "value"}';
  if (t === 'form') body.placeholder = 'key1=value1&key2=value2';
  if (t === 'raw')  body.placeholder = 'raw body content';
}

function _cgGetHeaders() {
  const rows = document.querySelectorAll('.cg-header-row');
  const hdrs = {};
  rows.forEach(row => {
    const [k, v] = row.querySelectorAll('input');
    if (k.value.trim()) hdrs[k.value.trim()] = v.value.trim();
  });
  return hdrs;
}

function cgGenerate() {
  const method  = document.getElementById('cgMethod').value;
  const url     = document.getElementById('cgUrl').value.trim();
  if (!url) { showToast('请输入 URL', 'error'); return; }
  const headers = _cgGetHeaders();
  const btype   = document.getElementById('cgBodyType').value;
  const body    = btype !== 'none' ? document.getElementById('cgBody').value.trim() : '';

  if (btype === 'json' && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (btype === 'form' && !headers['Content-Type']) headers['Content-Type'] = 'application/x-www-form-urlencoded';

  const codes = {
    curl:  _genCurl(method,url,headers,body),
    fetch: _genFetch(method,url,headers,body,btype),
    axios: _genAxios(method,url,headers,body,btype),
  };

  const tabs = document.getElementById('cgTabs');
  tabs.innerHTML = '';
  let active = 'curl';
  ['curl','fetch','axios'].forEach(lang => {
    const btn = document.createElement('button');
    btn.className = 'copy-inline';
    btn.textContent = lang;
    btn.style.background = lang===active ? 'rgba(102,126,234,0.25)' : '';
    btn.style.borderColor = lang===active ? 'rgba(102,126,234,0.5)' : '';
    btn.onclick = () => {
      document.getElementById('cgOutput').textContent = codes[lang];
      tabs.querySelectorAll('button').forEach(b => { b.style.background=''; b.style.borderColor=''; });
      btn.style.background = 'rgba(102,126,234,0.25)';
      btn.style.borderColor = 'rgba(102,126,234,0.5)';
    };
    tabs.appendChild(btn);
  });
  document.getElementById('cgOutput').textContent = codes.curl;
  document.getElementById('cgResultPanel').style.display = '';
}

function _genCurl(method,url,headers,body) {
  let lines = [`curl -X ${method} '${url}'`];
  Object.entries(headers).forEach(([k,v]) => lines.push(`  -H '${k}: ${v}'`));
  if (body) lines.push(`  -d '${body.replace(/'/g,"'\\''")}' `);
  return lines.join(' \\\n');
}

function _genFetch(method,url,headers,body,btype) {
  const opts = { method };
  if (Object.keys(headers).length) opts.headers = headers;
  if (body) opts.body = btype==='json' ? 'JSON.stringify(data)' : `'${body}'`;
  const optsStr = JSON.stringify(opts,null,2).replace('"JSON.stringify(data)"','JSON.stringify(data)');
  return `const data = ${btype==='json'?body:'null'};

const response = await fetch('${url}', ${optsStr});
const result = await response.json();
console.log(result);`;
}

function _genAxios(method,url,headers,body,btype) {
  const cfg = {};
  if (Object.keys(headers).length) cfg.headers = headers;
  const m = method.toLowerCase();
  const hasBody = ['post','put','patch'].includes(m);
  const dataStr = btype==='json' ? body : `'${body}'`;
  const cfgStr = Object.keys(cfg).length ? ', ' + JSON.stringify(cfg,null,2) : '';
  if (hasBody && body)
    return `const response = await axios.${m}('${url}', ${dataStr}${cfgStr});
console.log(response.data);`;
  return `const response = await axios.${m}('${url}'${cfgStr?', '+cfgStr:''});
console.log(response.data);`;
}

function cgCopyResult(btn) { copyText(document.getElementById('cgOutput').textContent, btn); }

function cgClear() {
  document.getElementById('cgUrl').value='';
  document.getElementById('cgBody').value='';
  document.getElementById('cgResultPanel').style.display='none';
}

function cgLoadSample() {
  document.getElementById('cgMethod').value='POST';
  document.getElementById('cgUrl').value='https://api.example.com/users';
  document.getElementById('cgBodyType').value='json';
  cgBodyTypeChange();
  document.getElementById('cgBody').value=JSON.stringify({name:'张三',email:'zhangsan@example.com'},null,2);
  const rows = document.querySelectorAll('.cg-header-row');
  if (rows.length>0){
    rows[0].querySelectorAll('input')[0].value='Authorization';
    rows[0].querySelectorAll('input')[1].value='Bearer your-token-here';
  }
  cgGenerate();
}
