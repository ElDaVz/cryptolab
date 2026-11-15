import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { root } from './tooling.mjs';
execFileSync('git', ['diff', '--check'], { cwd: root, stdio: 'inherit' });
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split(
  '\0',
);
const forbidden = /(^|\/)(\.tools|node_modules|target|dist|pkg|test-results|playwright-report)\//;
assert.deepEqual(
  tracked.filter((file) => forbidden.test(file)),
  [],
  'Generated artifacts must remain untracked',
);
console.log('Whitespace and tracked artifact checks passed.');
