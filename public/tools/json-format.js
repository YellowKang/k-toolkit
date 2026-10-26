// ── i18n ──
const _jsonTl = makeToolI18n({
  zh: {
    input_label:       '输入 JSON',
    sample_btn:        '示例',
    clear_btn:         '清空',
    placeholder:       '粘贴 JSON 内容...',
    format_btn:        '格式化',
    compress_btn:      '压缩',
    sort_btn:          '键名排序',
    escape_btn:        '转义字符串',
    ts_btn:            'TS Interface',
    jsonpath_label:    'JSONPath 查询',
    jsonpath_hint:     '示例: $.name | $.categories[0] | $..author | $.arr[*] | $[?(@.age>20)]',
    jsonpath_placeholder:'输入 JSONPath 表达式...',
    jsonpath_query:    '查询',
    copy_btn:          '复制',
    copy_result:       '复制结果',
    download_btn:      '下载',
    tree_view:         '树形视图',
    text_view:         '文本视图',
    valid:             '✓ 有效',
    encoded:           '✓ 已识别编码后的 JSON',
    invalid:           '✗ 无效',
    format_done:       '格式化完成',
    compressed:        '已压缩',
    sorted:            '键名已排序',
    escaped:           '已转义为 JSON 字符串',
    ts_done:           'TS Interface 已生成',
    invalid_json:      '无效 JSON',
    error_prefix:      '错误：',
    json_invalid_msg:  'JSON 无效: ',
    no_match:          '无匹配结果',
    path_error:        '路径错误: ',
    lines_chars:       (l, c) => `${l} 行 · ${c} 字符`,
    downloaded:        '文件已下载',
    edit_save_fail:    '值无效，请输入合法 JSON 值',
    unescape_btn:'去转义一层', expand_btn:'展开嵌套 JSON', format_copy:'格式化并复制', nested_sample:'嵌套示例',
    copy_mode:'复制格式', copy_current:'当前结果', copy_minified:'压缩 JSON', copy_escaped:'转义字符串',
    copy_value:'复制值', copy_json:'复制 JSON', copy_path:'复制路径', use_result:'结果作为输入', use_value:'作为输入', undo:'撤销输入替换',
    query_source:'查询当前 JSON 结果；尚无结果时查询输入内容。',
    edit:'编辑值', save:'保存', cancel:'取消', edited:'值已更新', tree_limit:'树形视图仅展示前 500 个节点、最多 20 层；复制和下载保留完整内容。',
    object_label:n=>`对象 · ${n} 项`, array_label:n=>`数组 · ${n} 项`, nested_hint:n=>`识别到 ${n} 处 JSON 字符串，可点击“展开嵌套 JSON”。原输入保持不变。`,
    string_hint:'这是 JSON 字符串，点击“去转义一层”可读取原始内容。', large_hint:'内容较大，已暂停自动识别；点击操作按钮继续处理。',
    expanded:n=>`已展开 ${n} 处 JSON 字符串`, unescaped:'已去转义一层', unchanged:'内容无需展开', working:'正在识别…',
    invalid_escape:'JSON 转义无效，请检查外层引号、反斜杠和换行。', invalid_json_text:'未识别到完整 JSON，请检查输入或先去转义一层。',
    limit:'内容超过 100 万字符，请缩小范围处理。', complexity:'嵌套内容过大或过深，请分段处理。', layers:'超过 8 层编码，请先去转义一层再继续。', operation_failed:'处理失败，请检查输入后重试。',
  },
  en: {
    input_label:       'Input JSON',
    sample_btn:        'Sample',
    clear_btn:         'Clear',
    placeholder:       'Paste JSON here...',
    format_btn:        'Format',
    compress_btn:      'Minify',
    sort_btn:          'Sort Keys',
    escape_btn:        'Escape String',
    ts_btn:            'TS Interface',
    jsonpath_label:    'JSONPath Query',
    jsonpath_hint:     'e.g. $.name | $.categories[0] | $..author | $.arr[*] | $[?(@.age>20)]',
    jsonpath_placeholder:'Enter JSONPath expression...',
    jsonpath_query:    'Query',
    copy_btn:          'Copy',
    copy_result:       'Copy Result',
    download_btn:      'Download',
    tree_view:         'Tree View',
    text_view:         'Text View',
    valid:             '✓ Valid',
    encoded:           '✓ Encoded JSON detected',
    invalid:           '✗ Invalid',
    format_done:       'Formatted',
    compressed:        'Minified',
    sorted:            'Keys Sorted',
    escaped:           'Escaped to JSON string',
    ts_done:           'TS Interface Generated',
    invalid_json:      'Invalid JSON',
    error_prefix:      'Error: ',
    json_invalid_msg:  'Invalid JSON: ',
    no_match:          'No match',
    path_error:        'Path error: ',
    lines_chars:       (l, c) => `${l} lines · ${c} chars`,
    downloaded:        'File downloaded',
    edit_save_fail:    'Invalid value, enter a valid JSON value',
    unescape_btn:'Unescape one layer', expand_btn:'Expand nested JSON', format_copy:'Format & copy', nested_sample:'Nested sample',
    copy_mode:'Copy format', copy_current:'Current result', copy_minified:'Minified JSON', copy_escaped:'Escaped string',
    copy_value:'Copy value', copy_json:'Copy JSON', copy_path:'Copy path', use_result:'Use result as input', use_value:'Use as input', undo:'Undo input replacement',
    query_source:'Query the current JSON result, or the input if no result is available.',
    edit:'Edit value', save:'Save', cancel:'Cancel', edited:'Value updated', tree_limit:'Tree preview shows up to 500 nodes and 20 levels. Copy and download include the complete content.',
    object_label:n=>`Object · ${n} items`, array_label:n=>`Array · ${n} items`, nested_hint:n=>`Found ${n} JSON strings. Use “Expand nested JSON” to open them. Your input stays unchanged.`,
    string_hint:'This is a JSON string. Unescape one layer to read its original content.', large_hint:'Automatic detection is paused for large content. Use an action button to process it.',
    expanded:n=>`Expanded ${n} JSON strings`, unescaped:'Unescaped one layer', unchanged:'No nested JSON to expand', working:'Checking…',
    invalid_escape:'Invalid JSON string escape. Check outer quotes, backslashes and line breaks.', invalid_json_text:'No complete JSON found. Check the input or unescape one layer first.',
    limit:'Input exceeds 1 million characters. Process a smaller section.', complexity:'Nested content is too large or deep. Process a smaller section.', layers:'More than 8 encoding layers. Unescape one layer before continuing.', operation_failed:'Could not process this input. Check it and retry.',
  }
});

function renderJSON(el) {
  const tl = _jsonTl;
  el.classList.add('json-workbench');
  if (!document.getElementById('jsonWorkbenchStyles')) {
    const link = document.createElement('link'); link.id = 'jsonWorkbenchStyles'; link.rel = 'stylesheet';
    link.href = 'tools/json-workbench.css?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
    document.head.appendChild(link);
  }
  el.innerHTML = `
    <section class="tool-card-panel">
      <div class="jw-header">
        <label class="panel-label" for="jsonInput">${tl('input_label')}</label>
        <div class="jw-actions"><span id="jsonLiveStatus" class="jw-hint" role="status"></span>
          <button class="btn btn-secondary" onclick="jsonLoadSample()">${tl('sample_btn')}</button>
          <button class="btn btn-secondary" onclick="jsonNestedSample()">${tl('nested_sample')}</button>
          <button class="btn btn-secondary" onclick="clearJSON()">${tl('clear_btn')}</button>
          <button class="btn btn-secondary" id="jsonUndo" onclick="jsonUndoInput()" disabled>${tl('undo')}</button>
        </div>
      </div>
      <textarea class="tool-textarea" id="jsonInput" rows="9" spellcheck="false" placeholder="${tl('placeholder')}"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" data-tool-submit onclick="formatJSON()">${tl('format_btn')}</button>
        <button class="btn btn-secondary" onclick="jsonFormatCopy(this)">${tl('format_copy')}</button>
        <button class="btn btn-secondary" onclick="compressJSON()">${tl('compress_btn')}</button>
        <button class="btn btn-secondary" onclick="jsonSort()">${tl('sort_btn')}</button>
        <button class="btn btn-secondary" onclick="jsonEscape()">${tl('escape_btn')}</button>
        <button class="btn btn-secondary" onclick="jsonUnescape()">${tl('unescape_btn')}</button>
        <button class="btn btn-secondary" onclick="jsonExpandNested()">${tl('expand_btn')}</button>
      </div>
      <div id="jsonDetectHint" class="jw-hint" role="status" aria-live="polite"></div>
    </section>
    <section class="tool-card-panel" id="jsonResultPanel" style="display:none">
      <div class="jw-header">
        <div class="jw-actions"><div class="panel-label" id="jsonStatus"></div><span id="jsonMeta" class="jw-hint"></span></div>
        <div class="jw-actions">
          <select class="tool-input jw-copy-mode" id="jsonCopyMode" aria-label="${tl('copy_mode')}">
            <option value="current">${tl('copy_current')}</option><option value="minified">${tl('copy_minified')}</option><option value="escaped">${tl('copy_escaped')}</option>
          </select>
          <button class="btn btn-secondary" id="jsonCopy" onclick="copyJSON(this)">${tl('copy_result')}</button>
          <button class="btn btn-secondary" id="jsonUse" onclick="jsonUseResult()">${tl('use_result')}</button>
          <button class="btn btn-secondary" id="jsonDownload" onclick="jsonDownload()">${tl('download_btn')}</button>
          <button class="btn btn-secondary" id="jsonTreeBtn" onclick="jsonToggleView()">${tl('tree_view')}</button>
        </div>
      </div>
      <pre class="result-box" id="jsonOutput"></pre>
      <div id="jsonTreeOutput" style="display:none"></div>
    </section>
    <details class="jw-path-query">
      <summary>${tl('jsonpath_label')} · TypeScript</summary>
      <p class="jw-hint">${tl('query_source')}</p>
      <p class="jw-hint">${tl('jsonpath_hint')}</p>
      <div class="jw-actions">
        <input class="tool-input" id="jsonPathInput" aria-label="${tl('jsonpath_label')}" placeholder="${tl('jsonpath_placeholder')}" style="flex:1;min-width:160px" oninput="jsonPathQuery()">
        <button class="btn btn-secondary" onclick="jsonPathQuery()">${tl('jsonpath_query')}</button>
        <button class="btn btn-secondary" onclick="jsonToTsInterface()">${tl('ts_btn')}</button>
      </div><div id="jsonPathResult" style="margin-top:10px"></div>
    </details>`;
  el._jsonRevision = 0;
  const ta = el.querySelector('#jsonInput');
  ta.addEventListener('input', _jsonInputChanged);
  ta.addEventListener('compositionstart', () => { el._jsonComposing = true; clearTimeout(el._jsonTimer); });
  ta.addEventListener('compositionend', () => { el._jsonComposing = false; _jsonInputChanged(); });
  ta.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.isComposing) { e.preventDefault(); formatJSON(); }
  });
  el._onDraftRestore = _jsonInputChanged;
  window._activeCleanup = () => { clearTimeout(el._jsonTimer); el._jsonRevision++; };
  ToolCompute.load('json-text').catch(() => {});
}

function _jsonInputChanged() {
  const body = document.querySelector('.json-workbench');
  if (!body) return;
  clearTimeout(body._jsonTimer); body._jsonRevision++;
  document.getElementById('jsonResultPanel').style.display = 'none';
  document.getElementById('jsonResultPanel')._jsonSuccess = false;
  document.getElementById('jsonOutput').textContent = '';
  document.getElementById('jsonTreeOutput').replaceChildren();
  document.getElementById('jsonTreeOutput')._jsonValue = undefined;
  document.getElementById('jsonPathResult').replaceChildren();
  document.getElementById('jsonLiveStatus').textContent = '';
  document.getElementById('jsonDetectHint').textContent = '';
  if (document.getElementById('jsonInput').value.length > 100000) {
    document.getElementById('jsonDetectHint').textContent = _jsonTl('large_hint'); return;
  }
  if (!body._jsonComposing) body._jsonTimer = setTimeout(_jsonLiveCheck, 220);
}

async function _jsonLiveCheck() {
  const input = document.getElementById('jsonInput');
  if (!input) return;
  const body = input.closest('.json-workbench'), raw = input.value, revision = body._jsonRevision;
  if (raw.length > 100000) return;
  try {
    const compute = await ToolCompute.load('json-text');
    if (!input.isConnected || input.value !== raw || revision !== body._jsonRevision) return;
    const info = compute.inspect(raw), status = document.getElementById('jsonLiveStatus');
    status.textContent = info.kind === 'empty' ? '' : _jsonTl(info.kind === 'invalid' ? 'invalid' : info.kind === 'encoded' ? 'encoded' : 'valid');
    status.style.color = info.kind === 'invalid' ? 'var(--danger)' : 'var(--success)';
    document.getElementById('jsonDetectHint').textContent = info.count ? _jsonTl('nested_hint', info.count) : info.kind === 'string' ? _jsonTl('string_hint') : '';
  } catch (error) {
    if (input.isConnected && revision === body._jsonRevision) document.getElementById('jsonDetectHint').textContent = _jsonErrorText(error);
  }
}

function _jsonErrorText(error) {
  const code = error?.code;
  return _jsonTl(({invalid_escape:'invalid_escape',invalid_json:'invalid_json_text',limit:'limit',complexity:'complexity',layers:'layers'})[code] || 'operation_failed');
}

function _jsonRender(text, label, success) {
  const panel = document.getElementById('jsonResultPanel'), output = document.getElementById('jsonOutput');
  if (!panel || !output) return;
  output.textContent = text; panel._jsonSuccess = success;
  const status = document.getElementById('jsonStatus');
  status.textContent = (success ? '✓ ' : '✗ ') + label;
  status.style.color = success ? 'var(--success)' : 'var(--danger)';
  document.getElementById('jsonMeta').textContent = success ? _jsonTl('lines_chars', text.split('\n').length, text.length) : '';
  panel.style.display = '';
  const tree = document.getElementById('jsonTreeOutput'); tree.style.display = 'none'; tree.replaceChildren(); tree._jsonValue = undefined;
  output.style.display = ''; document.getElementById('jsonTreeBtn').textContent = _jsonTl('tree_view');
  let isJSON = false;
  if (success) { try { JSON.parse(text); isJSON = true; } catch {} }
  for (const id of ['jsonCopy','jsonUse','jsonDownload']) document.getElementById(id).disabled = !success;
  document.getElementById('jsonTreeBtn').disabled = !isJSON;
  const copyMode = document.getElementById('jsonCopyMode');
  copyMode.querySelector('[value=minified]').disabled = !isJSON;
  if (!isJSON && copyMode.value === 'minified') copyMode.value = 'current';
  if (document.getElementById('jsonPathInput').value.trim()) jsonPathQuery();
}

function _jsonTransform(fn, label, allowEmpty = false) {
  const raw = document.getElementById('jsonInput').value;
  if (!raw.trim() && !allowEmpty) return { success: false };
  try {
    if (raw.length > 1000000) throw Object.assign(new Error(), { code: 'limit' });
    const text = fn(raw); _jsonRender(text, _jsonTl(label), true); return { success: true, result: text };
  } catch (error) {
    const message = error.code ? _jsonErrorText(error) : _jsonTl('error_prefix') + error.message;
    _jsonRender(message, _jsonTl('invalid_json'), false); return { success: false, error: message };
  }
}
function formatJSON() { return _jsonTransform(raw => JSON.stringify(JSON.parse(raw), null, 2), 'format_done'); }
function compressJSON() { return _jsonTransform(raw => JSON.stringify(JSON.parse(raw)), 'compressed'); }
function jsonSort() { return _jsonTransform(raw => JSON.stringify(_sortKeys(JSON.parse(raw)), null, 2), 'sorted'); }
function _sortKeys(obj) {
  if (Array.isArray(obj)) return obj.map(_sortKeys);
  if (obj !== null && typeof obj === 'object') return Object.fromEntries(Object.keys(obj).sort().map(k => [k, _sortKeys(obj[k])]));
  return obj;
}
function jsonEscape() { return _jsonTransform(raw => JSON.stringify(raw), 'escaped', true); }
function jsonUnescape() { return _jsonStringAction('unescape'); }
function jsonExpandNested() { return _jsonStringAction('expand'); }
async function _jsonStringAction(action) {
  const input = document.getElementById('jsonInput'), body = input.closest('.json-workbench');
  const raw = input.value, revision = ++body._jsonRevision;
  const panel = document.getElementById('jsonResultPanel'); panel._jsonSuccess = false; panel.style.display = 'none';
  document.getElementById('jsonLiveStatus').textContent = _jsonTl('working');
  try {
    const compute = await ToolCompute.load('json-text');
    if (!input.isConnected || raw !== input.value || revision !== body._jsonRevision) return { success: false, cancelled: true };
    if (action === 'unescape') _jsonRender(compute.unescapeJSON(raw), _jsonTl('unescaped'), true);
    else {
      const result = compute.expandNested(raw);
      _jsonRender(JSON.stringify(result.value, null, 2), result.count ? _jsonTl('expanded', result.count) : _jsonTl('unchanged'), true);
    }
    document.getElementById('jsonLiveStatus').textContent = '';
    return { success: true };
  } catch (error) {
    if (!input.isConnected || revision !== body._jsonRevision) return { success: false, cancelled: true };
    document.getElementById('jsonLiveStatus').textContent = '';
    const message = _jsonErrorText(error); _jsonRender(message, _jsonTl('invalid_json'), false); return { success: false, error: message };
  }
}

function _jsonReplaceInput(text) {
  const input = document.getElementById('jsonInput'), body = input.closest('.json-workbench');
  body._jsonUndo = input.value; document.getElementById('jsonUndo').disabled = false;
  input.value = text; _jsonInputChanged(); input.focus();
}
function jsonUseResult() { if (document.getElementById('jsonResultPanel')._jsonSuccess) _jsonReplaceInput(document.getElementById('jsonOutput').textContent); }
function jsonUndoInput() {
  const input = document.getElementById('jsonInput'), body = input.closest('.json-workbench');
  if (typeof body._jsonUndo !== 'string') return;
  input.value = body._jsonUndo; body._jsonUndo = null; document.getElementById('jsonUndo').disabled = true;
  _jsonInputChanged(); input.focus();
}
function clearJSON() { _jsonReplaceInput(''); }
function jsonNestedSample() {
  _jsonReplaceInput(JSON.stringify({ requestId:'00123', payload:JSON.stringify({ name:'BIGKANG', tags:['JSON','工具'], detail:JSON.stringify({ ok:true, count:2 }) }), path:'C:\\data\\file.json' }, null, 2));
}
function jsonFormatCopy(btn) { const result = formatJSON(); if (result.success) return copyText(result.result, btn); }
function copyJSON(btn) {
  if (!document.getElementById('jsonResultPanel')._jsonSuccess) return;
  let text = document.getElementById('jsonOutput').textContent;
  try {
    const mode = document.getElementById('jsonCopyMode').value;
    if (mode === 'minified') text = JSON.stringify(JSON.parse(text));
    if (mode === 'escaped') text = JSON.stringify(text);
    return copyText(text, btn);
  } catch { showToast(_jsonTl('invalid_json'), 'error'); }
}
function jsonDownload() {
  if (!document.getElementById('jsonResultPanel')._jsonSuccess) return;
  const text = document.getElementById('jsonOutput').textContent;
  let json = true; try { JSON.parse(text); } catch { json = false; }
  const url = URL.createObjectURL(new Blob([text], { type: json ? 'application/json' : 'text/plain' }));
  const a = document.createElement('a'); a.href = url; a.download = json ? 'output.json' : 'output.txt'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); showToast(_jsonTl('downloaded'));
}

function _jPathKey(key) { return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? '.' + key : '[' + JSON.stringify(key) + ']'; }
function jsonToggleView() {
  const output = document.getElementById('jsonOutput'), tree = document.getElementById('jsonTreeOutput'), btn = document.getElementById('jsonTreeBtn');
  if (tree.style.display !== 'none') { tree.style.display = 'none'; output.style.display = ''; btn.textContent = _jsonTl('tree_view'); return; }
  try { _jsonBuildTree(JSON.parse(output.textContent), tree); }
  catch { return; }
  output.style.display = 'none'; tree.style.display = ''; btn.textContent = _jsonTl('text_view');
}

function _jsonBuildTree(value, tree) {
  tree.replaceChildren(); tree._jsonValue = value;
  const bar = document.createElement('div'); bar.id = 'jsonPathBar'; bar.hidden = true; tree.appendChild(bar);
  let nodes = 0, limited = false;
  function build(val, path, parent, key, depth) {
    nodes++;
    const node = { value:val, path, parent, key, tree };
    const wrap = document.createElement('div');
    const select = document.createElement('button'); select.type = 'button'; select.className = 'jt-select'; select.dataset.jpath = path;
    let text;
    if (val === null) { select.classList.add('jt-null'); text = 'null'; }
    else if (typeof val !== 'object') {
      select.classList.add('jt-' + typeof val); text = JSON.stringify(val);
      if (text.length > 260) text = text.slice(0, 260) + '…';
    } else text = _jsonTl(Array.isArray(val) ? 'array_label' : 'object_label', Object.keys(val).length);
    select.textContent = (parent && !Array.isArray(parent) ? JSON.stringify(key) + ': ' : '') + text;
    select.onclick = () => _jShowPath(node, select);
    select.ondblclick = () => { _jShowPath(node, select); _jTreeEdit(node); };
    wrap.appendChild(select);
    if (val !== null && typeof val === 'object') {
      if (depth >= 20) { limited = true; return wrap; }
      const children = document.createElement('div');
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'jt-collapse';
      toggle.textContent = depth < 2 ? '▾' : '▸'; toggle.setAttribute('aria-label', path); toggle.setAttribute('aria-expanded', String(depth < 2)); children.hidden = depth >= 2;
      toggle.onclick = () => { children.hidden = !children.hidden; toggle.textContent = children.hidden ? '▸' : '▾'; toggle.setAttribute('aria-expanded', String(!children.hidden)); };
      wrap.prepend(toggle);
      for (const childKey of Object.keys(val)) {
        if (nodes >= 500) { limited = true; break; }
        const childPath = path + (Array.isArray(val) ? '[' + childKey + ']' : _jPathKey(childKey));
        const child = build(val[childKey], childPath, val, childKey, depth + 1); child.className = 'jt-row'; children.appendChild(child);
      }
      wrap.appendChild(children);
    }
    return wrap;
  }
  tree.appendChild(build(value, '$', null, null, 0));
  if (limited) { const note = document.createElement('p'); note.className = 'jw-hint'; note.textContent = _jsonTl('tree_limit'); tree.appendChild(note); }
}
function _jShowPath(node, selected) {
  const tree = node.tree, bar = tree.querySelector('#jsonPathBar');
  tree.querySelector('.jt-active')?.classList.remove('jt-active'); selected.classList.add('jt-active');
  bar.hidden = false; bar.replaceChildren();
  const code = document.createElement('code'); code.textContent = node.path; bar.appendChild(code);
  const actions = document.createElement('div'); actions.className = 'jw-actions'; bar.appendChild(actions);
  const button = (label, action) => { const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-secondary'; btn.textContent = _jsonTl(label); btn.onclick = () => action(btn); actions.appendChild(btn); };
  const raw = () => typeof node.value === 'string' ? node.value : JSON.stringify(node.value, null, 2);
  button('copy_value', btn => copyText(raw(), btn));
  button('copy_json', btn => copyText(JSON.stringify(node.value, null, 2), btn));
  button('copy_path', btn => copyText(node.path, btn));
  button('use_value', () => _jsonReplaceInput(raw()));
  button('edit', () => _jTreeEdit(node));
}
function _jTreeEdit(node) {
  const bar = node.tree.querySelector('#jsonPathBar');
  if (!bar || bar.querySelector('textarea')) return;
  const input = document.createElement('textarea'); input.className = 'tool-textarea jt-edit-input'; input.setAttribute('aria-label', _jsonTl('edit'));
  input.value = typeof node.value === 'string' ? node.value : JSON.stringify(node.value, null, 2);
  const actions = document.createElement('div'); actions.className = 'jw-actions';
  const cancel = () => { input.remove(); actions.remove(); };
  for (const key of ['save','cancel']) {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-secondary'; btn.textContent = _jsonTl(key);
    btn.onclick = () => {
      if (key === 'cancel') return cancel();
      let value;
      try { value = typeof node.value === 'string' ? input.value : JSON.parse(input.value); }
      catch { showToast(_jsonTl('edit_save_fail'), 'error'); return; }
      if (node.parent) Object.defineProperty(node.parent, node.key, {value, enumerable:true, configurable:true, writable:true});
      else node.tree._jsonValue = value;
      _jsonRender(JSON.stringify(node.tree._jsonValue, null, 2), _jsonTl('edited'), true); jsonToggleView();
    };
    actions.appendChild(btn);
  }
  input.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } });
  bar.append(input, actions); input.focus();
}

function jsonPathQuery() {
  const path = (document.getElementById('jsonPathInput') || {}).value || '';
  const resultEl = document.getElementById('jsonPathResult');
  if (!resultEl) return;
  let raw = (document.getElementById('jsonInput') || {}).value.trim();
  const current = document.getElementById('jsonResultPanel');
  if (current?._jsonSuccess && current.style.display !== 'none') {
    const result = document.getElementById('jsonOutput').textContent;
    try { JSON.parse(result); raw = result; } catch {}
  }
  if (!raw) { resultEl.innerHTML = ''; return; }
  let obj;
  try { obj = JSON.parse(raw); } catch(e) { resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px">${_jsonTl('json_invalid_msg')}${escHtml(e.message)}</span>`; return; }
  if (!path.trim()) { resultEl.innerHTML = ''; return; }
  try {
    const result = _jsonPath(obj, path.trim());
    if (result === undefined) {
      resultEl.innerHTML = `<span style="color:var(--text-muted);font-size:12px">${_jsonTl('no_match')}</span>`;
    } else {
      const text = JSON.stringify(result, null, 2);
      resultEl.innerHTML = `<pre class="result-box" style="max-height:200px;overflow-y:auto">${escHtml(text)}</pre>`;
      const copy = document.createElement('button'); copy.className = 'btn btn-secondary'; copy.textContent = _jsonTl('copy_result');
      copy.onclick = () => copyText(text, copy); resultEl.appendChild(copy);
    }
  } catch(e) {
    resultEl.innerHTML = `<span style="color:#ef4444;font-size:12px">${_jsonTl('path_error')}${escHtml(e.message)}</span>`;
  }
}

// ── JSONPath 实现：支持 $、.key、[n]、..key、[*]、[?(@.key op value)] ──
function _jsonReadPathKey(path) {
  if (path[0] !== '[' || !['"', "'"].includes(path[1])) return null;
  const quote = path[1]; let key = '', i = 2;
  while (i < path.length) {
    const char = path[i++];
    if (char === quote) {
      if (path[i] !== ']') throw new Error('Invalid property path');
      return { key, rest:path.slice(i + 1) };
    }
    if (char === '\\') {
      const escaped = path[i++];
      if (escaped === quote) key += quote;
      else if (escaped === 'u') { key += JSON.parse('"\\u' + path.slice(i, i + 4) + '"'); i += 4; }
      else key += JSON.parse('"\\' + escaped + '"');
    } else { if (char.charCodeAt(0) < 32) throw new Error('Invalid property path'); key += char; }
  }
  throw new Error('Unclosed property path');
}
function _jsonOwn(obj, key) { return obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : undefined; }
function _jsonPath(obj, path) {
  if (path === '$') return obj;
  let p = path.replace(/^\$/, '');

  // 递归下降 ..key
  if (p.startsWith('..')) {
    const key = p.slice(2).split(/[.[\s]/, 1)[0];
    const rest = p.slice(2 + key.length);
    const results = [];
    function descend(node) {
      if (node === null || typeof node !== 'object') return;
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        const val = rest ? _jsonPath(node[key], '$' + rest) : node[key];
        if (val !== undefined) results.push(val);
      }
      Object.values(node).forEach(descend);
    }
    descend(obj);
    return results.length === 1 ? results[0] : results.length ? results : undefined;
  }

  // 逐段解析，支持 [*] 和 [?()]
  let cur = [obj]; // work with array of candidates for wildcard/filter support
  let rem = p;

  while (rem) {
    // [*] array wildcard
    const wildcard = rem.match(/^\[\*\](.*)/);
    if (wildcard) {
      const next = [];
      for (const c of cur) {
        if (Array.isArray(c)) next.push(...c);
        else if (c !== null && typeof c === 'object') next.push(...Object.values(c));
      }
      cur = next;
      rem = wildcard[1];
      continue;
    }

    // [?(@.key op value)] filter expression
    const filter = rem.match(/^\[\?\(@\.([\w$]+)\s*(==|!=|>=|<=|>|<)\s*(.+?)\)\](.*)/);
    if (filter) {
      const fKey = filter[1];
      const fOp = filter[2];
      let fVal = filter[3].trim();
      // parse the comparison value
      if (fVal === 'true') fVal = true;
      else if (fVal === 'false') fVal = false;
      else if (fVal === 'null') fVal = null;
      else if (/^['"]/.test(fVal)) fVal = fVal.slice(1, -1);
      else if (!isNaN(Number(fVal))) fVal = Number(fVal);

      const next = [];
      for (const c of cur) {
        if (!Array.isArray(c)) continue;
        for (const item of c) {
          if (item === null || typeof item !== 'object') continue;
          const v = _jsonOwn(item, fKey);
          let pass = false;
          switch (fOp) {
            case '==': pass = v == fVal; break;
            case '!=': pass = v != fVal; break;
            case '>':  pass = v > fVal; break;
            case '>=': pass = v >= fVal; break;
            case '<':  pass = v < fVal; break;
            case '<=': pass = v <= fVal; break;
          }
          if (pass) next.push(item);
        }
      }
      cur = next;
      rem = filter[4];
      continue;
    }

    // .key
    const dot = rem.match(/^\.([\w$]+)(.*)/);
    if (dot) {
      cur = cur.map(c => _jsonOwn(c, dot[1])).filter(v => v !== undefined);
      rem = dot[2];
      continue;
    }

    // [n] numeric index
    const bracket = rem.match(/^\[(\d+)\](.*)/);
    if (bracket) {
      cur = cur.map(c => _jsonOwn(c, Number(bracket[1]))).filter(v => v !== undefined);
      rem = bracket[2];
      continue;
    }

    // ['key'] or ["key"]
    const bracketKey = _jsonReadPathKey(rem);
    if (bracketKey) {
      cur = cur.map(c => _jsonOwn(c, bracketKey.key)).filter(v => v !== undefined);
      rem = bracketKey.rest;
      continue;
    }

    throw new Error('Unsupported JSONPath expression');
  }

  if (cur.length === 0) return undefined;
  if (cur.length === 1) return cur[0];
  return cur;
}

// ── JSON → TypeScript Interface ──
function jsonToTsInterface() {
  const v = document.getElementById('jsonInput').value.trim();
  if (!v) return;
  let obj;
  try { obj = JSON.parse(v); } catch(e) {
    _jsonRender(_jsonTl('error_prefix') + e.message, _jsonTl('invalid_json'), false);
    return;
  }
  const interfaces = [];
  _jsonToTs(obj, 'RootObject', interfaces);
  const result = interfaces.join('\n\n');
  _jsonRender(result, _jsonTl('ts_done'), true);
}

function _jsonToTs(val, name, interfaces) {
  if (val === null || typeof val !== 'object') {
    // Primitive at root level — just show the type
    interfaces.push(`type ${name} = ${_jsonTsType(val, name, interfaces)};`);
    return;
  }

  if (Array.isArray(val)) {
    const itemType = val.length > 0 ? _jsonTsType(val[0], name + 'Item', interfaces) : 'unknown';
    interfaces.push(`type ${name} = ${itemType}[];`);
    return;
  }

  const lines = [`interface ${name} {`];
  for (const [key, value] of Object.entries(val)) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
    const tsType = _jsonTsType(value, _tsPascal(key), interfaces);
    lines.push(`  ${safeKey}: ${tsType};`);
  }
  lines.push('}');
  interfaces.push(lines.join('\n'));
}

function _jsonTsType(val, hintName, interfaces) {
  if (val === null) return 'null';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'boolean') return 'boolean';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'unknown[]';
    const first = val[0];
    if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
      _jsonToTs(first, hintName, interfaces);
      return hintName + '[]';
    }
    return _jsonTsType(first, hintName + 'Item', interfaces) + '[]';
  }
  if (typeof val === 'object') {
    _jsonToTs(val, hintName, interfaces);
    return hintName;
  }
  return 'unknown';
}

function _tsPascal(str) {
  return str.replace(/(^|[_\-\s])(\w)/g, (_, _sep, c) => c.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '');
}

function jsonLoadSample() {
  _jsonReplaceInput(JSON.stringify({
    name: 'K Toolkit', version: '2.0', tags: ['JSON', 'Markdown', 'SQL'],
    meta: { author: 'BIGKANG', local: true }
  }, null, 2));
}
