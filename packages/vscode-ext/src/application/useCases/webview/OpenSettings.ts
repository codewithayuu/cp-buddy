import type { OpenSettingsMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IUi } from '@/application/ports/vscode/IUi';
import type { IMsgHandle } from '@/application/useCases/webview/msgHandle';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class OpenSettings implements IMsgHandle<OpenSettingsMsg> {
  public constructor(@inject(TOKENS.ui) private readonly ui: IUi) {}

  public async exec(_msg: OpenSettingsMsg): Promise<void> {
    this.ui.openSettings('cpbuddy');
  }
}
