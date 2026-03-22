# 系统架构

## 1. 整体架构图

```
┌────────────────────────────────────────────────────────────────┐
│                          用户浏览器                              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Service Worker (sw.js)                   │  │
│  │   Cache-First ──── shell 5 文件（html/js/css）            │  │
│  │   Stale-While-Revalidate ──── tools/*.js                 │  │
│  │   直接网络 ──── 其他所有请求                               │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                             │                                  │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                 应用壳 (dashboard.html)                    │  │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌───────────┐   │  │
│  │  │   dashboard.js   │  │  CSS 三层    │  │tools/*.js │   │  │
│  │  │ 路由/状态/搜索   │  │ base 布局   │  │ 按需注入  │   │  │
│  │  │ 命令面板/导航    │  │ components  │  │  LRU≤30  │   │  │
│  │  │ 懒加载/LRU      │  │ theme 色彩  │  │           │   │  │
│  │  └──────────────────┘  └──────────────┘  └───────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  持久化层：localStorage                                         │
│  收藏 / 最近使用 / 主题 / 用量 / 搜索历史 / 侧边栏状态            │
└────────────────────────────────────────────────────────────────┘

生产部署：public/ → Nginx / GitHub Pages / Cloudflare Pages
开发运行：server.js（Express 静态服务，不进生产）
```

---

## 2. 技术选型

| 层次 | 选型 | 原因 |
|------|------|------|
| UI 框架 | 无（原生 JS）| 零依赖，控制包体积 |
| 构建工具 | 无 | 直接部署，开发即生产 |
| 离线能力 | Service Worker | 原生支持，无需 Workbox |
| 状态管理 | 模块级变量 + localStorage | 简单可控，无需 store 框架 |
| 路由 | hash-based | 静态托管友好，无需服务端配置 |
| 开发服务器 | Express 4.x + nodemon | 轻量，SPA fallback |

---

## 3. CSS 三层架构

```
dashboard-base.css       ~26KB  布局骨架、CSS 变量、响应式断点
dashboard-components.css ~34KB  工具卡片、按钮、搜索、命令面板、Toast
dashboard-theme.css      ~11KB  :root dark 变量 + [data-theme="light"] 覆盖
```

**分层原则：**
- base：定义结构变量（`--sidebar-w: 256px`、`--topbar-h: 64px`、`--radius: 18px`、`--ease-*`）
- theme：定义色彩变量（`--bg`、`--accent`、`--text`、`--glass`）
- components：只引用变量，不写硬编码色值
- 主题切换只改 `data-theme` 属性，CSS 自动响应，无 JS 重绘

---

## 4. 路由模型（Hash-based SPA）

```
URL 格式：
  #home         首页（全部工具）
  #favorites    收藏页
  #recent       最近使用页
  #search       全局搜索结果页
  #<toolId>     工具详情页（如 #json、#uuid）

路由流程：
  navigateTo(page)
    → location.hash = page
    → window.hashchange 事件
    → routePage(page)
        ├─ home/favorites/recent/search → renderHomePage(mode)
        └─ toolId → renderToolPageFull(tool)

历史管理：
  historyStack[]  内存维护，Alt+← 触发 popHistory()
  不依赖 History API，静态部署无需配置
```

---

## 5. 工具懒加载与 LRU

```
loadTool(id):
  1. window[render] 已存在 → 直接返回
  2. 未加载 → 顶部进度条 → 动态注入 <script src="tools/xxx.js">
  3. onload → _trackLoaded(id)
       _loadOrder[] 记录顺序；超过 30 → 驱逐最旧（移除 script + delete window[render]）
  4. onerror → 显示重试 UI

prefetchTool(id):
  hover 时 requestIdleCallback 静默预取
  并发上限 3（_prefetchQueue.size >= 3 跳过）
  已加载或已在队列 → 跳过
```

---

## 6. Service Worker 缓存策略

```
CACHE KEY：dtb-v1

预缓存 Shell（install 时）：
  /dashboard.html / /dashboard.js
  /dashboard-base.css / /dashboard-components.css / /dashboard-theme.css

运行时策略：
  Shell 文件 或 /          → Cache-First
  /tools/*.js              → Stale-While-Revalidate（先缓存后台更新）
  其他                     → 直接网络，不缓存

activate 时：清理所有非 dtb-v1 的旧 cache
更新通知：activate 后向所有 window client postMessage('sw-updated')
```

---

## 7. 状态管理

无全局 store，「模块级变量 + localStorage 持久化」：

| 变量 | 类型 | 持久化 Key | 说明 |
|------|------|------------|------|
| favorites | Array | dtb_favorites | 收藏工具 id 列表 |
| recent | Array(≤8) | dtb_recent | 最近使用，头插去重 |
| theme | string | dtb_theme | 'dark' \| 'light' |
| usageCounts | Object | dtb_usage | 工具使用次数，防抖 2s 写盘 |
| searchHistory | Array(≤5) | dtb_search_history | 搜索历史 |
| collapsedCats | Object | dtb_collapsed_cats | 侧边栏分类折叠状态 |
| collapsed | boolean | dtb_sidebar_collapsed | 侧边栏宽度折叠 |
| historyStack | Array | 不持久化 | 会话内路由历史 |
| loadedTools | Object | 不持久化 | 已加载工具 render 函数映射 |
| _loadOrder | Array(≤30) | 不持久化 | LRU 追踪顺序 |
