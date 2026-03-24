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

  // Load full config
  load() {
    return {
      adapter:     AG.get('adapter', 'claude'),
      apiKey:      AG.get('key_claude', ''),
      baseUrl:     AG.get('base_url', ''),
      model:       AG.get('model', ''),
      temperature: AG.get('temperature', 0.7),
      max_tokens:  AG.get('max_tokens', 2000),
      skin:        AG.get('skin', 'glass'),
      position:    AG.get('position', 'right'),
      size:        AG.get('size', 'normal'),
      show_cards:  AG.get('show_cards', true),
    };
  },

  // Save full config object
  save(cfg) {
    AG.set('adapter',     cfg.adapter);
    AG.set('key_' + cfg.adapter, cfg.apiKey);
    AG.set('base_url',    cfg.baseUrl);
    AG.set('model',       cfg.model);
    AG.set('temperature', cfg.temperature);
    AG.set('max_tokens',  cfg.max_tokens);
    AG.set('skin',        cfg.skin);
    AG.set('position',    cfg.position);
    AG.set('size',        cfg.size);
    AG.set('show_cards',  cfg.show_cards);
  },

  // Get API key for specific adapter
  getKey(adapterId) {
    return AG.get('key_' + adapterId, '');
  },
};

// Skin CSS variable definitions
const SKINS = {
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

// Apply skin by id, or by raw vars object (for custom)
function applySkin(skinIdOrVars) {
  const panel = document.getElementById('agentPanel');
  if (!panel) return;
  const vars = typeof skinIdOrVars === 'object' ? skinIdOrVars : (SKINS[skinIdOrVars] || SKINS.glass);
  const id   = typeof skinIdOrVars === 'string' ? skinIdOrVars : 'custom';
  panel.setAttribute('data-skin', id);
  for (const [k, v] of Object.entries(vars)) panel.style.setProperty(k, v);
}

window.AgentConfig = { AG, SKINS, applySkin };
