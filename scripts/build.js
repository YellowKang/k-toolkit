#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Parse JS/CSS before reducing whitespace; comments can separate meaningful tokens.
const { transformSync, version: minifierVersion } = require('esbuild');
function minifyJS(src) {
  return transformSync(src, { loader: 'js', target: 'es2022', charset: 'utf8', legalComments: 'inline', minifyWhitespace: true }).code.trim();
}
function minifyCSS(src) {
  return transformSync(src, { loader: 'css', target: ['chrome109', 'firefox115', 'safari16'], charset: 'utf8', legalComments: 'inline', minifyWhitespace: true }).code.trim();
}

function fmtKB(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function minifyAndWrite(src, dest) {
  const original = fs.readFileSync(src, 'utf8');
  const minified = minifyJS(original);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, minified, 'utf8');
  return { before: Buffer.byteLength(original, 'utf8'), after: Buffer.byteLength(minified, 'utf8') };
}

function processDir(srcDir, destDir, ext, processor) {
  if (!fs.existsSync(srcDir)) return 0;
  ensureDir(destDir);
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      count += processDir(s, d, ext, processor);
    } else if (ext && entry.name.endsWith(ext)) {
      processor(s, d);
      count++;
    } else {
      fs.copyFileSync(s, d);
      count++;
    }
  }
  return count;
}

module.exports = { minifyJS, minifyCSS };
// Required by tests: expose the transforms without running a build (CommonJS allows a top-level return).
if (require.main !== module) return;

// ── Clean dist ──
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
ensureDir(DIST);

// ── Version the whole release, including HTML, tools, Agent and build transforms ──
const hashSrc = crypto.createHash('md5');
hashSrc.update(fs.readFileSync(__filename));
hashSrc.update(minifierVersion);
function hashDirectory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) hashDirectory(file);
    else if (entry.isFile()) {
      hashSrc.update(path.relative(PUB, file).split(path.sep).join('/'));
      hashSrc.update('\0');
      hashSrc.update(fs.readFileSync(file));
      hashSrc.update('\0');
    }
  }
}
hashDirectory(PUB);
const BUILD_VERSION = hashSrc.digest('hex').slice(0, 8);
console.log(`\nBuild version: ${BUILD_VERSION}`);

// ── Minify CSS ──
const cssFiles = ['dashboard-base.css', 'dashboard-components.css', 'dashboard-theme.css', 'dashboard-ux.css'];
console.log('\nCSS Minification:');
let totalSavedCSS = 0;
for (const name of cssFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) { console.log(`  SKIP ${name} (not found)`); continue; }
  const original = fs.readFileSync(src, 'utf8');
  const minified = minifyCSS(original);
  const dest = path.join(DIST, name);
  fs.writeFileSync(dest, minified, 'utf8');
  const before = Buffer.byteLength(original, 'utf8');
  const after = Buffer.byteLength(minified, 'utf8');
  totalSavedCSS += before - after;
  const pct = (((before - after) / before) * 100).toFixed(1);
  console.log(`  ${name}: ${fmtKB(before)} → ${fmtKB(after)} (-${pct}%)`);
}

// ── Minify core JS ──
const jsFiles = ['tool-runtime.js', 'tool-privacy.js', 'tool-compute.js', 'app-updates.js', 'image-session.js', 'file-session.js', 'tool-workspace.js', 'request-session.js', 'tool-catalog.js', 'dashboard.js', 'dashboard-cmd.js', 'i18n.js'];
console.log('\nJS Minification:');
let totalSavedJS = 0;
for (const name of jsFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) continue;
  const { before, after } = minifyAndWrite(src, path.join(DIST, name));
  totalSavedJS += before - after;
  const pct = (((before - after) / before) * 100).toFixed(1);
  console.log(`  ${name}: ${fmtKB(before)} → ${fmtKB(after)} (-${pct}%)`);
}

// ── Copy HTML ──
const htmlFiles = ['dashboard.html', 'index.html'];
console.log('\nCopying HTML:');
for (const name of htmlFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) continue;
  let html = fs.readFileSync(src, 'utf8').replace('name="toolkit-version" content="dev"', `name="toolkit-version" content="${BUILD_VERSION}"`);
  html = html.replace(/((?:src|href)="(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:js|css))"/g, `$1?v=${BUILD_VERSION}"`);
  fs.writeFileSync(path.join(DIST, name), html);
  console.log(`  ${name}`);
}

// ── Copy root static files ──
const staticFiles = ['manifest.json', 'favicon.ico', 'favicon.png', 'robots.txt'];
console.log('\nCopying static files:');
for (const name of staticFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) continue;
  copyFile(src, path.join(DIST, name));
  console.log(`  ${name}`);
}

// ── Minify tools/ JS ──
console.log('\nMinifying tools/:');
const toolCount = processDir(path.join(PUB, 'tools'), path.join(DIST, 'tools'), '.js', (s, d) => {
  minifyAndWrite(s, d);
});
console.log(`  ${toolCount} files`);

// ── Minify agent/ and compute/ JS ──
for (const dir of ['agent', 'compute']) {
  console.log(`\nMinifying ${dir}/:`);
  const count = processDir(path.join(PUB, dir), path.join(DIST, dir), '.js', (s, d) => {
    minifyAndWrite(s, d);
  });
  console.log(`  ${count} files`);
}

// Classic scripts share globals, so preserve their dependency order and lexical scope.
// Development keeps individual files; the release fetches one lazy bundle.
const agentLoader = fs.readFileSync(path.join(PUB, 'agent/agent-loader.js'), 'utf8');
const manifest = agentLoader.slice(0, agentLoader.indexOf('const agentScriptPromises'));
const agentFiles = require('node:vm').runInNewContext(manifest + '\nAG_SCRIPT_GROUPS.flat()');
const agentSource = agentFiles.map(file => fs.readFileSync(path.join(PUB, file), 'utf8')).join('\n;\n');
fs.writeFileSync(path.join(DIST, 'agent/agent-bundle.js'), minifyJS(agentSource));
// Exclude superseded modules from the release/offline cache, avoiding duplicate bytes.
for (const file of agentFiles) fs.unlinkSync(path.join(DIST, file));
console.log(`  Agent: ${agentFiles.length} modules → one lazy bundle`);

// ── Copy pinned third-party libraries verbatim (digests are checked by tests) ──
console.log('\nCopying vendor/:');
console.log(`  ${processDir(path.join(PUB, 'vendor'), path.join(DIST, 'vendor'), null, null)} files`);

// ── Publish version metadata and a digest-verified release manifest ──
const precache = [];
function inventory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) inventory(file);
    else precache.push({ path: path.relative(DIST, file).split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
  }
}
inventory(DIST);
let swContent = fs.readFileSync(path.join(PUB, 'sw.js'), 'utf8')
  .replace("self.__SW_VERSION__ || 'dev'", JSON.stringify(BUILD_VERSION))
  .replace('self.__PRECACHE__ || []', JSON.stringify(precache));
fs.writeFileSync(path.join(DIST, 'sw.js'), minifyJS(swContent));
fs.writeFileSync(path.join(DIST, 'version.json'), JSON.stringify({ version: BUILD_VERSION }) + '\n');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// ── Summary ──
const totalSaved = totalSavedCSS + totalSavedJS;
console.log(`\nBuild complete → dist/`);
console.log(`  Core savings: ${fmtKB(totalSaved)} (CSS: ${fmtKB(totalSavedCSS)}, JS: ${fmtKB(totalSavedJS)})`);
console.log(`  SW cache version: ${BUILD_VERSION}`);
