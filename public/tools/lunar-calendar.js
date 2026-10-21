/* ── 农历 / 阳历转换：天文算法见 compute/lunar.js（新月、节气、闰月规则） ── */

const _lcDict = {
  zh: {
    title: '公历 → 农历',
    date: '选择日期',
    query: '查询',
    today: '今天',
    solar: '公历',
    lunar: '农历',
    ganzhi: '干支年 · 生肖',
    day_gz: '日干支',
    term: '节气',
    no_term: '非节气日',
    next_term: '下一个节气',
    next_term_val: (name, date, n) => `${name} · ${date}（${n} 天后）`,
    month_len: n => n === 30 ? '大月（30 天）' : '小月（29 天）',
    month_len_label: '本月',
    day_of_year: '本年第',
    day_of_year_val: n => `${n} 天`,
    to_new_year: '距元旦',
    to_new_year_val: n => `${n} 天`,
    reverse_title: '农历 → 公历',
    lunar_year: '农历年',
    lunar_month: '月',
    lunar_day: '日',
    leap: '闰月',
    convert: '转换',
    reverse_result: (date, week) => `公历 ${date} 星期${week}`,
    reverse_missing: '该农历日期不存在（检查闰月或小月三十）',
    load_fail: '农历算法加载失败，请刷新重试',
    invalid: '请选择有效日期',
    range: '支持 1901–2099 年',
    note: '农历以北京时间（1929 年前为北京地方平时）的朔日为月首，冬至所在月为十一月，按无中气置闰；节气按太阳视黄经计算，交节时刻贴近午夜时个别日期可能相差 1 天。',
    weekdays: '日一二三四五六',
  },
  en: {
    title: 'Gregorian → Lunar',
    date: 'Date',
    query: 'Look up',
    today: 'Today',
    solar: 'Gregorian',
    lunar: 'Chinese lunar date',
    ganzhi: 'Stem-branch year · zodiac',
    day_gz: 'Day stem-branch',
    term: 'Solar term',
    no_term: 'None today',
    next_term: 'Next solar term',
    next_term_val: (name, date, n) => `${name} · ${date} (in ${n} day${n === 1 ? '' : 's'})`,
    month_len: n => `${n}-day month`,
    month_len_label: 'This month',
    day_of_year: 'Day of year',
    day_of_year_val: n => `#${n}`,
    to_new_year: 'Until Jan 1',
    to_new_year_val: n => `${n} day${n === 1 ? '' : 's'}`,
    reverse_title: 'Lunar → Gregorian',
    lunar_year: 'Lunar year',
    lunar_month: 'Month',
    lunar_day: 'Day',
    leap: 'Leap month',
    convert: 'Convert',
    reverse_result: (date, week) => `Gregorian ${date} (${week})`,
    reverse_missing: 'That lunar date does not exist (check the leap month or a 29-day month)',
    load_fail: 'Failed to load the lunar calendar module; refresh and try again',
    invalid: 'Choose a valid date',
    range: 'Supports 1901–2099',
    note: 'Months begin on the Beijing day of the new moon (local mean time before 1929), the month with the winter solstice is month 11, and leap months follow the no-principal-term rule. Solar terms use the apparent solar longitude; a term starting near midnight may be off by one day.',
    weekdays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  },
};

// Lunar dates, stem-branch names and solar terms are Chinese data in either interface language.
const _lcZh = text => `<span lang="zh">${text}</span>`;
const _LC_ANIMALS = { zh: '鼠牛虎兔龙蛇马羊猴鸡狗猪'.split(''), en: ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'] };

window.renderLunarCalendar = function(el) {
  const T = makeToolI18n(_lcDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <label for="lcDate" style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('date')}</label>
          <input class="tool-input" id="lcDate" type="date" min="1901-02-19" max="2099-12-31" value="${ToolCompute.localDate()}" oninput="doLunar()">
        </div>
        <button class="btn btn-primary" onclick="doLunar()">${T('query')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('lcDate').value=ToolCompute.localDate();doLunar()">${T('today')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="lcResult" style="display:none">
      <div id="lcCards"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('reverse_title')}</div>
      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <label style="font-size:12px;color:var(--text-muted)">${T('lunar_year')}<input class="tool-input" id="lcRevYear" type="number" min="1901" max="2099" value="${new Date().getFullYear()}" style="width:110px;margin-top:6px"></label>
        <label style="font-size:12px;color:var(--text-muted)">${T('lunar_month')}<select class="tool-input" id="lcRevMonth" lang="zh" style="width:100px;margin-top:6px"></select></label>
        <label style="font-size:12px;color:var(--text-muted)">${T('lunar_day')}<select class="tool-input" id="lcRevDay" lang="zh" style="width:100px;margin-top:6px"></select></label>
        <label style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;padding-bottom:10px"><input type="checkbox" id="lcRevLeap">${T('leap')}</label>
        <button class="btn btn-primary" onclick="doLunarReverse()">${T('convert')}</button>
      </div>
      <div id="lcRevResult" style="margin-top:12px;font-size:14px;font-weight:600"></div>
      <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">${T('range')}</div>
    </div>
    <div class="tool-card-panel" style="font-size:12px;color:var(--text-muted);line-height:1.6">${T('note')}</div>`;
  ToolCompute.load('lunar').then(lunar => {
    const now = lunar.solarToLunar(new Date());
    const num = i => getCurrentLang() === 'en' ? `${i + 1} · ` : ''; // English readers get the month/day number too
    document.getElementById('lcRevMonth').innerHTML = lunar.monthNames.map((m, i) => `<option value="${i + 1}"${now?.month === i + 1 ? ' selected' : ''}>${num(i)}${m}月</option>`).join('');
    document.getElementById('lcRevDay').innerHTML = Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}"${now?.day === i + 1 ? ' selected' : ''}>${num(i)}${lunar.dayName(i + 1)}</option>`).join('');
    if (now) { document.getElementById('lcRevYear').value = now.year; document.getElementById('lcRevLeap').checked = now.leap; }
  }).catch(() => {});
  doLunar();
};

async function doLunar() {
  const T = makeToolI18n(_lcDict);
  const lang = typeof getCurrentLang === 'function' ? getCurrentLang() : 'zh';
  const cardsEl = document.getElementById('lcCards');
  document.getElementById('lcResult').style.display = '';
  const d = ToolCompute.parseLocalDate(document.getElementById('lcDate').value);
  if (!d || d.getFullYear() < 1901 || d.getFullYear() > 2099) { cardsEl.innerHTML = `<div style="color:#ef4444;font-size:13px">${T(d ? 'range' : 'invalid')}</div>`; return; }
  let lunar;
  try { lunar = await ToolCompute.load('lunar'); }
  catch { cardsEl.innerHTML = `<div style="color:#ef4444;font-size:13px">${T('load_fail')}</div>`; return; }
  const info = lunar.solarToLunar(d);
  const y = d.getFullYear(), week = T('weekdays')[d.getDay()];
  const next = lunar.nextSolarTerm(d);
  const cards = [
    { label: T('solar'), val: lang === 'en' ? `${ToolCompute.localDate(d)} (${week})` : `${y}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}` },
    { label: T('lunar'), val: _lcZh(`${info.yearName}年 ${info.monthName}${info.dayName}`) },
    { label: T('ganzhi'), val: `${_lcZh(info.yearName)} · ${(_LC_ANIMALS[lang] || _LC_ANIMALS.zh)[info.animalIndex]}` },
    { label: T('day_gz'), val: _lcZh(lunar.dayCycle(d) + (lang === 'en' ? '' : '日')) },
    { label: T('month_len_label'), val: T('month_len', info.monthDays) },
    { label: T('term'), val: lunar.solarTerm(d) ? _lcZh(lunar.solarTerm(d)) : T('no_term') },
    { label: T('next_term'), val: next ? T('next_term_val', _lcZh(next.name), ToolCompute.localDate(next.date), next.days) : '—' },
    { label: T('day_of_year'), val: T('day_of_year_val', ToolCompute.calendarDiff(new Date(y, 0, 1), d).totalDays + 1) },
    { label: T('to_new_year'), val: T('to_new_year_val', ToolCompute.calendarDiff(d, new Date(y + 1, 0, 1)).totalDays) },
  ];
  cardsEl.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">' +
    cards.map(c => `<div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${c.label}</div><div style="font-size:15px;font-weight:600;color:var(--text)">${c.val}</div></div>`).join('') + '</div>';
}

async function doLunarReverse() {
  const T = makeToolI18n(_lcDict);
  const out = document.getElementById('lcRevResult');
  const year = parseInt(document.getElementById('lcRevYear').value, 10);
  const month = +document.getElementById('lcRevMonth').value, day = +document.getElementById('lcRevDay').value;
  let date = null;
  try {
    const lunar = await ToolCompute.load('lunar');
    if (year >= 1901 && year <= 2099) date = lunar.lunarToSolar(year, month, day, document.getElementById('lcRevLeap').checked);
  } catch { out.style.color = '#ef4444'; out.textContent = T('load_fail'); return; }
  out.style.color = date ? 'var(--neon)' : '#ef4444';
  out.textContent = date ? T('reverse_result', ToolCompute.localDate(date), T('weekdays')[date.getDay()]) : T(year >= 1901 && year <= 2099 ? 'reverse_missing' : 'range');
}
