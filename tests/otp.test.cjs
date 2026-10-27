const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const PUB = path.resolve(__dirname, '..', 'public');
function load(...files) {
  const context = vm.createContext({ console, crypto: globalThis.crypto, TextEncoder, TextDecoder, URL, URLSearchParams, atob, btoa });
  context.window = context;
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(PUB, file), 'utf8'), context, { filename: file });
  return context;
}
const plain = value => JSON.parse(JSON.stringify(value));
const { KCompute: { otp, 'secure-box': box } } = load('compute/otp.js', 'compute/secure-box.js');
const ascii = text => otp.base32Encode(new TextEncoder().encode(text));

test('TOTP matches every RFC 6238 Appendix B vector', async () => {
  const secrets = { SHA1: ascii('12345678901234567890'), SHA256: ascii('12345678901234567890123456789012'),
    SHA512: ascii('1234567890123456789012345678901234567890123456789012345678901234') };
  const table = [
    [59, '94287082', '46119246', '90693936'], [1111111109, '07081804', '68084774', '25091201'],
    [1111111111, '14050471', '67062674', '99943326'], [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'], [20000000000, '65353130', '77737706', '47863826'],
  ];
  for (const [seconds, ...codes] of table) {
    for (const [i, algorithm] of ['SHA1', 'SHA256', 'SHA512'].entries()) {
      const entry = otp.normalize({ secret: secrets[algorithm], algorithm, digits: 8, period: 30 });
      assert.equal((await otp.generate(entry, seconds * 1000)).code, codes[i], `${algorithm} @ ${seconds}`);
    }
  }
  const entry = otp.normalize({ secret: secrets.SHA1 });
  assert.equal((await otp.generate(entry, 59000)).remaining, 1);
  assert.equal((await otp.generate(entry, 60000)).remaining, 30);
});

test('HOTP matches RFC 4226 Appendix D and verification finds drifted codes', async () => {
  const secret = ascii('12345678901234567890');
  assert.equal(secret, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  const expected = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
  for (let counter = 0; counter < 10; counter++) assert.equal(await otp.hotp({ secret, counter }), expected[counter]);
  const hotp = otp.normalize({ type: 'hotp', secret, counter: 3 });
  assert.equal(await otp.verify('254676', hotp), 2);
  const totp = otp.normalize({ secret, digits: 8 });
  assert.equal(await otp.verify('07081804', totp, { time: 1111111109000 }), 0);
  assert.equal(await otp.verify('07081804', totp, { time: 1111111139000 }), -1);
  assert.equal(await otp.verify('07081804', totp, { time: 1111111199000 }), null);
  assert.equal(await otp.verify('123', totp), null);
});

test('Base32 tolerates formatting and reports bad characters', () => {
  assert.deepEqual([...otp.base32Decode('gezd gnbv-gy3t qojq====')], [...new TextEncoder().encode('1234567890')]);
  assert.equal(otp.base32Encode(otp.base32Decode('JBSWY3DPEHPK3PXP')), 'JBSWY3DPEHPK3PXP');
  assert.throws(() => otp.base32Decode('ABC1'), err => err.code === 'secret-char' && err.detail.position === 4);
  assert.throws(() => otp.base32Decode('  '), err => err.code === 'secret-empty');
  assert.equal(otp.randomSecret().length, 32);
});

test('account grouping folds issuer case, intersects search terms and never searches secrets', () => {
  const entries = [
    { id: '1', issuer: ' Google ', account: 'work@example.com', note: 'primary team', secret: 'PRIVATESECRET' },
    { id: '2', issuer: 'google', account: 'personal@example.com', note: '', secret: 'PRIVATESECRET' },
    { id: '3', issuer: 'OpenAI', account: 'work@example.com', note: 'primary team', secret: 'PRIVATESECRET' },
    { id: '4', issuer: '', account: 'name@gmail.com', note: '', secret: 'PRIVATESECRET' },
  ];
  const before = JSON.stringify(entries), view = otp.groupAccounts(entries);
  assert.equal(view.total, 4); assert.equal(view.matched, 4); assert.equal(view.groups.length, 3);
  assert.equal(view.groups.find(g => g.key === 'issuer:google').entries.length, 2);
  assert.equal(view.groups.at(-1).key, 'unclassified', 'email domain must not invent an issuer');
  assert.equal(otp.groupAccounts(entries, { query: 'PRIMARY google' }).matched, 1);
  assert.equal(otp.groupAccounts(entries, { issuer: 'issuer:openai', query: 'primary work' }).matched, 1);
  assert.equal(otp.groupAccounts(entries, { issuer: 'issuer:google', query: 'OPENAI' }).matched, 0);
  assert.equal(otp.groupAccounts(entries, { query: 'PRIVATESECRET' }).matched, 0);
  assert.equal(JSON.stringify(entries), before, 'grouping must not change or merge imported accounts');
});

test('otpauth links parse and build in the Google key URI format', () => {
  const e = otp.parseUri('otpauth://totp/ACME%20Co:john.doe@email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=60');
  assert.deepEqual([e.issuer, e.account, e.algorithm, e.digits, e.period, e.type], ['ACME Co', 'john.doe@email.com', 'SHA256', 8, 60, 'totp']);
  assert.equal(otp.buildUri(e), 'otpauth://totp/ACME%20Co:john.doe%40email.com?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=ACME%20Co&algorithm=SHA256&digits=8&period=60');
  const round = otp.parseUri(otp.buildUri({ type: 'hotp', issuer: 'X:Y', account: 'a b', secret: 'JBSWY3DPEHPK3PXP', counter: 5 }));
  assert.deepEqual([round.issuer, round.account, round.counter, round.type], ['X:Y', 'a b', 5, 'hotp']);
  assert.equal(otp.parseUri('otpauth://totp/alice?secret=JBSWY3DPEHPK3PXP').issuer, '');
  assert.throws(() => otp.parseUri('otpauth://totp/alice'), err => err.code === 'uri-secret');
  assert.throws(() => otp.parseUri('https://example.com'), err => err.code === 'uri');
  assert.throws(() => otp.parseUri('otpauth://totp/a?secret=JBSWY3DPEHPK3PXP&algorithm=MD5'), err => err.code === 'algorithm');
});

test('Google Authenticator migration links round-trip in batches', () => {
  const list = Array.from({ length: 12 }, (_, i) => ({ issuer: `Svc${i}`, account: `user${i}@x.com`, secret: otp.randomSecret(), digits: i % 2 ? 8 : 6 }));
  list.push({ issuer: 'Slow', account: 'p', secret: 'JBSWY3DPEHPK3PXP', period: 60 });
  list.push({ type: 'hotp', issuer: 'Counter', account: 'c', secret: 'JBSWY3DPEHPK3PXP', counter: 42 });
  const { uris, skipped } = otp.buildMigration(list);
  assert.equal(uris.length, 2);
  assert.deepEqual(plain(skipped.map(s => s.issuer)), ['Slow']);
  const parsed = [...uris].map(uri => otp.parseMigration(uri));
  assert.deepEqual(plain(parsed.map(p => [p.batch.index, p.batch.size])), [[0, 2], [1, 2]]);
  const back = parsed.flatMap(p => p.entries);
  assert.equal(back.length, 13);
  const pick = e => [e.type, e.issuer, e.account, e.secret, e.digits, e.counter];
  assert.deepEqual(plain(back.map(pick)), plain([...list.slice(0, 12), list[13]].map(e => pick(otp.normalize(e)))));
  assert.throws(() => otp.parseMigration('otpauth-migration://offline?data=%%%'), err => err.code === 'migration');
});

test('imports read otpauth lines, Aegis and 2FAS exports and report bad items', () => {
  const lines = 'otpauth://totp/A:a?secret=JBSWY3DPEHPK3PXP\n\nnot a link\notpauth://totp/B:b?secret=1234';
  const fromLines = otp.parseImport(lines);
  assert.deepEqual(plain(fromLines.entries.map(e => e.issuer)), ['A']);
  assert.deepEqual(plain(fromLines.errors.map(e => e.line)), [3, 4]);
  const aegis = { version: 1, header: { slots: null, params: null }, db: { version: 2, entries: [
    { type: 'totp', uuid: 'u1', name: 'alice@example.com', issuer: 'GitHub', note: 'work', info: { secret: 'JBSWY3DPEHPK3PXP', algo: 'SHA1', digits: 6, period: 30 } },
    { type: 'steam', uuid: 'u2', name: 'gamer', issuer: 'Steam', info: { secret: 'JBSWY3DPEHPK3PXP', algo: 'SHA1', digits: 5, period: 30 } },
  ] } };
  const fromAegis = otp.parseImport(JSON.stringify(aegis));
  assert.deepEqual(plain(fromAegis.entries.map(e => [e.issuer, e.account, e.note])), [['GitHub', 'alice@example.com', 'work']]);
  assert.equal(fromAegis.errors.length, 1);
  assert.equal(otp.parseImport(JSON.stringify({ version: 1, header: { slots: [{}] }, db: 'base64' })).errors[0].code, 'aegis-encrypted');
  const twofas = { schemaVersion: 4, services: [{ name: 'Google', secret: 'JBSWY3DPEHPK3PXP', otp: { account: 'bob@gmail.com', issuer: 'Google', digits: 6, period: 30, algorithm: 'SHA1', tokenType: 'TOTP' } }] };
  assert.deepEqual(plain(otp.parseImport(JSON.stringify(twofas)).entries.map(e => [e.issuer, e.account])), [['Google', 'bob@gmail.com']]);
  assert.equal(otp.parseImport('{"x":1}').errors[0].message, 'Unrecognised JSON backup format');
  const { added, duplicates } = otp.merge(fromAegis.entries, [...fromAegis.entries.map(e => ({ ...e, id: 'other' })), ...fromLines.entries]);
  assert.deepEqual([added.length, duplicates.length], [1, 1]);
});

test('secure box rejects wrong passwords and tampering', async () => {
  const { envelope, key, kdf } = await box.create('correct horse', '{"a":1}', { iterations: 1000 });
  assert.ok(box.isEnvelope(envelope));
  assert.equal((await box.unlock(envelope, 'correct horse')).text, '{"a":1}');
  await assert.rejects(box.unlock(envelope, 'wrong'), err => err.code === 'password');
  const again = await box.seal(key, kdf, '{"b":2}');
  assert.notEqual(again.cipher.iv, envelope.cipher.iv);
  assert.equal((await box.unlock(again, 'correct horse')).text, '{"b":2}');
  const bytes = Uint8Array.from(atob(again.data), c => c.charCodeAt(0));
  bytes[0] ^= 1;
  await assert.rejects(box.unlock({ ...again, data: btoa(String.fromCharCode(...bytes)) }, 'correct horse'), err => err.code === 'password');
  await assert.rejects(box.unlock({ ...again, kdf: { ...again.kdf, iterations: 1e12 } }, 'correct horse'), err => err.code === 'format');
  await assert.rejects(box.unlock({ v: 2 }, 'x'), err => err.code === 'format');
  assert.equal(box.ITERATIONS, 600000);
});
