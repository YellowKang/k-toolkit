# 性能优化策略

## 1. 加载性能

### 首屏资源预算

```
dashboard.html           ~3.4KB
dashboard.js             ~49KB
dashboard-base.css       ~26KB
dashboard-components.css ~34KB
dashboard-theme.css      ~11KB
─────────────────────────────────
合计首屏                 ~126KB（未压缩）
Gzip 后估算              ~38-42KB
```

### 当前优化策略

| 优化点 | 实现方式 | 效果 |
|--------|----------|------|
| 工具懒加载 | 点击时动态注入 `<script>` | 首屏只加载 ~126KB shell |
| hover 预取 | `prefetchTool` + requestIdleCallback | 工具首次打开近乎无感 |
| LRU 驱逐 | 已加载 >30 个时移除最旧 script 标签 | 控制内存占用 |
| SW Cache-First | shell 文件优先走缓存 | 二次访问 <10ms |
| SW SWR | tools/*.js 先缓存后台更新 | 工具即时可用且保持最新 |
| 分类懒渲染 | IntersectionObserver 分类进视口才渲染卡片 | 首屏 DOM 节点更少 |

### 优化建议

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 高 | dashboard.js 单文件 49KB，全量解析 | 按模块拆分（搜索/路由/渲染），空闲时加载非核心模块 |
| 高 | CSS 三文件合计 71KB | 开启 Brotli/Gzip；生产构建合并压缩 |
| 中 | 工具无预加载优先级控制 | 对「收藏」和「最近使用」工具提升预取优先级 |
| 中 | SW 版本需手动改 dtb-v1 | 构建时自动生成 cache key（文件 hash）|
| 低 | hover 预取无节流 | 已限制并发≤3，可追加 debounce 100ms |

---

## 2. 运行时性能

### 当前策略

| 优化点 | 实现方式 |
|--------|----------|
| 搜索防抖 | 100ms 防抖，避免每次按键全量过滤 |
| 用量写盘防抖 | 2s 防抖批量写 localStorage |
| 就地更新 | 收藏/主题切换不重渲染整页，仅更新对应 DOM |
| 分类过滤 | 内存中过滤 TOOLS[]，不触发网络 |
| historyStack | 内存模拟浏览器历史，无额外开销 |
| 分类常量预计算 | CATEGORIES/CAT_COUNTS 顶层常量，避免渲染时重复遍历 |

### 优化建议

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 高 | 首页切换分类时全量重渲染工具卡片 DOM | 增量更新：仅隐藏/显示对应分类节点 |
| 中 | 搜索评分全量遍历 TOOLS[]（73 次）| 构建倒排索引，O(1) 查找候选集 |
| 中 | 搜索下拉无条数上限 | 单分类最多 3 条，减少 DOM 节点 |
| 低 | 工具卡片 innerHTML 拼接 | 改用 DocumentFragment 批量插入 |

---

## 3. 渲染性能

### 当前策略

- 骨架屏：工具加载期间展示 loading 占位，避免布局跳动
- 顶部进度条：`#top-progress` 视觉反馈，不阻塞渲染
- 工具页切换：`#toolBody` innerHTML 整体替换，旧工具 DOM 自动 GC
- 主题切换：只改 `data-theme` 属性，CSS 变量自动响应，无 JS 重绘
- 侧边栏动画：CSS transition，GPU 合成层（transform），不触发 layout

### 优化建议

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 中 | 大量工具卡片同时渲染 | 虚拟列表或分批渲染（requestAnimationFrame 分帧）|
| 低 | 回到顶部 FAB 可能遮挡工具操作区 | 工具页隐藏 FAB，或增加 bottom offset |

---

## 4. 离线缓存

### 当前策略

```
Shell 文件（5个）：Cache-First
  → 离线时直接返回缓存，完全可用

tools/*.js：Stale-While-Revalidate
  → 有缓存先返回缓存（即时响应）
  → 同时后台 fetch 更新缓存
  → 无缓存时等待网络

其他（外部 CDN 等）：直接网络，不缓存
```

### 优化建议

| 优先级 | 问题 | 方案 |
|--------|------|------|
| 高 | SW 更新后无用户感知通知 | 消费 sw-updated 消息，展示「已更新，点击刷新」Toast |
| 中 | 工具文件首次访问仍需网络 | 对「最近使用」top 5 工具在 SW install 时预缓存 |
| 低 | cache key 硬编码 dtb-v1 | 接入构建 hash 自动生成版本 key |

---

## 5. 内存管理

### 当前策略

- LRU 上限 30：超过时移除最旧 script 标签 + 清除 `window[render]`
- 工具页切换：`#toolBody` innerHTML 替换，旧 DOM 自动 GC
- 用量计数防抖：2s 批量写，避免高频 localStorage IO

### 风险点

| 风险 | 说明 | 建议 |
|------|------|------|
| 工具事件泄漏 | 工具 JS 若在 window/document 绑定事件，驱逐 script 后仍存在 | 工具暴露 `window._activeCleanup()`，路由切换时调用 |
| setInterval 泄漏 | 5/5 有定时器工具已全部实现 `_activeCleanup`，路由切换统一调用 `window._activeCleanup?.()` | 已解决 |
| ~~ObjectURL 驻留~~ | ~~img-compress/img-webp 处理大图后 ObjectURL 未释放~~ | 已修复：img-compress/img-webp/qrcode 三个工具均已调用 `URL.revokeObjectURL()`，问题已解决 |
| localStorage 写放大 | 搜索每次 addSearchHistory 触发写盘 | 批量写或 debounce |
