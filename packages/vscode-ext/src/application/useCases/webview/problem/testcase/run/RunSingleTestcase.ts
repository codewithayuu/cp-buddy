import type { RunSingleTestcaseMsg } from '@cpbuddy/core';
import { VerdictName } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { ITempStorage } from '@/application/ports/node/ITempStorage';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { ITestcaseIoService } from '@/application/ports/problems/ITestcaseIoService';
import type { ICompilerService } from '@/application/ports/problems/judge/ICompilerService';
import type { IJudgeObserver } from '@/application/ports/problems/judge/IJudgeObserver';
import type { JudgeContext } from '@/application/ports/problems/judge/IJudgeService';
import type { IJudgeServiceFactory } from '@/application/ports/problems/judge/IJudgeServiceFactory';
import type { FinalResult } from '@/application/ports/problems/judge/IResultEvaluator';
import {
  CompileAborted,
  CompileError,
} from '@/application/ports/problems/judge/langs/ILanguageStrategy';
import type { IDocument } from '@/application/ports/vscode/IDocument';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class RunSingleTestcase extends BaseProblemUseCase<RunSingleTestcaseMsg> {
  public constructor(
    @inject(TOKENS.compilerService) private readonly compiler: ICompilerService,
    @inject(TOKENS.document) private readonly document: IDocument,
    @inject(TOKENS.judgeServiceFactory) private readonly judgeFactory: IJudgeServiceFactory,
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.testcaseIoService) private readonly testcaseIoService: ITestcaseIoService,
    @inject(TOKENS.tempStorage) private readonly tmp: ITempStorage,
  ) {
    super(repo);
  }

  protected async performAction(
    bgProblem: BackgroundProblem,
    msg: RunSingleTestcaseMsg,
  ): Promise<void> {
    if (!bgProblem) throw new Error('Problem not found');
    const { problem } = bgProblem;

    const testcase = problem.getTestcase(msg.testcaseId);
    if (!testcase) throw new Error('Test case not found');

    const ac = new AbortController();
    bgProblem.ac = ac;

    try {
      this.tmp.dispose(testcase.clearResult());
      testcase.updateResult({ verdict: VerdictName.compiling });

      await this.document.save(problem.src.path);
      const artifacts = await this.compiler.compileAll(problem, msg.forceCompile, ac.signal);
      if (artifacts instanceof Error) {
        testcase.updateResult({
          verdict:
            artifacts instanceof CompileError
              ? VerdictName.compilationError
              : artifacts instanceof CompileAborted
                ? VerdictName.rejected
                : VerdictName.systemError,
          msg: artifacts.message,
        });
        return;
      }
      testcase.updateResult({ verdict: VerdictName.compiled });

      const judgeService = this.judgeFactory.create(problem);
      const stdinPathResult = await this.testcaseIoService.ensureFilePath(testcase.stdin);
      const answerPathResult = await this.testcaseIoService.ensureFilePath(testcase.answer);
      const ctx: JudgeContext = {
        problem,
        stdinPath: stdinPathResult.path,
        answerPath: answerPathResult.path,
        artifacts,
      };

      const observer: IJudgeObserver = {
        onStatusChange: (verdict) => {
          testcase.updateResult({ verdict });
        },
        onResult: (res: FinalResult) => {
          testcase.updateResult(res);
        },
        onError: (e) => {
          testcase.updateResult({ verdict: VerdictName.systemError, msg: e.message });
        },
      };

      await judgeService.judge(ctx, observer, ac.signal);

      if (stdinPathResult.needDispose) this.tmp.dispose(stdinPathResult.path);
      if (answerPathResult.needDispose) this.tmp.dispose(answerPathResult.path);
    } finally {
      bgProblem.abort();
    }
  }
}
