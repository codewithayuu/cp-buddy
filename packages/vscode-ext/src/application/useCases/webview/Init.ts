import type { InitMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { IActiveProblemCoordinator } from '@/application/ports/services/IActiveProblemCoordinator';
import type { ISidebarProvider } from '@/application/ports/vscode/ISidebarProvider';
import type { IMsgHandle } from '@/application/useCases/webview/msgHandle';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class Init implements IMsgHandle<InitMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) private readonly repo: IProblemRepository,
    @inject(TOKENS.sidebarProvider)
    private readonly sidebarProvider: ISidebarProvider,
    @inject(TOKENS.activeProblemCoordinator)
    private readonly coordinator: IActiveProblemCoordinator,
  ) {}

  public async exec(_msg: InitMsg): Promise<void> {
    this.repo.fireBackgroundEvent();
    await this.coordinator.dispatchFullData();
    this.sidebarProvider.dispatchFullConfig();
    this.sidebarProvider.flushPendingMessages();
  }
}
