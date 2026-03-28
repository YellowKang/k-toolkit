'use strict';
async function* parseSSEStream(response, signal) {
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
try {
while (true) {
if (signal?.aborted) break;
const { done, value } = await reader.read();
if (done) break;
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split('\n');
buffer = lines.pop() || '';
for (const line of lines) {
const trimmed = line.trim();
if (!trimmed || trimmed.startsWith(':')) continue; 
if (trimmed.startsWith('data:')) {
const data = trimmed.slice(5).trim();
if (data === '[DONE]') return;
try {
yield JSON.parse(data);
} catch {
}
}
}
}
if (buffer.trim()) {
const trimmed = buffer.trim();
if (trimmed.startsWith('data:')) {
const data = trimmed.slice(5).trim();
if (data !== '[DONE]') {
try { yield JSON.parse(data); } catch {}
}
}
}
} finally {
reader.releaseLock();
}
}
window.parseSSEStream = parseSSEStream;