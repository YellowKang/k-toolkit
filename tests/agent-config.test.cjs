const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '../public/agent');
function setup(saved = {}) {
  const values = new Map(Object.entries(saved).map(([key, value]) => ['ag_' + key, JSON.stringify(value)]));
  const context = { URL, AbortController, DOMException, TextDecoder, setTimeout, clearTimeout, console, CustomEvent: class { constructor(type) { this.type = type; } }, localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  context.window = { location: { protocol: 'http:' }, getCurrentLang: () => 'en', dispatchEvent() {}, AgentAdapters: { listAdapters: () => ['claude', 'openai-chat', 'openai-response', 'gemini', 'custom'].map(id => ({ id })) } };
  vm.createContext(context);
  for (const name of ['agent-transport.js', 'agent-config.js', 'adapters/stream-utils.js']) vm.runInContext(fs.readFileSync(path.join(root, name), 'utf8'), context);
  return { context, values, AG: context.window.AgentConfig.AG, transport: context.window.AgentTransport };
}

test('legacy configuration belongs to its selected provider and keys stay out of profiles', () => {
  const { AG, values } = setup({ adapter: 'openai-chat', base_url: 'https://proxy.example/v1', model: 'old-model', key_claude: 'claude-test', 'key_openai-chat': 'openai-test' });
  assert.equal(AG.load().apiKey, 'openai-test');
  assert.equal(AG.profile('claude').model, '');
  assert.equal(AG.profile('claude').baseUrl, '');
  AG.save({ ...AG.load(), ...AG.profile('claude'), model: 'claude-model' });
  assert.equal(AG.profile('openai-chat').model, 'old-model');
  assert.equal(AG.profile('openai-chat').baseUrl, 'https://proxy.example/v1');
  assert.equal(AG.load().model, 'claude-model');
  assert.doesNotMatch(values.get('ag_profiles'), /apiKey|openai-test|claude-test/);
});

test('failed storage save rolls back settings without announcing a change', () => {
  const { AG, context, values } = setup({ adapter: 'claude', model: 'old' });
  const before = [...values]; let count = 0, events = 0;
  const write = context.localStorage.setItem;
  context.localStorage.setItem = (...args) => { if (++count === 3) throw new Error('quota'); return write(...args); };
  context.window.dispatchEvent = () => events++;
  assert.throws(() => AG.save({ ...AG.load(), model: 'new' }), /Could not save/);
  assert.deepEqual([...values], before); assert.equal(events, 0);
});

test('fetched and manual models persist together without credentials in the catalog', () => {
  const { AG, values } = setup();
  const cfg = { ...AG.load(), adapter: 'openai-chat', apiKey: 'private-fixture-key', baseUrl: 'https://gateway.example/v1/', model: 'gateway/fast' };
  const catalog = { endpoint: 'https://gateway.example/v1/models', models: ['gateway/fast', 'gateway/reasoning'], fetchedAt: 123 };
  AG.save(cfg, catalog);
  AG.save({ ...AG.load(), model: 'my-private-deployment' });
  const saved = AG.modelCatalog(AG.load());
  assert.deepEqual([...saved.models], catalog.models);
  assert.deepEqual([...saved.recent], ['my-private-deployment', 'gateway/fast']);
  assert.equal(saved.fetchedAt, 123);
  assert.doesNotMatch(values.get('ag_model_catalogs'), /private-fixture-key|apiKey/);
});

test('model catalogs are isolated by protocol, normalized endpoint and credential changes', () => {
  const { AG } = setup();
  const cfg = { ...AG.load(), adapter: 'openai-chat', apiKey: 'first-key', baseUrl: 'https://gateway.example', model: 'first-model' };
  AG.save(cfg, { endpoint: 'https://gateway.example/v1/models', models: ['first-model'], fetchedAt: 1 });
  assert.equal(AG.modelCatalog({ ...cfg, baseUrl: 'https://gateway.example/v1/chat/completions' }).models.length, 1);
  for (const changed of [{ apiKey: 'second-key' }, { baseUrl: 'https://other.example' }, { adapter: 'openai-response' }]) {
    assert.equal(AG.modelCatalog({ ...cfg, ...changed }).models.length, 0);
  }
  AG.save({ ...AG.load(), apiKey: 'second-key', model: 'second-model' });
  assert.equal(AG.modelCatalog(AG.load()).models.length, 0);
  assert.deepEqual([...AG.modelCatalog(AG.load()).recent], ['second-model']);
  AG.save({ ...AG.load(), apiKey: 'first-key' });
  assert.equal(AG.modelCatalog(AG.load()).models.length, 0, 'rotating back must not resurrect an obsolete directory');
});

test('model catalog rollback, bounds and untrusted stored data do not break configuration', () => {
  const { AG, context, values } = setup();
  const cfg = { ...AG.load(), adapter: 'custom', baseUrl: 'http://localhost:8080', model: 'local-model' };
  AG.save(cfg, { endpoint: 'http://localhost:8080/v1/models', models: [' local-model ', 'local-model', '', null, 'bad\u0000model', 'x'.repeat(257)], fetchedAt: 1 });
  assert.deepEqual([...AG.modelCatalog(AG.load()).models], ['local-model']);
  for (let i = 0; i < 15; i++) AG.save({ ...AG.load(), model: 'local-' + i });
  assert.equal(AG.modelCatalog(AG.load()).recent.length, 12);
  const before = [...values]; const write = context.localStorage.setItem; let failed = false;
  context.localStorage.setItem = (key, value) => { if (key === 'ag_model_catalogs' && !failed) { failed = true; throw new Error('quota'); } write(key, value); };
  assert.throws(() => AG.save({ ...AG.load(), model: 'unsaved' }), /Could not save/);
  assert.deepEqual([...values], before);
  values.set('ag_model_catalogs', JSON.stringify({ custom: { endpoint: 'http://localhost:8080/v1/models', models: {}, recent: 'bad' } }));
  assert.equal(AG.modelCatalog(AG.load()).models.length, 0);
});

test('endpoint normalization accepts origins, API prefixes and full paths without duplicate versions', () => {
  const { transport: { endpoint } } = setup();
  for (const base of ['https://api.example', 'https://api.example/v1/', 'https://api.example/v1/chat/completions']) assert.equal(endpoint('openai-chat', base), 'https://api.example/v1/chat/completions');
  assert.equal(endpoint('custom', 'https://api.example/proxy/v1/'), 'https://api.example/proxy/v1/chat/completions');
  assert.equal(endpoint('claude', 'https://api.example/v1'), 'https://api.example/v1/messages');
  assert.equal(endpoint('openai-response', 'https://api.example/v1/responses/'), 'https://api.example/v1/responses');
  assert.equal(endpoint('gemini', ''), 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
  assert.equal(endpoint('openai-chat', endpoint('gemini', '')), endpoint('gemini', ''));
  for (const url of ['javascript:alert(1)', 'https://user:secret@api.example', 'https://api.example?key=secret', 'https://api.example#fragment', 'https://api.example/v1/messages']) assert.throws(() => endpoint('openai-chat', url));
});

test('mixed content is reported instead of silently rewriting user URL', () => {
  const { context, transport } = setup(); context.window.location.protocol = 'https:';
  assert.throws(() => transport.endpoint('custom', 'http://api.example'), /HTTPS/);
  assert.equal(transport.endpoint('custom', 'http://localhost:8000/v1'), 'http://localhost:8000/v1/chat/completions');
});

test('public errors are actionable and never echo upstream payloads', () => {
  const { transport } = setup();
  assert.match(transport.message(transport.httpError(401)), /Authentication/);
  assert.match(transport.message(transport.httpError(429)), /quota/);
  assert.match(transport.message(Object.assign(new Error('secret'), { name: 'TimeoutError' })), /timed out/);
  assert.doesNotMatch(transport.message(new Error('secret-key-and-server-body')), /secret/);
});

test('SSE parser handles chunked UTF-8, CRLF, multiline JSON and releases early streams', async () => {
  const { context } = setup(); let cancelled = 0;
  const bytes = new TextEncoder().encode(': comment\r\nevent: message\r\ndata: {"text":\r\ndata: "你好🙂"}\r\n\r\ndata: [DONE]\n\n');
  const body = new ReadableStream({ start(controller) { for (let i = 0; i < bytes.length; i += 3) controller.enqueue(bytes.slice(i, i + 3)); }, cancel() { cancelled++; } });
  const output = []; for await (const item of context.window.parseSSEStream({ body }, new AbortController().signal)) output.push(item);
  assert.equal(output[0].text, '你好🙂'); assert.equal(output.length, 1); assert.equal(cancelled, 1); assert.equal(body.locked, false);
});

test('SSE cancellation unblocks a pending reader and malformed events fail visibly', async () => {
  const { context } = setup(); const controller = new AbortController();
  const body = new ReadableStream({ start() {} });
  const pending = context.window.parseSSEStream({ body }, controller.signal).next(); controller.abort();
  await assert.rejects(pending, { name: 'AbortError' }); assert.equal(body.locked, false);
  const malformed = new Response('data: {broken}\n\n');
  await assert.rejects(context.window.parseSSEStream(malformed).next());
});

test('OpenAI-compatible Gemini stream requests its resolved endpoint once', async () => {
  const { context } = setup(); let requested;
  context.fetch = async url => { requested = url; return new Response('data: {"choices":[{"delta":{"content":"OK"}}]}\n\ndata: [DONE]\n\n'); };
  for (const name of ['openai-chat', 'gemini']) vm.runInContext(fs.readFileSync(path.join(root, 'adapters/' + name + '.js'), 'utf8'), context);
  const output = []; for await (const item of context.window.GeminiAdapter.chatStream({ messages: [], signal: new AbortController().signal })) output.push(item);
  assert.equal(requested, 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'); assert.equal(output[0].text, 'OK');
});
