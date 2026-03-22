window.renderPercentCalc = function(el) {
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="tool-card-panel">
        <div class="panel-label">X 是 Y 的百分之几</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <input class="tool-input" id="pc1x" type="number" placeholder="X" style="width:90px">
          <span style="color:var(--text-muted)">是</span>
          <input class="tool-input" id="pc1y" type="number" placeholder="Y" style="width:90px">
          <span style="color:var(--text-muted)">的</span>
        </div>
        <button class="btn btn-primary" onclick="calcPc1()">计算</button>
        <div class="result-box" id="pc1r" style="margin-top:10px;min-height:32px"></div>
      </div>
      <div class="tool-card-panel">
        <div class="panel-label">Y 的 X% 是多少</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <input class="tool-input" id="pc2y" type="number" placeholder="Y" style="width:90px">
          <span style="color:var(--text-muted)">的</span>
          <input class="tool-input" id="pc2x" type="number" placeholder="X%" style="width:90px">
          <span style="color:var(--text-muted)">%</span>
        </div>
        <button class="btn btn-primary" onclick="calcPc2()">计算</button>
        <div class="result-box" id="pc2r" style="margin-top:10px;min-height:32px"></div>
      </div>
      <div class="tool-card-panel">
        <div class="panel-label">从 A 到 B 的涨跌幅</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <input class="tool-input" id="pc3a" type="number" placeholder="原值 A" style="width:90px">
          <span style="color:var(--text-muted)">→</span>
          <input class="tool-input" id="pc3b" type="number" placeholder="新值 B" style="width:90px">
        </div>
        <button class="btn btn-primary" onclick="calcPc3()">计算</button>
        <div class="result-box" id="pc3r" style="margin-top:10px;min-height:32px"></div>
      </div>
      <div class="tool-card-panel">
        <div class="panel-label">原价打折后价格</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
          <input class="tool-input" id="pc4p" type="number" placeholder="原价" style="width:90px">
          <span style="color:var(--text-muted)">打</span>
          <input class="tool-input" id="pc4d" type="number" placeholder="折扣%" style="width:90px">
          <span style="color:var(--text-muted)">折</span>
        </div>
        <button class="btn btn-primary" onclick="calcPc4()">计算</button>
        <div class="result-box" id="pc4r" style="margin-top:10px;min-height:32px"></div>
      </div>
    </div>`;
};

function calcPc1() {
  const x=parseFloat(document.getElementById('pc1x').value), y=parseFloat(document.getElementById('pc1y').value);
  document.getElementById('pc1r').textContent = (!x||!y) ? '' : (x/y*100).toFixed(4) + '%';
}
function calcPc2() {
  const y=parseFloat(document.getElementById('pc2y').value), x=parseFloat(document.getElementById('pc2x').value);
  document.getElementById('pc2r').textContent = (!x||!y) ? '' : (y*x/100).toFixed(4);
}
function calcPc3() {
  const a=parseFloat(document.getElementById('pc3a').value), b=parseFloat(document.getElementById('pc3b').value);
  if (!a||isNaN(b)) return;
  const pct = ((b-a)/Math.abs(a)*100).toFixed(2);
  const el = document.getElementById('pc3r');
  el.textContent = (pct>0?'+':'')+pct+'%';
  el.style.color = pct>0?'#10b981':pct<0?'#ef4444':'var(--text)';
}
function calcPc4() {
  const p=parseFloat(document.getElementById('pc4p').value), d=parseFloat(document.getElementById('pc4d').value);
  document.getElementById('pc4r').textContent = (!p||!d) ? '' : '折后价：' + (p*d/100).toFixed(2);
}

window._activeCleanup = function() {};
