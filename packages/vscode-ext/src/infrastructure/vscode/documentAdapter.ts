import { injectable } from 'tsyringe';
import { window } from 'vscode';
import type { IDocument } from '@/application/ports/vscode/IDocument';

@injectable()
export class DocumentAdapter implements IDocument {
  private waitUntil = async (check: () => boolean) => {
    return new Promise<void>((resolve, _reject) => {
      if (check()) {
        resolve();
        return;
      }
      const intervalId = setInterval(() => {
        if (check()) {
          clearInterval(intervalId);
          resolve();
        }
      }, 50);
    });
  };

  public async save(path: string): Promise<void> {
    const editor = window.visibleTextEditors.find((editor) => editor.document.fileName === path);
    if (editor) {
      await editor.document.save();
      await this.waitUntil(() => !editor.document.isDirty);
    }
  }
}
