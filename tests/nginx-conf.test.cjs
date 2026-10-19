const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const conf = fs.readFileSync(path.resolve(__dirname, '..', 'nginx.conf'), 'utf8').replace(/#.*$/gm, '');
const headerNames = text => [...text.matchAll(/^\s*add_header\s+(\S+)/gm)].map(m => m[1].toLowerCase());

test('server security headers reach every location that sets its own headers', () => {
  // nginx drops inherited add_header directives in any block that declares one.
  const locations = [...conf.matchAll(/location\s+([^{]+)\{([^}]*)\}/g)].map(m => ({ name: m[1].trim(), body: m[2] }));
  const security = headerNames(conf.replace(/location\s+[^{]+\{[^}]*\}/g, ''));
  assert.ok(security.includes('x-frame-options') && security.includes('x-content-type-options'));
  for (const { name, body } of locations) {
    const own = headerNames(body);
    if (!own.length) continue;
    for (const header of security) assert.ok(own.includes(header), `location ${name} is missing ${header}`);
  }
});
