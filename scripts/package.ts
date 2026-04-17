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

run('npx pnpm compile');
copyDirFiles('packages/vscode-webview/dist', 'packages/vscode-ext/dist');
copyDirFiles('packages/vscode-router/dist', 'packages/vscode-ext/dist');

run('npx pnpm -r --parallel package');
copyDirFiles('packages/vscode-ext', 'dist', '.vsix');
copyDirFiles('packages/browser-ext/dist', 'dist');

console.log('\n=== Build complete ===');
console.log('Output files:');
for (const file of readdirSync('dist')) console.log(`  dist/${file}`);
