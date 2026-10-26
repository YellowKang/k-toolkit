const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function setup(fetch) {
  const context = { window: { location: { protocol: 'http:' }, getCurrentLang: () => 'en' }, URL, Response, TextDecoder, AbortController, DOMException, setTimeout, clearTimeout, fetch };
  vm.createContext(context);
  for (const file of ['agent-transport.js', 'adapters/stream-utils.js', 'adapters/openai-response.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/agent', file), 'utf8'), context);
  return context.window;
}
const params = { model: 'gateway-test-model', apiKey: 'fixture-only', baseUrl: 'http://localhost:8080/v1', messages: [{ role: 'user', content: 'hello' }], signal: new AbortController().signal };
const raw = { id: 'resp_fixture', status: 'completed', output: [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'OK' }] }] };
const event = object => 'data: ' + JSON.stringify(object) + '\n\n';
test('Responses accepts forced SSE for a non-streaming call and preserves response items', async () => {
  const window = setup(async () => new Response(event({ type: 'response.output_text.delta', delta: 'OK' }) + event({ type: 'response.completed', response: raw }), { headers: { 'Content-Type': 'text/event-stream' } }));
  const result = await window.OpenAIResponseAdapter.chat(params);
  assert.equal(result.message.content, 'OK'); assert.equal(result.stop_reason, 'end'); assert.equal(result.message._responseItems[0].type, 'message');
});
test('switching from Chat to Responses flattens tool items and never duplicates server state', async () => {
  let request;
  const window = setup(async (_, options) => { request = JSON.parse(options.body); return Response.json(raw); });
  await window.OpenAIResponseAdapter.chat({ ...params, _responseId: 'previous', messages: [
    { role: 'user', content: 'hash this' },
    { role: 'assistant', content: 'Computing', tool_calls: [{ id: 'call_1', function: { name: 'hash', arguments: '{"text":"hello"}' } }] },
    { role: 'tool', tool_call_id: 'call_1', content: '{"hash":"abc"}' },
    { role: 'assistant', content: 'abc' },
    { role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }, { type: 'text', text: 'read' }] },
  ], tools: [{ name: 'hash', parameters: { type: 'object', properties: { text: { type: 'string' } } } }] });
  assert.equal(request.input[2].type, 'function_call'); assert.equal(request.input[3].type, 'function_call_output');
  assert.equal(request.input[5].content[0].type, 'input_image'); assert.equal(request.input[5].content[1].type, 'input_text');
  assert.equal(request.store, false); assert.equal(request.previous_response_id, undefined); assert.equal(request.tools[0].strict, false);
});
test('Responses replays same-connection reasoning items and falls back to portable history after a model switch', async () => {
  const requests = []; const reasoning = { type: 'reasoning', encrypted_content: 'fixture-encrypted', summary: [] };
  const window = setup(async (_, options) => { requests.push(JSON.parse(options.body)); return Response.json({ ...raw, output: [reasoning, ...raw.output] }); });
  const first = await window.OpenAIResponseAdapter.chat(params);
  await window.OpenAIResponseAdapter.chat({ ...params, messages: [...params.messages, first.message, { role: 'user', content: 'next' }] });
  assert.equal(requests[1].input[1].type, 'reasoning');
  await window.OpenAIResponseAdapter.chat({ ...params, model: 'another-model', messages: [...params.messages, first.message, { role: 'user', content: 'next' }] });
  assert.equal(requests[2].input.some(item => item.type === 'reasoning'), false);
});
test('Responses reports truncated streams and structured stream failures', async () => {
  for (const content of [event({ type: 'response.output_text.delta', delta: 'partial' }), event({ type: 'response.failed', response: { error: { message: 'secret-fixture' } } })]) {
    const window = setup(async () => new Response(content, { headers: { 'Content-Type': 'text/event-stream' } }));
    await assert.rejects(window.OpenAIResponseAdapter.chat(params));
  }
});
test('gateway model routing failures are classified without echoing upstream secrets', async () => {
  const window = setup();
  const error = await window.AgentTransport.responseError(Response.json({ error: { message: 'No available endpoints for model: private-model secret-fixture' } }, { status: 400 }));
  assert.equal(error.code, 'model_unavailable'); assert.match(window.AgentTransport.message(error), /available route/); assert.doesNotMatch(window.AgentTransport.message(error), /private-model|secret-fixture/);
});
test('model discovery respects API prefixes and rejects invalid or oversized lists', async () => {
  let url;
  const window = setup(async input => { url = input; return Response.json({ data: [{ id: 'one' }, { id: 'one' }, { id: 'two' }, { id: 9 }] }); });
  const models = await window.AgentTransport.listModels({ ...params, adapter: 'openai-response' });
  assert.equal(url, 'http://localhost:8080/v1/models'); assert.equal(JSON.stringify(models), '["one","two"]');
  for (const payload of [{ models: [] }, { data: [] }, { data: Array(501).fill({ id: 'one' }) }]) {
    const invalid = setup(async () => Response.json(payload));
    await assert.rejects(invalid.AgentTransport.listModels({ ...params, adapter: 'openai-chat' }), { code: 'models' });
  }
  const oversized = setup(async () => Response.json({ data: [{ id: 'x'.repeat(1048576) }] }));
  await assert.rejects(oversized.AgentTransport.listModels({ ...params, adapter: 'openai-chat' }), { code: 'response_too_large' });
});
test('Responses streaming tolerates JSON fallback without repeating SSE text', async () => {
  for (const response of [Response.json(raw), new Response(event({ type: 'response.output_text.delta', delta: 'OK' }) + event({ type: 'response.completed', response: raw }), { headers: { 'Content-Type': 'text/event-stream' } })]) {
    const window = setup(async () => response), events = [];
    for await (const item of window.OpenAIResponseAdapter.chatStream(params)) events.push(item);
    assert.equal(events.filter(e => e.type === 'delta').map(e => e.text).join(''), 'OK');
    assert.equal(events.at(-1).type, 'done');
  }
});
