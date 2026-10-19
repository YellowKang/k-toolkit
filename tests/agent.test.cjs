const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../public/agent/agent-core.js'), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const end = text => ({ stop_reason: 'end', message: { role: 'assistant', content: text } });
const call = (name, args = '{}') => ({ id: name, function: { name, arguments: args } });
const use = (...calls) => ({ stop_reason: 'tool_use', message: { role: 'assistant', tool_calls: calls } });
function setup(chat, actions = [], timers = setTimeout) {
  const context = { window: { _AGENT_ALL_ACTIONS: new Map(actions.map(action => [action.name, action])) }, location: { protocol: 'https:' }, AbortController, setTimeout: timers, clearTimeout, console };
  vm.createContext(context); vm.runInContext(source, context);
  return new context.window.AgentSession({ adapter: { id: 'test', chat }, config: { apiKey: 'test' } });
}

test('cancelling a cooperative tool stops the loop and leaves no orphan tool call', async () => {
  let requests = 0, cancelled = false;
  const session = setup(async () => { requests++; return use(call('slow')); }, [{ name: 'slow', parameters: { type: 'object' }, execute: (_, { signal }) => new Promise(resolve => signal.addEventListener('abort', () => { cancelled = true; resolve({ success: false }); }, { once: true })) }]);
  const done = []; session.on('done', result => done.push(result));
  const task = session.send('run'); await tick(); session.abort(); await task;
  assert.equal(cancelled, true); assert.equal(requests, 1); assert.equal(done.length, 1); assert.equal(done[0].aborted, true);
  assert.equal(session.messages.length, 1); assert.equal(session.messages[0].role, 'user');
});

test('late responses from a cancelled request cannot pollute a new task', async () => {
  let resolveOld, requests = 0;
  const session = setup(() => ++requests === 1 ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve(end('new result')));
  const old = session.send('old task'); await tick(); session.abort(); await old;
  await session.send('new task'); resolveOld(end('late result')); await tick();
  assert.equal(session.messages.at(-1).content, 'new result');
  assert.equal(session.messages.some(message => message.content === 'late result'), false);
});

test('dependent tools execute in order and use one task signal across model rounds', async () => {
  const order = [], signals = []; let requests = 0;
  const session = setup(async ({ signal }) => { signals.push(signal); return ++requests === 1 ? use(call('navigate'), call('read')) : end('done'); }, [
    { name: 'navigate', execute: async () => { order.push('navigate:start'); await tick(); order.push('navigate:end'); return { success: true }; } },
    { name: 'read', execute: () => { order.push('read'); return { success: true }; } },
  ]);
  await session.send('run'); assert.deepEqual(order, ['navigate:start', 'navigate:end', 'read']); assert.equal(signals[0], signals[1]);
});

test('malformed, missing, incorrectly typed and unsupported arguments never execute', async () => {
  let executed = 0;
  const session = setup(async () => end(''), [{ name: 'validate', parameters: { type: 'object', properties: { text: { type: 'string' }, mode: { type: 'string', enum: ['a', 'b'] }, list: { type: 'array', items: { type: 'number' } } }, required: ['text'], additionalProperties: false }, execute: () => { executed++; return { success: true }; } }]);
  for (const args of ['{broken', 'null', '[]', '{}', '{"text":5}', '{"text":"ok","mode":"c"}', '{"text":"ok","list":["bad"]}', '{"text":"ok","extra":1}']) {
    const result = await session._exec(call('validate', args)); assert.equal(result.result.success, false, args);
  }
  assert.equal(executed, 0);
  assert.equal((await session._exec(call('validate', '{"text":"ok","mode":"a","list":[1]}'))).result.success, true);
  assert.equal(executed, 1);
});

test('action timeout aborts its signal and reports an error', async () => {
  let aborted = false;
  const session = setup(async () => end(''), [{ name: 'slow', execute: (_, { signal }) => new Promise(() => signal.addEventListener('abort', () => { aborted = true; }, { once: true })) }], (fn, ms) => setTimeout(fn, ms === 15000 ? 5 : ms));
  const result = await session._exec(call('slow')); assert.equal(result.result.success, false); assert.equal(aborted, true);
});

test('max iterations stops requests; clearing history cancels active work', async () => {
  let requests = 0;
  const session = setup(async () => { requests++; return use(call('noop')); }, [{ name: 'noop', execute: () => ({ success: true }) }]);
  session.MAX_ITER = 2; const reasons = []; session.on('error', error => reasons.push(error.reason));
  await session.send('repeat'); assert.equal(requests, 2); assert.deepEqual(reasons, ['max_iterations']);
  session.clearHistory(); assert.equal(session.messages.length, 0);
  session.adapter.chat = () => new Promise(() => {});
  const pending = session.send('wait'); await tick(); session.clearHistory(); await pending;
  assert.equal(session.messages.length, 0); assert.equal(session._run, null);
});
