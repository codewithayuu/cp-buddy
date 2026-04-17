import { join } from 'node:path';
import { checkTranslations, extractKeys } from '@cpbuddy/core/check-translations';

process.exit(
  checkTranslations({
    title: 'Webview',
    getKeys: () => extractKeys('src'),
    files: [join('src', 'l10n', 'en.json'), join('src', 'l10n', 'zh.json')],
  })
    ? 1
    : 0,
);
