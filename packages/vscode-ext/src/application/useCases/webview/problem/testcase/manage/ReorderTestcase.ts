import type { ReorderTestcaseMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class ReorderTestcase extends BaseProblemUseCase<ReorderTestcaseMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: ReorderTestcaseMsg,
  ): Promise<void> {
    problem.moveTestcase(msg.fromIdx, msg.toIdx);
  }
}
