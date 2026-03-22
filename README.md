# K-Toolkit

> 开发者工具箱 —— 92 个常用工具，纯静态，无需登录，开箱即用。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 工具列表

| 分类 | 工具 |
|------|------|
| 编码 / 加密 | Base64、AES、Hash、JWT、URL 编码、HTML Entity、Unicode、文本转义 |
| 格式化 | JSON、XML、YAML⇄JSON、TOML⇄JSON、SQL、Markdown、文本 Diff |
| 颜色 / 设计 | 颜色转换、调色板生成、渐变生成器、色彩对比度、CSS 阴影、Clip-path |
| 图片 | Base64 互转、图片压缩、WebP 转换、EXIF 查看、噪声生成 |
| 网络 | IP 计算器、IP 信息、DNS 查询、HTTP 状态码、HTTP 测试、速度测试 |
| 时间 / 日期 | 时间戳、时区转换、日期差值、倒计时、世界时钟、农历日历 |
| 生成器 | UUID、密码、二维码、QR 解码、Lorem Ipsum、Slug、Nginx 配置、Docker 命令、Curl 命令、Git Commit |
| 计算 | 单位换算、字节换算、BMI、贷款、税率、百分比、宽高比 |
| 文本 | 大小写转换、字数统计、行排序、文本重复、文本模板、Morse 码 |
| 开发 | Cron 表达式、Regex 测试、Flexbox 演示、SVG 预览、终端色彩、Semver |
| 效率 | 番茄钟、秒表、记事本、Todo、打字游戏、会议成本、Emoji 选择器、ASCII Art |

## 快速开始

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm start
```

### 构建

```bash
# 构建到 dist/ 目录（CSS 压缩）
npm run build
```

### 静态部署

`public/` 目录是纯静态文件，可直接部署到：
- GitHub Pages
- Cloudflare Pages
- Nginx（`root` 指向 `public/`）
- 任何静态托管服务

## 项目结构

```
k-toolkit/
├── public/          # 静态资源（直接部署此目录）
│   ├── index.html   # 入口重定向
│   ├── dashboard.html  # 主面板
│   ├── tools/       # 各工具 JS 文件
│   └── sw.js        # Service Worker
├── scripts/
│   └── build.js     # 构建脚本
├── server.js        # 本地开发服务器
├── .env.example     # 环境变量示例
└── package.json
```

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feat/your-tool`
3. 提交变更：`git commit -m 'feat: add your-tool'`
4. 推送分支：`git push origin feat/your-tool`
5. 发起 Pull Request

## License

[MIT](LICENSE) © YellowKang
