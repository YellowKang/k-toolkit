const _ltI18nDict = {
zh: {
input_label:  '输入文本',
placeholder:  '粘贴或输入文本，实时估算 Token 数量与费用...',
clear:        '清空',
chars:        '字符数',
tokens:       '估算 Tokens',
lines:        '行数',
price_title:  '模型费用估算（输入价格）',
model:        '模型',
price_per_1m: '价格 / 1M tokens',
est_cost:     '预估费用',
edit_hint:    '点击价格可编辑',
no_text:      '请输入文本后查看估算',
},
en: {
input_label:  'Input Text',
placeholder:  'Paste or type text to estimate tokens and cost...',
clear:        'Clear',
chars:        'Characters',
tokens:       'Est. Tokens',
lines:        'Lines',
price_title:  'Model Cost Estimate (Input Price)',
model:        'Model',
price_per_1m: 'Price / 1M tokens',
est_cost:     'Est. Cost',
edit_hint:    'Click price to edit',
no_text:      'Enter text to see estimates',
},
};
let _ltT = null;
let _ltDebounce = null;
const _ltModels = [
{ id: 'gpt4o',     name: 'GPT-4o',         price: 2.50 },
{ id: 'gpt4omini', name: 'GPT-4o-mini',    price: 0.15 },
{ id: 'sonnet4',   name: 'Claude Sonnet 4', price: 3.00 },
{ id: 'haiku',     name: 'Claude Haiku',    price: 0.80 },
];
function renderLlmToken(el) {
_ltT = makeToolI18n(_ltI18nDict);
const T = _ltT;
el.innerHTML = `
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0">${T('input_label')}</div>
<button class="btn btn-secondary" onclick="ltClear()">${T('clear')}</button>
</div>
<textarea class="tool-textarea" id="ltInput" rows="10" placeholder="${T('placeholder')}"></textarea>
</div>
<div id="ltStats" style="display:none">
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px" id="ltStatsGrid"></div>
<div class="tool-card-panel">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
<div class="panel-label" style="margin:0">${T('price_title')}</div>
<span style="font-size:11px;color:var(--text-muted)">${T('edit_hint')}</span>
</div>
<table style="width:100%;border-collapse:collapse;font-size:13px">
<thead>
<tr style="color:var(--text-muted);font-size:12px;text-align:left">
<th style="padding:8px 10px;border-bottom:1px solid var(--glass-border)">${T('model')}</th>
<th style="padding:8px 10px;border-bottom:1px solid var(--glass-border)">${T('price_per_1m')}</th>
<th style="padding:8px 10px;border-bottom:1px solid var(--glass-border);text-align:right">${T('est_cost')}</th>
</tr>
</thead>
<tbody id="ltPriceBody"></tbody>
</table>
</div>
</div>
<div id="ltEmpty" class="result-box" style="text-align:center;color:var(--text-muted);padding:24px">${T('no_text')}</div>`;
ltRenderPriceRows();
document.getElementById('ltInput').addEventListener('input', ltOnInput);
}
function ltOnInput() {
clearTimeout(_ltDebounce);
_ltDebounce = setTimeout(ltUpdate, 80);
}
function ltEstimateTokens(text) {
const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
const engTokens = nonCjk.trim()
? nonCjk.trim().split(/\s+/).reduce((sum, w) => sum + Math.max(1, Math.ceil(w.length / 4)), 0)
: 0;
return engTokens + Math.ceil(cjkChars / 1.5);
}
function ltEstimateChunked(text) {
const CHUNK = 10240;
if (text.length <= CHUNK) return ltEstimateTokens(text);
let total = 0;
for (let i = 0; i < text.length; i += CHUNK) {
total += ltEstimateTokens(text.slice(i, i + CHUNK));
}
return total;
}
function ltUpdate() {
const text = document.getElementById('ltInput').value;
const stats = document.getElementById('ltStats');
const empty = document.getElementById('ltEmpty');
if (!text) { stats.style.display = 'none'; empty.style.display = ''; return; }
stats.style.display = '';
empty.style.display = 'none';
const chars = text.length;
const tokens = ltEstimateChunked(text);
const lines = text.split('\n').length;
const items = [
{ label: _ltT('chars'),  val: chars,  color: 'var(--accent)' },
{ label: _ltT('tokens'), val: tokens, color: '#67e8f9' },
{ label: _ltT('lines'),  val: lines,  color: '#fbbf24' },
];
document.getElementById('ltStatsGrid').innerHTML = items.map(item =>
`<div style="padding:16px 14px;background:rgba(0,0,0,0.25);border:1px solid var(--glass-border);border-radius:12px;text-align:center">
<div style="font-size:28px;font-weight:800;color:${item.color}">${item.val.toLocaleString()}</div>
<div style="font-size:11px;color:var(--text-muted);margin-top:4px">${item.label}</div>
</div>`).join('');
ltUpdateCosts(tokens);
}
function ltRenderPriceRows() {
const body = document.getElementById('ltPriceBody');
if (!body) return;
body.innerHTML = _ltModels.map((m, i) =>
`<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
<td style="padding:10px;color:var(--text);font-weight:600">${m.name}</td>
<td style="padding:10px">
<span style="color:var(--text-muted)">$</span>
<input type="number" id="ltPrice_${i}" value="${m.price}" step="0.01" min="0"
style="background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);border-radius:6px;color:var(--neon);
padding:4px 8px;width:80px;font-size:13px;font-family:monospace;outline:none"
onchange="ltPriceChange(${i},this.value)" oninput="ltPriceChange(${i},this.value)">
</td>
<td id="ltCost_${i}" style="padding:10px;text-align:right;font-family:monospace;color:var(--neon);font-weight:700">-</td>
</tr>`).join('');
}
function ltPriceChange(idx, val) {
const price = parseFloat(val);
if (!isNaN(price) && price >= 0) {
_ltModels[idx].price = price;
const text = document.getElementById('ltInput').value;
if (text) ltUpdateCosts(ltEstimateChunked(text));
}
}
function ltUpdateCosts(tokens) {
_ltModels.forEach((m, i) => {
const el = document.getElementById('ltCost_' + i);
if (!el) return;
const cost = (tokens / 1_000_000) * m.price;
el.textContent = cost < 0.000001 ? '$0.00' : cost < 0.01 ? `$${cost.toFixed(6)}` : `$${cost.toFixed(4)}`;
});
}
function ltClear() {
document.getElementById('ltInput').value = '';
document.getElementById('ltStats').style.display = 'none';
document.getElementById('ltEmpty').style.display = '';
}