'use strict';
const AgentPlugin = (() => {
const _plugins = {};      
const _listeners = [];    
function register(plugin) {
if (!plugin || !plugin.id) {
console.warn('[AgentPlugin] register: missing id'); return;
}
if (_plugins[plugin.id]) {
console.warn('[AgentPlugin] already registered:', plugin.id); return;
}
_plugins[plugin.id] = plugin;
if (plugin.actions && plugin.actions.length) {
if (!window._AGENT_ACTIONS) window._AGENT_ACTIONS = [];
if (!window._AGENT_ALL_ACTIONS) window._AGENT_ALL_ACTIONS = new Map();
plugin.actions.forEach(a => {
if (!window._AGENT_ACTIONS.find(x => x.name === a.name)) {
window._AGENT_ACTIONS.push(a);
}
if (!window._AGENT_ALL_ACTIONS.has(a.name)) {
window._AGENT_ALL_ACTIONS.set(a.name, a);
}
});
}
if (plugin.skills && plugin.skills.length && window.AgentSkills) {
plugin.skills.forEach(s => {
if (!window.AgentSkills.SKILLS.find(x => x.id === s.id)) {
window.AgentSkills.SKILLS.push(s);
}
});
}
if (plugin.commands && window.CmdParser) {
Object.assign(window.CmdParser.SLASH_CMDS, plugin.commands);
}
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
document.addEventListener('ag:register-plugin', (e) => {
if (e.detail) AgentPlugin.register(e.detail);
});
document.addEventListener('ag:unregister-plugin', (e) => {
if (e.detail && e.detail.id) AgentPlugin.unregister(e.detail.id);
});
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