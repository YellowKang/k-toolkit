# DevToolbox 全局设计文档

> 版本：v2.0 | 日期：2026-03-22 | 项目版本：v2.1

---

## 目录

1. [系统架构](#1-系统架构)
2. [工具交互流程](#2-工具交互流程)
3. [整体模块划分](#3-整体模块划分)
4. [UI/UE 规范与优化](#4-uiue-规范与优化)
5. [性能优化](#5-性能优化)
6. [已知问题与优先级](#6-已知问题与优先级)

---

## 1. 系统架构

### 1.1 定位

DevToolbox 是**纯静态前端工具箱**，73 个开发者工具，零登录、零后端、零数据库。
核心理念：**零依赖 · 离线可用 · 秒开**。

| 环境 | 方式 |
|------|------|
| 开发 | `npm run dev`（nodemon + Express 静态服务） |
| 生产 | 直接部署 `public/` 到 Nginx / GitHub Pages / Cloudflare Pages |

---

### 1.2 整体架构图

```
用户浏览器
│
├── Service Worker (sw.js)
│   ├── Cache-First  → shell 5 文件（html/js/css）
│   ├── SWR          → tools/*.js
│   └── 直接网络     → 其他所有请求
│
└── 应用壳 (dashboard.html)
    ├── dashboard.js   路由 / 状态 / 搜索 / 懒加载 / 命令面板
    ├── CSS 三层       base(布局) + components(组件) + theme(色彩)
    └── tools/*.js     73 个工具，点击时动态注入，LRU ≤ 30
```

**技术栈**

| 层次 | 技术 | 说明 |
|------|------|------|
| 运行时 | 原生 HTML/CSS/JS（ES2020+） | 零框架、零构建 |
| 开发服务 | Node.js + Express 4.x | 仅静态托管 + SPA fallback |
| 离线缓存 | Service Worker（Cache API） | shell Cache-First + tools SWR |
| 持久化 | localStorage | 收藏/最近/主题/用量/搜索历史 |
| 字体 | Inter / SF Pro Display / system-ui | 无外部 CDN 依赖 |

---

### 1.3 路由模型

```
hash 路由：location.hash = page

page 值规则：
  'home'       → 首页（收藏 + 最近 + 全部分类）
  'favorites'  → 收藏页
  'recent'     → 最近使用页
  '<toolId>'   → 工具详情页（如 'uuid'、'json'）

hashchange → routePage(page)
  ├─ 'home' / 'favorites' / 'recent' → renderHomePage(mode)
  └─ 其他 → renderToolPageFull(tool)
```

---

### 1.4 CSS 分层

| 文件 | 大小 | 职责 |
|------|------|------|
| dashboard-base.css | ~26KB | 布局骨架、CSS 变量、响应式断点、动效曲线 |
| dashboard-components.css | ~34KB | 所有 UI 组件：卡片、搜索、命令面板、进度条、Toast、FAB |
| dashboard-theme.css | ~11KB | Dark/Light 主题色彩变量覆盖 |

---

### 1.5 Service Worker 缓存策略

```
CACHE 版本：dtb-v1（⚠ 手动维护，待构建脚本自动 hash）

预缓存 Shell（install 时同步）：
  /dashboard.html、/dashboard.js
  /dashboard-base.css、/dashboard-components.css、/dashboard-theme.css

策略分支（仅处理同源 GET）：
  Shell 文件 或 /  → Cache-First
  /tools/*.js      → Stale-While-Revalidate
  其他             → 直接网络

activate：清理所有非 dtb-v1 cache
更新通知：postMessage('sw-updated') → 前端待实现刷新提示 Toast
```

---

### 1.6 状态管理

无全局 store，「模块级变量 + localStorage 持久化」：

| 变量 | 持久化 Key | 说明 |
|------|------------|------|
| favorites | dtb_favorites | 收藏工具 id 列表 |
| recent | dtb_recent | 最近使用，头插去重，≤8 条 |
| theme | dtb_theme | 'dark' \| 'light' |
| usageCounts | dtb_usage | 工具使用次数，防抖 2s 写盘 |
| searchHistory | dtb_search_history | 搜索历史，≤5 条 |
| collapsedCats | dtb_collapsed_cats | 侧边栏分类折叠状态 |
| collapsed | dtb_sidebar_collapsed | 侧边栏宽度折叠 |
| historyStack | 不持久化 | 会话内路由历史 |
| loadedTools | 不持久化 | 已加载工具 render 函数映射 |
| _loadOrder | 不持久化 | LRU 追踪顺序，≤30 |

---

## 2. 工具交互流程

### 2.1 首次加载

```
浏览器访问 /
  │
  ├─ SW 已安装？
  │   ├─ 是 → Cache-First 返回 dashboard.html（离线可用）
  │   └─ 否 → 网络请求，同时注册 SW
  │
  ├─ 加载 dashboard.js + 3 个 CSS（合计 ~126KB 未压缩，Gzip ~38-42KB）
  └─ DOMContentLoaded → init()
      ├─ applyTheme()       读 dtb_theme，设 data-theme
      ├─ buildSidebarNav()  动态生成侧边栏，恢复折叠状态
      ├─ initScrollToTop()  注册 FAB 事件
      ├─ 注册全局键盘事件   /、⌘K、ESC、Alt+←
      ├─ 解析 location.hash 恢复上次页面
      └─ navigateTo(page)   渲染初始视图

首页渲染后（IntersectionObserver）：
  分类区进入视口 → 渲染工具卡片
  工具卡片 hover → prefetchTool(id)（requestIdleCallback 静默预加载）
```

---

### 2.2 工具打开流程

```
点击工具卡片 / 搜索结果 / 命令面板条目
  │
  ├─ navigateTo(toolId)
  │   ├─ historyStack.push(currentPage)
  │   ├─ location.hash = toolId
  │   └─ hashchange → routePage(toolId)
  │
  ├─ window.__toolCleanup?.()  清理上一工具定时器/事件
  ├─ addUsage(toolId)          计数 +1，防抖 2s 写盘
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
  └─ addRecent(toolId)         头插去重，≤8 条
```

---

### 2.3 搜索流程

```
用户输入 → handleSearch(val)（防抖 100ms）
  ├─ val 为空 → 隐藏下拉
  └─ val 非空 → scoreTools(val)
      ├─ 精确 id 匹配         +100
      ├─ 名称包含（开头）     +80
      ├─ 名称包含（其他位置） +60
      ├─ 描述包含             +30
      ├─ 分类匹配             +20
      └─ 排序 → 渲染下拉（按分类分组，含高亮）

⚠ 当前无条数上限（待优化：单分类 ≤3 条 + 查看全部入口）
下拉交互：↑↓ 导航，Enter 打开，ESC 关闭
```

---

### 2.4 命令面板（⌘K）

```
⌘K / ? → openCommandPalette()
  ├─ 显示遮罩 + 面板，聚焦输入框
  └─ 默认条目：系统命令（切换主题/返回首页/收藏）+ 最近使用工具（≤3条）

输入过滤：实时过滤 TOOLS[] + 系统命令，高亮匹配
↑↓ 导航，Enter 执行，ESC 关闭
```

---

### 2.5 收藏与最近使用

```
收藏：toggleFavorite(id)
  ├─ 加入/移除 favorites[]，即时更新按钮 DOM（不重渲染整页）
  └─ 防抖 500ms 写 dtb_favorites

最近使用：addRecent(id)
  ├─ 头部插入，去重，超 8 条截断
  └─ 写 dtb_recent
```

---

### 2.6 主题切换

```
theme 取反 → setAttribute('data-theme', theme)
CSS [data-theme="light"] 变量覆盖 :root dark 默认值，无 JS 重绘
```

---

### 2.7 键盘快捷键

| 快捷键 | 行为 |
|--------|------|
| `/` | 聚焦搜索框 |
| `⌘K` / `Ctrl+K` | 打开命令面板 |
| `?` | 打开命令面板 |
| `ESC` | 关闭搜索下拉 / 命令面板 / 返回首页 |
| `Alt+←` | 后退（historyStack 弹出） |
| `↑↓` | 命令面板 / 搜索下拉导航 |
| `Enter` | 确认选中项 |
| `⌘+Enter`（工具内） | 部分工具触发主操作（如 JSON 格式化） |

---

## 3. 整体模块划分

### 3.1 文件结构

```
login/
├── server.js                     Express 静态服务（仅开发）
├── package.json                  name: devtoolbox, version: 2.0.0
├── .env / .env.example           PORT 默认 3000
├── data/users.json               遗留文件，生产不使用
├── public/
│   ├── index.html                SPA fallback 入口
│   ├── dashboard.html            应用壳（真正 SPA 入口）
│   ├── dashboard.js              核心逻辑（~49KB，⚠ 待拆分）
│   ├── dashboard-base.css        布局 + CSS 变量（~26KB）
│   ├── dashboard-components.css  组件样式（~34KB）
│   ├── dashboard-theme.css       主题色彩（~11KB）
│   ├── sw.js                     Service Worker
│   └── tools/                    73 个工具（按需懒加载）
└── design/devtoolbox/            设计文档
```

---

### 3.2 dashboard.js 核心模块

| 模块 | 关键函数/变量 | 职责 |
|------|--------------|------|
| 工具注册表 | `TOOLS[]` | 73 个工具元数据（id/name/desc/category/file/render） |
| 分类常量 | `CATEGORIES[]`、`CAT_ICONS{}` | 10 分类，顶层常量 |
| 持久化 | `LS.get / LS.set` | localStorage 安全读写（try/catch） |
| 路由 | `navigateTo(page)`、`routePage(page)` | hash 路由 + historyStack |
| 懒加载 | `loadTool(id)` | 动态注入 script，进度条，重试 UI |
| 预取 | `prefetchTool(id)` | hover 静默预加载，并发 ≤3 |
| LRU | `_trackLoaded(id)`、`_loadOrder[]` | 超 30 驱逐最旧 |
| 首页渲染 | `renderHomePage(mode)` | home/favorites/recent 三视图 |
| 工具页 | `renderToolPageFull(tool)` | 骨架屏→加载→渲染→注入 #toolBody |
| 工具卡片 | `renderToolCard(tool)` | 收藏按钮、用量 badge、NEW 标签 |
| 搜索 | `handleSearch(val)` | 防抖 100ms，多维度评分 |
| 命令面板 | `openCommandPalette()` | ⌘K 全局工具+命令检索 |
| 收藏 | `toggleFavorite(id)` | 就地更新 DOM，防抖写盘 |
| 主题 | `applyTheme()`、`toggleTheme()` | data-theme 属性切换 |
| Toast | `showToast(msg)` | 操作反馈，自动消失 |

---

### 3.3 工具分类（73 个）

| 分类 | 数量 | 代表工具 |
|------|------|----------|
| 文本处理 | 16 | uuid, json, base64, regex, text-diff, markdown |
| 编码转换 | 8 | url-encode, html-entity, unicode-convert, jwt-decode |
| 加密安全 | 4 | hash, aes, bcrypt, rsa |
| 数字计算 | 5 | calculator, unit-convert, byte-convert, aspect-ratio, css-unit |
| CSS 工具 | 8 | color, gradient, flexbox, shadow, clip-path, color-convert, color-contrast |
| 开发工具 | 11 | json-schema, cron, docker-gen, git-commit, curl-gen, env-parse, sql-format |
| 图片工具 | 6 | img-compress, img-webp, img-base64, qrcode, qrcode-decode, image-palette |
| 网络工具 | 4 | http-tester, ip-info, speed-test, user-agent |
| 效率工具 | 5 | meeting-cost, pomodoro, spinner, stopwatch, text-template |
| 时间工具 | 4 | countdown, date-diff, timezone, world-clock |
| 趣味工具 | 2 | ascii-art, matrix-rain |

每个工具暴露全局函数 `render<Name>(el)`，`el` 为 `#toolBody`。

---

### 3.4 Service Worker 模块（sw.js）

```
CACHE：dtb-v1
install → 预缓存 5 个 shell 文件
fetch   → Cache-First / SWR / 直接网络
activate → 清理旧 cache，postMessage('sw-updated')
```

---

## 4. UI/UE 规范与优化

### 4.1 色彩体系（Dark 默认）

```
主背景     --bg:           #09090f
次背景     --bg2:          #0d0d1a
强调色     --accent:       #8b5cf6  （紫色主调）
霓虹蓝     --neon:         #06b6d4
危险色     --accent-pink:  #f43f5e
正文       --text:         #f1f5f9
次要文本   --text-muted:   rgba(241,245,249,0.65)
毛玻璃     --glass:        rgba(255,255,255,0.04)
```

每个工具卡片有独立 `--card-color`，用于图标背景和 hover 光晕。

---

### 4.2 布局结构

```
┌─────────────────────────────────────────────┐
│  Topbar（64px）  ☰  搜索框  主题按钮 ⌘K     │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Content 区（overflow-y: auto）   │
│ 256px    │                                  │
│ 可折叠   │  首页：收藏 + 最近 + 分类工具卡片 │
│ 至 64px  │  工具页：tool-header + #toolBody  │
└──────────┴──────────────────────────────────┘
移动端（≤768px）：sidebar 隐藏，顶部 ☰ 打开，底部导航栏
```

---

### 4.3 动效规范

| 场景 | 曲线 | 时长 |
|------|------|------|
| 卡片 hover / 收藏按钮 | `cubic-bezier(0.34,1.56,0.64,1)`（弹性） | 200ms |
| 页面切换 / 侧边栏 | `cubic-bezier(0.16,1,0.3,1)`（顺滑退出） | 300ms |
| Toast 出现 | ease-out | 250ms |

---

### 4.4 组件规范

**工具卡片**
- 正常态：毛玻璃背景，图标左上，name + desc，右上收藏按钮
- hover：translateY(-4px) + 光晕（--card-color 半透明）
- 用量 badge：>0 次时展示，右下角
- NEW 标签：isNew:true 时展示，右上角

**搜索下拉**
- 按分类分组，匹配文字高亮
- 键盘导航高亮选中项
- 点击外部或 ESC 关闭

**命令面板**
- 全屏遮罩 + 居中面板
- 输入框自动聚焦
- 系统命令 + 工具条目两类

**Toast**
- 右上角固定，自动消失（3s）
- 场景：复制成功、收藏变更、分享链接复制、主题切换

---

### 4.5 状态规范

| 状态 | 表现 |
|------|------|
| 工具加载中 | 顶部进度条 + 骨架屏占位 |
| 工具加载失败 | 「加载失败，点击重试」按钮 |
| 收藏为空 | 空态插图 + 引导文案 |
| 最近为空 | 空态文案 |
| 搜索无结果 | 「未找到匹配工具」提示 |

---

### 4.6 已知 UI/UE 问题

| 优先级 | 问题 | 建议 |
|--------|------|------|
| 高 | 移动端工具 header 内容过多易折行 | 分享按钮改 icon-only 或收入 kebab menu |
| 高 | SW 更新无用户感知 | 消费 sw-updated，显示「发现新版本，点击刷新」Toast |
| 中 | 搜索下拉无数量上限 | 单分类 ≤3 条 + 「查看全部 N 个结果」入口 |
| 中 | 工具页无同分类推荐 | 工具详情底部加同分类推荐卡片（3个）|
| 中 | 侧边栏折叠后无 tooltip | PC 折叠态每个分类项加 title 属性 |
| 中 | 返回首页丢失滚动位置 | 记录并恢复 scrollTop |
| 低 | dark 模式部分卡片对比度不足 | 强制最低亮度阈值 |
| 低 | FAB 可能遮挡工具操作区 | 工具页隐藏 FAB 或增加 bottom offset |

---

## 5. 性能优化

### 5.1 首屏资源预算

```
dashboard.html           ~3.4KB
dashboard.js             ~49KB
dashboard-base.css       ~26KB
dashboard-components.css ~34KB
dashboard-theme.css      ~11KB
─────────────────────────────────
合计首屏                 ~126KB（未压缩）
Gzip 后估算              ~38-42KB
```

### 5.2 加载性能优化策略

| 优化点 | 实现方式 | 效果 |
|--------|----------|------|
| 工具懒加载 | 点击时动态注入 `<script>` | 首屏只加载 ~126KB shell |
| hover 预取 | `prefetchTool` + requestIdleCallback | 工具首次打开近乎无感 |
| LRU 驱逐 | 已加载 >30 个时移除最旧 script | 控制内存占用 |
| SW Cache-First | shell 文件优先走缓存 | 二次访问 <10ms |
| SW SWR | tools/*.js 先缓存后台更新 | 工具即时可用且保持最新 |
| 分类懒渲染 | IntersectionObserver 分类进视口才渲染 | 首屏 DOM 节点更少 |

**待优化项**

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 高 | dashboard.js 单文件 49KB，全量解析 | 按模块拆分（搜索/路由/渲染），空闲时加载非核心模块 |
| 高 | CSS 三文件合计 71KB，生产未压缩 | 开启 Brotli/Gzip；生产构建合并压缩 |
| 中 | 工具无预加载优先级控制 | 对「收藏」和「最近使用」工具提升预取优先级 |
| 中 | SW 版本需手动改 dtb-v1 | 构建时自动生成 cache key（文件 hash）|

---

### 5.3 运行时性能

| 优化点 | 实现方式 |
|--------|----------|
| 搜索防抖 | 100ms 防抖，避免每次按键全量过滤 |
| 用量写盘防抖 | 2s 防抖批量写 localStorage |
| 就地更新 | 收藏/主题切换不重渲染整页，仅更新对应 DOM |
| 分类过滤 | 内存中过滤 TOOLS[]，不触发网络 |
| historyStack | 内存模拟浏览器历史，无额外开销 |
| 分类常量预计算 | CATEGORIES/CAT_COUNTS 顶层常量，避免渲染时重复遍历 |

**待优化项**

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 高 | 首页切换分类时全量重渲染工具卡片 DOM | 增量更新：仅隐藏/显示对应分类节点 |
| 中 | 搜索评分全量遍历 TOOLS[]（73 次）| 构建倒排索引，O(1) 查找候选集 |
| 中 | 搜索下拉无条数上限 | 单分类最多 3 条，减少 DOM 节点 |
| 低 | 工具卡片 innerHTML 拼接 | 改用 DocumentFragment 批量插入 |

---

### 5.4 渲染性能

- 骨架屏：工具加载期间展示 loading 占位，避免布局跳动
- 顶部进度条：`#top-progress` 视觉反馈，不阻塞渲染
- 工具页切换：`#toolBody` innerHTML 整体替换，旧工具 DOM 自动 GC
- 主题切换：只改 `data-theme` 属性，CSS 变量自动响应，无 JS 重绘
- 侧边栏动画：CSS transition，GPU 合成层（transform），不触发 layout

**待优化项**

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 中 | 大量工具卡片同时渲染 | 虚拟列表或分批渲染（requestAnimationFrame 分帧）|
| 低 | FAB 可能遮挡工具操作区 | 工具页隐藏 FAB 或增加 bottom offset |

---

### 5.5 离线缓存 & 内存管理

**离线缓存策略**

| 资源类型 | 策略 | 效果 |
|----------|------|------|
| Shell 文件（5个）| Cache-First | 离线时直接返回缓存，完全可用 |
| tools/*.js | Stale-While-Revalidate | 有缓存先返回，后台 fetch 更新 |
| 其他 | 直接网络 | 不缓存 |

**待优化项**

| 优先级 | 问题 | 方案 |
|--------|------|------|
| ~~高~~ | ~~SW 更新后无用户感知通知~~ | ✅ 已实现：监听 sw-updated，showToast 点击刷新 |
| 中 | 工具文件首次访问仍需网络 | 对「最近使用」top 5 工具在 SW install 时预缓存 |
| 低 | cache key 硬编码 dtb-v1 | 接入构建 hash 自动生成版本 key |

**内存管理**

- LRU 上限 30：超过时移除最旧 script 标签 + 清除 `window[render]`
- 工具页切换：`#toolBody` innerHTML 替换，旧 DOM 自动 GC
- 工具事件泄漏：路由切换时统一调用 `window.__toolCleanup?.()`
- ObjectURL 释放：img-compress / img-webp / qrcode 已调用 `URL.revokeObjectURL()`

---

## 6. 已知问题与优先级

| 优先级 | 分类 | 问题 | 状态 |
|--------|------|------|------|
| 高 | 架构 | dashboard.js 49KB 单文件膨胀 | 待处理：拆分 core/render/search 模块 |
| 高 | 缓存 | ~~SW 更新无用户感知~~ | ✅ 已修复：监听 sw-updated，Toast 点击刷新 |
| 高 | UI | 移动端工具页 header 折行 | 待处理：分享按钮改 icon-only |
| 高 | 性能 | CSS 三文件合计 71KB，生产未启用压缩 | 待处理：开启 Brotli/Gzip |
| 中 | 交互 | ~~搜索下拉无数量上限~~ | ✅ 已修复：单分类 ≤3 条 + 查看全部入口 |
| 中 | 交互 | ~~工具页无同分类推荐~~ | ✅ 已修复：详情底部加同分类推荐卡片（4个）|
| 中 | 交互 | ~~返回首页丢失滚动位置~~ | ✅ 已修复：记录并恢复 scrollTop |
| 中 | 性能 | 搜索评分全量遍历工具列表 | 待处理：构建倒排索引 |
| 中 | 架构 | SW cache key 硬编码 dtb-v1 | 待处理：构建脚本自动生成 hash key |
| 中 | UI | ~~侧边栏折叠后无 tooltip~~ | ✅ 已修复：buildSidebarNav 重建后同步绑定 tooltip |
| 中 | 性能 | ~~searchHistory 每次立即写盘~~ | ✅ 已修复：debounce 1s 批量写 |
| 低 | 内存 | ~~img-compress/img-webp/qrcode ObjectURL 未释放~~ | ✅ 已修复：已补 revokeObjectURL |
| 低 | UI | ~~warn 类型 Toast 无图标~~ | ✅ 已修复：补充 ⚠ 图标 |
| 低 | UI | dark 模式部分工具卡片颜色对比度不足 | 待处理：强制最低亮度阈值 |
| 低 | UI | ~~回到顶部 FAB 遮挡工具操作区~~ | ✅ 已修复：工具页自动隐藏 FAB |