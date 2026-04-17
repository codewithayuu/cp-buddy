import { inject, injectable } from 'tsyringe';
import { AbortReason, type IProcessExecutor } from '@/application/ports/node/IProcessExecutor';
import type { IExecutionStrategy } from '@/application/ports/problems/judge/runner/execution/strategies/IExecutionStrategy';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import { TOKENS } from '@/composition/tokens';
import type { ExecutionContext, ExecutionResult } from '@/domain/execution';

@injectable()
export class NormalStrategy implements IExecutionStrategy {
  public constructor(
    @inject(TOKENS.settings) private readonly settings: ISettings,
    @inject(TOKENS.processExecutor) private readonly executor: IProcessExecutor,
  ) {}

  public async execute(ctx: ExecutionContext, signal: AbortSignal): Promise<ExecutionResult> {
    const res = await this.executor.execute({
      cmd: ctx.cmd,
      timeoutMs: ctx.timeLimitMs + this.settings.run.timeAddition,
      stdinPath: ctx.stdinPath,
      signal,
    });
    if (res instanceof Error) return res;
    return {
      codeOrSignal: res.codeOrSignal,
      stdoutPath: res.stdoutPath,
      stderrPath: res.stderrPath,
      timeMs: res.timeMs,
      isUserAborted: res.abortReason === AbortReason.UserAbort,
    };
  }
}
