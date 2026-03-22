#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

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

function fmtKB(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

ensureDir(DIST);

// ── Minify CSS ──
const cssFiles = ['dashboard-base.css', 'dashboard-components.css', 'dashboard-theme.css'];
console.log('\nCSS Minification:');
for (const name of cssFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) { console.log(`  SKIP ${name} (not found)`); continue; }
  const original = fs.readFileSync(src, 'utf8');
  const minified = minifyCSS(original);
  const dest = path.join(DIST, name);
  fs.writeFileSync(dest, minified, 'utf8');
  const before = Buffer.byteLength(original, 'utf8');
  const after = Buffer.byteLength(minified, 'utf8');
  const pct = (((before - after) / before) * 100).toFixed(1);
  console.log(`  ${name}: ${fmtKB(before)} → ${fmtKB(after)} (-${pct}%)`);
}

// ── Copy JS files ──
const jsFiles = ['dashboard.js', 'dashboard-cmd.js', 'sw.js'];
console.log('\nCopying JS:');
for (const name of jsFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) continue;
  copyFile(src, path.join(DIST, name));
  console.log(`  ${name}`);
}

// ── Copy HTML ──
const htmlFiles = ['dashboard.html'];
console.log('\nCopying HTML:');
for (const name of htmlFiles) {
  const src = path.join(PUB, name);
  if (!fs.existsSync(src)) continue;
  copyFile(src, path.join(DIST, name));
  console.log(`  ${name}`);
}

// ── Copy tools/ ──
console.log('\nCopying tools/:');
copyDir(path.join(PUB, 'tools'), path.join(DIST, 'tools'));
const toolCount = fs.existsSync(path.join(DIST, 'tools'))
  ? fs.readdirSync(path.join(DIST, 'tools')).length : 0;
console.log(`  ${toolCount} files`);

console.log('\nBuild complete → dist/');
