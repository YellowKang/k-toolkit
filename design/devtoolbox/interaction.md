# 工具交互流程

## 1. 首次加载流程

```
浏览器访问 /
  │
  ├─ SW 已安装？
  │   ├─ 是 → Cache-First 返回 dashboard.html（离线可用）
  │   └─ 否 → 网络请求，同时注册 SW
  │
  ├─ 加载 dashboard.js + 3 个 CSS（合计 ~126KB 未压缩）
  └─ DOMContentLoaded → init()
      ├─ applyTheme()         读 dtb_theme，设 data-theme
      ├─ buildSidebarNav()    动态生成侧边栏分类导航，恢复折叠状态
      ├─ initScrollToTop()    注册 FAB 事件
      ├─ 注册全局键盘事件     /、⌘K、ESC、Alt+←
      ├─ 解析 location.hash   恢复上次页面
      └─ navigateTo(page)     渲染初始视图

首页渲染后（IntersectionObserver）：
  分类区进入视口 → 渲染工具卡片
  工具卡片 hover → prefetchTool(id)（requestIdleCallback 静默预加载）
```

---

## 2. 工具打开流程

```
点击工具卡片 / 搜索结果 / 命令面板条目
  │
  ├─ navigateTo(toolId)
  │   ├─ historyStack.push(currentPage)
  │   ├─ location.hash = toolId
  │   └─ hashchange → routePage(toolId)
  │
  ├─ window.__toolCleanup?.()   清理上一工具定时器/事件（待各工具实现）
  ├─ addUsage(toolId)           计数 +1，防抖 2s 写盘
  ├─ renderToolPageFull(tool)
  │   ├─ 渲染骨架屏 loading 占位
  │   ├─ loadTool(id)
  │   │   ├─ 已加载 → 直接跳过
  │   │   └─ 未加载 → showProgress() → 注入 <script src="tools/xxx.js">
  │   │               → onload → _trackLoaded()（LRU 驱逐判断）
  │   │               → onerror → 显示重试 UI
  │   ├─ 渲染 tool-header（标题 / 分类 / 收藏按钮 / 分享按钮）
  │   └─ window[tool.render](el)  注入 #toolBody
  │
  └─ addRecent(toolId)          头插去重，≤8 条
```

---

## 3. 搜索交互流程

```
用户输入 / 按 / 键 / ⌘K 聚焦
  │
  ├─ handleSearch(val)  防抖 100ms
  │   ├─ 空值 → 展示搜索历史下拉（最近 5 条）
  │   └─ 非空 → 多维度评分过滤 TOOLS[]
  │       评分：id 精确 > name 包含 > desc 包含 > category 包含
  │       → showSearchDropdown(results)
  │           分组展示，↑↓ 导航，Enter 打开工具
  │           底部「查看全部」→ renderSearchPage(q)
  │
  ├─ 按 Enter（无选中）→ renderSearchPage(q) 全量结果页
  └─ 按 ESC → 关闭下拉，保留输入值

搜索完成（打开工具）→ _addSearchHistory(val) 存入历史
```

---

## 4. 命令面板流程

```
触发：⌘K / Ctrl+K / ? 键
  │
  └─ openCmdPalette()
      ├─ renderCmdPalette()  渲染所有工具条目 + 快捷操作
      ├─ 自带搜索输入框，实时过滤
      ├─ ↑↓ 导航高亮条目
      ├─ Enter → navigateTo(toolId)
      └─ ESC / 点击遮罩 → 关闭
```

---

## 5. 收藏流程

```
点击工具卡片右上角 ★ / 工具页 header 收藏按钮
  │
  └─ toggleFavorite(id)
      ├─ 已收藏 → 从 favorites[] 移除，按钮取消激活
      ├─ 未收藏 → 添加到 favorites[]，按钮激活
      ├─ LS.set('dtb_favorites', favorites)
      └─ showToast('已收藏' / '已取消收藏')
      注意：不重渲染整页，仅就地更新按钮状态
```

---

## 6. 分享流程

```
点击工具页 header 分享按钮
  │
  └─ 复制当前 URL（含 hash）到剪贴板
      → showToast('链接已复制')
      直接分享 hash URL，接收方打开即定位到该工具
```

---

## 7. 主题切换流程

```
点击 topbar 主题按钮 ☀️ / 🌙
  │
  └─ toggleTheme()
      ├─ theme = 'dark' ↔ 'light'
      ├─ LS.set('dtb_theme', theme)
      └─ document.documentElement.setAttribute('data-theme', theme)
          CSS [data-theme="light"] 变量覆盖 :root dark 默认值，无 JS 重绘
```

---

## 8. 移动端侧边栏

```
点击 ☰ → toggleSidebar()
  ├─ sidebar 添加/移除 'open' class（translateX 动画）
  └─ overlay 遮罩显示，点击遮罩 → closeSidebar()

PC 折叠按钮 → toggleCollapse()
  ├─ sidebar 256px → 64px（仅显示图标）
  └─ 持久化 dtb_sidebar_collapsed
```

---

## 9. 键盘快捷键汇总

| 快捷键 | 行为 |
|--------|------|
| `/` | 聚焦搜索框 |
| `⌘K` / `Ctrl+K` | 打开命令面板 |
| `?` | 打开命令面板 |
| `ESC` | 关闭搜索下拉 / 关闭命令面板 / 返回首页 |
| `Alt+←` | 后退（historyStack 弹出）|
| `↑↓` | 命令面板 / 搜索下拉导航 |
| `Enter` | 确认选中项 |
| `⌘+Enter`（工具内）| 部分工具触发主操作（如 JSON 格式化）|
