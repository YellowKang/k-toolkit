const _wcDict = {
  zh: {
    input: '输入文本', sample: '示例', clear: '清空', input_ph: '粘贴或输入文本...', freq: '字符频率 Top 10',
    chars: '字符总数', no_space: '不含空格', words: '单词数', lines: '行数', paras: '段落数',
    chinese: '中文字数', english: '英文单词', digits: '数字', sentences: '句子数',
    sample_text: 'DevToolbox 是一个全能开发工具箱，提供 53 个实用工具。\n\n涵盖文本处理、编码加密、计算工具、时间工具、效率工具等多个分类。\n\n每个工具都经过精心设计，力求简洁易用，提升开发效率。',
  },
  en: {
    input: 'Input text', sample: 'Sample', clear: 'Clear', input_ph: 'Paste or type text...', freq: 'Top 10 characters',
    chars: 'Characters', no_space: 'Excluding spaces', words: 'Words', lines: 'Lines', paras: 'Paragraphs',
    chinese: 'Chinese characters', english: 'English words', digits: 'Digits', sentences: 'Sentences',
    sample_text: 'DevToolbox is an all-in-one developer toolbox with 53 handy tools.\n\nIt covers text processing, encoding, calculators, time and productivity tools.\n\nEvery tool is carefully designed to stay simple and make development faster.',
  },
};

function renderWordCount(el) {
  const T = makeToolI18n(_wcDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0">${T('input')}</div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary" onclick="wcLoadSample()">${T('sample')}</button>
          <button class="btn btn-secondary" onclick="wcClear()">${T('clear')}</button>
        </div>
      </div>
      <textarea class="tool-textarea" id="wcInput" rows="10" placeholder="${T('input_ph')}"></textarea>
    </div>
    <div id="wcStats" style="display:none">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:16px" id="wcGrid"></div>
      <div class="tool-card-panel">
        <div class="panel-label" style="margin-bottom:10px">${T('freq')}</div>
        <div id="wcFreq"></div>
      </div>
    </div>`;

  document.getElementById('wcInput').addEventListener('input', wcUpdate);
}

function wcUpdate() {
  const text = document.getElementById('wcInput').value;
  const stats = document.getElementById('wcStats');
  if (!text) { stats.style.display = 'none'; return; }
  stats.style.display = '';

  const chars   = text.length;
  const noSpace = text.replace(/\s/g,'').length;
  const words   = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines   = text.split('\n').length;
  const paras   = text.split(/\n\s*\n/).filter(p=>p.trim()).length;
  const chinese = (text.match(/[\u4e00-\u9fa5]/g)||[]).length;
  const english = (text.match(/[a-zA-Z]+/g)||[]).length;
  const digits  = (text.match(/\d/g)||[]).length;
  const sentences = (text.match(/[.!?。！？…]+/g)||[]).length;

  const T = makeToolI18n(_wcDict);
  const items = [
    {label:T('chars'),    val:chars,    color:'var(--accent)'},
    {label:T('no_space'), val:noSpace,  color:'#67e8f9'},
    {label:T('words'),    val:words,    color:'#f093fb'},
    {label:T('lines'),    val:lines,    color:'#fbbf24'},
    {label:T('paras'),    val:paras,    color:'#34d399'},
    {label:T('chinese'),  val:chinese,  color:'#f87171'},
    {label:T('english'),  val:english,  color:'#a78bfa'},
    {label:T('digits'),   val:digits,   color:'#38bdf8'},
    {label:T('sentences'),val:sentences,color:'#fb923c'},
  ];

  document.getElementById('wcGrid').innerHTML = items.map(item =>
    `<div style="padding:16px 14px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:12px;text-align:center">
      <div style="font-size:26px;font-weight:800;color:${item.color}">${item.val.toLocaleString()}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${item.label}</div>
    </div>`).join('');

  // 字符频率
  const freq = {};
  for (const c of text.replace(/\s/g,'')) freq[c] = (freq[c]||0)+1;
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const maxF = top[0]?.[1] || 1;
  document.getElementById('wcFreq').innerHTML = top.map(([c,n]) =>
    `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
      <span style="font-family:monospace;font-size:14px;font-weight:700;color:var(--neon);width:24px;text-align:center">${escHtml(c)}</span>
      <div style="flex:1;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${(n/maxF*100).toFixed(1)}%;background:linear-gradient(90deg,var(--accent),var(--accent3));border-radius:4px;transition:width 0.4s"></div>
      </div>
      <span style="font-size:12px;color:var(--text-muted);min-width:32px;text-align:right">${n}</span>
    </div>`).join('');
}

function wcClear() {
  document.getElementById('wcInput').value = '';
  document.getElementById('wcStats').style.display = 'none';
}

function wcLoadSample() {
  document.getElementById('wcInput').value = makeToolI18n(_wcDict)('sample_text');
  wcUpdate();
}
