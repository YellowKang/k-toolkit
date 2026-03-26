var _phTl = null;
function _phInitI18n() {
_phTl = makeToolI18n({
zh: {
title:       '占位图生成器',
width:       '宽度',
height:      '高度',
bg_color:    '背景色',
text_color:  '文字色',
custom_text: '自定义文字',
text_hint:   '留空则显示 宽×高',
presets:     '常用尺寸',
format:      '格式',
generate:    '生成',
preview:     '预览',
download:    '下载',
copy_url:    '复制 Data URL',
},
en: {
title:       'Placeholder Image',
width:       'Width',
height:      'Height',
bg_color:    'Background',
text_color:  'Text Color',
custom_text: 'Custom Text',
text_hint:   'Leave empty for WxH',
presets:     'Presets',
format:      'Format',
generate:    'Generate',
preview:     'Preview',
download:    'Download',
copy_url:    'Copy Data URL',
}
});
}
var _phPresets = [
{ w:1920, h:1080, label:'16:9' },
{ w:800,  h:600,  label:'4:3' },
{ w:500,  h:500,  label:'1:1' },
{ w:200,  h:200,  label:'Avatar' },
{ w:300,  h:200,  label:'Thumb' },
{ w:1200, h:400,  label:'Banner' },
];
function renderPlaceholderImg(el) {
_phInitI18n();
var tl = _phTl;
el.innerHTML =
'<div class="tool-card-panel">' +
'<div class="panel-label">' + tl('title') + '</div>' +
'<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:10px">' +
'<input class="tool-input" id="phW" type="number" value="800" min="1" max="4096" style="width:90px" placeholder="' + tl('width') + '">' +
'<span style="color:var(--text-muted);font-weight:600">&times;</span>' +
'<input class="tool-input" id="phH" type="number" value="600" min="1" max="4096" style="width:90px" placeholder="' + tl('height') + '">' +
'<input type="color" id="phBg" value="#cccccc" title="' + tl('bg_color') + '" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px">' +
'<input type="color" id="phFg" value="#666666" title="' + tl('text_color') + '" style="width:36px;height:32px;border:none;background:none;cursor:pointer;border-radius:6px">' +
'</div>' +
'<input class="tool-input" id="phText" placeholder="' + tl('text_hint') + '" style="margin-bottom:10px">' +
'<div style="margin-bottom:10px">' +
'<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">' + tl('presets') + '</div>' +
'<div style="display:flex;gap:6px;flex-wrap:wrap">' +
_phPresets.map(function(p, i) {
return '<button class="btn btn-secondary" style="font-size:12px" onclick="phApplyPreset(' + i + ')">' +
p.w + '&times;' + p.h + ' <span style="opacity:.6;font-size:10px">' + p.label + '</span></button>';
}).join('') +
'</div>' +
'</div>' +
'<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">' +
'<label style="font-size:13px;color:var(--text-muted)">' + tl('format') + '</label>' +
'<select class="tool-input" id="phFmt" style="width:auto"><option value="png">PNG</option><option value="svg">SVG</option></select>' +
'<button class="btn btn-primary" onclick="phGenerate()">' + tl('generate') + '</button>' +
'</div>' +
'</div>' +
'<div class="tool-card-panel" id="phResult" style="display:none"></div>';
}
function phApplyPreset(i) {
var p = _phPresets[i];
document.getElementById('phW').value = p.w;
document.getElementById('phH').value = p.h;
}
function phGenerate() {
if (!_phTl) _phInitI18n();
var tl = _phTl;
var w = Math.min(4096, Math.max(1, parseInt(document.getElementById('phW').value) || 800));
var h = Math.min(4096, Math.max(1, parseInt(document.getElementById('phH').value) || 600));
var bg = document.getElementById('phBg').value;
var fg = document.getElementById('phFg').value;
var txt = document.getElementById('phText').value.trim() || (w + '\u00d7' + h);
var fmt = document.getElementById('phFmt').value;
var canvas = document.createElement('canvas');
canvas.width = w; canvas.height = h;
var ctx = canvas.getContext('2d');
ctx.fillStyle = bg;
ctx.fillRect(0, 0, w, h);
var r = parseInt(bg.slice(1,3),16), g2 = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
var lighter = 'rgba(' + Math.min(255, r+30) + ',' + Math.min(255, g2+30) + ',' + Math.min(255, b+30) + ',0.6)';
ctx.strokeStyle = lighter;
ctx.lineWidth = Math.max(1, Math.min(w, h) / 200);
ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, h); ctx.stroke();
ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(0, h); ctx.stroke();
var fontSize = Math.max(12, Math.min(w, h) / 6);
ctx.font = 'bold ' + fontSize + 'px sans-serif';
ctx.fillStyle = fg;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(txt, w / 2, h / 2);
var dataUrl;
if (fmt === 'svg') {
var svgLines = Math.max(1, Math.min(w, h) / 200);
var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
'<rect width="100%" height="100%" fill="' + bg + '"/>' +
'<line x1="0" y1="0" x2="' + w + '" y2="' + h + '" stroke="' + lighter + '" stroke-width="' + svgLines + '"/>' +
'<line x1="' + w + '" y1="0" x2="0" y2="' + h + '" stroke="' + lighter + '" stroke-width="' + svgLines + '"/>' +
'<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="' + fg + '" font-size="' + fontSize + '" font-weight="bold" font-family="sans-serif">' + _phEscXml(txt) + '</text>' +
'</svg>';
dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
} else {
dataUrl = canvas.toDataURL('image/png');
}
var panel = document.getElementById('phResult');
panel.style.display = '';
panel.innerHTML =
'<div class="panel-label">' + tl('preview') + '</div>' +
'<div style="text-align:center;margin-bottom:12px;overflow:auto">' +
'<img id="phImg" src="' + dataUrl + '" style="max-width:100%;border:1px solid var(--glass-border);border-radius:8px" alt="placeholder">' +
'</div>' +
'<div style="display:flex;gap:8px;flex-wrap:wrap">' +
'<button class="btn btn-primary" onclick="phDownload()">' + tl('download') + '</button>' +
'<button class="btn btn-secondary" id="phCopyBtn" onclick="phCopyUrl()">' + tl('copy_url') + '</button>' +
'</div>' +
'<pre class="result-box" id="phUrl" style="margin-top:10px;white-space:pre-wrap;word-break:break-all;font-size:11px;max-height:80px;overflow:auto">' + _phEscHtml(dataUrl) + '</pre>';
window._phDataUrl = dataUrl;
window._phFmt = fmt;
window._phW = w;
window._phH = h;
}
function phDownload() {
if (!window._phDataUrl) return;
var a = document.createElement('a');
a.href = window._phDataUrl;
a.download = 'placeholder-' + window._phW + 'x' + window._phH + '.' + window._phFmt;
a.click();
}
function phCopyUrl() {
if (!window._phDataUrl) return;
copyText(window._phDataUrl, document.getElementById('phCopyBtn'));
}
function _phEscHtml(s) {
return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _phEscXml(s) {
return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}