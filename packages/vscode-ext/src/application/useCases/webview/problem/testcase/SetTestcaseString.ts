import type { SetTestcaseStringMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';
import { TestcaseIo } from '@/domain/entities/testcaseIo';

@injectable()
export class SetTestcaseString extends BaseProblemUseCase<SetTestcaseStringMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: SetTestcaseStringMsg,
  ): Promise<void> {
    const testcase = problem.getTestcase(msg.testcaseId);
    if (msg.label === 'stdin') testcase.stdin = new TestcaseIo({ data: msg.data });
    if (msg.label === 'answer') testcase.answer = new TestcaseIo({ data: msg.data });
  }
}
