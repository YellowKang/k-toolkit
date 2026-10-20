/* CSV (RFC 4180) parsing and writing shared by pages and the Agent.
 * Handles quoted delimiters/newlines, "" escapes, CRLF/LF/CR, a UTF-8 BOM and comma/semicolon/tab/pipe detection. */
(function () {
  const CANDIDATES = [',', ';', '\t', '|'];

  /** Most frequent candidate delimiter outside quotes on the first non-empty lines. */
  function detectDelimiter(text) {
    const sample = text.replace(/^﻿/, '').split(/\r\n|\n|\r/).filter(line => line.trim()).slice(0, 5);
    let best = ',', bestScore = 0;
    for (const d of CANDIDATES) {
      const counts = sample.map(line => { let n = 0, q = false; for (const c of line) { if (c === '"') q = !q; else if (c === d && !q) n++; } return n; });
      const consistent = counts.every(n => n === counts[0]);
      const score = counts[0] * (consistent ? 2 : 1);
      if (score > bestScore) { best = d; bestScore = score; }
    }
    return best;
  }

  /** Parse into rows of strings. Throws on an unterminated quoted field. */
  function parse(text, { delimiter = 'auto' } = {}) {
    const src = String(text ?? '').replace(/^﻿/, '');
    const d = delimiter === 'auto' ? detectDelimiter(src) : delimiter;
    const rows = [];
    let row = [], field = '', i = 0, line = 1, quoted = false, atStart = true;
    while (i < src.length) {
      const c = src[i];
      if (quoted) {
        if (c === '"') {
          if (src[i + 1] === '"') { field += '"'; i += 2; continue; }
          quoted = false; i++; continue;
        }
        if (c === '\n') line++;
        field += c; i++; continue;
      }
      if (c === '"' && atStart) { quoted = true; atStart = false; i++; continue; }
      if (c === d) { row.push(field); field = ''; atStart = true; i++; continue; }
      if (c === '\r' || c === '\n') {
        row.push(field); rows.push(row); row = []; field = ''; atStart = true; line++;
        i += c === '\r' && src[i + 1] === '\n' ? 2 : 1;
        continue;
      }
      field += c; atStart = false; i++;
    }
    if (quoted) throw new Error(`Unterminated quoted field (starting before line ${line})`);
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return { rows: rows.filter(r => !(r.length === 1 && r[0] === '')), delimiter: d };
  }

  function inferValue(value) {
    if (value === '') return value;
    if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
    if (/^null$/i.test(value)) return null;
    if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(value) && Number.isFinite(+value) && (Math.abs(+value) <= Number.MAX_SAFE_INTEGER || /[.eE]/.test(value))) return +value;
    return value;
  }

  /** Rows → objects keyed by the header row (unique, non-empty names). */
  function toObjects(rows, { header = true, infer = false } = {}) {
    if (!rows.length) return [];
    const width = Math.max(...rows.map(r => r.length));
    const seen = new Map();
    const keys = Array.from({ length: width }, (_, i) => {
      let key = header ? String(rows[0][i] ?? '').trim() : '';
      if (!key) key = `column${i + 1}`;
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      return n > 1 ? `${key}_${n}` : key;
    });
    return rows.slice(header ? 1 : 0).map(r => Object.fromEntries(keys.map((k, i) => [k, infer ? inferValue(r[i] ?? '') : (r[i] ?? '')])));
  }

  function flatten(value, prefix = '', out = {}) {
    for (const [k, v] of Object.entries(value)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) flatten(v, key, out);
      else out[key] = v;
    }
    return out;
  }

  const cellText = v => v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);

  /** Objects/arrays → CSV text; nested values become JSON unless `flat` expands objects into dotted columns. */
  function stringify(records, { delimiter = ',', flat = true, newline = '\n' } = {}) {
    const list = Array.isArray(records) ? records : [records];
    const needsQuote = s => s.includes(delimiter) || /["\r\n]/.test(s) || /^\s|\s$/.test(s);
    const cell = v => { const s = cellText(v); return needsQuote(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    if (list.every(Array.isArray)) return list.map(r => r.map(cell).join(delimiter)).join(newline);
    const objects = list.map(r => r && typeof r === 'object' && !Array.isArray(r) ? (flat ? flatten(r) : r) : { value: r });
    const keys = [...new Set(objects.flatMap(o => Object.keys(o)))];
    return [keys.map(cell).join(delimiter), ...objects.map(o => keys.map(k => cell(o[k])).join(delimiter))].join(newline);
  }

  (window.KCompute ||= {}).csv = Object.freeze({ parse, toObjects, stringify, detectDelimiter, inferValue });
})();
