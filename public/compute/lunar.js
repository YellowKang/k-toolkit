/* Chinese lunisolar calendar, computed astronomically:
 * new moons — Meeus, Astronomical Algorithms ch. 49; solar longitude — ch. 25 (low accuracy, ≈0.01°).
 * Rules: a month starts on the Beijing civil day of its new moon (UTC+8; local mean time of 116°25′E before 1929);
 * the month containing the winter solstice is month 11; in a 13-month span between consecutive month-11 starts,
 * the first month without a principal term is the leap month. */
(function () {
  const RAD = Math.PI / 180, DAY = 86400000;
  const UTC8_SINCE = Date.UTC(1928, 11, 31, 16); // 1929-01-01 00:00 UTC+8
  const offsetAt = ms => ms < UTC8_SINCE ? (7 * 3600 + 45 * 60 + 40) * 1000 : 8 * 3600000;
  const dayStart = day => day * DAY - offsetAt(day * DAY - 8 * 3600000);
  const STEMS = '甲乙丙丁戊己庚辛壬癸', BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
  const MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  // Index = apparent solar longitude / 15°.
  const TERMS = ['春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
    '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'];

  // ΔT = TT − UT in seconds (Espenak–Meeus fit for 2005–2050, long-term parabola elsewhere; error well under a minute).
  const deltaT = year => year >= 2005 && year <= 2050
    ? 62.92 + 0.32217 * (year - 2000) + 0.005589 * (year - 2000) ** 2
    : -20 + 32 * ((year - 1820) / 100) ** 2;
  const yearOf = ms => 1970 + ms / (365.2425 * DAY);

  function sunLongitude(ms) {
    const T = ((ms + deltaT(yearOf(ms)) * 1000) / DAY + 2440587.5 - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * RAD;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    const omega = (125.04 - 1934.136 * T) * RAD;
    return (((L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) % 360) + 360) % 360;
  }

  /** UTC instant when the apparent solar longitude reaches `angle`, searching near `guessMs`. */
  function termInstant(angle, guessMs) {
    let t = guessMs;
    for (let i = 0; i < 6; i++) {
      const diff = ((angle - sunLongitude(t) + 540) % 360) - 180;
      t += diff / 360 * 365.2422 * DAY;
      if (Math.abs(diff) < 1e-7) break;
    }
    return t;
  }

  const NEW_MOON_TERMS = [ // [coefficient, E power, M, M', F, Ω multipliers]
    [-0.40720, 0, 0, 1, 0, 0], [0.17241, 1, 1, 0, 0, 0], [0.01608, 0, 0, 2, 0, 0], [0.01039, 0, 0, 0, 2, 0],
    [0.00739, 1, -1, 1, 0, 0], [-0.00514, 1, 1, 1, 0, 0], [0.00208, 2, 2, 0, 0, 0], [-0.00111, 0, 0, 1, -2, 0],
    [-0.00057, 0, 0, 1, 2, 0], [0.00056, 1, 1, 2, 0, 0], [-0.00042, 0, 0, 3, 0, 0], [0.00042, 1, 1, 0, 2, 0],
    [0.00038, 1, 1, 0, -2, 0], [-0.00024, 1, -1, 2, 0, 0], [-0.00017, 0, 0, 0, 0, 1], [-0.00007, 0, 2, 1, 0, 0],
    [0.00004, 0, 0, 2, -2, 0], [0.00004, 0, 3, 0, 0, 0], [0.00003, 0, 1, 1, -2, 0], [0.00003, 0, 0, 2, 2, 0],
    [-0.00003, 0, 1, 1, 2, 0], [0.00003, 0, -1, 1, 2, 0], [-0.00002, 0, -1, 1, -2, 0], [-0.00002, 0, 1, 3, 0, 0],
    [0.00002, 0, 0, 4, 0, 0],
  ];
  const PLANETARY = [ // [A0, A per k, coefficient]; A1 also has −0.009173·T²
    [299.77, 0.107408, 0.000325], [251.88, 0.016321, 0.000165], [251.83, 26.651886, 0.000164], [349.42, 36.412478, 0.000126],
    [84.66, 18.206239, 0.000110], [141.74, 53.303771, 0.000062], [207.14, 2.453732, 0.000060], [154.84, 7.306860, 0.000056],
    [34.52, 27.261239, 0.000047], [207.19, 0.121824, 0.000042], [291.34, 1.844379, 0.000040], [161.72, 24.198154, 0.000037],
    [239.56, 25.513099, 0.000035], [331.55, 3.592518, 0.000023],
  ];

  /** UTC instant of new moon number k (k = 0 is 2000-01-06). */
  function newMoon(k) {
    const T = k / 1236.85;
    let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.000000150 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = (2.5534 + 29.10535670 * k - 0.0000014 * T * T - 0.00000011 * T ** 3) * RAD;
    const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4) * RAD;
    const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4) * RAD;
    const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3) * RAD;
    for (const [c, e, m, mp, f, o] of NEW_MOON_TERMS) jde += c * E ** e * Math.sin(m * M + mp * Mp + f * F + o * O);
    PLANETARY.forEach(([a0, a1, c], i) => { jde += c * Math.sin((a0 + a1 * k - (i === 0 ? 0.009173 * T * T : 0)) * RAD); });
    const ms = (jde - 2440587.5) * DAY;
    return ms - deltaT(yearOf(ms)) * 1000;
  }

  const beijingDay = ms => Math.floor((ms + offsetAt(ms)) / DAY);
  const dayOf = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY;
  const dateOf = day => { const d = new Date(day * DAY); const r = new Date(2000, 0, 1); r.setFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); return r; };

  const moonDays = new Map();
  const newMoonDay = k => { if (!moonDays.has(k)) moonDays.set(k, beijingDay(newMoon(k))); return moonDays.get(k); };
  /** Lunation number whose new-moon day is the latest on or before `day`. */
  function lunationOnOrBefore(day) {
    let k = Math.floor((day * DAY - Date.UTC(2000, 0, 6, 18, 14)) / (29.530588861 * DAY));
    while (newMoonDay(k + 1) <= day) k++;
    while (newMoonDay(k) > day) k--;
    return k;
  }

  const solsticeDay = year => beijingDay(termInstant(270, Date.UTC(year, 11, 21)));
  const hasPrincipalTerm = (start, end) => { // [start, end) in Beijing days
    const from = sunLongitude(dayStart(start)), to = sunLongitude(dayStart(end));
    return Math.floor(from / 30) !== Math.floor(((to - from + 360) % 360 + from) / 30);
  };

  // Months from the month-11 that contains the winter solstice of `year` up to the next one.
  const suiCache = new Map();
  function sui(year) {
    if (suiCache.has(year)) return suiCache.get(year);
    const first = lunationOnOrBefore(solsticeDay(year)), next = lunationOnOrBefore(solsticeDay(year + 1));
    const count = next - first, months = [];
    let leapFound = count !== 13, number = 11, lunarYear = year;
    for (let k = first; k < next; k++) {
      const start = newMoonDay(k), end = newMoonDay(k + 1);
      let leap = false;
      if (k > first) {
        if (!leapFound && !hasPrincipalTerm(start, end)) { leap = true; leapFound = true; }
        else { number = number % 12 + 1; if (number === 1) lunarYear = year + 1; }
      }
      months.push({ year: lunarYear, month: number, leap, start, days: end - start });
    }
    suiCache.set(year, months);
    return months;
  }

  function cycleName(index) {
    const i = ((index % 60) + 60) % 60;
    return STEMS[i % 10] + BRANCHES[i % 12];
  }

  function dayName(day) {
    if (day === 10) return '初十';
    if (day === 20) return '二十';
    if (day === 30) return '三十';
    return ['初', '十', '廿'][Math.floor(day / 10)] + '一二三四五六七八九'[day % 10 - 1];
  }

  function describe(m, day) {
    return { year: m.year, month: m.month, leap: m.leap, day, monthDays: m.days,
      yearName: cycleName(m.year - 4), animalIndex: (((m.year - 4) % 12) + 12) % 12,
      monthName: (m.leap ? '闰' : '') + MONTHS[m.month - 1] + '月', dayName: dayName(day) };
  }

  /** Lunar date of a local calendar date (interpreted as a Beijing civil day). */
  function solarToLunar(date) {
    const day = dayOf(date);
    for (const year of [date.getFullYear() - 1, date.getFullYear()]) {
      const m = sui(year).find(x => day >= x.start && day < x.start + x.days);
      if (m) return describe(m, day - m.start + 1);
    }
    return null;
  }

  /** Gregorian date for a lunar date, or null when that month/day does not exist. */
  function lunarToSolar(year, month, day, leap = false) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
    for (const s of [year - 1, year]) {
      const m = sui(s).find(x => x.year === year && x.month === month && x.leap === !!leap);
      if (m) return day >= 1 && day <= m.days ? dateOf(m.start + day - 1) : null;
    }
    return null;
  }

  /** Solar term that begins on the given Beijing civil day, or ''. */
  function solarTerm(date) {
    const day = dayOf(date);
    const a = Math.floor(sunLongitude(dayStart(day)) / 15), b = Math.floor(sunLongitude(dayStart(day + 1)) / 15);
    return a === b ? '' : TERMS[b];
  }

  function nextSolarTerm(date) {
    for (let i = 1; i <= 20; i++) {
      const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() + i);
      const name = solarTerm(day);
      if (name) return { name, date: day, days: i };
    }
    return null;
  }

  /** Day stem-branch; 1949-10-01 was a 甲子 day. */
  const dayCycle = date => cycleName(dayOf(date) - Date.UTC(1949, 9, 1) / DAY);

  (window.KCompute ||= {}).lunar = Object.freeze({ solarToLunar, lunarToSolar, solarTerm, nextSolarTerm, dayCycle, dayName,
    cycleName, newMoon, sunLongitude, monthNames: MONTHS });
})();
