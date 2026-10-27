/* One-time passwords for the 2FA tool (Node tests load it through vm):
 * HOTP (RFC 4226), TOTP (RFC 6238), Base32 (RFC 4648), otpauth:// links (Google Key URI format),
 * Google Authenticator migration links (otpauth-migration://offline?data=<protobuf>) and Aegis / 2FAS plain exports.
 * HMAC runs on WebCrypto. Entries are plain objects; secrets are canonical upper-case Base32 without padding. */
(function () {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const HASHES = { SHA1: 'SHA-1', SHA256: 'SHA-256', SHA512: 'SHA-512' };
  const MIGRATION_ALGORITHMS = { 1: 'SHA1', 2: 'SHA256', 3: 'SHA512' };
  const MIGRATION_DIGITS = { 1: 6, 2: 8 };

  class OtpError extends Error {
    constructor(code, message, detail) { super(message); this.name = 'OtpError'; this.code = code; this.detail = detail; }
  }

  // ── Base32 ──
  function base32Decode(text) {
    const clean = String(text ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
    if (!clean) throw new OtpError('secret-empty', 'Secret is empty');
    const out = [];
    let bits = 0, value = 0;
    for (let i = 0; i < clean.length; i++) {
      const index = ALPHABET.indexOf(clean[i]);
      if (index < 0) throw new OtpError('secret-char', `Invalid Base32 character "${clean[i]}" at position ${i + 1}`, { char: clean[i], position: i + 1 });
      value = ((value << 5) | index) & 0x1fff;
      bits += 5;
      if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
    }
    if (!out.length) throw new OtpError('secret-short', 'Secret is too short');
    return new Uint8Array(out);
  }

  function base32Encode(bytes) {
    let out = '', bits = 0, value = 0;
    for (const byte of bytes) {
      value = ((value << 8) | byte) & 0xffff;
      bits += 8;
      while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
    return out;
  }

  const randomSecret = (bytes = 20) => base32Encode(crypto.getRandomValues(new Uint8Array(bytes)));

  // ── Entries ──
  const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');

  /** Validate and canonicalise an entry; throws OtpError with a stable code. */
  function normalize(entry = {}) {
    const type = String(entry.type || 'totp').toLowerCase();
    if (type !== 'totp' && type !== 'hotp') throw new OtpError('type', `Unsupported OTP type "${entry.type}"`, { value: entry.type });
    const algorithm = String(entry.algorithm || 'SHA1').toUpperCase().replace(/[-_\s]/g, '');
    if (!HASHES[algorithm]) throw new OtpError('algorithm', `Unsupported algorithm "${entry.algorithm}"`, { value: entry.algorithm });
    const digits = Number(entry.digits ?? 6);
    if (!Number.isInteger(digits) || digits < 6 || digits > 10) throw new OtpError('digits', 'Digits must be 6–10', { value: entry.digits });
    const period = Number(entry.period ?? 30);
    if (!Number.isInteger(period) || period < 1 || period > 3600) throw new OtpError('period', 'Period must be 1–3600 seconds', { value: entry.period });
    const counter = Number(entry.counter ?? 0);
    if (!Number.isSafeInteger(counter) || counter < 0) throw new OtpError('counter', 'Counter must be a non-negative integer', { value: entry.counter });
    return {
      id: String(entry.id || randomId()),
      issuer: String(entry.issuer ?? '').trim().slice(0, 200),
      account: String(entry.account ?? '').trim().slice(0, 200),
      secret: base32Encode(base32Decode(entry.secret)),
      type, algorithm, digits, period, counter,
      note: String(entry.note ?? '').slice(0, 1000),
      createdAt: Number(entry.createdAt) || Date.now(),
    };
  }

  const dedupeKey = e => [e.issuer.toLowerCase(), e.account.toLowerCase(), e.secret].join('\n');

  // ── HOTP / TOTP ──
  function counterBytes(counter) {
    const out = new Uint8Array(8);
    let c = BigInt(counter);
    for (let i = 7; i >= 0; i--) { out[i] = Number(c & 0xffn); c >>= 8n; }
    return out;
  }

  const keyCache = new Map();
  async function hmacKey(secret, algorithm) {
    const id = algorithm + ':' + secret;
    if (!keyCache.has(id)) {
      if (keyCache.size > 200) keyCache.clear();
      keyCache.set(id, crypto.subtle.importKey('raw', base32Decode(secret), { name: 'HMAC', hash: HASHES[algorithm] }, false, ['sign']));
    }
    return keyCache.get(id);
  }

  async function hotp({ secret, counter = 0, digits = 6, algorithm = 'SHA1' }) {
    const key = await hmacKey(base32Encode(base32Decode(secret)), String(algorithm).toUpperCase().replace(/-/g, ''));
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBytes(counter)));
    const offset = mac[mac.length - 1] & 0x0f;
    const binary = ((mac[offset] & 0x7f) * 2 ** 24) + (mac[offset + 1] << 16) + (mac[offset + 2] << 8) + mac[offset + 3];
    return String(binary % 10 ** digits).padStart(digits, '0');
  }

  const stepAt = (time, period) => Math.floor(time / 1000 / period);

  /** Current code of an entry; TOTP also returns the time step and seconds left. */
  async function generate(entry, time = Date.now()) {
    if (entry.type === 'hotp') return { code: await hotp(entry), counter: entry.counter, remaining: null };
    const counter = stepAt(time, entry.period);
    return { code: await hotp({ ...entry, counter }), counter, remaining: entry.period - (Math.floor(time / 1000) % entry.period) };
  }

  /** Offset of the matching step (TOTP: within ±window; HOTP: 0…lookAhead after the counter), or null. */
  async function verify(code, entry, { window = 1, lookAhead = 10, time = Date.now() } = {}) {
    const clean = String(code ?? '').replace(/\s/g, '');
    if (!/^\d+$/.test(clean) || clean.length !== entry.digits) return null;
    if (entry.type === 'hotp') {
      for (let i = 0; i <= lookAhead; i++) if (await hotp({ ...entry, counter: entry.counter + i }) === clean) return i;
      return null;
    }
    const base = stepAt(time, entry.period);
    for (const delta of [0, ...Array.from({ length: window }, (_, i) => [-(i + 1), i + 1]).flat()]) {
      if (await hotp({ ...entry, counter: base + delta }) === clean) return delta;
    }
    return null;
  }

  // ── otpauth:// links ──
  function parseUri(text) {
    const raw = String(text ?? '').trim();
    let url;
    try { url = new URL(raw); } catch { throw new OtpError('uri', 'Not a valid otpauth:// link'); }
    if (url.protocol !== 'otpauth:') throw new OtpError('uri', 'Not a valid otpauth:// link');
    const type = url.hostname.toLowerCase();
    // Split "issuer:account" before decoding, so an encoded colon inside the issuer stays part of it.
    const label = url.pathname.replace(/^\/+/, '');
    const literal = label.indexOf(':'), encoded = label.search(/%3A/i);
    const [at, width] = literal >= 0 ? [literal, 1] : encoded >= 0 ? [encoded, 3] : [-1, 0];
    const decode = part => { try { return decodeURIComponent(part); } catch { return part; } };
    const labelIssuer = at >= 0 ? decode(label.slice(0, at)).trim() : '';
    const account = decode(at >= 0 ? label.slice(at + width) : label).trim();
    const params = url.searchParams;
    if (!params.get('secret')) throw new OtpError('uri-secret', 'The link has no secret parameter');
    return normalize({
      type, issuer: params.get('issuer') || labelIssuer, account,
      secret: params.get('secret').replace(/ /g, ''), algorithm: params.get('algorithm') || 'SHA1',
      digits: params.get('digits') || 6, period: params.get('period') || 30, counter: params.get('counter') || 0,
    });
  }

  function buildUri(entry) {
    const e = normalize(entry);
    const label = e.issuer ? `${encodeURIComponent(e.issuer)}:${encodeURIComponent(e.account)}` : encodeURIComponent(e.account);
    const params = new URLSearchParams({ secret: e.secret });
    if (e.issuer) params.set('issuer', e.issuer);
    if (e.algorithm !== 'SHA1') params.set('algorithm', e.algorithm);
    if (e.digits !== 6) params.set('digits', String(e.digits));
    if (e.type === 'totp' && e.period !== 30) params.set('period', String(e.period));
    if (e.type === 'hotp') params.set('counter', String(e.counter));
    return `otpauth://${e.type}/${label}?${params.toString().replace(/\+/g, '%20')}`;
  }

  // ── Google Authenticator migration (protobuf MigrationPayload) ──
  function readVarint(bytes, pos) {
    let result = 0n, shift = 0n, byte;
    do {
      if (pos.i >= bytes.length || shift > 63n) throw new OtpError('migration', 'Corrupted migration data');
      byte = bytes[pos.i++];
      result |= BigInt(byte & 0x7f) << shift;
      shift += 7n;
    } while (byte & 0x80);
    return result;
  }

  function readFields(bytes) {
    const pos = { i: 0 }, fields = [];
    while (pos.i < bytes.length) {
      const key = Number(readVarint(bytes, pos)), field = key >>> 3, wire = key & 7;
      if (wire === 0) fields.push([field, readVarint(bytes, pos)]);
      else if (wire === 2) {
        const length = Number(readVarint(bytes, pos));
        if (pos.i + length > bytes.length) throw new OtpError('migration', 'Corrupted migration data');
        fields.push([field, bytes.subarray(pos.i, pos.i + length)]);
        pos.i += length;
      } else if (wire === 1) pos.i += 8;
      else if (wire === 5) pos.i += 4;
      else throw new OtpError('migration', 'Corrupted migration data');
    }
    return fields;
  }

  const decodeBase64 = text => Uint8Array.from(atob(String(text).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const utf8 = new TextDecoder();

  /** Entries in one migration link; unsupported items are reported, not thrown. */
  function parseMigration(text) {
    let url;
    try { url = new URL(String(text ?? '').trim()); } catch { throw new OtpError('migration', 'Not a valid otpauth-migration:// link'); }
    if (url.protocol !== 'otpauth-migration:' || !url.searchParams.get('data')) throw new OtpError('migration', 'Not a valid otpauth-migration:// link');
    let payload;
    try { payload = readFields(decodeBase64(url.searchParams.get('data'))); } catch (e) { throw e instanceof OtpError ? e : new OtpError('migration', 'Corrupted migration data'); }
    const entries = [], skipped = [], batch = {};
    for (const [field, value] of payload) {
      if (field === 3) batch.size = Number(value);
      else if (field === 4) batch.index = Number(value);
      if (field !== 1) continue;
      const p = { algorithm: 1, digits: 1, type: 2, counter: 0n };
      for (const [f, v] of readFields(value)) {
        if (f === 1) p.secret = v; else if (f === 2) p.name = utf8.decode(v); else if (f === 3) p.issuer = utf8.decode(v);
        else if (f === 4) p.algorithm = Number(v); else if (f === 5) p.digits = Number(v); else if (f === 6) p.type = Number(v); else if (f === 7) p.counter = v;
      }
      let account = p.name || '', issuer = p.issuer || '';
      const colon = account.indexOf(':');
      if (colon >= 0) { if (!issuer) issuer = account.slice(0, colon); account = account.slice(colon + 1); }
      try {
        if (!MIGRATION_ALGORITHMS[p.algorithm || 1]) throw new OtpError('algorithm', 'Unsupported algorithm (MD5)');
        entries.push(normalize({ type: p.type === 1 ? 'hotp' : 'totp', issuer, account: account.trim(), secret: base32Encode(p.secret || []),
          algorithm: MIGRATION_ALGORITHMS[p.algorithm || 1], digits: MIGRATION_DIGITS[p.digits] || 6, period: 30, counter: Number(p.counter) }));
      } catch (e) { skipped.push({ issuer, account, reason: e.message }); }
    }
    return { entries, skipped, batch };
  }

  function writeVarint(out, value) {
    let v = BigInt(value);
    do { let byte = Number(v & 0x7fn); v >>= 7n; if (v) byte |= 0x80; out.push(byte); } while (v);
  }
  const writeBytes = (out, field, bytes) => { writeVarint(out, (field << 3) | 2); writeVarint(out, bytes.length); out.push(...bytes); };
  const writeNumber = (out, field, value) => { writeVarint(out, field << 3); writeVarint(out, value); };
  const utf8Bytes = text => new TextEncoder().encode(text);

  /** Migration links (≤ batchSize entries each) Google Authenticator can scan; entries it cannot represent are skipped. */
  function buildMigration(list, { batchSize = 10 } = {}) {
    const usable = [], skipped = [];
    for (const raw of list) {
      const e = normalize(raw);
      const algorithm = Object.keys(MIGRATION_ALGORITHMS).find(k => MIGRATION_ALGORITHMS[k] === e.algorithm);
      const digits = Object.keys(MIGRATION_DIGITS).find(k => MIGRATION_DIGITS[k] === e.digits);
      if (!digits || (e.type === 'totp' && e.period !== 30)) skipped.push({ issuer: e.issuer, account: e.account, reason: 'Google Authenticator only supports 6/8 digits and 30-second periods' });
      else usable.push({ e, algorithm: +algorithm, digits: +digits });
    }
    const batchId = crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff;
    const total = Math.max(1, Math.ceil(usable.length / batchSize));
    const uris = [];
    for (let b = 0; b < usable.length; b += batchSize) {
      const out = [];
      for (const { e, algorithm, digits } of usable.slice(b, b + batchSize)) {
        const p = [];
        writeBytes(p, 1, base32Decode(e.secret));
        writeBytes(p, 2, utf8Bytes(e.issuer ? `${e.issuer}:${e.account}` : e.account));
        if (e.issuer) writeBytes(p, 3, utf8Bytes(e.issuer));
        writeNumber(p, 4, algorithm);
        writeNumber(p, 5, digits);
        writeNumber(p, 6, e.type === 'hotp' ? 1 : 2);
        if (e.type === 'hotp') writeNumber(p, 7, e.counter);
        writeBytes(out, 1, p);
      }
      writeNumber(out, 2, 1);
      writeNumber(out, 3, total);
      writeNumber(out, 4, b / batchSize);
      writeNumber(out, 5, batchId);
      let binary = '';
      for (const byte of out) binary += String.fromCharCode(byte);
      uris.push('otpauth-migration://offline?data=' + encodeURIComponent(btoa(binary)));
    }
    return { uris, skipped };
  }

  // ── Imports ──
  function fromAegis(json) {
    if (json.header?.slots || typeof json.db === 'string') throw new OtpError('aegis-encrypted', 'Encrypted Aegis backups are not supported; export a plain JSON from Aegis');
    return (json.db?.entries || []).map(item => ({ type: item.type, issuer: item.issuer, account: item.name, note: item.note,
      secret: item.info?.secret, algorithm: item.info?.algo, digits: item.info?.digits, period: item.info?.period, counter: item.info?.counter }));
  }

  function from2fas(json) {
    if (json.servicesEncrypted) throw new OtpError('2fas-encrypted', 'Encrypted 2FAS backups are not supported; export without a password');
    return (json.services || []).map(s => {
      const otp = s.otp || {};
      return { type: otp.tokenType, issuer: otp.issuer || s.name, account: otp.account || otp.label, secret: s.secret,
        algorithm: otp.algorithm, digits: otp.digits, period: otp.period, counter: otp.counter };
    });
  }

  /** Parse pasted text or a file's text: otpauth / migration links (one per line), Aegis or 2FAS JSON.
   * Returns { entries, errors, encrypted } — `encrypted` is this tool's own backup envelope, which needs a password. */
  function parseImport(text) {
    const raw = String(text ?? '').trim().replace(/^﻿/, '');
    const entries = [], errors = [];
    if (!raw) return { entries, errors };
    if (raw.startsWith('{')) {
      let json;
      try { json = JSON.parse(raw); } catch { return { entries, errors: [{ line: 1, message: 'Invalid JSON' }] }; }
      if (json.format === 'k-toolkit-2fa') return { entries, errors, encrypted: json.vault };
      let list;
      try {
        if (json.db || json.header) list = fromAegis(json);
        else if (json.services || json.servicesEncrypted) list = from2fas(json);
        else return { entries, errors: [{ line: 1, message: 'Unrecognised JSON backup format' }] };
      } catch (e) { return { entries, errors: [{ line: 1, message: e.message, code: e.code }] }; }
      list.forEach((item, i) => {
        try { entries.push(normalize(item)); }
        catch (e) { errors.push({ line: i + 1, message: `${item.issuer || ''} ${item.account || ''}: ${e.message}`.trim(), code: e.code }); }
      });
      return { entries, errors };
    }
    raw.split(/\r?\n/).forEach((line, i) => {
      const value = line.trim();
      if (!value) return;
      try {
        if (/^otpauth-migration:/i.test(value)) {
          const result = parseMigration(value);
          entries.push(...result.entries);
          result.skipped.forEach(s => errors.push({ line: i + 1, message: `${s.issuer} ${s.account}: ${s.reason}`.trim() }));
        } else entries.push(parseUri(value));
      } catch (e) { errors.push({ line: i + 1, message: e.message, code: e.code }); }
    });
    return { entries, errors };
  }

  /** Split incoming entries into new ones and duplicates of `existing`. */
  function merge(existing, incoming) {
    const seen = new Set(existing.map(dedupeKey));
    const added = [], duplicates = [];
    for (const entry of incoming) {
      const key = dedupeKey(entry);
      if (seen.has(key)) duplicates.push(entry);
      else { seen.add(key); added.push(entry); }
    }
    return { added, duplicates };
  }

  /** Derive display groups without changing, merging or exposing secrets to search. */
  function groupAccounts(entries, { query = '', issuer = '', locale = 'zh-CN' } = {}) {
    const fold = value => String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const names = new Map([['google', 'Google'], ['openai', 'OpenAI'], ['github', 'GitHub'], ['microsoft', 'Microsoft'], ['meta', 'Meta'], ['amazon', 'Amazon'], ['binance', 'Binance']]);
    const words = fold(query).split(' ').filter(Boolean), groups = new Map();
    for (const entry of entries) {
      const name = fold(entry.issuer), key = name ? 'issuer:' + name : 'unclassified';
      if (!groups.has(key)) groups.set(key, { key, label: names.get(name) || String(entry.issuer || '').trim(), count: 0, entries: [] });
      const group = groups.get(key); group.count++;
      const text = fold([entry.issuer, entry.account, entry.note].join(' '));
      if ((!issuer || issuer === key) && words.every(word => text.includes(word))) group.entries.push(entry);
    }
    const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
    const sorted = [...groups.values()].sort((a, b) => Number(a.key === 'unclassified') - Number(b.key === 'unclassified') || collator.compare(a.label, b.label));
    for (const group of sorted) group.entries.sort((a, b) => collator.compare(a.account, b.account) || collator.compare(a.issuer, b.issuer));
    return { total: entries.length, matched: sorted.reduce((n, group) => n + group.entries.length, 0),
      issuers: sorted.map(({ key, label, count }) => ({ key, label, count })), groups: sorted.filter(group => group.entries.length) };
  }

  (window.KCompute ||= {}).otp = Object.freeze({ OtpError, base32Decode, base32Encode, randomSecret, normalize, hotp, generate, verify,
    parseUri, buildUri, parseMigration, buildMigration, parseImport, merge, dedupeKey, groupAccounts });
})();
