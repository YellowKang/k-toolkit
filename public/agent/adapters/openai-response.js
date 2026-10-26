'use strict';

const OpenAIResponseAdapter = {
  id: 'openai-response',
  name: 'OpenAI Responses',
  defaultModel: 'gpt-5.4',
  models: [
    'gpt-5.4', 'gpt-5.4-pro', 'gpt-5.4-mini',
    'gpt-5.3-chat-latest', 'gpt-5.3-codex',
    'gpt-5.2', 'gpt-5.2-codex',
    'gpt-4.1', 'gpt-4o', 'o3', 'o4-mini',
  ],

  _scope(config) {
    return window.AgentTransport.endpoint(this.id, config.baseUrl) + '\n' + (config.model || this.defaultModel);
  },

  _body(config, stream = false) {
    const scope = this._scope(config), input = [];
    for (const message of config.messages) {
      if (message.role === 'system') continue;
      // Stateless replay includes reasoning items only for the same endpoint/model.
      if (message.role === 'assistant' && message._responseScope === scope && Array.isArray(message._responseItems)) {
        input.push(...message._responseItems);
        continue;
      }
      if (message.role === 'tool') {
        input.push({ type: 'function_call_output', call_id: message.tool_call_id, output: String(message.content ?? '') });
        continue;
      }
      if (message.content || !message.tool_calls?.length) {
        const content = Array.isArray(message.content) ? message.content.map(part => {
          if (part.type === 'image_url') return { type: 'input_image', image_url: part.image_url.url, ...(part.image_url.detail ? { detail: part.image_url.detail } : {}) };
          return { type: message.role === 'assistant' ? 'output_text' : 'input_text', text: part.text || '' };
        }) : (message.content || '');
        input.push({ role: message.role, content });
      }
      for (const call of message.tool_calls || []) {
        input.push({ type: 'function_call', call_id: call.id, name: call.function.name, arguments: call.function.arguments });
      }
    }
    const body = {
      model: config.model || this.defaultModel,
      max_output_tokens: config.max_tokens || 2000,
      temperature: config.temperature ?? 0.7,
      input, store: false, stream,
    };
    const instructions = config.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');
    if (instructions) body.instructions = instructions;
    if (config.tools?.length) body.tools = config.tools.map(a => ({ type: 'function', name: a.name, description: a.description, parameters: a.parameters, strict: false }));
    return body;
  },

  async _request(config, stream = false) {
    const response = await fetch(window.AgentTransport.endpoint(this.id, config.baseUrl), {
      method: 'POST', signal: config.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey || ''}` },
      body: JSON.stringify(this._body(config, stream)),
    });
    if (!response.ok) throw await window.AgentTransport.responseError(response);
    return response;
  },

  _result(raw, config) {
    if (raw?.error || raw?.status === 'failed') throw window.AgentTransport.apiError(502, raw);
    if (!Array.isArray(raw?.output)) throw Object.assign(new Error('Invalid response'), { code: 'invalid_response' });
    const toolCalls = [], text = [];
    for (const item of raw.output) {
      if (item.type === 'function_call') toolCalls.push({ id: item.call_id, type: 'function', function: { name: item.name, arguments: item.arguments } });
      else if (item.type === 'message') {
        for (const part of item.content || []) {
          if (part.type === 'output_text') text.push(part.text || '');
          if (part.type === 'refusal') text.push(part.refusal || '');
        }
      }
    }
    const message = { role: 'assistant', content: text.join(''), _responseItems: raw.output, _responseScope: this._scope(config) };
    if (toolCalls.length) message.tool_calls = toolCalls;
    return {
      message, stop_reason: raw.status === 'incomplete' ? 'max_tokens' : toolCalls.length ? 'tool_use' : 'end',
      usage: { input: raw.usage?.input_tokens || 0, output: raw.usage?.output_tokens || 0 },
      raw, _responseId: raw.id,
    };
  },

  async *_events(response, signal) {
    if (!/text\/event-stream/i.test(response.headers.get('content-type') || '')) {
      yield { type: 'response.completed', response: await window.AgentTransport.readJSON(response) };
      return;
    }
    for await (const event of parseSSEStream(response, signal)) {
      if (event.error || event.type === 'error' || event.type === 'response.failed') throw window.AgentTransport.apiError(502, event.response || event);
      yield event;
      if (event.type === 'response.completed' || event.type === 'response.incomplete') return;
    }
    throw Object.assign(new Error('Incomplete response stream'), { code: 'incomplete_stream' });
  },

  async chat(config) {
    const response = await this._request(config);
    for await (const event of this._events(response, config.signal)) {
      if (event.type === 'response.completed' || event.type === 'response.incomplete') return this._result(event.response, config);
    }
  },

  async *chatStream(config) {
    const response = await this._request(config, true);
    let receivedText = false;
    for await (const event of this._events(response, config.signal)) {
      if (event.type === 'response.output_text.delta' || event.type === 'response.refusal.delta') {
        if (event.delta) { receivedText = true; yield { type: 'delta', text: event.delta }; }
      } else if (event.type === 'response.completed' || event.type === 'response.incomplete') {
        const result = this._result(event.response, config);
        if (!receivedText && result.message.content) yield { type: 'delta', text: result.message.content };
        if (result.stop_reason === 'max_tokens') throw Object.assign(new Error('Incomplete response'), { code: 'incomplete_stream' });
        yield { type: 'done', usage: result.usage };
      }
    }
  },
};

window.OpenAIResponseAdapter = OpenAIResponseAdapter;
