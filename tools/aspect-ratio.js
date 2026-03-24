function renderAspectRatio(container) {
container.innerHTML = `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
<div style="display:flex;flex-direction:column;gap:16px">
<div>
<div style="font-size:13px;font-weight:600;margin-bottom:12px">已知一边求另一边</div>
<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center;margin-bottom:8px">
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">宽度</div>
<input id="ar-w" type="number" min="1" placeholder="宽"
style="width:100%;padding:8px;background:rgba(255,255,255,0.04);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--text);font-size:14px;box-sizing:border-box">
</div>
<div style="color:var(--text-muted);font-size:16px;text-align:center">×</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">高度</div>
<input id="ar-h" type="number" min="1" placeholder="高"
style="width:100%;padding:8px;background:rgba(255,255,255,0.04);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--text);font-size:14px;box-sizing:border-box">
</div>
</div>
<div id="ar-result" style="padding:12px;background:rgba(102,126,234,0.08);
border:1px solid rgba(102,126,234,0.2);border-radius:10px;
font-size:14px;color:var(--text);min-height:44px;display:flex;
align-items:center;gap:8px"></div>
</div>
<div>
<div style="font-size:13px;font-weight:600;margin-bottom:12px">常用比例快速选择</div>
<div style="display:flex;flex-wrap:wrap;gap:8px" id="ar-presets"></div>
</div>
</div>
<div>
<div style="font-size:13px;font-weight:600;margin-bottom:12px">比例换算</div>
<div style="display:flex;gap:8px;margin-bottom:12px">
<input id="ratio-a" type="number" min="1" placeholder="16"
style="flex:1;padding:8px;background:rgba(255,255,255,0.04);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--text);font-size:14px">
<span style="color:var(--text-muted);font-size:18px;line-height:38px">:</span>
<input id="ratio-b" type="number" min="1" placeholder="9"
style="flex:1;padding:8px;background:rgba(255,255,255,0.04);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--text);font-size:14px">
</div>
<div style="display:flex;gap:8px;margin-bottom:8px">
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">已知宽度</div>
<input id="ratio-w-in" type="number" min="1" placeholder="1920"
style="width:100%;padding:8px;background:rgba(255,255,255,0.04);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--text);font-size:14px;box-sizing:border-box">
</div>
<div style="display:flex;align-items:flex-end;padding-bottom:8px;color:var(--text-muted)">→</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">对应高度</div>
<input id="ratio-h-out" readonly
style="width:100%;padding:8px;background:rgba(255,255,255,0.02);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--accent);font-size:14px;font-weight:600;box-sizing:border-box">
</div>
</div>
<div style="display:flex;gap:8px">
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">已知高度</div>
<input id="ratio-h-in" type="number" min="1" placeholder="1080"
style="width:100%;padding:8px;background:rgba(255,255,255,0.04);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--text);font-size:14px;box-sizing:border-box">
</div>
<div style="display:flex;align-items:flex-end;padding-bottom:8px;color:var(--text-muted)">→</div>
<div>
<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">对应宽度</div>
<input id="ratio-w-out" readonly
style="width:100%;padding:8px;background:rgba(255,255,255,0.02);
border:1px solid var(--glass-border);border-radius:8px;
color:var(--accent);font-size:14px;font-weight:600;box-sizing:border-box">
</div>
</div>
</div>
</div>
`;
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
const wIn = container.querySelector('#ar-w');
const hIn = container.querySelector('#ar-h');
const result = container.querySelector('#ar-result');
function calcRatio() {
const w = parseInt(wIn.value), h = parseInt(hIn.value);
if (!w || !h || w <= 0 || h <= 0) { result.textContent = ''; return; }
const g = gcd(w, h);
result.innerHTML = `比例: <strong style="color:var(--accent)">${w/g}:${h/g}</strong>
&nbsp; 小数: <strong style="color:var(--accent)">${(w/h).toFixed(4)}</strong>`;
}
wIn.oninput = hIn.oninput = calcRatio;
const presets = [
['1:1','1','1'], ['4:3','4','3'], ['3:2','3','2'], ['16:9','16','9'],
['16:10','16','10'], ['21:9','21','9'], ['2:1','2','1'], ['9:16','9','16']
];
const presetsBox = container.querySelector('#ar-presets');
presets.forEach(([label, a, b]) => {
const btn = document.createElement('button');
btn.textContent = label;
btn.style.cssText = 'padding:6px 12px;border-radius:20px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.04);color:var(--text-muted);font-size:12px;cursor:pointer;transition:all 0.2s';
btn.onmouseenter = () => { btn.style.borderColor = 'var(--accent)'; btn.style.color = 'var(--accent)'; };
btn.onmouseleave = () => { btn.style.borderColor = 'var(--glass-border)'; btn.style.color = 'var(--text-muted)'; };
btn.onclick = () => {
container.querySelector('#ratio-a').value = a;
container.querySelector('#ratio-b').value = b;
calcConvert();
};
presetsBox.appendChild(btn);
});
const ratioA = container.querySelector('#ratio-a');
const ratioB = container.querySelector('#ratio-b');
const ratioWIn = container.querySelector('#ratio-w-in');
const ratioHOut = container.querySelector('#ratio-h-out');
const ratioHIn = container.querySelector('#ratio-h-in');
const ratioWOut = container.querySelector('#ratio-w-out');
function calcConvert() {
const a = parseFloat(ratioA.value), b = parseFloat(ratioB.value);
if (!a || !b) return;
if (ratioWIn.value) ratioHOut.value = Math.round(parseFloat(ratioWIn.value) * b / a);
if (ratioHIn.value) ratioWOut.value = Math.round(parseFloat(ratioHIn.value) * a / b);
}
ratioA.oninput = ratioB.oninput = ratioWIn.oninput = ratioHIn.oninput = calcConvert;
};