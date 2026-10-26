'use strict';

const AG = {
  // localStorage key helpers
  get(key, def) {
    try { const v = localStorage.getItem('ag_' + key); return v === null ? def : JSON.parse(v); }
    catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem('ag_' + key, JSON.stringify(val)); } catch {}
  },

  // Only the legacy selected provider inherits the old global fields.
  profile(adapter) {
    const profiles = AG.get('profiles', {});
    const saved = profiles && typeof profiles === 'object' && Object.hasOwn(profiles, adapter) ? profiles[adapter] : null;
    const legacy = adapter === AG.get('adapter', 'claude');
    const read = (key, old, fallback) => saved?.[key] ?? (legacy ? AG.get(old, fallback) : fallback);
    return {
      adapter, apiKey: AG.getKey(adapter),
      baseUrl: String(read('baseUrl', 'base_url', '')),
      model: String(read('model', 'model', '')),
      temperature: Number(read('temperature', 'temperature', 0.7)),
      max_tokens: Number(read('max_tokens', 'max_tokens', 2000)),
    };
  },
  load() {
    const selected = AG.get('adapter', 'claude');
    const adapter = ['claude', 'openai-chat', 'openai-response', 'gemini', 'custom'].includes(selected) ? selected : 'claude';
    return {
      ...AG.profile(adapter),
      skin: AG.get('skin', 'theme'), position: AG.get('position', 'right'),
      size: AG.get('size', 'normal'), show_cards: AG.get('show_cards', true),
    };
  },
  validate(cfg) {
    if (!window.AgentAdapters.listAdapters().some(a => a.id === cfg.adapter)) throw new Error('Unknown adapter');
    window.AgentTransport.endpoint(cfg.adapter, cfg.baseUrl);
    if (cfg.adapter === 'custom' && !cfg.model.trim()) throw new Error(window.getCurrentLang?.() === 'en' ? 'Enter a model name.' : '请输入模型名称。');
    if (!Number.isFinite(cfg.temperature) || cfg.temperature < 0 || cfg.temperature > 1) throw new Error('Temperature: 0–1');
    if (!Number.isInteger(cfg.max_tokens) || cfg.max_tokens < 1 || cfg.max_tokens > 128000) throw new Error('Max tokens: 1–128000');
  },
  save(cfg) {
    AG.validate(cfg);
    const profiles = { ...AG.get('profiles', {}) };
    // Preserve the previous legacy profile before switching providers.
    const previous = AG.load().adapter;
    for (const id of [previous, cfg.adapter]) {
      const profile = id === cfg.adapter ? cfg : AG.profile(id);
      profiles[id] = { baseUrl: profile.baseUrl, model: profile.model, temperature: profile.temperature, max_tokens: profile.max_tokens };
    }
    const values = { profiles, adapter: cfg.adapter, ['key_' + cfg.adapter]: cfg.apiKey,
      base_url: cfg.baseUrl, model: cfg.model, temperature: cfg.temperature, max_tokens: cfg.max_tokens,
      skin: cfg.skin, position: cfg.position, size: cfg.size, show_cards: cfg.show_cards };
    const before = new Map(Object.keys(values).map(key => [key, localStorage.getItem('ag_' + key)]));
    try { for (const [key, value] of Object.entries(values)) localStorage.setItem('ag_' + key, JSON.stringify(value)); }
    catch (error) {
      for (const [key, value] of before) { try { if (value === null) localStorage.removeItem('ag_' + key); else localStorage.setItem('ag_' + key, value); } catch {} }
      throw new Error(window.getCurrentLang?.() === 'en' ? 'Could not save settings. Browser storage is unavailable or full.' : '设置保存失败：浏览器存储不可用或已满。');
    }
    window.dispatchEvent(new CustomEvent('agent-config-change'));
  },

  // Get API key for specific adapter
  getKey(adapterId) {
    return AG.get('key_' + adapterId, '');
  },
};

// Skin CSS variable definitions
const SKINS = {
  // 跟随主题：映射 --ag-* → 全局 CSS 变量名（applySkin 会从 :root 读计算值）
  theme: {
    '--ag-bg':          '--sidebar-bg',
    '--ag-bg2':         '--surface',
    '--ag-border':      '--border',
    '--ag-text':        '--text',
    '--ag-text2':       '--text-muted',
    '--ag-accent':      '--accent',
    '--ag-accent-text': '--text-on-accent',
    '--ag-shadow':      '0 8px 32px rgba(0,0,0,0.4)',
    '--ag-blur':        'blur(24px)',
    '--ag-font':        'inherit',
    '--ag-radius':      '12px',
  },
  glass: {
    '--ag-bg':          'rgba(18,18,30,0.82)',
    '--ag-bg2':         'rgba(255,255,255,0.06)',
    '--ag-border':      'rgba(255,255,255,0.12)',
    '--ag-text':        '#e2e8f0',
    '--ag-text2':       '#94a3b8',
    '--ag-accent':      '#6366f1',
    '--ag-accent-text': '#ffffff',
    '--ag-shadow':      '0 8px 32px rgba(0,0,0,0.4)',
    '--ag-blur':        'blur(24px)',
    '--ag-font':        'inherit',
    '--ag-radius':      '16px',
  },
  dark: {
    '--ag-bg':          '#0d0d1a',
    '--ag-bg2':         '#1a1a2e',
    '--ag-border':      '#2d2d4e',
    '--ag-text':        '#e2e8f0',
    '--ag-text2':       '#64748b',
    '--ag-accent':      '#6366f1',
    '--ag-accent-text': '#ffffff',
    '--ag-shadow':      '0 8px 32px rgba(0,0,0,0.6)',
    '--ag-blur':        'none',
    '--ag-font':        'inherit',
    '--ag-radius':      '12px',
  },
  light: {
    '--ag-bg':          '#ffffff',
    '--ag-bg2':         '#f1f5f9',
    '--ag-border':      '#e2e8f0',
    '--ag-text':        '#1e293b',
    '--ag-text2':       '#64748b',
    '--ag-accent':      '#6366f1',
    '--ag-accent-text': '#ffffff',
    '--ag-shadow':      '0 8px 32px rgba(0,0,0,0.12)',
    '--ag-blur':        'none',
    '--ag-font':        'inherit',
    '--ag-radius':      '12px',
  },
  purple: {
    '--ag-bg':          '#1a0d2e',
    '--ag-bg2':         '#2d1654',
    '--ag-border':      '#4a2080',
    '--ag-text':        '#e9d5ff',
    '--ag-text2':       '#a78bfa',
    '--ag-accent':      '#a855f7',
    '--ag-accent-text': '#ffffff',
    '--ag-shadow':      '0 8px 32px rgba(168,85,247,0.2)',
    '--ag-blur':        'none',
    '--ag-font':        'inherit',
    '--ag-radius':      '14px',
  },
  sakura: {
    '--ag-bg':          'rgba(255,240,245,0.92)',
    '--ag-bg2':         'rgba(255,182,193,0.25)',
    '--ag-border':      'rgba(255,105,135,0.25)',
    '--ag-text':        '#6d2b3d',
    '--ag-text2':       '#c06080',
    '--ag-accent':      '#ff6b9d',
    '--ag-accent-text': '#ffffff',
    '--ag-shadow':      '0 8px 32px rgba(255,107,157,0.25)',
    '--ag-blur':        'blur(20px)',
    '--ag-font':        'inherit',
    '--ag-radius':      '20px',
  },
  ocean: {
    '--ag-bg':          'rgba(2,20,40,0.90)',
    '--ag-bg2':         'rgba(0,80,120,0.30)',
    '--ag-border':      'rgba(0,180,255,0.20)',
    '--ag-text':        '#a8e6ff',
    '--ag-text2':       '#4db8e8',
    '--ag-accent':      '#00c8ff',
    '--ag-accent-text': '#001a2e',
    '--ag-shadow':      '0 8px 32px rgba(0,200,255,0.20)',
    '--ag-blur':        'blur(24px)',
    '--ag-font':        'inherit',
    '--ag-radius':      '14px',
  },
  neon: {
    '--ag-bg':          'rgba(5,0,15,0.93)',
    '--ag-bg2':         'rgba(255,0,255,0.08)',
    '--ag-border':      'rgba(255,0,255,0.30)',
    '--ag-text':        '#ff80ff',
    '--ag-text2':       '#cc00cc',
    '--ag-accent':      '#ff00ff',
    '--ag-accent-text': '#ffffff',
    '--ag-shadow':      '0 0 24px rgba(255,0,255,0.30)',
    '--ag-blur':        'none',
    '--ag-font':        'monospace',
    '--ag-radius':      '6px',
  },
  terminal: {
    '--ag-bg':          '#0a0a0a',
    '--ag-bg2':         '#111111',
    '--ag-border':      '#00ff41',
    '--ag-text':        '#00ff41',
    '--ag-text2':       '#00aa2a',
    '--ag-accent':      '#00ff41',
    '--ag-accent-text': '#000000',
    '--ag-shadow':      '0 0 20px rgba(0,255,65,0.2)',
    '--ag-blur':        'none',
    '--ag-font':        'monospace',
    '--ag-radius':      '4px',
  },
};

// Apply skin — always resolve from current global theme
function applySkin() {
  const targets = [document.getElementById('agentPanel'), document.querySelector('#agConfigModal .ag-config-box'), document.getElementById('agMiniBox')].filter(Boolean);
  const rootStyle = getComputedStyle(document.documentElement);
  for (const target of targets) {
    target.setAttribute('data-skin', 'theme');
    for (const [variable, value] of Object.entries(SKINS.theme)) {
      target.style.setProperty(variable, value.startsWith('--') ? rootStyle.getPropertyValue(value).trim() : value);
    }
  }
}

window.AgentConfig = { AG, SKINS, applySkin };
