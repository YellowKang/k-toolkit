// ── Command Palette (lazy-loaded) ──
// Depends on globals: TOOLS, favorites, recent, usageCounts, LS,
//   toggleTheme, navigateTo, showToast, escHtml, closeCmdPalette

let _cmdIdx = -1;
let _paletteActions = [];

function _cmdOpen() {
  if (document.getElementById('cmdPalette')) return;
  // 每次打开重建，确保 favorites/recent 数量是最新值
  _paletteActions = [
    { id: 'theme',        label: t('cmd_toggle_theme'), icon: '🌙', sub: t('cmd_theme_sub'),          action: () => { toggleTheme(); closeCmdPalette(); } },
    { id: 'home',         label: t('cmd_go_home'),     icon: '🏠', sub: t('cmd_home_sub'),             action: () => { navigateTo('home'); closeCmdPalette(); } },
    { id: 'favorites',    label: t('cmd_favs'),        icon: '⭐', sub: t('cmd_favs_sub', favorites.length), action: () => { navigateTo('favorites'); closeCmdPalette(); } },
    { id: 'recent',       label: t('cmd_recent'),      icon: '🕐', sub: t('cmd_recent_sub', recent.length),    action: () => { navigateTo('recent'); closeCmdPalette(); } },
    { id: 'clear-recent', label: t('cmd_clear_recent'), icon: '🗑️', sub: t('cmd_clear_recent_sub'),         action: () => { recent=[]; LS.set('dtb_recent',[]); showToast(t('toast_cleared')); closeCmdPalette(); } },
    { id: 'clear-usage',  label: t('cmd_clear_usage'),  icon: '📊', sub: t('cmd_clear_usage_sub'),         action: () => { usageCounts={}; LS.set('dtb_usage',{}); showToast(t('toast_cleared')); closeCmdPalette(); } },
  ];
  const overlay = document.createElement('div');
  overlay.className = 'cmd-palette-overlay';
  overlay.id = 'cmdPalette';
  overlay.innerHTML = `
    <div class="cmd-palette" onclick="event.stopPropagation()">
      <div class="cmd-input-wrap">
        <span class="cmd-input-icon">🔍</span>
        <input class="cmd-input" id="cmdInput" placeholder="${t('cmd_placeholder')}"
          oninput="_cmdRender(this.value)" onkeydown="_cmdKey(event)" autocomplete="off">
        <span class="cmd-kbd">Esc</span>
      </div>
      <div class="cmd-results" id="cmdResults"></div>
      <div class="cmd-footer">
        <span><kbd class="cmd-kbd">↑↓</kbd> ${t('cmd_footer_nav')}</span>
        <span><kbd class="cmd-kbd">Enter</kbd> ${t('cmd_footer_confirm')}</span>
        <span><kbd class="cmd-kbd">Esc</kbd> ${t('cmd_footer_close')}</span>
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
  const scoreT = tool => {
    if (!ql) return 0;
    if (tool.name.toLowerCase() === ql) return 100;
    if (tool.name.toLowerCase().startsWith(ql)) return 80;
    if (tool.name.toLowerCase().includes(ql)) return 60;
    if (tool.category.toLowerCase().includes(ql)) return 40;
    if (tool.desc.toLowerCase().includes(ql)) return 20;
    return 0;
  };
  const tools = ql ? getLocalizedTools(TOOLS).map(tool => ({t: tool, s: scoreT(tool)})).filter(x => x.s > 0).sort((a,b) => b.s-a.s).slice(0,8).map(x=>x.t) : [];
  const actions = ql ? _paletteActions.filter(a => a.label.includes(ql) || a.sub.includes(ql)) : _paletteActions;
  const recentTools = !ql ? recent.slice(0,5).map(id => getLocalizedTools(TOOLS).find(tool => tool.id===id)).filter(Boolean) : [];

  if (!tools.length && !actions.length && !recentTools.length) {
    res.innerHTML = `<div class="cmd-empty">${t('search_no_result', escHtml(q))}</div>`;
    return;
  }
  if (recentTools.length) {
    html += `<div class="cmd-section-label">${t('cmd_section_recent')}</div>`;
    recentTools.forEach((tool,i) => {
      html += `<div class="cmd-item" data-idx="${i}" onclick="navigateTo('${tool.id}');closeCmdPalette()"><span class="cmd-item-icon" style="background:${tool.color}22">${tool.icon}</span><span class="cmd-item-label">${escHtml(tool.name)}</span><span class="cmd-item-sub">${escHtml(tool.category)}</span><span class="cmd-item-enter">↵</span></div>`;
    });
  }
  if (actions.length) {
    html += `<div class="cmd-section-label">${t('cmd_section_actions') || 'Actions'}</div>`;
    const base = recentTools.length;
    actions.forEach((a,i) => {
      html += `<div class="cmd-item" data-idx="${base+i}" onclick="_paletteActions.find(x=>x.id==='${a.id}')?.action()"><span class="cmd-item-icon">${a.icon}</span><span class="cmd-item-label">${escHtml(a.label)}</span><span class="cmd-item-sub">${escHtml(a.sub)}</span><span class="cmd-item-enter">↵</span></div>`;
    });
  }
  if (tools.length) {
    html += `<div class="cmd-section-label">${t('cmd_section_tools')}</div>`;
    const base = recentTools.length + actions.length;
    tools.forEach((tool,i) => {
      html += `<div class="cmd-item" data-idx="${base+i}" onclick="navigateTo('${tool.id}');closeCmdPalette()"><span class="cmd-item-icon" style="background:${tool.color}22">${tool.icon}</span><span class="cmd-item-label">${escHtml(tool.name)}</span><span class="cmd-item-sub">${escHtml(tool.category)}</span><span class="cmd-item-enter">↵</span></div>`;
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
