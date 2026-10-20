/* ── 年龄 / 生日计算：本地日历日；生肖按农历年（春节）划分 ── */

const _ageDict = {
  zh: {
    title: '年龄 / 生日计算器',
    birth: '出生日期',
    calc: '计算',
    exact: '精确年龄',
    exact_val: (y, m, d) => `${y}岁 ${m}个月 ${d}天`,
    next: '距下次生日',
    next_val: n => n === 0 ? '🎂 今天生日' : `${n} 天`,
    lived: '已活天数',
    lived_val: n => `${n.toLocaleString()} 天`,
    zodiac: '生肖',
    zodiac_note: '按农历年（春节）划分',
    sign: '星座',
    future: '出生日期不能晚于今天',
    invalid: '请选择有效日期',
    animals: ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'],
    signs: ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'],
  },
  en: {
    title: 'Age / Birthday Calculator',
    birth: 'Date of birth',
    calc: 'Calculate',
    exact: 'Exact age',
    exact_val: (y, m, d) => `${y} y ${m} mo ${d} d`,
    next: 'Next birthday',
    next_val: n => n === 0 ? '🎂 Today' : `in ${n} day${n === 1 ? '' : 's'}`,
    lived: 'Days lived',
    lived_val: n => n.toLocaleString('en'),
    zodiac: 'Chinese zodiac',
    zodiac_note: 'By lunar year (Spring Festival)',
    sign: 'Star sign',
    future: 'Birth date cannot be in the future',
    invalid: 'Choose a valid date',
    animals: ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'],
    signs: ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'],
  },
};

/** Index into a Capricorn-first sign list from a 1-based month and day. */
function ageSignIndex(month, day) {
  const starts = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]; // first day of the sign that begins in each month
  return day >= starts[month - 1] ? month % 12 : month - 1;
}

window.renderAgeCalc = function(el) {
  const T = makeToolI18n(_ageDict);
  const today = new Date();
  const defDate = ToolCompute.localDate(new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()));
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
        <div style="flex:1;min-width:180px">
          <label for="ageDate" style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('birth')}</label>
          <input class="tool-input" id="ageDate" type="date" value="${defDate}" max="${ToolCompute.localDate()}" oninput="doAgeCalc()">
        </div>
        <div class="tool-actions" style="margin:0">
          <button class="btn btn-primary" onclick="doAgeCalc()">${T('calc')}</button>
        </div>
      </div>
      <div id="ageError" style="display:none;margin-top:10px;font-size:13px;color:#ef4444"></div>
    </div>
    <div class="tool-card-panel" id="ageResult" style="display:none">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px" id="ageCards"></div>
    </div>`;
  doAgeCalc();
};

async function doAgeCalc() {
  const T = makeToolI18n(_ageDict);
  const birth = ToolCompute.parseLocalDate(document.getElementById('ageDate').value);
  const error = document.getElementById('ageError'), result = document.getElementById('ageResult');
  const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!birth || birth > today) {
    error.textContent = birth ? T('future') : T('invalid');
    error.style.display = ''; result.style.display = 'none';
    return;
  }
  error.style.display = 'none';
  const age = ToolCompute.calendarDiff(birth, today);
  const nextAge = age.years + 1;
  const nextBirthday = ToolCompute.addMonths(birth, nextAge * 12);
  const daysToBirthday = age.months === 0 && age.days === 0 ? 0 : ToolCompute.calendarDiff(today, nextBirthday).totalDays;
  let lunarYear = null;
  try { lunarYear = (await ToolCompute.load('lunar')).solarToLunar(birth)?.year ?? null; } catch {}
  const animal = T('animals')[(((lunarYear ?? birth.getFullYear()) - 4) % 12 + 12) % 12];
  const cards = [
    { label: T('exact'), val: T('exact_val', age.years, age.months, age.days) },
    { label: T('next'), val: T('next_val', daysToBirthday) },
    { label: T('lived'), val: T('lived_val', age.totalDays) },
    { label: T('zodiac'), val: animal, note: lunarYear ? T('zodiac_note') : '' },
    { label: T('sign'), val: T('signs')[ageSignIndex(birth.getMonth() + 1, birth.getDate())] },
  ];
  document.getElementById('ageCards').innerHTML = cards.map(c => `
    <div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:12px;padding:16px;text-align:center">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${c.label}</div>
      <div style="font-size:18px;font-weight:700;color:var(--text)">${c.val}</div>
      ${c.note ? `<div style="font-size:10px;color:var(--text-muted);margin-top:4px">${c.note}</div>` : ''}
    </div>`).join('');
  result.style.display = '';
}
