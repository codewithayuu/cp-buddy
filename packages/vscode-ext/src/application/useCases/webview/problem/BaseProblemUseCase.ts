import type { ProblemId } from '@cpbuddy/core';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

export abstract class BaseProblemUseCase<T extends { problemId: ProblemId }> {
  public constructor(protected readonly repo: IProblemRepository) {}

  public async exec(msg: T): Promise<void> {
    const backgroundProblem = await this.repo.get(msg.problemId);
    if (!backgroundProblem) throw new Error('Problem not found');
    await this.performAction(backgroundProblem, msg);
  }

  protected abstract performAction(backgroundProblem: BackgroundProblem, msg: T): Promise<void>;
}
