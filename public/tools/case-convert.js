function renderCaseConvert(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">输入文本</div>
        <button class="btn btn-secondary" onclick="ccLoadSample()">示例</button>
      </div>
      <textarea class="tool-textarea" id="ccText" rows="5" placeholder="输入要转换的文本..."></textarea>
      <div class="tool-actions" style="flex-wrap:wrap;gap:8px">
        <button class="btn btn-primary" onclick="ccConvert('camel')">camelCase</button>
        <button class="btn btn-primary" onclick="ccConvert('pascal')">PascalCase</button>
        <button class="btn btn-secondary" onclick="ccConvert('snake')">snake_case</button>
        <button class="btn btn-secondary" onclick="ccConvert('kebab')">kebab-case</button>
        <button class="btn btn-secondary" onclick="ccConvert('upper')">UPPER_CASE</button>
        <button class="btn btn-secondary" onclick="ccConvert('lower')">lower case</button>
        <button class="btn btn-secondary" onclick="ccConvert('title')">Title Case</button>
        <button class="btn btn-secondary" onclick="ccConvert('dot')">dot.case</button>
        <button class="btn btn-secondary" onclick="ccConvert('path')">path/case</button>
        <button class="btn btn-secondary" onclick="ccConvert('sentence')">Sentence case</button>
      </div>
    </div>
    <div class="tool-card-panel" id="ccResultPanel" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="ccStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('ccOutput').textContent,this)">复制结果</button>
      </div>
      <div class="result-box" id="ccOutput" style="word-break:break-all;font-family:monospace"></div>
    </div>`;
}

function _ccWords(text) {
  return text
    .replace(/([a-z])([A-Z])/g,'$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2')
    .replace(/[-_./\\]+/g,' ')
    .trim().split(/\s+/).filter(Boolean);
}

function ccConvert(fmt) {
  const text = document.getElementById('ccText').value;
  if (!text.trim()) return;
  const words = _ccWords(text);
  const labels = {camel:'camelCase',pascal:'PascalCase',snake:'snake_case',kebab:'kebab-case',upper:'UPPER_CASE',lower:'lower case',title:'Title Case',dot:'dot.case',path:'path/case',sentence:'Sentence case'};
  let result = '';
  switch(fmt) {
    case 'camel':    result = words.map((w,i) => i===0?w.toLowerCase():w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
    case 'pascal':   result = words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(''); break;
    case 'snake':    result = words.map(w => w.toLowerCase()).join('_'); break;
    case 'kebab':    result = words.map(w => w.toLowerCase()).join('-'); break;
    case 'upper':    result = words.map(w => w.toUpperCase()).join('_'); break;
    case 'lower':    result = words.map(w => w.toLowerCase()).join(' '); break;
    case 'title':    result = words.map(w => w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' '); break;
    case 'dot':      result = words.map(w => w.toLowerCase()).join('.'); break;
    case 'path':     result = words.map(w => w.toLowerCase()).join('/'); break;
    case 'sentence': result = words.map((w,i) => i===0?w[0].toUpperCase()+w.slice(1).toLowerCase():w.toLowerCase()).join(' '); break;
  }
  document.getElementById('ccOutput').textContent = result;
  document.getElementById('ccStatus').textContent = '✓ ' + labels[fmt];
  document.getElementById('ccStatus').style.color = '#10b981';
  document.getElementById('ccResultPanel').style.display = '';
}

function ccLoadSample() {
  document.getElementById('ccText').value = 'hello world foo bar';
}
