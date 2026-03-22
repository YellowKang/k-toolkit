# K Toolkit

> 开发者工具箱 —— 92 个常用工具，纯静态，无需登录，开箱即用。
> A developer toolbox — 92 tools, pure static, no login required.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yellowkang.github.io/k-toolkit/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](#docker)

## 工具列表 / Tools

| 分类 | 工具 |
|------|------|
| 文本处理 | Base64、JSON 格式化、字数统计、正则测试、JSON/CSV 互转、Markdown、文本 Diff、大小写转换、Unicode、文本转义 |
| 编码加密 | AES、Hash（MD5/SHA）、JWT、URL 编码、HTML Entity |
| CSS 工具 | 颜色转换、调色板、渐变生成器、色彩对比度、CSS 阴影、Clip-path |
| 图片工具 | Base64 互转、图片压缩、WebP 转换、EXIF 查看、噪声生成 |
| 网络工具 | IP 计算器、IP 信息、DNS 查询、HTTP 状态码、HTTP 测试、速度测试 |
| 时间工具 | 时间戳、时区转换、日期差值、倒计时、世界时钟、农历日历 |
| 开发工具 | UUID、密码生成、二维码、QR 解码、Cron、Regex、Flexbox、SVG、Semver、Nginx 配置、Docker 命令、Git Commit |
| 计算工具 | 单位换算、字节换算、BMI、贷款、税率、百分比、宽高比 |
| 效率工具 | 番茄钟、秒表、记事本、Todo、打字游戏、会议成本、Emoji 选择器、ASCII Art |
| 趣味工具 | Lorem Ipsum、Slug、Morse 码、终端色彩 |

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
│   ├── dashboard.js        # 主逻辑
│   ├── dashboard-cmd.js    # 命令面板
│   ├── i18n.js             # 中/英双语支持
│   ├── sw.js               # Service Worker（离线缓存）
│   ├── dashboard-base.css
│   ├── dashboard-components.css
│   ├── dashboard-theme.css
│   └── tools/              # 各工具独立 JS 文件
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

## 特性 / Features

- 🌐 中/英双语切换，点击 topbar EN/ZH 按钮即可切换
- ⚡ 工具懒加载，按需加载 JS，首屏极速
- 🔍 全局搜索（`/` 或 `⌘K`），支持拼音/英文搜索
- ⭐ 收藏 + 最近使用，持久化到 localStorage
- 🎨 多主题切换（暗夜/浅色/科技蓝/樱花粉等）
- 📱 移动端适配，底部导航栏
- 🔌 离线可用（Service Worker 缓存）

## 贡献 / Contributing

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-tool`
3. 提交变更：`git commit -m 'feat: add your-tool'`
4. 推送分支：`git push origin feat/your-tool`
5. 发起 Pull Request

## License

[MIT](LICENSE) © YellowKang
