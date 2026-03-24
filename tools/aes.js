function renderAES(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;gap:10px;margin-bottom:14px">
<button class="btn btn-primary" id="aesEncBtn" onclick="setAESMode('enc')">AES 加密</button>
<button class="btn btn-secondary" id="aesDecBtn" onclick="setAESMode('dec')">AES 解密</button>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
<div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">密钥（Key）</label><input class="tool-input" id="aesKey" placeholder="任意字符串作为密钥"></div>
<div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px">模式</label>
<select class="tool-input" id="aesMode"><option value="CBC">CBC</option><option value="CTR">CTR</option></select>
</div>
</div>
<div class="panel-label">输入文本</div>
<textarea class="tool-textarea" id="aesInput" rows="5" placeholder="输入需要加密/解密的文本..."></textarea>
<div class="tool-actions">
<button class="btn btn-primary" onclick="doAES()">执行</button>
<button class="btn btn-secondary" onclick="aesSwap()">↕ 结果→输入</button>
<button class="btn btn-secondary" onclick="document.getElementById('aesInput').value='';document.getElementById('aesResult').style.display='none'">清空</button>
</div>
</div>
<div class="tool-card-panel" id="aesResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="aesStatus"></div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('aesOutput').textContent,this)">复制结果</button>
</div>
<pre class="result-box" id="aesOutput" style="white-space:pre-wrap;word-break:break-all"></pre>
</div>
<div class="tool-card-panel">
<div style="font-size:12px;color:var(--text-muted)">⚠️ 纯前端实现，使用 SubtleCrypto API，密钥不离开浏览器。CBC 模式使用随机 IV，加密结果格式为 IV:密文（Base64）。</div>
</div>`;
window._aesMode = 'enc';
}
function setAESMode(mode) {
window._aesMode = mode;
document.getElementById('aesEncBtn').className = mode==='enc'?'btn btn-primary':'btn btn-secondary';
document.getElementById('aesDecBtn').className = mode==='dec'?'btn btn-primary':'btn btn-secondary';
document.getElementById('aesResult').style.display='none';
}
async function doAES() {
const keyStr = document.getElementById('aesKey').value;
const input = document.getElementById('aesInput').value;
const mode = document.getElementById('aesMode').value;
if (!keyStr || !input) return;
const status = document.getElementById('aesStatus');
const output = document.getElementById('aesOutput');
try {
const enc = new TextEncoder();
const algName = mode === 'CTR' ? 'AES-CTR' : 'AES-CBC';
const keyData = await crypto.subtle.importKey('raw', (await crypto.subtle.digest('SHA-256', enc.encode(keyStr))), {name:algName}, false, ['encrypt','decrypt']);
if (window._aesMode === 'enc') {
const iv = crypto.getRandomValues(new Uint8Array(16));
const algParams = mode==='CTR' ? {name:'AES-CTR', counter:iv, length:64} : {name:'AES-CBC', iv};
const cipher = await crypto.subtle.encrypt(algParams, keyData, enc.encode(input));
const ivB64 = btoa(String.fromCharCode(...iv));
const cipherB64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
output.textContent = ivB64+':'+cipherB64;
status.textContent='✓ 加密完成'; status.style.color='#10b981';
} else {
let ivB64, cipherB64;
[ivB64,cipherB64]=input.split(':');
if (!ivB64 || !cipherB64) throw new Error('格式错误，请粘贴加密输出');
const iv = Uint8Array.from(atob(ivB64),c=>c.charCodeAt(0));
const cipherBuf = Uint8Array.from(atob(cipherB64),c=>c.charCodeAt(0));
const algParams = mode==='CTR' ? {name:'AES-CTR', counter:iv, length:64} : {name:'AES-CBC', iv};
const plain = await crypto.subtle.decrypt(algParams, keyData, cipherBuf);
output.textContent = new TextDecoder().decode(plain);
status.textContent='✓ 解密完成'; status.style.color='#10b981';
}
} catch(e) { output.textContent='操作失败：'+e.message; status.textContent='✗ 错误'; status.style.color='#ef4444'; }
document.getElementById('aesResult').style.display='';
}
function aesSwap() {
const out = document.getElementById('aesOutput').textContent;
if (!out) return;
document.getElementById('aesInput').value = out;
document.getElementById('aesResult').style.display = 'none';
const cur = window._aesMode || 'enc';
setAESMode(cur === 'enc' ? 'dec' : 'enc');
showToast('已填入输入框', 'info');
}