import type { GetAllSettingsMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IMsgHandle } from '@/application/useCases/webview/msgHandle';
import { TOKENS } from '@/composition/tokens';
import type { IWebviewEventBus } from '@/application/ports/vscode/IWebviewEventBus';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class GetAllSettings implements IMsgHandle<GetAllSettingsMsg> {
  public constructor(
    @inject(TOKENS.webviewEventBus) private readonly eventBus: IWebviewEventBus,
    @inject(TOKENS.extensionPath) private readonly extPath: string,
  ) {}

  public async exec(_msg: GetAllSettingsMsg): Promise<void> {
    try {
      const packageJsonPath = path.join(this.extPath, 'package.json');
      const nlsJsonPath = path.join(this.extPath, 'package.nls.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      let nlsJson: Record<string, string> = {};
      try {
        nlsJson = JSON.parse(fs.readFileSync(nlsJsonPath, 'utf8'));
      } catch (e) {
        // Ignored, maybe missing or unreadable
      }

      const configs = packageJson.contributes.configuration;
      const values: Record<string, any> = {};
      const cpbuddyConfig = vscode.workspace.getConfiguration('cpbuddy');

      const translate = (text?: string) => {
        if (!text) return text;
        if (text.startsWith('%') && text.endsWith('%')) {
          const key = text.slice(1, -1);
          return nlsJson[key] || text;
        }
        return text;
      };

      for (const section of configs) {
        section.title = translate(section.title);
        for (const [key, prop] of Object.entries<any>(section.properties)) {
          const shortKey = key.replace('cpbuddy.', '');
          const val = cpbuddyConfig.get(shortKey);
          values[shortKey] = val !== undefined ? val : prop.default;
          
          if (prop.description) prop.description = translate(prop.description);
          if (prop.markdownDescription) prop.markdownDescription = translate(prop.markdownDescription);
        }
      }

      this.eventBus.allSettings(configs, values);
    } catch (e) {
      console.error('Failed to get settings schema', e);
    }
  }
}
