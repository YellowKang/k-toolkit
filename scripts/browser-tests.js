#!/usr/bin/env node
// Runs every browser suite, keeps going after a failure and prints one summary.
//   npm run test:browser                  all suites, one at a time
//   npm run test:browser -- totp xss      only suites whose name contains a filter
//   npm run test:browser -- --jobs 3      run up to 3 suites at once (output is printed per suite)
//   npm run test:browser -- --bail        stop at the first failure
const { spawn } = require('node:child_process');
const path = require('node:path');

const SUITES = [
  ['reliability', 'reliability-browser.cjs'],
  ['optimization', 'optimization-browser.cjs'],
  ['images', 'image-tools.cjs'], ['catalog', 'catalog-browser.cjs'], ['workflows', 'workflow-browser.cjs'],
  ['updates', 'updates-browser.cjs'], ['xss', 'xss-browser.cjs'], ['i18n', 'i18n-browser.cjs'],
  ['totp', 'totp-browser.cjs'], ['totp-state', 'totp-state-browser.cjs'], ['backup', 'backup-browser.cjs'],
  ['ux', 'ux-browser.cjs'], ['performance', 'performance-browser.cjs'], ['quality', 'tool-quality-browser.cjs'],
  ['json-workflow', 'json-workflow-browser.cjs'], ['agent-ux', 'agent-ux-browser.cjs'], ['agent-shared', 'agent-shared-browser.cjs'],
  ['capabilities', 'capabilities-round2-browser.cjs'], ['capabilities-next', 'capabilities-round3-browser.cjs'],
  ['agent-library', 'agent-library-browser.cjs'], ['interaction-state', 'interaction-state-browser.cjs'],
];

function parseArgs(args) {
  const options = { jobs: 1, bail: false, filters: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bail') options.bail = true;
    else if (args[i] === '--jobs' || args[i] === '-j') options.jobs = Number(args[++i]);
    else if (args[i].startsWith('--jobs=')) options.jobs = Number(args[i].slice(7));
    else options.filters.push(args[i]);
  }
  return options;
}

function runSuite([name, file], streamed) {
  return new Promise(resolve => {
    const started = Date.now(), chunks = [];
    if (streamed) console.log(`▶ ${name}`);
    const child = spawn(process.execPath, [path.join(__dirname, '../tests', file)], { stdio: streamed ? 'inherit' : ['ignore', 'pipe', 'pipe'] });
    if (!streamed) for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => chunks.push(chunk));
    child.on('error', error => chunks.push(Buffer.from(String(error.stack || error))));
    child.on('close', (code, signal) => {
      const result = { name, ok: code === 0, seconds: (Date.now() - started) / 1000, detail: signal || `exit ${code}` };
      if (streamed) { if (!result.ok) console.log(`✖ ${name} (${result.detail})`); }
      else {
        console.log(`${result.ok ? '✔' : '✖'} ${name}`);
        // Parallel output is buffered per suite so logs from different suites never interleave.
        if (!result.ok || process.env.VERBOSE) process.stdout.write(Buffer.concat(chunks));
      }
      resolve(result);
    });
  });
}

async function main() {
  const { jobs, bail, filters } = parseArgs(process.argv.slice(2));
  if (!Number.isInteger(jobs) || jobs < 1) { console.error('--jobs needs a positive integer'); return 2; }
  const selected = SUITES.filter(([name]) => !filters.length || filters.some(filter => name.includes(filter)));
  if (!selected.length) { console.error(`No suite matches: ${filters.join(', ')}\nSuites: ${SUITES.map(([name]) => name).join(', ')}`); return 2; }

  const browser = [process.env.TEST_BROWSER || 'chromium', process.env.TEST_BROWSER_CHANNEL].filter(Boolean).join('/');
  console.log(`Browser suites: ${selected.length} on ${browser}${jobs > 1 ? `, ${jobs} at a time` : ''}\n`);
  const queue = [...selected], results = new Map();
  let stopped = false;
  await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    while (queue.length && !stopped) {
      const result = await runSuite(queue.shift(), jobs === 1);
      results.set(result.name, result);
      if (!result.ok && bail) stopped = true;
    }
  }));

  const failed = [...results.values()].filter(result => !result.ok).length, skipped = selected.length - results.size;
  console.log('\nSummary');
  for (const [name] of selected) {
    const result = results.get(name);
    if (!result) { console.log(`  – ${name.padEnd(18)}  skipped`); continue; }
    console.log(`  ${result.ok ? '✔' : '✖'} ${name.padEnd(18)} ${result.seconds.toFixed(1).padStart(6)}s${result.ok ? '' : '  ' + result.detail}`);
  }
  console.log(`\n${results.size - failed} passed, ${failed} failed${skipped ? `, ${skipped} skipped` : ''}`);
  return failed ? 1 : 0;
}

module.exports = { SUITES, parseArgs };
if (require.main === module) main().then(code => process.exit(code));
