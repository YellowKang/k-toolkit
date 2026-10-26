'use strict';

// Shared by settings, chat and tool-calling adapters. Never expose upstream bodies.
window.AgentTransport = (() => {
  const say = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  const defaults = {
    claude: 'https://api.anthropic.com',
    'openai-chat': 'https://api.openai.com',
    'openai-response': 'https://api.openai.com',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
  };
  function issue(code, message) { return Object.assign(new Error(message), { code }); }
  function endpoint(adapter, baseUrl) {
    const source = String(baseUrl || defaults[adapter] || '').trim();
    let url;
    try { url = new URL(source); } catch { throw issue('config', say('请输入完整的 HTTP(S) 接口地址。', 'Enter a complete HTTP(S) API URL.')); }
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw issue('config', say('接口地址只支持 HTTP(S)，不能包含账号、查询参数或锚点。', 'Use an HTTP(S) URL without credentials, query parameters or a fragment.'));
    }
    if (window.location?.protocol === 'https:' && url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      throw issue('config', say('当前页面使用 HTTPS，请配置 HTTPS 接口地址。', 'This page uses HTTPS. Configure an HTTPS API URL.'));
    }
    let path = url.pathname.replace(/\/+$/, '');
    const suffix = adapter === 'claude' ? '/messages' : adapter === 'openai-response' ? '/responses' : '/chat/completions';
    if (/\/(?:chat\/completions|messages|responses)$/.test(path)) {
      if (!path.endsWith(suffix)) throw issue('config', say('完整接口路径与所选服务商协议不匹配。', 'The endpoint does not match the selected API protocol.'));
    } else {
      if (!/\/(?:v\d+(?:beta\d*)?|openai)$/.test(path)) path += adapter === 'gemini' ? '/v1beta/openai' : '/v1';
      path += suffix;
    }
    url.pathname = path;
    return url.href;
  }
  function httpError(status) {
    const error = issue('http', say('接口请求失败', 'API request failed') + ' (HTTP ' + status + ')');
    error.status = status;
    return error;
  }
  function apiError(status, payload) {
    const error = httpError(status);
    const detail = payload?.error || payload;
    const code = typeof detail?.code === 'string' ? detail.code : '';
    const hint = typeof detail?.message === 'string' ? detail.message.slice(0, 16384) : '';
    // Map only recognized failures. Upstream text may contain keys or private URLs.
    if (['model_not_found', 'model_not_available', 'no_available_channel'].includes(code) || /no available (?:endpoints?|channels?|routes?) for model|model.{0,100}(?:not found|not available|does not exist)/i.test(hint)) error.code = 'model_unavailable';
    return error;
  }
  async function readJSON(response, limit = 1048576) {
    if (!response.body) throw issue('invalid_response', 'Missing response body');
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let text = '', bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > limit) throw issue('response_too_large', 'Response exceeds limit');
        text += decoder.decode(value, { stream: true });
      }
      try { return JSON.parse(text + decoder.decode()); }
      catch { throw issue('invalid_response', 'Invalid JSON response'); }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
  async function responseError(response) {
    let payload;
    try { payload = await readJSON(response, 16384); }
    catch (error) { if (error.name === 'AbortError' || error.name === 'TimeoutError') throw error; }
    return apiError(response.status, payload);
  }
  function modelsEndpoint(adapter, baseUrl) {
    return endpoint(adapter, baseUrl).replace(/\/(?:chat\/completions|messages|responses)$/, '/models');
  }
  async function listModels(config) {
    const url = modelsEndpoint(config.adapter, config.baseUrl);
    const headers = config.adapter === 'claude'
      ? { 'x-api-key': config.apiKey || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
      : config.apiKey ? { Authorization: 'Bearer ' + config.apiKey } : {};
    const response = await fetch(url, { headers, signal: config.signal });
    if (!response.ok) throw await responseError(response);
    const raw = await readJSON(response);
    if (!Array.isArray(raw?.data) || raw.data.length > 500) throw issue('models', 'Invalid model list');
    const models = [...new Set(raw.data.map(item => item?.id).filter(id => typeof id === 'string' && id.trim() && id.length <= 256 && !/[\x00-\x1f\x7f]/.test(id)).map(id => id.trim()))];
    if (!models.length) throw issue('models', 'Empty model list');
    return models;
  }
  function message(error) {
    if (error?.code === 'config' || error?.code === 'context_budget') return error.message;
    if (error?.code === 'model_unavailable') return say('所选模型没有可用通道或当前账号无权使用。请切换模型，或检查网关的模型路由配置。', 'This model has no available route or access. Choose another model or check the gateway model routing.');
    if (error?.code === 'models') return say('接口未返回有效的模型列表，请手动填写模型名称。', 'The API returned no valid model list. Enter a model name manually.');
    if (error?.code === 'incomplete_stream') return say('回复传输中断，请重试。', 'The response stream ended early. Please retry.');
    if (error?.code === 'invalid_response' || error?.code === 'response_too_large') return say('接口返回的数据格式或大小不受支持，请检查协议或减少输出上限。', 'The API response format or size is unsupported. Check the protocol or reduce the output limit.');
    if (error?.name === 'TimeoutError') return say('请求超时，请稍后重试或检查接口地址。', 'Request timed out. Retry or check the API URL.');
    if ([401, 403].includes(error?.status)) return say('认证失败，请检查 API Key 和模型访问权限。', 'Authentication failed. Check the API key and model access.');
    if (error?.status === 429) return say('请求受限，请检查账户额度，稍后重试。', 'Rate or quota limit reached. Check your account and retry later.');
    if ([400, 404, 422].includes(error?.status)) return say('接口或模型参数不匹配，请检查协议、地址、模型名和输出上限。', 'Check the API protocol, URL, model name and output limit.');
    if (error?.status >= 500) return say('服务暂时不可用，请稍后重试。', 'The service is temporarily unavailable. Retry later.');
    if (error?.name === 'AbortError') return say('已停止。', 'Stopped.');
    return say('连接失败，请检查网络、接口地址及服务端跨域配置（CORS）。', 'Connection failed. Check your network, API URL and server CORS settings.');
  }
  async function wait(operation, signal) {
    let cancel;
    const cancelled = new Promise((_, reject) => {
      cancel = () => reject(signal.reason || new DOMException('Stopped', 'AbortError'));
      if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
    });
    try { return await Promise.race([operation, cancelled]); }
    finally { signal.removeEventListener('abort', cancel); }
  }
  function timeout(controller, ms) {
    return setTimeout(() => controller.abort(Object.assign(new Error('Request timed out'), { name: 'TimeoutError' })), ms);
  }
  return { endpoint, modelsEndpoint, httpError, apiError, responseError, readJSON, listModels, message, wait, timeout };
})();
