function renderQrCode(el) {
  el.innerHTML =
    '<div class="tool-card-panel">' +
    '<div class="panel-label">二维码生成</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<input class="tool-input" id="qrInput" placeholder="输入文本、URL、联系方式..." style="flex:1" oninput="qrAutoGen()">' +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
    '<label style="font-size:13px;color:var(--text-muted)">尺寸</label>' +
    '<select id="qrSize" class="tool-input" style="width:auto">' +
    '<option value="200">200px</option><option value="256" selected>256px</option><option value="400">400px</option><option value="512">512px</option>' +
    '</select>' +
    '<label style="font-size:13px;color:var(--text-muted)">纠错</label>' +
    '<select id="qrEcc" class="tool-input" style="width:auto">' +
    '<option value="L">L (低)</option><option value="M" selected>M (中)</option><option value="Q">Q (较高)</option><option value="H">H (高)</option>' +
    '</select>' +
    '<label style="font-size:13px;color:var(--text-muted)">前景色</label>' +
    '<input type="color" id="qrFg" value="#000000" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" onchange="qrAutoGen()">' +
    '<label style="font-size:13px;color:var(--text-muted)">背景色</label>' +
    '<input type="color" id="qrBg" value="#ffffff" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" onchange="qrAutoGen()">' +
    '<button class="btn btn-primary" onclick="generateQr()">生成</button>' +
    '</div></div>' +
    '<div class="tool-card-panel" id="qrResult" style="display:none"></div>';
  loadQrLib();
}

var _qrLibLoaded = false;
var _qrLibLoading = false;
var _qrAutoTimer = null;

function loadQrLib() {
  if (_qrLibLoaded || _qrLibLoading) return;
  _qrLibLoading = true;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
  s.onload = function() { _qrLibLoaded = true; _qrLibLoading = false; };
  document.head.appendChild(s);
}

function qrAutoGen() {
  if (_qrAutoTimer) clearTimeout(_qrAutoTimer);
  _qrAutoTimer = setTimeout(generateQr, 600);
}

function generateQr() {
  var text = document.getElementById('qrInput').value.trim();
  var panel = document.getElementById('qrResult');
  if (!text) { panel.style.display = 'none'; return; }
  if (!_qrLibLoaded) {
    panel.style.display = '';
    panel.innerHTML = '<div style="color:var(--text-muted);font-size:13px">正在加载 QR 库，请稍后重试...</div>';
    loadQrLib();
    return;
  }
  var size = parseInt(document.getElementById('qrSize').value);
  var ecc = document.getElementById('qrEcc').value;
  var fg = document.getElementById('qrFg').value;
  var bg = document.getElementById('qrBg').value;
  panel.style.display = '';
  panel.innerHTML = '<div class="panel-label">二维码</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;gap:14px">' +
    '<div id="qrCanvas" style="background:' + bg + ';padding:12px;border-radius:12px;display:inline-block"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-secondary" onclick="downloadQr()">⬇ 下载 PNG</button>' +
    '<button class="btn btn-secondary" onclick="downloadQrSvg()">⬇ 下载 SVG</button>' +
    '</div></div>';
  document.getElementById('qrCanvas').innerHTML = '';
  try {
    new QRCode(document.getElementById('qrCanvas'), {
      text: text,
      width: size,
      height: size,
      colorDark: fg,
      colorLight: bg,
      correctLevel: QRCode.CorrectLevel[ecc]
    });
  } catch(e) {
    panel.innerHTML = '<div style="color:#ef4444">生成失败：' + escHtml(e.message) + '</div>';
  }
}

function downloadQr() {
  var canvas = document.querySelector('#qrCanvas canvas');
  var img = document.querySelector('#qrCanvas img');
  var src = canvas ? canvas.toDataURL() : (img ? img.src : null);
  if (!src) return;
  var a = document.createElement('a');
  a.href = src;
  a.download = 'qrcode.png';
  a.click();
}

function downloadQrSvg() {
  var canvas = document.querySelector('#qrCanvas canvas');
  if (!canvas) return;
  var size = canvas.width;
  var ctx = canvas.getContext('2d');
  var data = ctx.getImageData(0,0,size,size).data;
  var fg = document.getElementById('qrFg').value;
  var bg = document.getElementById('qrBg').value;
  var cell = 1;
  var rects = '';
  for (var y=0;y<size;y++) {
    for (var x=0;x<size;x++) {
      var i=(y*size+x)*4;
      if (data[i]<128) rects += '<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+fg+'"/>';
    }
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'"><rect width="'+size+'" height="'+size+'" fill="'+bg+'"/>'+rects+'</svg>';
  var blob = new Blob([svg],{type:'image/svg+xml'});
  var a = document.createElement('a');
  var svgUrl = URL.createObjectURL(blob);
  a.href = svgUrl;
  a.download = 'qrcode.svg';
  a.click();
  URL.revokeObjectURL(svgUrl);
}
