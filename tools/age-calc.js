window.renderAgeCalc = function(el) {
const today = new Date();
const defDate = new Date(today.getFullYear()-25, today.getMonth(), today.getDate()).toISOString().split('T')[0];
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">年龄 / 生日计算器</div>
<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">
<div style="flex:1;min-width:180px">
<label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">出生日期</label>
<input class="tool-input" id="ageDate" type="date" value="${defDate}">
</div>
<div class="tool-actions" style="margin:0">
<button class="btn btn-primary" onclick="doAgeCalc()">计算</button>
</div>
</div>
</div>
<div class="tool-card-panel" id="ageResult" style="display:none">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px" id="ageCards"></div>
</div>`;
doAgeCalc();
};
function doAgeCalc() {
const val = document.getElementById('ageDate').value;
if (!val) return;
const birth = new Date(val);
const now = new Date();
if (birth > now) return;
let y = now.getFullYear()-birth.getFullYear();
let m = now.getMonth()-birth.getMonth();
let d = now.getDate()-birth.getDate();
if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
if (m < 0) { y--; m += 12; }
const totalDays = Math.floor((now-birth)/86400000);
const nextBd = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
if (nextBd <= now) nextBd.setFullYear(now.getFullYear()+1);
const daysTobd = Math.ceil((nextBd-now)/86400000);
const zodiac = ['猴','鸡','狗','猪','鼠','牛','虎','兔','龙','蛇','马','羊'][(birth.getFullYear()-1900+48)%12];
const md = birth.getMonth()*100+birth.getDate();
const sign = md<120?'摩羯座':md<219?'水瓶座':md<321?'双鱼座':md<420?'白羊座':md<521?'金牛座':md<621?'双子座':md<723?'巨蟹座':md<823?'狮子座':md<923?'处女座':md<1023?'天秤座':md<1122?'天蝎座':md<1222?'射手座':'摩羯座';
const cards = [
{label:'精确年龄', val:`${y}岁 ${m}个月 ${d}天`},
{label:'距下次生日', val:`${daysTobd} 天`},
{label:'已活天数', val:`${totalDays.toLocaleString()} 天`},
{label:'生肖', val:zodiac},
{label:'星座', val:sign},
];
document.getElementById('ageCards').innerHTML = cards.map(c=>`
<div style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:12px;padding:16px;text-align:center">
<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${c.label}</div>
<div style="font-size:18px;font-weight:700;color:var(--text)">${c.val}</div>
</div>`).join('');
document.getElementById('ageResult').style.display = '';
}