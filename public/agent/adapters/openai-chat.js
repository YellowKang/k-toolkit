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
    const url = window.AgentTransport.endpoint('openai-chat', baseUrl);

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

    if (!resp.ok) throw await window.AgentTransport.responseError(resp);

    const raw = await resp.json();
    if (raw.error || raw.status === 'failed') throw window.AgentTransport.apiError(502, raw);
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

  async *chatStream({ messages, model, max_tokens, temperature, baseUrl, apiKey, signal }) {
    const url = window.AgentTransport.endpoint('openai-chat', baseUrl);

    const oaiMsgs = messages.map(m => ({ role: m.role, content: m.content }));

    const body = {
      model: model || this.defaultModel,
      max_tokens: max_tokens || 2000,
      temperature: temperature ?? 0.7,
      messages: oaiMsgs,
      stream: true,
    };

    const resp = await fetch(url, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || ''}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw await window.AgentTransport.responseError(resp);

    let usage = { input: 0, output: 0 };
    for await (const chunk of parseSSEStream(resp, signal)) {
      if (chunk.error || chunk.type === 'error' || chunk.type === 'response.failed') throw window.AgentTransport.apiError(502, chunk.response || chunk);
      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) {
        yield { type: 'delta', text: delta.content };
      }
      if (chunk.usage) {
        usage = { input: chunk.usage.prompt_tokens || 0, output: chunk.usage.completion_tokens || 0 };
      }
      if (chunk.choices?.[0]?.finish_reason) {
        yield { type: 'done', usage };
      }
    }
  },
};

window.OpenAIChatAdapter = OpenAIChatAdapter;
