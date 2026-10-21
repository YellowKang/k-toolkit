const _noteDict = {
  zh: { title: '临时便签', clear: '清空', input_ph: '在这里记录任何内容，自动保存...', count: n => n + ' 字符', saved: time => '已保存 ' + time, cleared: '已清空' },
  en: { title: 'Quick note', clear: 'Clear', input_ph: 'Write anything here; it saves automatically...', count: n => `${n} char${n === 1 ? '' : 's'}`, saved: time => 'Saved ' + time, cleared: 'Cleared' },
};

window.renderNote = function(el) {
  const T = makeToolI18n(_noteDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('title')}</div>
        <button class="btn btn-secondary" onclick="clearNote()" style="font-size:12px">${T('clear')}</button>
      </div>
      <textarea id="noteArea" style="width:100%;min-height:320px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:10px;padding:14px;font-size:14px;color:var(--text);resize:vertical;font-family:inherit;line-height:1.7;box-sizing:border-box" placeholder="${T('input_ph')}"></textarea>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--text-muted)">
        <span id="noteCount">${T('count', 0)}</span>
        <span id="noteSaved"></span>
      </div>
    </div>`;
  const area = document.getElementById('noteArea');
  try { area.value = localStorage.getItem('dtb_note') || ''; } catch {}
  updateNoteStats();
  let _t;
  area.addEventListener('input', () => {
    updateNoteStats();
    clearTimeout(_t);
    _t = setTimeout(() => {
      try { localStorage.setItem('dtb_note', area.value); } catch {}
      const saved = document.getElementById('noteSaved');
      if (saved) saved.textContent = T('saved', new Date().toLocaleTimeString());
    }, 500);
  });
  window._activeCleanup = function() {
    clearTimeout(_t);
    try { localStorage.setItem('dtb_note', area.value); } catch {}
  };
};

function updateNoteStats() {
  const area = document.getElementById('noteArea');
  const el = document.getElementById('noteCount');
  if (area && el) el.textContent = makeToolI18n(_noteDict)('count', area.value.length);
}

function clearNote() {
  const area = document.getElementById('noteArea');
  if (!area) return;
  area.value = '';
  try { localStorage.removeItem('dtb_note'); } catch {}
  updateNoteStats();
  const saved = document.getElementById('noteSaved');
  if (saved) saved.textContent = makeToolI18n(_noteDict)('cleared');
}
