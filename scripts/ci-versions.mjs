import { appendFileSync } from 'node:fs';
import { checkVersionPins } from './version-check.mjs';
const pins = checkVersionPins();
if (!process.env.GITHUB_OUTPUT)
  throw new Error('GITHUB_OUTPUT is required by this CI metadata step');
appendFileSync(process.env.GITHUB_OUTPUT, `node=${pins.node}\n`);
console.log(`Pinned Node ${pins.node}; npm ${pins.npm} will be installed locally by setup.`);
