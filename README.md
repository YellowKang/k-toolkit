# K Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yellowkang.github.io/k-toolkit/)

面向人的在线开发者工具箱，内置 AI 助手。支持静态部署、中文/英文界面、主题、搜索、收藏和最近使用。

[在线体验](https://yellowkang.github.io/k-toolkit/) · [完整工具目录](docs/tool-catalog.md) · [架构与演进](docs/architecture.md) · [English](#english)

## 工具与工作台

工具按文本处理、数据格式、开发工具、编码加密、图片工具、CSS 与设计、网络工具、时间效率、计算工具、趣味工具归类。AI 助手提供独立入口。

相关功能合并为五组工作台入口：

| 工作台 | 包含能力 |
| --- | --- |
| 图片压缩与转换 | 图片压缩、批量 WebP 转换 |
| 哈希与 HMAC | 哈希计算、带密钥的消息认证码 |
| 二维码工具 | 生成、图片解码 |
| 时区与世界时钟 | 时区转换、多个地区时钟 |
| HTTP 请求工具 | 请求测试、cURL 生成、状态码查询 |

工作台统一导航；各子工具仍保留独立链接、收藏和输入界面，暂不跨页共享输入。目录由 `public/tool-catalog.js` 生成，工具数量、分类和处理方式见[完整目录](docs/tool-catalog.md)。

图片工具支持文件选择和拖放；图片压缩、Base64 转换及 WebP 转换在浏览器内处理。工具卡片会标注本地处理、联网、可选联网或 AI 模型调用。

## AI 助手与数据

`Alt+A` 打开助手，`Cmd/Ctrl+J` 打开迷你对话框。支持配置 Claude、OpenAI、Gemini 适配器；实际连接取决于模型服务、接口配置及浏览器 CORS 限制。

- 本地计算工具在浏览器执行；部分依赖库可能从 CDN 加载，离线能力取决于已缓存的资源。
- 网络工具向相应服务发送请求；AI 助手会把对话、页面上下文和工具结果发送到配置的模型接口。
- 收藏、偏好和部分工具内容保存在浏览器。当前 API Key 配置使用浏览器存储，不应在共享设备上保存长期密钥，也不要把密钥写入仓库。
- GitHub Pages 提供静态站点。需要隐藏服务端密钥或统一鉴权时，应单独配置后端代理。

工具脚本按需加载，同一页面会话内只执行一次。Agent 对工具参数做校验，按顺序执行操作，支持任务取消、工具超时和迭代上限。取消会阻止后续步骤；已完成的页面操作不会被撤销，执行中的工具需要配合取消信号才能中止。

## 本地开发与验证

开发和测试使用 Node.js 20.13 或更新版本，CI 使用 Node.js 24。开发服务使用 Node.js 自带的文件监听。

```bash
npm ci
npm run dev
# http://localhost:3000

npm test
npx playwright install chromium firefox
TEST_BUILD=1 npm run test:browser
TEST_BROWSER=firefox TEST_BUILD=1 npm run test:browser
npm run build
```

`npm test` 检查 Agent 行为、工具目录、构建、CSS 和缓存版本。浏览器回归检查图片选择/处理/下载、分类、工作台、旧链接、收藏、脚本重复加载和 SVG 预览隔离。测试自动启动本地服务，生成测试图片，不连接模型服务。

可用 `TEST_BROWSER_CHANNEL=chrome` 使用已安装的 Chrome。375px / 768px 检查是桌面浏览器视口模拟，不代替手机真机测试。

构建结果在 `dist/`。PR 执行 Chromium 与 Firefox 检查；`master` 推送通过检查后发布到 `gh-pages` 分支。GitHub Pages 应配置为从该分支发布。

## Docker

```bash
docker compose up -d --build
# http://localhost:8080
```

Docker 使用 Nginx 提供构建后的静态文件。

## 项目结构与贡献

```text
public/
  tool-catalog.js     工具元数据、分类和工作台
  dashboard.js        路由、导航和页面渲染
  i18n.js             双语标签
  tools/             按需加载的工具
  agent/             会话、适配器、动作、界面
scripts/             构建与目录文档生成
tests/               单元测试与浏览器回归
docs/                工具目录与架构说明
```

新增工具时，在 `public/tools/` 实现界面，在 `public/tool-catalog.js` 注册元数据，并在 `public/i18n.js` 添加英文标签。使用独立作用域隔离工具内部状态，提供页面离开时的清理逻辑。需要 Agent 调用时，在 `public/agent/` 注册相应能力和参数约束。

修改目录后运行 `npm run docs:catalog`，提交生成的目录文档，并运行相关测试。修改分类或入口时保留现有工具 ID，避免破坏历史链接和收藏。

## English

K Toolkit is a static developer toolbox with an AI assistant, bilingual UI, themes, search, favorites and recent tools. [Try it online](https://yellowkang.github.io/k-toolkit/).

Ten categories organize the tools. Five workbenches group image compression/conversion, hashes/HMAC, QR generation/decoding, time zones/world clocks and HTTP tools. Existing child URLs and favorites remain valid; inputs are not yet shared between child pages. See the generated [tool catalog](docs/tool-catalog.md) for the current inventory.

Local tools process inputs in the browser. Network tools contact external services, and AI requests send conversation context and tool results to the configured model provider. Some libraries load from CDNs. API keys are currently stored in browser storage; a separate backend is needed to keep service credentials off the client.

Use Node.js 20.13+ and `npm ci`, then `npm run dev`. Run `npm test` for unit/build/catalog checks. Install Playwright browsers with `npx playwright install chromium firefox`, then run `TEST_BUILD=1 npm run test:browser`; set `TEST_BROWSER=firefox` for Firefox. `npm run build` writes the static site to `dist/`.

Pull requests run Chromium and Firefox checks. Successful pushes to `master` publish to the `gh-pages` branch. To host locally with Docker, run `docker compose up -d --build` and open port 8080.

## License

[MIT](LICENSE) © YellowKang
