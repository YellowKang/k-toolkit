/* Strict calendar/instant semantics shared by manual tools and Agent. */
(function () {
  const fail = (zh, en) => { throw new Error(window.getCurrentLang?.() === 'en' ? en : zh); };
  const utc = (y, m, d, h = 0, n = 0, s = 0, ms = 0) => { const date = new Date(0); date.setUTCFullYear(y, m - 1, d); date.setUTCHours(h, n, s, ms); return date.getTime(); };
  function fields(text) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(text);
    if (!m) fail('使用 YYYY-MM-DD 或 ISO 日期时间', 'Use YYYY-MM-DD or an ISO date and time');
    const p = { year:+m[1], month:+m[2], day:+m[3], hour:+(m[4]||0), minute:+(m[5]||0), second:+(m[6]||0), millisecond:+(m[7]||'').padEnd(3,'0') };
    const d = new Date(utc(p.year,p.month,p.day,p.hour,p.minute,p.second,p.millisecond));
    if (p.year<1 || d.getUTCFullYear()!==p.year || d.getUTCMonth()+1!==p.month || d.getUTCDate()!==p.day || p.hour>23 || p.minute>59 || p.second>59) fail('日期或时间超出有效范围', 'Date or time is out of range');
    return p;
  }
  const zoneName = zone => { const name=!zone||zone==='local'?Intl.DateTimeFormat().resolvedOptions().timeZone:zone;new Intl.DateTimeFormat('en',{timeZone:name});return name; };
  function inZone(ms, zone) { return ToolCompute.zonedParts(ms, zoneName(zone)); }
  function instant(text, { timeZone = 'local', disambiguation = 'reject' } = {}) {
    text = String(text ?? '').trim();
    if (text.length>100) fail('日期输入过长', 'Date input is too long');
    if (!['reject','earlier','later'].includes(disambiguation)) fail('无效的夏令时策略', 'Invalid DST policy');
    const suffix = /(Z|[+-]\d{2}:\d{2})$/i.exec(text);
    if (suffix) {
      const p = fields(text.slice(0,-suffix[0].length));
      if (!/[T ]/.test(text)) fail('偏移必须用于完整日期时间', 'An offset requires a date and time');
      const off = suffix[0].toUpperCase()==='Z' ? 0 : (suffix[0][0]==='-'?-1:1)*(+suffix[0].slice(1,3)*60 + +suffix[0].slice(4,6));
      if (+suffix[0].slice(1,3)>23 || +suffix[0].slice(4,6)>59) fail('无效时区偏移', 'Invalid UTC offset');
      return utc(p.year,p.month,p.day,p.hour,p.minute,p.second,p.millisecond)-off*60000;
    }
    const p=fields(text), wall=utc(p.year,p.month,p.day,p.hour,p.minute,p.second), zone=zoneName(timeZone);
    const offsets=new Set();
    for(const hours of [-36,0,36]) { const t=wall+hours*3600000,q=inZone(t,zone); offsets.add(utc(q.year,q.month,q.day,q.hour,q.minute,q.second)-t); }
    const candidates=[...offsets].map(o=>wall-o).filter(t=>{const q=inZone(t,zone);return ['year','month','day','hour','minute','second'].every(k=>q[k]===p[k]);}).sort((a,b)=>a-b);
    if(!candidates.length) fail('此时间位于夏令时跳时区间，请提供明确 UTC 偏移', 'This local time does not exist during a DST gap; provide an explicit UTC offset');
    if(candidates.length>1 && disambiguation==='reject') fail('此时间在夏令时切换时重复，请选择 earlier/later 或明确 UTC 偏移', 'Ambiguous local time during DST overlap; choose earlier/later or provide an explicit UTC offset');
    return candidates[disambiguation==='later'?candidates.length-1:0]+p.millisecond;
  }
  function detectUnit(value) {
    const m=/^[+-]?(\d+)(?:\.\d+)?$/.exec(String(value??'').trim()); if(!m)return null;
    const n=m[1].replace(/^0+(?=\d)/,'').length;return n>=18?'ns':n>=15?'us':n>=12?'ms':'s';
  }
  function millis(value, unit='auto') {
    const text=String(value??'').trim(), detected=detectUnit(text);
    if(!detected || text.length>40) fail('请输入有效数字时间戳', 'Enter a valid numeric timestamp');
    if(unit==='auto')unit=detected;
    if(!['s','ms','us','ns'].includes(unit))fail('无效时间戳单位', 'Invalid timestamp unit');
    // Integer micro/nanoseconds must be truncated before Number conversion to avoid rounding across milliseconds.
    let ms;
    if(/^[+-]?\d+$/.test(text) && ['us','ns'].includes(unit)) ms=Number(BigInt(text)/(unit==='us'?1000n:1000000n));
    else ms=Math.trunc(Number(text)*({s:1000,ms:1,us:.001,ns:.000001}[unit]));
    if(!Number.isSafeInteger(ms)||!Number.isFinite(new Date(ms).getTime()))fail('时间戳超出可表示范围', 'Timestamp is out of range');
    return ms;
  }
  function timestamp(value,{direction='toDate',unit='auto',timeZone='local',disambiguation='reject'}={}) {
    if(!['toDate','toTs'].includes(direction))fail('无效转换方向', 'Invalid conversion direction');
    const used=unit==='auto'?(direction==='toDate'?detectUnit(value):'s'):unit;
    if(!['s','ms','us','ns'].includes(used))fail('无效时间戳单位', 'Invalid timestamp unit');
    const ms=direction==='toDate'?millis(value,used):instant(value,{timeZone,disambiguation});
    const iso=new Date(ms).toISOString();
    const numeric=used==='s'?Math.floor(ms/1000):used==='ms'?ms:(BigInt(ms)*(used==='us'?1000n:1000000n)).toString();
    return {result:direction==='toDate'?iso:numeric,iso,milliseconds:ms,seconds:Math.floor(ms/1000),unit:used,timeZone:zoneName(timeZone),precision:'milliseconds'};
  }
  function diff(from,to) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to))fail('日期差仅接受 YYYY-MM-DD 日历日期', 'Date difference requires YYYY-MM-DD calendar dates');
    const a=fields(from),b=fields(to),day=p=>utc(p.year,p.month,p.day)/86400000,sign=day(b)<day(a)?-1:1,[start,end]=sign<0?[b,a]:[a,b];
    const add=months=>{const date=new Date(utc(start.year,start.month+months,1)),last=new Date(utc(date.getUTCFullYear(),date.getUTCMonth()+2,0)).getUTCDate();return utc(date.getUTCFullYear(),date.getUTCMonth()+1,Math.min(start.day,last))/86400000;};
    let months=(end.year-start.year)*12+end.month-start.month;if(add(months)>day(end))months--;
    const totalDays=day(end)-day(start),calendar={sign,years:Math.floor(months/12),months:months%12,totalMonths:months,days:day(end)-add(months),totalDays};
    const count=totalDays+1,full=Math.floor(count/7);let weekdays=full*5;for(let d=day(start)+full*7;d<=day(end);d++){const dow=((d+4)%7+7)%7;if(dow!==0&&dow!==6)weekdays++;}
    return {from,to,days:sign*totalDays,weeks:sign*totalDays/7,months:sign*months,years:sign*calendar.years,calendar,weekdays,weekdaysInclusive:true,holidaysIncluded:false};
  }
  function timezone(time,from,to,disambiguation='reject') {
    if(/^\d{2}:\d{2}(?::\d{2})?$/.test(time)) { const p=inZone(Date.now(),from);time=`${String(p.year).padStart(4,'0')}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}T${time}`; }
    const ms=instant(time,{timeZone:from,disambiguation}),p=inZone(ms,to);
    const result=`${String(p.year).padStart(4,'0')}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')} ${String(p.hour).padStart(2,'0')}:${String(p.minute).padStart(2,'0')}:${String(p.second).padStart(2,'0')}`;
    return {result,from:zoneName(from),to:zoneName(to),iso:new Date(ms).toISOString(),milliseconds:ms};
  }
  window.KCompute=window.KCompute||{};window.KCompute.date=Object.freeze({fields,instant,detectUnit,millis,timestamp,diff,timezone});
})();
