import type { UpdateTestcaseMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class UpdateTestcase extends BaseProblemUseCase<UpdateTestcaseMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: UpdateTestcaseMsg,
  ): Promise<void> {
    const testcase = problem.getTestcase(msg.testcaseId);
    if (msg.event === 'setDisable') testcase.isDisabled = msg.value;
    if (msg.event === 'setExpand') testcase.isExpand = msg.value;
    if (msg.event === 'setAsAnswer' && testcase.result?.stdout)
      testcase.answer = testcase.result?.stdout;
  }
}
