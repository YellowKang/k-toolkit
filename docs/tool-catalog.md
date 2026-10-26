# 工具目录 / Tool catalog

> 由 `npm run docs:catalog` 从 `public/tool-catalog.js` 生成；请勿手工修改。

93 个能力入口；73 个分类导航入口 + 1 个 AI 入口；10 个分类；9 组工作台。

工作台合并导航入口，各子工具仍使用原 ID。搜索、收藏、最近使用与 Agent 可以直接访问子工具。图片压缩与 WebP 共用批量队列，HTTP/cURL 共用请求配置，单位工具复用完整存储与带宽换算。普通文本工具保留当前标签页草稿，通过“继续处理”显式传递输入或结果；敏感工具不进入通用草稿。

## 工作台 / Workbenches

| 工作台 | 能力 ID（首项为主入口） |
| --- | --- |
| 数据格式工作台 / Data Format Workbench | `json` · `json-csv` · `yaml-json` · `toml-json` · `xml-format` · `env-parse` · `json-schema` · `diff-json` |
| 文本处理工作台 / Text Workbench | `case-convert` · `slug-gen` · `line-sort` · `wordcount` |
| 编码与转义 / Encoding & Escaping | `text-escape` · `html-entity` · `unicode-convert` |
| 单位与容量换算 / Units & Storage | `unit-convert` · `byte-convert` |
| 图片压缩与转换 / Image Compression & Conversion | `img-compress` · `img-webp` |
| 哈希与 HMAC / Hash & HMAC | `hash` · `hmac-gen` |
| 二维码工具 / QR Code Tools | `qrcode` · `qrcode-decode` |
| 时区与世界时钟 / Time Zones & World Clock | `timezone` · `world-clock` |
| HTTP 请求工具 / HTTP Request Tools | `http-tester` · `curl-gen` · `http-status` |

## 保持独立的能力

图片 Base64、EXIF、Favicon 具有不同输入输出；JWT、AES 与哈希的语义不同；JSON/YAML/TOML/CSV 的格式语义不同。工作台保留各自解析和处理语义，旧链接与收藏继续有效。

## 文本处理 / Text

9 项能力，6 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| 字数统计 | `wordcount` | 本地处理 | 文本处理工作台 |
| 正则测试器 | `regex` | 本地处理 | — |
| 文本对比 | `text-diff` | 本地处理 | — |
| Markdown 预览 | `markdown` | 本地处理 | — |
| 大小写转换 | `case-convert` | 本地处理 | 文本处理工作台 |
| 占位文本生成 | `lorem` | 本地处理 | — |
| Slug 生成器 | `slug-gen` | 本地处理 | 文本处理工作台 |
| 行排序去重 | `line-sort` | 本地处理 | 文本处理工作台 |
| 字符串检查器 | `string-inspect` | 本地处理 | — |

## 数据格式 / Data & Formats

9 项能力，2 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| JSON 格式化 | `json` | 本地处理 | 数据格式工作台 |
| JSON/CSV 互转 | `json-csv` | 本地处理 | 数据格式工作台 |
| YAML/JSON 互转 | `yaml-json` | 本地处理 | 数据格式工作台 |
| SQL 格式化 | `sql-format` | 本地处理 | — |
| XML 格式化 | `xml-format` | 本地处理 | 数据格式工作台 |
| JSON 对比 | `diff-json` | 本地处理 | 数据格式工作台 |
| TOML ↔ JSON | `toml-json` | 本地处理 | 数据格式工作台 |
| ENV 解析器 | `env-parse` | 本地处理 | 数据格式工作台 |
| JSON Schema 生成 | `json-schema` | 本地处理 | 数据格式工作台 |

## 开发工具 / Development

9 项能力，9 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| UUID 生成器 | `uuid` | 本地处理 | — |
| Git Commit 生成 | `git-commit` | 本地处理 | — |
| Nginx 配置生成 | `nginx-gen` | 本地处理 | — |
| Dockerfile 生成 | `docker-gen` | 本地处理 | — |
| Semver 比较 | `semver` | 本地处理 | — |
| 终端颜色码 | `terminal-color` | 本地处理 | — |
| Mock 数据生成 | `mock-data` | 本地处理 | — |
| Chmod 计算器 | `chmod-calc` | 本地处理 | — |
| LLM Token 计数 | `llm-token` | 本地处理 | — |

## 编码加密 / Encoding & Crypto

11 项能力，8 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| Base64 编解码 | `base64` | 本地处理 | — |
| Unicode 转换 | `unicode-convert` | 本地处理 | 编码与转义 |
| HTML 实体转换 | `html-entity` | 本地处理 | 编码与转义 |
| 哈希生成器 | `hash` | 本地处理 | 哈希与 HMAC |
| JWT 工具 | `jwt` | 本地处理 | — |
| 密码生成器 | `password-gen` | 本地 / 可选联网 | — |
| 2FA 工具 | `totp` | 本地处理 | — |
| AES 加解密 | `aes` | 本地处理 | — |
| 摩斯电码 | `morse` | 本地处理 | — |
| 字符串转义 | `text-escape` | 本地处理 | 编码与转义 |
| HMAC 生成器 | `hmac-gen` | 本地处理 | 哈希与 HMAC |

## 图片工具 / Images

9 项能力，7 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| 图片 Base64 | `img-base64` | 本地处理 | — |
| 图片压缩 | `img-compress` | 本地处理 | 图片压缩与转换 |
| 二维码生成 | `qrcode` | 本地处理 | 二维码工具 |
| 二维码解析 | `qrcode-decode` | 本地处理 | 二维码工具 |
| SVG 预览 | `svg-preview` | 本地处理 | — |
| 图片转 WebP | `img-webp` | 本地处理 | 图片压缩与转换 |
| EXIF 查看器 | `img-exif` | 本地处理 | — |
| 占位图生成 | `placeholder-img` | 本地处理 | — |
| Favicon 生成器 | `favicon-gen` | 本地处理 | — |

## CSS 工具 / CSS & Design

7 项能力，7 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| 渐变生成器 | `gradient` | 本地处理 | — |
| 颜色工具 | `color` | 本地处理 | — |
| 阴影生成器 | `shadow` | 本地处理 | — |
| Flexbox 生成 | `flexbox` | 本地处理 | — |
| 调色板生成器 | `palette-gen` | 本地处理 | — |
| clip-path 生成器 | `clip-path` | 本地处理 | — |
| CSS 单位转换 | `css-unit` | 本地处理 | — |

## 网络工具 / Network & HTTP

9 项能力，7 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| URL 工具箱 | `url-parser` | 本地处理 | — |
| cURL 生成器 | `curl-gen` | 本地处理 | HTTP 请求工具 |
| HTTP 状态码 | `http-status` | 本地处理 | HTTP 请求工具 |
| IP 子网计算 | `ip-calc` | 本地处理 | — |
| UA 解析 | `user-agent` | 本地处理 | — |
| HTTP 请求测试 | `http-tester` | 联网请求 | HTTP 请求工具 |
| IP 信息 | `ip-info` | 联网请求 | — |
| 网速测试 | `speed-test` | 联网请求 | — |
| DNS 查询 | `dns-lookup` | 联网请求 | — |

## 时间效率 / Time & Productivity

16 项能力，15 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| 时间戳转换 | `timestamp` | 本地处理 | — |
| Cron 表达式 | `cron` | 本地处理 | — |
| 日期差计算 | `date-diff` | 本地处理 | — |
| 时区转换 | `timezone` | 本地处理 | 时区与世界时钟 |
| 倒计时 | `countdown` | 本地处理 | — |
| 番茄钟 | `pomodoro` | 本地处理 | — |
| 会议费用 | `meeting-cost` | 本地处理 | — |
| 随机抽签 | `spinner` | 本地处理 | — |
| 世界时钟 | `world-clock` | 本地处理 | 时区与世界时钟 |
| 秒表计时 | `stopwatch` | 本地处理 | — |
| 文本模板 | `text-template` | 本地处理 | — |
| 农历查询 | `lunar-calendar` | 本地处理 | — |
| Todo 清单 | `todo` | 本地处理 | — |
| 数据备份与迁移 | `data-backup` | 本地处理 | — |
| 临时便签 | `note` | 本地处理 | — |
| 打字速度测试 | `typing-speed` | 本地处理 | — |

## 计算工具 / Calculators

9 项能力，8 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| 进制转换 | `number-base` | 本地处理 | — |
| 科学计算器 | `calculator` | 本地处理 | — |
| 单位换算 | `unit-convert` | 本地处理 | 单位与容量换算 |
| 贷款计算器 | `loan-calc` | 本地处理 | — |
| 存储换算 | `byte-convert` | 本地处理 | 单位与容量换算 |
| 数字大写 | `number-chinese` | 本地处理 | — |
| 比例计算 | `aspect-ratio` | 本地处理 | — |
| 年龄计算器 | `age-calc` | 本地处理 | — |
| 个税计算器 | `tax-calc` | 本地处理 | — |

## 趣味工具 / Fun

4 项能力，4 个导航入口。

| 能力 | ID | 处理位置 | 工作台 |
| --- | --- | --- | --- |
| ASCII 艺术字 | `ascii-art` | 本地处理 | — |
| 矩阵雨 | `matrix-rain` | 本地处理 | — |
| Emoji 选择器 | `emoji-picker` | 本地处理 | — |
| 白噪音 | `noise-gen` | 本地处理 | — |

## AI 助手 / AI assistant

`ai-chat`：用户配置的模型服务。发送给模型的对话、附件和工具上下文会离开浏览器。本地工具处理不等于所有功能都不联网。
