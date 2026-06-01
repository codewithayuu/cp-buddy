import { injectable } from 'tsyringe';
import { l10n } from 'vscode';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';

@injectable()
export class TranslatorAdapter implements ITranslator {
  public t(message: string, args?: Record<string, unknown>): string {
    if (args) return l10n.t(message, args);
    return l10n.t(message);
  }
}
