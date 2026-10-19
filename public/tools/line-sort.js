window.renderLineSort = function(el) {
  const t = makeToolI18n({
    zh: { title:'行排序 / 清洗', input:'输入（每行一项）', result:'结果', asc:'升序 A→Z', desc:'降序 Z→A', shuffle:'随机打乱', dedup:'去重', noempty:'去空行', reverse:'翻转', copy:'复制结果', trim:'去首尾空格', clean:'清洗并排序', order:'排序', none:'保持原顺序', count:n=>'结果（'+n+' 行）' },
    en: { title:'Sort / clean lines', input:'Input (one item per line)', result:'Result', asc:'Ascending A→Z', desc:'Descending Z→A', shuffle:'Shuffle', dedup:'Remove duplicates', noempty:'Remove empty lines', reverse:'Reverse', copy:'Copy result', trim:'Trim whitespace', clean:'Clean and sort', order:'Order', none:'Keep original order', count:n=>'Result ('+n+' lines)' },
  });
  window._lsT = t;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${t('title')}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:12px">
        <label>${t('input')}<textarea class="tool-textarea" id="lsInput" rows="10"></textarea></label>
        <label><span id="lsStats">${t('result')}</span><textarea class="tool-textarea" id="lsOutput" rows="10" readonly></textarea></label>
      </div>
      <div class="tool-actions" style="flex-wrap:wrap">
        ${['asc','desc','shuffle','dedup','noempty','reverse'].map(op=>`<button type="button" class="btn btn-secondary" data-line-op="${op}">${t(op)}</button>`).join('')}
        <button type="button" class="btn btn-secondary" id="lsCopy">${t('copy')}</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="tool-actions" style="flex-wrap:wrap">
        <label><input type="checkbox" id="lsTrim" checked> ${t('trim')}</label>
        <label><input type="checkbox" id="lsEmpty" checked> ${t('noempty')}</label>
        <label><input type="checkbox" id="lsDedup" checked> ${t('dedup')}</label>
        <label>${t('order')} <select id="lsSort" class="tool-input">${['none','asc','desc','reverse'].map(op=>`<option value="${op}">${t(op)}</option>`).join('')}</select></label>
        <button type="button" class="btn btn-primary" id="lsClean">${t('clean')}</button>
      </div>
    </div>`;
  el.querySelectorAll('[data-line-op]').forEach(button => button.addEventListener('click',()=>doLineSort(button.dataset.lineOp)));
  el.querySelector('#lsCopy').addEventListener('click',event=>copyText(el.querySelector('#lsOutput').value,event.currentTarget));
  el.querySelector('#lsClean').addEventListener('click',()=>doLineSort('clean'));
};
function doLineSort(op) {
  const input = document.getElementById('lsInput').value;
  let options = { sort: ['asc','desc','reverse'].includes(op) ? op : 'none', deduplicate:op==='dedup', removeEmpty:op==='noempty' };
  if(op==='clean') options = { trim:document.getElementById('lsTrim').checked, removeEmpty:document.getElementById('lsEmpty').checked, deduplicate:document.getElementById('lsDedup').checked, sort:document.getElementById('lsSort').value };
  const data = window.ToolCompute.processLines(input,options);
  if(op==='shuffle') {
    const lines = input === '' ? [] : input.split(/\r\n|\n|\r/);
    for(let i=lines.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[lines[i],lines[j]]=[lines[j],lines[i]];}
    data.result = lines.join('\n'); data.outputLines = lines.length;
  }
  document.getElementById('lsOutput').value = data.result;
  document.getElementById('lsStats').textContent = window._lsT('count', data.outputLines);
}
