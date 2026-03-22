// 纯静态文件服务（本地开发用）
// 生产环境直接将 public/ 目录部署到 Nginx / GitHub Pages / Cloudflare Pages 等
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback：所有路径都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 DevToolbox 运行在 http://localhost:${PORT}`);
  console.log(`📁 静态文件目录: ${path.join(__dirname, 'public')}`);
});
