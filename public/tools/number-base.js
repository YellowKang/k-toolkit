/* ── 进制转换：BigInt 任意精度，非法字符提示而不是静默截断 ── */

const _nbDict = {
  zh: {
    input: '输入数值（支持任意长度，可用空格/下划线分组，可带 0x/0o/0b 前缀）',
    dec: '十进制 (DEC)', hex: '十六进制 (HEX)', oct: '八进制 (OCT)', bin: '二进制 (BIN)',
    invalid: (name, ch) => `${name} 中含非法字符：${ch}`,
    negative: '负数按绝对值换算，结果带负号',
    bits: (n, bytes) => `${n} 位 · ${bytes} 字节`,
    char_title: 'ASCII / Unicode',
    char: '字符', code: '码点 (十进制)', escape: 'Unicode 转义',
    ref: '快速参考',
  },
  en: {
    input: 'Number (any length; spaces/underscores allowed; 0x/0o/0b prefixes accepted)',
    dec: 'Decimal (DEC)', hex: 'Hexadecimal (HEX)', oct: 'Octal (OCT)', bin: 'Binary (BIN)',
    invalid: (name, ch) => `Invalid character in ${name}: ${ch}`,
    negative: 'Negative values convert by magnitude and keep the sign',
    bits: (n, bytes) => `${n} bit(s) · ${bytes} byte(s)`,
    char_title: 'ASCII / Unicode',
    char: 'Character', code: 'Code point (decimal)', escape: 'Unicode escape',
    ref: 'Quick reference',
  },
};

const _NB_BASES = { dec: [10, /^[0-9]+$/, ''], hex: [16, /^[0-9a-f]+$/i, '0x'], oct: [8, /^[0-7]+$/, '0o'], bin: [2, /^[01]+$/, '0b'] };

/** Parse a digit string in base 2/8/10/16 into BigInt; returns { value } or { error: badChar }. */
function nbParse(text, from) {
  const [radix, pattern, prefix] = _NB_BASES[from];
  let s = String(text ?? '').trim().replace(/[\s_]/g, '');
  const negative = s.startsWith('-');
  if (negative) s = s.slice(1);
  if (prefix && s.toLowerCase().startsWith(prefix)) s = s.slice(2);
  if (!s) return { empty: true };
  if (!pattern.test(s)) return { error: [...s].find(c => !pattern.test(c)) };
  const value = radix === 10 ? BigInt(s) : BigInt(prefix + s);
  return { value: negative ? -value : value };
}

function nbFormat(value, radix) {
  const s = (value < 0n ? -value : value).toString(radix);
  return (value < 0n ? '-' : '') + (radix === 16 ? s.toUpperCase() : s);
}

function renderNumberBase(el) {
  const T = makeToolI18n(_nbDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('input')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px" id="baseGrid">
        ${['dec', 'hex', 'oct', 'bin'].map(k => `
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:600">${T(k)}</div>
          <input class="tool-input" id="nb${k[0].toUpperCase() + k.slice(1)}" spellcheck="false" autocomplete="off" style="font-family:monospace" placeholder="${{ dec: '255', hex: 'FF', oct: '377', bin: '11111111' }[k]}" oninput="nbConvert('${k}',this.value)">
        </div>`).join('')}
      </div>
      <div id="nbMeta" style="margin-top:10px;font-size:12px;color:var(--text-muted);min-height:16px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('char_title')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <div style="flex:1;min-width:140px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${T('char')}</div>
          <input class="tool-input" id="nbChar" placeholder="A" oninput="nbCharConvert(this.value)">
        </div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${T('code')}</div>
          <input class="tool-input" id="nbCode" placeholder="65" inputmode="numeric" oninput="nbCodeConvert(this.value)">
        </div>
        <div style="flex:1;min-width:140px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${T('escape')}</div>
          <input class="tool-input" id="nbUni" placeholder="\\u0041" readonly style="opacity:0.7;font-family:monospace">
        </div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('ref')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" id="nbRefBtns">
        ${['0', '32', '48', '65', '97', '127', '128', '255', '256', '1000', '65535', '2147483647', '18446744073709551615'].map(n =>
          `<button class="copy-inline" onclick="nbFill('${n}')" style="font-family:monospace">${n.length > 12 ? '2⁶⁴−1' : n}</button>`
        ).join('')}
      </div>
    </div>`;
}

function nbFill(dec) {
  document.getElementById('nbDec').value = dec;
  nbConvert('dec', dec);
}

let _nbLock = false;
function nbConvert(from, val) {
  if (_nbLock) return;
  const T = makeToolI18n(_nbDict);
  _nbLock = true;
  const meta = document.getElementById('nbMeta');
  try {
    const parsed = nbParse(val, from);
    const ids = { dec: 'nbDec', hex: 'nbHex', oct: 'nbOct', bin: 'nbBin' };
    if (parsed.empty) {
      Object.entries(ids).forEach(([k, id]) => { if (k !== from) document.getElementById(id).value = ''; });
      meta.textContent = ''; meta.style.color = 'var(--text-muted)';
      return;
    }
    if (parsed.error) {
      meta.textContent = T('invalid', T(from), parsed.error);
      meta.style.color = '#ef4444';
      return;
    }
    const n = parsed.value;
    for (const [k, id] of Object.entries(ids)) if (k !== from) document.getElementById(id).value = nbFormat(n, _NB_BASES[k][0]);
    const magnitude = n < 0n ? -n : n;
    const bits = magnitude === 0n ? 1 : magnitude.toString(2).length;
    meta.style.color = 'var(--text-muted)';
    meta.textContent = T('bits', bits, Math.ceil(bits / 8)) + (n < 0n ? ' · ' + T('negative') : '');
    if (n >= 0n && n <= 0x10FFFFn) {
      const code = Number(n);
      document.getElementById('nbCode').value = code;
      document.getElementById('nbUni').value = code <= 0xFFFF ? '\\u' + code.toString(16).toUpperCase().padStart(4, '0') : '\\u{' + code.toString(16).toUpperCase() + '}';
      try { document.getElementById('nbChar').value = (code >= 0xD800 && code <= 0xDFFF) ? '' : String.fromCodePoint(code); } catch {}
    }
  } finally { _nbLock = false; }
}

function nbCharConvert(ch) {
  const first = [...(ch || '')][0];
  if (!first) return;
  const code = first.codePointAt(0);
  document.getElementById('nbDec').value = String(code);
  nbConvert('dec', String(code));
  document.getElementById('nbChar').value = first;
}

function nbCodeConvert(val) {
  if (!/^\s*\d+\s*$/.test(val)) return;
  document.getElementById('nbDec').value = val.trim();
  nbConvert('dec', val.trim());
}
