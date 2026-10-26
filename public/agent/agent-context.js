/* Bound only the send view; keep original conversation and user-pinned notes intact. */
(function () {
  const say=(zh,en)=>window.getCurrentLang?.()==='en'?en:zh,KEY='dtb_context_preferences';
  function preferences(){try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return {budget:[16000,32000,64000].includes(v.budget)?v.budget:32000,note:typeof v.note==='string'?v.note.slice(0,4000):''};}catch{return {budget:32000,note:''};}}
  function save(value){const prefs={...preferences(),...value};prefs.note=String(prefs.note).slice(0,4000);if(![16000,32000,64000].includes(prefs.budget))throw new Error('Invalid context budget');localStorage.setItem(KEY,JSON.stringify(prefs));return prefs;}
  function estimate(value){
    let text=typeof value==='string'?value:JSON.stringify(value,(_key,v)=>v?.type==='image'&&v.source?.data?'[image]'.repeat(2340):typeof v==='string'&&/^data:image\//.test(v)?'[image]'.repeat(2340):v);
    // A conservative mixed-language estimate, not a model-specific tokenizer.
    let wide=0;for(const c of text)if(c.codePointAt(0)>127)wide++;
    return Math.ceil((text.length-wide)/4+wide)+8;
  }
  function turns(messages){const groups=[];for(const message of messages){if(message.role==='user')groups.push([]);if(groups.length)groups.at(-1).push(message);}return groups;}
  function build(messages,{system='',tools=[],budget,replyTokens=2000,maxTurns=0,note}={}){
    const prefs=preferences();budget=budget??prefs.budget;note=note??prefs.note;
    if(!Number.isFinite(budget)||budget<1000||budget>128000)throw new Error('Invalid context budget');
    const sys=typeof system==='string'?system:system.content||'';
    const pinned=note?'\n\n'+say('用户固定备注（每轮保留）：','User-pinned notes (kept each turn):')+'\n'+note:'';
    const systemMessage={role:'system',content:sys+pinned};
    const base=estimate(systemMessage)+estimate(tools)+Math.min(Math.max(Number(replyTokens)||2000,1),64000);
    if(base>budget)throw Object.assign(new Error(say('系统提示、固定备注或回复预留超过上下文预算，请调整设置。','System instructions, pinned notes or reply reserve exceed the context budget; adjust settings.')),{code:'context_budget'});
    const grouped=turns(messages),selected=[];let cost=base;
    for(let i=grouped.length-1;i>=0;i--){const group=grouped[i],size=estimate(group);if(maxTurns>0&&selected.length>=maxTurns)break;if(cost+size>budget){if(!selected.length)throw Object.assign(new Error(say('当前这轮内容超过上下文预算。请提高预算、缩短输入，或把大文本作为本地文件处理；原对话已保留。','The current turn exceeds the context budget. Increase the budget, shorten the input, or process large text as a local file. Your conversation is kept.')),{code:'context_budget'});break;}selected.unshift(group);cost+=size;}
    return {messages:[systemMessage,...selected.flat()],stats:{estimatedTokens:cost,budget,sentTurns:selected.length,totalTurns:grouped.length,omittedTurns:grouped.length-selected.length,pinned:!!note}};
  }
  const describe=s=>say(`本次发送 ${s.sentTurns}/${s.totalTurns} 轮 · 估算 ${s.estimatedTokens.toLocaleString()} / ${s.budget.toLocaleString()} tokens${s.omittedTurns?' · 更早历史仍保留在本次会话':''}`,`Sending ${s.sentTurns}/${s.totalTurns} turns · estimated ${s.estimatedTokens.toLocaleString()} / ${s.budget.toLocaleString()} tokens${s.omittedTurns?' · Earlier history stays in this session':''}`);
  function mount(container){const root=document.createElement('details');root.className='context-controls';root.style.cssText='padding:8px 14px;font-size:12px;max-width:100%;box-sizing:border-box';const title=document.createElement('summary');title.textContent=say('上下文预算与固定备注','Context budget and pinned notes');root.append(title);
    const prefs=preferences(),label=document.createElement('label');label.textContent=say('预算（包含回复预留，按估算控制）','Budget (estimated, including reply reserve)');const select=document.createElement('select');select.className='tool-input';select.dataset.contextBudget='';for(const value of[16000,32000,64000]){const o=document.createElement('option');o.value=value;o.textContent=value/1000+'k';select.append(o);}select.value=prefs.budget;label.append(select);
    const noteLabel=document.createElement('label');noteLabel.textContent=say('每轮保留的备注','Notes to retain each turn');const note=document.createElement('textarea');note.className='tool-textarea';note.rows=2;note.maxLength=4000;note.value=prefs.note;note.dataset.contextNote='';noteLabel.append(note);
    const status=document.createElement('p');status.setAttribute('role','status');const button=document.createElement('button');button.className='btn btn-secondary';button.textContent=say('保存','Save');button.type='button';button.onclick=()=>{try{save({budget:Number(select.value),note:note.value});status.textContent=say('已保存；AI 对话与 Agent 共用，下一次请求生效。','Saved for AI Chat and Agent; applies to the next request.');}catch(e){status.textContent=e.message;}};
    root.append(label,noteLabel,button,status);container.append(root);const info=document.createElement('p');info.className='context-stats';info.setAttribute('role','status');info.style.cssText='margin:0;padding:0 14px 6px;font-size:11px;overflow-wrap:anywhere';container.append(info);return stats=>{info.textContent=describe(stats);};
  }
  window.AgentContext=Object.freeze({build,estimate,turns,preferences,save,mount,describe});
})();
