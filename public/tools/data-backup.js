/* ── 数据备份与迁移：导出 / 导入本机保存的收藏、设置、工具数据、AI 对话与配置；规则见 compute/backup.js ──
 * API 密钥只能加密导出（compute/secure-box.js），2FA 看板本身是密文、原样携带。所有预览文本用 textContent 渲染。 */

const _dbDict = {
  zh: {
    export_title: '导出备份', export_desc: '选择要备份的数据，导出为 JSON 文件或复制为文本，可在另一个浏览器或设备上导入恢复。',
    groups: {
      prefs: '偏好设置（语言、主题、侧栏、2FA 设置）', history: '收藏与使用记录', tools: '工具数据（便签、待办、倒计时、正则、HTTP 历史等）',
      chat: 'AI 对话记录', agent: 'AI 助手配置（不含 API 密钥）', apikeys: 'API 密钥（必须加密导出）', otp: '2FA 看板（本身已加密）',
    },
    items: n => `${n} 项`, none: '无数据',
    key_pw: '保护 API 密钥的备份密码（至少 8 位）', key_pw2: '再次输入备份密码',
    download: '下载备份文件', copy: '复制备份文本', exported: n => `已导出 ${n} 项数据`, copied: '备份文本已复制到剪贴板', copy_failed: '复制失败，请改用下载',
    pick_groups: '请至少选择一类数据', pw_short: '备份密码至少 8 位', pw_mismatch: '两次输入的备份密码不一致', encrypting: '正在加密 API 密钥…',
    import_title: '导入备份', drop: '点击选择或拖入备份文件（.json）', paste_ph: '或在这里粘贴备份文本', parse: '解析',
    meta: (at, v) => `备份时间：${at || '未知'} · 版本：${v || '未知'}`,
    import_groups: '选择要导入的数据', rejected: n => `已忽略 ${n} 项无法识别或格式错误的数据`,
    secret_found: '备份中包含加密的 API 密钥，输入备份密码可一并导入（可跳过）', unlock: '解密', unlocked: n => `已解密 ${n} 个 API 密钥`,
    mode: '导入方式', merge: '合并（推荐）：列表去重合并、计数相加，本机已有的设置保持不变', overwrite: '覆盖：用备份替换所选分组中的同名数据',
    overwrite_confirm: '覆盖会用备份替换本机所选分组中的数据，确定继续？', import: '导入',
    done: (w, s) => `已写入 ${w} 项${s ? `，跳过 ${s} 项` : ''}。刷新页面后生效。`, nothing: '本机数据已与备份一致，无需写入',
    skip_otp: '2FA 看板：本机已有看板，两个看板密码不同无法合并；请在 2FA 工具中用“导入”迁移账号，或选择“覆盖”',
    failed: n => `${n} 项写入失败（浏览器存储已满或不可用）`, reload: '立即刷新页面',
    errors: { empty: '没有内容可导入', 'too-large': '备份超过 5 MB', json: '不是有效的 JSON', format: '不是 K Toolkit 的备份文件', version: '不支持的备份版本', password: '备份密码错误', 'password-empty': '请输入备份密码' },
  },
  en: {
    export_title: 'Export a backup', export_desc: 'Choose what to back up, then download a JSON file or copy it as text to restore in another browser or on another device.',
    groups: {
      prefs: 'Preferences (language, theme, sidebar, 2FA settings)', history: 'Favorites and usage history', tools: 'Tool data (notes, to-dos, countdowns, regexes, HTTP history…)',
      chat: 'AI chat history', agent: 'AI assistant settings (without API keys)', apikeys: 'API keys (always encrypted)', otp: '2FA board (already encrypted)',
    },
    items: n => `${n} item${n === 1 ? '' : 's'}`, none: 'no data',
    key_pw: 'Backup password protecting the API keys (8+ characters)', key_pw2: 'Repeat the backup password',
    download: 'Download backup file', copy: 'Copy backup text', exported: n => `Exported ${n} item${n === 1 ? '' : 's'}`, copied: 'Backup text copied to the clipboard', copy_failed: 'Copy failed; download the file instead',
    pick_groups: 'Choose at least one kind of data', pw_short: 'The backup password needs at least 8 characters', pw_mismatch: 'The backup passwords do not match', encrypting: 'Encrypting API keys…',
    import_title: 'Import a backup', drop: 'Click to choose or drop a backup file (.json)', paste_ph: 'Or paste backup text here', parse: 'Parse',
    meta: (at, v) => `Backed up: ${at || 'unknown'} · version: ${v || 'unknown'}`,
    import_groups: 'Choose what to import', rejected: n => `Ignored ${n} unknown or malformed item${n === 1 ? '' : 's'}`,
    secret_found: 'The backup contains encrypted API keys. Enter its password to import them too (optional).', unlock: 'Decrypt', unlocked: n => `Decrypted ${n} API key${n === 1 ? '' : 's'}`,
    mode: 'Import mode', merge: 'Merge (recommended): lists are combined without duplicates, counters add up, local settings stay', overwrite: 'Overwrite: replace matching data in the chosen groups',
    overwrite_confirm: 'Overwrite replaces this browser\'s data in the chosen groups with the backup. Continue?', import: 'Import',
    done: (w, s) => `Wrote ${w} item${w === 1 ? '' : 's'}${s ? `, skipped ${s}` : ''}. Reload the page to apply.`, nothing: 'This browser already matches the backup; nothing to write',
    skip_otp: '2FA board: this browser already has one and two boards with different passwords cannot be merged; import accounts from the 2FA tool instead, or choose Overwrite',
    failed: n => `${n} item(s) could not be written (storage full or unavailable)`, reload: 'Reload now',
    errors: { empty: 'Nothing to import', 'too-large': 'The backup is larger than 5 MB', json: 'Not valid JSON', format: 'Not a K Toolkit backup', version: 'Unsupported backup version', password: 'Wrong backup password', 'password-empty': 'Enter the backup password' },
  },
};

const _db = { parsed: null, secret: null };
const _dbT = (key, ...args) => makeToolI18n(_dbDict)(key, ...args);
const _dbErr = e => _dbT('errors')[e?.code] || e?.message || String(e);
function _dbMsg(id, text, color = 'var(--text-muted)') {
  const el = document.getElementById(id);
  if (el) { el.textContent = text || ''; el.style.color = color; }
}
function _dbNode(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (typeof v === 'boolean') el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...children.filter(c => c !== null && c !== undefined));
  return el;
}

function renderDataBackup(el) {
  const T = makeToolI18n(_dbDict);
  _db.parsed = null; _db.secret = null;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('export_title')}</div>
      <p style="font-size:13px;color:var(--text-muted);margin:0 0 10px;line-height:1.6">${T('export_desc')}</p>
      <div id="dbGroups" style="display:flex;flex-direction:column;gap:8px"></div>
      <div id="dbKeyPw" style="display:none;gap:10px;flex-wrap:wrap;margin-top:10px">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-muted);flex:1;min-width:200px">${T('key_pw')}<input class="tool-input" type="password" id="dbPw1" autocomplete="new-password"></label>
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-muted);flex:1;min-width:200px">${T('key_pw2')}<input class="tool-input" type="password" id="dbPw2" autocomplete="new-password"></label>
      </div>
      <div class="tool-actions">
        <button type="button" class="btn btn-primary" onclick="dbExport('file')">${T('download')}</button>
        <button type="button" class="btn btn-secondary" onclick="dbExport('copy')">${T('copy')}</button>
      </div>
      <div id="dbExportMsg" role="status" style="font-size:13px;min-height:18px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('import_title')}</div>
      <div id="dbDrop" role="button" tabindex="0" style="border:2px dashed var(--glass-border);border-radius:12px;padding:22px;text-align:center;cursor:pointer;color:var(--text-muted);font-size:13px"
        onclick="document.getElementById('dbFile').click()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('dbFile').click()}">📦 ${T('drop')}</div>
      <input type="file" id="dbFile" accept=".json,application/json,text/plain" style="display:none" onchange="dbLoadFile(this.files[0]);this.value=''">
      <textarea class="tool-textarea" id="dbImportText" rows="4" spellcheck="false" style="margin-top:10px;font-family:monospace" placeholder="${T('paste_ph')}"></textarea>
      <div class="tool-actions"><button type="button" class="btn btn-primary" onclick="dbImportParse()">${T('parse')}</button></div>
      <div id="dbPreview"></div>
      <div id="dbImportMsg" role="status" style="font-size:13px;min-height:18px"></div>
    </div>`;
  const drop = document.getElementById('dbDrop');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--accent)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = 'var(--glass-border)'; });
  drop.addEventListener('drop', e => { e.preventDefault(); drop.style.borderColor = 'var(--glass-border)'; dbLoadFile(e.dataTransfer.files[0]); });
  _dbRenderGroups();
}

async function _dbRenderGroups() {
  const T = makeToolI18n(_dbDict);
  const backup = await ToolCompute.load('backup');
  const host = document.getElementById('dbGroups');
  if (!host) return;
  let inventory;
  try { inventory = backup.inventory(localStorage); } catch { inventory = Object.fromEntries(backup.GROUPS.map(id => [id, []])); }
  host.replaceChildren(...backup.GROUPS.map(id => {
    const items = inventory[id].reduce((n, entry) => n + entry.items, 0);
    const box = _dbNode('input', { type: 'checkbox', 'data-group': id, onchange: _dbKeyPwToggle });
    box.checked = !!inventory[id].length && backup.DEFAULT_GROUPS.includes(id);
    box.disabled = !inventory[id].length;
    return _dbNode('label', { class: 'opt-label', style: 'display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text)' }, box,
      _dbNode('span', {}, T('groups')[id]), _dbNode('span', { style: 'margin-left:auto;font-size:12px;color:var(--text-muted)' }, inventory[id].length ? T('items', items) : T('none')));
  }));
  _dbKeyPwToggle();
}

function _dbKeyPwToggle() {
  const on = !!document.querySelector('#dbGroups input[data-group="apikeys"]:checked');
  const box = document.getElementById('dbKeyPw');
  if (box) box.style.display = on ? 'flex' : 'none';
}

async function dbExport(kind) {
  const T = makeToolI18n(_dbDict);
  const groups = [...document.querySelectorAll('#dbGroups input[data-group]:checked')].map(b => b.dataset.group);
  if (!groups.length) return _dbMsg('dbExportMsg', T('pick_groups'), '#ef4444');
  const backup = await ToolCompute.load('backup');
  const { backup: file, secret } = backup.collect(localStorage, groups, { appVersion: document.querySelector('meta[name="toolkit-version"]')?.content || 'dev' });
  if (Object.keys(secret).length) {
    const pw = document.getElementById('dbPw1').value, pw2 = document.getElementById('dbPw2').value;
    if (pw.length < 8) return _dbMsg('dbExportMsg', T('pw_short'), '#ef4444');
    if (pw !== pw2) return _dbMsg('dbExportMsg', T('pw_mismatch'), '#ef4444');
    _dbMsg('dbExportMsg', T('encrypting'));
    const box = await ToolCompute.load('secure-box');
    file.secret = (await box.create(pw, JSON.stringify(secret))).envelope;
  }
  const count = Object.keys(file.data).length + Object.keys(secret).length;
  const text = JSON.stringify(file, null, 2);
  if (kind === 'copy') {
    try { await navigator.clipboard.writeText(text); _dbMsg('dbExportMsg', T('copied'), '#10b981'); }
    catch { _dbMsg('dbExportMsg', T('copy_failed'), '#ef4444'); }
    return;
  }
  const now = new Date();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = `k-toolkit-backup-${ToolCompute.localDate(now).replace(/-/g, '')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  _dbMsg('dbExportMsg', T('exported', count), '#10b981');
}

async function dbLoadFile(file) {
  if (!file) return;
  document.getElementById('dbImportText').value = (await file.text()).slice(0, 6 * 1024 * 1024);
  dbImportParse();
}

async function dbImportParse() {
  const T = makeToolI18n(_dbDict);
  const backup = await ToolCompute.load('backup');
  const preview = document.getElementById('dbPreview');
  preview.replaceChildren();
  _db.parsed = null; _db.secret = null;
  try { _db.parsed = backup.parse(document.getElementById('dbImportText').value); }
  catch (e) { return _dbMsg('dbImportMsg', _dbErr(e), '#ef4444'); }
  _dbMsg('dbImportMsg', '');
  _dbRenderPreview();
}

function _dbRenderPreview() {
  const T = makeToolI18n(_dbDict);
  const parsed = _db.parsed, preview = document.getElementById('dbPreview');
  if (!parsed || !preview) return;
  const backupGroups = new Map();
  const groupOf = window.KCompute.backup.groupOf;
  for (const key of [...Object.keys(parsed.data), ...Object.keys(_db.secret || {})]) {
    const g = groupOf(key);
    backupGroups.set(g, (backupGroups.get(g) || 0) + 1);
  }
  const exportedAt = parsed.exportedAt && !isNaN(Date.parse(parsed.exportedAt)) ? new Date(parsed.exportedAt).toLocaleString() : '';
  const groupList = _dbNode('div', { style: 'display:flex;flex-direction:column;gap:8px;margin:8px 0' },
    ...[...backupGroups].map(([id, n]) => {
      const box = _dbNode('input', { type: 'checkbox', 'data-import-group': id });
      box.checked = true;
      return _dbNode('label', { class: 'opt-label', style: 'display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text)' }, box,
        _dbNode('span', {}, T('groups')[id]), _dbNode('span', { style: 'margin-left:auto;font-size:12px;color:var(--text-muted)' }, T('items', n)));
    }));
  const parts = [
    _dbNode('div', { style: 'font-size:12px;color:var(--text-muted);margin-top:12px' }, T('meta', exportedAt, parsed.appVersion)),
    _dbNode('div', { style: 'font-weight:600;font-size:13px;margin-top:10px' }, T('import_groups')),
    groupList,
  ];
  if (parsed.rejected.length) parts.push(_dbNode('div', { style: 'font-size:12px;color:#f59e0b' }, T('rejected', parsed.rejected.length)));
  if (parsed.secret && !_db.secret) {
    const input = _dbNode('input', { class: 'tool-input', type: 'password', autocomplete: 'off', 'aria-label': T('secret_found') });
    const unlock = async () => {
      try {
        const [box, backup] = await Promise.all([ToolCompute.load('secure-box'), ToolCompute.load('backup')]);
        const { text } = await box.unlock(parsed.secret, input.value);
        _db.secret = backup.parseSecret(text).data;
        _dbRenderPreview();
        _dbMsg('dbImportMsg', T('unlocked', Object.keys(_db.secret).length), '#10b981');
      } catch (e) { _dbMsg('dbImportMsg', _dbErr(e), '#ef4444'); }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
    parts.push(_dbNode('div', { style: 'margin-top:8px;font-size:12px;color:var(--text-muted)' }, T('secret_found')),
      _dbNode('div', { style: 'display:flex;gap:8px;margin-top:6px;flex-wrap:wrap' }, input, _dbNode('button', { type: 'button', class: 'btn btn-secondary', onclick: unlock }, T('unlock'))));
  }
  const radio = (value, label) => {
    const input = _dbNode('input', { type: 'radio', name: 'dbMode', value });
    input.checked = value === 'merge';
    return _dbNode('label', { class: 'opt-label', style: 'display:flex;gap:8px;align-items:flex-start;font-size:13px;color:var(--text)' }, input, _dbNode('span', {}, label));
  };
  parts.push(_dbNode('div', { style: 'font-weight:600;font-size:13px;margin-top:12px' }, T('mode')),
    _dbNode('div', { style: 'display:flex;flex-direction:column;gap:6px;margin-top:6px' }, radio('merge', T('merge')), radio('overwrite', T('overwrite'))),
    _dbNode('div', { class: 'tool-actions' }, _dbNode('button', { type: 'button', class: 'btn btn-primary', id: 'dbImportGo', onclick: dbImportCommit }, T('import'))));
  preview.replaceChildren(...parts);
}

async function dbImportCommit() {
  const T = makeToolI18n(_dbDict);
  if (!_db.parsed) return;
  const groups = [...document.querySelectorAll('#dbPreview input[data-import-group]:checked')].map(b => b.dataset.importGroup);
  if (!groups.length) return _dbMsg('dbImportMsg', T('pick_groups'), '#ef4444');
  const mode = document.querySelector('input[name="dbMode"]:checked')?.value || 'merge';
  if (mode === 'overwrite' && !confirm(T('overwrite_confirm'))) return;
  const backup = await ToolCompute.load('backup');
  const { writes, skipped } = backup.plan(localStorage, { ..._db.parsed.data, ...(_db.secret || {}) }, { mode, groups });
  const { written, failed } = backup.apply(localStorage, writes);
  const preview = document.getElementById('dbPreview');
  const lines = [written || skipped.length ? T('done', written, skipped.length) : T('nothing')];
  if (skipped.some(s => s.reason === 'otp-exists')) lines.push(T('skip_otp'));
  if (failed.length) lines.push(T('failed', failed.length));
  preview.replaceChildren(
    ...lines.map((line, i) => _dbNode('div', { style: `font-size:13px;margin-top:8px;color:${i === 0 && !failed.length ? '#10b981' : '#f59e0b'}` }, line)),
    written ? _dbNode('div', { class: 'tool-actions' }, _dbNode('button', { type: 'button', class: 'btn btn-primary', onclick: () => location.reload() }, T('reload'))) : null);
  _dbMsg('dbImportMsg', '');
  _db.parsed = null; _db.secret = null;
  _dbRenderGroups();
}
