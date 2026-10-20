/* .env parsing compatible with dotenv: optional "export", quoted multi-line values, \n escapes in double quotes,
 * inline " #" comments for unquoted values, last duplicate wins. Shared by the ENV page and the Agent. */
(function () {
  const KEY = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/;

  function parse(text) {
    const lines = String(text ?? '').replace(/^﻿/, '').split(/\r\n|\n|\r/);
    const entries = [], invalid = [], seen = new Map();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i], trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const m = KEY.exec(trimmed);
      if (!m) { invalid.push({ line: i + 1, text: line }); continue; }
      const key = m[1], startLine = i + 1;
      let raw = m[2], value;
      const quote = raw[0];
      if (quote === '"' || quote === "'" || quote === '`') {
        // Find the closing quote, continuing onto following lines when needed.
        let body = raw.slice(1), end = -1;
        const closing = s => { for (let j = 0; j < s.length; j++) { if (quote === '"' && s[j] === '\\') { j++; continue; } if (s[j] === quote) return j; } return -1; };
        end = closing(body);
        while (end === -1 && i + 1 < lines.length) { body += '\n' + lines[++i]; end = closing(body); }
        if (end === -1) { invalid.push({ line: startLine, text: line, reason: 'unterminated' }); continue; }
        value = body.slice(0, end);
        if (quote === '"') value = value.replace(/\\(n|r|t|"|\\)/g, (_, c) => ({ n: '\n', r: '\r', t: '\t', '"': '"', '\\': '\\' })[c]);
      } else {
        const hash = raw.search(/\s#/);
        value = (hash === -1 ? raw : raw.slice(0, hash)).trim();
      }
      if (seen.has(key)) entries[seen.get(key)].duplicate = true;
      seen.set(key, entries.length);
      entries.push({ key, value, line: startLine });
    }
    const variables = {};
    for (const e of entries) variables[e.key] = e.value;
    const duplicates = [...new Set(entries.filter(e => e.duplicate).map(e => e.key))];
    return { variables, entries: entries.filter(e => !e.duplicate), duplicates, invalid };
  }

  const shellQuote = v => /^[A-Za-z0-9_./:@%+,=-]*$/.test(v) && v !== '' ? v : `'${v.replace(/'/g, `'\\''`)}'`;
  function format(variables, kind) {
    const pairs = Object.entries(variables);
    if (kind === 'json') return JSON.stringify(variables, null, 2);
    if (kind === 'shell') return pairs.map(([k, v]) => `export ${k}=${shellQuote(v)}`).join('\n');
    if (kind === 'docker') return pairs.map(([k, v]) => `-e ${shellQuote(`${k}=${v}`)}`).join(' \\\n');
    if (kind === 'compose') return 'environment:\n' + pairs.map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join('\n');
    throw new Error('Unknown format: ' + kind);
  }

  (window.KCompute ||= {}).env = Object.freeze({ parse, format });
})();
