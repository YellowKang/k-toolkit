/* Password-protected JSON envelopes for data kept in the browser (2FA vault, encrypted backup groups).
 * PBKDF2-HMAC-SHA256 (600 000 iterations by default) derives a non-extractable AES-GCM-256 key; every seal uses a fresh
 * 96-bit IV. Envelope: { v:1, kdf:{ name, hash, iterations, salt }, cipher:{ name, iv }, data } with Base64 fields. */
(function () {
  const ITERATIONS = 600000, MIN_ITERATIONS = 1000, MAX_ITERATIONS = 10000000;
  const encoder = new TextEncoder(), decoder = new TextDecoder();

  class BoxError extends Error {
    constructor(code, message) { super(message); this.name = 'BoxError'; this.code = code; }
  }

  function toBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  }
  function fromBase64(text) {
    try { return Uint8Array.from(atob(String(text)), c => c.charCodeAt(0)); }
    catch { throw new BoxError('format', 'Not a valid encrypted envelope'); }
  }

  function isEnvelope(value) {
    return !!value && typeof value === 'object' && value.v === 1 && value.kdf?.name === 'PBKDF2' && value.kdf?.hash === 'SHA-256'
      && Number.isInteger(value.kdf.iterations) && typeof value.kdf.salt === 'string'
      && value.cipher?.name === 'AES-GCM' && typeof value.cipher.iv === 'string' && typeof value.data === 'string';
  }

  async function deriveKey(password, salt, iterations = ITERATIONS) {
    if (!password) throw new BoxError('password-empty', 'Password is required');
    if (!(iterations >= MIN_ITERATIONS && iterations <= MAX_ITERATIONS)) throw new BoxError('format', 'Unsupported key derivation settings');
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  /** Encrypt text with an already derived key; `kdf` is copied into the envelope so the password can open it later. */
  async function seal(key, kdf, text) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(text)));
    return { v: 1, kdf: { ...kdf }, cipher: { name: 'AES-GCM', iv: toBase64(iv) }, data: toBase64(data) };
  }

  /** New envelope with a fresh salt; returns the derived key too, so callers can seal again without re-deriving. */
  async function create(password, text, { iterations = ITERATIONS } = {}) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const kdf = { name: 'PBKDF2', hash: 'SHA-256', iterations, salt: toBase64(salt) };
    const key = await deriveKey(password, salt, iterations);
    return { key, kdf, envelope: await seal(key, kdf, text) };
  }

  async function openWithKey(key, envelope) {
    try {
      const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(envelope.cipher.iv) }, key, fromBase64(envelope.data));
      return decoder.decode(plain);
    } catch (e) {
      if (e instanceof BoxError) throw e;
      throw new BoxError('password', 'Wrong password or the data was modified');
    }
  }

  /** Derive the key from a password and decrypt; wrong passwords and tampering both fail authentication. */
  async function unlock(envelope, password) {
    if (!isEnvelope(envelope)) throw new BoxError('format', 'Not a valid encrypted envelope');
    const key = await deriveKey(password, fromBase64(envelope.kdf.salt), envelope.kdf.iterations);
    return { key, kdf: { ...envelope.kdf }, text: await openWithKey(key, envelope) };
  }

  (window.KCompute ||= {})['secure-box'] = Object.freeze({ ITERATIONS, BoxError, isEnvelope, deriveKey, seal, create, unlock, openWithKey });
})();
