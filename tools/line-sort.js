window.renderLineSort = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">行排序 / 去重</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
<div>
<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">输入（每行一项）</div>
<textarea class="tool-textarea" id="lsInput" rows="10" placeholder="每行输入一项内容..."></textarea>
</div>
<div>
<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px" id="lsStats">结果</div>
<textarea class="tool-textarea" id="lsOutput" rows="10" readonly style="resize:none"></textarea>
</div>
</div>
<div class="tool-actions" style="flex-wrap:wrap">
<button class="btn btn-primary" onclick="doLineSort('asc')">升序 A→Z</button>
<button class="btn btn-primary" onclick="doLineSort('desc')">降序 Z→A</button>
<button class="btn btn-secondary" onclick="doLineSort('shuffle')">随机打乱</button>
<button class="btn btn-secondary" onclick="doLineSort('dedup')">去重</button>
<button class="btn btn-secondary" onclick="doLineSort('noempty')">去空行</button>
<button class="btn btn-secondary" onclick="doLineSort('reverse')">翻转</button>
<button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('lsOutput').value).then(()=>showToast('已复制'))">复制结果</button>
</div>
</div>`;
};
function doLineSort(op) {
const input = document.getElementById('lsInput').value;
let lines = input.split('\n');
if (op === 'asc') lines.sort((a,b) => a.localeCompare(b, 'zh'));
else if (op === 'desc') lines.sort((a,b) => b.localeCompare(a, 'zh'));
else if (op === 'shuffle') {
for (let i=lines.length-1;i>0;i--) {
const j=Math.floor(Math.random()*(i+1));
[lines[i],lines[j]]=[lines[j],lines[i]];
}
}
else if (op === 'dedup') { const seen=new Set(); lines=lines.filter(l=>{if(seen.has(l))return false;seen.add(l);return true;}); }
else if (op === 'noempty') lines = lines.filter(l => l.trim() !== '');
else if (op === 'reverse') lines.reverse();
document.getElementById('lsOutput').value = lines.join('\n');
document.getElementById('lsStats').textContent = `结果（${lines.length} 行）`;
}