'use strict';
const OpenAIResponseAdapter = {
id: 'openai-response',
name: 'OpenAI Response',
defaultModel: 'gpt-5.4',
models: [
'gpt-5.4', 'gpt-5.4-pro', 'gpt-5.4-mini',
'gpt-5.3-chat-latest', 'gpt-5.3-codex',
'gpt-5.2', 'gpt-5.2-codex',
'gpt-4.1', 'gpt-4o', 'o3', 'o4-mini',
],
async chat({ messages, tools, model, max_tokens, temperature, baseUrl, apiKey, signal, _responseId }) {
const base = baseUrl || 'https://api.openai.com';
const url = `${base}/v1/responses`;
const sysMsg = messages.find(m => m.role === 'system');
const inputMsgs = messages.filter(m => m.role !== 'system').map(m => {
if (m.role === 'tool') {
return { type: 'function_call_output', call_id: m.tool_call_id, output: m.content };
}
if (m.role === 'assistant' && m.tool_calls) {
const items = [];
if (m.content) items.push({ type: 'text', text: m.content });
for (const tc of m.tool_calls) {
items.push({ type: 'function_call', call_id: tc.id, name: tc.function.name, arguments: tc.function.arguments });
}
return { role: 'assistant', content: items };
}
return { role: m.role, content: m.content };
});
const oaiTools = (tools || []).map(a => ({
type: 'function',
name: a.name,
description: a.description,
parameters: a.parameters,
}));
const body = {
model: model || this.defaultModel,
max_output_tokens: max_tokens || 2000,
temperature: temperature ?? 0.7,
input: inputMsgs,
};
if (sysMsg) body.instructions = sysMsg.content;
if (oaiTools.length) body.tools = oaiTools;
if (_responseId) body.previous_response_id = _responseId;
const resp = await fetch(url, {
method: 'POST',
signal,
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${apiKey || ''}`,
},
body: JSON.stringify(body),
});
if (!resp.ok) {
const err = await resp.text();
throw new Error(`OpenAI Responses API error ${resp.status}: ${err}`);
}
const raw = await resp.json();
const toolCalls = [];
let textContent = '';
for (const item of (raw.output || [])) {
if (item.type === 'function_call') {
toolCalls.push({
id: item.call_id,
type: 'function',
function: { name: item.name, arguments: item.arguments },
});
} else if (item.type === 'message') {
for (const c of (item.content || [])) {
if (c.type === 'output_text') textContent += c.text;
}
}
}
const stopReason = toolCalls.length ? 'tool_use' : 'end';
const message = { role: 'assistant', content: textContent };
if (toolCalls.length) message.tool_calls = toolCalls;
return {
message,
stop_reason: stopReason,
usage: { input: raw.usage?.input_tokens || 0, output: raw.usage?.output_tokens || 0 },
raw,
_responseId: raw.id,
};
},
async *chatStream({ messages, model, max_tokens, temperature, baseUrl, apiKey, signal }) {
const base = baseUrl || 'https://api.openai.com';
const url = `${base}/v1/responses`;
const sysMsg = messages.find(m => m.role === 'system');
const inputMsgs = messages.filter(m => m.role !== 'system').map(m => {
return { role: m.role, content: m.content };
});
const body = {
model: model || this.defaultModel,
max_output_tokens: max_tokens || 2000,
temperature: temperature ?? 0.7,
input: inputMsgs,
stream: true,
};
if (sysMsg) body.instructions = sysMsg.content;
const resp = await fetch(url, {
method: 'POST',
signal,
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${apiKey || ''}`,
},
body: JSON.stringify(body),
});
if (!resp.ok) {
const err = await resp.text();
throw new Error(`OpenAI Responses API error ${resp.status}: ${err}`);
}
let usage = { input: 0, output: 0 };
for await (const evt of parseSSEStream(resp, signal)) {
if (evt.type === 'response.output_text.delta') {
if (evt.delta) yield { type: 'delta', text: evt.delta };
} else if (evt.type === 'response.completed') {
const u = evt.response?.usage;
if (u) usage = { input: u.input_tokens || 0, output: u.output_tokens || 0 };
yield { type: 'done', usage };
}
}
},
};
window.OpenAIResponseAdapter = OpenAIResponseAdapter;