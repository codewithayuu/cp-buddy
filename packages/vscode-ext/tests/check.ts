import { execSync } from 'node:child_process';
import { platform } from 'node:os';
import { settingsMock } from '@t/infrastructure/vscode/settingsMock';

export const hasCppCompiler = (() => {
  try {
    execSync(`${settingsMock.languages.cppCompiler} --version`, {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
})();

export const isWin = platform() === 'win32';
export const isLinux = platform() === 'linux';
export const isMac = platform() === 'darwin';
