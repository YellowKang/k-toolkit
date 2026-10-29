(function () {
  const privatePages = new Set(['totp', 'aes', 'jwt', 'env-parse', 'password-gen', 'http-tester', 'curl-gen', 'data-backup', 'note', 'todo']);
  const privateActions = new Set(['password_gen', 'aes_encrypt', 'aes_decrypt', 'jwt_generate', 'env_parse']);
  function context(text) {
    text = String(text ?? '');
    return /(?:api[_ -]?key|password|passwd|secret|authorization|bearer\s|cookie|access[_ -]?token|refresh[_ -]?token|private[_ -]?key)\b/i.test(text) ? '[Sensitive content omitted]' : text;
  }
  function httpHistory(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.filter(entry => entry && typeof entry.url === 'string').slice(0, 20).map(entry => {
      let url = '';
      try { const parsed = new URL(entry.url); parsed.username = ''; parsed.password = ''; parsed.search = ''; parsed.hash = ''; url = parsed.href; } catch {}
      return { method: String(entry.method || 'GET'), url, headers: '', body: '', status: Number(entry.status) || 0, time: String(entry.time || ''), redacted: true };
    });
  }
  function modelResult(name, result) {
    if (!privateActions.has(name) && !privatePages.has(result?.data?.toolId)) return result;
    return { success: result.success, display: result.success === false ? 'The local operation failed.' : 'The result is available locally. Sensitive values are not sent to the model.' };
  }
  window.ToolPrivacy = Object.freeze({ pageAllowed: id => !privatePages.has(id), context, httpHistory, modelResult });
})();
