/* YAML / TOML / XML conversions shared by the format pages and the Agent.
 * YAML: js-yaml with the YAML 1.2 core schema plus merge keys (<<), so dates stay strings.
 * TOML: smol-toml (TOML 1.0). XML: the browser's DOMParser, with escaping that keeps output well-formed. */
(function () {
  const lib = async name => {
    const global = { 'js-yaml': 'jsyaml', 'smol-toml': 'smolToml' }[name];
    return window[global] || window.ToolCompute.loadVendor(name);
  };

  class FormatError extends Error {
    constructor(message, line, column) { super(message); this.line = line; this.column = column; }
  }

  // ── YAML ──
  let yamlSchema = null;
  async function yaml() {
    const y = await lib('js-yaml');
    yamlSchema ||= y.CORE_SCHEMA.extend({ implicit: [y.types.merge] });
    return y;
  }

  /** YAML text → value; several documents (---) become an array. */
  async function yamlParse(text) {
    const y = await yaml();
    const docs = [];
    try { y.loadAll(String(text ?? ''), doc => docs.push(doc), { schema: yamlSchema }); }
    catch (e) { throw new FormatError(e.reason || e.message, e.mark ? e.mark.line + 1 : undefined, e.mark ? e.mark.column + 1 : undefined); }
    return { value: docs.length === 1 ? docs[0] : docs, documents: docs.length };
  }

  async function yamlStringify(value, { indent = 2 } = {}) {
    const y = await yaml();
    return y.dump(value, { indent, lineWidth: -1, noRefs: true, schema: yamlSchema });
  }

  // ── TOML ──
  async function tomlParse(text) {
    const t = await lib('smol-toml');
    try { return t.parse(String(text ?? '')); }
    catch (e) { throw new FormatError(String(e.message).split('\n')[0], e.line, e.column); }
  }

  /** Value → TOML; TOML has no null, so null fields are reported and omitted. */
  async function tomlStringify(value) {
    const t = await lib('smol-toml');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new FormatError('TOML needs a top-level object (table)');
    const dropped = [];
    const strip = (v, path) => {
      if (Array.isArray(v)) return v.filter((x, i) => { if (x === null) { dropped.push(`${path}[${i}]`); return false; } return true; }).map((x, i) => strip(x, `${path}[${i}]`));
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k, x]) => { if (x === null) { dropped.push(path ? `${path}.${k}` : k); return false; } return true; }).map(([k, x]) => [k, strip(x, path ? `${path}.${k}` : k)]));
      return v;
    };
    const clean = strip(value, '');
    return { text: t.stringify(clean), dropped };
  }

  // ── XML ──
  const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escAttr = s => escText(s).replace(/"/g, '&quot;');

  function xmlParse(text) {
    const doc = new DOMParser().parseFromString(String(text ?? ''), 'application/xml');
    const error = doc.querySelector('parsererror');
    if (error) {
      const message = (error.textContent || 'XML parse error').replace(/\s+/g, ' ').trim();
      const m = /line(?: number)?\s*(\d+)(?:.*?column\s*(\d+))?/i.exec(message);
      // Chrome: "error on line 1 at column 11: …"; Firefox: "XML Parsing Error: … Location: … Line Number 1, Column 11:".
      const reason = message.replace(/^This page contains the following errors:\s*/i, '').replace(/\s*Below is a rendering.*$/i, '')
        .replace(/^error on line \d+ at column \d+:\s*/i, '').replace(/^XML Parsing Error:\s*/i, '').replace(/\s*Location:.*$/i, '');
      throw new FormatError(reason, m ? +m[1] : undefined, m && m[2] ? +m[2] : undefined);
    }
    return doc;
  }

  function declaration(text) {
    const m = /^\s*(<\?xml[^?]*\?>)/.exec(String(text ?? ''));
    return m ? m[1] : '';
  }

  /** Pretty-print: indents elements, keeps comments/CDATA/PIs, escapes text and attributes. */
  function xmlFormat(text, { indent = '  ' } = {}) {
    const doc = xmlParse(text);
    const out = [];
    const decl = declaration(text);
    if (decl) out.push(decl);
    const walk = (node, depth) => {
      const pad = indent.repeat(depth);
      switch (node.nodeType) {
        case 1: {
          const attrs = [...node.attributes].map(a => ` ${a.name}="${escAttr(a.value)}"`).join('');
          const kids = [...node.childNodes].filter(c => !(c.nodeType === 3 && !c.nodeValue.trim()));
          if (!kids.length) { out.push(`${pad}<${node.nodeName}${attrs}/>`); return; }
          if (kids.length === 1 && kids[0].nodeType === 3) { out.push(`${pad}<${node.nodeName}${attrs}>${escText(kids[0].nodeValue.trim())}</${node.nodeName}>`); return; }
          out.push(`${pad}<${node.nodeName}${attrs}>`);
          kids.forEach(c => walk(c, depth + 1));
          out.push(`${pad}</${node.nodeName}>`);
          return;
        }
        case 3: out.push(pad + escText(node.nodeValue.trim())); return;
        case 4: out.push(`${pad}<![CDATA[${node.nodeValue}]]>`); return;
        case 7: out.push(`${pad}<?${node.target} ${node.data}?>`); return;
        case 8: out.push(`${pad}<!--${node.nodeValue}-->`); return;
        case 10: out.push(`<!DOCTYPE ${node.name}${node.publicId ? ` PUBLIC "${node.publicId}" "${node.systemId}"` : node.systemId ? ` SYSTEM "${node.systemId}"` : ''}>`); return;
      }
    };
    doc.childNodes.forEach(n => walk(n, 0));
    return out.join('\n');
  }

  /** Minify: drops whitespace-only text between tags and comments; text content and attributes are untouched. */
  function xmlMinify(text, { keepComments = false } = {}) {
    const doc = xmlParse(text);
    const prune = node => {
      [...node.childNodes].forEach(c => {
        if (c.nodeType === 3 && !c.nodeValue.trim()) c.remove();
        else if (c.nodeType === 8 && !keepComments) c.remove();
        else if (c.nodeType === 1) prune(c);
      });
    };
    prune(doc.documentElement);
    const decl = declaration(text);
    return (decl ? decl : '') + new XMLSerializer().serializeToString(doc.documentElement);
  }

  /** XML → JSON-friendly object: attributes under "@", text under "#", repeated children become arrays. */
  function xmlToObject(text) {
    const doc = xmlParse(text);
    const convert = node => {
      const obj = {};
      if (node.attributes.length) obj['@'] = Object.fromEntries([...node.attributes].map(a => [a.name, a.value]));
      const kids = [...node.childNodes].filter(n => (n.nodeType === 1) || ((n.nodeType === 3 || n.nodeType === 4) && n.nodeValue.trim()));
      const textValue = kids.filter(n => n.nodeType !== 1).map(n => n.nodeValue.trim()).join(' ');
      const elements = kids.filter(n => n.nodeType === 1);
      if (!elements.length) return node.attributes.length ? (textValue ? { ...obj, '#': textValue } : obj) : textValue;
      if (textValue) obj['#'] = textValue;
      for (const child of elements) {
        const v = convert(child);
        if (child.nodeName in obj) obj[child.nodeName] = [].concat(obj[child.nodeName], [v]);
        else obj[child.nodeName] = v;
      }
      return obj;
    };
    return { [doc.documentElement.nodeName]: convert(doc.documentElement) };
  }

  (window.KCompute ||= {}).formats = Object.freeze({ FormatError, yamlParse, yamlStringify, tomlParse, tomlStringify, xmlFormat, xmlMinify, xmlToObject });
})();
