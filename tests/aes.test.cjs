const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const nodeCrypto = require('node:crypto');

const PUB = path.resolve(__dirname, '..', 'public');
/** Classic page scripts in one global (window === globalThis) with the Web APIs a browser provides. */
function load(...files) {
  const context = vm.createContext({ console, crypto: nodeCrypto.webcrypto, TextEncoder, TextDecoder, atob, btoa, setTimeout });
  context.window = context;
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(PUB, file), 'utf8'), context, { filename: file });
  return context;
}
const { aes } = load('compute/aes.js').KCompute;
const bytes = hex => Uint8Array.from(Buffer.from(hex, 'hex'));
// 'js' is the cipher Chrome falls back to for 192-bit keys; every known-answer vector runs on both engines.
const ENGINES = ['auto', 'js'];
const rejects = (run, code) => assert.rejects(run, error => error.name === 'AesError' && error.code === code, code);

// NIST SP 800-38A Appendix F: four plaintext blocks under AES-128/192/256 (F.2.1/3/5 CBC, F.5.1/3/5 CTR).
const SP800_38A = {
  plaintext: '6bc1bee22e409f96e93d7e117393172aae2d8a571e03ac9c9eb76fac45af8e5130c81c46a35ce411e5fbc1191a0a52eff69f2445df4f9b17ad2b417be66c3710',
  keys: { 128: '2b7e151628aed2a6abf7158809cf4f3c', 192: '8e73b0f7da0e6452c810f32b809079e562f8ead2522c6b7b', 256: '603deb1015ca71be2b73aef0857d77811f352c073b6108d72d9810a30914dff4' },
  cbcIv: '000102030405060708090a0b0c0d0e0f',
  cbc: {
    128: '7649abac8119b246cee98e9b12e9197d5086cb9b507219ee95db113a917678b273bed6b8e3c1743b7116e69e222295163ff1caa1681fac09120eca307586e1a7',
    192: '4f021db243bc633d7178183a9fa071e8b4d9ada9ad7dedf4e5e738763f69145a571b242012fb7ae07fa9baac3df102e008b0e27988598881d920a9e64f5615cd',
    256: 'f58c4c04d6e5f1ba779eabfb5f7bfbd69cfc4e967edb808d679f777bc6702c7d39f23369a9d9bacfa530e26304231461b2eb05e2c39be9fcda6c19078c6a9d1b',
  },
  ctrIv: 'f0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
  ctr: {
    128: '874d6191b620e3261bef6864990db6ce9806f66b7970fdff8617187bb9fffdff5ae4df3edbd5d35e5b4f09020db03eab1e031dda2fbe03d1792170a0f3009cee',
    192: '1abc932417521ca24f2b0459fe7e6e0b090339ec0aa6faefd5ccc2c6f4ce8e941e36b26bd1ebc670d1bd1d665620abf74f78a7f6d29809585a97daec58c6b050',
    256: '601ec313775789a5b7a7f504bbf3d228f443e3ca4d62b59aca84e990cacaf5c52b0930daa23de94ce87017ba2d84988ddfc9c58db67aada613c2dd08457941a6',
  },
};

// GCM specification test cases (McGrew & Viega, used by NIST CAVP): [key, iv, plaintext, aad, ciphertext, tag].
const K = 'feffe9928665731c6d6a8f9467308308', IV = 'cafebabefacedbaddecaf888';
const P = 'd9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255';
const P60 = P.slice(0, 120), A = 'feedfacedeadbeeffeedfacedeadbeefabaddad2';
const GCM = {
  1: ['0'.repeat(32), '0'.repeat(24), '', '', '', '58e2fccefa7e3061367f1d57a4e7455a'],
  2: ['0'.repeat(32), '0'.repeat(24), '0'.repeat(32), '', '0388dace60b6a392f328c2b971b2fe78', 'ab6e47d42cec13bdf53a67b21257bddf'],
  3: [K, IV, P, '', '42831ec2217774244b7221b784d0d49ce3aa212f2c02a4e035c17e2329aca12e21d514b25466931c7d8f6a5aac84aa051ba30b396a0aac973d58e091473f5985', '4d5c2af327cd64a62cf35abd2ba6fab4'],
  4: [K, IV, P60, A, '42831ec2217774244b7221b784d0d49ce3aa212f2c02a4e035c17e2329aca12e21d514b25466931c7d8f6a5aac84aa051ba30b396a0aac973d58e091', '5bc94fbc3221a5db94fae95ae7121a47'],
  5: [K, 'cafebabefacedbad', P60, A, '61353b4c2806934a777ff51fa22a4755699b2a714fcdc6f83766e5f97b6c742373806900e49f24b22b097544d4896b424989b5e1ebac0f07c23f4598', '3612d2e79e3b0785561be14aaca2fccb'],
  6: [K, '9313225df88406e555909c5aff5269aa6a7a9538534f7da1e4c303d2a318a728c3c0c95156809539fcf0e2429a6b525416aedbf5a0de6a57a637b39b', P60, A, '8ce24998625615b603a033aca13fb894be9112a5c3a211a8ba262a3cca7e2ca701e4a9a4fba43c90ccdcb281d48c7c6fd62875d2aca417034c34aee5', '619cc5aefffe0bfa462af43c1699d050'],
  8: ['0'.repeat(48), '0'.repeat(24), '0'.repeat(32), '', '98e7247c07f0fe411c267e4384b0f600', '2ff58d80033927ab8ef4d4587514f0fb'],
  10: [K + K.slice(0, 16), IV, P60, A, '3980ca0b3c00e841eb06fac4872a2757859e1ceaa6efd984628593b40ca1e19c7d773d00c144c525ac619d18c84a3f4718e2448b2fe324d9ccda2710', '2519498e80f1478f37ba55bd6d27618c'],
  14: ['0'.repeat(64), '0'.repeat(24), '0'.repeat(32), '', 'cea7403d4d606b6e074ec5d3baf39d18', 'd0d1c8a799996bf0265b98b5d48ab919'],
  16: [K + K, IV, P60, A, '522dc1f099567d07f47f37a32a84427d643a8cdcbfe5c0c97598a2bd2555d1aa8cb08e48590dbb3da7b08b1056828838c5f61e6393ba7a0abcc9f662', '76fc6ece0f4e1768cddf8853bb2d551b'],
};

// Produced by OpenSSL 3.0: printf '<text>' | openssl enc -aes-<bits>-<mode> -pbkdf2 -iter <n> -a -A -pass pass:<passphrase>
const OPENSSL = [
  ['U2FsdGVkX1+WCBoMIREYWzH63HuH/INZbY8ocSFbGDM=', 'secret', 256, 100000, 'CBC', 'hello, OpenSSL'],
  ['U2FsdGVkX1/mCdn/K+RY+EalCVSZFjcZyITIv25h', 'k-toolkit', 128, 10000, 'CTR', '中文 CTR ✓'],
  ['U2FsdGVkX18i1yUl7IiV04JilN1fC8GbKTKRUBYFOE9/lc/1PtS3tk4c3BiR0cPX', 'p@ss', 192, 1000, 'CBC', 'AES-192 via OpenSSL'],
];
// The previous page's output (key = SHA-256('legacy-pass'), Base64(IV):Base64(ciphertext), IV 00 11 22 … ff).
const LEGACY = {
  CBC: 'ABEiM0RVZneImaq7zN3u/w==:fjaw2IX2v1So20/47JnT+Opy3qg3o+XE5YaUTQFeJlU=',
  CTR: 'ABEiM0RVZneImaq7zN3u/w==:yMgwZu5sB/K5NHUr9WQ/HLL+HZbLyEg=',
};
// The previous Agent action's output for 'agent-pass': PBKDF2-SHA256 ×100000, AES-256-GCM, Base64(salt ‖ IV ‖ ciphertext ‖ tag).
const OLD_AGENT = '//79/Pv6+fj39vX08/Lx8AECAwQFBgcICQoLDJXDTuM33KJd+mfQaIef78uYGeX5EPDBBeEUTLhqDLDT8x0M';

test('CBC and CTR match NIST SP 800-38A for 128/192/256-bit keys on WebCrypto and the JS fallback', async () => {
  const { plaintext, keys, cbcIv, cbc, ctrIv, ctr } = SP800_38A;
  for (const engine of ENGINES) for (const [bits, key] of Object.entries(keys)) {
    const options = { keyType: 'hex', key, encoding: 'hex', engine };
    const padded = await aes.encrypt(bytes(plaintext), { ...options, mode: 'CBC', iv: cbcIv });
    // PKCS#7 adds one block to block-aligned input; the vector covers the first four, OpenSSL the whole output.
    const reference = nodeCrypto.createCipheriv(`aes-${bits}-cbc`, bytes(key), bytes(cbcIv));
    assert.equal(padded.output.slice(0, 128), cbc[bits], `CBC-AES${bits} ${engine}`);
    assert.equal(padded.output, Buffer.concat([reference.update(bytes(plaintext)), reference.final()]).toString('hex'));
    assert.equal(padded.engine, engine === 'js' ? 'js' : 'webcrypto');
    assert.equal((await aes.decrypt(padded.output, { ...options, mode: 'CBC', iv: cbcIv })).hex, plaintext);
    const counter = await aes.encrypt(bytes(plaintext), { ...options, mode: 'CTR', iv: ctrIv });
    assert.equal(counter.output, ctr[bits], `CTR-AES${bits} ${engine}`);
    assert.equal((await aes.decrypt(counter.output, { ...options, mode: 'CTR', iv: ctrIv })).hex, plaintext);
  }
});

test('GCM matches the specification test cases, including AAD and 64/480-bit IVs, and rejects forged tags', async () => {
  for (const engine of ENGINES) for (const [n, [key, iv, plaintext, aad, ciphertext, tag]] of Object.entries(GCM)) {
    // Node's WebCrypto refuses nonces under 96 bits (Chrome accepts them), so case 5 runs on the JS cipher only.
    if (engine === 'auto' && iv.length < 24) continue;
    const options = { mode: 'GCM', keyType: 'hex', key, iv, aad: bytes(aad), engine };
    const sealed = await aes.encrypt(bytes(plaintext), { ...options, encoding: 'hex' });
    assert.equal(sealed.output, ciphertext + tag, `case ${n} ${engine}`);
    assert.equal(sealed.tag, tag);
    assert.equal((await aes.decrypt(ciphertext + tag, options)).hex, plaintext);
    const forged = ciphertext + tag.slice(0, -2) + (tag.endsWith('00') ? '01' : '00');
    await rejects(aes.decrypt(forged, options), 'DECRYPT_FAILED');
    if (aad) await rejects(aes.decrypt(ciphertext + tag, { ...options, aad: 'other' }), 'DECRYPT_FAILED');
  }
});

test('CTR carries across the whole 128-bit counter block like OpenSSL and Java', async () => {
  const key = '000102030405060708090a0b0c0d0e0f', iv = '0000000000000000ffffffffffffffff', plaintext = bytes('ab'.repeat(48));
  const reference = nodeCrypto.createCipheriv('aes-128-ctr', bytes(key), bytes(iv));
  const expected = Buffer.concat([reference.update(plaintext), reference.final()]).toString('hex');
  for (const engine of ENGINES) {
    assert.equal((await aes.encrypt(plaintext, { mode: 'CTR', keyType: 'hex', key, iv, encoding: 'hex', engine })).output, expected, engine);
  }
});

test('openssl enc -pbkdf2 output decrypts with the mode detected or given, and both directions match its derivation', async () => {
  for (const [data, key, keySize, iterations, mode, text] of OPENSSL) for (const engine of ENGINES) {
    // A passphrase with the default mode recognises "Salted__" and tries CBC, then CTR.
    const detected = await aes.decrypt(data, { key, keySize, iterations, engine });
    assert.deepEqual([detected.text, detected.format, detected.mode, detected.legacy], [text, 'openssl', mode, false]);
    assert.equal((await aes.decrypt(data, { keyType: 'openssl', key, keySize, iterations, mode, engine })).text, text);
  }
  // Reference `openssl enc -pbkdf2`: key ‖ IV = PBKDF2-HMAC-SHA256(passphrase, salt, iter, keyLen + 16).
  const openssl = (direction, bits, mode, salt, data) => {
    const derived = nodeCrypto.pbkdf2Sync('pw', salt, 2000, bits / 8 + 16, 'sha256');
    const cipher = nodeCrypto[direction](`aes-${bits}-${mode}`, derived.subarray(0, bits / 8), derived.subarray(bits / 8));
    return Buffer.concat([cipher.update(data), cipher.final()]);
  };
  for (const [bits, mode] of [[256, 'cbc'], [192, 'ctr'], [128, 'cbc']]) {
    const options = { keyType: 'openssl', key: 'pw', keySize: bits, iterations: 2000, mode };
    const ours = Buffer.from((await aes.encrypt('openssl ✓', options)).output, 'base64');
    assert.equal(ours.subarray(0, 8).toString(), 'Salted__');
    assert.equal(openssl('createDecipheriv', bits, mode, ours.subarray(8, 16), ours.subarray(16)).toString(), 'openssl ✓');
    const salt = nodeCrypto.randomBytes(8);
    const theirs = Buffer.concat([Buffer.from('Salted__'), salt, openssl('createCipheriv', bits, mode, salt, Buffer.from('from openssl'))]);
    assert.equal((await aes.decrypt(theirs.toString('base64'), options)).text, 'from openssl');
  }
});

test('passphrase output is salt ‖ IV ‖ ciphertext ‖ tag under PBKDF2-HMAC-SHA256, as Java/Python code expects', async () => {
  // What a Java (PBKDF2WithHmacSHA256 + AES/GCM/NoPadding) or Python (hashlib + AESGCM) decryptor does.
  const reference = (data, pass, iterations, bits, mode, aad) => {
    const raw = Buffer.from(data, 'base64'), ivBytes = mode === 'gcm' ? 12 : 16;
    const salt = raw.subarray(0, 16), iv = raw.subarray(16, 16 + ivBytes), body = raw.subarray(16 + ivBytes);
    const decipher = nodeCrypto.createDecipheriv(`aes-${bits}-${mode}`, nodeCrypto.pbkdf2Sync(pass, salt, iterations, bits / 8, 'sha256'), iv);
    if (mode !== 'gcm') return Buffer.concat([decipher.update(body), decipher.final()]).toString();
    decipher.setAuthTag(body.subarray(-16));
    if (aad) decipher.setAAD(Buffer.from(aad));
    return Buffer.concat([decipher.update(body.subarray(0, -16)), decipher.final()]).toString();
  };
  const text = 'Java / Python ✓ 中文';
  const sealed = await aes.encrypt(text, { key: 'secret' });
  assert.deepEqual([...sealed.layout.map(part => part.part)], ['salt', 'iv', 'ciphertext', 'tag']);
  assert.deepEqual([sealed.mode, sealed.keySize, sealed.iterations, sealed.encoding], ['GCM', 256, 100000, 'base64']);
  assert.equal(reference(sealed.output, 'secret', 100000, 256, 'gcm'), text);
  for (const [mode, bits, aad] of [['GCM', 128, 'ctx'], ['CBC', 192], ['CTR', 256]]) {
    const options = { key: 'pw', mode, keySize: bits, iterations: 1000, aad };
    const out = await aes.encrypt(text, options);
    assert.equal(reference(out.output, 'pw', 1000, bits, mode.toLowerCase(), aad), text, mode);
    assert.equal((await aes.decrypt(out.output, options)).text, text);
  }
  // A given salt and IV are agreed out of band, so the output is just ciphertext ‖ tag.
  const given = { key: 'pw', salt: '00'.repeat(16), iv: '11'.repeat(12), iterations: 1000 };
  const fixed = await aes.encrypt(text, { ...given, encoding: 'hex' });
  assert.deepEqual([...fixed.layout.map(part => part.part)], ['ciphertext', 'tag']);
  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', nodeCrypto.pbkdf2Sync('pw', Buffer.alloc(16), 1000, 32, 'sha256'), Buffer.alloc(12, 0x11));
  assert.equal(fixed.output, Buffer.concat([cipher.update(text), cipher.final(), cipher.getAuthTag()]).toString('hex'));
  assert.equal((await aes.decrypt(fixed.output, given)).text, text);
  await rejects(aes.decrypt(sealed.output, { key: 'wrong' }), 'DECRYPT_FAILED');
});

test('raw Hex/Base64/UTF-8 keys and UTF-8 IVs behave like Java SecretKeySpec code; binary plaintext returns hex', async () => {
  const text = 'raw key ✓';
  // new SecretKeySpec("1234567890abcdef".getBytes(UTF_8), "AES") + new IvParameterSpec("abcdef1234567890".getBytes(UTF_8))
  const java = nodeCrypto.createCipheriv('aes-128-cbc', Buffer.from('1234567890abcdef'), Buffer.from('abcdef1234567890'));
  const javaOutput = Buffer.concat([java.update(text), java.final()]).toString('base64');
  const utf8 = { mode: 'CBC', keyType: 'utf8', key: '1234567890abcdef', iv: 'abcdef1234567890', ivEncoding: 'utf8' };
  assert.equal((await aes.encrypt(text, utf8)).output, javaOutput);
  assert.equal((await aes.decrypt(javaOutput, utf8)).text, text);
  const key = nodeCrypto.randomBytes(32);
  for (const [keyType, encoded] of [['hex', key.toString('hex')], ['base64', key.toString('base64')], ['base64', key.toString('base64url')]]) {
    const raw = Buffer.from((await aes.encrypt(text, { keyType, key: encoded, aad: 'v1' })).output, 'base64'); // nonce ‖ ciphertext ‖ tag
    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
    decipher.setAAD(Buffer.from('v1'));
    decipher.setAuthTag(raw.subarray(-16));
    assert.equal(Buffer.concat([decipher.update(raw.subarray(12, -16)), decipher.final()]).toString(), text, keyType);
  }
  const binary = await aes.encrypt(Uint8Array.of(0xff, 0xfe, 0x00), { keyType: 'hex', key: key.toString('hex'), encoding: 'hex' });
  const opened = await aes.decrypt(binary.output, { keyType: 'hex', key: key.toString('hex') });
  assert.deepEqual([opened.text, opened.hex], [null, 'fffe00']);
});

test("the previous page's IV:ciphertext output still decrypts and is flagged as legacy", async () => {
  for (const [mode, data] of Object.entries(LEGACY)) {
    for (const options of [{ key: 'legacy-pass' }, { key: 'legacy-pass', mode }]) {
      const opened = await aes.decrypt(data, options);
      assert.deepEqual([opened.text, opened.legacy, opened.format, opened.mode], ['旧版页面 legacy ✓', true, 'legacy', mode]);
    }
  }
  await rejects(aes.decrypt(LEGACY.CBC, { key: 'wrong' }), 'DECRYPT_FAILED');
  await rejects(aes.decrypt(LEGACY.CBC, { key: 'wrong', mode: 'CBC' }), 'DECRYPT_FAILED');
  // An explicitly chosen CTR has no integrity check: a wrong passphrase yields bytes that are not text, not an error.
  const garbled = await aes.decrypt(LEGACY.CTR, { key: 'wrong', mode: 'CTR' });
  assert.deepEqual([garbled.text, garbled.legacy, garbled.hex.length], [null, true, 46]);
  // Raw keys never take the legacy path.
  await rejects(aes.decrypt(LEGACY.CBC, { keyType: 'hex', key: '00'.repeat(16) }), 'BAD_BASE64');
});

test('invalid parameters fail with stable error codes and details', async () => {
  const raw = { keyType: 'hex', key: '00'.repeat(16) };
  const cases = [
    [() => aes.encrypt('x', { keyType: 'hex', key: '00'.repeat(15) }), 'KEY_LENGTH'],
    [() => aes.encrypt('x', { keyType: 'hex', key: 'zz'.repeat(16) }), 'BAD_HEX'],
    [() => aes.encrypt('x', { key: 'pw', mode: 'CBC', iv: '00'.repeat(12) }), 'IV_LENGTH'],
    [() => aes.encrypt('x', { key: 'pw', mode: 'ECB' }), 'MODE'],
    [() => aes.encrypt('x', { key: 'pw', mode: 'CBC', aad: 'a' }), 'AAD_MODE'],
    [() => aes.encrypt('x', { keyType: 'openssl', key: 'pw' }), 'OPENSSL_GCM'],
    [() => aes.encrypt('x', { keyType: 'openssl', key: 'pw', mode: 'CBC', iv: '00'.repeat(16) }), 'IV_OPENSSL'],
    [() => aes.encrypt('x', { keyType: 'openssl', key: 'pw', mode: 'CBC', salt: '00'.repeat(16) }), 'SALT_LENGTH'],
    [() => aes.encrypt('x', { ...raw, salt: '00' }), 'SALT_KEY'],
    [() => aes.encrypt('x', { key: 'pw', iterations: 0 }), 'ITERATIONS'],
    [() => aes.encrypt('x', { key: 'pw', keySize: 512 }), 'KEY_SIZE'],
    [() => aes.encrypt('x', { key: '' }), 'EMPTY_KEY'],
    [() => aes.decrypt('  ', { key: 'pw' }), 'EMPTY_INPUT'],
    [() => aes.decrypt('AAAA', { keyType: 'openssl', key: 'pw', mode: 'CBC' }), 'NOT_OPENSSL'],
    [() => aes.decrypt('AAAA', { key: 'pw' }), 'TOO_SHORT'],
    [() => aes.decrypt('00'.repeat(20), { ...raw, mode: 'CBC', iv: '00'.repeat(16) }), 'BLOCK_LENGTH'],
    [() => aes.decrypt('not base64!', { key: 'pw' }), 'BAD_BASE64'],
  ];
  for (const [run, code] of cases) await rejects(run(), code);
  const error = await aes.encrypt('x', { keyType: 'hex', key: 'abcd' }).catch(e => e);
  assert.deepEqual([error.code, error.bytes], ['KEY_LENGTH', 2]);
  const ivError = await aes.encrypt('x', { ...raw, mode: 'CTR', iv: 'zz' }).catch(e => e);
  assert.deepEqual([ivError.code, ivError.field], ['BAD_HEX', 'IV']);
});

test('Agent aes_encrypt/aes_decrypt use the shared module and stay compatible with the previous action', async () => {
  const context = load('tool-compute.js', 'compute/aes.js', 'agent/actions/convert.js');
  const action = name => context.ConvertActions.find(a => a.name === name);
  assert.deepEqual([...action('aes_encrypt').parameters.required], ['text', 'password']);
  assert.deepEqual([...action('aes_decrypt').parameters.required], ['encrypted', 'password']);
  const old = await action('aes_decrypt').execute({ encrypted: OLD_AGENT, password: 'agent-pass' });
  assert.deepEqual([old.success, old.data.result, old.data.format, old.data.legacy], [true, '旧版 Agent 密文', 'passphrase', false]);
  // New output still opens with the previous action's algorithm, and keys never go back to the model.
  const sealed = await action('aes_encrypt').execute({ text: 'agent ✓', password: 'pw' });
  const raw = Buffer.from(sealed.data.result, 'base64');
  const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', nodeCrypto.pbkdf2Sync('pw', raw.subarray(0, 16), 100000, 32, 'sha256'), raw.subarray(16, 28));
  decipher.setAuthTag(raw.subarray(-16));
  assert.equal(Buffer.concat([decipher.update(raw.subarray(28, -16)), decipher.final()]).toString(), 'agent ✓');
  assert.equal('key' in sealed.data, false);
  assert.equal(raw.subarray(16, 28).toString('hex'), sealed.data.iv);
  // New options: raw key + CBC + hex output, the legacy page format and coded errors.
  const cbc = await action('aes_encrypt').execute({ text: 'x', password: '00'.repeat(16), keyType: 'hex', mode: 'CBC', iv: '11'.repeat(16), encoding: 'hex' });
  const reference = nodeCrypto.createCipheriv('aes-128-cbc', Buffer.alloc(16), Buffer.alloc(16, 0x11));
  assert.equal(cbc.data.result, Buffer.concat([reference.update('x'), reference.final()]).toString('hex'));
  assert.equal((await action('aes_decrypt').execute({ encrypted: cbc.data.result, password: '00'.repeat(16), keyType: 'hex', mode: 'CBC', iv: '11'.repeat(16), encoding: 'auto' })).data.result, 'x');
  assert.equal((await action('aes_decrypt').execute({ encrypted: LEGACY.CBC, password: 'legacy-pass' })).data.legacy, true);
  const failed = await action('aes_decrypt').execute({ encrypted: OLD_AGENT, password: 'wrong' });
  assert.deepEqual([failed.success, failed.data.code], [false, 'DECRYPT_FAILED']);
});
