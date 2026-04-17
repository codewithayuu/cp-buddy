import type { DeleteTestcaseMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IProblemService } from '@/application/ports/problems/IProblemService';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class DeleteTestcase extends BaseProblemUseCase<DeleteTestcaseMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.problemService) protected readonly problemService: IProblemService,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: DeleteTestcaseMsg,
  ): Promise<void> {
    problem.deleteTestcase(msg.testcaseId);
  }
}
