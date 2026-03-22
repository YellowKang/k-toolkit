window.renderTypingSpeed = function(el) {
  const _sentences = [
    'The quick brown fox jumps over the lazy dog',
    'Programming is the art of telling another human what one wants the computer to do',
    'Any fool can write code that a computer can understand',
    'First solve the problem then write the code',
    'Experience is the name everyone gives to their mistakes',
  ];
  const _cnSentences = [
    '人生苦短，我用Python编程，代码改变世界，技术创造未来。',
    '学而时习之，不亦说乎，知识就是力量，实践出真知。',
    '千里之行始于足下，每天进步一点点，终将到达山顶。',
    '代码是程序员的诗歌，简洁优雅方为上品，逻辑清晰才是真谛。',
    '不积跬步无以至千里，坚持学习编程让梦想照进现实。',
  ];
  window._tsState = {running:false, startTime:0, timer:null, text:'', idx:0, mode:'en'};
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <div class="panel-label" style="margin:0">打字速度测试</div>
        <div style="display:flex;gap:16px">
          <div style="text-align:center"><div id="tsSpeedLabel" style="font-size:11px;color:var(--text-muted)">WPM</div><div id="tsWpm" style="font-size:22px;font-weight:700;color:var(--accent)">0</div></div>
          <div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">准确率</div><div id="tsAcc" style="font-size:22px;font-weight:700;color:var(--text)">-</div></div>
          <div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">时间</div><div id="tsTime" style="font-size:22px;font-weight:700;color:var(--text)">0s</div></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn btn-secondary" id="tsModeEn" onclick="tsSetMode('en')">英文</button>
        <button class="btn btn-secondary" id="tsModeCn" onclick="tsSetMode('cn')">中文</button>
      </div>
      <div id="tsTarget" style="font-size:18px;line-height:1.8;padding:16px;background:rgba(0,0,0,0.25);border-radius:10px;margin-bottom:12px;letter-spacing:0.5px;min-height:60px"></div>
      <textarea id="tsInput" class="tool-textarea" rows="3" placeholder="点击开始后在此输入..." disabled style="font-size:15px" oninput="tsHandleInput()"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" id="tsStartBtn" onclick="tsStart()">开始</button>
        <button class="btn btn-secondary" onclick="tsReset()">重置</button>
      </div>
    </div>`;
  window._tsSentences = _sentences;
  window._tsCnSentences = _cnSentences;
  tsSetMode('en');
};

function tsSetMode(mode) {
  const s = window._tsState;
  s.mode = mode;
  s.idx = -1;
  const enBtn = document.getElementById('tsModeEn');
  const cnBtn = document.getElementById('tsModeCn');
  const lbl = document.getElementById('tsSpeedLabel');
  if (enBtn) enBtn.style.borderColor = mode === 'en' ? 'var(--accent)' : 'var(--glass-border)';
  if (cnBtn) cnBtn.style.borderColor = mode === 'cn' ? 'var(--accent)' : 'var(--glass-border)';
  if (lbl) lbl.textContent = mode === 'cn' ? 'CPM' : 'WPM';
  tsReset();
}

function tsReset() {
  const s = window._tsState;
  clearInterval(s.timer);
  s.running = false;
  const sentences = s.mode === 'cn' ? window._tsCnSentences : window._tsSentences;
  s.idx = (s.idx + 1) % sentences.length;
  s.text = sentences[s.idx];
  const target = document.getElementById('tsTarget');
  const input = document.getElementById('tsInput');
  const startBtn = document.getElementById('tsStartBtn');
  const wpmEl = document.getElementById('tsWpm');
  const accEl = document.getElementById('tsAcc');
  const timeEl = document.getElementById('tsTime');
  if (target) target.innerHTML = s.text.split('').map(c => `<span>${c}</span>`).join('');
  if (input) { input.value = ''; input.disabled = true; }
  if (startBtn) startBtn.textContent = '开始';
  if (wpmEl) wpmEl.textContent = '0';
  if (accEl) accEl.textContent = '-';
  if (timeEl) timeEl.textContent = '0s';
}

function tsStart() {
  const s = window._tsState;
  if (s.running) return;
  s.running = true;
  s.startTime = Date.now();
  const input = document.getElementById('tsInput');
  const startBtn = document.getElementById('tsStartBtn');
  if (input) { input.disabled = false; input.focus(); }
  if (startBtn) startBtn.textContent = '进行中...';
  s.timer = setInterval(() => {
    const elapsed = Math.round((Date.now() - s.startTime) / 1000);
    const timeEl = document.getElementById('tsTime');
    if (timeEl) timeEl.textContent = elapsed + 's';
  }, 500);
}

function tsHandleInput() {
  const s = window._tsState;
  if (!s.running) return;
  const input = document.getElementById('tsInput');
  const typed = input ? input.value : '';
  const target = s.text;
  const spans = document.querySelectorAll('#tsTarget span');
  let correct = 0;
  spans.forEach((sp, i) => {
    if (i < typed.length) {
      const ok = typed[i] === target[i];
      sp.style.color = ok ? '#10b981' : '#ef4444';
      sp.style.background = ok ? 'transparent' : 'rgba(239,68,68,0.15)';
      if (ok) correct++;
    } else {
      sp.style.color = i === typed.length ? 'var(--accent)' : 'var(--text-muted)';
      sp.style.background = 'transparent';
    }
  });
  const elapsed = (Date.now() - s.startTime) / 60000;
  const isCn = s.mode === 'cn';
  const speed = isCn
    ? Math.round(typed.length / Math.max(elapsed, 0.001))
    : Math.round((typed.length / 5) / Math.max(elapsed, 0.001));
  const acc = typed.length ? Math.round(correct / typed.length * 100) : 0;
  const wpmEl = document.getElementById('tsWpm');
  const accEl = document.getElementById('tsAcc');
  if (wpmEl) wpmEl.textContent = speed;
  if (accEl) accEl.textContent = acc + '%';
  if (typed === target) {
    clearInterval(s.timer);
    s.running = false;
    const label = isCn ? 'CPM' : 'WPM';
    showToast(`完成！${label}: ${speed}，准确率: ${acc}%`, 'success', 4000);
  }
}

window._activeCleanup = function() {
  if (window._tsState) clearInterval(window._tsState.timer);
};
