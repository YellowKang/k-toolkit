const _diceEN = ['apple','brave','cloud','dance','eagle','flame','ghost','heart','ivory','jewel','karma','light','magic','noble','ocean','peace','quest','river','stone','tiger','ultra','vivid','whale','xenon','youth','zenith','amber','bloom','coral','drift','ember','frost','grain','haven','index','joker','knack','lotus','maple','nexus','olive','pixel','quilt','ridge','solar','torch','urban','vault','wheat','axiom','blaze','cedar','delta','epoch','fiber','globe','haste','input','joint','kayak','lemon','mango','niche','oasis','plume','quota','realm','spine','trend','unity','vigor','waltz','oxide','blend','crane','dwarf','exalt','forge','glaze','hatch','ivory','jelly','kiosk','llama','mocha','nudge','optic','prism','quark','rumba','stove','tulip','umbra','viper','wrist','xylem','yacht','zebra'];
const _diceCN = ['星辰','海洋','山川','雷电','微风','竹林','瀑布','峡谷','冰川','火山','月光','星河','雪花','云朵','彩虹','日出','黄昏','极光','潮汐','暴风','松树','玫瑰','荷花','梅花','兰花','菊花','桃花','竹子','银杏','樱花','飞鸟','白鹤','雄鹰','蝴蝶','海豚','猎豹','夜莺','凤凰','麒麟','青龙','琥珀','翡翠','水晶','珊瑚','玛瑙','蓝宝','紫晶','钻石','黄金','白银','春风','夏雨','秋月','冬雪','晨曦','午后','黄昏','子夜','拂晓','暮色','勇气','智慧','信念','希望','梦想','自由','真理','荣耀','和平','永恒','烟火','流星','朝阳','晚霞','清泉','深渊','天际','地平','海角','山巅','古琴','铜鼎','玉笛','木鱼','石磬','金钟','铁锤','丝绸','棉麻','皮革','书卷','画轴','棋盘','剑鞘','琴弦','墨砚','笔锋','纸鸢','灯塔','风铃'];
let _pwdPwnedTimer = null;
function renderPasswordGen(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid var(--glass-border)">
<button id="pwdTabRandom" class="pwd-tab pwd-tab-active" onclick="pwdSwitchTab('random')">随机密码</button>
<button id="pwdTabDice" class="pwd-tab" onclick="pwdSwitchTab('dice')">助记口令 (Diceware)</button>
</div>
<!-- Random Password Panel -->
<div id="pwdRandomPanel">
<div class="panel-label">生成设置</div>
<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
<span style="color:var(--text-muted);font-size:13px;white-space:nowrap">密码长度</span>
<input type="range" id="pwdLength" min="4" max="64" value="16" style="flex:1" oninput="pwdLenChange(this.value)">
<span id="pwdLenVal" style="color:var(--neon);font-family:monospace;font-weight:700;min-width:28px;text-align:right">16</span>
</div>
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
<label class="pwd-check-label"><input type="checkbox" id="pwdUpper" checked onchange="pwdGenPreview()"> 大写字母 A-Z</label>
<label class="pwd-check-label"><input type="checkbox" id="pwdLower" checked onchange="pwdGenPreview()"> 小写字母 a-z</label>
<label class="pwd-check-label"><input type="checkbox" id="pwdNum" checked onchange="pwdGenPreview()"> 数字 0-9</label>
<label class="pwd-check-label"><input type="checkbox" id="pwdSym" checked onchange="pwdGenPreview()"> 符号 !@#$%^</label>
<label class="pwd-check-label"><input type="checkbox" id="pwdExclude"> 排除歧义字符 (0O1lI)</label>
</div>
<div style="margin-bottom:16px">
<div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">强度预览</div>
<div id="pwdPreviewBox" style="padding:12px 16px;background:rgba(0,0,0,0.35);border:1px solid var(--glass-border);border-radius:10px;font-family:monospace;font-size:15px;letter-spacing:2px;word-break:break-all;cursor:pointer;transition:background 0.2s" onclick="pwdRefreshOne()" title="点击刷新"></div>
<div style="display:flex;align-items:center;gap:10px;margin-top:8px">
<div id="pwdStrBar" style="flex:1;height:4px;border-radius:4px;background:var(--glass-border);overflow:hidden"><div id="pwdStrFill" style="height:100%;width:0;transition:width 0.4s ease,background 0.4s ease;border-radius:4px"></div></div>
<span id="pwdStrLabel" style="font-size:12px;font-weight:600;min-width:30px;text-align:right"></span>
</div>
<div id="pwdPwnedResult" style="margin-top:8px;font-size:12px;min-height:18px"></div>
</div>
<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
<button class="btn btn-primary" onclick="generatePasswords()">批量生成</button>
<button class="btn btn-secondary" onclick="pwdRefreshOne()">刷新预览</button>
<select id="pwdCount" class="tool-input" style="width:auto">
<option value="1">生成 1 个</option>
<option value="5" selected>生成 5 个</option>
<option value="10">生成 10 个</option>
<option value="20">生成 20 个</option>
</select>
<button class="btn btn-secondary" onclick="pwdCopyAll()">复制全部</button>
</div>
</div>
<!-- Diceware Passphrase Panel -->
<div id="pwdDicewarePanel" style="display:none">
<div class="panel-label">助记口令设置</div>
<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
<span style="color:var(--text-muted);font-size:13px;white-space:nowrap">单词数量</span>
<input type="range" id="pwdDiceCount" min="4" max="8" value="4" style="flex:1" oninput="document.getElementById('pwdDiceCountVal').textContent=this.value">
<span id="pwdDiceCountVal" style="color:var(--neon);font-family:monospace;font-weight:700;min-width:18px;text-align:right">4</span>
</div>
<div style="display:flex;gap:14px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
<div style="display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:13px">分隔符</span>
<select id="pwdDiceSep" class="tool-input" style="width:auto">
<option value="-">短横线 -</option>
<option value=" ">空格</option>
<option value=".">句点 .</option>
</select>
</div>
<div style="display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:13px">语言</span>
<button id="pwdDiceLangEN" class="btn btn-secondary pwd-lang-active" onclick="pwdDiceSetLang('en')" style="padding:4px 12px;font-size:12px">English</button>
<button id="pwdDiceLangCN" class="btn btn-secondary" onclick="pwdDiceSetLang('cn')" style="padding:4px 12px;font-size:12px">中文</button>
</div>
</div>
<button class="btn btn-primary" onclick="pwdDiceGenerate()" style="margin-bottom:16px">生成口令</button>
<div id="pwdDiceOutput"></div>
</div>
</div>
<div class="tool-card-panel" id="pwdResult" style="display:none"></div>
<div class="tool-card-panel" id="pwdStrengthPanel" style="display:none">
<div class="panel-label" style="margin-bottom:12px">强度 &amp; 熵分析</div>
<div style="display:flex;gap:4px;margin-bottom:10px">
<div id="pwdSeg0" style="flex:1;height:10px;border-radius:4px 0 0 4px;background:var(--glass-border);transition:background 0.4s"></div>
<div id="pwdSeg1" style="flex:1;height:10px;background:var(--glass-border);transition:background 0.4s"></div>
<div id="pwdSeg2" style="flex:1;height:10px;background:var(--glass-border);transition:background 0.4s"></div>
<div id="pwdSeg3" style="flex:1;height:10px;border-radius:0 4px 4px 0;background:var(--glass-border);transition:background 0.4s"></div>
</div>
<div style="display:flex;justify-content:space-between;align-items:center">
<div id="pwdStrengthLabel" style="font-size:13px;font-weight:600"></div>
<div id="pwdEntropyLabel" style="font-size:12px;color:var(--text-muted)"></div>
</div>
</div>`;
const style = document.createElement('style');
style.textContent = `.pwd-check-label{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);cursor:pointer;padding:8px 12px;border:1px solid var(--glass-border);border-radius:8px;transition:border-color 0.2s}.pwd-check-label:hover{border-color:rgba(102,126,234,0.4)}.pwd-check-label input{accent-color:var(--accent)}.pwd-tab{background:none;border:none;padding:8px 18px;font-size:13px;font-weight:600;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color 0.2s,border-color 0.2s}.pwd-tab:hover{color:var(--text)}.pwd-tab-active{color:var(--neon)!important;border-bottom-color:var(--neon)!important}.pwd-lang-active{background:var(--accent)!important;color:#fff!important}`;
el.appendChild(style);
window._pwdDiceLang = 'en';
pwdGenPreview();
}
function pwdSwitchTab(tab) {
const isRandom = tab === 'random';
document.getElementById('pwdRandomPanel').style.display = isRandom ? '' : 'none';
document.getElementById('pwdDicewarePanel').style.display = isRandom ? 'none' : '';
document.getElementById('pwdTabRandom').classList.toggle('pwd-tab-active', isRandom);
document.getElementById('pwdTabDice').classList.toggle('pwd-tab-active', !isRandom);
document.getElementById('pwdResult').style.display = 'none';
document.getElementById('pwdStrengthPanel').style.display = isRandom ? '' : 'none';
}
async function checkPwned(pwd) {
const enc = new TextEncoder();
const buf = await crypto.subtle.digest('SHA-1', enc.encode(pwd));
const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
const prefix = hash.slice(0, 5), suffix = hash.slice(5);
try {
const res = await fetch('https:
const text = await res.text();
const match = text.split('\n').find(l => l.startsWith(suffix));
return match ? parseInt(match.split(':')[1]) : 0;
} catch (e) { return -1; }
}
function _pwdShowPwnedResult(pwd) {
clearTimeout(_pwdPwnedTimer);
const el = document.getElementById('pwdPwnedResult');
if (!el) return;
el.innerHTML = '<span style="color:var(--text-muted)">泄露检测中...</span>';
_pwdPwnedTimer = setTimeout(async () => {
const count = await checkPwned(pwd);
if (count === -1) {
el.innerHTML = '<span style="color:var(--text-muted)">泄露检测失败 (网络错误)</span>';
} else if (count === 0) {
el.innerHTML = '<span style="color:#22c55e">&#10003; 未泄露 — 该密码未出现在已知泄露数据库中</span>';
} else {
el.innerHTML = `<span style="color:#ef4444">&#9888; 已泄露 ${count.toLocaleString()} 次 — 建议更换密码</span>`;
}
}, 500);
}
function pwdDiceSetLang(lang) {
window._pwdDiceLang = lang;
document.getElementById('pwdDiceLangEN').classList.toggle('pwd-lang-active', lang === 'en');
document.getElementById('pwdDiceLangCN').classList.toggle('pwd-lang-active', lang === 'cn');
}
function pwdDiceGenerate() {
const count = +document.getElementById('pwdDiceCount').value;
const sep = document.getElementById('pwdDiceSep').value;
const lang = window._pwdDiceLang || 'en';
const list = lang === 'cn' ? _diceCN : _diceEN;
const words = [];
const arr = new Uint32Array(count);
crypto.getRandomValues(arr);
for (let i = 0; i < count; i++) words.push(list[arr[i] % list.length]);
const phrase = words.join(sep);
const entropy = (count * Math.log2(list.length)).toFixed(1);
document.getElementById('pwdDiceOutput').innerHTML = `
<div style="font-family:monospace;font-size:18px;color:var(--neon);word-break:break-all;margin-bottom:8px">${phrase}</div>
<div style="font-size:12px;color:var(--text-muted)">组合熵: ${entropy} bits &middot; ${list.length}^${count} 种可能</div>
<button class="btn btn-secondary" onclick="copyText('${phrase.replace(/'/g, "\\'")}',this)" style="margin-top:8px">复制</button>`;
}
function pwdLenChange(val) {
document.getElementById('pwdLenVal').textContent = val;
pwdGenPreview();
}
function pwdCharset() {
const upper  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lower  = 'abcdefghijklmnopqrstuvwxyz';
const nums   = '0123456789';
const sym    = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const excl   = /[0O1lI]/g;
let chars = '';
if (document.getElementById('pwdUpper').checked) chars += upper;
if (document.getElementById('pwdLower').checked) chars += lower;
if (document.getElementById('pwdNum').checked)   chars += nums;
if (document.getElementById('pwdSym').checked)   chars += sym;
if (document.getElementById('pwdExclude').checked) chars = chars.replace(excl, '');
return chars;
}
function pwdGenOne(len, chars) {
const arr = new Uint32Array(len);
crypto.getRandomValues(arr);
return Array.from(arr, v => chars[v % chars.length]).join('');
}
function pwdGenPreview() {
const len   = +document.getElementById('pwdLength').value;
const chars = pwdCharset();
if (!chars) { document.getElementById('pwdPreviewBox').textContent = ''; return; }
const pwd = pwdGenOne(len, chars);
document.getElementById('pwdPreviewBox').textContent = pwd;
const st = calcPwdStrength(pwd);
const pct = {弱:25,中:50,强:75,极强:100}[st.label] || 0;
document.getElementById('pwdStrFill').style.width = pct + '%';
document.getElementById('pwdStrFill').style.background = st.color;
document.getElementById('pwdStrLabel').textContent = st.label;
document.getElementById('pwdStrLabel').style.color = st.color;
_pwdUpdateStrengthPanel(pwd, chars);
_pwdShowPwnedResult(pwd);
}
function pwdRefreshOne() { pwdGenPreview(); }
function _pwdUpdateStrengthPanel(pwd, chars) {
const panel = document.getElementById('pwdStrengthPanel');
if (!panel) return;
panel.style.display = '';
const st      = calcPwdStrength(pwd);
const entropy = (pwd.length * Math.log2(Math.max(chars.length, 1))).toFixed(1);
const scoreMap = {弱:1, 中:2, 强:3, 极强:4};
const score    = scoreMap[st.label] || 1;
const segColors = ['#ef4444','#f97316','#eab308','#22c55e'];
const offColor  = 'rgba(255,255,255,0.08)';
for (let i = 0; i < 4; i++) {
document.getElementById('pwdSeg' + i).style.background = i < score ? segColors[score - 1] : offColor;
}
const labelEl = document.getElementById('pwdStrengthLabel');
labelEl.textContent = st.label;
labelEl.style.color = st.color;
document.getElementById('pwdEntropyLabel').textContent = `熵值 ${entropy} bits`;
}
function generatePasswords() {
const len   = +document.getElementById('pwdLength').value;
const count = +document.getElementById('pwdCount').value;
const chars = pwdCharset();
if (!chars) { showToast('请至少选择一种字符类型', 'error'); return; }
const pwds = Array.from({length: count}, () => pwdGenOne(len, chars));
const panel = document.getElementById('pwdResult');
panel.style.display = '';
panel.innerHTML = `<div class="panel-label" style="margin-bottom:12px">生成结果 (${count} 个)</div>` +
pwds.map((pwd) => {
const st = calcPwdStrength(pwd);
return `<div class="result-row" style="margin-bottom:8px;display:flex;align-items:center;gap:10px">
<span style="font-family:monospace;font-size:13px;flex:1;word-break:break-all;color:var(--neon)">${pwd}</span>
<span style="font-size:11px;padding:2px 8px;border-radius:12px;background:${st.color}22;color:${st.color};border:1px solid ${st.color}44;flex-shrink:0">${st.label}</span>
<button class="copy-inline" onclick="copyText('${pwd}',this)">复制</button>
</div>`;
}).join('');
panel._pwds = pwds;
_pwdUpdateStrengthPanel(pwds[0], chars);
}
function pwdCopyAll() {
const panel = document.getElementById('pwdResult');
if (!panel || !panel._pwds) { showToast('请先生成密码', 'info'); return; }
const text = panel._pwds.join('\n');
navigator.clipboard.writeText(text).then(() => showToast(`已复制 ${panel._pwds.length} 个密码`));
}
function calcPwdStrength(pwd) {
let score = 0;
if (pwd.length >= 8)  score++;
if (pwd.length >= 12) score++;
if (pwd.length >= 16) score++;
if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
if (/[0-9]/.test(pwd)) score++;
if (/[^A-Za-z0-9]/.test(pwd)) score++;
if (score <= 2) return { label: '弱',  color: '#ef4444' };
if (score <= 3) return { label: '中',  color: '#f97316' };
if (score <= 4) return { label: '强',  color: '#eab308' };
return              { label: '极强', color: '#22c55e' };
}