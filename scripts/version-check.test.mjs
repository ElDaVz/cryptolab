import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { root } from './tooling.mjs';
import { checkVersionPins } from './version-check.mjs';

test('repository pins match declarations, lockfiles and installed browser/dependencies', () => {
  checkVersionPins({ installed: true });
});

test('consistency checks reject drift before downloads', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cryptolab version check '));
  try {
    const files = [
      'scripts/versions.json',
      'apps/web/package.json',
      'apps/web/package-lock.json',
      'crates/crypto-wasm/Cargo.toml',
      'Cargo.lock',
    ];
    for (const file of files) {
      mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
      cpSync(path.join(root, file), path.join(directory, file));
    }
    checkVersionPins({ directory });
    for (const [file, before, after] of [
      ['scripts/versions.json', '"npm": "12.2.2"', '"npm": "11.20.0"'],
      ['apps/web/package.json', '"node": "26.13.0"', '"node": "26.0.0"'],
      ['apps/web/package-lock.json', '"three": "0.187.0"', '"three": "0.1.0"'],
      ['crates/crypto-wasm/Cargo.toml', 'wasm-bindgen = "=0.2.105"', 'wasm-bindgen = "=0.2.104"'],
    ]) {
      const target = path.join(directory, file);
      const source = readFileSync(target, 'utf8');
      assert.notEqual(source.replace(before, after), source);
      writeFileSync(target, source.replace(before, after));
      assert.throws(() => checkVersionPins({ directory }));
      writeFileSync(target, source);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
