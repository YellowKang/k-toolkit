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

function minifyCSS(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // strip comments
    .replace(/\s*([{};:,>~+])\s*/g, '$1') // remove spaces around punctuation
    .replace(/\s+/g, ' ')                 // collapse whitespace
    .trim();
}

function minifyJS(src) {
  // Remove block comments, preserve strings
  let out = '';
  let i = 0;
  while (i < src.length) {
    // String literals: skip to end
    if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const q = src[i];
      out += src[i++];
      while (i < src.length) {
        if (src[i] === '\\') { out += src[i] + src[i+1]; i += 2; continue; }
        if (src[i] === q) { out += src[i++]; break; }
        out += src[i++];
      }
      continue;
    }
    // Block comment
    if (src[i] === '/' && src[i+1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i+1] === '/')) i++;
      i += 2;
      continue;
    }
    // Single-line comment
    if (src[i] === '/' && src[i+1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    out += src[i++];
  }
  return out
    .replace(/\n\s*\n/g, '\n')
    .replace(/^\s+/gm, '')
    .trim();
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

// ── Clean dist ──
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true, force: true });
}
ensureDir(DIST);

// ── Generate version hash from source files ──
const hashSrc = crypto.createHash('md5');
const coreFiles = ['dashboard.js', 'dashboard-cmd.js', 'i18n.js', 'dashboard-base.css', 'dashboard-components.css', 'dashboard-theme.css'];
for (const f of coreFiles) {
  const p = path.join(PUB, f);
  if (fs.existsSync(p)) hashSrc.update(fs.readFileSync(p));
}
const BUILD_VERSION = hashSrc.digest('hex').slice(0, 8);
console.log(`\nBuild version: ${BUILD_VERSION}`);

// ── Minify CSS ──
const cssFiles = ['dashboard-base.css', 'dashboard-components.css', 'dashboard-theme.css'];
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
const jsFiles = ['dashboard.js', 'dashboard-cmd.js', 'i18n.js'];
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

// ── Process SW: inject version ──
console.log('\nService Worker:');
const swSrc = path.join(PUB, 'sw.js');
if (fs.existsSync(swSrc)) {
  let swContent = fs.readFileSync(swSrc, 'utf8');
  swContent = swContent.replace(
    "self.__SW_VERSION__ || 'dev'",
    `'${BUILD_VERSION}'`
  );
  const minified = minifyJS(swContent);
  fs.writeFileSync(path.join(DIST, 'sw.js'), minified, 'utf8');
  console.log(`  sw.js (version: ${BUILD_VERSION})`);
}

// ── Copy HTML ──
const htmlFiles = ['dashboard.html', 'index.html'];
console.log('\nCopying HTML:');
for (const name of htmlFiles) {
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

// ── Minify agent/ JS ──
console.log('\nMinifying agent/:');
const agentCount = processDir(path.join(PUB, 'agent'), path.join(DIST, 'agent'), '.js', (s, d) => {
  minifyAndWrite(s, d);
});
console.log(`  ${agentCount} files`);

// ── Summary ──
const totalSaved = totalSavedCSS + totalSavedJS;
console.log(`\nBuild complete → dist/`);
console.log(`  Core savings: ${fmtKB(totalSaved)} (CSS: ${fmtKB(totalSavedCSS)}, JS: ${fmtKB(totalSavedJS)})`);
console.log(`  SW cache version: ${BUILD_VERSION}`);
