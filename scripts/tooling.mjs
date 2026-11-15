import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const versions = JSON.parse(readFileSync(path.join(root, 'scripts/versions.json')));
export function platformConfig(platform = process.platform, arch = process.arch) {
  const targets = {
    'linux-x64': ['x86_64-unknown-linux-gnu', 'x86_64-unknown-linux-musl'],
    'win32-x64': ['x86_64-pc-windows-msvc', 'x86_64-pc-windows-msvc'],
    'darwin-x64': ['x86_64-apple-darwin', 'x86_64-apple-darwin'],
    'darwin-arm64': ['aarch64-apple-darwin', 'aarch64-apple-darwin'],
  };
  const targetsForHost = targets[`${platform}-${arch}`];
  if (!targetsForHost) throw new Error(`Unsupported host: ${platform}-${arch}`);
  return {
    platform,
    arch,
    host: targetsForHost[0],
    artifact: targetsForHost[1],
    suffix: platform === 'win32' ? '.exe' : '',
  };
}
export const config = platformConfig();
export function projectEnvironment(base = process.env, directory = root, host = config) {
  const paths = host.platform === 'win32' ? path.win32 : path.posix;
  const isPath = (key) =>
    host.platform === 'win32' ? key.toLowerCase() === 'path' : key === 'PATH';
  const inheritedPath = Object.entries(base).find(([key]) => isPath(key))?.[1] ?? '';
  const result = { ...base };
  for (const key of Object.keys(result)) if (isPath(key)) delete result[key];
  return {
    ...result,
    RUSTUP_HOME: paths.join(directory, '.tools', 'rustup'),
    CARGO_HOME: paths.join(directory, '.tools', 'cargo'),
    RUSTUP_TOOLCHAIN: versions.rust,
    PLAYWRIGHT_BROWSERS_PATH: paths.join(directory, '.tools', 'browsers'),
    npm_config_cache: paths.join(directory, '.tools', 'npm-cache'),
    CARGO_NET_OFFLINE: 'true',
    CARGO_TARGET_DIR: paths.join(directory, 'target'),
    WASM_PACK_CACHE: paths.join(directory, '.tools', 'wasm-pack-cache'),
    PATH: [
      paths.join(directory, '.tools', 'bin'),
      paths.join(directory, '.tools', 'cargo', 'bin'),
      inheritedPath,
    ].join(paths.delimiter),
  };
}
export const env = projectEnvironment();
export const toolchain = path.join(
  env.RUSTUP_HOME,
  'toolchains',
  `${versions.rust}-${config.host}`,
);
export function scoped(command) {
  if (['cargo', 'rustc', 'rustup'].includes(command))
    return path.join(env.CARGO_HOME, 'bin', command + config.suffix);
  if (['wasm-pack', 'wasm-bindgen'].includes(command))
    return path.join(root, '.tools', 'bin', command + config.suffix);
  return command;
}
// Invoke npm's JavaScript CLI directly: .cmd files need a shell on Windows,
// which would otherwise reinterpret forwarded arguments and paths with spaces.
export function npmCli(base = process.env, executable = process.execPath) {
  const candidates = [path.join(path.dirname(executable), 'node_modules/npm/bin/npm-cli.js')];
  const searchPath =
    Object.entries(base).find(([key]) =>
      process.platform === 'win32' ? key.toLowerCase() === 'path' : key === 'PATH',
    )?.[1] ?? '';
  for (const directory of searchPath.split(path.delimiter)) {
    const shim = path.join(directory, process.platform === 'win32' ? 'npm.cmd' : 'npm');
    if (existsSync(shim)) {
      candidates.push(path.join(directory, 'node_modules/npm/bin/npm-cli.js'));
      candidates.push(realpathSync(shim));
    }
  }
  const cli = candidates.find(
    (candidate) => candidate.endsWith('npm-cli.js') && existsSync(candidate),
  );
  if (!cli)
    throw new Error(
      'npm CLI missing. Install the pinned Node/npm prerequisites described in README.md.',
    );
  return cli;
}
export function execute(command, args = [], options = {}) {
  const invocation =
    command === 'npm'
      ? [process.execPath, [npmCli(), ...args]]
      : [command === 'node' ? process.execPath : scoped(command), args];
  return spawnSync(...invocation, { cwd: root, env, stdio: 'inherit', ...options });
}
export function run(command, args = [], options = {}) {
  const result = execute(command, args, options);
  if (result.error || result.status !== 0)
    throw new Error(
      `${command} failed (${result.error?.message ?? result.status}). Check host prerequisites in README.md.`,
    );
}
export function output(command, args = []) {
  const result = execute(command, args, { stdio: 'pipe', encoding: 'utf8' });
  if (result.error || result.status !== 0)
    throw new Error(`${command}: ${result.stderr || result.error}`);
  return result.stdout.trim();
}
