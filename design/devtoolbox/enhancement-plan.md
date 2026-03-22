# DevToolbox 工具增强计划

> 版本：v1.0 | 日期：2026-03-22

## 总体策略

按「全局层 → 高频工具 → 美观层」三轮推进，每轮独立可回滚。

---

## 第一轮：全局层（影响所有工具）

### G1 — 键盘快捷键增强
**文件**：`public/dashboard.js`（全局键盘监听区）
- `Ctrl+Enter` / `Cmd+Enter`：触发当前工具的主操作按钮（`.btn.btn-primary:first-of-type`）
- `Escape`：清空当前焦点输入框 / 关闭结果面板
- 实现：在 `DOMContentLoaded` 中注册 `keydown` 监听，检测当前 `currentPage` 是否为工具页

### G2 — 工具页骨架屏
**文件**：`public/dashboard.js`（`renderToolPageFull` 函数，行 743）
- 懒加载脚本期间显示骨架占位（2个灰色面板），加载完后替换
- 实现：`renderToolPageFull` 开始时插入骨架 HTML，`await loadToolScript` 后清除

### G3 — 收藏/最近空状态引导
**文件**：`public/dashboard.js`（`renderHomePage` 函数）
- 收藏为空：SVG 插画 + 「点击工具卡片 ★ 收藏常用工具」
- 最近为空：SVG 插画 + 「使用过的工具会在这里记录」

### G4 — 工具卡片使用次数徽章
**文件**：`public/dashboard.js`（`renderToolCard` 函数，行 261）
- 使用次数 ≥ 5 次的工具，卡片右上角显示小数字徽章
- 数据来源：已有 `usageCounts` 对象

---

## 第二轮：高频工具强化

### T1 — JSON 格式化：JSONPath 查询
**文件**：`public/tools/json-format.js`
- 在结果区上方加一个输入框，支持 JSONPath 语法（`$.store.book[*].title`）
- 内联实现简版 JSONPath 解析（支持 `$`、`.key`、`[n]`、`[*]`），不引入外部库
- 查询结果高亮显示

### T2 — 正则工具：匹配结果显示行号
**文件**：`public/tools/regex.js`
- 当前仅显示匹配内容，不显示所在行
- 改进：在每个匹配项旁加「第 N 行」标注
- 实现：将 testText 按 `\n` 分行，记录每行起始 index，匹配时对比 index 确定行号

### T3 — 时间戳：相对时间 + 时区支持
**文件**：`public/tools/timestamp.js`
- 时间戳→日期结果中加「相对时间」行（已有 `relativeTime()` 函数，补充调用）
- 在日期→时间戳区域加时区选择下拉框（UTC / 本地 / 常用时区）

### T4 — Markdown：分屏同步滚动
**文件**：`public/tools/markdown.js`
- 当前左右分屏已有，但滚动不联动
- 改进：编辑区 scroll 时，按比例同步预览区 scrollTop
- 实现：监听 `#mdInput` scroll 事件，计算 `scrollRatio = scrollTop / (scrollHeight - clientHeight)`，同步到 `#mdPreview`

### T5 — Cron：秒级 Cron + 6字段支持
**文件**：`public/tools/cron.js`
- 当前仅支持 5 字段（分 时 日 月 周）
- 改进：自动检测 6 字段（秒 分 时 日 月 周，Spring/Quartz 格式）
- 在字段说明区标注「秒级模式已启用」

### T6 — HTTP 测试：请求历史记录
**文件**：`public/tools/http-tester.js`
- 发送成功后将「方法+URL+时间+状态码」存入 localStorage（最多 10 条）
- 在工具底部展示历史列表，点击可恢复填入

### T7 — 密码生成：熵值显示
**文件**：`public/tools/password-gen.js`
- 在强度条旁加「熵值 N bits」（已有 `calcPwdStrength`，补充熵计算：`length * log2(charsetSize)`）
- 加「记忆密码」模式（随机词组拼接，如 `Tiger-River-42`）

### T8 — 颜色工具：图片取色
**文件**：`public/tools/color.js` / `public/tools/color-convert.js`
- 新增「图片取色」面板：拖拽/上传图片 → Canvas 渲染 → 点击像素取色
- 实现：`<canvas>` + `getImageData`，点击坐标提取 RGB → 转换为 HEX/HSL

### T9 — 文本 Diff：行内高亮 + 复制差异
**文件**：`public/tools/text-diff.js`
- 逐行模式中，对有变化的行追加「逐词高亮」（单行内部词级 diff）
- 加「复制差异摘要」按钮（仅复制增/删行，不含相同行）

### T10 — 哈希工具：HMAC 支持
**文件**：`public/tools/hash.js`
- 在文本哈希区域加「HMAC 密钥」输入框（可选）
- 使用 Web Crypto API `SubtleCrypto.sign('HMAC', ...)` 计算 HMAC-SHA256/SHA512

### T11 — JWT：生成功能
**文件**：`public/tools/jwt.js`（或新建 `jwt-gen.js` 已存在）
- 检查 `jwt-gen.js` 是否已有生成功能，如有则在 jwt.js 解析结果底部加「使用此 Payload 生成」跳转链接

### T12 — URL 解析：参数编辑器
**文件**：`public/tools/url-parser.js`
- 解析后的查询参数支持在线编辑（key/value 输入框），改完自动重组 URL
- 实现：参数表格改为 `<input>`，`oninput` 重组 URL 并回填输入框

### T13 — SVG 预览：颜色/尺寸提取
**文件**：`public/tools/svg-preview.js`
- 已有缩放预览，补充：解析 SVG 提取 `width/height/viewBox`、所用颜色列表
- 实现：DOM 解析 SVG 字符串，`querySelectorAll('[fill],[stroke]')` 收集颜色

### T14 — Base64：文件拖拽编解码
**文件**：`public/tools/base64.js`
- 新增文件拖拽区域，文件 → Base64 DataURL（`FileReader.readAsDataURL`）
- Base64 → 文件下载（自动检测 MIME 前缀）

---

## 第三轮：美观层

### U1 — 工具卡片动效增强
**文件**：`public/dashboard.html`（CSS）
- hover 时卡片图标缩放 1.15 + 轻微上移 `translateY(-2px)` + 光晕扩散
- 高频工具（使用次数 ≥ 5）卡片右上角加数字徽章

### U2 — 侧边栏折叠 Tooltip
**文件**：`public/dashboard.html`（CSS + sidebar HTML）
- 折叠态（64px）下为每个分类 nav-item 加 `title` 属性和自定义 CSS tooltip

### U3 — FAB 在工具页隐藏
**文件**：`public/dashboard.js`（`navigateTo` 函数）
- 进入工具页时为 FAB 添加 `hidden` class，回到首页时移除

---

## 执行顺序

| 轮次 | 任务 | 文件 | 并行 |
|------|------|------|------|
| 1 | G1 键盘快捷键 | dashboard.js | - |
| 1 | G2 骨架屏 | dashboard.js | - |
| 1 | G3 空状态 | dashboard.js | G4 |
| 1 | G4 使用徽章 | dashboard.js | G3 |
| 2 | T1 JSONPath | json-format.js | T2,T3 |
| 2 | T2 行号 | regex.js | T1,T3 |
| 2 | T3 时间戳 | timestamp.js | T1,T2 |
| 2 | T4 MD同步滚动 | markdown.js | T5,T6 |
| 2 | T5 Cron 6字段 | cron.js | T4,T6 |
| 2 | T6 HTTP历史 | http-tester.js | T4,T5 |
| 2 | T7 密码熵值 | password-gen.js | T8 |
| 2 | T8 图片取色 | color.js | T7 |
| 2 | T9 Diff行内高亮 | text-diff.js | T10 |
| 2 | T10 HMAC | hash.js | T9 |
| 2 | T12 URL参数编辑 | url-parser.js | T13,T14 |
| 2 | T13 SVG信息 | svg-preview.js | T12,T14 |
| 2 | T14 Base64文件 | base64.js | T12,T13 |
| 3 | U1 卡片动效 | dashboard.html | U2,U3 |
| 3 | U2 Tooltip | dashboard.html | U1,U3 |
| 3 | U3 FAB隐藏 | dashboard.js | U1,U2 |

---

## 验收标准

- 所有工具正常打开，无控制台报错
- 离开工具页时无 `Cannot read properties of null` 报错（DOM 已销毁）
- Ctrl+Enter 在 JSON 格式化、正则、哈希等工具中触发主操作
- 搜索、收藏、最近使用功能不受影响
- SW 更新 Toast 可点击刷新
