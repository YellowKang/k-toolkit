window.renderMatrixRain = function(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">Matrix Rain</div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <button class="btn btn-primary" id="mrBtn" onclick="_mrToggle()">Start</button>
        <span style="font-size:12px;color:var(--text-muted)">Green falling katakana / digits on canvas</span>
      </div>
      <canvas id="mrCanvas" style="width:100%;border-radius:10px;border:1px solid var(--glass-border);display:block"></canvas>
    </div>`;

  const canvas = document.getElementById('mrCanvas');
  const ctx = canvas.getContext('2d');

  const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
  const FONT_SIZE = 16;
  let cols = 0, drops = [];
  let running = false;
  let rafId = null;

  function _mrResize() {
    const w = canvas.parentElement.clientWidth - 2;
    const h = Math.max(320, Math.floor(w * 0.45));
    canvas.width = w;
    canvas.height = h;
    cols = Math.floor(w / FONT_SIZE);
    drops = Array.from({length: cols}, () => Math.floor(Math.random() * -50));
  }

  function _mrFrame() {
    if (!running) return;
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT_SIZE + 'px monospace';
    for (let i = 0; i < cols; i++) {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x = i * FONT_SIZE;
      const y = drops[i] * FONT_SIZE;
      // head character brighter
      ctx.fillStyle = '#00ff41';
      ctx.globalAlpha = 1;
      ctx.fillText(ch, x, y);
      // dim trail via shadow draw handled by fillRect alpha above
      if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
    ctx.globalAlpha = 1;
    rafId = requestAnimationFrame(_mrFrame);
  }

  window._mrToggle = function() {
    if (!running) {
      running = true;
      document.getElementById('mrBtn').textContent = 'Stop';
      document.getElementById('mrBtn').className = 'btn btn-secondary';
      _mrResize();
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      _mrFrame();
    } else {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = null;
      document.getElementById('mrBtn').textContent = 'Start';
      document.getElementById('mrBtn').className = 'btn btn-primary';
    }
  };

  window._activeCleanup = () => { running = false; cancelAnimationFrame(rafId); };

  // initial blank canvas
  _mrResize();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
