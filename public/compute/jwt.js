/* Decode claims only: the signature and trust of a token are never inferred from its expiry. */
(function () {
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function decode(token, { now = Date.now() / 1000 } = {}) {
    const fail = (zh, en) => { throw new Error(window.getCurrentLang?.() === 'en' ? en : zh); };
    if (typeof token !== 'string' || token.length > 200000) fail('JWT 最多 200,000 个字符', 'JWT limit: 200,000 characters');
    const parts = token.trim().split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || parts.some(p => !/^[A-Za-z0-9_-]*$/.test(p))) fail('JWT 必须是三段 Base64URL', 'JWT requires three Base64URL segments');
    const part = text => {
      try {
        const bytes = Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error();
        return value;
      } catch { fail('JWT Header / Payload 必须是 UTF-8 JSON 对象', 'JWT header / payload must be UTF-8 JSON objects'); }
    };
    const header = part(parts[0]), payload = part(parts[1]);
    const dates = {};
    for (const key of ['iat', 'exp', 'nbf']) if (own(payload, key)) {
      const n = payload[key];
      if (typeof n !== 'number' || !Number.isFinite(n) || Math.abs(n * 1000) > 8.64e15) fail(key + ' 必须是有效的秒数', key + ' must be a valid NumericDate in seconds');
      dates[key] = new Date(n * 1000).toISOString();
    }
    const expired = own(payload, 'exp') ? now >= payload.exp : null;
    const notYetValid = own(payload, 'nbf') ? now < payload.nbf : false;
    return { header, payload, signature: parts[2], signatureVerified: false, expired, notYetValid, expAt: dates.exp || null, dates,
      timeStatus: expired ? 'expired' : notYetValid ? 'not-yet-valid' : expired === null ? 'no-expiry' : 'within-time-window' };
  }
  (window.KCompute ||= {}).jwt = Object.freeze({ decode });
})();
