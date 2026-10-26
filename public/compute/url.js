(function () {
  const fail = (zh, en) => { throw new Error(window.getCurrentLang?.() === 'en' ? en : zh); };
  function check(text) {
    if (typeof text !== 'string') fail('需要文本', 'Expected text');
    if (text.length > 200000) fail('内容最多 200,000 个字符', 'Input limit: 200,000 characters');
    return text;
  }
  function parse(input, { base } = {}) {
    const raw = check(input).trim();
    if (!raw) fail('请输入 URL', 'Enter a URL');
    if (!base && /^\/(?!\/)/.test(raw)) fail('相对路径需要基础 URL', 'Relative paths need a base URL');
    let url;
    try {
      if (base) url = new URL(raw, base);
      else if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/?#]+:\d+(?:[/?#]|$)/.test(raw)) url = new URL(raw);
      else url = new URL(raw.startsWith('//') ? 'https:' + raw : 'https://' + raw);
    } catch { fail('URL 格式无效；相对路径需要基础 URL', 'Invalid URL; relative paths need a base URL'); }
    const entries = [...url.searchParams].map(([key, value]) => ({ key, value }));
    if (entries.length > 5000) fail('查询参数最多 5,000 项', 'Query parameter limit: 5,000');
    const params = Object.create(null);
    for (const { key, value } of entries) {
      if (Object.prototype.hasOwnProperty.call(params, key)) { if(Array.isArray(params[key])) params[key].push(value); else params[key]=[params[key],value]; }
      else params[key] = value;
    }
    return { result: url.href, protocol: url.protocol, host: url.host, hostname: url.hostname, port: url.port, origin: url.origin,
      pathname: url.pathname, search: url.search, hash: url.hash, entries, params };
  }
  function build(base, entries = [], { replace = false } = {}) {
    check(base);
    if (!Array.isArray(entries) || entries.length > 5000) fail('查询参数最多 5,000 项', 'Query parameter limit: 5,000');
    const params = new URLSearchParams();
    for (const item of entries) {
      if (!item || typeof item.key !== 'string' || typeof item.value !== 'string') fail('参数名和值须为字符串', 'Parameter keys and values must be strings');
      params.append(item.key, item.value);
    }
    let result;
    if (!base.trim()) result = params.size ? '?' + params.toString() : '';
    else {
      const url = new URL(parse(base).result);
      if (replace) url.search = '';
      for (const [key, value] of params) url.searchParams.append(key, value);
      result = url.href;
    }
    return check(result);
  }
  function codec(text, { decode = false, mode = 'component' } = {}) {
    check(text);
    if (!['component', 'uri', 'form'].includes(mode)) fail('未知编码模式', 'Unknown encoding mode');
    try {
      if (mode === 'uri') return decode ? decodeURI(text) : encodeURI(text);
      if (decode) return decodeURIComponent(mode === 'form' ? text.replace(/\+/g, ' ') : text);
      const encoded = encodeURIComponent(text);
      return mode === 'form' ? encoded.replace(/%20/g, '+').replace(/[!'()~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()) : encoded;
    } catch { fail('无效的百分号编码或 Unicode 文本', 'Invalid percent encoding or Unicode text'); }
  }
  (window.KCompute ||= {}).url = Object.freeze({ parse, build, codec });
})();
