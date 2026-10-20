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
