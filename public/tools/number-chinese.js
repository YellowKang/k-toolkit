/* ── 数字大写（财务）：按《支付结算办法》书写规则 ── */

// Chinese terms quoted in the English UI are data, tagged so they keep Chinese typography.
const _ncZh = text => `<span lang="zh">${text}</span>`;
const _ncDict = {
  zh: {
    title: '数字大写转换（财务）',
    input_ph: '输入金额，如 12345.67（可含逗号或 ¥）',
    convert: '转换',
    clear: '清空',
    upper: '财务大写',
    lower: '中文小写',
    copy_upper: '复制大写',
    rounded: v => `已按四舍五入到分：${v}`,
    err_invalid: '请输入有效金额，例如 12345.67',
    err_large: '金额过大：整数部分最多 16 位（万亿级）',
    rules: '规则：数字中间有 0 写“零”；角为 0 分不为 0 时元后写“零”；到元为止写“整”，有分不写“整”。',
  },
  en: {
    title: 'Chinese Financial Numerals',
    input_ph: 'Amount, e.g. 12345.67 (commas or ¥ allowed)',
    convert: 'Convert',
    clear: 'Clear',
    upper: `Financial uppercase (${_ncZh('大写')})`,
    lower: `Chinese lowercase (${_ncZh('小写')})`,
    copy_upper: 'Copy uppercase',
    rounded: v => `Rounded to cents: ${v}`,
    err_invalid: 'Enter a valid amount, e.g. 12345.67',
    err_large: 'Amount too large: at most 16 integer digits',
    rules: `Rules: write ${_ncZh('零')} for inner zeros, ${_ncZh('零')} after ${_ncZh('元')} when jiao is 0 but fen is not, and ${_ncZh('整')} when the amount ends at ${_ncZh('元')}.`,
  },
};

const _NC_UPPER = { digits: '零壹贰叁肆伍陆柒捌玖', units: ['', '拾', '佰', '仟'] };
const _NC_LOWER = { digits: '零一二三四五六七八九', units: ['', '十', '百', '千'] };

/** Parse an amount into integer cents (half-up on the third decimal); null when invalid. */
function ncParseAmount(input) {
  let s = String(input ?? '').trim().replace(/[,，\s]/g, '').replace(/^[¥￥]/, '');
  if (/e/i.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    s = n.toFixed(2);
  }
  const m = s.match(/^([+-])?(\d*)(?:\.(\d*))?$/);
  if (!m || (!m[2] && !m[3])) return null;
  const frac = m[3] || '';
  let cents = BigInt(m[2] || '0') * 100n + BigInt((frac + '00').slice(0, 2));
  if ((frac[2] || '0') >= '5') cents += 1n;
  return { negative: m[1] === '-' && cents > 0n, cents, exact: frac.length <= 2 };
}

function _ncSection(n, set) {
  let s = '', zero = false;
  for (let i = 3; i >= 0; i--) {
    const d = Math.floor(n / 10 ** i) % 10;
    if (d === 0) { if (s) zero = true; continue; }
    if (zero) { s += set.digits[0]; zero = false; }
    s += set.digits[d] + set.units[i];
  }
  return s;
}

function _ncInteger(n, set) {
  if (n >= 100000000n) {
    const lo = n % 100000000n;
    return _ncInteger(n / 100000000n, set) + '亿' + (lo ? (lo < 10000000n ? set.digits[0] : '') + _ncInteger(lo, set) : '');
  }
  if (n >= 10000n) {
    const lo = Number(n % 10000n);
    return _ncSection(Number(n / 10000n), set) + '万' + (lo ? (lo < 1000 ? set.digits[0] : '') + _ncSection(lo, set) : '');
  }
  return n ? _ncSection(Number(n), set) : '';
}

function _ncAmount(input, set, simplifyTen) {
  const amount = typeof input === 'object' && input && 'cents' in input ? input : ncParseAmount(input);
  if (!amount) throw new Error('invalid');
  const yuan = amount.cents / 100n, rest = Number(amount.cents % 100n);
  if (yuan >= 10n ** 16n) throw new Error('too-large');
  let int = _ncInteger(yuan, set);
  if (simplifyTen && int.startsWith('一十')) int = int.slice(1);
  const jiao = Math.floor(rest / 10), fen = rest % 10;
  let out;
  if (!rest) out = (int || set.digits[0]) + '元整';
  else {
    out = int ? int + '元' : '';
    if (jiao) out += set.digits[jiao] + '角';
    else if (int) out += set.digits[0];
    if (fen) out += set.digits[fen] + '分';
  }
  return (amount.negative ? '负' : '') + out;
}

/** 财务大写，如 1409.5 → 壹仟肆佰零玖元伍角；325.04 → 叁佰贰拾伍元零肆分 */
function numToChinese(input) { return _ncAmount(input, _NC_UPPER, false); }
/** 中文小写金额，如 12.3 → 十二元三角 */
function numToSmallChinese(input) { return _ncAmount(input, _NC_LOWER, true); }

function renderNumberChinese(el) {
  const T = makeToolI18n(_ncDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <input class="tool-input" id="ncInput" inputmode="decimal" autocomplete="off" placeholder="${T('input_ph')}" oninput="ncConvert()" style="margin-bottom:14px">
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="ncConvert()">${T('convert')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('ncInput').value='';ncConvert()">${T('clear')}</button>
      </div>
      <div id="ncError" style="display:none;margin-top:10px;font-size:13px;color:#ef4444"></div>
    </div>
    <div class="tool-card-panel" id="ncResult" style="display:none">
      <div style="margin-bottom:10px">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${T('upper')}</div>
        <div id="ncOutput" lang="zh" style="font-size:18px;font-weight:700;color:var(--neon);word-break:break-all"></div>
      </div>
      <div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">${T('lower')}</div>
        <div id="ncSmall" lang="zh" style="font-size:16px;color:var(--accent)"></div>
      </div>
      <div id="ncNote" style="font-size:12px;color:var(--text-muted);margin-top:10px"></div>
      <button class="btn btn-secondary" style="margin-top:12px" onclick="copyText(document.getElementById('ncOutput').textContent,this)">${T('copy_upper')}</button>
    </div>
    <div class="tool-card-panel" style="font-size:12px;color:var(--text-muted)">${T('rules')}</div>`;
}

function ncConvert() {
  const T = makeToolI18n(_ncDict);
  const raw = document.getElementById('ncInput').value;
  const result = document.getElementById('ncResult'), error = document.getElementById('ncError');
  if (!raw.trim()) { result.style.display = 'none'; error.style.display = 'none'; return; }
  const amount = ncParseAmount(raw);
  try {
    if (!amount) throw new Error('invalid');
    document.getElementById('ncOutput').textContent = numToChinese(amount);
    document.getElementById('ncSmall').textContent = numToSmallChinese(amount);
    const cents = amount.cents.toString().padStart(3, '0');
    document.getElementById('ncNote').textContent = amount.exact ? '' : T('rounded', (amount.negative ? '-' : '') + cents.slice(0, -2) + '.' + cents.slice(-2));
    result.style.display = '';
    error.style.display = 'none';
  } catch (e) {
    error.textContent = T(e.message === 'too-large' ? 'err_large' : 'err_invalid');
    error.style.display = '';
    result.style.display = 'none';
  }
}
