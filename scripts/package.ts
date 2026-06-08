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

run('npx pnpm clean');

run('pnpm --filter vscode-webview run compile');
run('pnpm --filter local-router run compile');
run('pnpm --filter vscode-ext run compile');
copyDirFiles('packages/vscode-webview/dist', 'packages/vscode-ext/dist');
copyDirFiles('packages/local-router/dist', 'packages/vscode-ext/dist');

run('pnpm --filter browser-ext run compile');
run('pnpm --filter vscode-ext run package');
run('pnpm --filter browser-ext run package');
copyDirFiles('packages/vscode-ext', 'dist', '.vsix');
copyDirFiles('packages/browser-ext/dist', 'dist');

// Package sublime-ext
copyDirFiles('packages/local-router/dist', 'packages/sublime-ext/router');
run('cd packages/sublime-ext && zip -r ../../dist/CPBuddy.sublime-package .');

console.log('\n=== Build complete ===');
console.log('Output files:');
for (const file of readdirSync('dist')) console.log(`  dist/${file}`);
