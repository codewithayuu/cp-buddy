import { chmodSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');

try {
  const gitDir = join(repoRoot, '.git');
  if (!existsSync(gitDir)) throw new Error('No .git directory found');
  const hooksDir = join(gitDir, 'hooks');
  mkdirSync(hooksDir, { recursive: true });
  for (const type of ['pre-commit', 'commit-msg']) {
    const target = join(hooksDir, type);
    copyFileSync(join(__dirname, type), target);
    chmodSync(target, 0o755);
  }
  console.log('Git hooks installed successfully.');
} catch (error) {
  console.error('Failed to install git hooks:', error);
  process.exit(1);
}
