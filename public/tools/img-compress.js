function renderImgCompress(el) {
  el.innerHTML =
    '<div class="tool-card-panel">' +
    '<div class="panel-label">图片压缩 / 格式转换</div>' +
    '<div id="imgDropZone" style="border:2px dashed var(--glass-border);border-radius:14px;padding:40px;text-align:center;cursor:pointer;transition:border-color 0.2s;margin-bottom:14px" onclick="document.getElementById(\"imgFileInput\").click()" ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\'" ondragleave="this.style.borderColor=\'var(--glass-border)\'" ondrop="handleImgDrop(event)">' +
    '<div style="font-size:2.5em;margin-bottom:8px">🖼️</div>' +
    '<div style="color:var(--text-muted);font-size:14px">拖拽图片到此处，或点击选择文件</div>' +
    '<div style="color:var(--text-muted);font-size:12px;margin-top:4px">支持 JPG / PNG / WebP / GIF</div>' +
    '</div>' +
    '<input type="file" id="imgFileInput" accept="image/*" style="display:none" onchange="handleImgFile(this.files[0])">' +
    '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center">' +
    '<label style="font-size:13px;color:var(--text-muted)">质量</label>' +
    '<input type="range" id="imgQuality" min="10" max="100" value="80" style="flex:1;min-width:120px" oninput="document.getElementById(\'imgQualVal\').textContent=this.value+\'%\'">' +
    '<span id="imgQualVal" style="color:var(--neon);font-family:monospace;font-weight:700">80%</span>' +
    '<label style="font-size:13px;color:var(--text-muted)">格式</label>' +
    '<select id="imgFormat" style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:8px;padding:5px 10px;color:var(--text)">' +
    '<option value="image/jpeg">JPEG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option>' +
    '</select>' +
    '<button class="btn btn-primary" onclick="compressImg()">压缩 / 转换</button>' +
    '</div></div>' +
    '<div id="imgCompressResult" style="display:none"></div>';
}

var _imgFile = null;
var _imgCompressUrl = null;

function handleImgDrop(e) {
  e.preventDefault();
  document.getElementById('imgDropZone').style.borderColor = 'var(--glass-border)';
  var f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) handleImgFile(f);
}

function handleImgFile(f) {
  if (!f) return;
  _imgFile = f;
  var zone = document.getElementById('imgDropZone');
  zone.innerHTML = '<div style="color:var(--neon);font-weight:600">' + escHtml(f.name) + '</div>' +
    '<div style="color:var(--text-muted);font-size:12px;margin-top:4px">原始大小：' + formatSize(f.size) + '</div>';
}

function compressImg() {
  if (!_imgFile) { alert('请先选择图片'); return; }
  var quality = parseInt(document.getElementById('imgQuality').value) / 100;
  var format = document.getElementById('imgFormat').value;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(function(blob) {
        if (_imgCompressUrl) { URL.revokeObjectURL(_imgCompressUrl); }
        var url = URL.createObjectURL(blob);
        _imgCompressUrl = url;
        var ext = format.split('/')[1];
        var panel = document.getElementById('imgCompressResult');
        panel.style.display = '';
        var origUrl = e.target.result;
        var ratio = Math.round((1-blob.size/_imgFile.size)*100);
        var ratioColor = ratio > 0 ? '#10b981' : '#ef4444';
        panel.innerHTML =
          '<div class="tool-card-panel">' +
          '<div class="panel-label">压缩结果</div>' +
          '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px">' +
          '<div style="font-size:13px">原始大小：<span style="color:var(--text);font-weight:600">' + formatSize(_imgFile.size) + '</span></div>' +
          '<div style="font-size:13px">压缩后：<span style="color:var(--neon);font-weight:600">' + formatSize(blob.size) + '</span></div>' +
          '<div style="font-size:13px">节省：<span style="color:' + ratioColor + ';font-weight:600">' + ratio + '%</span></div>' +
          '<div style="font-size:13px">尺寸：<span style="color:var(--text);font-weight:600">' + img.width + ' × ' + img.height + 'px</span></div>' +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">' +
          '<div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;text-align:center">原图</div>' +
          '<img src="' + origUrl + '" style="width:100%;max-height:260px;object-fit:contain;border-radius:10px;border:1px solid var(--glass-border)">' +
          '</div>' +
          '<div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;text-align:center">压缩后</div>' +
          '<img src="' + url + '" style="width:100%;max-height:260px;object-fit:contain;border-radius:10px;border:1px solid var(--glass-border)">' +
          '</div>' +
          '</div>' +
          '<a href="' + url + '" download="compressed.' + ext + '" class="btn btn-primary" style="text-decoration:none">下载图片</a>' +
          '</div>';
      }, format, quality);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(_imgFile);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/1024/1024).toFixed(2) + ' MB';
}
