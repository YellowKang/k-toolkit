const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ctx=vm.createContext({self:{},window:{}});
for(const name of ['../compute/sql.js','../compute/text-diff.js','sql-format.js','text-diff.js','regex-worker.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/tools',name),'utf8'),ctx);
const plain=value=>JSON.parse(JSON.stringify(value));

test('SQL formatting and minifying preserve literal values, identifier quotes and comments',()=>{
  const cases=[
    ['sql',"select 'select  a, from b' as [from], \"a,b\" from tbl -- keep  select\nwhere x = 'it''s  here'; select 2;"],
    ['mysql',"select `select,from`, 'a\\'  b' from t # keep  spaces\nwhere n=1--2;"],
    ['pgsql',"with x as (select $body$select  a,\nfrom b$body$ as x /* nested /* inner */ comment */) select E'it\\'s here' from x where data->>'key' = $1::text;"],
  ];
  for(const [dialect,input] of cases) {
    const significant=s=>plain(ctx.sqlTokens(s,dialect)).filter(t=>t.type!=='space').map(t=>[t.type,t.type==='word'?t.text.toUpperCase():t.text]);
    for(const output of [ctx.sqlPretty(input,{dialect}),ctx.sqlMinify(input,dialect)]) assert.deepEqual(significant(output),significant(input),output);
  }
});

test('SQL line comments keep their terminator and unclosed tokens are rejected',()=>{
  assert.equal(ctx.sqlMinify("select 1 -- comment\n from tbl"),'select 1 -- comment\nfrom tbl');
  for(const input of ["select 'unfinished",'select "unfinished','select /* unfinished']) assert.throws(()=>ctx.sqlPretty(input),/Unclosed/);
  assert.throws(()=>ctx.sqlPretty('select $tag$unfinished',{dialect:'pgsql'}),/Unclosed/);
  assert.match(ctx.sqlPretty('select a from t left join u on t.id=u.id'),/LEFT JOIN/);
  assert.doesNotMatch(ctx.sqlPretty('select a from t left join u on t.id=u.id'),/LEFT\s*\nJOIN/);
  assert.match(ctx.sqlPretty('SELECT 1 FROM t',{keywordCase:'lower'}),/^select/);
  assert.match(ctx.sqlPretty('select a,b from t',{indent:4}),/a,\n {4}b/);
  assert.match(ctx.sqlMinify("select 'a'\n'b'",'pgsql'),/'a'\n'b'/);
  assert.match(ctx.sqlPretty("select 'a'\n'b'",{dialect:'pgsql'}),/'a'\n'b'/);
});

test('Long text insertion remains one exact change instead of cascading line mismatches',()=>{
  const a=Array.from({length:20000},(_,i)=>'line '+i),b=a.slice();b.splice(500,0,'inserted');
  const diff=plain(ctx._computeDiff(a,b));
  assert.deepEqual(diff.filter(([type])=>type!==0),[[1,'inserted']]);
  assert.deepEqual(diff.filter(([type])=>type!==1).map(x=>x[1]),a);
  assert.deepEqual(diff.filter(([type])=>type!==-1).map(x=>x[1]),b);
});

test('Diff scripts reconstruct both inputs and match independent LCS minimal edit distance',()=>{
  let seed=27; const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let iteration=0;iteration<500;iteration++) {
    const a=Array.from({length:Math.floor(random()*12)},()=>String(Math.floor(random()*4)));
    const b=Array.from({length:Math.floor(random()*12)},()=>String(Math.floor(random()*4)));
    const diff=plain(ctx._computeDiff(a,b));
    assert.deepEqual(diff.filter(([t])=>t!==1).map(x=>x[1]),a);
    assert.deepEqual(diff.filter(([t])=>t!==-1).map(x=>x[1]),b);
    const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
    assert.equal(diff.filter(([t])=>t!==0).length,a.length+b.length-2*dp[a.length][b.length]);
  }
});

test('Regex matching supports capture groups, named groups, empty captures and Unicode zero-width matches',()=>{
  const result=plain(ctx.regexEvaluate({pattern:'(?<word>[a-z]+)(\\d*)',text:'a12 b',flags:'g',mode:'match'}));
  assert.deepEqual(result.matches.map(m=>[m.index,m.end,m.groups,m.named]),[[0,3,['a','12'],{word:'a'}],[4,5,['b',''],{word:'b'}]]);
  const zero=plain(ctx.regexEvaluate({pattern:'(?:)',text:'🙂中',flags:'gu',mode:'match'}));
  assert.deepEqual(zero.matches.map(m=>m.index),[0,2,3]);
});

test('Regex replacement templates match native JavaScript semantics without partial output',()=>{
  for(const pattern of ['(?<first>a)(b)?','(a)(b)?','(?:)','z']) for(const flags of ['','g','gu']) {
    for(const replacement of ['x','$&','$$','$1:$2:$3','$01:$10:$20:$00',"$`-$'",'$<first>:$<missing>']) {
      const text='ab a🙂';
      assert.equal(ctx.regexEvaluate({pattern,text,flags,mode:'replace',replacement}).result,text.replace(new RegExp(pattern,flags),replacement),`${pattern}/${flags} ${replacement}`);
    }
  }
  assert.equal(ctx.regexEvaluate({pattern:'.',text:'a'.repeat(2001),flags:'g',mode:'replace'}).error,'match_limit');
  assert.equal(ctx.regexEvaluate({pattern:'.',text:'a'.repeat(200001),flags:'g',mode:'match'}).error,'limit');
  assert.throws(()=>ctx.regexEvaluate({pattern:'^',text:'a'.repeat(100000),flags:'',mode:'replace',replacement:"$'".repeat(25)}),error=>error.code==='output_limit');
});
