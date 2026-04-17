import { mock } from '@t/mock';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';

export const translatorMock = mock<ITranslator>();
translatorMock.t.mockImplementation((message, args) => {
  const parts = [message];
  if (args) parts.push(...Object.values(args).map((v) => String(v)));
  return parts.join(',');
});
