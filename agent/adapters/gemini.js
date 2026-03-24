'use strict';
const GeminiAdapter = {
id: 'gemini',
name: 'Gemini',
defaultModel: 'gemini-2.5-flash',
models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview'],
async chat({ messages, tools, model, max_tokens, temperature, baseUrl, apiKey, signal }) {
const base = baseUrl || 'https:
const url = `${base}/chat/completions`;
const oaiMsgs = messages.map(m => {
if (m.role === 'tool') return { role: 'tool', tool_call_id: m.tool_call_id, content: m.content };
if (m.role === 'assistant' && m.tool_calls) return { role: 'assistant', content: m.content || null, tool_calls: m.tool_calls };
return { role: m.role, content: m.content };
});
const oaiTools = (tools || []).map(a => ({
type: 'function',
function: { name: a.name, description: a.description, parameters: a.parameters },
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
throw new Error(`Gemini API error ${resp.status}: ${err}`);
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
window.GeminiAdapter = GeminiAdapter;