import type { OpenFileMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import { Uri } from 'vscode';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IProblemFs } from '@/application/ports/vscode/IProblemFs';
import type { IUi } from '@/application/ports/vscode/IUi';
import type { IMsgHandle } from '@/application/useCases/webview/msgHandle';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class OpenFile implements IMsgHandle<OpenFileMsg> {
  public constructor(
    @inject(TOKENS.problemFs) private readonly problemFs: IProblemFs,
    @inject(TOKENS.problemRepository) private readonly repo: IProblemRepository,
    @inject(TOKENS.ui) private readonly ui: IUi,
  ) {}

  public async exec(msg: OpenFileMsg): Promise<void> {
    if (!msg.problemId) {
      this.ui.openFile(Uri.file(msg.path));
      return;
    }
    const backgroundProblem = await this.repo.get(msg.problemId);
    if (!backgroundProblem) throw new Error('Problem not found');
    this.ui.openFile(this.problemFs.getUri(backgroundProblem.problem.src.path, msg.path));
  }
}
