var _mdTl = typeof makeToolI18n === 'function' ? makeToolI18n({
zh: {
title:        'Markdown 编辑器',
sample:       '示例',
copy_html:    '复制 HTML',
clear:        '清空',
toc:          'TOC',
codeblock:    '代码块',
list:         '列表',
ordered:      '有序',
quote:        '> 引用',
link:         '链接',
table:        '表格',
pane_md:      'Markdown',
pane_preview: '预览',
placeholder:  '# 标题',
html_copied:  'HTML 已复制',
toc_title:    '目录',
toc_empty:    '未检测到标题（h1-h3）',
},
en: {
title:        'Markdown Editor',
sample:       'Sample',
copy_html:    'Copy HTML',
clear:        'Clear',
toc:          'TOC',
codeblock:    'Code Block',
list:         'List',
ordered:      'Ordered',
quote:        '> Quote',
link:         'Link',
table:        'Table',
pane_md:      'Markdown',
pane_preview: 'Preview',
placeholder:  '# Title',
html_copied:  'HTML copied',
toc_title:    'Table of Contents',
toc_empty:    'No headings found (h1-h3)',
}
}) : function(k){ return k; };
function renderMarkdown(el) {
el.innerHTML = `
<div class="tool-card-panel" style="padding:0">
<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--glass-border);flex-wrap:wrap;gap:8px">
<div class="panel-label" style="margin:0">${_mdTl('title')}</div>
<div style="display:flex;gap:6px">
<button class="btn btn-secondary" onclick="mdLoadSample()">${_mdTl('sample')}</button>
<button class="btn btn-secondary" onclick="mdCopyHtml()">${_mdTl('copy_html')}</button>
<button class="btn btn-secondary" onclick="mdGenerateToc()">${_mdTl('toc')}</button>
<button class="btn btn-secondary" onclick="mdClear()">${_mdTl('clear')}</button>
</div>
</div>
<div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px 16px;border-bottom:1px solid var(--glass-border);background:rgba(0,0,0,0.1)">
<button class="btn btn-secondary" onclick="mdInsert('bold')" title="Ctrl+B" style="padding:3px 10px;font-size:12px;font-weight:700">B</button>
<button class="btn btn-secondary" onclick="mdInsert('italic')" title="Ctrl+I" style="padding:3px 10px;font-size:12px;font-style:italic">I</button>
<button class="btn btn-secondary" onclick="mdInsert('code')" title="Ctrl+backtick" style="padding:3px 10px;font-size:12px;font-family:monospace">code</button>
<button class="btn btn-secondary" onclick="mdInsert('codeblock')" style="padding:3px 10px;font-size:12px;font-family:monospace">${_mdTl('codeblock')}</button>
<button class="btn btn-secondary" onclick="mdInsert('h1')" style="padding:3px 10px;font-size:12px;font-weight:700">H1</button>
<button class="btn btn-secondary" onclick="mdInsert('h2')" style="padding:3px 10px;font-size:12px;font-weight:700">H2</button>
<button class="btn btn-secondary" onclick="mdInsert('h3')" style="padding:3px 10px;font-size:12px;font-weight:700">H3</button>
<button class="btn btn-secondary" onclick="mdInsert('ul')" style="padding:3px 10px;font-size:12px">${_mdTl('list')}</button>
<button class="btn btn-secondary" onclick="mdInsert('ol')" style="padding:3px 10px;font-size:12px">${_mdTl('ordered')}</button>
<button class="btn btn-secondary" onclick="mdInsert('quote')" style="padding:3px 10px;font-size:12px">${_mdTl('quote')}</button>
<button class="btn btn-secondary" onclick="mdInsert('link')" title="Ctrl+K" style="padding:3px 10px;font-size:12px">${_mdTl('link')}</button>
<button class="btn btn-secondary" onclick="mdInsert('table')" style="padding:3px 10px;font-size:12px">${_mdTl('table')}</button>
<button class="btn btn-secondary" onclick="mdInsert('hr')" style="padding:3px 10px;font-size:12px">---</button>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;height:460px">
<div style="display:flex;flex-direction:column;border-right:1px solid var(--glass-border)">
<div style="padding:6px 16px;font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid var(--glass-border)">${_mdTl('pane_md')}</div>
<textarea id="mdInput" style="flex:1;background:transparent;border:none;outline:none;padding:16px;color:var(--text);font-family:monospace;font-size:13px;line-height:1.7;resize:none" placeholder="${_mdTl('placeholder')}" oninput="mdUpdate()"></textarea>
</div>
<div style="display:flex;flex-direction:column">
<div style="padding:6px 16px;font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase;border-bottom:1px solid var(--glass-border)">${_mdTl('pane_preview')}</div>
<div id="mdPreview" style="flex:1;overflow-y:auto;padding:16px;font-size:14px;line-height:1.8;color:var(--text)"></div>
</div>
</div>
</div>
`;
document.getElementById('mdInput').addEventListener('keydown', function(e) {
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
e.preventDefault();
var ta = e.target, v = ta.value, s = ta.selectionStart;
var lineStart = v.lastIndexOf('\n', s - 1) + 1;
var lineEnd = v.indexOf('\n', s);
if (lineEnd === -1) lineEnd = v.length;
else lineEnd += 1; 
ta.value = v.slice(0, lineStart) + v.slice(lineEnd);
ta.selectionStart = ta.selectionEnd = Math.min(lineStart, ta.value.length);
mdUpdate();
return;
}
if (e.ctrlKey || e.metaKey) {
if (e.key === 'b') { e.preventDefault(); mdInsert('bold'); }
else if (e.key === 'i') { e.preventDefault(); mdInsert('italic'); }
else if (e.key === 'k') { e.preventDefault(); mdInsert('link'); }
}
if (e.key === 'Tab') {
e.preventDefault();
var ta = e.target, s = ta.selectionStart, en = ta.selectionEnd;
if (e.shiftKey) {
var lineStart = ta.value.lastIndexOf('\n', s - 1) + 1;
var lineText = ta.value.slice(lineStart);
var removed = 0;
if (lineText.startsWith('  '))      removed = 2;
else if (lineText.startsWith(' '))  removed = 1;
if (removed) {
ta.value = ta.value.slice(0, lineStart) + ta.value.slice(lineStart + removed);
ta.selectionStart = Math.max(lineStart, s - removed);
ta.selectionEnd   = Math.max(lineStart, en - removed);
}
} else {
ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
ta.selectionStart = ta.selectionEnd = s + 2;
}
mdUpdate();
}
});
}
function mdUpdate() {
var text = document.getElementById('mdInput').value;
document.getElementById('mdPreview').innerHTML = _mdParse(text);
_mdBindCheckboxes();
}
function _mdSafeUrl(url) {
var trimmed = url.trim().toLowerCase();
if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) return '';
return url.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}
function _mdSlug(text) {
return text.trim().toLowerCase()
.replace(/<[^>]+>/g, '')           
.replace(/[^\w\u4e00-\u9fff -]/g, '') 
.replace(/\s+/g, '-')
.replace(/-+/g, '-')
.replace(/^-|-$/g, '');
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
var _mdCheckboxIdx = 0;
html = html
.replace(/^### (.+)$/gm, function(_,t){ return '<h3 id="md-h-'+_mdSlug(t)+'" style="font-size:16px;font-weight:700;margin:16px 0 8px">'+t+'</h3>'; })
.replace(/^## (.+)$/gm,  function(_,t){ return '<h2 id="md-h-'+_mdSlug(t)+'" style="font-size:20px;font-weight:700;margin:20px 0 10px">'+t+'</h2>'; })
.replace(/^# (.+)$/gm,   function(_,t){ return '<h1 id="md-h-'+_mdSlug(t)+'" style="font-size:24px;font-weight:800;margin:24px 0 12px">'+t+'</h1>'; })
.replace(/^---+$/gm,'<hr style="border:none;border-top:1px solid var(--glass-border);margin:16px 0">')
.replace(/^> (.+)$/gm,'<blockquote style="border-left:3px solid var(--accent);padding:4px 0 4px 16px;margin:8px 0;color:var(--text-muted)">$1</blockquote>')
.replace(/^- \[x\] (.+)$/gm, function(_,content) {
var idx = _mdCheckboxIdx++;
return '<li style="margin:4px 0;list-style:none"><span class="md-cb" data-cb-index="'+idx+'" data-cb-checked="1" style="cursor:pointer;user-select:none">&#x2705;</span> '+content+'</li>';
})
.replace(/^- \[ \] (.+)$/gm, function(_,content) {
var idx = _mdCheckboxIdx++;
return '<li style="margin:4px 0;list-style:none"><span class="md-cb" data-cb-index="'+idx+'" data-cb-checked="0" style="cursor:pointer;user-select:none">&#x2B1C;</span> '+content+'</li>';
})
.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
.replace(/\*(.+?)\*/g,'<em>$1</em>')
.replace(/~~(.+?)~~/g,'<del>$1</del>')
.replace(/!\[(.+?)\]\((.+?)\)/g, function(_,alt,url) {
var safe = _mdSafeUrl(url);
if (!safe) return alt;
return '<img src="'+safe+'" alt="'+alt.replace(/"/g,'&quot;')+'" style="max-width:100%;border-radius:6px">';
})
.replace(/\[(.+?)\]\((.+?)\)/g, function(_,text,url) {
var safe = _mdSafeUrl(url);
if (!safe) return text;
return '<a href="'+safe+'" style="color:var(--accent)" target="_blank" rel="noopener noreferrer">'+text+'</a>';
})
.replace(/^- (.+)$/gm,'<li style="margin:4px 0;padding-left:4px"><span style="color:var(--accent);margin-right:6px">&bull;</span>$1</li>')
.replace(/^\d+\. (.+)$/gm,'<li style="margin:4px 0;padding-left:4px">$1</li>')
.replace(/\n{2,}/g,'<br><br>');
blocks.forEach(function(b,i){html=html.replace('\x00B'+i+'\x00',b);});
inlines.forEach(function(b,i){html=html.replace('\x00I'+i+'\x00',b);});
return html;
}
function _mdBindCheckboxes() {
var preview = document.getElementById('mdPreview');
if (!preview) return;
var spans = preview.querySelectorAll('.md-cb');
spans.forEach(function(span) {
span.onclick = function() {
var ta = document.getElementById('mdInput');
if (!ta) return;
var cbIndex = parseInt(span.getAttribute('data-cb-index'), 10);
var isChecked = span.getAttribute('data-cb-checked') === '1';
var src = ta.value;
var re = /^- \[([ x])\] /gm;
var match, count = 0;
while ((match = re.exec(src)) !== null) {
if (count === cbIndex) {
var replaceStr = isChecked ? '- [ ] ' : '- [x] ';
ta.value = src.slice(0, match.index) + replaceStr + src.slice(match.index + match[0].length);
mdUpdate();
return;
}
count++;
}
};
});
}
function mdGenerateToc() {
var ta = document.getElementById('mdInput');
if (!ta) return;
var text = ta.value;
var lines = text.split('\n');
var tocLines = [];
for (var i = 0; i < lines.length; i++) {
var m;
if ((m = lines[i].match(/^(#{1,3}) (.+)$/))) {
var level = m[1].length; 
var title = m[2].trim();
var slug = _mdSlug(title);
var indent = '  '.repeat(level - 1);
tocLines.push(indent + '- [' + title + '](#md-h-' + slug + ')');
}
}
if (tocLines.length === 0) {
showToast(_mdTl('toc_empty'));
return;
}
var toc = '## ' + _mdTl('toc_title') + '\n\n' + tocLines.join('\n') + '\n\n';
var s = ta.selectionStart;
ta.value = ta.value.slice(0, s) + toc + ta.value.slice(s);
ta.selectionStart = ta.selectionEnd = s + toc.length;
ta.focus();
mdUpdate();
}
function mdInsert(type) {
var ta = document.getElementById('mdInput');
if (!ta) return;
var s = ta.selectionStart, e = ta.selectionEnd, sel = ta.value.slice(s, e);
var before = '', after = '', newCursor;
switch(type) {
case 'bold':      before = '**'; after = '**'; break;
case 'italic':    before = '*';  after = '*';  break;
case 'code':      before = '`';  after = '`';  break;
case 'codeblock': before = '```\n'; after = '\n```'; break;
case 'h1':        before = '# ';   break;
case 'h2':        before = '## ';  break;
case 'h3':        before = '### '; break;
case 'ul':        before = '- ';   break;
case 'ol':        before = '1. ';  break;
case 'quote':     before = '> ';   break;
case 'link':      before = '['; after = '](url)'; break;
case 'table':     before = '| Col1 | Col2 |\n| --- | --- |\n| A | B |'; break;
case 'hr':        before = '\n---\n'; break;
}
ta.value = ta.value.slice(0, s) + before + sel + (after || '') + ta.value.slice(e);
newCursor = s + before.length + sel.length;
ta.selectionStart = ta.selectionEnd = newCursor;
ta.focus();
mdUpdate();
}
function mdCopyHtml() {
navigator.clipboard.writeText(document.getElementById('mdPreview').innerHTML)
.then(function(){ showToast(_mdTl('html_copied')); });
}
function mdClear() {
document.getElementById('mdInput').value='';
document.getElementById('mdPreview').innerHTML='';
}
function mdLoadSample() {
document.getElementById('mdInput').value = '# DevToolbox\n\n## 简介\n\n> 全能开发工具箱，包含 **53** 个工具。\n\n## 特性\n\n- [x] 纯前端实现\n- [x] 支持深色/浅色主题\n- [ ] 更多功能规划中\n\n## 代码示例\n\n```js\nconst msg = \'Hello DevToolbox\'\nconsole.log(msg)\n```\n\n行内代码：`const x = 42`\n\n---\n\n*Built with love*';
mdUpdate();
}