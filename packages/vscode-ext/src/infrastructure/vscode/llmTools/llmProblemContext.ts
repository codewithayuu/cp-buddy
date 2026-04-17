import { inject, injectable } from 'tsyringe';
import type {
  CancellationToken,
  LanguageModelToolInvocationPrepareOptions,
  LanguageModelToolResult,
  PreparedToolInvocation,
} from 'vscode';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IProblemService } from '@/application/ports/problems/IProblemService';
import type { IActivePathService } from '@/application/ports/vscode/IActivePathService';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';
import { BaseLlmTool, type BaseLlmToolParams } from './baseLlmTool';

@injectable()
export class LlmProblemContext extends BaseLlmTool<BaseLlmToolParams> {
  public constructor(
    @inject(TOKENS.problemRepository) repo: IProblemRepository,
    @inject(TOKENS.activePathService) activePathService: IActivePathService,
    @inject(TOKENS.translator) private readonly translator: ITranslator,
    @inject(TOKENS.problemService) private readonly problemService: IProblemService,
  ) {
    super(repo, activePathService);
  }

  public async prepareInvocation(
    _options: LanguageModelToolInvocationPrepareOptions<BaseLlmToolParams>,
    _token: CancellationToken,
  ): Promise<PreparedToolInvocation> {
    return {
      invocationMessage: this.translator.t('Fetching CPBuddy problem context...'),
    };
  }

  public async run(
    _input: BaseLlmToolParams,
    bgProblem: BackgroundProblem,
    _token: CancellationToken,
  ): Promise<LanguageModelToolResult> {
    const problem = bgProblem.problem;
    const limits = this.problemService.getLimits(problem);

    const context = {
      metadata: {
        name: problem.name,
        url: problem.url,
        timeLimitMs: limits.timeLimitMs,
        memoryLimitMb: limits.memoryLimitMb,
        srcPath: problem.src.path,
        checker: problem.checker?.path,
        interactor: problem.interactor?.path,
      },
      testcases: problem.testcaseOrder.map((testcaseId) => {
        const testcase = problem.getTestcase(testcaseId);
        return {
          testcaseId,
          verdict: testcase.result?.verdict ?? 'NOT_RUN',
          timeMs: testcase.result?.timeMs,
          memoryMb: testcase.result?.memoryMb,
          isDisabled: testcase.isDisabled,
        };
      }),
    };

    return this.createResult(JSON.stringify(context));
  }
}
