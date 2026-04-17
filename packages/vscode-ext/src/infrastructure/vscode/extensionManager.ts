import { inject, injectAll, injectable } from 'tsyringe';
import type { ExtensionContext } from 'vscode';
import type { IExtensionModule } from '@/application/ports/vscode/IExtensionModule';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import type { ITelemetry } from '@/application/ports/vscode/ITelemetry';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class ExtensionManager {
  public constructor(
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(TOKENS.telemetry) private readonly telemetry: ITelemetry,
    @injectAll(TOKENS.extensionModule) private readonly modules: IExtensionModule[],
  ) {
    this.logger = this.logger.withScope('extensionManager');
  }

  public async activate(context: ExtensionContext) {
    const stopTrace = this.telemetry.start('activate');
    this.logger.info('CPBuddy activating...');

    try {
      for (const module of this.modules) await module.setup(context);
      this.logger.info('CPBuddy activated successfully');
    } catch (e) {
      this.logger.error('Activation failed', e);
      this.telemetry.error('activationError', e);
    } finally {
      stopTrace();
    }
  }

  public async deactivate() {
    this.logger.info('Deactivating CPBuddy');
    for (const module of this.modules) await module.dispose?.();
  }
}
