import type { CreateProblemMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IActiveProblemCoordinator } from '@/application/ports/services/IActiveProblemCoordinator';
import type { IActivePathService } from '@/application/ports/vscode/IActivePathService';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class CreateProblem {
  public constructor(
    @inject(TOKENS.problemRepository) private readonly repo: IProblemRepository,
    @inject(TOKENS.activePathService) private readonly activePath: IActivePathService,
    @inject(TOKENS.activeProblemCoordinator)
    private readonly coordinator: IActiveProblemCoordinator,
  ) {}

  public async exec(_msg: CreateProblemMsg): Promise<void> {
    const activePath = this.activePath.getActivePath();
    if (!activePath) throw new Error('Active path is required');
    await this.repo.loadByPath(activePath, true);
    await this.coordinator.onActiveEditorChanged();
    await this.coordinator.dispatchFullData();
  }
}
