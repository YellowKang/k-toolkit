// ── i18n ──
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
    edit: '编辑', split: '分栏', view: '预览', refresh: '更新预览',
    ready: '预览已同步', pending: '等待更新…', composing: '输入中…',
    manual: '长文已暂停自动预览，点击「更新预览」查看最新内容',
    empty: '在左侧输入 Markdown，或载入示例开始',
    draft: '草稿仅保留在当前标签页，刷新后清除',
    chars: '字符', lines: '行', copy_failed: '复制失败，请允许剪贴板权限后重试',
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
    edit: 'Edit', split: 'Split', view: 'Preview', refresh: 'Update preview',
    ready: 'Preview is up to date', pending: 'Waiting to update…', composing: 'Composing…',
    manual: 'Auto preview paused for this large document. Select Update preview.',
    empty: 'Write Markdown in the editor, or load the sample to get started',
    draft: 'Draft stays in this tab and clears on refresh',
    chars: 'characters', lines: 'lines', copy_failed: 'Copy failed. Allow clipboard access and try again.',
  }
}) : function(k){ return k; };

var _mdSession = { text: '', mode: null };
var _mdView = null;
var _MD_AUTO_LIMIT = 100000;

function renderMarkdown(el) {
  if (!document.getElementById('mdStyles')) {
    var css = document.createElement('link');
    css.id = 'mdStyles'; css.rel = 'stylesheet';
    css.href = 'tools/markdown.css?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
    document.head.appendChild(css);
  }
  el.innerHTML = `
    <section class="tool-card-panel md-workspace" aria-label="${_mdTl('title')}">
      <div class="md-toolbar">
        <div class="md-modes" role="group" aria-label="${_mdTl('title')}">
          <button type="button" class="md-mode" data-md-mode="edit" onclick="mdSetMode('edit')">${_mdTl('edit')}</button>
          <button type="button" class="md-mode md-split" data-md-mode="split" onclick="mdSetMode('split')">${_mdTl('split')}</button>
          <button type="button" class="md-mode" data-md-mode="preview" onclick="mdSetMode('preview')">${_mdTl('view')}</button>
        </div>
        <div class="md-actions">
          <button class="btn btn-secondary" onclick="mdLoadSample()">${_mdTl('sample')}</button>
          <button class="btn btn-secondary" onclick="mdCopyHtml()">${_mdTl('copy_html')}</button>
          <button class="btn btn-secondary" onclick="mdGenerateToc()">${_mdTl('toc')}</button>
          <button class="btn btn-secondary" onclick="mdClear()">${_mdTl('clear')}</button>
        </div>
      </div>
      <div class="md-formatting" role="group" aria-label="Markdown">
        <button class="btn btn-secondary" onclick="mdInsert('bold')" aria-label="Bold" title="Ctrl / ⌘ B" style="font-weight:700">B</button>
        <button class="btn btn-secondary" onclick="mdInsert('italic')" aria-label="Italic" title="Ctrl / ⌘ I" style="font-style:italic">I</button>
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
      <div class="md-panes">
        <div class="md-editor-pane">
          <label class="md-pane-label" for="mdInput">${_mdTl('pane_md')}</label>
          <textarea id="mdInput" spellcheck="false" aria-describedby="mdDraftHint" placeholder="${_mdTl('placeholder')}"></textarea>
        </div>
        <div class="md-preview-pane">
          <div class="md-pane-label" id="mdPreviewLabel">${_mdTl('pane_preview')}</div>
          <div id="mdPreview" role="region" aria-labelledby="mdPreviewLabel" tabindex="0" data-empty="${_mdTl('empty')}"></div>
        </div>
      </div>
      <div class="md-statusbar">
        <span id="mdCount"></span>
        <span id="mdStatus" role="status" aria-live="polite"></span>
        <button class="btn btn-secondary" id="mdRefresh" onclick="mdUpdate()">${_mdTl('refresh')}</button>
      </div>
    </section>
    <p class="workspace-notice" id="mdDraftHint">${_mdTl('draft')}</p>
  `;
  var input = el.querySelector('#mdInput');
  var view = _mdView = { root: el.querySelector('.md-workspace'), input: input, preview: el.querySelector('#mdPreview'), timer: null, composing: false, rendered: null };
  input.value = _mdSession.text;
  input.addEventListener('input', mdSchedule);
  input.addEventListener('compositionstart', function() { view.composing = true; clearTimeout(view.timer); _mdStatus('composing'); });
  input.addEventListener('compositionend', function() { view.composing = false; mdSchedule(); });
  view.preview.addEventListener('click', _mdPreviewClick);
  view.preview.addEventListener('keydown', function(e) {
    if (e.target.matches('.md-cb') && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); _mdToggleCheckbox(e.target); }
  });
  var media = matchMedia('(max-width: 768px)');
  function adapt() { mdSetMode(media.matches && _mdSession.mode !== 'preview' ? 'edit' : (_mdSession.mode || 'split'), false); }
  media.addEventListener('change', adapt);
  adapt();
  mdSchedule();
  window._activeCleanup = function() {
    _mdSession.text = input.value;
    clearTimeout(view.timer);
    media.removeEventListener('change', adapt);
    if (_mdView === view) _mdView = null;
  };
  input.addEventListener('keydown', function(e) {
    if (e.isComposing || e.keyCode === 229) return;
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
      // Ctrl+Shift+K: delete current line
      e.preventDefault();
      var ta = e.target, v = ta.value, s = ta.selectionStart;
      var lineStart = v.lastIndexOf('\n', s - 1) + 1;
      var lineEnd = v.indexOf('\n', s);
      if (lineEnd === -1) lineEnd = v.length;
      else lineEnd += 1; // include the newline
      ta.value = v.slice(0, lineStart) + v.slice(lineEnd);
      ta.selectionStart = ta.selectionEnd = Math.min(lineStart, ta.value.length);
      mdUpdate();
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); mdInsert('bold'); }
      else if (e.key === 'i') { e.preventDefault(); mdInsert('italic'); }
      else if (e.key === 'k') { e.preventDefault(); mdInsert('link'); }
      else if (e.key === 'Enter') { e.preventDefault(); mdUpdate(); }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      var ta = e.target, s = ta.selectionStart, en = ta.selectionEnd;
      if (e.shiftKey) {
        // Shift+Tab: un-indent (remove up to 2 leading spaces from current line)
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

function _mdStatus(key) {
  if (!_mdView) return;
  var status = _mdView.root.querySelector('#mdStatus');
  var message = _mdTl(key);
  if (status.textContent !== message) status.textContent = message;
  _mdView.root.querySelector('#mdRefresh').hidden = key !== 'manual';
}

function _mdCount(text) {
  var lines = text ? 1 : 0;
  for (var i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) lines++;
  _mdView.root.querySelector('#mdCount').textContent = text.length.toLocaleString() + ' ' + _mdTl('chars') + ' · ' + lines.toLocaleString() + ' ' + _mdTl('lines');
}

function mdSetMode(mode, remember) {
  if (!_mdView) return;
  if (remember !== false) _mdSession.mode = mode;
  _mdView.root.dataset.mode = mode;
  _mdView.root.querySelectorAll('[data-md-mode]').forEach(function(button) { button.setAttribute('aria-pressed', String(button.dataset.mdMode === mode)); });
  if (mode !== 'edit' && remember !== false) mdUpdate();
}

function mdSchedule() {
  var view = _mdView;
  if (!view) return;
  clearTimeout(view.timer);
  if (view.composing) return;
  var text = view.input.value;
  _mdSession.text = text;
  // Large documents remain editable without reparsing on every pause.
  if (text.length > _MD_AUTO_LIMIT) {
    _mdStatus('manual');
    view.timer = setTimeout(function() { if (_mdView === view) _mdCount(view.input.value); }, 180);
    return;
  }
  _mdStatus('pending');
  view.timer = setTimeout(function() { if (_mdView === view) mdUpdate(); }, 180);
}

function mdUpdate() {
  var view = _mdView;
  if (!view || !view.input.isConnected || view.composing) return;
  clearTimeout(view.timer);
  var text = view.input.value;
  _mdSession.text = text;
  if (view.rendered !== text) {
    var scroll = view.preview.scrollTop;
    view.preview.replaceChildren(_mdSanitize(_mdParse(text)));
    view.preview.scrollTop = scroll;
    view.rendered = text;
  }
  _mdCount(text);
  _mdStatus('ready');
}

// Markdown may embed raw HTML from untrusted sources (READMEs, docs): keep a safe allowlist, drop scripts and handlers.
var _MD_TAGS = new Set(['a','b','strong','i','em','del','s','u','mark','code','pre','kbd','samp','sup','sub','br','hr','p','div','span',
  'ul','ol','li','blockquote','h1','h2','h3','h4','h5','h6','table','thead','tbody','tfoot','tr','th','td','img','details','summary','dl','dt','dd','abbr','small']);
var _MD_ATTRS = new Set(['href','src','alt','title','style','class','id','colspan','rowspan','align','target','rel','open','width','height','data-cb-index','data-cb-checked','role','tabindex','aria-checked']);
function _mdSanitize(html) {
  var tpl = document.createElement('template');
  tpl.innerHTML = html; // template content is inert: nothing loads or runs while we clean it
  (function clean(node) {
    Array.from(node.childNodes).forEach(function(child) {
      if (child.nodeType === 8) { child.remove(); return; }
      if (child.nodeType !== 1) return;
      var tag = child.localName;
      if (!_MD_TAGS.has(tag)) {
        // Unknown but harmless containers keep their text; active content is dropped entirely.
        if (/^(script|style|iframe|object|embed|frame|frameset|link|meta|base|form|input|button|textarea|select|svg|math|template|noscript|audio|video|source|track|canvas)$/.test(tag)) child.remove();
        else { clean(child); child.replaceWith.apply(child, Array.from(child.childNodes)); }
        return;
      }
      Array.from(child.attributes).forEach(function(attr) {
        var name = attr.name.toLowerCase();
        if (!_MD_ATTRS.has(name)) { child.removeAttribute(attr.name); return; }
        if (name === 'href' || name === 'src') {
          var url = attr.value.trim().replace(/[\u0000- ]/g, '').toLowerCase();
          if (!/^(https?:|mailto:|#|\/|\.\/|\.\.\/)/.test(url) && /^[a-z][a-z0-9+.-]*:/.test(url)) child.removeAttribute(attr.name);
        }
        if (name === 'style' && /url\s*\(|expression\s*\(|javascript:/i.test(attr.value)) child.removeAttribute(attr.name);
      });
      if (tag === 'a') {
        child.setAttribute('rel', 'noopener noreferrer');
        if ((child.getAttribute('href') || '').startsWith('#md-h-')) child.removeAttribute('target');
        else child.setAttribute('target', '_blank');
      }
      clean(child);
    });
  })(tpl.content);
  return tpl.content;
}

function _mdSafeUrl(url) {
  var trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) return '';
  return url.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}

// Generate slug from heading text for anchor ids
function _mdSlug(text) {
  return text.trim().toLowerCase()
    .replace(/<[^>]+>/g, '')           // strip HTML tags from parsed inline
    .replace(/[^\w\u4e00-\u9fff -]/g, '') // keep word chars, CJK, spaces, hyphens
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
function _mdHeadingId(text, counts) {
  var slug = _mdSlug(text) || 'section';
  var count = (counts.get(slug) || 0) + 1;
  counts.set(slug, count);
  return 'md-h-' + slug + (count > 1 ? '-' + count : '');
}

function _mdParse(text) {
  // Reserve internal placeholders so literal NUL text cannot impersonate a token.
  var html = text.replace(/\x00/g, '\ufffd');
  var blocks = [];
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, function(_,c) {
    blocks.push('<pre><code>'+c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</code></pre>');
    return '\x00B'+(blocks.length-1)+'\x00';
  });
  var inlines = [], inlineText = [];
  html = html.replace(/`([^`]+)`/g, function(_,c) {
    inlineText.push(c);
    inlines.push('<code>'+c.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</code>');
    return '\x00I'+(inlines.length-1)+'\x00';
  });
  // track checkbox index for clickable toggling
  var _mdCheckboxIdx = 0;
  var headings = new Map();
  html = html
    .replace(/^(#{1,3}) (.+)$/gm, function(_,marks,title) {
      var level=marks.length, plain=title.replace(/\x00I(\d+)\x00/g,function(_,i){return inlineText[Number(i)];});
      return '<h'+level+' id="'+_mdHeadingId(plain,headings)+'">'+title+'</h'+level+'>';
    })
    .replace(/^---+$/gm,'<hr style="border:none;border-top:1px solid var(--glass-border);margin:16px 0">')
    .replace(/^> (.+)$/gm,'<blockquote style="border-left:3px solid var(--accent);padding:4px 0 4px 16px;margin:8px 0;color:var(--text-muted)">$1</blockquote>')
    .replace(/^- \[([ x])\] (.+)$/gm, function(_,checked,content) {
      var idx = _mdCheckboxIdx++;
      return '<li class="md-task"><span class="md-cb" role="checkbox" tabindex="0" aria-checked="'+(checked === 'x')+'" data-cb-index="'+idx+'" data-cb-checked="'+(checked === 'x' ? '1' : '0')+'">'+(checked === 'x' ? '&#9745;' : '&#9744;')+'</span> '+content+'</li>';
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
    .replace(/^\|(.+)\|\r?\n\|([ :|-]+)\|((?:\r?\n\|[^\n]*\|)*)/gm, function(all, header, separator, rows) {
      var separators = separator.split('|').map(function(cell) { return cell.trim(); });
      if (!separators.every(function(cell) { return /^:?-{3,}:?$/.test(cell); })) return all;
      function row(cells, tag) { return '<tr>' + cells.split('|').map(function(cell) { return '<'+tag+'>'+cell.trim()+'</'+tag+'>'; }).join('') + '</tr>'; }
      return '<table><thead>'+row(header, 'th')+'</thead><tbody>'+rows.trim().split('\n').filter(Boolean).map(function(line) { return row(line.trim().slice(1,-1), 'td'); }).join('')+'</tbody></table>';
    })
    .replace(/\n{2,}/g,'<br><br>');
  // Two linear passes instead of rescanning the entire document for every code span.
  html = html.replace(/\x00B(\d+)\x00/g, function(_, i) { return blocks[Number(i)]; });
  html = html.replace(/\x00I(\d+)\x00/g, function(_, i) { return inlines[Number(i)]; });
  html = html.replace(/(<\/(?:h[1-6]|pre|blockquote|li|table)>)(?:\s*<br>)+/g, '$1')
    .replace(/(?:<br>\s*)+(<(?:h[1-6]|pre|blockquote|li|table|hr)\b)/g, '$1');
  return html;
}

function _mdPreviewClick(e) {
  var checkbox = e.target.closest('.md-cb');
  if (checkbox) { _mdToggleCheckbox(checkbox); return; }
  var link = e.target.closest('a[href^="#md-h-"]');
  if (!link || !_mdView) return;
  e.preventDefault();
  var id = link.getAttribute('href').slice(1);
  var heading = Array.from(_mdView.preview.querySelectorAll('[id]')).find(function(el) { return el.id === id; });
  if (heading) {
    heading.scrollIntoView({ block: 'nearest' });
    heading.setAttribute('tabindex','-1'); heading.focus({ preventScroll: true });
  }
}

function _mdToggleCheckbox(span) {
  if (!_mdView) return;
  var index = Number(span.dataset.cbIndex), count = 0;
  // A stale preview must not toggle a different task after source edits.
  if (_mdView.rendered !== _mdView.input.value) { mdUpdate(); return; }
  _mdView.input.value = _mdView.input.value.replace(/```[\w]*\n?[\s\S]*?```|^- \[([ x])\] /gm, function(match, checked) {
    if (checked === undefined) return match;
    return count++ === index ? (checked === 'x' ? '- [ ] ' : '- [x] ') : match;
  });
  mdUpdate();
  var updated = _mdView.preview.querySelector('[data-cb-index="'+index+'"]');
  if (updated) updated.focus({ preventScroll:true });
}

// Generate TOC from markdown source and insert at cursor
function mdGenerateToc() {
  var ta = document.getElementById('mdInput');
  if (!ta) return;
  var text = ta.value;
  var lines = text.replace(/```[\w]*\n?[\s\S]*?```/g, '').split('\n');
  var tocLines = [];
  var headings = new Map();
  for (var i = 0; i < lines.length; i++) {
    var m;
    if ((m = lines[i].match(/^(#{1,3}) (.+)$/))) {
      var level = m[1].length; // 1, 2, or 3
      var title = m[2].trim();
      var id = _mdHeadingId(title,headings);
      var indent = '  '.repeat(level - 1);
      tocLines.push(indent + '- [' + title + '](#' + id + ')');
    }
  }
  if (tocLines.length === 0) {
    showToast(_mdTl('toc_empty'));
    return;
  }
  var toc = '**' + _mdTl('toc_title') + '**\n\n' + tocLines.join('\n') + '\n\n';
  // insert at cursor position
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
  mdUpdate();
  var html = document.getElementById('mdPreview').innerHTML;
  if (!navigator.clipboard?.writeText) { showToast(_mdTl('copy_failed'), 'error'); return; }
  navigator.clipboard.writeText(html)
    .then(function(){ showToast(_mdTl('html_copied')); })
    .catch(function(){ showToast(_mdTl('copy_failed'), 'error'); });
}
function mdClear() {
  document.getElementById('mdInput').value='';
  mdUpdate();
}
function mdLoadSample() {
  document.getElementById('mdInput').value = getCurrentLang() === 'en'
    ? '# A space for your ideas\n\nWrite, preview, and keep going. **K Toolkit** keeps your tools close at hand.\n\n## Start here\n\n- [x] Write in Markdown\n- [ ] Preview your work\n- [ ] Copy the HTML\n\n## A little code\n\n```js\nconst message = "Hello, K Toolkit";\nconsole.log(message);\n```\n\n> Your draft stays in this tab.\n\n| View | Use it for |\n| --- | --- |\n| Split | Write and preview |\n| Preview | Read without distractions |'
    : '# 让想法，在这里成形\n\n用 **Markdown** 记录灵感、整理文档，把精力留给内容。\n\n## 从一份清单开始\n\n- [x] 写下今天的想法\n- [ ] 预览排版效果\n- [ ] 复制 HTML，继续创作\n\n## 一小段代码\n\n```js\nconst message = "Hello, K Toolkit";\nconsole.log(message);\n```\n\n> 草稿会保留在当前标签页，方便随时切换工具。\n\n| 视图 | 适合的场景 |\n| --- | --- |\n| 分栏 | 边写边看 |\n| 预览 | 专注阅读 |';
  mdUpdate();
}
