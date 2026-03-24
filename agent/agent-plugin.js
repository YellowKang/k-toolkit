'use strict';

// ── Agent Plugin Registry ────────────────────────────────────────
// 扩展点：允许浏览器扩展、外部脚本、用户自定义脚本注册新能力
// 插件可以添加 actions / skills / slash commands / UI hooks

const AgentPlugin = (() => {
  const _plugins = {};      // id => plugin
  const _listeners = [];    // onRegister 回调

  // 插件结构规范：
  // {
  //   id: 'my-plugin',           // 必填，唯一标识
  //   name: '插件名',             // 必填，显示名
  //   version: '1.0.0',          // 可选
  //   actions: [...],            // 可选，扩展 actions
  //   skills: [...],             // 可选，扩展 skills
  //   commands: { cmd: {...} },  // 可选，扩展斜杠命令
  //   onLoad(session) {},        // 可选，加载回调
  //   onUnload() {},             // 可选，卸载回调
  // }

  function register(plugin) {
    if (!plugin || !plugin.id) {
      console.warn('[AgentPlugin] register: missing id'); return;
    }
    if (_plugins[plugin.id]) {
      console.warn('[AgentPlugin] already registered:', plugin.id); return;
    }
    _plugins[plugin.id] = plugin;

    // 注册 actions
    if (plugin.actions && plugin.actions.length) {
      if (!window._AGENT_ACTIONS) window._AGENT_ACTIONS = [];
      if (!window._AGENT_ALL_ACTIONS) window._AGENT_ALL_ACTIONS = new Map();
      plugin.actions.forEach(a => {
        if (!window._AGENT_ACTIONS.find(x => x.name === a.name)) {
          window._AGENT_ACTIONS.push(a);
        }
        // 同步更新 Map，供 _exec() O(1) 查找
        if (!window._AGENT_ALL_ACTIONS.has(a.name)) {
          window._AGENT_ALL_ACTIONS.set(a.name, a);
        }
      });
    }

    // 注册 skills
    if (plugin.skills && plugin.skills.length && window.AgentSkills) {
      plugin.skills.forEach(s => {
        if (!window.AgentSkills.SKILLS.find(x => x.id === s.id)) {
          window.AgentSkills.SKILLS.push(s);
        }
      });
    }

    // 注册 slash commands
    if (plugin.commands && window.CmdParser) {
      Object.assign(window.CmdParser.SLASH_CMDS, plugin.commands);
    }

    // 调用 onLoad 回调
    if (typeof plugin.onLoad === 'function') {
      try {
        const session = window._agCurrentSession && window._agCurrentSession();
        plugin.onLoad(session);
      } catch(e) {
        console.error('[AgentPlugin] onLoad error:', plugin.id, e);
      }
    }

    console.log('[AgentPlugin] registered:', plugin.id, plugin.version || '');
    _listeners.forEach(fn => { try { fn(plugin); } catch(e) {} });
  }

  function unregister(id) {
    const plugin = _plugins[id];
    if (!plugin) return;

    if (plugin.actions && window._AGENT_ACTIONS) {
      const names = new Set(plugin.actions.map(a => a.name));
      window._AGENT_ACTIONS = window._AGENT_ACTIONS.filter(a => !names.has(a.name));
      // 同步从 Map 中删除
      if (window._AGENT_ALL_ACTIONS) {
        names.forEach(n => window._AGENT_ALL_ACTIONS.delete(n));
      }
    }

    if (plugin.skills && window.AgentSkills) {
      const ids = new Set(plugin.skills.map(s => s.id));
      window.AgentSkills.SKILLS = window.AgentSkills.SKILLS.filter(s => !ids.has(s.id));
    }

    if (typeof plugin.onUnload === 'function') {
      try { plugin.onUnload(); } catch(e) {}
    }

    delete _plugins[id];
    console.log('[AgentPlugin] unregistered:', id);
  }

  function list() {
    return Object.values(_plugins).map(p => ({
      id: p.id, name: p.name, version: p.version || ''
    }));
  }

  function onRegister(fn) {
    _listeners.push(fn);
  }

  function get(id) {
    return _plugins[id] || null;
  }

  return { register, unregister, list, onRegister, get };
})();

window.AgentPlugin = AgentPlugin;

// ── 浏览器扩展通信桥 ─────────────────────────────────────────────
// 支持通过 CustomEvent 与浏览器扩展通信
// 扩展可以 dispatchEvent(new CustomEvent('ag:register-plugin', { detail: pluginDef }))

document.addEventListener('ag:register-plugin', (e) => {
  if (e.detail) AgentPlugin.register(e.detail);
});

document.addEventListener('ag:unregister-plugin', (e) => {
  if (e.detail && e.detail.id) AgentPlugin.unregister(e.detail.id);
});

// 扩展可以监听此事件获知 agent 已就绪
function _notifyAgentReady() {
  document.dispatchEvent(new CustomEvent('ag:ready', {
    detail: {
      version: '1.0',
      actions: (window._AGENT_ACTIONS || []).map(a => a.name),
      skills:  (window.AgentSkills?.SKILLS || []).map(s => s.id),
    }
  }));
}
window._agNotifyReady = _notifyAgentReady;
