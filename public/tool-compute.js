/* Shared, DOM-free text operations used by pages and Agent actions. */
(function () {
  const words = text => text.replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/[-_./\\]+/g, ' ')
    .trim().split(/\s+/).filter(Boolean);
  function formatWords(parts, style) {
    const lower = parts.map(word => word.toLowerCase());
    const title = word => word.charAt(0).toUpperCase() + word.slice(1);
    switch (style) {
      case 'camel': return lower.map((word, i) => i ? title(word) : word).join('');
      case 'pascal': return lower.map(title).join('');
      case 'snake': return lower.join('_');
      case 'kebab': return lower.join('-');
      case 'upper': return lower.join('_').toUpperCase();
      case 'lower': return lower.join(' ');
      case 'title': return lower.map(title).join(' ');
      case 'dot': return lower.join('.');
      case 'path': return lower.join('/');
      case 'sentence': return lower.map((word, i) => i ? word : title(word)).join(' ');
      default: throw new Error('Unknown case style: ' + style);
    }
  }
  function base64Encode(text, urlSafe = false) {
    const result = btoa(unescape(encodeURIComponent(text)));
    return urlSafe ? result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : result;
  }
  function base64Decode(text) {
    return decodeURIComponent(escape(atob(text.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/'))));
  }
  function processLines(text, { trim = false, removeEmpty = false, deduplicate = false, sort = 'none' } = {}) {
    let lines = text === '' ? [] : text.split(/\r\n|\n|\r/);
    const inputLines = lines.length;
    if (trim) lines = lines.map(line => line.trim());
    if (removeEmpty) lines = lines.filter(line => line.trim() !== '');
    if (deduplicate) lines = [...new Set(lines)];
    if (sort === 'asc' || sort === 'desc') lines.sort((a, b) => a.localeCompare(b, 'zh') * (sort === 'asc' ? 1 : -1));
    else if (sort === 'reverse') lines.reverse();
    else if (sort !== 'none') throw new Error('Unknown line order: ' + sort);
    return { result: lines.join('\n'), inputLines, outputLines: lines.length, removed: inputLines - lines.length };
  }
  window.ToolCompute = Object.freeze({ words, formatWords, base64Encode, base64Decode, processLines,
    caseConvert: (text, style) => style === 'upper' ? text.toUpperCase() : style === 'lower' ? text.toLowerCase() : formatWords(words(text), style),
  });
})();
