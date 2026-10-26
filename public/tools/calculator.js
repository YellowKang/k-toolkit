/* Editable expressions and keypad share compute/math.js with the Agent. */
function renderCalculator(el) {
  const T = makeToolI18n({
    zh: { expression:'数学表达式', hint:'^ 幂 · % 百分比 · mod 取余 · Enter 计算', scientific:'科学', basic:'基础', history:'最近计算', empty:'输入表达式，或使用下方按键', clear:'清空历史', copy:'复制结果', failed:'计算失败', running:'计算中…', reuse:'复用表达式' },
    en: { expression:'Math expression', hint:'^ power · % percent · mod remainder · Enter to calculate', scientific:'Scientific', basic:'Basic', history:'Recent calculations', empty:'Enter an expression or use the keypad', clear:'Clear history', copy:'Copy result', failed:'Calculation failed', running:'Calculating…', reuse:'Reuse expression' },
  });
  el.innerHTML = `<div class="tool-card-panel" style="max-width:640px;margin:auto">
    <label class="panel-label" for="calcExpr">${T('expression')}</label>
    <input class="tool-input" id="calcExpr" aria-label="${T('expression')}" autocomplete="off" spellcheck="false" placeholder="2^3 + sin(30)" style="font-family:monospace;font-size:18px">
    <p class="workspace-notice">${T('hint')}</p>
    <div style="display:flex;align-items:center;gap:12px;margin:16px 0;min-height:50px"><output id="calcVal" style="font-size:28px;word-break:break-all;flex:1;color:var(--neon)">0</output><button class="btn btn-secondary" id="calcCopy" disabled>${T('copy')}</button></div>
    <p id="calcStatus" role="status" class="workspace-notice">${T('empty')}</p>
    <div class="tool-actions"><button class="btn btn-secondary" id="calcSciToggle">${T('scientific')}</button><button class="btn btn-secondary" id="calcAngle" aria-pressed="false">DEG</button></div>
    <div id="calcSciRows" hidden style="margin-bottom:8px;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px"></div>
    <div id="calcBtns" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:22px"><span class="panel-label">${T('history')}</span><button class="copy-inline" id="calcHistClear">${T('clear')}</button></div>
    <div id="calcHistList" style="max-height:220px;overflow:auto"></div>
  </div>`;
  const input=el.querySelector('#calcExpr'),output=el.querySelector('#calcVal'),status=el.querySelector('#calcStatus'),copy=el.querySelector('#calcCopy');
  let angle='deg',evaluated=false,revision=0,closed=false,resultText='',history=[];
  function changed() { revision++;evaluated=false;copy.disabled=true;status.textContent='';output.textContent='—'; }
  input.addEventListener('input',changed);
  function renderHistory() {
    const list=el.querySelector('#calcHistList');list.replaceChildren();
    el.querySelector('#calcHistClear').hidden=!history.length;
    for(const item of history) {
      const row=document.createElement('button');row.className='btn btn-secondary';row.style.cssText='display:block;width:100%;text-align:left;margin-top:8px;white-space:normal;overflow-wrap:anywhere';
      row.textContent=item.expression+' = '+item.result+' · '+item.angle.toUpperCase();row.title=T('reuse');
      row.onclick=()=>{input.value=item.expression;angle=item.angle;el.querySelector('#calcAngle').textContent=angle.toUpperCase();el.querySelector('#calcAngle').setAttribute('aria-pressed',String(angle==='rad'));changed();input.focus();};list.append(row);
    }
  }
  async function run() {
    const expression=input.value,stamp=++revision;status.textContent=T('running');copy.disabled=true;
    try {
      const math=await ToolCompute.load('math'),result=math.evaluate(expression,{angle});
      if(closed || stamp!==revision || !el.isConnected)return;
      resultText=String(result);output.textContent=math.format(result);status.textContent='';evaluated=true;copy.disabled=false;
      history.unshift({expression,result:output.textContent,angle});history=history.slice(0,10);renderHistory();
      return result;
    } catch(error) { if(!closed && stamp===revision && el.isConnected){output.textContent='—';status.textContent=T('failed')+'：'+error.message;evaluated=false;} }
  }
  function press(key) {
    if(key==='='){run();return;}
    if(key==='C'){input.value='';changed();output.textContent='0';input.focus();return;}
    if(key==='⌫'){input.value=input.value.slice(0,-1);changed();input.focus();return;}
    if(key==='±'){input.value=input.value.startsWith('-(')&&input.value.endsWith(')')?input.value.slice(2,-1):'-('+ (input.value||'0') +')';changed();return;}
    const value={ '×':'*','÷':'/','−':'-','x^y':'^','√':'sqrt(','sin':'sin(','cos':'cos(','tan':'tan(','ln':'ln(','log':'log10(','π':'pi','mod':' mod ' }[key]||key;
    if(evaluated)input.value=/^[+*/^%-]$/.test(value)?resultText:'';
    const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
    input.setRangeText(value,start,end,'end');changed();input.focus();
  }
  for(const [id,keys] of [['calcBtns',['C','±','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','.','⌫','=']],['calcSciRows',['sin','cos','tan','log','ln','√','x^y','π','e','(',')','mod']]]) {
    for(const key of keys){const b=document.createElement('button');b.className='btn '+(key==='='?'btn-primary':'btn-secondary');b.textContent=key;b.style.cssText='padding:14px 4px;font-size:16px;min-width:0';b.onclick=()=>press(key);el.querySelector('#'+id).append(b);}
  }
  el.querySelector('#calcSciRows').style.display='none';
  el.querySelector('#calcSciToggle').onclick=event=>{const rows=el.querySelector('#calcSciRows');rows.hidden=!rows.hidden;rows.style.display=rows.hidden?'none':'grid';event.currentTarget.textContent=rows.hidden?T('scientific'):T('basic');event.currentTarget.setAttribute('aria-expanded',String(!rows.hidden));};
  el.querySelector('#calcAngle').onclick=event=>{angle=angle==='deg'?'rad':'deg';event.currentTarget.textContent=angle.toUpperCase();event.currentTarget.setAttribute('aria-pressed',String(angle==='rad'));changed();};
  el.querySelector('#calcHistClear').onclick=()=>{history=[];renderHistory();};
  copy.onclick=()=>copyText(resultText,copy);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();run();}else if(event.key==='Escape'){event.preventDefault();press('C');}});
  // Keypad shortcuts only while this tool owns focus, never while typing in the Agent or search.
  el.addEventListener('keydown',event=>{if(event.target===input||event.ctrlKey||event.metaKey||event.altKey)return;const key={'Enter':'=','Backspace':'⌫','Escape':'C'}[event.key]||event.key;if(/^[0-9.+*/^%()-]$/.test(key)||['=','⌫','C'].includes(key)){event.preventDefault();press(key);}});
  el._toolOutput=()=>copy.disabled?'':resultText;
  el._calculatorRun=run;
  window._activeCleanup=()=>{closed=true;revision++;};renderHistory();
}
