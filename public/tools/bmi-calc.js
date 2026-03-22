window.renderBmiCalc = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">BMI 体质指数计算器</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">身高（cm）</label>
          <input class="tool-input" id="bmiH" type="number" placeholder="例如 170" min="50" max="300">
        </div>
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">体重（kg）</label>
          <input class="tool-input" id="bmiW" type="number" placeholder="例如 65" min="10" max="500">
        </div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doBmiCalc()">计算</button>
        <button class="btn btn-secondary" onclick="document.getElementById('bmiH').value=170;document.getElementById('bmiW').value=65;doBmiCalc()">示例</button>
      </div>
    </div>
    <div class="tool-card-panel" id="bmiResult" style="display:none">
      <div style="text-align:center;padding:16px 0">
        <div id="bmiVal" style="font-size:52px;font-weight:700;color:var(--accent);line-height:1"></div>
        <div style="font-size:13px;color:var(--text-muted);margin:4px 0 12px">BMI 指数</div>
        <div id="bmiTag" style="display:inline-block;padding:4px 16px;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:12px"></div>
        <div id="bmiInfo" style="font-size:13px;color:var(--text-muted);line-height:1.8"></div>
      </div>
    </div>`;
};

function doBmiCalc() {
  const h = parseFloat(document.getElementById('bmiH').value);
  const w = parseFloat(document.getElementById('bmiW').value);
  if (!h || !w || h < 50 || w < 10) return;
  const bmi = w / Math.pow(h / 100, 2);
  document.getElementById('bmiVal').textContent = bmi.toFixed(1);
  let tag, color, tip;
  if (bmi < 18.5) { tag='偏轻'; color='#60a5fa'; tip='建议适当增加营养摄入'; }
  else if (bmi < 24) { tag='正常'; color='#10b981'; tip='保持现有生活方式，继续保持'; }
  else if (bmi < 28) { tag='超重'; color='#f59e0b'; tip='建议增加运动，控制饮食'; }
  else { tag='肥胖'; color='#ef4444'; tip='建议咨询医生，制定减重计划'; }
  const tagEl = document.getElementById('bmiTag');
  tagEl.textContent = tag;
  tagEl.style.background = color + '22';
  tagEl.style.color = color;
  const wMin = (18.5 * Math.pow(h/100,2)).toFixed(1);
  const wMax = (23.9 * Math.pow(h/100,2)).toFixed(1);
  document.getElementById('bmiInfo').innerHTML = `标准体重范围：${wMin} ~ ${wMax} kg<br>${tip}`;
  document.getElementById('bmiResult').style.display = '';
}

window._activeCleanup = function() {};
