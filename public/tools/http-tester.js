function renderHttpTester(el) {
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">HTTP 请求测试</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;padding:8px 12px;background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.2);border-radius:8px">⚠️ 浏览器安全限制：跨域请求可能因 CORS 策略被拦截。建议测试同域或已配置 CORS 的接口，或使用后端代理。</div>
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <select class="tool-input" id="htMethod" style="width:110px">
          <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option>
        </select>
        <input class="tool-input" id="htUrl" placeholder="https://api.example.com/endpoint" style="flex:1">
        <button class="btn btn-primary" onclick="doHttpTest()" id="htSendBtn">发送</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">请求头（每行 Key: Value）</div>
          <textarea class="tool-textarea" id="htHeaders" rows="4" placeholder="Content-Type: application/json\nAuthorization: Bearer token"></textarea>
        </div>
        <div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">请求体（JSON）</div>
          <textarea class="tool-textarea" id="htBody" rows="4" placeholder='{"key": "value"}'></textarea>
        </div>
      </div>
    </div>
    <div class="tool-card-panel" id="htResult" style="display:none">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span id="htStatusBadge" style="padding:4px 12px;border-radius:20px;font-weight:700;font-size:13px"></span>
          <span id="htTime" style="font-size:12px;color:var(--text-muted)"></span>
        </div>
        <button class="btn btn-secondary" onclick="copyText(document.getElementById('htResBody').textContent,this)">复制响应</button>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">响应头</div>
      <pre id="htResHeaders" class="result-box" style="max-height:120px;overflow-y:auto;margin-bottom:10px;font-size:11px"></pre>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px">响应体</div>
      <pre id="htResBody" class="result-box" style="max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-all"></pre>
    </div>
    <div class="tool-card-panel" style="font-size:12px;color:var(--text-muted)">
      ⚠️ 受浏览器同源策略限制，跨域请求可能失败。可配合本地代理或测试允许跨域的接口。
    </div>`;
}

async function doHttpTest() {
  const url = document.getElementById('htUrl').value.trim();
  if (!url) return;
  const method = document.getElementById('htMethod').value;
  const headersRaw = document.getElementById('htHeaders').value.trim();
  const bodyRaw = document.getElementById('htBody').value.trim();
  const btn = document.getElementById('htSendBtn');
  btn.textContent = '请求中...'; btn.disabled = true;
  const headers = {};
  headersRaw.split('\n').forEach(line => { const [k,...v]=line.split(':'); if(k&&v.length) headers[k.trim()]=v.join(':').trim(); });
  const opts = { method, headers };
  if (bodyRaw && !['GET','HEAD'].includes(method)) opts.body = bodyRaw;
  const t0 = Date.now();
  try {
    const res = await fetch(url, opts);
    const elapsed = Date.now()-t0;
    const resText = await res.text();
    let resBody = resText;
    try { resBody = JSON.stringify(JSON.parse(resText),null,2); } catch(_){}
    const badge = document.getElementById('htStatusBadge');
    badge.textContent = res.status+' '+res.statusText;
    badge.style.background = res.ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)';
    badge.style.color = res.ok?'#10b981':'#ef4444';
    document.getElementById('htTime').textContent = elapsed+'ms';
    let hText='';
    res.headers.forEach((v,k)=>hText+=k+': '+v+'\n');
    document.getElementById('htResHeaders').textContent = hText;
    document.getElementById('htResBody').textContent = resBody;
  } catch(e) {
    document.getElementById('htResBody').textContent = '请求失败：'+e.message;
    const badge = document.getElementById('htStatusBadge');
    badge.textContent='网络错误'; badge.style.background='rgba(239,68,68,0.2)'; badge.style.color='#ef4444';
  }
  document.getElementById('htResult').style.display='';
  btn.textContent='发送'; btn.disabled=false;
}
