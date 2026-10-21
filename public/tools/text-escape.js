const _escDict = {
  zh: { regex: '正则', input: '输入', input_ph: '输入内容...', escape: '转义', unescape: '反转义', result: '结果', copy_result: '复制结果', copied: '已复制!' },
  en: { regex: 'Regex', input: 'Input', input_ph: 'Enter text...', escape: 'Escape', unescape: 'Unescape', result: 'Result', copy_result: 'Copy result', copied: 'Copied!' },
};

function renderTextEscape(container) {
  const T = makeToolI18n(_escDict);
  container.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button class="esc-mode-btn active" data-mode="json"
        style="padding:6px 14px;border-radius:8px;border:1px solid var(--accent);
        background:var(--accent);color:#fff;font-size:13px;cursor:pointer">JSON</button>
      <button class="esc-mode-btn" data-mode="html"
        style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);
        background:none;color:var(--text-muted);font-size:13px;cursor:pointer">HTML</button>
      <button class="esc-mode-btn" data-mode="url"
        style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);
        background:none;color:var(--text-muted);font-size:13px;cursor:pointer">URL</button>
      <button class="esc-mode-btn" data-mode="regex"
        style="padding:6px 14px;border-radius:8px;border:1px solid var(--glass-border);
        background:none;color:var(--text-muted);font-size:13px;cursor:pointer">${T('regex')}</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="font-size:12px;color:var(--text-muted)">${T('input')}</div>
        <textarea id="esc-input" style="height:300px;resize:none;
          background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);
          border-radius:10px;padding:12px;color:var(--text);font-size:13px;
          font-family:monospace" placeholder="${T('input_ph')}"></textarea>
        <div style="display:flex;gap:8px">
          <button id="esc-btn" style="flex:1;padding:8px;background:var(--accent);
            border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:13px">${T('escape')}</button>
          <button id="unesc-btn" style="flex:1;padding:8px;border:1px solid var(--glass-border);
            background:none;border-radius:8px;color:var(--text);cursor:pointer;font-size:13px">${T('unescape')}</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="font-size:12px;color:var(--text-muted)">${T('result')}</div>
        <textarea id="esc-output" readonly style="height:300px;resize:none;
          background:rgba(255,255,255,0.02);border:1px solid var(--glass-border);
          border-radius:10px;padding:12px;color:var(--text);font-size:13px;
          font-family:monospace"></textarea>
        <button id="esc-copy" style="padding:8px;border:1px solid var(--glass-border);
          background:none;border-radius:8px;color:var(--text);cursor:pointer;font-size:13px">${T('copy_result')}</button>
      </div>
    </div>
  `;

  let mode = 'json';
  const input = container.querySelector('#esc-input');
  const output = container.querySelector('#esc-output');

  container.querySelectorAll('.esc-mode-btn').forEach(btn => {
    btn.onclick = () => {
      mode = btn.dataset.mode;
      container.querySelectorAll('.esc-mode-btn').forEach(b => {
        const active = b === btn;
        b.style.background = active ? 'var(--accent)' : 'none';
        b.style.borderColor = active ? 'var(--accent)' : 'var(--glass-border)';
        b.style.color = active ? '#fff' : 'var(--text-muted)';
      });
    };
  });

  const escapers = {
    json: {
      esc: s => JSON.stringify(s).slice(1, -1),
      unesc: s => { try { return JSON.parse('"' + s + '"'); } catch(e) { return s; } }
    },
    html: {
      esc: s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'),
      unesc: s => s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'")
    },
    url: {
      esc: s => encodeURIComponent(s),
      unesc: s => { try { return decodeURIComponent(s); } catch(e) { return s; } }
    },
    regex: {
      esc: s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      unesc: s => s.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
    }
  };

  container.querySelector('#esc-btn').onclick = () => { output.value = escapers[mode].esc(input.value); };
  container.querySelector('#unesc-btn').onclick = () => { output.value = escapers[mode].unesc(input.value); };
  container.querySelector('#esc-copy').onclick = () => {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value);
    const btn = container.querySelector('#esc-copy');
    const orig = btn.textContent;
    btn.textContent = T('copied');
    setTimeout(() => btn.textContent = orig, 1500);
  };
};
