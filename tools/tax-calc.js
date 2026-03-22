window.renderTaxCalc = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">个人所得税计算器（2024）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">税前月薪（元）</label>
          <input class="tool-input" id="taxSalary" type="number" placeholder="例如 20000" oninput="doTaxCalc()">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">五险一金（元）</label>
          <input class="tool-input" id="taxIns" type="number" placeholder="例如 3000" oninput="doTaxCalc()">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">专项附加扣除（元/月）</label>
          <input class="tool-input" id="taxExtra" type="number" placeholder="子女教育/房贷利息等" oninput="doTaxCalc()">
        </div>
        <div style="display:flex;align-items:flex-end">
          <button class="btn btn-secondary" onclick="document.getElementById('taxSalary').value=20000;document.getElementById('taxIns').value=3000;document.getElementById('taxExtra').value=0;doTaxCalc()">示例</button>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="taxResult" style="display:none">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px" id="taxCards"></div>
      <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">⚠️ 起征点 5000 元，税率表参照 2018 年个税改革后标准，仅供参考</div>
    </div>`;
};

function doTaxCalc() {
  const salary = parseFloat(document.getElementById('taxSalary').value) || 0;
  const ins = parseFloat(document.getElementById('taxIns').value) || 0;
  const extra = parseFloat(document.getElementById('taxExtra').value) || 0;
  if (!salary) return;
  const taxable = Math.max(0, salary - ins - extra - 5000);
  const brackets = [[36000/12,0.03,0],[144000/12,0.1,2520/12],[300000/12,0.2,16920/12],[420000/12,0.25,31920/12],[660000/12,0.3,52920/12],[960000/12,0.35,85920/12],[Infinity,0.45,181920/12]];
  let tax = 0;
  for (const [limit, rate, deduct] of brackets) {
    if (taxable <= limit) { tax = taxable * rate - deduct; break; }
  }
  tax = Math.max(0, tax);
  const netSalary = salary - ins - tax;
  const cards = [
    {label:'税前月薪', val: salary.toLocaleString(), color:'var(--text)'},
    {label:'五险一金', val: ins.toLocaleString(), color:'#f59e0b'},
    {label:'应纳税额', val: taxable.toFixed(2), color:'var(--text-muted)'},
    {label:'个人所得税', val: tax.toFixed(2), color:'#ef4444'},
    {label:'税后月薪', val: netSalary.toFixed(2), color:'#10b981'},
    {label:'综合税率', val: (tax/salary*100).toFixed(1)+'%', color:'var(--accent)'},
  ];
  document.getElementById('taxCards').innerHTML = cards.map(c =>
    `<div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${c.label}</div><div style="font-size:18px;font-weight:700;color:${c.color}">${c.val}</div></div>`
  ).join('');
  document.getElementById('taxResult').style.display = '';
}

window._activeCleanup = function() {};
