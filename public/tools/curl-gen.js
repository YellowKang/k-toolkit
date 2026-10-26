const _cgDict = {
  zh: {
    request: '请求配置', headers: '请求头', header_name: 'Header名', header_value: 'Header值', add_header: '+ 添加 Header', body: '请求体', none: '无',
    generate: '生成代码', clear: '清空', sample: '示例', import: '导入 cURL 命令', import_btn: '解析导入', copy: '复制',
    import_ph: "粘贴 cURL 命令，如：curl -X POST -H 'Content-Type: application/json' -d '{&quot;key&quot;:&quot;value&quot;}' https://api.example.com/data",
    syntax: 'cURL 引号不完整', unsupported: value => '暂不支持此 cURL 参数：' + value,
    need_url: '请输入 URL', need_curl: '请粘贴 cURL 命令', imported: 'cURL 命令已解析',
    sample_user: { name: '张三', email: 'zhangsan@example.com' },
  },
  en: {
    request: 'Request', headers: 'Headers', header_name: 'Header name', header_value: 'Header value', add_header: '+ Add header', body: 'Body', none: 'None',
    generate: 'Generate code', clear: 'Clear', sample: 'Sample', import: 'Import a cURL command', import_btn: 'Parse and import', copy: 'Copy',
    import_ph: "Paste a cURL command, e.g. curl -X POST -H 'Content-Type: application/json' -d '{&quot;key&quot;:&quot;value&quot;}' https://api.example.com/data",
    syntax: 'Unclosed quote in cURL command', unsupported: value => 'Unsupported cURL argument: ' + value,
    need_url: 'Enter a URL', need_curl: 'Paste a cURL command', imported: 'cURL command imported',
    sample_user: { name: 'Alice', email: 'alice@example.com' },
  },
};

function renderCurlGen(el) {
  const T = makeToolI18n(_cgDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('request')}</div>
      <div style="display:grid;grid-template-columns:120px 1fr;gap:10px;margin-bottom:10px">
        <select id="cgMethod" class="tool-input">
          <option>GET</option><option>POST</option><option>PUT</option>
          <option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option>
        </select>
        <input class="tool-input" id="cgUrl" placeholder="https://api.example.com/users">
      </div>
      <div class="panel-label" style="margin-bottom:8px">${T('headers')}</div>
      <div id="cgHeaders">
        <div class="cg-header-row" style="display:flex;gap:8px;margin-bottom:6px">
          <input class="tool-input" placeholder="${T('header_name')}" style="flex:1">
          <input class="tool-input" placeholder="${T('header_value')}" style="flex:2">
          <button class="copy-inline" onclick="cgRemoveRow(this)">✕</button>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="cgAddHeader()" style="margin-bottom:14px;font-size:12px">${T('add_header')}</button>
      <div id="cgBodyWrap">
        <div class="panel-label" style="margin-bottom:8px">${T('body')}</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <select id="cgBodyType" class="tool-input" style="width:auto" onchange="cgBodyTypeChange()">
            <option value="none">${T('none')}</option>
            <option value="json">JSON</option>
            <option value="form">Form Data</option>
            <option value="raw">Raw</option>
          </select>
        </div>
        <textarea class="tool-textarea" id="cgBody" rows="5" placeholder="{}" style="display:none"></textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" data-tool-submit onclick="cgGenerate()">${T('generate')}</button>
        <button class="btn btn-secondary" onclick="cgClear()">${T('clear')}</button>
        <button class="btn btn-secondary" onclick="cgLoadSample()">${T('sample')}</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:8px">${T('import')}</div>
      <textarea class="tool-textarea" id="cgImportInput" rows="4" placeholder="${T('import_ph')}"></textarea>
      <div class="tool-actions" style="margin-top:8px">
        <button class="btn btn-secondary" data-tool-submit onclick="cgImportParse()">${T('import_btn')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="cgResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="display:flex;gap:6px" id="cgTabs"></div>
        <button class="btn btn-secondary" onclick="cgCopyResult(this)">${T('copy')}</button>
      </div>
      <pre class="result-box" id="cgOutput" style="max-height:360px;overflow-y:auto;color:#93c5fd;white-space:pre-wrap"></pre>
    </div>`;

  cgBodyTypeChange();
  window._cgSession = RequestSession.mount(el, 'curl');
}

function cgAddHeader() {
  const row = document.createElement('div');
  row.className = 'cg-header-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:6px';
  const T = makeToolI18n(_cgDict);
  row.innerHTML = `<input class="tool-input" placeholder="${T('header_name')}" style="flex:1"><input class="tool-input" placeholder="${T('header_value')}" style="flex:2"><button class="copy-inline" onclick="cgRemoveRow(this)">✕</button>`;
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
  const hdrs = Object.create(null);
  rows.forEach(row => {
    const [k, v] = row.querySelectorAll('input');
    if (k.value.trim()) hdrs[k.value.trim()] = v.value.trim();
  });
  return hdrs;
}

function cgGenerate() {
  window._cgSession?.capture();
  const method  = document.getElementById('cgMethod').value;
  const url     = document.getElementById('cgUrl').value.trim();
  if (!url) { showToast(makeToolI18n(_cgDict)('need_url'), 'error'); return; }
  const headers = _cgGetHeaders();
  const btype   = document.getElementById('cgBodyType').value;
  const body    = btype !== 'none' ? document.getElementById('cgBody').value : '';

  const hasContentType = Object.keys(headers).some(key => key.toLowerCase() === 'content-type');
  if (btype === 'json' && !hasContentType) headers['Content-Type'] = 'application/json';
  if (btype === 'form' && !hasContentType) headers['Content-Type'] = 'application/x-www-form-urlencoded';

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

function _genCurl(method, url, headers, body) {
  const quote = value => "'" + String(value).replace(/'/g, "'\\''") + "'";
  const lines = [`curl -X ${method} ${quote(url)}`];
  Object.entries(headers).forEach(([key, value]) => lines.push(`  -H ${quote(key + ': ' + value)}`));
  if (body && !['GET','HEAD'].includes(method)) lines.push(`  --data-raw ${quote(body)}`);
  return lines.join(' \\\n');
}
function _genFetch(method, url, headers, body) {
  const options = { method, headers };
  if (body && !['GET','HEAD'].includes(method)) options.body = body;
  return `const response = await fetch(${JSON.stringify(url)}, ${JSON.stringify(options, null, 2)});\nconst result = await response.text();\nconsole.log(result);`;
}
function _genAxios(method, url, headers, body) {
  const options = { method: method.toLowerCase(), url, headers };
  if (body && !['GET','HEAD'].includes(method)) options.data = body;
  return `const response = await axios(${JSON.stringify(options, null, 2)});\nconsole.log(response.data);`;
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
  document.getElementById('cgBody').value=JSON.stringify(makeToolI18n(_cgDict)('sample_user'),null,2);
  const rows = document.querySelectorAll('.cg-header-row');
  if (rows.length>0){
    rows[0].querySelectorAll('input')[0].value='Authorization';
    rows[0].querySelectorAll('input')[1].value='Bearer your-token-here';
  }
  cgGenerate();
}

// ── cURL Import 反解析 ──
function parseCurlCommand(str) {
  const T = makeToolI18n(_cgDict);
  const tokens = []; let token = '', quote = '', started = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '\\' && quote !== "'") {
      if (i + 1 >= str.length) throw new Error(T('syntax'));
      const next = str[++i];
      if (next === '\n') continue;
      if (quote === '"' && !['"','\\','$','`'].includes(next)) token += '\\';
      token += next; started = true; continue;
    }
    if (quote) { if (ch === quote) quote = ''; else token += ch; started = true; continue; }
    if (ch === "'" || ch === '"') { quote = ch; started = true; continue; }
    if (/\s/.test(ch)) { if (started) { tokens.push(token); token = ''; started = false; } continue; }
    token += ch; started = true;
  }
  if (quote) throw new Error(T('syntax'));
  if (started) tokens.push(token);
  if (tokens[0] === 'curl') tokens.shift();
  const result = { method: 'GET', url: '', headers: {}, body: '' };
  let explicitMethod = false, hasBody = false;
  for (let i = 0; i < tokens.length; i++) {
    let option = tokens[i], value;
    if (option.startsWith('--') && option.includes('=')) { const split = option.indexOf('='); value = option.slice(split + 1); option = option.slice(0, split); }
    if (['-X','--request','-H','--header','-d','--data','--data-raw','--data-binary','--url'].includes(option)) {
      value = value === undefined ? tokens[++i] : value;
      if (value === undefined) throw new Error(T('unsupported', option));
      if (['-X','--request'].includes(option)) { result.method = value.toUpperCase(); explicitMethod = true; }
      else if (['-H','--header'].includes(option)) {
        const colon = value.indexOf(':'); if (colon < 1) throw new Error(T('unsupported', option));
        Object.defineProperty(result.headers, value.slice(0, colon).trim(), { value: value.slice(colon + 1).trim(), enumerable: true, configurable: true, writable: true });
      } else if (option === '--url') result.url = value;
      else {
        if (option !== '--data-raw' && value.startsWith('@')) throw new Error(T('unsupported', option + ' @file'));
        result.body += (hasBody ? '&' : '') + value; hasBody = true;
      }
    } else if (['-I','--head'].includes(option)) { result.method = 'HEAD'; explicitMethod = true; }
    else if (['--compressed','-s','--silent','-S','--show-error','-L','--location','--globoff'].includes(option)) continue;
    else if (/^https?:\/\//i.test(option) && !result.url) result.url = option;
    else throw new Error(T('unsupported', option));
  }
  if (hasBody && !explicitMethod) result.method = 'POST';
  if (hasBody && !Object.keys(result.headers).some(key => key.toLowerCase() === 'content-type')) result.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  if (!/^https?:\/\//i.test(result.url)) throw new Error(T('need_url'));
  if (!['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(result.method)) throw new Error(T('unsupported', result.method));
  return result;
}

function cgImportParse() {
  const T = makeToolI18n(_cgDict);
  const input = document.getElementById('cgImportInput').value.trim();
  if (!input) { showToast(T('need_curl'), 'error'); return; }
  let parsed;
  try { parsed = parseCurlCommand(input); } catch (error) { showToast(error.message, 'error'); return; }
  // Fill form
  document.getElementById('cgMethod').value = parsed.method;
  document.getElementById('cgUrl').value = parsed.url;
  // Clear existing headers and add parsed ones
  document.getElementById('cgHeaders').innerHTML = '';
  const headerEntries = Object.entries(parsed.headers);
  if (headerEntries.length === 0) {
    cgAddHeader();
  } else {
    headerEntries.forEach(([k,v]) => {
      cgAddHeader();
      const rows = document.querySelectorAll('.cg-header-row');
      const lastRow = rows[rows.length-1];
      const inputs = lastRow.querySelectorAll('input');
      inputs[0].value = k;
      inputs[1].value = v;
    });
  }
  // Set body
  if (parsed.body) {
    document.getElementById('cgBodyType').value = 'raw';
    cgBodyTypeChange();
    document.getElementById('cgBody').value = parsed.body;
  } else {
    document.getElementById('cgBodyType').value = 'none';
    cgBodyTypeChange();
  }
  showToast(T('imported'), 'success');
  cgGenerate();
}
