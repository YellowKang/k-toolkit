'use strict';
const CustomAdapter = {
id: 'custom',
name: 'Custom',
defaultModel: '',
models: [],
async chat({ messages, tools, model, max_tokens, temperature, baseUrl, apiKey, signal }) {
if (!baseUrl) throw new Error('Custom adapter requires a Base URL');
return window.OpenAIChatAdapter.chat.call(
{ ...window.OpenAIChatAdapter, defaultModel: model || 'gpt-4o' },
{ messages, tools, model, max_tokens, temperature, baseUrl, apiKey, signal }
);
},
};
window.CustomAdapter = CustomAdapter;