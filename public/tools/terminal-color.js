const _tcDict = {
  zh: {
    title: '终端颜色码生成', text: '文本内容', fg: '前景色', bg: '背景色', style: '样式', default: '默认',
    preview: '预览 & 代码', copy: '复制', palette: '标准色板（点击选择前景色）',
    colors: ['黑色','红色','绿色','黄色','蓝色','紫色','青色','白色'], short: ['黑','红','绿','黄','蓝','紫','青','白'],
    bright: ['亮黑','亮红','亮绿','亮黄','亮蓝','亮紫','亮青','亮白'], styles: ['普通','粗体','暗淡','斜体','下划线','反转'],
  },
  en: {
    title: 'Terminal color codes', text: 'Text', fg: 'Foreground', bg: 'Background', style: 'Style', default: 'Default',
    preview: 'Preview & code', copy: 'Copy', palette: 'Standard palette (click to set the foreground)',
    colors: ['Black','Red','Green','Yellow','Blue','Magenta','Cyan','White'], short: ['Black','Red','Green','Yellow','Blue','Magenta','Cyan','White'],
    bright: ['Bright black','Bright red','Bright green','Bright yellow','Bright blue','Bright magenta','Bright cyan','Bright white'], styles: ['Normal','Bold','Dim','Italic','Underline','Inverse'],
  },
};
const TC_STYLE_CODES = ['', '1', '2', '3', '4', '7'];

window.renderTerminalColor = function(el) {
  const T = makeToolI18n(_tcDict);
  const names = T('colors'), bright = T('bright'), short = T('short');
  const option = (value, label) => `<option value="${value}">${label}</option>`;
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <div style="flex:1;min-width:160px">
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('text')}</label>
          <input class="tool-input" id="tcText" placeholder="Hello World" value="Hello World" oninput="doTc()">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('fg')}</label>
          <select class="tool-input" id="tcFg" onchange="doTc()">
            ${option('', T('default'))}${names.map((name, i) => option(30 + i, name)).join('')}${bright.map((name, i) => option(90 + i, name)).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('bg')}</label>
          <select class="tool-input" id="tcBg" onchange="doTc()">
            ${option('', T('default'))}${names.map((name, i) => option(40 + i, name)).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">${T('style')}</label>
          <select class="tool-input" id="tcStyle" onchange="doTc()">
            ${T('styles').map((name, i) => option(TC_STYLE_CODES[i], name)).join('')}
          </select>
        </div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('preview')}</div>
      <div id="tcPreview" style="font-family:monospace;font-size:16px;padding:14px;background:#1a1a1a;border-radius:8px;margin-bottom:12px"></div>
      <div style="display:flex;gap:8px;align-items:center">
        <pre class="result-box" id="tcCode" style="flex:1;margin:0;font-size:13px"></pre>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('tcCode').textContent,this)">${T('copy')}</button>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">${T('palette')}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px" id="tcPalette"></div>
    </div>`;
  const swatches = ['#000','#c00','#0c0','#cc0','#00c','#c0c','#0cc','#ccc'], brightSwatches = ['#555','#f55','#5f5','#ff5','#55f','#f5f','#5ff','#fff'];
  const colors = [
    ...swatches.map((bg, i) => ({ code: String(30 + i), bg, label: short[i] })),
    ...brightSwatches.map((bg, i) => ({ code: String(90 + i), bg, label: bright[i] })),
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
    `<span style="${fgStyle};${bgStyle};${txStyle};padding:2px 4px">${escHtml(text)}</span>`;
}