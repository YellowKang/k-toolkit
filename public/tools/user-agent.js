const _uaDict = {
  zh: {
    current: '当前 User-Agent', copy_current: '复制当前 UA', custom: '解析自定义 UA', input_ph: '粘贴任意 User-Agent 字符串...',
    parse: '解析', use_current: '使用当前', custom_result: '自定义解析结果', env: '当前环境信息', result: '解析结果',
    engine: '浏览器引擎', os: '操作系统', device: '设备类型', unknown: '未知', mobile: '移动端', tablet: '平板', desktop: '桌面端',
  },
  en: {
    current: 'Current User-Agent', copy_current: 'Copy current UA', custom: 'Parse a custom UA', input_ph: 'Paste any User-Agent string...',
    parse: 'Parse', use_current: 'Use current', custom_result: 'Custom UA details', env: 'Current environment', result: 'Parsed result',
    engine: 'Browser engine', os: 'Operating system', device: 'Device type', unknown: 'Unknown', mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop',
  },
};

function renderUserAgent(el) {
  const T = makeToolI18n(_uaDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('current')}</div>
      <div class="result-box" style="word-break:break-all;margin-bottom:12px" id="uaCurrent"></div>
      <button class="btn btn-secondary" onclick="copyText(navigator.userAgent,this)">${T('copy_current')}</button>
    </div>
    <div class="tool-card-panel" id="uaInfoPanel"></div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('custom')}</div>
      <textarea class="tool-textarea" id="uaInput" rows="3" placeholder="${T('input_ph')}"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="parseCustomUA()">${T('parse')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('uaInput').value=navigator.userAgent;parseCustomUA()">${T('use_current')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="uaParseResult" style="display:none">
      <div class="panel-label" style="margin-bottom:10px">${T('custom_result')}</div>
      <div id="uaParseOutput"></div>
    </div>`;
  document.getElementById('uaCurrent').textContent = navigator.userAgent;
  _renderUAGrid(navigator.userAgent, 'uaInfoPanel', T('env'));
}

function _parseUAInfo(ua) {
  const T = makeToolI18n(_uaDict);
  return [
    [T('engine'), /Gecko\//.test(ua)?'Gecko':/WebKit\//.test(ua)?'WebKit':T('unknown')],
    [T('os'), /Windows NT (\S+)/.exec(ua)?.[1]?'Windows '+ /Windows NT (\S+)/.exec(ua)[1]:/Mac OS X ([\d_]+)/.exec(ua)?.[1]?'macOS '+/Mac OS X ([\d_]+)/.exec(ua)[1].replace(/_/g,'.'):/Android ([\d.]+)/.exec(ua)?.[1]?'Android '+/Android ([\d.]+)/.exec(ua)[1]:/Linux/.test(ua)?'Linux':/iPhone OS ([\d_]+)/.exec(ua)?.[1]?'iOS '+/iPhone OS ([\d_]+)/.exec(ua)[1].replace(/_/g,'.'):T('unknown')],
    [T('device'), /Mobile|Android|iPhone/.test(ua)?T('mobile'):/iPad/.test(ua)?T('tablet'):T('desktop')],
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
      ${info.map(([k,v])=>`<div style="padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--glass-border);border-radius:10px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${k}</div><div style="font-weight:600;color:var(--neon)">${escHtml(String(v))}</div></div>`).join('')}
    </div>`;
}

function parseCustomUA() {
  const ua = document.getElementById('uaInput').value.trim();
  if (!ua) return;
  _renderUAGrid(ua, 'uaParseOutput', makeToolI18n(_uaDict)('result'));
  document.getElementById('uaParseResult').style.display='';
}
