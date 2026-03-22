window.renderTextRepeat = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">文本重复器</div>
      <textarea class="tool-textarea" id="trInput" rows="4" placeholder="输入要重复的文本..."></textarea>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0">
        <div style="flex:1;min-width:120px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">重复次数</label>
          <input class="tool-input" id="trCount" type="number" value="3" min="1" max="999">
        </div>
        <div style="flex:2;min-width:160px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">分隔符</label>
          <div style="display:flex;gap:6px">
            <input class="tool-input" id="trSep" placeholder="默认无分隔符" style="flex:1">
            <button class="btn btn-secondary" onclick="document.getElementById('trSep').value='\\n'">换行</button>
            <button class="btn btn-secondary" onclick="document.getElementById('trSep').value=','">逗号</button>
          </div>
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doTextRepeat()">生成</button>
        <button class="btn btn-secondary" onclick="document.getElementById('trInput').value='';document.getElementById('trOut').style.display='none'">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="trOut" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span class="panel-label" style="margin:0" id="trStats"></span>
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('trResult').textContent).then(()=>showToast('已复制'))">复制</button>
      </div>
      <pre class="result-box" id="trResult" style="white-space:pre-wrap;word-break:break-all;max-height:300px;overflow:auto"></pre>
    </div>`;
};

function doTextRepeat() {
  const text = document.getElementById('trInput').value;
  if (!text) return;
  const count = Math.min(999, Math.max(1, parseInt(document.getElementById('trCount').value) || 3));
  const sep = document.getElementById('trSep').value.replace(/\\n/g, '\n');
  const result = Array(count).fill(text).join(sep);
  document.getElementById('trResult').textContent = result;
  document.getElementById('trStats').textContent = `共 ${result.length} 字符`;
  document.getElementById('trOut').style.display = '';
}

window._activeCleanup = function() {};
