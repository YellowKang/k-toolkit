function renderUserAgent(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">当前 User-Agent</div>
      <div class="result-box" style="word-break:break-all;margin-bottom:12px" id="uaCurrent"></div>
      <button class="btn btn-secondary" onclick="copyText(navigator.userAgent,this)">复制当前 UA</button>
    </div>
    <div class="tool-card-panel" id="uaInfoPanel"></div>
    <div class="tool-card-panel">
      <div class="panel-label">解析自定义 UA</div>
      <textarea class="tool-textarea" id="uaInput" rows="3" placeholder="粘贴任意 User-Agent 字符串..."></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="parseCustomUA()">解析</button>
        <button class="btn btn-secondary" onclick="document.getElementById('uaInput').value=navigator.userAgent;parseCustomUA()">使用当前</button>
      </div>
    </div>
    <div class="tool-card-panel" id="uaParseResult" style="display:none">
      <div class="panel-label" style="margin-bottom:10px">自定义解析结果</div>
      <div id="uaParseOutput"></div>
    </div>`;
  document.getElementById('uaCurrent').textContent = navigator.userAgent;
  _renderUAGrid(navigator.userAgent, 'uaInfoPanel', '当前环境信息');
}

function _parseUAInfo(ua) {
  return [
    ['浏览器引擎', /Gecko\//.test(ua)?'Gecko':/WebKit\//.test(ua)?'WebKit':'未知'],
    ['操作系统', /Windows NT (\S+)/.exec(ua)?.[1]?'Windows '+ /Windows NT (\S+)/.exec(ua)[1]:/Mac OS X ([\d_]+)/.exec(ua)?.[1]?'macOS '+/Mac OS X ([\d_]+)/.exec(ua)[1].replace(/_/g,'.'):/Android ([\d.]+)/.exec(ua)?.[1]?'Android '+/Android ([\d.]+)/.exec(ua)[1]:/Linux/.test(ua)?'Linux':/iPhone OS ([\d_]+)/.exec(ua)?.[1]?'iOS '+/iPhone OS ([\d_]+)/.exec(ua)[1].replace(/_/g,'.'):'未知'],
    ['设备类型', /Mobile|Android|iPhone/.test(ua)?'移动端':/iPad/.test(ua)?'平板':'桌面端'],
    ['Chrome', ua.match(/Chrome\/([\d.]+)/)?.[1]||'-'],
    ['Firefox', ua.match(/Firefox\/([\d.]+)/)?.[1]||'-'],
    ['Safari', ua.match(/Version\/([\d.]+).*Safari/)?.[1]||'-'],
    ['Edge', ua.match(/Edg\/([\d.]+)/)?.[1]||'-'],
  ];
}

function _renderUAGrid(ua, id, title) {
  const info = _parseUAInfo(ua);
  document.getElementById(id).innerHTML = `
    <div class="panel-label" style="margin-bottom:10px">${title}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
      ${info.map(([k,v])=>`<div style="padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${k}</div><div style="font-weight:600;color:var(--neon)">${v}</div></div>`).join('')}
    </div>`;
}

function parseCustomUA() {
  const ua = document.getElementById('uaInput').value.trim();
  if (!ua) return;
  _renderUAGrid(ua, 'uaParseOutput', '解析结果');
  document.getElementById('uaParseResult').style.display='';
}
