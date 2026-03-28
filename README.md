# K Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yellowkang.github.io/k-toolkit/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](#docker-%E9%83%A8%E7%BD%B2)

**语言 / Language：** [中文](#中文) | [English](#english)

---

<a name="中文"></a>

# 中文

> 开发者工具箱 —— 82 个精选工具 + AI 智能体助手，纯静态，无需登录，开箱即用。

**在线体验：[https://yellowkang.github.io/k-toolkit/](https://yellowkang.github.io/k-toolkit/)**

## 简介

K Toolkit 是一个面向开发者的在线工具集合，涵盖文本处理、开发工具、CSS、图片、编码加密、计算、时间、效率、网络、趣味等 10 大分类共 82 个工具。
内置 AI 智能体助手（`Alt+A` 唤起），支持自然语言驱动工具执行。
所有工具均运行在浏览器本地，无需服务器，无需登录，数据不离开你的设备。

## 工具列表

| 分类 | 工具 |
|------|------|
| 文本处理 (14) | UUID、JSON 格式化、Base64、字数统计、正则测试（15 个模板）、JSON/CSV 互转、文本对比、Markdown 预览、大小写转换、Unicode、HTML 实体、占位文本、文本转义、JSON 对比、TOML/JSON、行排序去重、Slug 生成 |
| 开发工具 (15) | 时间戳、URL 工具箱、哈希生成器、JWT 工具、颜色选择器、二维码生成、二维码解码、URL 编解码、HTML 实体编解码、Cron 表达式、IP 信息、端口查询、代码格式化、Env 解析、Dockerfile 生成、Nginx 配置生成、Git Commit 生成、Semver、DNS 查询、终端颜色 |
| CSS 工具 (8) | 渐变生成、颜色工具、Box Shadow、Flexbox、SVG 预览、调色板生成、Clip-path、CSS 单位转换 |
| 图片工具 (7) | 图片 Base64、图片压缩、二维码、二维码解码、图片转 WebP、EXIF 查看、Favicon 生成 |
| 编码加密 (10) | MD5、SHA 系列、AES、RSA、Base64、URL 编码、二进制/十六进制、摩斯电码、凯撒密码、HMAC |
| 计算工具 (6) | 科学计算器、进制转换、汇率换算、单位换算、BMI 计算、贷款计算 |
| 时间工具 (5) | 时间戳、日期计算、时区转换、Cron、倒计时 |
| 效率工具 (8) | 待办事项、番茄钟、笔记本、密码生成、随机数、颜色选择器、打字速度测试、AI 对话 |
| 网络工具 (4) | UA 解析、HTTP 请求测试、IP 信息、网速测试 |
| 趣味工具 (4) | ASCII 艺术字、Emoji 选择器、白噪音、矩阵雨 |

## 特性

- **AI 智能体** — `Alt+A` 唤起完整面板，`Cmd/Ctrl+J` 打开迷你对话框，支持 Claude / OpenAI / Gemini
- **中/英双语** — topbar 点击 EN/ZH 即可切换，工具列表/分类/搜索全覆盖
- **全局搜索** — `/` 或 `⌘K` 呼出，支持拼音/英文/标签搜索，保留历史记录
- **多主题** — 暗夜黑 / 纯白 / 科技蓝 / 樱花粉 / 商务橙 / 清新绿
- **懒加载** — 工具 JS 按需加载 + LRU 淘汰（最多缓存 30 个），首屏极速
- **收藏 & 最近** — 收藏常用工具，自动记录使用历史和热门排行，持久化到 localStorage
- **离线可用** — Service Worker 分层缓存（Shell Cache First + 工具 Stale-While-Revalidate）
- **移动适配** — 响应式布局 + 底部导航栏 + 可拖拽 AI 按钮

## 本地运行

```bash
npm install
npm run dev
# 访问 http://localhost:3000
```

## Docker 部署

```bash
# Docker 直接运行
docker run -d -p 8080:80 --name k-toolkit yellowkang/k-toolkit

# 或 docker-compose
docker-compose up -d
```

访问 `http://localhost:8080`

## 项目结构

```
k-toolkit/
├── public/
│   ├── dashboard.html          # 入口页
│   ├── dashboard.js            # 工具注册表 + 路由 + 渲染
│   ├── i18n.js                 # 中英双语 key-map
│   ├── dashboard-base.css      # 基础样式
│   ├── dashboard-components.css # 组件样式
│   ├── dashboard-theme.css     # 主题变量
│   ├── tools/                  # 各工具 JS（按需懒加载）
│   │   ├── ai-chat.js
│   │   ├── json-format.js
│   │   └── ...（共 82 个）
│   └── agent/                  # AI 智能体模块
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
└── package.json
```

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-tool`
3. 创建工具文件：`public/tools/your-tool.js`
4. 注册工具：在 `dashboard.js` TOOLS + `i18n.js` TOOLS_EN 各加一条
5. 验证构建：`npm run build`
6. 提交并发起 Pull Request

## License

[MIT](LICENSE) © YellowKang

---

<a name="english"></a>

# English

> A developer toolbox — 82 curated tools + AI Agent assistant, pure static, no login required.

**Live Demo: [https://yellowkang.github.io/k-toolkit/](https://yellowkang.github.io/k-toolkit/)**

## Introduction

K Toolkit is an online toolbox for developers, covering 82 tools across 10 categories: text processing, dev tools, CSS, image, encoding & crypto, calculation, time, productivity, network, and fun.
Built-in AI Agent assistant (`Alt+A` to open) supports natural language tool execution.
All tools run locally in the browser — no server, no login, your data never leaves your device.

## Tools

| Category | Tools |
|------|------|
| Text (14) | UUID, JSON Formatter, Base64, Word Count, Regex Tester (15 templates), JSON↔CSV, Text Diff, Markdown Preview, Case Convert, Unicode, HTML Entity, Lorem Ipsum, Text Escape, JSON Diff, TOML/JSON, Line Sort & Dedup, Slug Generator |
| Dev Tools (15) | Timestamp, URL Toolkit, Hash Generator, JWT Tool, Color Picker, QR Code, QR Decode, URL Encode/Decode, HTML Entity, Cron, IP Info, Port Lookup, Code Formatter, Env Parser, Dockerfile Gen, Nginx Config, Git Commit, Semver, DNS Lookup, Terminal Color |
| CSS Tools (8) | Gradient, Color Tool, Box Shadow, Flexbox, SVG Preview, Palette Generator, Clip-path, CSS Unit Convert |
| Image (7) | Image Base64, Image Compress, QR Code, QR Decode, Image to WebP, EXIF Viewer, Favicon Generator |
| Crypto (10) | MD5, SHA, AES, RSA, Base64, URL Encode, Binary/Hex, Morse Code, Caesar Cipher, HMAC |
| Calculator (6) | Scientific Calculator, Base Convert, Currency, Unit Convert, BMI, Loan |
| Time (5) | Timestamp, Date Calc, Timezone, Cron, Countdown |
| Productivity (8) | Todo, Pomodoro, Notepad, Password Gen, Random, Color Picker, Typing Speed, AI Chat |
| Network (4) | UA Parser, HTTP Tester, IP Info, Speed Test |
| Fun (4) | ASCII Art, Emoji Picker, White Noise, Matrix Rain |

## Features

- **AI Agent** — `Alt+A` for full panel, `Cmd/Ctrl+J` for mini dialog, supports Claude / OpenAI / Gemini
- **Bilingual** — Switch EN/ZH via topbar button, covers tool names, categories, and search
- **Global Search** — Press `/` or `⌘K`, supports pinyin / English / tag search with history
- **Themes** — Dark / Light / Tech Blue / Sakura Pink / Business Orange / Fresh Green
- **Lazy Loading** — Tool JS loaded on demand with LRU eviction (max 30 cached), instant first paint
- **Favorites & History** — Bookmark tools, auto-track usage history and popular tools, persisted in localStorage
- **Offline Ready** — Service Worker with layered caching (Shell Cache First + Tool Stale-While-Revalidate)
- **Mobile Friendly** — Responsive layout + bottom nav bar + draggable AI FAB button

## Local Development

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Docker

```bash
# Run directly
docker run -d -p 8080:80 --name k-toolkit yellowkang/k-toolkit

# Or with docker-compose
docker-compose up -d
```

Visit `http://localhost:8080`

## Project Structure

```
k-toolkit/
├── public/
│   ├── dashboard.html          # Entry page
│   ├── dashboard.js            # Tool registry + router + renderer
│   ├── i18n.js                 # Bilingual key-map
│   ├── dashboard-base.css      # Base styles
│   ├── dashboard-components.css # Component styles
│   ├── dashboard-theme.css     # Theme variables
│   ├── tools/                  # Tool JS files (lazy-loaded)
│   │   └── ...（82 tools total）
│   └── agent/                  # AI Agent module
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
└── package.json
```

## Contributing

Issues and Pull Requests are welcome.

1. Fork this repo
2. Create a feature branch: `git checkout -b feat/your-tool`
3. Create tool file: `public/tools/your-tool.js`
4. Register tool: add entry in `dashboard.js` TOOLS + `i18n.js` TOOLS_EN
5. Verify build: `npm run build`
6. Commit and open a Pull Request

## License

[MIT](LICENSE) © YellowKang

## 本地运行

```bash
npm install
npm run dev      # 启动开发服务器 http://localhost:3000
npm run build    # 构建到 dist/
```

## Docker 部署

```bash
# 直接运行
docker run -d -p 80:80 --name k-toolkit yellowkang/k-toolkit

# 或使用 docker-compose
docker-compose up -d
```

## 项目结构

```
public/
├── dashboard.html          # 入口
├── dashboard.js            # 核心：工具注册表 + 路由 + 渲染
├── i18n.js                 # 双语支持
├── dashboard-base.css      # 基础样式
├── dashboard-components.css
├── dashboard-theme.css
├── tools/                  # 各工具 JS（按需加载）
└── agent/                  # AI Agent 模块
```

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-tool`
3. 创建工具文件：`public/tools/your-tool.js`
4. 注册工具：在 `dashboard.js` TOOLS 和 `i18n.js` TOOLS_EN 各加一条
5. 验证构建：`npm run build`
6. 提交 Pull Request

## License

[MIT](LICENSE) © YellowKang

---

<a name="english"></a>

# English

> A developer toolbox — 82 curated tools + AI Agent assistant, pure static, no login required.

**Live Demo: [https://yellowkang.github.io/k-toolkit/](https://yellowkang.github.io/k-toolkit/)**

## Introduction

K Toolkit is an online toolbox for developers, covering 82 tools across 10 categories: text processing, dev tools, CSS, image, encoding & crypto, calculation, time, productivity, network, and fun.
Built-in AI Agent assistant (`Alt+A` to open) supports natural language tool execution.
All tools run locally in the browser — no server, no login, your data never leaves your device.

## Tools

| Category | Tools |
|----------|-------|
| Text (14) | UUID, JSON Formatter, Base64, Word Count, Regex Tester (15 templates), JSON↔CSV, Text Diff, Markdown Preview, Case Convert, Unicode, HTML Entity, Lorem Ipsum, Text Escape, JSON Diff, TOML/JSON, Line Sort & Dedup, Slug Generator |
| Dev Tools (15) | Timestamp, URL Toolkit, Hash Generator, JWT Tool, Color Picker, QR Code, QR Decode, URL Encode/Decode, HTML Entity, Cron, IP Info, Port Lookup, Code Formatter, Env Parser, Dockerfile Gen, Nginx Config, Git Commit, Semver, DNS Lookup, Terminal Color |
| CSS Tools (8) | Gradient, Color Tool, Box Shadow, Flexbox, SVG Preview, Palette Generator, Clip-path, CSS Unit Convert |
| Image (7) | Image Base64, Image Compress, QR Code, QR Decode, Image to WebP, EXIF Viewer, Favicon Generator |
| Crypto (10) | MD5, SHA series, AES, RSA, Base64, URL Encode, Bin/Hex, Morse Code, Caesar Cipher, HMAC |
| Calculator (6) | Scientific Calculator, Base Convert, Currency, Unit Convert, BMI, Loan |
| Time (5) | Timestamp, Date Calc, Timezone, Cron, Countdown |
| Productivity (8) | Todo, Pomodoro, Notepad, Password Gen, Random, Color Picker, Typing Speed, AI Chat |
| Network (4) | UA Parser, HTTP Tester, IP Info, Speed Test |
| Fun (4) | ASCII Art, Emoji Picker, White Noise, Matrix Rain |

## Features

- **AI Agent** — `Alt+A` for full panel, `Cmd/Ctrl+J` for mini dialog, supports Claude / OpenAI / Gemini
- **Bilingual** — Switch EN/ZH via topbar button, covers tool names, categories, and search
- **Global Search** — Press `/` or `⌘K`, supports pinyin / English / tag search with history
- **Themes** — Dark / Light / Tech Blue / Sakura / Orange / Green
- **Lazy Loading** — Tools loaded on demand with LRU eviction (max 30 cached)
- **Favorites & History** — Bookmark tools, auto-track usage history, persisted in localStorage
- **Offline Ready** — Service Worker with Shell Cache First + Tool Stale-While-Revalidate
- **Mobile Friendly** — Responsive layout + bottom nav + draggable AI FAB

## Getting Started

```bash
npm install
npm run dev      # Dev server at http://localhost:3000
npm run build    # Build to dist/
```

## Docker

```bash
docker run -d -p 80:80 --name k-toolkit yellowkang/k-toolkit

# or
docker-compose up -d
```

## Contributing

Issues and Pull Requests are welcome.

1. Fork this repo
2. Create a feature branch: `git checkout -b feat/your-tool`
3. Create tool file: `public/tools/your-tool.js`
4. Register tool: add entry in `dashboard.js` TOOLS and `i18n.js` TOOLS_EN
5. Verify: `npm run build`
6. Open a Pull Request

## License

[MIT](LICENSE) © YellowKang
