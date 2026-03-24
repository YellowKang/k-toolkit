# K Toolkit

> 开发者工具箱 —— 82 个精选工具 + AI 智能体助手，纯静态，无需登录，开箱即用。
> A developer toolbox — 82 curated tools + AI Agent assistant, pure static, no login required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yellowkang.github.io/k-toolkit/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](#docker)

**在线体验 / Live Demo：[https://yellowkang.github.io/k-toolkit/](https://yellowkang.github.io/k-toolkit/)**

---

## 简介 / Introduction

K Toolkit 是一个面向开发者的在线工具集合，涵盖文本处理、开发工具、CSS、图片、编码加密、计算、时间、效率、网络、趣味等 10 大分类共 82 个工具。
内置 AI 智能体助手（`Alt+A` 唤起），支持自然语言驱动工具执行。
所有工具均运行在浏览器本地，无需服务器，无需登录，数据不离开你的设备。

K Toolkit is an online toolbox for developers, covering 82 tools across 10 categories: text processing, dev tools, CSS, image, encoding & crypto, calculation, time, productivity, network, and fun.
Built-in AI Agent assistant (`Alt+A` to open) supports natural language tool execution.
All tools run locally in the browser — no server, no login, your data never leaves your device.

---

## 工具列表 / Tools

| 分类 Category | 工具 Tools |
|------|------|
| 文本处理 Text (14) | UUID、JSON 格式化 JSON Formatter、Base64、字数统计 Word Count、正则测试 Regex Tester（15 个模板 15 templates）、JSON/CSV 互转 JSON↔CSV、文本对比 Text Diff、Markdown 预览 Markdown Preview、大小写转换 Case Convert、Unicode、HTML 实体 HTML Entity、占位文本 Lorem Ipsum、文本转义 Text Escape、JSON 对比 JSON Diff、TOML/JSON、行排序去重 Line Sort & Dedup、Slug 生成 Slug Generator |
| 开发工具 Dev Tools (15) | 时间戳 Timestamp、URL 工具箱 URL Toolkit、哈希生成器 Hash Generator、JWT 工具 JWT Tool、进制转换 Base Convert、YAML/JSON、SQL 格式化 SQL Formatter、cURL 生成器 cURL Generator（含 import 反解析 with import parser）、HTTP 状态码 HTTP Status Code、Cron 表达式 Cron Expression、密码生成器 Password Generator（HIBP 泄露检测 breach detection + Diceware）、ENV 解析器 ENV Parser、Dockerfile 生成 Dockerfile Generator、Nginx 配置生成 Nginx Config Generator、Git Commit、Semver、DNS 查询 DNS Lookup、终端颜色码 Terminal Colors |
| CSS 工具 CSS Tools (8) | 渐变生成器 Gradient Generator（20 预设 presets + 动画 animation + Tailwind）、颜色工具 Color Tool（拾色/转换/对比度三合一 picker/converter/contrast 3-in-1）、阴影生成器 Shadow Generator、Flexbox、SVG 预览 SVG Preview、调色板生成器 Palette Generator、Clip-path、CSS 单位转换 CSS Unit Convert |
| 图片工具 Image Tools (6) | 图片 Base64 Image Base64、图片压缩 Image Compress、二维码生成 QR Generator（圆点/圆角样式 dot/rounded styles + Logo 嵌入 logo embed）、二维码解析 QR Reader、图片转 WebP Image→WebP、EXIF 查看器 EXIF Viewer |
| 编码加密 Encoding & Crypto (3) | AES 加解密 AES Encrypt/Decrypt、摩斯电码 Morse Code、XML 格式化 XML Formatter |
| 计算工具 Calculators (9) | 科学计算器 Scientific Calculator、单位换算 Unit Convert（含数字格式化 with number formatting）、贷款计算器 Loan Calculator、存储换算 Storage Convert、数字大写 Number to Chinese、IP 子网计算 IP Subnet、比例计算 Ratio Calculator、年龄计算器 Age Calculator、个税计算器 Tax Calculator |
| 时间工具 Time Tools (5) | 日期差计算 Date Diff、时区转换 Timezone Convert、倒计时 Countdown、世界时钟 World Clock、农历查询 Lunar Calendar |
| 效率工具 Productivity (8) | 番茄钟 Pomodoro、会议费用 Meeting Cost、随机抽签 Random Spinner（Canvas 转盘动画 Canvas wheel animation）、秒表计时 Stopwatch、文本模板 Text Template（支持批量 JSON with batch JSON）、Todo 清单 Todo List、临时便签 Scratch Pad、打字速度测试 Typing Speed Test（句子/单词/代码模式 sentence/word/code mode + 统计图表 stats chart） |
| 网络工具 Network (4) | UA 解析 UA Parser、HTTP 请求测试 HTTP Tester、IP 信息 IP Info、网速测试 Speed Test |
| 趣味工具 Fun (4) | ASCII 艺术字 ASCII Art、Emoji 选择器 Emoji Picker、白噪音 White Noise、矩阵雨 Matrix Rain |

---

## 特性 / Features

- **AI 智能体 AI Agent** — `Alt+A` 唤起完整面板，`Cmd/Ctrl+J` 打开迷你对话框，自然语言驱动工具执行，支持多模型（Claude / OpenAI / Gemini）
  `Alt+A` for full panel, `Cmd/Ctrl+J` for mini dialog, natural language tool execution, supports Claude / OpenAI / Gemini
- **中/英双语 Bilingual** — 点击 topbar EN/ZH 按钮即可切换，工具列表/分类/搜索全覆盖
  Switch via topbar EN/ZH button, covers tool names, categories, and search
- **全局搜索 Global Search** — `/` 或 `⌘K` 呼出，支持拼音/英文/标签搜索，历史记录
  Press `/` or `⌘K` to open, supports pinyin / English / tag search with history
- **多主题 Themes** — 暗夜黑 / 纯白 / 科技蓝 / 樱花粉 / 商务橙 / 清新绿
  Dark / Light / Tech Blue / Sakura Pink / Business Orange / Fresh Green
- **懒加载 Lazy Loading** — 工具 JS 按需加载 + LRU 淘汰（最多保留 30 个），首屏极速
  Tool JS loaded on demand with LRU eviction (max 30 cached), instant first paint
- **收藏 & 最近 Favorites & History** — 收藏常用工具，自动记录使用历史和热门排行，持久化到 localStorage
  Bookmark favorites, auto-track usage history and popular tools, persisted in localStorage
- **离线可用 Offline Ready** — Service Worker 分层缓存（Shell Cache First + 工具 Stale-While-Revalidate），断网也能使用
  Service Worker with layered caching strategy (Shell Cache First + Tool Stale-While-Revalidate)
- **移动适配 Mobile Friendly** — 响应式布局 + 底部导航栏 + 可拖拽 AI 按钮
  Responsive layout + bottom nav bar + draggable AI FAB button

---

## 架构 / Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  浏览器 Browser                                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ dashboard.js │  │   i18n.js    │  │ dashboard-cmd.js │  │
│  │  工具注册表   │  │ 双语 key-map │  │  命令面板(懒加载) │  │
│  │  路由/渲染    │  │  ID 索引     │  │  ⌘K palette      │  │
│  │  搜索/主题    │  │              │  │                  │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │                                                   │
│         │ loadTool(id) → <script> 按需注入                   │
│         ▼                                                   │
│  ┌──────────────────────────────────────────┐               │
│  │         tools/*.js (82 个独立文件)         │               │
│  │  每个工具暴露 renderXxx(el) 函数           │               │
│  │  LRU 淘汰：最多保留 30 个已加载脚本        │               │
│  │  _activeCleanup：切换时清理定时器/监听     │               │
│  └──────────────────────────────────────────┘               │
│                                                             │
│  ┌──────────────────────────────────────────┐               │
│  │         agent/ (AI 智能体系统)             │               │
│  │  agent-loader.js ── 分组懒加载 4 阶段      │               │
│  │    ① adapters/ (Claude/OpenAI/Gemini)     │               │
│  │    ② agent-core.js (会话引擎)             │               │
│  │    ③ agent-router.js (页面上下文同步)      │               │
│  │    ④ agent-ui*.js (聊天面板 + 迷你对话框)  │               │
│  │  actions/ ── 工具执行器 (nav/text/dev...)  │               │
│  └──────────────────────────────────────────┘               │
│                                                             │
│  ┌──────────────┐                                           │
│  │    sw.js     │  Shell: Cache First                       │
│  │  Service     │  Tools: Stale-While-Revalidate            │
│  │  Worker      │  版本化缓存 key (build 自动生成)            │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘

构建管线 Build Pipeline:
  public/ ──→ build.js ──→ dist/
    CSS 压缩 (~20% 减小)
    JS 压缩 (去注释/空行/缩进 ~8% 减小)
    SW 版本注入 (MD5 hash → cache key)
    deploy.yml: dist/ → gh-pages 分支
```

### 核心设计决策 / Key Design Decisions

| 决策 Decision | 选择 Choice | 原因 Reason |
|------|------|------|
| 框架 Framework | 纯 Vanilla JS, 无框架 No framework | 82 个独立工具，无共享状态，框架开销不值得 Zero shared state across tools, framework overhead not justified |
| 模块系统 Modules | `<script>` 按需注入 On-demand injection | 无需打包工具，部署简单，支持子目录部署 No bundler needed, simple deployment, subdirectory-safe |
| i18n | ID 索引的 key-value map | 工具增删无需对齐数组索引 Add/remove tools without aligning array indices |
| 工具隔离 Tool isolation | `renderXxx(el)` + `_activeCleanup` | 每个工具自包含渲染 + 清理，切换时无副作用泄漏 Self-contained render + cleanup, no side-effect leaks |
| AI Agent 加载 | 4 阶段分组懒加载 4-phase grouped lazy load | 首屏不加载 Agent（~25 个 JS），用户触发时才加载 Agent not loaded at startup, only when user triggers |
| SW 缓存 | 分层策略 Layered strategy | Shell 文件优先缓存保证秒开；工具文件后台更新保证最新 Shell cached for instant load; tools updated in background |

### 新增工具指南 / Adding a New Tool

只需 2 步（最少）或 4 步（完整 Agent 支持）：
Minimum 2 steps, or 4 steps for full Agent support:

1. **写工具文件 Create tool file** — `public/tools/my-tool.js`，暴露 `renderMyTool(el)` 函数
   Export a `renderMyTool(el)` function
2. **注册到 TOOLS 数组 Register** — 在 `dashboard.js` 的 `TOOLS` 数组加一条，在 `i18n.js` 的 `TOOLS_EN` map 加一条（按 id 索引，无需对齐顺序）
   Add entry to `TOOLS` array in `dashboard.js` and `TOOLS_EN` map in `i18n.js` (keyed by id, order doesn't matter)
3. *(可选 Optional)* **Agent 支持** — 在 `agent/actions/nav.js` 的 `TOOL_CAPS` + `TOOL_RUNNERS` 注册
   Register in `TOOL_CAPS` + `TOOL_RUNNERS` in `agent/actions/nav.js`
4. *(可选 Optional)* **Agent 提示** — 在 `agent/agent-autonomy.js` 加 QA/Hint
   Add QA/Hint overrides in `agent/agent-autonomy.js`

---

## 快速开始 / Quick Start

### 本地运行 / Local Dev

```bash
npm install
npm start
# → http://localhost:3000
```

### 构建 / Build

```bash
npm run build
# CSS/JS 压缩 + SW 版本注入 → 输出到 dist/
# CSS/JS minification + SW version injection → output to dist/
```

---

## 部署 / Deploy

### GitHub Pages（自动 Auto）

push 到 `master` 分支后，GitHub Actions 自动执行 `build` → 部署 `dist/` 到 `gh-pages` 分支。
首次使用需在仓库 **Settings → Pages → Source** 选择 `gh-pages` 分支。

Push to `master` and GitHub Actions will automatically run `build` → deploy `dist/` to `gh-pages` branch.
For first-time setup, go to **Settings → Pages → Source** and select the `gh-pages` branch.

### Docker

```bash
# 构建并启动 Build and start
docker compose up --build
# → http://localhost:8080

# 或直接构建后运行 Or build and run directly
docker build -t k-toolkit .
docker run -p 8080:80 k-toolkit
```

### 静态托管 / Static Hosting

`dist/`（构建后）或 `public/`（开发）目录可直接部署：
Deploy `dist/` (after build) or `public/` (for dev) to any static host:

- GitHub Pages / Cloudflare Pages / Vercel / Netlify
- Nginx：`root` 指向 `dist/` — point `root` to `dist/`
- 任何 HTTP 静态文件服务器 Any HTTP static file server

---

## 项目结构 / Project Structure

```
k-toolkit/
├── public/                 # 源码 + 可直接部署 Source & directly deployable
│   ├── index.html          # 入口重定向 Entry redirect
│   ├── dashboard.html      # 主面板 Main dashboard
│   ├── dashboard.js        # 工具注册 + 路由 + 渲染 Tool registry + router + render
│   ├── dashboard-cmd.js    # 命令面板 Command palette (⌘K, lazy-loaded)
│   ├── i18n.js             # 双语支持 Bilingual (ID-keyed map)
│   ├── sw.js               # Service Worker (版本化缓存 versioned cache)
│   ├── dashboard-*.css     # 样式 Styles (base / components / themes)
│   ├── tools/              # 82 个工具独立 JS 82 individual tool JS files
│   └── agent/              # AI 智能体 AI Agent system
│       ├── agent-loader.js # 分组懒加载入口 Grouped lazy loader
│       ├── agent-core.js   # 会话引擎 Session engine
│       ├── agent-router.js # 页面上下文同步 Page context sync
│       ├── agent-ui*.js    # 聊天 UI Chat UI (panel + mini dialog)
│       ├── agent-autonomy.js # QA 提示 + 上下文 hints
│       ├── actions/        # 工具执行器 Tool executors (nav/text/dev/css/calc...)
│       └── adapters/       # 模型适配器 Model adapters (Claude/OpenAI/Gemini)
├── scripts/
│   └── build.js            # 构建 Build (CSS/JS minify + SW version inject)
├── dist/                   # 构建产物 Build output (gitignored)
├── .github/workflows/
│   └── deploy.yml          # CI/CD: build → gh-pages
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── server.js               # 本地开发服务器 Express dev server
└── package.json
```

---

## 贡献 / Contributing

欢迎提交 Issue 和 Pull Request。
Issues and Pull Requests are welcome.

1. Fork 本仓库 Fork this repo
2. 创建功能分支 Create a feature branch：`git checkout -b feat/your-tool`
3. 创建工具文件 Create tool file：`public/tools/your-tool.js`
4. 注册工具 Register tool：在 `dashboard.js` TOOLS + `i18n.js` TOOLS_EN 各加一条
5. 验证构建 Verify build：`npm run build`
6. 提交变更 Commit changes：`git commit -m 'feat: add your-tool'`
7. 发起 Pull Request Open a Pull Request

---

## License

[MIT](LICENSE) © YellowKang
