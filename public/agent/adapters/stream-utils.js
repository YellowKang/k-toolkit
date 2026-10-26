'use strict';

// SSE events can span reads, UTF-8 characters and multiple data lines.
async function* parseSSEStream(response, signal) {
  if (!response.body) throw new Error('Missing response stream');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = '', data = [], eventSize = 0;
  const cancel = () => { reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', cancel, { once: true });
  const aborted = () => { if (signal?.aborted) throw signal.reason || new DOMException('Stopped', 'AbortError'); };
  function parseEvent() {
    const value = data.join('\n'); data = []; eventSize = 0;
    if (!value) return null;
    if (value.trim() === '[DONE]') return 'done';
    return JSON.parse(value);
  }
  try {
    while (true) {
      aborted();
      const { done, value } = await reader.read(); aborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let newline;
      while ((newline = buffer.indexOf('\n')) !== -1 || (done && buffer.length)) {
        if (newline === -1) newline = buffer.length;
        const line = buffer.slice(0, newline).replace(/\r$/, ''); buffer = buffer.slice(newline + 1);
        if (line === '') {
          const event = parseEvent(); if (event === 'done') return; if (event) yield event;
        } else if (line.startsWith('data:')) {
          const text = line.slice(5).replace(/^ /, ''); eventSize += text.length;
          if (eventSize > 1024 * 1024) throw new Error('SSE event too large');
          data.push(text);
        }
      }
      if (buffer.length + eventSize > 1024 * 1024) throw new Error('SSE event too large');
      if (done) { const event = parseEvent(); if (event && event !== 'done') yield event; return; }
    }
  } finally {
    signal?.removeEventListener('abort', cancel);
    // Early consumer exit must release the network stream too.
    await reader.cancel().catch(() => {}); reader.releaseLock();
  }
}
window.parseSSEStream = parseSSEStream;
