import { existsSync } from 'node:fs';
import path from 'node:path';
import { root, env, toolchain, scoped, execute } from './tooling.mjs';
if (
  !existsSync(path.join(toolchain, 'lib/rustlib/wasm32-unknown-unknown/lib')) ||
  !existsSync(scoped('wasm-bindgen'))
) {
  console.error('Project WASM tools missing. Run node scripts/dev.mjs setup first.');
  process.exit(1);
}
const r = execute(
  'wasm-pack',
  [
    'build',
    'crates/crypto-wasm',
    '--target',
    'web',
    '--out-dir',
    'pkg',
    '--out-name',
    'crypto_wasm',
    '--mode',
    'no-install',
    '--no-opt',
    process.argv[2] === 'release' ? '--release' : '--dev',
    '--locked',
    '--offline',
  ],
  { cwd: root, env, stdio: 'inherit' },
);
if (r.error) console.error(r.error.message);
process.exit(r.error ? 1 : (r.status ?? 1));
