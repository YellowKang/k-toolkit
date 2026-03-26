function renderQRCodeDecode(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:12px">上传二维码图片</div>
<div id="qrdDropZone" style="border:2px dashed var(--glass-border);border-radius:12px;padding:40px;text-align:center;cursor:pointer;transition:all 0.2s"
ondragover="qrdDragOver(event)" ondragleave="qrdDragLeave(event)" ondrop="qrdDrop(event)" onclick="document.getElementById('qrdFile').click()">
<div style="font-size:48px;margin-bottom:12px">📷</div>
<div style="color:var(--text-muted);font-size:14px">点击或拖拽图片到此处</div>
<div style="color:var(--text-muted);font-size:12px;margin-top:6px">支持 PNG / JPG / GIF / BMP</div>
</div>
<input type="file" id="qrdFile" accept="image/*" style="display:none" onchange="qrdHandleFile(this.files[0])">
</div>
<div class="tool-card-panel" id="qrdResult" style="display:none">
<div style="display:flex;gap:16px;flex-wrap:wrap">
<img id="qrdPreview" style="max-width:160px;max-height:160px;border-radius:10px;border:1px solid var(--glass-border)">
<div style="flex:1;min-width:200px">
<div class="panel-label" style="margin-bottom:8px" id="qrdStatus"></div>
<div id="qrdContent" style="word-break:break-all;font-size:14px;line-height:1.7;padding:12px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px"></div>
<div style="margin-top:10px;display:flex;gap:8px" id="qrdActions"></div>
</div>
</div>
</div>`;
}
function qrdDragOver(e) {
e.preventDefault();
document.getElementById('qrdDropZone').style.borderColor = 'var(--accent)';
}
function qrdDragLeave(e) {
document.getElementById('qrdDropZone').style.borderColor = 'var(--glass-border)';
}
function qrdDrop(e) {
e.preventDefault();
qrdDragLeave(e);
const file = e.dataTransfer.files[0];
if (file) qrdHandleFile(file);
}
function qrdHandleFile(file) {
if (!file || !file.type.startsWith('image/')) return;
const reader = new FileReader();
reader.onload = e => {
const img = document.getElementById('qrdPreview');
img.src = e.target.result;
document.getElementById('qrdResult').style.display = '';
document.getElementById('qrdStatus').textContent = '识别中...';
document.getElementById('qrdStatus').style.color = 'var(--text-muted)';
document.getElementById('qrdContent').textContent = '';
document.getElementById('qrdActions').innerHTML = '';
img.onload = () => qrdDecode(img);
};
reader.readAsDataURL(file);
}
function qrdDecode(img) {
const canvas = document.createElement('canvas');
canvas.width = img.naturalWidth;
canvas.height = img.naturalHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
if (typeof jsQR !== 'undefined') {
qrdRunDecode(imageData, canvas);
} else {
const s = document.createElement('script');
s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
s.onload = () => qrdRunDecode(imageData, canvas);
s.onerror = () => {
document.getElementById('qrdStatus').textContent = '✗ jsQR 库加载失败，请检查网络';
document.getElementById('qrdStatus').style.color = '#e74c3c';
};
document.head.appendChild(s);
}
}
function qrdRunDecode(imageData, canvas) {
const code = jsQR(imageData.data, canvas.width, canvas.height);
if (code) {
const text = code.data;
document.getElementById('qrdStatus').textContent = '✓ 识别成功';
document.getElementById('qrdStatus').style.color = '#10b981';
document.getElementById('qrdContent').textContent = text;
let actions = `<button class="btn btn-secondary" onclick="copyText('${text.replace(/'/g,'\\&apos;')}',this)">复制内容</button>`;
if (text.startsWith('http')) actions += `<a class="btn btn-primary" href="${text}" target="_blank" rel="noopener">打开链接</a>`;
document.getElementById('qrdActions').innerHTML = actions;
} else {
document.getElementById('qrdStatus').textContent = '✗ 未检测到二维码，请确认图片清晰';
document.getElementById('qrdStatus').style.color = '#e74c3c';
}
}