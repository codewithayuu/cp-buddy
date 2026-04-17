import type { DeleteProblemMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IProblemService } from '@/application/ports/problems/IProblemService';
import type { IActiveProblemCoordinator } from '@/application/ports/services/IActiveProblemCoordinator';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

@injectable()
export class DeleteProblem extends BaseProblemUseCase<DeleteProblemMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.problemService) private readonly service: IProblemService,
    @inject(TOKENS.activeProblemCoordinator)
    private readonly coordinator: IActiveProblemCoordinator,
  ) {
    super(repo);
  }

  protected async performAction(
    backgroundProblem: BackgroundProblem,
    _msg: DeleteProblemMsg,
  ): Promise<void> {
    backgroundProblem.abort();
    const { problemId, problem } = backgroundProblem;
    await this.repo.unload(problemId);
    await this.service.delete(problem);
    await this.coordinator.onActiveEditorChanged();
    await this.coordinator.dispatchFullData();
  }
}
