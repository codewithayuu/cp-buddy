import type { CompareTestcaseMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IProblemFs } from '@/application/ports/vscode/IProblemFs';
import type { IUi } from '@/application/ports/vscode/IUi';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class CompareTestcase extends BaseProblemUseCase<CompareTestcaseMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.problemFs) private readonly problemFs: IProblemFs,
    @inject(TOKENS.ui) private readonly ui: IUi,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: CompareTestcaseMsg,
  ): Promise<void> {
    this.ui.compareFiles(
      this.problemFs.getUri(problem.src.path, `/testcases/${msg.testcaseId}/answer`),
      this.problemFs.getUri(problem.src.path, `/testcases/${msg.testcaseId}/stdout`),
    );
  }
}
