/* ── Semver 2.0.0 解析与比较（预发布标识按规范逐段比较，数字段按数值） ── */

const _svDict = {
  zh: {
    title: 'Semver 版本比较',
    a_ph: '版本 A（如 1.2.3 或 v1.2.3）',
    b_ph: '版本 B（如 2.0.0-beta.11）',
    newer_a: 'A 更新',
    newer_b: 'B 更新',
    equal: '版本相同',
    equal_build: '优先级相同（构建元数据不参与比较）',
    invalid: v => `“${v}” 不是合法的 semver（主.次.补丁，可带 -预发布 与 +构建）`,
    parse_title: '版本解析',
    parse_ph: '输入版本号（如 2.3.1-alpha.2+build.456）',
    major: '主版本', minor: '次版本', patch: '补丁版本', pre: '预发布', build: '构建元数据',
    stable: '正式版',
    prerelease: '预发布版',
    sort_title: '批量排序',
    sort_ph: '每行一个版本号',
    sort_btn: '从低到高排序',
    sort_invalid: n => `${n} 行不是合法版本，已放在末尾`,
  },
  en: {
    title: 'Semver Compare',
    a_ph: 'Version A (e.g. 1.2.3 or v1.2.3)',
    b_ph: 'Version B (e.g. 2.0.0-beta.11)',
    newer_a: 'A is newer',
    newer_b: 'B is newer',
    equal: 'Same version',
    equal_build: 'Same precedence (build metadata is ignored)',
    invalid: v => `"${v}" is not valid semver (MAJOR.MINOR.PATCH with optional -pre and +build)`,
    parse_title: 'Parse Version',
    parse_ph: 'Version (e.g. 2.3.1-alpha.2+build.456)',
    major: 'Major', minor: 'Minor', patch: 'Patch', pre: 'Pre-release', build: 'Build',
    stable: 'Stable release',
    prerelease: 'Pre-release',
    sort_title: 'Sort Versions',
    sort_ph: 'One version per line',
    sort_btn: 'Sort ascending',
    sort_invalid: n => `${n} invalid line(s) moved to the end`,
  },
};

const _SV_RE = /^v?=?\s*(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function _svParse(v) {
  const m = String(v ?? '').trim().match(_SV_RE);
  if (!m) return null;
  return { major: BigInt(m[1]), minor: BigInt(m[2]), patch: BigInt(m[3]), pre: m[4] || '', build: m[5] || '' };
}

/** Semver precedence: -1, 0 or 1; null when either side is invalid. */
function _svCmp(a, b) {
  const pa = typeof a === 'string' ? _svParse(a) : a, pb = typeof b === 'string' ? _svParse(b) : b;
  if (!pa || !pb) return null;
  for (const k of ['major', 'minor', 'patch']) if (pa[k] !== pb[k]) return pa[k] > pb[k] ? 1 : -1;
  if (pa.pre === pb.pre) return 0;
  if (!pa.pre) return 1;
  if (!pb.pre) return -1;
  const x = pa.pre.split('.'), y = pb.pre.split('.');
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined) return -1;
    if (y[i] === undefined) return 1;
    if (x[i] === y[i]) continue;
    const nx = /^\d+$/.test(x[i]), ny = /^\d+$/.test(y[i]);
    if (nx && ny) return BigInt(x[i]) > BigInt(y[i]) ? 1 : -1;
    if (nx !== ny) return nx ? -1 : 1;
    return x[i] > y[i] ? 1 : -1;
  }
  return 0;
}

window.renderSemver = function(el) {
  const T = makeToolI18n(_svDict);
  el.innerHTML = `
    <div class="tool-card-panel">
      <div class="panel-label">${T('title')}</div>
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin-bottom:12px">
        <input class="tool-input" id="svA" placeholder="${T('a_ph')}" oninput="doSemver()">
        <span style="color:var(--text-muted);font-size:18px">vs</span>
        <input class="tool-input" id="svB" placeholder="${T('b_ph')}" oninput="doSemver()">
      </div>
      <div id="svResult" style="min-height:40px"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('parse_title')}</div>
      <input class="tool-input" id="svParse" placeholder="${T('parse_ph')}" oninput="doSvParse()" style="margin-bottom:10px">
      <div id="svParseResult"></div>
    </div>
    <div class="tool-card-panel">
      <div class="panel-label">${T('sort_title')}</div>
      <textarea class="tool-textarea" id="svSortInput" rows="5" placeholder="${T('sort_ph')}"></textarea>
      <div class="tool-actions"><button class="btn btn-primary" onclick="doSvSort()">${T('sort_btn')}</button></div>
      <div id="svSortNote" style="font-size:12px;color:var(--text-muted)"></div>
      <pre class="result-box" id="svSortOutput" style="display:none"></pre>
    </div>`;
};

function doSemver() {
  const T = makeToolI18n(_svDict);
  const a = document.getElementById('svA').value.trim();
  const b = document.getElementById('svB').value.trim();
  const el = document.getElementById('svResult');
  if (!a || !b) { el.innerHTML = ''; return; }
  const pa = _svParse(a), pb = _svParse(b);
  if (!pa || !pb) { el.innerHTML = `<span style="color:#ef4444">${escHtml(T('invalid', pa ? b : a))}</span>`; return; }
  const r = _svCmp(pa, pb);
  const [sym, color, label] = r > 0 ? ['>', '#10b981', T('newer_a')] : r < 0 ? ['<', '#f59e0b', T('newer_b')] : ['=', '#60a5fa', pa.build !== pb.build ? T('equal_build') : T('equal')];
  el.innerHTML = `<div style="text-align:center;padding:12px"><span style="font-size:32px;font-weight:700;color:${color}">${sym}</span> <span style="font-size:14px;color:var(--text-muted)">${label}</span></div>`;
}

function doSvParse() {
  const T = makeToolI18n(_svDict);
  const v = document.getElementById('svParse').value.trim();
  const el = document.getElementById('svParseResult');
  if (!v) { el.innerHTML = ''; return; }
  const p = _svParse(v);
  if (!p) { el.innerHTML = `<span style="color:#ef4444">${escHtml(T('invalid', v))}</span>`; return; }
  const fields = [[T('major'), p.major], [T('minor'), p.minor], [T('patch'), p.patch], [T('pre'), p.pre || '-'], [T('build'), p.build || '-']];
  el.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap">' + fields.map(([k, val]) =>
    `<div style="background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:8px;padding:8px 14px;text-align:center"><div style="font-size:11px;color:var(--text-muted)">${k}</div><div style="font-size:16px;font-weight:600;color:var(--text)">${escHtml(String(val))}</div></div>`).join('') +
    `</div><div style="margin-top:8px;font-size:12px;color:var(--text-muted)">${p.pre ? T('prerelease') : T('stable')}</div>`;
}

function doSvSort() {
  const T = makeToolI18n(_svDict);
  const lines = document.getElementById('svSortInput').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const valid = lines.filter(v => _svParse(v)).sort((a, b) => _svCmp(a, b));
  const invalid = lines.filter(v => !_svParse(v));
  const out = document.getElementById('svSortOutput');
  out.textContent = [...valid, ...invalid].join('\n');
  out.style.display = lines.length ? '' : 'none';
  document.getElementById('svSortNote').textContent = invalid.length ? T('sort_invalid', invalid.length) : '';
}
