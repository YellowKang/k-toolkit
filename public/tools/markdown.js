function renderMarkdown(el) {
  el.innerHTML = `
    <div class="tool-card-panel" style="padding:0">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--glass-border);flex-wrap:wrap;gap:8px">
        <div class="panel-label" style="margin:0">Markdown 编辑器</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary" onclick="mdLoadSample()">示例</button>
          <button class="btn btn-secondary" onclick="mdCopyHtml()">复制 HTML</button>
          <button class="btn btn-secondary" onclick="mdClear()">清空</button>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 16px;border-bottom:1px solid var(--glass-border);background:rgba(0,0,0,0.1)">
        <button class="btn btn-secondary" onclick="mdInsert('bold')" title="Ctrl+B" style="padding:3px 10px;font-size:12px;font-weight:700">B</button>
        <button class="btn btn-secondary" onclick="mdInsert('italic')" title="Ctrl+I" style="padding:3px 10px;font-size:12px;font-style:italic">I</button>
        <button class="btn btn-secondary" onclick="mdInsert('code')" title="Ctrl+backtick" style="padding:3px 10px;font-size:12px;font-family:monospace">code</button>
        <button class="btn btn-secondary" onclick="mdInsert('codeblock')" style="padding:3px 10px;font-size:12px;font-family:monospace">代码块</button>
        <button class="btn btn-secondary" onclick="mdInsert('h1')" style="padding:3px 10px;font-size:12px;font-weight:700">H1</button>
        <button class="btn btn-secondary" onclick="mdInsert('h2')" style="padding:3px 10px;font-size:12px;font-weight:700">H2</button>
        <button class="btn btn-secondary" onclick="mdInsert('h3')" style="padding:3px 10px;font-size:12px;font-weight:700">H3</button>
        <button class="btn btn-secondary" onclick="mdInsert('ul')" style="padding:3px 10px;font-size:12px">列表</button>
        <button class="btn btn-secondary" onclick="mdInsert('ol')" style="padding:3px 10px;font-size:12px">有序</button>
        <button class="btn btn-secondary" onclick="mdInsert('quote')" style="padding:3px 10px;font-size:12px">&gt; 引用</button>
        <button class="btn btn-secondary" onclick="mdInsert('link')" title="Ctrl+K" style="padding:3px 10px;font-size:12px">链接</button>
        <button class="btn btn-secondary" onclick="mdInsert('table')" style="padding:3px 10px;font-size:12px">表格</button>
        <button class="btn btn-secondary" onclick="mdInsert('hr')" style="padding:3px 10px;font-size:12px">---</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;height:460px">
        <div style="display:flex;flex-direction:column;border-right:1px solid var(--glass-border)">
          <div style="padding:6px 16px;font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid var(--glass-border)">Markdown</div>
          <textarea id="mdInput" style="flex:1;background:transparent;border:none;outline:none;padding:16px;color:var(--text);font-family:monospace;font-size:13px;line-height:1.7;resize:none" placeholder="# 标题" oninput="mdUpdate()"></textarea>
        </div>
        <div style="display:flex;flex-direction:column">
          <div style="padding:6px 16px;font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid var(--glass-border)">预览</div>
          <div id="mdPreview" style="flex:1;overflow-y:auto;padding:16px;font-size:14px;line-height:1.8;color:var(--text)"></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('mdInput').addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); mdInsert('bold'); }
      else if (e.key === 'i') { e.preventDefault(); mdInsert('italic'); }
      else if (e.key === 'k') { e.preventDefault(); mdInsert('link'); }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target, s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      mdUpdate();
    }
  });
}

function mdUpdate() {
  var text = document.getElementById('mdInput').value;
  document.getElementById('mdPreview').innerHTML = _mdParse(text);
}

function _mdParse(text) {
  var html = text;
  var blocks = [];
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, function(_,c) {
    blocks.push('<pre style="background:rgba(0,0,0,0.35);border:1px solid var(--glass-border);border-radius:8px;padding:12px 16px;overflow-x:auto;font-size:12px"><code>'+c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</code></pre>');
    return '\x00B'+(blocks.length-1)+'\x00';
  });
  var inlines = [];
  html = html.replace(/`([^`]+)`/g, function(_,c) {
    inlines.push('<code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px;font-size:12px;color:var(--neon)">'+c.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</code>');
    return '\x00I'+(inlines.length-1)+'\x00';
  });
  html = html
    .replace(/^### (.+)$/gm,'<h3 style="font-size:16px;font-weight:700;margin:16px 0 8px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:20px;font-weight:700;margin:20px 0 10px">$1</h2>')
    .replace(/^# (.+)$/gm,  '<h1 style="font-size:24px;font-weight:800;margin:24px 0 12px">$1</h1>')
    .replace(/^---+$/gm,'<hr style="border:none;border-top:1px solid var(--glass-border);margin:16px 0">')
    .replace(/^> (.+)$/gm,'<blockquote style="border-left:3px solid var(--accent);padding:4px 0 4px 16px;margin:8px 0;color:var(--text-muted)">$1</blockquote>')
    .replace(/^- \[x\] (.+)$/gm,'<li style="margin:4px 0;list-style:none">&#x2705; $1</li>')
    .replace(/^- \[ \] (.+)$/gm,'<li style="margin:4px 0;list-style:none">&#x2B1C; $1</li>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>')
    .replace(/!\[(.+?)\]\((.+?)\)/g,'<img src="$2" alt="$1" style="max-width:100%;border-radius:6px">')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" style="color:var(--accent)" target="_blank">$1</a>')
    .replace(/^- (.+)$/gm,'<li style="margin:4px 0;padding-left:4px"><span style="color:var(--accent);margin-right:6px">&bull;</span>$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li style="margin:4px 0;padding-left:4px">$1</li>')
    .replace(/\n{2,}/g,'<br><br>');
  blocks.forEach(function(b,i){html=html.replace('\x00B'+i+'\x00',b);});
  inlines.forEach(function(b,i){html=html.replace('\x00I'+i+'\x00',b);});
  return html;
}

function mdCopyHtml() {
  navigator.clipboard.writeText(document.getElementById('mdPreview').innerHTML)
    .then(function(){ showToast('HTML 已复制'); });
}
function mdClear() {
  document.getElementById('mdInput').value='';
  document.getElementById('mdPreview').innerHTML='';
}
function mdLoadSample() {
  document.getElementById('mdInput').value = '# DevToolbox\n\n## 简介\n\n> 全能开发工具箱，包含 **53** 个工具。\n\n## 特性\n\n- [x] 纯前端实现\n- [x] 支持深色/浅色主题\n- [ ] 更多功能规划中\n\n## 代码示例\n\n```js\nconst msg = \'Hello DevToolbox\'\nconsole.log(msg)\n```\n\n行内代码：`const x = 42`\n\n---\n\n*Built with love*';
  mdUpdate();
}
