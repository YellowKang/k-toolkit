/* ── Password Generator — Random + Diceware + HIBP Breach Detection ── */

/* ── Diceware word lists ── */
const _diceEN = ['apple','brave','cloud','dance','eagle','flame','ghost','heart','ivory','jewel','karma','light','magic','noble','ocean','peace','quest','river','stone','tiger','ultra','vivid','whale','xenon','youth','zenith','amber','bloom','coral','drift','ember','frost','grain','haven','index','joker','knack','lotus','maple','nexus','olive','pixel','quilt','ridge','solar','torch','urban','vault','wheat','axiom','blaze','cedar','delta','epoch','fiber','globe','haste','input','joint','kayak','lemon','mango','niche','oasis','plume','quota','realm','spine','trend','unity','vigor','waltz','oxide','blend','crane','dwarf','exalt','forge','glaze','hatch','ivory','jelly','kiosk','llama','mocha','nudge','optic','prism','quark','rumba','stove','tulip','umbra','viper','wrist','xylem','yacht','zebra'];
const _diceCN = ['星辰','海洋','山川','雷电','微风','竹林','瀑布','峡谷','冰川','火山','月光','星河','雪花','云朵','彩虹','日出','黄昏','极光','潮汐','暴风','松树','玫瑰','荷花','梅花','兰花','菊花','桃花','竹子','银杏','樱花','飞鸟','白鹤','雄鹰','蝴蝶','海豚','猎豹','夜莺','凤凰','麒麟','青龙','琥珀','翡翠','水晶','珊瑚','玛瑙','蓝宝','紫晶','钻石','黄金','白银','春风','夏雨','秋月','冬雪','晨曦','午后','黄昏','子夜','拂晓','暮色','勇气','智慧','信念','希望','梦想','自由','真理','荣耀','和平','永恒','烟火','流星','朝阳','晚霞','清泉','深渊','天际','地平','海角','山巅','古琴','铜鼎','玉笛','木鱼','石磬','金钟','铁锤','丝绸','棉麻','皮革','书卷','画轴','棋盘','剑鞘','琴弦','墨砚','笔锋','纸鸢','灯塔','风铃'];
let _pwdPwnedTimer = null;

/* ── i18n dictionary ── */
const _pwdI18nDict = {
  zh: {
    tab_random:       '随机密码',
    tab_dice:         '助记口令 (Diceware)',
    gen_settings:     '生成设置',
    pwd_length:       '密码长度',
    upper:            '大写字母 A-Z',
    lower:            '小写字母 a-z',
    digits:           '数字 0-9',
    symbols:          '符号 !@#$%^',
    exclude_ambig:    '排除歧义字符 (0O1lI)',
    strength_preview: '强度预览',
    click_refresh:    '点击刷新',
    batch_gen:        '批量生成',
    refresh_preview:  '刷新预览',
    gen_1:            '生成 1 个',
    gen_5:            '生成 5 个',
    gen_10:           '生成 10 个',
    gen_20:           '生成 20 个',
    copy_all:         '复制全部',
    dice_settings:    '助记口令设置',
    word_count:       '单词数量',
    separator:        '分隔符',
    sep_dash:         '短横线 -',
    sep_space:        '空格',
    sep_dot:          '句点 .',
    language:         '语言',
    gen_passphrase:   '生成口令',
    combo_entropy:    '组合熵',
    possibilities:    '种可能',
    copy:             '复制',
    result_title:     (n) => `生成结果 (${n} 个)`,
    strength_title:   '强度 & 熵分析',
    entropy_label:    (v) => `熵值 ${v} bits`,
    str_weak:         '弱',
    str_medium:       '中',
    str_strong:       '强',
    str_very_strong:  '极强',
    select_one_type:  '请至少选择一种字符类型',
    gen_first:        '请先生成密码',
    copied_n:         (n) => `已复制 ${n} 个密码`,
    pwned_checking:   '泄露检测中...',
    pwned_error:      '泄露检测失败 (网络错误)',
    pwned_safe:       '🔒 未泄露 — 该密码未出现在已知泄露数据库中',
    pwned_found:      (n) => `⚠️ 已泄露 ${n} 次 — 建议更换密码`,
  },
  en: {
    tab_random:       'Random Password',
    tab_dice:         'Passphrase (Diceware)',
    gen_settings:     'Generation Settings',
    pwd_length:       'Password Length',
    upper:            'Uppercase A-Z',
    lower:            'Lowercase a-z',
    digits:           'Digits 0-9',
    symbols:          'Symbols !@#$%^',
    exclude_ambig:    'Exclude ambiguous (0O1lI)',
    strength_preview: 'Strength Preview',
    click_refresh:    'Click to refresh',
    batch_gen:        'Batch Generate',
    refresh_preview:  'Refresh Preview',
    gen_1:            'Generate 1',
    gen_5:            'Generate 5',
    gen_10:           'Generate 10',
    gen_20:           'Generate 20',
    copy_all:         'Copy All',
    dice_settings:    'Passphrase Settings',
    word_count:       'Word Count',
    separator:        'Separator',
    sep_dash:         'Dash -',
    sep_space:        'Space',
    sep_dot:          'Dot .',
    language:         'Language',
    gen_passphrase:   'Generate Passphrase',
    combo_entropy:    'Entropy',
    possibilities:    'possibilities',
    copy:             'Copy',
    result_title:     (n) => `Results (${n} password${n===1?'':'s'})`,
    strength_title:   'Strength & Entropy Analysis',
    entropy_label:    (v) => `Entropy ${v} bits`,
    str_weak:         'Weak',
    str_medium:       'Medium',
    str_strong:       'Strong',
    str_very_strong:  'Very Strong',
    select_one_type:  'Select at least one character type',
    gen_first:        'Generate passwords first',
    copied_n:         (n) => `Copied ${n} password${n===1?'':'s'}`,
    pwned_checking:   'Checking breaches...',
    pwned_error:      'Breach check failed (network error)',
    pwned_safe:       '🔒 Not found in breaches',
    pwned_found:      (n) => `⚠️ Found in ${n.toLocaleString()} breaches!`,
  },
};

let _pgT = null; // tool-level i18n function, initialized in render

function renderPasswordGen(el) {
  _pgT = makeToolI18n(_pwdI18nDict);
  const T = _pgT;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--glass-border)">
        <button id="pwdTabRandom" class="pwd-tab pwd-tab-active" onclick="pwdSwitchTab('random')">${T('tab_random')}</button>
        <button id="pwdTabDice" class="pwd-tab" onclick="pwdSwitchTab('dice')">${T('tab_dice')}</button>
      </div>
      <!-- Random Password Panel -->
      <div id="pwdRandomPanel">
        <div class="panel-label">${T('gen_settings')}</div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
          <span style="color:var(--text-muted);font-size:13px;white-space:nowrap">${T('pwd_length')}</span>
          <input type="range" id="pwdLength" min="4" max="64" value="16" style="flex:1" oninput="pwdLenChange(this.value)">
          <span id="pwdLenVal" style="color:var(--neon);font-family:monospace;font-weight:700;min-width:28px;text-align:right">16</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
          <label class="pwd-check-label"><input type="checkbox" id="pwdUpper" checked onchange="pwdGenPreview()"> ${T('upper')}</label>
          <label class="pwd-check-label"><input type="checkbox" id="pwdLower" checked onchange="pwdGenPreview()"> ${T('lower')}</label>
          <label class="pwd-check-label"><input type="checkbox" id="pwdNum" checked onchange="pwdGenPreview()"> ${T('digits')}</label>
          <label class="pwd-check-label"><input type="checkbox" id="pwdSym" checked onchange="pwdGenPreview()"> ${T('symbols')}</label>
          <label class="pwd-check-label"><input type="checkbox" id="pwdExclude"> ${T('exclude_ambig')}</label>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${T('strength_preview')}</div>
          <div id="pwdPreviewBox" style="padding:12px 16px;background:rgba(0,0,0,0.35);border:1px solid var(--glass-border);border-radius:10px;font-family:monospace;font-size:15px;letter-spacing:2px;word-break:break-all;cursor:pointer;transition:background 0.2s" onclick="pwdRefreshOne()" title="${T('click_refresh')}"></div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
            <div id="pwdStrBar" style="flex:1;height:4px;border-radius:4px;background:var(--glass-border);overflow:hidden"><div id="pwdStrFill" style="height:100%;width:0;transition:width 0.4s ease,background 0.4s ease;border-radius:4px"></div></div>
            <span id="pwdStrLabel" style="font-size:12px;font-weight:600;min-width:30px;text-align:right"></span>
          </div>
          <div id="pwdPwnedResult" style="margin-top:8px;font-size:12px;min-height:18px"></div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-primary" onclick="generatePasswords()">${T('batch_gen')}</button>
          <button class="btn btn-secondary" onclick="pwdRefreshOne()">${T('refresh_preview')}</button>
          <select id="pwdCount" class="tool-input" style="width:auto">
            <option value="1">${T('gen_1')}</option>
            <option value="5" selected>${T('gen_5')}</option>
            <option value="10">${T('gen_10')}</option>
            <option value="20">${T('gen_20')}</option>
          </select>
          <button class="btn btn-secondary" onclick="pwdCopyAll()">${T('copy_all')}</button>
        </div>
      </div>
      <!-- Diceware Passphrase Panel -->
      <div id="pwdDicewarePanel" style="display:none">
        <div class="panel-label">${T('dice_settings')}</div>
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
          <span style="color:var(--text-muted);font-size:13px;white-space:nowrap">${T('word_count')}</span>
          <input type="range" id="pwdDiceCount" min="4" max="8" value="4" style="flex:1" oninput="document.getElementById('pwdDiceCountVal').textContent=this.value">
          <span id="pwdDiceCountVal" style="color:var(--neon);font-family:monospace;font-weight:700;min-width:18px;text-align:right">4</span>
        </div>
        <div style="display:flex;gap:14px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--text-muted);font-size:13px">${T('separator')}</span>
            <select id="pwdDiceSep" class="tool-input" style="width:auto">
              <option value="-">${T('sep_dash')}</option>
              <option value=" ">${T('sep_space')}</option>
              <option value=".">${T('sep_dot')}</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="color:var(--text-muted);font-size:13px">${T('language')}</span>
            <button id="pwdDiceLangEN" class="btn btn-secondary pwd-lang-active" onclick="pwdDiceSetLang('en')" style="padding:4px 12px;font-size:12px">English</button>
            <button id="pwdDiceLangCN" class="btn btn-secondary" onclick="pwdDiceSetLang('cn')" style="padding:4px 12px;font-size:12px">中文</button>
          </div>
        </div>
        <button class="btn btn-primary" onclick="pwdDiceGenerate()" style="margin-bottom:16px">${T('gen_passphrase')}</button>
        <div id="pwdDiceOutput"></div>
      </div>
    </div>
    <div class="tool-card-panel" id="pwdResult" style="display:none"></div>
    <div class="tool-card-panel" id="pwdStrengthPanel" style="display:none">
      <div class="panel-label" style="margin-bottom:12px">${T('strength_title')}</div>
      <div style="display:flex;gap:4px;margin-bottom:10px">
        <div id="pwdSeg0" style="flex:1;height:10px;border-radius:4px 0 0 4px;background:var(--glass-border);transition:background 0.4s"></div>
        <div id="pwdSeg1" style="flex:1;height:10px;background:var(--glass-border);transition:background 0.4s"></div>
        <div id="pwdSeg2" style="flex:1;height:10px;background:var(--glass-border);transition:background 0.4s"></div>
        <div id="pwdSeg3" style="flex:1;height:10px;border-radius:0 4px 4px 0;background:var(--glass-border);transition:background 0.4s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div id="pwdStrengthLabel" style="font-size:13px;font-weight:600"></div>
        <div id="pwdEntropyLabel" style="font-size:12px;color:var(--text-muted)"></div>
      </div>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `.pwd-check-label{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);cursor:pointer;padding:8px 12px;border:1px solid var(--glass-border);border-radius:8px;transition:border-color 0.2s}.pwd-check-label:hover{border-color:rgba(102,126,234,0.4)}.pwd-check-label input{accent-color:var(--accent)}.pwd-tab{background:none;border:none;padding:8px 18px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.2s,border-color 0.2s}.pwd-tab:hover{color:var(--text)}.pwd-tab-active{color:var(--neon)!important;border-bottom-color:var(--neon)!important}.pwd-lang-active{background:var(--accent)!important;color:#fff!important}`;
  el.appendChild(style);
  window._pwdDiceLang = 'en';
  pwdGenPreview();

  window._activeCleanup = function() {
    clearTimeout(_pwdPwnedTimer);
    _pwdPwnedTimer = null;
  };
}

/* ── Tab switching ── */
function pwdSwitchTab(tab) {
  const isRandom = tab === 'random';
  document.getElementById('pwdRandomPanel').style.display = isRandom ? '' : 'none';
  document.getElementById('pwdDicewarePanel').style.display = isRandom ? 'none' : '';
  document.getElementById('pwdTabRandom').classList.toggle('pwd-tab-active', isRandom);
  document.getElementById('pwdTabDice').classList.toggle('pwd-tab-active', !isRandom);
  document.getElementById('pwdResult').style.display = 'none';
  document.getElementById('pwdStrengthPanel').style.display = isRandom ? '' : 'none';
}

/* ── HIBP Breach Detection (k-anonymity) ── */
async function _pgCheckPwned(pwd) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-1', enc.encode(pwd));
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  const prefix = hash.slice(0, 5), suffix = hash.slice(5);
  try {
    const res = await fetch('https://api.pwnedpasswords.com/range/' + prefix);
    const text = await res.text();
    const match = text.split('\n').find(l => l.startsWith(suffix));
    return match ? parseInt(match.split(':')[1]) : 0;
  } catch (e) { return -1; }
}

function _pwdShowPwnedResult(pwd) {
  clearTimeout(_pwdPwnedTimer);
  const el = document.getElementById('pwdPwnedResult');
  if (!el) return;
  const T = _pgT || makeToolI18n(_pwdI18nDict);
  el.innerHTML = `<span style="color:var(--text-muted)">${T('pwned_checking')}</span>`;
  _pwdPwnedTimer = setTimeout(async () => {
    const count = await _pgCheckPwned(pwd);
    if (count === -1) {
      el.innerHTML = `<span style="color:var(--text-muted)">${T('pwned_error')}</span>`;
    } else if (count === 0) {
      el.innerHTML = `<span style="color:#22c55e">${T('pwned_safe')}</span>`;
    } else {
      el.innerHTML = `<span style="color:#ef4444">${T('pwned_found', count)}</span>`;
    }
  }, 500);
}

/* ── Diceware ── */
function pwdDiceSetLang(lang) {
  window._pwdDiceLang = lang;
  document.getElementById('pwdDiceLangEN').classList.toggle('pwd-lang-active', lang === 'en');
  document.getElementById('pwdDiceLangCN').classList.toggle('pwd-lang-active', lang === 'cn');
}

function pwdDiceGenerate() {
  const T = _pgT || makeToolI18n(_pwdI18nDict);
  const count = +document.getElementById('pwdDiceCount').value;
  const sep = document.getElementById('pwdDiceSep').value;
  const lang = window._pwdDiceLang || 'en';
  const list = lang === 'cn' ? _diceCN : _diceEN;
  const words = [];
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  for (let i = 0; i < count; i++) words.push(list[arr[i] % list.length]);
  const phrase = words.join(sep);
  const entropy = (count * Math.log2(list.length)).toFixed(1);
  document.getElementById('pwdDiceOutput').innerHTML = `
    <div style="font-family:monospace;font-size:18px;color:var(--neon);word-break:break-all;margin-bottom:8px">${phrase}</div>
    <div style="font-size:12px;color:var(--text-muted)">${T('combo_entropy')}: ${entropy} bits &middot; ${list.length}^${count} ${T('possibilities')}</div>
    <button class="btn btn-secondary" onclick="copyText('${phrase.replace(/'/g, "\\'")}',this)" style="margin-top:8px">${T('copy')}</button>`;
}

/* ── Original functions (preserved) ── */
function pwdLenChange(val) {
  document.getElementById('pwdLenVal').textContent = val;
  pwdGenPreview();
}

function pwdCharset() {
  const upper  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower  = 'abcdefghijklmnopqrstuvwxyz';
  const nums   = '0123456789';
  const sym    = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const excl   = /[0O1lI]/g;
  let chars = '';
  if (document.getElementById('pwdUpper').checked) chars += upper;
  if (document.getElementById('pwdLower').checked) chars += lower;
  if (document.getElementById('pwdNum').checked)   chars += nums;
  if (document.getElementById('pwdSym').checked)   chars += sym;
  if (document.getElementById('pwdExclude').checked) chars = chars.replace(excl, '');
  return chars;
}

function pwdGenOne(len, chars) {
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => chars[v % chars.length]).join('');
}

function pwdGenPreview() {
  const len   = +document.getElementById('pwdLength').value;
  const chars = pwdCharset();
  if (!chars) { document.getElementById('pwdPreviewBox').textContent = ''; return; }
  const pwd = pwdGenOne(len, chars);
  document.getElementById('pwdPreviewBox').textContent = pwd;
  const st = calcPwdStrength(pwd);
  const pct = {weak:25,medium:50,strong:75,vstrong:100}[st.key] || 0;
  document.getElementById('pwdStrFill').style.width = pct + '%';
  document.getElementById('pwdStrFill').style.background = st.color;
  const T = _pgT || makeToolI18n(_pwdI18nDict);
  document.getElementById('pwdStrLabel').textContent = T(st.i18nKey);
  document.getElementById('pwdStrLabel').style.color = st.color;
  _pwdUpdateStrengthPanel(pwd, chars);
  _pwdShowPwnedResult(pwd);
}

function pwdRefreshOne() { pwdGenPreview(); }

function _pwdUpdateStrengthPanel(pwd, chars) {
  const panel = document.getElementById('pwdStrengthPanel');
  if (!panel) return;
  panel.style.display = '';
  const T = _pgT || makeToolI18n(_pwdI18nDict);

  const st      = calcPwdStrength(pwd);
  const entropy = (pwd.length * Math.log2(Math.max(chars.length, 1))).toFixed(1);
  const scoreMap = {weak:1, medium:2, strong:3, vstrong:4};
  const score    = scoreMap[st.key] || 1;
  const segColors = ['#ef4444','#f97316','#eab308','#22c55e'];
  const offColor  = 'rgba(255,255,255,0.08)';

  for (let i = 0; i < 4; i++) {
    document.getElementById('pwdSeg' + i).style.background = i < score ? segColors[score - 1] : offColor;
  }

  const labelEl = document.getElementById('pwdStrengthLabel');
  labelEl.textContent = T(st.i18nKey);
  labelEl.style.color = st.color;

  document.getElementById('pwdEntropyLabel').textContent = T('entropy_label', entropy);
}

function generatePasswords() {
  const T = _pgT || makeToolI18n(_pwdI18nDict);
  const len   = +document.getElementById('pwdLength').value;
  const count = +document.getElementById('pwdCount').value;
  const chars = pwdCharset();
  if (!chars) { showToast(T('select_one_type'), 'error'); return; }
  const pwds = Array.from({length: count}, () => pwdGenOne(len, chars));
  const panel = document.getElementById('pwdResult');
  panel.style.display = '';
  panel.innerHTML = `<div class="panel-label" style="margin-bottom:12px">${T('result_title', count)}</div>` +
    pwds.map((pwd, idx) => {
      const st = calcPwdStrength(pwd);
      const safePwd = pwd.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      return `<div class="result-row" style="margin-bottom:8px;display:flex;align-items:center;gap:10px">
        <span style="font-family:monospace;font-size:13px;flex:1;word-break:break-all;color:var(--neon)">${safePwd}</span>
        <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:${st.color}22;color:${st.color};border:1px solid ${st.color}44;flex-shrink:0">${T(st.i18nKey)}</span>
        <button class="copy-inline" onclick="copyText(document.getElementById('pwdResult')._pwds[${idx}],this)">${T('copy')}</button>
      </div>`;
    }).join('');
  panel._pwds = pwds;

  // update strength panel with first password
  _pwdUpdateStrengthPanel(pwds[0], chars);
}

function pwdCopyAll() {
  const T = _pgT || makeToolI18n(_pwdI18nDict);
  const panel = document.getElementById('pwdResult');
  if (!panel || !panel._pwds) { showToast(T('gen_first'), 'info'); return; }
  const text = panel._pwds.join('\n');
  navigator.clipboard.writeText(text).then(() => showToast(T('copied_n', panel._pwds.length)));
}

function calcPwdStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { key: 'weak',    i18nKey: 'str_weak',        color: '#ef4444' };
  if (score <= 3) return { key: 'medium',  i18nKey: 'str_medium',      color: '#f97316' };
  if (score <= 4) return { key: 'strong',  i18nKey: 'str_strong',      color: '#eab308' };
  return              { key: 'vstrong', i18nKey: 'str_very_strong', color: '#22c55e' };
}
