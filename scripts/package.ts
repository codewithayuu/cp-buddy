import { execSync } from 'node:child_process';
import { cpSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';

const run = (cmd: string) => {
  execSync(cmd, { stdio: 'inherit' });
};
const copyDirFiles = (src: string, dst: string, ext?: string) => {
  for (const file of readdirSync(src, { withFileTypes: true }))
    if (file.isFile() && (!ext || extname(file.name) === ext))
      cpSync(join(src, file.name), join(dst, file.name));
};

run('pnpm clean');

for (const pkg of ['vscode-webview', 'local-router']) {
  run(`cd packages/${pkg} && pnpm compile`);
  copyDirFiles(`packages/${pkg}/dist`, 'packages/vscode-ext/dist');
}
run('cd packages/vscode-ext && pnpm compile');

run('cd packages/browser-ext && pnpm compile');
run('cd packages/vscode-ext && pnpm package');
run('cd packages/browser-ext && pnpm package');
copyDirFiles('packages/vscode-ext', 'dist', '.vsix');
copyDirFiles('packages/browser-ext/dist', 'dist');

// Package sublime-ext
copyDirFiles('packages/local-router/dist', 'packages/sublime-ext/router');
run('cd packages/sublime-ext && zip -r ../../dist/CPBuddy.sublime-package .');

console.log('\n=== Build complete ===');
console.log('Output files:');
for (const file of readdirSync('dist')) console.log(`  dist/${file}`);
