function renderGitCommit(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div class="panel-label">类型 Type</div>
          <select class="tool-input" id="gcType" onchange="gcPreview()">
            <option value="feat">✨ feat — 新功能</option>
            <option value="fix">🐛 fix — 修复 Bug</option>
            <option value="docs">📝 docs — 文档</option>
            <option value="style">💄 style — 样式/格式</option>
            <option value="refactor">♻️ refactor — 重构</option>
            <option value="perf">⚡ perf — 性能优化</option>
            <option value="test">✅ test — 测试</option>
            <option value="build">📦 build — 构建</option>
            <option value="ci">🔧 ci — CI/CD</option>
            <option value="chore">🔨 chore — 杂项</option>
            <option value="revert">⏪ revert — 回滚</option>
          </select>
        </div>
        <div>
          <div class="panel-label">作用域 Scope <span style="opacity:0.5">(可选)</span></div>
          <input class="tool-input" id="gcScope" placeholder="如 auth, api, ui" oninput="gcPreview()">
        </div>
      </div>
      <div style="margin-top:12px">
        <div class="panel-label">描述 Subject <span style="color:#ef4444" title="必填">*</span></div>
        <input class="tool-input" id="gcSubject" placeholder="简短说明（祈使句，不加句号）" oninput="gcPreview()" maxlength="72">
        <div id="gcSubjectLen" style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right">0 / 72</div>
      </div>
      <div style="margin-top:12px">
        <div class="panel-label">正文 Body <span style="opacity:0.5">(可选)</span></div>
        <textarea class="tool-textarea" id="gcBody" rows="3" placeholder="详细说明变更原因和内容" oninput="gcPreview()"></textarea>
      </div>
      <div style="margin-top:12px">
        <div class="panel-label">Footer <span style="opacity:0.5">(可选)</span></div>
        <input class="tool-input" id="gcFooter" placeholder="如 Closes #123, BREAKING CHANGE: ..." oninput="gcPreview()">
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;gap:12px">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="gcBreaking" onchange="gcPreview()"> ⚠️ Breaking Change
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="gcEmoji" checked onchange="gcPreview()"> 显示 Emoji
        </label>
      </div>
    </div>
    <div class="tool-card-panel" id="gcResult">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">预览</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="gcReset()">重置</button>
          <button class="btn btn-primary" id="gcCopyBtn" onclick="gcCopy()">复制</button>
        </div>
      </div>
      <pre class="result-box" id="gcPreviewBox" style="white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">Conventional Commits 速查</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
        ${[
          ['feat','✨','新功能、新特性'],
          ['fix','🐛','修复缺陷'],
          ['docs','📝','仅文档变更'],
          ['style','💄','不影响逻辑的格式'],
          ['refactor','♻️','非 feat/fix 的代码重构'],
          ['perf','⚡','性能改进'],
          ['test','✅','添加或修正测试'],
          ['chore','🔨','构建/工具链/辅助变更'],
        ].map(([t,e,d]) => `<div style="padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);border-radius:8px;cursor:pointer" onclick="document.getElementById('gcType').value='${t}';gcPreview()" title="点击选用">
          <div style="font-size:13px;font-weight:600;color:var(--text)">${e} ${t}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${d}</div>
        </div>`).join('')}
      </div>
    </div>`;

  document.getElementById('gcSubject').addEventListener('input', function() {
    document.getElementById('gcSubjectLen').textContent = this.value.length + ' / 72';
    const len = this.value.length;
    document.getElementById('gcSubjectLen').style.color = len > 60 ? (len > 72 ? '#ef4444' : '#f59e0b') : 'var(--text-muted)';
  });
  gcPreview();
}

const GC_EMOJI = { feat:'✨',fix:'🐛',docs:'📝',style:'💄',refactor:'♻️',perf:'⚡',test:'✅',build:'📦',ci:'🔧',chore:'🔨',revert:'⏪' };

function gcPreview() {
  const type = document.getElementById('gcType').value;
  const scope = document.getElementById('gcScope').value.trim();
  const subject = document.getElementById('gcSubject').value.trim();
  const body = document.getElementById('gcBody').value.trim();
  const footer = document.getElementById('gcFooter').value.trim();
  const breaking = document.getElementById('gcBreaking').checked;
  const emoji = document.getElementById('gcEmoji').checked;

  const scopePart = scope ? `(${scope})` : '';
  const breakMark = breaking ? '!' : '';
  const emojiPart = emoji ? (GC_EMOJI[type] || '') + ' ' : '';
  const header = subject
    ? `${emojiPart}${type}${scopePart}${breakMark}: ${subject}`
    : `${emojiPart}${type}${scopePart}${breakMark}: `;

  let msg = header;
  if (body) msg += '\n\n' + body;
  if (breaking && !footer.toLowerCase().includes('breaking change')) {
    msg += '\n\nBREAKING CHANGE: ' + (footer || '详述破坏性变更');
  } else if (footer) {
    msg += '\n\n' + footer;
  }

  document.getElementById('gcPreviewBox').textContent = msg;
}

function gcCopy() {
  const text = document.getElementById('gcPreviewBox').textContent;
  if (!text.trim()) return;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('gcCopyBtn');
    const orig = btn.textContent;
    btn.textContent = '✓ 已复制';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
  });
}

function gcReset() {
  ['gcScope','gcSubject','gcBody','gcFooter'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('gcBreaking').checked = false;
  document.getElementById('gcType').value = 'feat';
  gcPreview();
}
