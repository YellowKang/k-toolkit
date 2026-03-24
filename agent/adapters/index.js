'use strict';

const ADAPTERS = {};

function registerAdapters() {
  ADAPTERS['claude']          = window.ClaudeAdapter;
  ADAPTERS['openai-chat']     = window.OpenAIChatAdapter;
  ADAPTERS['openai-response'] = window.OpenAIResponseAdapter;
  ADAPTERS['gemini']          = window.GeminiAdapter;
  ADAPTERS['custom']          = window.CustomAdapter;
}

function getAdapter(id) {
  return ADAPTERS[id] || ADAPTERS['claude'];
}

function listAdapters() {
  return Object.values(ADAPTERS);
}

window.AgentAdapters = { registerAdapters, getAdapter, listAdapters };
