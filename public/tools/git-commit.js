const _gcDict = {
  zh: {
    type: '类型 Type', scope: '作用域 Scope', subject: '描述 Subject', body: '正文 Body', optional: '(可选)', required: '必填',
    scope_ph: '如 auth, api, ui', subject_ph: '简短说明（祈使句，不加句号）', body_ph: '详细说明变更原因和内容', footer_ph: '如 Closes #123, BREAKING CHANGE: ...',
    show_emoji: '显示 Emoji', preview: '预览', reset: '重置', copy: '复制', copied: '✓ 已复制',
    cheatsheet: 'Conventional Commits 速查', pick: '点击选用', breaking_todo: '详述破坏性变更',
    types: { feat: '新功能', fix: '修复 Bug', docs: '文档', style: '样式/格式', refactor: '重构', perf: '性能优化', test: '测试', build: '构建', ci: 'CI/CD', chore: '杂项', revert: '回滚' },
    hints: { feat: '新功能、新特性', fix: '修复缺陷', docs: '仅文档变更', style: '不影响逻辑的格式', refactor: '非 feat/fix 的代码重构', perf: '性能改进', test: '添加或修正测试', chore: '构建/工具链/辅助变更' },
  },
  en: {
    type: 'Type', scope: 'Scope', subject: 'Subject', body: 'Body', optional: '(optional)', required: 'Required',
    scope_ph: 'e.g. auth, api, ui', subject_ph: 'Short summary (imperative, no trailing period)', body_ph: 'Explain why and what changed', footer_ph: 'e.g. Closes #123, BREAKING CHANGE: ...',
    show_emoji: 'Show emoji', preview: 'Preview', reset: 'Reset', copy: 'Copy', copied: '✓ Copied',
    cheatsheet: 'Conventional Commits cheat sheet', pick: 'Click to use', breaking_todo: 'describe the breaking change',
    types: { feat: 'New feature', fix: 'Bug fix', docs: 'Documentation', style: 'Formatting', refactor: 'Refactoring', perf: 'Performance', test: 'Tests', build: 'Build', ci: 'CI/CD', chore: 'Chores', revert: 'Revert' },
    hints: { feat: 'New feature or capability', fix: 'Fix a bug', docs: 'Documentation only', style: 'Formatting, no logic change', refactor: 'Restructure code, no feat/fix', perf: 'Faster or leaner code', test: 'Add or correct tests', chore: 'Build, tooling or other chores' },
  },
};

function renderGitCommit(el) {
  const T = makeToolI18n(_gcDict);
  const types = T('types'), hints = T('hints');
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div class="panel-label">${T('type')}</div>
          <select class="tool-input" id="gcType" onchange="gcPreview()">
            ${Object.keys(types).map(type => `<option value="${type}">${GC_EMOJI[type]} ${type} — ${types[type]}</option>`).join('')}
          </select>
        </div>
        <div>
          <div class="panel-label">${T('scope')} <span style="opacity:0.5">${T('optional')}</span></div>
          <input class="tool-input" id="gcScope" placeholder="${T('scope_ph')}" oninput="gcPreview()">
        </div>
      </div>
      <div style="margin-top:12px">
        <div class="panel-label">${T('subject')} <span style="color:#ef4444" title="${T('required')}">*</span></div>
        <input class="tool-input" id="gcSubject" placeholder="${T('subject_ph')}" oninput="gcPreview()" maxlength="72">
        <div id="gcSubjectLen" style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right">0 / 72</div>
      </div>
      <div style="margin-top:12px">
        <div class="panel-label">${T('body')} <span style="opacity:0.5">${T('optional')}</span></div>
        <textarea class="tool-textarea" id="gcBody" rows="3" placeholder="${T('body_ph')}" oninput="gcPreview()"></textarea>
      </div>
      <div style="margin-top:12px">
        <div class="panel-label">Footer <span style="opacity:0.5">${T('optional')}</span></div>
        <input class="tool-input" id="gcFooter" placeholder="${T('footer_ph')}" oninput="gcPreview()">
      </div>
      <div style="margin-top:12px;display:flex;align-items:center;gap:12px">
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="gcBreaking" onchange="gcPreview()"> ⚠️ Breaking Change
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="gcEmoji" checked onchange="gcPreview()"> ${T('show_emoji')}
        </label>
      </div>
    </div>
    <div class="tool-card-panel" id="gcResult">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('preview')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" onclick="gcReset()">${T('reset')}</button>
          <button class="btn btn-primary" id="gcCopyBtn" onclick="gcCopy()">${T('copy')}</button>
        </div>
      </div>
      <pre class="result-box" id="gcPreviewBox" style="white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('cheatsheet')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px">
        ${Object.keys(hints).map(t => `<div style="padding:8px 10px;background:rgba(255,255,255,0.03);border:1px solid var(--glass-border);border-radius:8px;cursor:pointer" onclick="document.getElementById('gcType').value='${t}';gcPreview()" title="${T('pick')}">
          <div style="font-size:13px;font-weight:600;color:var(--text)">${GC_EMOJI[t]} ${t}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${hints[t]}</div>
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
    msg += '\n\nBREAKING CHANGE: ' + (footer || makeToolI18n(_gcDict)('breaking_todo'));
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
    btn.textContent = makeToolI18n(_gcDict)('copied');
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
