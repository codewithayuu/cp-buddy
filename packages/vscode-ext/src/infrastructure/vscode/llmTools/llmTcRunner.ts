import type { TestcaseId } from '@cpbuddy/core';
import { Verdicts } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type {
  CancellationToken,
  LanguageModelToolInvocationPrepareOptions,
  LanguageModelToolResult,
  PreparedToolInvocation,
} from 'vscode';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IActivePathService } from '@/application/ports/vscode/IActivePathService';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';
import { RunAllTestcases } from '@/application/useCases/webview/problem/testcase/run/RunAllTestcases';
import { RunSingleTestcase } from '@/application/useCases/webview/problem/testcase/run/RunSingleTestcase';
import { StopTestcases } from '@/application/useCases/webview/problem/testcase/run/StopTestcases';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';
import { BaseLlmTool, type BaseLlmToolParams } from './baseLlmTool';

interface LlmTestcaseRunnerParams extends BaseLlmToolParams {
  testcaseId?: TestcaseId;
}

@injectable()
export class LlmTestcaseRunner extends BaseLlmTool<LlmTestcaseRunnerParams> {
  public constructor(
    @inject(TOKENS.problemRepository) repo: IProblemRepository,
    @inject(TOKENS.activePathService) activePathService: IActivePathService,
    @inject(RunAllTestcases) private readonly runAllTestcases: RunAllTestcases,
    @inject(RunSingleTestcase) private readonly runSingleTestcase: RunSingleTestcase,
    @inject(StopTestcases) private readonly stopTestcases: StopTestcases,
    @inject(TOKENS.translator) private readonly translator: ITranslator,
  ) {
    super(repo, activePathService);
  }

  public async prepareInvocation(
    options: LanguageModelToolInvocationPrepareOptions<LlmTestcaseRunnerParams>,
    _token: CancellationToken,
  ): Promise<PreparedToolInvocation> {
    const { testcaseId } = options.input;
    const invocationMessage = testcaseId
      ? this.translator.t('Running test case {testcaseId}...', { testcaseId })
      : this.translator.t('Running all test cases...');
    const title = this.translator.t('Run Test Cases');
    const message = testcaseId
      ? this.translator.t('Do you want to run test case {testcaseId}?', { testcaseId })
      : this.translator.t('Do you want to run all test cases?');
    return { invocationMessage, confirmationMessages: { title, message } };
  }

  public async run(
    input: LlmTestcaseRunnerParams,
    bgProblem: BackgroundProblem,
    token: CancellationToken,
  ): Promise<LanguageModelToolResult> {
    const { testcaseId } = input;
    const problemId = bgProblem.problemId;
    const problem = bgProblem.problem;

    token.onCancellationRequested(() => {
      this.stopTestcases.exec({ type: 'stopTestcases', problemId });
    });

    if (testcaseId !== undefined) {
      await this.runSingleTestcase.exec({
        type: 'runSingleTestcase',
        problemId,
        testcaseId,
        forceCompile: null,
      });
    } else {
      await this.runAllTestcases.exec({
        type: 'runAllTestcases',
        problemId,
        forceCompile: null,
      });
    }

    // Collect results for a summary
    const relevantIds = testcaseId ? [testcaseId] : problem.testcaseOrder;
    const summary = relevantIds.map((testcaseId) => {
      const testcase = problem.getTestcase(testcaseId);
      const verdict = testcase.result?.verdict;
      return {
        testcaseId,
        verdict: verdict ? Verdicts[verdict].name : 'NOT_RUN',
        timeMs: testcase.result?.timeMs,
        memoryMb: testcase.result?.memoryMb,
      };
    });

    return this.createResult({ summary });
  }
}
