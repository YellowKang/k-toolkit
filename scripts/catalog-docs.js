'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'public/tool-catalog.js'), 'utf8'), context);
const catalog = context.window.ToolCatalog;
const labels = { local: '本地处理', network: '联网请求', model: '模型服务', 'optional-network': '本地 / 可选联网' };
const lines = [
  '# 工具目录 / Tool catalog', '',
  '> 由 `npm run docs:catalog` 从 `public/tool-catalog.js` 生成；请勿手工修改。', '',
  `${catalog.tools.length} 个能力入口；${catalog.entries.length - 1} 个分类导航入口 + 1 个 AI 入口；${Object.keys(catalog.categories).length} 个分类；${catalog.workbenches.length} 组工作台。`, '',
  '工作台合并导航入口，各子工具仍使用原 ID。搜索、收藏、最近使用与 Agent 可以直接访问子工具。图片压缩、WebP 和图片 Base64 支持显式复用当前标签页暂存文件；其他工具仍保留独立输入。', '',
  '## 工作台 / Workbenches', '', '| 工作台 | 能力 ID（首项为主入口） |', '| --- | --- |',
  ...catalog.workbenches.map(group => `| ${group.name.zh} / ${group.name.en} | ${group.tools.map(id => '`' + id + '`').join(' · ')} |`), '',
  '## 保持独立的能力', '',
  '图片 Base64、EXIF、Favicon 具有不同输入输出；JWT、AES 与哈希的语义不同；JSON/YAML/TOML/CSV 的格式语义不同。本轮归类并关联入口，继续保留各自工具，不以减少卡片数量牺牲功能。', '',
];
for (const [category, meta] of Object.entries(catalog.categories)) {
  const tools = catalog.tools.filter(tool => tool.category === category);
  lines.push(`## ${category} / ${meta.en}`, '', `${tools.length} 项能力，${catalog.entries.filter(tool => tool.category === category).length} 个导航入口。`, '', '| 能力 | ID | 处理位置 | 工作台 |', '| --- | --- | --- | --- |');
  for (const tool of tools) lines.push(`| ${tool.name} | \`${tool.id}\` | ${labels[tool.execution]} | ${catalog.groupFor(tool.id)?.name.zh || '—'} |`);
  lines.push('');
}
lines.push('## AI 助手 / AI assistant', '', '`ai-chat`：用户配置的模型服务。发送给模型的对话、附件和工具上下文会离开浏览器。本地工具处理不等于所有功能都不联网。', '');
const output = lines.join('\n');
const target = path.join(root, 'docs/tool-catalog.md');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== output) {
    console.error('Tool catalog is outdated. Run npm run docs:catalog.'); process.exitCode = 1;
  }
} else {
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, output);
  console.log('Generated docs/tool-catalog.md');
}
