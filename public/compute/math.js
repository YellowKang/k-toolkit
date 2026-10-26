/* Bounded expression parser. No JavaScript evaluation; ^ is power, % is postfix percent. */
(function () {
  const tr = (zh, en) => window.getCurrentLang?.() === 'en' ? en : zh;
  function evaluate(expression, { angle = 'deg' } = {}) {
    if (typeof expression !== 'string' || !expression.trim()) throw new Error(tr('请输入表达式', 'Enter an expression'));
    if (expression.length > 4096) throw new Error(tr('表达式最多 4096 个字符', 'Expression limit: 4096 characters'));
    if (!['deg', 'rad'].includes(angle)) throw new Error('Invalid angle mode');
    const src = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt');
    const tokens = [];
    const re = /\s+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|log10|[a-zA-Z]+|\*\*|[+*/^%(),-]/gy;
    let at = 0;
    const fail = position => { throw new Error(tr('无效表达式，位置 ', 'Invalid expression at ') + (position + 1)); };
    while (at < src.length) {
      re.lastIndex = at;
      const match = re.exec(src);
      if (!match) fail(at);
      if (!/^\s/.test(match[0])) tokens.push({ text: match[0], at });
      at = re.lastIndex;
      if (tokens.length > 1024) throw new Error(tr('表达式过于复杂', 'Expression is too complex'));
    }
    let i = 0, depth = 0;
    const peek = () => tokens[i]?.text;
    const finite = value => {
      if (!Number.isFinite(value)) throw new Error(tr('结果不是有限实数，请检查除零或函数范围', 'Result is not finite; check division by zero or function domains'));
      return value;
    };
    const trig = fn => value => fn(angle === 'deg' ? value * Math.PI / 180 : value);
    const fns = { sin: trig(Math.sin), cos: trig(Math.cos), tan: trig(Math.tan), sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10, log10: Math.log10, exp: Math.exp, floor: Math.floor, ceil: Math.ceil, round: Math.round };
    function parse(min = 0) {
      if (++depth > 64) throw new Error(tr('表达式嵌套最多 64 层', 'Expression nesting limit: 64'));
      const token = tokens[i++];
      if (!token) fail(src.length);
      let left;
      if (token.text === '+' || token.text === '-') left = (token.text === '-' ? -1 : 1) * parse(25);
      else if (token.text === '(') { left = parse(); if (peek() !== ')') fail(tokens[i]?.at ?? src.length); i++; }
      else if (/^(?:\d|\.)/.test(token.text)) left = finite(Number(token.text));
      else if (token.text === 'pi' || token.text === 'e') left = token.text === 'pi' ? Math.PI : Math.E;
      else if (Object.prototype.hasOwnProperty.call(fns, token.text)) {
        if (peek() !== '(') fail(tokens[i]?.at ?? src.length);
        i++; const arg = parse();
        if (peek() !== ')') fail(tokens[i]?.at ?? src.length);
        i++; left = finite(fns[token.text](arg));
      } else fail(token.at);
      while (i < tokens.length) {
        const op = peek();
        const bp = { '+': 10, '-': 10, '*': 20, '/': 20, mod: 20, '^': 30, '**': 30, '%': 40 }[op];
        if (bp === undefined || bp < min) break;
        i++;
        if (op === '%') { left /= 100; continue; }
        const right = parse(bp + (op === '^' || op === '**' ? 0 : 1));
        left = finite(op === '+' ? left + right : op === '-' ? left - right : op === '*' ? left * right : op === '/' ? left / right : op === 'mod' ? left % right : left ** right);
      }
      depth--;
      return finite(left);
    }
    const result = parse();
    if (i !== tokens.length) fail(tokens[i].at);
    return Object.is(result, -0) ? 0 : result;
  }
  (window.KCompute ||= {}).math = Object.freeze({ evaluate, format: value => String(Number(value.toPrecision(15))) });
})();
