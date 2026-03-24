window.renderDockerGen = function(el) {
el.innerHTML = `
<div class="tool-card-panel">
<div class="panel-label">配置</div>
<div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:12px">
<div style="display:flex;flex-direction:column;gap:6px">
<label style="font-size:12px;color:#6b7280;font-weight:500">语言/框架</label>
<select class="tool-input" id="dgLang" onchange="dgUpdatePort()" style="min-width:140px">
<option value="node">Node.js</option>
<option value="python">Python</option>
<option value="go">Go</option>
<option value="java">Java</option>
<option value="nginx">Nginx</option>
</select>
</div>
<div style="display:flex;flex-direction:column;gap:6px">
<label style="font-size:12px;color:#6b7280;font-weight:500">端口</label>
<input class="tool-input" id="dgPort" type="number" value="3000" style="width:90px">
</div>
<div style="display:flex;flex-direction:column;gap:6px">
<label style="font-size:12px;color:#6b7280;font-weight:500">应用名称</label>
<input class="tool-input" id="dgAppName" type="text" value="myapp" placeholder="myapp" style="width:130px">
</div>
</div>
<div class="tool-actions">
<button class="btn btn-primary" onclick="dgGenerate()">生成 Dockerfile</button>
</div>
</div>
<div class="tool-card-panel" id="dgResult" style="display:none">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
<div class="panel-label" style="margin:0" id="dgStatus"></div>
<button class="btn btn-secondary" onclick="copyText(document.getElementById('dgOutput').value,this)">复制</button>
</div>
<textarea class="tool-textarea" id="dgOutput" rows="22" readonly style="font-family:monospace;font-size:13px;background:#1e1e2e;color:#cdd6f4;border-color:#313244"></textarea>
</div>`;
};
var DG_PORTS = { node: 3000, python: 8000, go: 8080, java: 8080, nginx: 80 };
function dgUpdatePort() {
var lang = document.getElementById('dgLang').value;
document.getElementById('dgPort').value = DG_PORTS[lang] || 3000;
}
function dgGenerate() {
var lang = document.getElementById('dgLang').value;
var port = document.getElementById('dgPort').value || DG_PORTS[lang];
var app = (document.getElementById('dgAppName').value || 'myapp').trim();
var tpl = DG_TEMPLATES[lang];
if (!tpl) return;
var out = tpl(app, port);
document.getElementById('dgOutput').value = out;
document.getElementById('dgStatus').textContent = '✓ 已生成 Dockerfile (' + lang + ', port ' + port + ')';
document.getElementById('dgStatus').style.color = '#10b981';
document.getElementById('dgResult').style.display = '';
}
var DG_TEMPLATES = {
node: function(app, port) {
return '# Stage 1: build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\n\n# Stage 2: production\nFROM node:20-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY --from=builder /app .\nRUN addgroup -S appgroup && adduser -S ' + app + ' -G appgroup\nUSER ' + app + '\nEXPOSE ' + port + '\nCMD ["node", "src/index.js"]\n';
},
python: function(app, port) {
return 'FROM python:3.12-slim\nWORKDIR /app\n\n# Install dependencies\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\n# Non-root user\nRUN useradd -m ' + app + '\nUSER ' + app + '\n\nEXPOSE ' + port + '\nCMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "' + port + '"]\n';
},
go: function(app, port) {
return '# Stage 1: build\nFROM golang:1.22-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ' + app + ' ./cmd/main.go\n\n# Stage 2: minimal runtime\nFROM scratch\nCOPY --from=builder /app/' + app + ' /' + app + '\nCOPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/\nEXPOSE ' + port + '\nENTRYPOINT ["/' + app + '"]\n';
},
java: function(app, port) {
return '# Stage 1: build\nFROM maven:3.9-eclipse-temurin-21 AS builder\nWORKDIR /app\nCOPY pom.xml .\nRUN mvn dependency:go-offline -q\nCOPY src ./src\nRUN mvn package -DskipTests -q\n\n# Stage 2: runtime\nFROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nRUN addgroup -S appgroup && adduser -S ' + app + ' -G appgroup\nUSER ' + app + '\nCOPY --from=builder /app/target/*.jar app.jar\nEXPOSE ' + port + '\nENTRYPOINT ["java", "-jar", "app.jar"]\n';
},
nginx: function(app, port) {
return `FROM nginx:1.27-alpine
# Remove default config
RUN rm /etc/nginx/conf.d/default.conf
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/${app}.conf
# Copy static files
COPY dist/ /usr/share/nginx/html/
# Non-root: use port ${port} and own nginx dirs
RUN chown -R nginx:nginx /usr/share/nginx/html \\
&& chmod -R 755 /usr/share/nginx/html
EXPOSE ${port}
CMD ["nginx", "-g", "daemon off;"]
`;
}
};