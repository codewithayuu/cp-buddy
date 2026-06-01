import type { ClearTestcaseStatusMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { ITempStorage } from '@/application/ports/node/ITempStorage';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class ClearTestcaseStatus extends BaseProblemUseCase<ClearTestcaseStatusMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.tempStorage) private readonly tmp: ITempStorage,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: ClearTestcaseStatusMsg,
  ): Promise<void> {
    if (msg.testcaseId) this.tmp.dispose(problem.getTestcase(msg.testcaseId).clearResult());
    else this.tmp.dispose(problem.clearResult());
  }
}
