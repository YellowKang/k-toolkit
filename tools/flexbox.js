function renderFlexbox(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">预览</div>
<div class="flex-preview" id="flexPreview">
<div class="flex-item">1</div>
<div class="flex-item">2</div>
<div class="flex-item">3</div>
<div class="flex-item">4</div>
<div class="flex-item">5</div>
</div>
<div class="controls-grid">
<div class="control-group"><div class="control-label">flex-direction</div>
<select class="control-select" id="fxDir" onchange="updateFlex()">
<option>row</option><option>row-reverse</option><option>column</option><option>column-reverse</option>
</select>
</div>
<div class="control-group"><div class="control-label">justify-content</div>
<select class="control-select" id="fxJustify" onchange="updateFlex()">
<option>flex-start</option><option>flex-end</option><option>center</option><option>space-between</option><option>space-around</option><option>space-evenly</option>
</select>
</div>
<div class="control-group"><div class="control-label">align-items</div>
<select class="control-select" id="fxAlign" onchange="updateFlex()">
<option>stretch</option><option>flex-start</option><option>flex-end</option><option>center</option><option>baseline</option>
</select>
</div>
<div class="control-group"><div class="control-label">flex-wrap</div>
<select class="control-select" id="fxWrap" onchange="updateFlex()">
<option>nowrap</option><option>wrap</option><option>wrap-reverse</option>
</select>
</div>
<div class="control-group"><div class="control-label">align-content</div>
<select class="control-select" id="fxAlignContent" onchange="updateFlex()">
<option>normal</option><option>flex-start</option><option>flex-end</option><option>center</option><option>space-between</option><option>space-around</option>
</select>
</div>
<div class="control-group"><div class="control-label">gap</div>
<select class="control-select" id="fxGap" onchange="updateFlex()">
<option value="0">0</option><option value="4px">4px</option><option value="8px" selected>8px</option><option value="16px">16px</option><option value="24px">24px</option>
</select>
</div>
</div>
</div>
<div class="tool-card-panel">
<div class="panel-label">CSS 代码</div>
<div class="result-box" id="flexCode"></div>
<div class="tool-actions"><button class="btn btn-primary" onclick="copyText(document.getElementById('flexCode').textContent, this)">复制代码</button></div>
</div>`;
updateFlex();
}
function updateFlex() {
const dir = document.getElementById('fxDir').value;
const justify = document.getElementById('fxJustify').value;
const align = document.getElementById('fxAlign').value;
const wrap = document.getElementById('fxWrap').value;
const alignContent = document.getElementById('fxAlignContent').value;
const gap = document.getElementById('fxGap').value;
const preview = document.getElementById('flexPreview');
Object.assign(preview.style, { display:'flex', flexDirection:dir, justifyContent:justify, alignItems:align, flexWrap:wrap, alignContent:alignContent, gap });
document.getElementById('flexCode').textContent =
`display: flex;
flex-direction: ${dir};
justify-content: ${justify};
align-items: ${align};
flex-wrap: ${wrap};
align-content: ${alignContent};
gap: ${gap};`;
}