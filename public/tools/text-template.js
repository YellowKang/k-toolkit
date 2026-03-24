window.renderTextTemplate = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">文本模板填充</div>
      <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">模板内容 <span style="opacity:.6">（用 {{变量名}} 定义占位符）</span></label>
      <textarea class="tool-input" id="ttTpl" rows="5"
        style="resize:vertical;font-family:monospace;font-size:13px"
        oninput="_ttParse()"
        placeholder="例：尊敬的 {{姓名}} 您好，您的订单 {{订单号}} 已于 {{日期}} 发货。">尊敬的 {{姓名}} 您好，您的订单 {{订单号}} 已于 {{日期}} 发货，预计 {{预计到达}} 送达。如有问题请联系 {{客服电话}}。</textarea>
    </div>
    <div class="tool-card-panel" id="ttVarsPanel">
      <div class="panel-label">变量填写</div>
      <div id="ttVars" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">批量数据模式</div>
      <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">JSON 数组数据 <span style="opacity:.6">（每条记录自动代入模板）</span></label>
      <textarea class="tool-textarea" id="ttBatchData" rows="4"
        style="resize:vertical;font-family:monospace;font-size:12px"
        placeholder='[{"姓名":"张三","订单号":"A001","日期":"3月20日","预计到达":"3月23日","客服电话":"400-123"},{"姓名":"李四","订单号":"A002","日期":"3月21日","预计到达":"3月24日","客服电话":"400-123"}]'></textarea>
      <div class="tool-actions" style="margin-top:8px">
        <button class="btn btn-secondary" onclick="_ttBatch()">批量生成</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">输出结果</div>
      <div id="ttOutput" style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:16px;min-height:60px;white-space:pre-wrap;font-size:14px;line-height:1.7;color:var(--text-primary)"></div>
      <div class="tool-actions" style="margin-top:10px">
        <button class="btn btn-secondary" onclick="_ttCopy()">复制结果</button>
      </div>
    </div>`;

  function _ttEsc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function _ttRender() {
    const tpl = document.getElementById('ttTpl').value;
    const varsEl = document.getElementById('ttVars');
    const matches = [...tpl.matchAll(/\{\{([^}]+)\}\}/g)];
    const seen = new Set();
    const names = [];
    for (const m of matches) {
      const name = m[1].trim();
      if (!seen.has(name)) { seen.add(name); names.push(name); }
    }
    // preserve existing values
    const oldVals = {};
    varsEl.querySelectorAll('input[data-var]').forEach(inp => {
      oldVals[inp.dataset.var] = inp.value;
    });
    varsEl.innerHTML = names.map(n => `
      <div>
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px">${_ttEsc(n)}</label>
        <input class="tool-input" data-var="${_ttEsc(n)}" placeholder="${_ttEsc(n)}" oninput="_ttUpdate()" value="${_ttEsc(oldVals[n]||'')}">
      </div>`).join('');
    _ttUpdate();
  }

  window._ttParse = _ttRender;

  window._ttUpdate = function() {
    let tpl = document.getElementById('ttTpl').value;
    document.getElementById('ttVars').querySelectorAll('input[data-var]').forEach(inp => {
      tpl = tpl.split('{{' + inp.dataset.var + '}}').join(inp.value || ('{{' + inp.dataset.var + '}}'));
    });
    document.getElementById('ttOutput').textContent = tpl;
  };

  window._ttCopy = function() {
    const text = document.getElementById('ttOutput').textContent;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  window._ttBatch = function() {
    const tpl = document.getElementById('ttTpl').value;
    const batchRaw = document.getElementById('ttBatchData').value.trim();
    if (!batchRaw) { if (typeof showToast === 'function') showToast('请输入批量 JSON 数据', 'error'); return; }
    let dataArr;
    try {
      dataArr = JSON.parse(batchRaw);
      if (!Array.isArray(dataArr)) { if (typeof showToast === 'function') showToast('数据必须是 JSON 数组', 'error'); return; }
    } catch(e) { if (typeof showToast === 'function') showToast('JSON 解析失败: ' + e.message, 'error'); return; }
    const results = dataArr.map(item => {
      let result = tpl;
      for (const [key, val] of Object.entries(item)) {
        result = result.split('{{' + key + '}}').join(String(val));
      }
      return result;
    });
    document.getElementById('ttOutput').textContent = results.join('\n---\n');
    if (typeof showToast === 'function') showToast('已生成 ' + results.length + ' 条结果', 'success');
  };

  _ttRender();
};
