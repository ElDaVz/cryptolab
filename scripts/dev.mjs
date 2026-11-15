import { existsSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import path from 'node:path';
import { ensureProjectNpm } from './npm-setup.mjs';
import { checkVersionPins } from './version-check.mjs';
import {
  root,
  versions as v,
  env,
  config,
  toolchain,
  scoped,
  run,
  output,
  npmCli,
} from './tooling.mjs';
function checkNode() {
  if (process.version !== v.node)
    throw new Error(`node: expected ${v.node}, got ${process.version} (${process.execPath})`);
}
function checkNpm() {
  const got = output('npm', ['--version']);
  if (got !== v.npm)
    throw new Error(`npm: expected ${v.npm}, got ${got}. Run node scripts/dev.mjs setup.`);
}
function download(url, dest) {
  run('curl', ['--fail', '--location', '--retry', '2', url, '-o', dest]);
}
function readyRust() {
  if (!existsSync(path.join(toolchain, 'bin', `rustc${config.suffix}`)))
    throw new Error(`Isolated Rust ${v.rust} missing; run node scripts/dev.mjs setup`);
}
const [command, ...args] = process.argv.slice(2);
try {
  if (command === 'setup') {
    checkVersionPins();
    checkNode();
    ensureProjectNpm();
    checkNpm();
    mkdirSync(`${root}/.tools/bin`, { recursive: true });
    env.CARGO_NET_OFFLINE = 'false';
    if (!existsSync(scoped('rustup'))) {
      const installer = path.join(root, '.tools', `rustup-init${config.suffix || '.sh'}`);
      download(
        config.platform === 'win32'
          ? `https://static.rust-lang.org/rustup/dist/${config.host}/rustup-init.exe`
          : 'https://sh.rustup.rs',
        installer,
      );
      run(config.platform === 'win32' ? installer : 'sh', [
        ...(config.platform === 'win32' ? [] : [installer]),
        '-y',
        '--no-modify-path',
        '--profile',
        'minimal',
        '--default-toolchain',
        v.rust,
        '--target',
        'wasm32-unknown-unknown',
        '--component',
        'rustfmt,clippy',
      ]);
    }
    run('rustup', [
      'toolchain',
      'install',
      v.rust,
      '--profile',
      'minimal',
      '--component',
      'rustfmt,clippy',
      '--target',
      'wasm32-unknown-unknown',
    ]);
    for (const [name, version, repo] of [
      ['wasm-pack', v.wasmPack, 'wasm-pack'],
      ['wasm-bindgen', v.wasmBindgen, 'wasm-bindgen'],
    ]) {
      if (existsSync(scoped(name)) && output(name, ['--version']) === `${name} ${version}`)
        continue;
      if (name === 'wasm-pack' && config.platform === 'darwin' && config.arch === 'arm64') {
        const installRoot = path.join(root, '.tools', 'wasm-pack-source');
        run('cargo', [
          'install',
          'wasm-pack',
          '--version',
          `=${version}`,
          '--locked',
          '--root',
          installRoot,
          '--force',
        ]);
        cpSync(path.join(installRoot, 'bin', name), scoped(name));
        continue;
      }
      const folder = `${name}-${name === 'wasm-pack' ? 'v' : ''}${version}-${config.artifact}`;
      download(
        `https://github.com/wasm-bindgen/${repo}/releases/download/${name === 'wasm-pack' ? 'v' : ''}${version}/${folder}.tar.gz`,
        `${root}/.tools/${name}.tar.gz`,
      );
      run('tar', ['-xzf', `${root}/.tools/${name}.tar.gz`, '-C', `${root}/.tools`]);
      cpSync(path.join(root, '.tools', folder, name + config.suffix), scoped(name));
    }
    run('cargo', ['fetch', '--locked']);
    run('npm', ['--prefix', 'apps/web', 'ci', '--engine-strict']);
    checkVersionPins({ installed: true });
    run('node', ['apps/web/node_modules/playwright/cli.js', 'install', 'chromium', '--only-shell']);
    run('cargo', ['test', '--workspace', '--locked']);
    writeFileSync(
      `${root}/.tools/probe.rs`,
      '#[unsafe(no_mangle)] pub extern "C" fn probe() -> i32 { 26 }',
    );
    run('rustc', [
      '--target',
      'wasm32-unknown-unknown',
      '--crate-type',
      'cdylib',
      `${root}/.tools/probe.rs`,
      '-o',
      `${root}/.tools/probe.wasm`,
      '-C',
      'panic=abort',
    ]);
    run('npm', ['--prefix', 'apps/web', 'run', 'build']);
    run(process.execPath, ['scripts/browser-doctor.mjs']);
  } else if (command === 'doctor') {
    let failed = false;
    for (const [label, check] of [
      [
        'Version declarations and installed dependencies',
        () => checkVersionPins({ installed: true }),
      ],
      [
        'Node',
        () => {
          checkNode();
          console.log(`${process.version} ${process.execPath}`);
        },
      ],
      [
        'npm',
        () => {
          checkNpm();
          console.log(`${v.npm} ${npmCli()}`);
        },
      ],
      [
        'Rust',
        () => {
          readyRust();
          const got = output(path.join(toolchain, 'bin', `rustc${config.suffix}`), ['--version']);
          console.log(`${got} ${path.join(toolchain, 'bin', `rustc${config.suffix}`)}`);
          if (!got.startsWith(`rustc ${v.rust} `)) throw new Error('version mismatch');
          run('cargo', ['test', '--workspace', '--locked', '--no-run']);
        },
      ],
      [
        'WASM target',
        () => {
          readyRust();
          if (
            !output('rustup', ['target', 'list', '--installed', '--toolchain', v.rust]).includes(
              'wasm32-unknown-unknown',
            )
          )
            throw new Error('missing target');
        },
      ],
      [
        'wasm-pack',
        () => {
          const got = output('wasm-pack', ['--version']);
          console.log(`${got} ${scoped('wasm-pack')}`);
          if (got !== `wasm-pack ${v.wasmPack}`) throw new Error('version mismatch');
        },
      ],
      [
        'wasm-bindgen',
        () => {
          const got = output('wasm-bindgen', ['--version']);
          console.log(`${got} ${scoped('wasm-bindgen')}`);
          if (got !== `wasm-bindgen ${v.wasmBindgen}`) throw new Error('version mismatch');
        },
      ],
      ['Chromium/WebGL', () => run(process.execPath, ['scripts/browser-doctor.mjs'])],
    ]) {
      try {
        check();
        console.log(`OK ${label}`);
      } catch (e) {
        failed = true;
        console.error(`FAIL ${label}: ${e.message}`);
      }
    }
    if (failed) process.exitCode = 1;
  } else if (command === 'cargo') {
    readyRust();
    run('cargo', args);
  } else if (command === 'npm') {
    checkNode();
    checkNpm();
    run('npm', args);
  } else throw new Error('Usage: node scripts/dev.mjs setup | doctor | cargo … | npm …');
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
