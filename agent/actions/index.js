'use strict';
function registerActions() {
const all = [
...(window.TextActions      || []),
...(window.DevActions       || []),
...(window.CalcActions      || []),
...(window.NavActions       || []),
...(window.CompositeActions || []),
...(window.ConvertActions   || []),
...(window.CssGenActions    || []),
];
window._AGENT_ALL_ACTIONS = new Map(all.map(a => [a.name, a]));
window._AGENT_CORE_ACTIONS = all
.filter(a => a.meta && a.meta.tier === 'core')
.map(a => ({ name: a.name, description: a.description, parameters: a.parameters }));
window._AGENT_ACTIONS = all;
}
window.AgentActions = { registerActions };