const _loanDict = {
  zh: {
    title: '贷款 / 利息计算器', amount: '贷款金额（元）', rate: '年利率（%）', months: '贷款期限（月）', type: '还款方式',
    equal: '等额还款（月供相同）', principal: '等额本金（本金相同）', result: '计算结果',
    monthly: '月供（首月）', total: '还款总额', interest: '利息总额', term: '贷款期限', term_value: n => n + '个月',
    schedule: '还款计划（前12期）', cols: ['期数','月供','本金','利息','剩余本金'], more: n => `... 共 ${n} 期`,
  },
  en: {
    title: 'Loan / interest calculator', amount: 'Loan amount (CNY)', rate: 'Annual rate (%)', months: 'Term (months)', type: 'Repayment',
    equal: 'Equal payments (same each month)', principal: 'Equal principal (same principal)', result: 'Results',
    monthly: 'Monthly payment (1st month)', total: 'Total repayment', interest: 'Total interest', term: 'Term', term_value: n => `${n} month${n === 1 ? '' : 's'}`,
    schedule: 'Schedule (first 12 payments)', cols: ['#','Payment','Principal','Interest','Balance'], more: n => `... ${n} payments in total`,
  },
};

function renderLoanCalc(el) {
  const T = makeToolI18n(_loanDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('amount')}</label><input class="tool-input" id="lcAmount" type="number" value="500000" oninput="lcCalc()"></div>
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('rate')}</label><input class="tool-input" id="lcRate" type="number" value="3.65" step="0.01" oninput="lcCalc()"></div>
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('months')}</label><input class="tool-input" id="lcMonths" type="number" value="120" oninput="lcCalc()"></div>
        <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('type')}</label>
          <select class="tool-input" id="lcType" onchange="lcCalc()">
            <option value="equal">${T('equal')}</option>
            <option value="principal">${T('principal')}</option>
          </select>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="lcResult" style="display:none">
      <div class="panel-label" style="margin-bottom:14px">${T('result')}</div>
      <div id="lcSummary" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:16px"></div>
      <div id="lcDetail"></div>
    </div>`;
  lcCalc();
}

function lcCalc() {
  const T = makeToolI18n(_loanDict);
  const P=parseFloat(document.getElementById('lcAmount').value)||0;
  const annualRate=parseFloat(document.getElementById('lcRate').value)||0;
  const n=parseInt(document.getElementById('lcMonths').value)||0;
  const type=document.getElementById('lcType').value;
  if(!P||!n||annualRate<0) return;
  const r=annualRate/100/12;
  let monthly,totalPay,totalInterest;
  if(type==='equal') {
    monthly=r===0?P/n:P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);
    totalPay=monthly*n;
    totalInterest=totalPay-P;
  } else {
    const principalMonthly=P/n;
    totalInterest=0;
    for(let i=1;i<=n;i++) totalInterest+=(P-(i-1)*principalMonthly)*r;
    totalPay=P+totalInterest;
    monthly=principalMonthly+(P)*r; // first month
  }
  const fmt=v=>v.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
  document.getElementById('lcSummary').innerHTML=[
    [T('monthly'),'¥'+fmt(monthly),'var(--neon)'],
    [T('total'),'¥'+fmt(totalPay),'var(--accent)'],
    [T('interest'),'¥'+fmt(totalInterest),'#f97316'],
    [T('term'),T('term_value', n),'var(--text)'],
  ].map(([l,v,c])=>`<div style="padding:14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${l}</div><div style="font-weight:700;font-size:16px;color:${c}">${v}</div></div>`).join('');
  document.getElementById('lcResult').style.display='';
  // schedule preview (first 6 months)
  let schedHtml=`<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${T('schedule')}</div>`;
  schedHtml+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="color:var(--text-muted);border-bottom:1px solid var(--glass-border)">';
  T('cols').forEach(h=>schedHtml+=`<th style="padding:6px 10px;text-align:right;font-weight:500">${h}</th>`);
  schedHtml+='</tr></thead><tbody>';
  let remain=P;
  const months=Math.min(12,n);
  for(let i=1;i<=months;i++) {
    const interest=remain*r;
    let principal,m;
    if(type==='equal'){m=monthly;principal=m-interest;}
    else{principal=P/n;m=principal+interest;}
    remain-=principal;
    schedHtml+=`<tr style="border-bottom:1px solid rgba(255,255,255,0.04)"><td style="padding:6px 10px;text-align:right;color:var(--text-muted)">${i}</td><td style="padding:6px 10px;text-align:right;color:var(--neon)">${fmt(m)}</td><td style="padding:6px 10px;text-align:right">${fmt(principal)}</td><td style="padding:6px 10px;text-align:right;color:#f97316">${fmt(interest)}</td><td style="padding:6px 10px;text-align:right">${fmt(Math.max(0,remain))}</td></tr>`;
  }
  if(n>12) schedHtml+=`<tr><td colspan="5" style="padding:8px 10px;text-align:center;color:var(--text-muted)">${T('more', n)}</td></tr>`;
  schedHtml+='</tbody></table></div>';
  document.getElementById('lcDetail').innerHTML=schedHtml;
}
