import { inject, injectable } from 'tsyringe';
import type {
  ExecutionStrategyType,
  IExecutionStrategyFactory,
} from '@/application/ports/problems/judge/runner/execution/IExecutionStrategyFactory';
import type { IExecutionStrategy } from '@/application/ports/problems/judge/runner/execution/strategies/IExecutionStrategy';
import { ExternalRunnerStrategy } from '@/infrastructure/problems/judge/runner/strategies/externalRunnerStrategy';
import { NormalStrategy } from '@/infrastructure/problems/judge/runner/strategies/normalStrategy';
import { WrapperStrategy } from '@/infrastructure/problems/judge/runner/strategies/wrapperStrategy';

@injectable()
export class ExecutionStrategyFactoryAdapter implements IExecutionStrategyFactory {
  public constructor(
    @inject(ExternalRunnerStrategy) private external: ExternalRunnerStrategy,
    @inject(WrapperStrategy) private wrapper: WrapperStrategy,
    @inject(NormalStrategy) private normal: NormalStrategy,
  ) {}

  public create(type: ExecutionStrategyType): IExecutionStrategy {
    switch (type) {
      case 'external':
        return this.external;
      case 'wrapper':
        return this.wrapper;
      case 'normal':
        return this.normal;
      default:
        throw new Error(`Unknown strategy type: ${type}`);
    }
  }
}
