// ── Command Palette (lazy-loaded) ──
// Depends on globals: TOOLS, favorites, recent, usageCounts, LS,
//   toggleTheme, navigateTo, showToast, escHtml, closeCmdPalette

let _cmdIdx = -1;
let _paletteActions = [];

function _cmdOpen() {
  if (document.getElementById('cmdPalette')) return;
  // 每次打开重建，确保 favorites/recent 数量是最新值
  _paletteActions = [
    { id: 'theme',        label: '切换主题',     icon: '🌙', sub: '深色 / 浅色',          action: () => { toggleTheme(); closeCmdPalette(); } },
    { id: 'home',         label: '回到首页',     icon: '🏠', sub: '工具列表',             action: () => { navigateTo('home'); closeCmdPalette(); } },
    { id: 'favorites',    label: '我的收藏',     icon: '⭐', sub: `${favorites.length} 个工具`, action: () => { navigateTo('favorites'); closeCmdPalette(); } },
    { id: 'recent',       label: '最近使用',     icon: '🕐', sub: `${recent.length} 个工具`,    action: () => { navigateTo('recent'); closeCmdPalette(); } },
    { id: 'clear-recent', label: '清除使用记录', icon: '🗑️', sub: '清空最近使用',         action: () => { recent=[]; LS.set('dtb_recent',[]); showToast('已清除'); closeCmdPalette(); } },
    { id: 'clear-usage',  label: '清除统计数据', icon: '📊', sub: '清空使用次数',         action: () => { usageCounts={}; LS.set('dtb_usage',{}); showToast('已清除'); closeCmdPalette(); } },
  ];
  const overlay = document.createElement('div');
  overlay.className = 'cmd-palette-overlay';
  overlay.id = 'cmdPalette';
  overlay.innerHTML = `
    <div class="cmd-palette" onclick="event.stopPropagation()">
      <div class="cmd-input-wrap">
        <span class="cmd-input-icon">🔍</span>
        <input class="cmd-input" id="cmdInput" placeholder="搜索工具或操作..."
          oninput="_cmdRender(this.value)" onkeydown="_cmdKey(event)" autocomplete="off">
        <span class="cmd-kbd">Esc</span>
      </div>
      <div class="cmd-results" id="cmdResults"></div>
      <div class="cmd-footer">
        <span><kbd class="cmd-kbd">↑↓</kbd> 导航</span>
        <span><kbd class="cmd-kbd">Enter</kbd> 执行</span>
        <span><kbd class="cmd-kbd">Esc</kbd> 关闭</span>
      </div>
    </div>`;
  overlay.addEventListener('click', closeCmdPalette);
  document.body.appendChild(overlay);
  _cmdIdx = -1;
  _cmdRender('');
  setTimeout(() => document.getElementById('cmdInput')?.focus(), 30);
}

function _cmdRender(q) {
  const ql = q.trim().toLowerCase();
  const res = document.getElementById('cmdResults');
  if (!res) return;
  _cmdIdx = -1;
  let html = '';
  const scoreT = t => {
    if (!ql) return 0;
    if (t.name.toLowerCase() === ql) return 100;
    if (t.name.toLowerCase().startsWith(ql)) return 80;
    if (t.name.toLowerCase().includes(ql)) return 60;
    if (t.category.toLowerCase().includes(ql)) return 40;
    if (t.desc.toLowerCase().includes(ql)) return 20;
    return 0;
  };
  const tools = ql ? TOOLS.map(t => ({t, s: scoreT(t)})).filter(x => x.s > 0).sort((a,b) => b.s-a.s).slice(0,8).map(x=>x.t) : [];
  const actions = ql ? _paletteActions.filter(a => a.label.includes(ql) || a.sub.includes(ql)) : _paletteActions;
  const recentTools = !ql ? recent.slice(0,5).map(id => TOOLS.find(t => t.id===id)).filter(Boolean) : [];

  if (!tools.length && !actions.length && !recentTools.length) {
    res.innerHTML = `<div class="cmd-empty">未找到「${escHtml(q)}」相关结果</div>`;
    return;
  }
  if (recentTools.length) {
    html += `<div class="cmd-section-label">最近使用</div>`;
    recentTools.forEach((t,i) => {
      html += `<div class="cmd-item" data-idx="${i}" onclick="navigateTo('${t.id}');closeCmdPalette()"><span class="cmd-item-icon" style="background:${t.color}22">${t.icon}</span><span class="cmd-item-label">${escHtml(t.name)}</span><span class="cmd-item-sub">${escHtml(t.category)}</span><span class="cmd-item-enter">↵</span></div>`;
    });
  }
  if (actions.length) {
    html += `<div class="cmd-section-label">操作</div>`;
    const base = recentTools.length;
    actions.forEach((a,i) => {
      html += `<div class="cmd-item" data-idx="${base+i}" onclick="_paletteActions.find(x=>x.id==='${a.id}')?.action()"><span class="cmd-item-icon">${a.icon}</span><span class="cmd-item-label">${escHtml(a.label)}</span><span class="cmd-item-sub">${escHtml(a.sub)}</span><span class="cmd-item-enter">↵</span></div>`;
    });
  }
  if (tools.length) {
    html += `<div class="cmd-section-label">工具</div>`;
    const base = recentTools.length + actions.length;
    tools.forEach((t,i) => {
      html += `<div class="cmd-item" data-idx="${base+i}" onclick="navigateTo('${t.id}');closeCmdPalette()"><span class="cmd-item-icon" style="background:${t.color}22">${t.icon}</span><span class="cmd-item-label">${escHtml(t.name)}</span><span class="cmd-item-sub">${escHtml(t.category)}</span><span class="cmd-item-enter">↵</span></div>`;
    });
  }
  res.innerHTML = html;
}

function _cmdKey(e) {
  const items = document.querySelectorAll('.cmd-item');
  if (e.key === 'Escape') { closeCmdPalette(); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); _cmdIdx = Math.min(_cmdIdx+1, items.length-1); _cmdHighlight(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); _cmdIdx = Math.max(_cmdIdx-1, 0); _cmdHighlight(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const active = document.querySelector('.cmd-item.active');
    if (active) active.click();
    else if (document.getElementById('cmdInput')?.value.trim()) {
      const first = document.querySelector('.cmd-item');
      if (first) first.click();
    }
  }
}

function _cmdHighlight(items) {
  items.forEach((el,i) => el.classList.toggle('active', i === _cmdIdx));
  if (items[_cmdIdx]) items[_cmdIdx].scrollIntoView({ block: 'nearest' });
}
