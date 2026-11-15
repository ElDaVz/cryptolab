import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './tooling.mjs';

export function checkVersionPins({ directory = root, installed = false } = {}) {
  const read = (file) => readFileSync(path.join(directory, file), 'utf8').replace(/\r\n/g, '\n');
  const json = (file) => JSON.parse(read(file));
  const pins = json('scripts/versions.json');
  const manifest = json('apps/web/package.json');
  const lock = json('apps/web/package-lock.json');
  assert.equal(
    manifest.engines.node,
    pins.node.replace(/^v/, ''),
    'Node engine differs from tool pin',
  );
  assert.equal(manifest.engines.npm, pins.npm, 'npm engine differs from tool pin');
  assert.deepEqual(
    lock.packages[''].engines,
    manifest.engines,
    'Lockfile engines differ from manifest',
  );
  for (const group of ['dependencies', 'devDependencies']) {
    assert.deepEqual(
      lock.packages[''][group],
      manifest[group],
      `${group}: lockfile differs from manifest`,
    );
    for (const [name, version] of Object.entries(manifest[group])) {
      assert.equal(
        lock.packages[`node_modules/${name}`]?.version,
        version,
        `${name}: lockfile version mismatch`,
      );
      if (installed)
        assert.equal(
          json(`apps/web/node_modules/${name}/package.json`).version,
          version,
          `${name}: installed version mismatch`,
        );
    }
  }
  const cargo = read('crates/crypto-wasm/Cargo.toml');
  assert.ok(
    cargo.split('\n').some((line) => line.trim() === `wasm-bindgen = "=${pins.wasmBindgen}"`),
    'wasm-bindgen CLI and Cargo dependency differ',
  );
  const wasmPackage = read('Cargo.lock')
    .split('[[package]]')
    .find((entry) => entry.includes('\nname = "wasm-bindgen"\n'));
  assert.ok(
    wasmPackage?.includes(`\nversion = "${pins.wasmBindgen}"\n`),
    'wasm-bindgen Cargo lock differs from tool pin',
  );
  if (installed) {
    const browsers = json('apps/web/node_modules/playwright-core/browsers.json').browsers;
    for (const name of ['chromium', 'chromium-headless-shell'])
      assert.equal(
        browsers.find((browser) => browser.name === name)?.browserVersion,
        pins.chromium,
        `${name}: Playwright browser manifest differs from tool pin`,
      );
  }
  return pins;
}
