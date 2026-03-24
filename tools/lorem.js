function renderLorem(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
<div>
<div class="panel-label" style="margin-bottom:8px">语言</div>
<div style="display:flex;gap:8px">
<button class="btn btn-primary" id="loremLangZh" onclick="loremSetLang('zh',this)">中文</button>
<button class="btn btn-secondary" id="loremLangEn" onclick="loremSetLang('en',this)">English</button>
</div>
</div>
<div>
<div class="panel-label" style="margin-bottom:8px">段落数：<span id="loremCountLabel">3</span></div>
<input type="range" min="1" max="10" value="3" style="width:100%" oninput="document.getElementById('loremCountLabel').textContent=this.value" id="loremCount">
</div>
</div>
<div class="tool-actions">
<button class="btn btn-primary" onclick="loremGen()">生成</button>
</div>
</div>
<div class="tool-card-panel" id="loremResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">生成结果</div>
<div style="display:flex;gap:8px">
<button class="btn btn-secondary" onclick="loremGen()">重新生成</button>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('loremOutput').textContent,this)">复制</button>
</div>
</div>
<div id="loremOutput" style="line-height:1.8;color:var(--text);font-size:14px"></div>
</div>`;
}
let _loremLang = 'zh';
function loremSetLang(lang, btn) {
_loremLang = lang;
document.getElementById('loremLangZh').className = 'btn ' + (lang==='zh'?'btn-primary':'btn-secondary');
document.getElementById('loremLangEn').className = 'btn ' + (lang==='en'?'btn-primary':'btn-secondary');
}
const LOREM_ZH = ['人之初，性本善。','天下兴亡，匹夫有责。','知之为知之，不知为不知，是知也。','学而时习之，不亦说乎？','己所不欲，勿施于人。','温故而知新，可以为师矣。','三人行，必有我师焉。','敏而好学，不耻下问。','业精于勤，荒于嬉；行成于思，毁于随。','读书破万卷，下笔如有神。'];
const LOREM_EN_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est'.split(' ');
function loremGen() {
const count = +document.getElementById('loremCount').value;
let html = '';
if (_loremLang === 'zh') {
for (let i = 0; i < count; i++) {
const sentences = Array.from({length: 4+Math.floor(Math.random()*4)}, () => LOREM_ZH[Math.floor(Math.random()*LOREM_ZH.length)]);
html += `<p style="margin-bottom:12px">${sentences.join('')}</p>`;
}
} else {
for (let i = 0; i < count; i++) {
const wc = 40 + Math.floor(Math.random()*30);
const words = Array.from({length:wc}, () => LOREM_EN_WORDS[Math.floor(Math.random()*LOREM_EN_WORDS.length)]);
const para = words.join(' ').replace(/^./, c => c.toUpperCase()) + '.';
html += `<p style="margin-bottom:12px">${para}</p>`;
}
}
document.getElementById('loremOutput').innerHTML = html;
document.getElementById('loremResult').style.display = '';
}