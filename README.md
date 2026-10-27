# K Toolkit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://yellowkang.github.io/k-toolkit/)

面向人的在线开发者工具箱，内置 AI 助手。支持静态部署、中文/英文界面、主题、搜索、收藏和最近使用。

[在线体验](https://yellowkang.github.io/k-toolkit/) · [完整工具目录](docs/tool-catalog.md) · [架构与演进](docs/architecture.md) · [English](#english)

## 工具与工作台

工具按文本处理、数据格式、开发工具、编码加密、图片工具、CSS 与设计、网络工具、时间效率、计算工具、趣味工具归类。AI 助手提供独立入口。

相关功能合并为九组工作台入口：

| 工作台 | 包含能力 |
| --- | --- |
| 图片压缩与转换 | 共用批量队列，输出 JPEG / PNG / WebP |
| 哈希与 HMAC | 哈希计算、带密钥的消息认证码 |
| 二维码工具 | 生成、图片解码 |
| 时区与世界时钟 | 时区转换、多个地区时钟 |
| HTTP 请求工具 | 请求测试、cURL 生成、状态码查询 |
| 数据格式工作台 | JSON、CSV、YAML、TOML、XML、ENV、Schema 与 JSON 对比 |
| 文本处理工作台 | 命名转换、Slug、行清洗、字数统计 |
| 编码与转义 | JSON / HTML / URL / 正则转义、HTML 实体、Unicode |
| 单位与容量换算 | 单位换算、存储容量、带宽换算 |

原有链接和收藏继续有效。HTTP 与 cURL 共用当前标签页中的请求配置，支持导入、生成代码、手动发送与取消；图片压缩和 WebP 共用处理页面，结果可直接带入 Base64；单位工具的存储分类复用完整容量与带宽组件。数据与文本工具通过“继续处理”把当前输入或结果带入下一个工具。目录由 `public/tool-catalog.js` 生成，工具数量、分类和处理方式见[完整目录](docs/tool-catalog.md)。

普通文本工具切页保留输入、选项和结果，切换语言恢复输入并提示重新运行；这些草稿仅留在当前标签页内存，刷新清除，最多保留 10 个工具。番茄钟和秒表切页继续计时，可从底部活动条返回；待办单项删除支持撤销。手机顶栏将设置收进“更多”，收藏按钮直接可见。粘贴不会自动发送请求或点击主操作。

JSON 页面支持去转义一层、展开嵌套 JSON 字符串、格式化并复制，以及树中字段值/JSON/路径的单独复制。普通格式化不改变字符串类型；显式展开只转换字符串中的对象与数组，保留 `"123"`、`"true"`、路径等普通字符串。原输入保持不变，结果可作为新输入并撤销。转义工具接受带引号的完整 JSON 字符串和未带外层引号的转义片段，提供外层引号选项、逐层解码、复制与继续处理；无效编码明确提示。

图片工具支持文件选择和拖放；图片压缩、Base64 转换及 WebP 转换在浏览器内处理。批量转换最多 20 张、输入共 100 MiB，单张最多 4000 万像素，结果共 100 MiB；支持取消、重复下载和清空。工具卡片会标注本地处理、联网、可选联网或 AI 模型调用。

AES 加解密支持 GCM/CBC/CTR、PBKDF2 口令、OpenSSL `enc -pbkdf2` 格式和原始密钥，结果可与 OpenSSL、Java、Python 互通，并能解密旧版页面的输出；格式与示例见 [AES 说明](docs/aes.md)。

## AI 助手与数据

`Alt+A` 打开助手，`Cmd/Ctrl+J` 打开迷你对话框。支持配置 Claude、OpenAI、Gemini 适配器；实际连接取决于模型服务、接口配置及浏览器 CORS 限制。

Agent、快捷助手和 AI 对话共用连接设置，每个服务商分别保存地址、模型、温度和输出上限；支持域名、`/v1` 或完整接口地址，提供请求地址预览和手动连接测试。测试会向配置的模型发送一条短消息，可能产生少量费用。

“拉取模型”从配置的接口读取列表，支持搜索、分页点选和手动填写模型 ID。保存后会记住该连接的模型列表及最近使用的模型；修改地址或密钥会隔离原列表。点击 Agent 或 AI 对话中的当前模型，或在助手输入 `/model`，即可快速切换。列表不代表网关已经给该模型分配可用通道；连接测试会明确提示模型不可用或认证失败。OpenAI Chat 与 Responses 可带着对话和工具历史切换，Responses 同时兼容 JSON 与 SSE 返回。

点击连接或模型标签可打开轻量切换菜单，支持搜索、最近模型和手动模型 ID；打开菜单不会请求模型接口，选择后从下一次发送生效。“管理连接与模型”进入完整设置，`/model` 仍可直接打开完整模型面板。设置中的未保存修改按连接分别暂存在当前标签页，关闭设置或刷新后可恢复；“保存此连接”只保存，“保存并使用”同时切换，可单独放弃某个连接的草稿。关闭浏览器标签页可能清除这些临时连接草稿，未保存密钥不会进入本地持久存储或数据备份。

从 GitHub Pages 连接 `localhost` 接口时，浏览器可能要求允许“本地网络访问”。如果被拦截，请在浏览器的站点权限中允许后重试；接口服务仍需允许当前页面来源的 CORS 请求。

真实网关的模型切换、对话、工具执行和问题修复结果见[本地联调记录](docs/agent-local-validation.md)。

AI 对话支持停止并保留部分回复、失败重试、最后回复重新生成、清空撤销、切页保留草稿，以及向上阅读时暂停自动滚动。用户消息在发送前保存；重生成失败保留原回复。快捷助手重新打开仍保留本次会话历史。Agent 的网络失败重试沿用已完成的工具结果，不重复加入用户问题。

顶部“新对话”保留当前会话及其待发送草稿；生成中会停用，停止后恢复。会话列表支持按标题或消息搜索，并显示命中的片段、更新时间与当前会话。我的流程会自动保存编辑草稿和本次输入，刷新可恢复，可导出或清除；运行输入或步骤发生变化后，旧结果会标记过期并停用复制、下载和继续处理，重新运行后恢复。

Agent 与页面共用字符串转义、SQL、文本/JSON Diff、正则和图片处理能力。结果卡片可选择中间步骤、完整复制、下载、带入工具和修改参数重跑。先在图片工具选好文件，Agent 就能按文件 ID 压缩/转格式、读取 EXIF、识别二维码，结果继续下载或复用。图片字节留在本地，文件信息与识别结果随 Agent 对话发送给模型；引用在刷新/清除后失效。

日期差、时间戳/时区、颜色/对比度/调色板和 IPv4 也已统一手动与 Agent 算法，覆盖月末、DST、透明度和严格 CIDR 校验。Agent 共 88 个 action；普通文件可从附件、Base64 或 Hash 选择，通过文件 ID 读取 UTF-8 片段、计算摘要、Base64 往返、JSON/CSV 转换并下载。文件字节留在当前标签页，读取片段与元数据会随对话发给模型；大文件内容建议通过附件处理。

AI 对话和 Agent 共用上下文预算与固定备注，按完整轮次控制发送内容并显示估算。大工具结果用本地引用继续计算，聊天初次只渲染最近 40 条、可向前加载和完整导出。刷新可恢复历史最多 500 条 / 1,500,000 字符，超出部分会明确提示。模型达到输出上限后，可调整设置并重试，保留已完成的工具结果。详见 [第三轮能力与边界](docs/tool-capabilities-round3.md)。

哈希校验随最新文本/文件结果更新；文件摘要最多 10 个文件、每个 32 MiB，逐个在 Worker 中处理，停止会终止当前计算并保留已完成结果。文本及 HMAC 支持空消息，过期的异步结果不会覆盖新输入。

- 本地计算工具在浏览器执行；第三方库（二维码、YAML、TOML）以固定版本放在 `public/vendor/`，随站点校验和缓存，离线可用。
- 网络工具向相应服务发送请求；AI 助手会把对话、页面上下文和工具结果发送到配置的模型接口。
- 收藏、偏好和部分工具内容保存在浏览器。当前 API Key 配置使用浏览器存储，不应在共享设备上保存长期密钥，也不要把密钥写入仓库。
- 顶栏 ⇅（“数据备份与迁移”工具）可一键导出 / 导入收藏、设置、便签、待办、AI 对话等本机数据，支持文件或文本、合并或覆盖；API 密钥只能加密导出，2FA 看板以密文携带。
- 2FA 工具的账号密钥用主密码加密（PBKDF2 60 万次 + AES-GCM）后保存在本机，主密码不保存、无法找回；闲置自动锁定，Agent 不读取该工具。支持 Google Authenticator 迁移二维码、otpauth 链接、Aegis / 2FAS 明文导出的导入，以及加密备份导出。重要账号仍建议使用手机或硬件验证器。
- 2FA 账号导入后按发行方自动分组，忽略名称大小写，支持分类筛选、多个关键词搜索发行方/账号/备注、命中数量与折叠分组。没有发行方的条目进入「未分类」，可编辑补齐；原始账号不会被自动合并。点击验证码时重新计算当前值，切回页面立即刷新，避免后台计时器延迟时复制旧码；密钥不参与搜索。
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

`npm test` 检查 Agent 行为、工具目录、构建、CSS、缓存版本、第三方库摘要，以及财务大写、农历、Cron、CSV、单位换算等工具的计算结果。浏览器回归检查图片选择/处理/下载、分类、工作台、旧链接、收藏、脚本重复加载、SVG 预览隔离、Agent 工作流、版本更新；`npm run test:agent-shared` 专项检查手动/Agent 结果一致、正则 Worker、结果卡片、真实图片字节、EXIF/二维码、取消与过期文件引用；`npm run test:agent-ux` 专项检查共享配置、连接测试、流式停止/重试、聊天草稿与滚动、哈希校验和移动端。并对全部工具做 XSS 注入检查（用户输入、本地存储记录、DNS/IP 接口返回、Markdown 原始 HTML），以及英文界面检查：切到 English 后逐个打开工具、点击按钮、切换下拉选项，界面文字、提示和弹窗中不能出现中文。测试自动启动本地服务，生成测试图片，不连接模型服务。

可用 `TEST_BROWSER_CHANNEL=chrome` 使用已安装的 Chrome。375px / 768px 检查是桌面浏览器视口模拟，不代替手机真机测试。

构建结果在 `dist/`。PR 执行 Chromium 与 Firefox 检查；`master` 推送通过检查后使用 GitHub 官方 Pages artifact 工作流部署。仓库 **Settings → Pages → Build and deployment → Source** 必须设置为 **GitHub Actions**，并允许 `github-pages` 环境从 `master` 部署。代码未推送、工作流未成功执行或仓库设置未完成时，线上不会更新。见 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 版本更新与刷新

顶部 **↻** 打开版本面板，可查看当前/线上版本、手动检查和刷新。有新版本时按钮出现提示点；只有完整下载并校验成功后才允许“更新并刷新”。不会自动刷新正在工作的页面。

页面打开、恢复联网时自动检查；返回前台时检查有一分钟节流，前台每五分钟检查一次。版本来自构建内容哈希，无需手动改版本号。GitHub 构建、部署和 CDN 传播存在延迟，不保证推送后即时可用。

刷新会结束任务、清除未保存输入、图片暂存和未下载结果；收藏及设置保留。图片暂存仅在当前标签页内存中，最多 20 张、共 100 MB，可把处理结果继续暂存复用。

首次成功安装会缓存站点自有静态文件，工具代码仍按需执行。之后的版本只下载内容有变化的文件，其余文件从保留的旧版本缓存复制；复制前重新计算 SHA-256 并与新版本清单比对，旧缓存损坏或被篡改的文件会重新下载，任一文件失败则放弃整个新版本、继续使用当前版本。缓存按项目路径隔离，并保留当前及前两个版本；其他打开的标签页不会被强制刷新。模型服务与网络类工具仍需要网络。从旧机制首次迁移时，若仍显示旧页面，请关闭此站点的所有标签页后重新打开，让等待中的新 Worker 接管；之后即可使用新的更新按钮。直接运行 `public/` 显示开发版；完整更新测试需 `npm run build` 后托管 `dist/`。

`npm run test:updates` 使用真实 Service Worker 模拟三个发布版本，验证手动更新、增量安装（只请求变化的文件）、旧缓存被篡改后重新下载、多标签页、离线、缺失/错版资源与缓存隔离。

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
  tool-workspace.js   普通文本草稿、结果带入和活动条
  request-session.js HTTP / cURL 内存请求配置
  tool-compute.js     页面与 Agent 共享的文本/日期计算与按需加载器
  dashboard.js        路由、导航和页面渲染
  i18n.js             双语标签
  tools/             按需加载的工具
  compute/           页面与 Agent 共用的计算模块（Cron、CSV、农历、YAML/TOML/XML、.env、AES）
  vendor/            固定版本的第三方库及许可证、摘要清单
  agent/             会话、适配器、动作、界面
scripts/             构建与目录文档生成
tests/               单元测试与浏览器回归
docs/                工具目录、架构与 AES 格式说明
```

新增工具时，在 `public/tools/` 实现界面（文案、示例、提示都用 `makeToolI18n` 提供中英文，农历、财务大写等中文数据放在 `lang="zh"` 元素里），在 `public/tool-catalog.js` 注册元数据，并在 `public/i18n.js` 添加英文标签。使用独立作用域隔离工具内部状态，提供页面离开时的清理逻辑。页面与 Agent 都要用的计算逻辑放进 `public/compute/`，通过 `ToolCompute.load()` 按需加载；第三方库放进 `public/vendor/` 并更新 `manifest.json` 摘要，不从 CDN 加载。用户输入、存储记录和网络返回一律经 `escHtml` 或 `textContent` 输出，不拼进内联事件。需要 Agent 调用时，在 `public/agent/` 注册相应能力和参数约束。

修改目录后运行 `npm run docs:catalog`，提交生成的目录文档，并运行相关测试。修改分类或入口时保留现有工具 ID，避免破坏历史链接和收藏。

`npm run test:ux` 覆盖跨工具草稿、结果带入、HTTP/cURL 请求一致性、取消、输入法、搜索焦点、持续计时、待办撤销和手机顶栏；设置 `TEST_BUILD=1` 时使用临时构建产物验证。

Markdown 支持编辑/分栏/预览、表格、任务清单和文内目录，草稿在当前标签页保留。连续输入在停顿 180 ms 后更新；超过 10 万字符时改为手动更新预览。SQL 排版保护字符串、引用标识符和注释，支持通用/MySQL/PostgreSQL 词法、关键词大小写与缩进；它不执行 SQL，也不是完整语法校验器。

正则在独立 Worker 中运行，1.5 秒超时后终止，支持命名捕获、Unicode 零宽匹配和替换模板。文本上限 20 万字符，最多展示 2000 个匹配；替换超过匹配/输出上限会明确失败，不返回部分结果。文本对比使用精确编辑序列，支持行/词/字符模式；每页显示最多 200 段，复制与下载包含全部差异。超出计算预算会提示缩小范围，不退化成按行号误报的结果。

`npm run test:performance` 验证 Markdown 输入合并、输入法、复制、长文、草稿、六主题与手机布局，并输出本地输入耗时；`npm run test:quality` 验证 SQL 内容保真、大文本对比/完整导出，以及正则结果、超时和页面响应。两者支持 `TEST_BUILD=1` 与 `TEST_BROWSER=firefox`。这些测试不代替手机真机和线上网络测量。

`npm run test:json-workflow` 验证嵌套 JSON、转义/去转义、字段复制、特殊键路径、完整大结果复制、撤销、错误、双语草稿和手机工作台导航。JSON 输入操作上限 100 万字符，超过 10 万字符暂停自动识别；嵌套展开最多 8 层字符串编码、64 层结构和 20,000 个节点。树形预览最多 500 个节点/20 层，复制和下载包含完整结果。

## English

K Toolkit is a static developer toolbox with an AI assistant, bilingual UI, themes, search, favorites and recent tools. [Try it online](https://yellowkang.github.io/k-toolkit/).

Ten categories and nine workbenches organize the tools: images, hashes/HMAC, QR, time zones/clocks, HTTP, data formats, text, escaping and units/storage. Existing child URLs and favorites remain valid. HTTP and cURL share request settings; compression and WebP share a batch queue with JPEG/PNG/WebP output; storage and bandwidth share one converter. Text results can be explicitly passed to the next tool. See the generated [tool catalog](docs/tool-catalog.md) for the current inventory.

Ordinary text drafts survive navigation in the current tab (up to 10 tools); changing language restores inputs, and refresh clears drafts. Timers keep running across pages, deleted to-dos can be undone, and mobile settings move into a compact menu. Pasting never sends a request automatically. Images stay local, with a 20-file/100 MiB input limit, 40 megapixels per image and 100 MiB of results; cancel, repeated downloads and clearing are supported.

JSON supports one-layer unescaping, explicit nested object/array expansion, format-and-copy, and separate tree value/JSON/path copies. Ordinary strings retain their types. Results can become the next input with undo. The escaping workbench accepts quoted JSON strings and escaped fragments, reports invalid encodings, and supports repeated processing without manual copy/paste.

Agent, quick assistant and AI Chat share provider-specific connection settings, endpoint preview and an explicit connection test. Chat keeps partial replies when stopped, preserves the previous reply if regeneration fails, remembers in-tab drafts, supports undoing a clear and respects scroll position. Hash verification follows the current text or file results; file batches run sequentially in terminable Workers (up to 10 files, 32 MiB each).

Date/time, colors/palettes and IPv4 use the same computation in manual pages and Agent. The 88 actions include local file references for UTF-8 excerpts, hashes, Base64 and JSON/CSV conversion. AI Chat and Agent share estimated context budgets and pinned notes; large results can be reused by ID. Chat renders 40 messages initially and supports loading older messages and full export. Refresh restores up to 500 messages / 1,500,000 serialized characters, with an explicit notice when earlier messages remain only in this session.

Fetch models from the configured API or enter a model name manually. A listed model may still have no available gateway route; verify it with the connection test. Chat and Responses can reuse portable conversation/tool history. Responses accepts both JSON and SSE replies.

Local tools process inputs in the browser. Network tools contact external services, and AI requests send conversation context and tool results to the configured model provider. Third-party libraries (QR, YAML, TOML) are pinned under `public/vendor/` and cached with the site, so they work offline. AES (GCM/CBC/CTR, PBKDF2, OpenSSL `enc -pbkdf2`, raw keys) interoperates with OpenSSL, Java and Python; see [the AES notes](docs/aes.md). API keys are currently stored in browser storage; a separate backend is needed to keep service credentials off the client. The ⇅ button (Backup & Restore tool) exports and imports favorites, settings, notes, to-dos, AI chats and more as a file or text, merging or overwriting; API keys are only exported encrypted. The 2FA tool encrypts account secrets with a master password (PBKDF2 ×600,000 + AES-GCM) that is never stored, locks after inactivity, is invisible to the Agent, and imports Google Authenticator transfer QR codes, otpauth links and Aegis / 2FAS plain exports; keep important accounts on a phone or hardware authenticator.

Use `/workflows` in the assistant for local templates that require no model or API key. Typed result references chain validated actions, stop on errors, and keep intermediate data in the browser. See [workflow usage and roadmap](docs/agent-workflows.md).

Use Node.js 20.13+ and `npm ci`, then `npm run dev`. Run `npm test` for unit/build/catalog checks. Install Playwright browsers with `npx playwright install chromium firefox`, then run `TEST_BUILD=1 npm run test:browser`; set `TEST_BROWSER=firefox` for Firefox. The browser suite includes an XSS fuzz pass over every tool and an English-mode pass that opens every tool, clicks its buttons and cycles its selects, failing on any Chinese UI text, toast or dialog. Tool strings come from `makeToolI18n` dictionaries; Chinese data such as lunar dates is wrapped in `lang="zh"`. `npm run build` writes the static site to `dist/`.

Pull requests run Chromium and Firefox checks. Successful pushes to `master` deploy through the official Pages artifact workflow. Set the repository’s Pages Source to **GitHub Actions**. The ↻ button checks for updates and refreshes only when requested; deployment/CDN propagation is not instantaneous. To host locally with Docker, run `docker compose up -d --build` and open port 8080.

## License

[MIT](LICENSE) © YellowKang

第二轮工具能力巡检与改进详见 [能力巡检](docs/tool-capability-audit.md)：共享数学/单位/URL/JWT/CSV/Schema、可取消 Draft-07 校验、格式工作流与页面操作修复。专项浏览器回归：`TEST_BUILD=1 npm run test:capabilities`（支持 `TEST_BROWSER=firefox`）。

第三轮日期/颜色/IP、普通文件和长对话详见 [实现与边界](docs/tool-capabilities-round3.md)。专项回归：`TEST_BUILD=1 npm run test:capabilities-next`，同样支持 Chromium / Firefox。
