// Ordinary text drafts live only in this tab. Credential/file tools have their own lifecycle.
(function () {
  const T = makeToolI18n({
    zh: { more: '更多设置', restored: '输入已恢复，请重新运行以更新结果。', next: '继续处理', send: '带入工具', resume: '继续上次任务', saved: '草稿保留在当前标签页，刷新后清除', replace: '目标工具已有输入，是否替换？', empty: '请先生成或输入要继续处理的内容', limit: '内容过大，请下载后手动导入', source: '当前结果', input: '当前输入' },
    en: { more: 'More settings', restored: 'Input restored. Run again to update the result.', next: 'Continue with', send: 'Open with input', resume: 'Resume last task', saved: 'Drafts stay in this tab and clear on refresh', replace: 'This tool already has input. Replace it?', empty: 'Generate a result or enter content first', limit: 'Content is too large. Download it and import manually.', source: 'Current result', input: 'Current input' },
  });
  const fields = {
    json: ['jsonInput', 'jsonOutput'], base64: ['b64Input', 'b64Output'],
    'yaml-json': ['yjInput', 'yjOutput'], 'toml-json': ['tjTomlIn', 'tjOutput'],
    'xml-format': ['xmlInput', 'xmlOutput'], 'json-csv': ['jcInput', 'jcOutput'],
    'case-convert': ['ccText', 'ccOutput'], 'line-sort': ['lsInput', 'lsOutput'],
    wordcount: ['wcInput'], 'text-escape': ['esc-input', 'esc-output'],
    'html-entity': ['heInput', 'heOutput'], 'unicode-convert': ['unicodeInput', 'unicodeOutput'],
    'text-diff': ['diffA'], 'diff-json': ['djInputA'], 'slug-gen': ['sgInput', 'sgResult'],
    'sql-format': ['sqlInput','sqlOutput'], 'json-schema': ['jsInput','jsOutput'],
  };
  const drafts = new Map();
  let pending = null, last = null;
  const read = node => node && ('value' in node ? node.value : node.textContent);
  function capture(id) {
    if (!fields[id]) return;
    const body = document.getElementById('toolBody');
    if (!body || body.dataset.tool !== id) return;
    const values = [...body.querySelectorAll('input[id],textarea[id],select[id]')]
      .filter(el => !['file', 'password', 'hidden'].includes(el.type))
      .map(el => ({ id: el.id, value: el.value, checked: el.checked }));
    const bytes = 2 * values.reduce((sum, item) => sum + item.value.length, body.textContent.length);
    drafts.delete(id);
    if (bytes > 2 * 1024 * 1024) return;
    drafts.set(id, { body, values, lang: getCurrentLang(), bytes, cleanup: window._activeCleanup });
    while (drafts.size > 10 || [...drafts.values()].reduce((n, d) => n + d.bytes, 0) > 8 * 1024 * 1024) drafts.delete(drafts.keys().next().value);
    if (values.some(v => [fields[id][0], 'tjJsonIn'].includes(v.id) && v.value.trim())) last = id;
  }
  function mount(id, body, render) {
    body.dataset.tool = id;
    const draft = drafts.get(id);
    if (draft?.lang === getCurrentLang() && pending?.target !== id) {
      body.replaceWith(draft.body);
      window._activeCleanup = draft.cleanup;
      return draft.body;
    }
    body._renderReady=Promise.resolve(render(body));
    body._renderReady.catch(error=>{if(body.isConnected)window.showToast?.(error.message,'error');});
    if (draft) {
      for (const field of draft.values) {
        const el = body.querySelector('#' + CSS.escape(field.id));
        if (el && !['file', 'password'].includes(el.type)) { el.value = field.value; if ('checked' in el) el.checked = field.checked; }
      }
      body._onDraftRestore?.();
      if (['wordcount', 'slug-gen', 'case-convert'].includes(id)) {
        body.querySelector('#' + CSS.escape(fields[id][0])).dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        const status = document.createElement('p'); status.className = 'workspace-notice'; status.textContent = T('restored'); body.prepend(status);
        body.addEventListener('input', () => status.remove(), { once: true });
        body.addEventListener('click', () => status.remove(), { once: true });
      }
      drafts.delete(id);
    }
    if (pending?.target === id) {
      let field = fields[id][0];
      if (id === 'toml-json') { try { JSON.parse(pending.text); tjSwitchTab(2); field = 'tjJsonIn'; } catch {} }
      const input = body.querySelector('#' + CSS.escape(field));
      if (input) {
        input.value = pending.text;
        // Input handlers in this allowlist perform local computation only.
        input.dispatchEvent(new Event('input', { bubbles: true })); input.focus();
      }
      pending = null;
    }
    return body;
  }
  function mountActions(id, body) {
    if (!fields[id] || body.querySelector('.workspace-actions')) return;
    const box = document.createElement('section'); box.className = 'tool-card-panel workspace-actions';
    const label = document.createElement('label'); label.textContent = T('next');
    const source = document.createElement('select'); source.className = 'tool-input'; source.setAttribute('aria-label', T('source'));
    for (const [value, key] of [['result', 'source'], ['input', 'input']]) {
      const option = document.createElement('option'); option.value = value; option.textContent = T(key); source.appendChild(option);
    }
    const select = document.createElement('select'); select.className = 'tool-input'; select.setAttribute('aria-label', T('next'));
    const local = getLocalizedTools(TOOLS);
    for (const [target] of Object.entries(fields)) {
      if (target === id || ['text-diff','diff-json'].includes(target)) continue;
      const option = document.createElement('option'); option.value = target; option.textContent = local.find(tool => tool.id === target).name; select.appendChild(option);
    }
    label.appendChild(select);
    const button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary'; button.textContent = T('send');
    button.addEventListener('click', () => {
      const ids = fields[id];
      let field = source.value === 'result' ? ids[1] || ids[0] : ids[0];
      if (id === 'toml-json' && source.value === 'input' && body.querySelector('#tjPane1').style.display === 'none') field = 'tjJsonIn';
      const node = body.querySelector('#' + CSS.escape(field));
      const text = read(source.value === 'result' && id === 'unicode-convert' ? node?.querySelector('pre') : node);
      if (!text) return showToast(T('empty'), 'info');
      handoff(select.value, text);
    });
    const note = document.createElement('p'); note.className = 'workspace-notice'; note.textContent = T('saved');
    box.append(source, label, button, note); body.appendChild(box);
  }
  async function handoff(target, text) {
    if (!fields[target] || typeof text !== 'string') return false;
    if (text.length > 2 * 1024 * 1024) { showToast(T('limit'), 'error'); return false; }
    let targetField = fields[target][0];
    if (target === 'toml-json') { try { JSON.parse(text); targetField = 'tjJsonIn'; } catch {} }
    const live = document.getElementById('toolBody');
    const existing = live?.dataset.tool === target ? read(live.querySelector('#' + CSS.escape(targetField))) : drafts.get(target)?.values.find(f => f.id === targetField)?.value;
    if (existing && existing !== text && !confirm(T('replace'))) return false;
    pending = { target, text }; await navigateTo(target); return true;
  }
  function init() {
    const more = document.getElementById('topbarMore');
    const actions = document.getElementById('topbarActions');
    const close = () => { actions.classList.remove('is-open'); more.setAttribute('aria-expanded', 'false'); };
    const labels = () => { more.title = T('more'); more.setAttribute('aria-label', T('more')); };
    labels(); window.addEventListener('toolkit-language-change', labels);
    more.addEventListener('click', () => { const open = actions.classList.toggle('is-open'); more.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', event => { if (!event.target.closest('.topbar-settings')) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && actions.classList.contains('is-open')) { event.preventDefault(); event.stopImmediatePropagation(); document.getElementById('themePicker')?.remove(); close(); more.focus(); }
    }, true);
  }
  window.ToolWorkspace = { capture, mount, mountActions, handoff, fields, last: () => drafts.has(last) ? last : null, T };
  window.ToolActivity = {
    update(id, text, active) {
      let bar = document.getElementById('toolActivity');
      if (!bar) { bar = document.createElement('nav'); bar.id = 'toolActivity'; bar.className = 'activity-bar'; document.body.appendChild(bar); }
      let button = bar.querySelector('[data-tool="' + id + '"]');
      if (!active) { button?.remove(); return; }
      if (!button) { button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-secondary'; button.dataset.tool = id; button.onclick = () => navigateTo(id); bar.appendChild(button); }
      button.textContent = text;
    },
  };
  document.addEventListener('DOMContentLoaded', init);
})();
