import type { MarkAcceptedMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';
import * as vscode from 'vscode';

@injectable()
export class MarkAccepted extends BaseProblemUseCase<MarkAcceptedMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.settings) private readonly settings: ISettings,
  ) {
    super(repo);
  }

  protected async performAction({ problem }: BackgroundProblem, _msg: MarkAcceptedMsg): Promise<void> {
    if (!this.settings.github.enabled) {
      vscode.window.showInformationMessage('GitHub Auto-Archiver is disabled in CPBuddy settings.');
      return;
    }

    try {
      const gitExtension = vscode.extensions.getExtension<any>('vscode.git');
      if (!gitExtension) {
        throw new Error('VS Code Git extension is not enabled.');
      }

      const git = gitExtension.isActive ? gitExtension.exports : await gitExtension.activate();
      const api = git.getAPI(1);
      
      if (api.repositories.length === 0) {
        throw new Error('No Git repository found in the workspace.');
      }

      // Use the first repo or find the one containing the problem source file
      let repo = api.repositories[0];
      for (const r of api.repositories) {
        if (problem.src.path.startsWith(r.rootUri.fsPath)) {
          repo = r;
          break;
        }
      }

      // Format commit message
      const template = this.settings.github.commitMessageTemplate;
      const platform = new URL(problem.url || 'http://localhost').hostname.replace('www.', '') || 'Unknown';
      const time = new Date().toLocaleTimeString();
      const date = new Date().toLocaleDateString();
      const message = template
        .replace('{platform}', platform)
        .replace('{problemName}', problem.name)
        .replace('{time}', time)
        .replace('{date}', date);

      // Add the file, commit and push
      await repo.add([problem.src.path]);
      await repo.commit(message);
      await repo.push();
      
      vscode.window.showInformationMessage(`Successfully pushed to GitHub: ${message}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to auto-archive to GitHub: ${e.message}`);
    }
  }
}
