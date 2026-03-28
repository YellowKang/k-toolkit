var _favT = null;
const _favSizes = [16, 32, 48, 180, 192, 512];
const _favEmojis = ['🚀','⚡','🔥','💎','🎯','📦','🛠️','✨','🎨','🔮'];
const _favI18n = {
zh: {
input_label:  '文字 (1-2字符)',
bg_color:     '背景色',
txt_color:    '文字色',
radius:       '圆角',
emoji_label:  '快速选择 Emoji',
preview:      '实时预览',
generate:     '生成所有尺寸',
sizes_label:  '尺寸预览',
download_png: '下载 PNG',
download_svg: '下载 SVG',
link_tag:     'HTML 引用代码',
copy:         '复制',
no_text:      '请输入 1-2 个字符',
copied:       '已复制',
placeholder:  'Ab',
},
en: {
input_label:  'Text (1-2 chars)',
bg_color:     'Background',
txt_color:    'Text Color',
radius:       'Radius',
emoji_label:  'Quick Emoji',
preview:      'Live Preview',
generate:     'Generate All Sizes',
sizes_label:  'Size Preview',
download_png: 'Download PNG',
download_svg: 'Download SVG',
link_tag:     'HTML Link Tag',
copy:         'Copy',
no_text:      'Enter 1-2 characters',
copied:       'Copied',
placeholder:  'Ab',
}
};
function renderFaviconGen(el) {
_favT = makeToolI18n(_favI18n);
var T = _favT;
el.innerHTML =
'<div class="tool-card-panel">' +
'<div class="panel-label">' + T('input_label') + '</div>' +
'<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:12px">' +
'<input class="tool-input" id="favText" maxlength="2" value="K" style="width:80px;text-align:center;font-size:20px" oninput="_favPreview()">' +
'<label style="font-size:13px;color:var(--text-muted)">' + T('bg_color') + '</label>' +
'<input type="color" id="favBg" value="#6366f1" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" oninput="_favPreview()">' +
'<label style="font-size:13px;color:var(--text-muted)">' + T('txt_color') + '</label>' +
'<input type="color" id="favTxt" value="#ffffff" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px" oninput="_favPreview()">' +
'<label style="font-size:13px;color:var(--text-muted)">' + T('radius') + '</label>' +
'<input type="range" id="favRadius" min="0" max="50" value="20" style="width:100px" oninput="_favPreview()">' +
'<span id="favRadiusVal" style="font-size:12px;color:var(--neon);font-family:monospace;min-width:32px">20%</span>' +
'</div>' +
'<div class="panel-label">' + T('emoji_label') + '</div>' +
'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px" id="favEmojiRow">' +
_favEmojis.map(function(e) {
return '<button class="btn btn-secondary" style="font-size:18px;padding:4px 10px;min-width:0" onclick="document.getElementById(\'favText\').value=\'' + e + '\';_favPreview()">' + e + '</button>';
}).join('') +
'</div>' +
'<div class="panel-label">' + T('preview') + '</div>' +
'<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">' +
'<canvas id="favPreviewCvs" width="128" height="128" style="border-radius:12px;border:1px solid var(--glass-border)"></canvas>' +
'</div>' +
'<button class="btn btn-primary" onclick="_favGenAll()">' + T('generate') + '</button>' +
'</div>' +
'<div class="tool-card-panel" id="favSizesPanel" style="display:none"></div>' +
'<div class="tool-card-panel" id="favCodePanel" style="display:none"></div>';
_favPreview();
}
function _favDraw(cvs, size, text, bg, fg, radiusPct) {
cvs.width = size; cvs.height = size;
var ctx = cvs.getContext('2d'), r = size * (radiusPct / 100);
ctx.beginPath(); ctx.roundRect(0, 0, size, size, r);
ctx.fillStyle = bg; ctx.fill();
ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
var fs = text.length === 1 ? size * 0.62 : size * 0.44;
ctx.font = '700 ' + fs + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif';
ctx.fillText(text, size / 2, size / 2 + size * 0.04);
}
function _favPreview() {
var text = document.getElementById('favText').value || '';
var bg = document.getElementById('favBg').value;
var fg = document.getElementById('favTxt').value;
var rad = +document.getElementById('favRadius').value;
document.getElementById('favRadiusVal').textContent = rad + '%';
var cvs = document.getElementById('favPreviewCvs');
if (!text) { cvs.getContext('2d').clearRect(0, 0, 128, 128); return; }
_favDraw(cvs, 128, text, bg, fg, rad);
}
function _favGenAll() {
var T = _favT;
var text = document.getElementById('favText').value || '';
if (!text) { showToast(T('no_text'), 'error'); return; }
var bg = document.getElementById('favBg').value;
var fg = document.getElementById('favTxt').value;
var rad = +document.getElementById('favRadius').value;
var panel = document.getElementById('favSizesPanel');
panel.style.display = '';
panel.innerHTML = '<div class="panel-label">' + T('sizes_label') + '</div>' +
'<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:end;margin-bottom:14px" id="favGrid"></div>' +
'<button class="btn btn-secondary" onclick="_favDownloadSvg()">' + T('download_svg') + '</button>';
var grid = document.getElementById('favGrid');
_favSizes.forEach(function(sz) {
var wrap = document.createElement('div');
wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px';
var cvs = document.createElement('canvas');
cvs.id = 'favCvs' + sz;
_favDraw(cvs, sz, text, bg, fg, rad);
var display = Math.min(sz, 64);
cvs.style.cssText = 'width:' + display + 'px;height:' + display + 'px;border-radius:6px;border:1px solid var(--glass-border)';
var label = document.createElement('span');
label.style.cssText = 'font-size:11px;color:var(--text-muted)';
label.textContent = sz + 'px';
var btn = document.createElement('button');
btn.className = 'btn btn-secondary';
btn.style.cssText = 'font-size:11px;padding:2px 8px';
btn.textContent = 'PNG';
btn.onclick = (function(c, s) { return function() { _favDownloadPng(c, s); }; })(cvs, sz);
wrap.appendChild(cvs);
wrap.appendChild(label);
wrap.appendChild(btn);
grid.appendChild(wrap);
});
var code = '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">\n' +
'<link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png">\n' +
'<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">';
var codePanel = document.getElementById('favCodePanel');
codePanel.style.display = '';
codePanel.innerHTML = '<div class="panel-label">' + T('link_tag') + '</div>' +
'<div class="result-box" style="position:relative"><pre style="margin:0;white-space:pre-wrap;font-size:12px;color:var(--text)">' +
code.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>' +
'<button class="btn btn-secondary" style="position:absolute;top:8px;right:8px;font-size:11px;padding:2px 10px" onclick="copyText(\'' +
code.replace(/'/g, "\\'").replace(/\n/g, '\\n') + '\',this)">' + T('copy') + '</button></div>';
}
function _favDownloadPng(cvs, size) {
var a = document.createElement('a');
a.href = cvs.toDataURL('image/png'); a.download = 'favicon-' + size + '.png'; a.click();
}
function _favDownloadSvg() {
var text = document.getElementById('favText').value || '';
var bg = document.getElementById('favBg').value, fg = document.getElementById('favTxt').value;
var sz = 512, r = sz * (+document.getElementById('favRadius').value) / 100;
var fs = text.length === 1 ? sz * 0.62 : sz * 0.44;
var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '">' +
'<rect width="' + sz + '" height="' + sz + '" rx="' + r + '" fill="' + bg + '"/>' +
'<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="' + fg + '" ' +
'font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif" font-weight="700" font-size="' + fs + '">' +
text.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</text></svg>';
var blob = new Blob([svg], { type: 'image/svg+xml' }), url = URL.createObjectURL(blob);
var a = document.createElement('a'); a.href = url; a.download = 'favicon.svg'; a.click();
URL.revokeObjectURL(url);
}