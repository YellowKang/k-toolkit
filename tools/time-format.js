window.renderTimeFormat = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">时间格式转换</div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="tool-input" id="tfInput" placeholder="输入时间戳(秒/毫秒)或日期字符串" style="flex:1" oninput="doTimeFormat()">
        <button class="btn btn-secondary" onclick="document.getElementById('tfInput').value=Date.now();doTimeFormat()">现在</button>
        <button class="btn btn-secondary" onclick="document.getElementById('tfInput').value='';document.getElementById('tfResult').style.display='none'">清空</button>
      </div>
    </div>
    <div class="tool-card-panel" id="tfResult" style="display:none">
      <div id="tfCards"></div>
    </div>`;
};

function doTimeFormat() {
  const raw = document.getElementById('tfInput').value.trim();
  if (!raw) return;
  let d;
  if (/^\d{10}$/.test(raw)) d = new Date(+raw * 1000);
  else if (/^\d{13}$/.test(raw)) d = new Date(+raw);
  else d = new Date(raw);
  if (isNaN(d.getTime())) {
    document.getElementById('tfCards').innerHTML = '<span style="color:#ef4444">无法解析该时间格式</span>';
    document.getElementById('tfResult').style.display = '';
    return;
  }
  const pad = n => String(n).padStart(2,'0');
  const Y=d.getFullYear(),M=pad(d.getMonth()+1),D=pad(d.getDate()),h=pad(d.getHours()),m=pad(d.getMinutes()),s=pad(d.getSeconds());
  const rows = [
    ['时间戳（秒）', Math.floor(d.getTime()/1000)],
    ['时间戳（毫秒）', d.getTime()],
    ['ISO 8601', d.toISOString()],
    ['本地日期时间', `${Y}-${M}-${D} ${h}:${m}:${s}`],
    ['日期', `${Y}-${M}-${D}`],
    ['时间', `${h}:${m}:${s}`],
    ['UTC 字符串', d.toUTCString()],
    ['可读格式', d.toLocaleString('zh-CN',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})],
  ];
  document.getElementById('tfCards').innerHTML = rows.map(([k,v]) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--glass-border)">
      <span style="font-size:12px;color:var(--text-muted);min-width:130px">${k}</span>
      <span style="font-size:13px;color:var(--text);font-family:monospace">${v}</span>
      <button onclick="navigator.clipboard.writeText('${v}').then(()=>showToast('已复制'))" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:12px;padding:2px 6px">复制</button>
    </div>`
  ).join('');
  document.getElementById('tfResult').style.display = '';
}

window._activeCleanup = function() {};
