window.renderLunarCalendar = function(el) {
  const heavenly = ['庚','辛','壬','癸','甲','乙','丙','丁','戊','己'];
  const earthly  = ['申','酉','戌','亥','子','丑','寅','卯','辰','巳','午','未'];
  const zodiac   = ['猴','鸡','狗','猪','鼠','牛','虎','兔','龙','蛇','马','羊'];
  const today = new Date();
  const fmt = d => d.toISOString().split('T')[0];
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">农历 / 阳历转换</div>
      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap">
        <div style="flex:1;min-width:160px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">选择日期</label>
          <input class="tool-input" id="lcDate" type="date" value="${fmt(today)}">
        </div>
        <button class="btn btn-primary" onclick="doLunar()">查询</button>
        <button class="btn btn-secondary" onclick="document.getElementById('lcDate').value='${fmt(today)}';doLunar()">今天</button>
      </div>
    </div>
    <div class="tool-card-panel" id="lcResult" style="display:none">
      <div id="lcCards"></div>
    </div>`;
  doLunar();
};

function doLunar() {
  const val = document.getElementById('lcDate').value;
  if (!val) return;
  const d = new Date(val);
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  const base = new Date(1900, 0, 31);
  const offset = Math.floor((d - base) / 86400000);
  const heavenly = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const earthly  = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const zodiac   = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  const stemIdx = (y - 4) % 10;
  const branchIdx = (y - 4) % 12;
  const ganzhi = heavenly[(stemIdx+10)%10] + earthly[(branchIdx+12)%12];
  const animal = zodiac[(branchIdx+12)%12];
  const solarTerms = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
  const termDays = [6,20,4,19,6,21,5,20,6,21,6,21,7,23,7,23,8,23,8,23,7,22,7,22];
  let termInfo = '';
  for (let i=0;i<24;i++) {
    const td = termDays[i];
    const tm = Math.floor(i/2);
    if (m === tm && day === td) { termInfo = solarTerms[i]; break; }
  }
  const weekDays = ['日','一','二','三','四','五','六'];
  const cards = [
    {label:'公历', val:`${y}年${m+1}月${day}日 星期${weekDays[d.getDay()]}`},
    {label:'干支年', val:`${ganzhi}年`},
    {label:'生肖', val:animal},
    {label:'节气', val:termInfo||'非节气日'},
    {label:'距元旦', val:`${Math.ceil((new Date(y+1,0,1)-d)/86400000)} 天`},
    {label:'本年第', val:`${Math.ceil((d-new Date(y,0,0))/86400000)} 天`},
  ];
  document.getElementById('lcCards').innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">' +
    cards.map(c=>`<div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${c.label}</div><div style="font-size:15px;font-weight:600;color:var(--text)">${c.val}</div></div>`).join('') + '</div>';
  document.getElementById('lcResult').style.display = '';
}