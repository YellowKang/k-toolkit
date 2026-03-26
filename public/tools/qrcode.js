var _qrTl = null;

function _qrInitI18n() {
  _qrTl = makeToolI18n({
    zh: {
      title:         '二维码生成',
      placeholder:   '输入文本、URL、联系方式...',
      size:          '尺寸',
      ecc:           '纠错',
      ecc_l:         'L (低)',
      ecc_m:         'M (中)',
      ecc_q:         'Q (较高)',
      ecc_h:         'H (高)',
      style:         '样式',
      style_square:  '方块',
      style_rounded: '圆角',
      style_dots:    '圆点',
      fg_color:      '前景色',
      bg_color:      '背景色',
      logo:          'Logo',
      clear_logo:    '清除 Logo',
      generate:      '生成',
      result_title:  '二维码',
      download_png:  '下载 PNG',
      download_svg:  '下载 SVG',
      loading_lib:   '正在加载 QR 库，请稍后重试...',
      gen_fail:      '生成失败：',
    },
    en: {
      title:         'QR Code Generator',
      placeholder:   'Enter text, URL, contact info...',
      size:          'Size',
      ecc:           'ECC',
      ecc_l:         'L (Low)',
      ecc_m:         'M (Medium)',
      ecc_q:         'Q (Quartile)',
      ecc_h:         'H (High)',
      style:         'Style',
      style_square:  'Square',
      style_rounded: 'Rounded',
      style_dots:    'Dots',
      fg_color:      'Foreground',
      bg_color:      'Background',
      logo:          'Logo',
      clear_logo:    'Clear Logo',
      generate:      'Generate',
      result_title:  'QR Code',
      download_png:  'Download PNG',
      download_svg:  'Download SVG',
      loading_lib:   'Loading QR library, please retry...',
      gen_fail:      'Generation failed: ',
    }
  });
}

function renderQrCode(el) {
  _qrInitI18n();
  var tl = _qrTl;
  el.innerHTML =
    '<div class="tool-card-panel">' +
    '<div class="panel-label">' + tl('title') + '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
    '<input class="tool-input" id="qrInput" placeholder="' + tl('placeholder') + '" style="flex:1" oninput="qrAutoGen()">' +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
    '<label style="font-size:13px;color:var(--text-muted)">' + tl('size') + '</label>' +
    '<select id="qrSize" class="tool-input" style="width:auto">' +
    '<option value="200">200px</option><option value="256" selected>256px</option><option value="400">400px</option><option value="512">512px</option>' +
    '</select>' +
    '<label style="font-size:13px;color:var(--text-muted)">' + tl('ecc') + '</label>' +
    '<select id="qrEcc" class="tool-input" style="width:auto">' +
    '<option value="L">' + tl('ecc_l') + '</option><option value="M" selected>' + tl('ecc_m') + '</option><option value="Q">' + tl('ecc_q') + '</option><option value="H">' + tl('ecc_h') + '</option>' +
    '</select>' +
    '<label style="font-size:13px;color:var(--text-muted)">' + tl('style') + '</label>' +
    '<select id="qrStyle" class="tool-input" style="width:auto" onchange="qrAutoGen()">' +
    '<option value="square">' + tl('style_square') + '</option><option value="rounded">' + tl('style_rounded') + '</option><option value="dots">' + tl('style_dots') + '</option>' +
    '</select>' +
    '<label style="font-size:13px;color:var(--text-muted)">' + tl('fg_color') + '</label>' +
    '<input type="color" id="qrFg" value="#000000" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" onchange="qrAutoGen()">' +
    '<label style="font-size:13px;color:var(--text-muted)">' + tl('bg_color') + '</label>' +
    '<input type="color" id="qrBg" value="#ffffff" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" onchange="qrAutoGen()">' +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center">' +
    '<label style="font-size:13px;color:var(--text-muted)">' + tl('logo') + '</label>' +
    '<input type="file" id="qrLogo" accept="image/*" style="font-size:12px;color:var(--text-muted)">' +
    '<button class="btn btn-secondary" onclick="_qrLogoImg=null;document.getElementById(\'qrLogo\').value=\'\';qrAutoGen()" style="font-size:12px">' + tl('clear_logo') + '</button>' +
    '<button class="btn btn-primary" onclick="generateQr()">' + tl('generate') + '</button>' +
    '</div>' +
    '</div>' +
    '<div class="tool-card-panel" id="qrResult" style="display:none"></div>';
  loadQrLib();

  window._activeCleanup = function() {
    clearTimeout(_qrAutoTimer);
    _qrAutoTimer = null;
  };

  document.getElementById('qrLogo').addEventListener('change', function(e) {
    var file = e.target.files[0];
    if (!file) { _qrLogoImg = null; return; }
    var reader = new FileReader();
    reader.onload = function(ev) {
      var img = new Image();
      img.onload = function() { _qrLogoImg = img; qrAutoGen(); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

var _qrLibLoaded = false;
var _qrLibLoading = false;
var _qrAutoTimer = null;
var _qrLogoImg = null;

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
  if (!_qrTl) _qrInitI18n();
  var tl = _qrTl;
  var text = document.getElementById('qrInput').value.trim();
  var panel = document.getElementById('qrResult');
  if (!text) { panel.style.display = 'none'; return; }
  if (!_qrLibLoaded) {
    panel.style.display = '';
    panel.innerHTML = '<div style="color:var(--text-muted);font-size:13px">' + tl('loading_lib') + '</div>';
    loadQrLib();
    return;
  }
  var size = parseInt(document.getElementById('qrSize').value);
  var ecc = document.getElementById('qrEcc').value;
  var fg = document.getElementById('qrFg').value;
  var bg = document.getElementById('qrBg').value;
  if (_qrLogoImg) ecc = 'H';
  panel.style.display = '';
  panel.innerHTML = '<div class="panel-label">' + tl('result_title') + '</div>' +
    '<div style="display:flex;flex-direction:column;align-items:center;gap:14px">' +
    '<div id="qrCanvas" style="background:' + bg + ';padding:12px;border-radius:12px;display:inline-block"></div>' +
    '<div style="display:flex;gap:8px">' +
    '<button class="btn btn-secondary" onclick="downloadQr()">\u2B07 ' + tl('download_png') + '</button>' +
    '<button class="btn btn-secondary" onclick="downloadQrSvg()">\u2B07 ' + tl('download_svg') + '</button>' +
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
    setTimeout(function() {
      var canvas = document.querySelector('#qrCanvas canvas');
      if (!canvas) return;
      var style = document.getElementById('qrStyle').value;
      applyQrStyle(canvas, style, _qrLogoImg);
    }, 100);
  } catch(e) {
    panel.innerHTML = '<div style="color:#ef4444">' + tl('gen_fail') + escHtml(e.message) + '</div>';
  }
}

function applyQrStyle(canvas, style, logoImg) {
  if (style === 'square' && !logoImg) return;
  var ctx = canvas.getContext('2d');
  var size = canvas.width;
  var imageData = ctx.getImageData(0, 0, size, size);
  var fg = document.getElementById('qrFg').value;
  var bg = document.getElementById('qrBg').value;

  // Find module size by detecting first dark pixel run
  var moduleSize = 1;
  for (var x = 0; x < size; x++) {
    var i = x * 4;
    if (imageData.data[i] < 128) {
      var end = x;
      while (end < size && imageData.data[end * 4] < 128) end++;
      moduleSize = end - x;
      break;
    }
  }
  if (moduleSize < 2) moduleSize = Math.max(1, Math.round(size / 33));

  // Clear and redraw with style
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;

  for (var y = 0; y < size; y += moduleSize) {
    for (var xi = 0; xi < size; xi += moduleSize) {
      var idx = (y * size + xi) * 4;
      if (imageData.data[idx] < 128) {
        var pad = moduleSize * 0.1;
        if (style === 'dots') {
          ctx.beginPath();
          ctx.arc(xi + moduleSize / 2, y + moduleSize / 2, moduleSize / 2 - pad, 0, Math.PI * 2);
          ctx.fill();
        } else if (style === 'rounded') {
          var r = moduleSize * 0.3;
          var mx = xi + pad, my = y + pad, ms = moduleSize - pad * 2;
          ctx.beginPath();
          ctx.roundRect(mx, my, ms, ms, r);
          ctx.fill();
        } else {
          ctx.fillRect(xi, y, moduleSize, moduleSize);
        }
      }
    }
  }

  // Logo overlay
  if (logoImg) {
    var logoSize = size * 0.22;
    var lx = (size - logoSize) / 2;
    var ly = (size - logoSize) / 2;
    var lpad = 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(lx - lpad, ly - lpad, logoSize + lpad * 2, logoSize + lpad * 2, 8);
    ctx.fill();
    ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
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
  var data = ctx.getImageData(0, 0, size, size).data;
  var fg = document.getElementById('qrFg').value;
  var bg = document.getElementById('qrBg').value;
  var rects = '';
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      if (data[i] < 128) rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + fg + '"/>';
    }
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '">' +
    '<rect width="' + size + '" height="' + size + '" fill="' + bg + '"/>' + rects + '</svg>';
  var blob = new Blob([svg], { type: 'image/svg+xml' });
  var a = document.createElement('a');
  var svgUrl = URL.createObjectURL(blob);
  a.href = svgUrl;
  a.download = 'qrcode.svg';
  a.click();
  URL.revokeObjectURL(svgUrl);
}
