# K Toolkit

> 开发者工具箱 —— 82 个精选工具 + AI 智能体助手，纯静态，无需登录，开箱即用。
> A developer toolbox — 82 curated tools + AI Agent assistant, pure static, no login required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yellowkang.github.io/k-toolkit/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](#docker)

K Toolkit 是一个面向开发者的在线工具集合，涵盖文本处理、开发工具、CSS、图片、编码加密、计算、时间、效率、网络、趣味等 10 大分类共 82 个工具。
内置 AI 智能体助手（Alt+A 唤起），支持自然语言驱动工具执行。
所有工具均运行在浏览器本地，无需服务器，无需登录，数据不离开你的设备。

K Toolkit is an online toolbox for developers, covering 82 tools across 10 categories including text processing, dev tools, CSS, image, encoding, calculation, time, productivity, network, and fun.
Built-in AI Agent assistant (Alt+A to open) supports natural language tool execution.
All tools run locally in the browser — no server, no login, your data never leaves your device.

**在线体验 / Live Demo：[https://yellowkang.github.io/k-toolkit/](https://yellowkang.github.io/k-toolkit/)**

## 工具列表 / Tools

| 分类 | 工具 |
|------|------|
| 文本处理 (14) | UUID、JSON 格式化、Base64、字数统计、正则测试（15 个模板）、JSON/CSV 互转、文本对比、Markdown 预览、大小写转换、Unicode、HTML 实体、占位文本、文本转义、JSON 对比、TOML/JSON、行排序去重、Slug 生成 |
| 开发工具 (15) | 时间戳、URL 工具箱、哈希生成器、JWT 工具、进制转换、YAML/JSON、SQL 格式化、cURL 生成器（含 import 反解析）、HTTP 状态码、Cron 表达式、密码生成器（HIBP 泄露检测 + Diceware）、ENV 解析器、Dockerfile 生成、Nginx 配置生成、Git Commit、Semver、DNS 查询、终端颜色码 |
| CSS 工具 (7) | 渐变生成器（20 预设 + 动画 + Tailwind）、颜色工具（拾色/转换/对比度三合一）、阴影生成器、Flexbox、SVG 预览、调色板生成器、Clip-path、CSS 单位转换 |
| 图片工具 (5) | 图片 Base64、图片压缩、二维码生成（圆点/圆角样式 + Logo 嵌入）、二维码解析、图片转 WebP、EXIF 查看器 |
| 编码加密 (3) | AES 加解密、摩斯电码、XML 格式化 |
| 计算工具 (6) | 科学计算器、单位换算（含数字格式化）、贷款计算器、存储换算、数字大写、IP 子网计算、比例计算、年龄计算器、个税计算器 |
| 时间工具 (4) | 日期差计算、时区转换、倒计时、世界时钟、农历查询 |
| 效率工具 (7) | 番茄钟、会议费用、随机抽签（Canvas 转盘动画）、秒表计时、文本模板（支持批量 JSON）、Todo 清单、临时便签、打字速度测试（句子/单词/代码模式 + 统计图表） |
| 网络工具 (4) | UA 解析、HTTP 请求测试、IP 信息、网速测试 |
| 趣味工具 (3) | ASCII 艺术字、Emoji 选择器、白噪音、矩阵雨 |

## 特性 / Features

- **AI 智能体** — `Alt+A` 唤起 AI 助手，自然语言驱动工具执行，支持多模型（Claude/OpenAI/Gemini）
- **中/英双语** — 点击 topbar EN/ZH 按钮即可切换
- **全局搜索** — `/` 或 `⌘K` 呼出，支持拼音/英文/标签搜索
- **多主题** — 暗夜黑 / 纯白 / 科技蓝 / 樱花粉 / 商务橙 / 清新绿
- **懒加载** — 工具 JS 按需加载，首屏极速
- **收藏 & 最近** — 收藏常用工具，自动记录使用历史，持久化到 localStorage
- **离线可用** — Service Worker 缓存，断网也能使用
- **移动适配** — 响应式布局 + 底部导航栏

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
# 输出到 dist/
```

## 部署 / Deploy

### GitHub Pages（自动）

push 到 `master` 分支后，GitHub Actions 自动构建并部署到 GitHub Pages。
首次使用需在仓库 **Settings → Pages → Source** 选择 `gh-pages` 分支。

### Docker

```bash
# 构建并启动
docker compose up --build
# → http://localhost:8080

# 或直接拉取后运行
docker build -t k-toolkit .
docker run -p 8080:80 k-toolkit
```

### 静态托管 / Static Hosting

`public/` 目录是纯静态文件，可直接部署到任何静态托管服务：

- GitHub Pages / Cloudflare Pages / Vercel / Netlify
- Nginx：`root` 指向 `public/` 或 `dist/`
- 任何 HTTP 静态文件服务器

## 项目结构 / Structure

```
k-toolkit/
├── public/                 # 静态资源（可直接部署）
│   ├── index.html          # 入口重定向
│   ├── dashboard.html      # 主面板
│   ├── dashboard.js        # 工具列表 + 主逻辑
│   ├── dashboard-cmd.js    # 命令面板（⌘K）
│   ├── i18n.js             # 中/英双语支持
│   ├── sw.js               # Service Worker（离线缓存）
│   ├── dashboard-*.css     # 样式（基础/组件/主题）
│   ├── tools/              # 各工具独立 JS 文件
│   └── agent/              # AI 智能体模块
│       ├── agent-core.js   # Agent 会话核心
│       ├── agent-router.js # 页面上下文同步
│       ├── agent-ui*.js    # 聊天 UI
│       ├── actions/        # 工具执行器（nav/text/dev/css/calc...）
│       └── adapters/       # 模型适配器（Claude/OpenAI/Gemini）
├── scripts/
│   └── build.js            # 构建脚本（CSS 压缩 + 文件复制）
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions 自动部署
├── Dockerfile
├── nginx.conf
├── docker-compose.yml
├── server.js               # 本地开发服务器
└── package.json
```

## 贡献 / Contributing

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-tool`
3. 提交变更：`git commit -m 'feat: add your-tool'`
4. 推送分支：`git push origin feat/your-tool`
5. 发起 Pull Request

## License

[MIT](LICENSE) © YellowKang
