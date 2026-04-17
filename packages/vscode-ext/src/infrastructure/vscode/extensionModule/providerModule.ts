import { inject, injectable } from 'tsyringe';
import { type ExtensionContext, window, workspace } from 'vscode';
import type { IExtensionModule } from '@/application/ports/vscode/IExtensionModule';
import type { IProblemFs } from '@/application/ports/vscode/IProblemFs';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import type { ISidebarProvider } from '@/application/ports/vscode/ISidebarProvider';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class ProviderModule implements IExtensionModule {
  public constructor(
    @inject(TOKENS.settings) private readonly settings: ISettings,
    @inject(TOKENS.sidebarProvider) private readonly sidebarProvider: ISidebarProvider,
    @inject(TOKENS.problemFs) private readonly problemFs: IProblemFs,
  ) {}

  public setup(context: ExtensionContext) {
    context.subscriptions.push(
      window.registerWebviewViewProvider(this.sidebarProvider.viewType, this.sidebarProvider, {
        webviewOptions: { retainContextWhenHidden: this.settings.sidebar.retainWhenHidden },
      }),
      workspace.registerFileSystemProvider(this.problemFs.scheme, this.problemFs, {
        isCaseSensitive: true,
      }),
    );
  }
}
