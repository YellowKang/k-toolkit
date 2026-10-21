const _morseDict = {
  zh: {
    to_morse: '文字 → 摩斯', to_text: '摩斯 → 文字', text_label: '输入文本', code_label: '输入摩斯码（用空格分隔字符，/ 分隔单词）', text_ph: '输入文本...',
    convert: '转换', play: '▶ 播放音频', playing: '⏸ 播放中...', clear: '清空', copy_result: '复制结果', done: '✓ 转换完成',
  },
  en: {
    to_morse: 'Text → Morse', to_text: 'Morse → Text', text_label: 'Input text', code_label: 'Morse code (spaces between letters, / between words)', text_ph: 'Enter text...',
    convert: 'Convert', play: '▶ Play audio', playing: '⏸ Playing...', clear: 'Clear', copy_result: 'Copy result', done: '✓ Converted',
  },
};

function renderMorse(el) {
  const T = makeToolI18n(_morseDict);
  window._activeCleanup = function() {
    if (window._morseAudioCtx) { try { window._morseAudioCtx.close(); } catch {} }
  };
  const MAP = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.','.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','-':'-....-','(':'-.--.',')':'-.--.-'};
  const REV = Object.fromEntries(Object.entries(MAP).map(([k,v])=>[v,k]));
  el.innerHTML = `
    <div class="tool-card-panel">
      <div style="display:flex;gap:10px;margin-bottom:14px">
        <button class="btn btn-primary" id="morseEncBtn" onclick="setMorseMode('enc')">${T('to_morse')}</button>
        <button class="btn btn-secondary" id="morseDecBtn" onclick="setMorseMode('dec')">${T('to_text')}</button>
      </div>
      <div class="panel-label" id="morseLabel">${T('text_label')}</div>
      <textarea class="tool-textarea" id="morseInput" rows="5" placeholder="${T('text_ph')}"></textarea>
      <div class="tool-actions">
        <button class="btn btn-primary" onclick="doMorse()">${T('convert')}</button>
        <button class="btn btn-secondary" id="morsePlayBtn" onclick="playMorse()" style="display:none">${T('play')}</button>
        <button class="btn btn-secondary" onclick="document.getElementById('morseInput').value='';document.getElementById('morseResult').style.display='none';document.getElementById('morsePlayBtn').style.display='none'">${T('clear')}</button>
      </div>
    </div>
    <div class="tool-card-panel" id="morseResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="panel-label" style="margin:0" id="morseStatus"></div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('morseOutput').textContent,this)">${T('copy_result')}</button>
      </div>
      <pre class="result-box" id="morseOutput" style="white-space:pre-wrap;word-break:break-all;font-family:monospace;letter-spacing:2px"></pre>
    </div>`;
  window._morseMode = 'enc';
  window._morseMap = MAP;
  window._morseRev = REV;
  window._morseAudioCtx = null;
}

function setMorseMode(mode) {
  const T = makeToolI18n(_morseDict);
  window._morseMode = mode;
  document.getElementById('morseEncBtn').className = mode==='enc' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('morseDecBtn').className = mode==='dec' ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('morseLabel').textContent = mode==='enc' ? T('text_label') : T('code_label');
  document.getElementById('morseInput').placeholder = mode==='enc' ? T('text_ph') : '.- -... -.-. / . -...';
  document.getElementById('morseResult').style.display = 'none';
  document.getElementById('morsePlayBtn').style.display = 'none';
}

function doMorse() {
  const v = document.getElementById('morseInput').value.trim();
  if (!v) return;
  let out;
  if (window._morseMode === 'enc') {
    out = v.toUpperCase().split('').map(c => c===' ' ? '/' : (window._morseMap[c] || '?')).join(' ');
  } else {
    out = v.split(' / ').map(word => word.split(' ').map(code => window._morseRev[code] || '?').join('')).join(' ');
  }
  document.getElementById('morseOutput').textContent = out;
  document.getElementById('morseStatus').textContent = makeToolI18n(_morseDict)('done');
  document.getElementById('morseStatus').style.color = '#10b981';
  document.getElementById('morseResult').style.display = '';
  // 只有编码模式才能播放
  const playBtn = document.getElementById('morsePlayBtn');
  if (playBtn) playBtn.style.display = window._morseMode === 'enc' ? '' : 'none';
  window._morseCoded = out;
}

function playMorse() {
  const code = window._morseCoded || '';
  if (!code) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  window._morseAudioCtx = ctx;
  const dotDur = 0.08; // 秒
  let t = ctx.currentTime + 0.1;

  function beep(dur) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 600;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.4, t + dur - 0.01);
    gain.gain.linearRampToValueAtTime(0, t + dur + 0.01);
    osc.start(t); osc.stop(t + dur + 0.02);
    t += dur + dotDur;
  }

  const T = makeToolI18n(_morseDict);
  const playBtn = document.getElementById('morsePlayBtn');
  if (playBtn) { playBtn.disabled = true; playBtn.textContent = T('playing'); }

  code.split('').forEach(ch => {
    if (ch === '.') { beep(dotDur); }
    else if (ch === '-') { beep(dotDur * 3); }
    else if (ch === ' ') { t += dotDur * 2; }
    else if (ch === '/') { t += dotDur * 5; }
  });

  setTimeout(() => {
    if (playBtn) { playBtn.disabled = false; playBtn.textContent = T('play'); }
  }, (t - ctx.currentTime) * 1000 + 200);
}
