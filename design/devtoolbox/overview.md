# DevToolbox 设计文档总览

> 版本：v2.1 | 日期：2026-03-22

## 项目定位

DevToolbox 是纯静态前端工具箱，73 个开发者工具，无需登录、无后端 API、无数据库。
核心理念：**零依赖、离线可用、秒开**。

运行方式：
- 开发：`npm run dev`（nodemon + Express 静态服务）
- 生产：直接将 `public/` 目录部署到 Nginx / GitHub Pages / Cloudflare Pages

---

## 文档目录

| 文件 | 内容 |
|------|------|
| [master.md](./master.md) | **全局综合设计文档**：架构 → 交互 → 模块 → UI/UE → 性能 → 问题优先级 |
| [arch.md](./arch.md) | 系统架构、技术栈、CSS 分层、路由模型、SW 缓存策略、状态管理 |
| [modules.md](./modules.md) | 文件结构、dashboard.js 模块清单、工具分类（73个）、SW 模块 |
| [interaction.md](./interaction.md) | 首次加载、工具打开、搜索、命令面板、收藏、主题切换、键盘快捷键 |
| [ui-ue.md](./ui-ue.md) | 设计语言、布局结构、组件规范、空/加载/错误状态、已知问题 |
| [performance.md](./performance.md) | 加载性能、运行时优化、渲染性能、离线缓存、内存管理 |
| [validation.md](./validation.md) | 工具合规验证报告：render 函数、setInterval cleanup、ObjectURL 释放 |

---

## 架构一句话概述

浏览器直接运行，Service Worker 离线缓存，工具按需懒加载（LRU≤30），所有状态存 localStorage，生产无需任何服务器。

---

## 技术栈

| 层次 | 技术 | 说明 |
|------|------|------|
| 运行时 | 原生 HTML/CSS/JS（ES2020+）| 零框架、零构建 |
| 服务端（开发） | Node.js + Express 4.x | 仅静态文件托管 + SPA fallback |
| 离线缓存 | Service Worker（Cache API）| shell Cache-First + tools SWR |
| 持久化 | localStorage | 收藏/最近/主题/用量/搜索历史 |
| 字体 | Inter / SF Pro Display / system-ui | 无外部 CDN 依赖 |

---

## 关键数据

| 指标 | 数值 |
|------|------|
| 工具数量 | 73 个 |
| 工具分类 | 10 个 |
| 首屏资源（未压缩）| ~126KB |
| 首屏资源（Gzip 后）| ~38-42KB |
| 工具懒加载上限 | 30 个（LRU 驱逐）|
| 最近使用保留 | 8 条 |
| 搜索历史保留 | 5 条 |
| SW 缓存版本 | dtb-v1 |
| 搜索防抖 | 100ms |
| 用量写盘防抖 | 2s |
| 并发预取上限 | 3 个 |

---

## 待改进事项（汇总）

> 详细优先级与方案见 [master.md](./master.md#6-已知问题与优先级)

| 优先级 | 分类 | 问题 |
|--------|------|------|
| 高 | 架构 | dashboard.js 49KB 单文件膨胀，可拆分 core/render/search |
| 高 | 缓存 | SW 更新无用户感知（postMessage 未消费） |
| 高 | UI | 移动端工具页 header 折行，分享按钮改 icon-only |
| 高 | 性能 | CSS 三文件合计 71KB，生产未启用 Brotli/Gzip |
| 中 | 交互 | 搜索下拉无数量上限，单分类建议 ≤ 3 条 |
| 中 | 交互 | 工具页无同分类推荐 |
| 中 | 交互 | 返回首页丢失滚动位置 |
| 中 | 性能 | 搜索评分全量遍历，可改倒排索引 |
| 中 | 架构 | SW cache key 硬编码 dtb-v1，需构建脚本自动化 |
| ~~低~~ | ~~内存~~ | ~~img-compress / img-webp / qrcode 存在 ObjectURL 未释放~~ | **已修复**：img-compress / img-webp / qrcode 已补 revokeObjectURL |
| 低 | UI | dark 模式部分工具卡片颜色对比度不足 |
| 低 | UI | 侧边栏折叠后无 tooltip |
| 低 | UI | 回到顶部 FAB 可能遮挡工具操作区 |
