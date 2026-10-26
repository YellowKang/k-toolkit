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
  // Calendar dates are local days: `new Date('YYYY-MM-DD')` is UTC midnight and toISOString() is the UTC day.
  const pad2 = n => String(n).padStart(2, '0');
  const localDate = (date = new Date()) => `${String(date.getFullYear()).padStart(4, '0')}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  function parseLocalDate(text) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(text ?? '').trim());
    if (!m) return null;
    const date = new Date(2000, 0, 1);
    date.setFullYear(+m[1], +m[2] - 1, +m[3]);
    return date.getMonth() === +m[2] - 1 && date.getDate() === +m[3] ? date : null;
  }
  const dayNumber = date => { const utc = new Date(0); utc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate()); return utc.getTime() / 86400000; };
  function addMonths(date, months) {
    const result = new Date(2000, 0, 1); result.setFullYear(date.getFullYear(), date.getMonth() + months, 1);
    result.setDate(Math.min(date.getDate(), new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
    return result;
  }
  /** Whole years/months/days from a to b (month ends clamp, e.g. Jan 31 + 1 month = Feb 28/29). */
  function calendarDiff(a, b) {
    const sign = dayNumber(b) < dayNumber(a) ? -1 : 1;
    const [from, to] = sign < 0 ? [b, a] : [a, b];
    let months = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
    if (dayNumber(addMonths(from, months)) > dayNumber(to)) months--;
    return { sign, years: Math.floor(months / 12), months: months % 12, totalMonths: months,
      days: dayNumber(to) - dayNumber(addMonths(from, months)), totalDays: dayNumber(to) - dayNumber(from) };
  }
  /** Monday–Friday count in the closed range between two dates (public holidays not included). */
  function weekdaysBetween(a, b) {
    let from = dayNumber(a), to = dayNumber(b);
    if (to < from) [from, to] = [to, from];
    const total = to - from + 1, full = Math.floor(total / 7);
    let count = full * 5;
    for (let day = from + full * 7; day <= to; day++) { const dow = ((day + 4) % 7 + 7) % 7; if (dow !== 0 && dow !== 6) count++; }
    return count;
  }

  /** Wall-clock fields of an instant in an IANA time zone. */
  function zonedParts(ms, timeZone) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(ms));
    const get = type => +parts.find(p => p.type === type).value;
    return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
  }
  const zoneOffset = (ms, timeZone) => {
    const p = zonedParts(ms, timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  };
  /** UTC milliseconds for wall-clock fields in a time zone; DST overlaps take the earlier instant, gaps move forward. */
  function zonedTimeToUtc({ year, month, day, hour = 0, minute = 0, second = 0 }, timeZone) {
    const wall = Date.UTC(year, month - 1, day, hour, minute, second);
    const o1 = zoneOffset(wall, timeZone), t1 = wall - o1;
    const o2 = zoneOffset(t1, timeZone);
    if (o1 === o2) return t1;
    const t2 = wall - o2;
    return zoneOffset(t2, timeZone) === o2 ? t2 : Math.max(t1, t2);
  }

  // Shared DOM-free modules in compute/<name>.js register on window.KCompute; pages and Agent load the same code.
  const moduleLoads = new Map();
  function load(name) {
    if (!/^[a-z][a-z0-9-]*$/.test(name)) return Promise.reject(new Error('Invalid compute module: ' + name));
    if (window.KCompute?.[name]) return Promise.resolve(window.KCompute[name]);
    if (!moduleLoads.has(name)) moduleLoads.set(name, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'compute/' + name + '.js?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
      script.onload = () => window.KCompute?.[name] ? resolve(window.KCompute[name]) : reject(new Error('Compute module did not register: ' + name));
      script.onerror = () => { moduleLoads.delete(name); script.remove(); reject(new Error('Failed to load compute module: ' + name)); };
      document.head.appendChild(script);
    }));
    return moduleLoads.get(name);
  }

  // Third-party libraries are pinned in vendor/ (see vendor/manifest.json); never loaded from a CDN.
  const VENDOR = { jsqr: ['vendor/jsqr/jsQR.js', 'jsQR'], qrcodejs: ['vendor/qrcodejs/qrcode.min.js', 'QRCode'],
    'js-yaml': ['vendor/js-yaml/js-yaml.min.js', 'jsyaml'], 'smol-toml': ['vendor/smol-toml/smol-toml.js', 'smolToml'] };
  const vendorLoads = new Map();
  function loadVendor(name) {
    const entry = VENDOR[name];
    if (!entry) return Promise.reject(new Error('Unknown vendor library: ' + name));
    const [src, global] = entry;
    if (window[global]) return Promise.resolve(window[global]);
    if (!vendorLoads.has(name)) vendorLoads.set(name, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src + '?v=' + encodeURIComponent(document.querySelector('meta[name="toolkit-version"]')?.content || 'dev');
      script.onload = () => window[global] ? resolve(window[global]) : reject(new Error('Library did not load: ' + name));
      script.onerror = () => { vendorLoads.delete(name); script.remove(); reject(new Error('Failed to load library: ' + name)); };
      document.head.appendChild(script);
    }));
    return vendorLoads.get(name);
  }

  window.ToolCompute = Object.freeze({ words, formatWords, base64Encode, base64Decode, processLines,
    caseConvert: (text, style) => style === 'upper' ? text.toUpperCase() : style === 'lower' ? text.toLowerCase() : formatWords(words(text), style),
    localDate, parseLocalDate, addMonths, calendarDiff, weekdaysBetween, zonedParts, zonedTimeToUtc, load, loadVendor,
  });
})();
