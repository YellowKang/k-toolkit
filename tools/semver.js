window.renderSemver = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">Semver 版本比较</div>
<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:12px">
<input class="tool-input" id="svA" placeholder="版本 A（如 1.2.3）" oninput="doSemver()">
<span style="color:var(--text-muted);font-size:18px">vs</span>
<input class="tool-input" id="svB" placeholder="版本 B（如 2.0.0-beta.1）" oninput="doSemver()">
</div>
<div id="svResult" style="min-height:40px"></div>
</div>
<div class="tool-card-panel">
<div class="panel-label">版本解析</div>
<input class="tool-input" id="svParse" placeholder="输入版本号（如 2.3.1-alpha.2+build.456）" oninput="doSvParse()" style="margin-bottom:10px">
<div id="svParseResult"></div>
</div>`;
};
function _svParse(v) {
const m = (v||'').match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.]+))?(?:\+([\w.]+))?$/);
if (!m) return null;
return {major:+m[1],minor:+m[2],patch:+m[3],pre:m[4]||'',build:m[5]||''};
}
function _svCmp(a, b) {
const pa=_svParse(a), pb=_svParse(b);
if (!pa||!pb) return null;
for (const k of ['major','minor','patch']) {
if (pa[k]!==pb[k]) return pa[k]>pb[k]?1:-1;
}
if (!pa.pre&&!pb.pre) return 0;
if (!pa.pre) return 1;
if (!pb.pre) return -1;
return pa.pre<pb.pre?-1:pa.pre>pb.pre?1:0;
}
function doSemver() {
const a=document.getElementById('svA').value.trim();
const b=document.getElementById('svB').value.trim();
const el=document.getElementById('svResult');
if (!a||!b){el.innerHTML='';return;}
const r=_svCmp(a,b);
if (r===null){el.innerHTML='<span style="color:#ef4444">格式错误，请输入合法 semver</span>';return;}
const [sym,color,label]=r>0?['>','#10b981','A 更新']:r<0?['<','#f59e0b','B 更新']:['=','#60a5fa','版本相同'];
el.innerHTML=`<div style="text-align:center;padding:12px"><span style="font-size:32px;font-weight:700;color:${color}">${sym}</span> <span style="font-size:14px;color:var(--text-muted)">${label}</span></div>`;
}
function doSvParse() {
const v=document.getElementById('svParse').value.trim();
const el=document.getElementById('svParseResult');
if (!v){el.innerHTML='';return;}
const p=_svParse(v);
if (!p){el.innerHTML='<span style="color:#ef4444">不是合法的 semver 格式</span>';return;}
const fields=[['主版本',p.major],['次版本',p.minor],['补丁版本',p.patch],['预发布',p.pre||'-'],['构建元数据',p.build||'-']];
el.innerHTML='<div style="display:flex;gap:8px;flex-wrap:wrap">'+fields.map(([k,v])=>
`<div style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:11px;color:var(--text-muted)">${k}</div><div style="font-size:16px;font-weight:600;color:var(--text)">${v}</div></div>`).join('')+'</div>';
}