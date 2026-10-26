/* Draft-07 inference and validation use the same modules as the Agent. */
function renderJsonSchema(el) {
  const T=makeToolI18n({
    zh:{input:'JSON 数据 / 推断样本',schema:'Schema（Draft-07，可编辑）',sample:'示例',generate:'生成 Schema',validate:'校验 JSON',copy:'复制 Schema',download:'下载 Schema',stop:'取消校验',running:'校验中…',generated:'Schema 已生成',valid:'JSON 符合 Schema',invalid:'JSON 不符合 Schema',cancelled:'已取消',empty:'请输入 JSON 和 Schema',hint:'从全部样本合并类型与可选字段。推断结果需按业务要求补充约束。',scope:'支持 Draft-07、标准 format 和本地引用；远程引用与未知规则会报错。Ctrl / ⌘ + Enter 校验。',limit:'最多显示前 100 条错误',data:'粘贴 JSON 数据…',rules:'粘贴 Schema，或从左侧样本生成…'},
    en:{input:'JSON data / inference samples',schema:'Schema (Draft-07, editable)',sample:'Sample',generate:'Generate Schema',validate:'Validate JSON',copy:'Copy Schema',download:'Download Schema',stop:'Cancel validation',running:'Validating…',generated:'Schema generated',valid:'JSON matches the Schema',invalid:'JSON does not match the Schema',cancelled:'Cancelled',empty:'Enter JSON and a schema',hint:'Types and optional fields are inferred from all samples. Add constraints for your business rules.',scope:'Draft-07, standard formats and local references. Remote references and unknown rules return errors. Ctrl / ⌘ + Enter validates.',limit:'Showing the first 100 errors',data:'Paste JSON data…',rules:'Paste a schema, or infer one from the samples…'}
  });
  el.innerHTML=`<p class="workspace-notice">${T('hint')}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:16px">
    <section class="tool-card-panel"><label class="panel-label" for="jsInput">${T('input')}</label><textarea class="tool-textarea" id="jsInput" rows="14" spellcheck="false" placeholder="${T('data')}"></textarea><div class="tool-actions"><button class="btn btn-primary" onclick="_jsGenerate()">${T('generate')}</button><button class="btn btn-secondary" onclick="_jsSample()">${T('sample')}</button></div></section>
    <section class="tool-card-panel"><label class="panel-label" for="jsOutput">${T('schema')}</label><textarea class="tool-textarea" id="jsOutput" rows="14" spellcheck="false" placeholder="${T('rules')}"></textarea><div class="tool-actions"><button class="btn btn-secondary" onclick="_jsCopy(this)">${T('copy')}</button><button class="btn btn-secondary" id="jsDownload">${T('download')}</button></div></section></div>
    <section class="tool-card-panel"><div class="tool-actions"><button id="jsValidate" class="btn btn-primary" data-tool-submit onclick="_jsValidate()">${T('validate')}</button><button id="jsCancel" class="btn btn-secondary" hidden>${T('stop')}</button></div><p class="workspace-notice">${T('scope')}</p><div id="jsResultPanel" style="display:none"><div id="jsResult" role="status" style="overflow-wrap:anywhere"></div></div></section>`;
  const input=el.querySelector('#jsInput'),rules=el.querySelector('#jsOutput'),panel=el.querySelector('#jsResultPanel'),result=el.querySelector('#jsResult'),cancel=el.querySelector('#jsCancel');
  let controller,revision=0;
  const invalidate=()=>{if(el._schemaState)el._schemaState.output='';revision++;controller?.abort();controller=null;cancel.hidden=true;el.querySelector('#jsValidate').disabled=false;panel.style.display='none';};
  input.addEventListener('input',invalidate);rules.addEventListener('input',invalidate);
  async function run(mode) {
    invalidate();const stamp=revision;panel.style.display='';result.replaceChildren();
    if(!input.value.trim()||(mode==='validate'&&!rules.value.trim())){result.textContent=T('empty');return;}
    controller=new AbortController();const signal=controller.signal;
    result.textContent=T('running');cancel.hidden=mode!=='validate';el.querySelector('#jsValidate').disabled=true;
    try {
      const compute=await ToolCompute.load('schema');if(signal.aborted)return;
      const data=mode==='infer'?compute.infer(input.value):await compute.validate(input.value,rules.value,{signal});
      if(stamp!==revision||!el.isConnected)return;
      if(mode==='infer'){rules.value=data.result;result.textContent=T('generated');}
      else {
        const title=document.createElement('p');title.textContent=data.valid?T('valid'):T('invalid')+' · '+data.errorCount;title.style.color=data.valid?'#22c55e':'#ef4444';result.replaceChildren(title);
        for(const error of data.errors){const row=document.createElement('p');row.className='workspace-notice';row.textContent=(error.path||'/')+' · '+error.keyword+': '+error.message+' '+JSON.stringify(error.params);result.append(row);}
        if(data.truncated){const note=document.createElement('p');note.textContent=T('limit');result.append(note);}
      }
      el._schemaState.output=mode==='infer'?data.result:JSON.stringify(data,null,2);
      return data;
    }catch(error){if(stamp===revision&&el.isConnected)result.textContent=error.name==='AbortError'?T('cancelled'):error.message;}
    finally{if(stamp===revision){controller=null;cancel.hidden=true;el.querySelector('#jsValidate').disabled=false;}}
  }
  el._schemaState={run,invalidate,output:''};
  el._toolOutput=()=>el._schemaState.output;
  cancel.onclick=()=>controller?.abort();
  el.querySelector('#jsDownload').onclick=()=>{if(!rules.value)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([rules.value],{type:'application/schema+json'}));a.href=url;a.download='schema.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  window._activeCleanup=invalidate;
}
function _jsSample(){const input=document.getElementById('jsInput');input.value=JSON.stringify([{name:'Alice',age:30,tags:['admin','user']},{name:'Bob',age:null,email:'bob@example.com',tags:[]}],null,2);input.dispatchEvent(new Event('input',{bubbles:true}));}
function _jsGenerate(){return document.getElementById('toolBody')._schemaState.run('infer');}
function _jsValidate(){return document.getElementById('toolBody')._schemaState.run('validate');}
function _jsCopy(btn){const value=document.getElementById('jsOutput').value;if(value)copyText(value,btn);}
