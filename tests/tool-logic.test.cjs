const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PUB = path.resolve(__dirname, '..', 'public');
/** Load classic page scripts into one isolated global (window === globalThis), like the browser does. */
function load(...files) {
  const context = vm.createContext({ console });
  context.window = context;
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(PUB, file), 'utf8'), context, { filename: file });
  return context;
}
const local = (y, m, d) => new Date(y, m - 1, d);
// Values created inside the vm realm compare structurally only after crossing back.
const plain = value => JSON.parse(JSON.stringify(value));
const ymd = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

test('financial uppercase follows the payment settlement writing rules', () => {
  const { numToChinese, numToSmallChinese, ncParseAmount } = load('tools/number-chinese.js');
  const cases = {
    '0': '零元整', '0.05': '伍分', '0.5': '伍角', '10': '壹拾元整', '1001': '壹仟零壹元整', '10010': '壹万零壹拾元整',
    '100010': '壹拾万零壹拾元整', '100000000': '壹亿元整', '100000001': '壹亿零壹元整', '110000000': '壹亿壹仟万元整',
    '1409.50': '壹仟肆佰零玖元伍角', '6007.14': '陆仟零柒元壹角肆分', '16409.02': '壹万陆仟肆佰零玖元零贰分',
    '325.04': '叁佰贰拾伍元零肆分', '¥1,000,000': '壹佰万元整', '1000000000000': '壹万亿元整', '100010000000000': '壹佰万零壹佰亿元整',
    '1.996': '贰元整', '-3.2': '负叁元贰角', '123456789.12': '壹亿贰仟叁佰肆拾伍万陆仟柒佰捌拾玖元壹角贰分',
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(numToChinese(input), expected, input);
  assert.equal(numToSmallChinese('12.3'), '十二元三角');
  assert.equal(numToSmallChinese('100012'), '十万零一十二元整');
  assert.throws(() => numToChinese('10000000000000000'), /too-large/);
  assert.equal(ncParseAmount('abc'), null);
  assert.equal(ncParseAmount('1.005').cents, 101n);
});

test('calendar helpers use local days, clamp month ends and count weekdays inclusively', () => {
  const { ToolCompute: C } = load('tool-compute.js');
  assert.equal(ymd(C.parseLocalDate('2024-02-29')), '2024-02-29');
  assert.equal(C.parseLocalDate('2023-02-29'), null);
  assert.equal(C.localDate(local(2026, 1, 5)), '2026-01-05');
  assert.deepEqual({ ...C.calendarDiff(local(2024, 1, 31), local(2024, 3, 1)) }, { sign: 1, years: 0, months: 1, days: 1, totalMonths: 1, totalDays: 30 });
  const back = C.calendarDiff(local(2026, 10, 20), local(2000, 2, 29));
  assert.equal(back.sign, -1); assert.equal(back.years, 26); assert.equal(back.totalDays, 9730);
  assert.equal(C.weekdaysBetween(local(2024, 1, 1), local(2024, 1, 5)), 5); // Mon–Fri
  assert.equal(C.weekdaysBetween(local(2024, 1, 6), local(2024, 1, 7)), 0); // weekend
  assert.equal(C.weekdaysBetween(local(1969, 12, 29), local(1970, 1, 4)), 5); // before the epoch
  assert.equal(C.weekdaysBetween(local(2024, 1, 31), local(2024, 1, 1)), 23);
});

test('lunar calendar matches published new years, leap months and solar terms', () => {
  const { KCompute: { lunar } } = load('compute/lunar.js');
  const springs = { 2020: '2020-01-25', 2023: '2023-01-22', 2024: '2024-02-10', 2025: '2025-01-29', 2026: '2026-02-17', 2027: '2027-02-06', 2030: '2030-02-03', 2034: '2034-02-19' };
  for (const [year, date] of Object.entries(springs)) assert.equal(ymd(lunar.lunarToSolar(+year, 1, 1)), date, `spring festival ${year}`);
  // Leap months: 2020 闰四月, 2023 闰二月, 2025 闰六月, 1987 闰六月, 2033 闰十一月 (the "2033 problem").
  for (const [y, m, d, month] of [[2020, 5, 23, 4], [2023, 3, 22, 2], [2025, 7, 25, 6], [1987, 7, 26, 6], [2033, 12, 22, 11]]) {
    const info = lunar.solarToLunar(local(y, m, d));
    assert.deepEqual([info.month, info.leap, info.day], [month, true, 1], `${y} leap month`);
  }
  const today = lunar.solarToLunar(local(2026, 10, 20));
  assert.equal(`${today.yearName}年 ${today.monthName}${today.dayName}`, '丙午年 九月十一');
  assert.equal(lunar.lunarToSolar(2024, 6, 1, true), null);
  assert.equal(lunar.lunarToSolar(2025, 6, 30, true), null); // 闰六月 has 29 days
  const terms = [];
  for (let d = local(2025, 1, 1); d.getFullYear() === 2025; d.setDate(d.getDate() + 1)) if (lunar.solarTerm(d)) terms.push(ymd(d).slice(5) + lunar.solarTerm(d));
  assert.deepEqual(terms, ['01-05小寒', '01-20大寒', '02-03立春', '02-18雨水', '03-05惊蛰', '03-20春分', '04-04清明', '04-20谷雨',
    '05-05立夏', '05-21小满', '06-05芒种', '06-21夏至', '07-07小暑', '07-22大暑', '08-07立秋', '08-23处暑', '09-07白露', '09-23秋分',
    '10-08寒露', '10-23霜降', '11-07立冬', '11-22小雪', '12-07大雪', '12-21冬至']);
  assert.equal(lunar.dayCycle(local(2000, 1, 1)), '戊午');
  assert.equal(lunar.dayCycle(local(2024, 2, 10)), '甲辰');
});

test('star signs use 1-based months and Chinese sign boundaries', () => {
  const { ageSignIndex } = load('tool-compute.js', 'tools/age-calc.js');
  const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
  const at = (m, d) => signs[ageSignIndex(m, d)];
  assert.equal(at(1, 19), '摩羯座'); assert.equal(at(1, 20), '水瓶座'); assert.equal(at(6, 21), '双子座');
  assert.equal(at(6, 22), '巨蟹座'); assert.equal(at(10, 20), '天秤座'); assert.equal(at(12, 22), '摩羯座');
});

test('semver precedence follows the specification', () => {
  const { _svCmp, _svParse } = load('tools/semver.js');
  const chain = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0', '1.0.1', '1.10.0', '2.0.0'];
  for (let i = 1; i < chain.length; i++) assert.equal(_svCmp(chain[i - 1], chain[i]), -1, `${chain[i - 1]} < ${chain[i]}`);
  assert.equal(_svCmp('v1.2.3', '1.2.3+build.5'), 0);
  for (const bad of ['01.2.3', '1.2', '1.2.3-', '1.2.3-01', '1.2.3_beta']) assert.equal(_svParse(bad), null, bad);
  assert.equal(_svParse('1.2.3-x-y.7+sha.5114f85').pre, 'x-y.7');
});

test('cron supports Linux, Spring and Quartz syntax with correct day semantics', () => {
  const { KCompute: { cron } } = load('compute/cron.js');
  const from = new Date(2026, 9, 20, 20, 53, 10); // Tue 2026-10-20 20:53:10
  const runs = (expr, n = 3, dialect) => plain(cron.next(cron.parse(expr, dialect), from, n).map(d => `${ymd(d)} ${d.toTimeString().slice(0, 8)}`));
  assert.deepEqual(runs('*/15 * * * *'), ['2026-10-20 21:00:00', '2026-10-20 21:15:00', '2026-10-20 21:30:00']);
  assert.deepEqual(runs('0 0 1 1 *'), ['2027-01-01 00:00:00', '2028-01-01 00:00:00', '2029-01-01 00:00:00']); // yearly works
  assert.deepEqual(runs('0 0 1 * 1'), ['2026-10-26 00:00:00', '2026-11-01 00:00:00', '2026-11-02 00:00:00']); // Vixie OR
  assert.deepEqual(runs('0 0 * * 7', 1), ['2026-10-25 00:00:00']); // 7 = Sunday
  assert.deepEqual(runs('0 0 1-30/10 * *'), ['2026-10-21 00:00:00', '2026-11-01 00:00:00', '2026-11-11 00:00:00']);
  assert.deepEqual(runs('*/5 * * * * *', 2), ['2026-10-20 20:53:15', '2026-10-20 20:53:20']); // Spring seconds
  assert.deepEqual(runs('0 0 12 ? * 6L', 2, 'quartz'), ['2026-10-30 12:00:00', '2026-11-27 12:00:00']); // last Friday
  assert.deepEqual(runs('0 0 9 ? * MON#2', 1, 'quartz'), ['2026-11-09 09:00:00']);
  assert.deepEqual(runs('0 30 9 15W * ?', 1, 'quartz'), ['2026-11-16 09:30:00']); // Nov 15 is a Sunday
  assert.deepEqual(runs('0 0 10 LW * ?', 2, 'quartz'), ['2026-10-30 10:00:00', '2026-11-30 10:00:00']);
  assert.deepEqual(runs('0 0 30 2 *'), []);
  assert.equal(cron.describe(cron.parse('0 9 * * 1-5'), 'zh'), '周一至周五 · 09:00');
  assert.equal(cron.describe(cron.parse('*/15 * * * *'), 'en'), 'every 15 minutes');
  for (const [expr, code] of [['99 * * * *', 'range'], ['0 9 * *', 'count'], ['0 0 12 1 * 1', 'quartz-both'], ['0 0 L * *', 'quartz-ext'], ['? * * * *', 'question'], ['*/0 * * * *', 'step']]) {
    const parsed = cron.parse(expr, expr === '0 0 12 1 * 1' ? 'quartz' : 'auto');
    assert.equal(parsed.ok, false, expr); assert.equal(parsed.code, code, expr);
  }
});

test('CSV parsing and writing round-trip quotes, newlines, BOM and delimiters', () => {
  const { KCompute: { csv } } = load('compute/csv.js');
  const parsed = csv.parse('﻿name;note\r\n"Bob; Jr.";"line1\nline2"\r\nAnn;"say ""hi"""\r\n');
  assert.equal(parsed.delimiter, ';');
  assert.deepEqual(plain(parsed.rows), [['name', 'note'], ['Bob; Jr.', 'line1\nline2'], ['Ann', 'say "hi"']]);
  assert.throws(() => csv.parse('a,"b\nc'), /Unterminated/);
  const objects = csv.toObjects(csv.parse('id,id,,flag\n1,2,3,true\n007,x').rows, { infer: true });
  assert.deepEqual(plain(objects), [{ id: 1, id_2: 2, column3: 3, flag: true }, { id: '007', id_2: 'x', column3: '', flag: '' }]);
  const text = csv.stringify([{ a: 'x,y', b: { c: 1, d: [1, 2] } }, { a: ' pad', e: null }]);
  assert.equal(text, 'a,b.c,b.d,e\n"x,y",1,"[1,2]",\n" pad",,,');
  assert.equal(csv.stringify([{ b: { c: 1 } }], { flat: false }), 'b\n"{""c"":1}"');
});

test('number base conversion is exact beyond 2^53 and rejects stray characters', () => {
  const { nbParse, nbFormat } = load('tools/number-base.js');
  const max = nbParse('0xFFFF_FFFF_FFFF_FFFF', 'hex').value;
  assert.equal(nbFormat(max, 10), '18446744073709551615');
  assert.equal(nbFormat(nbParse('-255', 'dec').value, 16), '-FF');
  assert.equal(nbParse('12a', 'dec').error, 'a');
  assert.equal(nbParse('102', 'bin').error, '2');
  assert.ok(nbParse('  ', 'oct').empty);
});

test('salary tax uses cumulative withholding and the separate bonus table', () => {
  const { taxSchedule, taxBonus, taxAnnual } = load('tools/tax-calc.js');
  const plan = taxSchedule({ salary: 20000, insurance: 3000, extra: 2000 });
  assert.equal(plan.annualTax, 9480);
  assert.deepEqual(plain(plan.months.slice(0, 4).map(m => m.tax)), [300, 300, 300, 580]);
  assert.equal(plan.months.reduce((s, m) => s + m.tax, 0), 9480);
  assert.equal(taxSchedule({ salary: 4000 }).annualTax, 0);
  assert.equal(taxBonus(50000), 4790);
  assert.equal(taxBonus(36000), 1080);
  assert.equal(taxAnnual(960001), _round(960001 * 0.45 - 181920));
  function _round(v) { return Math.round(v * 100) / 100; }
});

test('subnet math validates octets and labels special-purpose ranges', () => {
  const { ipParse, ipSubnet, ipTypes, numToIp } = load('tools/ip-calc.js');
  assert.equal(ipParse('999.1.1.1'), null);
  assert.equal(ipParse('192.168.1.256'), null);
  const s = ipSubnet(ipParse('192.168.1.100'), 26);
  assert.deepEqual([numToIp(s.network), numToIp(s.broadcast), numToIp(s.mask), numToIp(s.wildcard), s.hosts], ['192.168.1.64', '192.168.1.127', '255.255.255.192', '0.0.0.63', 62]);
  assert.equal(ipSubnet(ipParse('10.0.0.1'), 31).hosts, 2);
  assert.deepEqual(plain(ipTypes(ipParse('100.70.1.1'))), ['cgnat']);
  assert.deepEqual(plain(ipTypes(ipParse('8.8.8.8'))), ['public']);
  assert.deepEqual(plain(ipTypes(ipParse('203.0.113.9'))), ['doc']);
});

test('unit conversions use exact definitions without floating-point noise', () => {
  const { ucConvertValue: c } = load('tools/unit-convert.js');
  assert.equal(c('speed', 1, 'mps', 'kmh'), 3.6);
  assert.equal(c('speed', 100, 'kmh', 'mps'), 27.7777777778);
  assert.equal(c('length', 1, 'mi', 'km'), 1.609344);
  assert.equal(c('length', 3, 'chi', 'm'), 1);
  assert.equal(c('area', 1, 'mu', 'm2'), 666.666666667);
  assert.equal(c('area', 1000, 'ft2', 'm2'), 92.90304);
  assert.equal(c('mass', 1, 'lb', 'g'), 453.59237);
  assert.equal(c('temperature', 100, 'c', 'f'), 212);
  assert.equal(c('temperature', -40, 'f', 'c'), -40);
  assert.equal(c('volume', 1, 'usgal', 'l'), 3.785411784);
  assert.equal(c('time', 1, 'wk', 'h'), 168);
});
