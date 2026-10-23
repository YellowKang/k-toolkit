// Full capability list: preserve stable IDs for search, favorites and Agent calls.
const TOOLS = window.ToolCatalog.tools;
const CATALOG_ENTRIES = window.ToolCatalog.entries;

// ── 分类 & 计数（顶层常量，避免重复遍历）──
const CATEGORIES = Object.keys(window.ToolCatalog.categories);
const CAT_COUNTS = Object.fromEntries(CATEGORIES.map(category => [category, CATALOG_ENTRIES.filter(tool => tool.category === category).length]));
const CAT_ICONS = Object.fromEntries(Object.entries(window.ToolCatalog.categories).map(([name, value]) => [name, value.icon]));

// ── 持久化 ──
const LS = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── 状态 ──
let currentPage = 'home';
let currentCatFilter = 'all';
let favorites = LS.get('dtb_favorites', []);
let recent = LS.get('dtb_recent', []);
let collapsed = LS.get('dtb_sidebar_collapsed', false);
let theme = LS.get('dtb_theme', 'dark');
let loadedTools = {};
const _toolLoads = new Map(); // Executed classic scripts cannot be unloaded safely.
let searchQuery = '';
let searchHistory = LS.get('dtb_search_history', []); // 最近5条搜索词
let collapsedCats = LS.get('dtb_collapsed_cats', {});
let usageCounts = LS.get('dtb_usage', {});

// ── 搜索评分（共用函数）──
function _scoreToolSearch(tool, tokens) {
  const name = (tool.name || '').toLowerCase();
  const desc = (tool.desc || '').toLowerCase();
  const cat  = (tool.category || '').toLowerCase();
  const id   = (tool.id || '').toLowerCase();
  const tags = (tool.tags || []).map(t => t.toLowerCase()).join(' ');
  let total = 0, matched = 0;
  for (const tok of tokens) {
    let s = 0;
    if (id === tok) s += 10; else if (id.includes(tok)) s += 5;
    if (name === tok) s += 10; else if (name.startsWith(tok)) s += 8; else if (name.includes(tok)) s += 6;
    if (tags.includes(tok)) s += 3;
    if (cat.includes(tok)) s += 2;
    if (desc.includes(tok)) s += 1;
    if (s > 0) { total += s; matched++; }
  }
  if (matched === tokens.length && tokens.length > 1) total += 5;
  return matched > 0 ? total : 0;
}

const _prefetchQueue = new Set();
function prefetchTool(id) {
  if (loadedTools[id] || _prefetchQueue.has(id)) return;
  if (_prefetchQueue.size >= 3) return;
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) return;
  _prefetchQueue.add(id);
  return loadTool(id, false).catch(() => {}).finally(() => _prefetchQueue.delete(id));
}

function addUsage(id) {
  usageCounts[id] = (usageCounts[id] || 0) + 1;
  // 批量写入：延迟 2s，避免频繁 IO
  clearTimeout(addUsage._timer);
  addUsage._timer = setTimeout(() => { LS.set('dtb_usage', usageCounts); }, 2000);
}

// ── 首页渲染 ──
async function renderHomePage(mode) {
  const content = document.getElementById('content');
  if (!content) return;
  const tools = getLocalizedTools(TOOLS);
  let html = '';

  if (mode === 'ai-chat') {
    // If already mounted, skip re-render (e.g. lang switch)
    if (document.getElementById('_chatPageRoot') && content.classList.contains('chat-page-mode')) return;
    const aiTool = TOOLS.find(t => t.id === 'ai-chat');
    if (!aiTool) return;
    content.innerHTML = `<div id="_chatPageRoot"></div>`;
    content.classList.add('chat-page-mode');
    try { await loadTool(aiTool.id); } catch(e) { content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">${t('load_fail')}</div></div>`; content.classList.remove('chat-page-mode'); return; }
    const fn = window[aiTool.render];
    if (fn) fn(document.getElementById('_chatPageRoot'));
    return;
  }

  if (mode === 'favorites') {
    const favTools = favorites.map(id => tools.find(t => t.id === id)).filter(Boolean);
    if (!favTools.length) {
      html = `<div class="empty-state"><div class="empty-icon">⭐</div><div class="empty-title">${t('fav_empty_title')}</div><div class="empty-sub">${t('fav_empty_sub')}</div></div>`;
    } else {
      html = `<div class="home-section"><div class="section-title">${t('fav_title')} <span class="section-count">${favTools.length}</span></div><div class="tools-grid">${favTools.map(renderToolCard).join('')}</div></div>`;
    }
    const aiTool = getLocalizedTools(TOOLS).find(t => t.id === 'ai-chat');
    if (aiTool) html += `<div class="home-section"><div class="section-title">🤖 ${t('stat_ai_chat')}</div><div class="tools-grid">${renderToolCard(aiTool)}</div></div>`;
    content.innerHTML = html;
    return;
  }

  if (mode === 'recent') {
    const recentTools = recent.map(id => tools.find(t => t.id === id)).filter(Boolean);
    if (!recentTools.length) {
      html = `<div class="empty-state"><div class="empty-icon">🕐</div><div class="empty-title">${t('recent_empty_title')}</div><div class="empty-sub">${t('recent_empty_sub')}</div></div>`;
    } else {
      html = `<div class="home-section"><div class="section-title">${t('recent_title')} <span class="section-count">${recentTools.length}</span></div><div class="tools-grid">${recentTools.map(renderToolCard).join('')}</div></div>`;
    }
    const aiTool = getLocalizedTools(TOOLS).find(t => t.id === 'ai-chat');
    if (aiTool) html += `<div class="home-section"><div class="section-title">🤖 ${t('stat_ai_chat')}</div><div class="tools-grid">${renderToolCard(aiTool)}</div></div>`;
    content.innerHTML = html;
    return;
  }

  // 主页 Hero
  const hour = new Date().getHours();
  const greeting = hour < 6 ? t('greet_late') : hour < 12 ? t('greet_morning') : hour < 18 ? t('greet_afternoon') : t('greet_evening');
  // 热门工具 top5（使用次数）
  const topTools = Object.entries(usageCounts)
    .sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([id]) => tools.find(t => t.id===id)).filter(Boolean);
  const topHtml = topTools.length ? `
    <div class="home-hero-quick">
      <span style="font-size:11px;color:var(--text-muted)">${t('hero_hot')}</span>
      ${topTools.map(tool => `<button class="hero-quick-btn" onclick="navigateTo('${tool.id}')" style="--qc:${tool.color}">${tool.icon} ${tool.name}</button>`).join('')}
    </div>` : '';
  html += `<div class="home-hero">
    <div class="home-hero-top">
      <div class="home-hero-title">🔧 K Toolkit <span style="font-size:12px;opacity:0.6;font-weight:400;margin-left:6px">Agentic</span></div>
      <div class="home-hero-sub">${greeting}，${t('hero_sub', CATALOG_ENTRIES.filter(tool => tool.id !== 'ai-chat').length)}</div>
    </div>
    <div class="home-hero-stats">
      <div class="home-hero-stat"><strong>${tools.length}</strong>${t('stat_tools')}</div>
      <div class="home-hero-stat" onclick="navigateTo('favorites')" style="cursor:pointer"><strong>${favorites.length || 0}</strong>${t('stat_favs')}</div>
      <div class="home-hero-stat" onclick="navigateTo('recent')" style="cursor:pointer"><strong>${recent.length || 0}</strong>${t('stat_recent')}</div>
      <div class="home-hero-stat home-hero-stat-ai" onclick="navigateTo('ai-chat')" style="cursor:pointer;border-color:var(--accent)">🤖 ${t('stat_ai_chat')}</div>
    </div>
    ${topHtml}
  </div>`;

  // 分类 tab
  const localizedTools = getLocalizedTools(TOOLS);
  const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
  html += `<div class="cat-tabs-wrap"><div class="cat-tabs"><button class="cat-tab ${currentCatFilter === 'all' ? 'active' : ''}" onclick="setCatFilter('all')">${t('cat_all')} <span class="cat-tab-count">${CATALOG_ENTRIES.filter(tool => tool.id !== 'ai-chat').length}</span></button>`;
  CATEGORIES.forEach(cat => {
    const localCat = getLocalizedTools(TOOLS).find(tool => {
      const orig = TOOLS.find(x => x.id === tool.id);
      return orig && orig.category === cat;
    });
    const localCatName = localCat ? localCat.category : cat;
    const n = CAT_COUNTS[cat];
    html += `<button class="cat-tab ${currentCatFilter === cat ? 'active' : ''}" onclick="setCatFilter('${cat}')">${localCatIcons[cat] || CAT_ICONS[cat] || ''} ${localCatName} <span class="cat-tab-count">${n}</span></button>`;
  });
  html += `</div></div>`;

  // 收藏区
  if (currentCatFilter === 'all' && favorites.length) {
    const favTools = favorites.slice(0,6).map(id => localizedTools.find(t => t.id === id)).filter(Boolean);
    html += `<div class="home-section"><div class="section-title">⭐ ${t('fav_title')} <span class="section-count">${favorites.length}</span></div><div class="tools-grid">${favTools.map(renderToolCard).join('')}</div></div>`;
  }

  // 最近使用
  if (currentCatFilter === 'all' && recent.length) {
    const recentTools = recent.slice(0,6).map(id => localizedTools.find(t => t.id === id)).filter(Boolean);
    html += `<div class="home-section"><div class="section-title">🕐 ${t('recent_title')} <span class="section-count">${recent.length}</span></div><div class="tools-grid">${recentTools.map(renderToolCard).join('')}</div></div>`;
  }

  // AI 对话固定入口
  if (currentCatFilter === 'all') {
    const aiTool = localizedTools.find(t => t.id === 'ai-chat');
    if (aiTool) {
      html += `<div class="home-section"><div class="section-title">🤖 ${t('stat_ai_chat')}</div><div class="tools-grid">${renderToolCard(aiTool)}</div></div>`;
    }
  }

  // 分类工具区（IntersectionObserver 懒加载）
  const filteredCats = currentCatFilter === 'all' ? CATEGORIES : [currentCatFilter];
  filteredCats.forEach(cat => {
    const sampleTool = localizedTools.find(tool => TOOLS.find(x => x.id === tool.id && x.category === cat));
    const localCatName = sampleTool ? sampleTool.category : cat;
    const catTools = CATALOG_ENTRIES.filter(tool => tool.category === cat);
    const icon = localCatIcons[cat] || CAT_ICONS[cat] || '';
    html += `<div class="home-section" data-lazy-cat="${cat}"><div class="section-title">${icon} ${localCatName} <span class="section-count">${catTools.length}</span></div><div class="tools-grid"></div></div>`;
  });

  content.innerHTML = html;
  _initLazyCats();
}

let _lazyCatObserver = null;

function _initLazyCats() {
  if (_lazyCatObserver) { _lazyCatObserver.disconnect(); _lazyCatObserver = null; }
  const sections = document.querySelectorAll('[data-lazy-cat]');
  if (!sections.length) return;
  _lazyCatObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const cat = entry.target.dataset.lazyCat;
      const grid = entry.target.querySelector('.tools-grid');
      if (!grid || grid.children.length) return;
      grid.innerHTML = getLocalizedTools(CATALOG_ENTRIES).filter(tool => TOOLS.find(original => original.id === tool.id)?.category === cat).map(renderToolCard).join('');
      _lazyCatObserver.unobserve(entry.target);
    });
  }, { rootMargin: '200px' });
  sections.forEach(s => _lazyCatObserver.observe(s));
}

function setCatFilter(cat) {
  currentCatFilter = cat;
  renderHomePage('home');
}

function renderToolCard(tool) {
  const isFav = favorites.includes(tool.id);
  const useCount = usageCounts[tool.id] || 0;
  const badge = useCount >= 3 ? `<span class="tool-card-badge">${useCount >= 99 ? '99+' : useCount}</span>` : '';
  const newBadge = tool.isNew ? `<span class="tool-card-new">NEW</span>` : '';
  return `<div class="tool-card" onclick="navigateTo('${tool.id}')" onmouseenter="prefetchTool('${tool.id}')" style="--card-color:${tool.color}">
    <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${tool.id}" onclick="toggleFavorite('${tool.id}',event)" title="${isFav ? t('fav_remove') : t('fav_add')}">★</button>
    ${badge}${newBadge}
    <div class="tool-card-icon">${tool.icon}</div>
    <div class="tool-card-name">${tool.name}</div>
    <div class="tool-card-desc">${tool.desc}</div>
    <div class="tool-card-tag">${tool.category} · ${t('execution_' + tool.execution)}</div>
  </div>`;
}


let historyStack = [];

// ── 顶部进度条 ──
function _progressStart() {
  const el = document.getElementById('top-progress');
  if (!el) return;
  el.style.transform = 'scaleX(0.6)';
  el.classList.add('running');
  el.classList.remove('done');
}
function _progressDone() {
  const el = document.getElementById('top-progress');
  if (!el) return;
  el.classList.add('done');
  setTimeout(() => { el.classList.remove('running', 'done'); el.style.transform = ''; }, 600);
}

// ── 懒加载 ──
async function loadTool(id, showProgress = true) {
  if (loadedTools[id]) return;
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) throw new Error('Unknown tool: ' + id);
  if (!_toolLoads.has(tool.file)) {
    if (showProgress) _progressStart();
    const pending = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'tools/' + tool.file + '?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
      script.onload = () => { if (showProgress) _progressDone(); resolve(); };
      script.onerror = () => {
        if (showProgress) _progressDone();
        script.remove(); _toolLoads.delete(tool.file);
        reject(new Error('加载失败: ' + tool.file));
      };
      document.head.appendChild(script);
    });
    _toolLoads.set(tool.file, pending);
  }
  await _toolLoads.get(tool.file);
  loadedTools[id] = true;
}

// ── 侧边栏导航动态生成 ──
function buildSidebarNav() {
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;
  const fixed = [
    { page: 'home', icon: '🏠', label: t('nav_home') },
    { page: 'favorites', icon: '⭐', label: t('nav_favs') },
    { page: 'recent', icon: '🕐', label: t('nav_recent') },
    { page: 'ai-chat', icon: '🤖', label: t('stat_ai_chat') || 'AI 对话' },
  ];
  let html = '<div class="nav-section nav-section-fixed">';
  fixed.forEach(i => {
    html += `<a class="nav-item" data-page="${i.page}" href="#${i.page}" data-tooltip="${i.label}"><span class="nav-icon">${i.icon}</span><span class="nav-label">${i.label}</span></a>`;
  });
  html += '</div><div class="nav-divider"></div>';
  const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
  const localizedTools = getLocalizedTools(CATALOG_ENTRIES);
  CATEGORIES.forEach(cat => {
    const catTools = localizedTools.filter(tool => TOOLS.find(x => x.id === tool.id && x.category === cat));
    const localCatName = catTools.length ? catTools[0].category : cat;
    const icon = localCatIcons[cat] || CAT_ICONS[cat] || '📁';
    const isCollapsed = collapsedCats[cat];
    html += `<div class="nav-cat ${isCollapsed ? 'collapsed' : ''}" data-cat="${cat}">`;
    html += `<div class="nav-cat-header" onclick="toggleNavCat('${cat}')">`;
    html += `<span class="nav-cat-icon">${icon}</span>`;
    html += `<span class="nav-cat-label">${localCatName}</span>`;
    html += `<span class="nav-cat-count">${catTools.length}</span>`;
    html += `<span class="nav-cat-arrow">›</span>`;
    html += `</div>`;
    html += `<div class="nav-cat-tools">`;
    catTools.forEach(tool => {
      html += `<a class="nav-item nav-tool-item" data-page="${tool.id}" href="#${tool.id}" data-tooltip="${tool.name}"><span class="nav-icon">${tool.icon}</span><span class="nav-label">${tool.name}</span></a>`;
    });
    html += `</div></div>`;
  });
  nav.innerHTML = html;
  // 重建后重新绑定 tooltip（折叠态悬停显示工具名）
  nav.querySelectorAll('.nav-item[data-page]').forEach(a => {
    const label = a.querySelector('.nav-label');
    if (label) a.dataset.tooltip = label.textContent.trim();
  });
}

function toggleNavCat(cat) {
  collapsedCats[cat] = !collapsedCats[cat];
  LS.set('dtb_collapsed_cats', collapsedCats);
  const el = document.querySelector(`.nav-cat[data-cat="${cat}"]`);
  if (el) el.classList.toggle('collapsed', collapsedCats[cat]);
}

// ── 初始化 ──
function init() {
  // Sync lang button text with saved language
  const langBtn = document.getElementById('langBtn');
  if (langBtn) langBtn.textContent = t('lang_btn');
  buildSidebarNav();
  applyTheme();
  applySidebarCollapse();
  bindKeyboard();
  initScrollTop();
  initTopbarClock();
  initBackupShortcut();
  // 给侧边栏 nav-item 设置 tooltip（折叠态悬停显示）
  document.querySelectorAll('.nav-item[data-page]').forEach(a => {
    const label = a.querySelector('.nav-label');
    if (label) a.dataset.tooltip = label.textContent.trim();
  });
  const hash = location.hash.replace('#', '') || 'home';
  navigateTo(hash, false);
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '') || 'home';
    navigateTo(h, false);
  });
}

// ── 顶部“数据备份”快捷入口 ──
function initBackupShortcut() {
  const button = document.getElementById('dataBackupButton');
  if (!button) return;
  const label = () => { button.title = t('data_backup'); button.setAttribute('aria-label', t('data_backup')); };
  label();
  button.addEventListener('click', () => navigateTo('data-backup'));
  window.addEventListener('toolkit-language-change', label);
}

// ── 顶部时钟 ──
function initTopbarClock() {
  const el = document.getElementById('topbarClock');
  if (!el) return;
  const DAYS_ZH = ['日','一','二','三','四','五','六'];
  const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh';
    const day = lang === 'zh' ? `周${DAYS_ZH[now.getDay()]}` : DAYS_EN[now.getDay()];
    const mo = String(now.getMonth()+1).padStart(2,'0');
    const d = String(now.getDate()).padStart(2,'0');
    const dateStr = lang === 'zh' ? `${mo}/${d} ${day}` : `${day} ${mo}/${d}`;
    el.innerHTML = `<span class="topbar-clock-time">${h}:${m}:${s}</span><span class="topbar-clock-date">${dateStr}</span>`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── 返回顶部 ──
function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scrollTopBtn';
  btn.title = '返回顶部';
  btn.innerHTML = '↑';
  btn.onclick = () => document.getElementById('content').scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);
  document.getElementById('content').addEventListener('scroll', function() {
    btn.classList.toggle('visible', this.scrollTop > 300);
  });
}

// ── 路由 ──
let _homeScrollTop = 0;

async function navigateTo(page, pushHash = true) {
  if (pushHash && location.hash !== '#' + page) {
    historyStack.push(currentPage);
    location.hash = page;
    return;
  }
  // 清理上一个工具的副作用（如 setInterval）
  if (window._activeCleanup) { window._activeCleanup(); window._activeCleanup = null; }
  // 离开 AI 对话页时移除全屏模式
  document.getElementById('content')?.classList.remove('chat-page-mode');
  const prevPage = currentPage;
  const prevIsSpecial = ['home','favorites','recent','ai-chat'].includes(prevPage);
  const content = document.getElementById('content');
  // 离开首页前记录滚动位置
  if (prevIsSpecial && content) _homeScrollTop = content.scrollTop;
  currentPage = page;
  updateNavActive(page);
  const isSpecial = ['home','favorites','recent','ai-chat'].includes(page);
  if (isSpecial) {
    await renderHomePage(page);
  } else {
    const tool = TOOLS.find(t => t.id === page);
    if (tool) { addUsage(page); await renderToolPageFull(tool); }
    else renderHomePage('home');
  }
  if (!isSpecial && TOOLS.find(t => t.id === page)) addRecent(page);
  // 回到首页恢复滚动位置，进入工具页滚到顶
  const isHomeGroup = ['home','favorites','recent'].includes(page);
  if (isHomeGroup) {
    content.scrollTop = _homeScrollTop;
  } else {
    content.scrollTop = 0;
  }
  // 工具页隐藏 FAB，首页显示
  const fab = document.getElementById('scrollTopBtn');
  if (fab) fab.style.display = isHomeGroup ? '' : 'none';
  // 页面切换淡入
  content.classList.remove('content-fade-in');
  void content.offsetWidth;
  content.classList.add('content-fade-in');
}

function updateNavActive(page) {
  const primary = window.ToolCatalog.groupFor(page)?.tools[0] || page;
  document.querySelectorAll('.nav-item').forEach(a =>
    a.classList.toggle('active', a.dataset.page === primary));
  document.querySelectorAll('.bottom-nav-item').forEach(a =>
    a.classList.toggle('active', a.dataset.page === page));
}

function addRecent(id) {
  recent = [id, ...recent.filter(x => x !== id)].slice(0, 8);
  LS.set('dtb_recent', recent);
}

function toggleFavorite(id, event) {
  event && event.stopPropagation();
  const adding = !favorites.includes(id);
  favorites = adding ? [id, ...favorites] : favorites.filter(x => x !== id);
  LS.set('dtb_favorites', favorites);
  showToast(adding ? t('toast_fav_add') : t('toast_fav_remove'), adding ? 'success' : 'info', 1500);
  if (['home','favorites','recent'].includes(currentPage)) {
    renderHomePage(currentPage);
  } else {
    document.querySelectorAll('.fav-btn').forEach(btn => {
      if (btn.dataset.id === id) {
        btn.classList.toggle('active', favorites.includes(id));
        btn.innerHTML = '★ <span>' + (favorites.includes(id) ? t('toast_fav_add') : t('fav_add')) + '</span>';
      }
    });
  }
}

// ── 搜索 ──
let searchDropdownIdx = -1;
let _searchTimer = null;

function handleSearch(val) {
  const clearBtn = document.getElementById('searchClear');
  const kbdHint = document.getElementById('searchKbdHint');
  if (clearBtn) clearBtn.style.display = val.trim() ? '' : 'none';
  if (kbdHint) kbdHint.style.display = val.trim() ? 'none' : '';
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    searchQuery = val.trim().toLowerCase();
    if (searchQuery) {
      showSearchDropdown(searchQuery);
    } else {
      hideSearchDropdown();
    }
  }, 100);
}

function handleSearchKey(e) {
  if (e.isComposing || e.keyCode === 229) return;
  const drop = document.getElementById('searchDropdown');
  if (e.key === 'Escape') { clearSearch(); hideSearchDropdown(); return; }
  if (!drop || drop.style.display === 'none') return;
  const items = drop.querySelectorAll('.sdrop-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); searchDropdownIdx = Math.min(searchDropdownIdx + 1, items.length - 1); updateDropdownActive(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); searchDropdownIdx = Math.max(searchDropdownIdx - 1, 0); updateDropdownActive(items); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const active = drop.querySelector('.sdrop-item.active');
    if (active) { hideSearchDropdown(); clearSearch(); navigateTo(active.dataset.id); }
    else if (searchQuery) {
      _addSearchHistory(searchQuery);
      hideSearchDropdown(); renderSearchResults(searchQuery); currentPage = '__search__'; updateNavActive('');
    }
  }
}

function updateDropdownActive(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === searchDropdownIdx));
  if (items[searchDropdownIdx]) items[searchDropdownIdx].scrollIntoView({ block: 'nearest' });
}

let _searchHistoryTimer = null;
function _addSearchHistory(q) {
  if (!q || q.length < 2) return;
  searchHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 5);
  clearTimeout(_searchHistoryTimer);
  _searchHistoryTimer = setTimeout(() => LS.set('dtb_search_history', searchHistory), 1000);
}

function _hlMatch(text, q) {
  if (!q) return escHtml(text);
  // 支持多关键词高亮：拆分 token，用正则一次性匹配所有
  const tokens = q.split(/[\s,，、]+/).filter(Boolean);
  if (!tokens.length) return escHtml(text);
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp('(' + escaped.join('|') + ')', 'gi');
  const testRe = new RegExp('^(' + escaped.join('|') + ')$', 'i');
  const parts = text.split(re);
  return parts.map(p => testRe.test(p) ? '<span class="search-highlight">' + escHtml(p) + '</span>' : escHtml(p)).join('');
}

function showSearchDropdown(q) {
  let drop = document.getElementById('searchDropdown');
  if (!drop) {
    drop = document.createElement('div');
    drop.id = 'searchDropdown';
    drop.className = 'search-dropdown';
    document.querySelector('.search-wrap').appendChild(drop);
    // close on outside click
    const _sdClose = e => {
      const wrap = document.querySelector('.search-wrap');
      if (wrap && !wrap.contains(e.target)) hideSearchDropdown();
    };
    document.addEventListener('mousedown', _sdClose);
    document.addEventListener('touchstart', _sdClose, { passive: true });
  }
  // 拆分多关键词匹配 + 评分排序
  const tokens = q.toLowerCase().split(/[\s,，、]+/).filter(Boolean);
  const localTools = getLocalizedTools(TOOLS);
  const scored = localTools.map(t => ({ t, score: _scoreToolSearch(t, tokens) })).filter(x => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  const matched = scored.slice(0, 12).map(x => x.t);
  searchDropdownIdx = -1;
  if (!matched.length) {
    drop.innerHTML = `<div class="sdrop-empty">未找到「${escHtml(q)}」相关工具</div>`;
  } else {
    const bycat = {};
    matched.forEach(t => { (bycat[t.category] = bycat[t.category] || []).push(t); });
    let html = `<div class="sdrop-header">${t('search_results', matched.length)}</div>`;
    Object.entries(bycat).forEach(([cat, tools]) => {
      const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
      html += `<div class="sdrop-cat">${localCatIcons[cat] || CAT_ICONS[cat] || ''} ${cat}</div>`;
      const visible = tools.slice(0, 3);
      visible.forEach(tool => {
        const hlName = _hlMatch(tool.name, q);
        const hlDesc = _hlMatch(tool.desc, q);
        html += `<div class="sdrop-item" data-id="${tool.id}" onclick="sdropClick('${tool.id}')">`;
        html += `<span class="sdrop-icon" style="background:${tool.color}22">${tool.icon}</span>`;
        html += `<span class="sdrop-info"><span class="sdrop-name">${hlName}</span><span class="sdrop-desc">${hlDesc}</span></span>`;
        html += `<span class="sdrop-cat-tag">${cat}</span>`;
        html += `</div>`;
      });
      if (tools.length > 3) {
        html += `<div class="sdrop-more" data-q="${escHtml(q)}" onclick="sdropViewAll(this.dataset.q)">  ${t('search_view_all', tools.length)}</div>`;
      }
    });
    drop.innerHTML = html;
  }
  drop.style.display = 'block';
}

function hideSearchDropdown() {
  const drop = document.getElementById('searchDropdown');
  if (drop) drop.style.display = 'none';
  searchDropdownIdx = -1;
}

function sdropClick(id) {
  hideSearchDropdown();
  clearSearch();
  navigateTo(id);
}

function sdropViewAll(q) {
  hideSearchDropdown();
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = q;
  searchQuery = q;
  renderSearchResults(q);
}

function clearSearch() {
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  searchQuery = '';
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.style.display = 'none';
  const kbdHint = document.getElementById('searchKbdHint');
  if (kbdHint) kbdHint.style.display = '';
  hideSearchDropdown();
}

function focusSearch(e) {
  if (e) e.preventDefault();
  const inp = document.getElementById('searchInput');
  if (inp) {
    inp.focus(); inp.select();
    // 无内容时展示搜索历史+热门
    if (!inp.value.trim()) _showSearchHistory();
  }
}

function _showSearchHistory() {
  let drop = document.getElementById('searchDropdown');
  if (!drop) {
    drop = document.createElement('div');
    drop.id = 'searchDropdown';
    drop.className = 'search-dropdown';
    document.querySelector('.search-wrap').appendChild(drop);
    const _sdClose2 = e => {
      const wrap = document.querySelector('.search-wrap');
      if (wrap && !wrap.contains(e.target)) hideSearchDropdown();
    };
    document.addEventListener('mousedown', _sdClose2);
    document.addEventListener('touchstart', _sdClose2, { passive: true });
  }
  const localTools = getLocalizedTools(TOOLS);
  // 热门工具（使用次数最多的5个）
  const hotTools = Object.entries(usageCounts)
    .sort((a,b) => b[1]-a[1]).slice(0,5)
    .map(([id]) => localTools.find(t => t.id===id)).filter(Boolean);
  // 若没有使用记录则取最近5个
  const showHot = hotTools.length ? hotTools : localTools.slice(0,5);
  let html = '';
  if (searchHistory.length) {
    html += `<div class="sdrop-header"><span>${t('search_history')}</span><span class="sdrop-clear-all" onclick="_clearSearchHistory()" style="cursor:pointer;font-size:11px;color:var(--text-muted);padding:2px 6px;border-radius:4px;transition:color 0.15s" onmouseenter="this.style.color='var(--accent)'" onmouseleave="this.style.color='var(--text-muted)'">✕ 清除</span></div>`;
    searchHistory.forEach((h,i) => {
      html += `<div class="sdrop-item" data-q="${escHtml(h)}" onclick="_useHistory(this.dataset.q)"><span style="color:var(--text-muted);font-size:12px;margin-right:8px">🕐</span><span style="flex:1">${escHtml(h)}</span><span onclick="event.stopPropagation();_removeSearchHistory(${i})" style="color:var(--text-muted);padding:2px 6px;border-radius:4px;font-size:12px;cursor:pointer" onmouseenter="this.style.color='var(--text)'" onmouseleave="this.style.color='var(--text-muted)'">✕</span></div>`;
    });
    html += `<div style="height:1px;background:rgba(255,255,255,0.06);margin:6px 8px"></div>`;
  }
  html += `<div class="sdrop-header"><span>${searchHistory.length ? '🔥 热门' : '🔥 热门工具'}</span></div>`;
  showHot.forEach(tool => {
    html += `<div class="sdrop-item" data-id="${tool.id}" onclick="sdropClick('${tool.id}')">`;
    html += `<span class="sdrop-icon" style="background:${tool.color}22">${tool.icon}</span>`;
    html += `<span class="sdrop-info"><span class="sdrop-name">${escHtml(tool.name)}</span><span class="sdrop-desc">${escHtml(tool.desc)}</span></span>`;
    html += `<span class="sdrop-cat-tag">${escHtml(tool.category)}</span>`;
    html += `</div>`;
  });
  drop.innerHTML = html;
  drop.style.display = '';
}

function _clearSearchHistory() {
  searchHistory = [];
  LS.set('dtb_search_history', []);
  hideSearchDropdown();
}

function _removeSearchHistory(idx) {
  searchHistory.splice(idx, 1);
  LS.set('dtb_search_history', searchHistory);
  if (searchHistory.length || Object.keys(usageCounts).length) _showSearchHistory();
  else hideSearchDropdown();
}

function _useHistory(q) {
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = q;
  hideSearchDropdown();
  _addSearchHistory(q);
  renderSearchResults(q);
  currentPage = '__search__'; updateNavActive('');
}

function renderSearchResults(q) {
  // 拆分多关键词（空格/逗号/顿号分隔）
  const tokens = q.toLowerCase().split(/[\s,，、]+/).filter(Boolean);
  if (!tokens.length) return;
  // 使用频率加权：高频工具在同分段内靠前
  const localizedTools = getLocalizedTools(TOOLS);
  const matched = localizedTools.map(tool => ({ tool, s: _scoreToolSearch(tool, tokens) })).filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || (usageCounts[b.tool.id] || 0) - (usageCounts[a.tool.id] || 0))
    .map(x => x.tool);
  const content = document.getElementById('content');
  if (!content) return;
  if (!matched.length) {
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">${t('search_no_result', escHtml(q))}</div></div>`;
    return;
  }
  const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
  const categories = [...new Set(matched.map(tool => tool.category))];
  let html = '';
  categories.forEach(cat => {
    const catMatched = matched.filter(tool => tool.category === cat);
    html += `<div class="home-section"><div class="section-title">${localCatIcons[cat] || CAT_ICONS[cat] || ''} ${cat} <span class="section-count">${catMatched.length}</span></div><div class="tools-grid">${catMatched.map(renderToolCard).join('')}</div></div>`;
  });
  content.innerHTML = `<div class="search-results-header">${t('search_results_header', escHtml(q), matched.length)}</div>` + html;
}

// ── 主题 ──
const THEMES = [
  { key: 'dark',      i18n: 'theme_dark',      color: '#8b5cf6', border: '#a78bfa' },
  { key: 'light',     i18n: 'theme_light',     color: '#ede9fe', border: '#6d28d9' },
  { key: 'tech-blue', i18n: 'theme_tech_blue', color: '#60a5fa', border: '#bfdbfe' },
  { key: 'sakura',    i18n: 'theme_sakura',    color: '#ec4899', border: '#f9a8d4' },
  { key: 'orange',    i18n: 'theme_orange',    color: '#f97316', border: '#fdba74' },
  { key: 'green',     i18n: 'theme_green',     color: '#10b981', border: '#6ee7b7' },
];

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme);
  const th = THEMES.find(th => th.key === theme) || THEMES[0];
  const btn = document.getElementById('themeBtn');
  if (btn) btn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${th.color};border:2.5px solid ${th.border};box-shadow:0 0 8px ${th.color},0 0 2px ${th.border};vertical-align:middle;flex-shrink:0"></span><span style="font-size:11px;margin-left:6px;color:var(--text);vertical-align:middle;font-weight:500">${t(th.i18n)}</span>`;
  // 刷新 Agent 面板配色以跟随全局主题
  if (window.AgentConfig?.applySkin) {
    window.AgentConfig.applySkin();
  }
}

function toggleTheme() {
  openThemePicker();
}

function openThemePicker() {
  let picker = document.getElementById('themePicker');
  if (picker) { picker.remove(); return; }
  picker = document.createElement('div');
  picker.id = 'themePicker';
  picker.style.cssText = 'position:absolute;top:calc(100% + 8px);right:0;background:var(--sidebar-bg);border:1px solid var(--border);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:4px;min-width:160px;z-index:9999;backdrop-filter:blur(24px);box-shadow:0 16px 48px rgba(0,0,0,0.4)';
  THEMES.forEach(th => {
    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;font-size:13px;color:var(--text);transition:background 0.15s' + (th.key === theme ? ';background:var(--surface);outline:1px solid var(--accent)' : '');
    item.innerHTML = `<span style="width:14px;height:14px;border-radius:50%;background:${th.color};flex-shrink:0;display:inline-block"></span>${t(th.i18n)}`;
    item.onmouseenter = () => { if (th.key !== theme) item.style.background = 'var(--surface-hover)'; };
    item.onmouseleave = () => { if (th.key !== theme) item.style.background = ''; };
    item.onclick = () => { theme = th.key; LS.set('dtb_theme', theme); applyTheme(); picker.remove(); };
    picker.appendChild(item);
  });
  const wrap = document.getElementById('themeBtn').parentElement;
  wrap.style.position = 'relative';
  wrap.appendChild(picker);
  setTimeout(() => document.addEventListener('click', function h(e) {
    if (!picker.contains(e.target) && e.target.id !== 'themeBtn') { picker.remove(); document.removeEventListener('click', h); }
  }), 0);
}

// ── 侧边栏折叠 ──
function applySidebarCollapse() {
  const app = document.getElementById('app');
  const btn = document.getElementById('collapseBtn');
  if (!app) return;
  app.classList.toggle('sidebar-collapsed', collapsed);
  if (btn) btn.textContent = collapsed ? '›' : '‹';
}

function toggleCollapse() {
  collapsed = !collapsed;
  LS.set('dtb_sidebar_collapsed', collapsed);
  applySidebarCollapse();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

function bottomNavClick(el) {
  closeSidebar();
}

// ── 键盘快捷键 ──
function bindKeyboard() {
  document.addEventListener('keydown', e => {
    const tag = document.activeElement.tagName;
    const inInput = ['INPUT','TEXTAREA','SELECT'].includes(tag);
    if (e.key === '/' && !inInput) {
      e.preventDefault();
      focusSearch();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openCmdPalette();
    }
    if (e.key === 'Escape') {
      // Don't handle Esc if modal/overlay is open (they handle it themselves)
      if (document.getElementById('agMiniOverlay') || document.getElementById('agConfigModal')) return;
      const inp = document.getElementById('searchInput');
      if (document.activeElement === inp) {
        clearSearch(); inp.blur();
      } else if (inInput) {
        // In a tool's input/textarea — just blur, don't navigate away
        document.activeElement.blur();
      } else if (['home','favorites','recent'].indexOf(currentPage) === -1) {
        navigateTo('home');
      }
    }
    if (e.key === 'ArrowLeft' && e.altKey && historyStack.length) {
      e.preventDefault();
      const prev = historyStack.pop();
      navigateTo(prev, false);
      location.hash = prev;
    }
    if (e.key === '?' && !inInput) {
      e.preventDefault();
      openCmdPalette();
    }
  });
  // 点击空白关闭搜索下拉
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) hideSearchDropdown();
  });
}

function renderWorkbenchNav(id) {
  const group = window.ToolCatalog.groupFor(id);
  if (!group) return '';
  const lang = getCurrentLang();
  const tools = getLocalizedTools(TOOLS);
  return `<nav class="tool-workbench" aria-label="${escHtml(group.name[lang])}">
    <div class="panel-label">${escHtml(group.name[lang])}</div>
    <div class="tool-workbench-links">${group.tools.map(toolId => {
      const tool = tools.find(item => item.id === toolId);
      return `<a href="#${toolId}" class="btn ${toolId === id ? 'btn-primary' : 'btn-secondary'}" ${toolId === id ? 'aria-current="page"' : ''}>${escHtml(tool.name)}</a>`;
    }).join('')}</div>
  </nav>`;
}

// ── 工具页面（完整版，替代旧的 renderToolPage）──
async function renderToolPageFull(tool) {
  const content = document.getElementById('content');
  if (!content) return;
  content.innerHTML = `<div class="tool-loading"><div class="tool-loading-spinner"></div><span>${t('loading')}</span></div>`;
  try { await loadTool(tool.id); } catch(e) {
    if (currentPage !== tool.id) return;
    content.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">${t('load_fail')}</div><div class="empty-sub">${escHtml(e.message)}</div><div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button class="btn btn-primary" onclick="navigateTo('${tool.id}')">${t('retry')}</button><button class="btn btn-secondary" onclick="navigateTo('home')">${t('back_home')}</button></div></div>`;
    return;
  }
  if (currentPage !== tool.id) return;
  const fn = window[tool.render];
  const isFav = favorites.includes(tool.id);
  const localTool = getLocalizedTools(TOOLS).find(x => x.id === tool.id) || tool;
  const localCatIcons = getLocalizedCatIcons(CAT_ICONS);
  content.innerHTML = `
    <div class="tool-page">
      <div class="tool-page-header">
        <button class="back-btn" onclick="navigateTo('home')">${t('back')}</button>
        <div class="tool-page-title-wrap">
          <span class="tool-page-icon" style="background:${tool.color}20;color:${tool.color}">${tool.icon}</span>
          <div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:nowrap">
              <div class="tool-page-name">${localTool.name}</div>
              <span class="tool-breadcrumb" onclick="setCatFilter('${tool.category}');navigateTo('home')" title="${localTool.category}">${localCatIcons[tool.category]||CAT_ICONS[tool.category]||'📁'} ${localTool.category}</span>
            </div>
            <div class="tool-page-desc">${localTool.desc}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="icon-btn" onclick="shareTool('${tool.id}')" title="${t('share')}">🔗</button>
          <button class="fav-btn ${isFav?'active':''}" data-id="${tool.id}" onclick="toggleFavorite('${tool.id}',event)">★ <span>${isFav?t('toast_fav_add'):t('fav_add')}</span></button>
        </div>
      </div>
      ${renderWorkbenchNav(tool.id)}
      <div class="tool-body" id="toolBody"></div>
    </div>`;
  if (fn) fn(document.getElementById('toolBody'));
  else document.getElementById('toolBody').innerHTML = `<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-title">${t('load_fail')}</div></div>`;

  // 相关工具推荐
  const related = getLocalizedTools(TOOLS).filter(tool2 => tool2.id !== tool.id && TOOLS.find(x => x.id === tool2.id && x.category === tool.category)).slice(0, 4);
  if (related.length) {
    const relDiv = document.createElement('div');
    relDiv.className = 'related-tools';
    relDiv.innerHTML = `<div class="section-title" style="margin-top:32px">${t('related_tools')}</div><div class="tools-grid">${related.map(renderToolCard).join('')}</div>`;
    document.querySelector('.tool-page').appendChild(relDiv);
  }
}

// ── Toast 通知 ──
function showToast(msg, type = 'success', duration = 2000, onClick = null) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast-msg ' + type;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  el.innerHTML = `<span>${icons[type] || '✓'}</span><span>${msg}</span>`;
  if (onClick) { el.style.cursor = 'pointer'; el.addEventListener('click', onClick); }
  container.appendChild(el);
  if (duration > 0) {
    setTimeout(() => {
      el.classList.add('toast-out');
      setTimeout(() => el.remove(), 280);
    }, duration);
  }
}

// ── 工具函数 ──
function copyText(text, btn) {
  const isEn = typeof getCurrentLang === 'function' && getCurrentLang() === 'en';
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = isEn ? '✓ Copied' : '✓ 已复制';
    btn.classList.add('copied');
    showToast(isEn ? 'Copied to clipboard' : '已复制到剪贴板');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  }).catch(() => showToast(isEn ? 'Copy failed' : '复制失败', 'error'));
}

function shareTool(id) {
  const tool = TOOLS.find(t => t.id === id);
  if (!tool) return;
  const url = location.origin + location.pathname + '#' + id;
  if (navigator.share) {
    navigator.share({ title: tool.name, text: tool.desc, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => showToast(t('toast_link_copied'))).catch(() => showToast(t('toast_copy_failed'), 'error'));
  }
}

// Shared by tools and the Agent; safe for text and quoted attribute values (not for inline JS strings).
function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Command Palette (lazy-loaded via dashboard-cmd.js) ──
let _cmdLoaded = false;
function _loadCmd(cb) {
  if (_cmdLoaded) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'dashboard-cmd.js?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
  s.onload = () => { _cmdLoaded = true; cb(); };
  document.head.appendChild(s);
}

function openCmdPalette() { _loadCmd(() => _cmdOpen()); }
function closeCmdPalette() { const el = document.getElementById('cmdPalette'); if (el) el.remove(); if (typeof _cmdIdx !== 'undefined') _cmdIdx = -1; }

// ── 全局 UE 增强 ──

// 增强 1：Ctrl/Cmd+Enter 提交 + Input Enter 提交
function _initGlobalKeySubmit() {
  const content = document.getElementById('content');
  if (!content) return;
  content.addEventListener('keydown', e => {
    const el = e.target;
    const panel = el.closest('.tool-card-panel') || el.closest('.tool-body');
    if (!panel) return;
    const btn = panel.querySelector('.btn-primary');
    if (!btn) return;
    // Ctrl/Cmd+Enter: textarea 和 input 都触发
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      btn.click();
      return;
    }
    // Enter on input（非 textarea）触发
    if (e.key === 'Enter' && !e.isComposing && el.tagName === 'INPUT' && (el.classList.contains('tool-input') || el.type === 'text')) {
      if (el.id === 'searchInput' || el.closest('.search-wrap') || el.closest('.cmd-palette')) return;
      e.preventDefault();
      btn.click();
    }
  });
}

// 增强 2：粘贴自动执行
function _initGlobalPasteExec() {
  const content = document.getElementById('content');
  if (!content) return;
  content.addEventListener('paste', e => {
    const el = e.target;
    if (!el.matches('textarea.tool-textarea, input.tool-input')) return;
    if (el.dataset.noAutopaste !== undefined) return;
    // 排除 text-diff 双输入框和 markdown 编辑器
    if (el.id === 'diffA' || el.id === 'diffB' || el.id === 'mdInput') return;
    // 仅对空输入框粘贴时触发
    if (el.value.trim()) return;
    const panel = el.closest('.tool-card-panel') || el.closest('.tool-body');
    if (!panel) return;
    const btn = panel.querySelector('.btn-primary');
    if (!btn) return;
    setTimeout(() => btn.click(), 200);
  });
}

// 增强 3：textarea 字符统计
function _initTextareaCounter() {
  const content = document.getElementById('content');
  if (!content) return;
  content.addEventListener('input', e => {
    const el = e.target;
    if (!el.matches('textarea.tool-textarea')) return;
    let counter = el.parentElement.querySelector('.textarea-counter');
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'textarea-counter';
      counter.style.cssText = 'text-align:right;font-size:11px;color:var(--text-muted);opacity:0.7;margin-top:4px;font-family:monospace';
      el.parentElement.insertBefore(counter, el.nextSibling);
    }
    const val = el.value;
    const lines = val ? val.split('\n').length : 0;
    const chars = val.length;
    const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh';
    counter.textContent = chars ? (lang === 'en' ? `${lines} lines · ${chars} chars` : `${lines} 行 · ${chars} 字符`) : '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  _initGlobalKeySubmit();
  _initGlobalPasteExec();
  _initTextareaCounter();
  // ── Agent 桥接：暴露内部变量给 agent 层 ──
  window.TOOLS        = TOOLS;
  window.navigateTo   = navigateTo;
  window.showToast    = showToast;
  window.getCurrentLang = getCurrentLang;
  // currentPage / favorites / recent 是 let，用 getter 保持同步
  Object.defineProperties(window, {
    currentPage: { get: () => currentPage, configurable: true },
    favorites:   { get: () => favorites,   configurable: true },
    recent:      { get: () => recent,       configurable: true },
  });
});

// ── 离线状态提示 ──
window.addEventListener('online',  () => showToast(t('toast_online'), 'success'));
window.addEventListener('offline', () => showToast(t('toast_offline'), 'warn'));
