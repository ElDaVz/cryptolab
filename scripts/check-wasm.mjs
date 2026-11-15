import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import init, { executeCipher, normalizeAffineKey } from '../crates/crypto-wasm/pkg/crypto_wasm.js';
await init({
  module_or_path: await readFile(
    new URL('../crates/crypto-wasm/pkg/crypto_wasm_bg.wasm', import.meta.url),
  ),
});
const caesar = { algorithm: 'caesar', operation: 'encrypt', message: 'ABCXYZ' };
const affine = { algorithm: 'affine', operation: 'encrypt', message: 'ABC', key: { a: 5, b: 8 } };
assert.equal(executeCipher(caesar).value.cipher.output, 'IJKFGH');
assert.equal(executeCipher(affine).value.cipher.output, 'INS');
for (const value of [
  null,
  [],
  {},
  true,
  { ...caesar, key: {} },
  { ...caesar, message: '\ud800' },
  { ...caesar, message: '\udc00' },
  { ...affine, key: { a: 5 } },
  { ...affine, key: { a: 5, b: 8, c: 0 } },
  ...[1.5, NaN, Infinity, -Infinity, '5', true, null, 2147483648, -2147483649].map((a) => ({
    ...affine,
    key: { a, b: 8 },
  })),
])
  assert.equal(executeCipher(value).error.code, 'InvalidRequest');
assert.deepEqual(executeCipher({ ...caesar, message: 'AB🦀' }), {
  ok: false,
  error: { code: 'InvalidCharacter', character: '🦀', byteIndex: 2 },
});
assert.equal(
  executeCipher({ ...affine, key: { a: 2, b: 3 }, message: '' }).error.code,
  'InvalidAffineKey',
);
assert.deepEqual(normalizeAffineKey({ a: 2, b: null }), {
  ok: true,
  value: { suppliedKey: { a: 2, b: null }, normalizedKey: { a: 2, b: null } },
});
for (const key of [
  { a: 31, b: 34 },
  { a: -21, b: -18 },
  { a: 2147483647, b: -2147483648 },
])
  assert.deepEqual(executeCipher({ ...affine, key }).value.suppliedKey, key);
let valid = 0;
for (let a = 0; a < 26; a++)
  for (let b = 0; b < 26; b++) {
    const input = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      key = { a, b };
    const e = executeCipher({ ...affine, key, message: input });
    if (e.ok) {
      valid++;
      assert.equal(
        executeCipher({ ...affine, key, message: e.value.cipher.output, operation: 'decrypt' })
          .value.cipher.output,
        input,
      );
    }
  }
assert.equal(valid, 312);
assert.equal(
  executeCipher({ ...caesar, message: 'A'.repeat(257) }).value.cipher.output.length,
  257,
);
console.log(
  'Real WASM: strict validation, Unicode, errors, numeric extremes, partial normalization and 312 round trips passed.',
);
