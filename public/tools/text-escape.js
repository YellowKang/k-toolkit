const _escTl = makeToolI18n({
  zh: {
    type:'处理类型', regex:'正则', input:'输入内容', input_ph:'粘贴文本、JSON 字符串或转义片段…', result:'处理结果',
    escape:'转义', unescape:'去转义一层', unescape_copy:'去转义并复制', expand:'展开 JSON 内容', copy:'复制结果',
    quotes:'转义结果带外层双引号', sample:'嵌套 JSON 示例', clear:'清空', use:'结果作为输入', undo:'撤销输入替换',
    empty:'操作后，结果会显示在这里', json_hint:'支持带外层引号的 JSON 字符串，也支持未带引号的转义片段；一次去转义只处理一层。',
    html_hint:'HTML 去转义只解开一层实体，结果按文本显示。', url_hint:'按 URL 组件编码/解码；+ 保持为加号。', regex_hint:'转义正则特殊符号，去转义只还原这些符号。',
    done:n=>`✓ 处理完成 · ${n} 字符`, expanded:n=>`✓ 已展开 ${n} 处 JSON 字符串`, unchanged:'✓ 内容无需转换',
    invalid_escape:'JSON 转义不完整或无效。检查双引号、反斜杠和换行；去转义不会直接删除所有反斜杠。',
    invalid_json:'没有识别到完整 JSON，请检查内容或先去转义一层。', limit:'内容超过 100 万字符，请缩小范围后处理。',
    complexity:'嵌套内容过大或过深，请分段处理。', layers:'编码层数超过 8 层，请先去转义一层再继续。',
    error:'处理失败，请检查输入内容。', invalid_url:'URL 编码无效，请检查 % 后的十六进制数字与 UTF-8 编码。', working:'正在处理…',
  },
  en: {
    type:'Format', regex:'Regex', input:'Input', input_ph:'Paste text, a JSON string, or an escaped fragment…', result:'Result',
    escape:'Escape', unescape:'Unescape one layer', unescape_copy:'Unescape & copy', expand:'Expand JSON content', copy:'Copy result',
    quotes:'Include outer double quotes', sample:'Nested JSON sample', clear:'Clear', use:'Use result as input', undo:'Undo input replacement',
    empty:'Run an operation to see its result here', json_hint:'Accepts a quoted JSON string or an escaped fragment. Unescape removes exactly one layer.',
    html_hint:'Decode one layer of HTML entities. Results are displayed as text.', url_hint:'Encode/decode a URL component; + remains a plus sign.', regex_hint:'Escape regex metacharacters; unescape only restores those symbols.',
    done:n=>`✓ Done · ${n} chars`, expanded:n=>`✓ Expanded ${n} JSON strings`, unchanged:'✓ No conversion needed',
    invalid_escape:'Invalid JSON string escape. Check quotes, backslashes and line breaks; backslashes are never blindly removed.',
    invalid_json:'No complete JSON found. Check the input or unescape one layer first.', limit:'Input exceeds 1 million characters. Process a smaller section.',
    complexity:'Nested content is too large or deep. Process a smaller section.', layers:'More than 8 encoding layers. Unescape one layer before continuing.',
    error:'Could not process this input. Check its format.', invalid_url:'Invalid URL encoding. Check hexadecimal digits after % and UTF-8 encoding.', working:'Processing…',
  },
});

function renderTextEscape(container) {
  const T = _escTl;
  container.classList.add('escape-workbench');
  if (!document.getElementById('jsonWorkbenchStyles')) {
    const link = document.createElement('link'); link.id = 'jsonWorkbenchStyles'; link.rel = 'stylesheet';
    link.href = 'tools/json-workbench.css?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
    document.head.appendChild(link);
  }
  container.innerHTML = `
    <div class="jw-header">
      <label class="jw-actions">${T('type')} <select class="tool-input" id="escMode" style="width:auto">
        <option value="json">JSON</option><option value="html">HTML</option><option value="url">URL</option><option value="regex">${T('regex')}</option>
      </select></label>
      <div class="jw-actions"><button class="btn btn-secondary" id="escSample">${T('sample')}</button><button class="btn btn-secondary" id="escClear">${T('clear')}</button></div>
    </div>
    <div class="escape-panels">
      <section class="tool-card-panel">
        <label class="panel-label" for="esc-input">${T('input')}</label>
        <textarea class="tool-textarea" id="esc-input" spellcheck="false" placeholder="${T('input_ph')}"></textarea>
        <label class="esc-options" id="escJsonOptions"><input type="checkbox" id="escQuotes">${T('quotes')}</label>
        <p class="jw-hint" id="escHint"></p>
        <div class="tool-actions">
          <button class="btn btn-primary" id="esc-btn" data-tool-submit>${T('escape')}</button>
          <button class="btn btn-secondary" id="unesc-btn">${T('unescape')}</button>
          <button class="btn btn-secondary" id="escUnescapeCopy">${T('unescape_copy')}</button>
          <button class="btn btn-secondary" id="escExpand">${T('expand')}</button>
        </div>
      </section>
      <section class="tool-card-panel">
        <label class="panel-label" for="esc-output">${T('result')}</label>
        <textarea class="tool-textarea" id="esc-output" readonly placeholder="${T('empty')}"></textarea>
        <div class="jw-hint" id="escStatus" role="status" aria-live="polite"></div>
        <div class="tool-actions">
          <button class="btn btn-secondary" id="esc-copy" disabled>${T('copy')}</button>
          <button class="btn btn-secondary" id="escUse" disabled>${T('use')}</button>
          <button class="btn btn-secondary" id="escUndo" disabled>${T('undo')}</button>
        </div>
      </section>
    </div>`;
  const $ = id => container.querySelector('#' + id);
  container._escRevision = 0;
  const invalidate = () => {
    container._escRevision++;
    container._escResult = null;
    $('esc-output').value = ''; $('escStatus').textContent = '';
    $('esc-copy').disabled = true; $('escUse').disabled = true;
  };
  const sync = () => {
    const mode = $('escMode').value;
    $('escHint').textContent = T(mode + '_hint');
    $('escJsonOptions').hidden = mode !== 'json'; $('escExpand').hidden = mode !== 'json';
  };
  $('esc-input').addEventListener('input', invalidate);
  $('escMode').addEventListener('change', () => { invalidate(); sync(); });
  $('escQuotes').addEventListener('change', invalidate);
  $('esc-btn').onclick = () => textEscapeRun('escape');
  $('unesc-btn').onclick = () => textEscapeRun('unescape');
  $('escUnescapeCopy').onclick = () => textEscapeRun('unescape', $('escUnescapeCopy'));
  $('escExpand').onclick = () => textEscapeRun('expand');
  $('esc-copy').onclick = () => { if (container._escResult !== null) copyText(container._escResult, $('esc-copy')); };
  const replaceInput = value => {
    container._escUndo = $('esc-input').value; $('escUndo').disabled = false;
    $('esc-input').value = value; invalidate(); $('esc-input').focus();
  };
  $('escUse').onclick = () => { if (container._escResult !== null) replaceInput(container._escResult); };
  $('escUndo').onclick = () => {
    if (typeof container._escUndo !== 'string') return;
    $('esc-input').value = container._escUndo; container._escUndo = null;
    $('escUndo').disabled = true; invalidate(); $('esc-input').focus();
  };
  $('escClear').onclick = () => replaceInput('');
  $('escSample').onclick = () => {
    $('escMode').value = 'json'; sync();
    replaceInput(JSON.stringify(JSON.stringify({ message: 'Hello, 世界 👋', payload: JSON.stringify({ ok: true, items: [1, 2] }) })));
  };
  container._onDraftRestore = () => { invalidate(); sync(); };
  window._activeCleanup = () => { container._escRevision++; };
  sync(); ToolCompute.load('json-text').catch(() => {});
}

async function textEscapeRun(action, copyButton) {
  const container = document.querySelector('.escape-workbench');
  if (!container) return { success: false };
  const $ = id => container.querySelector('#' + id), T = _escTl;
  const input = $('esc-input').value, mode = $('escMode').value;
  const revision = ++container._escRevision;
  $('escStatus').textContent = T('working'); $('escStatus').style.color = 'var(--text-muted)';
  container._escResult = null; $('esc-output').value = ''; $('esc-copy').disabled = true; $('escUse').disabled = true;
  try {
    let output, label;
    if (input.length > 1000000) throw Object.assign(new Error(), { code: 'limit' });
    if (mode === 'json' && action === 'expand') {
      const result = (await ToolCompute.load('json-text')).expandNested(input);
      output = JSON.stringify(result.value, null, 2); label = result.count ? T('expanded', result.count) : T('unchanged');
    } else output = await (await ToolCompute.load('escape')).run(input, {type:mode,unescape:action==='unescape',quotes:$('escQuotes').checked});
    if (!container.isConnected || revision !== container._escRevision) return { success: false, cancelled: true };
    $('esc-output').value = output; container._escResult = output;
    $('escStatus').textContent = label || (output === input ? T('unchanged') : T('done', output.length));
    $('escStatus').style.color = 'var(--success)'; $('esc-copy').disabled = false; $('escUse').disabled = false;
    if (copyButton) await copyText(output, copyButton);
    return { success: true, result: output };
  } catch (error) {
    if (!container.isConnected || revision !== container._escRevision) return { success: false, cancelled: true };
    const code = ['invalid_escape','invalid_json','limit','complexity','layers','invalid_url'].includes(error.code) ? error.code : 'error';
    $('escStatus').textContent = '✗ ' + T(code); $('escStatus').style.color = 'var(--danger)';
    return { success: false, error: T(code) };
  }
}
