'use strict';

// ── Command Parser ────────────────────────────────────────────────
// 解析斜杠命令、@提及，绕过 LLM 直接执行
const CmdParser = (() => {

  // 斜杠命令定义
  const SLASH_CMDS = {
    uuid:   { desc: '生成 UUID', usage: '/uuid [数量] [format]',
      parse: (args) => ({ action: 'uuid_generate', params: { count: parseInt(args[0])||1, format: args[1]||'standard' } }) },
    hash:   { desc: '计算哈希', usage: '/hash <文本> [md5|sha1|sha256|sha512]',
      parse: (args) => {
        const algos = { md5:'MD5', sha1:'SHA-1', sha256:'SHA-256', sha512:'SHA-512' };
        const last = args[args.length-1]?.toLowerCase();
        const algo = algos[last] || 'SHA-256';
        const text = algos[last] ? args.slice(0,-1).join(' ') : args.join(' ');
        return { action: 'hash_generate', params: { text, algo } };
      }
    },
    b64:    { desc: 'Base64 编码', usage: '/b64 <文本>',
      parse: (args) => ({ action: 'base64_encode', params: { text: args.join(' ') } }) },
    d64:    { desc: 'Base64 解码', usage: '/d64 <编码>',
      parse: (args) => ({ action: 'base64_decode', params: { encoded: args.join(' ') } }) },
    ts:     { desc: '时间戳转换', usage: '/ts [时间戳或日期]',
      parse: (args) => {
        if (!args[0]) return { action: 'timestamp_now', params: {} };
        const v = args[0];
        const dir = /^\d{10}$/.test(v) ? 'toDate' : /^\d{13}$/.test(v) ? 'toDate' : 'toTs';
        return { action: 'timestamp_convert', params: { value: v, direction: dir, unit: v.length===10?'s':'ms' } };
      }
    },
    pw:     { desc: '生成密码', usage: '/pw [长度] [s=含特殊字符]',
      parse: (args) => {
        const len = parseInt(args[0]) || 16;
        const sym = args.includes('s') || args.includes('-s');
        return { action: 'password_gen', params: { length: len, symbol: sym, upper:true, lower:true, digit:true } };
      }
    },
    calc:   { desc: '计算表达式', usage: '/calc <表达式>',
      parse: (args) => ({ action: 'calculate', params: { expression: args.join('') } }) },
    jwt:    { desc: '解码 JWT', usage: '/jwt <token>',
      parse: (args) => ({ action: 'jwt_decode', params: { token: args[0] || '' } }) },
    ip:     { desc: 'IP 子网计算', usage: '/ip <CIDR>',
      parse: (args) => ({ action: 'ip_calc', params: { cidr: args[0] || '' } }) },
    color:  { desc: '颜色转换', usage: '/color <hex|rgb|hsl>',
      parse: (args) => {
        const input = args.join(' ');
        const from = input.startsWith('#') ? 'hex' : input.startsWith('rgb') ? 'rgb' : input.startsWith('hsl') ? 'hsl' : 'hex';
        return { action: 'color_convert', params: { input, from, to: from==='hex'?'rgb':'hex' } };
      }
    },
    json:   { desc: 'JSON 格式化', usage: '/json <JSON字符串>',
      parse: (args) => ({ action: 'json_format', params: { input: args.join(' ') } }) },
    go:     { desc: '跳转工具页', usage: '/go <工具ID>',
      parse: (args) => ({ action: 'navigate_to_tool', params: { id: args[0] || '' } }) },
  };

  // 元命令（面板操作，不调用 action）
  const META_CMDS = new Set(['clear','config','retry','copy','help','?','model','skin']);

  function parseSlash(text) {
    const parts = text.slice(1).trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (META_CMDS.has(cmd)) return { type: 'meta', cmd, args };
    const handler = SLASH_CMDS[cmd];
    if (handler) return { type: 'action', ...handler.parse(args), cmd };
    return { type: 'unknown_cmd', cmd };
  }

  function parseMention(text) {
    const match = text.match(/^@([\w-]+)(?:\s+(.*))?$/s);
    if (!match) return null;
    return { type: 'mention', toolId: match[1], query: (match[2] || '').trim() };
  }

  function parse(text) {
    text = text.trim();
    if (!text) return null;
    if (text.startsWith('/')) return parseSlash(text);
    if (text.startsWith('@')) return parseMention(text);
    return null; // 自然语言，走 LLM
  }

  function getHelpText() {
    const lines = ['**斜杠命令（直接执行，无需 AI）：**\n'];
    for (const [k, v] of Object.entries(SLASH_CMDS)) {
      lines.push(`\`${v.usage}\` — ${v.desc}`);
    }
    lines.push('\n**元命令：**\n');
    lines.push('`/clear` — 清空对话历史');
    lines.push('`/config` — 打开配置');
    lines.push('`/retry` — 重发上条消息');
    lines.push('`/copy` — 复制最后结果');
    lines.push('`/model <id>` — 切换模型');
    lines.push('`/skin <name>` — 切换皮肤 (glass/dark/light/purple/terminal/neon)');
    lines.push('\n**@提及（锁定工具，AI 选参数）：**\n');
    lines.push('`@hash hello world` — 强制使用哈希工具');
    lines.push('`@base64 aGVsbG8=` — 强制使用 Base64 工具');
    lines.push('`@go image-compress` — 跳转到指定工具');
    return lines.join('\n');
  }

  // 输入框补全：输入 / 后的候选列表
  function getSuggestions(prefix) {
    const p = prefix.slice(1).toLowerCase();
    const results = [];
    for (const [k, v] of Object.entries(SLASH_CMDS)) {
      if (k.startsWith(p) || p === '') {
        results.push({ cmd: k, desc: v.desc, usage: v.usage });
      }
    }
    for (const m of META_CMDS) {
      if (m.startsWith(p) || p === '') {
        const descs = { clear:'清空对话', config:'打开配置', retry:'重发消息', copy:'复制结果', help:'帮助', model:'切换模型', skin:'切换皮肤' };
        results.push({ cmd: m, desc: descs[m]||m, usage: '/'+m });
      }
    }
    return results;
  }

  return { parse, getHelpText, getSuggestions, SLASH_CMDS, META_CMDS };
})();

window.CmdParser = CmdParser;
