# 模块划分

## 1. 文件结构总览

```
login/
├── server.js                    Express 静态服务（仅开发）
├── package.json                 name: devtoolbox, version: 2.0.0
├── .env / .env.example          环境变量（PORT 默认 3000）
├── data/users.json              遗留文件，生产不使用
├── public/
│   ├── index.html               SPA fallback 入口
│   ├── dashboard.html           应用壳（真正 SPA 入口）
│   ├── dashboard.js             核心逻辑（~41KB，⌘K 懒加载 dashboard-cmd.js）
│   ├── dashboard-cmd.js         命令面板（~8KB，按需懒加载）
│   ├── dashboard-base.css       布局 + CSS 变量（~26KB）
│   ├── dashboard-components.css 组件样式（~34KB）
│   ├── dashboard-theme.css      主题色彩（~11KB）
│   ├── sw.js                    Service Worker
│   └── tools/                   73 个工具（按需懒加载）
│       ├── uuid.js
│       ├── json-format.js
│       └── ... (71 个)
└── design/devtoolbox/           设计文档
```

---

## 2. dashboard.js 核心模块

| 模块 | 关键函数/变量 | 职责 |
|------|--------------|------|
| 工具注册表 | `TOOLS[]` | 73 个工具元数据 |
| 分类常量 | `CATEGORIES[]`、`CAT_COUNTS{}`、`CAT_ICONS{}` | 10 分类，顶层常量避免重复遍历 |
| 持久化 | `LS.get / LS.set` | localStorage 安全读写 |
| 路由 | `navigateTo(page)`、`routePage(page)` | hash 路由 + historyStack |
| 懒加载 | `loadTool(id)` | 动态注入 script，进度条，重试 UI |
| 预取 | `prefetchTool(id)` | hover 静默预加载，并发≤3 |
| LRU | `_trackLoaded(id)`、`_loadOrder[]` | 超 30 驱逐最旧 |
| 首页渲染 | `renderHomePage(mode)` | home/favorites/recent 三视图 |
| 工具页 | `renderToolPageFull(tool)` | 骨架屏→加载→渲染→注入 #toolBody |
| 工具卡片 | `renderToolCard(tool)` | 收藏按钮、用量 badge、NEW 标签 |
| 搜索 | `handleSearch(val)` | 防抖 100ms，多维度评分 |
| 搜索历史 | `_showSearchHistory()`、`_addSearchHistory()` | 最近 5 条 |
| 搜索结果页 | `renderSearchPage(q)` | 全量搜索结果展示 |
| 命令面板 | `openCmdPalette`（stub）、`_loadCmd` | ⌘K/? 触发，懒加载 dashboard-cmd.js |
| 侧边栏 | `buildSidebarNav()`、`toggleCollapse()` | 动态生成，折叠 256px→64px |
| 主题 | `toggleTheme()`、`applyTheme()` | dark↔light，data-theme 切换 |
| 收藏 | `toggleFavorite(id)` | 就地更新 + Toast |
| 最近使用 | `addRecent(id)` | 头插去重，≤8 条 |
| 用量统计 | `addUsage(id)` | 防抖 2s 批量写盘 |
| Toast | `showToast(msg)` | 全局轻提示 |
| 进度条 | `showProgress()`、`hideProgress()` | 工具加载视觉反馈 |
| 回到顶部 | `initScrollToTop()` | FAB，滚动超阈值显示 |
| 初始化 | `init()` | DOMContentLoaded 入口 |

---

## 3. 工具分类（73 个）

| 分类 | 数量 | 代表工具 |
|------|------|----------|
| 文本处理 | 13 | json-format, base64, regex, text-diff, markdown, diff-json, toml-json |
| 开发工具 | 11 | http-tester, sql-format, yaml-json, xml-format, url-parser, env-parse, docker-gen |
| CSS 工具 | 11 | color, shadow, gradient, clip-path, aspect-ratio, css-unit, color-contrast |
| 计算工具 | 8 | calculator, unit-convert, byte-convert, color-convert |
| 编码加密 | 4 | aes, morse, url-encode, text-escape |
| 图片工具 | 5 | img-base64, img-compress, img-webp, qrcode, qrcode-decode |
| 网络工具 | 4 | http-tester, ip-info, speed-test, user-agent |
| 效率工具 | 5 | meeting-cost, pomodoro, spinner, stopwatch, text-template |
| 时间工具 | 4 | countdown, date-diff, timezone, world-clock |
| 趣味工具 | 2 | ascii-art, matrix-rain |

每个工具文件暴露一个全局函数 `render<Name>(el)`，由 `renderToolPageFull` 加载完毕后调用，el 为 `#toolBody` 元素。

---

## 4. Service Worker 模块（sw.js）

```
CACHE 版本：dtb-v1

预缓存 Shell（install 时同步缓存）：
  /dashboard.html、/dashboard.js、/dashboard-cmd.js
  /dashboard-base.css、/dashboard-components.css、/dashboard-theme.css

策略分支（仅处理同源 GET）：
  Shell 文件 或 /     → Cache-First
  /tools/*.js         → Stale-While-Revalidate
  其他                → 直接网络

activate：清理所有非 dtb-v1 cache
更新通知：向所有 window client postMessage('sw-updated')（前端待实现消费）
```
