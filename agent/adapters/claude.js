'use strict';
const ClaudeAdapter = {
id: 'claude',
name: 'Claude',
defaultModel: 'claude-sonnet-4-6',
models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-5-haiku-20241022'],
async chat({ messages, tools, model, max_tokens, temperature, baseUrl, apiKey, signal }) {
const base = baseUrl || 'https:
const url = `${base}/v1/messages`;
const sysMsg = messages.find(m => m.role === 'system');
const chatMsgs = messages.filter(m => m.role !== 'system');
const claudeMsgs = [];
for (const m of chatMsgs) {
if (m.role === 'assistant') {
const content = [];
if (m.content) content.push({ type: 'text', text: m.content });
if (m.tool_calls) {
for (const tc of m.tool_calls) {
content.push({
type: 'tool_use',
id: tc.id,
name: tc.function.name,
input: JSON.parse(tc.function.arguments || '{}'),
});
}
}
claudeMsgs.push({ role: 'assistant', content });
} else if (m.role === 'tool') {
const last = claudeMsgs[claudeMsgs.length - 1];
const toolResult = {
type: 'tool_result',
tool_use_id: m.tool_call_id,
content: m.content,
};
if (last && last.role === 'user' && Array.isArray(last.content)) {
last.content.push(toolResult);
} else {
claudeMsgs.push({ role: 'user', content: [toolResult] });
}
} else {
claudeMsgs.push({ role: m.role, content: m.content });
}
}
const claudeTools = (tools || []).map(a => ({
name: a.name,
description: a.description,
input_schema: a.parameters,
}));
const body = {
model: model || this.defaultModel,
max_tokens: max_tokens || 2000,
temperature: temperature ?? 0.7,
messages: claudeMsgs,
};
if (sysMsg) body.system = sysMsg.content;
if (claudeTools.length) body.tools = claudeTools;
const resp = await fetch(url, {
method: 'POST',
signal,
headers: {
'Content-Type': 'application/json',
'x-api-key': apiKey || '',
'anthropic-version': '2023-06-01',
'anthropic-dangerous-direct-browser-access': 'true',
},
body: JSON.stringify(body),
});
if (!resp.ok) {
const err = await resp.text();
throw new Error(`Claude API error ${resp.status}: ${err}`);
}
const raw = await resp.json();
const toolCalls = [];
let textContent = '';
for (const block of (raw.content || [])) {
if (block.type === 'tool_use') {
toolCalls.push({
id: block.id,
type: 'function',
function: { name: block.name, arguments: JSON.stringify(block.input) },
});
} else if (block.type === 'text') {
textContent += block.text;
}
}
const stopReason = raw.stop_reason === 'tool_use' ? 'tool_use'
: raw.stop_reason === 'max_tokens' ? 'max_tokens'
: 'end';
const message = { role: 'assistant', content: textContent };
if (toolCalls.length) message.tool_calls = toolCalls;
return {
message,
stop_reason: stopReason,
usage: { input: raw.usage?.input_tokens || 0, output: raw.usage?.output_tokens || 0 },
raw,
};
},
};
window.ClaudeAdapter = ClaudeAdapter;