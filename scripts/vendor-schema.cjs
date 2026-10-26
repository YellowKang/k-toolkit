// Rebuild only when updating the vendored validator, not during ordinary app builds.
// npm install --prefix /tmp/k-toolkit-schema-vendor --no-save --ignore-scripts --no-audit --no-fund ajv@8.20.0 esbuild@0.28.2
// node scripts/vendor-schema.cjs /tmp/k-toolkit-schema-vendor
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

async function main() {
  if (!process.argv[2]) throw new Error('Pass the directory containing the pinned build dependencies');
  const deps = path.resolve(process.argv[2]);
  const load = createRequire(path.join(deps, 'package.json'));
  const esbuild = load('esbuild');
  if (load('ajv/package.json').version !== '8.20.0' || esbuild.version !== '0.28.2') throw new Error('Expected ajv@8.20.0 and esbuild@0.28.2');
  const vendor = path.resolve(__dirname, '../public/vendor');
  const output = path.join(vendor, 'ajv/ajv7.min.js');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await esbuild.build({ stdin: { contents: "globalThis.ajv7 = require('ajv');", resolveDir: deps },
    bundle: true, platform: 'browser', format: 'iife', target: 'es2020', minify: true, legalComments: 'inline', outfile: output });
  fs.writeFileSync(path.join(vendor, 'ajv/LICENSE'), fs.readFileSync(path.join(path.dirname(load.resolve('ajv/package.json')), 'LICENSE'), 'utf8').trimEnd() + '\n');
  const dependencies = ['fast-deep-equal', 'fast-uri', 'json-schema-traverse', 'require-from-string'];
  const licenses = dependencies.map(name => {
    const dir = path.dirname(load.resolve(name + '/package.json'));
    const file = ['LICENSE', 'LICENSE.md', 'license'].find(candidate => fs.existsSync(path.join(dir, candidate)));
    return name + '@' + load(name + '/package.json').version + '\n' + fs.readFileSync(path.join(dir, file), 'utf8');
  });
  fs.writeFileSync(path.join(vendor, 'ajv/DEPENDENCY-LICENSES'), licenses.join('\n\n'));
  const manifestFile = path.join(vendor, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.ajv = { version: '8.20.0', license: 'MIT', source: 'npm:ajv@8.20.0 (browser bundle via scripts/vendor-schema.cjs, esbuild@0.28.2)',
    file: 'ajv/ajv7.min.js', global: 'ajv7', sha256: crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex') };
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Vendored Ajv 8.20.0: ' + fs.statSync(output).size + ' bytes');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
