# HTTP 响应处理与 Schema Mock

## 数据保真

文件 JSON 格式化、JSON→CSV 和 HTTP 响应格式化复用 `compute/json-text.js`。64 位整数、高精度小数与嵌套数组中的数字不会经 Number 舍入。CSV 的精确数字视作单元格值，不展开其内部对象；普通 CSV 默认保持字符串。启用推断后，无法安全往返的数字仍为字符串，包含不安全整数、过精细的小数和下溢值。

CSV 沿用 20,000 行 / 1,000 列 / 200,000 单元格上限，解析预算按这一容量提高到最多 600,000 个词元，输入 100 万字符和深度限制不变。

## HTTP 响应

- 原文与格式化结果独立保存；最多读取 5 MiB 实际 UTF-8 响应，超过即取消读取，不提供部分成功结果。
- 预览最多 64,000 字符；复制使用完整所选视图，下载使用完整原文。空响应仍可下载，HTTP 4xx/5xx 的有效响应仍可检查。
- JSON 操作最多 1,000,000 字符：支持 JSON Pointer 字段提取（空指针为根值）、单独复制字段，以及带入 JSON、Schema 和 JSON 对比的 A 输入。字段预览最多 8,000 字符，复制不截断。
- 修改 URL、方法、请求头或正文会中止未完成请求并使旧结果失效。请求失败不复用旧内容。响应仅保存在本页，不自动存储或发送给模型，离页释放。
- 请求仍须用户显式发送，仍受浏览器 CORS 限制。

响应在 HTTP 页面不被自动模型上下文采集；用户显式交接到其他工具后，遵循目标工具已有的上下文规则。

## Schema Mock

输入 Draft-07 Schema、种子、样本条数和可选字段开关。相同输入、种子与选项在本版本内可复现。输出始终为**样本数组**，每条样本各自通过原 Schema 的 Ajv 校验；不会把数组本身当成一个样本验证。

支持的生成规则：

- 基础类型、nullable type 数组、enum、const。
- 对象 properties / required / additionalProperties / minProperties / maxProperties。
- 数组 items（含元组）/ additionalItems / minItems / maxItems / uniqueItems。
- 数值 minimum / maximum / exclusiveMinimum / exclusiveMaximum / multipleOf；字符串 minLength / maxLength。
- anyOf / oneOf，以及非循环本地 JSON Pointer 引用，通常使用 definitions。
- format：email、uuid、date、date-time、uri、hostname、ipv4。

生成是有界候选搜索，不是完整约束求解器。pattern、allOf、not、if/then/else、dependencies、patternProperties、contains、远程/循环引用和嵌套 $id 等生成规则明确拒绝；`$ref` 旁仅允许注释字段。当前固定版本校验器无法可靠处理的 `__proto__` 属性也明确拒绝。现有独立 Schema 校验工具的支持范围不受影响。

Schema 数值须能安全表示，大整数标识请用字符串。所有候选均通过真实校验器，无法满足约束或有界重试耗尽时整体失败；不会输出部分结果或保留旧结果供复制。

TypeScript 输出描述原 Schema 的结构：必需与可选属性、联合类型、枚举和数组元素类型。数值范围、字符串长度、唯一性与 oneOf 排他性仍需运行时校验；元组被概括为元素联合数组类型。它不是运行时验证器，也不是样本数组的外层类型。

容量边界：Schema 200,000 字符、5,000 个 Schema 节点/20 层，生成深度 24、总工作量 50,000 节点、每条最多 40 次候选尝试；每个数组最多 100 项、每个对象最多 1,000 个字段、生成字符串最多 1,000 字符；每次 1–100 条样本。紧凑样本合计最多 500,000 字符，格式化结果最多 1,000,000 字符，类型输出最多 200,000 字符。Worker 3 秒超时，取消、输入修改和离页均终止旧任务。

数组/对象/字符串的自动生成长度限制不修改 enum/const 提供的值；这些值仍受 Schema 输入、结构校验、总输出及 Worker 时间预算限制。

Agent 和本地流程通过 `json_schema_mock` 使用同一实现。动作/流程自身的输入输出预算仍适用。

语义参考：[JSON Schema Draft-07 validation](https://json-schema.org/draft-07/draft-handrews-json-schema-validation-01)、[anyOf/oneOf 组合规则](https://json-schema.org/understanding-json-schema/reference/combining)。

## 验证入口

`npm test` 验证文件/CSV 保真、流式响应边界、确定性样本、真实 Schema 校验、特殊字段和生成失败。

`TEST_BUILD=1 npm run test:browser -- response-mock` 验证真实 Worker、页面与 Agent/工作流一致、导出/交接、输入失效、网络取消、双语和 375/768 布局；支持 Chromium、Firefox 和 WebKit。
