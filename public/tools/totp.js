/* ── 2FA 工具：账号看板（主密码加密保存）+ 快速计算 + 生成密钥 ──
 * 算法见 compute/otp.js，加密见 compute/secure-box.js。密钥只在解锁后的内存中出现，
 * 所有账号文本用 textContent 渲染；Agent 能力表标记 autoRun:false 且不登记 runner，读不到本页内容。 */

const _tfDict = {
  zh: {
    tab_vault: '🔐 账号看板', tab_quick: '⚡ 快速计算', tab_generate: '✨ 生成密钥',
    setup_title: '创建 2FA 看板', setup_desc: '设置一个主密码，账号密钥会用它加密（PBKDF2 60 万次 + AES-GCM）后保存在本机浏览器。主密码不会被保存，忘记后无法找回，请定期导出加密备份。',
    pw: '主密码（至少 8 位）', pw2: '再次输入主密码', create: '创建看板', creating: '正在加密…',
    pw_short: '主密码至少 8 位', pw_mismatch: '两次输入的主密码不一致',
    strength: s => ['强度：弱', '强度：一般', '强度：较强', '强度：强'][s],
    unlock_title: '解锁 2FA 看板', unlock_pw: '输入主密码', unlock: '解锁', unlocking: '正在解锁…', wrong_pw: '主密码错误',
    forgot: '忘记主密码？', forgot_desc: '主密码无法找回。只能清空看板后重新创建，并从备份重新导入。', reset: '清空看板',
    reset_confirm: '确定清空 2FA 看板？此操作会删除本机保存的全部 2FA 账号，且无法撤销。',
    search: '搜索发行方、账号或备注', add: '＋ 添加', import: '⇣ 导入', export: '⇡ 导出', settings: '⚙ 设置', lock: '🔒 锁定',
    empty: '还没有账号。点击“添加”，或“导入” Google Authenticator 迁移二维码、otpauth 链接、Aegis / 2FAS 导出文件。',
    no_match: '没有匹配的账号',
    count: n => `${n} 个账号`,
    copy_code: '点击复制验证码', copied: '验证码已复制', copy_failed: '复制失败，请手动选择',
    next_code: '下一个', edit: '编辑', qr: '二维码', delete: '删除', cancel: '取消', save: '保存', close: '关闭',
    delete_confirm: name => `确定删除“${name}”？删除后无法恢复，除非你有备份。`,
    deleted: '已删除', saved: '已保存',
    add_title: '添加账号', link_or_secret: 'otpauth 链接或 Base32 密钥', link_ph: 'otpauth://totp/… 或 JBSWY3DPEHPK3PXP',
    issuer: '发行方', account: '账号', note: '备注', advanced: '高级参数', type: '类型', algorithm: '算法', digits: '位数', period: '周期（秒）', counter: '计数器',
    from_image: '从二维码图片读取', image_hint: '也可以直接在本页粘贴截图（Ctrl/⌘+V）或把图片拖进来',
    no_qr: '图片中没有找到二维码', not_otp: '二维码内容不是 2FA 链接', lib_fail: '识别库加载失败，请刷新重试',
    added: n => `已添加 ${n} 个账号`, duplicate: '该账号已存在',
    import_title: '导入账号', import_ph: '每行一个 otpauth:// 或 otpauth-migration:// 链接，或粘贴 Aegis / 2FAS 明文导出 JSON',
    import_file: '选择文件（JSON / 文本 / 二维码图片）', parse: '解析', import_selected: n => `导入所选（${n}）`,
    st_new: '新增', st_dup: '已存在', st_bad: '无法导入',
    import_none: '没有可导入的账号', import_done: (a, d) => `已导入 ${a} 个，跳过 ${d} 个重复`,
    backup_pw: '这是加密备份，请输入创建备份时使用的密码', decrypt: '解密',
    export_title: '导出账号', export_backup: '加密备份文件（推荐）', export_backup_desc: '可导入回本工具。默认用当前主密码加密，也可以设置独立的备份密码。',
    use_master: '使用当前主密码', use_other: '使用独立备份密码', backup_pw1: '备份密码（至少 8 位）', backup_pw2: '再次输入备份密码', download: '下载备份',
    export_plain: '明文导出（谨慎）', export_plain_desc: '以下内容包含密钥，任何拿到的人都能生成验证码。只在可信设备上操作，用完关闭。',
    show_links: '显示 otpauth 链接', show_migration: 'Google Authenticator 迁移二维码',
    plain_confirm: '即将显示明文密钥，请确认周围无人且屏幕未共享。继续？',
    links_copy: '复制全部链接', migration_page: (i, n) => `第 ${i}/${n} 张，用 Google Authenticator「转移账号 → 导入账号」扫描`,
    prev: '上一张', next: '下一张', migration_skipped: n => `${n} 个账号的参数 Google Authenticator 不支持，已跳过`,
    nothing_export: '看板里还没有账号',
    settings_title: '设置', auto_lock: '闲置自动锁定', minutes: n => `${n} 分钟`, hide_codes: '验证码默认模糊，悬停或聚焦时显示',
    change_pw: '修改主密码', old_pw: '当前主密码', new_pw: '新主密码（至少 8 位）', new_pw2: '再次输入新主密码', change: '修改', changed: '主密码已修改',
    qr_title: '账号二维码', qr_warn: '此二维码包含密钥，扫码即可添加到其他验证器。', copy_link: '复制链接',
    locked_toast: '看板已锁定', save_failed: '保存失败：浏览器存储不可用或已满',
    quick_title: '快速计算（不保存）', quick_input: '密钥或 otpauth 链接', quick_ph: 'JBSWY3DPEHPK3PXP 或 otpauth://…',
    current_code: '当前验证码', previous: '上一个', following: '下一个', remaining: s => `${s} 秒后刷新`,
    verify: '校验验证码', verify_ph: '输入要校验的验证码',
    verify_ok: d => d === 0 ? '✓ 匹配当前时间步' : d < 0 ? `✓ 匹配前 ${-d} 个时间步（对方时钟偏慢或码已过期）` : `✓ 匹配后 ${d} 个时间步（对方时钟偏快）`,
    verify_ok_hotp: d => `✓ 匹配计数器 +${d}`, verify_bad: '✗ 不匹配：检查密钥、参数和两端设备的时间',
    save_to_vault: '保存到看板', need_unlock: '请先在“账号看板”创建或解锁，再保存',
    gen_title: '生成新密钥', gen_desc: '为你的系统接入 2FA：生成密钥和绑定二维码，用手机验证器扫码后在下面校验。',
    generate: '生成密钥', regenerate: '重新生成', secret: '密钥（Base32）', link: 'otpauth 链接', copy: '复制',
    gen_need_account: '请填写账号（如邮箱）',
    clock: t => `本机时间 ${t}，验证码依赖准确的设备时间`,
    errors: {
      'secret-empty': '密钥为空', 'secret-char': d => `密钥含非法字符“${d.char}”（第 ${d.position} 位），Base32 只允许 A–Z 和 2–7`,
      'secret-short': '密钥太短', type: '只支持 TOTP / HOTP', algorithm: '只支持 SHA1 / SHA256 / SHA512', digits: '位数需为 6–10',
      period: '周期需为 1–3600 秒', counter: '计数器需为非负整数', uri: '不是有效的 otpauth:// 链接', 'uri-secret': '链接里缺少 secret 参数',
      migration: '迁移链接已损坏', 'aegis-encrypted': 'Aegis 加密备份暂不支持，请在 Aegis 中导出明文 JSON', '2fas-encrypted': '2FAS 加密备份暂不支持，请导出不带密码的备份',
      password: '密码错误或数据已被修改', format: '不是有效的加密备份', 'password-empty': '请输入密码',
    },
  },
  en: {
    tab_vault: '🔐 Accounts', tab_quick: '⚡ Quick check', tab_generate: '✨ New secret',
    setup_title: 'Create your 2FA board', setup_desc: 'Choose a master password. Secrets are encrypted with it (PBKDF2 ×600,000 + AES-GCM) and stored in this browser only. The password itself is never stored and cannot be recovered, so export an encrypted backup regularly.',
    pw: 'Master password (8+ characters)', pw2: 'Repeat master password', create: 'Create board', creating: 'Encrypting…',
    pw_short: 'The master password needs at least 8 characters', pw_mismatch: 'The passwords do not match',
    strength: s => ['Strength: weak', 'Strength: fair', 'Strength: good', 'Strength: strong'][s],
    unlock_title: 'Unlock 2FA board', unlock_pw: 'Master password', unlock: 'Unlock', unlocking: 'Unlocking…', wrong_pw: 'Wrong master password',
    forgot: 'Forgot the master password?', forgot_desc: 'It cannot be recovered. Clear the board, create a new one and re-import from a backup.', reset: 'Clear board',
    reset_confirm: 'Clear the 2FA board? This deletes every 2FA account stored in this browser and cannot be undone.',
    search: 'Search issuer, account or note', add: '＋ Add', import: '⇣ Import', export: '⇡ Export', settings: '⚙ Settings', lock: '🔒 Lock',
    empty: 'No accounts yet. Add one, or import a Google Authenticator transfer QR code, otpauth links, or an Aegis / 2FAS export.',
    no_match: 'No matching accounts',
    count: n => `${n} account${n === 1 ? '' : 's'}`,
    copy_code: 'Click to copy the code', copied: 'Code copied', copy_failed: 'Copy failed; select the code manually',
    next_code: 'Next', edit: 'Edit', qr: 'QR', delete: 'Delete', cancel: 'Cancel', save: 'Save', close: 'Close',
    delete_confirm: name => `Delete "${name}"? It cannot be restored without a backup.`,
    deleted: 'Deleted', saved: 'Saved',
    add_title: 'Add account', link_or_secret: 'otpauth link or Base32 secret', link_ph: 'otpauth://totp/… or JBSWY3DPEHPK3PXP',
    issuer: 'Issuer', account: 'Account', note: 'Note', advanced: 'Advanced', type: 'Type', algorithm: 'Algorithm', digits: 'Digits', period: 'Period (s)', counter: 'Counter',
    from_image: 'Read from QR image', image_hint: 'You can also paste a screenshot (Ctrl/⌘+V) or drop an image on this page',
    no_qr: 'No QR code found in the image', not_otp: 'The QR code is not a 2FA link', lib_fail: 'Failed to load the decoder; refresh and try again',
    added: n => `Added ${n} account${n === 1 ? '' : 's'}`, duplicate: 'This account already exists',
    import_title: 'Import accounts', import_ph: 'One otpauth:// or otpauth-migration:// link per line, or paste an Aegis / 2FAS plain JSON export',
    import_file: 'Choose a file (JSON / text / QR image)', parse: 'Parse', import_selected: n => `Import selected (${n})`,
    st_new: 'New', st_dup: 'Exists', st_bad: 'Cannot import',
    import_none: 'Nothing to import', import_done: (a, d) => `Imported ${a}, skipped ${d} duplicate${d === 1 ? '' : 's'}`,
    backup_pw: 'This backup is encrypted; enter the password used when it was created', decrypt: 'Decrypt',
    export_title: 'Export accounts', export_backup: 'Encrypted backup file (recommended)', export_backup_desc: 'Can be imported back into this tool. Encrypted with the current master password unless you set a separate backup password.',
    use_master: 'Use the master password', use_other: 'Use a separate backup password', backup_pw1: 'Backup password (8+ characters)', backup_pw2: 'Repeat backup password', download: 'Download backup',
    export_plain: 'Plain-text export (careful)', export_plain_desc: 'These contain secrets: anyone who gets them can generate your codes. Use only on a trusted device and close when done.',
    show_links: 'Show otpauth links', show_migration: 'Google Authenticator transfer QR codes',
    plain_confirm: 'Plain secrets will be shown. Make sure nobody is watching and your screen is not shared. Continue?',
    links_copy: 'Copy all links', migration_page: (i, n) => `Code ${i} of ${n}: scan with Google Authenticator → Transfer accounts → Import accounts`,
    prev: 'Previous', next: 'Next', migration_skipped: n => `${n} account(s) use settings Google Authenticator does not support and were skipped`,
    nothing_export: 'The board has no accounts yet',
    settings_title: 'Settings', auto_lock: 'Lock after inactivity', minutes: n => `${n} min`, hide_codes: 'Blur codes until hovered or focused',
    change_pw: 'Change master password', old_pw: 'Current master password', new_pw: 'New master password (8+ characters)', new_pw2: 'Repeat new master password', change: 'Change', changed: 'Master password changed',
    qr_title: 'Account QR code', qr_warn: 'This QR code contains the secret; scanning it adds the account to another authenticator.', copy_link: 'Copy link',
    locked_toast: 'Board locked', save_failed: 'Save failed: browser storage is unavailable or full',
    quick_title: 'Quick check (not saved)', quick_input: 'Secret or otpauth link', quick_ph: 'JBSWY3DPEHPK3PXP or otpauth://…',
    current_code: 'Current code', previous: 'Previous', following: 'Next', remaining: s => `refreshes in ${s}s`,
    verify: 'Verify a code', verify_ph: 'Code to verify',
    verify_ok: d => d === 0 ? '✓ Matches the current step' : d < 0 ? `✓ Matches ${-d} step(s) earlier (their clock is behind or the code expired)` : `✓ Matches ${d} step(s) later (their clock is ahead)`,
    verify_ok_hotp: d => `✓ Matches counter +${d}`, verify_bad: '✗ No match: check the secret, the parameters and both devices\' clocks',
    save_to_vault: 'Save to board', need_unlock: 'Create or unlock the board under "Accounts" first',
    gen_title: 'Generate a new secret', gen_desc: 'Add 2FA to your own system: generate a secret and QR code, scan it with an authenticator app, then verify below.',
    generate: 'Generate', regenerate: 'Regenerate', secret: 'Secret (Base32)', link: 'otpauth link', copy: 'Copy',
    gen_need_account: 'Enter an account name (e.g. an email)',
    clock: t => `Device time ${t}; codes depend on an accurate clock`,
    errors: {
      'secret-empty': 'The secret is empty', 'secret-char': d => `Invalid character "${d.char}" at position ${d.position}; Base32 allows A–Z and 2–7`,
      'secret-short': 'The secret is too short', type: 'Only TOTP and HOTP are supported', algorithm: 'Only SHA1, SHA256 and SHA512 are supported', digits: 'Digits must be 6–10',
      period: 'The period must be 1–3600 seconds', counter: 'The counter must be a non-negative integer', uri: 'Not a valid otpauth:// link', 'uri-secret': 'The link has no secret parameter',
      migration: 'The transfer link is corrupted', 'aegis-encrypted': 'Encrypted Aegis backups are not supported; export plain JSON from Aegis', '2fas-encrypted': 'Encrypted 2FAS backups are not supported; export without a password',
      password: 'Wrong password or modified data', format: 'Not a valid encrypted backup', 'password-empty': 'Enter the password',
    },
  },
};

const _TF_VAULT_KEY = 'dtb_otp_vault';
const _TF_SETTINGS_KEY = 'dtb_otp_settings';
const _TF_LOCK_CHOICES = [1, 5, 15, 30, 60];
const _tf = {
  tab: 'vault', key: null, kdf: null, entries: null, codes: new Map(), timer: null, lastActive: 0, hiddenAt: 0, pendingLock: null,
  search: '', panel: null, importState: null, pendingSave: null, quick: null, generated: null, migration: null, busy: false,
};

const _tfT = (key, ...args) => makeToolI18n(_tfDict)(key, ...args);
function _tfError(error) {
  const known = _tfT('errors')[error?.code];
  if (typeof known === 'function') return known(error.detail || {});
  return known || error?.message || String(error);
}
function _tfSettings() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(_TF_SETTINGS_KEY) || '{}') || {}; } catch {}
  return { autoLock: _TF_LOCK_CHOICES.includes(saved.autoLock) ? saved.autoLock : 5, hideCodes: !!saved.hideCodes };
}
function _tfSaveSettings(patch) {
  try { localStorage.setItem(_TF_SETTINGS_KEY, JSON.stringify({ ..._tfSettings(), ...patch })); } catch {}
}
function _tfStoredVault() {
  try { const raw = localStorage.getItem(_TF_VAULT_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
const _tfModules = () => Promise.all([ToolCompute.load('otp'), ToolCompute.load('secure-box')]);
const _tfLabel = e => e.issuer && e.account ? `${e.issuer} (${e.account})` : e.issuer || e.account || '—';
const _tfGroup = code => code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
function _tfHue(text) { let h = 0; for (const c of String(text)) h = (h * 31 + c.codePointAt(0)) % 360; return h; }
function _tfEl(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'style') el.style.cssText = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v);
  }
  el.append(...children.filter(c => c !== null && c !== undefined && c !== false));
  return el;
}
function _tfMsg(id, text, kind = '') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  el.className = 'tf-msg' + (kind ? ' ' + kind : '');
}

function _tfInjectStyles() {
  if (document.getElementById('tfStyles')) return;
  const style = document.createElement('style');
  style.id = 'tfStyles';
  style.textContent = `
    .tf-tabs{display:flex;gap:8px;flex-wrap:wrap}
    .tf-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .tf-toolbar input{flex:1;min-width:180px}
    .tf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:4px}
    .tf-card{display:flex;flex-direction:column;gap:10px;padding:14px;border:1px solid var(--glass-border);border-radius:14px;background:rgba(255,255,255,0.04);transition:border-color .2s,box-shadow .2s;min-width:0}
    .tf-card.tf-copied{border-color:var(--accent);box-shadow:0 0 0 2px rgba(99,102,241,.25)}
    .tf-head{display:flex;gap:10px;align-items:center;min-width:0}
    .tf-avatar{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:700;color:#fff;flex-shrink:0}
    .tf-names{min-width:0;flex:1}
    .tf-issuer{font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .tf-account{font-size:12px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .tf-body{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .tf-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:28px;font-weight:700;letter-spacing:2px;color:var(--neon);background:none;border:none;cursor:pointer;padding:0;text-align:left;transition:filter .2s}
    .tf-code.tf-blur:not(:hover):not(:focus-visible){filter:blur(7px)}
    .tf-ring{width:36px;height:36px;flex-shrink:0}
    .tf-ring circle{fill:none;stroke-width:3}
    .tf-ring .tf-ring-bg{stroke:var(--glass-border)}
    .tf-ring .tf-ring-fg{stroke:var(--accent);transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset .9s linear}
    .tf-ring.tf-low .tf-ring-fg{stroke:#ef4444}
    .tf-ring text{font-size:11px;fill:var(--text-muted);text-anchor:middle;dominant-baseline:central}
    .tf-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
    .tf-actions button{font-size:12px;padding:3px 10px}
    .tf-row{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
    .tf-field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--text-muted);flex:1;min-width:150px}
    .tf-msg{font-size:13px;min-height:18px;margin-top:8px;color:var(--text-muted)}
    .tf-msg.err{color:#ef4444}.tf-msg.ok{color:#10b981}
    .tf-panel{margin-top:12px;padding-top:12px;border-top:1px solid var(--glass-border)}
    .tf-preview{max-height:280px;overflow:auto;margin:10px 0}
    .tf-preview label{display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--glass-border);font-size:13px;color:var(--text);text-transform:none;letter-spacing:normal;font-weight:400;margin:0}
    .tf-preview .tf-st{margin-left:auto;font-size:11px;color:var(--text-muted)}
    .tf-qr{background:#fff;padding:10px;border-radius:10px;display:inline-block;line-height:0}
    .tf-empty{text-align:center;padding:28px 12px;color:var(--text-muted);font-size:13px}
    .tf-big{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:44px;font-weight:800;letter-spacing:3px;color:var(--neon);background:none;border:none;cursor:pointer;padding:0}
    .tf-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}
    @media (max-width:480px){.tf-code{font-size:24px}.tf-big{font-size:34px}}`;
  document.head.appendChild(style);
}

// ── Page shell ──
function renderTotp(el) {
  const T = makeToolI18n(_tfDict);
  _tfInjectStyles();
  if (_tf.pendingLock) { clearTimeout(_tf.pendingLock); _tf.pendingLock = null; }
  el.innerHTML = `
    <div class="tool-card-panel tf-tabs" role="tablist">
      ${['vault', 'quick', 'generate'].map(tab => `<button type="button" role="tab" class="btn ${_tf.tab === tab ? 'btn-primary' : 'btn-secondary'}" data-tab="${tab}" aria-selected="${_tf.tab === tab}" onclick="tfSwitchTab('${tab}')">${T('tab_' + tab)}</button>`).join('')}
    </div>
    <div id="tfPane"></div>
    <div class="tool-card-panel" style="font-size:12px;color:var(--text-muted)" id="tfClock"></div>`;
  const activity = () => { _tf.lastActive = Date.now(); };
  const visibility = () => {
    if (document.hidden) _tf.hiddenAt = Date.now();
    else if (_tf.hiddenAt && _tf.entries && Date.now() - _tf.hiddenAt > _tfSettings().autoLock * 60000) tfLock();
  };
  const paste = e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) { e.preventDefault(); _tfHandleImage(item.getAsFile()); }
  };
  document.addEventListener('pointerdown', activity, true);
  document.addEventListener('keydown', activity, true);
  document.addEventListener('visibilitychange', visibility);
  document.addEventListener('paste', paste);
  // Files dropped anywhere on the tool are handled here instead of making the browser open them.
  el.addEventListener('dragover', e => e.preventDefault());
  el.addEventListener('drop', tfDropFiles);
  _tf.lastActive = Date.now();
  _tf.timer = setInterval(_tfTick, 1000);
  window._activeCleanup = () => {
    clearInterval(_tf.timer); _tf.timer = null;
    document.removeEventListener('pointerdown', activity, true);
    document.removeEventListener('keydown', activity, true);
    document.removeEventListener('visibilitychange', visibility);
    document.removeEventListener('paste', paste);
    _tf.quick = null; _tf.generated = null; _tf.migration = null;
    // A language switch re-renders right away; leaving the tool locks the board shortly after.
    _tf.pendingLock = setTimeout(() => { _tf.pendingLock = null; tfLock(true); }, 1500);
  };
  tfSwitchTab(_tf.tab);
  _tfModules().catch(() => {});
}

function tfSwitchTab(tab) {
  _tf.tab = tab;
  document.querySelectorAll('.tf-tabs [data-tab]').forEach(b => {
    const on = b.dataset.tab === tab;
    b.className = 'btn ' + (on ? 'btn-primary' : 'btn-secondary');
    b.setAttribute('aria-selected', String(on));
  });
  if (tab === 'quick') _tfRenderQuick();
  else if (tab === 'generate') _tfRenderGenerate();
  else _tfRenderVault();
}

async function _tfTick() {
  const clock = document.getElementById('tfClock');
  if (clock) clock.textContent = _tfT('clock', new Date().toLocaleTimeString());
  if (_tf.entries && Date.now() - _tf.lastActive > _tfSettings().autoLock * 60000) { tfLock(); return; }
  if (_tf.tab === 'vault' && _tf.entries) await _tfUpdateCodes();
  else if (_tf.tab === 'quick' && _tf.quick) await _tfUpdateQuick();
  else if (_tf.tab === 'generate' && _tf.generated) await _tfUpdateGenerated();
}

// ── Vault ──
function _tfRenderVault() {
  const T = makeToolI18n(_tfDict);
  const pane = document.getElementById('tfPane');
  if (!pane) return;
  if (!_tf.entries && !_tfStoredVault()) {
    pane.innerHTML = `
      <div class="tool-card-panel">
        <div class="panel-label">${T('setup_title')}</div>
        <p style="font-size:13px;color:var(--text-muted);line-height:1.6;margin:0 0 12px">${T('setup_desc')}</p>
        <div class="tf-row">
          <label class="tf-field">${T('pw')}<input class="tool-input" type="password" id="tfNewPw" autocomplete="new-password" oninput="_tfStrength()"></label>
          <label class="tf-field">${T('pw2')}<input class="tool-input" type="password" id="tfNewPw2" autocomplete="new-password" onkeydown="if(event.key==='Enter')tfCreateVault()"></label>
        </div>
        <div class="tf-msg" id="tfStrength"></div>
        <div class="tool-actions"><button type="button" class="btn btn-primary" id="tfCreateBtn" onclick="tfCreateVault()">${T('create')}</button></div>
        <div class="tf-msg" id="tfMsg" role="status"></div>
      </div>`;
    return;
  }
  if (!_tf.entries) {
    pane.innerHTML = `
      <div class="tool-card-panel">
        <div class="panel-label">${T('unlock_title')}</div>
        <div class="tf-row">
          <label class="tf-field">${T('unlock_pw')}<input class="tool-input" type="password" id="tfUnlockPw" autocomplete="current-password" onkeydown="if(event.key==='Enter')tfUnlock()"></label>
          <button type="button" class="btn btn-primary" id="tfUnlockBtn" onclick="tfUnlock()">${T('unlock')}</button>
        </div>
        <div class="tf-msg" id="tfMsg" role="status"></div>
        <details style="margin-top:10px;font-size:12px;color:var(--text-muted)">
          <summary style="cursor:pointer">${T('forgot')}</summary>
          <p style="margin:8px 0">${T('forgot_desc')}</p>
          <button type="button" class="btn btn-secondary" onclick="tfResetVault()">${T('reset')}</button>
        </details>
      </div>`;
    setTimeout(() => document.getElementById('tfUnlockPw')?.focus(), 0);
    return;
  }
  pane.innerHTML = `
    <div class="tool-card-panel">
      <div class="tf-toolbar">
        <input class="tool-input" type="search" id="tfSearch" placeholder="${T('search')}" aria-label="${T('search')}" oninput="tfFilter(this.value)">
        <button type="button" class="btn btn-primary" onclick="tfOpenPanel('add')">${T('add')}</button>
        <button type="button" class="btn btn-secondary" onclick="tfOpenPanel('import')">${T('import')}</button>
        <button type="button" class="btn btn-secondary" onclick="tfOpenPanel('export')">${T('export')}</button>
        <button type="button" class="btn btn-secondary" onclick="tfOpenPanel('settings')">${T('settings')}</button>
        <button type="button" class="btn btn-secondary" onclick="tfLock()">${T('lock')}</button>
      </div>
      <div id="tfPanel"></div>
      <div class="tf-msg" id="tfCount"></div>
    </div>
    <div id="tfGrid" class="tf-grid"></div>`;
  document.getElementById('tfSearch').value = _tf.search;
  _tfRenderPanel();
  _tfRenderCards();
}

function _tfStrength() {
  const pw = document.getElementById('tfNewPw')?.value || '';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  const score = pw.length < 8 ? 0 : Math.min(3, (pw.length >= 12) + (pw.length >= 16) + (classes >= 3));
  _tfMsg('tfStrength', pw ? _tfT('strength', score) : '');
}

async function tfCreateVault() {
  const pw = document.getElementById('tfNewPw')?.value || '', pw2 = document.getElementById('tfNewPw2')?.value || '';
  if (pw.length < 8) return _tfMsg('tfMsg', _tfT('pw_short'), 'err');
  if (pw !== pw2) return _tfMsg('tfMsg', _tfT('pw_mismatch'), 'err');
  if (_tf.busy) return;
  _tf.busy = true;
  _tfMsg('tfMsg', _tfT('creating'));
  try {
    const [, box] = await _tfModules();
    const { key, kdf, envelope } = await box.create(pw, JSON.stringify({ version: 1, entries: [] }));
    localStorage.setItem(_TF_VAULT_KEY, JSON.stringify(envelope));
    Object.assign(_tf, { key, kdf, entries: [], search: '', panel: null, lastActive: Date.now() });
    await _tfFlushPendingSave();
    _tfRenderVault();
  } catch (e) { _tfMsg('tfMsg', e.name === 'QuotaExceededError' ? _tfT('save_failed') : _tfError(e), 'err'); }
  finally { _tf.busy = false; }
}

async function tfUnlock() {
  const input = document.getElementById('tfUnlockPw');
  const envelope = _tfStoredVault();
  if (!input || !envelope || _tf.busy) return;
  if (!input.value) return _tfMsg('tfMsg', _tfError({ code: 'password-empty' }), 'err');
  _tf.busy = true;
  _tfMsg('tfMsg', _tfT('unlocking'));
  try {
    const [otp, box] = await _tfModules();
    const { key, kdf, text } = await box.unlock(envelope, input.value);
    const data = JSON.parse(text);
    const entries = [];
    for (const item of Array.isArray(data.entries) ? data.entries : []) { try { entries.push(otp.normalize(item)); } catch {} }
    Object.assign(_tf, { key, kdf, entries, search: '', panel: null, lastActive: Date.now() });
    input.value = '';
    await _tfFlushPendingSave();
    _tfRenderVault();
  } catch (e) {
    _tfMsg('tfMsg', e.code === 'password' ? _tfT('wrong_pw') : _tfError(e), 'err');
    input.select();
  } finally { _tf.busy = false; }
}

function tfLock(silent = false) {
  const wasOpen = !!_tf.entries;
  Object.assign(_tf, { key: null, kdf: null, entries: null, panel: null, importState: null, migration: null, search: '' });
  _tf.codes.clear();
  if (!wasOpen) return;
  if (!silent && typeof showToast === 'function') showToast(_tfT('locked_toast'), 'info');
  if (_tf.tab === 'vault' && document.getElementById('tfPane')) _tfRenderVault();
}

function tfResetVault() {
  if (!confirm(_tfT('reset_confirm'))) return;
  try { localStorage.removeItem(_TF_VAULT_KEY); } catch {}
  tfLock(true);
  _tfRenderVault();
}

async function _tfPersist() {
  const [, box] = await _tfModules();
  const envelope = await box.seal(_tf.key, _tf.kdf, JSON.stringify({ version: 1, entries: _tf.entries }));
  try { localStorage.setItem(_TF_VAULT_KEY, JSON.stringify(envelope)); }
  catch { if (typeof showToast === 'function') showToast(_tfT('save_failed'), 'error'); throw new Error('save failed'); }
}

/** Add entries to the unlocked board; returns { added, duplicates }. */
async function _tfAddEntries(list) {
  const [otp] = await _tfModules();
  const { added, duplicates } = otp.merge(_tf.entries, list);
  if (added.length) { _tf.entries.push(...added); await _tfPersist(); }
  return { added, duplicates };
}

async function _tfFlushPendingSave() {
  if (!_tf.pendingSave || !_tf.entries) return;
  const entry = _tf.pendingSave;
  _tf.pendingSave = null;
  const { added } = await _tfAddEntries([entry]);
  if (typeof showToast === 'function') showToast(added.length ? _tfT('added', 1) : _tfT('duplicate'), added.length ? 'success' : 'info');
}

function tfFilter(value) {
  _tf.search = value;
  _tfRenderCards();
}

function _tfVisibleEntries() {
  const q = _tf.search.trim().toLowerCase();
  return q ? _tf.entries.filter(e => [e.issuer, e.account, e.note].some(v => v.toLowerCase().includes(q))) : _tf.entries;
}

function _tfRenderCards() {
  const grid = document.getElementById('tfGrid');
  if (!grid || !_tf.entries) return;
  const list = _tfVisibleEntries();
  _tfMsg('tfCount', _tf.entries.length ? _tfT('count', _tf.entries.length) : '');
  grid.replaceChildren();
  if (!list.length) {
    grid.append(_tfEl('div', { class: 'tf-empty', style: 'grid-column:1/-1' }, _tf.entries.length ? _tfT('no_match') : _tfT('empty')));
    return;
  }
  const hide = _tfSettings().hideCodes;
  for (const entry of list) grid.append(_tfCard(entry, hide));
  _tfUpdateCodes();
}

function _tfCard(entry, hide) {
  const title = entry.issuer || entry.account || '—';
  const code = _tfEl('button', { type: 'button', class: 'tf-code' + (hide ? ' tf-blur' : ''), title: _tfT('copy_code'), 'aria-label': `${_tfT('copy_code')}: ${_tfLabel(entry)}`, onclick: () => _tfCopyCode(entry, card) }, '••• •••');
  const ring = entry.type === 'totp' ? (() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('class', 'tf-ring');
    svg.innerHTML = '<circle class="tf-ring-bg" cx="18" cy="18" r="15"/><circle class="tf-ring-fg" cx="18" cy="18" r="15" stroke-dasharray="94.25" stroke-dashoffset="0"/><text x="18" y="18"></text>';
    return svg;
  })() : _tfEl('button', { type: 'button', class: 'btn btn-secondary', style: 'font-size:12px;padding:3px 10px', onclick: () => tfNextHotp(entry.id) }, _tfT('next_code'));
  const card = _tfEl('div', { class: 'tf-card', dataset: { id: entry.id } },
    _tfEl('div', { class: 'tf-head' },
      _tfEl('div', { class: 'tf-avatar', style: `background:hsl(${_tfHue(title)} 55% 45%)`, 'aria-hidden': 'true' }, [...title][0].toUpperCase()),
      _tfEl('div', { class: 'tf-names' },
        _tfEl('div', { class: 'tf-issuer', title }, title),
        entry.issuer && entry.account ? _tfEl('div', { class: 'tf-account', title: entry.account }, entry.account) : null)),
    _tfEl('div', { class: 'tf-body' }, code, ring),
    _tfEl('div', { class: 'tf-actions' },
      _tfEl('button', { type: 'button', class: 'btn btn-secondary', onclick: () => tfOpenPanel('edit:' + entry.id) }, _tfT('edit')),
      _tfEl('button', { type: 'button', class: 'btn btn-secondary', onclick: () => tfOpenPanel('qr:' + entry.id) }, _tfT('qr'))));
  return card;
}

async function _tfUpdateCodes() {
  const grid = document.getElementById('tfGrid');
  if (!grid || !_tf.entries) return;
  const [otp] = await _tfModules();
  const now = Date.now();
  for (const card of grid.querySelectorAll('.tf-card')) {
    const entry = _tf.entries?.find(e => e.id === card.dataset.id);
    if (!entry) continue;
    const step = entry.type === 'hotp' ? entry.counter : Math.floor(now / 1000 / entry.period);
    let cached = _tf.codes.get(entry.id);
    if (!cached || cached.step !== step || cached.secret !== entry.secret) {
      cached = { step, secret: entry.secret, code: (await otp.generate(entry, now)).code };
      _tf.codes.set(entry.id, cached);
    }
    const codeEl = card.querySelector('.tf-code');
    if (codeEl && codeEl.dataset.code !== cached.code) { codeEl.dataset.code = cached.code; codeEl.textContent = _tfGroup(cached.code); }
    const ring = card.querySelector('.tf-ring');
    if (ring) {
      const remaining = entry.period - (Math.floor(now / 1000) % entry.period);
      ring.querySelector('.tf-ring-fg').setAttribute('stroke-dashoffset', String(94.25 * (1 - remaining / entry.period)));
      ring.querySelector('text').textContent = String(remaining);
      ring.classList.toggle('tf-low', remaining <= 5);
    }
  }
}

async function _tfCopyCode(entry, card) {
  const code = _tf.codes.get(entry.id)?.code;
  if (!code) return;
  try {
    await navigator.clipboard.writeText(code);
    card.classList.add('tf-copied');
    setTimeout(() => card.classList.remove('tf-copied'), 900);
    if (typeof showToast === 'function') showToast(_tfT('copied'), 'success');
  } catch { if (typeof showToast === 'function') showToast(_tfT('copy_failed'), 'error'); }
}

async function tfNextHotp(id) {
  const entry = _tf.entries?.find(e => e.id === id);
  if (!entry) return;
  entry.counter += 1;
  await _tfPersist();
  await _tfUpdateCodes();
}

// ── Toolbar panels ──
function tfOpenPanel(name) {
  _tf.panel = _tf.panel === name ? null : name;
  _tf.importState = null;
  _tf.migration = null;
  _tfRenderPanel();
}

function _tfRenderPanel() {
  const host = document.getElementById('tfPanel');
  if (!host) return;
  host.replaceChildren();
  const name = _tf.panel;
  if (!name) return;
  const panel = _tfEl('div', { class: 'tf-panel' });
  host.append(panel);
  if (name === 'add') _tfPanelAdd(panel);
  else if (name === 'import') _tfPanelImport(panel);
  else if (name === 'export') _tfPanelExport(panel);
  else if (name === 'settings') _tfPanelSettings(panel);
  else if (name.startsWith('edit:')) _tfPanelEdit(panel, name.slice(5));
  else if (name.startsWith('qr:')) _tfPanelQr(panel, name.slice(3));
}

function _tfParamsFields(prefix, values = {}) {
  const T = makeToolI18n(_tfDict);
  const select = (id, options, value) => `<select class="tool-input" id="${prefix}${id}">${options.map(o => `<option value="${o}"${String(o) === String(value) ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
  return `<details style="margin-top:10px"><summary style="cursor:pointer;font-size:12px;color:var(--text-muted)">${T('advanced')}</summary>
    <div class="tf-row" style="margin-top:10px">
      <label class="tf-field">${T('type')}${select('Type', ['totp', 'hotp'], values.type || 'totp')}</label>
      <label class="tf-field">${T('algorithm')}${select('Alg', ['SHA1', 'SHA256', 'SHA512'], values.algorithm || 'SHA1')}</label>
      <label class="tf-field">${T('digits')}${select('Digits', [6, 7, 8], values.digits || 6)}</label>
      <label class="tf-field">${T('period')}<input class="tool-input" type="number" min="1" max="3600" id="${prefix}Period" value="${values.period || 30}"></label>
      <label class="tf-field">${T('counter')}<input class="tool-input" type="number" min="0" id="${prefix}Counter" value="${values.counter || 0}"></label>
    </div></details>`;
}
function _tfReadParams(prefix) {
  const v = id => document.getElementById(prefix + id)?.value;
  return { type: v('Type'), algorithm: v('Alg'), digits: v('Digits'), period: v('Period'), counter: v('Counter') };
}

function _tfPanelAdd(panel) {
  const T = makeToolI18n(_tfDict);
  panel.innerHTML = `
    <div class="panel-label">${T('add_title')}</div>
    <label class="tf-field">${T('link_or_secret')}<input class="tool-input tf-mono" id="tfAddSecret" placeholder="${T('link_ph')}" autocomplete="off" spellcheck="false" oninput="_tfAddFromLink()"></label>
    <div class="tf-row" style="margin-top:10px">
      <label class="tf-field">${T('issuer')}<input class="tool-input" id="tfAddIssuer" autocomplete="off"></label>
      <label class="tf-field">${T('account')}<input class="tool-input" id="tfAddAccount" autocomplete="off"></label>
    </div>
    ${_tfParamsFields('tfAdd')}
    <div class="tool-actions" style="flex-wrap:wrap">
      <button type="button" class="btn btn-primary" onclick="tfAddSubmit()">${T('save')}</button>
      <label class="btn btn-secondary" style="cursor:pointer">${T('from_image')}<input type="file" accept="image/*" style="display:none" onchange="_tfHandleImage(this.files[0]);this.value=''"></label>
      <button type="button" class="btn btn-secondary" onclick="tfOpenPanel(null)">${T('cancel')}</button>
    </div>
    <div style="font-size:12px;color:var(--text-muted)">${T('image_hint')}</div>
    <div class="tf-msg" id="tfPanelMsg" role="status"></div>`;
  setTimeout(() => document.getElementById('tfAddSecret')?.focus(), 0);
}

async function _tfAddFromLink() {
  const value = document.getElementById('tfAddSecret')?.value.trim() || '';
  if (!/^otpauth:/i.test(value)) return;
  const [otp] = await _tfModules();
  try {
    const e = otp.parseUri(value);
    document.getElementById('tfAddIssuer').value = e.issuer;
    document.getElementById('tfAddAccount').value = e.account;
    for (const [id, val] of [['Type', e.type], ['Alg', e.algorithm], ['Digits', e.digits], ['Period', e.period], ['Counter', e.counter]]) {
      const el = document.getElementById('tfAdd' + id);
      if (el) el.value = String(val);
    }
    _tfMsg('tfPanelMsg', '');
  } catch (err) { _tfMsg('tfPanelMsg', _tfError(err), 'err'); }
}

async function tfAddSubmit() {
  const [otp] = await _tfModules();
  const raw = document.getElementById('tfAddSecret')?.value.trim() || '';
  try {
    const entry = /^otpauth:/i.test(raw)
      ? { ...otp.parseUri(raw), issuer: document.getElementById('tfAddIssuer').value, account: document.getElementById('tfAddAccount').value }
      : { ..._tfReadParams('tfAdd'), secret: raw, issuer: document.getElementById('tfAddIssuer').value, account: document.getElementById('tfAddAccount').value };
    const { added } = await _tfAddEntries([otp.normalize(entry)]);
    if (!added.length) return _tfMsg('tfPanelMsg', _tfT('duplicate'), 'err');
    _tf.panel = null;
    _tfRenderPanel();
    _tfRenderCards();
    if (typeof showToast === 'function') showToast(_tfT('added', 1), 'success');
  } catch (err) { _tfMsg('tfPanelMsg', _tfError(err), 'err'); }
}

async function _tfDecodeImage(file) {
  const decode = await ToolCompute.loadVendor('jsqr');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return decode(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data || null;
  } finally { URL.revokeObjectURL(url); }
}

/** A pasted, dropped or chosen image: route its QR content to the visible context. */
async function _tfHandleImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const msgId = _tf.tab === 'quick' ? 'tfQuickMsg' : _tf.tab === 'generate' ? null : (document.getElementById('tfPanelMsg') ? 'tfPanelMsg' : 'tfCount');
  let text;
  try { text = await _tfDecodeImage(file); }
  catch { return msgId && _tfMsg(msgId, _tfT('lib_fail'), 'err'); }
  if (!text) return msgId && _tfMsg(msgId, _tfT('no_qr'), 'err');
  if (!/^otpauth(-migration)?:/i.test(text)) return msgId && _tfMsg(msgId, _tfT('not_otp'), 'err');
  if (_tf.tab === 'quick') {
    const input = document.getElementById('tfQuickInput');
    if (input) { input.value = text; tfQuickUpdate(); }
    return;
  }
  if (_tf.tab !== 'vault' || !_tf.entries) return;
  if (_tf.panel === 'add' && /^otpauth:/i.test(text)) {
    document.getElementById('tfAddSecret').value = text;
    _tfAddFromLink();
    return;
  }
  _tf.panel = 'import';
  _tfRenderPanel();
  document.getElementById('tfImportText').value = text;
  tfImportParse();
}

function tfDropFiles(event) {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  if (file.type.startsWith('image/')) _tfHandleImage(file);
  else _tfImportFile(file);
}

function _tfPanelImport(panel) {
  const T = makeToolI18n(_tfDict);
  panel.innerHTML = `
    <div class="panel-label">${T('import_title')}</div>
    <textarea class="tool-textarea tf-mono" id="tfImportText" rows="5" spellcheck="false" placeholder="${T('import_ph')}"></textarea>
    <div class="tool-actions" style="flex-wrap:wrap">
      <button type="button" class="btn btn-primary" onclick="tfImportParse()">${T('parse')}</button>
      <label class="btn btn-secondary" style="cursor:pointer">${T('import_file')}<input type="file" accept=".json,.txt,application/json,text/plain,image/*" style="display:none" onchange="_tfImportFile(this.files[0]);this.value=''"></label>
      <button type="button" class="btn btn-secondary" onclick="tfOpenPanel(null)">${T('cancel')}</button>
    </div>
    <div style="font-size:12px;color:var(--text-muted)">${T('image_hint')}</div>
    <div id="tfImportPw"></div>
    <div id="tfImportPreview"></div>
    <div class="tf-msg" id="tfPanelMsg" role="status"></div>`;
}

async function _tfImportFile(file) {
  if (!file) return;
  if (file.type.startsWith('image/')) return _tfHandleImage(file);
  if (_tf.tab !== 'vault' || !_tf.entries) return;
  if (_tf.panel !== 'import') { _tf.panel = 'import'; _tfRenderPanel(); }
  document.getElementById('tfImportText').value = (await file.text()).slice(0, 2_000_000);
  tfImportParse();
}

async function tfImportParse() {
  const [otp] = await _tfModules();
  const text = document.getElementById('tfImportText')?.value || '';
  const result = otp.parseImport(text);
  document.getElementById('tfImportPw').replaceChildren();
  if (result.encrypted) return _tfAskBackupPassword(result.encrypted);
  await _tfShowImportPreview(result.entries, result.errors);
}

function _tfAskBackupPassword(envelope) {
  const T = makeToolI18n(_tfDict);
  const host = document.getElementById('tfImportPw');
  const input = _tfEl('input', { class: 'tool-input', type: 'password', autocomplete: 'off', 'aria-label': T('backup_pw') });
  const submit = async () => {
    try {
      const [otp, box] = await _tfModules();
      const { text } = await box.unlock(envelope, input.value);
      const entries = [], errors = [];
      (JSON.parse(text).entries || []).forEach((item, i) => { try { entries.push(otp.normalize(item)); } catch (e) { errors.push({ line: i + 1, message: _tfError(e) }); } });
      host.replaceChildren();
      await _tfShowImportPreview(entries, errors);
    } catch (e) { _tfMsg('tfPanelMsg', _tfError(e), 'err'); }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  host.append(_tfEl('div', { class: 'tf-row', style: 'margin-top:10px' },
    _tfEl('label', { class: 'tf-field' }, T('backup_pw'), input),
    _tfEl('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, T('decrypt'))));
  input.focus();
}

async function _tfShowImportPreview(entries, errors) {
  const T = makeToolI18n(_tfDict);
  const [otp] = await _tfModules();
  const { added, duplicates } = otp.merge(_tf.entries || [], entries);
  _tf.importState = { added };
  const host = document.getElementById('tfImportPreview');
  if (!host) return;
  host.replaceChildren();
  if (!added.length && !duplicates.length && !errors.length) return _tfMsg('tfPanelMsg', T('import_none'), 'err');
  const list = _tfEl('div', { class: 'tf-preview' });
  added.forEach((e, i) => list.append(_tfEl('label', {},
    _tfEl('input', { type: 'checkbox', checked: true, dataset: { index: String(i) }, onchange: _tfImportCount }),
    _tfEl('span', {}, _tfLabel(e)), _tfEl('span', { class: 'tf-st', style: 'color:#10b981' }, T('st_new')))));
  duplicates.forEach(e => list.append(_tfEl('label', {}, _tfEl('input', { type: 'checkbox', disabled: true }),
    _tfEl('span', {}, _tfLabel(e)), _tfEl('span', { class: 'tf-st' }, T('st_dup')))));
  errors.forEach(err => list.append(_tfEl('label', {}, _tfEl('input', { type: 'checkbox', disabled: true }),
    _tfEl('span', {}, `#${err.line} ${err.code ? _tfError(err) : err.message}`), _tfEl('span', { class: 'tf-st', style: 'color:#ef4444' }, T('st_bad')))));
  const button = _tfEl('button', { type: 'button', class: 'btn btn-primary', id: 'tfImportGo', onclick: tfImportCommit }, T('import_selected', added.length));
  button.disabled = !added.length;
  host.append(list, button);
  _tfMsg('tfPanelMsg', '');
}

function _tfImportCount() {
  const n = document.querySelectorAll('#tfImportPreview input[data-index]:checked').length;
  const button = document.getElementById('tfImportGo');
  if (button) { button.textContent = _tfT('import_selected', n); button.disabled = !n; }
}

async function tfImportCommit() {
  const picked = [...document.querySelectorAll('#tfImportPreview input[data-index]:checked')].map(i => _tf.importState?.added[+i.dataset.index]).filter(Boolean);
  if (!picked.length || !_tf.entries) return;
  const { added, duplicates } = await _tfAddEntries(picked);
  _tf.panel = null;
  _tf.importState = null;
  _tfRenderPanel();
  _tfRenderCards();
  if (typeof showToast === 'function') showToast(_tfT('import_done', added.length, duplicates.length), 'success');
}

function _tfPanelExport(panel) {
  const T = makeToolI18n(_tfDict);
  panel.innerHTML = `
    <div class="panel-label">${T('export_title')}</div>
    <div style="font-weight:600;font-size:13px;margin-top:6px">${T('export_backup')}</div>
    <p style="font-size:12px;color:var(--text-muted);margin:6px 0">${T('export_backup_desc')}</p>
    <div class="tf-row" style="font-size:13px;color:var(--text)">
      <label class="opt-label"><input type="radio" name="tfBackupPw" value="master" checked onchange="_tfBackupMode()"> ${T('use_master')}</label>
      <label class="opt-label"><input type="radio" name="tfBackupPw" value="other" onchange="_tfBackupMode()"> ${T('use_other')}</label>
    </div>
    <div class="tf-row" id="tfBackupOther" style="display:none;margin-top:8px">
      <label class="tf-field">${T('backup_pw1')}<input class="tool-input" type="password" id="tfBackupPw1" autocomplete="new-password"></label>
      <label class="tf-field">${T('backup_pw2')}<input class="tool-input" type="password" id="tfBackupPw2" autocomplete="new-password"></label>
    </div>
    <div class="tool-actions"><button type="button" class="btn btn-primary" onclick="tfExportBackup()">${T('download')}</button></div>
    <div style="font-weight:600;font-size:13px;margin-top:14px">${T('export_plain')}</div>
    <p style="font-size:12px;color:#f59e0b;margin:6px 0">${T('export_plain_desc')}</p>
    <div class="tool-actions" style="flex-wrap:wrap">
      <button type="button" class="btn btn-secondary" onclick="tfExportLinks()">${T('show_links')}</button>
      <button type="button" class="btn btn-secondary" onclick="tfExportMigration()">${T('show_migration')}</button>
      <button type="button" class="btn btn-secondary" onclick="tfOpenPanel(null)">${T('close')}</button>
    </div>
    <div id="tfExportOut"></div>
    <div class="tf-msg" id="tfPanelMsg" role="status"></div>`;
}

function _tfBackupMode() {
  const other = document.querySelector('input[name="tfBackupPw"]:checked')?.value === 'other';
  document.getElementById('tfBackupOther').style.display = other ? '' : 'none';
}

async function tfExportBackup() {
  if (!_tf.entries?.length) return _tfMsg('tfPanelMsg', _tfT('nothing_export'), 'err');
  const [, box] = await _tfModules();
  const payload = JSON.stringify({ version: 1, entries: _tf.entries });
  let envelope;
  try {
    if (document.querySelector('input[name="tfBackupPw"]:checked')?.value === 'other') {
      const pw = document.getElementById('tfBackupPw1').value, pw2 = document.getElementById('tfBackupPw2').value;
      if (pw.length < 8) return _tfMsg('tfPanelMsg', _tfT('pw_short'), 'err');
      if (pw !== pw2) return _tfMsg('tfPanelMsg', _tfT('pw_mismatch'), 'err');
      _tfMsg('tfPanelMsg', _tfT('creating'));
      envelope = (await box.create(pw, payload)).envelope;
    } else envelope = await box.seal(_tf.key, _tf.kdf, payload);
  } catch (e) { return _tfMsg('tfPanelMsg', _tfError(e), 'err'); }
  const file = { format: 'k-toolkit-2fa', version: 1, exportedAt: new Date().toISOString(), count: _tf.entries.length, vault: envelope };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  a.download = `k-toolkit-2fa-${ToolCompute.localDate().replace(/-/g, '')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  _tfMsg('tfPanelMsg', _tfT('saved'), 'ok');
}

async function tfExportLinks() {
  if (!_tf.entries?.length) return _tfMsg('tfPanelMsg', _tfT('nothing_export'), 'err');
  if (!confirm(_tfT('plain_confirm'))) return;
  const [otp] = await _tfModules();
  const links = _tf.entries.map(e => otp.buildUri(e)).join('\n');
  const out = document.getElementById('tfExportOut');
  const area = _tfEl('textarea', { class: 'tool-textarea tf-mono', rows: '6', readOnly: true, spellcheck: 'false' });
  area.value = links;
  const copy = _tfEl('button', { type: 'button', class: 'btn btn-secondary', onclick: () => copyText(links, copy) }, _tfT('links_copy'));
  out.replaceChildren(_tfEl('div', { style: 'margin-top:10px' }, area, _tfEl('div', { class: 'tool-actions' }, copy)));
}

async function tfExportMigration() {
  if (!_tf.entries?.length) return _tfMsg('tfPanelMsg', _tfT('nothing_export'), 'err');
  if (!confirm(_tfT('plain_confirm'))) return;
  const [otp] = await _tfModules();
  const { uris, skipped } = otp.buildMigration(_tf.entries, { batchSize: 8 });
  _tf.migration = { uris, skipped, page: 0 };
  _tfRenderMigration();
}

async function _tfRenderMigration() {
  const state = _tf.migration, out = document.getElementById('tfExportOut');
  if (!state || !out) return;
  const T = makeToolI18n(_tfDict);
  const box = _tfEl('div', { class: 'tf-qr', role: 'img', 'aria-label': T('show_migration') });
  const nav = _tfEl('div', { class: 'tool-actions' },
    _tfEl('button', { type: 'button', class: 'btn btn-secondary', disabled: state.page === 0, onclick: () => { state.page--; _tfRenderMigration(); } }, T('prev')),
    _tfEl('button', { type: 'button', class: 'btn btn-secondary', disabled: state.page >= state.uris.length - 1, onclick: () => { state.page++; _tfRenderMigration(); } }, T('next')));
  out.replaceChildren(_tfEl('div', { style: 'margin-top:10px;text-align:center' },
    _tfEl('div', { class: 'tf-msg' }, state.uris.length ? T('migration_page', state.page + 1, state.uris.length) : ''),
    state.uris.length ? box : null, state.uris.length > 1 ? nav : null,
    state.skipped.length ? _tfEl('div', { class: 'tf-msg err' }, T('migration_skipped', state.skipped.length)) : null));
  if (state.uris.length) await _tfDrawQr(box, state.uris[state.page], 240);
}

async function _tfDrawQr(host, text, size = 200) {
  try {
    const QR = await ToolCompute.loadVendor('qrcodejs');
    host.replaceChildren();
    new QR(host, { text, width: size, height: size, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QR.CorrectLevel.L });
  } catch { host.replaceChildren(_tfEl('div', { class: 'tf-mono', style: 'color:#000;font-size:11px;max-width:260px;line-height:1.4' }, text)); }
}

function _tfPanelSettings(panel) {
  const T = makeToolI18n(_tfDict);
  const s = _tfSettings();
  panel.innerHTML = `
    <div class="panel-label">${T('settings_title')}</div>
    <div class="tf-row">
      <label class="tf-field">${T('auto_lock')}<select class="tool-input" id="tfAutoLock" onchange="_tfSaveSettings({autoLock:+this.value})">${_TF_LOCK_CHOICES.map(m => `<option value="${m}"${m === s.autoLock ? ' selected' : ''}>${T('minutes', m)}</option>`).join('')}</select></label>
      <label class="opt-label" style="display:flex;gap:8px;align-items:center;font-size:13px;color:var(--text);flex:2;min-width:220px"><input type="checkbox" id="tfHideCodes"${s.hideCodes ? ' checked' : ''} onchange="_tfSaveSettings({hideCodes:this.checked});_tfRenderCards()"> ${T('hide_codes')}</label>
    </div>
    <div style="font-weight:600;font-size:13px;margin-top:14px">${T('change_pw')}</div>
    <div class="tf-row" style="margin-top:8px">
      <label class="tf-field">${T('old_pw')}<input class="tool-input" type="password" id="tfOldPw" autocomplete="current-password"></label>
      <label class="tf-field">${T('new_pw')}<input class="tool-input" type="password" id="tfChangePw1" autocomplete="new-password"></label>
      <label class="tf-field">${T('new_pw2')}<input class="tool-input" type="password" id="tfChangePw2" autocomplete="new-password"></label>
    </div>
    <div class="tool-actions">
      <button type="button" class="btn btn-primary" onclick="tfChangePassword()">${T('change')}</button>
      <button type="button" class="btn btn-secondary" onclick="tfOpenPanel(null)">${T('close')}</button>
    </div>
    <div class="tf-msg" id="tfPanelMsg" role="status"></div>`;
}

async function tfChangePassword() {
  const old = document.getElementById('tfOldPw').value, pw = document.getElementById('tfChangePw1').value, pw2 = document.getElementById('tfChangePw2').value;
  if (pw.length < 8) return _tfMsg('tfPanelMsg', _tfT('pw_short'), 'err');
  if (pw !== pw2) return _tfMsg('tfPanelMsg', _tfT('pw_mismatch'), 'err');
  const [, box] = await _tfModules();
  try {
    _tfMsg('tfPanelMsg', _tfT('unlocking'));
    await box.unlock(_tfStoredVault(), old);
    const { key, kdf, envelope } = await box.create(pw, JSON.stringify({ version: 1, entries: _tf.entries }));
    localStorage.setItem(_TF_VAULT_KEY, JSON.stringify(envelope));
    Object.assign(_tf, { key, kdf });
    for (const id of ['tfOldPw', 'tfChangePw1', 'tfChangePw2']) document.getElementById(id).value = '';
    _tfMsg('tfPanelMsg', _tfT('changed'), 'ok');
  } catch (e) { _tfMsg('tfPanelMsg', e.code === 'password' ? _tfT('wrong_pw') : _tfError(e), 'err'); }
}

function _tfPanelEdit(panel, id) {
  const T = makeToolI18n(_tfDict);
  const entry = _tf.entries.find(e => e.id === id);
  if (!entry) return;
  const field = (label, key) => {
    const input = _tfEl('input', { class: 'tool-input', autocomplete: 'off' });
    input.value = entry[key];
    input.dataset.key = key;
    return _tfEl('label', { class: 'tf-field' }, label, input);
  };
  const save = async () => {
    for (const input of panel.querySelectorAll('input[data-key]')) entry[input.dataset.key] = input.value.trim().slice(0, input.dataset.key === 'note' ? 1000 : 200);
    await _tfPersist();
    _tf.panel = null; _tfRenderPanel(); _tfRenderCards();
    if (typeof showToast === 'function') showToast(T('saved'), 'success');
  };
  const remove = async () => {
    if (!confirm(T('delete_confirm', _tfLabel(entry)))) return;
    _tf.entries = _tf.entries.filter(e => e.id !== id);
    _tf.codes.delete(id);
    await _tfPersist();
    _tf.panel = null; _tfRenderPanel(); _tfRenderCards();
    if (typeof showToast === 'function') showToast(T('deleted'), 'success');
  };
  panel.append(
    _tfEl('div', { class: 'panel-label' }, `${T('edit')} · ${_tfLabel(entry)}`),
    _tfEl('div', { class: 'tf-row' }, field(T('issuer'), 'issuer'), field(T('account'), 'account'), field(T('note'), 'note')),
    _tfEl('div', { class: 'tf-msg' }, `${entry.type.toUpperCase()} · ${entry.algorithm} · ${entry.digits} · ${entry.type === 'totp' ? entry.period + 's' : '#' + entry.counter}`),
    _tfEl('div', { class: 'tool-actions' },
      _tfEl('button', { type: 'button', class: 'btn btn-primary', onclick: save }, T('save')),
      _tfEl('button', { type: 'button', class: 'btn btn-secondary', style: 'color:#ef4444', onclick: remove }, T('delete')),
      _tfEl('button', { type: 'button', class: 'btn btn-secondary', onclick: () => tfOpenPanel(null) }, T('cancel'))));
}

async function _tfPanelQr(panel, id) {
  const T = makeToolI18n(_tfDict);
  const entry = _tf.entries.find(e => e.id === id);
  if (!entry) return;
  const [otp] = await _tfModules();
  const link = otp.buildUri(entry);
  const qr = _tfEl('div', { class: 'tf-qr', role: 'img', 'aria-label': T('qr_title') });
  const copy = _tfEl('button', { type: 'button', class: 'btn btn-secondary', onclick: () => copyText(link, copy) }, T('copy_link'));
  panel.append(_tfEl('div', { class: 'panel-label' }, `${T('qr_title')} · ${_tfLabel(entry)}`),
    _tfEl('p', { style: 'font-size:12px;color:#f59e0b;margin:6px 0' }, T('qr_warn')),
    _tfEl('div', { style: 'text-align:center' }, qr),
    _tfEl('div', { class: 'tool-actions' }, copy, _tfEl('button', { type: 'button', class: 'btn btn-secondary', onclick: () => tfOpenPanel(null) }, T('close'))));
  await _tfDrawQr(qr, link, 200);
}

/** Quick check / generator: hand an entry to the board, unlocking or creating it first if needed. */
async function _tfSaveToVault(entry) {
  if (_tf.entries) {
    const { added } = await _tfAddEntries([entry]);
    if (typeof showToast === 'function') showToast(added.length ? _tfT('added', 1) : _tfT('duplicate'), added.length ? 'success' : 'info');
    return;
  }
  _tf.pendingSave = entry;
  if (typeof showToast === 'function') showToast(_tfT('need_unlock'), 'info');
  tfSwitchTab('vault');
}

// ── Quick check ──
function _tfRenderQuick() {
  const T = makeToolI18n(_tfDict);
  document.getElementById('tfPane').innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('quick_title')}</div>
      <label class="tf-field">${T('quick_input')}<input class="tool-input tf-mono" id="tfQuickInput" placeholder="${T('quick_ph')}" autocomplete="off" spellcheck="false" oninput="tfQuickUpdate()"></label>
      ${_tfParamsFields('tfQuick')}
      <div class="tool-actions">
        <label class="btn btn-secondary" style="cursor:pointer">${T('from_image')}<input type="file" accept="image/*" style="display:none" onchange="_tfHandleImage(this.files[0]);this.value=''"></label>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">${T('image_hint')}</div>
      <div class="tf-msg" id="tfQuickMsg" role="status"></div>
    </div>
    <div class="tool-card-panel" id="tfQuickResult" style="display:none">
      <div class="panel-label">${T('current_code')}</div>
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <button type="button" class="tf-big" id="tfQuickCode" title="${T('copy_code')}" onclick="copyText(this.dataset.code||'',this)"></button>
        <span id="tfQuickRemain" style="font-size:12px;color:var(--text-muted)"></span>
      </div>
      <div class="tf-msg" id="tfQuickNeighbours"></div>
      <div class="tf-row" style="margin-top:12px">
        <label class="tf-field">${T('verify')}<input class="tool-input tf-mono" id="tfQuickVerify" placeholder="${T('verify_ph')}" inputmode="numeric" autocomplete="off" oninput="tfQuickVerify()"></label>
        <button type="button" class="btn btn-secondary" onclick="tfQuickSave()">${T('save_to_vault')}</button>
      </div>
      <div class="tf-msg" id="tfQuickVerifyResult" role="status"></div>
    </div>`;
  document.querySelectorAll('#tfPane select, #tfPane input[type=number]').forEach(el => el.addEventListener('change', tfQuickUpdate));
}

async function tfQuickUpdate() {
  const [otp] = await _tfModules();
  const raw = document.getElementById('tfQuickInput')?.value.trim() || '';
  const result = document.getElementById('tfQuickResult');
  if (!raw) { _tf.quick = null; result.style.display = 'none'; _tfMsg('tfQuickMsg', ''); return; }
  try {
    _tf.quick = /^otpauth:/i.test(raw) ? otp.parseUri(raw) : otp.normalize({ ..._tfReadParams('tfQuick'), secret: raw });
    _tfMsg('tfQuickMsg', _tf.quick.issuer || _tf.quick.account ? _tfLabel(_tf.quick) : '');
    result.style.display = '';
    await _tfUpdateQuick();
    tfQuickVerify();
  } catch (e) { _tf.quick = null; result.style.display = 'none'; _tfMsg('tfQuickMsg', _tfError(e), 'err'); }
}

async function _tfUpdateQuick() {
  const entry = _tf.quick, codeEl = document.getElementById('tfQuickCode');
  if (!entry || !codeEl) return;
  const [otp] = await _tfModules();
  const now = Date.now();
  const current = await otp.generate(entry, now);
  codeEl.dataset.code = current.code;
  codeEl.textContent = _tfGroup(current.code);
  document.getElementById('tfQuickRemain').textContent = entry.type === 'totp' ? _tfT('remaining', current.remaining) : `#${entry.counter}`;
  const at = delta => entry.type === 'totp' ? otp.generate(entry, now + delta * entry.period * 1000) : otp.generate({ ...entry, counter: Math.max(0, entry.counter + delta) });
  const [prev, next] = await Promise.all([at(-1), at(1)]);
  document.getElementById('tfQuickNeighbours').textContent = `${_tfT('previous')} ${_tfGroup(prev.code)} · ${_tfT('following')} ${_tfGroup(next.code)}`;
}

async function tfQuickVerify() {
  const value = document.getElementById('tfQuickVerify')?.value.replace(/\s/g, '') || '';
  if (!value || !_tf.quick) return _tfMsg('tfQuickVerifyResult', '');
  const [otp] = await _tfModules();
  const delta = await otp.verify(value, _tf.quick);
  if (delta === null) _tfMsg('tfQuickVerifyResult', _tfT('verify_bad'), 'err');
  else _tfMsg('tfQuickVerifyResult', _tf.quick.type === 'hotp' ? _tfT('verify_ok_hotp', delta) : _tfT('verify_ok', delta), 'ok');
}

function tfQuickSave() { if (_tf.quick) _tfSaveToVault(_tf.quick); }

// ── Generator ──
function _tfRenderGenerate() {
  const T = makeToolI18n(_tfDict);
  document.getElementById('tfPane').innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('gen_title')}</div>
      <p style="font-size:13px;color:var(--text-muted);margin:0 0 10px">${T('gen_desc')}</p>
      <div class="tf-row">
        <label class="tf-field">${T('issuer')}<input class="tool-input" id="tfGenIssuer" autocomplete="off" placeholder="K Toolkit"></label>
        <label class="tf-field">${T('account')}<input class="tool-input" id="tfGenAccount" autocomplete="off" placeholder="alice@example.com"></label>
      </div>
      ${_tfParamsFields('tfGen')}
      <div class="tool-actions"><button type="button" class="btn btn-primary" id="tfGenBtn" onclick="tfGenerate()">${T('generate')}</button></div>
      <div class="tf-msg" id="tfGenMsg" role="status"></div>
    </div>
    <div class="tool-card-panel" id="tfGenResult" style="display:none">
      <div style="display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start">
        <div class="tf-qr" id="tfGenQr" role="img" aria-label="${T('qr_title')}"></div>
        <div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:10px">
          <div><div style="font-size:12px;color:var(--text-muted)">${T('secret')}</div><div class="tf-mono" id="tfGenSecret" style="font-size:15px;font-weight:600;color:var(--neon)"></div></div>
          <div><div style="font-size:12px;color:var(--text-muted)">${T('link')}</div><div class="tf-mono" id="tfGenLink" style="font-size:12px;color:var(--text)"></div></div>
          <div class="tool-actions" style="margin:0">
            <button type="button" class="btn btn-secondary" onclick="copyText(document.getElementById('tfGenSecret').textContent,this)">${T('copy')} ${T('secret')}</button>
            <button type="button" class="btn btn-secondary" onclick="copyText(document.getElementById('tfGenLink').textContent,this)">${T('copy_link')}</button>
          </div>
          <div style="font-size:12px;color:var(--text-muted)">${T('current_code')} <span class="tf-mono" id="tfGenCode" style="font-weight:700;color:var(--text)"></span></div>
        </div>
      </div>
      <div class="tf-row" style="margin-top:12px">
        <label class="tf-field">${T('verify')}<input class="tool-input tf-mono" id="tfGenVerify" placeholder="${T('verify_ph')}" inputmode="numeric" autocomplete="off" oninput="tfGenVerify()"></label>
        <button type="button" class="btn btn-secondary" onclick="tfGenSave()">${T('save_to_vault')}</button>
      </div>
      <div class="tf-msg" id="tfGenVerifyResult" role="status"></div>
    </div>`;
}

async function tfGenerate() {
  const [otp] = await _tfModules();
  const account = document.getElementById('tfGenAccount').value.trim();
  if (!account) return _tfMsg('tfGenMsg', _tfT('gen_need_account'), 'err');
  try {
    _tf.generated = otp.normalize({ ..._tfReadParams('tfGen'), issuer: document.getElementById('tfGenIssuer').value, account, secret: otp.randomSecret(20) });
  } catch (e) { return _tfMsg('tfGenMsg', _tfError(e), 'err'); }
  _tfMsg('tfGenMsg', '');
  const link = otp.buildUri(_tf.generated);
  document.getElementById('tfGenSecret').textContent = _tf.generated.secret.match(/.{1,4}/g).join(' ');
  document.getElementById('tfGenLink').textContent = link;
  document.getElementById('tfGenBtn').textContent = _tfT('regenerate');
  document.getElementById('tfGenResult').style.display = '';
  document.getElementById('tfGenVerify').value = '';
  _tfMsg('tfGenVerifyResult', '');
  await _tfDrawQr(document.getElementById('tfGenQr'), link, 180);
  await _tfUpdateGenerated();
}

async function _tfUpdateGenerated() {
  const el = document.getElementById('tfGenCode');
  if (!el || !_tf.generated) return;
  const [otp] = await _tfModules();
  el.textContent = _tfGroup((await otp.generate(_tf.generated)).code);
}

async function tfGenVerify() {
  const value = document.getElementById('tfGenVerify')?.value.replace(/\s/g, '') || '';
  if (!value || !_tf.generated) return _tfMsg('tfGenVerifyResult', '');
  const [otp] = await _tfModules();
  const delta = await otp.verify(value, _tf.generated);
  if (delta === null) _tfMsg('tfGenVerifyResult', _tfT('verify_bad'), 'err');
  else _tfMsg('tfGenVerifyResult', _tf.generated.type === 'hotp' ? _tfT('verify_ok_hotp', delta) : _tfT('verify_ok', delta), 'ok');
}

function tfGenSave() { if (_tf.generated) _tfSaveToVault(_tf.generated); }
