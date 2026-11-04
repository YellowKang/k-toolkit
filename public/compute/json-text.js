/* Shared JSON string operations. No DOM, evaluation, or network access. */
(function () {
  const LIMITS = Object.freeze({ chars: 1000000, nodes: 20000, depth: 64, layers: 8 });
  const fail = code => { const error = new Error(code); error.code = code; throw error; };
  function checkText(text) {
    if (typeof text !== 'string') fail('invalid');
    if (text.length > LIMITS.chars) fail('limit');
  }
  // Native numbers are used only when the original literal can round trip safely.
  // Explicit tags keep exact numbers recognizable when Agent results cross JSON transport.
  class ExactNumber {
    constructor(value) { this.value = value; Object.freeze(this); }
    toJSON() { return { type: 'json-number', value: this.value }; }
    valueOf() { throw new TypeError('Use compareNumbers for an exact JSON number'); }
  }
  const isNumber = value => value instanceof ExactNumber;
  const tokens = /"(?:\\[\s\S]|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\]]/g;
  const exact = raw => !Number.isFinite(Number(raw)) || (Number.isInteger(Number(raw)) && !Number.isSafeInteger(Number(raw))) || JSON.stringify(Number(raw)) !== raw;
  function parse(text, { maxChars = LIMITS.chars, maxTokens = 200000 } = {}) {
    if (typeof text !== 'string') fail('invalid');
    if (text.length > Math.min(maxChars, LIMITS.chars * 2)) fail('limit');
    const strings = new Set(); let depth = 0, nodes = 0, needsExact = false;
    for (const [token] of text.matchAll(tokens)) {
      if (++nodes > Math.min(maxTokens, 600000)) fail('complexity');
      if (token[0] === '"') strings.add(JSON.parse(token));
      else if (token === '{' || token === '[') { if (++depth > LIMITS.depth) fail('complexity'); }
      else if (token === '}' || token === ']') depth--;
      else {
        if (token.length > 10000 || (token.split(/[eE]/)[1]?.length || 0) > 1000) fail('complexity');
        needsExact ||= exact(token);
      }
    }
    const native = JSON.parse(text); // Validate the original grammar before inserting placeholders.
    if (!needsExact) return native;
    const numbers = new Map(); let next = 0;
    const encoded = text.replace(tokens, token => {
      if (!/^-?\d/.test(token) || !exact(token)) return token;
      let marker;
      do { marker = '\0k-toolkit-number:' + next++; } while (strings.has(marker));
      numbers.set(marker, new ExactNumber(token));
      return JSON.stringify(marker);
    });
    return JSON.parse(encoded, (_key, value) => typeof value === 'string' && numbers.has(value) ? numbers.get(value) : value);
  }
  function stringify(value, space = 0) {
    if (value === undefined) return undefined;
    const indent = ' '.repeat(Math.max(0, Math.min(10, Number(space) || 0))), chunks = [], parents = new Set();
    let chars = 0, nodes = 0;
    const emit = text => { chars += text.length; if (chars > LIMITS.chars * 2) fail('limit'); chunks.push(text); };
    function write(item, depth) {
      if (++nodes > 200000 || depth > LIMITS.depth) fail('complexity');
      if (isNumber(item)) { emit(item.value); return; }
      if (item === null || typeof item !== 'object') { emit(JSON.stringify(item) ?? 'null'); return; }
      if (parents.has(item)) fail('complexity');
      parents.add(item);
      const array = Array.isArray(item), keys = array ? Array.from({length:item.length}, (_, i) => i) : Object.keys(item).filter(key => item[key] !== undefined);
      emit(array ? '[' : '{');
      keys.forEach((key, i) => {
        if (i) emit(',');
        if (indent) emit('\n' + indent.repeat(depth + 1));
        if (!array) emit(JSON.stringify(key) + (indent ? ': ' : ':'));
        write(item[key], depth + 1);
      });
      if (keys.length && indent) emit('\n' + indent.repeat(depth));
      emit(array ? ']' : '}'); parents.delete(item);
    }
    write(value, 0); return chunks.join('');
  }
  function decimal(value) {
    const raw = isNumber(value) ? value.value : String(value);
    const match = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(raw);
    if (!match) throw new TypeError('Expected a JSON number');
    let digits = (match[2] + (match[3] || '')).replace(/^0+/, '');
    if (!digits) return { sign: 0, digits: '', order: 0n };
    const exponent = BigInt(match[4] || '0') - BigInt((match[3] || '').length);
    const order = exponent + BigInt(digits.length);
    digits = digits.replace(/0+$/, '');
    return { sign: match[1] ? -1 : 1, digits, order };
  }
  function compareNumbers(a, b) {
    const left = decimal(a), right = decimal(b);
    if (left.sign !== right.sign) return left.sign < right.sign ? -1 : 1;
    if (!left.sign) return 0;
    if (left.order !== right.order) return (left.order < right.order ? -1 : 1) * left.sign;
    const length = Math.max(left.digits.length, right.digits.length), l = left.digits.padEnd(length, '0'), r = right.digits.padEnd(length, '0');
    return (l === r ? 0 : l < r ? -1 : 1) * left.sign;
  }
  function pointer(value, path) {
    if (typeof path !== 'string' || path.length > 1000 || (path !== '' && !path.startsWith('/'))) throw new Error('JSON Pointer must be empty or start with / (up to 1000 characters)');
    for (const part of path === '' ? [] : path.slice(1).split('/')) {
      if (/~(?![01])/u.test(part)) throw new Error('Invalid JSON Pointer escape');
      const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
      if (value === null || typeof value !== 'object' || isNumber(value) || !Object.prototype.hasOwnProperty.call(value,key)
        || (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(key))) throw new Error('JSON Pointer not found: ' + path);
      value = value[key];
    }
    return value;
  }
  function escapeJSON(text, quotes = true) {
    checkText(text);
    const result = JSON.stringify(text);
    return quotes ? result : result.slice(1, -1);
  }
  // Exactly one layer. Never remove slashes with a blanket replacement.
  function unescapeJSON(text) {
    checkText(text);
    try {
      const trimmed = text.trim();
      const value = JSON.parse(trimmed.startsWith('"') ? trimmed : '"' + text + '"');
      if (typeof value !== 'string') fail('invalid');
      return value;
    } catch { fail('invalid_escape'); }
  }
  function container(text) {
    let current = text, layers = 0;
    for (;;) {
      let value;
      try { value = parse(current); }
      catch {
        // A copied escaped fragment can omit the surrounding string quotes.
        if (layers !== 0 || !current.includes('\\')) return null;
        try { value = unescapeJSON(current); } catch { return null; }
        if (value === current) return null;
      }
      if (value !== null && typeof value === 'object' && !isNumber(value)) return { value, layers };
      if (typeof value !== 'string' || value === current) return null;
      if (layers >= LIMITS.layers) fail('layers');
      current = value;
      layers++;
    }
  }
  function expandNested(text) {
    checkText(text);
    let value, layers = 0, count = 0, nodes = 0, scanned = 0;
    const root = container(text);
    if (root) {
      value = root.value; layers = root.layers;
      if (layers) count++;
    } else {
      try { value = parse(text); } catch (error) { if (error.code) throw error; fail('invalid_json'); }
    }
    function walk(item, depth) {
      if (++nodes > LIMITS.nodes || depth > LIMITS.depth) fail('complexity');
      if (typeof item === 'string') {
        scanned += item.length;
        if (scanned > LIMITS.chars * 4) fail('complexity');
        // Only structured JSON is expanded. IDs such as "123" stay strings.
        const trimmed = item.trim();
        if (!/^[{["\\]/.test(trimmed)) return item;
        const found = container(item);
        if (!found) return item;
        count++;
        return walk(found.value, depth + 1);
      }
      if (isNumber(item)) return item;
      if (Array.isArray(item)) return item.map(child => walk(child, depth + 1));
      if (item !== null && typeof item === 'object') {
        const result = Object.create(null);
        for (const key of Object.keys(item)) result[key] = walk(item[key], depth + 1);
        return result;
      }
      return item;
    }
    return { value: walk(value, 0), count, layers };
  }
  function inspect(text) {
    checkText(text);
    if (!text.trim()) return { kind: 'empty', count: 0 };
    let kind;
    try { kind = typeof JSON.parse(text) === 'string' ? 'string' : 'json'; }
    catch { kind = 'invalid'; }
    try {
      const result = expandNested(text);
      return { kind: result.layers ? 'encoded' : kind, count: result.count, layers: result.layers };
    } catch (error) {
      if (error.code === 'invalid_json') return { kind, count: 0 };
      throw error;
    }
  }
  window.KCompute = window.KCompute || {};
  window.KCompute['json-text'] = Object.freeze({ LIMITS, parse, stringify, isNumber, compareNumbers, pointer, escapeJSON, unescapeJSON, expandNested, inspect });
})();
