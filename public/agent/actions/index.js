'use strict';

// 汇总所有 action 并建立分层注册表
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

  // O(1) 查找全量注册表
  window._AGENT_ALL_ACTIONS = new Map(all.map(a => [a.name, a]));

  // Core tier schemas（每次调用必传，共 6 个）
  window._AGENT_CORE_ACTIONS = all
    .filter(a => a.meta && a.meta.tier === 'core')
    .map(a => ({ name: a.name, description: a.description, parameters: a.parameters }));

  // 向后兼容：_AGENT_ACTIONS 保持原有数组格式供 AgentPlugin 等使用
  window._AGENT_ACTIONS = all;
}

window.AgentActions = { registerActions };
