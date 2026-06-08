import type { SetSettingMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IMsgHandle } from '@/application/useCases/webview/msgHandle';
import * as vscode from 'vscode';

@injectable()
export class SetSetting implements IMsgHandle<SetSettingMsg> {
  public async exec(msg: SetSettingMsg): Promise<void> {
    try {
      await vscode.workspace.getConfiguration('cpbuddy').update(msg.key, msg.value, vscode.ConfigurationTarget.Global);
    } catch (e) {
      console.error('Failed to set setting', e);
    }
  }
}
