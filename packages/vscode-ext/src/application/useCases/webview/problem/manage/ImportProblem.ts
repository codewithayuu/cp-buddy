import type { ImportProblemMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { ICphMigrationService } from '@/application/ports/problems/ICphMigrationService';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IProblemService } from '@/application/ports/problems/IProblemService';
import type { IActiveProblemCoordinator } from '@/application/ports/services/IActiveProblemCoordinator';
import type { IActivePathService } from '@/application/ports/vscode/IActivePathService';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class ImportProblem {
  public constructor(
    @inject(TOKENS.problemRepository) private readonly repo: IProblemRepository,
    @inject(TOKENS.cphMigrationService) private readonly cphMigration: ICphMigrationService,
    @inject(TOKENS.problemService) private readonly problemService: IProblemService,
    @inject(TOKENS.activePathService) private readonly activePath: IActivePathService,
    @inject(TOKENS.activeProblemCoordinator)
    private readonly coordinator: IActiveProblemCoordinator,
  ) {}

  public async exec(_msg: ImportProblemMsg): Promise<void> {
    const activePath = this.activePath.getActivePath();
    if (!activePath) throw new Error('Active path is required');
    const problem = await this.cphMigration.migrateFromSource(activePath);
    if (!problem) throw new Error('No migratable problem found at the specified path');
    await this.problemService.save(problem);
    await this.repo.loadByPath(activePath);
    await this.coordinator.onActiveEditorChanged();
    await this.coordinator.dispatchFullData();
  }
}
