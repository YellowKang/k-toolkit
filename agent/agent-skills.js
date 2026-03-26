'use strict';
const SKILLS = [
{
id: 'security_audit',
name: '安全审计',
icon: '🔍',
triggers: ['安全审计','security audit','检查安全','有没有漏洞','安全问题'],
description: '对输入内容进行安全分析：检测 JWT 过期、密码强度、哈希算法安全性',
buildPrompt(input) {
return '请对以下内容进行安全审计，依次：1)识别内容类型 2)调用相关工具分析 3)给出安全评估和建议。\n输入：' + input;
}
},
{
id: 'data_transform',
name: '数据转换',
icon: '🔄',
triggers: ['数据转换','data transform','编码解码','格式转换','批量转换'],
description: '智能识别数据类型并转换，支持 Base64/URL/JSON/Hash 等格式',
buildPrompt(input) {
return '请识别以下数据的格式，然后调用合适的工具处理（如果是编码过的数据则解码，如果是明文则提供多种编码选项）。\n数据：' + input;
}
},
{
id: 'dev_toolkit',
name: '开发工具箱',
icon: '🧰',
triggers: ['开发工具箱','dev toolkit','批量生成','开发辅助'],
description: '快速生成开发常用数据：UUID、密码、时间戳、哈希等',
buildPrompt(input) {
return '用户需要开发工具支持，请根据需求调用最合适的工具生成所需数据。需求：' + input;
}
},
{
id: 'text_analyze',
name: '文本分析',
icon: '📊',
triggers: ['分析文本','analyze text','文本分析','全面分析','文本信息'],
description: '对文本进行全面分析：字数统计、格式检测、内容识别',
buildPrompt(input) {
return '请对以下文本进行全面分析，包括字数统计、格式识别、内容特征等，调用相关工具后给出综合报告。\n文本：' + input;
}
},
{
id: 'network_info',
name: '网络信息',
icon: '🌐',
triggers: ['网络分析','network analysis','IP分析','子网计算','CIDR计算'],
description: '分析网络相关信息：IP 子网计算、URL 解析等',
buildPrompt(input) {
return '请分析以下网络相关信息，调用适当工具（IP计算/URL解析等）给出详细结果。\n输入：' + input;
}
},
];
function matchSkill(userText) {
const lower = userText.toLowerCase();
for (const skill of SKILLS) {
if (skill.triggers.some(t => lower.includes(t.toLowerCase()))) {
return skill;
}
}
return null;
}
function listSkills() {
return SKILLS.map(s => ({ id: s.id, name: s.name, icon: s.icon, description: s.description }));
}
window.AgentSkills = { SKILLS, matchSkill, listSkills };