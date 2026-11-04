/* Read-only plan preview and metadata timeline for the local workflow studio. */
window.WorkflowRunPanel = (() => {
  function mount(host, { workflow, label, editable, onLoad, onChange }) {
    const say=(zh,en)=>window.getCurrentLang?.()==='en'?en:zh;
    const node=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;};
    const stateLabel=value=>({running:say('运行中','Running'),pending:say('待执行','Pending'),completed:say('已完成','Completed'),failed:say('失败','Failed'),cancelled:say('已取消','Cancelled'),interrupted:say('未正常结束','Interrupted')})[value]||value;
    host.innerHTML=`<style>.wf-run-panel{margin-top:20px;overflow-wrap:anywhere}.wf-run-panel pre{max-height:220px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 ui-monospace,monospace}.wf-run-panel ol{padding-left:22px}.wf-run-panel li{margin:8px 0}.wf-run-panel summary{cursor:pointer}.wf-run-panel .wf-run-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.wf-run-panel .wf-run-line code{font-size:11px}.wf-run-panel .wf-run-row{padding:12px;border:1px solid var(--border);border-radius:10px;margin:10px 0}.wf-run-panel .wf-run-row summary{display:flex;gap:8px;flex-wrap:wrap}.wf-run-panel .wf-run-row time{margin-left:auto;color:var(--text-muted);font-size:12px}</style>
      <details id="wfPlan" class="wf-card"><summary>${say('执行计划预览','Execution plan preview')}</summary><p id="wfPreviewState" role="status" class="wf-muted"></p><div id="wfPreview"></div></details>
      <section class="wf-card"><div class="wf-run-line"><h2>${say('运行记录','Run history')}</h2><button id="wfRefreshHistory">${say('刷新','Refresh')}</button><button id="wfExportRuns">${say('导出摘要','Export summaries')}</button><button id="wfClearRuns">${say('清除记录','Clear history')}</button></div>
      <p class="wf-muted">${say('本机最多保留 30 条摘要，不包含输入、结果或密钥。最多 10 次运行的恢复数据留在当前标签页；刷新或淘汰后只可查看摘要。','Up to 30 local summaries, without inputs, results or keys. Recovery data for up to 10 runs stays in this tab; reload or eviction leaves summaries only.')}</p><p id="wfHistoryStatus" role="status" class="wf-muted"></p><div id="wfRunList"></div></section>`;
    host.classList.add('wf-run-panel');
    const field=id=>host.querySelector('#'+id);let disposed=false,revision=0,timer,hasPreview=false,busy=false;
    function showPreview(plan) {
      const result=workflow.preview(plan),list=node('ol');field('wfPreview').replaceChildren(list);
      for(const step of result.steps) {
        const row=node('li'),title=node('strong',step.id+' · '+label(step.action));row.append(title);
        row.append(node('p',say('依赖：','Depends on: ')+(step.dependencies.join(', ')||say('固定参数或本次输入','Fixed parameters or current input')),'wf-muted'));
        const details=node('details');details.append(node('summary',say('参数摘要','Parameter summary')),node('pre',JSON.stringify(step.parameters,null,2)));row.append(details);
        row.append(node('p',say('输出：','Outputs: ')+step.outputs.join(', '),'wf-muted'));list.append(row);
      }
      field('wfPreviewState').textContent=say(`共 ${result.total} 步，本地顺序执行；预览没有运行任何动作。`,`${result.total} local, sequential steps. Preview has not executed any actions.`);
      field('wfPlan').open=true;hasPreview=true;return result;
    }
    function invalidatePreview() { if(hasPreview)field('wfPreviewState').textContent=say('输入或步骤已变化，请重新预览；运行时会按当前内容重新校验。','Input or steps changed. Refresh the preview; execution validates the current plan.'); }
    const report=error=>{if(!disposed)field('wfHistoryStatus').textContent=error.message;};
    async function refreshHistory() {
      clearTimeout(timer);const stamp=++revision;
      try {
        const {runs,historyAvailable}=await workflow.listRuns();if(disposed||!host.isConnected||stamp!==revision)return;
        field('wfHistoryStatus').textContent=historyAvailable?'':say('运行摘要存储暂不可用，以下可能仅为本标签页记录。','Run summary storage is unavailable; entries below may exist in this tab only.');
        const list=field('wfRunList');list.replaceChildren();
        if(!runs.length){list.append(node('p',say('还没有运行记录。','No runs yet.'),'wf-muted'));return;}
        for(const run of runs) {
          const row=node('details',undefined,'wf-run-row');row.dataset.runId=run.id;
          const summary=node('summary');summary.append(node('strong',run.name),node('span',stateLabel(run.status)+' · '+run.completed+'/'+run.total));
          const time=node('time',new Date(run.updatedAt).toLocaleString());summary.append(time);row.append(summary);
          row.append(node('code',run.id));row.append(node('p',say(`来源：${run.source==='studio'?'我的流程':run.source==='assistant'?'助手':'本地'} · 第 ${run.attempt} 次尝试`,`Source: ${run.source} · attempt ${run.attempt}`),'wf-muted'));
          const steps=node('ol');for(const step of run.steps)steps.append(node('li',step.id+' · '+label(step.action)+' · '+stateLabel(step.status)+(step.reused?say('（复用）',' (reused)'):'')+' · '+step.durationMs+' ms'));row.append(steps);
          if(run.attempts.length>1) { const attempts=node('p',run.attempts.map(a=>say(`第 ${a.attempt} 次：`,`Attempt ${a.attempt}: `)+stateLabel(a.status)+' '+a.completed+'/'+run.total).join(' · '),'wf-muted');row.append(attempts); }
          const info=workflow.resumeInfo(run.id),controls=node('div',undefined,'wf-bar');
          if(info.canResume&&run.source==='studio'&&run.steps.every(s=>editable(s.action))) {
            const load=node('button',say('载入并预览，准备恢复','Load and preview for resume'));load.dataset.loadRun=run.id;load.disabled=busy;
            load.onclick=()=>{try{const checkpoint=workflow.checkpoint(run.id);if(!checkpoint)throw new Error(workflow.resumeInfo(run.id).message);onLoad(run.id,checkpoint);}catch(error){report(error);}};controls.append(load);
          } else if(run.status!=='completed'&&run.status!=='running')row.append(node('p',info.canResume?say('此记录可在助手中恢复。','This run can be resumed in the assistant.'):info.message,'wf-muted'));
          if(!run.historySaved)row.append(node('p',say('此摘要尚未保存到浏览器。','This summary is not saved in browser storage.'),'wf-muted'));
          const remove=node('button',say('删除摘要','Delete summary'));remove.disabled=run.status==='running'||busy;
          remove.onclick=async()=>{if(!confirm(say('删除此运行摘要和本标签页恢复数据？','Delete this summary and its checkpoint in this tab?')))return;try{const store=await ToolCompute.load('workflow-history');await store.remove(run.id);workflow.forget(run.id);onChange();await refreshHistory();}catch(error){report(error);}};
          controls.append(remove);row.append(controls);list.append(row);
        }
      } catch(error){report(error);}
    }
    const queueRefresh=()=>{clearTimeout(timer);timer=setTimeout(refreshHistory,150);};
    field('wfRefreshHistory').onclick=refreshHistory;
    field('wfClearRuns').onclick=async()=>{
      if(!confirm(say('清除运行摘要和本标签页的恢复数据？正在运行的记录会保留。','Clear summaries and checkpoints in this tab? Active runs are kept.')))return;
      try{const store=await ToolCompute.load('workflow-history'),before=await workflow.listRuns();await store.clear();for(const run of before.runs)workflow.forget(run.id);onChange();await refreshHistory();}catch(error){report(error);}
    };
    field('wfExportRuns').onclick=async()=>{
      try {
        const {runs}=await workflow.listRuns();if(disposed)return;
        const items=runs.map(({resumable,historySaved,...run})=>run),url=URL.createObjectURL(new Blob([JSON.stringify({version:1,items},null,2)],{type:'application/json'}));
        const link=node('a');link.href=url;link.download='workflow-run-summaries.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }catch(error){report(error);}
    };
    const storage=event=>{if(event.key==='dtb_workflow_runs'||event.key===null)queueRefresh();};window.addEventListener('storage',storage);
    refreshHistory();
    return {showPreview,invalidatePreview,refreshHistory,queueRefresh,setBusy(value){busy=value;host.querySelectorAll('[data-load-run],#wfClearRuns').forEach(el=>el.disabled=value);},dispose(){disposed=true;clearTimeout(timer);revision++;window.removeEventListener('storage',storage);}};
  }
  return {mount};
})();
