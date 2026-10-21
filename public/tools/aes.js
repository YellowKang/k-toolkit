/* ── AES 加解密：算法与输出格式在 compute/aes.js（页面与 Agent 共用），格式说明见 docs/aes.md ──
 * Agent 的页面执行器依赖 aesInput/aesKey/aesMode/aesOutput 等 id 以及 doAES、setAESMode。 */

const _aesDict = {
  zh: {
    enc: 'AES 加密', dec: 'AES 解密',
    mode: '模式', mode_gcm: 'GCM（推荐）', mode_cbc: 'CBC（PKCS#7 填充）', mode_ctr: 'CTR',
    key_type: '密钥类型',
    key_types: { password: '口令 · PBKDF2', openssl: '口令 · OpenSSL enc', hex: '原始密钥 · Hex', base64: '原始密钥 · Base64', utf8: '原始密钥 · UTF-8 文本' },
    key: '密钥 / 口令',
    key_ph: { password: '输入口令', openssl: '输入口令（同 openssl -pass）', hex: '32 / 48 / 64 位 Hex', base64: '16 / 24 / 32 字节的 Base64', utf8: '16 / 24 / 32 字节文本，如 0123456789abcdef' },
    key_ok: n => `${n} 字节 · AES-${n * 8}`,
    key_need: n => `原始密钥须为 16 / 24 / 32 字节，当前 ${n} 字节`,
    key_bad: type => `不是有效的 ${type === 'hex' ? 'Hex' : 'Base64'}`,
    key_size: '密钥长度', bits: n => `${n} 位`, iterations: 'PBKDF2 迭代次数',
    auto: '自动（随机，拼在输出开头）', given_hex: '指定 Hex', given_utf8: '指定 UTF-8',
    salt_ph: '推荐 16 字节（32 位 Hex）', salt_ph_openssl: '8 字节（16 位 Hex）',
    iv_ph: (n, utf8) => utf8 ? `${n} 字节文本` : `${n * 2} 位 Hex（${n} 字节）`,
    random: '随机生成',
    aad: 'AAD（可选，附加认证数据）', aad_ph: 'UTF-8 文本，解密时必须一致',
    encoding: '输出编码',
    parts: { magic: 'Salted__', salt: 'salt', iv: 'IV', ciphertext: '密文', tag: 'tag' },
    raw_key: '原始密钥',
    sum_enc: (alg, kdf, encoding, layout) => `${alg} · ${kdf} → ${encoding}（${layout}）`,
    sum_dec: (alg, kdf, layout, passphrase) => `${alg} · ${kdf} · 按 ${layout} 解析，自动识别 Base64 / Hex${passphrase ? '，并识别 OpenSSL Salted__ 与旧格式' : ''}`,
    input_enc: '明文', input_dec: '密文',
    ph_enc: '输入要加密的文本…',
    ph_dec: '粘贴密文：Base64 / Hex、OpenSSL "Salted__"，或旧版页面的 IV:密文',
    run: '执行', swap: '↕ 结果→输入', clear: '清空', copy: '复制结果', copy_short: '复制', copy_code: '复制代码',
    working: '处理中…', done_enc: '✓ 加密完成', done_dec: '✓ 解密完成', error: '✗ 错误', swapped: '已填入输入框',
    legacy: '旧格式',
    legacy_note: '这是旧版页面的格式（SHA-256 口令派生），建议用新格式重新加密。',
    binary: '明文不是有效的 UTF-8，已显示 Hex。',
    ctr_note: 'CTR 没有完整性校验：密钥或 IV 不对时也会输出乱码。',
    js_engine: '浏览器的 WebCrypto 不支持 192 位密钥，已改用内置 JS 实现（结果相同）。',
    hint_layout: layout => `当前按 ${layout} 解析。若 IV 或 salt 没有拼在密文里，请改为“指定”并填写；口令、迭代次数和密钥长度需与加密时一致。`,
    d_format: '格式', d_algorithm: '算法', d_kdf: '密钥派生', d_key: '密钥 (Hex)', d_salt: 'Salt (Hex)', d_iv: 'IV (Hex)',
    d_tag: 'Tag (Hex)', d_ciphertext: '密文（不含 salt / IV）', d_layout: '输出结构',
    formats: { passphrase: '口令（PBKDF2）', openssl: 'OpenSSL Salted__', raw: '原始密钥', legacy: '旧格式（SHA-256 口令）' },
    kdf: { passphrase: n => `PBKDF2-HMAC-SHA256，${n} 次`, openssl: n => `openssl enc -pbkdf2 -iter ${n} -md sha256（同时派生 IV）`, raw: () => '无（原始密钥）', legacy: () => 'SHA-256(口令)' },
    embedded: '（已拼在输出中）', separate: '（未写入输出，解密时需提供）', derived: '（由口令派生）',
    snippets: '在其他环境解密', pw: '你的口令',
    openssl_gcm: '# openssl enc 不支持 GCM（AEAD），请用下面的 Java / Python',
    notes_title: '互通说明',
    notes: [
      '全部计算在浏览器内完成（WebCrypto），口令与密钥不会上传。',
      'GCM：128 位 tag 附在密文末尾，等同 Java AES/GCM/NoPadding + GCMParameterSpec(128, iv)、Python AESGCM / pycryptodome MODE_GCM；nonce 默认 12 字节。',
      'CBC：PKCS#7 填充（Java 写作 PKCS5Padding）。CTR：16 字节 IV 作为 128 位大端计数器，等同 Java AES/CTR/NoPadding、openssl -aes-*-ctr。',
      '口令 · PBKDF2：密钥 = PBKDF2WithHmacSHA256(口令, salt, 迭代次数, 密钥位数)，输出 = salt(16) ‖ IV ‖ 密文 ‖ tag。默认参数与 Agent 的 aes_encrypt 相同，可互相解密。',
      '口令 · OpenSSL enc：与 openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -md sha256 -a 互通，输出以 "Salted__" 开头；openssl 不写 -iter 时默认 10000 次。',
      '原始密钥：Hex / Base64 / UTF-8 解码后须为 16 / 24 / 32 字节，对应 Java SecretKeySpec、openssl enc -K <hex> -iv <hex>。',
      'salt / IV 选“自动”时随机生成并拼在输出开头；选“指定”表示双方约定的值，不写入输出，解密时填同样的值。',
      '解密口令密文时自动识别 OpenSSL "Salted__" 与旧版页面的 IV:密文 格式（标注为旧格式）。',
      '不支持 ECB、ZeroPadding，以及 CryptoJS 口令模式 / 不带 -pbkdf2 的 openssl（MD5 EVP_BytesToKey）；CryptoJS 请改用原始密钥 + IV。',
    ],
    fields: { Key: '密钥', IV: 'IV', Salt: 'Salt', Ciphertext: '密文' },
    errors: {
      NO_WEBCRYPTO: '当前环境不支持 WebCrypto（需要 HTTPS 或 localhost）',
      EMPTY_KEY: '请输入口令或密钥',
      EMPTY_INPUT: '请输入要处理的内容',
      NEED_SALT: '已选择指定 Salt，请填写 Hex 值或改为自动',
      NEED_IV: '已选择指定 IV，请填写或改为自动',
      KEY_SIZE: '密钥长度只能是 128 / 192 / 256 位',
      ITERATIONS: '迭代次数须为 1 – 10,000,000 的整数',
      AAD_MODE: 'AAD 只用于 GCM 模式',
      IV_OPENSSL: 'OpenSSL 格式的 IV 由口令派生，无需填写',
      IV_LENGTH: e => e.mode === 'GCM' ? `GCM nonce 须为 1–128 字节（推荐 12），当前 ${e.bytes} 字节` : `${e.mode} 的 IV 必须是 16 字节，当前 ${e.bytes} 字节`,
      SALT_KEY: 'Salt 只用于口令模式',
      SALT_LENGTH: e => e.keyType === 'openssl' ? `OpenSSL 的 salt 必须是 8 字节，当前 ${e.bytes} 字节` : 'Salt 不能为空',
      KEY_LENGTH: e => `原始密钥须为 16 / 24 / 32 字节（AES-128 / 192 / 256），当前 ${e.bytes} 字节`,
      BAD_HEX: (e, field) => `${field}不是有效的 Hex`,
      BAD_BASE64: (e, field) => `${field}不是有效的 Base64`,
      OPENSSL_GCM: 'openssl enc 不支持 GCM，请选择 CBC 或 CTR',
      NOT_OPENSSL: '缺少 openssl enc 输出开头的 "Salted__"，请确认是带 salt 的 OpenSSL 密文',
      TOO_SHORT: '密文太短，缺少 salt / IV / tag',
      BLOCK_LENGTH: 'CBC 密文长度必须是 16 字节的整数倍',
      DECRYPT_FAILED: e => e.mode === 'GCM' ? '解密失败：密钥、IV 或 AAD 不匹配，或数据已被改动（GCM 认证失败）'
        : e.mode === 'auto' ? '解密失败：请检查口令、模式、密钥长度和迭代次数' : '解密失败：密钥、IV 或模式不匹配（填充校验失败）',
      ENCRYPT_FAILED: e => '加密失败：' + e.message,
    },
    failed: '操作失败：',
  },
  en: {
    enc: 'Encrypt', dec: 'Decrypt',
    mode: 'Mode', mode_gcm: 'GCM (recommended)', mode_cbc: 'CBC (PKCS#7 padding)', mode_ctr: 'CTR',
    key_type: 'Key type',
    key_types: { password: 'Passphrase · PBKDF2', openssl: 'Passphrase · OpenSSL enc', hex: 'Raw key · Hex', base64: 'Raw key · Base64', utf8: 'Raw key · UTF-8 text' },
    key: 'Key / passphrase',
    key_ph: { password: 'Enter a passphrase', openssl: 'Passphrase (same as openssl -pass)', hex: '32 / 48 / 64 hex digits', base64: 'Base64 of 16 / 24 / 32 bytes', utf8: '16 / 24 / 32 bytes of text, e.g. 0123456789abcdef' },
    key_ok: n => `${n} bytes · AES-${n * 8}`,
    key_need: n => `Raw keys are 16 / 24 / 32 bytes; this one is ${n}`,
    key_bad: type => `Not valid ${type === 'hex' ? 'hex' : 'Base64'}`,
    key_size: 'Key size', bits: n => `${n}-bit`, iterations: 'PBKDF2 iterations',
    auto: 'Auto (random, prepended)', given_hex: 'Given (hex)', given_utf8: 'Given (UTF-8)',
    salt_ph: '16 bytes recommended (32 hex digits)', salt_ph_openssl: '8 bytes (16 hex digits)',
    iv_ph: (n, utf8) => utf8 ? `${n} bytes of text` : `${n * 2} hex digits (${n} bytes)`,
    random: 'Generate random',
    aad: 'AAD (optional additional data)', aad_ph: 'UTF-8 text; must match when decrypting',
    encoding: 'Output encoding',
    parts: { magic: 'Salted__', salt: 'salt', iv: 'IV', ciphertext: 'ciphertext', tag: 'tag' },
    raw_key: 'raw key',
    sum_enc: (alg, kdf, encoding, layout) => `${alg} · ${kdf} → ${encoding} (${layout})`,
    sum_dec: (alg, kdf, layout, passphrase) => `${alg} · ${kdf} · reads ${layout}, detects Base64 / hex${passphrase ? ', OpenSSL Salted__ and the legacy format' : ''}`,
    input_enc: 'Plaintext', input_dec: 'Ciphertext',
    ph_enc: 'Text to encrypt…',
    ph_dec: 'Paste ciphertext: Base64 / hex, OpenSSL "Salted__", or the old page\'s IV:data',
    run: 'Run', swap: '↕ Result → input', clear: 'Clear', copy: 'Copy result', copy_short: 'Copy', copy_code: 'Copy code',
    working: 'Working…', done_enc: '✓ Encrypted', done_dec: '✓ Decrypted', error: '✗ Error', swapped: 'Moved to input',
    legacy: 'Legacy format',
    legacy_note: 'Made by the previous version of this page (SHA-256 of the passphrase as key). Re-encrypt it in the new format.',
    binary: 'The plaintext is not valid UTF-8; showing hex.',
    ctr_note: 'CTR has no integrity check: a wrong key or IV still produces (garbled) output.',
    js_engine: 'This browser\'s WebCrypto rejects 192-bit keys, so the built-in JS cipher was used (same result).',
    hint_layout: layout => `Read as ${layout}. If the IV or salt is not part of the ciphertext, switch it to "Given" and fill it in; passphrase, iterations and key size must match the encryption.`,
    d_format: 'Format', d_algorithm: 'Algorithm', d_kdf: 'Key derivation', d_key: 'Key (hex)', d_salt: 'Salt (hex)', d_iv: 'IV (hex)',
    d_tag: 'Tag (hex)', d_ciphertext: 'Ciphertext (no salt / IV)', d_layout: 'Layout',
    formats: { passphrase: 'Passphrase (PBKDF2)', openssl: 'OpenSSL Salted__', raw: 'Raw key', legacy: 'Legacy (SHA-256 passphrase)' },
    kdf: { passphrase: n => `PBKDF2-HMAC-SHA256, ${n} iterations`, openssl: n => `openssl enc -pbkdf2 -iter ${n} -md sha256 (derives the IV too)`, raw: () => 'None (raw key)', legacy: () => 'SHA-256(passphrase)' },
    embedded: '(in the output)', separate: '(not in the output; needed to decrypt)', derived: '(derived from the passphrase)',
    snippets: 'Decrypt elsewhere', pw: 'your-passphrase',
    openssl_gcm: '# openssl enc does not support GCM (AEAD); use Java or Python below',
    notes_title: 'Interoperability notes',
    notes: [
      'Everything runs in the browser (WebCrypto); passphrases and keys are never uploaded.',
      'GCM: the 128-bit tag follows the ciphertext, as with Java AES/GCM/NoPadding + GCMParameterSpec(128, iv) and Python AESGCM / pycryptodome MODE_GCM; the nonce is 12 bytes by default.',
      'CBC: PKCS#7 padding (Java calls it PKCS5Padding). CTR: the 16-byte IV is a 128-bit big-endian counter, as in Java AES/CTR/NoPadding and openssl -aes-*-ctr.',
      'Passphrase · PBKDF2: key = PBKDF2WithHmacSHA256(passphrase, salt, iterations, key bits); output = salt(16) ‖ IV ‖ ciphertext ‖ tag. The defaults match the Agent\'s aes_encrypt, so each decrypts the other.',
      'Passphrase · OpenSSL enc: interoperates with openssl enc -aes-256-cbc -pbkdf2 -iter 100000 -md sha256 -a; the output starts with "Salted__". Without -iter, openssl uses 10000 iterations.',
      'Raw key: the decoded hex / Base64 / UTF-8 must be 16 / 24 / 32 bytes, like Java SecretKeySpec or openssl enc -K <hex> -iv <hex>.',
      'Auto salt / IV values are random and prepended to the output; given values are agreed in advance, left out of the output and must be entered again to decrypt.',
      'Passphrase decryption also recognises OpenSSL "Salted__" data and the old page\'s IV:data output (marked as legacy).',
      'Not supported: ECB, zero padding, and CryptoJS passphrases / openssl without -pbkdf2 (MD5 EVP_BytesToKey). Use a raw key and IV with CryptoJS instead.',
    ],
    fields: { Key: 'Key', IV: 'IV', Salt: 'Salt', Ciphertext: 'Ciphertext' },
    errors: {
      NO_WEBCRYPTO: 'WebCrypto is unavailable here (HTTPS or localhost required)',
      EMPTY_KEY: 'Enter a passphrase or key',
      EMPTY_INPUT: 'Enter something to process',
      NEED_SALT: 'Salt is set to "Given": enter a hex value or switch to Auto',
      NEED_IV: 'IV is set to "Given": enter a value or switch to Auto',
      KEY_SIZE: 'Key size must be 128, 192 or 256 bits',
      ITERATIONS: 'Iterations must be an integer from 1 to 10,000,000',
      AAD_MODE: 'AAD only applies to GCM',
      IV_OPENSSL: 'The OpenSSL format derives the IV from the passphrase; leave it empty',
      IV_LENGTH: e => e.mode === 'GCM' ? `The GCM nonce must be 1–128 bytes (12 recommended); this one is ${e.bytes}` : `The ${e.mode} IV must be 16 bytes; this one is ${e.bytes}`,
      SALT_KEY: 'Salt only applies to passphrases',
      SALT_LENGTH: e => e.keyType === 'openssl' ? `The OpenSSL salt must be 8 bytes; this one is ${e.bytes}` : 'Salt must not be empty',
      KEY_LENGTH: e => `Raw keys must be 16 / 24 / 32 bytes (AES-128 / 192 / 256); this one is ${e.bytes}`,
      BAD_HEX: (e, field) => `${field} is not valid hex`,
      BAD_BASE64: (e, field) => `${field} is not valid Base64`,
      OPENSSL_GCM: 'openssl enc does not support GCM; choose CBC or CTR',
      NOT_OPENSSL: 'Missing the "Salted__" header that openssl enc writes; is this salted OpenSSL output?',
      TOO_SHORT: 'The ciphertext is too short for its salt / IV / tag',
      BLOCK_LENGTH: 'CBC ciphertext must be a multiple of 16 bytes',
      DECRYPT_FAILED: e => e.mode === 'GCM' ? 'Decryption failed: wrong key, IV or AAD, or the data was modified (GCM authentication)'
        : e.mode === 'auto' ? 'Decryption failed: check the passphrase, mode, key size and iterations' : 'Decryption failed: wrong key, IV or mode (bad padding)',
      ENCRYPT_FAILED: e => 'Encryption failed: ' + e.message,
    },
    failed: 'Failed: ',
  },
};

let _aesRunId = 0;
const _aesJava = { GCM: 'AES/GCM/NoPadding', CBC: 'AES/CBC/PKCS5Padding', CTR: 'AES/CTR/NoPadding' };

function renderAES(el) {
  const T = makeToolI18n(_aesDict);
  const label = text => `<span style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${escHtml(text)}</span>`;
  const options = (pairs, selected) => pairs.map(([value, text]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${escHtml(text)}</option>`).join('');
  const given = (kind, choices) => `
    <div style="display:flex;gap:6px">
      <select class="tool-input" id="aes${kind}Type" style="width:auto;flex:0 1 auto;min-width:0" onchange="_aesSync()">${options(choices, 'auto')}</select>
      <input class="tool-input" id="aes${kind}" type="text" spellcheck="false" autocomplete="off" style="flex:1;min-width:0;font-family:monospace">
      <button class="btn btn-secondary" type="button" title="${escHtml(T('random'))}" aria-label="${escHtml(T('random'))}" style="padding:6px 10px" onclick="_aesRandom('${kind}')">🎲</button>
    </div>`;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <button class="btn btn-primary" id="aesEncBtn" aria-pressed="true" onclick="setAESMode('enc')">${T('enc')}</button>
        <button class="btn btn-secondary" id="aesDecBtn" aria-pressed="false" onclick="setAESMode('dec')">${T('dec')}</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:12px">
        <label>${label(T('mode'))}<select class="tool-input" id="aesMode" onchange="_aesSync()" oninput="_aesSync()">${options([['GCM', T('mode_gcm')], ['CBC', T('mode_cbc')], ['CTR', T('mode_ctr')]], 'GCM')}</select></label>
        <label>${label(T('key_type'))}<select class="tool-input" id="aesKeyType" onchange="_aesSync()">${options(Object.entries(T('key_types')), 'password')}</select></label>
        <label id="aesKeySizeField">${label(T('key_size'))}<select class="tool-input" id="aesKeySize" onchange="_aesSync()">${options(['256', '192', '128'].map(n => [n, T('bits', n)]), '256')}</select></label>
        <label id="aesIterField">${label(T('iterations'))}<input class="tool-input" id="aesIter" type="number" min="1" max="10000000" step="1" value="100000" oninput="_aesSync()"></label>
      </div>
      <div style="margin-bottom:12px">
        <label style="display:block">${label(T('key'))}<input class="tool-input" id="aesKey" type="text" spellcheck="false" autocomplete="off" oninput="_aesSync()"></label>
        <div id="aesKeyHint" style="font-size:12px;margin-top:4px;min-height:16px"></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:12px">
        <div id="aesSaltField">${label('Salt')}${given('Salt', [['auto', T('auto')], ['hex', T('given_hex')]])}</div>
        <div id="aesIvField">${label('IV / Nonce')}${given('Iv', [['auto', T('auto')], ['hex', T('given_hex')], ['utf8', T('given_utf8')]])}</div>
        <label id="aesAadField">${label(T('aad'))}<input class="tool-input" id="aesAad" type="text" spellcheck="false" placeholder="${escHtml(T('aad_ph'))}"></label>
        <label id="aesEncodingField">${label(T('encoding'))}<select class="tool-input" id="aesEncoding" onchange="_aesSync()">${options([['base64', 'Base64'], ['hex', 'Hex']], 'base64')}</select></label>
      </div>
      <div id="aesSummary" style="font-size:12px;color:var(--text-muted);margin-bottom:12px;word-break:break-word"></div>
      <div class="panel-label" id="aesInputLabel">${T('input_enc')}</div>
      <textarea class="tool-textarea" id="aesInput" rows="5" spellcheck="false" placeholder="${escHtml(T('ph_enc'))}"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" id="aesRunBtn" onclick="doAES()">${T('run')}</button>
        <button class="btn btn-secondary" onclick="aesSwap()">${T('swap')}</button>
        <button class="btn btn-secondary" onclick="_aesClear()">${T('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="aesResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div class="panel-label" style="margin:0" id="aesStatus" aria-live="polite"></div>
          <span id="aesBadge" style="display:none;font-size:11px;padding:2px 8px;border-radius:10px;color:#f59e0b;border:1px solid rgba(245,158,11,.45);background:rgba(245,158,11,.12)">${T('legacy')}</span>
        </div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('aesOutput').textContent,this)">${T('copy')}</button>
      </div>
      <pre class="result-box" id="aesOutput" style="white-space:pre-wrap;word-break:break-all"></pre>
      <div id="aesNote" style="display:none;font-size:12px;color:#f59e0b;margin-top:8px"></div>
      <div id="aesDetails" style="margin-top:12px"></div>
      <div id="aesSnippetBox" style="display:none;margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px">
          <div class="panel-label" style="margin:0">${T('snippets')}</div>
          <button class="btn btn-secondary" style="padding:4px 12px;font-size:12px" onclick="copyText(document.getElementById('aesSnippets').textContent,this)">${T('copy_code')}</button>
        </div>
        <pre class="result-box" id="aesSnippets" style="white-space:pre-wrap;word-break:break-all;max-height:340px;overflow:auto;font-size:12px"></pre>
      </div>
    </div>
    <div class="tool-card-panel">
      <details>
        <summary style="cursor:pointer;font-size:13px">${T('notes_title')}</summary>
        <ul style="font-size:12px;color:var(--text-muted);line-height:1.7;margin:10px 0 0;padding-left:18px">${T('notes').map(note => `<li>${escHtml(note)}</li>`).join('')}</ul>
      </details>
    </div>`;
  window._aesMode = 'enc';
  _aesSync();
  ToolCompute.load('aes').then(_aesSync).catch(() => {});
}

function setAESMode(mode) {
  window._aesMode = mode === 'dec' ? 'dec' : 'enc';
  const encBtn = document.getElementById('aesEncBtn'), decBtn = document.getElementById('aesDecBtn');
  if (!encBtn) return;
  encBtn.className = window._aesMode === 'enc' ? 'btn btn-primary' : 'btn btn-secondary';
  decBtn.className = window._aesMode === 'dec' ? 'btn btn-primary' : 'btn btn-secondary';
  encBtn.setAttribute('aria-pressed', String(window._aesMode === 'enc'));
  decBtn.setAttribute('aria-pressed', String(window._aesMode === 'dec'));
  document.getElementById('aesResult').style.display = 'none';
  _aesSync();
}

/** Form → compute options; salt/IV are passed only when set to "Given". */
function _aesOptions() {
  const $ = id => document.getElementById(id);
  const mode = $('aesMode').value || 'GCM', keyType = $('aesKeyType').value, passphrase = keyType === 'password' || keyType === 'openssl';
  const saltType = passphrase ? $('aesSaltType').value : 'auto', ivType = keyType === 'openssl' ? 'auto' : $('aesIvType').value;
  return {
    mode, keyType, key: $('aesKey').value, keySize: passphrase ? $('aesKeySize').value : undefined, iterations: passphrase ? $('aesIter').value : undefined,
    saltType, salt: saltType === 'auto' ? '' : $('aesSalt').value, ivType, iv: ivType === 'auto' ? '' : $('aesIv').value,
    ivEncoding: ivType === 'utf8' ? 'utf8' : 'hex', aad: mode === 'GCM' ? $('aesAad').value : '',
  };
}

const _aesLayoutText = (T, layout) => layout.map(p => T('parts')[p.part] + (p.bytes ? `(${p.bytes}B)` : '')).join(' ‖ ');

/** Show only the fields that apply, keep OpenSSL off GCM, and describe what the current settings produce. */
function _aesSync() {
  const T = makeToolI18n(_aesDict), $ = id => document.getElementById(id), aes = window.KCompute?.aes;
  if (!$('aesMode')) return;
  const keyType = $('aesKeyType').value, passphrase = keyType === 'password' || keyType === 'openssl', enc = window._aesMode !== 'dec';
  $('aesMode').querySelector('option[value="GCM"]').disabled = keyType === 'openssl';
  if (keyType === 'openssl' && $('aesMode').value === 'GCM') $('aesMode').value = 'CBC';
  const o = _aesOptions(), show = (id, visible) => { $(id).style.display = visible ? '' : 'none'; };
  show('aesKeySizeField', passphrase); show('aesIterField', passphrase); show('aesSaltField', passphrase);
  show('aesIvField', keyType !== 'openssl'); show('aesAadField', o.mode === 'GCM'); show('aesEncodingField', enc);
  show('aesSalt', o.saltType !== 'auto'); show('aesIv', o.ivType !== 'auto');
  $('aesKey').placeholder = T('key_ph')[keyType];
  $('aesSalt').placeholder = T(keyType === 'openssl' ? 'salt_ph_openssl' : 'salt_ph');
  $('aesIv').placeholder = T('iv_ph', o.mode === 'GCM' ? 12 : 16, o.ivType === 'utf8');
  $('aesInputLabel').textContent = T(enc ? 'input_enc' : 'input_dec');
  $('aesInput').placeholder = T(enc ? 'ph_enc' : 'ph_dec');
  _aesKeyHint();
  if (!aes) return;
  let keyBytes = 0;
  if (!passphrase) try { keyBytes = aes.decodeKey(o.key, keyType).length; } catch { /* shown by the key hint */ }
  const bits = passphrase ? o.keySize : [16, 24, 32].includes(keyBytes) ? keyBytes * 8 : '';
  const alg = `AES${bits ? '-' + bits : ''}-${o.mode}`;
  const kdf = keyType === 'password' ? `PBKDF2-SHA256 ×${o.iterations || aes.DEFAULT_ITERATIONS}` : keyType === 'openssl' ? `openssl -pbkdf2 -iter ${o.iterations || aes.DEFAULT_ITERATIONS}` : T('raw_key');
  const layout = _aesLayoutText(T, aes.layout(o));
  $('aesSummary').textContent = enc ? T('sum_enc', alg, kdf, $('aesEncoding').value === 'hex' ? 'Hex' : 'Base64', layout) : T('sum_dec', alg, kdf, layout, passphrase);
}

function _aesKeyHint() {
  const T = makeToolI18n(_aesDict), hint = document.getElementById('aesKeyHint'), aes = window.KCompute?.aes;
  if (!hint) return;
  const keyType = document.getElementById('aesKeyType').value, key = document.getElementById('aesKey').value;
  let text = '', warn = false;
  if (key && aes && keyType !== 'password' && keyType !== 'openssl') {
    try {
      const n = aes.decodeKey(key, keyType).length;
      warn = ![16, 24, 32].includes(n);
      text = T(warn ? 'key_need' : 'key_ok', n);
    } catch { warn = true; text = T('key_bad', keyType); }
  }
  hint.textContent = text;
  hint.style.color = warn ? '#f59e0b' : 'var(--text-muted)';
}

async function _aesRandom(kind) {
  const aes = await ToolCompute.load('aes'), $ = id => document.getElementById(id);
  if (!$('aesMode')) return;
  const o = _aesOptions();
  if (kind === 'Salt') { $('aesSaltType').value = 'hex'; $('aesSalt').value = aes.randomHex(o.keyType === 'openssl' ? aes.OPENSSL_SALT_BYTES : aes.SALT_BYTES); }
  else { $('aesIvType').value = 'hex'; $('aesIv').value = aes.randomHex(aes.IV_BYTES[o.mode]); }
  _aesSync();
}

async function doAES() {
  const T = makeToolI18n(_aesDict), $ = id => document.getElementById(id);
  if (!$('aesInput')) return;
  const runId = ++_aesRunId, enc = window._aesMode !== 'dec', o = _aesOptions(), input = $('aesInput').value;
  $('aesRunBtn').disabled = true;
  _aesStatus(T('working'), 'var(--text-muted)', 'busy');
  try {
    const missing = !input || (!enc && !input.trim()) ? 'EMPTY_INPUT' : !o.key ? 'EMPTY_KEY'
      : o.saltType !== 'auto' && !o.salt.trim() ? 'NEED_SALT' : o.ivType !== 'auto' && !o.iv ? 'NEED_IV' : '';
    if (missing) throw Object.assign(new Error(missing), { code: missing });
    const aes = await ToolCompute.load('aes');
    const result = enc ? await aes.encrypt(input, { ...o, encoding: $('aesEncoding').value }) : await aes.decrypt(input, o);
    if (runId === _aesRunId && $('aesOutput')) _aesShowResult(T, enc, result, o);
  } catch (error) {
    if (runId === _aesRunId && $('aesOutput')) _aesShowError(T, enc, error, o);
  } finally {
    if (runId === _aesRunId && $('aesRunBtn')) $('aesRunBtn').disabled = false;
  }
}

function _aesStatus(text, color, state) {
  const status = document.getElementById('aesStatus');
  status.textContent = text; status.style.color = color; status.dataset.state = state;
  document.getElementById('aesResult').style.display = '';
}

function _aesShowResult(T, enc, r, o) {
  const $ = id => document.getElementById(id);
  _aesStatus(`${T(enc ? 'done_enc' : 'done_dec')} · AES-${r.keySize}-${r.mode}`, '#10b981', 'ok');
  $('aesOutput').textContent = enc ? r.output : r.text ?? r.hex;
  $('aesBadge').style.display = r.legacy ? '' : 'none';
  const notes = [r.legacy && T('legacy_note'), !enc && r.text === null && T('binary'), !enc && r.text === null && r.mode === 'CTR' && T('ctr_note'), r.engine === 'js' && T('js_engine')].filter(Boolean);
  $('aesNote').textContent = notes.join(' ');
  $('aesNote').style.display = notes.length ? '' : 'none';
  const parts = enc ? r.layout.map(p => p.part) : [];
  const where = part => r.format === 'openssl' && part === 'iv' ? T('derived') : !enc ? '' : parts.includes(part) ? T('embedded') : T('separate');
  _aesRows(T, [
    !enc && [T('d_format'), T('formats')[r.format]],
    [T('d_algorithm'), `AES-${r.keySize}-${r.mode}`],
    [T('d_kdf'), T('kdf')[r.format](r.iterations)],
    [T('d_key'), r.key],
    r.salt && [T('d_salt'), r.salt, r.format === 'openssl' ? (enc ? T('embedded') : '') : where('salt')],
    [T('d_iv'), r.iv, where('iv')],
    enc && r.tag && [T('d_tag'), r.tag],
    enc && [T('d_ciphertext'), r.ciphertext],
    enc && [T('d_layout'), _aesLayoutText(T, r.layout)],
  ]);
  $('aesSnippets').textContent = enc ? _aesSnippets(T, r, o.aad) : '';
  $('aesSnippetBox').style.display = enc ? '' : 'none';
}

function _aesShowError(T, enc, error, o) {
  const $ = id => document.getElementById(id), message = error?.code && T('errors')[error.code];
  _aesStatus(T('error'), '#ef4444', 'error');
  $('aesOutput').textContent = typeof message === 'function' ? message(error, T('fields')[error.field] || error.field)
    : message || T('failed') + (error?.message || String(error));
  $('aesBadge').style.display = 'none';
  const hint = !enc && ['DECRYPT_FAILED', 'TOO_SHORT', 'BLOCK_LENGTH'].includes(error?.code) && window.KCompute?.aes
    ? T('hint_layout', _aesLayoutText(T, window.KCompute.aes.layout(o))) : '';
  $('aesNote').textContent = hint;
  $('aesNote').style.display = hint ? '' : 'none';
  _aesRows(T, []);
  $('aesSnippetBox').style.display = 'none';
}

/** Label / value / copy rows built with textContent: values come from user input. */
function _aesRows(T, rows) {
  document.getElementById('aesDetails').replaceChildren(...rows.filter(Boolean).map(([name, value, note]) => {
    const row = document.createElement('div'), label = document.createElement('span'), text = document.createElement('span'), copy = document.createElement('button');
    row.className = 'result-row';
    row.style.alignItems = 'flex-start';
    label.style.cssText = 'flex:0 0 150px;min-width:150px;font-family:inherit;font-size:12px;color:var(--text-muted)';
    label.textContent = name;
    text.style.cssText = 'flex:1;word-break:break-all;font-family:monospace;font-size:13px';
    text.textContent = note ? `${value} ${note}` : value;
    copy.className = 'copy-inline';
    copy.textContent = T('copy_short');
    copy.onclick = () => copyText(value, copy);
    row.append(label, text, copy);
    return row;
  }));
}

/** Decryption recipes for this exact result (the passphrase stays a placeholder). */
function _aesSnippets(T, r, aad) {
  const bits = r.keySize, mode = r.mode, hex = r.encoding === 'hex', lit = JSON.stringify;
  const feed = data => hex ? `echo '${data}' | xxd -r -p | ` : `echo '${data}' | `, b64 = hex ? '' : ' -base64 -A';
  const openssl = mode === 'GCM' ? T('openssl_gcm')
    : r.format === 'openssl' ? `${feed(r.output)}openssl enc -d -aes-${bits}-${mode.toLowerCase()} -pbkdf2 -iter ${r.iterations} -md sha256${b64} -pass 'pass:${T('pw')}'`
      : `${feed(r.ciphertext)}openssl enc -d -aes-${bits}-${mode.toLowerCase()} -K ${r.key} -iv ${r.iv}${b64}`;
  const derivation = r.format === 'passphrase' ? `// key = PBKDF2WithHmacSHA256("${T('pw')}", salt ${r.salt}, ${r.iterations}, ${bits} bit)`
    : r.format === 'openssl' ? `// key ‖ iv = PBKDF2WithHmacSHA256("${T('pw')}", salt ${r.salt}, ${r.iterations}, ${bits + 128} bit)` : '';
  const java = [
    '// Java 17+ (javax.crypto.*, javax.crypto.spec.*, java.util.HexFormat)',
    derivation,
    `byte[] key = HexFormat.of().parseHex("${r.key}");`,
    `byte[] iv = HexFormat.of().parseHex("${r.iv}");`,
    `byte[] data = ${hex ? `HexFormat.of().parseHex("${r.ciphertext}")` : `Base64.getDecoder().decode("${r.ciphertext}")`};`,
    `Cipher cipher = Cipher.getInstance("${_aesJava[mode]}");`,
    `cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), ${mode === 'GCM' ? 'new GCMParameterSpec(128, iv)' : 'new IvParameterSpec(iv)'});`,
    aad ? `cipher.updateAAD(${lit(aad)}.getBytes(StandardCharsets.UTF_8));` : '',
    'String text = new String(cipher.doFinal(data), StandardCharsets.UTF_8);',
  ];
  const python = [
    '# Python 3 (pip install pycryptodome)',
    hex ? '' : 'from base64 import b64decode',
    'from Crypto.Cipher import AES',
    mode === 'CBC' ? 'from Crypto.Util.Padding import unpad' : '',
    `key = bytes.fromhex("${r.key}")`,
    `iv = bytes.fromhex("${r.iv}")`,
    `data = ${hex ? `bytes.fromhex("${r.ciphertext}")` : `b64decode("${r.ciphertext}")`}`,
    ...(mode === 'GCM' ? ['cipher = AES.new(key, AES.MODE_GCM, nonce=iv)', aad ? `cipher.update(${lit(aad)}.encode())` : '', 'print(cipher.decrypt_and_verify(data[:-16], data[-16:]).decode())']
      : mode === 'CBC' ? ['print(unpad(AES.new(key, AES.MODE_CBC, iv).decrypt(data), 16).decode())']
        : ['print(AES.new(key, AES.MODE_CTR, nonce=b"", initial_value=iv).decrypt(data).decode())']),
  ];
  return ['# OpenSSL', openssl, '', ...java.filter(Boolean), '', ...python.filter(Boolean)].join('\n');
}

function aesSwap() {
  const T = makeToolI18n(_aesDict), out = document.getElementById('aesOutput')?.textContent;
  if (!out || document.getElementById('aesStatus').dataset.state !== 'ok') return;
  document.getElementById('aesInput').value = out;
  setAESMode(window._aesMode === 'enc' ? 'dec' : 'enc');
  showToast(T('swapped'), 'info');
}

function _aesClear() {
  document.getElementById('aesInput').value = '';
  document.getElementById('aesResult').style.display = 'none';
}
