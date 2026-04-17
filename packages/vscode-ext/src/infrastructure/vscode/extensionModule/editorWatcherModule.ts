import { inject, injectable } from 'tsyringe';
import { type ExtensionContext, type TextEditor, window } from 'vscode';
import type { IActiveProblemCoordinator } from '@/application/ports/services/IActiveProblemCoordinator';
import type { IActivePathService } from '@/application/ports/vscode/IActivePathService';
import type { IExtensionModule } from '@/application/ports/vscode/IExtensionModule';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class EditorWatcherModule implements IExtensionModule {
  private _editorChangeChain: Promise<void> = Promise.resolve();

  public constructor(
    @inject(TOKENS.activePathService) private readonly activePathService: IActivePathService,
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(TOKENS.activeProblemCoordinator)
    private readonly coordinator: IActiveProblemCoordinator,
  ) {
    this.logger = this.logger.withScope('editorWatcher');
  }

  public async setup(context: ExtensionContext): Promise<void> {
    context.subscriptions.push(
      window.onDidChangeActiveTextEditor((editor) => {
        this._enqueueEditorChange(editor);
      }),
    );

    await this._enqueueEditorChange(window.activeTextEditor);
  }

  private _enqueueEditorChange(editor: TextEditor | undefined): Promise<void> {
    const p = this._editorChangeChain
      .catch(() => {})
      .then(() => this._doHandleEditorChange(editor));
    this._editorChangeChain = p.catch(() => {});
    return p;
  }

  private async _doHandleEditorChange(editor: TextEditor | undefined): Promise<void> {
    if (editor && editor.document.uri.scheme === 'file') {
      this.activePathService.setActivePath(editor.document.uri.fsPath);
      await this.coordinator.onActiveEditorChanged();
      return;
    }

    const currentActivePath = this.activePathService.getActivePath();
    if (currentActivePath) {
      let isOpen = false;
      const { window, TabInputText } = require('vscode');
      for (const group of window.tabGroups.all) {
        for (const tab of group.tabs) {
          if (tab.input instanceof TabInputText && tab.input.uri.fsPath === currentActivePath) {
            isOpen = true;
            break;
          }
        }
        if (isOpen) break;
      }
      if (!isOpen) {
        this.activePathService.setActivePath(null);
        await this.coordinator.onActiveEditorChanged();
        return;
      }
    }

    this.logger.debug('Focusing on non-text editor');
  }
}
