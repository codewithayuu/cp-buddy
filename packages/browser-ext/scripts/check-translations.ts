import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkTranslations, extractKeys } from '@cpbuddy/core/check-translations';

process.exit(
  checkTranslations({
    title: 'Browser Extension',
    getKeys: () => {
      const keys = new Set<string>();

      extractKeys('src').forEach((k) => {
        keys.add(k);
      });
      extractKeys('entrypoints').forEach((k) => {
        keys.add(k);
      });

      const configPath = join(process.cwd(), 'wxt.config.ts');
      const configContent = readFileSync(configPath, 'utf-8');
      const msgRegex = /__MSG_([a-zA-Z0-9_]+)__/g;
      while (true) {
        const match = msgRegex.exec(configContent);
        if (match === null) break;
        keys.add(match[1]);
      }

      return keys;
    },
    files: [
      join('public', '_locales', 'en', 'messages.json'),
      join('public', '_locales', 'zh_CN', 'messages.json'),
    ],
  })
    ? 1
    : 0,
);
