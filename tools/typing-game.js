window.renderTypingGame = function(el) {
  const words = 'the be to of and a in that have it for not on with he as you do at this his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us'.split(' ');
  const cnWords = '你好 世界 编程 代码 技术 学习 工作 生活 时间 朋友 家庭 健康 快乐 成功 努力 坚持 创新 发展 未来 希望 梦想 自由 美好 智慧 勇气 力量 温暖 感谢 分享 进步 简单 复杂 问题 答案 方法 系统 数据 网络 软件 硬件 算法 逻辑 函数 变量 循环 递归 接口 模块 框架 测试'.split(' ');
  window._tg = {words:[], typed:[], timer:null, running:false, start:0, wlist:words, cnlist:cnWords, timeLeft:60, correct:0, mode:'en'};
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="panel-label" style="margin:0">单词打字练习</div>
        <div style="display:flex;gap:16px">
          <div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">WPM</div><div id="tgWpm" style="font-size:20px;font-weight:700;color:var(--accent)">0</div></div>
          <div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">时间</div><div id="tgTime" style="font-size:20px;font-weight:700;color:var(--text)">60s</div></div>
          <div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">正确</div><div id="tgCorrect" style="font-size:20px;font-weight:700;color:#10b981">0</div></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <button class="btn btn-secondary" id="tgModeEn" onclick="tgSetMode('en')">英文</button>
        <button class="btn btn-secondary" id="tgModeCn" onclick="tgSetMode('cn')">中文</button>
      </div>
      <div id="tgWords" style="font-size:16px;line-height:2.2;padding:12px;background:rgba(0,0,0,0.25);border-radius:10px;margin-bottom:12px;min-height:80px;word-break:break-word"></div>
      <input id="tgInput" class="tool-input" placeholder="点击开始后在此输入..." oninput="tgHandleInput()" onkeydown="tgKey(event)" autocomplete="off" autocorrect="off" spellcheck="false" disabled>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="tgStart()">开始</button>
        <button class="btn btn-secondary" onclick="tgReset()">重置</button>
      </div>
    </div>`;
  tgSetMode('en');
};

function tgSetMode(mode) {
  const s = window._tg;
  s.mode = mode;
  const enBtn = document.getElementById('tgModeEn');
  const cnBtn = document.getElementById('tgModeCn');
  if (enBtn) enBtn.style.borderColor = mode === 'en' ? 'var(--accent)' : 'var(--glass-border)';
  if (cnBtn) cnBtn.style.borderColor = mode === 'cn' ? 'var(--accent)' : 'var(--glass-border)';
  tgReset();
}

function tgGenWords() {
  const s = window._tg;
  const list = s.mode === 'cn' ? s.cnlist : s.wlist;
  s.words = Array.from({length: 40}, () => list[Math.floor(Math.random() * list.length)]);
  s.curIdx = 0;
  tgRender();
}

function tgRender() {
  const s = window._tg;
  const el = document.getElementById('tgWords');
  if (!el) return;
  el.innerHTML = s.words.map((w, i) => {
    let cls = '';
    if (i < s.curIdx) cls = 'color:#10b981';
    else if (i === s.curIdx) cls = 'color:var(--accent);font-weight:700;text-decoration:underline';
    else cls = 'color:var(--text-muted)';
    return `<span style="margin-right:${s.mode==='cn'?'6px':'8px'};${cls}">${w}</span>`;
  }).join('');
}

function tgStart() {
  const s = window._tg;
  if (s.running) return;
  s.running = true;
  s.start = Date.now();
  s.correct = 0;
  s.timeLeft = 60;
  const input = document.getElementById('tgInput');
  if (input) { input.disabled = false; input.focus(); }
  tgGenWords();
  s.timer = setInterval(() => {
    s.timeLeft--;
    const tEl = document.getElementById('tgTime');
    if (tEl) tEl.textContent = s.timeLeft + 's';
    const elapsed = (Date.now() - s.start) / 60000;
    const wpmEl = document.getElementById('tgWpm');
    if (wpmEl) wpmEl.textContent = Math.round(s.correct / Math.max(elapsed, 0.001));
    if (s.timeLeft <= 0) {
      clearInterval(s.timer);
      s.running = false;
      const input = document.getElementById('tgInput');
      if (input) input.disabled = true;
      showToast(`时间到！正确: ${s.correct} 词，WPM: ${Math.round(s.correct / 1)}`, 'success', 4000);
    }
  }, 1000);
}

function tgReset() {
  const s = window._tg;
  clearInterval(s.timer);
  s.running = false;
  s.correct = 0;
  s.timeLeft = 60;
  const input = document.getElementById('tgInput');
  if (input) { input.value = ''; input.disabled = true; }
  ['tgWpm','tgCorrect'].forEach(id => { const e=document.getElementById(id); if(e) e.textContent='0'; });
  const tEl = document.getElementById('tgTime');
  if (tEl) tEl.textContent = '60s';
  tgGenWords();
}

function tgHandleInput() {
  const s = window._tg;
  if (!s.running) return;
  const input = document.getElementById('tgInput');
  const val = input.value;
  const sep = s.mode === 'cn' ? ' ' : ' ';
  if (val.endsWith(sep)) {
    const word = val.trim();
    if (word === s.words[s.curIdx]) {
      s.correct++;
      const cEl = document.getElementById('tgCorrect');
      if (cEl) cEl.textContent = s.correct;
    }
    s.curIdx++;
    input.value = '';
    if (s.curIdx >= s.words.length) tgGenWords();
    else tgRender();
  }
}

function tgKey(e) {
  if (e.key === ' ') e.preventDefault();
  tgHandleInput();
}

window._activeCleanup = function() {
  if (window._tg) clearInterval(window._tg.timer);
};
