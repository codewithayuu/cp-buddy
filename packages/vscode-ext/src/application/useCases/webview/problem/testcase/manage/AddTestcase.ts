import type { AddTestcaseMsg, TestcaseId } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { ICrypto } from '@/application/ports/node/ICrypto';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';
import { Testcase } from '@/domain/entities/testcase';
import { TestcaseIo } from '@/domain/entities/testcaseIo';

@injectable()
export class AddTestcase extends BaseProblemUseCase<AddTestcaseMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.crypto) private readonly crypto: ICrypto,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    _msg: AddTestcaseMsg,
  ): Promise<void> {
    const testcaseId = this.crypto.randomUUID() as TestcaseId;
    const testcase = new Testcase(new TestcaseIo({ data: '' }), new TestcaseIo({ data: '' }), true);
    problem.addTestcase(testcaseId, testcase);
  }
}
