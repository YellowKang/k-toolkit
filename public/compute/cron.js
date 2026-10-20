/* Cron parser and scheduler shared by the Cron page and the Agent.
 * Dialects: unix (5 fields: min hour dom month dow; dow 0-7, Sunday = 0/7; dom/dow OR when both restricted),
 * spring (6 fields with seconds first; dow 0-7; all fields must match),
 * quartz (6–7 fields with seconds first and optional year; dow 1-7, Sunday = 1; one of dom/dow must be "?").
 * Quartz day specials: L, L-n, nW, LW in day-of-month; nL and n#k in day-of-week. Times use the local time zone. */
(function () {
  const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MACROS = { '@yearly': '0 0 1 1 *', '@annually': '0 0 1 1 *', '@monthly': '0 0 1 * *', '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *', '@midnight': '0 0 * * *', '@hourly': '0 * * * *' };
  const FIELD_RANGES = { second: [0, 59], minute: [0, 59], hour: [0, 23], dom: [1, 31], month: [1, 12], dow: [0, 7], year: [1970, 2099] };

  class CronError extends Error {
    constructor(field, code, message, detail = '') { super(message); this.field = field; this.code = code; this.detail = detail; }
  }

  function toNumber(text, field, dialect) {
    const upper = text.toUpperCase();
    if (field === 'month' && MONTH_NAMES.includes(upper)) return MONTH_NAMES.indexOf(upper) + 1;
    if (field === 'dow' && DOW_NAMES.includes(upper)) return dialect === 'quartz' ? DOW_NAMES.indexOf(upper) + 1 : DOW_NAMES.indexOf(upper);
    if (!/^\d+$/.test(text)) throw new CronError(field, 'value', `invalid value "${text}"`, text);
    return +text;
  }

  // Values allowed by a plain field (no L/W/#); Quartz day-of-week 1-7 is normalised to 0-6.
  function expand(text, field, dialect) {
    let [min, max] = FIELD_RANGES[field];
    if (field === 'dow' && dialect === 'quartz') [min, max] = [1, 7];
    const values = new Set();
    for (const part of text.split(',')) {
      if (!part) throw new CronError(field, 'value', 'empty list item', text);
      const [rangeText, stepText, extra] = part.split('/');
      if (extra !== undefined) throw new CronError(field, 'step', `invalid step "${part}"`, part);
      const step = stepText === undefined ? 1 : toNumber(stepText, field, dialect);
      if (!step) throw new CronError(field, 'step', 'step must be at least 1', part);
      let lo, hi;
      if (rangeText === '*') [lo, hi] = [min, field === 'dow' && dialect !== 'quartz' ? 6 : max];
      else if (rangeText.includes('-')) {
        const [a, b, more] = rangeText.split('-');
        if (more !== undefined) throw new CronError(field, 'value', `invalid range "${rangeText}"`, rangeText);
        [lo, hi] = [toNumber(a, field, dialect), toNumber(b, field, dialect)];
      } else {
        lo = toNumber(rangeText, field, dialect);
        hi = stepText === undefined ? lo : (field === 'dow' && dialect !== 'quartz' ? 6 : max);
      }
      if (lo < min || hi > max || lo > hi) throw new CronError(field, 'range', `"${part}" is outside ${min}-${max}`, `${min}-${max}`);
      for (let v = lo; v <= hi; v += step) values.add(v);
    }
    if (field === 'dow') {
      const days = new Set();
      for (const v of values) days.add(dialect === 'quartz' ? v - 1 : v % 7);
      return days;
    }
    return values;
  }

  function parseDom(text, dialect) {
    if (text === '?') return { any: true, unspecified: true };
    if (text === '*') return { any: true };
    const m = /^(?:L(?:-(\d+))?|LW|(\d+)W)$/i.exec(text);
    if (m) {
      if (dialect === 'unix') throw new CronError('dom', 'quartz-ext', 'L and W are Quartz extensions', text);
      if (/^LW$/i.test(text)) return { lastWeekday: true };
      if (m[2]) { const day = +m[2]; if (day < 1 || day > 31) throw new CronError('dom', 'range', 'W day must be 1-31', '1-31'); return { nearestWeekday: day }; }
      return { lastOffset: m[1] ? +m[1] : 0 };
    }
    return { values: expand(text, 'dom', dialect), wildcard: text.startsWith('*') };
  }

  function parseDow(text, dialect) {
    if (text === '?') return { any: true, unspecified: true };
    if (text === '*') return { any: true };
    const m = /^([A-Za-z]{3}|\d)(L|#([1-5]))$/.exec(text);
    if (m) {
      if (dialect === 'unix') throw new CronError('dow', 'quartz-ext', 'L and # are Quartz extensions', text);
      const day = [...expand(m[1], 'dow', dialect)][0];
      return m[2] === 'L' ? { lastOf: day } : { nth: day, n: +m[3] };
    }
    return { values: expand(text, 'dow', dialect), wildcard: text.startsWith('*') };
  }

  /** Parse an expression; returns { ok, dialect, fields, ... } or { ok: false, field, error }. */
  function parse(expression, dialect = 'auto') {
    try {
      let text = String(expression ?? '').trim();
      if (!text) throw new CronError(null, 'empty', 'empty expression');
      if (text.startsWith('@')) {
        const macro = MACROS[text.toLowerCase()];
        if (!macro) throw new CronError(null, 'macro', `unknown macro "${text}"`, text);
        text = macro;
      }
      const parts = text.split(/\s+/);
      const kind = dialect === 'auto' ? (parts.length === 5 ? 'unix' : parts.length === 6 ? 'spring' : 'quartz') : dialect;
      const expected = dialect === 'auto' ? [5, 6, 7] : kind === 'unix' ? [5] : kind === 'spring' ? [6] : [6, 7];
      if (!expected.includes(parts.length)) throw new CronError(null, 'count', `expected ${expected.join('/')} fields, got ${parts.length}`, `${expected.join('/')}|${parts.length}`);
      const names = kind === 'unix' ? ['minute', 'hour', 'dom', 'month', 'dow'] : ['second', 'minute', 'hour', 'dom', 'month', 'dow', 'year'];
      const raw = Object.fromEntries(names.slice(0, parts.length).map((name, i) => [name, parts[i]]));
      if (kind === 'unix') raw.second = '0';
      for (const [name, value] of Object.entries(raw)) if (value === '?' && name !== 'dom' && name !== 'dow') throw new CronError(name, 'question', '"?" is only allowed in day-of-month or day-of-week');
      const fields = {
        second: expand(raw.second, 'second', kind), minute: expand(raw.minute, 'minute', kind), hour: expand(raw.hour, 'hour', kind),
        dom: parseDom(raw.dom, kind), month: expand(raw.month, 'month', kind), dow: parseDow(raw.dow, kind),
        year: raw.year && raw.year !== '*' ? expand(raw.year, 'year', kind) : null,
      };
      if (kind === 'quartz' && !fields.dom.unspecified && !fields.dow.unspecified) {
        if (!fields.dom.any && !fields.dow.any) throw new CronError('dow', 'quartz-both', 'Quartz needs "?" in day-of-month or day-of-week');
      }
      // Vixie cron: when both day fields are restricted (neither starts with "*"), a day matches either one.
      const unixOr = kind === 'unix' && !fields.dom.any && !fields.dow.any && !fields.dom.wildcard && !fields.dow.wildcard;
      return { ok: true, dialect: kind, raw, fields, dayMode: unixOr ? 'or' : 'and', expression: text };
    } catch (error) {
      if (error instanceof CronError) return { ok: false, field: error.field, code: error.code, detail: error.detail, error: error.message };
      throw error;
    }
  }

  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  function nearestWeekday(y, m, day) {
    const last = daysIn(y, m), d = Math.min(day, last), dow = new Date(y, m, d).getDay();
    if (dow === 6) return d === 1 ? 3 : d - 1;
    if (dow === 0) return d === last ? d - 2 : d + 1;
    return d;
  }
  function domMatches(f, date) {
    const y = date.getFullYear(), m = date.getMonth(), d = date.getDate(), last = daysIn(y, m);
    if (f.any) return true;
    if (f.values) return f.values.has(d);
    if (f.lastOffset !== undefined) return d === last - f.lastOffset;
    if (f.lastWeekday) { const dow = new Date(y, m, last).getDay(); return d === (dow === 6 ? last - 1 : dow === 0 ? last - 2 : last); }
    return d === nearestWeekday(y, m, f.nearestWeekday);
  }
  function dowMatches(f, date) {
    const dow = date.getDay();
    if (f.any) return true;
    if (f.values) return f.values.has(dow);
    if (f.lastOf !== undefined) return dow === f.lastOf && date.getDate() + 7 > daysIn(date.getFullYear(), date.getMonth());
    return dow === f.nth && Math.ceil(date.getDate() / 7) === f.n;
  }
  function dayMatches(parsed, date) {
    const { fields } = parsed;
    if (!fields.month.has(date.getMonth() + 1)) return false;
    if (fields.year && !fields.year.has(date.getFullYear())) return false;
    const dom = domMatches(fields.dom, date), dow = dowMatches(fields.dow, date);
    return parsed.dayMode === 'or' ? dom || dow : dom && dow;
  }

  /** Next `count` run times strictly after `from` (local time). Searches up to `years` years ahead. */
  function next(parsed, from = new Date(), count = 5, years = 30) {
    if (!parsed?.ok) return [];
    const sorted = key => [...parsed.fields[key]].sort((a, b) => a - b);
    const seconds = sorted('second'), minutes = sorted('minute'), hours = sorted('hour');
    const results = [], start = new Date(from.getTime() + 1000 - from.getMilliseconds());
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const limit = new Date(day.getFullYear() + years, day.getMonth(), day.getDate());
    for (; day < limit && results.length < count; day.setDate(day.getDate() + 1)) {
      if (!dayMatches(parsed, day)) continue;
      for (const h of hours) for (const mi of minutes) for (const s of seconds) {
        const t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi, s);
        // Skip times that do not exist locally (DST gaps shift the hour).
        if (t.getHours() !== h || t < start) continue;
        results.push(t);
        if (results.length >= count) return results;
      }
    }
    return results;
  }

  // ── Human-readable description ──
  const TEXT = {
    zh: {
      every: { second: '每秒', minute: '每分钟', hour: '每小时', dom: '每天', month: '每月', dow: '每天', year: '每年' },
      unit: { second: '秒', minute: '分钟', hour: '小时', dom: '天', month: '个月', dow: '天', year: '年' },
      value: { second: v => `${v} 秒`, minute: v => `${v} 分`, hour: v => `${v} 点`, dom: v => `${v} 号`, month: v => `${v} 月`, dow: v => '周' + '日一二三四五六'[v], year: v => `${v} 年` },
      range: (a, b) => `${a}至${b}`, list: items => items.join('、'), step: (n, unit) => `每 ${n} ${unit}`, stepFrom: (a, n, unit) => `从${a}起每 ${n} ${unit}`,
      unspecified: '不指定', last: '每月最后一天', lastOffset: n => `每月倒数第 ${n + 1} 天`, lastWeekday: '每月最后一个工作日',
      nearest: d => `离 ${d} 号最近的工作日`, lastOf: d => `每月最后一个周${'日一二三四五六'[d]}`, nth: (d, n) => `每月第 ${n} 个周${'日一二三四五六'[d]}`,
      or: '或', at: t => `${t}`, daily: '每天', join: ' · ',
    },
    en: {
      every: { second: 'every second', minute: 'every minute', hour: 'every hour', dom: 'every day', month: 'every month', dow: 'every day', year: 'every year' },
      unit: { second: 'seconds', minute: 'minutes', hour: 'hours', dom: 'days', month: 'months', dow: 'days', year: 'years' },
      value: { second: v => `second ${v}`, minute: v => `minute ${v}`, hour: v => `${v}:00`, dom: v => `day ${v}`, month: v => MONTH_NAMES[v - 1][0] + MONTH_NAMES[v - 1].slice(1).toLowerCase(), dow: v => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][v], year: v => `${v}` },
      range: (a, b) => `${a}–${b}`, list: items => items.join(', '), step: (n, unit) => `every ${n} ${unit}`, stepFrom: (a, n, unit) => `every ${n} ${unit} from ${a}`,
      unspecified: 'not specified', last: 'last day of the month', lastOffset: n => `${n} day(s) before the last day`, lastWeekday: 'last weekday of the month',
      nearest: d => `weekday nearest day ${d}`, lastOf: d => `last ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]} of the month`, nth: (d, n) => `${['1st', '2nd', '3rd', '4th', '5th'][n - 1]} ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]} of the month`,
      or: 'or', at: t => `at ${t}`, daily: 'every day', join: ' · ',
    },
  };

  function describeField(parsed, field, lang) {
    const t = TEXT[lang] || TEXT.zh, raw = parsed.raw[field];
    if (raw === undefined || raw === '*') return null;
    if (raw === '?') return t.unspecified;
    const f = parsed.fields[field];
    if (field === 'dom' && !f.values) {
      if (f.lastWeekday) return t.lastWeekday;
      if (f.nearestWeekday) return t.nearest(f.nearestWeekday);
      return f.lastOffset ? t.lastOffset(f.lastOffset) : t.last;
    }
    if (field === 'dow' && !f.values) return f.lastOf !== undefined ? t.lastOf(f.lastOf) : t.nth(f.nth, f.n);
    const valueText = text => {
      const n = toNumber(text, field, parsed.dialect);
      return t.value[field](field === 'dow' ? (parsed.dialect === 'quartz' ? n - 1 : n % 7) : n);
    };
    return t.list(raw.split(',').map(part => {
      const [range, step] = part.split('/');
      if (step) {
        if (range === '*') return t.step(step, t.unit[field]);
        if (range.includes('-')) { const [a, b] = range.split('-'); return t.range(valueText(a), valueText(b)) + ' ' + t.step(step, t.unit[field]); }
        return t.stepFrom(valueText(range), step, t.unit[field]);
      }
      if (range.includes('-')) { const [a, b] = range.split('-'); return t.range(valueText(a), valueText(b)); }
      return valueText(range);
    }));
  }

  function describe(parsed, lang = 'zh') {
    if (!parsed?.ok) return '';
    const t = TEXT[lang] || TEXT.zh, raw = parsed.raw;
    const single = v => /^\d+$/.test(v);
    let time;
    if (single(raw.hour) && single(raw.minute) && single(raw.second)) {
      time = t.at(`${raw.hour.padStart(2, '0')}:${raw.minute.padStart(2, '0')}${+raw.second ? ':' + raw.second.padStart(2, '0') : ''}`);
    } else {
      const hour = raw.hour === '*' ? null : describeField(parsed, 'hour', lang);
      const second = raw.second === '0' ? null : raw.second === '*' ? t.every.second : describeField(parsed, 'second', lang);
      // "every minute" is implied when seconds already repeat within every minute of every hour.
      const minute = raw.minute !== '*' ? describeField(parsed, 'minute', lang) : second && !hour ? null : t.every.minute;
      time = [hour, minute, second].filter(Boolean).join(lang === 'zh' ? ' ' : ', ');
    }
    const dom = describeField(parsed, 'dom', lang), dow = describeField(parsed, 'dow', lang);
    const days = [dom !== t.unspecified ? dom : null, dow !== t.unspecified ? dow : null].filter(Boolean)
      .join(parsed.dayMode === 'or' ? ` ${t.or} ` : t.join);
    const date = [describeField(parsed, 'year', lang), describeField(parsed, 'month', lang), days].filter(Boolean).join(t.join);
    // A bare repetition ("every 15 minutes") already implies every day; clock times keep "every day".
    if (!date && !/^\D*\d{2}:\d{2}/.test(time)) return time;
    return [date || t.daily, time].join(t.join);
  }

  (window.KCompute ||= {}).cron = Object.freeze({ parse, next, describe, describeField });
})();
