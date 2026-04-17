import type { SubmitMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { ICompanion } from '@/application/ports/services/ICompanion';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class Submit extends BaseProblemUseCase<SubmitMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.companion) protected readonly companion: ICompanion,
  ) {
    super(repo);
  }

  protected async performAction({ problem }: BackgroundProblem, _msg: SubmitMsg): Promise<void> {
    await this.companion.submit(problem);
  }
}
