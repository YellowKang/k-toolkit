function renderTimestamp(el) {
  const tl = makeToolI18n({
    zh: {
      current_time:    '当前时间',
      pause:           '暂停',
      resume:          '继续',
      ts_to_date:      '时间戳 → 日期',
      date_to_ts:      '日期 → 时间戳',
      input_ts:        '输入时间戳（秒或毫秒）',
      convert:         '转换',
      use_now:         '用当前',
      multi_format:    '多格式输出',
      input_ts_or_date:'输入时间戳(秒/毫秒)或日期字符串',
      now:             '现在',
      clear:           '清空',
      ts_sec:          '秒级时间戳',
      ts_ms:           '毫秒时间戳',
      local_time:      '本地时间',
      invalid_ts:      '无效时间戳（只接受数字，可带负号/小数）',
      unit_detected:   '识别单位',
      units:           { s: '秒（10 位）', ms: '毫秒（13 位）', us: '微秒（16 位）', ns: '纳秒（19 位）' },
      utc_time:        'UTC 时间',
      iso_8601:        'ISO 8601',
      relative_time:   '相对时间',
      full_date:       '年月日',
      local_datetime:  '本地日期时间',
      date:            '日期',
      time:            '时间',
      readable:        '可读格式',
      ts_sec_label:    '时间戳（秒）',
      ts_ms_label:     '时间戳（毫秒）',
      utc_string:      'UTC 字符串',
      cannot_parse:    '无法解析该时间格式',
      copy:            '复制',
      just_now:        '刚刚',
      min_ago:         ' 分钟前',
      min_later:       ' 分钟后',
      hr_ago:          ' 小时前',
      hr_later:        ' 小时后',
      day_ago:         ' 天前',
      day_later:       ' 天后',
    },
    en: {
      current_time:    'Current Time',
      pause:           'Pause',
      resume:          'Resume',
      ts_to_date:      'Timestamp → Date',
      date_to_ts:      'Date → Timestamp',
      input_ts:        'Enter timestamp (seconds or milliseconds)',
      convert:         'Convert',
      use_now:         'Use Now',
      multi_format:    'Multi-format Output',
      input_ts_or_date:'Enter timestamp or date string',
      now:             'Now',
      clear:           'Clear',
      ts_sec:          'Unix (s)',
      ts_ms:           'Unix (ms)',
      local_time:      'Local Time',
      invalid_ts:      'Invalid timestamp (digits only, optional sign/decimals)',
      unit_detected:   'Detected unit',
      units:           { s: 'seconds (10 digits)', ms: 'milliseconds (13 digits)', us: 'microseconds (16 digits)', ns: 'nanoseconds (19 digits)' },
      utc_time:        'UTC',
      iso_8601:        'ISO 8601',
      relative_time:   'Relative',
      full_date:       'Date',
      local_datetime:  'Local DateTime',
      date:            'Date',
      time:            'Time',
      readable:        'Readable',
      ts_sec_label:    'Timestamp (s)',
      ts_ms_label:     'Timestamp (ms)',
      utc_string:      'UTC String',
      cannot_parse:    'Cannot parse this time format',
      copy:            'Copy',
      just_now:        'Just now',
      min_ago:         ' min ago',
      min_later:       ' min later',
      hr_ago:          ' hr ago',
      hr_later:        ' hr later',
      day_ago:         ' day ago',
      day_later:       ' day later',
    },
  });
  window._tsTl = tl;

  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">${tl('current_time')}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary" id="tsPauseBtn" onclick="toggleTsPause()">${tl('pause')}</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px" id="tsLiveCards"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('ts_to_date')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="tsInput" placeholder="${tl('input_ts')}" style="flex:1">
        <button class="btn btn-primary" onclick="tsToDate()">${tl('convert')}</button>
        <button class="btn btn-secondary" onclick="tsUseNow()">${tl('use_now')}</button>
      </div>
      <div id="tsDateResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('date_to_ts')}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <input class="tool-input" id="dateInput" type="datetime-local" style="flex:1">
        <button class="btn btn-primary" onclick="dateToTs()">${tl('convert')}</button>
      </div>
      <div id="tsFromDateResult" style="margin-top:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${tl('multi_format')}</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="tool-input" id="tfInput" placeholder="${tl('input_ts_or_date')}" style="flex:1" oninput="doTimeFormat()">
        <button class="btn btn-secondary" onclick="document.getElementById('tfInput').value=Date.now();doTimeFormat()">${tl('now')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('tfInput').value='';document.getElementById('tfResult').style.display='none'">${tl('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="tfResult" style="display:none">
      <div id="tfCards"></div>
    </div>`;

  const dt = new Date();
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
  document.getElementById('dateInput').value = dt.toISOString().slice(0,16);
  el._toolOutput=()=>el._timestampOutput||'';
  const settings=document.createElement('div');settings.className='tool-card-panel';
  const say=(zh,en)=>getCurrentLang()==='en'?en:zh;
  settings.innerHTML=`<div class="panel-label">${say('转换设置','Conversion settings')}</div><div style="display:flex;gap:12px;flex-wrap:wrap"><label>${say('时间戳单位','Timestamp unit')}<select id="tsUnit" class="tool-input"><option value="auto">${say('自动识别（历史时间请指定单位）','Auto (specify units for historical timestamps)')}</option>${['s','ms','us','ns'].map(x=>`<option>${x}</option>`).join('')}</select></label><label>${say('无偏移日期的时区','Time zone for dates without an offset')}<input id="tsZone" class="tool-input" value="local" placeholder="Asia/Shanghai"></label><label>${say('夏令时重复时间','DST overlap')}<select id="tsDst" class="tool-input"><option value="reject">${say('要求明确选择','Require an explicit choice')}</option><option value="earlier">${say('较早时刻','Earlier instant')}</option><option value="later">${say('较晚时刻','Later instant')}</option></select></label></div><p>${say('精度到毫秒；无效日期和夏令时不存在的时间会报错。','Millisecond precision; invalid dates and nonexistent DST times are rejected.')}</p>`;
  el.children[0].after(settings);
  el.addEventListener('input',event=>{if(event.target.id==='tfInput')return;el._timestampRevision=(el._timestampRevision||0)+1;el._timestampOutput='';for(const id of ['tsDateResult','tsFromDateResult','tfCards'])document.getElementById(id).textContent='';});
  startTsClock();

  document.getElementById('tsInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); tsToDate(); }
  });
  document.getElementById('tfInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doTimeFormat(); }
  });
}

let _tsPaused = false, _tsTimer = null;

function _tsLocale() {
  return getCurrentLang() === 'en' ? 'en-US' : 'zh-CN';
}

function _renderLiveCards() {
  const tl = window._tsTl;
  const now = Date.now();
  const sec  = Math.floor(now / 1000);
  const cards = [
    { label: tl('ts_sec'), val: sec, color: 'var(--neon)' },
    { label: tl('ts_ms'),  val: now, color: '#f093fb' },
    { label: tl('local_time'), val: new Date().toLocaleString(_tsLocale()), color: 'var(--text)' },
    { label: 'ISO 8601',  val: new Date().toISOString(), color: '#67e8f9' },
  ];
  const container = document.getElementById('tsLiveCards');
  if (!container) return;
  container.innerHTML = cards.map(c => `
    <div style="padding:14px 16px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:12px;display:flex;flex-direction:column;gap:4px">
      <div style="font-size:11px;color:var(--text-muted);font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${c.label}</div>
      <div style="font-family:monospace;font-size:14px;font-weight:700;color:${c.color};word-break:break-all">${c.val}</div>
      <button class="copy-inline" style="align-self:flex-start;margin-top:2px" onclick="copyText('${c.val}',this)">${tl('copy')}</button>
    </div>`).join('');
}

function startTsClock() {
  if (_tsTimer) { clearInterval(_tsTimer); _tsTimer = null; }
  _renderLiveCards();
  _tsTimer = setInterval(() => {
    if (!_tsPaused) {
      if (!document.getElementById('tsLiveCards')) { clearInterval(_tsTimer); return; }
      _renderLiveCards();
    }
  }, 1000);
  window._activeCleanup = () => { clearInterval(_tsTimer); _tsTimer = null; };
}

function toggleTsPause() {
  const tl = window._tsTl;
  _tsPaused = !_tsPaused;
  const btn = document.getElementById('tsPauseBtn');
  if (btn) btn.textContent = _tsPaused ? tl('resume') : tl('pause');
}

function tsUseNow() {
  document.getElementById('tsInput').value = Math.floor(Date.now()/1000);
  tsToDate();
}

function _padTwo(n) {
  return String(n).padStart(2, '0');
}

// Shared timestamp operations
function tsDetectUnit(text){return KCompute.date.detectUnit(text);}
function tsToMillis(text,unit){return KCompute.date.millis(text,unit||'auto');}
async function _timestampRun(kind){
  const root=document.getElementById('toolBody'),id=kind==='toDate'?'tsInput':kind==='toTs'?'dateInput':'tfInput',out=document.getElementById(kind==='toDate'?'tsDateResult':kind==='toTs'?'tsFromDateResult':'tfCards');
  const value=document.getElementById(id).value.trim(),revision=(root._timestampRevision||0)+1;root._timestampRevision=revision;root._timestampOutput='';out.textContent='';
  if(kind==='format')document.getElementById('tfResult').style.display=value?'':'none';if(!value)return;
  const options={unit:document.getElementById('tsUnit').value,timeZone:document.getElementById('tsZone').value.trim()||'local',disambiguation:document.getElementById('tsDst').value};
  try{
    const compute=await ToolCompute.load('date');if(!out.isConnected||root._timestampRevision!==revision)return;
    const direction=kind==='format'?(compute.detectUnit(value)?'toDate':'toTs'):kind;
    const data=compute.timestamp(value,{...options,direction}),date=new Date(data.milliseconds);root._timestampOutput=JSON.stringify(data,null,2);
    const rows=[['ISO 8601',data.iso],[window._tsTl('ts_sec'),data.seconds],[window._tsTl('ts_ms'),data.milliseconds],[window._tsTl('unit_detected'),data.unit],[window._tsTl('local_time'),date.toLocaleString(_tsLocale())],[window._tsTl('utc_time'),date.toUTCString()]];
    if(direction==='toTs'&&['us','ns'].includes(data.unit))rows.unshift([data.unit,data.result]);
    for(const[label,value]of rows){const row=document.createElement('div');row.className='result-row';row.style.cssText='display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px';const name=document.createElement('span');name.textContent=label;name.style.minWidth='100px';const text=document.createElement('code');text.textContent=String(value);text.style.cssText='flex:1;min-width:120px;overflow-wrap:anywhere';const button=document.createElement('button');button.className='copy-inline';button.textContent=window._tsTl('copy');button.onclick=()=>copyText(String(value),button);row.append(name,text,button);out.append(row);}
    return {success:true,data};
  }catch(e){if(out.isConnected&&root._timestampRevision===revision)out.textContent=e.message;return {success:false,error:e.message};}
}
function tsToDate(){return _timestampRun('toDate');}
function dateToTs(){return _timestampRun('toTs');}
function doTimeFormat(){return _timestampRun('format');}
function renderTimeFormat(el){return renderTimestamp(el);}
