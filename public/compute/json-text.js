/* Shared JSON string operations. No DOM, evaluation, or network access. */
(function () {
  const LIMITS = Object.freeze({ chars: 1000000, nodes: 20000, depth: 64, layers: 8 });
  const fail = code => { const error = new Error(code); error.code = code; throw error; };
  function checkText(text) {
    if (typeof text !== 'string') fail('invalid');
    if (text.length > LIMITS.chars) fail('limit');
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
      try { value = JSON.parse(current); }
      catch {
        // A copied escaped fragment can omit the surrounding string quotes.
        if (layers !== 0 || !current.includes('\\')) return null;
        try { value = unescapeJSON(current); } catch { return null; }
        if (value === current) return null;
      }
      if (value !== null && typeof value === 'object') return { value, layers };
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
      try { value = JSON.parse(text); } catch { fail('invalid_json'); }
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
  window.KCompute['json-text'] = Object.freeze({ LIMITS, escapeJSON, unescapeJSON, expandNested, inspect });
})();
