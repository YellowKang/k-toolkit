'use strict';

/* Result text and files stay attached to the actual tool response, never to model prose. */
(function () {
  const T = makeToolI18n({
    zh: { output: '选择结果', final: '最终结果', step: '步骤', copy: '复制完整内容', download: '下载结果', next: '继续处理', send: '带入工具', preview: '预览', truncated: '预览已截断；复制和下载包含完整内容。', file: '下载文件', choose: '选择图片', details: '查看数据', downloadData: '下载完整数据', edit: '调整参数重跑', run: '使用这些参数运行', params: '运行参数（JSON）', failed: '操作失败', select: '选择工具', compress: '压缩 / 转换', base64: '图片 Base64', exif: '图片信息', qr: '识别二维码' },
    en: { output: 'Choose output', final: 'Final result', step: 'Step', copy: 'Copy full output', download: 'Download result', next: 'Continue with', send: 'Open with input', preview: 'Preview', truncated: 'Preview truncated; copy and download include the full output.', file: 'Download file', choose: 'Choose images', details: 'View data', downloadData: 'Download all data', edit: 'Edit and rerun', run: 'Run with these parameters', params: 'Parameters (JSON)', failed: 'Operation failed', select: 'Choose a tool', compress: 'Compress / convert', base64: 'Image Base64', exif: 'Image metadata', qr: 'Decode QR' },
  });
  const own = (value, key) => value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key);
  function unwrap(data) { return own(data, 'result') ? data.result : own(data, 'hash') ? data.hash : data; }
  function values(result) {
    const outputs = [];
    if (own(result, 'data') && (!result.data?.steps || own(result.data, 'result'))) outputs.push({ label: T('final'), value: unwrap(result.data?.steps ? result.data.result : result.data) });
    for (const [id, data] of Object.entries(result.data?.outputs || {})) outputs.push({ label: T('step') + ': ' + id, value: unwrap(data) });
    return outputs.filter(item => item.value !== undefined);
  }
  const textOf = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  function save(text, name) {
    let json = false; try { JSON.parse(text); json = true; } catch {}
    const blob = new Blob([text], { type: json ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) + (json ? '.json' : '.txt'); document.body.append(a);
    try { a.click(); } finally { a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  const button = (label, fn) => { const el = document.createElement('button'); el.type = 'button'; el.className = 'ag-btn'; el.textContent = label; el.addEventListener('click', fn); return el; };
  function chooser(label, options) {
    const select = document.createElement('select'); select.setAttribute('aria-label', label);
    for (const [value, text] of options) { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); }
    return select;
  }
  function mount(host, { tc = {}, result, onRun, onNavigate } = {}) {
    const root = document.createElement('section'); root.className = 'ag-result'; host.append(root);
    const status = document.createElement('p'); status.className = 'ag-result-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const report = error => { status.textContent = error?.message || T('failed'); };
    const action = tc.name || tc.function?.name || 'result';
    const fileResult = Array.isArray(result.data?.files);
    const outputs = fileResult || ['search_tools', 'get_current_context', 'list_workflows'].includes(action) ? [] : values(result);
    if (outputs.length) {
      const select = chooser(T('output'), outputs.map((item, index) => [String(index), item.label]));
      select.dataset.resultSelect = ''; root.append(select);
      const preview = document.createElement('pre'); preview.className = 'ag-workflow-preview'; preview.setAttribute('aria-label', T('preview')); root.append(preview);
      const note = document.createElement('p'); note.className = 'ag-result-note'; root.append(note);
      const selected = () => textOf(outputs[Number(select.value)].value);
      const refresh = () => { const text = selected(); preview.textContent = text.length > 2000 ? text.slice(0, 2000) + '…' : text; note.textContent = text.length > 2000 ? T('truncated') : ''; };
      select.addEventListener('change', refresh); refresh();
      const controls = document.createElement('div'); controls.className = 'ag-result-controls';
      const copy = button(T('copy'), () => window.copyText(selected(), copy)); copy.dataset.resultCopy = '';
      const download = button(T('download'), () => save(selected(), action + '-' + select.value)); download.dataset.resultDownload = '';
      controls.append(copy, download); root.append(controls);
      if (window.ToolWorkspace) {
        const tools = getLocalizedTools(TOOLS);
        const target = chooser(T('next'), Object.keys(ToolWorkspace.fields).map(id => [id, tools.find(tool => tool.id === id)?.name || id]));
        target.dataset.resultTarget = '';
        const handoff = document.createElement('div'); handoff.className = 'ag-result-controls';
        const send = button(T('send'), async () => { try { if (await ToolWorkspace.handoff(target.value, selected())) onNavigate?.(); } catch (error) { report(error); } }); send.dataset.resultSend = '';
        handoff.append(target, send); root.append(handoff);
      }
    }
    for (const file of Array.isArray(result.data?.files) ? result.data.files : []) {
      if (!file || typeof file.id !== 'string') continue;
      const row = document.createElement('div'); row.className = 'ag-result-file';
      const name = document.createElement('strong'); name.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB${file.width && file.height ? ' · ' + file.width + ' × ' + file.height : ''}`; row.append(name);
      const controls = document.createElement('div'); controls.className = 'ag-result-controls';
      const ordinary=file.kind==='file',pool=ordinary?FileSession:ImageSession;
      const download = button(T('file'), () => { try { pool.download(file.id); } catch (error) { report(error); } }); download.dataset.fileDownload = file.id;
      const target = chooser(T('next'), ordinary ? [['base64','Base64'],['hash','Hash'],...Object.keys(window.ToolWorkspace?.fields||{}).filter(id=>!['base64','hash'].includes(id)).map(id=>[id,id])] : [['img-compress', T('compress')], ['img-base64', T('base64')], ['img-exif', T('exif')], ['qrcode-decode', T('qr')]]);
      const send = button(T('send'), async () => {
        try {
          if(ordinary){
            if(['base64','hash'].includes(target.value)){FileSession.useNext(target.value,file.id);await navigateTo(target.value);onNavigate?.();}
            else {const input=await(await ToolCompute.load('file')).text(FileSession.getFile(file.id));FileSession.getFile(file.id);if(await ToolWorkspace.handoff(target.value,input))onNavigate?.();}
          } else if (ImageSession.useNext(target.value, [ImageSession.getFile(file.id)])) { await navigateTo(target.value); onNavigate?.(); }
        } catch (error) { report(error); }
      }); send.dataset.fileSend = file.id;
      controls.append(download, target, send); row.append(controls); root.append(row);
    }
    for (const item of Array.isArray(result.data?.errors) ? result.data.errors : []) {
      const error = document.createElement('p'); error.className = 'ag-result-status'; error.textContent = `${item.name || item.fileId}: ${item.error}`; root.append(error);
    }
    if (result.needsInput && result.toolId === 'img-compress') root.append(button(T('choose'), async () => { await navigateTo('img-compress'); onNavigate?.(); }));
    if (result.needsInput && result.toolId === 'base64') root.append(button(window.getCurrentLang?.()==='en'?'Choose files':'选择文件', async () => { await navigateTo('base64'); onNavigate?.(); }));
    const details = document.createElement('details'); details.className = 'ag-result-details';
    const summary = document.createElement('summary'); summary.textContent = T('details'); details.append(summary);
    const data = JSON.stringify(result.data ?? result, null, 2), pre = document.createElement('pre'); pre.textContent = data.length > 12000 ? data.slice(0, 12000) + '\n…' : data;
    details.append(pre, button(T('downloadData'), () => save(JSON.stringify(result, null, 2), action + '-data')));
    if (!outputs.length) { const copy = button(T('copy'), () => window.copyText(data, copy)); details.append(copy); }
    root.append(details);
    const editable = own(window.AgentWorkflow?.outputs, action) || ['text_diff', 'json_diff', 'regex_test', 'image_convert', 'image_metadata', 'image_qr_decode'].includes(action);
    const parameters = tc.params && JSON.stringify(tc.params, null, 2);
    // Key-bearing requests are not placed in editable UI or DOM attributes.
    if (onRun && editable && parameters && !/"(?:key|password|token|secret)"\s*:/i.test(parameters)) {
      const edit = document.createElement('details'); edit.className = 'ag-result-details';
      const title = document.createElement('summary'); title.textContent = T('edit'); edit.append(title);
      const input = document.createElement('textarea'); input.setAttribute('aria-label', T('params')); input.value = parameters; input.maxLength = 65536; input.rows = 6;
      const run = button(T('run'), async () => {
        run.disabled = true; status.textContent = '';
        try { const params = JSON.parse(input.value); validateAgentInput(params, window._AGENT_ALL_ACTIONS.get(action).parameters); await onRun(action, params); }
        catch (error) { report(error); } finally { run.disabled = false; }
      }); edit.append(input, run); root.append(edit);
    }
    root.append(status); return root;
  }
  window.AgentResults = Object.freeze({ mount, values });
})();
