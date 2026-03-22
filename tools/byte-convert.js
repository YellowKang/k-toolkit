function renderByteConvert(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">存储单位换算</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;margin-bottom:16px">
        <div>
          <input class="tool-input" id="bcVal" type="number" value="1" oninput="bcCalc()">
          <select class="tool-input" id="bcUnit" style="margin-top:8px" onchange="bcCalc()">
            <option value="1">字节 (B)</option>
            <option value="1024">KB</option>
            <option value="1048576" selected>MB</option>
            <option value="1073741824">GB</option>
            <option value="1099511627776">TB</option>
            <option value="1125899906842624">PB</option>
          </select>
        </div>
        <div style="color:var(--accent);font-size:20px">=</div>
        <div id="bcMain" style="color:var(--neon);font-weight:700;font-size:18px"></div>
      </div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">全部单位</div>
      <div id="bcAll"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label" style="margin-bottom:10px">网络速度换算</div>
      <div style="display:flex;gap:12px;margin-bottom:10px">
        <input class="tool-input" id="bpsVal" type="number" value="100" style="flex:1" oninput="bpsCalc()">
        <select class="tool-input" id="bpsUnit" style="width:120px" onchange="bpsCalc()">
          <option value="1">bps</option>
          <option value="1000">Kbps</option>
          <option value="1000000" selected>Mbps</option>
          <option value="1000000000">Gbps</option>
        </select>
      </div>
      <div id="bpsResult"></div>
    </div>`;
  bcCalc(); bpsCalc();
}

function bcCalc() {
  const bytes = parseFloat(document.getElementById('bcVal').value||0) * parseFloat(document.getElementById('bcUnit').value);
  const units = [['PB',1125899906842624],['TB',1099511627776],['GB',1073741824],['MB',1048576],['KB',1024],['字节(B)',1]];
  document.getElementById('bcMain').textContent = bytes.toLocaleString() + ' 字节';
  document.getElementById('bcAll').innerHTML = units.map(([u,f])=>{
    const v = bytes/f;
    return `<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);width:70px">${u}</span><span style="color:var(--neon);font-weight:600;flex:1">${v<0.001&&v>0?v.toExponential(3):parseFloat(v.toFixed(6))}</span><button class="copy-inline" onclick="copyText('${parseFloat(v.toFixed(6))}',this)">复制</button></div>`;
  }).join('');
}

function bpsCalc() {
  const bps = parseFloat(document.getElementById('bpsVal').value||0) * parseFloat(document.getElementById('bpsUnit').value);
  const Bps = bps/8;
  const items = [['下载速度',Bps,'B/s'],['KB/s',Bps/1024,'KB/s'],['MB/s',Bps/1048576,'MB/s'],['传输1GB需要',1073741824/Bps,'秒']];
  document.getElementById('bpsResult').innerHTML = items.map(([l,v,u])=>
    `<div class="result-row" style="margin-bottom:6px"><span style="color:var(--text-muted);width:110px">${l}</span><span style="color:var(--accent);font-weight:600">${parseFloat(v.toFixed(4))} ${u}</span></div>`
  ).join('');
}
