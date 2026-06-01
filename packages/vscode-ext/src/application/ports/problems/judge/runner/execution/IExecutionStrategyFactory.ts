import type { IExecutionStrategy } from '@/application/ports/problems/judge/runner/execution/strategies/IExecutionStrategy';

export type ExecutionStrategyType = 'normal' | 'wrapper' | 'external';

export interface IExecutionStrategyFactory {
  create(type: ExecutionStrategyType): IExecutionStrategy;
}
