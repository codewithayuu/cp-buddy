import type { StopTestcasesMsg } from '@cpbuddy/core';
import { VerdictName, Verdicts, VerdictType } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class StopTestcases extends BaseProblemUseCase<StopTestcasesMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
  ) {
    super(repo);
  }

  protected async performAction(
    bgProblem: BackgroundProblem,
    msg: StopTestcasesMsg,
  ): Promise<void> {
    if (!bgProblem.ac) {
      const testcaseOrder = bgProblem.problem.getEnabledTestcaseIds();
      for (const testcaseId of testcaseOrder) {
        const testcase = bgProblem.problem.getTestcase(testcaseId);
        if (
          testcase.result?.verdict &&
          Verdicts[testcase.result?.verdict].type === VerdictType.running
        )
          testcase.updateResult({ verdict: VerdictName.rejected });
      }
    } else bgProblem.abort(msg.testcaseId);
  }
}
