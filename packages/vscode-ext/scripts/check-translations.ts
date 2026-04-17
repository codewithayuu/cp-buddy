import { checkTranslations, extractKeys, loadJsonFile } from '@cpbuddy/core/check-translations';

const extensionHasError = checkTranslations({
  title: 'Extension Configuration',
  getKeys: () => {
    const keys = new Set<string>();
    const visit = (obj: unknown) => {
      if (typeof obj === 'string' && obj.startsWith('%') && obj.endsWith('%'))
        keys.add(obj.slice(1, -1));
      else if (Array.isArray(obj))
        obj.forEach((item) => {
          visit(item);
        });
      else if (typeof obj === 'object' && obj !== null)
        for (const value of Object.values(obj)) visit(value);
    };
    visit(loadJsonFile('package.json'));
    return keys;
  },
  files: ['package.nls.json', 'package.nls.zh.json'],
});
const runtimeHasError = checkTranslations({
  title: 'Extension Runtime',
  getKeys: () =>
    extractKeys(
      'src',
      ['ts', 'js', 'tsx', 'jsx'],
      ['src/infrastructure/vscode/translatorAdapter.ts'],
    ),
  files: ['l10n/bundle.l10n.zh-cn.json'],
});
process.exit(extensionHasError || runtimeHasError ? 1 : 0);
