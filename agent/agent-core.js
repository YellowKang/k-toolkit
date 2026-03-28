'use strict';
class AgentSession {
constructor({ adapter, config }) {
this.adapter = adapter;
this.config = config;
this.messages = [];
this.pageContext = {};
this.iterations = 0;
this.MAX_ITER = 8;
this._handlers = {};
this.abortController = null;
this._responseId = null;
}
on(event, fn) {
if (!this._handlers[event]) this._handlers[event] = [];
this._handlers[event].push(fn);
return this;
}
off(event, fn) {
if (!this._handlers[event]) return;
this._handlers[event] = this._handlers[event].filter(h => h !== fn);
}
emit(event, data) {
(this._handlers[event] || []).forEach(fn => { try { fn(data); } catch(e) { console.error('AgentSession emit error', e); } });
}
async send(userText) {
const mentionMatch = userText.match(/^@([\w-]+)\s*(.*)$/s);
if (mentionMatch) {
this.pageContext.forceTool = mentionMatch[1];
userText = mentionMatch[2] || userText;
} else {
this.pageContext.forceTool = null;
}
let finalText = userText;
if (window.AgentSkills) {
const skill = window.AgentSkills.matchSkill(userText);
if (skill) {
finalText = skill.buildPrompt(userText);
this.emit('skill_matched', { skill: skill.name, icon: skill.icon });
}
}
this.messages.push({ role: 'user', content: finalText });
this.emit('user', { content: userText }); 
this.iterations = 0;
await this._loop();
}
abort() {
this.abortController?.abort();
this.emit('done', { aborted: true });
}
clearHistory() {
this.messages = [];
this._responseId = null;
}
_buildSystemMsg() {
const ctx = this.pageContext;
const isEn = (ctx.lang || 'zh') === 'en';
const ctxParts = [
`${isEn ? 'Lang' : '语言'}：${ctx.lang || 'zh'}`,
`${isEn ? 'Page' : '页面'}：${ctx.page || 'home'}`,
`${isEn ? 'Tools' : '工具总数'}：${ctx.totalTools || 0}`,
`${isEn ? 'Favs' : '收藏'}：${ctx.favorites || 0}`,
];
if (ctx.forceTool) ctxParts.push(`${isEn ? 'forceTool' : '强制工具'}：${ctx.forceTool}`);
if (ctx.toolInput) ctxParts.push(`${isEn ? 'Current input' : '当前输入'}：${ctx.toolInput.slice(0, 80)}`);
if (ctx.toolOutput) ctxParts.push(`${isEn ? 'Current output' : '当前输出'}：${ctx.toolOutput.slice(0, 80)}`);
const lines = isEn ? [
'You are K Toolkit AI assistant (Agentic mode), helping developers efficiently complete dev tasks.',
'',
'## Capabilities',
'### Atomic tools (pure computation)',
'- Text: uuid_generate, json_format/validate, base64_encode/decode, wordcount, case_convert, text_diff, string_escape',
'- Dev: hash_generate, hash_all, jwt_decode, url_parse/encode/decode, regex_test, timestamp_convert, cron_parse, password_gen, curl_generate, timezone_convert, ua_parse, random_pick, env_parse, docker_generate, git_commit_generate',
'- Calc: calculate, unit_convert, date_diff, color_convert, ip_calc',
'- Convert: yaml_to_json/json_to_yaml, toml_to_json/json_to_toml, xml_format/xml_to_json, sql_format, json_diff, morse_encode/decode, aes_encrypt/decrypt',
'- CSS: gradient_generate, shadow_generate, flexbox_generate, css_unit_convert, color_contrast_check, palette_generate',
'### Composite tools',
'- hash_all: all hashes at once | text_pipeline: chain steps | batch_convert: batch ops | format_and_validate: JSON format+check',
'### Navigation & page interaction (side effects)',
'- navigate_to_tool, fill_and_run_tool, read_tool_output, search_tools, get_current_context',
'- list_categories, list_skills, toggle_favorite, get_favorites, get_recent, show_toast, show_result_panel',
'',
'## Context',
ctxParts.join(' | '),
'',
'## Rules',
'1. **Search first, always**: ALWAYS call search_tools FIRST before any navigate_to_tool. Use the real tool ID returned by search_tools. Never guess a tool ID.',
'2. **Page tool first**: If search_tools finds a matching page tool, MUST navigate_to_tool → fill_and_run_tool → read_tool_output → show result. Users want to SEE and INTERACT with the tool UI. Do NOT fall back to atomic computation if a page tool exists.',
'3. **Result panel for atomic only**: Use atomic/composite actions + show_result_panel ONLY when search_tools confirms no matching page tool exists.',
'4. Pick optimal tool: hash_all for multiple hashes, text_pipeline for chained ops, batch_convert for bulk.',
'5. If forceTool is set, search_tools with that name first, then navigate.',
'6. Multi-step tasks: execute all steps then reply. No intermediate confirmations.',
'7. NEVER fabricate tool results. Report errors honestly.',
'8. Be concise. Show results directly.',
'9. If current page has input content, proactively offer help based on what you see.',
] : [
'你是 K Toolkit 的 AI 助手（Agentic 模式），帮助开发者高效完成编程相关任务。',
'',
'## 能力范围',
'### 原子工具（直接计算）',
'- 文本：uuid_generate, json_format/validate, base64_encode/decode, wordcount, case_convert, text_diff, string_escape',
'- 开发：hash_generate, hash_all, jwt_decode, url_parse/encode/decode, regex_test, timestamp_convert, cron_parse, password_gen, curl_generate, timezone_convert, ua_parse, random_pick, env_parse, docker_generate, git_commit_generate',
'- 计算：calculate, unit_convert, date_diff, color_convert, ip_calc',
'- 转换：yaml_to_json/json_to_yaml, toml_to_json/json_to_toml, xml_format/xml_to_json, sql_format, json_diff, morse_encode/decode, aes_encrypt/decrypt',
'- CSS：gradient_generate, shadow_generate, flexbox_generate, css_unit_convert, color_contrast_check, palette_generate',
'### 组合工具',
'- hash_all：全部哈希 | text_pipeline：串联处理 | batch_convert：批量 | format_and_validate：JSON格式化+校验',
'### 导航 & 页面交互（有副作用）',
'- navigate_to_tool, fill_and_run_tool, read_tool_output, search_tools, get_current_context',
'- list_categories, list_skills, toggle_favorite, get_favorites, get_recent, show_toast, show_result_panel',
'',
'## 当前上下文',
ctxParts.join(' | '),
'',
'## 行为规则',
'1. 【先搜索，必须】任何操作前必须先调 search_tools，用返回的真实 toolId，绝不猜测工具 ID。',
'2. 【页面工具优先，必须导航】search_tools 找到页面工具后，必须 navigate_to_tool → fill_and_run_tool → read_tool_output → 展示结果。用户需要看到并与工具 UI 交互。禁止在有页面工具时回退到直接计算。',
'3. 【结果面板兜底】仅当 search_tools 确认无对应页面工具时，才用原子/组合 action + show_result_panel 展示结果。',
'4. 【选最优工具】多哈希用 hash_all；多步用 text_pipeline；批量用 batch_convert。',
'5. 【@mention 优先】forceTool 存在时先 search_tools 该名称再导航。',
'6. 【多步串联】自动执行完再回复，无需逐步确认。',
'7. 【严禁幻觉】不得伪造工具执行结果。工具失败如实报告。',
'8. 【简洁回复】结果直接给，不废话。',
'9. 【主动感知】如果当前页面有用户输入内容，可主动提供帮助建议。',
];
return { role: 'system', content: lines.join('\n') };
}
_extractDiscoveredSchemas() {
const schemas = new Map();
for (const msg of this.messages) {
if (msg.role !== 'tool' || msg.name !== 'search_tools') continue;
try {
const result = JSON.parse(msg.content);
const actions = result.data && result.data.actions;
if (Array.isArray(actions)) {
for (const a of actions) {
if (a.schema && a.schema.name && !schemas.has(a.schema.name)) {
schemas.set(a.schema.name, a.schema);
}
}
}
} catch {  }
}
return schemas;
}
_getEffectiveTools() {
const core = window._AGENT_CORE_ACTIONS || [];
const discovered = this._extractDiscoveredSchemas();
if (discovered.size === 0) return core;
const extra = [...discovered.values()].slice(0, 20);
return [...core, ...extra];
}
async _loop() {
if (this.iterations >= this.MAX_ITER) {
this.emit('error', { reason: 'max_iterations', message: `已达最大迭代次数 ${this.MAX_ITER}` });
return;
}
this.iterations++;
this.abortController = new AbortController();
this.emit('thinking', {});
let resp;
try {
let safeBaseUrl = this.config.baseUrl || '';
if (safeBaseUrl && location.protocol === 'https:' && safeBaseUrl.startsWith('http://')) {
safeBaseUrl = safeBaseUrl.replace(/^http:\/\//, 'https://');
if (!this._mixedContentWarned) {
this._mixedContentWarned = true;
const msg = (this.config.lang || 'zh') === 'en'
? 'HTTPS page cannot access HTTP API. Auto-upgraded to HTTPS. If it fails, please configure an HTTPS API address.'
: '当前 HTTPS 页面无法访问 HTTP API，已自动升级为 HTTPS。如果连接失败，请配置 HTTPS 地址的 API。';
if (typeof showToast === 'function') showToast(msg, 'warn', 6000);
}
}
const chatParams = {
messages:    [this._buildSystemMsg(), ...this.messages],
tools:       this._getEffectiveTools(),
model:       this.config.model || this.adapter.defaultModel,
max_tokens:  this.config.max_tokens || 2000,
temperature: this.config.temperature ?? 0.7,
baseUrl:     safeBaseUrl,
apiKey:      this.config.apiKey || window.AgentConfig.AG.getKey(this.adapter.id),
signal:      this.abortController.signal,
};
if (this.adapter.id === 'openai-response' && this._responseId) {
chatParams._responseId = this._responseId;
}
resp = await this.adapter.chat(chatParams);
if (resp._responseId) this._responseId = resp._responseId;
} catch (e) {
if (e.name === 'AbortError') return;
this.emit('error', { reason: 'network', message: e.message });
return;
}
if (resp.stop_reason === 'tool_use') {
this.messages.push(resp.message);
this.emit('tool_start', { tool_calls: resp.message.tool_calls });
const results = await Promise.all(
resp.message.tool_calls.map(tc => this._exec(tc))
);
for (const r of results) {
this.messages.push({
role: 'tool',
tool_call_id: r.id,
name: r.name,
content: JSON.stringify(r.result),
});
}
this.emit('tool_done', { results });
await this._loop();
} else if (resp.stop_reason === 'end') {
this.messages.push(resp.message);
this.emit('assistant', { content: resp.message.content, usage: resp.usage });
this.emit('done', {});
} else {
this.emit('error', { reason: resp.stop_reason || 'unknown' });
}
}
async _exec(tc) {
const name = tc.function.name;
let params;
try { params = JSON.parse(tc.function.arguments || '{}'); }
catch { params = {}; }
const action = window._AGENT_ALL_ACTIONS
? window._AGENT_ALL_ACTIONS.get(name)
: (window._AGENT_ACTIONS || []).find(a => a.name === name);
let result;
try {
if (!action) {
result = { success: false, error: `未知 action: ${name}` };
} else {
const timeout = new Promise((_, reject) =>
setTimeout(() => reject(new Error('Action 执行超时 (15s)')), 15000));
result = await Promise.race([action.execute(params), timeout]);
}
} catch (e) {
result = { success: false, error: e.message };
}
return { id: tc.id, name, params, result };
}
}
window.AgentSession = AgentSession;