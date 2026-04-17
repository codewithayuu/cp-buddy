import type { ChooseSrcFileMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';
import type { IUi } from '@/application/ports/vscode/IUi';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class ChooseSrcFile extends BaseProblemUseCase<ChooseSrcFileMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.ui) private readonly ui: IUi,
    @inject(TOKENS.translator) private readonly translator: ITranslator,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: ChooseSrcFileMsg,
  ): Promise<void> {
    const path = await this.ui.openDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      title: this.translator.t('Select {fileType} File', {
        fileType: {
          checker: this.translator.t('Checker'),
          interactor: this.translator.t('Interactor'),
          generator: this.translator.t('Generator'),
          bruteForce: this.translator.t('Brute Force'),
        }[msg.fileType],
      }),
    });
    if (!path) return;
    if (msg.fileType === 'checker') problem.checker = { path, hash: null };
    else if (msg.fileType === 'interactor') problem.interactor = { path, hash: null };
    else if (msg.fileType === 'generator') problem.stressTest.generator = { path, hash: null };
    else problem.stressTest.bruteForce = { path, hash: null };
  }
}
