import type { RemoveSrcFileMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class RemoveSrcFile extends BaseProblemUseCase<RemoveSrcFileMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: RemoveSrcFileMsg,
  ): Promise<void> {
    if (msg.fileType === 'checker') problem.checker = null;
    else if (msg.fileType === 'interactor') problem.interactor = null;
    else if (msg.fileType === 'generator' && problem.stressTest)
      problem.stressTest.generator = null;
    else if (msg.fileType === 'bruteForce' && problem.stressTest)
      problem.stressTest.bruteForce = null;
  }
}
