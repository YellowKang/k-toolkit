(function () {
const SQL_KW = new Set('SELECT FROM WHERE JOIN LEFT RIGHT INNER OUTER FULL CROSS ON AND OR NOT IN EXISTS BETWEEN LIKE ILIKE IS NULL ORDER BY GROUP HAVING LIMIT OFFSET INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP DISTINCT AS UNION ALL WITH RECURSIVE CASE WHEN THEN ELSE END COUNT SUM AVG MAX MIN COALESCE NULLIF ASC DESC RETURNING OVER PARTITION FETCH FIRST ROWS ONLY EXCEPT INTERSECT TRUE FALSE'.split(' '));
const SQL_BREAKS = new Set(['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','CROSS JOIN','LEFT OUTER JOIN','RIGHT OUTER JOIN','FULL OUTER JOIN','ON','AND','OR','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','UNION','UNION ALL','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','RETURNING','WITH','WHEN','ELSE']);

// A lexer keeps literals and comments opaque. This is a formatter, not a SQL validator.
function sqlTokens(raw, dialect = 'sql') {
  if(typeof raw !== 'string' || raw.length > 1000000) throw new Error('SQL input exceeds 1000000 characters');
  const tokens = [], word = /[A-Za-z_\u0080-\uffff][\w$\u0080-\uffff]*/y, number = /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/y;
  let i = 0;
  const add = (type,start) => tokens.push({type,text:raw.slice(start,i)});
  const unclosed = () => { const error=new Error('Unclosed SQL token'); error.code='unclosed'; throw error; };
  while (i < raw.length) {
    const start = i, c = raw[i];
    if (/\s/.test(c)) { while(i<raw.length && /\s/.test(raw[i])) i++; add('space',start); continue; }
    if ((raw.startsWith('--',i) && (dialect!=='mysql' || !raw[i+2] || /\s/.test(raw[i+2]))) || (c==='#' && dialect==='mysql')) {
      while(i<raw.length && raw[i]!=='\n' && raw[i]!=='\r') i++;
      add('line-comment',start); continue;
    }
    if(raw.startsWith('/*',i)) {
      i+=2; let depth=1;
      while(i<raw.length && depth) {
        if(raw.startsWith('/*',i) && dialect==='pgsql') {depth++;i+=2;}
        else if(raw.startsWith('*/',i)) {depth--;i+=2;} else i++;
      }
      if(depth) unclosed(); add('comment',start); continue;
    }
    if(c==='$' && dialect!=='mysql') {
      const tag=raw.slice(i).match(/^\$(?:[A-Za-z_]\w*)?\$/)?.[0];
      if(tag) { const end=raw.indexOf(tag,i+tag.length); if(end<0) unclosed(); i=end+tag.length; add('literal',start); continue; }
    }
    if(c==="'" || c==='"' || c==='`' || (c==='[' && dialect==='sql')) {
      const quote=c==='[' ? ']' : c;
      const escape=dialect==='mysql' || (c==="'" && /(?:^|\W)E$/i.test(raw.slice(Math.max(0,i-2),i)));
      i++; let closed=false;
      while(i<raw.length) {
        if(raw[i]==='\\' && escape) {i+=Math.min(2,raw.length-i);continue;}
        if(raw[i]===quote) {
          if(raw[i+1]===quote) {i+=2;continue;}
          i++; closed=true; break;
        }
        i++;
      }
      if(!closed) unclosed(); add('literal',start); continue;
    }
    word.lastIndex=i; const w=word.exec(raw);
    if(w) {i=word.lastIndex;add('word',start);continue;}
    number.lastIndex=i; const n=number.exec(raw);
    if(n) {i=number.lastIndex;add('number',start);continue;}
    const op=['->>','#>>','->','#>','::','>=','<=','<>','!=','||','&&',':=','=>','@>','<@'].find(op=>raw.startsWith(op,i));
    i+=op ? op.length : 1; add('symbol',start);
  }
  return tokens;
}

function sqlMinify(raw, dialect='sql') {
  let out='', lineComment=false;
  const tokens=sqlTokens(raw,dialect);
  for(let i=0;i<tokens.length;i++) {
    const token=tokens[i];
    if(token.type==='space') {
      const literalNewline=/[\r\n]/.test(token.text) && tokens[i-1]?.type==='literal' && tokens[i+1]?.type==='literal';
      out+=lineComment || literalNewline ? '\n' : ' '; lineComment=false;
    }
    else {out+=token.text;lineComment=token.type==='line-comment';}
  }
  return out.trim();
}

function sqlPretty(raw, {dialect='sql', keywordCase='upper', indent=2}={}) {
  let gap=false;
  const tokens=sqlTokens(raw,dialect).flatMap(token=>{
    if(token.type==='space') {gap=token.text;return [];}
    const item={...token,gap};gap=false;return [item];
  });
  let out='', depth=0, lineStart=true, continuation=false; const stack=[];
  const padding=level=>' '.repeat(Math.min(level,50)*indent);
  const newline=()=>{out=out.replace(/[ \t]+$/,'');if(out && !out.endsWith('\n'))out+='\n';lineStart=true;};
  const write=(text,space=false,level=depth+(continuation?1:0))=>{if(lineStart){out+=padding(level);lineStart=false;}else if(space && !/[\s]$/.test(out))out+=' ';out+=text;};
  const casing=text=>keywordCase==='keep'?text:keywordCase==='lower'?text.toLowerCase():text.toUpperCase();
  for(let i=0;i<tokens.length;i++) {
    const token=tokens[i], text=token.text;
    if(token.type==='line-comment') {write(text,token.gap);newline();continue;}
    if(token.type==='comment' || token.type==='literal') {
      if(token.type==='literal' && tokens[i-1]?.type==='literal' && /[\r\n]/.test(token.gap))newline();
      write(text,token.gap);continue;
    }
    if(text==='(') {
      const subquery=/^(SELECT|WITH)$/i.test(tokens[i+1]?.text || '');
      write(text,token.gap);stack.push(subquery);if(subquery){depth++;continuation=false;newline();}continue;
    }
    if(text===')') {if(stack.pop()){depth=Math.max(0,depth-1);continuation=false;newline();}write(text);continue;}
    if(text===',') {write(',');if(!stack.length || stack[stack.length-1]){continuation=true;newline();}else write(' ');continue;}
    if(text===';') {write(';');continuation=false;newline();continue;}
    if(token.type==='word') {
      let phrase=text.toUpperCase(), original=text;
      for(const length of [3,2]) {
        const next=tokens.slice(i,i+length);
        if(next.length===length && next.every(t=>t.type==='word')) {
          const candidate=next.map(t=>t.text.toUpperCase()).join(' ');
          if(SQL_BREAKS.has(candidate)) {phrase=candidate;original=next.map(t=>t.text).join(' ');i+=length-1;break;}
        }
      }
      const major=SQL_BREAKS.has(phrase) && (!stack.length || stack[stack.length-1]);
      if(major) {continuation=false;newline();}
      write(SQL_KW.has(phrase) || SQL_BREAKS.has(phrase) ? casing(original) : text,token.gap,depth+(/^(AND|OR|ON)$/.test(phrase) || continuation?1:0));
    } else write(text,token.gap);
  }
  return out.trim();
}

window.KCompute = window.KCompute || {};
window.KCompute.sql = Object.freeze({tokens:sqlTokens, minify:sqlMinify, pretty:sqlPretty});
})();
