const _ttDict = {
  zh: {
    title: '文本模板填充', tpl_label: '模板内容', tpl_hint: '（用 {{变量名}} 定义占位符）',
    tpl_ph: '例：尊敬的 {{姓名}} 您好，您的订单 {{订单号}} 已于 {{日期}} 发货。',
    sample: '尊敬的 {{姓名}} 您好，您的订单 {{订单号}} 已于 {{日期}} 发货，预计 {{预计到达}} 送达。如有问题请联系 {{客服电话}}。',
    vars: '变量填写', batch: '批量数据模式', batch_label: 'JSON 数组数据', batch_hint: '（每条记录自动代入模板）',
    batch_ph: '[{"姓名":"张三","订单号":"A001","日期":"3月20日","预计到达":"3月23日","客服电话":"400-123"},{"姓名":"李四","订单号":"A002","日期":"3月21日","预计到达":"3月24日","客服电话":"400-123"}]',
    batch_btn: '批量生成', output: '输出结果', copy_result: '复制结果',
    batch_empty: '请输入批量 JSON 数据', batch_not_array: '数据必须是 JSON 数组', batch_parse: msg => 'JSON 解析失败: ' + msg, batch_done: n => '已生成 ' + n + ' 条结果',
  },
  en: {
    title: 'Fill a text template', tpl_label: 'Template', tpl_hint: '(define placeholders with {{name}})',
    tpl_ph: 'e.g. Dear {{name}}, your order {{order_id}} shipped on {{date}}.',
    sample: 'Dear {{name}}, your order {{order_id}} shipped on {{date}} and should arrive by {{eta}}. Questions? Call {{support_phone}}.',
    vars: 'Variables', batch: 'Batch mode', batch_label: 'JSON array data', batch_hint: '(each record fills the template once)',
    batch_ph: '[{"name":"Alice","order_id":"A001","date":"Mar 20","eta":"Mar 23","support_phone":"400-123"},{"name":"Bob","order_id":"A002","date":"Mar 21","eta":"Mar 24","support_phone":"400-123"}]',
    batch_btn: 'Generate batch', output: 'Output', copy_result: 'Copy result',
    batch_empty: 'Enter batch JSON data', batch_not_array: 'Data must be a JSON array', batch_parse: msg => 'JSON parse error: ' + msg, batch_done: n => `Generated ${n} result${n === 1 ? '' : 's'}`,
  },
};

window.renderTextTemplate = function(el) {
  const T = makeToolI18n(_ttDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('tpl_label')} <span style="opacity:.6">${T('tpl_hint')}</span></label>
      <textarea class="tool-input" id="ttTpl" rows="5"
        style="resize:vertical;font-family:monospace;font-size:13px"
        oninput="_ttParse()"
        placeholder="${T('tpl_ph')}">${T('sample')}</textarea>
    </div>
    <div class="tool-card-panel" id="ttVarsPanel">
      <div class="panel-label">${T('vars')}</div>
      <div id="ttVars" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('batch')}</div>
      <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('batch_label')} <span style="opacity:.6">${T('batch_hint')}</span></label>
      <textarea class="tool-textarea" id="ttBatchData" rows="4"
        style="resize:vertical;font-family:monospace;font-size:12px"
        placeholder='${T('batch_ph')}'></textarea>
      <div class="tool-actions" style="margin-top:8px">
        <button class="btn btn-secondary" onclick="_ttBatch()">${T('batch_btn')}</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('output')}</div>
      <div id="ttOutput" style="background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px;padding:16px;min-height:60px;white-space:pre-wrap;font-size:14px;line-height:1.7;color:var(--text-primary)"></div>
      <div class="tool-actions" style="margin-top:10px">
        <button class="btn btn-secondary" onclick="_ttCopy()">${T('copy_result')}</button>
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
    if (!batchRaw) { if (typeof showToast === 'function') showToast(T('batch_empty'), 'error'); return; }
    let dataArr;
    try {
      dataArr = JSON.parse(batchRaw);
      if (!Array.isArray(dataArr)) { if (typeof showToast === 'function') showToast(T('batch_not_array'), 'error'); return; }
    } catch(e) { if (typeof showToast === 'function') showToast(T('batch_parse', e.message), 'error'); return; }
    const results = dataArr.map(item => {
      let result = tpl;
      for (const [key, val] of Object.entries(item)) {
        result = result.split('{{' + key + '}}').join(String(val));
      }
      return result;
    });
    document.getElementById('ttOutput').textContent = results.join('\n---\n');
    if (typeof showToast === 'function') showToast(T('batch_done', results.length), 'success');
  };

  _ttRender();
};
