function renderSpinner(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">随机抽签 / 决策转盘</div>
      <div style="margin-bottom:14px">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">选项（每行一个）</label>
        <textarea class="tool-textarea" id="spinOptions" rows="6" placeholder="苹果\n香蕉\n橙子\n葡萄">去吃火锅
去吃烧烤
去吃寿司
去吃披萨
在家点外卖</textarea>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doSpin()" id="spinBtn">🎰 开始抽签</button>
        <button class="btn btn-secondary" onclick="spinClear()">清空结果</button>
      </div>
    </div>
    <div class="tool-card-panel" id="spinResult" style="display:none;text-align:center">
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">抽签结果</div>
      <div id="spinOutput" style="font-size:32px;font-weight:800;color:var(--neon);padding:20px"></div>
      <div id="spinHistory" style="margin-top:12px;font-size:12px;color:var(--text-muted)"></div>
    </div>`;
  window._spinHistory=[];
}

function doSpin() {
  const opts=document.getElementById('spinOptions').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(opts.length<2){document.getElementById('spinOutput').textContent='请至少输入2个选项';document.getElementById('spinResult').style.display='';return;}
  const btn=document.getElementById('spinBtn');
  btn.disabled=true;
  let count=0, max=20;
  const out=document.getElementById('spinOutput');
  document.getElementById('spinResult').style.display='';
  const interval=setInterval(()=>{
    out.textContent=opts[Math.floor(Math.random()*opts.length)];
    out.style.color='hsl('+(Math.random()*360)+',80%,70%)';
    count++;
    if(count>=max){
      clearInterval(interval);
      const winner=opts[Math.floor(Math.random()*opts.length)];
      out.textContent='🎉 '+winner;
      out.style.color='var(--neon)';
      window._spinHistory.unshift(winner);
      if(window._spinHistory.length>5) window._spinHistory.pop();
      document.getElementById('spinHistory').textContent='历史：'+window._spinHistory.join(' → ');
      btn.disabled=false;
    }
  },80);
}
function spinClear(){document.getElementById('spinResult').style.display='none';window._spinHistory=[];}
