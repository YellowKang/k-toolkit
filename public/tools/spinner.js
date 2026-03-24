function renderSpinner(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">随机抽签 / 决策转盘</div>
      <div style="margin-bottom:14px">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">选项（每行一个）</label>
        <textarea class="tool-textarea" id="spinOptions" rows="5" placeholder="苹果\n香蕉\n橙子\n葡萄">去吃火锅
去吃烧烤
去吃寿司
去吃披萨
在家点外卖</textarea>
      </div>
      <div style="display:flex;justify-content:center;margin-bottom:14px;position:relative">
        <canvas id="spinWheel" width="300" height="300" style="border-radius:50%"></canvas>
        <div id="spinPointer" style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:24px solid var(--accent);filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));z-index:2"></div>
      </div>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doSpin()" id="spinBtn">开始抽签</button>
        <button class="btn btn-secondary" onclick="spinClear()">清空结果</button>
      </div>
    </div>
    <div class="tool-card-panel" id="spinResult" style="display:none;text-align:center">
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">抽签结果</div>
      <div id="spinOutput" style="font-size:28px;font-weight:800;color:var(--neon);padding:16px"></div>
      <div id="spinHistory" style="margin-top:12px;font-size:12px;color:var(--text-muted)"></div>
    </div>`;
  window._spinHistory = [];
  window._spinAngle = 0;
  window._spinVelocity = 0;
  window._spinAnimating = false;
  drawWheel();
  // Redraw when options change
  document.getElementById('spinOptions').addEventListener('input', () => { if (!window._spinAnimating) drawWheel(); });
}

function _getSpinOpts() {
  return document.getElementById('spinOptions').value.split('\n').map(s => s.trim()).filter(Boolean);
}

function drawWheel(highlightIdx) {
  const canvas = document.getElementById('spinWheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const opts = _getSpinOpts();
  const cx = 150, cy = 150, r = 140;
  ctx.clearRect(0, 0, 300, 300);

  if (opts.length < 2) {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('请至少输入2个选项', cx, cy);
    return;
  }

  const sliceAngle = (Math.PI * 2) / opts.length;
  const rotation = window._spinAngle || 0;

  opts.forEach((opt, i) => {
    const startAngle = rotation + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    const hue = (i * 360 / opts.length) % 360;
    const isHighlight = highlightIdx === i;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = isHighlight
      ? `hsl(${hue}, 85%, 65%)`
      : `hsl(${hue}, 65%, 50%)`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = `${isHighlight ? 'bold ' : ''}${Math.min(14, 140/opts.length)}px sans-serif`;
    const maxLen = 8;
    const text = opt.length > maxLen ? opt.slice(0, maxLen) + '…' : opt;
    ctx.fillText(text, r - 12, 5);
    ctx.restore();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function doSpin() {
  const opts = _getSpinOpts();
  if (opts.length < 2) {
    document.getElementById('spinResult').style.display = '';
    document.getElementById('spinOutput').textContent = '请至少输入2个选项';
    return;
  }
  if (window._spinAnimating) return;

  const btn = document.getElementById('spinBtn');
  btn.disabled = true;
  window._spinAnimating = true;

  // Random target: full rotations + random final position
  const targetAngle = window._spinAngle + Math.PI * 2 * (5 + Math.random() * 5) + Math.random() * Math.PI * 2;
  const startAngle = window._spinAngle;
  const totalDelta = targetAngle - startAngle;
  const duration = 3000 + Math.random() * 1500;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    window._spinAngle = startAngle + totalDelta * eased;
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      window._spinAnimating = false;
      btn.disabled = false;

      // Determine winner: the slice at the top (pointer at -PI/2 i.e. top)
      const sliceAngle = (Math.PI * 2) / opts.length;
      // Normalize angle
      let normalizedAngle = window._spinAngle % (Math.PI * 2);
      if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;
      // Pointer is at top = -PI/2 = 3*PI/2 in canvas coordinates
      // The winning index is determined by which slice is at the top
      const pointerAngle = (3 * Math.PI / 2 - normalizedAngle + Math.PI * 4) % (Math.PI * 2);
      const winnerIdx = Math.floor(pointerAngle / sliceAngle) % opts.length;

      drawWheel(winnerIdx);

      const winner = opts[winnerIdx];
      document.getElementById('spinResult').style.display = '';
      document.getElementById('spinOutput').textContent = '🎉 ' + winner;

      window._spinHistory.unshift(winner);
      if (window._spinHistory.length > 5) window._spinHistory.pop();
      document.getElementById('spinHistory').textContent = '历史：' + window._spinHistory.join(' → ');

      if (typeof showToast === 'function') showToast('结果: ' + winner, 'success');
    }
  }

  requestAnimationFrame(animate);
}

function spinClear() {
  document.getElementById('spinResult').style.display = 'none';
  window._spinHistory = [];
}
