let _hmacTimer = null;
const _hmacI18nDict = {
zh: {
message:      '消息内容',
msg_ph:       '输入要签名的消息...',
secret:       '密钥',
secret_ph:    '输入 HMAC 密钥...',
algorithm:    '算法',
output_fmt:   '输出格式',
generate:     '生成 HMAC',
result:       'HMAC 结果',
copy:         '复制',
copied:       '已复制',
empty_msg:    '请输入消息内容',
empty_key:    '请输入密钥',
error:        '生成失败: ',
clear:        '清空',
},
en: {
message:      'Message',
msg_ph:       'Enter message to sign...',
secret:       'Secret Key',
secret_ph:    'Enter HMAC secret key...',
algorithm:    'Algorithm',
output_fmt:   'Output Format',
generate:     'Generate HMAC',
result:       'HMAC Result',
copy:         'Copy',
copied:       'Copied',
empty_msg:    'Please enter a message',
empty_key:    'Please enter a secret key',
error:        'Generation failed: ',
clear:        'Clear',
},
};
let _hmacT = null;
function renderHmacGen(el) {
_hmacT = makeToolI18n(_hmacI18nDict);
const T = _hmacT;
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label" style="margin-bottom:8px">${T('message')}</div>
<textarea class="tool-textarea" id="hmacMsg" rows="5" placeholder="${T('msg_ph')}" oninput="_hmacAutoCalc()"></textarea>
<div class="panel-label" style="margin-top:14px;margin-bottom:8px">${T('secret')}</div>
<input class="tool-input" id="hmacKey" type="text" placeholder="${T('secret_ph')}" oninput="_hmacAutoCalc()">
<div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px;align-items:center">
<div style="display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:13px">${T('algorithm')}</span>
<select class="tool-input" id="hmacAlgo" style="width:auto" onchange="_hmacAutoCalc()">
<option value="SHA-256" selected>SHA-256</option>
<option value="SHA-384">SHA-384</option>
<option value="SHA-512">SHA-512</option>
<option value="SHA-1">SHA-1</option>
</select>
</div>
<div style="display:flex;align-items:center;gap:8px">
<span style="color:var(--text-muted);font-size:13px">${T('output_fmt')}</span>
<button class="btn btn-primary" id="hmacFmtHex" onclick="_hmacSetFmt('hex')" style="padding:4px 14px;font-size:12px">Hex</button>
<button class="btn btn-secondary" id="hmacFmtB64" onclick="_hmacSetFmt('base64')" style="padding:4px 14px;font-size:12px">Base64</button>
</div>
</div>
<div class="tool-actions" style="margin-top:14px;display:flex;gap:10px">
<button class="btn btn-primary" onclick="_hmacGenerate()">${T('generate')}</button>
<button class="btn btn-secondary" onclick="_hmacClear()">${T('clear')}</button>
</div>
</div>
<div class="tool-card-panel" id="hmacResultPanel" style="display:none">
<div class="panel-label" style="margin-bottom:8px">${T('result')}</div>
<div class="result-box" id="hmacResult" style="font-family:monospace;font-size:13px;word-break:break-all;padding:14px;background:rgba(0,0,0,0.3);border:1px solid var(--glass-border);border-radius:10px;color:var(--neon);min-height:40px"></div>
<button class="btn btn-secondary" id="hmacCopyBtn" onclick="_hmacCopy()" style="margin-top:10px">${T('copy')}</button>
</div>`;
window._hmacFmt = 'hex';
}
function _hmacSetFmt(fmt) {
window._hmacFmt = fmt;
const isHex = fmt === 'hex';
document.getElementById('hmacFmtHex').className = isHex ? 'btn btn-primary' : 'btn btn-secondary';
document.getElementById('hmacFmtB64').className = isHex ? 'btn btn-secondary' : 'btn btn-primary';
_hmacAutoCalc();
}
function _hmacAutoCalc() {
clearTimeout(_hmacTimer);
_hmacTimer = setTimeout(() => _hmacGenerate(true), 300);
}
async function _hmacGenerate(silent) {
const T = _hmacT || makeToolI18n(_hmacI18nDict);
const msg = document.getElementById('hmacMsg').value;
const key = document.getElementById('hmacKey').value;
if (!msg || !key) {
if (!silent) showToast(T(!msg ? 'empty_msg' : 'empty_key'), 'info');
document.getElementById('hmacResultPanel').style.display = 'none';
return;
}
try {
const algo = document.getElementById('hmacAlgo').value;
const buf = await _hmacCompute(algo, key, msg);
const fmt = window._hmacFmt || 'hex';
const out = fmt === 'base64'
? btoa(String.fromCharCode(...new Uint8Array(buf)))
: Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
document.getElementById('hmacResult').textContent = out;
document.getElementById('hmacResultPanel').style.display = '';
} catch (e) {
if (!silent) showToast(T('error') + e.message, 'error');
}
}
async function _hmacCompute(algo, key, message) {
const enc = new TextEncoder();
const cryptoKey = await crypto.subtle.importKey(
'raw', enc.encode(key), { name: 'HMAC', hash: algo }, false, ['sign']
);
return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
}
function _hmacCopy() {
const T = _hmacT || makeToolI18n(_hmacI18nDict);
const text = document.getElementById('hmacResult').textContent;
if (text) copyText(text, document.getElementById('hmacCopyBtn'));
}
function _hmacClear() {
document.getElementById('hmacMsg').value = '';
document.getElementById('hmacKey').value = '';
document.getElementById('hmacResultPanel').style.display = 'none';
clearTimeout(_hmacTimer);
}