const _noteDict = {
  zh: { title: '临时便签', clear: '清空', input_ph: '在这里记录任何内容，自动保存...', count: n => n + ' 字符', saved: time => '已保存 ' + time, cleared: '已清空', pending: '尚未保存', failed: '保存失败：存储不可用或已满，请下载保存。', download: '下载便签' },
  en: { title: 'Quick note', clear: 'Clear', input_ph: 'Write anything here; it saves automatically...', count: n => `${n} char${n === 1 ? '' : 's'}`, saved: time => 'Saved ' + time, cleared: 'Cleared', pending: 'Not saved yet', failed: 'Save failed: storage is unavailable or full. Download your note.', download: 'Download note' },
};
let _notePending = null;
window.addEventListener('beforeunload', event => { if (_notePending !== null) { event.preventDefault(); event.returnValue = ''; } });
function _noteSave(value) {
  const T = makeToolI18n(_noteDict), status = document.getElementById('noteSaved');
  try { localStorage.setItem('dtb_note', value); _notePending = null; if (status) status.textContent = T('saved', new Date().toLocaleTimeString()); return true; }
  catch { _notePending = value; if (status) status.textContent = T('failed'); return false; }
}
function downloadNote() {
  const value = document.getElementById('noteArea')?.value ?? _notePending ?? '';
  const url = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'note.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

window.renderNote = function(el) {
  const T = makeToolI18n(_noteDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('title')}</div>
        <button class="btn btn-secondary" onclick="clearNote()" style="font-size:12px">${T('clear')}</button>
        <button class="btn btn-secondary" onclick="downloadNote()" style="font-size:12px">${T('download')}</button>
      </div>
      <textarea id="noteArea" style="width:100%;min-height:320px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:10px;padding:14px;font-size:14px;color:var(--text);resize:vertical;font-family:inherit;line-height:1.7;box-sizing:border-box" placeholder="${T('input_ph')}"></textarea>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--text-muted)">
        <span id="noteCount">${T('count', 0)}</span>
        <span id="noteSaved" role="status" aria-live="polite"></span>
      </div>
    </div>`;
  const area = document.getElementById('noteArea');
  try { area.value = localStorage.getItem('dtb_note') || ''; } catch {}
  if (_notePending !== null) { area.value = _notePending; document.getElementById('noteSaved').textContent = T('failed'); }
  updateNoteStats();
  let _t;
  area.addEventListener('input', () => {
    updateNoteStats();
    _notePending = area.value; document.getElementById('noteSaved').textContent = T('pending');
    clearTimeout(_t);
    _t = setTimeout(() => {
      _noteSave(area.value);
    }, 500);
  });
  window._activeCleanup = function() {
    clearTimeout(_t);
    _noteSave(area.value);
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
  const savedOK = _noteSave('');
  updateNoteStats();
  const saved = document.getElementById('noteSaved');
  if (saved && savedOK) saved.textContent = makeToolI18n(_noteDict)('cleared');
}
