import type { ExecutionContext, ExecutionResult } from '@/domain/execution';

export interface IExecutionStrategy {
  execute(ctx: ExecutionContext, signal: AbortSignal): Promise<ExecutionResult>;
}
