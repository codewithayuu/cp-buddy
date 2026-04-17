import type {
  ExecutionContext,
  ExecutionResult,
  InteractiveExecutionResult,
} from '@/domain/execution';

export interface ISolutionRunner {
  run(ctx: ExecutionContext, signal: AbortSignal): Promise<ExecutionResult>;
  runInteractive(
    ctx: ExecutionContext,
    signal: AbortSignal,
    interactorPath: string,
  ): Promise<InteractiveExecutionResult>;
}
