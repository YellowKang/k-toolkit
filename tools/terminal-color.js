window.renderTerminalColor = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">终端颜色码生成</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div style="flex:1;min-width:160px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">文本内容</label>
          <input class="tool-input" id="tcText" placeholder="Hello World" value="Hello World" oninput="doTc()">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">前景色</label>
          <select class="tool-input" id="tcFg" onchange="doTc()">
            <option value="">默认</option>
            <option value="30">黑色</option><option value="31">红色</option><option value="32">绿色</option>
            <option value="33">黄色</option><option value="34">蓝色</option><option value="35">紫色</option>
            <option value="36">青色</option><option value="37">白色</option>
            <option value="90">亮黑</option><option value="91">亮红</option><option value="92">亮绿</option>
            <option value="93">亮黄</option><option value="94">亮蓝</option><option value="95">亮紫</option>
            <option value="96">亮青</option><option value="97">亮白</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">背景色</label>
          <select class="tool-input" id="tcBg" onchange="doTc()">
            <option value="">默认</option>
            <option value="40">黑色</option><option value="41">红色</option><option value="42">绿色</option>
            <option value="43">黄色</option><option value="44">蓝色</option><option value="45">紫色</option>
            <option value="46">青色</option><option value="47">白色</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">样式</label>
          <select class="tool-input" id="tcStyle" onchange="doTc()">
            <option value="">普通</option><option value="1">粗体</option><option value="2">暗淡</option>
            <option value="3">斜体</option><option value="4">下划线</option><option value="7">反转</option>
          </select>
        </div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">预览 & 代码</div>
      <div id="tcPreview" style="font-family:monospace;font-size:16px;padding:14px;background:#1a1a1a;border-radius:8px;margin-bottom:12px"></div>
      <div style="display:flex;gap:8px;align-items:center">
        <pre class="result-box" id="tcCode" style="flex:1;margin:0;font-size:13px"></pre>
        <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('tcCode').textContent).then(()=>showToast('已复制'))">复制</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">标准色板（点击选择前景色）</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px" id="tcPalette"></div>
    </div>`;
  const colors = [
    {code:'30',bg:'#000',label:'黑'},{code:'31',bg:'#c00',label:'红'},{code:'32',bg:'#0c0',label:'绿'},
    {code:'33',bg:'#cc0',label:'黄'},{code:'34',bg:'#00c',label:'蓝'},{code:'35',bg:'#c0c',label:'紫'},
    {code:'36',bg:'#0cc',label:'青'},{code:'37',bg:'#ccc',label:'白'},
    {code:'90',bg:'#555',label:'亮黑'},{code:'91',bg:'#f55',label:'亮红'},{code:'92',bg:'#5f5',label:'亮绿'},
    {code:'93',bg:'#ff5',label:'亮黄'},{code:'94',bg:'#55f',label:'亮蓝'},{code:'95',bg:'#f5f',label:'亮紫'},
    {code:'96',bg:'#5ff',label:'亮青'},{code:'97',bg:'#fff',label:'亮白'},
  ];
  document.getElementById('tcPalette').innerHTML = colors.map(c =>
    `<button onclick="document.getElementById('tcFg').value='${c.code}';doTc()" title="${c.label} (${c.code})" style="width:32px;height:32px;background:${c.bg};border:1px solid var(--glass-border);border-radius:6px;cursor:pointer"></button>`
  ).join('');
  doTc();
};

function doTc() {
  const text = document.getElementById('tcText').value || 'Hello';
  const fg = document.getElementById('tcFg').value;
  const bg = document.getElementById('tcBg').value;
  const style = document.getElementById('tcStyle').value;
  const codes = [style, fg, bg].filter(Boolean).join(';');
  const ansi = codes ? `\x1b[${codes}m${text}\x1b[0m` : text;
  const codeStr = codes ? `\\e[${codes}m${text}\\e[0m` : text;
  document.getElementById('tcCode').textContent = `echo -e "${codeStr}"`;
  const fgColorMap = {'30':'#000','31':'#c00','32':'#0c0','33':'#cc0','34':'#55f','35':'#c0c','36':'#0cc','37':'#ccc','90':'#555','91':'#f55','92':'#5f5','93':'#ff5','94':'#55f','95':'#f5f','96':'#5ff','97':'#fff'};
  const bgColorMap = {'40':'#000','41':'#c00','42':'#0c0','43':'#cc0','44':'#00c','45':'#c0c','46':'#0cc','47':'#ccc'};
  const styleMap = {'1':'font-weight:bold','2':'opacity:0.5','3':'font-style:italic','4':'text-decoration:underline','7':'filter:invert(1)'};
  const fgStyle = fg ? `color:${fgColorMap[fg]||'inherit'}` : 'color:#ccc';
  const bgStyle = bg ? `background:${bgColorMap[bg]||'inherit'}` : '';
  const txStyle = style ? styleMap[style]||'' : '';
  document.getElementById('tcPreview').innerHTML =
    `<span style="${fgStyle};${bgStyle};${txStyle};padding:2px 4px">${text}</span>`;
}

window._activeCleanup = function() {};
