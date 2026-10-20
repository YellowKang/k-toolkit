/* ── 个人所得税（工资薪金，累计预扣法）+ 全年一次性奖金单独计税 ── */

const _taxDict = {
  zh: {
    title: '个人所得税计算器（工资薪金）',
    salary: '税前月薪（元）', salary_ph: '例如 20000',
    insurance: '个人五险一金（元/月）', insurance_ph: '例如 3000',
    extra: '专项附加扣除（元/月）', extra_ph: '子女教育/房贷利息/赡养老人等',
    bonus: '全年一次性奖金（元，可选）', bonus_ph: '单独计税',
    demo: '示例',
    gross: '税前月薪', ins: '五险一金', taxable: '月应纳税所得额', avg_tax: '月均个税', net_avg: '月均到手', rate: '综合税负',
    annual_tax: '全年个税', annual_net: '全年到手（不含奖金）',
    bonus_tax: '奖金个税（单独计税）', bonus_net: '奖金到手',
    month: '月份', month_tax: '当月预扣个税', month_net: '当月到手', month_n: n => `${n} 月`,
    schedule: '按月预扣明细（累计预扣法：税率随累计收入升档，下半年扣税更多属正常）',
    note: '起征点 5000 元/月，适用 2019 年起综合所得税率表；按全年工资不变估算，未考虑公积金/社保基数上限、跨单位就业与年度汇算。奖金单独计税政策执行至 2027 年底。',
  },
  en: {
    title: 'China Individual Income Tax (salary)',
    salary: 'Monthly gross salary (CNY)', salary_ph: 'e.g. 20000',
    insurance: 'Social insurance & housing fund (CNY/month)', insurance_ph: 'e.g. 3000',
    extra: 'Special additional deductions (CNY/month)', extra_ph: 'Children, mortgage interest, elderly care…',
    bonus: 'Annual one-off bonus (CNY, optional)', bonus_ph: 'Taxed separately',
    demo: 'Sample',
    gross: 'Gross salary', ins: 'Insurance', taxable: 'Monthly taxable income', avg_tax: 'Average monthly tax', net_avg: 'Average take-home', rate: 'Effective rate',
    annual_tax: 'Annual tax', annual_net: 'Annual take-home (excl. bonus)',
    bonus_tax: 'Bonus tax (separate)', bonus_net: 'Bonus take-home',
    month: 'Month', month_tax: 'Withholding', month_net: 'Take-home', month_n: n => `M${n}`,
    schedule: 'Monthly withholding (cumulative method: later months may reach higher brackets)',
    note: 'Standard deduction CNY 5,000/month with the comprehensive-income brackets in force since 2019; assumes a constant salary all year and ignores contribution caps, multiple employers and annual reconciliation. Separate bonus taxation applies until the end of 2027.',
  },
};

// Annual comprehensive income: [upper bound, rate, quick deduction].
const _TAX_ANNUAL = [[36000, 0.03, 0], [144000, 0.10, 2520], [300000, 0.20, 16920], [420000, 0.25, 31920], [660000, 0.30, 52920], [960000, 0.35, 85920], [Infinity, 0.45, 181920]];
// One-off bonus taxed separately: brackets apply to bonus / 12.
const _TAX_BONUS = [[3000, 0.03, 0], [12000, 0.10, 210], [25000, 0.20, 1410], [35000, 0.25, 2660], [55000, 0.30, 4410], [80000, 0.35, 7160], [Infinity, 0.45, 15160]];
const _taxRound = v => Math.round(v * 100) / 100;

function taxAnnual(taxable) {
  if (taxable <= 0) return 0;
  const [, rate, deduction] = _TAX_ANNUAL.find(([limit]) => taxable <= limit);
  return _taxRound(taxable * rate - deduction);
}

/** Monthly withholding under the cumulative method for a constant monthly salary. */
function taxSchedule({ salary, insurance = 0, extra = 0 }) {
  const monthlyTaxable = salary - insurance - extra - 5000;
  const months = [];
  let paid = 0;
  for (let m = 1; m <= 12; m++) {
    const cumulative = taxAnnual(Math.max(0, monthlyTaxable * m));
    const tax = _taxRound(Math.max(0, cumulative - paid));
    paid = _taxRound(paid + tax);
    months.push({ month: m, tax, net: _taxRound(salary - insurance - tax) });
  }
  return { monthlyTaxable: Math.max(0, monthlyTaxable), months, annualTax: paid };
}

function taxBonus(bonus) {
  if (!(bonus > 0)) return 0;
  const [, rate, deduction] = _TAX_BONUS.find(([limit]) => bonus / 12 <= limit);
  return _taxRound(Math.max(0, bonus * rate - deduction));
}

window.renderTaxCalc = function(el) {
  const T = makeToolI18n(_taxDict);
  const field = (id, label, ph) => `<div><label for="${id}" style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${label}</label><input class="tool-input" id="${id}" type="number" min="0" placeholder="${ph}" oninput="doTaxCalc()"></div>`;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:12px">
        ${field('taxSalary', T('salary'), T('salary_ph'))}
        ${field('taxIns', T('insurance'), T('insurance_ph'))}
        ${field('taxExtra', T('extra'), T('extra_ph'))}
        ${field('taxBonus', T('bonus'), T('bonus_ph'))}
      </div>
      <button class="btn btn-secondary" onclick="document.getElementById('taxSalary').value=20000;document.getElementById('taxIns').value=3000;document.getElementById('taxExtra').value=2000;document.getElementById('taxBonus').value=50000;doTaxCalc()">${T('demo')}</button>
    </div>
    <div class="tool-card-panel" id="taxResult" style="display:none">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px" id="taxCards"></div>
      <div style="margin-top:16px;font-size:12px;color:var(--text-muted)">${T('schedule')}</div>
      <div style="overflow-x:auto;margin-top:8px"><table id="taxSchedule" style="width:100%;border-collapse:collapse;font-size:12px"></table></div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted);line-height:1.6">⚠️ ${T('note')}</div>
    </div>`;
};

function doTaxCalc() {
  const T = makeToolI18n(_taxDict);
  const num = id => Math.max(0, parseFloat(document.getElementById(id).value) || 0);
  const salary = num('taxSalary'), insurance = num('taxIns'), extra = num('taxExtra'), bonus = num('taxBonus');
  if (!salary) { document.getElementById('taxResult').style.display = 'none'; return; }
  const plan = taxSchedule({ salary, insurance, extra });
  const bonusTax = taxBonus(bonus);
  const money = v => v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const cards = [
    [T('gross'), money(salary), 'var(--text)'],
    [T('ins'), money(insurance), '#f59e0b'],
    [T('taxable'), money(plan.monthlyTaxable), 'var(--text-muted)'],
    [T('avg_tax'), money(plan.annualTax / 12), '#ef4444'],
    [T('net_avg'), money(salary - insurance - plan.annualTax / 12), '#10b981'],
    [T('rate'), (plan.annualTax / (salary * 12) * 100).toFixed(2) + '%', 'var(--accent)'],
    [T('annual_tax'), money(plan.annualTax), '#ef4444'],
    [T('annual_net'), money((salary - insurance) * 12 - plan.annualTax), '#10b981'],
  ];
  if (bonus) cards.push([T('bonus_tax'), money(bonusTax), '#ef4444'], [T('bonus_net'), money(bonus - bonusTax), '#10b981']);
  document.getElementById('taxCards').innerHTML = cards.map(([label, val, color]) =>
    `<div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${label}</div><div style="font-size:17px;font-weight:700;color:${color}">${val}</div></div>`
  ).join('');
  const cell = 'padding:6px 10px;text-align:right;border-bottom:1px solid var(--glass-border)';
  document.getElementById('taxSchedule').innerHTML =
    `<thead><tr style="color:var(--text-muted)"><th style="${cell}">${T('month')}</th><th style="${cell}">${T('month_tax')}</th><th style="${cell}">${T('month_net')}</th></tr></thead><tbody>` +
    plan.months.map(m => `<tr><td style="${cell};color:var(--text-muted)">${T('month_n', m.month)}</td><td style="${cell};color:#ef4444">${money(m.tax)}</td><td style="${cell};color:#10b981">${money(m.net)}</td></tr>`).join('') + '</tbody>';
  document.getElementById('taxResult').style.display = '';
}
