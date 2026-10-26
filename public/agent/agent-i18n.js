'use strict';

// ── Agent 模块国际化 ─────────────────────────────────────────
// 统一的中英文翻译，所有 Agent 子模块共用
// 使用方式：const t = window.AgentI18n.t;  t('key')

const _agLang = () => {
  // 优先读全局函数，其次读 localStorage
  if (typeof getCurrentLang === 'function') return getCurrentLang() === 'en' ? 'en' : 'zh';
  return (localStorage.getItem('dtb_lang') || 'zh') === 'en' ? 'en' : 'zh';
};

const _agDict = {
  cmd_workflows: { zh: '列出本地工作流模板，无需模型', en: 'List local workflow templates; no model required' },
  cmd_workflow: { zh: '在本地运行模板，支持多行输入', en: 'Run a local template with multiline input' },
  workflow_step: { zh: '步骤', en: 'Step' },
  // ── 通用 ──
  close:          { zh: '关闭', en: 'Close' },
  cancelled: { zh: '已停止', en: 'Cancelled' },
  cancel:         { zh: '取消', en: 'Cancel' },
  save:           { zh: '保存', en: 'Save' },
  saved:          { zh: '设置已保存', en: 'Settings saved' },
  reset:          { zh: '重置', en: 'Reset' },
  copy:           { zh: '复制', en: 'Copy' },
  copied:         { zh: '已复制', en: 'Copied' },
  copy_all:       { zh: '复制全部', en: 'Copy All' },
  open_tool:      { zh: '打开工具 →', en: 'Open Tool →' },
  retry:          { zh: '重试', en: 'Retry' },
  settings:       { zh: '设置', en: 'Settings' },
  clear:          { zh: '清空', en: 'Clear' },
  thinking:       { zh: '思考中', en: 'Thinking' },
  done:           { zh: '完成', en: 'Done' },
  details:        { zh: '详情 ▾', en: 'Details ▾' },

  // ── 面板 ──
  panel_placeholder: { zh: '问我任何事… Enter 发送', en: 'Ask anything… Enter to send' },
  stop:           { zh: '停止生成', en: 'Stop' },
  welcome:        { zh: '👋 你好！有什么可以帮你的？', en: '👋 Hi! How can I help?' },
  welcome_hint:   { zh: '{mod}+J 快速提问 · Alt+A 完整面板', en: '{mod}+J Quick ask · Alt+A Full panel' },

  // ── 欢迎芯片 ──
  chip_workflows: { zh: '本地工作流', en: 'Local workflows' },
  workflow_result: { zh: '最终结果预览', en: 'Final result preview' },
  workflow_use: { zh: '使用模板', en: 'Use template' },
  chip_uuid:      { zh: '生成 UUID', en: 'Generate UUID' },
  chip_hash:      { zh: '帮我算哈希', en: 'Hash text' },
  chip_json:      { zh: '格式化 JSON', en: 'Format JSON' },
  chip_time:      { zh: '时间戳转换', en: 'Convert time' },
  chip_b64:       { zh: 'Base64 编码', en: 'Base64 encode' },
  chip_pw:        { zh: '生成密码', en: 'Gen password' },

  // ── 配置弹窗 ──
  cfg_title:      { zh: '⚙️ 助手设置', en: '⚙️ Settings' },
  cfg_api:        { zh: '🔌 接口配置', en: '🔌 API Config' },
  cfg_adapter:    { zh: '适配器', en: 'Adapter' },
  cfg_apikey_hint:{ zh: 'API Key 仅存储在浏览器本地，不会上传', en: 'API Key stored locally only, never uploaded' },
  cfg_baseurl:    { zh: 'Base URL（可选，自定义代理）', en: 'Base URL (optional, custom proxy)' },
  cfg_baseurl_ph: { zh: 'https://api.anthropic.com', en: 'https://api.anthropic.com' },
  cfg_model:      { zh: '模型（可直接输入自定义名称）', en: 'Model (type custom name or select)' },
  cfg_model_ph:   { zh: '输入或选择模型名', en: 'Type or select model' },
  models_title: { zh: '模型', en: 'Model' },
  models_id: { zh: '当前模型 ID · 可手动输入', en: 'Selected model ID · editable' },
  models_connection: { zh: '连接配置', en: 'Connection' },
  models_protocol: { zh: '接口协议', en: 'API protocol' },
  models_protocol_hint: { zh: '按网关支持的接口协议选择；模型名称不会自动决定协议。', en: 'Choose the API protocol supported by your gateway; the model name does not determine it.' },
  models_hint: { zh: '填写模型 ID，或从下方列表点选。保存后 Agent 和 AI 对话共同使用。', en: 'Enter a model ID or choose below. Agent and AI chat share the saved model.' },
  models_fetch: { zh: '拉取模型', en: 'Fetch models' },
  models_refresh: { zh: '刷新模型', en: 'Refresh models' },
  models_cancel: { zh: '取消拉取', en: 'Cancel fetch' },
  models_search: { zh: '搜索模型名称…', en: 'Search model names…' },
  models_library: { zh: '模型列表', en: 'Model library' },
  models_api: { zh: '接口返回', en: 'From API' },
  models_current: { zh: '当前选择', en: 'Selected' },
  models_recent: { zh: '最近使用', en: 'Recent' },
  models_example: { zh: '内置示例', en: 'Example' },
  models_empty: { zh: '还没有模型列表。先拉取模型，也可以直接填写上方模型 ID。', en: 'No model list yet. Fetch models or enter a model ID above.' },
  models_no_match: { zh: '没有匹配的模型。可直接把这个名称填入模型 ID。', en: 'No matching models. You can use this name as the model ID.' },
  models_use_search: { zh: '使用此模型 ID', en: 'Use this model ID' },
  models_clear_search: { zh: '清除搜索', en: 'Clear search' },
  models_previous: { zh: '上一页', en: 'Previous' },
  models_next: { zh: '下一页', en: 'Next' },
  models_count: { zh: '匹配 {count} 个', en: '{count} matches' },
  models_page: { zh: '第 {page} / {total} 页', en: 'Page {page} / {total}' },
  models_saved_hint: { zh: '保存后记住此连接的列表；能否使用请测试连接。', en: 'Save to keep this list with the connection. Test the selected model to verify access.' },
  models_example_hint: { zh: '内置名称仅供参考；拉取后显示接口实际返回的模型。', en: 'Built-in names are examples. Fetch models to see what your API returns.' },
  models_fetched_at: { zh: '上次拉取', en: 'Last fetched' },
  models_failed_hint: { zh: '仍可手动填写模型 ID 并保存；已有列表和选择已保留。', en: 'You can still enter and save a model ID manually. Your existing list and selection are kept.' },
  models_route_error: { zh: '模型列表接口不可用，请核对下方 GET 地址与网关的 /models 支持。', en: 'The model-list endpoint is unavailable. Check the GET URL and gateway support for /models.' },
  models_required: { zh: '请输入有效的模型 ID（最多 256 个字符）。', en: 'Enter a valid model ID (up to 256 characters).' },
  models_switch: { zh: '切换模型', en: 'Switch model' },
  models_switch_hint: { zh: '下一条消息使用所选模型；正在进行的回复保持原模型。', en: 'The next message uses the selected model; the current response keeps its model.' },
  models_save_switch: { zh: '切换并使用', en: 'Switch and use' },
  models_version: { zh: '页面版本', en: 'Page version' },
  models_dev: { zh: '本地开发版', en: 'Local development' },
  cfg_temp:       { zh: '温度', en: 'Temperature' },
  cfg_layout:     { zh: '📐 布局', en: '📐 Layout' },
  cfg_position:   { zh: '面板位置', en: 'Panel position' },
  cfg_right:      { zh: '右侧', en: 'Right' },
  cfg_left:       { zh: '左侧', en: 'Left' },
  cfg_size:       { zh: '面板尺寸', en: 'Panel size' },
  cfg_compact:    { zh: '紧凑', en: 'Compact' },
  cfg_normal:     { zh: '正常', en: 'Normal' },
  cfg_large:      { zh: '大', en: 'Large' },
  cfg_shortcuts:  { zh: '⌨️ 快捷键', en: '⌨️ Shortcuts' },
  cfg_sc_open:    { zh: '唤起对话', en: 'Open dialog' },
  cfg_sc_quick:   { zh: '快捷问答', en: 'Quick ask' },
  cfg_sc_send:    { zh: '发送消息', en: 'Send' },
  cfg_sc_newline: { zh: '换行', en: 'New line' },
  cfg_sc_cmd:     { zh: '命令面板', en: 'Command palette' },
  cfg_sc_close:   { zh: '关闭面板', en: 'Close panel' },

  // ── 元命令反馈 ──
  history_cleared:{ zh: '对话历史已清空。', en: 'Conversation history cleared.' },
  model_switched: { zh: '模型已切换为：', en: 'Model switched to: ' },
  skin_follows:   { zh: '皮肤已跟随全局主题，请在顶栏切换主题。', en: 'Skin follows global theme. Switch theme in top bar.' },
  unknown_meta:   { zh: '未知元命令：/', en: 'Unknown meta command: /' },
  unknown_cmd:    { zh: '未知命令 /{cmd}，输入 /help 查看可用命令。', en: 'Unknown command /{cmd}. Type /help for available commands.' },
  exec_fail:      { zh: '执行失败：', en: 'Execution failed: ' },
  action_missing: { zh: '命令对应的 action 未找到：', en: 'Action not found: ' },
  skill_active:   { zh: 'skill 已激活', en: 'skill activated' },

  // ── Mini 对话框 ──
  mini_expand:    { zh: '展开完整面板', en: 'Open full panel' },
  mini_welcome:   { zh: '💬 有什么可以帮你的？', en: '💬 How can I help?' },
  mini_ph:        { zh: '快速问一下…', en: 'Quick question…' },

  // ── 结果面板 ──
  rp_copied:      { zh: '已复制 ✓', en: 'Copied ✓' },

  // ── 斜杠命令描述 ──
  cmd_uuid:       { zh: '生成 UUID', en: 'Generate UUID' },
  cmd_hash:       { zh: '计算哈希', en: 'Calculate hash' },
  cmd_b64:        { zh: 'Base64 编码', en: 'Base64 encode' },
  cmd_d64:        { zh: 'Base64 解码', en: 'Base64 decode' },
  cmd_ts:         { zh: '时间戳转换', en: 'Timestamp convert' },
  cmd_pw:         { zh: '生成密码', en: 'Generate password' },
  cmd_calc:       { zh: '计算表达式', en: 'Calculate expression' },
  cmd_jwt:        { zh: '解码 JWT', en: 'Decode JWT' },
  cmd_ip:         { zh: 'IP 子网计算', en: 'IP subnet calc' },
  cmd_color:      { zh: '颜色转换', en: 'Color convert' },
  cmd_json:       { zh: 'JSON 格式化', en: 'Format JSON' },
  cmd_go:         { zh: '跳转工具页', en: 'Go to tool' },
  cmd_clear:      { zh: '清空对话', en: 'Clear chat' },
  cmd_config:     { zh: '打开配置', en: 'Open settings' },
  cmd_retry:      { zh: '重试失败的请求', en: 'Retry failed request' },
  cmd_copy:       { zh: '复制结果', en: 'Copy result' },
  cmd_help:       { zh: '帮助', en: 'Help' },
  cmd_model:      { zh: '切换模型', en: 'Switch model' },
  cmd_skin:       { zh: '切换主题', en: 'Switch theme' },

  // ── 帮助文本 ──
  help_slash:     { zh: '**斜杠命令（直接执行，无需 AI）：**', en: '**Slash Commands (run directly, no AI):**' },
  help_meta:      { zh: '**元命令：**', en: '**Meta Commands:**' },
  help_clear:     { zh: '清空对话历史', en: 'Clear conversation history' },
  help_config:    { zh: '打开配置', en: 'Open settings' },
  help_retry:     { zh: '重试上次失败的请求，保留工具结果', en: 'Retry the failed request, keeping completed tool results' },
  no_retry:       { zh: '当前没有可重试的失败请求。', en: 'There is no failed request to retry.' },
  help_copy:      { zh: '复制最后结果', en: 'Copy last result' },
  help_model:     { zh: '切换模型', en: 'Switch model' },
  help_skin:      { zh: '切换主题', en: 'Switch theme' },
  help_mention:   { zh: '**@提及（锁定工具，AI 选参数）：**', en: '**@Mention (lock tool, AI picks params):**' },
  help_mention_hash: { zh: '强制使用哈希工具', en: 'Force hash tool' },
  help_mention_b64:  { zh: '强制使用 Base64 工具', en: 'Force Base64 tool' },
  help_mention_go:   { zh: '跳转到指定工具', en: 'Jump to tool' },
};

function _agT(key) {
  const entry = _agDict[key];
  if (!entry) return key;
  return entry[_agLang()] || entry.zh || key;
}

window.AgentI18n = { t: _agT, lang: _agLang, dict: _agDict };
