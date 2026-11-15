import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { platformConfig, projectEnvironment, execute, npmCli, versions } from './tooling.mjs';

test('supported hosts choose native Rust and release artifact targets', () => {
  for (const [platform, arch, host, artifact] of [
    ['linux', 'x64', 'x86_64-unknown-linux-gnu', 'x86_64-unknown-linux-musl'],
    ['win32', 'x64', 'x86_64-pc-windows-msvc', 'x86_64-pc-windows-msvc'],
  ]) {
    const config = platformConfig(platform, arch);
    assert.equal(config.host, host);
    assert.equal(config.artifact, artifact);
    assert.equal(config.suffix, platform === 'win32' ? '.exe' : '');
  }
  for (const [platform, arch] of [
    ['linux', 'arm64'],
    ['darwin', 'x64'],
    ['darwin', 'arm64'],
  ])
    assert.throws(() => platformConfig(platform, arch), /Unsupported host/);
});

test('Windows environment deduplicates Path and confines tool paths to child', () => {
  const base = { Path: 'C:\\Windows', KEEP: 'yes' };
  const env = projectEnvironment(base, 'C:\\project with spaces', platformConfig('win32', 'x64'));
  assert.equal(
    env.PATH,
    'C:\\project with spaces\\.tools\\npm\\node_modules\\.bin;C:\\project with spaces\\.tools\\bin;C:\\project with spaces\\.tools\\cargo\\bin;C:\\Windows',
  );
  assert.equal(env.Path, undefined);
  assert.equal(env.CARGO_NET_OFFLINE, 'true');
  assert.equal(base.Path, 'C:\\Windows');
  assert.equal(base.PATH, undefined);
});

test('PATH casing follows host rules without changing the caller environment', () => {
  const windows = projectEnvironment(
    { Path: 'native', PATH: 'duplicate' },
    'C:\\demo',
    platformConfig('win32', 'x64'),
  );
  assert.equal(Object.keys(windows).filter((key) => key.toLowerCase() === 'path').length, 1);
  assert.ok(windows.PATH.endsWith(';native'));
  const unix = projectEnvironment(
    { Path: 'unrelated', PATH: '/bin' },
    '/demo',
    platformConfig('linux', 'x64'),
  );
  assert.equal(unix.Path, 'unrelated');
  assert.ok(unix.PATH.endsWith(':/bin'));
});

test('process arguments and working directories preserve spaces and shell metacharacters', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'cryptolab tooling '));
  try {
    const args = ['a b', '$HOME', 'x&y', 'quote"', ''];
    const result = execute(
      'node',
      [
        '-e',
        'console.log(JSON.stringify({args:process.argv.slice(1),cwd:process.cwd()}))',
        ...args,
      ],
      { cwd, stdio: 'pipe', encoding: 'utf8' },
    );
    assert.equal(result.status, 0, result.error?.message);
    assert.deepEqual(JSON.parse(result.stdout), { args, cwd: realpathSync(cwd) });
    assert.match(npmCli(), /npm-cli\.js$/);
    const npm = execute('npm', ['--version'], { stdio: 'pipe', encoding: 'utf8' });
    assert.equal(npm.status, 0, npm.error?.message);
    assert.match(npm.stdout, /^\d+\.\d+\.\d+/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('nested npm scripts use the project version through the child PATH', () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'cryptolab nested npm '));
  try {
    writeFileSync(
      path.join(cwd, 'package.json'),
      JSON.stringify({ scripts: { probe: 'npm --version' } }),
    );
    const result = execute('npm', ['run', 'probe', '--silent'], {
      cwd,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), versions.npm);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
