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

工作台统一导航；各子工具仍保留独立链接、收藏和输入界面，图片压缩、WebP 和 Base64 可通过“图片暂存”显式复用文件；其他工具的输入独立。目录由 `public/tool-catalog.js` 生成，工具数量、分类和处理方式见[完整目录](docs/tool-catalog.md)。

图片工具支持文件选择和拖放；图片压缩、Base64 转换及 WebP 转换在浏览器内处理。工具卡片会标注本地处理、联网、可选联网或 AI 模型调用。

## AI 助手与数据

`Alt+A` 打开助手，`Cmd/Ctrl+J` 打开迷你对话框。支持配置 Claude、OpenAI、Gemini 适配器；实际连接取决于模型服务、接口配置及浏览器 CORS 限制。

- 本地计算工具在浏览器执行；第三方库（二维码、YAML、TOML）以固定版本放在 `public/vendor/`，随站点校验和缓存，离线可用。
- 网络工具向相应服务发送请求；AI 助手会把对话、页面上下文和工具结果发送到配置的模型接口。
- 收藏、偏好和部分工具内容保存在浏览器。当前 API Key 配置使用浏览器存储，不应在共享设备上保存长期密钥，也不要把密钥写入仓库。
- GitHub Pages 提供静态站点。需要隐藏服务端密钥或统一鉴权时，应单独配置后端代理。

工具脚本按需加载，同一页面会话内只执行一次。Agent 对工具参数做校验，按顺序执行操作，支持任务取消、工具超时和迭代上限。取消会阻止后续步骤；已完成的页面操作不会被撤销，执行中的工具需要配合取消信号才能中止。

无需模型也能串联工具：打开助手点“本地工作流”，或输入 `/workflows` 查看模板。支持 Base64 解码后格式化 JSON、行清洗后编码、JSON 压缩后 SHA-256。自然语言模式可用 `run_workflow` 引用前一步结果，失败即停止；新增 JSON 字段提取、行清洗和 HMAC 调用。详见[工作流使用与后续规划](docs/agent-workflows.md)。

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

`npm test` 检查 Agent 行为、工具目录、构建、CSS、缓存版本、第三方库摘要，以及财务大写、农历、Cron、CSV、单位换算等工具的计算结果。浏览器回归检查图片选择/处理/下载、分类、工作台、旧链接、收藏、脚本重复加载、SVG 预览隔离、Agent 工作流、版本更新，并对全部工具做 XSS 注入检查（用户输入、本地存储记录、DNS/IP 接口返回、Markdown 原始 HTML）。测试自动启动本地服务，生成测试图片，不连接模型服务。

可用 `TEST_BROWSER_CHANNEL=chrome` 使用已安装的 Chrome。375px / 768px 检查是桌面浏览器视口模拟，不代替手机真机测试。

构建结果在 `dist/`。PR 执行 Chromium 与 Firefox 检查；`master` 推送通过检查后使用 GitHub 官方 Pages artifact 工作流部署。仓库 **Settings → Pages → Build and deployment → Source** 必须设置为 **GitHub Actions**，并允许 `github-pages` 环境从 `master` 部署。代码未推送、工作流未成功执行或仓库设置未完成时，线上不会更新。见 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 版本更新与刷新

顶部 **↻** 打开版本面板，可查看当前/线上版本、手动检查和刷新。有新版本时按钮出现提示点；只有完整下载并校验成功后才允许“更新并刷新”。不会自动刷新正在工作的页面。

页面打开、恢复联网时自动检查；返回前台时检查有一分钟节流，前台每五分钟检查一次。版本来自构建内容哈希，无需手动改版本号。GitHub 构建、部署和 CDN 传播存在延迟，不保证推送后即时可用。

刷新会结束任务、清除未保存输入、图片暂存和未下载结果；收藏及设置保留。图片暂存仅在当前标签页内存中，最多 20 张、共 100 MB，可把处理结果继续暂存复用。

首次成功安装会缓存站点自有静态文件，工具代码仍按需执行。缓存按项目路径隔离，并保留当前及前两个版本；其他打开的标签页不会被强制刷新。模型服务与网络类工具仍需要网络。从旧机制首次迁移时，若仍显示旧页面，请关闭此站点的所有标签页后重新打开，让等待中的新 Worker 接管；之后即可使用新的更新按钮。直接运行 `public/` 显示开发版；完整更新测试需 `npm run build` 后托管 `dist/`。

`npm run test:updates` 使用真实 Service Worker 模拟三个发布版本，验证手动更新、多标签页、离线、缺失/错版资源与缓存隔离。

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
  tool-compute.js     页面与 Agent 共享的文本/日期计算与按需加载器
  dashboard.js        路由、导航和页面渲染
  i18n.js             双语标签
  tools/             按需加载的工具
  compute/           页面与 Agent 共用的计算模块（Cron、CSV、农历、YAML/TOML/XML、.env）
  vendor/            固定版本的第三方库及许可证、摘要清单
  agent/             会话、适配器、动作、界面
scripts/             构建与目录文档生成
tests/               单元测试与浏览器回归
docs/                工具目录与架构说明
```

新增工具时，在 `public/tools/` 实现界面（文案用 `makeToolI18n` 提供中英文），在 `public/tool-catalog.js` 注册元数据，并在 `public/i18n.js` 添加英文标签。使用独立作用域隔离工具内部状态，提供页面离开时的清理逻辑。页面与 Agent 都要用的计算逻辑放进 `public/compute/`，通过 `ToolCompute.load()` 按需加载；第三方库放进 `public/vendor/` 并更新 `manifest.json` 摘要，不从 CDN 加载。用户输入、存储记录和网络返回一律经 `escHtml` 或 `textContent` 输出，不拼进内联事件。需要 Agent 调用时，在 `public/agent/` 注册相应能力和参数约束。

修改目录后运行 `npm run docs:catalog`，提交生成的目录文档，并运行相关测试。修改分类或入口时保留现有工具 ID，避免破坏历史链接和收藏。

## English

K Toolkit is a static developer toolbox with an AI assistant, bilingual UI, themes, search, favorites and recent tools. [Try it online](https://yellowkang.github.io/k-toolkit/).

Ten categories organize the tools. Five workbenches group image compression/conversion, hashes/HMAC, QR generation/decoding, time zones/world clocks and HTTP tools. Existing child URLs and favorites remain valid; compression, WebP and Base64 can explicitly reuse files staged in the current tab’s memory. See the generated [tool catalog](docs/tool-catalog.md) for the current inventory.

Local tools process inputs in the browser. Network tools contact external services, and AI requests send conversation context and tool results to the configured model provider. Third-party libraries (QR, YAML, TOML) are pinned under `public/vendor/` and cached with the site, so they work offline. API keys are currently stored in browser storage; a separate backend is needed to keep service credentials off the client.

Use `/workflows` in the assistant for local templates that require no model or API key. Typed result references chain validated actions, stop on errors, and keep intermediate data in the browser. See [workflow usage and roadmap](docs/agent-workflows.md).

Use Node.js 20.13+ and `npm ci`, then `npm run dev`. Run `npm test` for unit/build/catalog checks. Install Playwright browsers with `npx playwright install chromium firefox`, then run `TEST_BUILD=1 npm run test:browser`; set `TEST_BROWSER=firefox` for Firefox. The browser suite includes an XSS fuzz pass over every tool. `npm run build` writes the static site to `dist/`.

Pull requests run Chromium and Firefox checks. Successful pushes to `master` deploy through the official Pages artifact workflow. Set the repository’s Pages Source to **GitHub Actions**. The ↻ button checks for updates and refreshes only when requested; deployment/CDN propagation is not instantaneous. To host locally with Docker, run `docker compose up -d --build` and open port 8080.

## License

[MIT](LICENSE) © YellowKang
