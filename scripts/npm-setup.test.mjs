import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureProjectNpm } from './npm-setup.mjs';
import { npmCli, versions } from './tooling.mjs';

function fixture() {
  const directory = mkdtempSync(path.join(tmpdir(), 'cryptolab npm setup '));
  const bootstrapCli = path.join(directory, 'host npm.cjs');
  const calls = path.join(directory, 'bootstrap-calls.json');
  const cli = (version) => `console.log(${JSON.stringify(version)})`;
  const installer = (version) => `
    const fs = require('node:fs'), path = require('node:path');
    const args = process.argv.slice(2);
    if (args[0] === '--version') { console.log('11.20.0'); process.exit(0); }
    fs.writeFileSync(${JSON.stringify(calls)}, JSON.stringify(args));
    const prefix = args[args.indexOf('--prefix') + 1];
    const bin = path.join(prefix, 'node_modules', 'npm', 'bin');
    fs.mkdirSync(bin, {recursive:true});
    fs.writeFileSync(path.join(bin, 'npm-cli.js'), ${JSON.stringify(cli(version))});
  `;
  writeFileSync(bootstrapCli, installer(versions.npm));
  return {
    directory,
    bootstrapCli,
    calls,
    installer,
    cli,
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
}

test('host npm 11.20.0 bootstraps pinned npm locally and setup is repeatable', () => {
  const f = fixture();
  try {
    const before = readFileSync(f.bootstrapCli, 'utf8');
    assert.throws(() => npmCli(f.directory), /Project npm missing/);
    assert.equal(
      spawnSync(process.execPath, [f.bootstrapCli, '--version'], {
        encoding: 'utf8',
      }).stdout.trim(),
      '11.20.0',
    );
    ensureProjectNpm(f);
    const cli = npmCli(f.directory);
    assert.ok(cli.startsWith(path.join(f.directory, '.tools', 'npm')));
    const args = JSON.parse(readFileSync(f.calls));
    for (const flag of [
      '--global=false',
      '--save=false',
      '--package-lock=false',
      '--ignore-scripts',
      '--engine-strict',
      `npm@${versions.npm}`,
    ])
      assert.ok(args.includes(flag));
    assert.equal(readFileSync(f.bootstrapCli, 'utf8'), before);
    ensureProjectNpm({ directory: f.directory, bootstrapCli: 'must-not-be-invoked' });
    assert.deepEqual(readdirSync(path.join(f.directory, '.tools')), ['npm']);
  } finally {
    f.cleanup();
  }
});

test('setup repairs wrong versions and broken project npm installations', () => {
  const f = fixture();
  try {
    const bin = path.join(f.directory, '.tools', 'npm', 'node_modules', 'npm', 'bin');
    mkdirSync(bin, { recursive: true });
    const cli = path.join(bin, 'npm-cli.js');
    for (const source of [f.cli('11.20.0'), 'throw Error("broken installation")']) {
      writeFileSync(cli, source);
      ensureProjectNpm(f);
      assert.equal(
        spawnSync(process.execPath, [npmCli(f.directory), '--version'], {
          encoding: 'utf8',
        }).stdout.trim(),
        versions.npm,
      );
    }
  } finally {
    f.cleanup();
  }
});

test('a bad bootstrap result leaves the old installation intact', () => {
  const f = fixture();
  try {
    ensureProjectNpm(f);
    const old = f.cli('11.20.0');
    writeFileSync(npmCli(f.directory), old);
    writeFileSync(f.bootstrapCli, f.installer('0.0.0'));
    assert.throws(() => ensureProjectNpm(f), /expected .* got 0.0.0/);
    assert.equal(readFileSync(npmCli(f.directory), 'utf8'), old);
    assert.deepEqual(readdirSync(path.join(f.directory, '.tools')), ['npm']);
  } finally {
    f.cleanup();
  }
});
