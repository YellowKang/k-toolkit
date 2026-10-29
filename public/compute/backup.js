/* Backup and restore of everything the toolkit keeps in localStorage (DOM-free; tests pass a fake storage).
 * Only allow-listed keys are exported or written. Groups decide what is offered; "merge" combines an import with the
 * data already in this browser, "overwrite" replaces only the keys of the chosen groups. API keys never travel in
 * the plain `data` section: the page encrypts them into `secret` with compute/secure-box.js. */
(function () {
  const GROUPS = [
    { id: 'prefs', keys: ['dtb_lang', 'dtb_theme', 'dtb_sidebar_collapsed', 'dtb_collapsed_cats', 'ag_fab_pos', 'dtb_otp_settings'] },
    { id: 'history', keys: ['dtb_favorites', 'dtb_recent', 'dtb_usage', 'dtb_search_history'] },
    { id: 'tools', keys: ['dtb_note', 'dtb_todo', 'dtb_countdowns', 'dtb_saved_regex', 'dtb_mc_history', 'dtb_typing_scores', 'dtb_http_history', 'dtb_workflow_draft'] },
    { id: 'chat', keys: ['dtb_chat_history', 'dtb_chat_system', 'dtb_chat_config', 'dtb_chat_history_meta', 'dtb_context_preferences', 'dtb_chat_sessions', 'dtb_chat_draft', 'dtb_chat_draft_images'], prefix: 'dtb_chat_session_' },
    { id: 'agent', prefix: 'ag_', exclude: key => key.startsWith('ag_key_') || key === 'ag_fab_pos' },
    { id: 'apikeys', prefix: 'ag_key_', sensitive: true },
    { id: 'http', keys: [], sensitive: true },
    { id: 'otp', keys: ['dtb_otp_vault'] },
  ];
  const DEFAULT_GROUPS = ['prefs', 'history', 'tools', 'chat', 'agent', 'otp'];
  const LIMITS = { dtb_recent: 8, dtb_search_history: 5 };
  const TEXT_KEYS = new Set(['dtb_note', 'dtb_chat_system']);
  const MAX_CHARS = 5 * 1024 * 1024;

  class BackupError extends Error {
    constructor(code, message, detail) { super(message); this.name = 'BackupError'; this.code = code; this.detail = detail; }
  }

  function groupOf(key) {
    for (const g of GROUPS) {
      if (g.keys?.includes(key)) return g.id;
      if (g.prefix && key.startsWith(g.prefix) && !g.exclude?.(key)) return g.id;
    }
    return null;
  }

  function storageKeys(storage) {
    const keys = [];
    for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
    return keys.filter(k => k !== null).sort();
  }

  /** Items behind a raw value, for display: array length, object size, or 1. */
  function itemCount(key, raw) {
    if (TEXT_KEYS.has(key)) return raw ? 1 : 0;
    if (key === 'dtb_otp_vault') return 1; // one encrypted board, whatever its envelope looks like
    try {
      const value = JSON.parse(raw);
      if (Array.isArray(value)) return value.length;
      if (value && typeof value === 'object') return Object.keys(value).length;
    } catch {}
    return 1;
  }

  /** { groupId: [{ key, items }] } for the keys present in storage. */
  function inventory(storage) {
    const out = Object.fromEntries(GROUPS.map(g => [g.id, []]));
    for (const key of storageKeys(storage)) {
      const group = groupOf(key);
      if (group) out[group].push({ key, items: itemCount(key, storage.getItem(key)) });
    }
    const requests = window.RequestSession?.history() || [];
    if (requests.length || storage.getItem('dtb_http_history')) out.http.push({ key: 'dtb_http_history', items: requests.length || itemCount('dtb_http_history', storage.getItem('dtb_http_history')) });
    return out;
  }

  /** Plain backup for the chosen groups; API keys come back separately (`secret`) for the caller to encrypt. */
  function collect(storage, groups, { appVersion = 'dev', now = new Date() } = {}) {
    const data = {}, secret = {};
    for (const key of storageKeys(storage)) {
      const group = groupOf(key);
      if (!group || !groups.includes(group)) continue;
      const raw = storage.getItem(key);
      if (raw === null) continue;
      if (group === 'apikeys') secret[key] = raw;
      else if (key === 'dtb_http_history') { try { data[key] = JSON.stringify(window.ToolPrivacy.httpHistory(JSON.parse(raw))); } catch { data[key] = '[]'; } }
      else data[key] = raw;
    }
    if (groups.includes('http')) {
      const requests = window.RequestSession?.history() || [];
      const raw = requests.length ? JSON.stringify(requests) : storage.getItem('dtb_http_history');
      if (raw && !validateEntry('dtb_http_history', raw, true)) { secret.dtb_http_history = raw; delete data.dtb_http_history; }
    }
    return { backup: { format: 'k-toolkit-backup', version: 1, appVersion, exportedAt: now.toISOString(), groups: groups.slice(), data }, secret };
  }

  /** Validate a backup; unknown keys, wrong types and broken JSON values are reported and dropped. */
  function parse(text) {
    const raw = String(text ?? '').trim().replace(/^﻿/, '');
    if (!raw) throw new BackupError('empty', 'Nothing to import');
    if (raw.length > MAX_CHARS) throw new BackupError('too-large', 'Backup is larger than 5 MB');
    let json;
    try { json = JSON.parse(raw); } catch { throw new BackupError('json', 'Not valid JSON'); }
    if (json?.format !== 'k-toolkit-backup') throw new BackupError('format', 'Not a K Toolkit backup');
    if (json.version !== 1) throw new BackupError('version', `Unsupported backup version ${json.version}`, json.version);
    const accepted = {}, rejected = [];
    for (const [key, value] of Object.entries(json.data && typeof json.data === 'object' ? json.data : {})) {
      const reason = validateEntry(key, value, false);
      if (reason) rejected.push({ key, reason });
      else if (key === 'dtb_http_history') accepted[key] = JSON.stringify(window.ToolPrivacy.httpHistory(JSON.parse(value)));
      else if (key === 'dtb_lang') accepted[key] = ['zh', 'en'].includes(value) ? value : JSON.parse(value);
      else accepted[key] = value;
    }
    return { exportedAt: String(json.exportedAt || ''), appVersion: String(json.appVersion || ''), data: accepted, rejected, secret: json.secret || null };
  }

  function validateEntry(key, value, fromSecret) {
    const group = groupOf(key);
    if (!group || ((group === 'apikeys') !== fromSecret && !(fromSecret && key === 'dtb_http_history'))) return 'unknown';
    if (typeof value !== 'string') return 'type';
    if (TEXT_KEYS.has(key) || (key === 'dtb_lang' && ['zh', 'en'].includes(value))) return null;
    let data; try { data = JSON.parse(value); } catch { return 'json'; }
    return validValue(key, data) ? null : 'structure';
  }

  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
  const messages = value => Array.isArray(value) && value.every(item => object(item) && ['user', 'assistant', 'system', 'tool'].includes(item.role) && typeof item.content === 'string');
  const chatId = value => typeof value === 'string' && /^chat-[a-zA-Z0-9-]{1,80}$/.test(value);
  function validValue(key, value) {
    if (key.startsWith('ag_key_')) return typeof value === 'string';
    if (['dtb_favorites', 'dtb_recent', 'dtb_search_history'].includes(key)) return strings(value);
    if (key === 'dtb_usage') return object(value) && Object.values(value).every(v => Number.isFinite(v) && v >= 0);
    if (key === 'dtb_todo') return Array.isArray(value) && value.every(v => object(v) && typeof v.text === 'string' && (v.done === undefined || typeof v.done === 'boolean'));
    if (key === 'dtb_countdowns') return Array.isArray(value) && value.every(v => object(v) && typeof v.name === 'string' && typeof v.target === 'string' && Number.isFinite(Date.parse(v.target)));
    if (key === 'dtb_saved_regex') return Array.isArray(value) && value.every(v => object(v) && ['name', 'pattern', 'flags'].every(k => typeof v[k] === 'string'));
    if (key === 'dtb_mc_history') return Array.isArray(value) && value.every(v => object(v) && ['time', 'duration', 'cost'].every(k => typeof v[k] === 'string'));
    if (key === 'dtb_typing_scores') return Array.isArray(value) && value.every(v => object(v) && Number.isFinite(v.wpm) && Number.isFinite(v.accuracy) && typeof v.date === 'string');
    if (key === 'dtb_http_history') return Array.isArray(value) && value.length <= 20 && value.every(v => object(v) && typeof v.url === 'string' && typeof v.method === 'string' && ['headers', 'body'].every(k => v[k] === undefined || typeof v[k] === 'string'));
    if (key === 'dtb_chat_history') return messages(value) || (object(value) && messages(value.messages));
    if (key === 'dtb_chat_sessions') return object(value) && value.version === 1 && chatId(value.activeId) && Array.isArray(value.items) && value.items.length > 0 && value.items.length <= 50
      && value.items.every(v => object(v) && chatId(v.id) && typeof v.title === 'string') && new Set(value.items.map(v => v.id)).size === value.items.length && value.items.some(v => v.id === value.activeId);
    if (key.startsWith('dtb_chat_session_')) return chatId(key.slice('dtb_chat_session_'.length)) && object(value) && messages(value.messages) && (value.draft === undefined || typeof value.draft === 'string') && (value.systemPrompt === undefined || typeof value.systemPrompt === 'string');
    if (key === 'dtb_chat_draft') return typeof value === 'string';
    if (key === 'dtb_chat_draft_images') return Array.isArray(value) && value.length <= 4 && value.every(v => object(v) && typeof v.base64 === 'string' && /^image\/(png|jpeg|webp|gif)$/.test(v.mime));
    if (key === 'dtb_workflow_draft') return object(value) && value.version === 1 && object(value.value);
    if (key === 'dtb_otp_vault') return object(value) && value.v === 1 && value.kdf?.name === 'PBKDF2' && value.kdf.hash === 'SHA-256'
      && Number.isInteger(value.kdf.iterations) && value.kdf.iterations >= 1000 && value.kdf.iterations <= 10000000 && typeof value.kdf.salt === 'string'
      && /^[A-Za-z0-9+/]{22}==$/.test(value.kdf.salt) && value.cipher?.name === 'AES-GCM' && /^[A-Za-z0-9+/]{16}$/.test(value.cipher.iv)
      && typeof value.data === 'string' && value.data.length >= 24 && value.data.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(value.data);
    if (key === 'dtb_lang') return ['zh', 'en'].includes(value);
    if (key === 'dtb_theme') return ['dark', 'light', 'tech-blue', 'sakura', 'orange', 'green'].includes(value);
    if (key === 'dtb_sidebar_collapsed') return typeof value === 'boolean';
    if (key === 'ag_connections') return Array.isArray(value) && value.length <= 20 && value.every(v => object(v) && /^connection-[a-zA-Z0-9-]{1,80}$/.test(v.id) && typeof v.name === 'string' && typeof v.adapter === 'string');
    if (key === 'ag_custom_workflows') return Array.isArray(value) && value.length <= 20 && value.every(v => object(v) && typeof v.id === 'string');
    if (key.startsWith('ag_')) return value !== null && (['string', 'number', 'boolean'].includes(typeof value) || object(value));
    return object(value);
  }

  /** Keys/values decrypted from a backup's `secret` section, validated like the plain section. */
  function parseSecret(text) {
    let json;
    try { json = JSON.parse(text); } catch { throw new BackupError('json', 'Not valid JSON'); }
    const accepted = {}, rejected = [];
    for (const [key, value] of Object.entries(json && typeof json === 'object' ? json : {})) {
      const reason = validateEntry(key, value, true);
      if (reason) rejected.push({ key, reason }); else accepted[key] = value;
    }
    return { data: accepted, rejected };
  }

  const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

  function mergeValue(key, current, incoming) {
    if (current === incoming) return { value: current };
    // Two boards are encrypted with different passwords; their entries cannot be combined here.
    if (key === 'dtb_otp_vault') return { skip: 'otp-exists' };
    if (key === 'dtb_chat_system') return { value: current };
    if (TEXT_KEYS.has(key)) return { value: current.includes(incoming) ? current : `${current}\n\n---\n${incoming}` };
    let a, b;
    try { a = JSON.parse(current); b = JSON.parse(incoming); } catch { return { value: current }; }
    if (['ag_connections', 'ag_custom_workflows'].includes(key) && Array.isArray(a) && Array.isArray(b)) {
      const ids = new Set(a.map(item => item.id)); const combined = [...a, ...b.filter(item => !ids.has(item.id))];
      if (combined.length > 20) throw new BackupError('limit', 'Too many saved connections or workflows (maximum 20)');
      return { value: JSON.stringify(combined) };
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      const seen = new Set(a.map(x => JSON.stringify(x))), merged = [...a];
      for (const item of b) { const id = JSON.stringify(item); if (!seen.has(id)) { seen.add(id); merged.push(item); } }
      return { value: JSON.stringify(LIMITS[key] ? merged.slice(0, LIMITS[key]) : merged) };
    }
    if (key === 'dtb_usage' && isPlainObject(a) && isPlainObject(b)) {
      const out = { ...a };
      for (const [k, v] of Object.entries(b)) out[k] = (Number(out[k]) || 0) + (Number(v) || 0);
      return { value: JSON.stringify(out) };
    }
    if (isPlainObject(a) && isPlainObject(b) && key === 'dtb_collapsed_cats') return { value: JSON.stringify({ ...b, ...a }) };
    return { value: current }; // preferences and configuration: keep what this browser already has
  }

  /** Writes needed to import `incoming` into `storage` for the chosen groups. */
  function plan(storage, incoming, { mode = 'merge', groups = null } = {}) {
    const writes = [], skipped = [];
    incoming = { ...incoming };
    if (mode === 'merge' && (!groups || groups.includes('chat'))) {
      const read = (raw, fallback) => { try { return JSON.parse(raw) ?? fallback; } catch { return fallback; } };
      const local = read(storage.getItem('dtb_chat_sessions'), null), imported = read(incoming.dtb_chat_sessions, null);
      if (local || imported) {
        const valid = index => index?.version === 1 && Array.isArray(index.items) && index.items.length <= 50 && index.items.some(item => item.id === index.activeId) && index.items.every(item => /^chat-[a-zA-Z0-9-]{1,80}$/.test(item.id));
        if ((local && !valid(local)) || (imported && !valid(imported))) throw new BackupError('sessions', 'Invalid conversation index');
        const legacy = (get) => ({ messages: read(get('dtb_chat_history'), []), meta: read(get('dtb_chat_history_meta'), {}), systemPrompt: get('dtb_chat_system') || '', draft: read(get('dtb_chat_draft'), ''), images: read(get('dtb_chat_draft_images'), []) });
        // Preserve a legacy local chat as its own session before importing indexed chats.
        const make = () => ({ id: 'chat-import-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10), title: 'Imported chat', createdAt: Date.now(), updatedAt: Date.now(), pinned: false });
        const localItem = !local && storage.getItem('dtb_chat_history') ? make() : null;
        const base = local || (localItem ? { version: 1, activeId: localItem.id, items: [localItem] } : null);
        if (base) {
          const extra = imported || (incoming.dtb_chat_history ? (() => { const item = make(); return { version: 1, activeId: item.id, items: [item] }; })() : null);
          if (extra) {
            const existing = new Set(base.items.map(item => item.id));
            if (!existing.has(extra.activeId)) incoming['dtb_chat_session_' + extra.activeId] = JSON.stringify(legacy(key => incoming[key]));
            base.items.push(...extra.items.filter(item => !existing.has(item.id)));
            if (base.items.length > 50) throw new BackupError('limit', 'Too many conversations (maximum 50)');
            // Active snapshots must never be concatenated across different conversations.
            for (const key of ['dtb_chat_history', 'dtb_chat_history_meta', 'dtb_chat_system', 'dtb_chat_draft', 'dtb_chat_draft_images']) delete incoming[key];
            delete incoming['dtb_chat_session_' + base.activeId];
          }
          incoming.dtb_chat_sessions = JSON.stringify(base);
        }
      }
    }
    for (const [key, value] of Object.entries(incoming)) {
      const group = key === 'dtb_http_history' && groups?.includes('http') ? 'http' : groupOf(key);
      if (!group || (groups && !groups.includes(group))) continue;
      const current = storage.getItem(key);
      if (mode === 'overwrite' || key === 'dtb_chat_sessions' || current === null || current === '' || current === '[]' || current === '{}') {
        if (current !== value) writes.push({ key, value, group });
        continue;
      }
      const merged = mergeValue(key, current, value);
      if (merged.skip) skipped.push({ key, group, reason: merged.skip });
      else if (merged.value !== current) writes.push({ key, value: merged.value, group });
    }
    return { writes, skipped };
  }

  function apply(storage, writes) {
    writes = writes.map(item => ({ ...item }));
    if (writes.some(item => item.group === 'chat')) {
      const entry = writes.find(item => item.key === 'dtb_chat_sessions');
      const raw = entry?.value || storage.getItem('dtb_chat_sessions');
      if (raw) {
        const index = JSON.parse(raw);
        index.revision = globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2);
        const value = JSON.stringify(index);
        if (entry) entry.value = value;
        else writes.push({ key: 'dtb_chat_sessions', value, group: 'chat' });
      }
    }
    const failed = [], chat = writes.filter(item => item.group === 'chat'), other = writes.filter(item => item.group !== 'chat');
    if (chat.length) {
      const before = new Map(chat.map(({ key }) => [key, storage.getItem(key)]));
      try { for (const { key, value } of chat) storage.setItem(key, value); }
      catch (e) {
        for (const { key } of chat) { try { storage.removeItem(key); } catch {} }
        for (const [key, value] of before) if (value !== null) { try { storage.setItem(key, value); } catch {} }
        failed.push(...chat.map(({ key }) => ({ key, reason: e?.name === 'QuotaExceededError' ? 'quota' : 'storage' })));
      }
    }
    for (const { key, value } of other) {
      try {
        storage.setItem(key, key === 'dtb_http_history' ? JSON.stringify(window.ToolPrivacy.httpHistory(JSON.parse(value))) : value);
        if (key === 'dtb_http_history') window.RequestSession?.restoreHistory(JSON.parse(value));
      } catch (e) { failed.push({ key, reason: e?.name === 'QuotaExceededError' ? 'quota' : 'storage' }); }
    }
    return { written: writes.length - failed.length, failed };
  }

  (window.KCompute ||= {}).backup = Object.freeze({ GROUPS: GROUPS.map(g => g.id), DEFAULT_GROUPS, BackupError, groupOf, inventory, collect, parse, parseSecret, plan, apply });
})();
