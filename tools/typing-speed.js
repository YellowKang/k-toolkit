var _typingSpeedTl = function(k){ return k; };
const _typingSpeedDict = {
zh: {
sentence_mode: '句子模式',
word_mode: '单词模式',
code_mode: '代码模式',
typing_test: '打字速度测试',
word_practice: '单词打字练习',
code_practice: '代码模式',
accuracy: '准确率',
time: '时间',
correct: '正确',
english: '英文',
chinese: '中文',
placeholder: '点击开始后在此输入...',
code_placeholder: '开始后在此输入代码...',
start: '开始',
reset: '重置',
in_progress: '进行中...',
done: '完成！',
times_up: '时间到！',
words: '词',
stats_title: '成绩统计',
stats_clear: '清空记录',
stats_avg: '平均速度',
stats_max: '最高速度',
stats_acc: '平均准确率',
},
en: {
sentence_mode: 'Sentence Mode',
word_mode: 'Word Mode',
code_mode: 'Code Mode',
typing_test: 'Typing Speed Test',
word_practice: 'Word Practice',
code_practice: 'Code Mode',
accuracy: 'Accuracy',
time: 'Time',
correct: 'Correct',
english: 'English',
chinese: 'Chinese',
placeholder: 'Start then type here...',
code_placeholder: 'Start then type code here...',
start: 'Start',
reset: 'Reset',
in_progress: 'In progress...',
done: 'Done!',
times_up: "Time's up!",
words: 'words',
stats_title: 'Statistics',
stats_clear: 'Clear',
stats_avg: 'Avg Speed',
stats_max: 'Best Speed',
stats_acc: 'Avg Accuracy',
},
};
const _codeSnippets = {
js: [
'const sum = arr.reduce((a, b) => a + b, 0);',
'const filtered = data.filter(item => item.active);',
'async function fetchData(url) { return await fetch(url).then(r => r.json()); }',
'const [first, ...rest] = items;',
'export default function App({ children }) { return <div>{children}</div>; }',
],
python: [
'result = [x for x in range(10) if x % 2 == 0]',
'with open("file.txt", "r") as f: data = f.read()',
'def factorial(n): return 1 if n <= 1 else n * factorial(n - 1)',
'items = {k: v for k, v in zip(keys, values)}',
'class User: def __init__(self, name): self.name = name',
],
go: [
'func main() { fmt.Println("Hello, World!") }',
'if err != nil { return fmt.Errorf("failed: %w", err) }',
'for i, v := range items { fmt.Printf("%d: %s\\n", i, v) }',
'ch := make(chan int, 10)',
'type Config struct { Host string; Port int }',
],
};
window.renderTypingSpeed = function(el) {
_typingSpeedTl = makeToolI18n(_typingSpeedDict);
const tl = _typingSpeedTl;
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
window._tsSentences = _sentences;
window._tsCnSentences = _cnSentences;
window._tsState = {running:false, startTime:0, timer:null, text:'', idx:0, mode:'en'};
const words = 'the be to of and a in that have it for not on with he as you do at this his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us'.split(' ');
const cnWords = '你好 世界 编程 代码 技术 学习 工作 生活 时间 朋友 家庭 健康 快乐 成功 努力 坚持 创新 发展 未来 希望 梦想 自由 美好 智慧 勇气 力量 温暖 感谢 分享 进步 简单 复杂 问题 答案 方法 系统 数据 网络 软件 硬件 算法 逻辑 函数 变量 循环 递归 接口 模块 框架 测试'.split(' ');
window._tg = {words:[], typed:[], timer:null, running:false, start:0, wlist:words, cnlist:cnWords, timeLeft:60, correct:0, mode:'en'};
window._tcState = {running:false, startTime:0, timer:null, text:'', lang:'js', idx:-1};
window._typMode = 'sentence';
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:8px;margin-bottom:16px">
<button class="btn btn-primary" id="typTabSentence" onclick="typSwitchMode('sentence')">${tl('sentence_mode')}</button>
<button class="btn btn-secondary" id="typTabWord" onclick="typSwitchMode('word')">${tl('word_mode')}</button>
<button class="btn btn-secondary" id="typTabCode" onclick="typSwitchMode('code')">${tl('code_mode')}</button>
</div>
<div id="typSentencePanel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
<div class="panel-label" style="margin:0">${tl('typing_test')}</div>
<div style="display:flex;gap:16px">
<div style="text-align:center"><div id="tsSpeedLabel" style="font-size:11px;color:var(--text-muted)">WPM</div><div id="tsWpm" style="font-size:22px;font-weight:700;color:var(--accent)">0</div></div>
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">${tl('accuracy')}</div><div id="tsAcc" style="font-size:22px;font-weight:700;color:var(--text)">-</div></div>
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">${tl('time')}</div><div id="tsTime" style="font-size:22px;font-weight:700;color:var(--text)">0s</div></div>
</div>
</div>
<div style="display:flex;gap:8px;margin-bottom:12px">
<button class="btn btn-secondary" id="tsModeEn" onclick="tsSetMode('en')">${tl('english')}</button>
<button class="btn btn-secondary" id="tsModeCn" onclick="tsSetMode('cn')">${tl('chinese')}</button>
</div>
<div id="tsTarget" style="font-size:18px;line-height:1.8;padding:16px;background:rgba(0,0,0,0.25);border-radius:10px;margin-bottom:12px;letter-spacing:0.5px;min-height:60px"></div>
<textarea id="tsInput" class="tool-textarea" rows="3" placeholder="${tl('placeholder')}" disabled style="font-size:15px" oninput="tsHandleInput()"></textarea>
<div class="tool-actions">
<button class="btn btn-primary" id="tsStartBtn" onclick="tsStart()">${tl('start')}</button>
<button class="btn btn-secondary" onclick="tsReset()">${tl('reset')}</button>
</div>
</div>
<div id="typWordPanel" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">${tl('word_practice')}</div>
<div style="display:flex;gap:16px">
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">WPM</div><div id="tgWpm" style="font-size:20px;font-weight:700;color:var(--accent)">0</div></div>
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">${tl('time')}</div><div id="tgTime" style="font-size:20px;font-weight:700;color:var(--text)">60s</div></div>
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">${tl('correct')}</div><div id="tgCorrect" style="font-size:20px;font-weight:700;color:#10b981">0</div></div>
</div>
</div>
<div style="display:flex;gap:8px;margin-bottom:12px">
<button class="btn btn-secondary" id="tgModeEn" onclick="tgSetMode('en')">${tl('english')}</button>
<button class="btn btn-secondary" id="tgModeCn" onclick="tgSetMode('cn')">${tl('chinese')}</button>
</div>
<div id="tgWords" style="font-size:16px;line-height:2.2;padding:12px;background:rgba(0,0,0,0.25);border-radius:10px;margin-bottom:12px;min-height:80px;word-break:break-word"></div>
<input id="tgInput" class="tool-input" placeholder="${tl('placeholder')}" oninput="tgHandleInput()" onkeydown="tgKey(event)" autocomplete="off" autocorrect="off" spellcheck="false" disabled>
<div class="tool-actions">
<button class="btn btn-primary" onclick="tgStart()">${tl('start')}</button>
<button class="btn btn-secondary" onclick="tgReset()">${tl('reset')}</button>
</div>
</div>
<div id="typCodePanel" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
<div class="panel-label" style="margin:0">${tl('code_practice')}</div>
<div style="display:flex;gap:16px">
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">CPM</div><div id="tcCpm" style="font-size:22px;font-weight:700;color:var(--accent)">0</div></div>
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">${tl('accuracy')}</div><div id="tcAcc" style="font-size:22px;font-weight:700;color:var(--text)">-</div></div>
<div style="text-align:center"><div style="font-size:11px;color:var(--text-muted)">${tl('time')}</div><div id="tcTime" style="font-size:22px;font-weight:700;color:var(--text)">0s</div></div>
</div>
</div>
<div style="display:flex;gap:8px;margin-bottom:12px">
<button class="btn btn-secondary" id="tcLangJs" onclick="tcSetLang('js')" style="border-color:var(--accent)">JS</button>
<button class="btn btn-secondary" id="tcLangPython" onclick="tcSetLang('python')">Python</button>
<button class="btn btn-secondary" id="tcLangGo" onclick="tcSetLang('go')">Go</button>
</div>
<div id="tcTarget" style="font-family:'Fira Code',monospace;font-size:15px;line-height:1.8;padding:16px;background:rgba(0,0,0,0.35);border-radius:10px;margin-bottom:12px;min-height:50px;letter-spacing:0.5px"></div>
<textarea id="tcInput" class="tool-textarea" rows="3" placeholder="${tl('code_placeholder')}" disabled style="font-size:14px;font-family:'Fira Code',monospace" oninput="tcHandleInput()"></textarea>
<div class="tool-actions">
<button class="btn btn-primary" id="tcStartBtn" onclick="tcStart()">${tl('start')}</button>
<button class="btn btn-secondary" onclick="tcReset()">${tl('reset')}</button>
</div>
</div>
</div>
<div class="tool-card-panel" id="typStatsPanel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
<div class="panel-label" style="margin:0">${tl('stats_title')}</div>
<button class="btn btn-secondary" onclick="typClearStats()" style="font-size:12px">${tl('stats_clear')}</button>
</div>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
<div style="text-align:center;padding:12px;background:rgba(0,0,0,0.2);border-radius:10px;border:1px solid var(--glass-border)">
<div style="font-size:11px;color:var(--text-muted)">${tl('stats_avg')}</div>
<div id="typStatAvg" style="font-size:24px;font-weight:700;color:var(--accent)">-</div>
</div>
<div style="text-align:center;padding:12px;background:rgba(0,0,0,0.2);border-radius:10px;border:1px solid var(--glass-border)">
<div style="font-size:11px;color:var(--text-muted)">${tl('stats_max')}</div>
<div id="typStatMax" style="font-size:24px;font-weight:700;color:#22c55e">-</div>
</div>
<div style="text-align:center;padding:12px;background:rgba(0,0,0,0.2);border-radius:10px;border:1px solid var(--glass-border)">
<div style="font-size:11px;color:var(--text-muted)">${tl('stats_acc')}</div>
<div id="typStatAcc" style="font-size:24px;font-weight:700;color:var(--text)">-</div>
</div>
</div>
<div id="typStatsChart"></div>
</div>`;
tsSetMode('en');
tgSetMode('en');
tcReset();
typRenderStats();
window._activeCleanup = function() {
if (window._tsState) clearInterval(window._tsState.timer);
if (window._tg) clearInterval(window._tg.timer);
if (window._tcState) clearInterval(window._tcState.timer);
};
};
function typSwitchMode(mode) {
window._typMode = mode;
const sentencePanel = document.getElementById('typSentencePanel');
const wordPanel = document.getElementById('typWordPanel');
const codePanel = document.getElementById('typCodePanel');
const tabSentence = document.getElementById('typTabSentence');
const tabWord = document.getElementById('typTabWord');
const tabCode = document.getElementById('typTabCode');
if (sentencePanel) sentencePanel.style.display = mode === 'sentence' ? '' : 'none';
if (wordPanel) wordPanel.style.display = mode === 'word' ? '' : 'none';
if (codePanel) codePanel.style.display = mode === 'code' ? '' : 'none';
if (tabSentence) tabSentence.className = mode === 'sentence' ? 'btn btn-primary' : 'btn btn-secondary';
if (tabWord) tabWord.className = mode === 'word' ? 'btn btn-primary' : 'btn btn-secondary';
if (tabCode) tabCode.className = mode === 'code' ? 'btn btn-primary' : 'btn btn-secondary';
if (mode !== 'sentence' && window._tsState) { clearInterval(window._tsState.timer); window._tsState.running = false; tsReset(); }
if (mode !== 'word' && window._tg) { clearInterval(window._tg.timer); window._tg.running = false; tgReset(); }
if (mode !== 'code' && window._tcState) { clearInterval(window._tcState.timer); window._tcState.running = false; tcReset(); }
}
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
const tl = _typingSpeedTl;
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
if (startBtn) startBtn.textContent = tl('start');
if (wpmEl) wpmEl.textContent = '0';
if (accEl) accEl.textContent = '-';
if (timeEl) timeEl.textContent = '0s';
}
function tsStart() {
const tl = _typingSpeedTl;
const s = window._tsState;
if (s.running) return;
s.running = true;
s.startTime = Date.now();
const input = document.getElementById('tsInput');
const startBtn = document.getElementById('tsStartBtn');
if (input) { input.disabled = false; input.focus(); }
if (startBtn) startBtn.textContent = tl('in_progress');
s.timer = setInterval(() => {
const elapsed = Math.round((Date.now() - s.startTime) / 1000);
const timeEl = document.getElementById('tsTime');
if (timeEl) timeEl.textContent = elapsed + 's';
}, 500);
}
function tsHandleInput() {
const tl = _typingSpeedTl;
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
typSaveScore(speed, acc, 'sentence', s.mode);
showToast(`${tl('done')} ${label}: ${speed}, ${tl('accuracy')}: ${acc}%`, 'success', 4000);
}
}
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
const tl = _typingSpeedTl;
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
const finalWpm = Math.round(s.correct / 1);
const finalAcc = s.curIdx > 0 ? Math.round(s.correct / s.curIdx * 100) : 0;
typSaveScore(finalWpm, finalAcc, 'word', s.mode);
showToast(`${tl('times_up')} ${tl('correct')}: ${s.correct} ${tl('words')}, WPM: ${finalWpm}`, 'success', 4000);
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
if (val.endsWith(' ') || s._submitNow) {
s._submitNow = false;
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
if (e.key === ' ' || e.key === 'Enter') {
e.preventDefault();
window._tg._submitNow = true;
tgHandleInput();
}
}
const _tcKeywords = new Set([
'const','let','var','function','if','else','for','return','import','from',
'async','await','def','with','class','func','defer','range','make','chan',
'nil','new','switch','case','break','continue','export','default','try',
'catch','finally','throw','while','do','in','of','type','struct','interface',
'package','go','select','map','print','open','as','set','sorted',
]);
function _tcHighlight(text) {
let html = '';
let i = 0;
while (i < text.length) {
if (text[i] === '"' || text[i] === "'") {
const q = text[i];
let j = i + 1;
while (j < text.length && text[j] !== q) j++;
j++; 
html += `<span style="color:#22c55e">${_escHtml(text.slice(i, j))}</span>`;
i = j;
continue;
}
if (/[0-9]/.test(text[i]) && (i === 0 || /[\s(,\[{:=+\-*/%<>!&|^~]/.test(text[i-1]))) {
let j = i;
while (j < text.length && /[0-9.]/.test(text[j])) j++;
html += `<span style="color:#f97316">${text.slice(i, j)}</span>`;
i = j;
continue;
}
if (/[a-zA-Z_]/.test(text[i])) {
let j = i;
while (j < text.length && /[a-zA-Z0-9_]/.test(text[j])) j++;
const word = text.slice(i, j);
if (_tcKeywords.has(word)) {
html += `<span style="color:var(--accent);font-weight:600">${word}</span>`;
} else {
html += _escHtml(word);
}
i = j;
continue;
}
html += _escHtml(text[i]);
i++;
}
return html;
}
function _escHtml(s) {
return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function tcSetLang(lang) {
const s = window._tcState;
s.lang = lang;
s.idx = -1;
const idMap = {js:'tcLangJs', python:'tcLangPython', go:'tcLangGo'};
Object.entries(idMap).forEach(([l, id]) => {
const btn = document.getElementById(id);
if (btn) btn.style.borderColor = l === lang ? 'var(--accent)' : 'var(--glass-border)';
});
tcReset();
}
function tcReset() {
const tl = _typingSpeedTl;
const s = window._tcState;
clearInterval(s.timer);
s.running = false;
const snippets = _codeSnippets[s.lang] || _codeSnippets.js;
s.idx = (s.idx + 1) % snippets.length;
s.text = snippets[s.idx];
const target = document.getElementById('tcTarget');
const input = document.getElementById('tcInput');
const startBtn = document.getElementById('tcStartBtn');
const cpmEl = document.getElementById('tcCpm');
const accEl = document.getElementById('tcAcc');
const timeEl = document.getElementById('tcTime');
if (target) target.innerHTML = _tcHighlight(s.text);
if (input) { input.value = ''; input.disabled = true; }
if (startBtn) startBtn.textContent = tl('start');
if (cpmEl) cpmEl.textContent = '0';
if (accEl) accEl.textContent = '-';
if (timeEl) timeEl.textContent = '0s';
}
function tcStart() {
const tl = _typingSpeedTl;
const s = window._tcState;
if (s.running) return;
s.running = true;
s.startTime = Date.now();
const input = document.getElementById('tcInput');
const startBtn = document.getElementById('tcStartBtn');
if (input) { input.disabled = false; input.focus(); }
if (startBtn) startBtn.textContent = tl('in_progress');
s.timer = setInterval(() => {
const elapsed = Math.round((Date.now() - s.startTime) / 1000);
const timeEl = document.getElementById('tcTime');
if (timeEl) timeEl.textContent = elapsed + 's';
}, 500);
}
function tcHandleInput() {
const tl = _typingSpeedTl;
const s = window._tcState;
if (!s.running) return;
const input = document.getElementById('tcInput');
const typed = input ? input.value : '';
const target = s.text;
let html = '';
let correct = 0;
for (let i = 0; i < target.length; i++) {
const ch = _escHtml(target[i]);
if (i < typed.length) {
const ok = typed[i] === target[i];
if (ok) correct++;
html += `<span style="color:${ok ? '#10b981' : '#ef4444'};${ok ? '' : 'background:rgba(239,68,68,0.15)'}">${ch}</span>`;
} else if (i === typed.length) {
html += `<span style="color:var(--accent);text-decoration:underline">${ch}</span>`;
} else {
html += `<span style="color:var(--text-muted)">${ch}</span>`;
}
}
const targetEl = document.getElementById('tcTarget');
if (targetEl) targetEl.innerHTML = html;
const elapsed = (Date.now() - s.startTime) / 60000;
const cpm = Math.round(typed.length / Math.max(elapsed, 0.001));
const acc = typed.length ? Math.round(correct / typed.length * 100) : 0;
const cpmEl = document.getElementById('tcCpm');
const accEl = document.getElementById('tcAcc');
if (cpmEl) cpmEl.textContent = cpm;
if (accEl) accEl.textContent = acc + '%';
if (typed.length >= target.length) {
clearInterval(s.timer);
s.running = false;
const wpmEquiv = Math.round(cpm / 5);
typSaveScore(wpmEquiv, acc, 'code', s.lang);
showToast(`${tl('done')} CPM: ${cpm}, ${tl('accuracy')}: ${acc}%`, 'success', 4000);
}
}
function typSaveScore(wpm, accuracy, mode, lang) {
try {
const scores = JSON.parse(localStorage.getItem('dtb_typing_scores') || '[]');
scores.push({
date: new Date().toISOString(),
wpm: wpm,
accuracy: accuracy,
mode: mode,
lang: lang || '',
});
if (scores.length > 100) scores.splice(0, scores.length - 100);
localStorage.setItem('dtb_typing_scores', JSON.stringify(scores));
typRenderStats();
} catch(e) {  }
}
function typClearStats() {
localStorage.removeItem('dtb_typing_scores');
typRenderStats();
}
function typRenderStats() {
const scores = JSON.parse(localStorage.getItem('dtb_typing_scores') || '[]');
const avgEl = document.getElementById('typStatAvg');
const maxEl = document.getElementById('typStatMax');
const accEl = document.getElementById('typStatAcc');
const chartEl = document.getElementById('typStatsChart');
if (scores.length === 0) {
if (avgEl) avgEl.textContent = '-';
if (maxEl) maxEl.textContent = '-';
if (accEl) accEl.textContent = '-';
if (chartEl) chartEl.innerHTML = '';
return;
}
const wpms = scores.map(s => s.wpm);
const accs = scores.map(s => s.accuracy);
const avg = Math.round(wpms.reduce((a,b)=>a+b,0) / wpms.length);
const max = Math.max(...wpms);
const avgAcc = Math.round(accs.reduce((a,b)=>a+b,0) / accs.length);
if (avgEl) avgEl.textContent = avg;
if (maxEl) maxEl.textContent = max;
if (accEl) accEl.textContent = avgAcc + '%';
if (!chartEl) return;
const recent = scores.slice(-20);
if (recent.length < 2) {
chartEl.innerHTML = '';
return;
}
const W = 300, H = 120, padX = 30, padY = 15;
const plotW = W - padX * 2, plotH = H - padY * 2;
const vals = recent.map(s => s.wpm);
const minV = Math.max(0, Math.min(...vals) - 5);
const maxV = Math.max(...vals) + 5;
const rangeV = maxV - minV || 1;
const points = vals.map((v, i) => {
const x = padX + (i / (vals.length - 1)) * plotW;
const y = padY + plotH - ((v - minV) / rangeV) * plotH;
return { x, y, v };
});
const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
const dots = points.map(p =>
`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="var(--accent)" stroke="var(--bg)" stroke-width="1.5"/>`
).join('');
const yLabels = [minV, Math.round((minV+maxV)/2), maxV].map(v => {
const y = padY + plotH - ((v - minV) / rangeV) * plotH;
return `<text x="${padX-4}" y="${y+3}" fill="var(--text-muted)" font-size="9" text-anchor="end">${v}</text>`;
}).join('');
const gridLines = [0, 0.5, 1].map(f => {
const y = padY + plotH * (1 - f);
return `<line x1="${padX}" y1="${y}" x2="${W-padX}" y2="${y}" stroke="var(--glass-border)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
}).join('');
chartEl.innerHTML = `
<svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width:100%;display:block">
${gridLines}
${yLabels}
<polyline points="${polyline}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
${dots}
<text x="${W/2}" y="${H-1}" fill="var(--text-muted)" font-size="9" text-anchor="middle">WPM</text>
</svg>`;
}