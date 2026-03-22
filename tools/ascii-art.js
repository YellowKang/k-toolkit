function renderAsciiArt(el) {
  const fonts = {
    'banner': {A:'  ###  ',B:'### ',C:' ###',D:'##  ',E:'####',F:'###',G:' ###',H:'#  #',I:'###',J:'  ##',K:'# # ',L:'#   ',M:'#   #',N:'#  #',O:' ## ',P:'### ',Q:' ## ',R:'### ',S:' ###',T:'###',U:'#  #',V:'#  #',W:'#   #',X:'#  #',Y:'#  #',Z:'####'},
  };
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">ASCII 艺术字生成</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px">
        <input class="tool-input" id="aaInput" placeholder="输入文字（建议英文/数字）" style="flex:1" oninput="aaGenerate()">
        <select class="tool-input" id="aaStyle" style="width:140px" onchange="aaGenerate()">
          <option value="big">大号字体</option>
          <option value="box">框框字体</option>
          <option value="shadow">阴影字体</option>
          <option value="double">双线字体</option>
        </select>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="aaGenerate()">生成</button>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('aaOutput').textContent,this)">复制</button>
        <button class="btn btn-secondary" onclick="document.getElementById('aaInput').value='Hello';aaGenerate()">示例</button>
      </div>
    </div>
    <div class="tool-card-panel" id="aaResultPanel" style="display:none">
      <div class="panel-label" style="margin-bottom:10px">输出结果</div>
      <pre class="result-box" id="aaOutput" style="font-size:11px;line-height:1.3;letter-spacing:0"></pre>
    </div>`;
  document.getElementById('aaInput').value='Hello';
  aaGenerate();
}

function aaGenerate() {
  const text = (document.getElementById('aaInput').value||'').toUpperCase().slice(0,20);
  const style = document.getElementById('aaStyle').value;
  if (!text.trim()) return;
  let out = '';
  if (style==='box') {
    const top='┌'+text.split('').map(()=>'───').join('┬')+'┐';
    const mid='│'+text.split('').map(c=>' '+c+' ').join('│')+'│';
    const bot='└'+text.split('').map(()=>'───').join('┴')+'┘';
    out=[top,mid,bot].join('\n');
  } else if (style==='double') {
    out='╔'+'═'.repeat(text.length*3+2)+'╗\n║ '+text.split('').join('  ')+' ║\n╚'+'═'.repeat(text.length*3+2)+'╝';
  } else if (style==='shadow') {
    out=text.split('').map(c=>c).join(' ')+'\n'+text.split('').map(c=>c.toLowerCase()).join(' ')+'\n'+'▀'.repeat(text.length*2);
  } else {
    // big block letters using full-width
    out=text.split('').map(c=>String.fromCodePoint(c.codePointAt(0)+(c>='A'&&c<='Z'?65248:c>='0'&&c<='9'?65248:0))).join(' ');
    out+='\n'+text.split('').map(c=>c>='A'&&c<='Z'?'\u0332'+c:'_').join(' ');
  }
  document.getElementById('aaOutput').textContent=out;
  document.getElementById('aaResultPanel').style.display='';
}
