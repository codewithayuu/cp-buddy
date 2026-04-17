import { inject, injectable } from 'tsyringe';
import type { LogOutputChannel } from 'vscode';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class LoggerAdapter implements ILogger {
  private readonly module: string;

  public constructor(
    @inject(TOKENS.logOutputChannel) private readonly logger: LogOutputChannel,
    module?: string,
  ) {
    this.module = module ?? 'base';
  }

  public info(message: string, ...args: unknown[]): void {
    console.info('[INFO]', `[${this.module}]`, message, ...args);
    this.logger.info(`[${this.module}]`, message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn('[WARN]', `[${this.module}]`, message, ...args);
    this.logger.warn(`[${this.module}]`, message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error('[ERROR]', `[${this.module}]`, message, ...args);
    this.logger.error(`[${this.module}]`, message, ...args);
  }

  public debug(message: string, ...args: unknown[]): void {
    console.debug('[DEBUG]', `[${this.module}]`, message, ...args);
    this.logger.debug(`[${this.module}]`, message, ...args);
  }

  public trace(message: string, ...args: unknown[]): void {
    console.debug('[TRACE]', `[${this.module}]`, message, ...args);
    this.logger.trace(`[${this.module}]`, message, ...args);
  }

  public withScope(module: string): ILogger {
    return new LoggerAdapter(this.logger, module);
  }
}
