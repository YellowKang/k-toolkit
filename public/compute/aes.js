/* AES shared by the AES page and the Agent: AES-GCM/CBC/CTR through WebCrypto, in layouts other tools can read.
 *   passphrase  PBKDF2-HMAC-SHA256 → salt(16) ‖ IV ‖ ciphertext [‖ tag]
 *   openssl     `openssl enc -pbkdf2` → "Salted__" ‖ salt(8) ‖ ciphertext (key and IV derived together; CBC/CTR)
 *   raw key     Hex/Base64/UTF-8 bytes → IV ‖ ciphertext [‖ tag]
 * Random salt/IV travel in the output; given ones are agreed out of band and left out. GCM appends a 128-bit tag,
 * CBC pads with PKCS#7 and CTR counts over the whole 128-bit block, as Java, OpenSSL and Python do. The previous
 * page's "Base64(IV):Base64(data)" (key = SHA-256(passphrase)) still decrypts and is reported as legacy. See docs/aes.md. */
(function () {
  const MODES = { GCM: { name: 'AES-GCM', iv: 12 }, CBC: { name: 'AES-CBC', iv: 16 }, CTR: { name: 'AES-CTR', iv: 16 } };
  const KEY_TYPES = ['password', 'openssl', 'hex', 'base64', 'utf8'];
  const DEFAULT_ITERATIONS = 100000, MAX_ITERATIONS = 10000000, SALT_BYTES = 16, OPENSSL_SALT_BYTES = 8, TAG_BYTES = 16;
  const MAGIC = Uint8Array.of(0x53, 0x61, 0x6c, 0x74, 0x65, 0x64, 0x5f, 0x5f); // "Salted__"
  const utf8 = new TextEncoder();

  class AesError extends Error {
    constructor(code, message, detail) { super(message); this.name = 'AesError'; this.code = code; Object.assign(this, detail); }
  }
  const fail = (code, message, detail) => { throw new AesError(code, message, detail); };
  const failDecrypt = mode => fail('DECRYPT_FAILED', mode === 'GCM'
    ? 'Authentication failed: wrong key, IV/nonce or AAD, or corrupted data'
    : 'Decryption failed: wrong key or IV, or corrupted data (bad padding)', { mode });
  const blank = value => value == null || value === '';
  // ArrayBuffer.isView instead of instanceof: values may come from another realm (Node vm in tests).
  const bytesOf = value => ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(value);
  const random = n => crypto.getRandomValues(new Uint8Array(n));
  function concat(...parts) {
    const out = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
    let offset = 0;
    for (const part of parts) { out.set(part, offset); offset += part.length; }
    return out;
  }
  const startsWith = (bytes, prefix) => bytes.length >= prefix.length && prefix.every((b, i) => bytes[i] === b);

  const toHex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  function fromHex(text, label = 'Value') {
    const clean = String(text).replace(/\s+/g, '').replace(/^0x/i, '');
    if (!/^(?:[0-9a-f]{2})*$/i.test(clean)) fail('BAD_HEX', `${label} is not valid hex`, { field: label });
    return Uint8Array.from(clean.match(/../g) || [], pair => parseInt(pair, 16));
  }
  function toBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }
  /** Standard or URL-safe Base64, padding optional. */
  function fromBase64(text, label = 'Value') {
    const clean = String(text).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    if (!/^[A-Za-z0-9+/]*$/.test(clean) || clean.length % 4 === 1) fail('BAD_BASE64', `${label} is not valid Base64`, { field: label });
    return Uint8Array.from(atob(clean + '='.repeat((4 - clean.length % 4) % 4)), c => c.charCodeAt(0));
  }
  const encode = (bytes, encoding) => encoding === 'hex' ? toHex(bytes) : toBase64(bytes);
  /** Ciphertext input: explicit encoding, or Hex when it is only hex digits (real Base64 ciphertext never is). */
  function decodeInput(text, encoding) {
    const clean = text.replace(/\s+/g, '');
    const kind = encoding || (/^(?:[0-9a-f]{2})+$/i.test(clean) ? 'hex' : 'base64');
    return kind === 'hex' ? fromHex(clean, 'Ciphertext') : fromBase64(clean, 'Ciphertext');
  }

  /** Raw key bytes without the length check (the page shows the length while typing). */
  const decodeKey = (text, keyType) => keyType === 'hex' ? fromHex(text, 'Key') : keyType === 'base64' ? fromBase64(text, 'Key') : utf8.encode(text);
  function rawKey(text, keyType) {
    const bytes = decodeKey(text, keyType);
    if (![16, 24, 32].includes(bytes.length)) fail('KEY_LENGTH', `AES keys are 16, 24 or 32 bytes; got ${bytes.length}`, { bytes: bytes.length });
    return bytes;
  }

  function normalizeMode(mode) {
    const name = String(mode || 'GCM').toUpperCase().replace(/^AES-/, '');
    if (!MODES[name]) fail('MODE', `Unsupported mode: ${mode}`);
    return name;
  }

  /** Validate options shared by encrypt/decrypt. Given IV/salt are parsed here; generated ones come later. */
  function normalize(options) {
    if (!globalThis.crypto?.subtle) fail('NO_WEBCRYPTO', 'WebCrypto is unavailable (HTTPS or localhost required)');
    const mode = normalizeMode(options.mode);
    const keyType = options.keyType || 'password';
    if (!KEY_TYPES.includes(keyType)) fail('KEY_TYPE', `Unsupported key type: ${keyType}`);
    if (blank(options.key)) fail('EMPTY_KEY', 'A passphrase or key is required');
    const passphrase = keyType === 'password' || keyType === 'openssl';
    const keySize = Number(options.keySize || 256);
    if (passphrase && ![128, 192, 256].includes(keySize)) fail('KEY_SIZE', 'Key size must be 128, 192 or 256 bits');
    const iterations = blank(options.iterations) ? DEFAULT_ITERATIONS : Number(options.iterations);
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > MAX_ITERATIONS) fail('ITERATIONS', `Iterations must be an integer from 1 to ${MAX_ITERATIONS}`);
    const aadBytes = blank(options.aad) ? null : typeof options.aad === 'string' ? utf8.encode(options.aad) : bytesOf(options.aad);
    const aad = aadBytes?.length ? aadBytes : null;
    if (aad && mode !== 'GCM') fail('AAD_MODE', 'AAD is only used by GCM');
    let iv = null, salt = null;
    if (!blank(options.iv)) {
      if (keyType === 'openssl') fail('IV_OPENSSL', 'openssl enc derives the IV from the passphrase; leave the IV empty');
      iv = typeof options.iv !== 'string' ? bytesOf(options.iv) : options.ivEncoding === 'utf8' ? utf8.encode(options.iv) : fromHex(options.iv, 'IV');
      if (mode === 'GCM' ? iv.length < 1 || iv.length > 128 : iv.length !== 16) {
        fail('IV_LENGTH', mode === 'GCM' ? `GCM nonce must be 1-128 bytes (12 recommended); got ${iv.length}` : `${mode} IV must be 16 bytes; got ${iv.length}`, { bytes: iv.length, mode });
      }
    }
    if (!blank(options.salt)) {
      if (!passphrase) fail('SALT_KEY', 'Salt only applies to passphrase keys');
      salt = typeof options.salt === 'string' ? fromHex(options.salt, 'Salt') : bytesOf(options.salt);
      if (keyType === 'openssl' ? salt.length !== OPENSSL_SALT_BYTES : !salt.length) {
        fail('SALT_LENGTH', keyType === 'openssl' ? `OpenSSL salt must be 8 bytes; got ${salt.length}` : 'Salt must not be empty', { bytes: salt.length, keyType });
      }
    }
    const raw = passphrase ? null : rawKey(options.key, keyType);
    const encoding = options.encoding === 'hex' || options.encoding === 'base64' ? options.encoding : null;
    return { mode, keyType, passphrase, key: String(options.key), raw, keySize: raw ? raw.length * 8 : keySize, iterations,
      aad, iv, salt, encoding, engine: options.engine === 'js' ? 'js' : 'auto' };
  }

  async function pbkdf2(password, salt, iterations, length) {
    const material = await crypto.subtle.importKey('raw', utf8.encode(password), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, length * 8));
  }
  /** `openssl enc -pbkdf2`: one PBKDF2 output split into key and IV. */
  async function opensslKeyIv(o, salt) {
    const bytes = await pbkdf2(o.key, salt, o.iterations, o.keySize / 8 + 16);
    return [bytes.slice(0, o.keySize / 8), bytes.slice(o.keySize / 8)];
  }

  // WebCrypto whenever it accepts the key; Chrome refuses 192-bit AES keys, which then run on the JS cipher below.
  async function cipher(direction, mode, keyBytes, iv, data, { aad = null, counterBits = 128, engine = 'auto' } = {}) {
    let key = null;
    if (engine !== 'js') {
      try { key = await crypto.subtle.importKey('raw', keyBytes, MODES[mode].name, false, [direction]); }
      catch (error) { if (keyBytes.length !== 24) throw error; }
    }
    if (!key) return { data: jsCipher(direction, mode, keyBytes, iv, data, aad, counterBits), engine: 'js' };
    const params = mode === 'GCM' ? { name: 'AES-GCM', iv, tagLength: 128, ...(aad ? { additionalData: aad } : {}) }
      : mode === 'CBC' ? { name: 'AES-CBC', iv } : { name: 'AES-CTR', counter: iv, length: counterBits };
    try {
      return { data: new Uint8Array(await crypto.subtle[direction](params, key, data)), engine: 'webcrypto' };
    } catch (error) {
      if (direction === 'decrypt') failDecrypt(mode);
      fail('ENCRYPT_FAILED', 'Encryption failed: ' + error.message);
    }
  }
  function checkBody(mode, body) {
    if (mode === 'GCM' && body.length < TAG_BYTES) fail('TOO_SHORT', 'GCM ciphertext must end with a 16-byte tag');
    if (mode === 'CBC' && (!body.length || body.length % 16)) fail('BLOCK_LENGTH', 'CBC ciphertext must be a non-empty multiple of 16 bytes');
  }
  function plain(bytes, meta) {
    let text = null;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); } catch { /* binary plaintext: hex only */ }
    return { text, hex: toHex(bytes), bytes, ...meta, key: toHex(meta.key), iv: toHex(meta.iv), salt: meta.salt ? toHex(meta.salt) : null };
  }

  /** Output parts in order: generated salt/IV are embedded, given ones are not. */
  function layout(options = {}) {
    const mode = normalizeMode(options.mode), keyType = options.keyType || 'password';
    if (keyType === 'openssl') return [{ part: 'magic', bytes: MAGIC.length }, { part: 'salt', bytes: OPENSSL_SALT_BYTES }, { part: 'ciphertext' }];
    return [
      ...(keyType === 'password' && blank(options.salt) ? [{ part: 'salt', bytes: SALT_BYTES }] : []),
      ...(blank(options.iv) ? [{ part: 'iv', bytes: MODES[mode].iv }] : []),
      { part: 'ciphertext' },
      ...(mode === 'GCM' ? [{ part: 'tag', bytes: TAG_BYTES }] : []),
    ];
  }

  async function encrypt(plaintext, options = {}) {
    const o = normalize(options);
    const data = typeof plaintext === 'string' ? utf8.encode(plaintext) : bytesOf(plaintext ?? []);
    const head = [];
    let key = o.raw, iv = o.iv, salt = o.salt;
    if (o.keyType === 'openssl') {
      if (o.mode === 'GCM') fail('OPENSSL_GCM', 'openssl enc does not support GCM; choose CBC or CTR');
      salt ||= random(OPENSSL_SALT_BYTES);
      [key, iv] = await opensslKeyIv(o, salt);
      head.push(MAGIC, salt);
    } else {
      if (o.keyType === 'password') {
        if (!salt) { salt = random(SALT_BYTES); head.push(salt); }
        key = await pbkdf2(o.key, salt, o.iterations, o.keySize / 8);
      }
      if (!iv) { iv = random(MODES[o.mode].iv); head.push(iv); }
    }
    const { data: body, engine } = await cipher('encrypt', o.mode, key, iv, data, o);
    const encoding = o.encoding || 'base64';
    return {
      output: encode(concat(...head, body), encoding), ciphertext: encode(body, encoding), encoding,
      format: o.keyType === 'openssl' ? 'openssl' : o.passphrase ? 'passphrase' : 'raw', layout: layout(o),
      mode: o.mode, keyType: o.keyType, keySize: key.length * 8, iterations: o.passphrase ? o.iterations : null,
      key: toHex(key), iv: toHex(iv), salt: salt ? toHex(salt) : null, tag: o.mode === 'GCM' ? toHex(body.subarray(-TAG_BYTES)) : null,
      aad: !!o.aad, engine,
    };
  }

  async function decrypt(input, options = {}) {
    const o = normalize(options);
    const text = String(input ?? '').trim();
    if (!text) fail('EMPTY_INPUT', 'Nothing to decrypt');
    if (o.passphrase) {
      const legacy = parseLegacy(text);
      if (legacy) return decryptLegacy(legacy, o);
    }
    const bytes = decodeInput(text, o.encoding);
    if (o.passphrase && startsWith(bytes, MAGIC)) return decryptOpenssl(bytes, o);
    if (o.keyType === 'openssl') fail('NOT_OPENSSL', 'Missing the "Salted__" header written by openssl enc');
    let offset = 0;
    const take = n => {
      if (bytes.length < offset + n) fail('TOO_SHORT', 'Ciphertext is shorter than the salt/IV it should start with');
      offset += n;
      return bytes.subarray(offset - n, offset);
    };
    const salt = o.keyType === 'password' ? o.salt || take(SALT_BYTES) : null;
    const iv = o.iv || take(MODES[o.mode].iv);
    const body = bytes.subarray(offset);
    checkBody(o.mode, body);
    const key = salt ? await pbkdf2(o.key, salt, o.iterations, o.keySize / 8) : o.raw;
    const { data, engine } = await cipher('decrypt', o.mode, key, iv, body, o);
    return plain(data, { format: salt ? 'passphrase' : 'raw', legacy: false, mode: o.mode, keySize: key.length * 8,
      iterations: salt ? o.iterations : null, key, iv, salt, engine });
  }

  /** Legacy and OpenSSL data do not record the mode: GCM (the default) tries CBC then CTR and keeps readable text only. */
  async function tryModes(mode, run, meta) {
    if (mode !== 'GCM') { const { data, engine } = await run(mode); return plain(data, { ...meta(mode), engine }); }
    for (const candidate of ['CBC', 'CTR']) {
      try {
        const { data, engine } = await run(candidate);
        const result = plain(data, { ...meta(candidate), engine });
        if (result.text !== null) return result;
      } catch (error) {
        if (!(error instanceof AesError)) throw error;
      }
    }
    fail('DECRYPT_FAILED', 'Decryption failed: wrong passphrase, mode, key size or iterations', { mode: 'auto' });
  }
  async function decryptOpenssl(bytes, o) {
    if (bytes.length < 16) fail('TOO_SHORT', 'OpenSSL data is shorter than its 16-byte header');
    const salt = bytes.subarray(8, 16), body = bytes.subarray(16);
    const [key, iv] = await opensslKeyIv(o, salt);
    return tryModes(o.mode, mode => { checkBody(mode, body); return cipher('decrypt', mode, key, iv, body, { engine: o.engine }); },
      mode => ({ format: 'openssl', legacy: false, mode, keySize: key.length * 8, iterations: o.iterations, key, iv, salt }));
  }
  // Previous page output: Base64(IV):Base64(ciphertext), key = SHA-256(passphrase); CBC, or CTR with a 64-bit counter.
  function parseLegacy(text) {
    const m = /^([A-Za-z0-9+/]+=*):([A-Za-z0-9+/]+=*)$/.exec(text.replace(/\s+/g, ''));
    if (!m) return null;
    try {
      const iv = fromBase64(m[1]);
      return iv.length === 16 ? { iv, data: fromBase64(m[2]) } : null;
    } catch { return null; }
  }
  async function decryptLegacy({ iv, data }, o) {
    const key = new Uint8Array(await crypto.subtle.digest('SHA-256', utf8.encode(o.key)));
    return tryModes(o.mode, mode => { checkBody(mode, data); return cipher('decrypt', mode, key, iv, data, { counterBits: 64 }); },
      mode => ({ format: 'legacy', legacy: true, mode, keySize: 256, iterations: null, key, iv, salt: null }));
  }

  // ── Pure-JS AES for key sizes WebCrypto refuses (Chrome: 192-bit). Tested against the same NIST vectors. ──
  const SBOX = new Uint8Array(256), INV_SBOX = new Uint8Array(256);
  (() => {
    let p = 1, q = 1;
    do { // p walks GF(2^8)* by ×3 while q = p⁻¹ (÷3); S(p) is the affine transform of the inverse
      p = (p ^ p << 1 ^ (p & 0x80 ? 0x1b : 0)) & 0xff;
      q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff;
      if (q & 0x80) q ^= 0x09;
      SBOX[p] = (q ^ (q << 1 | q >> 7) ^ (q << 2 | q >> 6) ^ (q << 3 | q >> 5) ^ (q << 4 | q >> 4) ^ 0x63) & 0xff;
    } while (p !== 1);
    SBOX[0] = 0x63;
    SBOX.forEach((value, index) => { INV_SBOX[value] = index; });
  })();
  const xtime = b => (b << 1 ^ (b & 0x80 ? 0x1b : 0)) & 0xff;
  function expandKey(key) {
    const nk = key.length / 4, rounds = nk + 6, w = new Uint8Array(16 * (rounds + 1));
    w.set(key);
    for (let i = nk, rcon = 1; i < 4 * (rounds + 1); i++) {
      let [a, b, c, d] = w.subarray(4 * i - 4, 4 * i);
      if (i % nk === 0) { [a, b, c, d] = [SBOX[b] ^ rcon, SBOX[c], SBOX[d], SBOX[a]]; rcon = xtime(rcon); }
      else if (nk > 6 && i % nk === 4) [a, b, c, d] = [SBOX[a], SBOX[b], SBOX[c], SBOX[d]];
      const j = 4 * (i - nk);
      w.set([w[j] ^ a, w[j + 1] ^ b, w[j + 2] ^ c, w[j + 3] ^ d], 4 * i);
    }
    return { w, rounds };
  }
  function mixColumns(t) {
    for (let c = 0; c < 16; c += 4) {
      const a0 = t[c], a1 = t[c + 1], a2 = t[c + 2], a3 = t[c + 3], x = a0 ^ a1 ^ a2 ^ a3;
      t[c] ^= x ^ xtime(a0 ^ a1); t[c + 1] ^= x ^ xtime(a1 ^ a2); t[c + 2] ^= x ^ xtime(a2 ^ a3); t[c + 3] ^= x ^ xtime(a3 ^ a0);
    }
  }
  function encryptBlock({ w, rounds }, block) {
    let s = block.map((b, i) => b ^ w[i]);
    for (let r = 1; r <= rounds; r++) {
      const t = new Uint8Array(16);
      for (let i = 0; i < 16; i++) t[i] = SBOX[s[(i + 4 * (i & 3)) & 15]]; // SubBytes + ShiftRows (state is column-major)
      if (r < rounds) mixColumns(t);
      for (let i = 0; i < 16; i++) t[i] ^= w[16 * r + i];
      s = t;
    }
    return s;
  }
  function decryptBlock({ w, rounds }, block) {
    let s = block.map((b, i) => b ^ w[16 * rounds + i]);
    for (let r = rounds - 1; r >= 0; r--) {
      const t = new Uint8Array(16);
      for (let i = 0; i < 16; i++) t[i] = INV_SBOX[s[(i - 4 * (i & 3)) & 15]] ^ w[16 * r + i];
      if (r > 0) { // InvMixColumns = MixColumns after multiplying each column by {04}·(a0^a2, a1^a3)
        for (let c = 0; c < 16; c += 4) {
          const u = xtime(xtime(t[c] ^ t[c + 2])), v = xtime(xtime(t[c + 1] ^ t[c + 3]));
          t[c] ^= u; t[c + 1] ^= v; t[c + 2] ^= u; t[c + 3] ^= v;
        }
        mixColumns(t);
      }
      s = t;
    }
    return s;
  }
  /** Big-endian +1 over the last `bytes` bytes of the counter block, wrapping. */
  function increment(block, bytes) {
    for (let i = 15; i >= 16 - bytes; i--) {
      block[i] = (block[i] + 1) & 0xff;
      if (block[i]) break;
    }
  }
  function ctr(ks, counter, data, counterBytes) {
    const out = new Uint8Array(data.length), block = Uint8Array.from(counter);
    for (let i = 0; i < data.length; i += 16) {
      const stream = encryptBlock(ks, block);
      for (let j = 0; j < 16 && i + j < data.length; j++) out[i + j] = data[i + j] ^ stream[j];
      increment(block, counterBytes);
    }
    return out;
  }
  function cbc(direction, ks, iv, data) {
    if (direction === 'encrypt') {
      const pad = 16 - data.length % 16, src = concat(data, new Uint8Array(pad).fill(pad)), out = new Uint8Array(src.length);
      let prev = iv;
      for (let i = 0; i < src.length; i += 16) {
        prev = encryptBlock(ks, src.subarray(i, i + 16).map((b, j) => b ^ prev[j]));
        out.set(prev, i);
      }
      return out;
    }
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i += 16) {
      const block = decryptBlock(ks, data.subarray(i, i + 16)), prev = i ? data.subarray(i - 16, i) : iv;
      for (let j = 0; j < 16; j++) out[i + j] = block[j] ^ prev[j];
    }
    const pad = out[out.length - 1];
    if (!pad || pad > 16 || out.subarray(out.length - pad).some(b => b !== pad)) failDecrypt('CBC');
    return out.slice(0, out.length - pad);
  }
  // GHASH over GF(2^128) in GCM's reflected bit order (NIST SP 800-38D, Algorithm 1), on BigInt blocks.
  const R = 0xe1n << 120n;
  const toBig = bytes => BigInt('0x' + toHex(bytes));
  const fromBig = value => fromHex(value.toString(16).padStart(32, '0'));
  function gfmul(x, y) {
    let z = 0n, v = y;
    for (let bit = 127n; bit >= 0n; bit--) {
      if ((x >> bit) & 1n) z ^= v;
      v = v & 1n ? v >> 1n ^ R : v >> 1n;
    }
    return z;
  }
  function ghash(h, aad, data) {
    let y = 0n;
    for (const bytes of [aad, data]) {
      for (let i = 0; i < bytes.length; i += 16) {
        const block = new Uint8Array(16);
        block.set(bytes.subarray(i, i + 16));
        y = gfmul(y ^ toBig(block), h);
      }
    }
    return gfmul(y ^ (BigInt(aad.length * 8) << 64n | BigInt(data.length * 8)), h);
  }
  function gcm(direction, ks, iv, data, aad) {
    const h = toBig(encryptBlock(ks, new Uint8Array(16))), none = new Uint8Array(0);
    const j0 = iv.length === 12 ? concat(iv, Uint8Array.of(0, 0, 0, 1)) : fromBig(ghash(h, none, iv));
    const mask = encryptBlock(ks, j0), counter = Uint8Array.from(j0);
    increment(counter, 4);
    const tagOf = c => fromBig(ghash(h, aad || none, c)).map((b, i) => b ^ mask[i]);
    if (direction === 'encrypt') { const c = ctr(ks, counter, data, 4); return concat(c, tagOf(c)); }
    const c = data.subarray(0, data.length - TAG_BYTES), tag = data.subarray(data.length - TAG_BYTES), expected = tagOf(c);
    let diff = 0;
    for (let i = 0; i < TAG_BYTES; i++) diff |= expected[i] ^ tag[i];
    if (diff) failDecrypt('GCM');
    return ctr(ks, counter, c, 4);
  }
  function jsCipher(direction, mode, keyBytes, iv, data, aad, counterBits) {
    const ks = expandKey(keyBytes);
    if (mode === 'CTR') return ctr(ks, iv, data, counterBits / 8);
    return mode === 'CBC' ? cbc(direction, ks, iv, data) : gcm(direction, ks, iv, data, aad);
  }

  (window.KCompute ||= {}).aes = Object.freeze({
    encrypt, decrypt, layout, decodeKey, AesError, toHex, fromHex, toBase64, fromBase64,
    randomHex: n => toHex(random(n)),
    IV_BYTES: Object.freeze({ GCM: 12, CBC: 16, CTR: 16 }), DEFAULT_ITERATIONS, MAX_ITERATIONS, SALT_BYTES, OPENSSL_SALT_BYTES,
  });
})();
