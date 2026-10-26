/* ── 日期差计算：按本地日历日计算，避免 UTC 偏移 ── */

const _ddDict = {
  zh: {
    title: '日期差计算',
    from: '开始日期',
    to: '结束日期',
    calc: '计算',
    today: '设为今天',
    swap: '⇅ 互换',
    total: '总天数',
    after: '之后',
    before: '之前',
    same_day: '同一天',
    days: n => `${n} 天`,
    weeks_days: (w, d) => `${w} 周 ${d} 天`,
    weeks_label: '周 + 天',
    calendar: '日历间隔',
    ymd: (y, m, d) => `${y} 年 ${m} 个月 ${d} 天`,
    total_months: '整月数',
    months: n => `${n} 个月`,
    workdays: '工作日',
    workdays_note: '含开始与结束日期，排除周六、周日，不含法定节假日与调休',
    workdays_val: n => `${n} 个工作日`,
    invalid: '请选择有效日期',
  },
  en: {
    title: 'Date Difference',
    from: 'Start date',
    to: 'End date',
    calc: 'Calculate',
    today: 'Set to today',
    swap: '⇅ Swap',
    total: 'Total days',
    after: 'later',
    before: 'earlier',
    same_day: 'same day',
    days: n => `${n} day${n === 1 ? '' : 's'}`,
    weeks_days: (w, d) => `${w} wk ${d} d`,
    weeks_label: 'Weeks + days',
    calendar: 'Calendar span',
    ymd: (y, m, d) => `${y} y ${m} mo ${d} d`,
    total_months: 'Whole months',
    months: n => `${n} month${n === 1 ? '' : 's'}`,
    workdays: 'Weekdays',
    workdays_note: 'Includes both dates, excludes Saturdays and Sundays; public holidays are not considered',
    workdays_val: n => `${n} weekday${n === 1 ? '' : 's'}`,
    invalid: 'Choose valid dates',
  },
};

function renderDateDiff(el) {
  const T = makeToolI18n(_ddDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:14px">
        <div><label for="ddFrom" style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('from')}</label><input class="tool-input" id="ddFrom" type="date" oninput="ddCalc()"></div>
        <div><label for="ddTo" style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('to')}</label><input class="tool-input" id="ddTo" type="date" oninput="ddCalc()"></div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="ddCalc()">${T('calc')}</button>
        <button class="btn btn-secondary" onclick="ddSetToday()">${T('today')}</button>
        <button class="btn btn-secondary" onclick="ddSwap()">${T('swap')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="ddResult" style="display:none">
      <div id="ddOutput"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('workdays')}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${T('workdays_note')}</div>
      <div id="ddWorkdays" style="color:var(--neon);font-weight:700;font-size:18px"></div>
    </div>`;
  el._toolOutput=()=>el._dateOutput||'';
  ddSetToday();
}

function ddSetToday() {
  const today = ToolCompute.localDate();
  document.getElementById('ddFrom').value = today;
  document.getElementById('ddTo').value = today;
  ddCalc();
}

function ddSwap() {
  const from = document.getElementById('ddFrom'), to = document.getElementById('ddTo');
  [from.value, to.value] = [to.value, from.value];
  ddCalc();
}

async function ddCalc() {
  const T = makeToolI18n(_ddDict);
  const root=document.getElementById('toolBody'),fromValue=document.getElementById('ddFrom').value,toValue=document.getElementById('ddTo').value;
  const revision=(root._dateRevision||0)+1;root._dateRevision=revision;root._dateOutput='';
  const output=document.getElementById('ddOutput');let data,diff;
  try { const compute=await ToolCompute.load('date'); if(root._dateRevision!==revision||!output.isConnected)return;data=compute.diff(fromValue,toValue);diff=data.calendar;root._dateOutput=JSON.stringify(data,null,2); }
  catch(e){if(!output.isConnected||root._dateRevision!==revision)return;output.textContent=e.message;document.getElementById('ddWorkdays').textContent='';document.getElementById('ddResult').style.display='';return {success:false,error:e.message};}
  const abs = diff.totalDays;
  const direction = abs === 0 ? T('same_day') : diff.sign > 0 ? T('after') : T('before');
  output.innerHTML = [
    [T('total'), `${T('days', abs)} (${direction})`, 'var(--neon)'],
    [T('calendar'), T('ymd', diff.years, diff.months, diff.days), 'var(--accent)'],
    [T('weeks_label'), T('weeks_days', Math.floor(abs / 7), abs % 7), 'var(--text)'],
    [T('total_months'), T('months', diff.totalMonths), 'var(--text)'],
  ].map(([label, value, color]) => `<div style="display:flex;justify-content:space-between;gap:12px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;margin-bottom:8px"><span style="color:var(--text-muted)">${label}</span><span style="font-weight:700;color:${color};text-align:right">${value}</span></div>`).join('');
  document.getElementById('ddResult').style.display = '';
  document.getElementById('ddWorkdays').textContent = T('workdays_val', data.weekdays);
  return {success:true,data};
}
