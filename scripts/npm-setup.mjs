import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { root, versions, projectEnvironment, bootstrapNpmCli, npmCli } from './tooling.mjs';

// Downloading npm is a setup operation, never a side effect of resolving its CLI.
export function ensureProjectNpm({ directory = root, bootstrapCli } = {}) {
  const environment = projectEnvironment(process.env, directory);
  const invoke = (cli, args, stdio = 'pipe') => {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd: directory,
      env: environment,
      stdio,
      encoding: 'utf8',
    });
    if (result.error || result.status !== 0)
      throw new Error(
        `npm setup failed: ${result.error?.message ?? result.stderr ?? result.status}`,
      );
    return result.stdout?.trim();
  };
  try {
    if (invoke(npmCli(directory), ['--version']) === versions.npm) return;
  } catch {
    // Missing, interrupted or broken installations are repaired by explicit setup.
  }
  mkdirSync(path.join(directory, '.tools'), { recursive: true });
  const staging = mkdtempSync(path.join(directory, '.tools', 'npm-install-'));
  try {
    invoke(
      bootstrapCli ?? bootstrapNpmCli(),
      [
        'install',
        '--prefix',
        staging,
        '--global=false',
        '--save=false',
        '--package-lock=false',
        '--ignore-scripts',
        '--bin-links=true',
        '--no-audit',
        '--no-fund',
        '--engine-strict',
        `npm@${versions.npm}`,
      ],
      'inherit',
    );
    const got = invoke(path.join(staging, 'node_modules', 'npm', 'bin', 'npm-cli.js'), [
      '--version',
    ]);
    if (got !== versions.npm) throw new Error(`npm setup: expected ${versions.npm}, got ${got}`);
    // Publish only a verified installation; a failed download leaves the old copy intact.
    rmSync(path.join(directory, '.tools', 'npm'), { recursive: true, force: true });
    renameSync(staging, path.join(directory, '.tools', 'npm'));
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}
