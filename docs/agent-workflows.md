# 本地工作流与 Agent 工具串联

## 已实现

Agent 优先使用搜索发现的本地 action 完成计算，页面导航用于用户要求打开工具或需要手动输入的操作。`search_tools` 返回 `workflow` 和 `outputs`，说明动作能否用于串联及输出字段。新发现的 schema 优先加入下一轮请求，最多额外携带 20 个；schema 从本地注册表读取。

`run_workflow` 支持按序执行的 1–12 步计划。输入参数中的 `{"$ref":"步骤ID.data.result"}` 引用此前的真实结果；哈希结果使用 `data.hash`。执行器检查所有动作和引用关系，再逐步校验解析后的参数类型。结果保留 JSON 类型，不自动把对象、false、null 变成字符串。JSON 字段提取同时返回 `value`（原始类型）和 `result`（文本）。

允许的动作：Base64 编解码、JSON 格式化/校验/字段提取/嵌套展开、字符串转义、SQL、行清洗、命名转换、字数统计、普通哈希/多哈希/HMAC、URL 编解码/解析/构建、CSV 双向转换、YAML/TOML/XML 转换、Schema 推断/校验、数学表达式与单位换算，以及日期差、时间戳、时区、颜色转换和 IPv4 计算。网络请求、页面操作、文件池动作、递归工作流和其他插件动作不在当前白名单内。只执行读取和本地计算，不自动重试副作用。

步骤失败或取消后停止后续步骤；已完成结果不撤销。界面展示各步骤状态和耗时，可以选择最终值或已返回的中间步骤，复制完整内容、下载、带入手动工具；已有输入会在替换前确认。默认返回给模型的是最终数据与简短步骤日志；需要同时展示中间结果时，使用 `returnSteps` 指定最多 12 个不重复的已有步骤 ID，结果放在 `data.outputs[id]`，无需再次执行同一条工作流。所选结果合计仍受输出上限约束。

## 不用模型直接运行

按 `Alt+A` 打开助手，点“本地工作流”或输入 `/workflows`。模板按钮会填入命令，追加输入后发送即可；无需 API Key。

```text
/workflow decode-json eyJvayI6dHJ1ZX0=
/workflow clean-base64  beta
alpha
 beta
/workflow json-sha256 {"name":"K Toolkit","enabled":true}
```

- `decode-json`：Base64 解码 → JSON 格式化。
- `clean-base64`：去首尾空格/空行/重复行 → Base64 编码，保留首次出现的顺序。
- `csv-json-schema`：CSV → 保留字符串的 JSON → 根据全部样本推断 Schema。
- `yaml-json`：YAML → JSON → 格式化。
- `json-sha256`：JSON 压缩 → SHA-256。保留键名顺序，不是规范化 JSON 签名；不能保证不同键顺序的等价对象得到相同摘要。

`/workflow` 保留输入内的空格和换行；模板名后一个空白字符作为分隔符。其他已有命令继续使用原来的参数规则。输入 `/hash abc md5` 可验证 MD5 输出为 `900150983cd24fb0d6963f7d28e17f72`。

## 带依赖的计划示例

```json
{
  "steps": [
    {"id":"extract","action":"json_extract","params":{"input":"{\"name\":\"HTTP Server\"}","pointer":"/name"}},
    {"id":"rename","action":"case_convert","params":{"text":{"$ref":"extract.data.result"},"style":"snake"}},
    {"id":"digest","action":"hash_generate","params":{"text":{"$ref":"rename.data.result"},"algo":"SHA-256"}}
  ],
  "returnSteps": ["rename", "digest"]
}
```

JSON 提取使用 JSON Pointer：`/users/0/name`，空字符串表示根对象；键名中的 `/` 写成 `~1`、`~` 写成 `~0`。路径不存在会返回错误，不执行 JavaScript 表达式。

## 已有工具扩展与修复

- 行排序页增加组合清洗、排序选项、中英文文案；同一 `ToolCompute.processLines` 同时供 Agent 使用。
- Base64 和命名风格转换复用共享函数，处理中文、emoji、缩略词和空输入；页面结果使用文本节点，避免把输入当 HTML。
- MD5 修复为完整 32 位十六进制摘要，并使用独立实现验证标准向量和填充边界。
- 原有 `text_pipeline` 修复把字母 s 当空白的问题、Unicode 反转和 JSON 反转义，遇错停止；`batch_convert` 显式报告部分失败和超限，不再静默只处理前 50 条。
- 读取工具输出时优先读取表单 `value`，修复 textarea 中有结果却读到空值的问题。
- 本地命令复用 Agent 的校验、超时、取消和结果卡片；工具参数预览隐藏 key/token/password/secret 字段。

## 第二轮共享能力

CSV、URL、JWT、数学、单位和 JSON Schema 进一步统一页面与 Agent。JSON Schema 使用真实 Draft-07 校验，`json_schema_validate` 返回 `data.valid`；数据不合规时工具仍可成功执行并返回 `valid:false`，用于分析错误。希望失败即阻断后续步骤时设置 `assertValid:true`。无效 Schema、未知规则、未找到的引用、取消或超时始终返回失败。

`url_parse` 返回有序 `data.entries`，参数对象 `data.params` 的重复键为数组，单值为字符串；`url_build` 的 entries 可直接用 `$ref` 接收，避免重复编码与丢值。`unit_convert` 支持八类单位，存储 `MB` 明确为 SI 10⁶ 字节，`MiB` 为 2²⁰ 字节；`unit_list` 可查询单位 ID。`calculate` 的 `^` 是幂、`%` 是百分比、`mod` 是取余，科学函数默认角度制 `deg`。

详见 [巡检与能力边界](tool-capability-audit.md)。新增动作及模板同样复用完整复制/下载/继续处理；JWT 不放入通用草稿或参数编辑器。

## 共享计算与结果卡片

SQL、文本 Diff、JSON Diff、字符串转义和正则由页面与 Agent 调用同一份实现。SQL 保留字面量与行注释换行，支持方言、关键词大小写与缩进选项；文本 Diff 支持行/词/Unicode 字符并正确处理重复行；JSON Diff 支持根标量、数组、特殊键和 JSON Pointer 路径。`string_escape` 不再用全局替换去转义；`json_unescape` 去一层、`json_expand` 展开嵌套结构，均可用于工作流。正则匹配与替换共用执行器，支持捕获组替换；零宽匹配会按 Unicode 规则推进，复杂模式 1.5 秒后终止 Worker，停止 Agent 也会终止它。

结果预览最多 2,000 字符，复制和下载保留完整内容。查看数据最多渲染 12,000 字符，另有完整数据下载。常用本地计算动作可展开“调整参数重跑”，参数经 schema 校验后走同一执行器；包含 key/password/token/secret 参数的请求不显示编辑器。快捷助手关闭重开保留结果控件事件。

## 图片文件从选择到继续处理

1. 在任一图片工具选择文件，或复用已有暂存。Agent 先搜索 `image`，再调用 `list_image_files` 获得当前有效 ID。
2. `image_convert` 接受 `fileIds`、`format`（`image/jpeg`、`image/png`、`image/webp`）、可选质量 10–100 和 `maxWidth`。返回文件 ID、实际大小和尺寸，卡片直接下载或继续转入图片工具；失败项逐个显示，成功结果保留。
3. `image_metadata` 读取尺寸与 JPEG EXIF，`image_qr_decode` 返回真实二维码文本。两者接受已选文件或转换结果的 `fileId`，复用页面的 `compute/image.js`。

文件内容保存在当前标签页内存。输入与结果池分别最多 20 张、100 MiB；结果超限清理最旧项。清除/刷新后 ID 失效；过期 ID 明确报错，清除或取消后的迟到结果不会重新发布。批量处理开始时保留输入快照，避免产生新结果时淘汰尚未处理的源文件。处理上限 4000 万像素；QR 缩到最长边 1600 像素，EXIF 最多读取 JPEG 前 2 MiB，并校验大小端、字段长度、内联值与子目录偏移。JPEG 透明区域填白，PNG 不使用质量参数，动画只导出静态帧。

图片字节不发给模型；自然语言使用 Agent 时，文件信息、EXIF 与识别结果仍作为工具结果发送到所选模型。文件动作未加入纯文本工作流白名单。

## 预算和验证边界

普通文件使用 `list_files`、`read_file`、`file_hash`、`file_convert`；在 Agent 附件或 Base64 / Hash 页面选择后获得真实 ID。文件卡片可下载并带入手动工具。大文本结果通过 `resultId`、`read_result`、`transform_result` 跨轮继续处理，避免模型复述预览。当前共 88 个 action，新增动作的容量与语义见 [第三轮能力说明](tool-capabilities-round3.md)。

每次 Agent 任务最多 8 轮模型请求、32 次顶层动作调用；每条工作流最多 12 步。动作参数序列化不超过 65,536 字符，工作流的参数、单步结果与最终合并输出也受该上限约束；一般动作输出上限为 131,072 字符。单次动作等待超时 15 秒。内存中运行，不保存工作流输入、计划和结果到持久存储。

这些上限独立于模型上下文预算。Agent 与 AI 对话共用 16k / 32k / 64k 估算预算，包含系统提示、工具定义和回复预留，按完整轮次限制发送视图，保留固定备注与本次会话历史。超过 8,000 字符的结果以本地引用和预览发给模型；结果池有数量/字符上限，过期后需重新计算。正则和文件哈希/Base64 使用可终止 Worker，其他同步计算仍依赖输入/复杂度上限，不能只靠 Promise 超时保护。文件动作可用前一次返回的 ID 继续调用，尚未加入纯计算工作流白名单。自然语言模式仍会将用户输入、上下文和工具返回的信息发给配置的模型。

单元测试覆盖引用校验、结果类型、失败阻断、取消、限额、MD5/HMAC 对照和模板。浏览器测试使用真实工具注册/加载/搜索/页面与结果卡片，模型边界用可控响应代替，没有调用收费模型；不代表所有模型供应商均完成真实联调。CI 对构建后的 `/k-toolkit/` 子路径执行 Chromium/Firefox 回归。

## 后续优先级

| 优先级 | 缺口 | 建议落点 |
| --- | --- | --- |
| P1 | 继续共享剩余计算能力 | 日期、时区、颜色和 IPv4 已校准并串联；下一步对齐密码/随机生成策略与更多数值工具 |
| P2 | HTTP 工作台继续复用 | 已共享 cURL/HTTP 请求对象并支持 URL 参数交接；后续统一导出配置与响应处理，保留显式联网 |
| P2 | 跨轮大文本结果与历史成本 | 已实现结果引用、估算预算和分批历史渲染；后续按实际模型能力完善预算配置，保持估算标识 |
| P2 | 自定义流程复用 | 在现有模板结构上增加用户保存/导入/导出，导入时仍验证白名单与限额，不导入可执行脚本 |
| P2 | 更多文件处理 | 普通文件 Base64、摘要、UTF-8、JSON/CSV 已共享；后续接入图标/占位图输出与有明确需求的文件类型 |

暂不增加多 Agent、数据库或任务编排服务；先扩展已校准的可执行动作，减少重复计算和模型往返。
