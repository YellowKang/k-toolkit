'use strict';

// ── Command Parser ────────────────────────────────────────────────
// 解析斜杠命令、@提及，绕过 LLM 直接执行

const CmdParser = (() => {

  // i18n 辅助：agent-i18n.js 先于本文件加载
  const _t = (k) => window.AgentI18n?.t(k) || k;

  // 斜杠命令定义（desc 使用 key，getSuggestions/getHelpText 调用时动态翻译）
  const SLASH_CMDS = {
    uuid:   { descKey: 'cmd_uuid', usage: '/uuid [数量] [format]',
      parse: (args) => ({ action: 'uuid_generate', params: { count: parseInt(args[0])||1, format: args[1]||'standard' } }) },
    hash:   { descKey: 'cmd_hash', usage: '/hash <文本> [md5|sha1|sha256|sha512]',
      parse: (args) => {
        const algos = { md5:'MD5', sha1:'SHA-1', sha256:'SHA-256', sha512:'SHA-512' };
        const last = args[args.length-1]?.toLowerCase();
        const algo = algos[last] || 'SHA-256';
        const text = algos[last] ? args.slice(0,-1).join(' ') : args.join(' ');
        return { action: 'hash_generate', params: { text, algo } };
      }
    },
    b64:    { descKey: 'cmd_b64', usage: '/b64 <文本>',
      parse: (args) => ({ action: 'base64_encode', params: { text: args.join(' ') } }) },
    d64:    { descKey: 'cmd_d64', usage: '/d64 <编码>',
      parse: (args) => ({ action: 'base64_decode', params: { encoded: args.join(' ') } }) },
    ts:     { descKey: 'cmd_ts', usage: '/ts [时间戳或日期]',
      parse: (args) => {
        if (!args[0]) return { action: 'timestamp_now', params: {} };
        const v = args[0];
        const dir = /^\d{10}$/.test(v) ? 'toDate' : /^\d{13}$/.test(v) ? 'toDate' : 'toTs';
        return { action: 'timestamp_convert', params: { value: v, direction: dir, unit: v.length===10?'s':'ms' } };
      }
    },
    pw:     { descKey: 'cmd_pw', usage: '/pw [长度] [s=含特殊字符]',
      parse: (args) => {
        const len = parseInt(args[0]) || 16;
        const sym = args.includes('s') || args.includes('-s');
        return { action: 'password_gen', params: { length: len, symbol: sym, upper:true, lower:true, digit:true } };
      }
    },
    calc:   { descKey: 'cmd_calc', usage: '/calc <表达式>',
      parse: (args) => ({ action: 'calculate', params: { expression: args.join('') } }) },
    jwt:    { descKey: 'cmd_jwt', usage: '/jwt <token>',
      parse: (args) => ({ action: 'jwt_decode', params: { token: args[0] || '' } }) },
    ip:     { descKey: 'cmd_ip', usage: '/ip <CIDR>',
      parse: (args) => ({ action: 'ip_calc', params: { cidr: args[0] || '' } }) },
    color:  { descKey: 'cmd_color', usage: '/color <hex|rgb|hsl>',
      parse: (args) => {
        const input = args.join(' ');
        const from = input.startsWith('#') ? 'hex' : input.startsWith('rgb') ? 'rgb' : input.startsWith('hsl') ? 'hsl' : 'hex';
        return { action: 'color_convert', params: { input, from, to: from==='hex'?'rgb':'hex' } };
      }
    },
    json:   { descKey: 'cmd_json', usage: '/json <JSON字符串>',
      parse: (args) => ({ action: 'json_format', params: { input: args.join(' ') } }) },
    go:     { descKey: 'cmd_go', usage: '/go <工具ID>',
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
    const lines = [_t('help_slash') + '\n'];
    for (const [k, v] of Object.entries(SLASH_CMDS)) {
      lines.push(`\`${v.usage}\` — ${_t(v.descKey)}`);
    }
    lines.push('\n' + _t('help_meta') + '\n');
    lines.push('`/clear` — ' + _t('help_clear'));
    lines.push('`/config` — ' + _t('help_config'));
    lines.push('`/retry` — ' + _t('help_retry'));
    lines.push('`/copy` — ' + _t('help_copy'));
    lines.push('`/model <id>` — ' + _t('help_model'));
    lines.push('`/skin <name>` — ' + _t('help_skin'));
    lines.push('\n' + _t('help_mention') + '\n');
    lines.push('`@hash hello world` — ' + _t('help_mention_hash'));
    lines.push('`@base64 aGVsbG8=` — ' + _t('help_mention_b64'));
    lines.push('`@go image-compress` — ' + _t('help_mention_go'));
    return lines.join('\n');
  }

  // 输入框补全：输入 / 后的候选列表
  function getSuggestions(prefix) {
    const p = prefix.slice(1).toLowerCase();
    const results = [];
    for (const [k, v] of Object.entries(SLASH_CMDS)) {
      if (k.startsWith(p) || p === '') {
        results.push({ cmd: k, desc: _t(v.descKey), usage: v.usage });
      }
    }
    for (const m of META_CMDS) {
      if (m.startsWith(p) || p === '') {
        const descKeys = { clear:'cmd_clear', config:'cmd_config', retry:'cmd_retry', copy:'cmd_copy', help:'cmd_help', model:'cmd_model', skin:'cmd_skin' };
        results.push({ cmd: m, desc: descKeys[m] ? _t(descKeys[m]) : m, usage: '/'+m });
      }
    }
    return results;
  }

  return { parse, getHelpText, getSuggestions, SLASH_CMDS, META_CMDS };
})();

window.CmdParser = CmdParser;
