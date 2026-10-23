/* Backup and restore of everything the toolkit keeps in localStorage (DOM-free; tests pass a fake storage).
 * Only allow-listed keys are exported or written. Groups decide what is offered; "merge" combines an import with the
 * data already in this browser, "overwrite" replaces only the keys of the chosen groups. API keys never travel in
 * the plain `data` section: the page encrypts them into `secret` with compute/secure-box.js. */
(function () {
  const GROUPS = [
    { id: 'prefs', keys: ['dtb_lang', 'dtb_theme', 'dtb_sidebar_collapsed', 'dtb_collapsed_cats', 'ag_fab_pos', 'dtb_otp_settings'] },
    { id: 'history', keys: ['dtb_favorites', 'dtb_recent', 'dtb_usage', 'dtb_search_history'] },
    { id: 'tools', keys: ['dtb_note', 'dtb_todo', 'dtb_countdowns', 'dtb_saved_regex', 'dtb_mc_history', 'dtb_typing_scores', 'dtb_http_history'] },
    { id: 'chat', keys: ['dtb_chat_history', 'dtb_chat_system', 'dtb_chat_config'] },
    { id: 'agent', prefix: 'ag_', exclude: key => key.startsWith('ag_key_') || key === 'ag_fab_pos' },
    { id: 'apikeys', prefix: 'ag_key_', sensitive: true },
    { id: 'otp', keys: ['dtb_otp_vault'] },
  ];
  const DEFAULT_GROUPS = ['prefs', 'history', 'tools', 'chat', 'agent', 'otp'];
  const LIMITS = { dtb_recent: 8, dtb_search_history: 5 };
  const TEXT_KEYS = new Set(['dtb_note']);
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
      if (group === 'apikeys') secret[key] = raw; else data[key] = raw;
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
      if (reason) rejected.push({ key, reason }); else accepted[key] = value;
    }
    return { exportedAt: String(json.exportedAt || ''), appVersion: String(json.appVersion || ''), data: accepted, rejected, secret: json.secret || null };
  }

  function validateEntry(key, value, fromSecret) {
    const group = groupOf(key);
    if (!group || (group === 'apikeys') !== fromSecret) return 'unknown';
    if (typeof value !== 'string') return 'type';
    if (!TEXT_KEYS.has(key)) { try { JSON.parse(value); } catch { return 'json'; } }
    return null;
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
    if (TEXT_KEYS.has(key)) return { value: current.includes(incoming) ? current : `${current}\n\n---\n${incoming}` };
    let a, b;
    try { a = JSON.parse(current); b = JSON.parse(incoming); } catch { return { value: current }; }
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
    for (const [key, value] of Object.entries(incoming)) {
      const group = groupOf(key);
      if (!group || (groups && !groups.includes(group))) continue;
      const current = storage.getItem(key);
      if (mode === 'overwrite' || current === null || current === '' || current === '[]' || current === '{}') {
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
    const failed = [];
    for (const { key, value } of writes) {
      try { storage.setItem(key, value); } catch (e) { failed.push({ key, reason: e?.name === 'QuotaExceededError' ? 'quota' : 'storage' }); }
    }
    return { written: writes.length - failed.length, failed };
  }

  (window.KCompute ||= {}).backup = Object.freeze({ GROUPS: GROUPS.map(g => g.id), DEFAULT_GROUPS, BackupError, groupOf, inventory, collect, parse, parseSecret, plan, apply });
})();
