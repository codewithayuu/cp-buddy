import { execSync } from 'node:child_process';

const isPreRelease = process.env.PRE_RELEASE === 'true';
const flags = ['--no-dependencies', '--allow-star-activation'];
if (isPreRelease) {
  flags.push('--pre-release');
}
execSync(`vsce package ${flags.join(' ')}`, { stdio: 'inherit' });
