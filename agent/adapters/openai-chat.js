'use strict';
const OpenAIChatAdapter = {
id: 'openai-chat',
name: 'OpenAI Chat',
defaultModel: 'gpt-5.4',
models: [
'gpt-5.4', 'gpt-5.4-pro', 'gpt-5.4-mini', 'gpt-5.4-nano',
'gpt-5.3-chat-latest', 'gpt-5.3-codex',
'gpt-5.2', 'gpt-5.2-codex',
'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini',
'o3', 'o4-mini',
],
async chat({ messages, tools, model, max_tokens, temperature, baseUrl, apiKey, signal }) {
const base = baseUrl || 'https://api.openai.com';
const url = `${base}/v1/chat/completions`;
const oaiMsgs = messages.map(m => {
if (m.role === 'tool') {
return { role: 'tool', tool_call_id: m.tool_call_id, content: m.content };
}
if (m.role === 'assistant' && m.tool_calls) {
return { role: 'assistant', content: m.content || null, tool_calls: m.tool_calls };
}
return { role: m.role, content: m.content };
});
const oaiTools = (tools || []).map(a => ({
type: 'function',
function: {
name: a.name,
description: a.description,
parameters: a.parameters,
},
}));
const body = {
model: model || this.defaultModel,
max_tokens: max_tokens || 2000,
temperature: temperature ?? 0.7,
messages: oaiMsgs,
};
if (oaiTools.length) body.tools = oaiTools;
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
throw new Error(`OpenAI API error ${resp.status}: ${err}`);
}
const raw = await resp.json();
const choice = raw.choices?.[0];
const msg = choice?.message || {};
const stopReason = choice?.finish_reason === 'tool_calls' ? 'tool_use'
: choice?.finish_reason === 'length' ? 'max_tokens'
: 'end';
const message = { role: 'assistant', content: msg.content || '' };
if (msg.tool_calls?.length) message.tool_calls = msg.tool_calls;
return {
message,
stop_reason: stopReason,
usage: { input: raw.usage?.prompt_tokens || 0, output: raw.usage?.completion_tokens || 0 },
raw,
};
},
};
window.OpenAIChatAdapter = OpenAIChatAdapter;